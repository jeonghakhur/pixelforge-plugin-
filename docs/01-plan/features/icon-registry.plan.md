# PDCA Plan — icon-registry

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 개별 아이콘 컴포넌트만 생성되고 `size`가 `string`으로 느슨하게 타입되어 있어, 잘못된 값 입력 시 런타임에서야 문제가 발견됨. 또한 아이콘을 동적으로 렌더링하려면 사용처에서 직접 import 분기를 작성해야 함. |
| **Solution** | Figma variants에서 Size 값을 자동 수집해 유니온 타입을 생성하고, 모든 아이콘을 name prop 하나로 렌더링하는 `<Icon name="android" />` 레지스트리 컴포넌트를 자동 생성. |
| **Function UX Effect** | React ZIP 다운로드 시 `Icon.tsx` + `IconName` 타입이 함께 포함되어 바로 사용 가능한 완전한 아이콘 시스템을 제공. 개발자가 추가 작업 없이 import 한 줄로 모든 아이콘에 접근. |
| **Core Value** | Figma 디자인 시스템 변경 → 플러그인 재추출 → 타입 자동 갱신의 파이프라인이 완성되어 디자인-코드 동기화 비용 최소화. |

---

## 목표

Figma 아이콘 컴포넌트 추출 시 생성되는 React 코드에 두 가지를 추가한다.

1. **타입 강화**: `size` prop을 Figma variant 값 기반 유니온 타입으로 자동 생성
2. **레지스트리 컴포넌트**: `<Icon name="android" size="default" />` 형태로 사용하는 단일 진입점 컴포넌트 자동 생성

---

## 사용자 스토리

- 개발자가 React ZIP을 다운받으면 `Icon.tsx`, `IconName` 타입, 개별 컴포넌트가 모두 포함됨
- `import { Icon } from "./icons"` 한 줄로 모든 아이콘 사용 가능
- `size="invalid"` 입력 시 TypeScript 컴파일 오류로 즉시 감지
- Figma에서 새 size variant 추가 → 재추출 → 유니온 타입 자동 갱신

---

## 성공 기준

- [ ] `size` prop이 Figma Size variants에서 동적 추출된 유니온 타입으로 생성됨 (예: `"default" | "micro"`)
- [ ] 기본 width/height 16px이 SVG에 적용됨 (size prop 미입력 시 fallback)
- [ ] `size` prop이 컴포넌트 내부에서 `"size-" + size` 형태로 className에 변환됨
- [ ] React ZIP에 `Icon.tsx` 포함 — `name`, `size`, `color`, `className` props 지원
- [ ] `Icon.tsx`에 `IconName` 유니온 타입 포함 (추출된 모든 아이콘 kebab 이름)
- [ ] `index.ts` 배럴에서 `Icon`, `IconName`, `IconSize` re-export

---

## 구현 범위

### 변경 파일: `src/ui.js`

#### 1. `buildReactBody` 수정 — size 타입 강화

**현재:**
```tsx
interface IconAndroidProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: string;
  color?: string;
}
export const IconAndroid = ({ size, color, className, ...props }) => (
  <svg className={["icon-android", size, color, className].filter(Boolean).join(" ")} {...props}>
```

**변경 후:**
```tsx
// buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline)
// iconSizes: ["default", "micro"] — 추출된 Size variant 값 목록

interface IconAndroidProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: "default" | "micro";   // ← 동적 생성
  color?: string;
}
export const IconAndroid = ({ size, color, className, ...props }: IconAndroidProps) => (
  <svg
    width={16}
    height={16}
    className={["icon-android", size && "size-" + size, color, className].filter(Boolean).join(" ")}
    {...props}
  >
```

#### 2. `collectIconSizes(icons)` 추가 — variants에서 size 값 수집

```javascript
function collectIconSizes(icons) {
  var sizes = new Set();
  icons.forEach(function(icon) {
    (icon.variants || []).forEach(function(v) {
      var m = v.match(/^size-(.+)$/);
      if (m) sizes.add(m[1]);
    });
  });
  return Array.from(sizes); // ["default", "micro"]
}
```

#### 3. `buildIconRegistryFile(icons, iconSizes)` 추가

```typescript
// 생성되는 Icon.tsx 구조
import type { SVGProps } from "react";
import { IconAndroid } from "./IconAndroid";
import { IconApple } from "./IconApple";
// ...

export type IconName = "android" | "apple" | ...;
export type IconSize = "default" | "micro";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  name: IconName;
  size?: IconSize;
  color?: string;
}

const ICON_MAP: Record<IconName, React.ComponentType<Omit<IconProps, "name">>> = {
  android: IconAndroid,
  apple: IconApple,
  // ...
};

export const Icon = ({ name, size, color, className, ...props }: IconProps) => {
  const Comp = ICON_MAP[name];
  return Comp ? <Comp size={size} color={color} className={className} {...props} /> : null;
};
```

#### 4. `buildIndexFile` 수정 — Icon, IconName, IconSize re-export 추가

```typescript
export { IconAndroid } from "./IconAndroid";
export { IconApple } from "./IconApple";
// ...
export { Icon, type IconName, type IconSize } from "./Icon";
```

#### 5. `downloadReactZip` 수정 — Icon.tsx 파일 추가

```javascript
async function downloadReactZip(icons) {
  var zip = new JSZip();
  var reactFolder = zip.folder('react');
  var iconSizes = collectIconSizes(icons);

  icons.forEach(function(icon) {
    var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
    reactFolder.file('Icon' + icon.pascal + '.tsx', buildReactFile(icon, processed, iconSizes));
  });

  reactFolder.file('Icon.tsx', buildIconRegistryFile(icons, iconSizes));  // ← 추가
  reactFolder.file('index.ts', buildIndexFile(icons));
  // ...
}
```

---

## 생성 파일 구조 (ZIP)

```
icons-react-N.zip
└── react/
    ├── IconAndroid.tsx      — 개별 아이콘 컴포넌트
    ├── IconApple.tsx
    ├── ...
    ├── Icon.tsx             — 레지스트리 컴포넌트 (신규)
    └── index.ts             — 배럴 (Icon, IconName, IconSize 포함)
```

---

## 사용 예시 (생성된 코드)

```tsx
// 개별 사용
import { IconAndroid } from "./icons";
<IconAndroid size="default" color="primary" />

// 레지스트리 사용
import { Icon } from "./icons";
<Icon name="android" size="micro" />

// 타입 활용
import type { IconName } from "./icons";
const icons: IconName[] = ["android", "apple", "home"];
```

---

## 우선순위 및 구현 순서

| # | 항목 | 난이도 | 영향도 |
|---|------|--------|--------|
| 1 | `collectIconSizes()` 추가 | 낮음 | size 타입 생성의 기반 |
| 2 | `buildReactBody` — size 유니온 타입 + `size-` 변환 + 16px 기본값 | 낮음 | 타입 안전성 |
| 3 | `buildIconRegistryFile()` 추가 | 중간 | 레지스트리 컴포넌트 |
| 4 | `buildIndexFile` — re-export 추가 | 낮음 | 진입점 완성 |
| 5 | `downloadReactZip` — Icon.tsx 추가 | 낮음 | ZIP에 포함 |

---

## 엣지 케이스

- **Size variant 없는 아이콘**: `iconSizes`가 빈 배열이면 `size?: string` fallback 유지
- **단일 size variant**: `size?: "default"` — 유니온이지만 타입 정보로서 의미 있음
- **동일 pascal 이름 충돌**: `seen` set으로 중복 방지 (기존 로직 활용)
- **빈 아이콘 목록**: registry 파일 생성 스킵
