// src/extractors/shape-kind.ts
// Figma 노드 → ShapeKind 분류

import type { ShapeKind } from './types';

/**
 * SceneNode가 도형 노드인지 판단하고 ShapeKind를 반환한다.
 * FRAME/GROUP/COMPONENT 등 컨테이너는 null 반환.
 */
export function resolveShape(node: SceneNode): ShapeKind | null {
  switch (node.type) {
    case 'VECTOR':
      return 'vector';
    case 'ELLIPSE':
      return 'ellipse';
    case 'RECTANGLE':
      return 'rectangle';
    case 'LINE':
      return 'line';
    case 'POLYGON':
      return 'polygon';
    case 'STAR':
      return 'star';
    case 'BOOLEAN_OPERATION':
      return 'boolean';
    default:
      return null;
  }
}
