# component-db-registry Planning Document

> **Summary**: 플러그인 컴포넌트 레지스트리 저장 시 PixelForge DB에 자동 동기화
>
> **Project**: PixelForge Plugin + PixelForge App
> **Version**: 0.1
> **Author**: Jeonghak Hur
> **Date**: 2026-04-01
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 플러그인에서 생성된 컴포넌트가 `figma.clientStorage`(로컬)에만 저장되어 PixelForge 앱의 컴포넌트 목록에 나타나지 않음 |
| **Solution** | "레지스트리에 저장" 시 `/api/sync/components`를 통해 PixelForge DB의 `components` 테이블에 upsert |
| **Function/UX Effect** | 저장 버튼 한 번으로 로컬 레지스트리 + DB 동시 저장, 앱 컴포넌트 페이지에서 즉시 확인 가능 |
| **Core Value** | Figma → 코드 → DB 파이프라인 완성: 디자인 토큰(기존)에 이어 컴포넌트도 원클릭 동기화 |

---

## 1. Overview

### 1.1 Purpose

플러그인에서 Figma 컴포넌트를 분석하여 생성된 TSX/CSS 코드를 PixelForge 앱의 DB에 자동 저장한다.
현재는 `figma.clientStorage`에만 저장되어 플러그인을 닫으면 접근이 어렵고, 앱과의 연결이 없다.

### 1.2 Background

이전 세션(`pixelforge-sync-status`)에서 토큰/아이콘/이미지 전송 파이프라인을 구축했다.
컴포넌트는 `/api/sync/components` 엔드포인트가 이미 존재하지만, `sync_payloads`에 raw 저장만 하고
`components` 테이블에 직접 upsert하지 않는다.

PixelForge 앱의 `components` 테이블 스키마:
```
id, projectId, name, category(action|form|navigation|feedback), tsx, scss,
description, menuOrder, isVisible, createdAt, updatedAt
```

플러그인 레지스트리 엔트리:
```
name, figmaNodeName, figmaMasterNodeId, componentType, radixPackage,
styleMode, useTs, code: { tsx, css }, createdAt, updatedAt
```

### 1.3 Related Documents

- 이전 기능: `docs/01-plan/features/pixelforge-sync-status.plan.md`
- 앱 스키마: `/Users/jeonghak/work/pixelforge/src/lib/db/schema.ts`
- 앱 컴포넌트 액션: `/Users/jeonghak/work/pixelforge/src/lib/actions/components.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] 플러그인: "레지스트리에 저장" 후 PixelForge DB에 동기화
- [ ] 앱 API: `/api/sync/components` — `components` 테이블 upsert 추가
- [ ] DB 스키마: `components` 테이블에 `figmaNodeId` 컬럼 추가 (Figma 노드 추적용)
- [ ] 카테고리 매핑: plugin `componentType` → DB `category` enum
- [ ] 연결 미설정 시 graceful 처리 (로컬 저장은 항상 성공)

### 2.2 Out of Scope

- 앱 → 플러그인 역방향 동기화 (복잡도 높음, 별도 피처)
- 삭제 동기화 (로컬 삭제 시 DB 삭제)
- 컴포넌트 코드 충돌 머지
- 레지스트리 전체 일괄 동기화 버튼

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | "레지스트리에 저장" 클릭 시 PixelForge 연결 상태 확인 후 DB 동기화 | High | Pending |
| FR-02 | `componentType` → `category` 매핑 함수 (action/form/navigation/feedback) | High | Pending |
| FR-03 | `/api/sync/components` POST에서 `components` 테이블 upsert (figmaNodeId 기준) | High | Pending |
| FR-04 | `components` 테이블에 `figmaNodeId` 컬럼 추가 + 마이그레이션 | Medium | Pending |
| FR-05 | 연결 안 된 경우 로컬 저장은 성공, DB 동기화 실패 토스트 없음 (silent) | Medium | Pending |
| FR-06 | DB 동기화 성공 시 "레지스트리 저장 + DB 동기화 완료" 토스트 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| UX | 기존 로컬 저장 플로우 변경 없음 | 수동 테스트 |
| 안정성 | DB 동기화 실패해도 로컬 저장은 항상 성공 | 에러 핸들링 확인 |
| 보안 | API Key 인증 유지 (`X-API-Key` 헤더) | 기존 패턴 사용 |

---

## 4. 기술 설계

### 4.1 데이터 흐름

```
[Plugin]
  compSaveBtn 클릭
    → parent.postMessage({ type: 'registry-save', entry })  (기존)
    → code.ts → figma.clientStorage 저장  (기존)
    → figma.ui.postMessage({ type: 'registry-saved' })  (기존)

[UI]
  'registry-saved' 수신 (ui.js)
    → renderRegistryList() 업데이트  (기존)
    → [NEW] sendToPixelForge('/api/sync/components', payload)  ← 추가
    → 성공: "레지스트리 저장됨 (DB 동기화 완료)" 토스트
    → 실패 (연결 없음): 기존 "레지스트리에 저장됐습니다" 토스트만
```

### 4.2 카테고리 매핑

```javascript
// tab-component.js 또는 utils.js에 추가
function componentTypeToCategory(type) {
  var form = ['input', 'select', 'checkbox', 'radio', 'textarea', 'form', 'switch'];
  var nav  = ['navigation', 'menu', 'breadcrumb', 'tabs', 'pagination', 'sidebar', 'navbar'];
  var feed = ['dialog', 'modal', 'toast', 'alert', 'badge', 'progress', 'spinner', 'tooltip', 'popover'];
  if (form.indexOf(type) !== -1) return 'form';
  if (nav.indexOf(type) !== -1) return 'navigation';
  if (feed.indexOf(type) !== -1) return 'feedback';
  return 'action'; // button, link, layout, card 등
}
```

### 4.3 API 페이로드 (Plugin → App)

```json
POST /api/sync/components
{
  "figmaFileKey": "figma.root.id",
  "figmaFileName": "FileName",
  "components": [{
    "name": "Button",
    "category": "action",
    "tsx": "export function Button...",
    "scss": ".button { ... }",
    "description": "Figma: Button/Primary",
    "figmaNodeId": "123:456"
  }]
}
```

### 4.4 App API 변경 (`/api/sync/components/route.ts`)

```typescript
// 기존: upsertSyncPayload만 호출
// 추가: components 테이블에 upsert

for (const comp of components) {
  const existing = db.select({ id: components.id })
    .from(componentsTable)
    .where(eq(componentsTable.figmaNodeId, comp.figmaNodeId))
    .get();

  if (existing) {
    db.update(componentsTable)
      .set({ tsx: comp.tsx, scss: comp.scss, updatedAt: new Date() })
      .where(eq(componentsTable.id, existing.id))
      .run();
  } else {
    db.insert(componentsTable).values({
      id: crypto.randomUUID(),
      projectId: project.id,
      name: comp.name,
      category: comp.category,
      tsx: comp.tsx,
      scss: comp.scss || null,
      description: comp.description || null,
      figmaNodeId: comp.figmaNodeId || null,
      menuOrder: nextOrder++,
      isVisible: true,
    }).run();
  }
}
```

### 4.5 DB 스키마 변경

```typescript
// schema.ts components 테이블에 추가
figmaNodeId: text('figma_node_id'),  // Figma masterId or nodeId
```

마이그레이션: `ALTER TABLE components ADD COLUMN figma_node_id TEXT;`

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] FR-01 ~ FR-06 구현 완료
- [ ] `npm run build` 성공
- [ ] 플러그인에서 저장 후 앱 `/components` 페이지에 컴포넌트 노출 확인

### 5.2 Quality Criteria

- [ ] 연결 없을 때 로컬 저장 정상 동작 (regression 없음)
- [ ] CSS 변수 하드코딩 없음
- [ ] 기존 레지스트리 엔트리 보존

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `category` enum 불일치 | Medium | Low | 매핑 함수 기본값 'action' |
| `figmaNodeId` null (구 레지스트리 엔트리) | Medium | Medium | name 기준 fallback upsert |
| DB 동기화 실패 시 UX 혼란 | Medium | Low | 로컬 저장 성공 → 기본 토스트, DB 실패는 silent |

---

## 7. Architecture Considerations

### 7.1 Project Level

**Dynamic** — 기존 Figma Plugin + Next.js App 패턴 유지

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 동기화 시점 | registry-saved 수신 후 | 로컬 저장 성공 후 DB 시도, 순서 보장 |
| upsert 기준 | figmaNodeId → name fallback | Figma 노드 ID가 안정적인 식별자 |
| 카테고리 결정 | plugin componentType 매핑 | 앱 DB enum과 최대한 맞춤 |
| 실패 처리 | silent fail | DB 연결 없어도 플러그인 사용 가능 |

---

## 8. Implementation Order

1. **App** — `schema.ts`에 `figmaNodeId` 컬럼 추가 + 마이그레이션 실행
2. **App** — `/api/sync/components/route.ts` — `components` 테이블 upsert 로직 추가
3. **Plugin** — `tab-component.js`에 `componentTypeToCategory()` 함수 추가
4. **Plugin** — `ui.js` `registry-saved` 핸들러에 `sendToPixelForge` 호출 추가
5. **빌드 + 검증** — `npm run build` → 플러그인 테스트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial draft | Jeonghak Hur |
