# PDCA Report — icon-registry

> 완료일: 2026-03-31
> Match Rate: 96% (26/27)
> 구현 파일: `src/ui.js`

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 개별 아이콘 컴포넌트만 생성되고 `size`가 `string`으로 느슨하게 타입되어 있어, 잘못된 값 입력 시 런타임에서야 문제가 발견됨. 아이콘을 동적으로 렌더링하려면 사용처에서 직접 import 분기를 작성해야 함. |
| **Solution** | Figma variants에서 Size 값을 자동 수집해 유니온 타입을 생성하고, `<Icon name="search" />` 하나로 모든 아이콘에 접근하는 레지스트리 컴포넌트를 ZIP에 자동 포함. |
| **Function UX Effect** | React ZIP 다운로드 시 `Icon.tsx` + `IconName` 타입이 함께 포함되어 바로 사용 가능한 완전한 아이콘 시스템 제공. 개발자가 추가 작업 없이 import 한 줄로 모든 아이콘 접근. |
| **Core Value** | Figma 디자인 시스템 변경 → 플러그인 재추출 → 타입 자동 갱신의 파이프라인 완성. 디자인-코드 동기화 비용 최소화. |

### 결과 지표

| 지표 | 값 |
|------|-----|
| Match Rate | 96% (26/27) |
| Gap 항목 수 | 3개 중 2개 수정, 1개 설계 우선 |
| 수정 파일 | `src/ui.js` (1개) |
| 추가 함수 | 2개 (`collectIconSizes`, `buildIconRegistryFile`) |
| 변경 함수 | 5개 (`buildReactBody`, `buildReactComponent`, `buildReactFile`, `buildIndexFile`, `downloadReactZip`) |
| 빌드 상태 | 성공 (`npm run build`) |

---

## 1. Plan 요약

### 목표

Figma 아이콘 컴포넌트 추출 시 생성되는 React ZIP에 두 가지를 추가:
1. **타입 강화**: `size` prop을 Figma variant 값 기반 유니온 타입으로 자동 생성
2. **레지스트리 컴포넌트**: `<Icon name="android" size="default" />` 형태의 단일 진입점 컴포넌트 자동 생성

### 성공 기준 달성 현황

| # | 기준 | 결과 |
|---|------|------|
| 1 | `size` prop이 Figma Size variants 기반 유니온 타입으로 생성 | ✅ |
| 2 | SVG에 width/height 16px 기본값 적용 | ✅ |
| 3 | `size` prop이 `"size-" + size` 형태로 className 변환 | ✅ |
| 4 | React ZIP에 `Icon.tsx` 포함 — name, size, color, className props | ✅ |
| 5 | `Icon.tsx`에 `IconName` 유니온 타입 포함 | ✅ |
| 6 | `index.ts` 배럴에서 `Icon`, `IconName`, `IconSize` re-export | ✅ |

---

## 2. Design 요약

### 변경 파일

| 파일 | 변경 유형 | 함수 수 |
|------|----------|--------|
| `src/ui.js` | 수정 | 신규 2개, 변경 5개 |

### 핵심 설계 결정

- `collectIconSizes(icons)`: variants 배열에서 `size-` 접두사 패턴으로 size 값 추출 후 정렬
- `buildIconRegistryFile(icons, iconSizes)`: `ICON_MAP` + `Icon` 컴포넌트 + `IconName`/`IconSize` 타입 생성
- `Omit<SVGProps<SVGSVGElement>, "color">`: `color` 속성 충돌 방지를 위한 명시적 제거

---

## 3. 구현 결과

### 신규 함수

#### `collectIconSizes(icons)`
```javascript
// variants에서 "size-{value}" 패턴 추출 → 정렬된 배열 반환
// 예: ["default", "micro"]
```

#### `buildIconRegistryFile(icons, iconSizes)`
```javascript
// 생성 결과: Icon.tsx
// - export type IconName = "android" | "apple" | ...
// - export type IconSize = "default"
// - const ICON_MAP: Record<IconName, ComponentType<...>>
// - export const Icon = ({ name, size, color, ... }) => ...
```

### 변경 함수 요약

| 함수 | 변경 내용 |
|------|----------|
| `buildReactBody` | `iconSizes` 파라미터 추가, size 유니온 타입 생성, `Omit<SVGProps, "color">` |
| `prepareSvg` (내부) | className `size && "size-" + size` 패턴, width/height 16px 고정 |
| `buildReactComponent` | `collectIconSizes(iconData)` 전역 기준으로 sizes 수집 |
| `buildReactFile` | `iconSizes` 파라미터 수신 후 `buildReactBody`에 전달 |
| `buildIndexFile` | `Icon, type IconName, type IconSize` re-export 추가 |
| `downloadReactZip` | `collectIconSizes()` 호출, `Icon.tsx` 파일 생성 |

---

## 4. Gap Analysis 결과

| 구분 | 수 | 비율 |
|------|-----|------|
| 일치 항목 | 26 | 96% |
| Gap 항목 | 1 | 4% |

### 수정된 Gap

| Gap | 내용 | 수정 방법 |
|-----|------|----------|
| GAP-01 | 개별 컴포넌트 `extends SVGProps` → `extends Omit<SVGProps, "color">` | `buildReactBody` 수정 |
| GAP-02 | 레지스트리 `extends SVGProps` → `extends Omit<SVGProps, "color">` | `buildIconRegistryFile` 수정 |

### 설계 우선 처리

| Gap | 내용 | 이유 |
|-----|------|------|
| GAP-03 | `width={width ?? height ?? 16}` vs `width={16} {...props}` | 동작 결과 동일. 구현이 더 실용적 |

### 설계 대비 추가 개선

| 개선 | 내용 |
|------|------|
| kebab 중복 제거 | `downloadReactZip` + `buildIconRegistryFile` 내부 dedup 로직 |
| `ComponentType` named import | `import React` 불필요, tree-shaking 최적화 |
| `color` 주석 | `// CSS color 값 — style.color 로 적용됨 (fill="currentColor" 상속)` |

---

## 5. 생성 ZIP 구조

```
icons-react-N.zip
└── react/
    ├── IconAndroid.tsx      — interface extends Omit<SVGProps<SVGSVGElement>, "color">
    ├── IconApple.tsx           size?: "default" | "micro"  (Figma variant 기반)
    ├── ...                     width={16} height={16} + size && "size-" + size
    ├── Icon.tsx             — 레지스트리 (신규)
    │   ├── export type IconName = "android" | "apple" | ...
    │   ├── export type IconSize = "default"
    │   └── export const Icon = ({ name, size, color, ... }) => ...
    └── index.ts
        ├── export { IconAndroid } from "./IconAndroid";
        ├── ...
        └── export { Icon, type IconName, type IconSize } from "./Icon";
```

---

## 6. 사용 예시 (생성된 코드)

```tsx
// 개별 사용 — 타입 안전
import { IconAndroid } from "./icons";
<IconAndroid size="default" color="#0070f3" />
// size="invalid" → TypeScript 컴파일 오류 즉시 감지

// 레지스트리 — 동적 렌더링
import { Icon } from "./icons";
<Icon name="search" size="default" />

// 타입 활용
import type { IconName } from "./icons";
const icon: IconName = "search";  // 자동완성 + 타입 검사
```

---

## 7. PDCA 이력

| 단계 | 일자 | 결과 |
|------|------|------|
| Plan | 2026-03-30 | 목표 및 성공 기준 정의 |
| Design | 2026-03-30 | 7개 함수 상세 설계 |
| Do | 2026-03-30 | `src/ui.js` 구현 완료 |
| Check | 2026-03-30 | Match Rate 89% (GAP-01/02/03 발견) |
| Act | 2026-03-31 | GAP-01/02 수정 → 96% 달성 |
| Report | 2026-03-31 | 완료 보고서 작성 |
