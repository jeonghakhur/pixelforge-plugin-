# Plan: icon-search-preview

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | icon-search-preview |
| 작성일 | 2026-03-30 |
| 상태 | Plan |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | 아이콘이 36개 이상 추출되면 원하는 아이콘을 찾기 위해 전체를 스크롤해야 하며, SVG 소스를 보려면 별도 에디터가 필요하고, 색상 하드코딩으로 다크/라이트 테마 대응이 불가능함 |
| **Solution** | 실시간 키워드 검색으로 아이콘 필터링, 클릭 시 SVG 소스 인라인 프리뷰, currentColor 기반 CSS 색상 변환으로 테마 대응 지원 |
| **Function UX Effect** | 검색창 입력 즉시 그리드 필터링 / 아이콘 클릭 → 소스 패널 슬라이드 인 / 컬러 피커 → CSS 변수 자동 생성 |
| **Core Value** | 개발자가 Figma에서 아이콘을 추출하고 테마 대응 CSS까지 즉시 얻어 코드에 바로 붙여넣을 수 있는 원스톱 워크플로우 제공 |

---

## 1. 기능 요구사항

### 1.1 아이콘 키워드 검색

**목표**: 아이콘 탭에서 이름으로 즉시 필터링

**요구사항**:
- 검색 입력창 추가 (아이콘 그리드 위)
- 입력 즉시(debounce 150ms) 아이콘 이름 기준 필터링
- 대소문자 무시, 부분 일치
- 검색 결과 없을 때 "검색 결과 없음" 메시지 표시
- 결과 건수 표시 (예: "36개 중 5개")
- 검색어 초기화 버튼(×)

**UI 위치**: 기존 `전체 추출 / 선택 추출` 버튼과 `전체 아이콘 추출하기` 버튼 사이

### 1.2 아이콘 소스 미리보기

**목표**: 아이콘 클릭 시 SVG 소스 인라인 표시

**요구사항**:
- 아이콘 카드 클릭 → 하단 상세 패널 펼침
- 패널 내용:
  - SVG 렌더링 프리뷰 (실제 아이콘 표시)
  - SVG 소스 코드 (syntax highlight)
  - React 컴포넌트 코드
  - CSS 코드 (색상 변환 결과 포함)
- 각 소스에 복사 버튼
- 다른 아이콘 클릭 시 패널 교체 (toggle: 같은 아이콘 클릭 시 닫기)

**데이터**: 이미 `exportIconsAll()`이 `svg` 문자열을 반환하므로 추가 Figma API 호출 불필요

### 1.3 아이콘 색상 변경 + CSS 코드

**목표**: fill/stroke 색상을 CSS 변수 또는 currentColor로 교체하여 테마 대응 가능한 코드 생성

**요구사항**:

**색상 모드 3가지**:
1. `currentColor` (기본) — `fill="currentColor"` 로 치환 → 부모 `color` CSS 속성 상속
2. CSS 변수 — 사용자 입력 변수명 (예: `--icon-color`) → `fill="var(--icon-color)"`
3. 커스텀 색상 — 컬러 피커로 직접 지정 → 해당 hex로 치환

**출력 형식**:
```css
/* currentColor 모드 */
.icon-arrow { color: var(--color-primary); }

/* CSS 변수 모드 */
.icon-arrow { --icon-color: var(--color-primary); }
```

**SVG 변환 로직** (UI 레이어에서 처리):
- SVG 문자열에서 `fill="#XXXXXX"`, `stroke="#XXXXXX"` 값을 선택된 모드로 치환
- `fill="none"` / `fill="transparent"` 는 유지

**테마 대응**:
- `currentColor` 사용 시 다크/라이트 테마 모두 대응
- CSS 출력에 `:root`, `[data-theme="dark"]` 예시 코드 제공 옵션

---

## 2. 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 성능 | 검색 필터링 응답 < 50ms (클라이언트 사이드) |
| SVG 변환 | 추가 Figma API 호출 없음 (이미 추출된 SVG 재사용) |
| 번들 크기 | 외부 라이브러리 추가 없음 (Figma iframe 제약) |
| 코드 스타일 | TypeScript strict, `any` 금지 원칙 유지 |
| 하위 호환 | 기존 아이콘 탭 기능(전체/선택 추출, 다운로드) 동작 유지 |

---

## 3. 범위 (In / Out)

### In Scope
- [x] 실시간 키워드 검색 + 필터링
- [x] 아이콘 클릭 → SVG 소스 + React 코드 프리뷰
- [x] `currentColor` / CSS변수 / 커스텀 색상 모드 전환
- [x] CSS 코드 자동 생성 및 복사
- [x] 테마별 CSS 예시 출력 (선택)

### Out of Scope
- [ ] 아이콘 즐겨찾기/태그 시스템
- [ ] 다수 아이콘 일괄 색상 변경 export
- [ ] Figma 노드 실시간 색상 편집(Figma API write)

---

## 4. 기술 접근 방식

### 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/ui.js` | 검색 UI, 상세 패널, 색상 모드 UI 추가 |
| `src/code.ts` | 변경 없음 (SVG는 이미 추출됨) |

### SVG 색상 치환 로직 (UI 레이어)

```javascript
function replaceSvgColor(svg, mode, customValue) {
  if (mode === 'currentColor') {
    return svg
      .replace(/fill="(?!none|transparent)[^"]+"/g, 'fill="currentColor"')
      .replace(/stroke="(?!none|transparent)[^"]+"/g, 'stroke="currentColor"');
  }
  if (mode === 'cssVar') {
    return svg
      .replace(/fill="(?!none|transparent)[^"]+"/g, `fill="var(${customValue})"`)
      .replace(/stroke="(?!none|transparent)[^"]+"/g, `stroke="var(${customValue})"`);
  }
  // custom hex
  return svg
    .replace(/fill="(?!none|transparent)[^"]+"/g, `fill="${customValue}"`)
    .replace(/stroke="(?!none|transparent)[^"]+"/g, `stroke="${customValue}"`);
}
```

### 검색 상태 관리

```javascript
// 전역 상태 (ui.js 내부)
let allIcons = [];           // 추출된 전체 아이콘
let filteredIcons = [];      // 검색 결과
let selectedIcon = null;     // 현재 선택된 아이콘
let colorMode = 'currentColor'; // 'currentColor' | 'cssVar' | 'custom'
let colorValue = '--icon-color'; // CSS 변수명 or hex
```

---

## 5. UI 레이아웃 변경

```
[아이콘 탭]
┌──────────────────────────────────────────────┐
│ [전체 추출] [선택 추출]                          │
│ ┌────────────────────────────┐                │
│ │ 🔍 아이콘 검색...      [×] │  ← 신규        │
│ └────────────────────────────┘                │
│ [전체 아이콘 추출하기]                           │
│                                              │
│ 추출 결과 (5/36개)          [전체 SVG 다운로드]  │
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │  →   │ │  →   │ │  →   │  ← 그리드         │
│ │ Icon │ │ Icon │ │ Icon │                  │
│ └──────┘ └──────┘ └──────┘                  │
│                                              │
│ ▼ [선택된 아이콘: Icon/06]  ← 신규 상세 패널    │
│ ┌──────────────────────────────────────────┐ │
│ │ 색상 모드: [currentColor▼] [컬러피커]      │ │
│ │                                          │ │
│ │ [SVG] [React] [CSS]   ← 탭              │ │
│ │ <svg viewBox="0 0 24 24">               │ │
│ │   <path fill="currentColor" .../>        │ │
│ │ </svg>                    [복사]         │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 6. 구현 순서

1. **검색 UI** — 검색 입력창 + 필터 로직
2. **상세 패널** — 아이콘 클릭 이벤트 + 소스 탭 UI
3. **색상 변환** — `replaceSvgColor()` 함수 + 모드 전환 UI
4. **CSS 생성** — CSS 코드 출력 + 복사 기능
5. **i18n** — ko/en 문자열 추가

---

## 7. 완료 기준 (DoD)

- [ ] 검색창에서 키워드 입력 시 아이콘 그리드 즉시 필터링
- [ ] 아이콘 클릭 시 SVG / React / CSS 소스 프리뷰 표시
- [ ] `currentColor` 모드에서 SVG 색상이 모두 `currentColor`로 치환
- [ ] CSS 변수 모드에서 사용자 입력 변수명이 SVG에 반영
- [ ] CSS 코드 탭에서 테마 대응 스타일 예시 출력
- [ ] 기존 아이콘 추출/다운로드 기능 정상 동작
- [ ] KO/EN 양쪽 언어 문자열 완비
