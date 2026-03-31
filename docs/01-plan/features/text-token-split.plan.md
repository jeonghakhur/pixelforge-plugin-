# text-token-split Planning Document

> **Summary**: 추출 탭 카드 기본 비활성화 + Text Styles를 textStyles/headings/fonts로 세분화
>
> **Project**: PixelForge Token Extractor
> **Version**: 0.1.0
> **Author**: jeonghak
> **Date**: 2026-03-31
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 모든 카드가 기본 활성화되어 원하지 않는 토큰까지 추출됨. Text Styles가 하나로 묶여 body/heading/font를 구분 없이 받아 다운스트림 활용이 불편함. |
| **Solution** | 모든 카드를 기본 비활성화로 변경, Text Styles를 textStyles(본문)/headings(제목)/fonts(폰트 패밀리) 3개로 분리. Fonts는 CSS 변수(`--font-*`)로 별도 추출. |
| **Function/UX Effect** | 사용자가 필요한 토큰 타입만 선택해 추출. fonts 카드 선택 시 `--font-display`, `--font-text` 등 폰트 CSS 변수 자동 생성. |
| **Core Value** | 의도적 선택 기반의 추출 경험 제공, 코드에서 바로 사용 가능한 폰트 CSS 변수 생성으로 타이포그래피 통합 자동화. |

---

## 1. Overview

### 1.1 Purpose

1. **카드 기본 비활성화**: 모든 token-card를 기본 off로 시작 → 사용자가 원하는 것만 선택
2. **Text 세분화**: 기존 `texts` 타입을 3개로 분리
   - `textStyles` — 본문/라벨 계열 (Text, Label, Caption, Body, Paragraph 패턴)
   - `headings` — 제목 계열 (Heading, Display, Title, H1~H6 패턴)
   - `fonts` — 고유 폰트 패밀리 → CSS 변수로 출력

### 1.2 Background

현재 상태:
- 모든 6개 카드 (variables, colors, spacing, texts, radius, effects) 기본 `active`
- `texts` 타입 → `getLocalTextStylesAsync()` 전체 반환, 이름 기반 분류 없음
- `src/converters/typography.js`의 `convertTextStyles(texts, unit)`이 `styles.texts` 배열을 직접 사용

변경 필요 이유:
- Airtable 같은 파일에서 18개 Text Styles 전체가 섞여 출력 → 개발자가 직접 분류해야 함
- 폰트 패밀리(SF Pro Text, SF Pro Display 등)를 CSS 변수로 쓰려면 별도 작업 필요

### 1.3 Related Documents

- 참조: `src/code.ts` — `ExtractOptions`, `ExtractedTokens`, `extractAll()`
- 참조: `src/converters/typography.js` — `convertTextStyles()`
- 참조: `src/ui.html` — `.token-card.active`

---

## 2. Scope

### 2.1 In Scope

- [ ] 모든 token-card에서 `active` 클래스 제거 (기본 비활성화)
- [ ] `ExtractOptions.tokenTypes`에 `'textStyles' | 'headings' | 'fonts'` 추가, `'texts'` 유지(하위 호환)
- [ ] `ExtractedTokens.styles`에 `textStyles`, `headings`, `fonts` 필드 추가
- [ ] `extractAll()`에서 이름 패턴으로 text/heading 분류 로직 추가
- [ ] `fonts` 추출: 모든 Text Styles에서 고유 `fontName.family` 수집 → `FontData[]`
- [ ] `typography.js`에 `convertFonts(fonts, unit)` 함수 추가 → CSS 변수 출력
- [ ] `ui.html` token-card 3개 추가 (textStyles, headings, fonts)
- [ ] 결과 화면 stat-card에 textStyles, headings, fonts 추가
- [ ] `ui.js` i18n 문자열 추가

### 2.2 Out of Scope

- 기존 `texts` 타입 제거 — 하위 호환 유지 (캐시 데이터, 기존 JSON 호환)
- `fonts` 타입에서 font-weight 스케일 변수 생성 (`--font-weight-bold` 등) — 2차
- Label / Caption 카테고리 별도 분리 — 2차

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 모든 token-card 기본 비활성화 (`active` 클래스 제거) | High |
| FR-02 | `textStyles` 타입: `HEADING_RE`에 매칭되지 않는 Text Styles 반환 | High |
| FR-03 | `headings` 타입: `HEADING_RE` 매칭 Text Styles 반환 | High |
| FR-04 | `fonts` 타입: 모든 Text Styles(textStyles+headings)에서 고유 fontName.family 수집 → `FontData[]` | High |
| FR-05 | `FontData` 구조: `{ family, cssVar, styles[] }` — cssVar는 family 기반 자동 생성 | High |
| FR-06 | `convertFonts(fonts)` → `:root { --font-{slug}: "{Family}"; }` CSS 출력 | High |
| FR-07 | `typography.js` 기존 `convertTextStyles()` 동작 유지 (하위 호환) | High |
| FR-08 | token-card 3개 추가 (textStyles, headings, fonts), 기존 texts 카드 제거 | Medium |
| FR-09 | 결과 화면 stat-card에 textStyles, headings, fonts 반영 | Medium |

### 3.2 분류 패턴

```
HEADING_RE = /\b(heading|display|title|h[1-6])\b/i

textStyles = 전체 Text Styles에서 HEADING_RE에 매칭되지 않는 것
headings   = 전체 Text Styles에서 HEADING_RE에 매칭되는 것
```

### 3.3 FontData 구조 및 CSS 출력 예시

```typescript
interface FontData {
  family: string;     // "SF Pro Text"
  cssVar: string;     // "--font-sf-pro-text"
  styles: string[];   // ["Regular", "Medium", "Semibold", "Bold"]
}
```

```css
/* fonts 추출 결과 */
:root {
  --font-sf-pro-display: "SF Pro Display";
  --font-sf-pro-text: "SF Pro Text";
}
```

cssVar 생성 규칙: `"SF Pro Text"` → `--font-sf-pro-text` (소문자 + 공백→하이픈)

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 카드 기본 비활성화 확인
- [ ] textStyles / headings 분류가 Airtable 파일 기준 정확한지 확인
  - textStyles: Text/small, Text/default, Label/default (11개)
  - headings: Heading/xsmall, Heading/small, … (7개)
- [ ] fonts 추출 시 `--font-sf-pro-display`, `--font-sf-pro-text` 정확히 생성
- [ ] 기존 `texts` 타입 선택 시 기존 동작 그대로 (하위 호환)
- [ ] `npm run build` 성공

### 4.2 Quality Criteria

- [ ] CSS 변수 사용 (하드코딩 없음)
- [ ] 간격 4px 배수
- [ ] 빌드 성공, lint 오류 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| HEADING_RE 패턴이 파일마다 달라 오분류 | Medium | Medium | 패턴을 넓게 설계, Label은 textStyles로 폴백 |
| 기존 캐시 데이터에 textStyles/headings 없음 | Low | High | `styles.textStyles ?? styles.texts` 폴백 처리 |
| stat-card 추가로 결과 화면 레이아웃 깨짐 | Low | Low | 기존 grid 레이아웃 확인 후 추가 |

---

## 6. Architecture Considerations

### 6.1 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `ExtractOptions` / `ExtractedTokens` 확장, `HEADING_RE` 추가, `extractAll()` 분류 로직 |
| `src/converters/typography.js` | 수정 | `convertFonts()` 신규 함수 추가 |
| `src/ui.html` | 수정 | token-card `active` 제거, 3개 카드 추가, stat-card 3개 추가 |
| `src/ui.js` | 수정 | stat 업데이트 로직, i18n 추가 |

### 6.2 데이터 구조 변경

```typescript
// ExtractOptions 확장 (기존 'texts' 유지)
tokenTypes: Array<
  'variables' | 'colors' | 'spacing' | 'radius' | 'effects' |
  'texts' |           // 하위 호환
  'textStyles' | 'headings' | 'fonts'  // 신규
>

// ExtractedTokens.styles 확장
styles: {
  colors: ColorStyleData[];
  texts: TextStyleData[];       // 하위 호환 (전체)
  textStyles: TextStyleData[];  // 신규 (본문 계열)
  headings: TextStyleData[];    // 신규 (제목 계열)
  fonts: FontData[];            // 신규 (폰트 패밀리)
  effects: EffectStyleData[];
}
```

### 6.3 추출 흐름

```
getLocalTextStylesAsync()
  → all: TextStyleData[]
    → textStyles = all.filter(s => !HEADING_RE.test(s.name))
    → headings   = all.filter(s => HEADING_RE.test(s.name))
    → fonts      = unique fontName.family from all
                   → FontData[] with cssVar
```

---

## 7. Convention Prerequisites

- [x] CLAUDE.md 컨벤션 확인
- [x] ES5 `var` 패턴 (`ui.js`), TypeScript strict (`code.ts`)
- [x] CSS 변수 사용 원칙

---

## 8. Next Steps

1. [ ] `/pdca design text-token-split` — 상세 함수 설계
2. [ ] `convertFonts()` 및 분류 로직 구현
3. [ ] UI 카드/stat 변경

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-31 | Initial draft |
