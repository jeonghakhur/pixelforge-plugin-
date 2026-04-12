# Gap Analysis: Component Node Tree Export

> **Feature**: component-node-tree-export
> **Analysis Date**: 2026-04-12
> **Analyzer**: bkit:gap-detector
> **Match Rate**: **~92%** (Pass)
> **Status**: Check 통과 — Phase 2 deferral은 의도적, 문서 동기화 필요

---

## 1. 분석 대상

| 항목 | 경로 |
|---|---|
| Plan | `docs/01-plan/features/component-node-tree-export.plan.md` |
| Design | `docs/02-design/features/component-node-tree-export.design.md` |
| 구현 (신규) | `src/extractors/` (types, node-tree, text-role, shape-kind, variant-slug, index) |
| 구현 (통합) | `src/code.ts` (lines 1-2, 1329-1363, 2197-2288) |

---

## 2. 전체 점수

| 카테고리 | 점수 | 상태 |
|---|:---:|:---:|
| 기능 요구사항 (FR-01~FR-52) | 92% | Pass |
| Design Section 3 (핵심 함수) | 96% | Pass |
| Design Section 7 Phase 체크리스트 | 83% | Warn |
| Plan Section 6 완료 기준 | 70% (runtime 항목 미검증) | Warn |
| 컨벤션 준수 | 100% | Pass |
| **Overall Match Rate** | **~92%** | **Pass** |

---

## 3. FR-01~FR-52 준수 현황

### 3.1 Core Schema (FR-01~FR-07) — 100%

| ID | 요구사항 | 상태 | 증거 |
|---|---|:---:|---|
| FR-01 | `GenerateComponentResult.nodeTree` 반환 | Pass | `code.ts:1354-1355`, `code.ts:2278` |
| FR-02 | `variants[i].nodeTree` 완전 트리 | Pass | `code.ts:2252` |
| FR-03 | `id`/`type`/`name`/`styles` 필드 | Pass | `node-tree.ts:26-31` |
| FR-04 | `variantSlug` 생성 | Pass | `variant-slug.ts:18-28`, `code.ts:2249` |
| FR-05 | 깊이 제한 없음 | Pass | `node-tree.ts:66-71` |
| FR-06 | 기존 필드 유지 | Pass | `code.ts:2271-2277` |
| FR-07 | 일반 FRAME도 `nodeTree` 반환 | Pass | `code.ts:2278` 무조건 |

### 3.2 Node Type Coverage (FR-10~FR-17) — 100%

| ID | 요구사항 | 상태 |
|---|---|:---:|
| FR-10 TEXT: characters/textRole/타이포 | Pass |
| FR-11 VECTOR: shape + fill/stroke + optional pathData | Pass |
| FR-12 ELLIPSE: border-radius 50% 강제 (기존값 보존) | Pass |
| FR-13 RECTANGLE: border-radius/fill/stroke | Pass |
| FR-14 LINE: stroke | Pass |
| FR-15 INSTANCE: 재귀 + masterName | Pass |
| FR-16 BOOLEAN/POLYGON/STAR: shape 식별자 | Pass |
| FR-17 GROUP: 평탄화 금지 | Pass |

### 3.3 Semantic Metadata (FR-20~FR-22) — 100%

- FR-20: 12개 TextRole enum (`types.ts:16-28`)
- FR-21: 이름 → 부모 → 형제 위치 3단계 (`text-role.ts:11-28`)
- FR-22: `'unknown'` 폴백 (`text-role.ts:27`)

### 3.4 Atomic Component Reproduction (FR-30~FR-39)

**구조적으로는 100% 커버** — VECTOR/ELLIPSE/RECTANGLE + textRole 조합으로 모든 원자 컴포넌트 재현 가능한 데이터 계약 수립.
**단, runtime 시각 diff 검증은 미완료** (Figma 실측 필요).

### 3.5 Output/Transport (FR-50~FR-52)

| ID | 요구사항 | 상태 |
|---|---|:---:|
| FR-50 | `.node.json`에 `nodeTree` 포함 | **Unverified** — passthrough 경로, 런타임 확인 필요 |
| FR-51 | `/api/sync/components` Path A/B 포함 | **Unverified** — `compState.nodeData` 자동 포함 예상 |
| FR-52 | gzip ≤ 50KB / raw ≤ 500KB | **Unverified** — Plan 예측치 gzip 9.1KB/raw 388KB |

---

## 4. Design Section 3 (핵심 함수) 대비

### 4.1 `buildNodeTree()` — 의도적 편차 (NodeTreeContext 주입)

| 항목 | Design 원안 | 구현 |
|---|---|---|
| 시그니처 | `buildNodeTree(node, path)` | `buildNodeTree(node, ctx, path)` |
| 스타일/텍스트 소싱 | `./node-styles`에서 직접 import | `NodeTreeContext.getStyles/getText` 주입 |

**편차 사유**: `getNodeStyles`/`safeGetText`/`resolveBoundColor`가 `generateComponent()`의 closure(`colorMap`/`varIdMap`/`masterTextMap`/`resolveColor`)에 의존. 이동 시 factory 패턴 대규모 리팩터 필요 → Radix 생성 경로 회귀 리스크.

**목표 달성 영향도**: **없음**. Plan §4.6 핵심 목표("범용 단일 파일 + 힌트 모듈 레이어링", "컴포넌트별 분기 없음", "detectComponentType 의존 배제", "재귀 본질")를 그대로 만족. 오히려 **테스트 가능성은 향상** — mock context 주입만으로 Figma API 없이 단위 테스트 가능.

### 4.2 `inferTextRole()` — 기능 동치

Design: `/pattern/i` 플래그 사용
Implementation: 입력 소문자 선처리 후 literal 패턴 매칭
→ **결과 동일**, 구현이 약간 더 간결.

### 4.3 `resolveShape()` — 완전 일치

`shape-kind.ts`가 Design 3.3과 논리적으로 동일.

### 4.4 `buildVariantSlug()` — 기능 동치

Design `Object.entries(...).map(([_, v]) => ...)`
Implementation `Object.values(...).map(v => ...)`
→ 결과 동일 (ECMAScript 삽입 순서 보존), 구현이 더 깔끔.

### 4.5 `code.ts` 통합 지점

모두 Design 3.5 사양과 일치 (단, Phase 2 보류로 `nodeTreeCtx` 생성 코드 추가됨 — 2207-2210).

---

## 5. Design Section 7 Phase Checklist

| Phase | 항목 | 상태 |
|---|---|:---:|
| **Phase 1** | `src/extractors/` 모든 파일 생성 | Pass |
| **Phase 2** | `node-styles.ts` 이전 | **Deferred** (의도적) |
| | `code.ts`가 extractors에서 import | Partial (nodeTree/slug만) |
| | `npm run build` 성공 | Pass |
| **Phase 3** | `node-tree.ts` 작성 + extractVectorPath | Pass |
| | TypeScript strict (신규 코드) | Pass (0 errors) |
| **Phase 4** | variants/return 통합 | Pass |
| | `GenerateComponentResult` 갱신 | Pass |
| **Phase 5** | Runtime 검증 | **Not done** (Figma 필요) |
| | Checkbox/Radio/Switch/Input 샘플 | **Not done** |
| | 페이로드 크기 실측 | **Not done** |
| | Radix 회귀 확인 | 정적 — `getChildStyles` 경로 불변으로 리스크 낮음 |
| **Phase 6** | ARCHITECTURE.md 업데이트 | **Missing** |
| | CLAUDE.md 파일 맵 갱신 | **Missing** |
| | 메시지 플로우 문서 | N/A (신규 메시지 타입 없음) |

---

## 6. Phase 2 보류 영향 평가

| Plan 목표 (§4.6) | 영향? | 분석 |
|---|:---:|---|
| 범용 단일 파일 + 힌트 레이어링 | 없음 | `node-tree.ts` 여전히 단일 진입점 |
| 컴포넌트별 분기 없음 | 없음 | 분기 0개 |
| `detectComponentType` 의존 배제 | 없음 | 의존 0건 |
| 재귀 구조 본질 | 없음 | 균일 재귀 |
| 새 원자 컴포넌트 자동 대응 | 없음 | 동일 |
| 관심사 분리 | **부분** | 스타일 추출 로직은 `code.ts`에 잔류 |
| 단위 테스트 용이성 (§9.1) | **개선** | Mock ctx 주입으로 Figma API 없이 테스트 가능 |
| 유지보수 비용 | 약간 증가 | `getNodeStyles` 등 4개 함수가 `code.ts`에 잔류 |
| Radix 회귀 리스크 | **제거** | closure 불변 |

**결론**: Phase 2 보류는 이번 이터레이션의 **engineering 순이익**. 후속 플랜(`component-node-tree-phase2-migration`)으로 분리 추적 권장.

---

## 7. Gap 목록

### Missing (Design 있음, 구현 없음)

| 항목 | 위치 | 심각도 | 조치 |
|---|---|:---:|---|
| `node-styles.ts` 모듈 이전 | Design §4, Phase 2 | Medium | 후속 플랜으로 트래킹 |
| `ARCHITECTURE.md` 업데이트 | Phase 6 | Low | file-role 테이블에 `src/extractors/` 추가 |
| `CLAUDE.md` 파일 맵 | Phase 6 | Low | 핵심 파일 표에 extractors 행 추가 |
| `tests/extractors/` 단위 테스트 | Design §9 | Medium | text-role/variant-slug는 순수 함수라 즉시 작성 가능 |
| Runtime 검증 (Primary/Link color 색상) | Plan 완료 기준 #5~#6 | Medium | Figma 실측 필요 |
| 페이로드 크기 실측 | Plan 완료 기준 #11 | Medium | Figma 실측 필요 |

### Added (Design 없음, 구현 있음)

| 항목 | 위치 | 심각도 | 조치 |
|---|---|:---:|---|
| `NodeTreeContext` 인터페이스 | `types.ts:54-60` | Low (이익) | Design §3.1에 승인된 편차로 문서화 |
| `buildNodeTree(node, ctx, path)` 3-arg | `node-tree.ts:21-25` | Low (이익) | 동일 |

### Changed (설계 ≠ 구현)

| 항목 | Design | 구현 | 영향 |
|---|---|---|:---:|
| style/text 소싱 | 직접 import | `NodeTreeContext` 주입 | 순이익 |
| `inferTextRole` regex | `/.../i` | 소문자 선처리 + literal | 동치 |
| `buildVariantSlug` 반복 | `Object.entries` | `Object.values` | 동치 |

---

## 8. Match Rate 산출

```
Core Schema (FR-01~07):          7/7   = 100% × 0.25 = 25.00
Node Type Coverage (FR-10~17):   8/8   = 100% × 0.20 = 20.00
Semantic Metadata (FR-20~22):    3/3   = 100% × 0.10 = 10.00
Atomic Reproduction (FR-30~39): 구조적 100% × 0.10 = 10.00
Output/Transport (FR-50~52):    정적 미검증 × 0.05 =  2.50 (부분 인정)
Design §3 핵심 함수:             4/4   = 100% × 0.15 = 15.00
Phase 1/3/4:                    완료 × 0.05 =  5.00
Phase 2/5/6:                    부분 × 0.10 =  4.50
                                ─────────────
                                Total ≈ 92.0%
```

**Match Rate: ~92%** → 90% 기준선 통과. **Check Pass**.

---

## 9. 권장 조치

### 즉시 (비블로킹, 고신호)
1. **Figma 실측**: 플러그인 재빌드 후 `Buttons_Button.node.json` 재추출, Primary variant에서 `nodeTree → Text padding → TEXT.styles.color === 'var(--text-white)'` 확인
2. **페이로드 크기 측정**: raw/gzip 기록, FR-52 기준 검증

### 단기 (별도 태스크)
3. **단위 테스트**: `tests/extractors/text-role.test.ts`, `variant-slug.test.ts` (순수 함수, Figma mock 불필요)
4. **`ARCHITECTURE.md`** `src/extractors/` 행 추가
5. **`CLAUDE.md`** 핵심 파일 표 갱신
6. **`component-node-tree-export.design.md` §3.1** NodeTreeContext 주입 패턴을 승인된 편차로 문서화. Phase 2를 "Future Work" 카테고리로 이동

### 후속 플랜
7. **`component-node-tree-phase2-migration.plan.md`**: `getNodeStyles`/`safeGetText`/`resolveBoundColor`의 closure → factory 리팩터. Radix 회귀 테스트 매트릭스 포함

---

## 10. 동기화 결정

Gap은 주로 **문서 + runtime 검증**이므로:

- **Option 2 (Design 업데이트)**: NodeTreeContext를 설계에 반영
- **Option 4 (Phase 2 후속 분리)**: 의도적 보류로 기록하고 follow-up 플랜 생성

**구현은 건강**, 설계 문서가 약간 뒤처진 상태. 구현을 원안에 강제 맞추지 말 것 — 보류는 기술적으로 올바르고 리스크가 낮음.

---

## 11. 다음 단계

Match Rate 92% → `/pdca report component-node-tree-export`로 완료 보고서 생성 가능.
단, 위 "즉시" 항목 1~2를 Figma 실측 후 진행하면 보고서 품질이 더 높아짐.
