// src/extractors/node-tree.ts
// buildNodeTree() — 범용 재귀 Figma 노드 트리 추출.
// 모든 노드 타입을 동일 로직으로 처리하며 컴포넌트별 분기가 없다.
//
// 의존성:
// - node-styles 로직은 `code.ts`의 closure 컨텍스트(colorMap/varIdMap/
//   masterTextMap)에 의존하므로, 호출자가 NodeTreeContext로 주입한다.

import type { NodeTreeEntry, NodeTreeContext, ComponentPropRefs } from './types';
import { inferTextRole } from './text-role';
import { resolveShape } from './shape-kind';

/**
 * Figma SceneNode를 재귀 NodeTreeEntry로 변환한다.
 * 모든 노드 타입을 동일 로직으로 처리 — 컴포넌트별 분기 없음.
 *
 * @param node - 변환할 SceneNode
 * @param ctx - getStyles/getText 콜백을 포함한 실행 컨텍스트
 * @param path - 경로 기반 ID (기본값: 'root')
 */
export function buildNodeTree(
  node: SceneNode,
  ctx: NodeTreeContext,
  path = 'root'
): NodeTreeEntry {
  const entry: NodeTreeEntry = {
    id: path,
    type: node.type,
    name: node.name || `unnamed-${node.type.toLowerCase()}`,
    styles: ctx.getStyles(node),
  };

  // ── TEXT 노드 특수 처리 ──────────────────────────
  if (node.type === 'TEXT') {
    entry.characters = ctx.getText(node);
    entry.textRole = inferTextRole(node as TextNode);
  }

  // ── 도형 노드 ────────────────────────────────────
  const shape = resolveShape(node);
  if (shape) {
    entry.shape = shape;
    // ELLIPSE: border-radius 50% 강제 (기존 값 있으면 보존)
    if (shape === 'ellipse' && !entry.styles['border-radius']) {
      entry.styles['border-radius'] = '50%';
    }
    // VECTOR: pathData 선택적 추출
    if (shape === 'vector') {
      const pathData = extractVectorPath(node as VectorNode);
      if (pathData) entry.pathData = pathData;
    }
  }

  // ── Component Property 바인딩 ────────────────────
  // Figma가 레이어별로 어느 prop이 무엇을 제어하는지 기록한 ground truth.
  // 이름 추론 없이 생성기가 직접 읽을 수 있다.
  try {
    const refs = (node as SceneNode & { componentPropertyReferences?: Record<string, string> })
      .componentPropertyReferences;
    if (refs && Object.keys(refs).length > 0) {
      const propRefs: ComponentPropRefs = {};
      if (refs['visible']) propRefs.visible = refs['visible'];
      if (refs['characters']) propRefs.characters = refs['characters'];
      if (refs['mainComponent']) propRefs.mainComponent = refs['mainComponent'];
      if (Object.keys(propRefs).length > 0) entry.propRefs = propRefs;
    }
  } catch {
    // componentPropertyReferences 접근 실패 시 무시
  }

  // ── INSTANCE 노드 ────────────────────────────────
  if (node.type === 'INSTANCE') {
    try {
      const inst = node as InstanceNode;
      const master = inst.mainComponent;
      if (master) entry.masterName = master.name;
    } catch {
      // mainComponent 접근 실패 시 무시
    }
  }

  // ── 자식 재귀 ────────────────────────────────────
  if ('children' in node) {
    const children = (node as unknown as ChildrenMixin).children as readonly SceneNode[];
    if (children && children.length > 0) {
      entry.children = children.map((child, i) => buildNodeTree(child, ctx, `${path}.${i}`));
    }
  }

  return entry;
}

/**
 * VECTOR 노드의 SVG path 문자열을 추출한다.
 * Figma API 권한 문제 또는 미지원 시 null 반환 (실패 허용).
 */
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
