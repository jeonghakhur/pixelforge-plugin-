# Design: Component Registry

> Plan 참조: `docs/01-plan/features/component-registry.plan.md`
> 기존 코드 참조: `src/code.ts:550` (generateComponent), `src/ui.html:1085` (Component Panel)

---

## 1. 화면 플로우

```
[컴포넌트 탭 진입]
        │
        ├─ 선택된 노드 없음 → "Figma에서 노드를 선택하세요" 안내
        │
        └─ 노드 선택됨
              │
              ├─ 레지스트리에 있음? ──Yes──→ [레지스트리 뷰]
              │                                  저장된 코드 표시
              │                                  [수정] [업데이트] [삭제]
              │
              └─ No → [생성 뷰]
                        타입 감지 → 사용자 확인
                        스타일 방식 선택
                        [코드 생성]
                            │
                        결과 표시 (TSX / CSS 탭)
                            │
                        이름 입력 → [저장]
                            │
                        → [레지스트리 뷰]
```

---

## 2. 패널 구조

컴포넌트 탭 내부를 두 개의 서브 뷰로 구분한다.

```
[코드 생성]  [레지스트리]   ← 서브 탭 (pill 스타일, 기존 서브탭과 동일)
```

---

## 3. 서브 뷰 상세 레이아웃

### 3.1 코드 생성 뷰

```
┌──────────────────────────────────────────────┐
│ [코드 생성] [레지스트리]                       │  서브탭
├──────────────────────────────────────────────┤
│                                              │
│  선택: Button/Primary              ← 선택정보 │
│  ┌──────────────────────────────────────┐   │
│  │ 컴포넌트 타입                          │   │
│  │ [자동 감지: Button  ▼]               │   │  드롭다운 or 버튼그룹
│  │  Button / Dialog / Select / Tabs /   │   │
│  │  Tooltip / Checkbox / Layout / 기타  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  스타일 방식                                  │
│  [CSS Modules]  [Styled-Components]          │  pill 토글
│                                              │
│  [React]                [✓ TypeScript]       │  언어 (React 고정)
│                                              │
│  [코드 생성]                                 │  btn-primary
│                                              │
├──────────────────────────────────────────────┤
│  ── 결과 (생성 후 표시) ──────────────────── │
│  [TSX]  [CSS]                [복사] [저장]   │  결과 탭
│  ┌──────────────────────────────────────┐   │
│  │ import * as Dialog from ...          │   │
│  │ import styles from './Modal.module'  │   │
│  │                                      │   │
│  │ export const Modal = ...             │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  컴포넌트명  [PrimaryButton         ]        │  이름 입력
│                        [레지스트리에 저장]    │
└──────────────────────────────────────────────┘
```

**CSS 탭 (CSS Modules 방식일 때만 활성):**

```
[TSX]  [CSS]
┌────────────────────────────────────────────┐
│ .root {                                    │
│   display: inline-flex;                    │
│   background: var(--color-brand-primary);  │
│   border-radius: var(--radius-sm);         │
│ }                                          │
│ .root:hover { background: ...; }           │
└────────────────────────────────────────────┘
```

### 3.2 레지스트리 뷰

```
┌──────────────────────────────────────────────┐
│ [코드 생성] [레지스트리]                       │
├──────────────────────────────────────────────┤
│  🔍 [검색...                        ]        │
├──────────────────────────────────────────────┤
│  PrimaryButton                               │
│  Button · CSS Modules · 3일 전               │  항목
│                         [불러오기] [삭제]     │
├──────────────────────────────────────────────┤
│  ConfirmModal                                │
│  Dialog · CSS Modules · 1주 전               │
│                         [불러오기] [삭제]     │
├──────────────────────────────────────────────┤
│  총 2개                    [전체 내보내기]    │
└──────────────────────────────────────────────┘
```

### 3.3 레지스트리 뷰 — 저장된 컴포넌트 불러온 상태

```
┌──────────────────────────────────────────────┐
│ [코드 생성] [레지스트리]                       │
├──────────────────────────────────────────────┤
│  PrimaryButton            저장됨 3일 전       │
│                 [수정] [업데이트] [삭제]       │
├──────────────────────────────────────────────┤
│  [TSX]  [CSS]                         [복사] │
│  ┌──────────────────────────────────────┐   │
│  │ export const PrimaryButton = ...     │   │  읽기 전용
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**수정 모드:**

```
│  [TSX]  [CSS]              [저장] [취소]     │  버튼 변경
│  ┌──────────────────────────────────────┐   │
│  │ export const PrimaryButton = ...     │   │  textarea 편집 가능
│  └──────────────────────────────────────┘   │
```

---

## 4. 데이터 모델

### 4.1 ComponentEntry

```typescript
interface ComponentEntry {
  name: string;                          // 사용자 지정 이름 "PrimaryButton"
  figmaNodeName: string;                 // Figma 원본 이름 "Button/Primary"
  figmaMasterNodeId: string;             // 마스터 컴포넌트 ID (식별 키)
  componentType: ComponentType;
  radixPackage: string | null;           // "@radix-ui/react-dialog" | null
  styleMode: 'css-modules' | 'styled';
  useTs: boolean;
  code: {
    tsx: string;
    css: string;                         // Styled 방식이면 빈 문자열
  };
  createdAt: string;                     // ISO 날짜
  updatedAt: string;
}

type ComponentType =
  | 'button'
  | 'dialog'
  | 'select'
  | 'tabs'
  | 'tooltip'
  | 'checkbox'
  | 'switch'
  | 'accordion'
  | 'popover'
  | 'layout';
```

### 4.2 레지스트리 저장 키

```
pf-registry-{figmaFileKey}

예) pf-registry-aBcDeFgHiJkL
```

`figma.root.id` 를 file 식별자로 사용.

### 4.3 NodeMeta (code.ts → UI 전달)

```typescript
interface NodeMeta {
  nodeId: string;
  nodeName: string;
  nodeType: string;                      // "COMPONENT" | "INSTANCE" | "FRAME" 등
  masterId: string | null;               // INSTANCE → mainComponent.id, 나머지 null
  masterName: string | null;
  figmaFileId: string;                   // figma.root.id
}
```

---

## 5. 메시지 프로토콜

### 5.1 기존 메시지 확장

`getSelectionInfo()` 반환값에 `NodeMeta` 추가:

```typescript
// code.ts → UI (기존 selection-changed 확장)
{
  type: 'selection-changed',
  selection: {
    count: number;
    names: string[];
    nodeTypes: string[];
    meta: NodeMeta | null;               // 첫 번째 노드의 상세 정보 (신규)
  }
}
```

### 5.2 신규 메시지 — 레지스트리 CRUD

레지스트리 저장/조회는 `figma.clientStorage`가 plugin sandbox(code.ts)에서만 동작하므로 UI가 메시지로 요청.

```typescript
// UI → code.ts
{ type: 'registry-get';   fileId: string }
{ type: 'registry-save';  fileId: string; entry: ComponentEntry }
{ type: 'registry-delete'; fileId: string; masterId: string }

// code.ts → UI
{ type: 'registry-data';  registry: Record<string, ComponentEntry> }
{ type: 'registry-saved' }
{ type: 'registry-deleted' }
{ type: 'registry-error'; message: string }
```

### 5.3 신규 메시지 — 컴포넌트 생성

기존 `generate-component`를 확장. 옵션 추가:

```typescript
// UI → code.ts
{
  type: 'generate-component';
  styleMode: 'css-modules' | 'styled';
  componentType: ComponentType;
  useTs: boolean;
}

// code.ts → UI (기존 반환값 확장)
{
  type: 'generate-component-result';
  data: {
    name: string;
    meta: NodeMeta;
    styles: Record<string, string>;      // 노드 스타일 raw 데이터
  }
}
```

> **설계 결정**: 코드 생성(Radix 조립, CSS 문자열 생성)은 UI에서 담당.
> `code.ts`는 Figma API 접근이 필요한 노드 스타일 추출만 담당.

---

## 6. 컴포넌트 타입 감지

### 6.1 키워드 매칭 (대소문자 무시)

```typescript
const TYPE_KEYWORDS: Record<ComponentType, string[]> = {
  button:    ['button', 'btn', 'cta', 'action'],
  dialog:    ['dialog', 'modal', 'overlay', 'popup', 'sheet'],
  select:    ['select', 'dropdown', 'combobox', 'picker'],
  tabs:      ['tab', 'tabs', 'tabbar'],
  tooltip:   ['tooltip', 'hint', 'popover-tip'],
  checkbox:  ['checkbox', 'check'],
  switch:    ['switch', 'toggle'],
  accordion: ['accordion', 'collapse', 'expand'],
  popover:   ['popover', 'flyout'],
  layout:    [],                         // 기본값 (매칭 없을 때)
};

function detectType(nodeName: string): ComponentType {
  const lower = nodeName.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return type as ComponentType;
  }
  return 'layout';
}
```

### 6.2 Radix 패키지 매핑

```typescript
const RADIX_MAP: Record<ComponentType, string | null> = {
  button:    null,                          // native <button> + ARIA
  dialog:    '@radix-ui/react-dialog',
  select:    '@radix-ui/react-select',
  tabs:      '@radix-ui/react-tabs',
  tooltip:   '@radix-ui/react-tooltip',
  checkbox:  '@radix-ui/react-checkbox',
  switch:    '@radix-ui/react-switch',
  accordion: '@radix-ui/react-accordion',
  popover:   '@radix-ui/react-popover',
  layout:    null,                          // 시맨틱 HTML
};
```

---

## 7. 코드 생성 로직 (UI 담당)

### 7.1 CSS Modules 생성 흐름

```
generateCSSModules(styles, componentType, componentName, useTs)
  │
  ├─ buildTSX(styles, componentType, componentName, useTs)
  │   ├─ radixPackage 있음 → Radix import + 구조 템플릿
  │   └─ radixPackage null → 시맨틱 HTML 템플릿
  │
  └─ buildCSS(styles, componentName)
      ├─ .root { ...기본 스타일 }
      ├─ .root:hover { }          ← 호버 상태 기본 포함
      └─ .root:focus-visible { }  ← 포커스 링 기본 포함
```

### 7.2 스타일 → CSS 변환

`code.ts`에서 전달받은 `styles: Record<string, string>` (기존 `getNodeStyles` 결과)을 CSS 문자열로 변환:

```typescript
function stylesToCSS(styles: Record<string, string>, selector: string): string {
  const props = Object.entries(styles)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${props}\n}`;
}
```

### 7.3 타입별 TSX 템플릿

#### Button (Radix 없음, native + ARIA)

```tsx
// CSS Modules
interface {ComponentName}Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const {ComponentName} = ({ children, onClick, disabled }: {ComponentName}Props) => (
  <button
    className={styles.root}
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);
```

#### Dialog

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import styles from './{ComponentName}.module.css';

interface {ComponentName}Props {
  open: boolean;
  onClose: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const {ComponentName} = ({ open, onClose, title, children }: {ComponentName}Props) => (
  <Dialog.Root open={open} onOpenChange={onClose}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content} aria-describedby={undefined}>
        <Dialog.Title className={styles.title}>{title}</Dialog.Title>
        {children}
        <Dialog.Close asChild>
          <button className={styles.closeBtn} aria-label="닫기">×</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

#### Tabs

```tsx
import * as Tabs from '@radix-ui/react-tabs';
import styles from './{ComponentName}.module.css';

interface {ComponentName}Props {
  defaultValue?: string;
}

export const {ComponentName} = ({ defaultValue = 'tab1' }: {ComponentName}Props) => (
  <Tabs.Root className={styles.root} defaultValue={defaultValue}>
    <Tabs.List className={styles.list} aria-label="탭 목록">
      <Tabs.Trigger className={styles.trigger} value="tab1">탭 1</Tabs.Trigger>
      <Tabs.Trigger className={styles.trigger} value="tab2">탭 2</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content className={styles.content} value="tab1">탭 1 내용</Tabs.Content>
    <Tabs.Content className={styles.content} value="tab2">탭 2 내용</Tabs.Content>
  </Tabs.Root>
);
```

#### Layout (시맨틱 HTML)

노드 이름 키워드로 태그 결정:

```typescript
const SEMANTIC_MAP: Record<string, string> = {
  header: 'header', gnb: 'header', nav: 'nav',
  footer: 'footer',
  sidebar: 'aside',
  card: 'article', item: 'article',
  section: 'section', panel: 'section',
};

function getSemanticTag(nodeName: string): string {
  const lower = nodeName.toLowerCase();
  for (const [kw, tag] of Object.entries(SEMANTIC_MAP)) {
    if (lower.includes(kw)) return tag;
  }
  return 'div';
}
```

```tsx
export const {ComponentName} = ({ children }: { children: React.ReactNode }) => (
  <{tag} className={styles.root}>
    {children}
  </{tag}>
);
```

### 7.4 CSS 기본 생성 규칙

모든 컴포넌트에 포커스 스타일 기본 포함 (접근성):

```css
.root:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

Dialog overlay에 기본 animation 포함:

```css
@keyframes overlayShow {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.overlay {
  animation: overlayShow 150ms ease;
}
```

### 7.5 Styled-Components 생성

Radix 요소를 `styled()` 로 직접 감싸는 방식:

```typescript
function buildStyledTSX(styles, componentType, componentName, useTs) {
  if (componentType === 'dialog') {
    return `
import * as Dialog from '@radix-ui/react-dialog';
import styled, { keyframes } from 'styled-components';

const overlayShow = keyframes\`
  from { opacity: 0; }
  to   { opacity: 1; }
\`;

const StyledOverlay = styled(Dialog.Overlay)\`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: \${overlayShow} 150ms ease;
\`;

const StyledContent = styled(Dialog.Content)\`
  ${stylesToCSSBlock(styles)}
\`;
...
    `;
  }
  // 기타 타입은 해당 템플릿
}
```

---

## 8. 레지스트리 CRUD 구현

### 8.1 code.ts 추가 핸들러

```typescript
// figma.ui.onmessage 에 추가
if (msg.type === 'registry-get') {
  const key = `pf-registry-${figma.root.id}`;
  figma.clientStorage.getAsync(key)
    .then(data => figma.ui.postMessage({
      type: 'registry-data',
      registry: data ?? {}
    }))
    .catch(e => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
}

if (msg.type === 'registry-save') {
  const key = `pf-registry-${figma.root.id}`;
  figma.clientStorage.getAsync(key)
    .then(data => {
      const registry = data ?? {};
      registry[msg.entry.figmaMasterNodeId] = msg.entry;
      return figma.clientStorage.setAsync(key, registry);
    })
    .then(() => figma.ui.postMessage({ type: 'registry-saved' }))
    .catch(e => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
}

if (msg.type === 'registry-delete') {
  const key = `pf-registry-${figma.root.id}`;
  figma.clientStorage.getAsync(key)
    .then(data => {
      const registry = data ?? {};
      delete registry[msg.masterId];
      return figma.clientStorage.setAsync(key, registry);
    })
    .then(() => figma.ui.postMessage({ type: 'registry-deleted' }))
    .catch(e => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
}
```

### 8.2 getSelectionInfo() 확장

```typescript
function getSelectionInfo() {
  const sel = figma.currentPage.selection;
  let meta: NodeMeta | null = null;

  if (sel.length > 0) {
    const node = sel[0];
    const isInstance = node.type === 'INSTANCE';
    const master = isInstance ? (node as InstanceNode).mainComponent : null;

    meta = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      masterId: master?.id ?? null,
      masterName: master?.name ?? null,
      figmaFileId: figma.root.id,
    };
  }

  return {
    count: sel.length,
    names: sel.map(n => n.name),
    nodeTypes: sel.map(n => n.type),
    meta,
  };
}
```

---

## 9. UI 상태 관리

### 9.1 컴포넌트 탭 상태

```typescript
const compState = {
  // 선택 정보
  meta: null as NodeMeta | null,

  // 생성 옵션
  componentType: 'layout' as ComponentType,
  styleMode: 'css-modules' as 'css-modules' | 'styled',
  useTs: true,

  // 생성 결과
  generatedTsx: '',
  generatedCss: '',

  // 레지스트리
  registry: {} as Record<string, ComponentEntry>,
  currentEntry: null as ComponentEntry | null,   // 레지스트리 히트 항목

  // UI 모드
  subTab: 'generate' as 'generate' | 'registry',
  editMode: false,
  activeCodeTab: 'tsx' as 'tsx' | 'css',
};
```

### 9.2 노드 선택 시 처리 흐름

```
selection-changed 수신
  │
  ├─ meta === null → 선택 정보 "선택된 노드 없음"
  │
  └─ meta 있음
        │
        masterIdKey = meta.masterId ?? meta.nodeId
        │
        registry[masterIdKey] 있음?
          Yes → currentEntry 설정 → 레지스트리 뷰 자동 표시
          No  → componentType 자동 감지 → 생성 뷰 유지
```

---

## 10. 기존 코드 변경 사항

### 10.1 code.ts 변경

| 위치 | 변경 내용 |
|------|----------|
| `getSelectionInfo()` | `meta: NodeMeta` 필드 추가 |
| `generateComponent()` | `styles` raw 데이터 반환으로 변경 (TSX 생성은 UI로 이동) |
| `figma.ui.onmessage` | `registry-get`, `registry-save`, `registry-delete` 핸들러 추가 |

### 10.2 ui.html 변경

| 위치 | 변경 내용 |
|------|----------|
| `#panel-component` | 서브탭 2개 추가 (생성/레지스트리) |
| 컴포넌트 타입 선택 UI | 드롭다운 추가 |
| 스타일 방식 선택 UI | pill 토글 추가 |
| 결과 영역 | TSX/CSS 탭 분리 |
| 저장 폼 | 이름 입력 + 저장 버튼 추가 |
| 레지스트리 목록 | 검색 + 목록 + 불러오기/삭제 |
| `"JSON 저장"` 버튼 | `"코드 저장"` 으로 텍스트 수정 |
| i18n | 신규 키 추가 |

---

## 11. 구현 순서

```
Phase 1 — 기반 (code.ts)
  1-1. getSelectionInfo() NodeMeta 확장
  1-2. generateComponent() styles raw 반환으로 변경
  1-3. registry-get / registry-save / registry-delete 핸들러

Phase 2 — 코드 생성 (ui.html JS)
  2-1. 타입 감지 함수 (detectType)
  2-2. CSS Modules TSX 템플릿 (Button, Dialog, Tabs, Layout)
  2-3. CSS 생성 함수 (stylesToCSS)
  2-4. Styled-Components TSX 템플릿

Phase 3 — UI (ui.html HTML/CSS)
  3-1. 서브탭 (생성 / 레지스트리)
  3-2. 타입 선택 드롭다운
  3-3. 스타일 방식 pill 토글
  3-4. 결과 TSX/CSS 탭
  3-5. 저장 폼 (이름 입력)

Phase 4 — 레지스트리 UI
  4-1. 레지스트리 목록 렌더링
  4-2. 검색 필터
  4-3. 불러오기 / 수정 / 삭제 동작
  4-4. 업데이트 (Figma 재추출 후 덮어쓰기)

Phase 5 — 마무리
  5-1. "JSON 저장" → "코드 저장" 텍스트 수정
  5-2. i18n 키 추가 (한/영)
  5-3. 용량 초과 경고 (1MB 근접 시)
```

---

## 12. 완료 기준

- [ ] NodeMeta 포함한 selection-changed 메시지 동작
- [ ] 컴포넌트 타입 자동 감지 (button/dialog/tabs/layout 4종 이상)
- [ ] CSS Modules 코드 생성 (TSX + CSS 분리 출력)
- [ ] Styled-Components 코드 생성 (TSX 단일 출력)
- [ ] 포커스 스타일 (`focus-visible`) 기본 포함
- [ ] 레지스트리 저장 / 불러오기 / 수정 / 삭제 동작
- [ ] 동일 노드 선택 시 저장된 코드 즉시 표시
- [ ] 레지스트리 목록 검색 동작
- [ ] "JSON 저장" → "코드 저장" 수정
