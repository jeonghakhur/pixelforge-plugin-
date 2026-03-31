# visual-frame-parser Planning Document

> **Summary**: pre-Variables era Figma 파일의 시각 문서 프레임에서 Spacing/Color 토큰을 노드 파싱으로 추출
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
| **Problem** | Figma Variables 도입 이전 파일(pre-Variables era)은 Spacing/Radius/Color를 API 구조체가 아닌 캔버스 프레임으로 문서화함. 현재 플러그인은 이 파일에서 Spacing 0개, Radius 0개를 반환하며 토큰 추출이 불가함. |
| **Solution** | 기존 Variables/Styles API 추출을 유지하고, 노드 트리 파싱 경로를 선택적 옵션으로 추가. 프레임 이름 패턴과 자식 노드 텍스트/fill에서 값을 역추출. |
| **Function/UX Effect** | 추출 결과가 0일 때 UI에서 "시각 프레임 파싱" 토글을 제공. 사용자가 활성화하면 Spacing 프레임의 텍스트 라벨(`4px`, `8px`)과 Color 프레임의 fill 색상을 자동 파싱하여 결과에 병합. |
| **Core Value** | Airtable, Primer, Ant Design 등 구형 커뮤니티 파일에서도 토큰 추출이 가능해져 플러그인 호환 대상 파일이 대폭 확대됨. |

---

## 1. Overview

### 1.1 Purpose

`figma.variables` API와 `getLocalPaintStylesAsync()` 등 공식 Figma API가 반환하는 구조체가 0개인 파일에서도, 캔버스에 시각적으로 문서화된 디자인 토큰을 파싱하여 추출한다.

### 1.2 Background

Figma Variables는 2023년에 도입되었다. 그 이전에 만들어진 커뮤니티 파일들은 `Spacing`, `Colors`, `Tokens` 이름의 프레임 안에 선(LINE)과 텍스트(TEXT)로 간격값을 시각화하거나, 직사각형(RECTANGLE)의 fill로 색상을 나열하는 방식으로 디자인 토큰을 문서화했다.

Airtable Apps UI Kit 파일 분석 결과:
- Variables: 0개
- Spacing: 0개 (4/8/16/32/64px 값이 캔버스 프레임에만 존재)
- Color Styles: 61개 (Figma Style로 등록됨 — 현재도 추출 가능)

Color Styles는 이미 추출되나 Spacing/Radius는 추출 불가. 이 기능은 Spacing(과 필요 시 Radius)을 보조 파싱으로 보완한다.

### 1.3 Related Documents

- 분석: `docs/03-analysis/airtable-apps-ui-kit.analysis.md`
- 참조: `src/code.ts` — `extractAll()`, `SPACING_RE`, `RADIUS_RE`

---

## 2. Scope

### 2.1 In Scope

- [ ] 프레임 이름 패턴(`SPACING_RE`, `RADIUS_RE`)으로 대상 프레임 탐색
- [ ] 프레임 자식 TEXT 노드에서 `숫자px` / `숫자rem` 패턴 파싱
- [ ] TEXT 노드 이름 또는 인접 텍스트에서 토큰명 추출
- [ ] `src/code.ts` `extractAll()`에 선택적 파싱 경로 추가 (`useVisualParser: boolean` 옵션)
- [ ] UI에 "시각 프레임 파싱" 토글 추가 (결과 0개일 때 노출)
- [ ] 파싱 결과를 기존 `spacing[]` 배열에 병합 (출처 구분 필드 `source: 'variable' | 'visual'` 추가)

### 2.2 Out of Scope

- Radius 시각 파싱 (1차 범위 외 — 실사용 사례 확인 후 2차에서 검토)
- Color 시각 파싱 (Color Styles API로 이미 추출 가능)
- 컴포넌트 내부 하드코딩 값 파싱 (신뢰도 낮음)
- 자동 활성화 (항상 수동 토글)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `useVisualParser: true` 옵션 전달 시 `extractAll()`이 노드 파싱 경로 실행 | High | Pending |
| FR-02 | `SPACING_RE` 패턴에 매칭되는 이름의 프레임/그룹을 현재 페이지에서 탐색 | High | Pending |
| FR-03 | 탐색된 프레임의 자식 TEXT 노드에서 `(\d+(?:\.\d+)?)(px|rem)` 값 추출 | High | Pending |
| FR-04 | 추출된 값에 토큰명 부여 — TEXT 노드 이름 → 형제 텍스트 → 인덱스 기반(`spacing-0`, `spacing-1`) 순서로 폴백 | Medium | Pending |
| FR-05 | 파싱 결과를 `source: 'visual'` 필드와 함께 `spacing[]`에 병합 | High | Pending |
| FR-06 | Variables Spacing이 1개 이상 존재할 경우 시각 파싱 결과 무시 (중복 방지) | High | Pending |
| FR-07 | UI 필터 화면에서 "시각 프레임 파싱" 토글 제공, 기본값 off | Medium | Pending |
| FR-08 | 파싱 결과가 있을 경우 결과 화면에서 `visual` 출처 배지 표시 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 성능 | `findAll()` 탐색이 3초 이내 완료 (일반 커뮤니티 파일 기준) | 플러그인 내 타이머 |
| 안정성 | 파싱 실패 시 예외를 잡고 빈 배열 반환 (기존 추출 결과에 영향 없음) | try/catch 보장 |
| 신뢰도 | 파싱 값임을 UI에서 명시 (`visual` 배지 또는 안내 문구) | 시각 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-06 구현 완료
- [ ] Airtable Apps UI Kit 파일에서 Spacing 7개 이상 추출 확인
- [ ] 기존 Variables 기반 파일에서 동작 영향 없음 확인
- [ ] `npm run build` 성공

### 4.2 Quality Criteria

- [ ] `useVisualParser` 옵션이 없으면 기존 동작 100% 동일
- [ ] 파싱 오류가 전체 추출을 중단시키지 않음
- [ ] Zero lint errors, build 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 프레임 이름이 파일마다 달라 탐색 실패 | Medium | High | `SPACING_RE` 정규식 범위 넓게 설정, 실패 시 빈 배열 반환 |
| TEXT 포맷이 `4px` 외 다양한 형태 (`4 px`, `4.0px`, `4.00`) | Medium | Medium | 정규식 유연하게 (`\d+(?:\.\d+)?\s*px`) |
| 대형 파일에서 `findAll()` 성능 저하 | Medium | Low | 탐색 깊이 제한(depth ≤ 3), 타임아웃 처리 |
| 파싱 결과와 실제 값 불일치 (신뢰도 문제) | High | Medium | UI에서 `visual` 출처 명시, 사용자가 검증 후 사용하도록 안내 |

---

## 6. Architecture Considerations

### 6.1 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `ExtractOptions`에 `useVisualParser?: boolean` 추가, `extractVisualSpacing()` 신규 함수 |
| `src/ui.js` | 수정 | 토글 상태 관리, `useVisualParser` 옵션 전달 |
| `src/ui.html` | 수정 | 필터 화면 토글 UI 추가 |

### 6.2 신규 함수 (`src/code.ts`)

```typescript
// 시각 프레임에서 Spacing 파싱
async function extractVisualSpacing(): Promise<VariableData[]>

// 단일 프레임의 TEXT 자식에서 px 값 파싱
function parseSpacingFromFrame(frame: FrameNode | GroupNode): VariableData[]
```

### 6.3 데이터 흐름

```
UI (useVisualParser: true)
  → code.ts extractAll()
    → Variables API → spacing[] (기존)
    → if (useVisualParser && spacing.length === 0)
        → extractVisualSpacing()
          → figma.currentPage.findAll(SPACING_RE)
          → 각 프레임 TEXT 자식 파싱
          → VariableData[] { source: 'visual' }
    → 결과 병합 → UI로 전송
```

---

## 7. Convention Prerequisites

### 7.1 프로젝트 규칙 확인

- [x] `CLAUDE.md` 코드 컨벤션 존재
- [x] `QUALITY_RULES.md` 존재
- [x] TypeScript strict 모드 (`src/code.ts`)
- [x] ES5 `var` 패턴 (`src/ui.js`)

### 7.2 적용할 컨벤션

| Category | Rule |
|----------|------|
| 신규 함수명 | camelCase, `extract*` / `parse*` 접두사 |
| 옵션 필드 | `ExtractOptions` 인터페이스에 optional로 추가 |
| 오류 처리 | try/catch → 빈 배열 반환, `console.error` 로그 |
| CSS 색상 | CSS 변수(`var(--*)`) 사용 — 하드코딩 금지 |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design visual-frame-parser`)
2. [ ] `extractVisualSpacing()` 함수 시그니처 및 파싱 로직 상세 설계
3. [ ] Airtable 파일 실제 파싱 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-31 | Initial draft | jeonghak |
