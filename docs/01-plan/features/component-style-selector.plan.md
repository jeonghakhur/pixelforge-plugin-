# Plan: Component Style Selector

> **Summary**: 컴포넌트 코드 생성 시 스타일 출력 방식(Inline / Tailwind / CSS / Styled-Components)을 선택할 수 있게 하여 각 팀의 기술 스택에 맞는 코드를 생성
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.1.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 코드 생성은 Inline Style만 지원해 Tailwind/CSS/Styled-Components 팀은 직접 변환 작업이 필요 |
| **Solution** | 출력 언어 선택 UI 옆에 스타일 방식 선택기를 추가하고, 각 방식에 맞는 코드 생성 로직을 구현 |
| **Function/UX Effect** | 선택한 스타일 방식이 코드에 즉시 반영돼 팀별 세팅 없이 바로 사용 가능한 코드 획득 |
| **Core Value** | 단일 Figma 소스에서 여러 기술 스택의 코드를 원클릭으로 생성 — 핸드오프 마찰 제거 |

---

## 1. 개요

### 1.1 목적

컴포넌트 코드 생성 시 스타일 출력 방식을 4가지 중 선택할 수 있게 한다.

| 방식 | 출력 형태 |
|------|----------|
| **Inline** | `style="display: flex; gap: 8px;"` (현재 방식) |
| **Tailwind** | `className="flex gap-2"` |
| **CSS** | 별도 `.css` 클래스 + `className="comp-wrapper"` |
| **Styled** | `styled.div` 컴포넌트 (React 전용) |

### 1.2 배경

현재 플러그인은 Inline Style만 생성한다. 실무에서는:
- Tailwind 프로젝트: Inline 코드를 유틸리티 클래스로 수작업 변환
- CSS 모듈 프로젝트: 별도 CSS 파일 수작업 작성
- Styled-Components 프로젝트: `styled.div` 형태로 수작업 변환

이 작업을 플러그인이 자동화하면 핸드오프 과정이 완결된다.

### 1.3 UI 개선 사항 (함께 처리)

- **"JSON 저장" 버튼 텍스트 오류**: 컴포넌트 코드를 저장하는 버튼인데 "JSON 저장"으로 표기됨 → "코드 저장"으로 변경
- **3단계 설명 텍스트 오류**: "생성된 코드 복사 또는 JSON 저장" → "생성된 코드 복사 또는 파일 저장"

### 1.4 관련 문서

- `docs/01-plan/features/css-generation.plan.md` — CSS 변환 방향 참조

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] 스타일 방식 선택 UI (Inline / Tailwind / CSS / Styled 버튼 그룹)
- [ ] Inline Style 코드 생성 (기존 로직 유지)
- [ ] Tailwind CSS 클래스 코드 생성 (Figma 값 → Tailwind 유틸리티 매핑)
- [ ] Traditional CSS 코드 생성 (`.{component-name} { ... }` + HTML `class=""`)
- [ ] Styled-Components 코드 생성 (React 전용, Styled 선택 시 언어 자동 React 고정)
- [ ] "JSON 저장" → "코드 저장" 텍스트 수정
- [ ] 다국어 키 추가 (한/영)

### 2.2 Out of Scope

- Tailwind v4 설정 파일 생성 — 후속 작업
- CSS Modules (`.module.css`) 별도 지원 — CSS 방식으로 대체 가능
- Emotion / Stitches 등 기타 CSS-in-JS — 후속 작업
- Figma Design Token → Tailwind config 변환 — css-generation 플랜과 별도

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 스타일 방식 선택 UI (4개 버튼: Inline / Tailwind / CSS / Styled) | 필수 |
| FR-02 | Inline: 현재 방식 그대로 유지 | 필수 |
| FR-03 | Tailwind: Figma 값 → Tailwind 유틸리티 클래스 변환 테이블 구현 | 필수 |
| FR-04 | CSS: `.{컴포넌트명} { ... }` 클래스 + HTML/React에 `class/className` 적용 | 필수 |
| FR-05 | Styled: `styled.{태그}` 형태 생성, React 언어 고정 | 필수 |
| FR-06 | Styled 선택 시 HTML 버튼 비활성화 및 React 자동 선택 | 필수 |
| FR-07 | CSS 방식 선택 시 결과 영역에 HTML/JSX 탭 + CSS 탭 함께 표시 | 필수 |
| FR-08 | "JSON 저장" 버튼 텍스트 → "코드 저장" 수정 | 필수 |
| FR-09 | 스타일 선택 상태 유지 (탭 전환 후 복귀 시 유지) | 선택 |
| FR-10 | i18n: 스타일 방식 레이블 한/영 추가 | 필수 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 변환 성능 | 복잡한 컴포넌트(30개 속성) 기준 즉시 (< 50ms) |
| 외부 의존성 | 없음 (순수 JS 구현) |
| Tailwind 버전 | v3 기준 유틸리티 클래스 우선 |

---

## 4. 설계 방향

### 4.1 UI 레이아웃 변경

```
현재:
  출력 언어: [HTML] [React]          [✓ TypeScript]

변경 후:
  출력 언어:  [HTML] [React]          [✓ TypeScript]
  스타일:     [Inline] [Tailwind] [CSS] [Styled]
```

Styled 선택 시:
```
  출력 언어:  [HTML(비활)] [React ✓]   [✓ TypeScript]
  스타일:     [Inline] [Tailwind] [CSS] [Styled ✓]
```

### 4.2 Tailwind 값 매핑 전략

Figma 픽셀 값을 Tailwind 기본 스케일로 매핑:

```
display: flex       → flex
flex-direction: row → flex-row
gap: 8px            → gap-2   (4px 단위: 8/4=2)
gap: 16px           → gap-4
width: 100%         → w-full
padding: 12px       → p-3
border-radius: 8px  → rounded-lg
```

**매핑 범위**: display, flex 속성, gap, padding, margin, width, height, border-radius, font-size, font-weight, color (bg-/text-)

**미매핑 값 처리**: Tailwind 스케일에 없는 값은 `[arbitrary]` 문법 사용
```
gap: 15px → gap-[15px]
```

### 4.3 CSS 방식 출력 구조

```css
/* 생성된 CSS 클래스 */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 348px;
}
```

```html
<!-- HTML 코드 -->
<div class="wrapper">
  <span>The quick brown fox</span>
</div>
```

결과 탭: `[HTML/JSX]` `[CSS]` — CSS 탭에 클래스 코드 별도 표시

### 4.4 Styled-Components 출력 구조

```tsx
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 348px;
`;

export const Component = () => (
  <Wrapper>
    <span>The quick brown fox</span>
  </Wrapper>
);
```

### 4.5 코드 생성 분기 구조

```
generateCode(node, lang, styleMode, useTs)
  ├─ styleMode === 'inline'   → generateInline(node, lang, useTs)   // 기존
  ├─ styleMode === 'tailwind' → generateTailwind(node, lang, useTs)
  ├─ styleMode === 'css'      → generateCSS(node, lang, useTs)
  └─ styleMode === 'styled'   → generateStyled(node, useTs)
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 생성 위치 | UI (브라우저 JS) | code.ts는 Figma 데이터 추출만 담당 |
| Tailwind 매핑 | 정적 룩업 테이블 | 외부 라이브러리 불가, 주요 값만 커버 |
| 미매핑 값 | `[arbitrary]` 문법 | Tailwind v3 공식 지원, 값 손실 없음 |
| CSS 클래스명 | 노드명 소문자 + 하이픈 | 예측 가능한 네이밍 |
| Styled 언어 고정 | React 자동 선택 | styled-components는 React 전용 |

---

## 6. 완료 기준

- [ ] 스타일 방식 선택 UI 4개 버튼 동작
- [ ] Inline: 기존과 동일한 코드 생성
- [ ] Tailwind: display/flex/gap/padding/radius 매핑 정확
- [ ] Tailwind: 미매핑 값은 `[arbitrary]` 문법 적용
- [ ] CSS: `.클래스명 {}` + HTML/JSX `class/className` 쌍 생성
- [ ] CSS: 결과 영역에 HTML/JSX + CSS 탭 분리 표시
- [ ] Styled: `styled.div` 형태 코드 생성 + React 자동 고정
- [ ] "JSON 저장" → "코드 저장" 텍스트 수정 완료
- [ ] 한/영 다국어 키 추가

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Tailwind 스케일 미매핑 케이스 다수 | 가독성 낮은 arbitrary 클래스 | 주요 스케일(4px 단위) 우선 커버, arbitrary는 fallback |
| 노드 중첩이 깊을 경우 클래스명 충돌 | CSS 방식에서 스타일 오버라이드 | 컴포넌트명 prefix 추가 (`{compName}-{nodeName}`) |
| Styled + HTML 선택 상태에서 방식 변경 | UI 상태 불일치 | Styled 선택 즉시 HTML 버튼 비활성화 + React 선택 |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 (`component-style-selector.design.md`)
2. [ ] Tailwind 매핑 테이블 초안 작성
3. [ ] generateCode 분기 함수 구현
4. [ ] CSS 방식 결과 탭 UI 추가
