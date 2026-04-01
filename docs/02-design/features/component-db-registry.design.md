# component-db-registry Design Document

> **Summary**: 코드 생성 직후 PixelForge DB에 자동 동기화 — 다중 스타일 변형 + 노드 스냅샷 지원
>
> **Project**: PixelForge Plugin + PixelForge App
> **Author**: Jeonghak Hur
> **Date**: 2026-04-01
> **Status**: Draft
> **Plan**: `docs/01-plan/features/component-db-registry.plan.md`

---

## 1. 전체 아키텍처

```
[Plugin UI]
  generateCompBtn 클릭
    → code.ts: generate-component
    → code.ts → UI: generate-component-result { data, tsx, css }

  showGeneratedResult() 호출
    → [NEW] sendToPixelForge('/api/sync/components', payload)
      ├── 성공: compState.registry[key].dbId = id
      │         compState.registry[key].dbSyncedAt = now
      │         registry-save에 dbId/dbSyncedAt 포함
      └── 실패/미연결: silent (로컬만 저장)

  컴포넌트 탭 활성화 시
    → [NEW] GET /api/sync/components?figmaFileKey=xxx
      → DB의 { figmaNodeId, id, updatedAt } 목록 수신
      → 로컬 레지스트리와 비교 → 뱃지 상태 갱신
```

---

## 2. DB 스키마 변경 (App)

### 2.1 `components` 테이블 개편

`tsx`, `scss` 컬럼 제거 → 메타데이터 전용으로 변경.

```typescript
// src/lib/db/schema.ts

export const components = sqliteTable('components', {
  id:              text('id').primaryKey(),
  projectId:       text('project_id').notNull().references(() => projects.id),
  figmaNodeId:     text('figma_node_id'),          // Figma masterId or nodeId
  figmaFileKey:    text('figma_file_key'),          // 어느 파일에서 왔는지
  name:            text('name').notNull(),
  category:        text('category', {
                     enum: ['action', 'form', 'navigation', 'feedback']
                   }).notNull(),
  description:     text('description'),
  defaultStyleMode: text('default_style_mode')
                     .notNull().default('css-modules'), // 기본 표시 방식
  menuOrder:       integer('menu_order').notNull().default(0),
  isVisible:       integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  createdAt:       integer('created_at', { mode: 'timestamp' })
                     .notNull().$defaultFn(() => new Date()),
  updatedAt:       integer('updated_at', { mode: 'timestamp' })
                     .notNull().$defaultFn(() => new Date()),
});
```

### 2.2 `component_files` 테이블 신설

styleMode별 파일 저장. 하나의 컴포넌트가 여러 방식의 파일을 가짐.

```typescript
export const componentFiles = sqliteTable('component_files', {
  id:          text('id').primaryKey(),
  componentId: text('component_id').notNull().references(() => components.id),
  styleMode:   text('style_mode', {
                 enum: ['css-modules', 'styled', 'html']
               }).notNull(),
  fileType:    text('file_type', {
                 enum: ['tsx', 'css', 'html']
               }).notNull(),
  fileName:    text('file_name').notNull(),   // 'Button.tsx', 'Button.module.css'
  content:     text('content').notNull(),
  createdAt:   integer('created_at', { mode: 'timestamp' })
                 .notNull().$defaultFn(() => new Date()),
  updatedAt:   integer('updated_at', { mode: 'timestamp' })
                 .notNull().$defaultFn(() => new Date()),
});
```

**데이터 예시:**

| componentId | styleMode | fileType | fileName |
|-------------|-----------|----------|----------|
| c1 | css-modules | tsx | Button.tsx |
| c1 | css-modules | css | Button.module.css |
| c1 | styled | tsx | Button.tsx |
| c1 | html | html | button.html |
| c1 | html | css | button.css |

### 2.3 `component_node_snapshots` 테이블 신설

코드 생성 시점의 Figma 노드 JSON 스냅샷. 디버깅/베리데이션용.

```typescript
export const componentNodeSnapshots = sqliteTable('component_node_snapshots', {
  id:           text('id').primaryKey(),
  componentId:  text('component_id').notNull().references(() => components.id),
  figmaNodeData: text('figma_node_data').notNull(), // 전체 노드 JSON
  figmaVersion: text('figma_version'),              // Figma 파일 버전
  trigger:      text('trigger', {
                  enum: ['generate', 'update']
                }).notNull().default('generate'),
  createdAt:    integer('created_at', { mode: 'timestamp' })
                  .notNull().$defaultFn(() => new Date()),
});
```

### 2.4 마이그레이션

```sql
-- 1. component_files 신설
CREATE TABLE component_files (
  id           TEXT PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES components(id),
  style_mode   TEXT NOT NULL CHECK(style_mode IN ('css-modules','styled','html')),
  file_type    TEXT NOT NULL CHECK(file_type IN ('tsx','css','html')),
  file_name    TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_component_files_component_id ON component_files(component_id);

-- 2. component_node_snapshots 신설
CREATE TABLE component_node_snapshots (
  id              TEXT PRIMARY KEY,
  component_id    TEXT NOT NULL REFERENCES components(id),
  figma_node_data TEXT NOT NULL,
  figma_version   TEXT,
  trigger         TEXT NOT NULL DEFAULT 'generate',
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_component_snapshots_component_id ON component_node_snapshots(component_id);

-- 3. components 테이블 컬럼 추가
ALTER TABLE components ADD COLUMN figma_node_id TEXT;
ALTER TABLE components ADD COLUMN figma_file_key TEXT;
ALTER TABLE components ADD COLUMN default_style_mode TEXT NOT NULL DEFAULT 'css-modules';
CREATE INDEX idx_components_figma_node_id ON components(figma_node_id);

-- 4. 기존 tsx/scss 데이터 component_files로 마이그레이션 후 컬럼 유지 (SQLite는 DROP 불가)
--    기존 generateComponentsAction은 tsx/scss 계속 사용 가능 (하위 호환)
```

---

## 3. API 설계 (App)

### 3.1 `POST /api/sync/components` — 컴포넌트 저장/갱신

**Request:**
```json
{
  "figmaFileKey": "figma.root.id",
  "figmaFileName": "My Design System",
  "component": {
    "name": "Button",
    "category": "action",
    "description": "Figma: Button/Primary",
    "figmaNodeId": "123:456",
    "defaultStyleMode": "css-modules",
    "files": [
      { "styleMode": "css-modules", "fileType": "tsx",  "fileName": "Button.tsx",        "content": "..." },
      { "styleMode": "css-modules", "fileType": "css",  "fileName": "Button.module.css", "content": "..." }
    ],
    "nodeSnapshot": {
      "figmaNodeData": "{...}",
      "figmaVersion": null,
      "trigger": "generate"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "componentId": "uuid",
  "changed": true
}
```

**처리 로직:**
1. `figmaNodeId` 기준 기존 component 조회 → 없으면 name 기준 fallback
2. components upsert
3. component_files upsert (styleMode + fileType 기준)
4. component_node_snapshots insert (항상 새 스냅샷)
5. `componentId` 반환

### 3.2 `GET /api/sync/components?figmaFileKey=xxx` — DB 상태 조회

플러그인 탭 활성화 시 호출. DB에 있는 컴포넌트 목록 반환.

**Response:**
```json
{
  "components": [
    { "figmaNodeId": "123:456", "id": "uuid", "name": "Button", "updatedAt": "2026-04-01T..." },
    { "figmaNodeId": "789:012", "id": "uuid", "name": "Input",  "updatedAt": "2026-04-01T..." }
  ]
}
```

---

## 4. 플러그인 변경 설계

### 4.1 카테고리 매핑 함수 (`tab-component.js`)

```javascript
function componentTypeToCategory(type) {
  var form = ['input', 'select', 'checkbox', 'radio', 'textarea', 'form', 'switch'];
  var nav  = ['navigation', 'menu', 'breadcrumb', 'tabs', 'pagination', 'sidebar', 'navbar'];
  var feed = ['dialog', 'modal', 'toast', 'alert', 'badge', 'progress', 'spinner', 'tooltip', 'popover'];
  if (form.indexOf(type) !== -1) return 'form';
  if (nav.indexOf(type) !== -1) return 'navigation';
  if (feed.indexOf(type) !== -1) return 'feedback';
  return 'action';
}
```

### 4.2 코드 생성 결과 수신 시 DB 전송 (`ui.js`)

```javascript
// 기존 generate-component-result 핸들러에 추가
if (msg.type === 'generate-component-result') {
  // ... 기존 코드 (showGeneratedResult 등) ...

  // [NEW] DB 동기화
  var d = msg.data;
  if (d && isPfConnected()) {
    var files = buildComponentFiles(d, compState);
    sendToPixelForge('/api/sync/components', {
      figmaFileKey: state.figmaFileKey || '',
      figmaFileName: state.figmaFileName || '',
      component: {
        name: compToPascalCase((d.name || 'Component').split('/').pop()),
        category: componentTypeToCategory(compState.componentType),
        description: 'Figma: ' + (d.name || ''),
        figmaNodeId: compState.meta ? (compState.meta.masterId || compState.meta.nodeId) : null,
        defaultStyleMode: compState.styleMode,
        files: files,
        nodeSnapshot: {
          figmaNodeData: JSON.stringify(d),
          figmaVersion: null,
          trigger: 'generate',
        },
      },
    }).then(function (res) {
      if (res && res.componentId) {
        var key = compState.meta ? (compState.meta.masterId || compState.meta.nodeId) : null;
        if (key && compState.registry[key]) {
          compState.registry[key].dbId = res.componentId;
          compState.registry[key].dbSyncedAt = new Date().toISOString();
          // registry-save에 반영
          parent.postMessage({
            pluginMessage: { type: 'registry-save', entry: compState.registry[key] }
          }, '*');
        }
      }
    });
  }
}
```

### 4.3 `buildComponentFiles` 헬퍼 (`tab-component.js`)

```javascript
export function buildComponentFiles(nodeData, state) {
  var name = compToPascalCase((nodeData.name || 'Component').split('/').pop());
  var files = [];

  if (state.styleMode === 'css-modules') {
    files.push({ styleMode: 'css-modules', fileType: 'tsx', fileName: name + '.tsx',         content: state.generatedTsx });
    files.push({ styleMode: 'css-modules', fileType: 'css', fileName: name + '.module.css',  content: state.generatedCss });
  } else if (state.styleMode === 'styled') {
    files.push({ styleMode: 'styled',      fileType: 'tsx', fileName: name + '.tsx',         content: state.generatedTsx });
  } else if (state.styleMode === 'html') {
    files.push({ styleMode: 'html',        fileType: 'html', fileName: name.toLowerCase() + '.html', content: state.generatedTsx });
    files.push({ styleMode: 'html',        fileType: 'css',  fileName: name.toLowerCase() + '.css',  content: state.generatedCss });
  }

  return files;
}
```

### 4.4 레지스트리 엔트리 구조 변경

```javascript
// 기존 필드 유지 + DB 상태 필드 추가
var entry = {
  name:               nameVal,
  figmaNodeName:      compState.meta.nodeName,
  figmaMasterNodeId:  key,
  componentType:      compState.componentType,
  radixPackage:       RADIX_MAP[compState.componentType] || null,
  styleMode:          compState.styleMode,
  useTs:              compState.useTs,
  code:               { tsx: compState.generatedTsx, css: compState.generatedCss },
  createdAt:          new Date().toISOString(),
  updatedAt:          new Date().toISOString(),
  // [NEW]
  dbId:               null,   // DB 저장 성공 시 채워짐
  dbSyncedAt:         null,   // DB 저장 성공 시 채워짐
};
```

### 4.5 탭 활성화 시 서버 상태 조회 (`ui.js` switchMainTab)

```javascript
if (tab === 'component') {
  updateCompSelInfo();
  // [NEW] DB 상태 갱신
  if (isPfConnected() && state.figmaFileKey) {
    refreshComponentDbStatus();
  }
}
```

```javascript
// tab-component.js
export function refreshComponentDbStatus() {
  sendToPixelForge('/api/sync/components?figmaFileKey=' + encodeURIComponent(pfSettings.url), null, 'GET')
    .then(function (res) {
      if (!res || !res.components) return;
      var dbMap = {};
      res.components.forEach(function (c) {
        if (c.figmaNodeId) dbMap[c.figmaNodeId] = c;
      });
      // 로컬 레지스트리와 비교
      Object.keys(compState.registry).forEach(function (key) {
        var entry = compState.registry[key];
        var dbEntry = dbMap[entry.figmaMasterNodeId];
        if (dbEntry) {
          entry.dbId = dbEntry.id;
          entry.dbStatus = 'synced';       // 'synced' | 'local-only' | 'deleted-from-app'
        } else if (entry.dbSyncedAt) {
          entry.dbStatus = 'deleted-from-app';
        } else {
          entry.dbStatus = 'local-only';
        }
      });
      renderRegistryList();
    });
}
```

### 4.6 레지스트리 목록 뱃지 (`tab-component.js` renderRegistryList)

```javascript
// 기존 item 렌더링에 뱃지 추가
var dbBadge = '';
if (entry.dbStatus === 'synced') {
  dbBadge = '<span class="db-badge db-badge--synced">DB</span>';
} else if (entry.dbStatus === 'deleted-from-app') {
  dbBadge = '<span class="db-badge db-badge--deleted">앱 삭제됨</span>';
}
// item.innerHTML 안의 .comp-registry-item-meta에 dbBadge 추가
```

---

## 5. `sendToPixelForge` GET 지원 확장 (`utils.js`)

현재 `sendToPixelForge`는 POST만 지원. GET도 필요.

```javascript
export async function sendToPixelForge(endpoint, data, method) {
  var url = pfSettings.url;
  var key = pfSettings.key;
  if (!url || !key) return null;

  var reqMethod = method || 'POST';
  var fetchOpts = {
    method: reqMethod,
    headers: { 'X-API-Key': key },
  };
  if (reqMethod === 'POST' && data) {
    fetchOpts.headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(data);
  }

  var fullUrl = reqMethod === 'GET'
    ? url.replace(/\/$/, '') + endpoint  // endpoint에 ?query 포함
    : url.replace(/\/$/, '') + endpoint;

  try {
    var res = await fetch(fullUrl, fetchOpts);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
```

---

## 6. state.js 추가 필드

```javascript
// ui/state.js
export var state = {
  // 기존 필드 유지...
  figmaFileKey:  '',   // [NEW] init-data에서 수신
  figmaFileName: '',   // [NEW] init-data에서 수신
};
```

`ui.js` init-data 핸들러:
```javascript
if (msg.type === 'init-data') {
  state.figmaFileKey  = msg.figmaFileKey  || '';
  state.figmaFileName = msg.fileName      || '';
  // ... 기존 코드 ...
}
```

`code.ts` init-data 송신 시 `figmaFileKey` 추가:
```typescript
figma.ui.postMessage({
  type: 'init-data',
  fileName:     figma.root.name,
  figmaFileKey: figma.fileKey || figma.root.id,  // 기존과 동일 패턴
  // ...
});
```

---

## 7. 구현 순서

| 순서 | 위치 | 작업 |
|------|------|------|
| 1 | App `schema.ts` | `componentFiles`, `componentNodeSnapshots` 테이블 추가, `components` 컬럼 추가 |
| 2 | App migration | SQL 실행 |
| 3 | App `POST /api/sync/components` | upsert 로직 전면 재작성 |
| 4 | App `GET /api/sync/components` | figmaNodeId 목록 반환 신규 |
| 5 | Plugin `utils.js` | `sendToPixelForge` GET 지원 추가 |
| 6 | Plugin `state.js` | `figmaFileKey`, `figmaFileName` 추가 |
| 7 | Plugin `code.ts` | init-data에 `figmaFileKey` 추가 |
| 8 | Plugin `tab-component.js` | `componentTypeToCategory`, `buildComponentFiles`, `refreshComponentDbStatus`, 뱃지 렌더링 |
| 9 | Plugin `ui.js` | `generate-component-result` 핸들러에 DB 전송 추가, 탭 활성화 시 조회 |
| 10 | Build + 검증 | `npm run build` → 플러그인 테스트 |

---

## 8. CSS (뱃지 스타일) — `ui.html`

```css
.db-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  margin-left: 4px;
}
.db-badge--synced {
  background: var(--success-light);
  color: var(--success);
  border: 1px solid var(--success-border);
}
.db-badge--deleted {
  background: var(--warning-light);
  color: var(--warning);
  border: 1px solid var(--warning-border);
}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial design | Jeonghak Hur |
