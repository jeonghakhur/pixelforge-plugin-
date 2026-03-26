# Plan: CSS Generation

> **Summary**: 추출된 디자인 토큰 JSON을 CSS Custom Properties / 클래스로 변환하여 미리보기 및 다운로드 제공
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.1.0
> **Date**: 2026-03-26
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | JSON을 추출해도 실제 코드에 적용하려면 개발자가 직접 CSS로 변환해야 하는 수작업이 남음 |
| **Solution** | 추출 결과 화면에 CSS 탭을 추가해 Custom Properties 형태로 자동 변환 후 미리보기·다운로드 제공 |
| **Function/UX Effect** | 디자이너가 Figma → CSS 파일까지 직접 완성 가능. 개발 핸드오프 시간 단축 |
| **Core Value** | PixelForge 파이프라인의 마지막 구간(토큰 → 코드) 을 플러그인 안에서 완결 |

---

## 1. 개요

### 1.1 목적

추출된 디자인 토큰(Variables, Styles)을 즉시 사용 가능한 CSS 파일로 변환한다.
결과 화면에서 JSON / CSS 탭으로 전환하여 미리보기하고, 각 포맷을 개별 다운로드할 수 있다.

### 1.2 배경

현재 플러그인은 JSON 추출까지 지원하지만, 실제 프론트엔드 프로젝트에 적용하려면:
1. JSON을 열어 값을 확인
2. 수작업으로 `:root { --token: value; }` 형태로 변환
3. CSS 파일에 붙여넣기

이 과정을 플러그인이 자동화하면 핸드오프 단계가 사라진다.

### 1.3 관련 문서

- `docs/01-plan/features/token-type-filter.plan.md` — 선행 기능
- `docs/02-design/features/token-type-filter.design.md` — UI 구조 참조

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] CSS Custom Properties 생성 (`--token-name: value`)
- [ ] Text Styles → CSS 클래스 (`.text-{name}`)
- [ ] Effect Styles → `box-shadow` Custom Property
- [ ] 결과 화면 탭 전환: `JSON` | `CSS`
- [ ] CSS 파일 다운로드 (`{파일명}_tokens.css`)
- [ ] 멀티모드 지원 (모드가 2개 이상이면 `[data-theme="dark"]` 블록 생성)
- [ ] 단위 선택: `px` (기본) / `rem`
- [ ] Variable 값 별칭(Alias) 처리: 최종 resolved 값으로 출력

### 2.2 Out of Scope

- SCSS / Less 포맷 출력 — 후속 작업
- Tailwind CSS config 변환 — 후속 작업
- Icons → CSS (SVG 원본 없으므로 불가)
- CSS-in-JS (styled-components, Emotion) 변환 — 후속 작업

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 결과 화면에 JSON / CSS 탭 전환 UI 추가 | 필수 |
| FR-02 | Variables(COLOR) → `--{path}: {hex/rgba}` Custom Property | 필수 |
| FR-03 | Variables(FLOAT) → `--{path}: {value}px` Custom Property | 필수 |
| FR-04 | Color Styles → `--color-{name}: {hex}` Custom Property | 필수 |
| FR-05 | Text Styles → `.text-{name} { font-size, font-weight, line-height, ... }` | 필수 |
| FR-06 | Effect Styles → `--shadow-{name}: {box-shadow-value}` Custom Property | 필수 |
| FR-07 | 멀티모드 감지: 모드 2개 이상이면 첫 번째는 `:root`, 나머지는 `[data-theme="{name}"]` | 필수 |
| FR-08 | 단위 토글: `px` / `rem` (rem 선택 시 16 기준 나눔) | 필수 |
| FR-09 | Alias 변수 처리: `{VariableID:x}` 형태 값을 실제 값으로 resolve | 필수 |
| FR-10 | CSS 파일 다운로드: `{fileName}_tokens.css` | 필수 |
| FR-11 | CSS 미리보기 syntax 하이라이트 (CSS 키워드 색상) | 선택 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 변환 성능 | 1,000개 토큰 이하: 즉시 (< 100ms) |
| 네이밍 | Figma 변수 경로의 `/` → `-` 치환, 특수문자 제거 |
| 멱등성 | 동일 JSON 입력 → 항상 동일 CSS 출력 |
| 플러그인 제약 | 외부 라이브러리 없음, 순수 JS 구현 |

---

## 4. 설계 방향

### 4.1 CSS 변환 규칙

#### 네이밍 — Figma 경로 → CSS 변수명

```
Figma 변수명: "color/brand/primary"
CSS 변수명:   --color-brand-primary

Figma 변수명: "spacing/gap/sm"
CSS 변수명:   --spacing-gap-sm
```

#### COLOR 변수 → CSS

```css
/* Figma: { r: 1, g: 0.435, b: 0.059, a: 1 } */
--color-brand-primary: #FF6F0F;
```

#### FLOAT 변수 → CSS (px 기본)

```css
--spacing-gap-sm: 8px;
--radius-sm: 4px;
```

#### Text Style → CSS class

```css
.text-heading-xl {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
}
```

#### Effect Style → Custom Property

```css
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
```

#### 멀티모드 블록

```css
/* 모드: light (기본) */
:root {
  --color-bg: #FFFFFF;
  --color-text: #1E293B;
}

/* 모드: dark */
[data-theme="dark"] {
  --color-bg: #1C1C1C;
  --color-text: #E2E8F0;
}
```

### 4.2 Alias 처리 — Variable 참조 resolve

Figma에서 변수 값이 다른 변수를 참조하는 경우:
```
{ type: "VARIABLE_ALIAS", id: "VariableID:2032:1037" }
```
→ 해당 변수의 실제 값을 재귀 탐색하여 최종 raw 값으로 출력.

### 4.3 결과 화면 탭 구조

```
┌─────────────────────────────────────┐
│  Header  [← 뒤로]                   │
├─────────────────────────────────────┤
│  [ Stat Cards ]                     │
│  [ Meta Info ]                      │
│  ┌─ [JSON] [CSS] ──────────────────┐ │
│  │                                 │ │  ← 탭 전환
│  │  { ... } / :root { ... }        │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  [📋 복사] [⬇ JSON] [⬇ CSS]        │
└─────────────────────────────────────┘
```

### 4.4 단위 선택 UI

CSS 탭 상단에 작은 토글 배치:
```
단위: [px] [rem]
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| CSS 생성 위치 | UI (browser JS) | code.ts는 JSON만 생성, 변환 로직은 UI에서 수행 |
| Alias resolve | UI에서 Map 구축 후 resolve | Figma API 재호출 없이 추출된 JSON만으로 처리 가능 |
| Syntax highlight | 간단한 정규식 + span 색상 | 외부 라이브러리 불가 제약으로 직접 구현 |
| 색상 포맷 | HEX (불투명) / rgba (반투명) | 가장 보편적인 CSS 색상 포맷 |

---

## 6. 완료 기준

- [ ] JSON / CSS 탭 전환이 동작함
- [ ] Variables(COLOR) → hex CSS Custom Property 정확히 변환
- [ ] Variables(FLOAT) → px CSS Custom Property 변환
- [ ] Text Styles → CSS 클래스 생성
- [ ] Effect Styles → box-shadow Custom Property 변환
- [ ] 멀티모드 감지 및 `[data-theme]` 블록 생성
- [ ] Alias 변수 resolve (참조 순환 없을 때)
- [ ] `px` / `rem` 토글 동작
- [ ] CSS 파일 다운로드 (`tokens.css`)
- [ ] 기존 JSON 기능 영향 없음

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Alias 순환 참조 | 무한 루프 | resolve 최대 깊이 10으로 제한 |
| 모드 이름 충돌 | CSS 셀렉터 오류 | 모드명 sanitize (영문 소문자 + 하이픈) |
| FLOAT 값 맥락 불명 | spacing인지 opacity인지 구분 불가 | 네이밍 경로를 그대로 변수명에 반영, 맥락 힌트 주석 추가 |
| 많은 수의 Text Style | CSS 파일 과대 | 선택된 타입만 변환 (기존 칩 필터와 연동) |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 (`css-generation.design.md`)
2. [ ] UI 탭 구조 스펙 확정
3. [ ] CSS 변환 함수 구현
