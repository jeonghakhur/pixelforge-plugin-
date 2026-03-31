# Design — icon-registry

> Plan 참조: `docs/01-plan/features/icon-registry.plan.md`

---

## 1. 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/ui.js` | 수정 | 함수 5개 수정/추가 |

---

## 2. 데이터 흐름

```
iconData (global) ← exportIcons / exportIconsAll 결과
  └─ icon.variants: ["size-default", "size-micro", "color-primary", ...]

collectIconSizes(icons)
  └─ variants에서 "size-{value}" 패턴 추출
  └─ 반환: ["default", "micro"]  ← IconSize 유니온 값

buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline)
  └─ iconSizes가 있으면: size?: "default" | "micro"
  └─ iconSizes가 없으면: size?: string  (fallback)
  └─ SVG에 width={16} height={16} 기본값 추가
  └─ className: ["icon-android", size && "size-" + size, color, className]

buildIconRegistryFile(icons, iconSizes)
  └─ IconName: "android" | "apple" | ...  (icon.kebab 값)
  └─ IconSize: "default" | "micro"
  └─ ICON_MAP: Record<IconName, ComponentType>
  └─ Icon 컴포넌트: name, size, color, className props

downloadReactZip(icons)
  └─ collectIconSizes(icons) 호출
  └─ 각 개별 컴포넌트에 iconSizes 전달
  └─ Icon.tsx 추가
  └─ index.ts: Icon, IconName, IconSize re-export 포함
```

---

## 3. 함수 상세 설계

### 3.1 `collectIconSizes(icons)` — 신규

**위치**: `buildReactBody` 위에 추가

```javascript
function collectIconSizes(icons) {
  var sizes = new Set();
  icons.forEach(function(icon) {
    (icon.variants || []).forEach(function(v) {
      var m = v.match(/^size-(.+)$/);
      if (m) sizes.add(m[1]);
    });
  });
  return Array.from(sizes).sort(); // ["default", "micro"]
}
```

**입력**: `icons` 배열 (`{ variants: string[] }[]`)
**출력**: `string[]` — "size-" 이후 값만 추출. 빈 배열이면 fallback 동작.

---

### 3.2 `buildReactBody` — 시그니처 변경

**현재**: `buildReactBody(name, baseCls, variantClasses, formattedSvg, trailingNewline)`
**변경**: `buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline)`

```javascript
function buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline) {
  // iconSizes: ["default", "micro"] → 'size?: "default" | "micro"'
  // iconSizes: []                  → 'size?: string'
  var sizeType = iconSizes && iconSizes.length > 0
    ? iconSizes.map(function(s) { return '"' + s + '"'; }).join(' | ')
    : 'string';

  var indentedSvg = formattedSvg.split('\n').map(function(l) { return '  ' + l; }).join('\n');

  return 'import type { SVGProps } from "react";\n\n'
    + 'interface ' + name + 'Props extends Omit<SVGProps<SVGSVGElement>, "color"> {\n'
    + '  size?: ' + sizeType + ';\n'
    + '  color?: string;\n'
    + '}\n\n'
    + 'export const ' + name + ' = ({ size, color, className, ...props }: ' + name + 'Props) => (\n'
    + indentedSvg + '\n'
    + ');' + (trailingNewline ? '\n' : '');
}
```

**`prepareSvg` className 변경**:

현재:
```javascript
'className={["' + classNames + '", size, color, className].filter(Boolean).join(" ")}'
```

변경:
```javascript
'className={["' + classNames + '", size && "size-" + size, color, className].filter(Boolean).join(" ")}'
```

**SVG 기본 크기 추가** (`prepareSvg` 내 `svgOpen` 빌드 시):

현재:
```javascript
var xmlAttrs = ['width={width ?? height ?? 24}', 'height={height ?? width ?? 24}'];
```

변경:
```javascript
var xmlAttrs = ['width={width ?? height ?? 16}', 'height={height ?? width ?? 16}'];
```

> `prepareSvg`의 `xmlAttrs` 기본값 24 → 16 변경.

---

### 3.3 `buildReactComponent` — 호출 변경 (미리보기용)

**현재**:
```javascript
function buildReactComponent(icon, processedSvg) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  return buildReactBody(name, 'icon-' + icon.kebab, icon.variants || [], prepareSvg(processedSvg, cls), false);
}
```

**변경**: `collectIconSizes(iconData)` 사용 — 전체 iconData 기준 sizes

```javascript
function buildReactComponent(icon, processedSvg) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  var sizes = collectIconSizes(iconData); // global iconData 사용
  return buildReactBody(name, 'icon-' + icon.kebab, icon.variants || [], prepareSvg(processedSvg, cls), sizes, false);
}
```

---

### 3.4 `buildReactFile` — 호출 변경 (ZIP 파일용)

**현재**:
```javascript
function buildReactFile(icon, processedSvg) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  return buildReactBody(name, 'icon-' + icon.kebab, icon.variants || [], prepareSvg(processedSvg, cls), true);
}
```

**변경**: `iconSizes` 파라미터 추가

```javascript
function buildReactFile(icon, processedSvg, iconSizes) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  return buildReactBody(name, 'icon-' + icon.kebab, icon.variants || [], prepareSvg(processedSvg, cls), iconSizes, true);
}
```

---

### 3.5 `buildIconRegistryFile(icons, iconSizes)` — 신규

**위치**: `buildIndexFile` 바로 위에 추가

```javascript
function buildIconRegistryFile(icons, iconSizes) {
  if (!icons || icons.length === 0) return '';

  var imports = icons.map(function(icon) {
    return 'import { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
  }).join('\n');

  var iconNameType = icons.map(function(icon) {
    return '"' + icon.kebab + '"';
  }).join(' | ');

  var iconSizeType = iconSizes && iconSizes.length > 0
    ? iconSizes.map(function(s) { return '"' + s + '"'; }).join(' | ')
    : 'string';

  var mapEntries = icons.map(function(icon) {
    return '  ' + icon.kebab + ': Icon' + icon.pascal + ',';
  }).join('\n');

  return 'import type { SVGProps } from "react";\n'
    + imports + '\n\n'
    + 'export type IconName = ' + iconNameType + ';\n'
    + 'export type IconSize = ' + iconSizeType + ';\n\n'
    + 'interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {\n'
    + '  name: IconName;\n'
    + '  size?: IconSize;\n'
    + '  color?: string;\n'
    + '}\n\n'
    + 'const ICON_MAP: Record<IconName, React.ComponentType<Omit<IconProps, "name">>> = {\n'
    + mapEntries + '\n'
    + '};\n\n'
    + 'export const Icon = ({ name, size, color, className, ...props }: IconProps) => {\n'
    + '  const Comp = ICON_MAP[name];\n'
    + '  return Comp ? <Comp size={size} color={color} className={className} {...props} /> : null;\n'
    + '};\n';
}
```

---

### 3.6 `buildIndexFile` — re-export 추가

**현재**:
```javascript
function buildIndexFile(icons) {
  return icons.map(function(icon) {
    return 'export { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
  }).join('\n') + '\n';
}
```

**변경**:
```javascript
function buildIndexFile(icons) {
  var exports = icons.map(function(icon) {
    return 'export { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
  });
  exports.push('export { Icon, type IconName, type IconSize } from "./Icon";');
  return exports.join('\n') + '\n';
}
```

---

### 3.7 `downloadReactZip` — Icon.tsx 추가

**현재**:
```javascript
async function downloadReactZip(icons) {
  var zip = new JSZip();
  var reactFolder = zip.folder('react');
  icons.forEach(function(icon) {
    var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
    reactFolder.file('Icon' + icon.pascal + '.tsx', buildReactFile(icon, processed));
  });
  reactFolder.file('index.ts', buildIndexFile(icons));
  // ...
}
```

**변경**:
```javascript
async function downloadReactZip(icons) {
  var zip = new JSZip();
  var reactFolder = zip.folder('react');
  var iconSizes = collectIconSizes(icons);  // ← 추가

  icons.forEach(function(icon) {
    var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
    reactFolder.file('Icon' + icon.pascal + '.tsx', buildReactFile(icon, processed, iconSizes));  // ← iconSizes 전달
  });

  reactFolder.file('Icon.tsx', buildIconRegistryFile(icons, iconSizes));  // ← 추가
  reactFolder.file('index.ts', buildIndexFile(icons));
  // ...
}
```

---

## 4. 생성 파일 구조 (ZIP)

```
icons-react-N.zip
└── react/
    ├── IconAndroid.tsx
    │     export const IconAndroid = ({ size, color, className, ...props }: IconAndroidProps) => (
    │       <svg width={16} height={16}
    │            className={["icon-android", size && "size-" + size, color, className]...}>
    │
    ├── IconApple.tsx
    ├── ...
    ├── Icon.tsx              ← 신규
    │     export type IconName = "android" | "apple" | ...;
    │     export type IconSize = "default" | "micro";
    │     export const Icon = ({ name, size, ... }) => ...;
    │
    └── index.ts
          export { IconAndroid } from "./IconAndroid";
          export { IconApple } from "./IconApple";
          export { Icon, type IconName, type IconSize } from "./Icon";  ← 추가
```

---

## 5. 엣지 케이스 처리

| 상황 | 처리 방식 |
|------|----------|
| Size variant 없는 파일 | `iconSizes = []` → `size?: string` fallback |
| 아이콘 0개 | `buildIconRegistryFile` 빈 문자열 반환, ZIP에 미포함 |
| 동일 kebab 이름 중복 | `downloadReactZip` 호출 전 `seen` set으로 이미 처리됨 (기존 로직) |
| `Icon` 키워드가 icon.kebab과 충돌 | `ICON_MAP` 키는 kebab(소문자), 컴포넌트 이름은 PascalCase라 충돌 없음 |

---

## 6. 구현 순서

1. `collectIconSizes` 추가 (독립적, 다른 함수 의존 없음)
2. `prepareSvg` — `xmlAttrs` 기본값 24 → 16 변경
3. `buildReactBody` — 시그니처 변경 + size 타입 + className 변환
4. `buildReactComponent` / `buildReactFile` — iconSizes 전달
5. `buildIconRegistryFile` 추가
6. `buildIndexFile` — re-export 추가
7. `downloadReactZip` — `collectIconSizes` + `Icon.tsx` 추가
