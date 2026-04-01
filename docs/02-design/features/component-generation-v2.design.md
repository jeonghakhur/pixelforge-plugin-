# Design: Component Generation v2 — Radix a11y + 커스텀 CSS 분리

> **Plan 참조**: `docs/01-plan/features/component-generation-improvement.plan.md`
> **이전 설계**: `docs/02-design/features/component-generation-improvement.design.md`
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.4.0
> **Date**: 2026-04-01
> **Status**: Active

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 생성기가 Radix의 `color`, `variant` props로 시각 스타일을 결정 → 사용자 디자인 시스템의 CSS 변수(`var(--blue-bright)` 등)가 완전히 무시됨 |
| **Solution** | Radix는 접근성/동작(키보드, aria, disabled)만 담당하고, Figma HTML/JSX에서 추출한 CSS 변수로 CSS module을 생성 |
| **Function/UX Effect** | 생성된 컴포넌트가 Figma 디자인의 색상·크기를 CSS module로 그대로 반영. 별도 수정 없이 바로 사용 가능 |
| **Core Value** | Radix의 웹접근성 + 자체 디자인 시스템 CSS 변수의 완전한 공존 |

---

## 1. 설계 개요

### 1.1 핵심 원칙

```
Radix UI 역할       → 접근성(aria), 키보드 내비게이션, focus ring, disabled 상태, 폼 통합
CSS module 역할     → 모든 시각 스타일 (색상, 크기, 간격, 테두리)
CSS 변수 출처       → Figma HTML/JSX에서 추출 (var(--blue-bright), var(--red) 등)
```

### 1.2 현재 vs v2 비교

**현재 (v1)**
```tsx
// Radix의 color/variant props가 시각 스타일까지 결정
<Button variant={variant} color={color} size={size} className={styles.root}>
```
```css
/* CSS module은 거의 비어 있음 */
/* Radix Themes handles styling via props */
```

**v2 목표**
```tsx
// Radix는 동작만, 시각 스타일은 className 조합
<Button
  onClick={onClick}
  disabled={disabled}
  className={`${styles.root} ${styles[variant]} ${styles[size]}`}
>
```
```css
/* Figma에서 추출한 실제 CSS 변수 사용 */
.root    { border-radius: 3px; display: inline-flex; align-items: center; cursor: pointer; }
.primary { background-color: var(--blue-bright); }
.danger  { background-color: var(--red); }
.small   { padding: 5px 10px; gap: 6.5px; }
.medium  { padding: 7px 12px; gap: 10px; }
.large   { padding: 9px 14px; gap: 7.5px; }
```

---

## 2. 아키텍처

```
Figma 노드
  └─ generateComponent() [code.ts] → { html, jsx, styles, childStyles, texts, radixProps }
                                              ↓
                              parseVariantsFromHtml(html)  [component-builders.js] ← NEW
                                ├─ colorVariants: [{ name, cssVar }]
                                └─ sizeVariants:  [{ name, padding, gap }]
                                              ↓
                              buildButtonCSSModules(d, name, useTs)
                                ├─ TSX: className 조합 방식
                                └─ CSS: variant 클래스 생성
```

---

## 3. 핵심 파싱 함수 설계

### 3.1 `parseVariantsFromHtml(html)` — 신규

**입력**: Figma HTML 문자열
**출력**: `{ colorVariants, sizeVariants, rootStyles }`

#### 색상 변형 추출 알고리즘

HTML 패턴:
```html
<div style="background-color: var(--blue-bright); ... padding: 7px 12px ...">
  <span>Primary</span>
</div>
```

추출 규칙:
1. `background-color: var(--xxx)` + 자식 `<span>텍스트</span>` 패턴 매칭
2. CSS 변수 이름 → 색상 변형 이름 매핑 (`primary`, `danger`, `default` 등)
3. fill 없는 버튼(secondary/outline) 감지: padding 있으나 background-color 없는 div

```javascript
function parseVariantsFromHtml(html) {
  var colorVariants = [];
  var sizeVariants  = [];
  var seenVars      = {};
  var seenPaddings  = {};

  // ── 색상 변형: background-color + span 텍스트 패턴 ──────────────
  var colorRe = /background-color:\s*(var\([^)]+\))[^>]*>\s*(?:<[^>]+>\s*)*<span>([^<]+)<\/span>/g;
  var m;
  while ((m = colorRe.exec(html)) !== null) {
    var cssVar = m[1];
    var label  = m[2].trim().toLowerCase().replace(/\s+/g, '-');
    if (!seenVars[cssVar]) {
      seenVars[cssVar] = true;
      colorVariants.push({ name: label, cssVar: cssVar });
    }
  }

  // ── 사이즈 변형: 고유 padding 값 수집 ───────────────────────────
  var paddingRe = /padding:\s*([\d.]+px\s+[\d.]+px)(?:\s+[\d.]+px\s+[\d.]+px)?/g;
  var gapRe     = /gap:\s*([\d.]+px)/g;
  var paddingList = [];
  while ((m = paddingRe.exec(html)) !== null) {
    var p = m[1].trim();
    if (!seenPaddings[p]) {
      seenPaddings[p] = true;
      paddingList.push(p);
    }
  }
  // padding 세로값 기준 오름차순 → small/medium/large 순서
  paddingList.sort(function(a, b) {
    return parseFloat(a) - parseFloat(b);
  });
  var sizeNames = ['small', 'medium', 'large', 'xlarge'];
  paddingList.forEach(function(p, i) {
    sizeVariants.push({ name: sizeNames[i] || 'size-' + (i + 1), padding: p });
  });

  // ── root 스타일: 첫 번째 variant div에서 공통 속성 추출 ──────────
  var rootStyleMatch = html.match(/border-radius:\s*[\d.]+px/);
  var borderRadius = rootStyleMatch ? rootStyleMatch[0] : '';

  return { colorVariants: colorVariants, sizeVariants: sizeVariants, borderRadius: borderRadius };
}
```

### 3.2 `getVariantLabel(cssVar)` — 신규 헬퍼

CSS 변수명 → 시맨틱 라벨 변환:

| CSS var 패턴 | 변환 결과 |
|-------------|---------|
| `var(--blue-bright)`, `var(--blue-*`)` | `primary` |
| `var(--red)`, `var(--error-*)` | `danger` |
| `var(--light-gray-*)`, `var(--gray-*)` | `default` |
| `var(--dark)`, `var(--brand-*)` | `dark` |
| 없음 (배경색 없음) | `secondary` (outline 처리) |

---

## 4. `buildButtonCSSModules` 변경 설계

### 4.1 TSX 생성 (변경)

```javascript
function buildButtonCSSModules(d, name, useTs) {
  var parsed  = parseVariantsFromHtml(d.html || '');
  var colorVs = parsed.colorVariants;   // [{ name: 'primary', cssVar: 'var(--blue-bright)' }, ...]
  var sizeVs  = parsed.sizeVariants;    // [{ name: 'small', padding: '5px 10px' }, ...]

  // variant union type: 'default' | 'primary' | 'danger' | 'secondary'
  var variantNames = colorVs.map(function(v) { return v.name; });
  if (variantNames.length === 0) variantNames = ['default'];
  var variantUnion = variantNames.map(function(n) { return '"' + n + '"'; }).join(' | ');

  // size union type: 'small' | 'medium' | 'large'
  var sizeNames = sizeVs.map(function(v) { return v.name; });
  if (sizeNames.length === 0) sizeNames = ['medium'];
  var sizeUnion = sizeNames.map(function(n) { return '"' + n + '"'; }).join(' | ');

  var defaultVariant = variantNames[0];
  var defaultSize    = sizeNames.length >= 2 ? sizeNames[1] : sizeNames[0]; // 중간값

  // TSX
  var propsType = [
    '  onClick?: () => void;',
    '  disabled?: boolean;',
    '  variant?: ' + variantUnion + ';',
    '  size?: ' + sizeUnion + ';',
    '  children?: React.ReactNode;',
  ].join('\n');

  var propsDestructure = useTs
    ? '{ onClick, disabled, variant = "' + defaultVariant + '", size = "' + defaultSize + '", children }: ' + name + 'Props'
    : '{ onClick, disabled, variant = "' + defaultVariant + '", size = "' + defaultSize + '", children }';

  return (
    _imp('Button') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsType, useTs) +
    'export const ' + name + ' = (' + propsDestructure + ') => (\n' +
    '  <Button\n' +
    '    onClick={onClick}\n' +
    '    disabled={disabled}\n' +
    '    className={`${styles.root} ${styles[variant]} ${styles[size]}`}\n' +
    '  >\n' +
    '    {children ?? \'' + defaultVariant + '\'}\n' +
    '  </Button>\n' +
    ');'
  );
}
```

### 4.2 CSS 생성 (변경)

```javascript
// buildRadixCSS의 button 분기에서 호출
function buildButtonCSS(d, parsed) {
  var lines = [];

  // root: 공통 구조 스타일
  lines.push('.root {');
  lines.push('  all: unset;');
  lines.push('  box-sizing: border-box;');
  lines.push('  display: inline-flex;');
  lines.push('  align-items: center;');
  lines.push('  justify-content: center;');
  lines.push('  cursor: pointer;');
  if (parsed.borderRadius) lines.push('  ' + parsed.borderRadius + ';');
  lines.push('}');
  lines.push('');

  // color variants
  if (parsed.colorVariants.length > 0) {
    lines.push('/* Color variants */');
    parsed.colorVariants.forEach(function(v) {
      lines.push('.' + v.name + ' { background-color: ' + v.cssVar + '; }');
    });
    lines.push('');
  }

  // size variants
  if (parsed.sizeVariants.length > 0) {
    lines.push('/* Size variants */');
    parsed.sizeVariants.forEach(function(v) {
      var parts = ['padding: ' + v.padding + ';'];
      if (v.gap) parts.push('gap: ' + v.gap + ';');
      lines.push('.' + v.name + ' { ' + parts.join(' ') + ' }');
    });
    lines.push('');
  }

  // disabled 상태
  lines.push('.root:disabled,');
  lines.push('.root[disabled] {');
  lines.push('  opacity: 0.4;');
  lines.push('  cursor: not-allowed;');
  lines.push('}');

  return lines.join('\n');
}
```

---

## 5. 변경 파일 목록

| 파일 | 변경 내용 | 범위 |
|------|----------|------|
| `src/ui/component-builders.js` | `parseVariantsFromHtml()` 신규, `buildButtonCSSModules()` 개편, `buildRadixCSS()` button 분기 개편 | 주요 변경 |
| `src/code.ts` | 변경 없음 — 기존 `html` 필드를 그대로 활용 | 없음 |

---

## 6. 구현 순서

1. `parseVariantsFromHtml(html)` 함수 구현 및 단위 검증
2. `buildButtonCSSModules` TSX 생성 로직 개편
3. `buildRadixCSS` button 분기에 `buildButtonCSS(d, parsed)` 연결
4. `npm run build` + Figma에서 실제 Buttons 노드로 검증

---

## 7. 예상 출력 (Buttons GROUP 기준)

### TSX
```tsx
import { Button } from '@radix-ui/themes';
import styles from './Buttons.module.css';

interface ButtonsProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "secondary";
  size?: "small" | "medium" | "large";
  children?: React.ReactNode;
}

export const Buttons = ({ onClick, disabled, variant = "default", size = "medium", children }: ButtonsProps) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.root} ${styles[variant]} ${styles[size]}`}
  >
    {children ?? 'default'}
  </Button>
);
```

### CSS module
```css
/* Buttons.module.css */

.root {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 3px;
}

/* Color variants */
.default   { background-color: var(--light-gray-2); }
.primary   { background-color: var(--blue-bright); }
.danger    { background-color: var(--red); }

/* Size variants */
.small  { padding: 5px 10px; }
.medium { padding: 7px 12px; }
.large  { padding: 9px 14px; }

.root:disabled,
.root[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 8. 적용 범위 (v2.0 — Button 우선)

이번 v2에서는 **Button만 개편**하고, 동일 패턴을 이후 순차 적용:

| 우선순위 | 컴포넌트 | 이유 |
|---------|---------|------|
| 1 | Button | 가장 많이 사용, 패턴 검증 |
| 2 | Badge, Checkbox, Switch | 단순 색상/크기 변형 |
| 3 | Input, Select | 상태(focus, error) 변형 포함 |
| 4 | Dialog, Popover | 복잡한 오버레이 구조 |
