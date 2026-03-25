interface VariableData {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  collectionId: string;
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
}

interface EffectStyleData {
  id: string;
  name: string;
  description: string;
  effects: Effect[];
}

interface ExtractedTokens {
  variables: {
    collections: VariableCollectionData[];
    variables: VariableData[];
  };
  styles: {
    colors: ColorStyleData[];
    texts: TextStyleData[];
    effects: EffectStyleData[];
  };
  meta: {
    figmaFileKey: string;
    extractedAt: string;
    fileName: string;
  };
}

figma.showUI(__html__, { width: 480, height: 560 });

function extractVariables(): ExtractedTokens["variables"] {
  const collections = figma.variables
    .getLocalVariableCollections()
    .map((c) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
      variableIds: [...c.variableIds],
    }));

  const variables = figma.variables.getLocalVariables().map((v) => ({
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    valuesByMode: { ...v.valuesByMode },
    collectionId: v.variableCollectionId,
  }));

  return { collections, variables };
}

function extractColorStyles(): ColorStyleData[] {
  return figma.getLocalPaintStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    paints: [...s.paints],
  }));
}

function extractTextStyles(): TextStyleData[] {
  return figma.getLocalTextStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    fontName: s.fontName,
    fontSize: s.fontSize,
    fontWeight: (s as any).fontWeight ?? 400,
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
  }));
}

function extractEffectStyles(): EffectStyleData[] {
  return figma.getLocalEffectStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    effects: [...s.effects],
  }));
}

function extractAll(): ExtractedTokens {
  return {
    variables: extractVariables(),
    styles: {
      colors: extractColorStyles(),
      texts: extractTextStyles(),
      effects: extractEffectStyles(),
    },
    meta: {
      figmaFileKey: figma.fileKey ?? "",
      extractedAt: new Date().toISOString(),
      fileName: figma.root.name,
    },
  };
}

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === "extract") {
    const data = extractAll();
    figma.ui.postMessage({ type: "extract-result", data });
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
