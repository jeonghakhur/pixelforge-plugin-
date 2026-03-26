---
name: figma-variables
classification: capability
classification-reason: "Figma Plugin API의 Variables(디자인 토큰) 읽기/쓰기/내보내기 패턴을 제공하는 참조 스킬"
deprecation-risk: none
description: |
  PixelForge 플러그인 개발 시 Figma Variables API 사용 패턴을 제공한다.
  변수 컬렉션 읽기, 생성, 모드 처리, JSON export, Style→Variable 변환 코드 예제 포함.
  Triggers: /figma-variables, figma variables api, 피그마 변수
  Keywords: figma variables, variable collection, design tokens, modes, resolvedType, setValueForMode, exportToJSON, 디자인 토큰, 변수 컬렉션
argument-hint: "[read|write|modes|export|style-to-variable]"
user-invocable: true
allowed-tools:
  - Read
  - Grep
  - Glob
---

## Figma Variables API — PixelForge 플러그인 참조 스킬

PixelForge Token Extractor 플러그인에서 `figma.variables.*` API를 사용할 때 이 스킬을 참고한다.

---

## 1. 읽기 (Read)

비동기 버전(`Async`)을 항상 사용한다.

```typescript
// 모든 컬렉션 조회
const collections = await figma.variables.getLocalVariableCollectionsAsync();

for (const collection of collections) {
  console.log(collection.name);       // 컬렉션 이름
  console.log(collection.modes);      // [{ modeId, name }, ...]
  console.log(collection.variableIds); // 변수 ID 목록

  for (const variableId of collection.variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    const { name, resolvedType, valuesByMode } = variable;

    // 특정 모드의 값
    const value = valuesByMode[collection.modes[0].modeId];
  }
}
```

---

## 2. 쓰기 (Write)

```typescript
// 컬렉션 + 모드 생성
const collection = figma.variables.createVariableCollection("Primitives");
const lightModeId = collection.modes[0].modeId;
collection.renameMode(lightModeId, "Light");
const darkModeId = collection.addMode("Dark");

// 변수 생성 (타입: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN")
const colorToken = figma.variables.createVariable("color/primary/500", collection, "COLOR");
const spacingToken = figma.variables.createVariable("spacing/md", collection, "FLOAT");

// 값 설정
colorToken.setValueForMode(lightModeId, { r: 0.2, g: 0.4, b: 1, a: 1 });  // COLOR: RGBA (0~1)
colorToken.setValueForMode(darkModeId, { r: 0.3, g: 0.5, b: 1, a: 1 });
spacingToken.setValueForMode(lightModeId, 16);                               // FLOAT: number

// 변수 별칭 (alias / semantic token)
const semanticToken = figma.variables.createVariable("color/action", collection, "COLOR");
semanticToken.setValueForMode(lightModeId, {
  type: "VARIABLE_ALIAS",
  id: colorToken.id,
});
```

---

## 3. VariableValue 타입

```typescript
type VariableValue = boolean | string | number | RGB | RGBA | VariableAlias;

// VariableAlias
interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string; // 참조 변수의 ID
}
```

---

## 4. 모드 처리 (Modes)

```typescript
// 노드에 명시적 모드 적용
frame.setExplicitVariableModeForCollection(collection, darkModeId);

// 이 노드에 직접 설정된 모드만
console.log(frame.explicitVariableModes);
// { 'VariableCollectionId:1:2': '1:5' }

// 조상 노드에서 상속된 모드 포함
console.log(frame.resolvedVariableModes);
// { 'VariableCollectionId:1:2': '1:5', 'VariableCollectionId:1:3': '1:2' }

// 특정 노드 기준으로 값 resolve
const result = variable.resolveForConsumer(frame);
// => { value: 16, resolvedType: 'FLOAT' }
```

---

## 5. JSON Export (Style Dictionary / W3C 형식)

변수명의 `/`는 중첩 객체 그룹으로 변환한다.

```typescript
async function exportToJSON() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const files: Array<{ fileName: string; body: object }> = [];

  for (const collection of collections) {
    for (const mode of collection.modes) {
      const body: Record<string, unknown> = {};

      for (const variableId of collection.variableIds) {
        const { name, resolvedType, valuesByMode } =
          await figma.variables.getVariableByIdAsync(variableId);
        const value = valuesByMode[mode.modeId];

        if (!["COLOR", "FLOAT"].includes(resolvedType)) continue;

        // "color/primary/500" → { color: { primary: { "500": { $type, $value } } } }
        let obj = body;
        name.split("/").forEach((group) => {
          (obj as Record<string, unknown>)[group] =
            (obj as Record<string, unknown>)[group] || {};
          obj = (obj as Record<string, unknown>)[group] as Record<string, unknown>;
        });

        obj["$type"] = resolvedType === "COLOR" ? "color" : "number";

        if ((value as VariableAlias).type === "VARIABLE_ALIAS") {
          const ref = await figma.variables.getVariableByIdAsync(
            (value as VariableAlias).id
          );
          obj["$value"] = `{${ref.name.replace(/\//g, ".")}}`;
        } else {
          obj["$value"] = resolvedType === "COLOR" ? rgbToHex(value as RGBA) : value;
        }
      }

      files.push({
        fileName: `${collection.name}.${mode.name}.tokens.json`,
        body,
      });
    }
  }

  figma.ui.postMessage({ type: "EXPORT_RESULT", files });
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
```

**출력 예시 (W3C Design Tokens):**
```json
{
  "color": {
    "primary": {
      "500": { "$type": "color", "$value": "#3366FF" }
    },
    "action": { "$type": "color", "$value": "{color.primary.500}" }
  },
  "spacing": {
    "md": { "$type": "number", "$value": 16 }
  }
}
```

---

## 6. Paint Style → Variable 변환

기존 Paint Style을 Variable로 마이그레이션할 때 사용한다.

```typescript
async function convertStylesToVariables() {
  const styles = await figma.getLocalPaintStylesAsync();
  const collection = figma.variables.createVariableCollection("Style Tokens");
  const modeId = collection.modes[0].modeId;
  collection.renameMode(modeId, "Style");

  for (const style of styles) {
    const solidPaint = (style.paints as Paint[]).find(
      (p): p is SolidPaint => p.type === "SOLID"
    );
    if (!solidPaint) continue;

    const token = figma.variables.createVariable(style.name, collection, "COLOR");
    token.setValueForMode(modeId, {
      ...solidPaint.color,
      a: solidPaint.opacity ?? 1,
    });
  }
}
```

---

## 7. 주의사항

- **변수명 `/`**: Figma UI에서 그룹 계층으로 표시됨 (`color/primary/500` → color > primary > 500)
- **ALIAS 순환 참조**: 별칭이 서로를 참조하면 Figma에서 오류 발생
- **manifest.json 권한**: `"permissions": []` (빈 배열). `currentpage`, `variables:read` 등은 현재 Figma API에서 유효하지 않음. Variables/Styles API는 권한 없이 접근 가능. `documentAccess: "dynamic-page"` 설정 시 모든 Variables API는 Async 버전 필수
- **동기 API 지양**: `getLocalVariableCollections()` (동기) 대신 `getLocalVariableCollectionsAsync()` 사용
- **COLOR 값 범위**: Figma의 RGB 값은 `0~1` (CSS의 `0~255` 아님)
