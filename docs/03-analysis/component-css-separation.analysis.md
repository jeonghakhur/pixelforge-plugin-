# Gap Analysis: component-css-separation

> **Date**: 2026-04-01
> **Match Rate**: 96% (post-fix)
> **Status**: PASS

## Overall Score

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 96% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **96%** | **PASS** |

## Gaps Found & Fixed

| Gap | 내용 | 조치 |
|-----|------|------|
| i18n `copyGlobalCss` 누락 | ui.html 버튼 텍스트 하드코딩 | i18n.js ko/en 키 추가 + `data-i18n` 속성 추가 |
| i18n `htmlModeInline` 누락 | 토글 버튼 텍스트 하드코딩 | i18n.js ko/en 키 추가 + `data-i18n` 속성 추가 |
| i18n `htmlModeSeparated` 누락 | 토글 버튼 텍스트 하드코딩 | i18n.js ko/en 키 추가 + `data-i18n` 속성 추가 |

## Checklist (All Pass)

- [x] `GenerateComponentResult`에 `htmlClass`, `htmlCss` 필드 추가
- [x] `buildHtmlWithClasses()` — class 기반 HTML + CSS 맵 → 문자열 변환
- [x] 인라인 모드: 기존 `style=""` 출력 변화 없음
- [x] CSS 분리 모드: `style=` 없이 `.root`, `.el-N` class 사용
- [x] `compState.htmlStyleMode` 토글 UI 동작
- [x] HTML 모드 선택 시만 서브 토글 표시
- [x] CSS 분리 모드 선택 시 global.css 바 표시
- [x] `getGlobalCss()`: 추출 데이터 없으면 빈 문자열 반환
- [x] i18n 키 추가 (ko/en) — 수정 후 완료
- [x] `npm run build` 성공
