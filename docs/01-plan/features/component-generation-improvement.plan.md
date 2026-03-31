# Plan: Component Generation Improvement — Radix Themes 통일

> **Summary**: 모든 컴포넌트 코드 생성을 `@radix-ui/themes` 기준으로 통일하여, Radix UI Primitives(unstyled)와 Native HTML 혼용 문제를 해결
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.3.0
> **Date**: 2026-03-31
> **Status**: Draft
> **Depends on**: component-radix-generation (구현 완료)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 컴포넌트 빌더가 3가지 라이브러리를 혼용: Radix Themes(`@radix-ui/themes`), Radix UI Primitives(`@radix-ui/react-*`), Native HTML — import 불일치, 스타일 체계 분산, 사용자 혼란 |
| **Solution** | 모든 컴포넌트를 `@radix-ui/themes` 기준으로 통일. Themes가 미제공하는 타입만 Primitives 유지 |
| **Function/UX Effect** | 생성된 모든 코드가 동일한 `import { Button, Dialog, ... } from '@radix-ui/themes'` 패턴 사용. 사용자는 하나의 패키지만 설치하면 됨 |
| **Core Value** | 일관된 코드 생성 → 사용자 DX 향상, 설치 단순화, 테마 토큰 자동 적용 |

---

## 1. 개요

### 1.1 목적

`component-builders.js`의 모든 컴포넌트 빌더를 **Radix Themes** 컴포넌트 기준으로 재작성한다.

- `@radix-ui/themes`가 제공하는 컴포넌트 → Themes import로 통일
- Themes 미제공 컴포넌트 → Radix Primitives 유지 (최소화)
- Native HTML `<button>` 등 → `Theme.Button`으로 전환

### 1.2 현재 문제 분석

**3가지 import 패턴 혼재:**

| 패턴 | 사용처 | 예시 |
|------|--------|------|
| `@radix-ui/themes` | heading, text, card, badge, input, textarea, callout, table, skeleton | `import * as Theme from '@radix-ui/themes'` |
| `@radix-ui/react-*` (Primitives) | dialog, tabs, checkbox, switch, select, tooltip, accordion, popover, avatar, separator, progress, slider, radio-group, toggle 등 | `import * as Dialog from '@radix-ui/react-dialog'` |
| Native HTML | button, layout | `<button className={styles.root}>` |

**문제점:**
1. 사용자가 컴포넌트마다 다른 패키지를 설치해야 함
2. Primitives는 unstyled → 사용자가 CSS를 직접 작성해야 함
3. Themes 컴포넌트는 테마 토큰이 자동 적용되지만, Primitives는 수동 연결 필요
4. 생성 코드의 품질/스타일이 불일치

### 1.3 관련 문서

- `docs/01-plan/features/component-radix-generation.plan.md` — 기존 구현 계획 (완료)
- `src/ui/component-builders.js` — 현재 빌더 구현

---

## 2. Radix Themes 컴포넌트 매핑

### 2.1 Radix Themes 제공 컴포넌트 (전환 대상)

| 타입 | 현재 import | 전환 후 | 변경 사항 |
|------|-------------|---------|-----------|
| **button** | Native `<button>` | `Theme.Button` | 완전 재작성 |
| **dialog** | `@radix-ui/react-dialog` | `Theme.Dialog` | Theme 래핑 버전으로 전환 |
| **alert-dialog** | `@radix-ui/react-alert-dialog` | `Theme.AlertDialog` | Theme 래핑 버전으로 전환 |
| **tabs** | `@radix-ui/react-tabs` | `Theme.Tabs` | Theme 래핑 버전으로 전환 |
| **checkbox** | `@radix-ui/react-checkbox` | `Theme.Checkbox` | 대폭 단순화 (Indicator 불필요) |
| **switch** | `@radix-ui/react-switch` | `Theme.Switch` | 대폭 단순화 (Thumb 불필요) |
| **select** | `@radix-ui/react-select` | `Theme.Select` | Portal/Viewport 불필요 |
| **dropdown-menu** | `@radix-ui/react-dropdown-menu` | `Theme.DropdownMenu` | Theme 래핑 버전으로 전환 |
| **context-menu** | `@radix-ui/react-context-menu` | `Theme.ContextMenu` | Theme 래핑 버전으로 전환 |
| **tooltip** | `@radix-ui/react-tooltip` | `Theme.Tooltip` | Provider 불필요, 단순화 |
| **popover** | `@radix-ui/react-popover` | `Theme.Popover` | Theme 래핑 버전으로 전환 |
| **hover-card** | `@radix-ui/react-hover-card` | `Theme.HoverCard` | Theme 래핑 버전으로 전환 |
| **avatar** | `@radix-ui/react-avatar` | `Theme.Avatar` | 대폭 단순화 (단일 컴포넌트) |
| **separator** | `@radix-ui/react-separator` | `Theme.Separator` | 단순화 |
| **radio-group** | `@radix-ui/react-radio-group` | `Theme.RadioGroup` | Theme 래핑 버전 |
| **slider** | `@radix-ui/react-slider` | `Theme.Slider` | Track/Range/Thumb 불필요 |
| **progress** | `@radix-ui/react-progress` | `Theme.Progress` | Indicator 불필요 |
| **scroll-area** | `@radix-ui/react-scroll-area` | `Theme.ScrollArea` | Viewport/Scrollbar 불필요 |
| **toggle** | `@radix-ui/react-toggle` | `Theme.IconButton` + state | 대체 패턴 |
| **toggle-group** | `@radix-ui/react-toggle-group` | `Theme.SegmentedControl` | 대체 컴포넌트 |

### 2.2 이미 Radix Themes 사용 중 (변경 불필요)

| 타입 | 현재 상태 |
|------|-----------|
| heading | `Theme.Heading` ✅ |
| text | `Theme.Text` ✅ |
| card | `Theme.Card` + `Theme.Flex` ✅ |
| badge | `Theme.Badge` ✅ |
| input | `Theme.TextField.Root` ✅ |
| textarea | `Theme.TextArea` (generic 빌더) ✅ |
| callout | `Theme.Callout.*` (generic 빌더) ✅ |
| table | `Theme.Table.*` (generic 빌더) ✅ |
| skeleton | `Theme.Skeleton` (generic 빌더) ✅ |

### 2.3 Radix Themes 미제공 (Primitives 유지)

| 타입 | 이유 | 처리 |
|------|------|------|
| **accordion** | Themes에 Accordion 없음 | `@radix-ui/react-accordion` 유지 |
| **collapsible** | Themes에 Collapsible 없음 | `@radix-ui/react-collapsible` 유지 |
| **navigation-menu** | Themes에 NavigationMenu 없음 | `@radix-ui/react-navigation-menu` 유지 |

### 2.4 신규 추가 대상 (Radix Themes에 있으나 현재 빌더 미구현)

| 타입 | Themes 컴포넌트 | 용도 |
|------|-----------------|------|
| **icon-button** | `IconButton` | 아이콘 전용 버튼 |
| **spinner** | `Spinner` | 로딩 인디케이터 |
| **checkbox-cards** | `Checkbox.Cards` | 카드형 체크박스 그룹 |
| **checkbox-group** | `Checkbox.Group` | 체크박스 그룹 |
| **radio-cards** | `RadioCards` | 카드형 라디오 그룹 |
| **segmented-control** | `SegmentedControl` | 세그먼트 컨트롤 |
| **tab-nav** | `TabNav` | 네비게이션 탭 |
| **data-list** | `DataList` | 키-값 데이터 목록 |
| **aspect-ratio** | `AspectRatio` | 비율 박스 (Themes 제공 확인) |
| **code** | `Code` | 인라인 코드 |
| **link** | `Link` | 링크 |
| **blockquote** | `Blockquote` | 인용문 |
| **kbd** | `Kbd` | 키보드 단축키 |
| **em** | `Em` | 강조 텍스트 |
| **strong** | `Strong` | 볼드 텍스트 |

### 2.5 Radix Themes 전체 컴포넌트 (56개 — 공식 문서 기준)

| 카테고리 | 수량 | 컴포넌트 |
|----------|------|----------|
| **Layout** | 6 | Box, Flex, Grid, Section, Container, Inset |
| **Typography** | 9 | Text, Heading, Code, Em, Kbd, Link, Quote, Blockquote, Strong |
| **Components** | 35 | AlertDialog, AspectRatio, Avatar, Badge, Button, Callout, Card, Checkbox, CheckboxCards, CheckboxGroup, ContextMenu, DataList, Dialog, DropdownMenu, HoverCard, IconButton, Popover, Progress, Radio, RadioCards, RadioGroup, ScrollArea, SegmentedControl, Select, Separator, Skeleton, Slider, Spinner, Switch, Table, Tabs, TabNav, TextArea, TextField, Tooltip |
| **Utilities** | 6 | Theme, AccessibleIcon, Portal, Reset, Slot, VisuallyHidden |

---

## 3. 구현 범위

### 3.1 In Scope

- [ ] **button**: Native `<button>` → `Theme.Button` 전환 (CSS Modules + Styled 모두)
- [ ] **dialog**: Primitives → `Theme.Dialog` 전환
- [ ] **alert-dialog**: Primitives → `Theme.AlertDialog` 전환
- [ ] **tabs**: Primitives → `Theme.Tabs` 전환
- [ ] **checkbox**: Primitives → `Theme.Checkbox` 전환 (Indicator 제거)
- [ ] **switch**: Primitives → `Theme.Switch` 전환 (Thumb 제거)
- [ ] **select**: Primitives → `Theme.Select` 전환 (Portal/Viewport 제거)
- [ ] **dropdown-menu**: Primitives → `Theme.DropdownMenu` 전환
- [ ] **tooltip**: Primitives → `Theme.Tooltip` 전환 (Provider 제거)
- [ ] **popover**: Primitives → `Theme.Popover` 전환
- [ ] **hover-card**: Primitives → `Theme.HoverCard` 전환
- [ ] **avatar**: Primitives → `Theme.Avatar` 전환 (단일 컴포넌트화)
- [ ] **separator**: Primitives → `Theme.Separator` 전환
- [ ] **radio-group**: Primitives → `Theme.RadioGroup` 전환
- [ ] **slider**: Primitives → `Theme.Slider` 전환
- [ ] **progress**: Primitives → `Theme.Progress` 전환
- [ ] **scroll-area**: Primitives → `Theme.ScrollArea` 전환
- [ ] **toggle/toggle-group**: Primitives → `Theme.IconButton`/`Theme.SegmentedControl` 전환
- [ ] **aspect-ratio**: Primitives → `Theme.AspectRatio` 전환
- [ ] 신규 빌더 추가: icon-button, spinner, checkbox-cards, checkbox-group, radio-cards, segmented-control, tab-nav, data-list, code, link, blockquote, kbd, em, strong
- [ ] **RADIX_COMPONENT_REGISTRY** 업데이트: pkg/ns를 Themes 기준으로 수정
- [ ] **buildRadixCSS()** 업데이트: Themes 컴포넌트는 CSS 최소화 (테마 토큰 자동 적용)
- [ ] **buildRadixStyled()** 업데이트: Themes 기준으로 통일
- [ ] **install hint** 통일: `npm install @radix-ui/themes` 단일 안내

- [ ] **Variant 분석**: Figma 노드 스타일에서 Radix Themes props(`color`, `variant`, `size`) 자동 추론
- [ ] **color prop 매핑**: Figma fill 색상 → Radix Themes `color` prop 매핑 (blue, red, gray 등)
- [ ] **size prop 매핑**: Figma padding/height → Radix Themes `size` prop 매핑 (1, 2, 3, 4)
- [ ] **variant prop 매핑**: Figma fill/stroke 패턴 → Radix Themes `variant` prop 매핑 (solid, soft, outline, ghost)
- [ ] Gap 분석 누락 항목: em/strong 빌더, checkbox-cards/checkbox-group/radio-cards REGISTRY+빌더, UI 드롭다운 누락 옵션 6개

### 3.2 Out of Scope

- Tailwind CSS 출력 모드 — 별도 feature
- Themes 미제공 컴포넌트(accordion, collapsible, navigation-menu) 전환
- Radix Themes `<Theme>` Provider 래퍼 생성 — 사용자 프로젝트 설정 범위

---

## 4. 요구사항

### 4.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 모든 Themes 제공 컴포넌트는 `@radix-ui/themes` import 사용 | 필수 |
| FR-02 | button: `Theme.Button`으로 전환, variant/size/color props 지원 | 필수 |
| FR-03 | dialog: `Theme.Dialog.Root/Content/Title/Description/Close` 구조 | 필수 |
| FR-04 | checkbox/switch: 단일 컴포넌트 (Indicator/Thumb 하위 요소 제거) | 필수 |
| FR-05 | select: `Theme.Select.Root/Trigger/Content/Item` (Portal/Viewport 제거) | 필수 |
| FR-06 | tooltip: `Theme.Tooltip` 단일 래퍼 (Provider 제거) | 필수 |
| FR-07 | avatar: `Theme.Avatar` 단일 컴포넌트 (src/fallback props) | 필수 |
| FR-08 | Themes 컴포넌트 CSS 출력 최소화 (기본 테마 토큰 활용) | 필수 |
| FR-09 | install hint를 `npm install @radix-ui/themes`로 통일 | 필수 |
| FR-10 | RADIX_COMPONENT_REGISTRY를 Themes 기준으로 재구성 | 필수 |
| FR-11 | Styled-Components 모드도 Themes 기준으로 전환 | 필수 |
| FR-12 | Primitives 유지 타입(accordion 등) 명확히 분리 표시 | 선택 |

### 4.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 코드 일관성 | Themes 제공 타입의 100%가 `@radix-ui/themes` import 사용 |
| 생성 코드 품질 | Radix Themes 공식 API와 일치하는 props 사용 |
| CSS 최소화 | Themes 컴포넌트는 커스텀 CSS 50% 이상 감소 |
| 하위 호환 | 기존 HTML 모드 출력 영향 없음 |

---

## 5. 전환 예시

### 5.1 Button (Before → After)

**Before (Native HTML):**
```tsx
import styles from './Button.module.css';

export const Button = ({ onClick, disabled, children }: ButtonProps) => (
  <button className={styles.root} onClick={onClick} disabled={disabled} type="button">
    {children ?? 'Click me'}
  </button>
);
```

**After (Radix Themes):**
```tsx
import { Button as RadixButton } from '@radix-ui/themes';

export const Button = ({ onClick, disabled, variant = "solid", size = "2", children }: ButtonProps) => (
  <RadixButton variant={variant} size={size} onClick={onClick} disabled={disabled}>
    {children ?? 'Click me'}
  </RadixButton>
);
```

### 5.2 Checkbox (Before → After)

**Before (Primitives — 복잡):**
```tsx
import * as Checkbox from '@radix-ui/react-checkbox';

export const MyCheckbox = ({ checked, onCheckedChange }: Props) => (
  <label className={styles.root}>
    <Checkbox.Root className={styles.checkbox} checked={checked} onCheckedChange={onCheckedChange}>
      <Checkbox.Indicator className={styles.indicator}>
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </Checkbox.Indicator>
    </Checkbox.Root>
    <span className={styles.label}>Label</span>
  </label>
);
```

**After (Radix Themes — 단순):**
```tsx
import { Checkbox, Flex, Text } from '@radix-ui/themes';

export const MyCheckbox = ({ checked, onCheckedChange, size = "2" }: Props) => (
  <Flex gap="2" align="center">
    <Checkbox checked={checked} onCheckedChange={onCheckedChange} size={size} />
    <Text as="label" size="2">Label</Text>
  </Flex>
);
```

### 5.3 Tooltip (Before → After)

**Before (Primitives — Provider 필요):**
```tsx
import * as Tooltip from '@radix-ui/react-tooltip';

export const MyTooltip = ({ children }: Props) => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button className={styles.trigger}>{children}</button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.content} sideOffset={4}>
          Tooltip content
          <Tooltip.Arrow className={styles.arrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
```

**After (Radix Themes — 단순):**
```tsx
import { Tooltip, IconButton } from '@radix-ui/themes';

export const MyTooltip = ({ content = "Tooltip content", children }: Props) => (
  <Tooltip content={content}>
    <IconButton variant="ghost" size="1">
      {children ?? '?'}
    </IconButton>
  </Tooltip>
);
```

---

## 6. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| import 방식 | Named import `{ Button, Dialog }` | Themes는 named export 제공, tree-shaking 유리 |
| Themes 미제공 타입 | Primitives 유지 + 주석 표시 | 무리한 대체보다 정확한 API 사용이 중요 |
| CSS Modules 출력 | Themes 타입은 커스텀 CSS 최소화 | Themes가 테마 토큰으로 스타일 자동 적용 |
| Styled-Components 출력 | Themes 컴포넌트 + styled 래핑 | variant/size override는 props로, 추가 스타일만 styled |
| button variant 감지 | Figma 노드 스타일에서 추론 | solid fill → "solid", outline → "outline", no fill → "ghost" |
| REGISTRY 구조 | `themeComponent: true` 플래그 활용 | 이미 레지스트리에 플래그 존재, 빌더에서 분기 활용 |

---

## 7. 구현 순서

| 순서 | 작업 | 파일 | 난이도 |
|------|------|------|--------|
| 1 | RADIX_COMPONENT_REGISTRY 재구성 | component-builders.js:25-62 | 낮음 |
| 2 | button 빌더 전환 | buildButtonCSSModules, buildRadixStyled(button) | 낮음 |
| 3 | dialog/alert-dialog 빌더 전환 | buildDialogCSSModules, buildRadixStyled(dialog) | 중간 |
| 4 | checkbox/switch 빌더 전환 | buildCheckboxCSSModules, buildSwitchCSSModules | 낮음 |
| 5 | select/dropdown-menu 빌더 전환 | buildSelectCSSModules, buildGenericCSSModules | 중간 |
| 6 | tabs 빌더 전환 | buildTabsCSSModules | 중간 |
| 7 | tooltip/popover/hover-card 빌더 전환 | buildTooltipCSSModules, buildPopoverCSSModules | 낮음 |
| 8 | avatar/separator/progress/slider 빌더 전환 | 각 전용 빌더 | 낮음 |
| 9 | radio-group/scroll-area/toggle 빌더 전환 | buildGenericCSSModules 내 템플릿 | 낮음 |
| 10 | buildRadixCSS() — Themes 타입 CSS 최소화 | buildRadixCSS 함수 | 중간 |
| 11 | buildRadixStyled() — Themes 기준 전환 | buildRadixStyled 함수 전체 | 높음 |
| 12 | install hint 통일 | UI 표시 로직 | 낮음 |

---

## 8. 완료 기준

- [ ] Themes 제공 타입 100%가 `@radix-ui/themes` import 사용
- [ ] button: `Theme.Button` 사용, variant/size props 포함
- [ ] dialog: `Dialog.Root/Content/Title/Description/Close` Themes 버전
- [ ] checkbox/switch: 단일 컴포넌트, Indicator/Thumb 제거
- [ ] select: Portal/Viewport 없는 Themes 버전
- [ ] tooltip: Provider 없는 단순 `Tooltip` 래퍼
- [ ] avatar: 단일 `Avatar` 컴포넌트 (src/fallback props)
- [ ] CSS Modules 출력: Themes 타입은 커스텀 CSS 최소화
- [ ] Styled-Components 출력: Themes 기준으로 통일
- [ ] install hint: `npm install @radix-ui/themes` 단일 안내
- [ ] 기존 HTML 모드 영향 없음
- [ ] `npm run build` 성공

---

## 9. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Themes API가 Primitives와 다른 부분 | 생성 코드 컴파일 에러 | Radix Themes 공식 문서 기준으로 API 확인 |
| Themes 미제공 타입 누락 | 잘못된 import 생성 | REGISTRY의 `themeComponent` 플래그로 명확히 분리 |
| CSS 최소화 시 커스텀 스타일 손실 | Figma 디자인 반영 부족 | className prop으로 커스텀 스타일 추가 가능하도록 유지 |
| Styled-Components + Themes 조합 제한 | styled 래핑 호환성 | Themes의 className/style props 활용, 최소한의 styled 래핑 |
