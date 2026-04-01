## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | HTML 모드 컴포넌트 생성 시 `nodeToHtml()`이 모든 노드에 `style="..."` 인라인 스타일을 삽입한다. Figma 토큰 CSS 변수도 별도 파일로 분리되지 않아 컴포넌트와 토큰 스타일이 뒤섞인다 |
| **Solution** | `nodeToHtml()`이 class 기반 마크업을 생성하고 스타일을 별도 CSS 파일로 추출. 추출된 토큰 CSS 변수는 `global.css`로 묶어 컴포넌트 CSS와 분리 |
| **Function/UX Effect** | HTML 생성 결과물이 `컴포넌트.html` + `컴포넌트.css` + `global.css` 3파일로 분리되어, 실제 프로젝트에 붙여넣기 가능한 수준의 클린 코드 제공 |
| **Core Value** | 인라인 스타일 제거 → 유지보수 가능한 CSS 구조 + 토큰 기반 전역 스타일 분리 → 디자인 시스템 연동 기반 마련 |

---

# Plan: Component CSS Separation — HTML 모드 인라인 스타일 분리

> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.5.0
> **Date**: 2026-04-01
> **Status**: Draft

---

## 1. 개요

### 1.1 목적

HTML 모드로 컴포넌트 생성 시 인라인 `style="..."` 방식을 제거하고, 스타일을 외부 CSS 파일로 분리한다.
Figma에서 추출된 토큰(CSS 변수)은 `global.css`로 처리하여 컴포넌트 CSS와 역할을 분리한다.

### 1.2 현재 문제 분석

**문제 흐름:**

```
code.ts: nodeToHtml()
  → style="background-color: var(--color-primary); padding: 12px 16px; ..."  ← 인라인
  → <div style="..."><div style="...">...</div></div>   ← 중첩 인라인
  
ui.js: styleMode === 'html'
  → tsx = d.html  (인라인 스타일 그대로)
  → css = ''      ← CSS 파일이 비어있음
  
buildComponentFiles(): 'html' 모드
  → name.html (인라인 스타일 포함)
  → name.css  (빈 파일)
```

**결과물 품질 문제:**
1. 인라인 스타일은 CSS 변수를 사용하더라도 재사용/오버라이드 불가
2. Figma 토큰 CSS 변수가 어디서 정의되는지 알 수 없음 (`global.css` 없음)
3. 컴포넌트 복사 시 스타일이 통째로 엮여 있어 분리 불가

### 1.3 관련 파일

| 파일 | 역할 |
|------|------|
| `src/code.ts` | `nodeToHtml()` — 인라인 스타일 생성 원점 |
| `src/ui.js` | HTML 모드 분기 처리 (`css = ''`) |
| `src/ui/tab-component.js` | `buildComponentFiles()` — 파일 목록 생성 |
| `src/ui/tab-extract.js` | 토큰 CSS 생성 (`generateCSS()`) |

---

## 2. 설계 방향

### 2.1 HTML 스타일 모드 선택 옵션

HTML 모드 내에 **서브 옵션**으로 두 가지 스타일 방식을 제공한다:

| 옵션 | 설명 | 결과물 |
|------|------|--------|
| **CSS 파일 분리** (기본) | class 기반 마크업 + 별도 `.css` 파일 | `button.html` + `button.css` |
| **인라인 스타일** | 기존 방식 유지 (`style="..."`) | `button.html` (단일 파일) |

UI에서 토글 버튼으로 선택 가능하게 한다. 상태는 `compState.htmlStyleMode`로 관리.

### 2.2 CSS 파일 분리 모드 — 인라인 스타일 → CSS 클래스 추출

`nodeToHtml()`이 각 노드에 자동 클래스명 부여 + 스타일을 CSS로 추출.

**Before:**
```html
<div style="display: flex; background-color: var(--color-primary); padding: 12px 16px; border-radius: 8px;">
  <span>Click me</span>
</div>
```

**After (HTML 파일):**
```html
<div class="root">
  <span class="label">Click me</span>
</div>
```

**After (CSS 파일 — `button.css`):**
```css
.root {
  display: flex;
  background-color: var(--color-primary);
  padding: 12px 16px;
  border-radius: 8px;
}

.label {
  /* (텍스트 노드는 CSS 없음) */
}
```

### 2.3 토큰 CSS → global.css

Figma Variables에서 추출된 CSS 변수 정의를 `global.css`로 별도 제공.

**global.css 예시:**
```css
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-surface: #ffffff;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --radius-md: 8px;
  /* ... 토큰에서 추출된 모든 CSS 변수 */
}
```

**CSS 파일 분리 모드 결과물 (3파일):**
```
button.html     ← class 기반 마크업
button.css      ← 컴포넌트 전용 스타일 (CSS 변수 참조)
global.css      ← 토큰 변수 정의 (:root)
```

**인라인 모드 결과물 (1파일, 기존 방식):**
```
button.html     ← style="..." 인라인 포함
```

---

## 3. 구현 범위

### 3.1 In Scope

- [ ] **FR-01**: HTML 모드 UI에 스타일 방식 토글 추가 (CSS 파일 분리 / 인라인)
- [ ] **FR-02**: `compState.htmlStyleMode` 상태 추가 (`'separated'` | `'inline'`)
- [ ] **FR-03**: `nodeToHtml()` 리팩터: class 기반 마크업 + CSS 맵 반환 (`separated` 모드)
- [ ] **FR-04**: `code.ts` `generateComponent()` 반환 타입에 `htmlCss: string` 추가
- [ ] **FR-05**: `ui.js` HTML 모드 분기: `htmlStyleMode`에 따라 `css` 값 결정
- [ ] **FR-06**: `buildComponentFiles()` — separated 모드 css 파일에 실제 CSS 채우기
- [ ] **FR-07**: `tab-extract.js` 또는 `tab-component.js`에서 `global.css` 생성 함수 추가
- [ ] **FR-08**: UI에 "global.css 복사/다운로드" 버튼 추가 (HTML 분리 모드 한정)
- [ ] **FR-09**: PixelForge 전송 시 `global.css` 파일도 포함 (분리 모드 한정)

### 3.2 Out of Scope

- CSS Modules 모드 변경 없음 (이미 별도 `.module.css` 파일로 분리됨)
- Styled-Components 모드 변경 없음
- CSS 선택자를 BEM/SMACSS 등 특정 방법론으로 강제하지 않음
- Figma 모드별(Light/Dark) CSS 변수 분리 → 별도 feature

---

## 4. 요구사항

### 4.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | HTML 모드 UI에 "CSS 파일 분리 / 인라인" 토글 버튼 | 필수 |
| FR-02 | 인라인 모드: 기존 `style="..."` 방식 유지 | 필수 |
| FR-03 | CSS 분리 모드: HTML 출력에 `style=` 속성 없음, class 기반 | 필수 |
| FR-04 | CSS 분리 모드: 컴포넌트 CSS 파일에 class별 스타일 정의 포함 | 필수 |
| FR-05 | CSS 변수(`var(--*)`)는 컴포넌트 CSS에서 참조, 정의는 global.css | 필수 |
| FR-06 | global.css는 추출된 토큰 기반 `:root { }` 블록 | 필수 |
| FR-07 | global.css 복사/다운로드 UI 제공 (CSS 분리 모드 한정) | 선택 |
| FR-08 | PixelForge 전송 payload에 global.css 포함 (CSS 분리 모드 한정) | 선택 |

### 4.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 하위 호환 | CSS Modules / Styled 모드 동작 변경 없음 |
| 클래스명 안정성 | 같은 Figma 노드 → 항상 같은 클래스명 생성 |
| CSS 변수 참조 | 모든 색상값은 `var(--*)` 형태 유지 (하드코딩 금지) |
| 빌드 | `npm run build` 성공 |

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 클래스명 생성 | 노드 인덱스 기반 (`root`, `child-N`, `text-N`) | 노드명이 한글/특수문자 포함 가능 → 안전한 ASCII 클래스명 |
| 스타일 추출 위치 | `code.ts` `nodeToHtml()` 내부 → 호출자에게 맵으로 반환 | Figma API는 code.ts에서만 접근 가능 |
| global.css 생성 | `tab-extract.js`의 기존 `generateCSS()` 결과 재활용 | 중복 구현 방지, 추출 탭과 동기화 |
| 클래스명 충돌 방지 | 컴포넌트명을 prefix로 사용 (옵션) | 여러 컴포넌트를 한 페이지에서 사용 시 충돌 방지 |

---

## 6. 구현 순서

| 순서 | 작업 | 파일 | 난이도 |
|------|------|------|--------|
| 1 | `compState.htmlStyleMode` 추가 + UI 토글 버튼 (인라인 / CSS 분리) | `src/ui.html`, `src/ui/tab-component.js` | 낮음 |
| 2 | `nodeToHtml()` 분기: `separated` 모드 시 `{ html, cssMap }` 반환 | `src/code.ts` | 중간 |
| 3 | `generateComponent()` 반환 타입에 `htmlCss: string` 추가 | `src/code.ts` | 낮음 |
| 4 | `ui.js` HTML 모드 분기: `htmlStyleMode`에 따라 `css` 결정 | `src/ui.js` | 낮음 |
| 5 | `buildComponentFiles()` — separated 모드 css 파일 콘텐츠 채우기 | `src/ui/tab-component.js` | 낮음 |
| 6 | `getGlobalCss()` 헬퍼: 추출된 토큰 → `:root { }` CSS | `src/ui/tab-component.js` | 중간 |
| 7 | global.css 복사 버튼 추가 (CSS 분리 모드 한정) | `src/ui.html`, `src/ui/tab-component.js` | 낮음 |
| 8 | PixelForge 전송 payload에 global.css 포함 | `src/ui.js` | 낮음 |

---

## 7. 완료 기준

- [ ] HTML 모드 UI에 인라인 / CSS 분리 토글 버튼 동작
- [ ] 인라인 모드: 기존과 동일하게 `style="..."` 출력
- [ ] CSS 분리 모드: `style=` 속성 없이 class 기반 HTML 출력
- [ ] CSS 분리 모드: `컴포넌트.css`에 class별 스타일 정의 포함
- [ ] CSS 변수 참조(`var(--*)`) 유지
- [ ] `global.css` 복사/다운로드 가능 (CSS 분리 모드)
- [ ] CSS Modules / Styled 모드 동작 변화 없음
- [ ] `npm run build` 성공

---

## 8. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `nodeToHtml()` 재귀 구조 변경 시 CSS 맵 병합 복잡성 | 중간 | 클로저 방식으로 cssMap을 공유 상태로 관리 |
| 클래스명 충돌 (여러 컴포넌트 동시 사용 시) | 낮음 | 컴포넌트명 prefix 옵션 제공 |
| global.css에 추출 데이터가 없을 경우 | 낮음 | 빈 `:root {}` 블록 또는 안내 주석 출력 |
