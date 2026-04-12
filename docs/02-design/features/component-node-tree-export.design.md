# Design: Component Node Tree Export (100% Fidelity)

> **Plan 참조**: `docs/01-plan/features/component-node-tree-export.plan.md`
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.5.0
> **Date**: 2026-04-11
> **Status**: Draft
> **Depends on**: `component-radix-generation.design.md` (기존 `GenerateComponentResult` 인터페이스)

---

## Executive Summary

| 관점 | 내용 |
|---|---|
| **목표** | 플러그인이 원자 컴포넌트(Button/Input/Checkbox/Radio/Switch 등)의 **모든 Figma 노드 구조**를 재귀 트리로 직렬화하여 앱이 픽셀 단위로 재현 가능한 데이터 계약을 수립 |
| **접근** | 범용 단일 파일(`node-tree.ts`)의 `buildNodeTree()` 함수가 모든 SceneNode를 재귀 처리. 의미론 추론(`text-role`, `shape-kind`)만 별도 모듈로 레이어링 |
| **범위** | `src/extractors/` 신규 디렉터리 생성, 기존 `src/code.ts`의 스타일 추출 로직 이전, `GenerateComponentResult` 타입 확장, variants 배열에 `nodeTree` 필드 추가 |
| **하위 호환** | 기존 `childStyles`, `html`, `htmlCss`, `htmlClass`, `jsx` 필드는 **유지** |

---

## 1. 아키텍처

### 1.1 모듈 구조

```
src/
├── code.ts                      # 기존 플러그인 엔트리 (Figma API 접근)
└── extractors/                  # 🆕 신규 디렉터리
    ├── index.ts                 # 공개 API 묶음
    ├── node-tree.ts             # ⭐ buildNodeTree() — 범용 재귀 추출
    ├── node-styles.ts           # getNodeStyles() 이전 (기존 로직 재사용)
    ├── text-role.ts             # inferTextRole() — TEXT 역할 추론
    ├── shape-kind.ts            # resolveShape() — 도형 분류
    ├── variant-slug.ts          # buildVariantSlug() — property → slug
    └── types.ts                 # NodeTreeEntry, TextRole, ShapeKind 타입 정의
```

### 1.2 의존성 그래프

```
code.ts (generateComponent)
  └── extractors/index.ts
        ├── node-tree.ts
        │     ├── node-styles.ts
        │     ├── text-role.ts
        │     └── shape-kind.ts
        ├── variant-slug.ts
        └── types.ts
```

### 1.3 레이어 책임

| 레이어 | 역할 | Figma API 의존 |
|---|---|:---:|
| **node-tree** | SceneNode → NodeTreeEntry 재귀 변환 조립 | ✓ (SceneNode 타입) |
| **node-styles** | SceneNode → CSS Record (color, font, padding, ...) | ✓ |
| **text-role** | TextNode → TextRole enum (이름/부모/위치 기반 추론) | ✓ |
| **shape-kind** | SceneNode → ShapeKind enum + 도형별 스타일 보정 | ✓ |
| **variant-slug** | VariantProperties → slug string | ✗ (순수 함수) |
| **types** | 공용 타입 정의 | ✗ |

---

## 2. 타입 정의

### 2.1 `types.ts`

```ts
// src/extractors/types.ts

/** Figma 도형 노드의 종류 */
export type ShapeKind =
  | 'vector'       // VECTOR
  | 'ellipse'      // ELLIPSE
  | 'rectangle'    // RECTANGLE
  | 'line'         // LINE
  | 'polygon'      // POLYGON
  | 'star'         // STAR
  | 'boolean';     // BOOLEAN_OPERATION

/** TEXT 노드의 의미론적 역할 힌트 */
export type TextRole =
  | 'label'        // 폼 필드의 라벨
  | 'placeholder'  // 입력 전 힌트 텍스트
  | 'value'        // 실제 값 / 버튼 라벨 / 표시 텍스트
  | 'helper'       // 필드 아래 도움말
  | 'error'        // 에러 메시지
  | 'counter'      // 글자 수 카운터
  | 'action'       // CTA 텍스트
  | 'title'        // 제목
  | 'description'  // 설명
  | 'unit'         // 단위 표시 (px, %)
  | 'caption'      // 캡션
  | 'unknown';     // 역할 추론 실패

/** 재귀 nodeTree 엔트리 */
export interface NodeTreeEntry {
  /** 경로 기반 ID ("root", "root.0", "root.1.0") */
  id: string;
  /** Figma 노드 타입 (SceneNode['type']) */
  type: string;
  /** Figma 노드 이름 */
  name: string;
  /** CSS 스타일 Record (getNodeStyles 결과) */
  styles: Record<string, string>;
  /** TEXT 노드: 실제 문자열 */
  characters?: string;
  /** TEXT 노드: 의미론적 역할 힌트 */
  textRole?: TextRole;
  /** 도형 노드: 도형 종류 */
  shape?: ShapeKind;
  /** VECTOR 노드: SVG path 문자열 (추출 가능한 경우) */
  pathData?: string;
  /** INSTANCE 노드: 참조 중인 마스터 컴포넌트 이름 */
  masterName?: string;
  /** 자식 노드 (leaf는 omit) */
  children?: NodeTreeEntry[];
}
```

### 2.2 확장된 `VariantStyleEntry`

```ts
// src/extractors/types.ts (이어서)

export interface VariantStyleEntry {
  /** 기존: variant property 맵 */
  properties: Record<string, string>;
  /** 🆕 property 조합 slug */
  variantSlug: string;
  /** 기존: 루트 노드 CSS */
  styles: Record<string, string>;
  /** 기존: 1-level 자식 CSS (하위 호환 유지) */
  childStyles: Record<string, Record<string, string>>;
  /** 🆕 재귀 완전 트리 */
  nodeTree: NodeTreeEntry;
}
```

### 2.3 확장된 `GenerateComponentResult`

```ts
// src/code.ts (기존 인터페이스 확장)

interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;

  // 기존 출력 필드 (하위 호환)
  html: string;
  htmlClass: string;
  htmlCss: string;
  jsx: string;
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;
  radixProps: { color: string; size: string };
  variantOptions?: Record<string, string[]>;
  variants?: VariantStyleEntry[];   // ← VariantStyleEntry 확장 적용됨
  fullNode: Record<string, unknown>;

  // 🆕 재귀 트리
  nodeTree: NodeTreeEntry;
}
```

---

## 3. 핵심 함수 설계

### 3.1 `buildNodeTree()` — 범용 재귀 추출

```ts
// src/extractors/node-tree.ts

import { NodeTreeEntry } from './types';
import { getNodeStyles } from './node-styles';
import { inferTextRole } from './text-role';
import { resolveShape } from './shape-kind';
import { safeGetText } from './node-styles';  // 기존 헬퍼 재사용

/**
 * Figma SceneNode를 재귀 NodeTreeEntry로 변환한다.
 * 모든 노드 타입을 동일 로직으로 처리 — 컴포넌트별 분기 없음.
 *
 * @param node - 변환할 SceneNode
 * @param path - 경로 기반 ID (기본값: 'root')
 * @returns 완전한 NodeTreeEntry 재귀 트리
 */
export function buildNodeTree(node: SceneNode, path = 'root'): NodeTreeEntry {
  const entry: NodeTreeEntry = {
    id: path,
    type: node.type,
    name: node.name || `unnamed-${node.type.toLowerCase()}`,
    styles: getNodeStyles(node),
  };

  // ── TEXT 노드 특수 처리 ──────────────────────────
  if (node.type === 'TEXT') {
    entry.characters = safeGetText(node as TextNode) ?? '';
    entry.textRole = inferTextRole(node as TextNode);
    // 타이포 스타일은 getNodeStyles()가 이미 포함
  }

  // ── 도형 노드 (VECTOR / ELLIPSE / RECTANGLE / LINE / ...) ──
  const shape = resolveShape(node);
  if (shape) {
    entry.shape = shape;
    // ELLIPSE는 border-radius 50% 강제 (resolveShape 내부에서 styles 수정)
    if (shape === 'ellipse' && !entry.styles['border-radius']) {
      entry.styles['border-radius'] = '50%';
    }
    // VECTOR는 pathData 선택적 추출
    if (shape === 'vector') {
      const pathData = extractVectorPath(node as VectorNode);
      if (pathData) entry.pathData = pathData;
    }
  }

  // ── INSTANCE 노드 ────────────────────────────────
  if (node.type === 'INSTANCE') {
    const inst = node as InstanceNode;
    try {
      const master = inst.mainComponent;
      if (master) entry.masterName = master.name;
    } catch {
      // mainComponent 접근 실패 시 무시
    }
  }

  // ── 자식 재귀 ───────────────────────────────────
  if ('children' in node) {
    const children = (node as ChildrenMixin).children as readonly SceneNode[];
    if (children.length > 0) {
      entry.children = children.map((child, i) =>
        buildNodeTree(child, `${path}.${i}`)
      );
    }
  }

  return entry;
}

/** VECTOR 노드의 SVG path 문자열 추출 (실패 허용) */
function extractVectorPath(node: VectorNode): string | null {
  try {
    const paths = node.vectorPaths;
    if (paths && paths.length > 0) {
      return paths.map((p) => p.data).join(' ');
    }
  } catch {
    // Figma API 제한 또는 권한 문제
  }
  return null;
}
```

### 3.2 `inferTextRole()` — TEXT 역할 추론

```ts
// src/extractors/text-role.ts

import { TextRole } from './types';

/**
 * TEXT 노드의 의미론적 역할을 추론한다.
 * 우선순위: 이름 매칭 → 부모 힌트 → 위치 → 폴백
 */
export function inferTextRole(node: TextNode): TextRole {
  const name = (node.name || '').toLowerCase().trim();

  // 1) 이름 기반 직접 매칭
  const nameMatch = matchByName(name);
  if (nameMatch !== 'unknown') return nameMatch;

  // 2) 부모 노드 힌트
  const parentMatch = matchByParent(node);
  if (parentMatch !== 'unknown') return parentMatch;

  // 3) 형제 내 위치 기반
  const positionMatch = matchByPosition(node);
  if (positionMatch !== 'unknown') return positionMatch;

  // 4) 폴백
  return 'unknown';
}

function matchByName(name: string): TextRole {
  const patterns: Array<[RegExp, TextRole]> = [
    [/\b(placeholder|placeholder text)\b/i, 'placeholder'],
    [/\b(label|field label|form label)\b/i, 'label'],
    [/\b(value|input value|selected)\b/i, 'value'],
    [/\b(helper|hint|help text|helper text)\b/i, 'helper'],
    [/\b(error|error message|validation)\b/i, 'error'],
    [/\b(counter|char count|max length)\b/i, 'counter'],
    [/\b(action|cta|button text|button label)\b/i, 'action'],
    [/\b(title|heading|headline)\b/i, 'title'],
    [/\b(description|subtitle|body)\b/i, 'description'],
    [/\b(unit|suffix|prefix)\b/i, 'unit'],
    [/\b(caption|footnote)\b/i, 'caption'],
  ];
  for (const [re, role] of patterns) {
    if (re.test(name)) return role;
  }
  return 'unknown';
}

function matchByParent(node: TextNode): TextRole {
  const parent = node.parent;
  if (!parent) return 'unknown';
  const pname = (parent.name || '').toLowerCase();
  if (/\b(label)\b/i.test(pname)) return 'label';
  if (/\b(helper|hint)\b/i.test(pname)) return 'helper';
  if (/\b(error)\b/i.test(pname)) return 'error';
  if (/\b(placeholder)\b/i.test(pname)) return 'placeholder';
  if (/\b(counter)\b/i.test(pname)) return 'counter';
  if (/\b(button|cta)\b/i.test(pname)) return 'action';
  return 'unknown';
}

function matchByPosition(node: TextNode): TextRole {
  const parent = node.parent;
  if (!parent || !('children' in parent)) return 'unknown';
  const siblings = (parent.children as readonly SceneNode[])
    .filter((c) => c.type === 'TEXT') as TextNode[];
  if (siblings.length <= 1) return 'unknown';

  // y좌표 기준 정렬
  const sorted = [...siblings].sort((a, b) => a.y - b.y);
  const idx = sorted.indexOf(node);

  // 최상단 TEXT = label 가능성
  if (idx === 0 && sorted.length >= 2) return 'label';
  // 마지막 TEXT = helper 가능성
  if (idx === sorted.length - 1 && sorted.length >= 3) return 'helper';

  return 'unknown';
}
```

### 3.3 `resolveShape()` — 도형 분류

```ts
// src/extractors/shape-kind.ts

import { ShapeKind } from './types';

/**
 * SceneNode가 도형 노드인지 판단하고 ShapeKind를 반환한다.
 * FRAME/GROUP/COMPONENT 등 컨테이너는 null 반환.
 */
export function resolveShape(node: SceneNode): ShapeKind | null {
  switch (node.type) {
    case 'VECTOR':            return 'vector';
    case 'ELLIPSE':           return 'ellipse';
    case 'RECTANGLE':         return 'rectangle';
    case 'LINE':              return 'line';
    case 'POLYGON':           return 'polygon';
    case 'STAR':              return 'star';
    case 'BOOLEAN_OPERATION': return 'boolean';
    default:                  return null;
  }
}
```

### 3.4 `buildVariantSlug()` — property 조합 slug

```ts
// src/extractors/variant-slug.ts

/**
 * variant properties 맵을 slug 식별자로 변환한다.
 *
 * 규칙:
 *   1. 각 값 소문자화
 *   2. 공백 → '-' (kebab-case)
 *   3. 특수문자 제거 (_, -, a-z, 0-9만 허용)
 *   4. property 순서는 입력 맵의 선언 순서 유지
 *   5. '_'로 join
 *
 * @example
 *   buildVariantSlug({ size: 'md', hierarchy: 'Primary', state: 'Default' })
 *   // → 'md_primary_default'
 */
export function buildVariantSlug(props: Record<string, string>): string {
  return Object.entries(props)
    .map(([_, val]) =>
      String(val || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
    )
    .filter((v) => v.length > 0)
    .join('_');
}
```

### 3.5 `code.ts` 통합 지점

#### 3.5.1 import 추가

```ts
// src/code.ts 상단
import {
  buildNodeTree,
  buildVariantSlug,
  getNodeStyles,
  safeGetText,
} from './extractors';
import type { NodeTreeEntry, VariantStyleEntry } from './extractors/types';
```

#### 3.5.2 `variants` 배열 생성 확장 (기존 2227~2233행)

```ts
// BEFORE
variants = (parentSet.children as ComponentNode[]).map((child) => ({
  properties: Object.fromEntries(
    Object.entries(child.variantProperties ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  ),
  styles: getNodeStyles(child),
  childStyles: getChildStyles(child),
}));

// AFTER
variants = (parentSet.children as ComponentNode[]).map((child) => {
  const props = Object.fromEntries(
    Object.entries(child.variantProperties ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    properties: props,
    variantSlug: buildVariantSlug(props),           // 🆕
    styles: getNodeStyles(child),                    // 기존 유지
    childStyles: getChildStyles(child),              // 기존 유지 (하위 호환)
    nodeTree: buildNodeTree(child),                  // 🆕
  };
});
```

#### 3.5.3 반환 객체에 `nodeTree` 추가 (기존 2238행 부근)

```ts
return {
  name: effectiveName,
  meta: { ... },
  styles: rootStyles,
  html: nodeToHtml(node, 0),
  htmlClass: htmlClassResult.html,
  htmlCss: htmlClassResult.css,
  jsx: nodeToJsx(node, 0),
  detectedType: detectComponentType(node),
  texts: extractTexts(node),
  childStyles: getChildStyles(node),             // 기존 유지
  nodeTree: buildNodeTree(node),                 // 🆕
  radixProps: { ... },
  variantOptions,
  variants,
  fullNode: serializeFullNode(node),
};
```

---

## 4. 모듈 이전 계획 (node-styles.ts, safeGetText)

현재 `src/code.ts`에 있는 다음 함수들을 `src/extractors/node-styles.ts`로 이전한다:

| 함수 | 현재 위치 | 이전 위치 | 공개 여부 |
|---|---|---|---|
| `getNodeStyles` | `code.ts:~1500` | `extractors/node-styles.ts` | export |
| `safeGetText` | `code.ts:1782-1790` | `extractors/node-styles.ts` | export |
| `resolveBoundColor` | `code.ts:1741-1764` | `extractors/node-styles.ts` | (내부) |
| `toCssVarName` | `code.ts:945-960` | `extractors/node-styles.ts` | export |
| `getChildStyles` | `code.ts:2177-2185` | **유지** (하위 호환용) | (code.ts 내부) |

**주의**: `getChildStyles`는 `code.ts`에 그대로 두어 하위 호환을 유지한다. `buildNodeTree`가 별도 경로로 동작.

---

## 5. 원자 컴포넌트별 예상 출력 예시

### 5.1 Button (Primary, size=md)

```json
{
  "id": "root",
  "type": "COMPONENT",
  "name": "Size=md, Hierarchy=Primary, State=Default",
  "styles": { "background-color": "var(--bg-brand-solid)", "padding": "10px 14px" },
  "children": [
    { "id": "root.0", "type": "FRAME", "name": "placeholder", "styles": {...}, "children": [...] },
    {
      "id": "root.1",
      "type": "FRAME",
      "name": "Text padding",
      "styles": { "display": "flex", "padding": "0 2px" },
      "children": [
        {
          "id": "root.1.0",
          "type": "TEXT",
          "name": "Text",
          "characters": "Button CTA",
          "textRole": "value",
          "styles": {
            "color": "var(--text-white)",
            "font-family": "Inter",
            "font-size": "14px",
            "font-weight": "600"
          }
        }
      ]
    },
    { "id": "root.2", "type": "FRAME", "name": "placeholder", "styles": {...}, "children": [...] }
  ]
}
```

### 5.2 Checkbox (checked state)

```json
{
  "id": "root",
  "type": "COMPONENT",
  "name": "State=Checked",
  "styles": { "display": "flex", "gap": "8px" },
  "children": [
    {
      "id": "root.0",
      "type": "FRAME",
      "name": "Box",
      "styles": {
        "width": "20px",
        "height": "20px",
        "border-radius": "4px",
        "background-color": "var(--bg-brand-solid)"
      },
      "children": [
        {
          "id": "root.0.0",
          "type": "VECTOR",
          "name": "Checkmark",
          "shape": "vector",
          "styles": { "width": "12px", "height": "12px" },
          "pathData": "M2 6L5 9L10 3"
        }
      ]
    },
    {
      "id": "root.1",
      "type": "TEXT",
      "name": "Label",
      "characters": "Accept terms and conditions",
      "textRole": "label",
      "styles": {
        "color": "var(--text-primary)",
        "font-size": "14px"
      }
    }
  ]
}
```

### 5.3 Radio (selected state)

```json
{
  "id": "root",
  "type": "COMPONENT",
  "name": "State=Selected",
  "styles": { "display": "flex", "gap": "8px" },
  "children": [
    {
      "id": "root.0",
      "type": "ELLIPSE",
      "name": "Outer",
      "shape": "ellipse",
      "styles": {
        "width": "20px",
        "height": "20px",
        "border-radius": "50%",
        "border": "2px solid var(--border-brand)"
      },
      "children": [
        {
          "id": "root.0.0",
          "type": "ELLIPSE",
          "name": "Inner dot",
          "shape": "ellipse",
          "styles": {
            "width": "10px",
            "height": "10px",
            "border-radius": "50%",
            "background-color": "var(--bg-brand-solid)"
          }
        }
      ]
    },
    {
      "id": "root.1",
      "type": "TEXT",
      "name": "Label",
      "characters": "Option 1",
      "textRole": "label",
      "styles": { "color": "var(--text-primary)" }
    }
  ]
}
```

### 5.4 Input (with leading icon + helper)

```json
{
  "id": "root",
  "type": "COMPONENT",
  "name": "State=Default",
  "styles": { "display": "flex", "flex-direction": "column", "gap": "4px" },
  "children": [
    {
      "id": "root.0",
      "type": "TEXT",
      "name": "Label",
      "characters": "Email",
      "textRole": "label",
      "styles": { "font-size": "14px", "color": "var(--text-secondary)" }
    },
    {
      "id": "root.1",
      "type": "FRAME",
      "name": "Input container",
      "styles": {
        "display": "flex",
        "padding": "10px 14px",
        "border": "1px solid var(--border-primary)",
        "border-radius": "8px"
      },
      "children": [
        {
          "id": "root.1.0",
          "type": "INSTANCE",
          "name": "Leading icon",
          "masterName": "icon-mail",
          "styles": { "width": "16px", "height": "16px" }
        },
        {
          "id": "root.1.1",
          "type": "TEXT",
          "name": "Placeholder",
          "characters": "you@example.com",
          "textRole": "placeholder",
          "styles": {
            "color": "var(--text-placeholder)",
            "font-size": "14px"
          }
        }
      ]
    },
    {
      "id": "root.2",
      "type": "TEXT",
      "name": "Helper text",
      "characters": "We'll never share your email",
      "textRole": "helper",
      "styles": { "font-size": "12px", "color": "var(--text-tertiary)" }
    }
  ]
}
```

---

## 6. 메시지 플로우 영향

### 6.1 UI → code.ts 메시지

**변경 없음.** 기존 `generate-component` 메시지 그대로 사용.

### 6.2 code.ts → UI 메시지

**`generate-component-result` 의 `data` 필드에 `nodeTree` 추가.** 기존 필드는 모두 유지.

```ts
// 기존 payload
{ type: 'generate-component-result', data: { name, meta, styles, html, ..., childStyles } }

// 확장 payload
{ type: 'generate-component-result', data: { name, meta, styles, html, ..., childStyles, nodeTree, variants: [...{ nodeTree, variantSlug }] } }
```

### 6.3 UI → PixelForge 앱 전송

**`sendToPixelForge('/api/sync/components', ...)` Path A/B는 자동 반영.**
`compState.nodeData`가 `nodeTree`를 포함하므로 별도 수정 불필요.

Path C (bulk/edit) 는 여전히 `nodeSnapshot: null`이므로 **이 플랜에서는 손대지 않음**. 별도 sync payload 통일 플랜에서 처리.

---

## 7. 구현 체크리스트

### Phase 1: 모듈 신설
- [ ] `src/extractors/` 디렉터리 생성
- [ ] `src/extractors/types.ts` — `NodeTreeEntry`, `TextRole`, `ShapeKind`, `VariantStyleEntry`
- [ ] `src/extractors/shape-kind.ts` — `resolveShape()`
- [ ] `src/extractors/text-role.ts` — `inferTextRole()` + 3단계 매칭 함수
- [ ] `src/extractors/variant-slug.ts` — `buildVariantSlug()`
- [ ] `src/extractors/index.ts` — 공개 API export

### Phase 2: 기존 로직 이전
- [ ] `getNodeStyles`, `safeGetText`, `resolveBoundColor`, `toCssVarName`을 `node-styles.ts`로 이전
- [ ] `code.ts`는 이전된 함수를 `extractors/`에서 import
- [ ] `npm run build` 성공 확인 (기능 동작 불변)

### Phase 3: `buildNodeTree` 구현
- [ ] `src/extractors/node-tree.ts` 신규 작성
- [ ] `extractVectorPath` 헬퍼 포함
- [ ] TypeScript strict 통과

### Phase 4: `code.ts` 통합
- [ ] `variants[]` 생성 로직에 `variantSlug`, `nodeTree` 추가
- [ ] 반환 객체에 `nodeTree` 추가
- [ ] `GenerateComponentResult` 인터페이스 갱신

### Phase 5: 검증
- [ ] `Buttons_Button.node.json` 재추출 → `variants[0].nodeTree` 내 Primary variant의 텍스트 색상 `var(--text-white)` 확인
- [ ] Link color variant의 텍스트 색상 `var(--text-brand-secondary)` 확인
- [ ] Checkbox / Radio / Switch / Input 샘플 컴포넌트 추출 후 nodeTree 수동 검증
- [ ] 페이로드 크기 실측 (gzip 50KB 이하)
- [ ] Figma에서 기존 Radix 코드 생성 동작 불변 확인
- [ ] 기존 .node.json 다운로드 기능에 nodeTree 포함 확인

### Phase 6: 문서화
- [ ] `ARCHITECTURE.md`에 `src/extractors/` 디렉터리 설명 추가
- [ ] `CLAUDE.md` 관련 파일 맵 갱신
- [ ] 메시지 플로우 업데이트 (nodeTree 필드 추가)

---

## 8. 리스크와 대응

| 리스크 | 탐지 시점 | 대응 |
|---|---|---|
| `getNodeStyles()` 이전 중 회귀 | Phase 2 | 이전 전후 `npm run build` + 수동 Figma 테스트 |
| VECTOR path 추출 실패 | Phase 3 | try/catch로 감싸고 null 반환 허용, 테스트에서 pathData 미존재 케이스 포함 |
| `mainComponent` 접근 실패 | Phase 3 | INSTANCE 권한 문제 시 try/catch로 무시, masterName 생략 |
| `inferTextRole()` 오탐 | Phase 5 | 샘플 검증 단계에서 실제 결과 확인, 패턴 튜닝 |
| 페이로드 크기 초과 | Phase 5 | 실측 후 기본값 생략 로직 추가 (opacity:1, display:block 등) |
| 앱 측이 nodeTree 무시 | 배포 후 | 본 플랜 범위 외, 앱 측 별도 플랜 요청 |
| ELLIPSE border-radius 중복 | Phase 3 | 기존 styles에 이미 border-radius가 있으면 덮어쓰지 않도록 guard |

---

## 9. 테스트 전략

### 9.1 단위 테스트 (컴포넌트별 분리)

```
tests/extractors/
├── node-tree.test.ts              # 범용 로직 (path 생성, 재귀 종료)
├── text-role.test.ts              # 12 TextRole 매트릭스
├── shape-kind.test.ts              # 7 ShapeKind 분기
├── variant-slug.test.ts            # slug 생성 규칙 (공백/특수문자)
└── atomic/                         # 원자 컴포넌트별 회귀 테스트
    ├── button.fixture.json
    ├── button.test.ts
    ├── input.fixture.json
    ├── input.test.ts
    ├── checkbox.fixture.json
    ├── checkbox.test.ts
    ├── radio.fixture.json
    ├── radio.test.ts
    ├── switch.fixture.json
    ├── switch.test.ts
    ├── select.fixture.json
    └── select.test.ts
```

### 9.2 통합 테스트

실제 Figma 파일에서 추출한 `.node.json` 파일을 fixture로 사용:

```ts
// tests/extractors/atomic/button.test.ts
import fixture from './button.fixture.json';
import { buildNodeTree } from '../../../src/extractors';

test('Primary variant has text color in nodeTree', () => {
  const primary = fixture.variants.find(
    v => v.properties.hierarchy === 'Primary' && v.properties.size === 'md'
  );
  const tree = primary.nodeTree;
  const textNode = findFirstText(tree);
  expect(textNode.styles.color).toBe('var(--text-white)');
  expect(textNode.textRole).toBe('value');
});
```

### 9.3 수동 검증 (Phase 5)

1. Figma에서 Buttons/Button 컴포넌트 선택
2. "Generate" 실행
3. `.node.json` 다운로드
4. Python 스크립트로 Primary 계열 50개 variant에서 nodeTree 순회 → `color: var(--text-white)` 존재 여부 확인
5. Checkbox/Radio/Switch/Input 샘플 컴포넌트 각각 동일 절차

---

## 10. 하위 호환성 매트릭스

| 기능 | 현재 동작 | 이 플랜 적용 후 |
|---|---|---|
| Radix CSS Modules 코드 생성 | `childStyles` 사용 | `childStyles` 그대로 사용 (변경 없음) |
| Radix Styled Components | `childStyles` 사용 | `childStyles` 그대로 사용 |
| HTML 모드 (inline/separated) | `html` / `htmlCss` 사용 | `html` / `htmlCss` 그대로 사용 |
| `.node.json` 다운로드 | 현재 필드 | `nodeTree`, `variantSlug` 추가 |
| `/api/sync/components` Path A | `data: nodeData` | `data: nodeData` (nodeTree 자동 포함) |
| `/api/sync/components` Path B | `component.nodeSnapshot.figmaNodeData` (stringified) | 동일 (stringified 안에 nodeTree 포함) |
| `/api/sync/components` Path C | `nodeSnapshot: null` | 동일 (본 플랜 범위 외) |
| 앱 측 기존 렌더링 | `childStyles` 파싱 | `childStyles` 그대로 동작 + 선택적으로 `nodeTree` 사용 가능 |

**핵심:** 앱 측 코드는 **수정 없이** 그대로 동작한다. `nodeTree`는 **추가 기능**으로 활용.

---

## 11. 참고 자료

- `docs/01-plan/features/component-node-tree-export.plan.md` — 본 플랜
- `docs/02-design/features/component-radix-generation.design.md` — `GenerateComponentResult` 원형
- `src/code.ts:1673-2266` — 현재 `generateComponent()` 구현
- `~/Downloads/Buttons_Button.node.json` — 테스트 fixture (200 variants, Untitled UI Button)
- `~/work/person/pixelforge/data/Button.node.json` — 앱 측 기존 저장본
