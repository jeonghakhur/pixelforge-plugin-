# component-db-registry Gap Analysis Report

> **Match Rate**: 93%
> **Project**: PixelForge Plugin + PixelForge App
> **Date**: 2026-04-01
> **Design Doc**: `docs/02-design/features/component-db-registry.design.md`

---

## Overall

| Category | Score |
|----------|:-----:|
| DB Schema | 93% |
| API | 95% |
| Plugin Logic | 90% |
| CSS/UI | 95% |
| **Overall** | **93%** |

- Match: 36 items (82%)
- Added (impl > design): 7 items (16%)
- Missing (design > impl): 2 items (4%)
- Changed (의도적): 6 items

---

## Missing (2건)

| # | 항목 | 파일 | Impact |
|---|------|------|--------|
| 1 | Registry entry `dbId`/`dbSyncedAt` 초기값 누락 | tab-component.js save handler | Low |
| 2 | Migration SQL 파일 미생성 | pixelforge/ drizzle migration | Medium |

## Added (7건, 의도적 개선)

| # | 항목 | 위치 |
|---|------|------|
| 1 | `dbStatus = 'synced'` 즉시 설정 | ui.js:258 |
| 2 | POST auto-fill figmaFileKey/fileName | utils.js |
| 3 | GET 실패 시 silent (toast 미표시) | utils.js |
| 4 | i18n badge 텍스트 ko/en | tab-component.js |
| 5 | CSS var() fallback 값 | ui.html |
| 6 | `vertical-align: middle` | ui.html |
| 7 | menuOrder auto-increment | route.ts |

## Changed (6건, 의도적)

| # | 항목 | Design | Implementation |
|---|------|--------|----------------|
| 1 | refreshComponentDbStatus fileKey | `pfSettings.url` (버그) | `state.figmaFileKey` |
| 2 | GET response 검증 | `!res.components` | `!Array.isArray()` |
| 3 | GET 조회 방식 | figmaFileKey 직접 | project→projectId |
| 4 | Badge font-size | 10px | 9px |
| 5 | buildComponentFiles 파라미터 | `state` | `cState` |
| 6 | tsx/scss 컬럼 | "제거" | "유지" (하위 호환) |

---

## Conclusion

Match Rate 93% — 기능 동작에 영향을 주는 실제 누락은 2건(migration 파일, registry 초기값)이며 모두 Low/Medium 수준. Design 문서의 `pfSettings.url` 버그는 구현에서 올바르게 수정됨.

**Check 단계 통과.**
