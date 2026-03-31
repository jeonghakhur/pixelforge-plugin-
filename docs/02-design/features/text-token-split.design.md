# text-token-split Design Document

> **Plan**: `docs/01-plan/features/text-token-split.plan.md`
> **Date**: 2026-03-31
> **Status**: Implemented (Match Rate: 100%)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 카드 기본 활성화 + texts 단일 타입으로 본문/제목/폰트 구분 불가 |
| **Solution** | 카드 기본 비활성화, texts → textStyles/headings/fonts 3분리, FontData CSS 변수 출력 |
| **Function/UX Effect** | 의도적 선택 추출 UX + 폰트 CSS 변수 자동 생성 |
| **Core Value** | 기존 texts 하위 호환 유지하며 신규 세분화 경로 추가 |

---

## 1. 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `FontData` 인터페이스, `HEADING_RE` 상수, `ExtractedTokens.styles` 확장, `ExtractOptions.tokenTypes` 확장, `extractAll()` 분류 로직 |
| `src/converters/typography.js` | 수정 | `convertFonts(fonts)` 신규 함수 추가 |
| `src/ui.js` | 수정 | `generateCSS()` 신규 타입 처리, `getFilteredData()` 신규 필드, stats 렌더링 |
| `src/ui.html` | 수정 | 모든 token-card `active` 제거, `texts` 카드 → 3개 카드 교체, stat-card 교체 |

---

## 2. 인터페이스 변경 (`src/code.ts`)

### 2.1 `FontData` 신규 인터페이스

```typescript
interface FontData {
  family: string;    // "SF Pro Text"
  cssVar: string;    // "--font-sf-pro-text"
  styles: string[];  // ["Regular", "Medium", "Semibold", "Bold"]
}
```

### 2.2 `ExtractedTokens.styles` 확장

```typescript
// 기존
styles: {
  colors: ColorStyleData[];
  texts: TextStyleData[];    // 유지 (하위 호환)
  effects: EffectStyleData[];
}

// 변경 후
styles: {
  colors: ColorStyleData[];
  texts: TextStyleData[];        // 유지 (하위 호환 — 전체 배열)
  textStyles: TextStyleData[];   // 신규 — 본문 계열
  headings: TextStyleData[];     // 신규 — 제목 계열
  fonts: FontData[];             // 신규 — 고유 폰트 패밀리
  effects: EffectStyleData[];
}
```

### 2.3 `ExtractOptions.tokenTypes` 확장

```typescript
tokenTypes: Array<
  | 'variables' | 'colors' | 'spacing' | 'radius' | 'effects'
  | 'texts'       // 유지 (하위 호환)
  | 'textStyles'  // 신규
  | 'headings'    // 신규
  | 'fonts'       // 신규
>
```

---

## 3. 신규 상수 (`src/code.ts`)

```typescript
const HEADING_RE = /\b(heading|display|title|h[1-6])\b/i;
```

`SPACING_RE`, `RADIUS_RE`와 같은 라인에 추가.

---

## 4. `extractAll()` 변경 (`src/code.ts`)

### 변경 위치: Text Styles 추출 블록 (현재 `types.includes('texts')`)

```typescript
// 기존 (유지)
let texts: TextStyleData[] = [];
if (types.includes('texts')) {
  texts = (await figma.getLocalTextStylesAsync())
    .map((s) => ({ ...mapTextStyle(s, styleUsage) }))
    .filter((s) => !isSelectionMode || s.usageCount > 0);
}

// 추가 — textStyles / headings / fonts
let textStyles: TextStyleData[] = [];
let headings: TextStyleData[] = [];
let fonts: FontData[] = [];

const needsTextSplit = types.some((t) =>
  ['textStyles', 'headings', 'fonts'].includes(t)
);

if (needsTextSplit) {
  const allTexts = (await figma.getLocalTextStylesAsync())
    .map((s) => mapTextStyle(s, styleUsage))
    .filter((s) => !isSelectionMode || s.usageCount > 0);

  if (types.includes('textStyles')) {
    textStyles = allTexts.filter((s) => !HEADING_RE.test(s.name));
  }
  if (types.includes('headings')) {
    headings = allTexts.filter((s) => HEADING_RE.test(s.name));
  }
  if (types.includes('fonts')) {
    fonts = collectFonts(allTexts);
  }
}
```

**중복 API 호출 방지**: `texts`와 `textSplit` 모두 선택 시 각각 `getLocalTextStylesAsync()` 호출. 동일한 데이터지만 타입이 독립적이므로 분리 유지 (단순성 우선).

### `mapTextStyle()` 추출 (리팩터링)

현재 extractAll 내부 인라인 `.map()` 로직을 분리:

```typescript
function mapTextStyle(s: TextStyle, styleUsage: Map<string, number>): TextStyleData {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    fontName: s.fontName,
    fontSize: s.fontSize,
    fontWeight: (s as any).fontWeight ?? fontWeightFromStyle(s.fontName.style),
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
    usageCount: styleUsage.get(s.id) ?? 0,
  };
}
```

---

## 5. 신규 함수 `collectFonts()` (`src/code.ts`)

```typescript
function collectFonts(textStyles: TextStyleData[]): FontData[] {
  const familyMap = new Map<string, Set<string>>();

  for (const s of textStyles) {
    const family = s.fontName.family;
    if (!familyMap.has(family)) familyMap.set(family, new Set());
    familyMap.get(family)!.add(s.fontName.style);
  }

  return Array.from(familyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, stylesSet]): FontData => ({
      family,
      cssVar: '--font-' + family.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      styles: Array.from(stylesSet).sort(),
    }));
}
```

- **중복 제거**: `Map<family, Set<style>>`
- **정렬**: family 알파벳순
- **cssVar 생성**: 소문자 + 공백→하이픈 + 특수문자 제거
  - `"SF Pro Text"` → `--font-sf-pro-text`
  - `"SF Pro Display"` → `--font-sf-pro-display`

---

## 6. `extractAll()` 반환값 변경

```typescript
return {
  variables: variableResult,
  spacing,
  radius,
  styles: {
    colors,
    texts,           // 기존 유지
    textStyles,      // 신규
    headings,        // 신규
    fonts,           // 신규
    effects,
  },
  icons,
  meta: { ... },
};
```

---

## 7. `convertFonts()` 신규 함수 (`src/converters/typography.js`)

```javascript
export function convertFonts(fonts) {
  if (!fonts || fonts.length === 0) return '';
  var out = '/* === Font Families === */\n:root {\n';
  fonts.forEach(function (f) {
    out += '  ' + f.cssVar + ': "' + f.family + '";\n';
  });
  out += '}\n\n';
  return out;
}
```

**출력 예시 (Airtable 파일)**:
```css
/* === Font Families === */
:root {
  --font-sf-pro-display: "SF Pro Display";
  --font-sf-pro-text: "SF Pro Text";
}
```

---

## 8. `ui.js` 변경

### 8.1 import 추가

```javascript
import { convertTextStyles, convertFonts } from './converters/typography.js';
```

### 8.2 `generateCSS()` — 신규 타입 처리 추가

```javascript
// 기존 유지
if (all || types.has('texts')) {
  body += convertTextStyles(data.styles ? data.styles.texts : [], unit);
}

// 신규 추가 (기존 블록 바로 아래)
if (all || types.has('textStyles')) {
  body += convertTextStyles(data.styles ? (data.styles.textStyles || []) : [], unit);
}
if (all || types.has('headings')) {
  body += convertTextStyles(data.styles ? (data.styles.headings || []) : [], unit);
}
if (all || types.has('fonts')) {
  body += convertFonts(data.styles ? (data.styles.fonts || []) : []);
}
```

### 8.3 `getFilteredData()` — 신규 필드 추가

```javascript
styles: {
  colors: types.has('colors') ? (d.styles ? d.styles.colors : []) : [],
  texts: types.has('texts') ? (d.styles ? d.styles.texts : []) : [],
  textStyles: types.has('textStyles') ? (d.styles ? (d.styles.textStyles || []) : []) : [],
  headings: types.has('headings') ? (d.styles ? (d.styles.headings || []) : []) : [],
  fonts: types.has('fonts') ? (d.styles ? (d.styles.fonts || []) : []) : [],
  effects: types.has('effects') ? (d.styles ? d.styles.effects : []) : [],
},
```

### 8.4 stats 렌더링 변경

```javascript
// 기존 textCount 제거, 신규 3개 추가
var textStylesCount = styles ? (styles.textStyles || []).length : 0;
var headingsCount = styles ? (styles.headings || []).length : 0;
var fontsCount = styles ? (styles.fonts || []).length : 0;

$('statTextStylesNum').textContent = textStylesCount;
$('statHeadingsNum').textContent = headingsCount;
$('statFontsNum').textContent = fontsCount;

[
  ['statVar', varCount],
  ['statSpacing', spacingCount],
  ['statRadius', radiusCount],
  ['statColor', colorCount],
  ['statTextStyles', textStylesCount],
  ['statHeadings', headingsCount],
  ['statFonts', fontsCount],
  ['statEffect', effectCount],
].forEach(function (p) {
  $(p[0]).classList.toggle('inactive', p[1] === 0);
});
```

### 8.5 i18n 추가

```javascript
// ko
textStylesCard: '본문 스타일',
headingsCard: '헤딩',
fontsCard: '폰트',

// en
textStylesCard: 'Text Styles',
headingsCard: 'Headings',
fontsCard: 'Fonts',
```

---

## 9. `ui.html` 변경

### 9.1 모든 token-card에서 `active` 제거

```html
<!-- 기존 -->
<div class="token-card active" data-type="variables">

<!-- 변경 -->
<div class="token-card" data-type="variables">
```

대상: variables, colors, spacing, radius, effects (5개 카드 모두)

### 9.2 `texts` 카드 → 3개 카드 교체

```html
<!-- 제거 -->
<div class="token-card active" data-type="texts"> ... </div>

<!-- 추가 (3개) -->
<div class="token-card" data-type="textStyles">
  <div class="token-card-icon">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 4h12M2 8h8M2 12h10" stroke-linecap="round"/>
    </svg>
  </div>
  <span class="token-card-label" data-i18n="extract.textStylesCard">본문 스타일</span>
</div>

<div class="token-card" data-type="headings">
  <div class="token-card-icon">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 3v10M9 3v10M2 8h7" stroke-linecap="round"/>
    </svg>
  </div>
  <span class="token-card-label" data-i18n="extract.headingsCard">헤딩</span>
</div>

<div class="token-card" data-type="fonts">
  <div class="token-card-icon">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 13L8 3l5 10M5.5 9h5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <span class="token-card-label" data-i18n="extract.fontsCard">폰트</span>
</div>
```

### 9.3 stat-card 교체

```html
<!-- 제거 -->
<div class="stat-card" id="statText" data-type="texts"> ... </div>

<!-- 추가 (3개) -->
<div class="stat-card" id="statTextStyles" data-type="textStyles">
  <div class="stat-value" id="statTextStylesNum">0</div>
  <div class="stat-label">Text Styles</div>
</div>
<div class="stat-card" id="statHeadings" data-type="headings">
  <div class="stat-value" id="statHeadingsNum">0</div>
  <div class="stat-label">Headings</div>
</div>
<div class="stat-card" id="statFonts" data-type="fonts">
  <div class="stat-value" id="statFontsNum">0</div>
  <div class="stat-label">Fonts</div>
</div>
```

---

## 10. 성공 기준 체크리스트

| # | 항목 | 검증 방법 |
|---|------|----------|
| 1 | 모든 카드 기본 비활성화 | 플러그인 열기 → 카드 모두 off 확인 |
| 2 | `HEADING_RE` 분류 정확성 | Airtable: textStyles 11개 / headings 7개 |
| 3 | `collectFonts()` cssVar 생성 | `"SF Pro Text"` → `--font-sf-pro-text` |
| 4 | `convertFonts()` CSS 출력 | `:root { --font-sf-pro-text: "SF Pro Text"; }` |
| 5 | 기존 `texts` 타입 하위 호환 | 이전 캐시 데이터 로드 시 정상 표시 |
| 6 | `getFilteredData()` 신규 필드 | JSON 다운로드 시 textStyles/headings/fonts 포함 |
| 7 | `npm run build` 성공 | 빌드 실행 |

---

## 11. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|----------|
| 구 캐시 데이터 로드 (`styles.textStyles` 없음) | `styles.textStyles || []` 폴백 |
| 모든 Text Styles가 HEADING_RE 매칭 | textStyles = [], headings = 전체 |
| fontName.family가 빈 문자열 | `family.trim() === ''` → 건너뜀 |
| `texts`와 `textStyles` 동시 선택 | 각각 독립 추출 (중복 허용, 사용자 선택) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-31 | Initial design |
