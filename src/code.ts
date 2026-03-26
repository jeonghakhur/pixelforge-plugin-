interface VariableData {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  collectionId: string;
  usageCount: number;
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

interface IconData {
  id: string;
  name: string;
  key: string;
  description: string;
  width: number;
  height: number;
}

interface ExtractOptions {
  collectionIds: string[];
  useSelection: boolean;
  tokenTypes: Array<"variables" | "colors" | "texts" | "effects" | "spacing" | "radius" | "icons">;
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
    effects: EffectStyleData[];
  };
  icons: IconData[];
  meta: {
    figmaFileKey: string;
    extractedAt: string;
    fileName: string;
    sourceMode: "all" | "selection";
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
    if ("boundVariables" in node && node.boundVariables) {
      recordBound(node.boundVariables as Record<string, unknown>);
    }
    // Fill paint bindings (color variables in fills)
    if ("fills" in node) {
      const fills = (node as any).fills;
      if (Array.isArray(fills)) {
        fills.forEach((paint: any) => {
          if (paint?.boundVariables) recordBound(paint.boundVariables);
        });
      }
    }
    // Stroke paint bindings
    if ("strokes" in node) {
      const strokes = (node as any).strokes;
      if (Array.isArray(strokes)) {
        strokes.forEach((paint: any) => {
          if (paint?.boundVariables) recordBound(paint.boundVariables);
        });
      }
    }
    if ("children" in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child);
    }
  }
  for (const node of nodes) traverse(node);
  return counts;
}

function countStyleUsage(nodes: readonly SceneNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  const styleKeys = ["fillStyleId", "strokeStyleId", "effectStyleId", "textStyleId"];
  function traverse(node: SceneNode) {
    for (const key of styleKeys) {
      if (key in node) {
        const val = (node as any)[key];
        if (typeof val === "string" && val) {
          counts.set(val, (counts.get(val) ?? 0) + 1);
        }
      }
    }
    if ("children" in node) {
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
    if ("children" in node) count += countNodes((node as ChildrenMixin).children);
  }
  return count;
}

function fontWeightFromStyle(style: string): number {
  const s = style.toLowerCase();
  if (/thin|hairline/.test(s))                   return 100;
  if (/extra\s*light|ultra\s*light/.test(s))     return 200;
  if (/light/.test(s))                           return 300;
  if (/medium/.test(s))                          return 500;
  if (/semi\s*bold|demi\s*bold/.test(s))         return 600;
  if (/extra\s*bold|ultra\s*bold/.test(s))       return 800;
  if (/black|heavy/.test(s))                     return 900;
  if (/bold/.test(s))                            return 700;
  return 400;
}

const SPACING_RE = /\b(spacing|space|gap|padding|margin|gutter|inset|distance)\b/i;
const RADIUS_RE  = /\b(radius|corner|rounded|border.?radius)\b/i;

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

function getSelectionInfo(): { count: number; names: string[]; nodeTypes: string[] } {
  const sel = figma.currentPage.selection;
  return {
    count: sel.length,
    names: sel.map((n) => n.name),
    nodeTypes: sel.map((n) => n.type),
  };
}

async function sendCollections() {
  const collections = (await figma.variables.getLocalVariableCollectionsAsync()).map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
    variableIds: [...c.variableIds],
  }));
  figma.ui.postMessage({
    type: "init-data",
    collections,
    fileName: figma.root.name,
    selection: getSelectionInfo(),
  });
}

async function extractAll(options: ExtractOptions): Promise<ExtractedTokens> {
  const sourceNodes = getSourceNodes(options.useSelection);
  const isSelectionMode = options.useSelection && figma.currentPage.selection.length > 0;
  const types = options.tokenTypes;

  const needsVars = types.some((t) => ["variables", "spacing", "radius"].includes(t));
  const needsStyles = types.some((t) => ["colors", "texts", "effects"].includes(t));

  // Pre-fetch
  const allVariables = needsVars ? await figma.variables.getLocalVariablesAsync() : [];
  const allCollections = needsVars ? await figma.variables.getLocalVariableCollectionsAsync() : [];
  const collectionMap = new Map(allCollections.map((c) => [c.id, c.name]));

  const varUsage = needsVars ? countVariableUsage(sourceNodes) : new Map<string, number>();
  const styleUsage = needsStyles ? countStyleUsage(sourceNodes) : new Map<string, number>();

  // Variables
  let variableResult: ExtractedTokens["variables"] = { collections: [], variables: [] };
  if (types.includes("variables")) {
    if (isSelectionMode) {
      // Selection mode: resolve ALL used variable IDs (local + external library)
      const usedIds = Array.from(varUsage.keys());
      if (usedIds.length > 0) {
        const resolvedVars = (await Promise.all(
          usedIds.map((id) => figma.variables.getVariableByIdAsync(id).catch(() => null))
        )).filter((v): v is Variable => v !== null && v.resolvedType !== "BOOLEAN");

        const colIdSet = new Set(resolvedVars.map((v) => v.variableCollectionId));
        const resolvedCols = (await Promise.all(
          Array.from(colIdSet).map((id) =>
            figma.variables.getVariableCollectionByIdAsync(id).catch(() => null)
          )
        )).filter((c): c is VariableCollection => c !== null);

        variableResult = {
          collections: resolvedCols.map((c) => ({
            id: c.id, name: c.name,
            modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
            variableIds: [...c.variableIds],
          })),
          variables: resolvedVars.map((v) => mapVariable(v, varUsage)),
        };
      }
    } else {
      // Full page mode: local variables filtered by selected collections
      const filtered = options.collectionIds.length > 0
        ? allCollections.filter((c) => options.collectionIds.includes(c.id))
        : allCollections;
      const filteredIds = new Set(filtered.map((c) => c.id));
      variableResult = {
        collections: filtered.map((c) => ({
          id: c.id, name: c.name,
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
  if (types.includes("spacing")) {
    spacing = allVariables
      .filter((v) => {
        if (v.resolvedType !== "FLOAT") return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? "";
        return SPACING_RE.test(v.name) || SPACING_RE.test(colName);
      })
      .map((v) => mapVariable(v, varUsage))
      .filter((v) => !isSelectionMode || v.usageCount > 0);
  }

  // Radius — FLOAT vars matching radius patterns
  let radius: VariableData[] = [];
  if (types.includes("radius")) {
    radius = allVariables
      .filter((v) => {
        if (v.resolvedType !== "FLOAT") return false;
        const colName = collectionMap.get(v.variableCollectionId) ?? "";
        return RADIUS_RE.test(v.name) || RADIUS_RE.test(colName);
      })
      .map((v) => mapVariable(v, varUsage))
      .filter((v) => !isSelectionMode || v.usageCount > 0);
  }

  // Color Styles
  let colors: ColorStyleData[] = [];
  if (types.includes("colors")) {
    colors = (await figma.getLocalPaintStylesAsync())
      .map((s) => ({
        id: s.id, name: s.name, description: s.description,
        paints: [...s.paints], usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !isSelectionMode || s.usageCount > 0);
  }

  // Text Styles
  let texts: TextStyleData[] = [];
  if (types.includes("texts")) {
    texts = (await figma.getLocalTextStylesAsync())
      .map((s) => ({
        id: s.id, name: s.name, description: s.description,
        fontName: s.fontName, fontSize: s.fontSize,
        fontWeight: (s as any).fontWeight ?? fontWeightFromStyle(s.fontName.style),
        letterSpacing: s.letterSpacing, lineHeight: s.lineHeight,
        textCase: s.textCase, textDecoration: s.textDecoration,
        usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !isSelectionMode || s.usageCount > 0);
  }

  // Effect Styles (shadows + blurs)
  let effects: EffectStyleData[] = [];
  if (types.includes("effects")) {
    effects = (await figma.getLocalEffectStylesAsync())
      .map((s) => ({
        id: s.id, name: s.name, description: s.description,
        effects: [...s.effects], usageCount: styleUsage.get(s.id) ?? 0,
      }))
      .filter((s) => !isSelectionMode || s.usageCount > 0);
  }

  // Icons — components with "icon" in name or parent component set name
  let icons: IconData[] = [];
  if (types.includes("icons")) {
    const allComponents = figma.currentPage.findAll((n) => n.type === "COMPONENT") as ComponentNode[];
    icons = allComponents
      .filter((c) => {
        const parentName = c.parent && "name" in c.parent ? (c.parent as any).name as string : "";
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
    styles: { colors, texts, effects },
    icons,
    meta: {
      figmaFileKey: figma.fileKey ?? "",
      extractedAt: new Date().toISOString(),
      fileName: figma.root.name,
      sourceMode: isSelectionMode ? "selection" : "all",
      totalNodes: countNodes(sourceNodes),
      tokenTypes: types,
    },
  };
}

sendCollections().catch((e) =>
  figma.ui.postMessage({ type: "extract-error", message: String(e) })
);

figma.on("selectionchange", () => {
  figma.ui.postMessage({ type: "selection-changed", selection: getSelectionInfo() });
});

function inspectSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return { error: "선택된 노드 없음" };

  function serializePaint(paint: Paint): Record<string, unknown> {
    const p: Record<string, unknown> = { type: paint.type };
    if (paint.type === "SOLID") {
      p.color = paint.color;
      p.opacity = paint.opacity;
      p.boundVariables = (paint as any).boundVariables ?? null;
    } else if (paint.type.startsWith("GRADIENT")) {
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

    if ("fills" in node) result.fills = ((node as any).fills as Paint[]).map(serializePaint);
    if ("strokes" in node) result.strokes = ((node as any).strokes as Paint[]).map(serializePaint);
    if ("boundVariables" in node) result.boundVariables = (node as any).boundVariables ?? null;
    if ("fillStyleId" in node) result.fillStyleId = (node as any).fillStyleId || null;
    if ("strokeStyleId" in node) result.strokeStyleId = (node as any).strokeStyleId || null;
    if ("textStyleId" in node) result.textStyleId = (node as any).textStyleId || null;
    if ("effectStyleId" in node) result.effectStyleId = (node as any).effectStyleId || null;
    if ("characters" in node) result.text = (node as any).characters?.slice(0, 80);
    if ("cornerRadius" in node) result.cornerRadius = (node as any).cornerRadius;
    if ("opacity" in node && (node as any).opacity !== 1) result.opacity = (node as any).opacity;

    if (depth < 6 && "children" in node) {
      result.children = (node as ChildrenMixin).children.map(c => serializeNode(c as SceneNode, depth + 1));
    } else if ("children" in node) {
      result.childCount = (node as ChildrenMixin).children.length;
    }

    return result;
  }

  return {
    selectionCount: sel.length,
    nodes: sel.map(n => serializeNode(n, 0)),
  };
}

figma.ui.onmessage = (msg: { type: string; options?: ExtractOptions; width?: number; height?: number }) => {
  if (msg.type === "resize") {
    figma.ui.resize(msg.width ?? 480, msg.height ?? 580);
  }
  if (msg.type === "inspect") {
    try {
      const data = inspectSelection();
      figma.ui.postMessage({ type: "inspect-result", data });
    } catch (e) {
      figma.ui.postMessage({ type: "inspect-result", data: { error: String(e) } });
    }
  }
  if (msg.type === "extract") {
    const options: ExtractOptions = msg.options ?? {
      collectionIds: [],
      useSelection: false,
      tokenTypes: ["variables", "spacing", "radius", "colors", "texts", "effects", "icons"],
    };
    extractAll(options)
      .then((data) => figma.ui.postMessage({ type: "extract-result", data }))
      .catch((e) => figma.ui.postMessage({ type: "extract-error", message: String(e) }));
  }
  if (msg.type === "close") {
    figma.closePlugin();
  }
};
