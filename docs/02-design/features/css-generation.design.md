# Design: CSS Generation

> Plan 참조: `docs/01-plan/features/css-generation.plan.md`
> 디자인 레퍼런스: Tokens Studio for Figma (https://www.figma.com/design/ks49IxxHXxuBWtNsiexMqJ/)

---

## 1. 화면 플로우 전체

```
[filter-view]
  │  토큰 타입 칩 선택 + 범위 + 컬렉션 설정
  │  "토큰 추출하기" 클릭
  ▼
[loading-view]
  │  스피너 + "토큰을 추출하고 있습니다..."
  │  (완료)
  ▼
[result-view]  ◀─── "← 뒤로" 클릭
  │
  ├─ Stat Cards (Variables / Spacing / Radius / Color Styles / ...)
  ├─ Meta Info Bar (파일명 / 범위 / 노드 수 / 시각)
  │
  ├─ [Preview Panel]  ← 핵심 신규 영역
  │   ┌─ [ JSON ] [ CSS ] ─── 탭 ─── (우측) 단위: [px] [rem] ─┐
  │   │                                                          │
  │   │  JSON 탭: { "variables": { ... } }                      │
  │   │  CSS  탭: :root { --color-brand-primary: #FF6F0F; }     │
  │   │                                                          │
  │   └──────────────────────────────────────────────────────────┘
  │
  └─ [Action Bar]  (고정 하단)
      [📋 복사]  [⬇ JSON]  [⬇ CSS]
```

---

## 2. Result View 상세 레이아웃

```
┌────────────────────────────────────────────────────────┐
│  PF PixelForge  │ [파일명]                    ← 뒤로  │  48px Header
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │  27  │ │  13  │ │  5   │ │  1   │  ...             │  Stat Cards (grid 4열)
│  │ Var  │ │Color │ │ Text │ │ Eff  │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  파일 [명칭]  범위 [전체]  노드 [7,174개]  시각 [11:44]  │  Meta Bar
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [ JSON ]  [ CSS ]          단위: [px] [rem]    │  │  ← 탭 헤더
│  ├─────────────────────────────────────────────────┤  │
│  │                                                 │  │
│  │  (JSON 탭)                                      │  │
│  │  {                                              │  │  Preview Panel
│  │    "variables": { ... }                         │  │  (flex:1 scroll)
│  │  }                                              │  │
│  │                                                 │  │
│  │  (CSS 탭)                                       │  │
│  │  /* PixelForge Tokens — light */                │  │
│  │  :root {                                        │  │
│  │    --color-brand-primary: #FF6F0F;              │  │
│  │    --spacing-gap-sm: 8px;                       │  │
│  │  }                                              │  │
│  │  [data-theme="dark"] {                          │  │
│  │    --color-brand-primary: #E68507;              │  │
│  │  }                                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [📋 복사]          [⬇ JSON]          [⬇ CSS]         │  48px Action Bar
└────────────────────────────────────────────────────────┘
```

---

## 3. Preview Panel 컴포넌트 스펙

### 3.1 탭 바

```
┌─────────────────────────────────────────────────────────┐
│  [ JSON ]  [ CSS ]                  단위: [px] [rem]   │
└─────────────────────────────────────────────────────────┘
```

| 속성 | 값 |
|------|----|
| 탭 높이 | 36px |
| 활성 탭 | 하단 border 2px `#2563EB`, 텍스트 `#1E293B`, font-weight 600 |
| 비활성 탭 | 텍스트 `#94A3B8` |
| 단위 토글 | 우측 정렬, 작은 pill 버튼 (24px 높이) |
| 단위 활성 | 배경 `#2563EB`, 텍스트 `#fff` |
| 단위 비활성 | 배경 `#F1F5F9`, 텍스트 `#64748B` |

### 3.2 Preview Body (코드 영역)

| 속성 | 값 |
|------|----|
| 배경 | `#F8FAFC` |
| 폰트 | `'SF Mono', 'Fira Code', monospace` |
| 폰트 크기 | 11px |
| 줄간격 | 1.6 |
| 패딩 | 14px |
| 오버플로우 | y축 스크롤 |
| 최소 높이 | 240px |

### 3.3 CSS Syntax Highlight (정규식 기반, 외부 라이브러리 없음)

| 토큰 | 색상 | 예시 |
|------|------|------|
| CSS 셀렉터 | `#7C3AED` (보라) | `:root`, `[data-theme="dark"]` |
| 속성명 (--변수) | `#2563EB` (파란) | `--color-brand-primary` |
| 속성값 | `#059669` (초록) | `#FF6F0F`, `8px`, `400` |
| 주석 | `#94A3B8` (회색) | `/* PixelForge Tokens */` |
| 중괄호 / 콜론 / 세미콜론 | `#64748B` | `{`, `}`, `:`, `;` |

CSS 탭에서만 적용. JSON 탭은 현재 방식(plain text) 유지.

---

## 4. CSS 변환 규칙 상세

### 4.1 네이밍 — Figma 경로 → CSS 변수명

```
"color/brand/primary"    →  --color-brand-primary
"spacing/gap/sm"         →  --spacing-gap-sm
"border-radius/sm"       →  --border-radius-sm
"font/size/heading"      →  --font-size-heading
```

규칙:
- `/` → `-` 치환
- 특수문자·공백 제거
- 전체 소문자
- 앞에 `--` 붙임

### 4.2 타입별 변환

#### COLOR Variables / Color Styles

```css
/* alpha = 1 → HEX */
--color-brand-primary: #FF6F0F;

/* alpha < 1 → rgba */
--color-overlay: rgba(0, 0, 0, 0.4);
```

#### FLOAT Variables (px 기본, rem 선택)

```css
/* px 모드 */
--spacing-gap-sm: 8px;
--radius-sm: 4px;

/* rem 모드 (÷16) */
--spacing-gap-sm: 0.5rem;
--radius-sm: 0.25rem;
```

#### STRING Variables

```css
--font-family-body: 'Inter', sans-serif;
```

#### BOOLEAN Variables → 생략 (CSS 표현 불가)

#### Text Styles → CSS Class

```css
/* Text Style: "heading/xl" */
.text-heading-xl {
  font-family: 'Inter', sans-serif;
  font-size: 32px;        /* rem 모드: 2rem */
  font-weight: 700;
  line-height: 1.25;      /* lineHeight.unit = PERCENT → value/100 */
  letter-spacing: -0.02em; /* PERCENT 단위 */
  text-transform: none;
  text-decoration: none;
}
```

#### Effect Styles → box-shadow Custom Property

```css
/* DROP_SHADOW / INNER_SHADOW → box-shadow */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);

/* LAYER_BLUR → filter */
--blur-overlay: blur(8px);
```

### 4.3 멀티모드 처리

```
컬렉션 모드가 1개:  → :root { } 블록만 생성
컬렉션 모드가 2개+: → 첫 번째 모드 = :root { }
                       나머지 모드 = [data-theme="{modeName}"] { }
```

```css
/* === light mode (default) === */
:root {
  --color-bg: #FFFFFF;
  --color-text: #1E293B;
}

/* === dark mode === */
[data-theme="dark"] {
  --color-bg: #1C1C1C;
  --color-text: #E2E8F0;
}
```

### 4.4 Alias (Variable 참조) 처리

```
변수 A 값 = { type: "VARIABLE_ALIAS", id: "VariableID:xxx" }
              → Map에서 VariableID:xxx 찾아 재귀 resolve
              → 최대 탐색 깊이: 10 (초과 시 "/* unresolved */" 주석)
```

### 4.5 CSS 파일 상단 주석 헤더

```css
/**
 * PixelForge Design Tokens
 * File: {fileName}
 * Extracted: {ISO date}
 * Types: variables, spacing, colors, texts, effects
 * Generated by PixelForge Token Extractor
 */
```

---

## 5. Action Bar 버튼 스펙

| 버튼 | 동작 | 활성 조건 |
|------|------|---------|
| 📋 복사 | 현재 활성 탭(JSON 또는 CSS) 내용 클립보드 복사 | 항상 |
| ⬇ JSON | JSON 파일 다운로드 (`{name}_tokens.json`) | 항상 |
| ⬇ CSS | CSS 파일 다운로드 (`{name}_tokens.css`) | 항상 |

- 세 버튼 동일 너비 (flex: 1)
- 높이 40px, border-radius 8px
- 복사 버튼: 현재 탭 인식 → "JSON 복사됨" / "CSS 복사됨" 토스트 분기

---

## 6. 컴포넌트 색상 & 타이포그래피

기존 `token-type-filter.design.md` 팔레트 그대로 사용:

| 용도 | 값 |
|------|-----|
| Primary | `#2563EB` |
| Primary Light | `#EFF6FF` |
| Text Primary | `#1E293B` |
| Text Muted | `#94A3B8` |
| Border | `#E2E8F0` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Code BG | `#F8FAFC` |

Syntax highlight 추가 색상:

| 용도 | 값 |
|------|-----|
| CSS Selector | `#7C3AED` |
| CSS Property | `#2563EB` |
| CSS Value | `#059669` |
| CSS Comment | `#94A3B8` |

---

## 7. 구현 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/ui.html` | Preview Panel 탭 UI, 단위 토글, CSS 변환 함수, syntax highlight, 다운로드 분리 |
| `src/code.ts` | 변경 없음 (CSS 변환은 UI에서 처리) |
| `dist/ui.html` | 빌드 결과 자동 생성 |

### CSS 변환 함수 구조 (`ui.html` 내 JS)

```js
// 진입점
function generateCSS(data, unit) { ... }

// 하위 변환기
function convertVariables(variables, collections, unit) { ... }
function convertColorStyles(colors) { ... }
function convertTextStyles(texts, unit) { ... }
function convertEffectStyles(effects) { ... }

// 유틸
function resolveAlias(valuesByMode, varMap) { ... }
function figmaColorToHex(color) { ... }
function figmaColorToRgba(color) { ... }
function toFloat(value, unit) { ... }   // px 또는 rem 변환
function toCssName(figmaPath) { ... }   // "a/b/c" → "--a-b-c"
function highlight(cssText) { ... }     // syntax highlight HTML 생성
```

---

## 8. 화면 전환 다이어그램

```
[filter-view]
    │ 추출 클릭
    ▼
[loading-view]
    │ extract-result 수신
    ▼
[result-view]
    ├─ activeTab = 'json' (기본)
    ├─ unit = 'px' (기본)
    │
    ├─ JSON 탭 클릭 → activeTab = 'json', 미리보기 업데이트
    ├─ CSS 탭 클릭 → activeTab = 'css', CSS 생성 후 미리보기 업데이트
    ├─ px 클릭     → unit = 'px', CSS 탭이면 재생성
    ├─ rem 클릭    → unit = 'rem', CSS 탭이면 재생성
    │
    ├─ 복사 클릭   → 현재 탭 내용 복사, 토스트
    ├─ ⬇ JSON 클릭 → JSON 다운로드
    ├─ ⬇ CSS 클릭  → CSS 생성 후 다운로드
    │
    └─ ← 뒤로 클릭 → [filter-view]
```

---

## 9. 완료 기준 (Design → Do 체크리스트)

- [ ] Result View에 JSON / CSS 탭 전환 UI
- [ ] CSS 탭 활성 시 CSS 미리보기 즉시 표시
- [ ] px / rem 단위 토글 → CSS 재생성
- [ ] COLOR 변수 → HEX / rgba 정확 변환
- [ ] FLOAT 변수 → px / rem 변환
- [ ] Text Styles → `.text-{name}` CSS 클래스
- [ ] Effect Styles → `--shadow-{name}` / `--blur-{name}`
- [ ] 멀티모드 컬렉션 → `:root` + `[data-theme]` 분리
- [ ] Alias 변수 재귀 resolve (깊이 10 제한)
- [ ] Syntax Highlight (셀렉터·속성·값·주석 각 색상)
- [ ] 복사 버튼 → 현재 탭 인식, 토스트 분기
- [ ] ⬇ JSON / ⬇ CSS 버튼 각각 독립 동작
- [ ] CSS 파일 상단 헤더 주석 포함
- [ ] 기존 JSON 기능 영향 없음
