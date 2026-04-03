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

interface FontData {
  family: string;
  cssVar: string;
  styles: string[];
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
  >;
  useVisualParser?: boolean;
}

interface ExtractedTokens {
  variables: {
    collections: VariableCollectionData[];
    variables: VariableData[];
  };
  spacing: VariableData[];
  radius: VariableData[];
  styles: {
    colors: ColorStyleData[];
    texts: TextStyleData[];
    textStyles: TextStyleData[];
    headings: TextStyleData[];
    fonts: FontData[];
    effects: EffectStyleData[];
  };
  icons: IconData[];
  meta: {
    figmaFileKey: string;
    extractedAt: string;
    fileName: string;
    sourceMode: 'all' | 'selection';
    totalNodes: number;
    tokenTypes: string[];
  };
}

figma.showUI(__html__, { width: 760, height: 720 });

function getSourceNodes(useSelection: boolean): readonly SceneNode[] {
  if (useSelection && figma.currentPage.selection.length > 0) {
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
  const styleKeys = ['fillStyleId', 'strokeStyleId', 'effectStyleId', 'textStyleId'];
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
    if (depth > 3) return;
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
  figmaFileId: string;
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
      figmaFileId: figma.root.id,
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

async function extractAll(options: ExtractOptions): Promise<ExtractedTokens> {
  const sourceNodes = getSourceNodes(options.useSelection);
  const isSelectionMode = options.useSelection && figma.currentPage.selection.length > 0;
  const types = options.tokenTypes;

  const needsVars = types.some((t) => ['variables', 'spacing', 'radius'].includes(t));
  const needsStyles = types.some((t) =>
    ['colors', 'texts', 'textStyles', 'headings', 'fonts', 'effects'].includes(t)
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
    if (isSelectionMode) {
      // Selection mode: resolve ALL used variable IDs (local + external library)
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

  // Spacing — FLOAT vars matching spacing patterns (name or collection name)
  let spacing: VariableData[] = [];
  if (types.includes('spacing')) {
    spacing = allVariables
      .filter((v) => {
        if (v.resolvedType !== 'FLOAT') return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? '';
        return SPACING_RE.test(v.name) || SPACING_RE.test(colName);
      })
      .map((v) => mapVariable(v, varUsage))
      .filter((v) => !isSelectionMode || v.usageCount > 0);

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
      .filter((v) => !isSelectionMode || v.usageCount > 0);
  }

  // Color Styles
  let colors: ColorStyleData[] = [];
  if (types.includes('colors')) {
    colors = (await figma.getLocalPaintStylesAsync())
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        paints: [...s.paints],
        usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !isSelectionMode || s.usageCount > 0);
  }

  // Text Styles (backward compat)
  let texts: TextStyleData[] = [];
  if (types.includes('texts')) {
    texts = (await figma.getLocalTextStylesAsync())
      .map((s) => mapTextStyle(s, styleUsage))
      .filter((s) => !isSelectionMode || s.usageCount > 0);
  }

  // Text Styles — split (textStyles / headings / fonts)
  let textStyles: TextStyleData[] = [];
  let headings: TextStyleData[] = [];
  let fonts: FontData[] = [];

  const needsTextSplit = types.some((t) => ['textStyles', 'headings', 'fonts'].includes(t));
  if (needsTextSplit) {
    const allTexts = (await figma.getLocalTextStylesAsync())
      .map((s) => mapTextStyle(s, styleUsage))
      .filter((s) => !isSelectionMode || s.usageCount > 0);

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
      .filter((s) => !isSelectionMode || s.usageCount > 0);
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
    styles: { colors, texts, textStyles, headings, fonts, effects },
    icons,
    meta: {
      figmaFileKey: figma.fileKey || '',
      extractedAt: new Date().toISOString(),
      fileName: figma.root.name,
      sourceMode: isSelectionMode ? 'selection' : 'all',
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

    if (depth < 6 && 'children' in node) {
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

function figmaColorToHex(c: { r: number; g: number; b: number }): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

// ─── Component 생성 공유 유틸 ────────────────────────────────────────────────

function toCssVarName(name: string): string {
  return (
    '--' +
    name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '-')
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

async function extractImages(
  options: ExtractImagesOptions
): Promise<{ assets: ImageAsset[]; errors: { id: string; name: string; error: string }[] }> {
  const EXPORTABLE = new Set(['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);
  const source: readonly SceneNode[] =
    options.useSelection && figma.currentPage.selection.length > 0
      ? figma.currentPage.selection
      : figma.currentPage.children;

  const ext = options.format === 'PNG' ? 'png' : 'jpg';
  const mime = options.format === 'PNG' ? 'image/png' : 'image/jpeg';
  const assets: ImageAsset[] = [];
  const errors: { id: string; name: string; error: string }[] = [];
  const seen = new Set<string>();

  async function traverse(node: SceneNode) {
    if (seen.has(node.id)) return;

    if (EXPORTABLE.has(node.type)) {
      const fills = (node as any).fills;
      const hasImageFill =
        Array.isArray(fills) && fills.some((p: any) => p.type === 'IMAGE' && p.visible !== false);

      if (hasImageFill) {
        seen.add(node.id);
        const nodeData = {
          id: node.id,
          name: node.name,
          kebab: toKebabCase(node.name),
          nodeType: node.type,
          width: Math.round(node.width),
          height: Math.round(node.height),
        };

        for (const scale of options.scales) {
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
              fileName: `${nodeData.kebab}@${scale}x.${ext}`,
              base64,
              mimeType: mime,
              byteSize: bytes.byteLength,
            });
          } catch (e: any) {
            errors.push({ id: node.id, name: node.name, error: String(e) });
          }
        }
      }
    }

    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) {
        await traverse(child as SceneNode);
      }
    }
  }

  for (const node of source) await traverse(node as SceneNode);
  return { assets, errors };
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
function collectExportTargets(node: SceneNode, seen: Set<string>): SceneNode[] {
  if (seen.has(node.id)) return [];
  if (CONTAINER_TYPES.has(node.type)) {
    if (!('children' in node)) return [];
    const out: SceneNode[] = [];
    for (const child of (node as ChildrenMixin).children) {
      out.push(...collectExportTargets(child as SceneNode, seen));
    }
    return out;
  }
  if (EXPORTABLE_TYPES.has(node.type)) {
    seen.add(node.id);
    return [node];
  }
  return [];
}

async function exportIcons(): Promise<
  { name: string; kebab: string; pascal: string; variants: string[]; svg: string }[]
> {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return [];

  // 선택이 컨테이너(프레임 등)면 내부 자식들을 모두 수집
  const seen = new Set<string>();
  const targets: SceneNode[] = [];
  for (const node of sel) {
    targets.push(...collectExportTargets(node, seen));
  }

  const results: {
    name: string;
    kebab: string;
    pascal: string;
    variants: string[];
    svg: string;
  }[] = [];
  for (const node of targets) {
    try {
      const svgBytes = await (node as any).exportAsync({ format: 'SVG' });
      const bytes = new Uint8Array(svgBytes);
      let svg = '';
      for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);
      results.push({
        name: node.name,
        kebab: toKebabCase(node.name),
        pascal: toPascalCase(node.name),
        variants: extractVariants(node.name),
        svg,
      });
    } catch (_) {
      // skip nodes that can't be exported as SVG
    }
  }
  return results;
}

async function exportIconsAll(): Promise<
  { name: string; kebab: string; pascal: string; variants: string[]; svg: string }[]
> {
  const ICON_RE = /icon|ic[/\\]/i;
  const nodes = figma.currentPage.findAll((n) => {
    // COMPONENT만 대상: FRAME/GROUP은 구조 컨테이너라 제외
    if (n.type !== 'COMPONENT') return false;
    if (/\bIcon=false\b/i.test(n.name)) return false;
    const parentName = n.parent && 'name' in n.parent ? ((n.parent as any).name as string) : '';
    // variant 속성 형태 ("Glyph=android", "Icon=Default" 등): 부모(COMPONENT_SET) 이름으로만 판단
    // 일반 이름("arrow-left", "icon-close"): 이름 또는 부모 이름으로 판단
    if (/=/.test(n.name)) return ICON_RE.test(parentName);
    return ICON_RE.test(n.name) || ICON_RE.test(parentName);
  });
  const results: {
    name: string;
    kebab: string;
    pascal: string;
    variants: string[];
    svg: string;
  }[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    // node.name 기준 중복 제거 — 다른 크기 variant는 별도 항목으로 유지
    // "Glyph=android, Size=default" / "Glyph=android, Size=micro" → 둘 다 포함
    if (seen.has(node.name)) continue;
    seen.add(node.name);
    try {
      const svgBytes = await (node as any).exportAsync({ format: 'SVG' });
      const bytes = new Uint8Array(svgBytes);
      let svg = '';
      for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);
      results.push({
        name: node.name,
        kebab: toKebabCase(node.name),
        pascal: toPascalCase(node.name),
        variants: extractVariants(node.name),
        svg,
      });
    } catch (_) {
      // skip nodes that can't be exported as SVG
    }
  }
  return results;
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
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'surface' | 'classic';
  color?: string;
  size?: '1' | '2' | '3' | '4';
}

interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;
  html: string;
  htmlClass: string;
  htmlCss: string;
  jsx: string;
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;
  radixProps: RadixProps;
}

// ── Radix Themes props 추론 ──────────────────────────────────────────────────

function inferRadixVariant(node: SceneNode): RadixProps['variant'] {
  if (!('fills' in node)) return 'solid';
  const fills = (node.fills as readonly Paint[]).filter(
    (f) => f.visible !== false && f.type === 'SOLID'
  );
  const strokes =
    'strokes' in node ? (node.strokes as readonly Paint[]).filter((s) => s.visible !== false) : [];
  if (fills.length === 0 && strokes.length === 0) return 'ghost';
  if (fills.length === 0 && strokes.length > 0) return 'outline';
  if (
    fills.length > 0 &&
    (fills[0] as SolidPaint).opacity !== undefined &&
    (fills[0] as SolidPaint).opacity! < 0.3
  )
    return 'soft';
  return 'solid';
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
        Math.round(v * 255)
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
  if (!('height' in node)) return '2';
  // GROUP/COMPONENT_SET은 여러 variant를 담는 컨테이너라 전체 height로 size를 추론하면 안 됨.
  // 자식 중 첫 번째 FRAME/COMPONENT를 찾아 그 height로 추론.
  let targetNode: SceneNode = node;
  if ((node.type === 'GROUP' || node.type === 'COMPONENT_SET') && 'children' in node) {
    const firstChild = (node as ChildrenMixin).children.find(
      (c) => c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE'
    ) as SceneNode | undefined;
    if (firstChild && 'height' in firstChild) targetNode = firstChild;
  }
  const h = (targetNode as FrameNode).height;
  if (h <= 24) return '1';
  if (h <= 32) return '2';
  if (h <= 40) return '3';
  return '4';
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

  // 2-a. Local Variables
  const allVars = await figma.variables.getLocalVariablesAsync();
  for (const v of allVars) {
    if (v.resolvedType !== 'COLOR') continue;
    const firstMode = Object.keys(v.valuesByMode)[0];
    if (!firstMode) continue;
    const val = v.valuesByMode[firstMode];
    if (val && typeof val === 'object' && 'r' in (val as unknown as Record<string, unknown>)) {
      const hex = figmaColorToHex(val as { r: number; g: number; b: number });
      const cssName = toCssVarName(v.name);
      if (!colorMap.has(hex)) colorMap.set(hex, cssName);
      varIdMap.set(v.id, cssName);
    }
  }

  // 2-b. Color Styles
  const paintStyles = await figma.getLocalPaintStylesAsync();
  for (const style of paintStyles) {
    const paint = (style.paints as ReadonlyArray<Paint>)[0];
    if (paint?.type === 'SOLID') {
      const hex = figmaColorToHex((paint as SolidPaint).color);
      if (!colorMap.has(hex)) colorMap.set(hex, toCssVarName(style.name));
    }
  }

  // 2-c. 노드 트리 내 fillStyleId/strokeStyleId 스캔 (inspectSelection 패턴 참고)
  await scanNodeStyleIds(node, colorMap);

  // ── Step 3: 색상 해석 헬퍼 ───────────────────────────────────────────────
  function resolveColor(c: { r: number; g: number; b: number }): string {
    const hex = figmaColorToHex(c);
    return colorMap.has(hex) ? 'var(' + colorMap.get(hex) + ')' : hex.toLowerCase();
  }

  // boundVariables에서 CSS var 이름 직접 추출
  function resolveBoundColor(n: SceneNode, prop: 'fills' | 'strokes'): string | null {
    try {
      const bv = (n as any).boundVariables;
      if (!bv) return null;
      const binding = Array.isArray(bv[prop]) ? bv[prop][0] : bv[prop];
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

  // ── Step 5: 노드 → CSS 스타일 변환 ──────────────────────────────────────
  function getNodeStyles(n: SceneNode): Record<string, string> {
    const s: Record<string, string> = {};

    // fill: boundVariables 우선 → colorMap → raw hex
    if ('fills' in n) {
      const bound = resolveBoundColor(n, 'fills');
      if (bound) {
        s['background-color'] = bound;
      } else {
        const fills = (n as any).fills;
        if (Array.isArray(fills)) {
          const solid = fills.find((f: any) => f.type === 'SOLID' && f.visible !== false);
          if (solid) s['background-color'] = resolveColor(solid.color);
        }
      }
    }

    if ('cornerRadius' in n) {
      const cr = (n as any).cornerRadius;
      if (typeof cr === 'number' && cr > 0) s['border-radius'] = Math.round(cr) + 'px';
    }

    if ('layoutMode' in n) {
      const f = n as FrameNode;
      if (f.layoutMode === 'HORIZONTAL') {
        s['display'] = 'flex';
      } else if (f.layoutMode === 'VERTICAL') {
        s['display'] = 'flex';
        s['flex-direction'] = 'column';
      }
      if (f.itemSpacing > 0) s['gap'] = f.itemSpacing + 'px';
      const pt = f.paddingTop,
        pr = f.paddingRight,
        pb = f.paddingBottom,
        pl = f.paddingLeft;
      if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
        s['padding'] = pt + 'px ' + pr + 'px ' + pb + 'px ' + pl + 'px';
      }
    }

    // stroke: boundVariables 우선
    if ('strokes' in n) {
      const bound = resolveBoundColor(n, 'strokes');
      const strokeWeight = 'strokeWeight' in n ? Math.round((n as any).strokeWeight) || 1 : 1;
      if (bound) {
        s['border'] = strokeWeight + 'px solid ' + bound;
      } else {
        const strokes = (n as any).strokes;
        if (Array.isArray(strokes)) {
          const solid = strokes.find((f: any) => f.type === 'SOLID' && f.visible !== false);
          if (solid) s['border'] = strokeWeight + 'px solid ' + resolveColor(solid.color);
        }
      }
    }

    if ('opacity' in n) {
      const op = (n as any).opacity;
      if (typeof op === 'number' && op < 1) {
        s['opacity'] = String(Math.round(op * 100) / 100);
      }
    }

    return s;
  }

  // ── Step 6: HTML / JSX 변환 (에러 격리 + 안전한 텍스트) ──────────────────
  function nodeToHtml(n: SceneNode, indent: number): string {
    try {
      const pad = '  '.repeat(indent);
      if (n.type === 'TEXT') {
        const text = safeGetText(n);
        if (!text) return '';
        return (
          pad +
          '<span>' +
          text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</span>'
        );
      }
      const styles = getNodeStyles(n);
      const entries = Object.entries(styles);
      const styleAttr =
        entries.length > 0
          ? ' style="' + entries.map(([k, v]) => k + ': ' + v).join('; ') + '"'
          : '';
      if ('children' in n && (n as ChildrenMixin).children.length > 0) {
        const kids = (n as ChildrenMixin).children
          .filter((c) => (c as SceneNode).visible !== false)
          .map((c) => nodeToHtml(c as SceneNode, indent + 1))
          .filter(Boolean)
          .join('\n');
        if (!kids) return pad + '<div' + styleAttr + '></div>';
        return pad + '<div' + styleAttr + '>\n' + kids + '\n' + pad + '</div>';
      }
      return pad + '<div' + styleAttr + '></div>';
    } catch (_) {
      return '';
    }
  }

  function buildHtmlWithClasses(root: SceneNode): { html: string; css: string } {
    const cssMap: Record<string, Record<string, string>> = {};
    let counter = 0;

    function toClass(n: SceneNode, indent: number): string {
      try {
        const pad = '  '.repeat(indent);
        if (n.type === 'TEXT') {
          const text = safeGetText(n);
          if (!text) return '';
          const cls = counter === 0 ? 'root-text' : 'text-' + counter;
          counter++;
          cssMap[cls] = {};
          return (
            pad +
            '<span class="' +
            cls +
            '">' +
            text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</span>'
          );
        }
        const cls = counter === 0 ? 'root' : 'el-' + counter;
        counter++;
        const styles = getNodeStyles(n);
        if (Object.keys(styles).length > 0) {
          cssMap[cls] = styles;
        }
        if ('children' in n && (n as ChildrenMixin).children.length > 0) {
          const kids = (n as ChildrenMixin).children
            .filter((c) => (c as SceneNode).visible !== false)
            .map((c) => toClass(c as SceneNode, indent + 1))
            .filter(Boolean)
            .join('\n');
          if (!kids) return pad + '<div class="' + cls + '"></div>';
          return pad + '<div class="' + cls + '">\n' + kids + '\n' + pad + '</div>';
        }
        return pad + '<div class="' + cls + '"></div>';
      } catch (_) {
        return '';
      }
    }

    const html = toClass(root, 0);
    const css = Object.entries(cssMap)
      .filter(([, props]) => Object.keys(props).length > 0)
      .map(([cls, props]) => {
        const body = Object.entries(props)
          .map(([k, v]) => '  ' + k + ': ' + v + ';')
          .join('\n');
        return '.' + cls + ' {\n' + body + '\n}';
      })
      .join('\n\n');

    return { html, css };
  }

  function nodeToJsx(n: SceneNode, indent: number): string {
    try {
      const pad = '  '.repeat(indent);
      if (n.type === 'TEXT') {
        const text = safeGetText(n);
        if (!text) return '';
        return pad + '<span>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
      }
      const styles = getNodeStyles(n);
      const entries = Object.entries(styles);
      let styleAttr = '';
      if (entries.length > 0) {
        const obj = entries
          .map(([k, v]) => {
            const camelKey = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            return camelKey + ": '" + v + "'";
          })
          .join(', ');
        styleAttr = ' style={{' + obj + '}}';
      }
      if ('children' in n && (n as ChildrenMixin).children.length > 0) {
        const kids = (n as ChildrenMixin).children
          .filter((c) => (c as SceneNode).visible !== false)
          .map((c) => nodeToJsx(c as SceneNode, indent + 1))
          .filter(Boolean)
          .join('\n');
        if (!kids) return pad + '<div' + styleAttr + ' />';
        return pad + '<div' + styleAttr + '>\n' + kids + '\n' + pad + '</div>';
      }
      return pad + '<div' + styleAttr + ' />';
    } catch (_) {
      return '';
    }
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
    // 버튼 구조 감지: 1개 텍스트 + 고정 크기(높이 ≤56) + 프레임 또는 자식에 solid fill
    if (
      textNodes.length === 1 &&
      children.length <= 4 &&
      'height' in n &&
      (n as any).height <= 56
    ) {
      const frameFills = (n as any).fills;
      const hasSolidFill =
        (Array.isArray(frameFills) && frameFills.some((f: any) => f.type === 'SOLID')) ||
        frameNodes.some((fr) => {
          const fills = (fr as any).fills;
          return Array.isArray(fills) && fills.some((f: any) => f.type === 'SOLID');
        });
      if (hasSolidFill) return 'button';
    }
    if ('layoutMode' in n && (n as FrameNode).layoutMode === 'HORIZONTAL' && frameNodes.length >= 2)
      return 'tabs';
    const smallRect = frameNodes.find((f) => f.width <= 24 && f.height <= 24);
    if (smallRect && textNodes.length >= 1) return 'checkbox';
    const hasOverlay = frameNodes.some(
      (f) =>
        ((f as any).layoutPositioning === 'ABSOLUTE' && f.width > n.width * 0.8) ||
        (f as any).opacity < 0.5
    );
    if (hasOverlay) return 'dialog';
    return 'layout';
  }

  // ── Step 8: 텍스트 추출 (safe access + master fallback) ──────────────────
  function extractTexts(n: SceneNode): ExtractedTexts {
    const collected: Array<{ text: string; y: number; x: number }> = [];
    function collect(node: SceneNode): void {
      if (node.type === 'TEXT') {
        const text = safeGetText(node);
        if (text) collected.push({ text, y: node.y, x: node.x });
      } else if ('children' in node) {
        (node as ChildrenMixin).children.forEach((c) => collect(c as SceneNode));
      }
    }
    collect(n);
    collected.sort((a, b) => a.y - b.y || a.x - b.x);
    const all = collected.map((t) => t.text.trim()).filter(Boolean);
    const nodeHeight = 'height' in n ? (n as any).height : 100;
    const threshold = nodeHeight * 0.65;
    const actions = collected
      .filter((t) => t.y > threshold)
      .map((t) => t.text.trim())
      .filter(Boolean);
    return { title: all[0] || '', description: all[1] || '', actions, all };
  }

  // ── Step 9: 자식 스타일 수집 ─────────────────────────────────────────────
  function getChildStyles(n: SceneNode): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};
    if (!('children' in n)) return result;
    (n as ChildrenMixin).children.forEach((child, i) => {
      const c = child as SceneNode;
      result[c.name || 'child-' + i] = getNodeStyles(c);
    });
    return result;
  }

  // ── Step 10: 결과 조립 ───────────────────────────────────────────────────
  const rootStyles = getNodeStyles(node);
  if ('width' in node && 'height' in node) {
    rootStyles['width'] = Math.round(node.width) + 'px';
    rootStyles['height'] = Math.round(node.height) + 'px';
  }

  const htmlClassResult = buildHtmlWithClasses(node);

  return {
    name: node.name,
    meta: {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      masterId: master?.id ?? null,
      masterName: master?.name ?? null,
      figmaFileId: figma.root.id,
    } as NodeMeta,
    styles: rootStyles,
    html: nodeToHtml(node, 0),
    htmlClass: htmlClassResult.html,
    htmlCss: htmlClassResult.css,
    jsx: nodeToJsx(node, 0),
    detectedType: detectComponentType(node),
    texts: extractTexts(node),
    childStyles: getChildStyles(node),
    radixProps: {
      variant: inferRadixVariant(node),
      color: inferRadixColor(node, colorMap),
      size: inferRadixSize(node),
    },
  };
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
      tokenTypes: ['variables', 'spacing', 'radius', 'colors', 'texts', 'effects'],
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
  if (msg.type === 'extract-images') {
    const options: ExtractImagesOptions = msg.options ?? {
      format: 'PNG',
      scales: [1, 2],
      useSelection: false,
    };
    extractImages(options)
      .then(({ assets, errors }) =>
        figma.ui.postMessage({ type: 'extract-images-result', data: assets, errors })
      )
      .catch((e) => figma.ui.postMessage({ type: 'extract-images-error', message: String(e) }));
  }
  if (msg.type === 'extract-images-debug') {
    const useSelection = msg.useSelection ?? false;
    const nodes = findImageNodes(useSelection);
    figma.ui.postMessage({ type: 'extract-images-debug-result', nodes });
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
