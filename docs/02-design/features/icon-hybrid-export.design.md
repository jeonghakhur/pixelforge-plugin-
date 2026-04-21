# Design — icon-hybrid-export

> **배경**: backdrop-filter / raster layer 효과는 Figma WebGL 렌더러 전용으로 SVG 100% 재현 불가.
> Plugin이 PNG로 폴백 내보내기하고, Generator가 format 필드를 보고 SVG/img 렌더를 자동 선택한다.

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Problem** | backdrop-filter 효과(blur, Noise 합성 등)는 Figma WebGL 렌더러 전용 → SVG exportAsync로 100% 재현 불가 |
| **Solution** | Plugin `exportAsync()` SVG → `<image>` 태그 감지 → PNG 재export + `format` 필드 추가 → Generator 하이브리드 TSX |
| **Function/UX Effect** | `<IconFolderIcon variant="noise" />` 인터페이스 동일, 내부에서 PNG/SVG 자동 선택 |
| **Core Value** | 픽셀 단위 디자인 일치 + 기존 SVG 아이콘 변경 영향 없음 |

---

## 1. 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `IconResult` 타입 + `exportIcons` / `exportIconsAll` PNG 폴백 |
| `src/ui/tab-icons.js` | 수정 | `buildReactBody`, `buildIconRegistryFile`, `downloadReactZip` 하이브리드 렌더 |

---

## 2. 데이터 흐름

```
exportAsync(SVG)
  └─ SVG 문자열에 /<image[\s>]/ 포함?
       ├─ NO  → format: 'svg',  svg: svgString
       └─ YES → exportAsync(PNG, scale:2)
                 └─ format: 'png', svg: base64String

IconResult {
  name, kebab, pascal, variants,
  svg: string,          // SVG 문자열 OR base64 PNG
  format: 'svg'|'png',  // ← NEW
  section: string
}

PixelForge Send / Node JSON 다운로드
  └─ format 필드 그대로 포함 (앱에서 ASSET_MAP 분기용)

downloadReactZip(icons)
  └─ format === 'png'  → ImgIcon TSX 생성 (img src={base64})
  └─ format === 'svg'  → 기존 SvgIcon TSX 생성 (SVG inline)
  └─ buildIconRegistryFile: ICON_FORMAT_MAP 추가
```

---

## 3. 상세 설계

### 3.1 `IconResult` 타입 확장 — `src/code.ts`

```typescript
type IconResult = {
  name: string;
  kebab: string;
  pascal: string;
  variants: string[];
  svg: string;           // SVG 문자열 OR base64 PNG 데이터
  format: 'svg' | 'png'; // ← 신규
  section: string;
};
```

`IconCollected` 내부 타입도 동일하게 `format` 포함:

```typescript
type IconCollected = IconResult & {
  _sx: number; _sy: number;
  _nx: number; _ny: number;
};
```

---

### 3.2 PNG 폴백 내보내기 — `exportIcons` / `exportIconsAll`

**감지 기준**: SVG 결과에 `<image` 태그 포함 여부 (Figma가 raster/blur 효과를 `<image href=...>`로 변환)

```typescript
// 공통 헬퍼 (exportIcons, exportIconsAll 양쪽 적용)
async function exportNodeAsIconContent(
  node: SceneNode
): Promise<{ svg: string; format: 'svg' | 'png' }> {
  const svgBytes = await (node as any).exportAsync({ format: 'SVG' });
  let svg = bytesToStr(svgBytes);

  if (/<image[\s>]/.test(svg)) {
    // raster 레이어 포함 → PNG @2x 내보내기
    const pngBytes = await (node as any).exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 2 },
    });
    const b64 = uint8ToBase64(new Uint8Array(pngBytes));
    return { svg: b64, format: 'png' };
  }

  return { svg, format: 'svg' };
}
```

> `bytesToStr`: 기존 SVG 변환 로직 (bytes → string)
> `uint8ToBase64`: 신규 헬퍼 — `btoa(String.fromCharCode(...bytes))`

**`exportIcons` 수정 지점**:

```typescript
// 기존
const svgBytes = await (node as any).exportAsync({ format: 'SVG' });
let svg = '';
for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);

// 변경
const { svg, format } = await exportNodeAsIconContent(node);

// collected.push 에 format 추가
collected.push({
  ...,
  svg,
  format,  // ← 추가
  ...
});
```

`exportIconsAll`도 동일하게 적용.

---

### 3.3 `buildReactBody` 하이브리드 렌더 — `src/ui/tab-icons.js`

**시그니처 변경**:

```javascript
// 현재
buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline)

// 변경
buildReactBody(name, baseCls, variantClasses, svgOrBase64, iconSizes, trailingNewline, format)
```

**렌더 분기 로직**:

```javascript
function buildReactBody(name, baseCls, variantClasses, svgOrBase64, iconSizes, trailingNewline, format) {
  var isPng = format === 'png';

  var sizeType = iconSizes && iconSizes.length > 0
    ? iconSizes.map(function(s) { return '"' + s + '"'; }).join(' | ')
    : 'string';

  var body;
  if (isPng) {
    // PNG: img 태그로 렌더
    body = 'export const ' + name + ' = ({ size, color, className, style, ...props }) => (\n'
      + '  <img\n'
      + '    src={"data:image/png;base64,' + svgOrBase64 + '"}\n'
      + '    className={["' + baseCls + '", size && "size-" + size, className].filter(Boolean).join(" ")}\n'
      + '    style={{ color, ...style }}\n'
      + '    {...props}\n'
      + '  />\n'
      + ');';
  } else {
    // SVG: 기존 inline SVG 렌더
    var indentedSvg = svgOrBase64.split('\n').map(function(l) { return '  ' + l; }).join('\n');
    body = 'export const ' + name + ' = ({ size, color, className, ...props }: ' + name + 'Props) => (\n'
      + indentedSvg + '\n'
      + ');';
  }

  var header = isPng
    ? ''  // PNG는 SVGProps import 불필요
    : 'import type { SVGProps } from "react";\n\n'
      + 'interface ' + name + 'Props extends Omit<SVGProps<SVGSVGElement>, "color"> {\n'
      + '  size?: ' + sizeType + ';\n'
      + '  color?: string;\n'
      + '}\n\n';

  return header + body + (trailingNewline ? '\n' : '');
}
```

---

### 3.4 `buildIconRegistryFile` 확장 — ICON_FORMAT_MAP 추가

앱에서 format 기반 분기를 위해 ICON_FORMAT_MAP 포함:

```javascript
// ICON_FORMAT_MAP: { [kebab: IconName]: 'svg' | 'png' }
var formatEntries = icons.map(function(icon) {
  return '  "' + icon.kebab + '": "' + (icon.format || 'svg') + '"';
}).join(',\n');

// 생성 코드에 추가
+ 'export const ICON_FORMAT_MAP: Record<IconName, "svg" | "png"> = {\n'
+ formatEntries + '\n'
+ '} as const;\n\n'
```

---

### 3.5 `downloadReactZip` 수정

```javascript
function downloadReactZip(icons) {
  var iconSizes = collectIconSizes(icons);
  // 중복 kebab 제거 (기존 로직)
  var seen = {};
  var uniqueIcons = icons.filter(function(ic) {
    if (seen[ic.kebab]) return false;
    seen[ic.kebab] = true;
    return true;
  });

  uniqueIcons.forEach(function(icon) {
    var processedSvg = icon.format === 'png'
      ? icon.svg                          // base64 그대로 전달
      : processIconSvg(icon.svg, icon);   // SVG 전처리 (기존)

    var content = buildReactFile(icon, processedSvg, iconSizes, icon.format || 'svg');
    // ZIP에 IconXxx.tsx 추가
    zip.add('Icon' + icon.pascal + '.tsx', content);
  });

  // Icon.tsx (레지스트리) 추가
  zip.add('Icon.tsx', buildIconRegistryFile(uniqueIcons, iconSizes));
  zip.add('index.ts', buildIndexFile(uniqueIcons));
  zip.download('icons.zip');
}
```

---

## 4. 엣지케이스

| 케이스 | 처리 방식 |
|--------|----------|
| SVG export 자체 실패 | 기존 try/catch로 skip (변경 없음) |
| PNG export 실패 | catch → SVG 폴백 재시도, 그래도 실패 시 skip |
| `<image>` 포함이나 순수 SVG 이미지 (`<image xlink:href="data:...">`) | 동일하게 PNG 처리 — 보수적 판단 |
| PNG base64 크기 초과 (>500KB) | 경고 콘솔 출력, 내보내기는 허용 |
| PixelForge Send 페이로드 | `format` 필드 그대로 포함, 앱 ASSET_MAP 처리 |

---

## 5. 구현 순서 체크리스트

- [ ] `src/code.ts`: `uint8ToBase64` 헬퍼 추가
- [ ] `src/code.ts`: `exportNodeAsIconContent` 헬퍼 추가
- [ ] `src/code.ts`: `IconResult` + `IconCollected` 타입에 `format` 추가
- [ ] `src/code.ts`: `exportIcons` — `exportNodeAsIconContent` 적용
- [ ] `src/code.ts`: `exportIconsAll` — `exportNodeAsIconContent` 적용
- [ ] `src/ui/tab-icons.js`: `buildReactBody` `format` 파라미터 + 렌더 분기
- [ ] `src/ui/tab-icons.js`: `buildIconRegistryFile` ICON_FORMAT_MAP 추가
- [ ] `src/ui/tab-icons.js`: `downloadReactZip` PNG/SVG 분기
- [ ] `npm run build` 성공 확인
- [ ] Figma에서 Folder(Noise) 아이콘 추출 → `format: 'png'` 확인
- [ ] ZIP 내 `IconFolder.tsx` img 렌더 확인
