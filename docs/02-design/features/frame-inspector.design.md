# Design — frame-inspector

> **배경**: 앱에서 Figma 프레임을 퍼블리싱하려면 레이아웃·컴포넌트·스타일 완전한 구조 데이터가 필요하다.
> 플러그인이 선택된 FRAME을 재귀 탐색하여 `StructureNode` JSON 트리로 직렬화하고 앱에 전달한다.

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Problem** | 앱이 Figma 프레임을 페이지로 퍼블리싱하려면 레이아웃·컴포넌트·스타일 구조가 필요하지만, 현재 플러그인은 이 데이터를 전달하는 수단이 없다 |
| **Solution** | `export-frame-inspect` 메시지 → `buildStructureNode()` 재귀 탐색 → `FrameInspectResult` JSON → 앱 전송 |
| **Function/UX Effect** | 컴포넌트 탭 "프레임 구조 전송" 버튼 1클릭으로 전체 레이아웃 트리 + 컴포넌트 참조 + CSS 속성 전달 |
| **Core Value** | 앱이 `componentRef.componentKey`로 DB 매칭 후 퍼블리싱 가능한 구조를 즉시 확보 |

---

## 1. 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `StructureNode`·`FrameInspectResult` 타입, 4개 신규 함수, `onmessage` 핸들러 추가 |
| `src/ui/tab-component.js` | 수정 | "프레임 구조 전송" 버튼 + `frame-inspect-result` 수신·앱 전송 |
| `ARCHITECTURE.md` | 수정 | 메시지 타입 테이블에 `export-frame-inspect` 행 추가 |

---

## 2. 데이터 흐름

```
UI: "프레임 구조 전송" 버튼 클릭
  → parent.postMessage({ pluginMessage: { type: 'export-frame-inspect', options: { maxDepth: 8 } } })

code.ts: figma.ui.onmessage
  → handleFrameInspect({ maxDepth: 8 })
      → 선택 노드 FRAME 검증 (없으면 error)
      → buildStructureNode(node, absX=0, absY=0, depth=0, maxDepth=8)
          ┌─ mapLayout(node)               → layout 필드
          ├─ extractAppearance(node)        → appearance 필드
          ├─ extractText(node)              → text? 필드 (TEXT 노드)
          ├─ extractComponentRef(node)      → componentRef? 필드 (INSTANCE 노드)
          └─ node.children?.map(child → buildStructureNode(child, ...))
      → FrameInspectResult { meta, root }
  → figma.ui.postMessage({ type: 'frame-inspect-result', data: FrameInspectResult })

UI: message 수신
  → sendToPixelForge('/api/sync/frame-inspect', data)
  → showToast('프레임 구조 전송 완료')

오류 시:
  → figma.ui.postMessage({ type: 'frame-inspect-error', message: string })
  → showToast(message, 'error')
```

---

## 3. 타입 정의 — `src/code.ts`

### 3.1 `StructureNode`

```typescript
interface StructureNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;

  geometry: {
    x: number;          // 부모 상대 x
    y: number;          // 부모 상대 y
    width: number;
    height: number;
    absoluteX: number;  // 캔버스 절대 x
    absoluteY: number;  // 캔버스 절대 y
    rotation: number;
  };

  layout: {
    mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'WRAP';
    // Auto Layout 있을 때만
    direction?: 'row' | 'column';
    wrap?: boolean;
    justifyContent?: string;  // flex-start | center | flex-end | space-between | space-around
    alignItems?: string;      // flex-start | center | flex-end | stretch | baseline
    gap?: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    // Auto Layout 없을 때만
    constraints?: {
      horizontal: string;  // MIN | CENTER | MAX | STRETCH | SCALE
      vertical: string;
    };
    sizing?: {
      horizontal: string;  // FIXED | HUG | FILL
      vertical: string;
    };
  };

  appearance: {
    fills: readonly Paint[];
    strokes: readonly Paint[];
    strokeWeight: number;
    strokeAlign: string;
    cornerRadius: number | number[];   // 균일 or [TL, TR, BR, BL]
    opacity: number;
    effects: readonly Effect[];
    blendMode: string;
    clipsContent?: boolean;            // FRAME 전용
  };

  text?: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    fontStyle: string;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
    textAlign: string;
    verticalAlign: string;
    textDecoration: string;
    textCase: string;
    fills: readonly Paint[];
    styleId?: string;
  };

  componentRef?: {
    componentId: string;
    componentKey: string;
    componentSetKey?: string;
    componentName: string;
    componentSetName?: string;
    properties: Record<string, ComponentPropertyValue>;
  };

  truncated?: boolean;         // depth >= maxDepth
  children?: StructureNode[];
}

interface FrameInspectResult {
  meta: {
    frameId: string;
    frameName: string;
    extractedAt: string;
    totalNodes: number;
    width: number;
    height: number;
    maxDepth: number;
  };
  root: StructureNode;
}
```

---

## 4. 신규 함수 — `src/code.ts`

### 4.1 `mapLayout(node)` — Auto Layout → CSS Flexbox 매핑

```typescript
type LayoutNode = FrameNode | ComponentNode | InstanceNode;

function mapLayout(node: SceneNode): StructureNode['layout'] {
  const hasLayout = 'layoutMode' in node;
  if (!hasLayout || (node as LayoutNode).layoutMode === 'NONE') {
    return {
      mode: 'NONE',
      constraints: 'constraints' in node
        ? {
            horizontal: (node as any).constraints.horizontal,
            vertical: (node as any).constraints.vertical,
          }
        : undefined,
      sizing: 'layoutSizingHorizontal' in node
        ? {
            horizontal: (node as any).layoutSizingHorizontal,
            vertical: (node as any).layoutSizingVertical,
          }
        : undefined,
    };
  }

  const f = node as LayoutNode;
  const isHorizontal = f.layoutMode === 'HORIZONTAL';

  const JUSTIFY: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    SPACE_BETWEEN: 'space-between',
  };
  const ALIGN: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    STRETCH: 'stretch',
    BASELINE: 'baseline',
  };

  return {
    mode: f.layoutMode as 'HORIZONTAL' | 'VERTICAL' | 'WRAP',
    direction: isHorizontal ? 'row' : 'column',
    wrap: f.layoutWrap === 'WRAP',
    justifyContent: JUSTIFY[f.primaryAxisAlignItems] ?? f.primaryAxisAlignItems,
    alignItems: ALIGN[f.counterAxisAlignItems] ?? f.counterAxisAlignItems,
    gap: f.itemSpacing,
    padding: {
      top: f.paddingTop,
      right: f.paddingRight,
      bottom: f.paddingBottom,
      left: f.paddingLeft,
    },
    sizing: {
      horizontal: (f as any).layoutSizingHorizontal ?? 'FIXED',
      vertical: (f as any).layoutSizingVertical ?? 'FIXED',
    },
  };
}
```

### 4.2 `extractAppearance(node)` — 시각 스타일 추출

```typescript
function extractAppearance(node: SceneNode): StructureNode['appearance'] {
  const n = node as any;
  let cornerRadius: number | number[] = 0;
  if ('cornerRadius' in n) {
    cornerRadius = typeof n.cornerRadius === 'number' && n.cornerRadius !== figma.mixed
      ? n.cornerRadius
      : [
          n.topLeftRadius ?? 0,
          n.topRightRadius ?? 0,
          n.bottomRightRadius ?? 0,
          n.bottomLeftRadius ?? 0,
        ];
  }

  return {
    fills:         'fills' in n ? (n.fills === figma.mixed ? [] : n.fills) : [],
    strokes:       'strokes' in n ? n.strokes : [],
    strokeWeight:  'strokeWeight' in n ? (n.strokeWeight === figma.mixed ? 0 : n.strokeWeight) : 0,
    strokeAlign:   'strokeAlign' in n ? n.strokeAlign : 'INSIDE',
    cornerRadius,
    opacity:       'opacity' in n ? n.opacity : 1,
    effects:       'effects' in n ? n.effects : [],
    blendMode:     'blendMode' in n ? n.blendMode : 'NORMAL',
    clipsContent:  n.type === 'FRAME' ? n.clipsContent : undefined,
  };
}
```

### 4.3 `extractComponentRef(node)` — INSTANCE 참조 추출

```typescript
async function extractComponentRef(
  node: InstanceNode
): Promise<StructureNode['componentRef'] | undefined> {
  try {
    const main = await node.getMainComponentAsync();
    if (!main) return undefined;

    const set = main.parent?.type === 'COMPONENT_SET'
      ? (main.parent as ComponentSetNode)
      : null;

    let properties: Record<string, ComponentPropertyValue> = {};
    try {
      properties = node.componentProperties ?? {};
    } catch (_) {}

    return {
      componentId:      main.id,
      componentKey:     main.key,
      componentSetKey:  set?.key,
      componentName:    main.name,
      componentSetName: set?.name,
      properties,
    };
  } catch (e) {
    console.warn('[frame-inspector] extractComponentRef failed:', String(e));
    return undefined;
  }
}
```

### 4.4 `buildStructureNode(node, ...)` — 재귀 빌더 (핵심)

```typescript
let _totalNodes = 0;

async function buildStructureNode(
  node: SceneNode,
  parentAbsX: number,
  parentAbsY: number,
  depth: number,
  maxDepth: number
): Promise<StructureNode> {
  _totalNodes++;

  const abs = (node as any).absoluteBoundingBox as
    { x: number; y: number; width: number; height: number } | null;

  const absX = abs?.x ?? parentAbsX;
  const absY = abs?.y ?? parentAbsY;

  const result: StructureNode = {
    id:      node.id,
    name:    node.name,
    type:    node.type,
    visible: node.visible,
    locked:  node.locked ?? false,

    geometry: {
      x:         abs ? abs.x - parentAbsX : (node as any).x ?? 0,
      y:         abs ? abs.y - parentAbsY : (node as any).y ?? 0,
      width:     abs?.width  ?? (node as any).width  ?? 0,
      height:    abs?.height ?? (node as any).height ?? 0,
      absoluteX: absX,
      absoluteY: absY,
      rotation:  (node as any).rotation ?? 0,
    },

    layout:     mapLayout(node),
    appearance: extractAppearance(node),
  };

  // TEXT 전용
  if (node.type === 'TEXT') {
    const t = node as TextNode;
    result.text = {
      content:       t.characters,
      fontSize:      t.fontSize === figma.mixed ? 0 : t.fontSize,
      fontFamily:    t.fontName === figma.mixed ? '' : t.fontName.family,
      fontWeight:    t.fontName === figma.mixed ? 400 : (t.fontName as FontName).style === 'Bold' ? 700 : 400,
      fontStyle:     t.fontName === figma.mixed ? 'normal' : (t.fontName as FontName).style,
      lineHeight:    t.lineHeight === figma.mixed ? { unit: 'AUTO' } : t.lineHeight,
      letterSpacing: t.letterSpacing === figma.mixed ? { unit: 'PIXELS', value: 0 } : t.letterSpacing,
      textAlign:     t.textAlignHorizontal === figma.mixed ? 'LEFT' : t.textAlignHorizontal,
      verticalAlign: t.textAlignVertical,
      textDecoration: t.textDecoration === figma.mixed ? 'NONE' : t.textDecoration,
      textCase:      t.textCase === figma.mixed ? 'ORIGINAL' : t.textCase,
      fills:         t.fills === figma.mixed ? [] : t.fills,
      styleId:       typeof t.textStyleId === 'string' ? t.textStyleId : undefined,
    };
  }

  // INSTANCE 전용
  if (node.type === 'INSTANCE') {
    result.componentRef = await extractComponentRef(node as InstanceNode);
  }

  // 재귀 children
  if (depth >= maxDepth) {
    result.truncated = true;
    return result;
  }

  if ('children' in node && node.children.length > 0) {
    result.children = await Promise.all(
      (node.children as SceneNode[]).map((child) =>
        buildStructureNode(child, absX, absY, depth + 1, maxDepth)
      )
    );
  }

  return result;
}
```

### 4.5 `handleFrameInspect(options)` — 메시지 핸들러

```typescript
async function handleFrameInspect(options: { maxDepth?: number } = {}): Promise<void> {
  const maxDepth = options.maxDepth ?? 8;
  const node = figma.currentPage.selection[0];

  if (!node || (node.type !== 'FRAME' && node.type !== 'COMPONENT' && node.type !== 'INSTANCE')) {
    figma.ui.postMessage({
      type: 'frame-inspect-error',
      message: 'FRAME 노드를 선택해 주세요.',
    });
    return;
  }

  _totalNodes = 0;
  const abs = (node as any).absoluteBoundingBox as { x: number; y: number } | null;
  const root = await buildStructureNode(node, abs?.x ?? 0, abs?.y ?? 0, 0, maxDepth);

  const result: FrameInspectResult = {
    meta: {
      frameId:     node.id,
      frameName:   node.name,
      extractedAt: new Date().toISOString(),
      totalNodes:  _totalNodes,
      width:       (node as any).width ?? 0,
      height:      (node as any).height ?? 0,
      maxDepth,
    },
    root,
  };

  figma.ui.postMessage({ type: 'frame-inspect-result', data: result });
}
```

---

## 5. `onmessage` 핸들러 추가 — `src/code.ts`

```typescript
// figma.ui.onmessage 내부에 추가 (generate-component 핸들러 바로 뒤)
if (msg.type === 'export-frame-inspect') {
  handleFrameInspect((msg as any).options ?? {})
    .catch((e) =>
      figma.ui.postMessage({ type: 'frame-inspect-error', message: String(e) })
    );
}
```

---

## 6. UI 변경 — `src/ui/tab-component.js`

### 6.1 버튼 추가

기존 컴포넌트 탭 하단 액션 영역에 "프레임 구조 전송" 버튼 추가:

```javascript
// 컴포넌트 탭 초기화 시 버튼 이벤트 등록
var btnFrameInspect = document.getElementById('btn-frame-inspect');
if (btnFrameInspect) {
  btnFrameInspect.addEventListener('click', function () {
    parent.postMessage({
      pluginMessage: { type: 'export-frame-inspect', options: { maxDepth: 8 } }
    }, '*');
  });
}
```

### 6.2 메시지 수신 처리

```javascript
// ui.js 또는 tab-component.js의 window.onmessage 핸들러 내
if (msg.type === 'frame-inspect-result') {
  sendToPixelForge('/api/sync/frame-inspect', msg.data)
    .then(function () {
      showToast('프레임 구조 전송 완료');
    })
    .catch(function (e) {
      showToast('전송 실패: ' + e.message, 'error');
    });
}
if (msg.type === 'frame-inspect-error') {
  showToast(msg.message, 'error');
}
```

### 6.3 버튼 HTML (`src/ui.html`)

컴포넌트 탭 버튼 영역에 추가:
```html
<button id="btn-frame-inspect" class="btn btn-secondary">
  프레임 구조 전송
</button>
```

---

## 7. ARCHITECTURE.md 업데이트

메시지 타입 테이블에 아래 행 추가:

| 방향 | 타입 | 설명 |
|------|------|------|
| UI → code | `export-frame-inspect` | 선택 프레임 구조 추출 요청 |
| code → UI | `frame-inspect-result` | `FrameInspectResult` 전달 |
| code → UI | `frame-inspect-error` | 오류 메시지 전달 |

---

## 8. 엣지케이스

| 케이스 | 처리 방식 |
|--------|----------|
| 선택 없음 또는 FRAME 아닌 노드 | `frame-inspect-error` — "FRAME 노드를 선택해 주세요" |
| INSTANCE `getMainComponentAsync` 실패 | try/catch → `componentRef: undefined`, 계속 진행 |
| `fills === figma.mixed` (텍스트 mixed) | 빈 배열 `[]` 반환 |
| `cornerRadius === figma.mixed` | 4-모서리 개별값 배열로 폴백 |
| `absoluteBoundingBox === null` | `node.x / node.y` 폴백 (그룹 내 숨겨진 노드) |
| depth >= maxDepth | `truncated: true` 마커, children 생략 |
| IMAGE fill 포함 | `imageHash` 참조만 포함, base64 제외 |
| 페이로드 2MB 초과 | `console.warn` 경고 출력, 전송은 허용 |

---

## 9. 구현 순서 체크리스트

- [ ] `src/code.ts`: `StructureNode` / `FrameInspectResult` 타입 정의
- [ ] `src/code.ts`: `mapLayout()` 구현
- [ ] `src/code.ts`: `extractAppearance()` 구현
- [ ] `src/code.ts`: `extractComponentRef()` 구현
- [ ] `src/code.ts`: `buildStructureNode()` 재귀 구현
- [ ] `src/code.ts`: `handleFrameInspect()` 구현
- [ ] `src/code.ts`: `onmessage`에 `export-frame-inspect` 핸들러 추가
- [ ] `src/ui.html`: "프레임 구조 전송" 버튼 추가
- [ ] `src/ui/tab-component.js`: 버튼 이벤트 + `frame-inspect-result` 수신·전송
- [ ] `ARCHITECTURE.md`: 메시지 타입 테이블 업데이트
- [ ] `npm run build` 성공 확인
- [ ] Figma에서 Auto Layout 프레임 선택 → 앱 수신 확인
- [ ] INSTANCE 포함 프레임 → `componentRef` 정상 포함 확인
