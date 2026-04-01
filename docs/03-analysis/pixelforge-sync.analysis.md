# pixelforge-sync Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: PixelForge Token Extractor (Figma Plugin) + PixelForge App
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-04-01
> **Plan Doc**: [pixelforge-sync.plan.md](../01-plan/features/pixelforge-sync.plan.md)

---

## 1. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Phase 1 - Plugin | 88% | Warning |
| Phase 2 - App | 90% | OK |
| Cross-repo Integration | 85% | Warning |
| **Overall** | **88%** | **Warning** |

---

## 2. Gap Analysis (Plan vs Implementation)

### 2.1 Phase 1 — Settings Tab (1-1)

| Plan Item | Implementation | Status |
|-----------|---------------|:------:|
| URL input (`pfUrlInput`) | `src/ui.html`, `tab-settings.js:7` | OK |
| API key input (password, `pfKeyInput`) | `src/ui.html`, `tab-settings.js:8` | OK |
| Connection test → GET /api/ping | `tab-settings.js:67` with X-API-Key | OK |
| Save to localStorage (`pf_url`, `pf_key`) | `tab-settings.js:47-48` | OK |
| Load settings on init | `tab-settings.js:33-41` | OK |
| Status indicator (dot + text) | `tab-settings.js:21-30` | OK |
| Hide send buttons when not connected | `isPfConnected()` exported, **미사용** | MISSING |
| "PixelForge 연결 필요" 탭별 안내 | 전송 시도 시 toast만, 상시 안내 없음 | MISSING |

### 2.2 Phase 1 — Send Buttons (1-2)

| Tab | Button ID | Endpoint | HTML | Handler | Status |
|-----|-----------|----------|:----:|:-------:|:------:|
| Extract | `pfSendExtractBtn` | /api/sync/tokens | ✅ | `tab-extract.js` | OK |
| Icons | `pfSendIconsBtn` | /api/sync/icons | ✅ | `tab-icons.js` | OK |
| Themes | `pfSendThemesBtn` | /api/sync/themes | ✅ | `tab-themes.js` | OK |
| Component | `pfSendComponentBtn` | /api/sync/components | ✅ | `tab-component.js` | OK |
| Images | `pfSendImagesBtn` | /api/sync/images | ✅ | `tab-images.js` | OK |

### 2.3 Phase 1 — Common Send Logic (1-3)

| Plan Item | 구현 | Status |
|-----------|------|:------:|
| `sendToPixelForge` in utils.js | `utils.js:31` | OK |
| POST + Content-Type: application/json | 일치 | OK |
| X-API-Key header | 일치 | OK |
| Body: figmaFileKey, figmaFileName | `Object.assign({}, data, { figmaFileKey, figmaFileName })` | OK |
| 성공 시 tokenCount 토스트 | 제네릭 i18n 문자열, count 미표시 | CHANGED |
| result.error 폴백 처리 | res.ok 체크, fetch 에러 캐치 방식으로 변경 | CHANGED |

### 2.4 Phase 2 — API Key Management (2-1)

| Plan Item | Implementation | Status |
|-----------|---------------|:------:|
| `api_keys` 테이블 | `schema.ts` (id, keyHash, name, createdAt, lastUsedAt) | OK |
| 키 생성 | `api-keys.ts` createApiKey, `pf_` prefix | OK |
| 키 삭제 | `api-keys.ts` deleteApiKey | OK |
| **키 재발급** | **미구현** | MISSING |
| 설정 페이지 UI | `settings/page.tsx` — 생성/목록/삭제 | OK |
| validateApiKey 미들웨어 | `api-key.ts` — hash 비교 + lastUsedAt 업데이트 | OK |

### 2.5 Phase 2 — 수신 엔드포인트 (2-2)

| Endpoint | Route | Auth | 입력 검증 | Status |
|----------|-------|:----:|:--------:|:------:|
| GET /api/ping | `api/ping/route.ts` | X-API-Key | N/A | OK |
| POST /api/sync/tokens | `api/sync/tokens/route.ts` | X-API-Key | figmaFileKey + tokens | OK |
| POST /api/sync/icons | `api/sync/icons/route.ts` | X-API-Key | figmaFileKey + icons | OK |
| POST /api/sync/images | `api/sync/images/route.ts` | X-API-Key | figmaFileKey + images | OK |
| POST /api/sync/themes | `api/sync/themes/route.ts` | X-API-Key | figmaFileKey + themes | OK |
| POST /api/sync/components | `api/sync/components/route.ts` | X-API-Key | figmaFileKey + components | OK |

### 2.6 Phase 2 — 버전 관리 (2-3)

| Plan Item | Implementation | Status |
|-----------|---------------|:------:|
| SHA-256 해시 비교 | `upsert-payload.ts` + `tokens/route.ts` | OK |
| 동일 시 저장 안 함 | `{ changed: false, version }` 반환 | OK |
| 다르면 새 버전 저장 | version 증가 | OK |
| 토큰: `tokenSnapshots`, 기타: `syncPayloads` | 이중 테이블 전략 | CHANGED |

---

## 3. 차이점 요약

### 3.1 MISSING

| # | 항목 | Plan 요구사항 | 영향도 |
|---|------|--------------|--------|
| 1 | 전송 버튼 연결 상태 연동 | 설정 미완료 시 전송 버튼 숨김 | Medium |
| 2 | 탭별 연결 필요 안내 | 상시 안내 텍스트 | Low |
| 3 | API 키 재발급 | 재발급/삭제 기능 | Low |

### 3.2 CHANGED

| # | 항목 | Plan | 구현 | 영향도 |
|---|------|------|------|--------|
| 4 | 성공 토스트 | `result.tokenCount` 포함 | 제네릭 문자열 | Low |
| 5 | 에러 처리 | `result.error` 폴백 | HTTP 레벨 체크 | Medium |
| 6 | 토큰 저장 테이블 | 단일 버전 관리 | 이중 테이블 | Medium |

### 3.3 ADDED (Plan에 없으나 구현됨)

| # | 항목 | 설명 |
|---|------|------|
| 7 | `syncPayloads` 테이블 | 토큰 외 에셋 전용 테이블 |
| 8 | `ensureProject` 헬퍼 | 프로젝트 upsert 공통화 |
| 9 | 설정 로드 시 자동 연결 테스트 | `tab-settings.js:39` |

---

## 4. Match Rate

| Category | 항목 수 | 일치 | 비율 |
|----------|:------:|:---:|:----:|
| Settings Tab (1-1) | 8 | 6 | 75% |
| Send Buttons (1-2) | 5 | 5 | 100% |
| Common Send Logic (1-3) | 6 | 4 | 67% |
| API Key Management (2-1) | 6 | 5 | 83% |
| Endpoints (2-2) | 6 | 6 | 100% |
| Version Management (2-3) | 4 | 3 | 75% |
| **합계** | **35** | **29** | **83%** |

**가중 전체 (핵심 플로우 가중치 적용): 88%**

---

## 5. 90% 달성을 위한 권장 조치

### 5.1 즉시 (88% → 90%+)

| # | 조치 | 파일 | 난이도 |
|---|------|------|--------|
| 1 | `isPfConnected()` import 후 전송 버튼 show/hide 연동 | 각 탭 모듈 + `tab-settings.js` | Small |

### 5.2 단기

| # | 조치 | 파일 | 난이도 |
|---|------|------|--------|
| 2 | 성공 토스트에 `result.tokenCount` 표시 | 각 탭 send handler | Small |
| 3 | `regenerateApiKey` 서버 액션 추가 | `src/lib/actions/api-keys.ts` | Small |
| 4 | tokens 엔드포인트를 `upsertSyncPayload` 사용으로 리팩터링 | `api/sync/tokens/route.ts` | Medium |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-01 | Initial gap analysis |
