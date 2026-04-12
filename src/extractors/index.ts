// src/extractors/index.ts
// 공개 API 묶음

export { buildNodeTree } from './node-tree';
export { buildVariantSlug } from './variant-slug';
export { inferTextRole } from './text-role';
export { resolveShape } from './shape-kind';
export type {
  NodeTreeEntry,
  NodeTreeContext,
  TextRole,
  ShapeKind,
} from './types';
