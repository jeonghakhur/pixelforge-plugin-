# visual-frame-parser Gap Analysis

> 분석 일자: 2026-03-31
> Design 문서: `docs/02-design/features/visual-frame-parser.design.md`
> 구현 파일: `src/code.ts`, `src/ui.js`, `src/ui.html`

---

## 1. 분석 결과 요약

| 구분 | 일치 | 전체 | 비율 |
|------|------|------|------|
| 인터페이스 확장 | 2 | 2 | 100% |
| 신규 함수 | 3 | 3 | 100% |
| extractAll() 조건 분기 | 1 | 1 | 100% |
| UI 연동 | 3 | 3 | 100% |
| 상수/i18n | 1 | 1 | 100% |
| **전체** | **10** | **10** | **100%** |

---

## 2. 일치 항목 (Match)

| # | 설계 항목 | 구현 위치 | 상태 |
|---|----------|----------|------|
| 1 | `VariableData.source?: 'variable' \| 'visual'` | `code.ts:8` | ✅ 완전 일치 |
| 2 | `ExtractOptions.useVisualParser?: boolean` | `code.ts:85` | ✅ 완전 일치 |
| 3 | `findSpacingFrames()` — FRAME/GROUP/SECTION + SPACING_RE | `code.ts:219-225` | ✅ 완전 일치 |
| 4 | `parseSpacingFromFrame()` — depth≤3, rem→px(`*16`), tokenName 우선순위 | `code.ts:227-258` | ✅ 완전 일치 |
| 5 | `extractVisualSpacing()` — dedup(Set), sort, VariableData 변환, try/catch | `code.ts:260-291` | ✅ 완전 일치 |
| 6 | `extractAll()` 조건 분기 — `spacing.length === 0 && options.useVisualParser` | `code.ts:476-478` | ✅ 논리적 동치 (중첩 if 구조) |
| 7 | `ui.js` `useVisualParserToggle.checked` → options 포함 | `ui.js:556,561` | ✅ 완전 일치 |
| 8 | `ui.html` `useVisualParserToggle` 체크박스 + data-i18n | `ui.html:1991-1995` | ✅ 완전 일치 |
| 9 | i18n `visualParserLabel` ko/en | `ui.js:59, 221` | ✅ 완전 일치 |
| 10 | `VISUAL_VALUE_RE` 상수 `(\d+(?:\.\d+)?)\s*(px\|rem)` | `code.ts:211` | ✅ 완전 일치 |

---

## 3. Gap 항목

### GAP-01 — bare `0` 텍스트 미추출 — ✅ 수정 완료

**수정일**: 2026-03-31
**위치**: `parseSpacingFromFrame` traverse 내부, `src/code.ts`

**원인**: `VISUAL_VALUE_RE`는 `숫자px` 패턴만 매칭. Figma Spacing 프레임의 `0` 행은 단위 없이 `"0"` 텍스트만 존재.

**수정**: `trimmed === '0'` 특수 처리 → `{ value: 0, rawText: '0' }` 추가

**결과**: `--spacing-0: 0px` 포함, 총 spacing 9개 (0~512px)

---

## 4. 비기능적 차이 (Gap 미산정)

| 항목 | 설계 | 구현 | 판정 |
|------|------|------|------|
| 체크박스 padding | `8px 12px` | `8px 16px` | 프로젝트 4px 배수 규칙 준수 |
| font-size | `12px` | `11px` | 주변 UI 밀도에 맞춤 |
| border-top 구분선 | 없음 | `1px solid var(--border)` | UX 개선, CSS 변수 준수 |
| cursor/accent-color | 없음 | `cursor:pointer; accent-color:var(--primary)` | UX 인터랙션 피드백, CSS 변수 준수 |

---

## 5. 컨벤션 준수

| 항목 | 상태 |
|------|------|
| 함수명 camelCase | ✅ |
| 상수 UPPER_SNAKE_CASE | ✅ |
| CSS 변수 사용 (하드코딩 없음) | ✅ |
| 간격 4px 배수 | ✅ |
| 에러 처리 (try/catch + 빈 배열) | ✅ |
| Figma API만 사용 (DOM 접근 없음) | ✅ |
| 기존 코드 무수정 (조건부 추가만) | ✅ |

---

## 6. Match Rate 계산

```
총 설계 항목: 10
  - 인터페이스: 2/2 (100%)
  - 신규 함수: 3/3 (100%)
  - extractAll 분기: 1/1 (100%)
  - UI 연동: 3/3 (100%)
  - 상수/i18n: 1/1 (100%)

Match Rate: 10/10 = 100%
```

---

## 7. 최종 상태

**Match Rate: 100% (10/10)** ✅

모든 설계 항목이 구현에 반영됨. Gap 없음.
