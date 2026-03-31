# Gap Analysis: image-assets-export

> **Date**: 2026-03-30
> **Design**: `docs/02-design/features/image-assets-export.design.md`
> **Implementation**: `src/code.ts`, `src/ui.html`, `src/ui.js`

---

## Overall Match Rate: 87% ⚠️

| Category | Total | Match | Changed | Missing | Rate |
|----------|:-----:|:-----:|:-------:|:-------:|:----:|
| FR (FR-01~11 필수) | 11 | 11 | 0 | 0 | 100% |
| 데이터 구조 | 3 | 3 | 0 | 0 | 100% |
| 상태 전이 | 5 | 4 | 0 | 1 | 80% |
| UI/CSS 스펙 | 8 | 5 | 2 | 1 | 63% |
| i18n 키 | 17 | 14 | 1 | 2 | 82% |
| code.ts 함수 | 4 | 4 | 0 | 0 | 100% |
| ui.js 함수 | 7 | 4 | 3 | 0 | 57% |
| **합계** | **55** | **45** | **6** | **4** | **87%** |

---

## 1. FR 항목 검증 (전체 통과)

| FR | 요구사항 | 구현 위치 | 결과 |
|----|----------|-----------|------|
| FR-01 | IMAGE fill 노드 탐지 | `code.ts:531` `findImageNodes()` | ✅ |
| FR-02 | 선택 모드 | `code.ts:533-534` useSelection 로직 | ✅ |
| FR-03 | exportAsync (포맷/배율) | `code.ts:581-583` | ✅ |
| FR-04 | base64 인코딩 + postMessage | `code.ts:525` `uint8ToBase64()` | ✅ |
| FR-05 | 썸네일 미리보기 | `ui.js:2003` `data:mime;base64,...` | ✅ |
| FR-06 | 개별 다운로드 | `ui.js:2156` `downloadSingleImage()` | ✅ |
| FR-07 | ZIP 일괄 다운로드 | `ui.js:2068` `buildStoreZip()` | ✅ |
| FR-08 | PNG/JPG 선택 UI | `ui.html:1491` 포맷 버튼 그룹 | ✅ |
| FR-09 | 배율 복수 선택 (최소 1개) | `ui.html:1498` + `ui.js:1960` min-1 가드 | ✅ |
| FR-10 | Images 탭 추가 | `ui.html:951` + `ui.js:794` 패널 등록 | ✅ |
| FR-11 | 빈 상태 안내 | `ui.html:1538-1541` empty 상태 | ✅ |

---

## 2. 누락 항목 (4개)

| # | 항목 | 위치 | 영향도 |
|---|------|------|--------|
| 1 | Error 상태 재시도 버튼 | `ui.html:1545-1548` — 에러 메시지만 있고 Retry 버튼 없음 | Medium |
| 2 | 선택 레이어 없을 때 radio 비활성화 | `ui.html:1512` — 항상 활성화, 툴팁 없음 | Low |
| 3 | `image.noSelection` i18n 키 | `ui.js` i18n 섹션 — 키 자체가 없음 | Low |
| 4 | `image.downloadAllCount` i18n 키 | `ui.js:2026` — 한국어 하드코딩 (`'개 · '+'파일'`) | Low |

---

## 3. 변경 항목 (6개, 경미)

| # | 항목 | Design 값 | 구현 값 | 영향도 |
|---|------|-----------|---------|--------|
| 1 | 썸네일 크기 | 60×60 px | 56×56 px | Low |
| 2 | 썸네일 border-radius | 4px | 6px | Low |
| 3 | `image.title` i18n 키 | `'이미지 에셋 추출'` | `image.idleTitle` = `'이미지 에셋 탐지'` | Low |
| 4 | `image.downloadOne` 텍스트 | `'개별 다운로드'` | `'다운로드'` | Low |
| 5 | `downloadAllZip()` 함수명 | `downloadAllZip` | `downloadAllImagesZip` | Low |
| 6 | 상태 관리 방식 | `imageState` 변수 | DOM 클래스 토글 (`setImgState`) | Low |

---

## 4. 추가 항목 (구현 향상)

| # | 항목 | 위치 | 설명 |
|---|------|------|------|
| 1 | CRC32 체크섬 | `ui.js:2052-2066` | Design에 없던 ZIP CRC32 구현 추가 → 더 견고한 ZIP |
| 2 | `image.idleTitle` i18n 키 | `ui.js:88/174` | idle 상태 타이틀 별도 키 |

---

## 5. 수정 권고사항

### 즉시 수정 (Match Rate 90% 달성용)

| 우선순위 | 항목 | 파일 | 수정 내용 |
|----------|------|------|-----------|
| 1 | Error 상태 Retry 버튼 | `src/ui.html:1545` | `<button>` 추가 + 클릭 시 재탐지 실행 |
| 2 | 푸터 카운트 i18n화 | `src/ui.js:2026` | `image.downloadAllCount` 키 추가 및 적용 |

### 단기 개선

| 우선순위 | 항목 | 파일 | 수정 내용 |
|----------|------|------|-----------|
| 3 | 선택 레이어 radio 비활성화 | `ui.html:1512` + `ui.js` | selectionchange 이벤트 연동 |
| 4 | `image.noSelection` 키 추가 | `ui.js` i18n | 한/영 키 추가 |

### Design 문서 업데이트 (구현 반영)

- 썸네일 56×56 / 6px radius 반영
- `image.title` → `image.idleTitle` 키명 수정
- `downloadAllImagesZip` 함수명 반영
- `setImgState()` + `renderImageList()` 분리 구조 반영
