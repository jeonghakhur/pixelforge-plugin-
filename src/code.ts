import { buildNodeTree, buildVariantSlug } from './extractors';
import type { NodeTreeEntry, NodeTreeContext } from './extractors';

interface VariableData {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  collectionId: string;
  usageCount: number;
  source?: 'variable' | 'visual';
}

interface VariableCollectionData {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  variableIds: string[];
}

interface ColorStyleData {
  id: string;
  name: string;
  description: string;
  paints: Paint[];
  usageCount: number;
}

interface TextStyleData {
  id: string;
  name: string;
  description: string;
  fontName: FontName;
  fontSize: number;
  fontWeight: number;
  letterSpacing: LetterSpacing;
  lineHeight: LineHeight;
  textCase: TextCase;
  textDecoration: TextDecoration;
  usageCount: number;
}

interface EffectStyleData {
  id: string;
  name: string;
  description: string;
  effects: Effect[];
  usageCount: number;
}

interface GridStyleData {
  id: string;
  name: string;
  description: string;
  layoutGrids: LayoutGrid[];
  usageCount: number;
}

interface FontData {
  family: string;
  cssVar: string;
  styles: string[];
}

// ── Typography 통합 구조 ──────────────────────────────────────────────────────
interface TypographyVarItem {
  id: string;
  name: string;
  value: number;
}

interface TypographyStringItem {
  id: string;
  name: string;
  value: string;
}

interface TypographyToken extends TextStyleData {
  category: 'body' | 'display';
  fontSizeVarId?: string;
  lineHeightVarId?: string;
  fontFamilyVarId?: string;
}

interface TypographyData {
  textStyles: TypographyToken[];
  fontSizes: TypographyVarItem[];
  lineHeights: TypographyVarItem[];
  fontFamilies: TypographyStringItem[];
  fontWeights: Array<{ id: string; name: string; value: number }>;
}

interface IconData {
  id: string;
  name: string;
  key: string;
  description: string;
  width: number;
  height: number;
}

interface ImageData {
  id: string;
  name: string;
  kebab: string;
  nodeType: string;
  width: number;
  height: number;
}

interface ImageAsset extends ImageData {
  format: 'PNG' | 'JPG';
  scale: 1 | 2 | 3;
  fileName: string;
  base64: string;
  mimeType: string;
  byteSize: number;
}

interface ExtractImagesOptions {
  format: 'PNG' | 'JPG';
  scales: Array<1 | 2 | 3>;
  useSelection: boolean;
}

interface ExtractOptions {
  collectionIds: string[];
  useSelection: boolean;
  useCurrentPage?: boolean;
  tokenTypes: Array<
    | 'variables'
    | 'colors'
    | 'texts'
    | 'textStyles'
    | 'headings'
    | 'fonts'
    | 'effects'
    | 'spacing'
    | 'radius'
    | 'icons'
    | 'grids'
    | 'extra-vars'
    | 'typography'
  >;
  useVisualParser?: boolean;
  figmaFileKey?: string;
}

interface ExtraVarGroup {
  collectionId: string;
  collectionName: string;
  resolvedType: 'FLOAT' | 'BOOLEAN' | 'STRING';
  variables: VariableData[];
}

// ── Frame Inspector ────────────────────────────────────────────────────────────
interface StructureNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;

  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    absoluteX: number;
    absoluteY: number;
    rotation: number;
  };

  layout: {
    mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'WRAP';
    direction?: 'row' | 'column';
    wrap?: boolean;
    justifyContent?: string;
    alignItems?: string;
    gap?: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    constraints?: { horizontal: string; vertical: string };
    sizing?: { horizontal: string; vertical: string };
  };

  appearance: {
    fills: readonly Paint[];
    strokes: readonly Paint[];
    strokeWeight: number;
    strokeAlign: string;
    cornerRadius: number | number[];
    opacity: number;
    effects: readonly Effect[];
    blendMode: string;
    clipsContent?: boolean;
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

  truncated?: boolean;
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

interface ExtraVarSummaryItem {
  collectionId: string;
  collectionName: string;
  types: ('FLOAT' | 'BOOLEAN' | 'STRING')[];
}

interface ExtractedTokens {
  variables: {
    collections: VariableCollectionData[];
    variables: VariableData[];
  };
  spacing: VariableData[];
  radius: VariableData[];
  extraVars: ExtraVarGroup[];
  typography?: TypographyData;
  styles: {
    colors: ColorStyleData[];
    texts: TextStyleData[];
    textStyles: TextStyleData[];
    headings: TextStyleData[];
    fonts: FontData[];
    effects: EffectStyleData[];
    grids: GridStyleData[];
  };
  icons: IconData[];
  meta: {
    figmaFileKey: string;
    extractedAt: string;
    fileName: string;
    sourceMode: 'all' | 'selection' | 'page';
    totalNodes: number;
    tokenTypes: string[];
  };
}

figma.showUI(__html__, { width: 760, height: 720 });

function getSourceNodes(
  options: Pick<ExtractOptions, 'useSelection' | 'useCurrentPage'>
): readonly SceneNode[] {
  if (options.useSelection && figma.currentPage.selection.length > 0) {
    return figma.currentPage.selection;
  }
  return figma.currentPage.children;
}

function countVariableUsage(nodes: readonly SceneNode[]): Map<string, number> {
  const counts = new Map<string, number>();

  function recordBound(bound: Record<string, unknown>) {
    for (const key in bound) {
      const val = bound[key] as any;
      if (Array.isArray(val)) {
        val.forEach((v: any) => {
          if (v?.id) counts.set(v.id, (counts.get(v.id) ?? 0) + 1);
        });
      } else if (val?.id) {
        counts.set(val.id, (counts.get(val.id) ?? 0) + 1);
      }
    }
  }

  function traverse(node: SceneNode) {
    // Node-level bindings (width, height, opacity, cornerRadius, etc.)
    if ('boundVariables' in node && node.boundVariables) {
      recordBound(node.boundVariables as Record<string, unknown>);
    }
    // Fill paint bindings (color variables in fills)
    if ('fills' in node) {
      const fills = (node as any).fills;
      if (Array.isArray(fills)) {
        fills.forEach((paint: any) => {
          if (paint?.boundVariables) recordBound(paint.boundVariables);
        });
      }
    }
    // Stroke paint bindings
    if ('strokes' in node) {
      const strokes = (node as any).strokes;
      if (Array.isArray(strokes)) {
        strokes.forEach((paint: any) => {
          if (paint?.boundVariables) recordBound(paint.boundVariables);
        });
      }
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child);
    }
  }
  for (const node of nodes) traverse(node);
  return counts;
}

function countStyleUsage(nodes: readonly SceneNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  const styleKeys = ['fillStyleId', 'strokeStyleId', 'effectStyleId', 'textStyleId', 'gridStyleId'];
  function traverse(node: SceneNode) {
    for (const key of styleKeys) {
      if (key in node) {
        const val = (node as any)[key];
        if (typeof val === 'string' && val) {
          counts.set(val, (counts.get(val) ?? 0) + 1);
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child);
    }
  }
  for (const node of nodes) traverse(node);
  return counts;
}

function countNodes(nodes: readonly SceneNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if ('children' in node) count += countNodes((node as ChildrenMixin).children);
  }
  return count;
}

function fontWeightFromStyle(style: string): number {
  const s = style.toLowerCase();
  if (/thin|hairline/.test(s)) return 100;
  if (/extra\s*light|ultra\s*light/.test(s)) return 200;
  if (/light/.test(s)) return 300;
  if (/medium/.test(s)) return 500;
  if (/semi\s*bold|demi\s*bold/.test(s)) return 600;
  if (/extra\s*bold|ultra\s*bold/.test(s)) return 800;
  if (/black|heavy/.test(s)) return 900;
  if (/bold/.test(s)) return 700;
  return 400;
}

const SPACING_RE = /\b(spacing|space|gap|padding|margin|gutter|inset|distance)\b/i;
const RADIUS_RE = /\b(radius|corner|rounded|border.?radius)\b/i;
const HEADING_RE = /\b(heading|display|title|h[1-6])\b/i;
const VISUAL_VALUE_RE = /(\d+(?:\.\d+)?)\s*(px|rem)/i;

interface VisualTokenRaw {
  value: number;
  rawText: string;
  tokenName: string;
}

function findSpacingFrames(): (FrameNode | GroupNode | SectionNode)[] {
  return figma.currentPage.findAll(
    (n) =>
      (n.type === 'FRAME' || n.type === 'GROUP' || n.type === 'SECTION') && SPACING_RE.test(n.name)
  ) as (FrameNode | GroupNode | SectionNode)[];
}

function parseSpacingFromFrame(frame: FrameNode | GroupNode | SectionNode): VisualTokenRaw[] {
  const results: VisualTokenRaw[] = [];

  function traverse(node: SceneNode, depth: number): void {
    if (depth > 6) return;
    if (node.type === 'TEXT') {
      const trimmed = node.characters.trim();
      const tokenName = node.name !== node.characters ? node.name : trimmed;
      if (trimmed === '0') {
        results.push({ value: 0, rawText: '0', tokenName });
      } else {
        const match = VISUAL_VALUE_RE.exec(trimmed);
        if (match) {
          const numVal = parseFloat(match[1]);
          const unit = match[2].toLowerCase();
          const pxValue = unit === 'rem' ? Math.round(numVal * 16) : numVal;
          results.push({ value: pxValue, rawText: trimmed, tokenName });
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) {
        traverse(child, depth + 1);
      }
    }
  }

  if ('children' in frame) {
    for (const child of (frame as ChildrenMixin).children) {
      traverse(child, 0);
    }
  }
  return results;
}

function extractVisualSpacing(): VariableData[] {
  try {
    const frames = findSpacingFrames();
    if (frames.length === 0) return [];

    const rawTokens: VisualTokenRaw[] = [];
    for (const frame of frames) {
      rawTokens.push(...parseSpacingFromFrame(frame));
    }

    const seen = new Set<number>();
    const deduped = rawTokens.filter((t) => {
      if (seen.has(t.value)) return false;
      seen.add(t.value);
      return true;
    });
    deduped.sort((a, b) => a.value - b.value);

    return deduped.map(
      (t, i): VariableData => ({
        id: `visual-spacing-${i}`,
        name: t.tokenName === t.rawText ? `spacing-${i}` : t.tokenName,
        resolvedType: 'FLOAT',
        valuesByMode: { visual: t.value },
        collectionId: 'visual',
        usageCount: 0,
        source: 'visual',
      })
    );
  } catch (e) {
    console.error('[visual-frame-parser] extractVisualSpacing failed:', e);
    return [];
  }
}

function mapTextStyle(s: TextStyle, styleUsage: Map<string, number>): TextStyleData {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    fontName: s.fontName,
    fontSize: s.fontSize,
    fontWeight: (s as any).fontWeight ?? fontWeightFromStyle(s.fontName.style),
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
    usageCount: styleUsage.get(s.id) ?? 0,
  };
}

function collectFonts(textStyles: TextStyleData[]): FontData[] {
  const familyMap = new Map<string, Set<string>>();
  for (const s of textStyles) {
    const family = s.fontName.family;
    if (!family.trim()) continue;
    if (!familyMap.has(family)) familyMap.set(family, new Set());
    familyMap.get(family)!.add(s.fontName.style);
  }
  return Array.from(familyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([family, stylesSet]): FontData => ({
        family,
        cssVar:
          '--font-' +
          family
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
        styles: Array.from(stylesSet).sort(),
      })
    );
}

/**
 * Text Styles + Typography Variables → TypographyData
 * - textStyles: body/display 구분, 변수 ID 연결
 * - fontSizes / lineHeights: FLOAT 변수 (값은 숫자)
 * - fontFamilies: STRING 변수 (값은 패밀리 이름 문자열)
 * - fontWeights: STRING 변수 값을 숫자(400/500/600/700)로 변환
 */
function buildTypographyData(
  allTexts: TextStyleData[],
  allVariables: Variable[],
  collectionMap: Map<string, string>
): TypographyData {
  const TYPO_COL_RE = /\btypograph|font|type\b/i;

  const fontSizeVars: TypographyVarItem[] = [];
  const lineHeightVars: TypographyVarItem[] = [];
  const fontFamilyVars: TypographyStringItem[] = [];
  const fontWeightVars: Array<{ id: string; name: string; value: number }> = [];

  for (const v of allVariables) {
    if (v.resolvedType === 'BOOLEAN') continue;
    const colName = collectionMap.get(v.variableCollectionId) ?? '';
    if (!TYPO_COL_RE.test(colName)) continue;

    const firstMode = Object.keys(v.valuesByMode)[0];
    if (!firstMode) continue;
    const val = v.valuesByMode[firstMode];
    const lower = v.name.toLowerCase();

    if (v.resolvedType === 'FLOAT' && typeof val === 'number') {
      if (/font.?size/.test(lower)) fontSizeVars.push({ id: v.id, name: v.name, value: val });
      else if (/line.?height/.test(lower))
        lineHeightVars.push({ id: v.id, name: v.name, value: val });
    } else if (v.resolvedType === 'STRING' && typeof val === 'string') {
      if (/font.?family/.test(lower)) fontFamilyVars.push({ id: v.id, name: v.name, value: val });
      else if (/font.?weight/.test(lower)) {
        fontWeightVars.push({ id: v.id, name: v.name, value: fontWeightFromStyle(val) });
      }
    }
  }

  // 변수명의 마지막 세그먼트로 키 생성: "Font size/text-xs" → "text-xs"
  const fontSizeByKey = new Map(
    fontSizeVars.map((v) => [v.name.split('/').pop()!.toLowerCase(), v])
  );
  const lineHeightByKey = new Map(
    lineHeightVars.map((v) => [v.name.split('/').pop()!.toLowerCase(), v])
  );

  // 폰트 패밀리: display / body 구분
  const displayFamilyVar = fontFamilyVars.find((v) => /display/.test(v.name.toLowerCase()));
  const bodyFamilyVar =
    fontFamilyVars.find((v) => /body/.test(v.name.toLowerCase())) ?? fontFamilyVars[0];

  // 텍스트 스타일 이름의 첫 세그먼트로 키 생성: "Text xs/Regular" → "text-xs"
  const textStyles: TypographyToken[] = allTexts.map((s) => {
    const key = (s.name.split('/')[0] ?? s.name).toLowerCase().replace(/\s+/g, '-');
    const category: 'body' | 'display' = HEADING_RE.test(s.name) ? 'display' : 'body';
    const familyVar = category === 'display' ? displayFamilyVar : bodyFamilyVar;

    return {
      ...s,
      category,
      fontSizeVarId: fontSizeByKey.get(key)?.id,
      lineHeightVarId: lineHeightByKey.get(key)?.id,
      fontFamilyVarId: familyVar?.id,
    };
  });

  return {
    textStyles,
    fontSizes: fontSizeVars,
    lineHeights: lineHeightVars,
    fontFamilies: fontFamilyVars,
    fontWeights: fontWeightVars,
  };
}

function mapVariable(v: Variable, varUsage: Map<string, number>): VariableData {
  return {
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    valuesByMode: { ...v.valuesByMode },
    collectionId: v.variableCollectionId,
    usageCount: varUsage.get(v.id) ?? 0,
  };
}

const TOKEN_CACHE_KEY = 'pf-token-cache';

interface TokenCacheEntry {
  data: ExtractedTokens;
  savedAt: string;
  figmaFileId: string;
  figmaFileName: string;
}

interface NodeMeta {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  masterId: string | null;
  masterName: string | null;
  figmaFileKey: string;
}

async function getSelectionInfo() {
  const sel = figma.currentPage.selection;
  let meta: NodeMeta | null = null;

  if (sel.length > 0) {
    const node = sel[0];
    const master =
      node.type === 'INSTANCE' ? await (node as InstanceNode).getMainComponentAsync() : null;
    meta = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      masterId: master?.id ?? null,
      masterName: master?.name ?? null,
      figmaFileKey: await resolveFileKey(),
    };
  }

  return {
    count: sel.length,
    names: sel.map((n) => n.name),
    nodeTypes: sel.map((n) => n.type),
    meta,
  };
}

async function sendCollections() {
  const collections = (await figma.variables.getLocalVariableCollectionsAsync()).map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
    variableIds: [...c.variableIds],
  }));
  let resolvedFileKey = figma.fileKey || '';
  const isInvalidKey =
    !resolvedFileKey || resolvedFileKey === '0:0' || resolvedFileKey.startsWith('0:');
  if (isInvalidKey) {
    try {
      const saved = (await figma.clientStorage.getAsync('figma-file-key')) as string | undefined;
      if (saved) resolvedFileKey = saved;
    } catch (_) {}
  }
  figma.ui.postMessage({
    type: 'init-data',
    collections,
    fileName: figma.root.name,
    figmaFileKey: resolvedFileKey,
    selection: await getSelectionInfo(),
  });

  // extra-vars 요약 (필터 카드 동적 생성용) — 비동기로 별도 전송
  figma.variables
    .getLocalVariablesAsync()
    .then((vars) => {
      const SPACING_RE_LOCAL = /spacing|space|gap|padding|margin|gutter/i;
      const RADIUS_RE_LOCAL = /radius|corner|rounded|border-radius/i;
      const summaryMap = new Map<string, ExtraVarSummaryItem>();
      for (const v of vars) {
        if (v.resolvedType === 'COLOR') continue;
        if (v.resolvedType === 'FLOAT') {
          const colName = collections.find((c) => c.id === v.variableCollectionId)?.name ?? '';
          if (SPACING_RE_LOCAL.test(v.name) || SPACING_RE_LOCAL.test(colName)) continue;
          if (RADIUS_RE_LOCAL.test(v.name) || RADIUS_RE_LOCAL.test(colName)) continue;
        }
        const colId = v.variableCollectionId;
        if (!summaryMap.has(colId)) {
          const colName = collections.find((c) => c.id === colId)?.name ?? colId;
          summaryMap.set(colId, { collectionId: colId, collectionName: colName, types: [] });
        }
        const item = summaryMap.get(colId)!;
        const t = v.resolvedType as 'FLOAT' | 'BOOLEAN' | 'STRING';
        if (!item.types.includes(t)) item.types.push(t);
      }
      figma.ui.postMessage({
        type: 'extra-vars-summary',
        summary: Array.from(summaryMap.values()),
      });
    })
    .catch(() => {});

  // 마지막 아이콘 데이터 복원
  try {
    const cached = (await figma.clientStorage.getAsync('lastIconData')) as
      | { data: unknown; savedAt: string }
      | undefined;
    if (cached?.data) {
      figma.ui.postMessage({
        type: 'cached-icon-data',
        data: cached.data,
        savedAt: cached.savedAt,
      });
    }
  } catch (_) {}

  // 토큰 캐시 복원
  try {
    const tokenCache = (await figma.clientStorage.getAsync(TOKEN_CACHE_KEY)) as
      | TokenCacheEntry
      | undefined;
    if (tokenCache?.data) {
      figma.ui.postMessage({
        type: 'cached-token-data',
        data: tokenCache.data,
        savedAt: tokenCache.savedAt,
        figmaFileId: tokenCache.figmaFileId,
        figmaFileName: tokenCache.figmaFileName,
      });
    }
  } catch (_) {}

  // PixelForge 연결 설정 복원
  try {
    const pfSettings = (await figma.clientStorage.getAsync('pf-settings')) as
      | { url: string; key: string }
      | undefined;
    figma.ui.postMessage({
      type: 'settings-data',
      url: pfSettings?.url ?? '',
      key: pfSettings?.key ?? '',
    });
  } catch (_) {}
}

async function resolveFileKey(hint?: string): Promise<string> {
  // UI에서 전달된 값 우선 사용
  if (hint && hint !== '0:0' && !hint.startsWith('0:')) return hint;
  let key = figma.fileKey || '';
  if (!key || key === '0:0' || key.startsWith('0:')) {
    try {
      const saved = (await figma.clientStorage.getAsync('figma-file-key')) as string | undefined;
      if (saved) key = saved;
    } catch (_) {}
  }
  return key;
}

async function extractAll(options: ExtractOptions): Promise<ExtractedTokens> {
  const sourceNodes = getSourceNodes(options);
  const isSelectionMode = options.useSelection && figma.currentPage.selection.length > 0;
  const isPageMode = !isSelectionMode && !!options.useCurrentPage;
  const types = options.tokenTypes;

  const needsVars = types.some((t) =>
    ['variables', 'spacing', 'radius', 'extra-vars', 'typography'].includes(t)
  );
  const needsStyles = types.some((t) =>
    ['colors', 'texts', 'textStyles', 'headings', 'fonts', 'effects', 'grids'].includes(t)
  );

  // Pre-fetch
  const allVariables = needsVars ? await figma.variables.getLocalVariablesAsync() : [];
  const allCollections = needsVars ? await figma.variables.getLocalVariableCollectionsAsync() : [];
  const collectionMap = new Map(allCollections.map((c) => [c.id, c.name]));

  const varUsage = needsVars ? countVariableUsage(sourceNodes) : new Map<string, number>();
  const styleUsage = needsStyles ? countStyleUsage(sourceNodes) : new Map<string, number>();

  // Variables
  let variableResult: ExtractedTokens['variables'] = { collections: [], variables: [] };
  if (types.includes('variables')) {
    if (isSelectionMode || isPageMode) {
      // Selection/page mode: resolve used variable IDs
      const usedIds = Array.from(varUsage.keys());
      if (usedIds.length > 0) {
        const resolvedVars = (
          await Promise.all(
            usedIds.map((id) => figma.variables.getVariableByIdAsync(id).catch(() => null))
          )
        ).filter((v): v is Variable => v !== null && v.resolvedType !== 'BOOLEAN');

        const colIdSet = new Set(resolvedVars.map((v) => v.variableCollectionId));
        const resolvedCols = (
          await Promise.all(
            Array.from(colIdSet).map((id) =>
              figma.variables.getVariableCollectionByIdAsync(id).catch(() => null)
            )
          )
        ).filter((c): c is VariableCollection => c !== null);

        variableResult = {
          collections: resolvedCols.map((c) => ({
            id: c.id,
            name: c.name,
            modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
            variableIds: [...c.variableIds],
          })),
          variables: resolvedVars.map((v) => mapVariable(v, varUsage)),
        };
      }
    } else {
      // Full page mode: local variables filtered by selected collections
      const filtered =
        options.collectionIds.length > 0
          ? allCollections.filter((c) => options.collectionIds.includes(c.id))
          : allCollections;
      const filteredIds = new Set(filtered.map((c) => c.id));
      variableResult = {
        collections: filtered.map((c) => ({
          id: c.id,
          name: c.name,
          modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
          variableIds: [...c.variableIds],
        })),
        variables: allVariables
          .filter((v) => filteredIds.has(v.variableCollectionId))
          .map((v) => mapVariable(v, varUsage)),
      };
    }
  }

  // Spacing — FLOAT vars matching spacing patterns (collection name, or group prefix in _Primitives)
  let spacing: VariableData[] = [];
  if (types.includes('spacing')) {
    spacing = allVariables
      .filter((v) => {
        if (v.resolvedType !== 'FLOAT') return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? '';
        if (SPACING_RE.test(colName)) return true;
        // For _Primitives-style collections, also match by group prefix in variable name
        const isPrimitivesCol = /^_|\bprimitive\b/i.test(colName);
        if (isPrimitivesCol) {
          const groupPrefix = v.name.split('/')[0];
          return SPACING_RE.test(groupPrefix);
        }
        return false;
      })
      .map((v) => mapVariable(v, varUsage))
      .filter((v) => !(isSelectionMode || isPageMode) || v.usageCount > 0);

    if (spacing.length === 0 && options.useVisualParser) {
      spacing = extractVisualSpacing();
    }
  }

  // Radius — FLOAT vars matching radius patterns
  let radius: VariableData[] = [];
  if (types.includes('radius')) {
    radius = allVariables
      .filter((v) => {
        if (v.resolvedType !== 'FLOAT') return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? '';
        return RADIUS_RE.test(v.name) || RADIUS_RE.test(colName);
      })
      .map((v) => mapVariable(v, varUsage))
      .filter((v) => !(isSelectionMode || isPageMode) || v.usageCount > 0);
  }

  // Color Styles
  let colors: ColorStyleData[] = [];
  if (types.includes('colors')) {
    colors = (await figma.getLocalPaintStylesAsync())
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        paints: s.paints.map((p) => {
          // Explicitly serialize gradient transform so the app can compute CSS angles
          if (p.type.startsWith('GRADIENT_')) {
            return {
              type: p.type,
              visible: p.visible,
              gradientStops: (p as GradientPaint).gradientStops,
              gradientTransform: (p as GradientPaint).gradientTransform,
              boundVariables: (p as any).boundVariables ?? null,
            } as unknown as Paint;
          }
          return p;
        }),
        usageCount: styleUsage.get(s.id) ?? 0,
      }))
      // IMAGE-only 페인트 스타일은 색상 토큰이 아니므로 제외
      .filter((s) => s.paints.some((p) => p.type !== 'IMAGE'))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);
  }

  // Text Styles (backward compat)
  let texts: TextStyleData[] = [];
  if (types.includes('texts')) {
    texts = (await figma.getLocalTextStylesAsync())
      .map((s) => mapTextStyle(s, styleUsage))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);
  }

  // Text Styles — split (textStyles / headings / fonts)
  let textStyles: TextStyleData[] = [];
  let headings: TextStyleData[] = [];
  let fonts: FontData[] = [];

  const needsTextSplit = types.some((t) => ['textStyles', 'headings', 'fonts'].includes(t));
  if (needsTextSplit) {
    const allTexts = (await figma.getLocalTextStylesAsync())
      .map((s) => mapTextStyle(s, styleUsage))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);

    if (types.includes('textStyles')) {
      textStyles = allTexts.filter((s) => !HEADING_RE.test(s.name));
    }
    if (types.includes('headings')) {
      headings = allTexts.filter((s) => HEADING_RE.test(s.name));
    }
    if (types.includes('fonts')) {
      fonts = collectFonts(allTexts);
    }
  }

  // Effect Styles (shadows + blurs)
  let effects: EffectStyleData[] = [];
  if (types.includes('effects')) {
    effects = (await figma.getLocalEffectStylesAsync())
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        effects: [...s.effects],
        usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);
  }

  // Grid Styles (layout grids)
  let grids: GridStyleData[] = [];
  if (types.includes('grids')) {
    grids = (await figma.getLocalGridStylesAsync())
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        layoutGrids: [...s.layoutGrids],
        usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);
  }

  // Extra Variables — FLOAT/BOOLEAN/STRING grouped by collection (excluding spacing/radius)
  let extraVars: ExtraVarGroup[] = [];
  if (types.includes('extra-vars')) {
    const groupMap = new Map<string, ExtraVarGroup>();
    allVariables
      .filter((v) => {
        if (v.resolvedType === 'COLOR') return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? '';
        // typography 컬렉션 변수는 typography 구조에서 처리 — extra-vars 제외
        if (/\btypograph|font|type\b/i.test(colName)) return false;
        if (v.resolvedType === 'FLOAT') {
          const isPrimitivesCol = /^_|\bprimitive\b/i.test(colName);
          const groupPrefix = v.name.split('/')[0];
          if (SPACING_RE.test(colName) || (isPrimitivesCol && SPACING_RE.test(groupPrefix)))
            return false;
          if (RADIUS_RE.test(colName) || (isPrimitivesCol && RADIUS_RE.test(groupPrefix)))
            return false;
        }
        return true;
      })
      .forEach((v) => {
        const key = v.variableCollectionId + ':' + v.resolvedType;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            collectionId: v.variableCollectionId,
            collectionName: collectionMap.get(v.variableCollectionId) ?? v.variableCollectionId,
            resolvedType: v.resolvedType as 'FLOAT' | 'BOOLEAN' | 'STRING',
            variables: [],
          });
        }
        const mapped = mapVariable(v, varUsage);
        if (!(isSelectionMode || isPageMode) || mapped.usageCount > 0) {
          groupMap.get(key)!.variables.push(mapped);
        }
      });
    extraVars = Array.from(groupMap.values()).filter((g) => g.variables.length > 0);
  }

  // Typography — Text Styles + Typography Variables 통합 구조
  let typography: TypographyData | undefined;
  if (types.includes('typography')) {
    const typoTexts = (await figma.getLocalTextStylesAsync())
      .map((s) => mapTextStyle(s, styleUsage))
      .filter((s) => !(isSelectionMode || isPageMode) || s.usageCount > 0);
    typography = buildTypographyData(typoTexts, allVariables, collectionMap);
  }

  // Icons — components with "icon" in name or parent component set name
  let icons: IconData[] = [];
  if (types.includes('icons')) {
    const allComponents = figma.currentPage.findAll(
      (n) => n.type === 'COMPONENT'
    ) as ComponentNode[];
    icons = allComponents
      .filter((c) => {
        // Icon=false → 아이콘이 없는 variant (버튼/배지 등) — 제외
        if (/\bIcon=false\b/i.test(c.name)) return false;
        const parentName = c.parent && 'name' in c.parent ? ((c.parent as any).name as string) : '';
        return /icon/i.test(c.name) || /icon/i.test(parentName);
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        key: c.key,
        description: c.description,
        width: Math.round(c.width),
        height: Math.round(c.height),
      }));
  }

  return {
    variables: variableResult,
    spacing,
    radius,
    extraVars,
    typography,
    styles: { colors, texts, textStyles, headings, fonts, effects, grids },
    icons,
    meta: {
      figmaFileKey: await resolveFileKey(options.figmaFileKey),
      extractedAt: new Date().toISOString(),
      fileName: figma.root.name,
      sourceMode: isSelectionMode ? 'selection' : isPageMode ? 'page' : 'all',
      totalNodes: countNodes(sourceNodes),
      tokenTypes: types,
    },
  };
}

sendCollections().catch((e) => figma.ui.postMessage({ type: 'extract-error', message: String(e) }));

figma.on('selectionchange', () => {
  getSelectionInfo().then((selection) => {
    figma.ui.postMessage({ type: 'selection-changed', selection });
  });
});

function inspectSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return { error: '선택된 노드 없음' };

  function serializePaint(paint: Paint): Record<string, unknown> {
    const p: Record<string, unknown> = { type: paint.type };
    if (paint.type === 'SOLID') {
      p.color = paint.color;
      p.opacity = paint.opacity;
      p.boundVariables = (paint as any).boundVariables ?? null;
    } else if (paint.type.startsWith('GRADIENT')) {
      p.gradientStops = (paint as any).gradientStops;
      p.boundVariables = (paint as any).boundVariables ?? null;
    }
    return p;
  }

  function serializeNode(node: SceneNode, depth: number): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    if ('fills' in node) result.fills = ((node as any).fills as Paint[]).map(serializePaint);
    if ('strokes' in node) result.strokes = ((node as any).strokes as Paint[]).map(serializePaint);
    if ('boundVariables' in node) result.boundVariables = (node as any).boundVariables ?? null;
    if ('fillStyleId' in node) result.fillStyleId = (node as any).fillStyleId || null;
    if ('strokeStyleId' in node) result.strokeStyleId = (node as any).strokeStyleId || null;
    if ('textStyleId' in node) result.textStyleId = (node as any).textStyleId || null;
    if ('effectStyleId' in node) result.effectStyleId = (node as any).effectStyleId || null;
    if ('characters' in node) result.text = (node as any).characters?.slice(0, 80);
    if ('cornerRadius' in node) result.cornerRadius = (node as any).cornerRadius;
    if ('opacity' in node && (node as any).opacity !== 1) result.opacity = (node as any).opacity;

    if (depth < 10 && 'children' in node) {
      result.children = (node as ChildrenMixin).children.map((c) =>
        serializeNode(c as SceneNode, depth + 1)
      );
    } else if ('children' in node) {
      result.childCount = (node as ChildrenMixin).children.length;
    }

    return result;
  }

  return {
    selectionCount: sel.length,
    nodes: sel.map((n) => serializeNode(n, 0)),
  };
}

// Figma variant 이름 파싱
// "Glyph=android, Size=default" → { base: "android", variants: ["size-default"] }
// "glyph/android"              → { base: "glyph/android", variants: [] }
// Glyph=/Name= 키를 우선 기본 이름으로 사용, 없으면 첫 번째 segment fallback
const ICON_ID_KEY = /^(glyph|name)$/i;

function parseVariantName(name: string): { base: string; variants: string[] } {
  const segments = name.split(/,\s*/);
  let base = '';
  let baseSegIdx = -1;

  // 1st pass: Glyph= / Name= 키를 우선적으로 기본 이름으로 선택
  segments.forEach((seg, i) => {
    const m = seg.trim().match(/^(\w+)=(.+)$/);
    if (m && ICON_ID_KEY.test(m[1]) && baseSegIdx === -1) {
      base = m[2].trim();
      baseSegIdx = i;
    }
  });

  // fallback: 첫 번째 segment 값
  if (baseSegIdx === -1) {
    const m = segments[0]?.trim().match(/^(\w+)=(.+)$/);
    if (m) {
      base = m[2].trim();
      baseSegIdx = 0;
    } else {
      base = segments[0]?.trim() || name;
      baseSegIdx = 0;
    }
  }

  // 2nd pass: base segment 제외한 나머지를 variant로
  const variants: string[] = [];
  segments.forEach((seg, i) => {
    if (i === baseSegIdx) return;
    const m = seg.trim().match(/^(\w+)=(.+)$/);
    if (m) {
      variants.push((m[1] + '-' + m[2].trim()).toLowerCase().replace(/\s+/g, '-'));
    }
  });

  return { base: base || name, variants };
}

function toKebabCase(name: string): string {
  const { base } = parseVariantName(name);
  return base
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/=,]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function toPascalCase(name: string): string {
  const { base } = parseVariantName(name);
  return base
    .replace(/[^a-zA-Z0-9\s_/.-]/g, '')
    .split(/[\s_/.-]+|(?<=[a-z])(?=[A-Z])/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function extractVariants(name: string): string[] {
  return parseVariantName(name).variants;
}

// COMPONENT_SET 자식 노드는 name 전체가 variant props — 하나도 빠짐없이 추출
function extractAllVariants(name: string): string[] {
  return name.split(/,\s*/).reduce<string[]>((acc, seg) => {
    const m = seg.trim().match(/^(\w+)=(.+)$/);
    if (m) acc.push((m[1] + '-' + m[2].trim()).toLowerCase().replace(/\s+/g, '-'));
    return acc;
  }, []);
}

function figmaColorToHex(c: { r: number; g: number; b: number }): string {
  // Figma App은 floor()로 hex를 표시 — round()를 쓰면 1 차이 발생
  const r = Math.floor(c.r * 255);
  const g = Math.floor(c.g * 255);
  const b = Math.floor(c.b * 255);
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

// ─── Component 생성 공유 유틸 ────────────────────────────────────────────────

function toCssVarName(name: string, isAlias = false): string {
  // Semantic(alias): 마지막 세그먼트만 (Colors/Background/bg-brand-solid → --bg-brand-solid)
  // Primitive: 모든 세그먼트 유지하되 prefix 중복 제거
  //   Colors/Brand/600 → --colors-brand-600
  //   Spacing/spacing-xxs → --spacing-xxs (중복 제거)
  let raw = isAlias && name.includes('/') ? name.split('/').pop()! : name;

  // Primitive: 첫 세그먼트와 마지막 세그먼트가 중복 prefix이면 제거
  // "Spacing/spacing-xxs" → "spacing-xxs", "Colors/Brand/600" → "colors-brand-600"
  if (!isAlias && name.includes('/')) {
    const segments = name.split('/');
    const firstSeg = segments[0].toLowerCase().replace(/\s+/g, '-');
    const lastSeg = segments[segments.length - 1].toLowerCase().replace(/\s+/g, '-');
    if (segments.length === 2 && lastSeg.startsWith(firstSeg + '-')) {
      raw = segments[segments.length - 1];
    }
  }

  return (
    '--' +
    raw
      .replace(/\s*\(\d+\)\s*/g, '') // 괄호 shade 제거: "text-secondary (700)" → "text-secondary"
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\//g, '-')
      .replace(/[\u2024\u00B7\u2027]/g, '-') // U+2024 ONE DOT LEADER, U+00B7 MIDDLE DOT, U+2027 HYPHENATION POINT → dash
      .replace(/[^a-zA-Z0-9_.-]/g, '-') // underscore, 마침표 유지
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  );
}

/**
 * 노드 트리를 순회하며 fillStyleId/strokeStyleId → PaintStyle.color를 colorMap에 추가.
 * inspectSelection의 serializeNode 패턴을 참고: depth 제한 + 에러 격리
 */
async function scanNodeStyleIds(
  n: SceneNode,
  colorMap: Map<string, string>,
  depth = 0
): Promise<void> {
  if (depth > 8) return;
  try {
    for (const prop of ['fillStyleId', 'strokeStyleId'] as const) {
      const styleId = (n as any)[prop];
      if (styleId && typeof styleId === 'string') {
        const style = await figma.getStyleByIdAsync(styleId);
        if (style?.type === 'PAINT') {
          const paint = (style as PaintStyle).paints[0];
          if (paint?.type === 'SOLID') {
            const hex = figmaColorToHex((paint as SolidPaint).color);
            if (!colorMap.has(hex)) colorMap.set(hex, toCssVarName(style.name));
          }
        }
      }
    }
  } catch (_) {}
  if ('children' in n) {
    for (const child of (n as ChildrenMixin).children) {
      await scanNodeStyleIds(child as SceneNode, colorMap, depth + 1);
    }
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;
    result += CHARS[a >> 2];
    result += CHARS[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < len ? CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < len ? CHARS[c & 63] : '=';
  }
  return result;
}

function findImageNodes(useSelection: boolean): ImageData[] {
  const EXPORTABLE = new Set(['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);
  const source: readonly SceneNode[] =
    useSelection && figma.currentPage.selection.length > 0
      ? figma.currentPage.selection
      : figma.currentPage.children;

  const results: ImageData[] = [];
  const seen = new Set<string>();

  function traverse(node: SceneNode) {
    if (seen.has(node.id)) return;

    if (EXPORTABLE.has(node.type)) {
      const fills = (node as any).fills;
      const hasImageFill =
        Array.isArray(fills) && fills.some((p: any) => p.type === 'IMAGE' && p.visible !== false);

      if (hasImageFill) {
        seen.add(node.id);
        results.push({
          id: node.id,
          name: node.name,
          kebab: toKebabCase(node.name),
          nodeType: node.type,
          width: Math.round(node.width),
          height: Math.round(node.height),
        });
      }
    }

    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child as SceneNode);
    }
  }

  for (const node of source) traverse(node as SceneNode);
  return results;
}

// 이미지 추출 취소 플래그 — cancel-extract-images 메시지 수신 시 true로 설정
let _extractImagesCancelled = false;

// IMAGE fill이 있는 노드를 동기로 수집 (exportAsync 없이 목록만)
function collectImageTargets(useSelection: boolean): SceneNode[] {
  const EXPORTABLE = new Set(['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);
  const source: readonly SceneNode[] =
    useSelection && figma.currentPage.selection.length > 0
      ? figma.currentPage.selection
      : figma.currentPage.children;
  const results: SceneNode[] = [];
  const seen = new Set<string>();
  function traverse(node: SceneNode) {
    if (seen.has(node.id)) return;
    if (EXPORTABLE.has(node.type)) {
      const fills = (node as any).fills;
      if (
        Array.isArray(fills) &&
        fills.some((p: any) => p.type === 'IMAGE' && p.visible !== false)
      ) {
        seen.add(node.id);
        results.push(node);
      }
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child as SceneNode);
    }
  }
  for (const node of source) traverse(node as SceneNode);
  return results;
}

async function extractImages(options: ExtractImagesOptions): Promise<{
  assets: ImageAsset[];
  errors: { id: string; name: string; error: string }[];
  cancelled: boolean;
}> {
  _extractImagesCancelled = false;

  const targets = collectImageTargets(options.useSelection);
  const total = targets.length * options.scales.length;
  let done = 0;

  figma.ui.postMessage({ type: 'extract-images-progress', current: 0, total });

  const ext = options.format === 'PNG' ? 'png' : 'jpg';
  const mime = options.format === 'PNG' ? 'image/png' : 'image/jpeg';
  const assets: ImageAsset[] = [];
  const errors: { id: string; name: string; error: string }[] = [];

  for (const node of targets) {
    if (_extractImagesCancelled) break;
    const nodeData = {
      id: node.id,
      name: node.name,
      kebab: toKebabCase(node.name),
      nodeType: node.type,
      width: Math.round(node.width),
      height: Math.round(node.height),
    };
    for (const scale of options.scales) {
      if (_extractImagesCancelled) break;
      try {
        const bytes = await (node as ExportMixin).exportAsync({
          format: options.format,
          constraint: { type: 'SCALE', value: scale },
        });
        const base64 = uint8ToBase64(new Uint8Array(bytes));
        assets.push({
          ...nodeData,
          format: options.format,
          scale,
          fileName: `${nodeData.kebab}-${node.id.replace(':', '-')}@${scale}x.${ext}`,
          base64,
          mimeType: mime,
          byteSize: bytes.byteLength,
        });
      } catch (e: any) {
        errors.push({ id: node.id, name: node.name, error: String(e) });
      }
      done++;
      figma.ui.postMessage({ type: 'extract-images-progress', current: done, total });
    }
  }

  return { assets, errors, cancelled: _extractImagesCancelled };
}

const EXPORTABLE_TYPES = new Set([
  'COMPONENT',
  'INSTANCE',
  'FRAME',
  'GROUP',
  'VECTOR',
  'BOOLEAN_OPERATION',
]);
const CONTAINER_TYPES = new Set(['FRAME', 'GROUP', 'COMPONENT_SET', 'SECTION']);

// 컨테이너(Frame/Group/ComponentSet)면 자식 재귀 탐색, 아니면 노드 자체 수집
// section: 최초 선택된 컨테이너 이름 — 재귀 시 유지 (하위 컨테이너 이름으로 덮지 않음)
function collectExportTargets(
  node: SceneNode,
  seen: Set<string>,
  section: string
): { node: SceneNode; section: string }[] {
  if (seen.has(node.id)) return [];
  if (CONTAINER_TYPES.has(node.type)) {
    if (!('children' in node)) return [];
    const out: { node: SceneNode; section: string }[] = [];
    for (const child of (node as ChildrenMixin).children) {
      out.push(...collectExportTargets(child as SceneNode, seen, section));
    }
    return out;
  }
  if (EXPORTABLE_TYPES.has(node.type)) {
    seen.add(node.id);
    return [{ node, section }];
  }
  return [];
}

// 노드의 부모 체인을 올라가며 가장 가까운 FRAME/SECTION 이름을 반환
// COMPONENT_SET은 variant 구조 컨테이너라 제외
// 부모 체인을 올라가며 PAGE 바로 아래 최상위 FRAME/SECTION을 반환 (노드 자체)
function resolveSectionNode(node: SceneNode): SceneNode | null {
  let sectionNode: SceneNode | null = null;
  let cur: BaseNode | null = node.parent;
  while (cur && cur.type !== 'PAGE' && cur.type !== 'DOCUMENT') {
    if ((cur.type === 'FRAME' || cur.type === 'SECTION') && (cur as any).name) {
      sectionNode = cur as SceneNode;
    }
    cur = cur.parent;
  }
  return sectionNode;
}

function resolveSection(node: SceneNode): string {
  return resolveSectionNode(node)?.name ?? '';
}

type IconVariantResult = {
  props: Record<string, string>;
  colorTokens?: string[];
  svg: string;
  format?: 'svg' | 'png';
  pngBase64?: string;
};

type IconSetResult = {
  name: string;
  kebab: string;
  pascal: string;
  section: string;
  propDefs?: Record<string, Record<string, Record<string, string | number>>>;
  cssDefaults?: Record<string, string | number>;
  variants: IconVariantResult[];
};

type IconSetCollected = IconSetResult & {
  _sx: number;
  _sy: number;
  _nx: number;
  _ny: number;
};

// UI 렌더링 호환용 flat 타입 (tab-icons.js 어댑터에서 생성)
type IconResult = {
  name: string;
  kebab: string;
  pascal: string;
  variants: string[];
  colorTokens?: string[];
  svg: string;
  section: string;
  format?: 'svg' | 'png';
  pngBase64?: string;
};

type IconCollected = IconResult & {
  _sx: number;
  _sy: number;
  _nx: number;
  _ny: number;
};

function getAbsPos(node: SceneNode): { x: number; y: number } {
  const box = (node as any).absoluteBoundingBox as { x: number; y: number } | null;
  return box ?? { x: node.x, y: node.y };
}

// Figma 자동 기본 레이어명 패턴 (Vector, Path, Ellipse 등)
const FIGMA_DEFAULT_NAME_RE =
  /^(vector|path|group|frame|rectangle|ellipse|polygon|star|line|arrow|union|subtract|intersect|exclude)\s*\d*$/i;

// 아이콘 고유 이름 + variants 를 함께 결정
// Case 1: Glyph=/Name= 키 존재 → 그 값이 이름, 나머지가 variants (기존 parseVariantName)
// Case 2: 전부 Key=Value (ICON_ID_KEY 없음) + COMPONENT_SET 내 → parent 이름이 아이콘 이름
// Case 3: 서술형 이름 (Key=Value 아닌 segment 포함) → node.name 그대로 사용
// Case 4: Figma 기본 자동명(Vector, Path 등) → parent 이름으로 fallback
function iconIdentity(node: SceneNode): { displayName: string; variants: string[] } {
  const raw = node.name;
  const segments = raw.split(/,\s*/);

  // Case 1: Glyph=/Name= 키가 있으면 parseVariantName이 올바르게 처리
  const hasIdKey = segments.some((s) => {
    const m = s.trim().match(/^(\w+)=/);
    return m && ICON_ID_KEY.test(m[1]);
  });
  if (hasIdKey) {
    const { base, variants } = parseVariantName(raw);
    return { displayName: base, variants };
  }

  // Case 2: 모든 segment가 Key=Value이고 COMPONENT_SET 내 → parent가 아이콘 이름
  const allAreProps = segments.length > 0 && segments.every((s) => /^\w+=/.test(s.trim()));
  if (allAreProps && node.parent?.type === 'COMPONENT_SET') {
    return {
      displayName: (node.parent as ComponentSetNode).name,
      variants: extractAllVariants(raw),
    };
  }

  // Case 4: Figma 기본 자동명 → 부모 이름으로 fallback
  const { base, variants } = parseVariantName(raw);
  if (FIGMA_DEFAULT_NAME_RE.test(base.trim()) && node.parent && 'name' in node.parent) {
    const parentName = (node.parent as SceneNode).name;
    if (!FIGMA_DEFAULT_NAME_RE.test(parentName.trim())) {
      return { displayName: parentName, variants };
    }
  }

  // Case 3: 서술형 이름 (혼합 or 순수 서술형) → node.name 처리
  return { displayName: base, variants };
}

// SVG에 foreignObject(backdrop-filter) 또는 raster <image> 레이어가 있으면 PNG 필요
// <image\b: word boundary로 <imageRendering> 등 오탐 방지
function svgNeedsPng(svg: string): boolean {
  return /<image\b/.test(svg) || svg.includes('foreignObject');
}

// 노드를 @2x PNG로 내보내 base64 문자열 반환
// Figma 샌드박스에서 btoa 미지원 → 수동 base64 인코딩
async function exportNodeAsPng(node: SceneNode): Promise<string> {
  const bytes = await (node as any).exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: 2 },
  });
  const arr = new Uint8Array(bytes);
  if (arr.length === 0) throw new Error('PNG export returned empty bytes');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < arr.length; i += 3) {
    const b0 = arr[i];
    const b1 = arr[i + 1] ?? 0;
    const b2 = arr[i + 2] ?? 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < arr.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < arr.length ? chars[b2 & 63] : '=';
  }
  return result;
}

// Variable이 semantic alias인지 판별 — valuesByMode 첫 값이 VARIABLE_ALIAS면 alias
function isAliasVariable(variable: Variable): boolean {
  const firstVal = Object.values(variable.valuesByMode)[0];
  return (
    typeof firstVal === 'object' && firstVal !== null && (firstVal as any).type === 'VARIABLE_ALIAS'
  );
}

// Variable → CSS var 참조 문자열 (토큰 이름 정규화 포함)
// e.g. Colors/Foreground/fg-success-secondary → "var(--fg-success-secondary, #22c55e)"
function varToTokenRef(variable: Variable | null, id: string, color: RGB): string {
  const tokenName = variable ? toCssVarName(variable.name, isAliasVariable(variable)).slice(2) : id;
  return `var(--${tokenName}, ${figmaColorToHex(color)})`;
}

// exportIcons / exportIconsAll 공통 — SVG 내보내기 후 PNG 폴백 포함한 entry 생성
async function collectColorTokens(node: SceneNode): Promise<string[]> {
  const varIds = new Set<string>();

  function traverse(n: BaseNode) {
    for (const prop of ['fills', 'strokes'] as const) {
      if (prop in n) {
        const paints = (n as GeometryMixin)[prop];
        if (!Array.isArray(paints)) continue; // figma.mixed guard
        for (const paint of paints as Paint[]) {
          const bv = (paint as any).boundVariables?.color;
          if (bv?.type === 'VARIABLE_ALIAS') varIds.add(bv.id as string);
        }
      }
    }
    if ('children' in n) {
      for (const child of (n as ChildrenMixin).children) traverse(child);
    }
  }
  traverse(node);

  if (varIds.size === 0) return [];

  const names: string[] = [];
  for (const id of varIds) {
    const variable = await figma.variables.getVariableByIdAsync(id);
    if (variable) {
      names.push(toCssVarName(variable.name, isAliasVariable(variable)).slice(2));
    }
  }
  return names;
}

async function buildIconEntry(
  node: SceneNode,
  section: string
): Promise<Omit<IconCollected, '_sx' | '_sy' | '_nx' | '_ny'>> {
  const svgBytes = await (node as any).exportAsync({ format: 'SVG' });
  const bytes = new Uint8Array(svgBytes);
  let svg = '';
  for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);

  const { displayName, variants } = iconIdentity(node);
  const colorTokens = await collectColorTokens(node);
  const entry: Omit<IconCollected, '_sx' | '_sy' | '_nx' | '_ny'> = {
    name: displayName,
    kebab: toKebabCase(displayName),
    pascal: toPascalCase(displayName),
    variants,
    ...(colorTokens.length > 0 && { colorTokens }),
    svg,
    format: 'svg', // 기본값 명시 — PNG 감지 실패 시에도 앱에서 안전하게 처리
    section,
  };

  if (svgNeedsPng(svg)) {
    try {
      entry.pngBase64 = await exportNodeAsPng(node);
      entry.format = 'png';
    } catch (e) {
      console.error('[png-export] failed:', (e as Error).message, 'node:', node.name);
      // format은 이미 'svg'로 초기화됨
    }
  }

  return entry;
}

// ── COMPONENT_SET 기반 구조화 내보내기 ──────────────────────────────────

async function buildVariantCSSVars(node: SceneNode): Promise<Record<string, string | number>> {
  const vars: Record<string, string | number> = {};

  async function traverse(n: BaseNode): Promise<void> {
    if ('fills' in n) {
      const fills = (n as GeometryMixin).fills;
      if (Array.isArray(fills)) {
        // figma.mixed guard
        for (const fill of fills as Paint[]) {
          if ((fill as any).visible === false) continue;
          const bv = (fill as any).boundVariables?.color;
          if (bv?.type === 'VARIABLE_ALIAS' && (fill as SolidPaint).color) {
            const variable = await figma.variables.getVariableByIdAsync(bv.id);
            vars[`--${toKebabCase(n.name)}`] = varToTokenRef(
              variable,
              bv.id,
              (fill as SolidPaint).color
            );
          }
        }
      }
    }
    if ('strokes' in n) {
      const strokes = (n as GeometryMixin).strokes;
      if (Array.isArray(strokes)) {
        // figma.mixed guard
        for (const stroke of strokes as Paint[]) {
          if ((stroke as any).visible === false) continue;
          const bv = (stroke as any).boundVariables?.color;
          if (bv?.type === 'VARIABLE_ALIAS' && (stroke as SolidPaint).color) {
            const variable = await figma.variables.getVariableByIdAsync(bv.id);
            vars[`--${toKebabCase(n.name)}-stroke`] = varToTokenRef(
              variable,
              bv.id,
              (stroke as SolidPaint).color
            );
          }
        }
      }
    }
    if ((n as any).type === 'FRAME' && (n as any).clipsContent) {
      vars[`--${toKebabCase(n.name)}-w`] = (n as any).width as number;
    }
    if ('children' in n) {
      for (const child of (n as ChildrenMixin).children) await traverse(child);
    }
  }
  await traverse(node);
  return vars;
}

function buildPropDefs(
  variantData: Array<{ props: Record<string, string>; cssVars: Record<string, string | number> }>
): {
  propDefs: Record<string, Record<string, Record<string, string | number>>>;
  cssDefaults: Record<string, string | number>;
} {
  if (variantData.length === 0) return { propDefs: {}, cssDefaults: {} };

  const allCssKeys = [...new Set(variantData.flatMap((v) => Object.keys(v.cssVars)))];

  const cssDefaults: Record<string, string | number> = {};
  const varyingKeys = new Set<string>();
  for (const key of allCssKeys) {
    const vals = new Set(variantData.map((v) => String(v.cssVars[key] ?? '')));
    if (vals.size === 1) cssDefaults[key] = variantData[0].cssVars[key];
    else varyingKeys.add(key);
  }

  if (varyingKeys.size === 0) return { propDefs: {}, cssDefaults };

  const allPropKeys = [...new Set(variantData.flatMap((v) => Object.keys(v.props)))];
  const propDefs: Record<string, Record<string, Record<string, string | number>>> = {};

  for (const propKey of allPropKeys) {
    const propValues = [...new Set(variantData.map((v) => v.props[propKey]))].sort((a, b) => {
      const na = parseFloat(a),
        nb = parseFloat(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
    const propEntry: Record<string, Record<string, string | number>> = {};

    for (const propValue of propValues) {
      const group = variantData.filter((v) => v.props[propKey] === propValue);
      const varMapping: Record<string, string | number> = {};

      for (const cssKey of varyingKeys) {
        const valsInGroup = new Set(group.map((v) => String(v.cssVars[cssKey] ?? '')));
        if (valsInGroup.size === 1 && !valsInGroup.has('')) {
          varMapping[cssKey] = group[0].cssVars[cssKey];
        }
      }
      if (Object.keys(varMapping).length > 0) {
        propEntry[propValue.toLowerCase()] = varMapping;
      }
    }
    if (Object.keys(propEntry).length > 0) {
      propDefs[propKey.toLowerCase()] = propEntry;
    }
  }

  return { propDefs, cssDefaults };
}

async function buildIconSetEntry(
  set: ComponentSetNode,
  section: string
): Promise<Omit<IconSetCollected, '_sx' | '_sy' | '_nx' | '_ny'>> {
  const variantDataForDefs: Array<{
    props: Record<string, string>;
    cssVars: Record<string, string | number>;
  }> = [];
  const variants: IconVariantResult[] = [];

  for (const child of set.children) {
    if (child.type !== 'COMPONENT') continue;

    const props: Record<string, string> = {};
    child.name.split(',').forEach((seg) => {
      const m = seg.trim().match(/^([^=]+)=(.+)$/);
      if (m) props[m[1].trim()] = m[2].trim();
    });

    let cssVars: Record<string, string | number> = {};
    try {
      cssVars = await buildVariantCSSVars(child as SceneNode);
    } catch (e) {
      console.error('[css-vars] skip variant:', child.name, (e as Error).message);
    }

    let svg = '';
    try {
      const svgBytes = await (child as any).exportAsync({ format: 'SVG' });
      const bytes = new Uint8Array(svgBytes);
      for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);
    } catch (e) {
      console.error('[svg-export] skip variant:', child.name, (e as Error).message);
      continue;
    }

    variantDataForDefs.push({ props, cssVars });

    const colorTokens = await collectColorTokens(child as SceneNode);
    const variant: IconVariantResult = {
      props,
      ...(colorTokens.length > 0 && { colorTokens }),
      svg,
      format: 'svg',
    };
    if (svgNeedsPng(svg)) {
      try {
        variant.pngBase64 = await exportNodeAsPng(child as SceneNode);
        variant.format = 'png';
      } catch (e) {
        console.error('[png-export] failed:', (e as Error).message);
      }
    }
    variants.push(variant);
  }

  const { propDefs, cssDefaults } = buildPropDefs(variantDataForDefs);

  return {
    name: set.name,
    kebab: toKebabCase(set.name),
    pascal: toPascalCase(set.name),
    section,
    ...(Object.keys(propDefs).length > 0 && { propDefs }),
    ...(Object.keys(cssDefaults).length > 0 && { cssDefaults }),
    variants,
  };
}

async function buildStandaloneSetEntry(
  node: SceneNode,
  section: string
): Promise<Omit<IconSetCollected, '_sx' | '_sy' | '_nx' | '_ny'>> {
  const entry = await buildIconEntry(node, section);
  const propsFromVariants = Object.fromEntries(
    (entry.variants || []).map((v) => {
      const idx = v.indexOf('-');
      return idx > 0 ? [v.slice(0, idx), v.slice(idx + 1)] : [v, ''];
    })
  );
  return {
    name: entry.name,
    kebab: entry.kebab,
    pascal: entry.pascal,
    section: entry.section,
    variants: [
      {
        props: propsFromVariants,
        ...(entry.colorTokens &&
          entry.colorTokens.length > 0 && { colorTokens: entry.colorTokens }),
        svg: entry.svg,
        format: entry.format,
        ...(entry.pngBase64 && { pngBase64: entry.pngBase64 }),
      },
    ],
  };
}

function collectSetTargets(
  node: SceneNode,
  seen: Set<string>,
  section: string
): { node: SceneNode; section: string; isSet: boolean }[] {
  if (seen.has(node.id)) return [];
  if (node.type === 'COMPONENT_SET') {
    seen.add(node.id);
    return [{ node, section, isSet: true }];
  }
  // COMPONENT/INSTANCE: 아이콘 단위의 leaf — 내부 재귀 없이 바로 수집
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    seen.add(node.id);
    return [{ node, section, isSet: false }];
  }
  // FRAME: 아이콘 크기(≤64px)이면 자신이 아이콘 → leaf, 크면 폴더 → 자식 재귀
  // SECTION: 항상 폴더 → 자식 재귀
  // GROUP/VECTOR/BOOLEAN_OPERATION: 재귀하지 않음 (아이콘 내부 서브레이어)
  if (node.type === 'FRAME') {
    const w = (node as any).width as number;
    const h = (node as any).height as number;
    if (w <= 64 && h <= 64) {
      // 아이콘 크기 FRAME → leaf 수집
      seen.add(node.id);
      return [{ node, section, isSet: false }];
    }
    // 큰 FRAME → 자식에서 아이콘 탐색
    if (!('children' in node)) return [];
    const out: { node: SceneNode; section: string; isSet: boolean }[] = [];
    for (const child of (node as ChildrenMixin).children) {
      out.push(...collectSetTargets(child as SceneNode, seen, section));
    }
    return out;
  }
  if (node.type === 'SECTION') {
    if (!('children' in node)) return [];
    const out: { node: SceneNode; section: string; isSet: boolean }[] = [];
    for (const child of (node as ChildrenMixin).children) {
      out.push(...collectSetTargets(child as SceneNode, seen, section));
    }
    return out;
  }
  // VECTOR/BOOLEAN_OPERATION: 사용자가 직접 선택한 경우에만 도달 (재귀 경로에서는 GROUP/FRAME leaf 처리로 차단됨)
  if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION' || node.type === 'GROUP') {
    seen.add(node.id);
    return [{ node, section, isSet: false }];
  }
  return [];
}

function sortSetsByCanvasPosition(items: IconSetCollected[]): IconSetResult[] {
  items.sort((a, b) => a._sy - b._sy || a._sx - b._sx || a._ny - b._ny || a._nx - b._nx);
  return items.map(({ _sx: _1, _sy: _2, _nx: _3, _ny: _4, ...rest }) => rest);
}

// 캔버스 시각적 위치 기준 정렬: 섹션 Y → 섹션 X → 아이콘 Y → 아이콘 X
function sortByCanvasPosition(items: IconCollected[]): IconResult[] {
  items.sort((a, b) => a._sy - b._sy || a._sx - b._sx || a._ny - b._ny || a._nx - b._nx);
  return items.map(({ _sx: _1, _sy: _2, _nx: _3, _ny: _4, ...rest }) => rest);
}

async function exportIcons(): Promise<IconSetResult[]> {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return [];

  const seen = new Set<string>();
  const targets: { node: SceneNode; section: string; isSet: boolean }[] = [];
  for (const node of sel) {
    const section = CONTAINER_TYPES.has(node.type) ? node.name : resolveSection(node);
    targets.push(...collectSetTargets(node, seen, section));
  }

  const collected: IconSetCollected[] = [];
  for (const { node, section, isSet } of targets) {
    try {
      const sectionNode = resolveSectionNode(node);
      const sp = sectionNode ? getAbsPos(sectionNode) : { x: 0, y: 0 };
      const np = getAbsPos(node);
      const base = isSet
        ? await buildIconSetEntry(node as ComponentSetNode, section)
        : await buildStandaloneSetEntry(node, section);
      collected.push({ ...base, _sx: sp.x, _sy: sp.y, _nx: np.x, _ny: np.y });
    } catch (_) {
      // skip nodes that can't be exported
    }
  }
  return sortSetsByCanvasPosition(collected);
}

async function exportIconsAll(): Promise<IconSetResult[]> {
  const ICON_RE = /icon|ic[/\\]/i;

  // COMPONENT_SET 단위로 수집
  const sets = figma.currentPage.findAll((n) => {
    if (n.type !== 'COMPONENT_SET') return false;
    const nameMatch = ICON_RE.test(n.name);
    if (nameMatch) return true;
    const firstChild = (n as ComponentSetNode).children[0];
    if (firstChild) {
      const w = (firstChild as any).width as number;
      const h = (firstChild as any).height as number;
      // 비정방형 아이콘(예: 결제수단 34×24) 허용: 긴 변 기준 64 이하
      return w <= 64 && h <= 64;
    }
    return false;
  });

  // COMPONENT_SET 없이 단독으로 있는 COMPONENT 아이콘
  const standalones = figma.currentPage.findAll((n) => {
    if (n.type !== 'COMPONENT') return false;
    if (n.parent?.type === 'COMPONENT_SET') return false;
    if (/\bIcon=false\b/i.test(n.name)) return false;
    const w = (n as any).width as number;
    const h = (n as any).height as number;
    // 비정방형 허용: 긴 변 64 이하, 단 극단적 비율(3배 초과) 제외
    return (
      ICON_RE.test(n.name) &&
      w <= 64 &&
      h <= 64 &&
      Math.max(w, h) / Math.max(Math.min(w, h), 1) <= 3
    );
  });

  const collected: IconSetCollected[] = [];
  const seen = new Set<string>();

  for (const node of sets) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    try {
      const set = node as ComponentSetNode;
      const sectionNode = resolveSectionNode(set);
      const sp = sectionNode ? getAbsPos(sectionNode) : { x: 0, y: 0 };
      const np = getAbsPos(set);
      const section = sectionNode?.name ?? '';
      const base = await buildIconSetEntry(set, section);
      collected.push({ ...base, _sx: sp.x, _sy: sp.y, _nx: np.x, _ny: np.y });
    } catch (_) {
      // skip
    }
  }

  for (const node of standalones) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    try {
      const sceneNode = node as SceneNode;
      const sectionNode = resolveSectionNode(sceneNode);
      const sp = sectionNode ? getAbsPos(sectionNode) : { x: 0, y: 0 };
      const np = getAbsPos(sceneNode);
      const section = sectionNode?.name ?? '';
      const base = await buildStandaloneSetEntry(sceneNode, section);
      collected.push({ ...base, _sx: sp.x, _sy: sp.y, _nx: np.x, _ny: np.y });
    } catch (_) {
      // skip
    }
  }

  return sortSetsByCanvasPosition(collected);
}

async function extractThemes(): Promise<Record<string, { name: string; value: string }[]>> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const result: Record<string, { name: string; value: string }[]> = {};

  for (const col of collections) {
    if (col.modes.length < 2) continue;
    const colorVars = variables.filter(
      (v) => v.variableCollectionId === col.id && v.resolvedType === 'COLOR'
    );
    if (colorVars.length === 0) continue;

    for (const mode of col.modes) {
      const entries = colorVars.map((v) => {
        const val = v.valuesByMode[mode.modeId];
        let hex = '#000000';
        if (val && typeof val === 'object' && 'r' in (val as unknown as Record<string, unknown>)) {
          hex = figmaColorToHex(val as { r: number; g: number; b: number });
        }
        return { name: v.name, value: hex };
      });
      if (result[mode.name]) {
        result[mode.name] = result[mode.name].concat(entries);
      } else {
        result[mode.name] = entries;
      }
    }
  }
  return result;
}

type ComponentType =
  | 'dialog'
  | 'button'
  | 'tabs'
  | 'checkbox'
  | 'switch'
  | 'tooltip'
  | 'accordion'
  | 'popover'
  | 'select'
  | 'heading'
  | 'text'
  | 'card'
  | 'badge'
  | 'avatar'
  | 'separator'
  | 'input'
  | 'textarea'
  | 'progress'
  | 'slider'
  | 'radio-group'
  | 'toggle'
  | 'toggle-group'
  | 'scroll-area'
  | 'dropdown-menu'
  | 'context-menu'
  | 'navigation-menu'
  | 'hover-card'
  | 'alert-dialog'
  | 'collapsible'
  | 'callout'
  | 'table'
  | 'aspect-ratio'
  | 'skeleton'
  | 'icon-button'
  | 'spinner'
  | 'checkbox-cards'
  | 'checkbox-group'
  | 'radio-cards'
  | 'segmented-control'
  | 'tab-nav'
  | 'data-list'
  | 'code'
  | 'link'
  | 'blockquote'
  | 'kbd'
  | 'em'
  | 'strong'
  | 'layout';

interface ExtractedTexts {
  title: string;
  description: string;
  actions: string[];
  all: string[];
}

interface RadixProps {
  variant?: string;
  color?: string;
  size?: string;
}

/** 개별 variant 인스턴스의 스타일 정보 */
interface VariantStyleEntry {
  /** variantProperties: { size: 'xlarge', variant: 'Primary', state: 'rest' } */
  properties: Record<string, string>;
  /** property 값을 '_'로 join한 파일명/CSS 식별자 (예: 'md_primary_default') */
  variantSlug: string;
  /** 렌더링 크기 (px) */
  width: number;
  height: number;
  /** 루트 노드 CSS */
  styles: Record<string, string>;
  /** 자식 요소 CSS (1-level, 하위 호환용) */
  childStyles: Record<string, Record<string, string>>;
  /** 재귀 완전 트리 (100% Fidelity 추출) */
  nodeTree: NodeTreeEntry;
}

/** Component Property 정의 (Boolean, Instance Swap, Text) */
interface ComponentPropertyDef {
  type: 'BOOLEAN' | 'INSTANCE_SWAP' | 'TEXT';
  defaultValue: string | boolean;
  /** INSTANCE일 때 현재 인스턴스의 실제 값 */
  currentValue?: string | boolean;
  preferredValues?: Array<{ type: string; key: string }>;
}

interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;
  /** 선택된 노드의 재귀 완전 트리 (모든 자손 노드 포함) */
  nodeTree: NodeTreeEntry;
  radixProps: RadixProps;
  /** COMPONENT_SET의 모든 variant 옵션 */
  variantOptions?: Record<string, string[]>;
  /** COMPONENT_SET 자식 각각의 variant 속성 + 스타일 */
  variants?: VariantStyleEntry[];
  /** Component Properties (Boolean, Instance Swap, Text) */
  componentProperties?: Record<string, ComponentPropertyDef>;
}

// ── Radix Themes props 추론 ──────────────────────────────────────────────────

function inferRadixVariant(node: SceneNode): RadixProps['variant'] {
  // COMPONENT_SET: variantGroupProperties에서 첫 번째 variant 값 읽기
  if (node.type === 'COMPONENT_SET') {
    const props = (node as ComponentSetNode).variantGroupProperties ?? {};
    const variantKey = Object.keys(props).find((k) => /variant|type|style|kind/i.test(k));
    if (variantKey) {
      const values = props[variantKey].values;
      if (values.length > 0) return values[0];
    }
  }
  // COMPONENT / INSTANCE: variantProperties에서 현재 값 읽기
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const props = (node as ComponentNode | InstanceNode).variantProperties ?? {};
    const variantKey = Object.keys(props).find((k) => /variant|type|style|kind/i.test(k));
    if (variantKey) return props[variantKey];
  }
  return undefined;
}

const FIGMA_TO_RADIX_COLOR: Record<string, string> = {
  blue: 'blue',
  bright: 'blue',
  primary: 'blue',
  indigo: 'indigo',
  red: 'red',
  danger: 'red',
  error: 'red',
  crimson: 'crimson',
  green: 'green',
  success: 'green',
  orange: 'orange',
  warning: 'orange',
  amber: 'amber',
  gray: 'gray',
  grey: 'gray',
  light: 'gray',
  default: 'gray',
  neutral: 'gray',
  purple: 'purple',
  violet: 'violet',
  cyan: 'cyan',
  teal: 'teal',
  pink: 'pink',
  yellow: 'yellow',
};

function hueToRadixColor(h: number): string | undefined {
  if (h >= 200 && h <= 260) return 'blue';
  if (h >= 340 || h <= 15) return 'red';
  if (h >= 90 && h <= 150) return 'green';
  if (h >= 20 && h <= 45) return 'orange';
  if (h >= 260 && h <= 310) return 'purple';
  if (h >= 160 && h <= 195) return 'cyan';
  return undefined;
}

function inferRadixColor(node: SceneNode, colorMap: Map<string, string>): string | undefined {
  if (!('fills' in node)) return undefined;
  const fills = (node.fills as readonly Paint[]).filter(
    (f) => f.visible !== false && f.type === 'SOLID'
  );
  if (fills.length === 0) return undefined;
  const c = (fills[0] as SolidPaint).color;
  const hex =
    '#' +
    [c.r, c.g, c.b]
      .map((v) =>
        Math.floor(v * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('');

  // 1. colorMap의 CSS variable 이름에서 키워드 매칭
  const cssVar = colorMap.get(hex) || '';
  const varLower = cssVar.toLowerCase();
  for (const [keyword, radixColor] of Object.entries(FIGMA_TO_RADIX_COLOR)) {
    if (varLower.includes(keyword)) return radixColor;
  }

  // 2. hue 기반 추론
  const r = c.r,
    g = c.g,
    b = c.b;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  // 채도가 너무 낮으면 gray
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.15) return 'gray';

  return hueToRadixColor(h);
}

function inferRadixSize(node: SceneNode): RadixProps['size'] {
  // COMPONENT_SET: variantGroupProperties에서 size 키 읽기
  if (node.type === 'COMPONENT_SET') {
    const props = (node as ComponentSetNode).variantGroupProperties ?? {};
    const sizeKey = Object.keys(props).find((k) => /^size$/i.test(k));
    if (sizeKey) {
      const values = props[sizeKey].values;
      if (values.length > 0) return values[0];
    }
  }
  // COMPONENT / INSTANCE: variantProperties에서 현재 값 읽기
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const props = (node as ComponentNode | InstanceNode).variantProperties ?? {};
    const sizeKey = Object.keys(props).find((k) => /^size$/i.test(k));
    if (sizeKey) return props[sizeKey];
  }
  return undefined;
}

async function generateComponent(): Promise<GenerateComponentResult | null> {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return null;
  const node = sel[0] as SceneNode;

  // ── Step 1: INSTANCE master 먼저 해석 (텍스트 fallback에 사용) ──────────────
  const master =
    node.type === 'INSTANCE' ? await (node as InstanceNode).getMainComponentAsync() : null;

  // ── Step 2: Color 맵 구축 ─────────────────────────────────────────────────
  // colorMap: hex → CSS var (fill 색상 역방향 조회)
  // varIdMap: Variable ID → CSS var (boundVariables 직접 해석)
  const colorMap = new Map<string, string>();
  const varIdMap = new Map<string, string>();

  // 2-a. Local Variables (COLOR + FLOAT 모두 varIdMap 등록)
  const allVars = await figma.variables.getLocalVariablesAsync();
  for (const v of allVars) {
    if (v.resolvedType !== 'COLOR' && v.resolvedType !== 'FLOAT' && v.resolvedType !== 'STRING')
      continue;
    const firstMode = Object.keys(v.valuesByMode)[0];
    if (!firstMode) continue;
    const val = v.valuesByMode[firstMode];
    const isAlias = !!(
      val &&
      typeof val === 'object' &&
      'type' in (val as Record<string, unknown>) &&
      (val as { type: string }).type === 'VARIABLE_ALIAS'
    );
    const cssName = toCssVarName(v.name, isAlias);

    // varIdMap: alias든 primitive든 무조건 등록 (boundVariables 해석용)
    varIdMap.set(v.id, cssName);

    // colorMap: hex → cssName 역방향 조회 (COLOR primitive만)
    if (
      v.resolvedType === 'COLOR' &&
      !isAlias &&
      val &&
      typeof val === 'object' &&
      'r' in (val as unknown as Record<string, unknown>)
    ) {
      const hex = figmaColorToHex(val as { r: number; g: number; b: number });
      if (!colorMap.has(hex)) colorMap.set(hex, cssName);
    }
  }

  // 2-b. Color Styles + Style ID → CSS var name map
  const styleIdMap = new Map<string, string>();
  const paintStyles = await figma.getLocalPaintStylesAsync();
  for (const style of paintStyles) {
    styleIdMap.set(style.id, toCssVarName(style.name, false)); // Paint Style은 full path 사용
    const paint = (style.paints as ReadonlyArray<Paint>)[0];
    if (paint?.type === 'SOLID') {
      const hex = figmaColorToHex((paint as SolidPaint).color);
      if (!colorMap.has(hex)) colorMap.set(hex, toCssVarName(style.name));
    }
  }
  // Effect Styles — 마지막 세그먼트가 이미 시맨틱 토큰명이므로 alias 방식 사용
  const effectStyles = await figma.getLocalEffectStylesAsync();
  for (const style of effectStyles) {
    styleIdMap.set(style.id, toCssVarName(style.name, true));
  }

  // 2-c. 노드 트리 내 fillStyleId/strokeStyleId 스캔 (inspectSelection 패턴 참고)
  await scanNodeStyleIds(node, colorMap);

  // ── Step 3: 색상 해석 헬퍼 ───────────────────────────────────────────────
  function getBorderStyle(n: any): string {
    const dash = n.strokeDashPattern;
    if (!Array.isArray(dash) || dash.length === 0) return 'solid';
    return dash[0] <= 2 ? 'dotted' : 'dashed';
  }

  function resolveColor(c: { r: number; g: number; b: number }): string {
    const hex = figmaColorToHex(c);
    return colorMap.has(hex) ? 'var(' + colorMap.get(hex) + ')' : hex.toLowerCase();
  }

  // boundVariables에서 CSS var 이름 직접 추출
  // Figma의 fill/stroke variable 바인딩은 두 위치에 존재할 수 있다:
  //  1) 노드 레벨: node.boundVariables.fills (레거시/드문 케이스)
  //  2) 페인트 레벨: paint.boundVariables.color (일반적인 케이스, TEXT 색상 포함)
  function resolveBoundColor(n: SceneNode, prop: 'fills' | 'strokes'): string | null {
    try {
      // 1) 노드 레벨 boundVariables
      const bv = (n as any).boundVariables;
      if (bv) {
        const binding = Array.isArray(bv[prop]) ? bv[prop][0] : bv[prop];
        if (binding?.id && varIdMap.has(binding.id)) {
          return 'var(' + varIdMap.get(binding.id) + ')';
        }
      }
      // 2) 페인트 레벨 boundVariables (TEXT 색상 등)
      const paints = (n as any)[prop];
      if (Array.isArray(paints)) {
        for (const p of paints) {
          if (!p || p.visible === false) continue;
          const pbv = p.boundVariables?.color;
          if (pbv?.id && varIdMap.has(pbv.id)) {
            return 'var(' + varIdMap.get(pbv.id) + ')';
          }
        }
      }
    } catch (_) {}
    return null;
  }

  /** boundVariables에서 prop 바인딩 해석 → 'var(--name)' 또는 null */
  function resolveBoundVar(n: SceneNode, prop: string): string | null {
    try {
      const bv = (n as any).boundVariables;
      if (!bv) return null;
      const binding = bv[prop];
      if (binding?.id && varIdMap.has(binding.id)) {
        return 'var(' + varIdMap.get(binding.id) + ')';
      }
    } catch (_) {}
    return null;
  }

  // ── Step 4: INSTANCE 텍스트 fallback 맵 구축 ─────────────────────────────
  // inspectSelection의 serializeNode 패턴:
  // INSTANCE 내 TEXT.characters가 빈 경우 master component 위치 기반으로 보완
  const masterTextMap = new Map<string, string>();
  if (master) {
    function collectMasterTexts(n: SceneNode): void {
      if (n.type === 'TEXT') {
        const chars = ((n as any).characters ?? '').trim();
        if (chars) masterTextMap.set(Math.round(n.x) + ',' + Math.round(n.y), chars);
      } else if ('children' in n) {
        (n as ChildrenMixin).children.forEach((c) => collectMasterTexts(c as SceneNode));
      }
    }
    collectMasterTexts(master as unknown as SceneNode);
  }

  // TEXT 노드에서 안전하게 텍스트 추출 (optional chaining + master fallback)
  function safeGetText(n: SceneNode): string {
    const chars = ((n as any).characters ?? '').trim();
    if (chars) return chars;
    if (masterTextMap.size > 0) {
      return (masterTextMap.get(Math.round(n.x) + ',' + Math.round(n.y)) ?? '').trim();
    }
    return '';
  }

  // ── Step 5a: getCSSAsync 기반 스타일 변환 (Text Style 변수 포함) ──────────
  async function getNodeStylesAsync(n: SceneNode): Promise<Record<string, string>> {
    // 1. Figma Inspect CSS 획득 (Text Style 변수 참조 포함)
    let css: Record<string, string>;
    try {
      css = await n.getCSSAsync();
    } catch (_) {
      // getCSSAsync 미지원 노드 → sync fallback
      return getNodeStyles(n);
    }

    const s: Record<string, string> = {};
    for (const [key, rawValue] of Object.entries(css)) {
      // getCSSAsync는 camelCase 또는 kebab 반환 가능 — kebab으로 통일
      const kebab = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      // CSS 주석 제거 (getCSSAsync가 "24px /* 150% */" 형태로 반환)
      const value = rawValue.replace(/\s*\/\*[^*]*\*\/\s*/g, '').trim();
      // IMAGE fill 스킵: data URI는 컴포넌트 CSS에 불필요 (용량 과대, 토큰 아님)
      if (
        value.includes('url(data:') ||
        value.includes("url('data:") ||
        value.includes('url("data:')
      )
        continue;
      // var() 내부 변수명 정규화: kebab 소문자 + prefix 중복 제거
      // (getCSSAsync가 "Font family/font-family-body" → "--font-family-font-family-body" 로 반환)
      s[kebab] = value.replace(/var\(--([^,)]+)/g, (_, name) => {
        let n = name.toLowerCase();
        // prefix 중복 제거: --font-family-font-family-body → --font-family-body
        const m = n.match(/^([a-z]+-[a-z]+)-\1-/);
        if (m) n = n.replace(m[0], m[1] + '-');
        return 'var(--' + n;
      });
    }

    // 2. boundVariables 오버라이드 (getCSSAsync가 resolved 값일 때 var() 참조로 교체)
    // fills → color/background-color
    const isText = n.type === 'TEXT';
    const fillVar = resolveBoundColor(n, 'fills');
    if (fillVar) {
      const fillProp = isText ? 'color' : 'background-color';
      s[fillProp] = fillVar;
      // getCSSAsync의 'background' shorthand와 중복 제거
      if (!isText && s['background']) delete s['background'];
    }

    // strokes → stroke (VECTOR 노드에서 getCSSAsync가 full-path 이름을 반환하는 경우 alias 단축명으로 교체)
    const strokeVar = resolveBoundColor(n, 'strokes');
    if (strokeVar && s['stroke']) s['stroke'] = strokeVar;

    // stroke → strokeStyleId 토큰 우선
    // VECTOR/SVG 노드는 getCSSAsync가 SVG stroke 속성을 이미 반환 → border-image 중복 방지
    if ('strokes' in n && !s['stroke']) {
      const strokeStyleId = 'strokeStyleId' in n ? (n as any).strokeStyleId : '';
      if (typeof strokeStyleId === 'string' && strokeStyleId && styleIdMap.has(strokeStyleId)) {
        const sw = 'strokeWeight' in n ? Math.round((n as any).strokeWeight) || 1 : 1;
        // Paint Style이 gradient인지 확인 → gradient이면 첫 번째 stop 색으로 solid 변환
        // border-image는 border-radius를 무효화하므로 사용하지 않음
        try {
          const paintStyle = figma.getStyleById(strokeStyleId) as PaintStyle | null;
          const paint = paintStyle?.paints?.[0];
          if (paint?.type?.startsWith('GRADIENT_')) {
            const stops = (paint as GradientPaint).gradientStops;
            if (stops?.length) {
              const c = stops[0].color;
              const rgba = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 100) / 100})`;
              s['border'] = sw + 'px ' + getBorderStyle(n) + ' ' + rgba;
              delete s['border-image'];
              delete s['border-width'];
              delete s['border-style'];
              delete s['border-color'];
            }
          } else {
            // Solid paint style → border: Xpx solid var(--token)
            s['border'] =
              sw + 'px ' + getBorderStyle(n) + ' var(' + styleIdMap.get(strokeStyleId)! + ')';
            delete s['border-width'];
            delete s['border-style'];
            delete s['border-color'];
            delete s['border-image'];
          }
        } catch {
          // getStyleById 실패 시 → strokes 배열 직접 확인
          const rawPaints = (n as any).strokes as Paint[];
          const rawPaint = Array.isArray(rawPaints) ? rawPaints[0] : null;
          if (rawPaint?.type?.startsWith('GRADIENT_')) {
            const stops = (rawPaint as GradientPaint).gradientStops;
            if (stops?.length) {
              const c = stops[0].color;
              const rgba = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 100) / 100})`;
              s['border'] = sw + 'px ' + getBorderStyle(n) + ' ' + rgba;
            }
          } else {
            s['border'] =
              sw + 'px ' + getBorderStyle(n) + ' var(' + styleIdMap.get(strokeStyleId)! + ')';
            delete s['border-width'];
            delete s['border-style'];
            delete s['border-color'];
            delete s['border-image'];
          }
        }
      } else {
        const strokeVar = resolveBoundColor(n, 'strokes');
        const sw = 'strokeWeight' in n ? Math.round((n as any).strokeWeight) || 1 : 1;
        if (strokeVar) {
          s['border'] = sw + 'px ' + getBorderStyle(n) + ' ' + strokeVar;
        } else {
          // GRADIENT_LINEAR stroke → 첫 번째 stop 색상으로 solid 변환
          // (getCSSAsync fallback의 border-image: linear-gradient(...)는 border-radius를 무효화)
          const paints = (n as any).strokes as Paint[];
          if (Array.isArray(paints) && paints.length > 0 && paints[0]?.type === 'GRADIENT_LINEAR') {
            const stops = (paints[0] as GradientPaint).gradientStops;
            if (stops?.length) {
              const c = stops[0].color;
              const rgba = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 100) / 100})`;
              s['border'] = sw + 'px ' + getBorderStyle(n) + ' ' + rgba;
              delete s['border-image'];
              delete s['border-style'];
              delete s['border-width'];
            }
          }
        }
      }
    }

    // VECTOR/LINE 노드: CSS border는 SVG에서 무의미 → stroke/stroke-width로 변환
    if (
      (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE') &&
      s['border']
    ) {
      const m = s['border'].match(/^(\d+)px\s+\S+\s+(.+)$/);
      if (m) {
        s['stroke-width'] = m[1] + 'px';
        s['stroke'] = m[2];
      }
      delete s['border'];
      delete s['border-image'];
    }

    // effects → effectStyleId 토큰 우선
    if ('effects' in n) {
      const effectStyleId = 'effectStyleId' in n ? (n as any).effectStyleId : '';
      if (typeof effectStyleId === 'string' && effectStyleId && styleIdMap.has(effectStyleId)) {
        s['box-shadow'] = 'var(' + styleIdMap.get(effectStyleId)! + ')';
      }
    }

    // cornerRadius → boundVar 우선
    const crBound = resolveBoundVar(n, 'cornerRadius');
    if (crBound) s['border-radius'] = crBound;

    // gap/padding → boundVar 우선
    if ('layoutMode' in n) {
      const f = n as FrameNode;
      const gapBound = resolveBoundVar(n, 'itemSpacing');
      if (gapBound) s['gap'] = gapBound;

      const ptB = resolveBoundVar(n, 'paddingTop');
      const prB = resolveBoundVar(n, 'paddingRight');
      const pbB = resolveBoundVar(n, 'paddingBottom');
      const plB = resolveBoundVar(n, 'paddingLeft');
      if (ptB || prB || pbB || plB) {
        const pt = ptB ?? (f.paddingTop > 0 ? f.paddingTop + 'px' : '0px');
        const pr = prB ?? (f.paddingRight > 0 ? f.paddingRight + 'px' : '0px');
        const pb = pbB ?? (f.paddingBottom > 0 ? f.paddingBottom + 'px' : '0px');
        const pl = plB ?? (f.paddingLeft > 0 ? f.paddingLeft + 'px' : '0px');
        s['padding'] = pt + ' ' + pr + ' ' + pb + ' ' + pl;
      }
    }

    // typography → boundVar 우선 (getCSSAsync가 Text Style 변수를 포함하지 않는 경우)
    if (isText) {
      const tbv = (n as any).boundVariables ?? {};
      if (tbv.fontSize?.id && varIdMap.has(tbv.fontSize.id))
        s['font-size'] = 'var(' + varIdMap.get(tbv.fontSize.id) + ')';
      if (tbv.fontFamily?.id && varIdMap.has(tbv.fontFamily.id))
        s['font-family'] = 'var(' + varIdMap.get(tbv.fontFamily.id) + ')';
      if (tbv.fontWeight?.id && varIdMap.has(tbv.fontWeight.id))
        s['font-weight'] = 'var(' + varIdMap.get(tbv.fontWeight.id) + ')';
      if (tbv.lineHeight?.id && varIdMap.has(tbv.lineHeight.id))
        s['line-height'] = 'var(' + varIdMap.get(tbv.lineHeight.id) + ')';
    }

    // getCSSAsync 미포함 속성
    if ('clipsContent' in n && (n as any).clipsContent === true) {
      s['overflow'] = 'hidden';
    }
    if ('opacity' in n) {
      const op = (n as any).opacity;
      if (typeof op === 'number' && op < 1) {
        s['opacity'] = String(Math.round(op * 100) / 100);
      }
    }
    if (!isText && 'layoutSizingHorizontal' in n) {
      const horiz = (n as any).layoutSizingHorizontal;
      const vert = (n as any).layoutSizingVertical;
      if (horiz === 'FIXED' && typeof (n as any).width === 'number') {
        s['width'] = Math.round((n as any).width) + 'px';
      }
      if (vert === 'FIXED' && typeof (n as any).height === 'number') {
        s['height'] = Math.round((n as any).height) + 'px';
      }
    }

    // 도형 노드의 iconColor 추출 (stroke 우선, 없으면 border)
    if ('fills' in n && n.type !== 'TEXT' && n.type !== 'FRAME' && n.type !== 'GROUP') {
      const strokeVal = s['stroke'] || s['border'];
      if (strokeVal) {
        const varMatch = strokeVal.match(/var\([^)]+\)/);
        if (varMatch) s['iconColor'] = varMatch[0];
      }
    }

    return s;
  }

  // ── Step 5a-2: async childStyles ──────────────────────────────────────────
  async function getChildStylesAsync(
    n: SceneNode,
    maxDepth = 4
  ): Promise<Record<string, Record<string, string>>> {
    const result: Record<string, Record<string, string>> = {};
    async function walk(parent: SceneNode, prefix: string, depth: number): Promise<void> {
      if (!('children' in parent) || depth > maxDepth) return;
      for (let i = 0; i < (parent as ChildrenMixin).children.length; i++) {
        const c = (parent as ChildrenMixin).children[i] as SceneNode;
        const name = c.name || c.type.toLowerCase() + '-' + i;
        const key = prefix ? prefix + ' > ' + name : name;
        result[key] = await getNodeStylesAsync(c);
        await walk(c, key, depth + 1);
      }
    }
    await walk(n, '', 1);
    return result;
  }

  // ── Step 5b: sync 버전 (nodeTree용, 하위 호환) ─────────────────────────────
  function getNodeStyles(n: SceneNode): Record<string, string> {
    const s: Record<string, string> = {};
    const isText = n.type === 'TEXT';

    // fill: boundVariables 우선 → colorMap → raw hex
    // TEXT 노드 fills → CSS color, 그 외 → background-color
    if ('fills' in n) {
      const fillProp = isText ? 'color' : 'background-color';
      const bound = resolveBoundColor(n, 'fills');
      if (bound) {
        s[fillProp] = bound;
      } else {
        const fills = (n as any).fills;
        if (Array.isArray(fills)) {
          const solid = fills.find((f: any) => f.type === 'SOLID' && f.visible !== false);
          if (solid) {
            if (typeof solid.opacity === 'number' && solid.opacity < 1) {
              const c = solid.color;
              s[fillProp] =
                `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(solid.opacity * 100) / 100})`;
            } else {
              s[fillProp] = resolveColor(solid.color);
            }
          }
        }
      }
    }

    // TEXT 노드: font 속성 추출 (boundVariables 우선 → computed fallback)
    if (isText) {
      const tn = n as TextNode;
      try {
        const tbv = (tn as any).boundVariables ?? {};

        const fsBound = tbv.fontSize;
        if (fsBound?.id && varIdMap.has(fsBound.id)) {
          s['font-size'] = 'var(' + varIdMap.get(fsBound.id) + ')';
        } else {
          const fs = tn.fontSize;
          if (typeof fs === 'number') s['font-size'] = fs + 'px';
        }

        const ffBound = tbv.fontFamily;
        const fwBound = tbv.fontWeight;
        const fn = tn.fontName;
        if (ffBound?.id && varIdMap.has(ffBound.id)) {
          s['font-family'] = 'var(' + varIdMap.get(ffBound.id) + ')';
        } else if (fn && typeof fn === 'object' && 'family' in fn) {
          s['font-family'] = (fn as FontName).family;
        }
        if (fwBound?.id && varIdMap.has(fwBound.id)) {
          s['font-weight'] = 'var(' + varIdMap.get(fwBound.id) + ')';
        } else if (fn && typeof fn === 'object' && 'style' in fn) {
          s['font-weight'] = String(fontWeightFromStyle((fn as FontName).style));
        }

        const lhBound = tbv.lineHeight;
        if (lhBound?.id && varIdMap.has(lhBound.id)) {
          s['line-height'] = 'var(' + varIdMap.get(lhBound.id) + ')';
        } else {
          const lh = tn.lineHeight;
          if (lh && typeof lh === 'object' && 'value' in lh) {
            s['line-height'] =
              (lh as { value: number; unit: string }).unit === 'PIXELS'
                ? (lh as { value: number }).value + 'px'
                : (lh as { value: number }).value + '%';
          }
        }
      } catch (_) {
        /* mixed styles — skip */
      }
    }

    // cornerRadius: boundVariables 우선
    if ('cornerRadius' in n) {
      const crBound = resolveBoundVar(n, 'cornerRadius');
      if (crBound) {
        s['border-radius'] = crBound;
      } else {
        const cr = (n as any).cornerRadius;
        if (typeof cr === 'number' && cr > 0) s['border-radius'] = Math.round(cr) + 'px';
      }
    }

    if ('layoutMode' in n) {
      const f = n as FrameNode;
      if (f.layoutMode === 'HORIZONTAL') {
        s['display'] = 'flex';
      } else if (f.layoutMode === 'VERTICAL') {
        s['display'] = 'flex';
        s['flex-direction'] = 'column';
      }
      // gap: boundVariables 우선
      const gapBound = resolveBoundVar(n, 'itemSpacing');
      if (gapBound) {
        s['gap'] = gapBound;
      } else if (f.itemSpacing > 0) {
        s['gap'] = f.itemSpacing + 'px';
      }
      // padding: boundVariables 우선 (각 방향 개별)
      const ptB = resolveBoundVar(n, 'paddingTop');
      const prB = resolveBoundVar(n, 'paddingRight');
      const pbB = resolveBoundVar(n, 'paddingBottom');
      const plB = resolveBoundVar(n, 'paddingLeft');
      const pt = ptB ?? (f.paddingTop > 0 ? f.paddingTop + 'px' : '0px');
      const pr = prB ?? (f.paddingRight > 0 ? f.paddingRight + 'px' : '0px');
      const pb = pbB ?? (f.paddingBottom > 0 ? f.paddingBottom + 'px' : '0px');
      const pl = plB ?? (f.paddingLeft > 0 ? f.paddingLeft + 'px' : '0px');
      if (
        ptB ||
        prB ||
        pbB ||
        plB ||
        f.paddingTop > 0 ||
        f.paddingRight > 0 ||
        f.paddingBottom > 0 ||
        f.paddingLeft > 0
      ) {
        s['padding'] = pt + ' ' + pr + ' ' + pb + ' ' + pl;
      }
    }

    // stroke: strokeStyleId 우선 → boundVariables → raw 값
    // VECTOR/SVG 노드는 getCSSAsync가 SVG stroke를 이미 반환 → border-image 중복 방지
    if ('strokes' in n && !s['stroke']) {
      const strokeWeight = 'strokeWeight' in n ? Math.round((n as any).strokeWeight) || 1 : 1;
      const strokeStyleId = 'strokeStyleId' in n ? (n as any).strokeStyleId : '';

      if (typeof strokeStyleId === 'string' && strokeStyleId && styleIdMap.has(strokeStyleId)) {
        // Paint Style이 gradient인지 확인 → gradient이면 첫 번째 stop 색으로 solid 변환
        try {
          const paintStyle = figma.getStyleById(strokeStyleId) as PaintStyle | null;
          const paint = paintStyle?.paints?.[0];
          if (paint?.type?.startsWith('GRADIENT_')) {
            const stops = (paint as GradientPaint).gradientStops;
            if (stops?.length) {
              const c = stops[0].color;
              const rgba = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 100) / 100})`;
              s['border'] = strokeWeight + 'px ' + getBorderStyle(n) + ' ' + rgba;
            }
          } else {
            s['border'] =
              strokeWeight +
              'px ' +
              getBorderStyle(n) +
              ' var(' +
              styleIdMap.get(strokeStyleId)! +
              ')';
            delete s['border-width'];
            delete s['border-style'];
            delete s['border-image'];
          }
        } catch {
          s['border'] =
            strokeWeight +
            'px ' +
            getBorderStyle(n) +
            ' var(' +
            styleIdMap.get(strokeStyleId)! +
            ')';
          delete s['border-width'];
          delete s['border-style'];
          delete s['border-image'];
        }
      } else {
        const bound = resolveBoundColor(n, 'strokes');
        if (bound) {
          s['border'] = strokeWeight + 'px ' + getBorderStyle(n) + ' ' + bound;
        } else {
          const strokes = (n as any).strokes;
          if (Array.isArray(strokes)) {
            const solid = strokes.find((f: any) => f.type === 'SOLID' && f.visible !== false);
            if (solid) {
              s['border'] =
                strokeWeight + 'px ' + getBorderStyle(n) + ' ' + resolveColor(solid.color);
            } else {
              const gradient = strokes.find(
                (f: any) => f.type?.startsWith('GRADIENT_') && f.visible !== false
              );
              if (gradient) {
                // GRADIENT stroke → 첫 번째 stop 색상으로 변환
                // border-image는 border-radius를 무효화하므로 사용하지 않음
                const stops = gradient.gradientStops;
                if (stops?.length) {
                  const c = stops[0].color;
                  const rgba = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 100) / 100})`;
                  s['border'] = strokeWeight + 'px ' + getBorderStyle(n) + ' ' + rgba;
                }
              }
            }
          }
        }
      }
    }

    // VECTOR/LINE 노드: CSS border는 SVG에서 무의미 → stroke/stroke-width로 변환
    if (
      (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE') &&
      s['border']
    ) {
      const m = s['border'].match(/^(\d+)px\s+\S+\s+(.+)$/);
      if (m) {
        s['stroke-width'] = m[1] + 'px';
        s['stroke'] = m[2];
      }
      delete s['border'];
      delete s['border-image'];
    }

    // effects: effectStyleId 우선 → raw shadow 값
    if ('effects' in n) {
      const effectStyleId = 'effectStyleId' in n ? (n as any).effectStyleId : '';
      if (typeof effectStyleId === 'string' && effectStyleId && styleIdMap.has(effectStyleId)) {
        s['box-shadow'] = 'var(' + styleIdMap.get(effectStyleId)! + ')';
      } else {
        const effects = (n as any).effects;
        if (Array.isArray(effects)) {
          const shadows: string[] = [];
          for (const e of effects) {
            if (!e.visible) continue;
            if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
              const ox = e.offset?.x ?? 0;
              const oy = e.offset?.y ?? 0;
              const blur = e.radius ?? 0;
              const spread = e.spread ?? 0;
              const c = e.color ?? { r: 0, g: 0, b: 0, a: 1 };
              const rgba = `rgba(${Math.floor(c.r * 255)},${Math.floor(c.g * 255)},${Math.floor(c.b * 255)},${Math.round((c.a ?? 1) * 100) / 100})`;
              const inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
              shadows.push(`${inset}${ox}px ${oy}px ${blur}px ${spread}px ${rgba}`);
            }
          }
          if (shadows.length > 0) s['box-shadow'] = shadows.join(', ');
        }
      }
    }

    if ('opacity' in n) {
      const op = (n as any).opacity;
      if (typeof op === 'number' && op < 1) {
        s['opacity'] = String(Math.round(op * 100) / 100);
      }
    }

    // clipsContent → overflow: hidden
    if ('clipsContent' in n && (n as any).clipsContent === true) {
      s['overflow'] = 'hidden';
    }

    // 자식 노드의 고정 크기 추출 (아이콘 슬롯 placeholder, 이미지 박스 등)
    // - FIXED: 사용자가 크기를 명시 → width/height 추출
    // - FILL/HUG: 부모/콘텐츠에 맞춰 변형 → 추출하지 않음
    // - TEXT 노드는 auto-resize 되므로 제외
    if (!isText && 'layoutSizingHorizontal' in n) {
      const horiz = (n as any).layoutSizingHorizontal;
      const vert = (n as any).layoutSizingVertical;
      if (horiz === 'FIXED' && typeof (n as any).width === 'number') {
        s['width'] = Math.round((n as any).width) + 'px';
      }
      if (vert === 'FIXED' && typeof (n as any).height === 'number') {
        s['height'] = Math.round((n as any).height) + 'px';
      }
    }

    return s;
  }

  // ── Step 7: 컴포넌트 타입 자동 감지 ──────────────────────────────────────
  function detectComponentType(n: SceneNode): ComponentType {
    const name = n.name
      .toLowerCase()
      .split('/')
      .map((s) => s.trim())
      .join(' ');
    // 정확히 'text' 또는 'texts'인 경우 text 타입 (button text, text-input 등과 혼동 방지)
    if (name === 'text' || name === 'texts') return 'text';
    const patterns: Array<[string[], ComponentType]> = [
      [['dialog', 'modal', 'confirm', 'alert', 'popup'], 'dialog'],
      [['button', 'btn', 'cta', 'action'], 'button'],
      [['tab', 'tabs'], 'tabs'],
      [['checkbox', 'check'], 'checkbox'],
      [['switch', 'toggle'], 'switch'],
      [['tooltip', 'hint', 'tip'], 'tooltip'],
      [['accordion', 'collapse', 'expand'], 'accordion'],
      [['popover', 'dropdown', 'flyout'], 'popover'],
      [['select', 'combobox', 'picker'], 'select'],
      [['heading', 'headings', 'typography', 'type scale', 'typescale', 'typeface'], 'heading'],
      [
        ['text style', 'text styles', 'text scale', 'body text', 'paragraph style', 'paragraph'],
        'text',
      ],
      [['card', 'tile', 'content-card'], 'card'],
      [['badge', 'chip', 'tag', 'pill', 'label-pill'], 'badge'],
      [['avatar', 'profile-pic', 'user-icon', 'user-avatar'], 'avatar'],
      [['separator', 'divider', 'hr', 'rule'], 'separator'],
      [['textarea', 'text area', 'multiline', 'multi-line'], 'textarea'],
      [['input', 'textfield', 'text-input', 'text field', 'search'], 'input'],
      [['progress', 'progress bar', 'progressbar', 'loading bar'], 'progress'],
      [['slider', 'range input', 'handle'], 'slider'],
      [['radio group', 'radio button', 'option group'], 'radio-group'],
      [['toggle group', 'segmented control', 'button group'], 'toggle-group'],
      [['icon toggle', 'toggle button'], 'toggle'],
      [['scroll area', 'scrollable', 'scroll container'], 'scroll-area'],
      [['dropdown menu', 'action menu', 'options menu'], 'dropdown-menu'],
      [['context menu', 'right click menu'], 'context-menu'],
      [['navigation menu', 'nav menu', 'gnb menu'], 'navigation-menu'],
      [['hover card', 'preview card'], 'hover-card'],
      [['alert dialog', 'confirm dialog', 'warning dialog'], 'alert-dialog'],
      [['collapsible', 'expandable section'], 'collapsible'],
      [['callout', 'notice', 'info box', 'warning box', 'alert box'], 'callout'],
      [['table', 'data table', 'spreadsheet'], 'table'],
      [['aspect ratio', 'ratio box'], 'aspect-ratio'],
      [['skeleton', 'placeholder', 'shimmer', 'loading state'], 'skeleton'],
    ];
    for (const [keywords, type] of patterns) {
      if (keywords.some((kw) => name.includes(kw))) return type;
    }
    if (!('children' in n)) return 'layout';
    const children = (n as ChildrenMixin).children as SceneNode[];
    const textNodes = children.filter((c) => c.type === 'TEXT');
    const frameNodes = children.filter((c) => c.type === 'FRAME' || c.type === 'RECTANGLE');
    const nw = 'width' in n ? (n as any).width : 0;
    const nh = 'height' in n ? (n as any).height : 0;

    // 버튼 감지: 텍스트 1개 + auto-layout HORIZONTAL + 인라인 형태(width >= height) + solid fill
    if (
      textNodes.length >= 1 &&
      'layoutMode' in n &&
      (n as FrameNode).layoutMode === 'HORIZONTAL' &&
      nw >= nh
    ) {
      const frameFills = (n as any).fills;
      const hasSolidFill =
        (Array.isArray(frameFills) &&
          frameFills.some((f: any) => f.type === 'SOLID' && f.visible !== false)) ||
        frameNodes.some((fr) => {
          const fills = (fr as any).fills;
          return (
            Array.isArray(fills) &&
            fills.some((f: any) => f.type === 'SOLID' && f.visible !== false)
          );
        });
      if (hasSolidFill) return 'button';
    }
    if ('layoutMode' in n && (n as FrameNode).layoutMode === 'HORIZONTAL' && frameNodes.length >= 2)
      return 'tabs';
    // 체크박스 감지: 1:1 비율의 작은 사각형 (전체 크기의 30% 이하) + 텍스트
    const smallRect = frameNodes.find((f) => {
      const ratio = Math.min(f.width, f.height) / Math.max(f.width, f.height);
      const relativeSize = Math.max(f.width, f.height) / Math.max(nw, nh, 1);
      return ratio > 0.8 && relativeSize < 0.3;
    });
    if (smallRect && textNodes.length >= 1) return 'checkbox';
    // 다이얼로그 감지: ABSOLUTE 위치 + opacity < 1
    const hasOverlay = frameNodes.some(
      (f) => (f as any).layoutPositioning === 'ABSOLUTE' && (f as any).opacity < 1
    );
    if (hasOverlay) return 'dialog';
    return 'layout';
  }

  // ── Step 8: 텍스트 추출 (font-size 기반 역할 추론 + master fallback) ──────
  function extractTexts(n: SceneNode): ExtractedTexts {
    const collected: Array<{ text: string; y: number; x: number; fontSize: number }> = [];
    function collect(node: SceneNode): void {
      if (node.type === 'TEXT') {
        const text = safeGetText(node);
        const fs =
          typeof (node as TextNode).fontSize === 'number'
            ? ((node as TextNode).fontSize as number)
            : 14;
        if (text) collected.push({ text, y: node.y, x: node.x, fontSize: fs });
      } else if ('children' in node) {
        (node as ChildrenMixin).children.forEach((c) => collect(c as SceneNode));
      }
    }
    collect(n);
    collected.sort((a, b) => a.y - b.y || a.x - b.x);
    const all = collected.map((t) => t.text.trim()).filter(Boolean);
    // title: font-size가 가장 큰 텍스트, description: 그 다음
    const bySizeDesc = [...collected].sort((a, b) => b.fontSize - a.fontSize);
    const title = bySizeDesc[0]?.text.trim() || '';
    const description = bySizeDesc[1]?.text.trim() || '';
    // actions: auto-layout 방향에 따라 끝부분 텍스트
    const isVertical = 'layoutMode' in n && (n as FrameNode).layoutMode === 'VERTICAL';
    const nodeSize = isVertical
      ? 'height' in n
        ? (n as any).height
        : 100
      : 'width' in n
        ? (n as any).width
        : 100;
    const threshold = nodeSize * 0.65;
    const actions = collected
      .filter((t) => (isVertical ? t.y : t.x) > threshold)
      .map((t) => t.text.trim())
      .filter(Boolean);
    return { title, description, actions, all };
  }

  // ── Step 10: 결과 조립 (rootStyles/childStyles는 getCSSAsync 사용) ────────
  const rootStyles = await getNodeStylesAsync(node);
  if ('width' in node && 'height' in node) {
    if (!rootStyles['width']) rootStyles['width'] = Math.round(node.width) + 'px';
    if (!rootStyles['height']) rootStyles['height'] = Math.round(node.height) + 'px';
  }

  const nodeTreeCtx: NodeTreeContext = {
    getStyles: (n) => getNodeStyles(n),
    getText: (n) => safeGetText(n),
  };

  // ── COMPONENT_SET 정보 수집 ───────────────────────────────────────────────
  let componentSetName: string | null = null;
  let variantOptions: Record<string, string[]> | undefined;

  // INSTANCE → mainComponent 부모(COMPONENT_SET) 참조
  // 다른 페이지의 컴포넌트를 참조할 때 동기 접근이 실패하므로 async API 사용
  let instanceMasterSet: ComponentSetNode | null = null;
  if (node.type === 'INSTANCE') {
    try {
      const master = await (node as InstanceNode).getMainComponentAsync();
      if (master?.parent?.type === 'COMPONENT_SET') {
        instanceMasterSet = master.parent as ComponentSetNode;
      }
    } catch (_) {}
  }

  const parentSet =
    node.type === 'COMPONENT' && node.parent?.type === 'COMPONENT_SET'
      ? (node.parent as ComponentSetNode)
      : node.type === 'COMPONENT_SET'
        ? (node as unknown as ComponentSetNode)
        : instanceMasterSet;

  let variants: VariantStyleEntry[] | undefined;
  let componentProperties: Record<string, ComponentPropertyDef> | undefined;

  // INSTANCE 현재 프로퍼티 값 (Boolean, Text 등 현재 선택 상태)
  const instanceCurrentProps: Record<string, ComponentProperty> =
    node.type === 'INSTANCE' ? ((node as InstanceNode).componentProperties ?? {}) : {};

  if (parentSet) {
    const grandParent = parentSet.parent;
    const gpName =
      grandParent && (grandParent.type === 'FRAME' || grandParent.type === 'GROUP')
        ? grandParent.name
        : '';
    // grandParent 이름이 componentSet 이름과 포함 관계인 경우만 상위 이름 사용
    // "Featured icon" ↔ "Button close X" 처럼 무관한 이름이면 parentSet.name 사용
    const gpLower = gpName.toLowerCase();
    const psFirst = parentSet.name.toLowerCase().split(/[\s/]/)[0];
    const isRelatedContainer =
      gpName && (parentSet.name.toLowerCase().includes(gpLower) || gpLower.includes(psFirst));
    componentSetName = isRelatedContainer ? gpName : parentSet.name;
    const vgProps = parentSet.variantGroupProperties ?? {};
    variantOptions = {};
    for (const [key, val] of Object.entries(vgProps)) {
      variantOptions[key.toLowerCase()] = val.values;
    }

    // Component Properties (Boolean, Instance Swap, Text) 추출
    try {
      const cpDefs = parentSet.componentPropertyDefinitions;
      if (cpDefs && Object.keys(cpDefs).length > 0) {
        componentProperties = {};
        for (const [name, def] of Object.entries(cpDefs)) {
          if (def.type === 'VARIANT') continue;
          const entry: ComponentPropertyDef = {
            type: def.type as ComponentPropertyDef['type'],
            defaultValue: def.defaultValue as string | boolean,
          };
          // INSTANCE일 때: 이 인스턴스의 현재 값을 currentValue로 추가
          const instProp = instanceCurrentProps[name];
          if (instProp !== undefined) {
            entry.currentValue = instProp.value as string | boolean;
          }
          if (def.type === 'INSTANCE_SWAP' && (def as any).preferredValues?.length > 0) {
            entry.preferredValues = (def as any).preferredValues;
          }
          componentProperties[name] = entry;
        }
      }
    } catch (_) {}

    // 자식 COMPONENT 각각의 스타일 수집 — INSTANCE일 때는 생략 (COMPONENT_SET 자식이 아님)
    if (node.type === 'INSTANCE') {
      variants = undefined;
    } else {
      variants = [];
      for (const child of parentSet.children as ComponentNode[]) {
        const props = Object.fromEntries(
          Object.entries(child.variantProperties ?? {}).map(([k, v]) => [k.toLowerCase(), v])
        );
        variants.push({
          properties: props,
          variantSlug: buildVariantSlug(props),
          width: Math.round(child.width),
          height: Math.round(child.height),
          styles: await getNodeStylesAsync(child),
          childStyles: await getChildStylesAsync(child),
          nodeTree: buildNodeTree(child, nodeTreeCtx),
        });
      }
    } // end non-INSTANCE variants block
  }

  const effectiveName = componentSetName ?? node.name;

  return {
    name: effectiveName,
    meta: {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      masterId: master?.id ?? null,
      masterName: master?.name ?? null,
      figmaFileKey: await resolveFileKey(),
    } as NodeMeta,
    styles: rootStyles,
    detectedType: detectComponentType(node),
    texts: extractTexts(node),
    childStyles: await getChildStylesAsync(node),
    nodeTree: buildNodeTree(node, nodeTreeCtx),
    radixProps: {
      variant: inferRadixVariant(node),
      color: inferRadixColor(node, colorMap),
      size: inferRadixSize(node),
    },
    variantOptions,
    variants,
    componentProperties,
  };
}

// ── Frame Inspector ───────────────────────────────────────────────────────────

const JUSTIFY_MAP: Record<string, string> = {
  MIN: 'flex-start',
  CENTER: 'center',
  MAX: 'flex-end',
  SPACE_BETWEEN: 'space-between',
};
const ALIGN_MAP: Record<string, string> = {
  MIN: 'flex-start',
  CENTER: 'center',
  MAX: 'flex-end',
  STRETCH: 'stretch',
  BASELINE: 'baseline',
};

function mapLayout(node: SceneNode): StructureNode['layout'] {
  if (!('layoutMode' in node) || (node as FrameNode).layoutMode === 'NONE') {
    return {
      mode: 'NONE',
      constraints:
        'constraints' in node
          ? {
              horizontal: (node as any).constraints.horizontal,
              vertical: (node as any).constraints.vertical,
            }
          : undefined,
      sizing:
        'layoutSizingHorizontal' in node
          ? {
              horizontal: (node as any).layoutSizingHorizontal,
              vertical: (node as any).layoutSizingVertical,
            }
          : undefined,
    };
  }
  const f = node as FrameNode;
  return {
    mode: f.layoutMode as 'HORIZONTAL' | 'VERTICAL' | 'WRAP',
    direction: f.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
    wrap: f.layoutWrap === 'WRAP',
    justifyContent: JUSTIFY_MAP[f.primaryAxisAlignItems] ?? f.primaryAxisAlignItems,
    alignItems: ALIGN_MAP[f.counterAxisAlignItems] ?? f.counterAxisAlignItems,
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

function extractAppearance(node: SceneNode): StructureNode['appearance'] {
  const n = node as any;
  let cornerRadius: number | number[] = 0;
  if ('cornerRadius' in n) {
    cornerRadius =
      typeof n.cornerRadius === 'number' && n.cornerRadius !== figma.mixed
        ? n.cornerRadius
        : [
            n.topLeftRadius ?? 0,
            n.topRightRadius ?? 0,
            n.bottomRightRadius ?? 0,
            n.bottomLeftRadius ?? 0,
          ];
  }
  return {
    fills: 'fills' in n ? (n.fills === figma.mixed ? [] : n.fills) : [],
    strokes: 'strokes' in n ? n.strokes : [],
    strokeWeight: 'strokeWeight' in n ? (n.strokeWeight === figma.mixed ? 0 : n.strokeWeight) : 0,
    strokeAlign: 'strokeAlign' in n ? n.strokeAlign : 'INSIDE',
    cornerRadius,
    opacity: 'opacity' in n ? n.opacity : 1,
    effects: 'effects' in n ? n.effects : [],
    blendMode: 'blendMode' in n ? n.blendMode : 'NORMAL',
    clipsContent: n.type === 'FRAME' ? n.clipsContent : undefined,
  };
}

async function extractComponentRef(node: InstanceNode): Promise<StructureNode['componentRef']> {
  try {
    const main = await node.getMainComponentAsync();
    if (!main) return undefined;
    const set = main.parent?.type === 'COMPONENT_SET' ? (main.parent as ComponentSetNode) : null;
    let properties: Record<string, ComponentPropertyValue> = {};
    try {
      properties = node.componentProperties ?? {};
    } catch (_) {}
    return {
      componentId: main.id,
      componentKey: main.key,
      componentSetKey: set?.key,
      componentName: main.name,
      componentSetName: set?.name,
      properties,
    };
  } catch (e) {
    console.warn('[frame-inspector] extractComponentRef failed:', String(e));
    return undefined;
  }
}

let _frameInspectTotal = 0;

async function buildStructureNode(
  node: SceneNode,
  parentAbsX: number,
  parentAbsY: number,
  depth: number,
  maxDepth: number
): Promise<StructureNode> {
  _frameInspectTotal++;
  const abs = (node as any).absoluteBoundingBox as {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  const absX = abs?.x ?? parentAbsX;
  const absY = abs?.y ?? parentAbsY;

  const result: StructureNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: (node as any).locked ?? false,
    geometry: {
      x: abs ? abs.x - parentAbsX : ((node as any).x ?? 0),
      y: abs ? abs.y - parentAbsY : ((node as any).y ?? 0),
      width: abs?.width ?? (node as any).width ?? 0,
      height: abs?.height ?? (node as any).height ?? 0,
      absoluteX: absX,
      absoluteY: absY,
      rotation: (node as any).rotation ?? 0,
    },
    layout: mapLayout(node),
    appearance: extractAppearance(node),
  };

  if (node.type === 'TEXT') {
    const t = node as TextNode;
    result.text = {
      content: t.characters,
      fontSize: t.fontSize === figma.mixed ? 0 : t.fontSize,
      fontFamily: t.fontName === figma.mixed ? '' : (t.fontName as FontName).family,
      fontWeight:
        t.fontName === figma.mixed
          ? 400
          : (t.fontName as FontName).style.toLowerCase().includes('bold')
            ? 700
            : 400,
      fontStyle: t.fontName === figma.mixed ? 'normal' : (t.fontName as FontName).style,
      lineHeight: t.lineHeight === figma.mixed ? { unit: 'AUTO' } : t.lineHeight,
      letterSpacing:
        t.letterSpacing === figma.mixed ? { unit: 'PIXELS', value: 0 } : t.letterSpacing,
      textAlign: t.textAlignHorizontal === figma.mixed ? 'LEFT' : t.textAlignHorizontal,
      verticalAlign: t.textAlignVertical,
      textDecoration: t.textDecoration === figma.mixed ? 'NONE' : t.textDecoration,
      textCase: t.textCase === figma.mixed ? 'ORIGINAL' : t.textCase,
      fills: t.fills === figma.mixed ? [] : t.fills,
      styleId: typeof t.textStyleId === 'string' ? t.textStyleId : undefined,
    };
  }

  if (node.type === 'INSTANCE') {
    result.componentRef = await extractComponentRef(node as InstanceNode);
  }

  if (depth >= maxDepth) {
    result.truncated = true;
    return result;
  }

  if ('children' in node && (node as any).children.length > 0) {
    result.children = await Promise.all(
      ((node as any).children as SceneNode[]).map((child) =>
        buildStructureNode(child, absX, absY, depth + 1, maxDepth)
      )
    );
  }

  return result;
}

async function handleFrameInspect(options: { maxDepth?: number } = {}): Promise<void> {
  const maxDepth = options.maxDepth ?? 8;
  const node = figma.currentPage.selection[0] as SceneNode | undefined;
  if (!node || (node.type !== 'FRAME' && node.type !== 'COMPONENT' && node.type !== 'INSTANCE')) {
    figma.ui.postMessage({ type: 'frame-inspect-error', message: 'FRAME 노드를 선택해 주세요.' });
    return;
  }
  _frameInspectTotal = 0;
  const abs = (node as any).absoluteBoundingBox as { x: number; y: number } | null;
  const root = await buildStructureNode(node, abs?.x ?? 0, abs?.y ?? 0, 0, maxDepth);
  const result: FrameInspectResult = {
    meta: {
      frameId: node.id,
      frameName: node.name,
      extractedAt: new Date().toISOString(),
      totalNodes: _frameInspectTotal,
      width: (node as any).width ?? 0,
      height: (node as any).height ?? 0,
      maxDepth,
    },
    root,
  };
  figma.ui.postMessage({ type: 'frame-inspect-result', data: result });
}

figma.ui.onmessage = (msg: {
  type: string;
  options?: ExtractOptions;
  width?: number;
  height?: number;
}) => {
  if (msg.type === 'resize') {
    figma.ui.resize(msg.width ?? 480, msg.height ?? 580);
  }
  if (msg.type === 'inspect') {
    try {
      const data = inspectSelection();
      figma.ui.postMessage({ type: 'inspect-result', data });
    } catch (e) {
      figma.ui.postMessage({ type: 'inspect-result', data: { error: String(e) } });
    }
  }
  if (msg.type === 'extract') {
    const options: ExtractOptions = msg.options ?? {
      collectionIds: [],
      useSelection: false,
      tokenTypes: [
        'variables',
        'spacing',
        'radius',
        'extra-vars',
        'colors',
        'texts',
        'textStyles',
        'headings',
        'fonts',
        'effects',
        'grids',
      ],
    };
    extractAll(options)
      .then(async (data) => {
        figma.ui.postMessage({ type: 'extract-result', data });
        try {
          await figma.clientStorage.setAsync(TOKEN_CACHE_KEY, {
            data,
            savedAt: new Date().toISOString(),
            figmaFileId: figma.root.id,
            figmaFileName: figma.root.name,
          } as TokenCacheEntry);
        } catch (_) {}
      })
      .catch((e) => figma.ui.postMessage({ type: 'extract-error', message: String(e) }));
  }
  if (msg.type === 'cancel-extract-images') {
    _extractImagesCancelled = true;
  }
  if (msg.type === 'extract-images') {
    const options: ExtractImagesOptions = msg.options ?? {
      format: 'PNG',
      scales: [1, 2],
      useSelection: false,
    };
    extractImages(options)
      .then(({ assets, errors, cancelled }) => {
        if (cancelled) {
          figma.ui.postMessage({ type: 'extract-images-cancelled' });
        } else {
          figma.ui.postMessage({ type: 'extract-images-result', data: assets, errors });
        }
      })
      .catch((e) => figma.ui.postMessage({ type: 'extract-images-error', message: String(e) }));
  }

  if (msg.type === 'export-icons') {
    exportIcons()
      .then(async (data) => {
        figma.ui.postMessage({ type: 'export-icons-result', data });
        await figma.clientStorage.setAsync('lastIconData', {
          data,
          savedAt: new Date().toISOString(),
        });
      })
      .catch((e) => figma.ui.postMessage({ type: 'export-icons-error', message: String(e) }));
  }
  if (msg.type === 'export-icons-all') {
    exportIconsAll()
      .then(async (data) => {
        figma.ui.postMessage({ type: 'export-icons-all-result', data });
        await figma.clientStorage.setAsync('lastIconData', {
          data,
          savedAt: new Date().toISOString(),
        });
      })
      .catch((e) => figma.ui.postMessage({ type: 'export-icons-all-error', message: String(e) }));
  }
  if (msg.type === 'get-storage') {
    figma.clientStorage.getAsync(msg.key).then((val) => {
      figma.ui.postMessage({ type: 'storage-value', key: msg.key, value: val ?? null });
    });
  }
  if (msg.type === 'set-storage') {
    figma.clientStorage.setAsync(msg.key, msg.value);
  }
  if (msg.type === 'clear-icon-cache') {
    figma.clientStorage
      .deleteAsync('lastIconData')
      .then(() => figma.ui.postMessage({ type: 'clear-icon-cache-done' }))
      .catch(() => figma.ui.postMessage({ type: 'clear-icon-cache-done' }));
  }
  if (msg.type === 'token-cache-clear') {
    figma.clientStorage
      .deleteAsync(TOKEN_CACHE_KEY)
      .then(() => figma.ui.postMessage({ type: 'token-cache-cleared' }))
      .catch(() => figma.ui.postMessage({ type: 'token-cache-cleared' }));
  }
  if (msg.type === 'extract-themes') {
    extractThemes()
      .then((data) => figma.ui.postMessage({ type: 'extract-themes-result', data }))
      .catch((e) => figma.ui.postMessage({ type: 'extract-themes-error', message: String(e) }));
  }
  if (msg.type === 'generate-component') {
    generateComponent()
      .then((data) => figma.ui.postMessage({ type: 'generate-component-result', data }))
      .catch((e) => figma.ui.postMessage({ type: 'generate-component-error', message: String(e) }));
  }
  if (msg.type === 'export-frame-inspect') {
    handleFrameInspect((msg as any).options ?? {}).catch((e) =>
      figma.ui.postMessage({ type: 'frame-inspect-error', message: String(e) })
    );
  }
  if (msg.type === 'registry-get') {
    const key = `pf-registry-${figma.root.id}`;
    figma.clientStorage
      .getAsync(key)
      .then((data) => figma.ui.postMessage({ type: 'registry-data', registry: data ?? {} }))
      .catch((e) => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
  }
  if (msg.type === 'registry-save') {
    const key = `pf-registry-${figma.root.id}`;
    figma.clientStorage
      .getAsync(key)
      .then((data: Record<string, unknown>) => {
        const registry = (data as Record<string, unknown>) ?? {};
        registry[(msg as any).entry.figmaMasterNodeId] = (msg as any).entry;
        return figma.clientStorage.setAsync(key, registry);
      })
      .then(() => figma.ui.postMessage({ type: 'registry-saved' }))
      .catch((e) => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
  }
  if (msg.type === 'registry-delete') {
    const key = `pf-registry-${figma.root.id}`;
    figma.clientStorage
      .getAsync(key)
      .then((data: Record<string, unknown>) => {
        const registry = (data as Record<string, unknown>) ?? {};
        delete registry[(msg as any).masterId];
        return figma.clientStorage.setAsync(key, registry);
      })
      .then(() => figma.ui.postMessage({ type: 'registry-deleted' }))
      .catch((e) => figma.ui.postMessage({ type: 'registry-error', message: String(e) }));
  }
  if (msg.type === 'set-figma-file-key') {
    figma.clientStorage.setAsync('figma-file-key', (msg as any).fileKey ?? '').catch(() => {});
  }
  if (msg.type === 'set-settings') {
    figma.clientStorage
      .setAsync('pf-settings', { url: (msg as any).url ?? '', key: (msg as any).key ?? '' })
      .catch(() => {});
  }
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
