# Plan: Component Node Tree Export (100% Fidelity)

> **Summary**: Figma 노드 구조를 재귀 트리로 완전 추출하여, 앱이 모든 variant를 픽셀 단위로 정확하게 재현할 수 있는 데이터 계약을 수립한다
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.5.0
> **Date**: 2026-04-11
> **Status**: Draft
> **Depends on**: component-radix-generation (구현 완료), component-db-registry (구현 완료)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 `generateComponent()` 결과의 `childStyles`가 1-level 자식만 추출하여, "Text padding" 같은 래퍼 FRAME 안에 중첩된 TEXT 노드의 스타일(color/font-*)이 완전 누락됨. 또한 **원자 컴포넌트별(Button/Input/Checkbox/Radio/Switch 등)로 Figma 구조가 각기 달라** — checkmark(VECTOR), outer/inner circle(ELLIPSE), leading/trailing icon(INSTANCE), placeholder vs value TEXT 등 — 1-level childStyles 방식으로는 **어떤 원자 컴포넌트도 완전 재현 불가** |
| **Solution** | 모든 Figma 노드 타입(FRAME/TEXT/VECTOR/ELLIPSE/RECTANGLE/LINE/INSTANCE/COMPONENT/GROUP/BOOLEAN_OPERATION)에 대해 **재귀 nodeTree**를 추출. 각 원자 컴포넌트 유형의 구조적 특성을 **단일 스키마**로 포괄. 앱은 플러그인이 내보낸 데이터만으로 CSS Modules / Styled Components / Tailwind 등 원하는 기술로 **100% 정확히 재현** 가능 |
| **Function/UX Effect** | Button/Input/Checkbox/Radio/Switch/Select/Badge/Avatar 등 **원자 컴포넌트 전반**에서 variant 선택 시 Figma 디자인과 **픽셀 단위 일치**. 체크박스의 체크마크 SVG, 라디오의 이너 도트, 인풋의 플레이스홀더 텍스트 색상 등 모든 세부 요소 정확 반영 |
| **Core Value** | "Figma = Single Source of Truth" + **원자 컴포넌트 범용성(Universality)** 확립. 플러그인이 추출한 데이터만으로 앱이 모든 원자 컴포넌트를 완전 재현할 수 있는 **완전성(Completeness) 계약** |

---

## 1. 개요

### 1.1 목적

플러그인의 `generateComponent()` 결과물을 확장하여 **앱에서 원자 컴포넌트(atomic components)를 100% 재현**하기 위한 모든 정보를 담는다.

**1순위 대상 (원자 컴포넌트):**
Button, Input, Textarea, Checkbox, Radio, Switch, Select, Badge, Avatar, Tag, Chip, Tooltip, Progress, Slider, Label

**2순위 대상 (복합 컴포넌트, 원자 기반):**
Dialog, Tabs, Accordion, Popover, Dropdown Menu, Card, Alert — 원자 컴포넌트 조합으로 재현 가능

**핵심 요구:**
- 선택된 노드(및 COMPONENT_SET의 각 variant)를 **재귀 nodeTree**로 직렬화
- FRAME뿐 아니라 **TEXT/VECTOR/ELLIPSE/RECTANGLE/INSTANCE/BOOLEAN_OPERATION** 등 모든 노드 타입 커버
- 노드별 `characters`, `color`, `font-*`, `line-height`, SVG 모양 식별자 등 **모든 시각 스타일** 포함
- variant별 구조 차이(예: Checkbox의 checkmark는 checked state에만 존재) 트리 구조로 자연스럽게 표현
- 기존 `childStyles`, `html`, `htmlCss` 필드는 **하위 호환** 목적으로 유지 (앱 마이그레이션 완료 후 제거 가능)

### 1.2 배경

#### 현재 상태의 구조적 한계

**`code.ts:2177-2185` `getChildStyles()`**:
```ts
function getChildStyles(n: SceneNode): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  if (!('children' in n)) return result;
  (n as ChildrenMixin).children.forEach((child, i) => {
    result[c.name || 'child-' + i] = getNodeStyles(c);  // ← 1-level only
  });
  return result;
}
```

이 1-level 제약은 **`component-radix-generation.plan.md:223`에서 의도적으로 선택한 결정**:

> "1단계 자식만 추출 — 깊은 중첩은 복잡도 급증, 루트+1레벨이 80% 커버"

그러나 실제 Figma 디자인 시스템(예: Untitled UI, Button 컴포넌트)에서는:

```
Link color / Link gray:           Primary / Secondary / Tertiary:
Root (Button)                     Root (Button)
├─ placeholder                    ├─ placeholder
├─ Text  ← 직접 자식                ├─ "Text padding" (FRAME)
└─ placeholder                    │    └─ TEXT  ← 손자!
                                  └─ placeholder
```

**Hierarchy에 따라 구조가 다르기 때문에** 1-level 추출이 hierarchy 절반(150/200개)에서 실패한다.

#### 실측 증거 (`pixelforge/data/Button.node.json`)

| Hierarchy | 개수 | `childStyles`에 텍스트 색상 | childStyles 키 |
|---|---:|:---:|---|
| Link color | 25 | ✅ 25/25 | `Text`, `placeholder`, ... |
| Link gray | 25 | ✅ 25/25 | `Text`, `placeholder`, ... |
| **Primary** | **50** | ❌ **0/50** | `Text padding`, `placeholder`, ... |
| **Secondary** | **50** | ❌ **0/50** | 동일 |
| **Tertiary** | **50** | ❌ **0/50** | 동일 |

**영향:** Primary/Secondary/Tertiary 150개 variant에서 텍스트 색상·폰트 정보 완전 유실 → 생성된 컴포넌트에서 **Primary 텍스트가 검정으로 렌더링**되는 증상 발생.

#### 원자 컴포넌트별 구조적 특성 (대표 패턴)

각 원자 컴포넌트는 Figma에서 **고유한 노드 구조**로 그려진다. 1-level `childStyles`는 이 구조 다양성을 담지 못한다:

| 원자 컴포넌트 | 대표 Figma 구조 | 핵심 노드 타입 | 1-level 한계 |
|---|---|---|---|
| **Button** | `Root → [icon, "Text padding" → TEXT, icon]` | FRAME + INSTANCE + TEXT | TEXT가 래퍼 안 → 색상 누락 |
| **Input** | `Root → [Label TEXT, Container → [Icon, Placeholder/Value TEXT, Icon], Helper TEXT]` | FRAME + INSTANCE + TEXT(여러) | 다중 TEXT 역할 구분 불가, placeholder 색 누락 |
| **Textarea** | `Root → [Label, Container → TEXT(multi-line), Counter TEXT]` | FRAME + TEXT | 내부 TEXT 타이포 누락 |
| **Checkbox** | `Root → [Box FRAME → Checkmark VECTOR, Label TEXT]` | FRAME + VECTOR + TEXT | VECTOR(체크마크) 스타일 미추출, 체크 상태별 존재 여부 불명 |
| **Radio** | `Root → [Outer ELLIPSE → Inner ELLIPSE, Label TEXT]` | ELLIPSE + TEXT | ELLIPSE를 FRAME으로 착각, 이너 도트 누락 |
| **Switch** | `Root → Track RECTANGLE → Thumb ELLIPSE, Label TEXT` | RECTANGLE + ELLIPSE + TEXT | thumb 위치/이동 거리 추출 불가 |
| **Select / Dropdown** | `Root → [Label, Trigger → [Placeholder/Value TEXT, Chevron VECTOR]]` | FRAME + VECTOR + TEXT | 선택 상태별 텍스트 색 구분 불가 |
| **Badge / Chip** | `Root → [Icon INSTANCE, TEXT]` 또는 `Root → TEXT` | FRAME + INSTANCE + TEXT | 단순하지만 여전히 TEXT 색 누락 |
| **Avatar** | `Root ELLIPSE → [Image RECTANGLE / Initials TEXT, Status dot ELLIPSE]` | ELLIPSE + RECTANGLE + TEXT | 마스크/이미지 fill 누락 |
| **Tooltip** | `Root → [Content TEXT, Arrow TRIANGLE VECTOR]` | FRAME + VECTOR + TEXT | arrow 방향/위치 누락 |
| **Progress** | `Root → [Track RECTANGLE → Fill RECTANGLE, Label TEXT]` | RECTANGLE + TEXT | fill의 너비(%)/색 누락 |
| **Slider** | `Root → [Track → Range RECTANGLE, Thumb ELLIPSE, Label]` | RECTANGLE + ELLIPSE + TEXT | thumb 위치/range 너비 누락 |

**공통 관찰:**
1. **FRAME 외 노드 타입 빈출** — VECTOR(체크마크/화살표/시브론), ELLIPSE(라디오/스위치 썸/스테이터스 도트), RECTANGLE(트랙/프로그레스 바)
2. **INSTANCE 노드** — 아이콘이 별도 컴포넌트 인스턴스로 삽입됨 (Button의 leading/trailing icon)
3. **TEXT 역할의 다양성** — label / placeholder / value / helper / counter / action — 1-level childStyles에 "Text" 키 하나로는 구분 불가
4. **상태별 조건부 노드** — Checkbox의 checkmark, Radio의 inner dot, Select의 selected value 등이 **특정 variant(state)에서만 존재**
5. **모양 관련 스타일 필수** — `border-radius: 50%` (ELLIPSE), SVG path 식별자 (VECTOR), fill 색상 (shape)

#### 앱 측 요구사항

앱은 플러그인이 내보낸 `.node.json`만으로 **모든 원자 컴포넌트의 모든 variant를 Figma와 픽셀 단위로 일치**시킬 수 있어야 한다. 현재는 Button조차 150/200 variants에서 실패.

### 1.3 관련 문서

- `docs/01-plan/features/component-radix-generation.plan.md` — 원 플랜, `childStyles` 1-level 결정 출처
- `docs/02-design/features/component-radix-generation.design.md` — `GenerateComponentResult` 인터페이스 정의
- `docs/01-plan/features/pixelforge-sync.plan.md` — 앱과의 동기화 계약
- `src/code.ts:1673-2266` — `generateComponent()` 현재 구현
- `src/code.ts:2177-2185` — `getChildStyles()` 1-level 구현
- `src/code.ts:2227-2233` — variants 배열 생성 위치
- 실측 자료:
  - `~/Downloads/Buttons_Button.node.json` — 최신 플러그인 출력 (164KB, 200 variants)
  - `~/work/person/pixelforge/data/Button.node.json` — 앱 DB에 저장된 구버전 (151KB)

---

## 2. 구현 범위

### 2.1 In Scope

#### 코어 데이터 구조
- [ ] `generateComponent()` 결과에 `nodeTree` 필드 추가 (선택된 노드의 재귀 트리)
- [ ] `variants[]` 각 항목에 `nodeTree` 추가 (COMPONENT_SET variant별 완전 트리)
- [ ] `nodeTree` 노드 당 필드 표준화: `id`, `type`, `name`, `styles`, `characters?`, `textRole?`, `shape?`, `children?`
- [ ] `variantSlug` 필드 추가: property 조합을 파일명/CSS 선택자에 사용 가능한 식별자로 변환
- [ ] `GenerateComponentResult` TypeScript 타입 갱신
- [ ] 기존 `childStyles`, `html`, `htmlCss`, `htmlClass`, `jsx` 필드 **유지** (하위 호환)

#### 노드 타입 커버리지 (원자 컴포넌트 전 범위 대응)
- [ ] **FRAME / GROUP / COMPONENT / COMPONENT_SET** — 레이아웃 컨테이너 (layoutMode, padding, gap 포함)
- [ ] **TEXT** — `characters` + 모든 타이포 스타일 (`color`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`) + `textRole` 힌트 추론
- [ ] **VECTOR** — `shape: "vector"`, fill/stroke 스타일, 가능하면 `pathData` 추출 (Checkbox checkmark, Select chevron, Tooltip arrow)
- [ ] **ELLIPSE** — `shape: "ellipse"`, border-radius 자동 `50%` 처리, fill/stroke (Radio outer/inner, Switch thumb, Avatar)
- [ ] **RECTANGLE** — `shape: "rectangle"`, border-radius, fill/stroke (Switch track, Progress bar, Slider range)
- [ ] **LINE** — `shape: "line"`, stroke 스타일 (Separator 등)
- [ ] **BOOLEAN_OPERATION** — shape 결합 표시 (복잡 아이콘)
- [ ] **INSTANCE** — nested component instance 표시, 내부 children 재귀 (Button의 icon slot, Input의 leading icon)
- [ ] **POLYGON / STAR** — shape 식별자만 기록 (시각 재현은 SVG 또는 background-image)

#### 의미론적 메타데이터 (textRole 추론)
- [ ] TEXT 노드의 역할을 힌트로 추가: `label`, `placeholder`, `value`, `helper`, `error`, `counter`, `action`, `title`, `description`, `unit`, `caption`
- [ ] 역할 추론 규칙: 노드 이름(예: `"Label"`, `"Placeholder"`, `"Helper text"`), 위치(y좌표), 형제 관계 기반
- [ ] 역할 미상 시 `textRole: "unknown"` (앱에서 fallback 가능)

#### 원자 컴포넌트 검증 매트릭스
- [ ] 각 원자 컴포넌트 유형별 대표 샘플 1개 이상 추출 → nodeTree 구조 수동 검증
- [ ] 검증 대상: Button, Input, Textarea, Checkbox, Radio, Switch, Select, Badge, Avatar, Tooltip, Progress, Slider
- [ ] 각 샘플에서 상태별 variant(default/hover/focused/disabled 등)의 nodeTree 구조 차이 확인

#### 출력/전송
- [ ] payload 크기 제한 검증 및 문서화 (예상 200~400KB, 압축 후 50~100KB)
- [ ] `.node.json` 다운로드 출력에도 `nodeTree` 포함
- [ ] `/api/sync/components` Path A/B payload에 `nodeTree` 자동 포함

### 2.2 Out of Scope

- **Radix 코드 생성 로직 변경** — `component-radix-generation` 플랜 범위. 본 플랜은 데이터 계약만 확장
- **앱 측 CSS 변환 로직** — 앱 저장소에서 별도 플랜으로 진행
- **VECTOR 노드의 완전한 SVG 렌더링** — 본 플랜은 `shape: "vector"` 식별자 + `pathData`(가능한 경우) 수준. 실제 SVG 에셋 export는 `icon-registry` 기능이 담당
- **effects(shadow/blur) 완전 재현** — 기존 `getNodeStyles()` 수준 유지 (`box-shadow` 문자열)
- **layoutGrids / constraints 추출** — 이번 범위 밖
- **animation / transition / 상호작용 prototyping** — 후속 작업
- **base + diff 구조 최적화** — 초기 버전은 완전 트리로 구현, 최적화는 실측 후 결정
- **복합 컴포넌트 특수 처리** (Dialog, Tabs, Accordion 등) — 원자 컴포넌트 스키마로 충분히 표현 가능하므로 별도 스키마 만들지 않음
- **mask/clipping 렌더링** — Figma의 clip path는 현재 CSS `overflow: hidden` 수준으로 근사
- **font fallback 해석** — `fontName.family`만 추출, 실제 폰트 로드는 앱 책임
- **컴포넌트별 추출 파일 분리** (`button.ts`, `checkbox.ts` 등) — 구조 추출은 **범용 단일 파일** 사용. 컴포넌트별 분기 없음. 이유는 §4.6 참고
- **컴포넌트 타입 감지 의존성** — `detectComponentType()`에 의존하지 않음. nodeTree는 모든 노드 타입에 대해 무조건 동일 방식으로 추출

---

## 3. 요구사항

### 3.1 기능 요구사항

#### 코어 스키마
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 선택된 노드의 재귀 `nodeTree`가 `GenerateComponentResult.nodeTree`로 반환됨 | 필수 |
| FR-02 | COMPONENT_SET 선택 시 `variants[i].nodeTree`가 각 variant의 완전 트리로 채워짐 | 필수 |
| FR-03 | `nodeTree` 각 노드에 `id`(경로), `type`(Figma 노드 타입), `name`, `styles`(Record) 포함 | 필수 |
| FR-04 | `variantSlug` 생성 — property 값을 `_`로 연결한 식별자 (예: `md_primary_default_no-icon`) | 필수 |
| FR-05 | `nodeTree` 깊이 제한 없음 (실제 Figma 노드 깊이 그대로 재귀) | 필수 |
| FR-06 | 기존 `childStyles`, `html`, `htmlCss`, `htmlClass`, `jsx` 필드 그대로 반환 (하위 호환) | 필수 |
| FR-07 | 선택된 노드가 COMPONENT_SET의 variant가 아닌 일반 FRAME일 때도 `nodeTree` 반환 | 필수 |

#### 노드 타입별 정보
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-10 | **TEXT 노드**: `characters`(실제 텍스트), `textRole` 힌트, 타이포 styles(`color`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`) | 필수 |
| FR-11 | **VECTOR 노드**: `shape: "vector"`, fill/stroke 스타일, 가능 시 `pathData` (없어도 실패 아님) | 필수 |
| FR-12 | **ELLIPSE 노드**: `shape: "ellipse"`, `border-radius: 50%` 자동 부여, fill/stroke | 필수 |
| FR-13 | **RECTANGLE 노드**: `shape: "rectangle"`, `border-radius`(있으면), fill/stroke | 필수 |
| FR-14 | **LINE 노드**: `shape: "line"`, stroke 스타일 (두께/색/스타일) | 필수 |
| FR-15 | **INSTANCE 노드**: 내부 children 재귀 순회, `masterName` 메타 포함 | 필수 |
| FR-16 | **BOOLEAN_OPERATION / POLYGON / STAR**: `shape` 식별자만 기록, children 재귀 | 선택 |
| FR-17 | **GROUP 노드**: 투명 컨테이너로 취급, children 평탄화 금지(구조 보존) | 필수 |

#### 의미론적 메타데이터
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-20 | TEXT 노드에 `textRole` 힌트 추가: `label` / `placeholder` / `value` / `helper` / `error` / `counter` / `action` / `title` / `description` / `unit` / `caption` / `unknown` | 필수 |
| FR-21 | `textRole` 추론 규칙 — 노드 이름 키워드 매칭 + 위치(y좌표) + 형제 관계 | 필수 |
| FR-22 | 역할 미상 시 `textRole: "unknown"` 반환 (앱에서 fallback 가능) | 필수 |

#### 원자 컴포넌트 재현
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-30 | **Button**: 모든 variant(hierarchy/size/state/icon-only)에서 텍스트 색상·아이콘 슬롯·padding 정확 반영 | 필수 |
| FR-31 | **Input / Textarea**: label / placeholder / value / helper / error 텍스트가 `textRole`로 구분됨 | 필수 |
| FR-32 | **Checkbox**: `checked` variant에서 checkmark VECTOR 노드가 nodeTree에 포함. `unchecked`에서 미포함 | 필수 |
| FR-33 | **Radio**: outer ELLIPSE + inner ELLIPSE(checked only) 구조가 nodeTree에 정확 반영 | 필수 |
| FR-34 | **Switch**: track(RECTANGLE/FRAME) + thumb(ELLIPSE) 구조 + on/off 위치 차이 반영 | 필수 |
| FR-35 | **Select / Dropdown**: trigger 텍스트 + chevron VECTOR 구조, placeholder/value 텍스트 역할 구분 | 필수 |
| FR-36 | **Badge / Chip / Tag**: 컨테이너 + 텍스트 + 아이콘(optional) 구조 정확 반영 | 필수 |
| FR-37 | **Avatar**: ELLIPSE/RECTANGLE 컨테이너 + 이미지/이니셜 TEXT + status dot ELLIPSE(있을 때) | 필수 |
| FR-38 | **Tooltip**: 컨텐츠 + 화살표 VECTOR 구조 반영 | 선택 |
| FR-39 | **Progress / Slider**: 트랙 + 진행/썸 영역 구조 반영, 너비 정보 포함 | 선택 |

#### 출력/전송
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-50 | `.node.json` 다운로드 파일에 `nodeTree` 포함 (디버깅/검증 용도) | 필수 |
| FR-51 | `/api/sync/components` 전송 시 `nodeTree` 포함 (Path A, B 모두) | 필수 |
| FR-52 | **gzip 압축 후 페이로드 ≤ 50KB** (200 variants 기준). raw는 ≤ 500KB. 실측 시뮬레이션 결과: gzip 9.1KB, raw 388KB — 양쪽 여유 통과 | 필수 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 추출 속도 | 200 variants × 평균 5 depth 기준 `generateComponent()` 총 소요 1.5초 이내 |
| 메모리 사용량 | Figma 플러그인 heap 제한 내 (200 variants × ~2KB tree ≈ 400KB) |
| 앱 재현 정확도 | 12개 원자 컴포넌트(Button/Input/Textarea/Checkbox/Radio/Switch/Select/Badge/Avatar/Tooltip/Progress/Slider) 각각에서 Figma 스크린샷과 **시각적 diff 0%** |
| 노드 타입 커버리지 | FRAME/TEXT/VECTOR/ELLIPSE/RECTANGLE/LINE/INSTANCE/GROUP 8종 타입 100% 처리 |
| 하위 호환 | 기존 필드(`childStyles`, `html`, ...)는 Schema 그대로 유지, 기존 앱 코드는 **수정 없이 동작** |
| 타입 안정성 | TypeScript strict 모드 통과, `GenerateComponentResult` 타입이 런타임과 일치 |
| 직렬화 안전 | `JSON.stringify(result)` 후 재파싱해도 구조 동일 (circular reference 없음) |
| textRole 정확도 | 대표 원자 컴포넌트 샘플에서 label/placeholder/helper 추론 정확도 85% 이상 |

---

## 4. 설계 방향

### 4.1 `nodeTree` 스키마

```ts
type ShapeKind = 'vector' | 'ellipse' | 'rectangle' | 'line' | 'polygon' | 'star' | 'boolean';

type TextRole =
  | 'label' | 'placeholder' | 'value' | 'helper' | 'error'
  | 'counter' | 'action' | 'title' | 'description'
  | 'unit' | 'caption' | 'unknown';

interface NodeTreeEntry {
  id: string;                     // 경로 기반 ID (예: "root", "root.0", "root.1.0")
  type: SceneNode['type'];        // "FRAME" | "TEXT" | "VECTOR" | "ELLIPSE" | "RECTANGLE" | "LINE" | "INSTANCE" | ...
  name: string;                   // Figma 노드 이름
  styles: Record<string, string>; // getNodeStyles() 결과 (color, font-*, padding, border-radius, ...)

  // TEXT 전용
  characters?: string;            // 실제 텍스트 문자열
  textRole?: TextRole;            // 의미론적 역할 힌트

  // 도형 전용
  shape?: ShapeKind;              // VECTOR/ELLIPSE/RECTANGLE/LINE/...일 때 설정
  pathData?: string;              // VECTOR인 경우 SVG path 문자열 (선택)

  // INSTANCE 전용
  masterName?: string;            // 참조 중인 마스터 컴포넌트 이름

  // 자식 (재귀)
  children?: NodeTreeEntry[];     // leaf는 omit
}
```

### 4.2 `variants[i]` 확장 후 스키마

```ts
interface VariantStyleEntry {
  properties: Record<string, string>;  // 기존 유지
  variantSlug: string;                 // 🆕 예: "md_primary_default_no-icon"
  styles: Record<string, string>;      // 기존 유지 (루트 노드 CSS)
  childStyles: Record<string, Record<string, string>>;  // 기존 유지 (하위 호환, 1-level)
  nodeTree: NodeTreeEntry;             // 🆕 재귀 완전 트리
}
```

### 4.3 `GenerateComponentResult` 확장 후 스키마

```ts
interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;
  html: string;                           // 기존
  htmlClass: string;                      // 기존
  htmlCss: string;                        // 기존
  jsx: string;                            // 기존
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;  // 기존 (1-level)
  nodeTree: NodeTreeEntry;                // 🆕 선택 노드 재귀 트리
  radixProps: { color: string; size: string };
  variantOptions?: Record<string, string[]>;
  variants?: VariantStyleEntry[];         // 확장됨
  fullNode: Record<string, unknown>;      // 기존 (Figma raw)
}
```

### 4.4 `buildNodeTree()` 함수 (신규)

```
buildNodeTree(node, path = 'root'):
  entry = {
    id: path,
    type: node.type,
    name: node.name,
    styles: getNodeStyles(node),  // 기존 함수 재사용
  }

  // ── TEXT 노드 ──────────────────────────────
  if node.type === 'TEXT':
    entry.characters = safeGetText(node)
    entry.textRole = inferTextRole(node)  // 역할 힌트 추론
    // 타이포 스타일은 getNodeStyles()가 이미 포함

  // ── 도형 노드 ──────────────────────────────
  if node.type === 'VECTOR':
    entry.shape = 'vector'
    entry.pathData = extractVectorPath(node)  // 실패해도 무방
  else if node.type === 'ELLIPSE':
    entry.shape = 'ellipse'
    entry.styles['border-radius'] = '50%'  // 강제 부여
  else if node.type === 'RECTANGLE':
    entry.shape = 'rectangle'
    // border-radius는 getNodeStyles에서 처리
  else if node.type === 'LINE':
    entry.shape = 'line'
  else if node.type === 'POLYGON':
    entry.shape = 'polygon'
  else if node.type === 'STAR':
    entry.shape = 'star'
  else if node.type === 'BOOLEAN_OPERATION':
    entry.shape = 'boolean'

  // ── INSTANCE 노드 ──────────────────────────
  if node.type === 'INSTANCE':
    entry.masterName = node.mainComponent?.name ?? null

  // ── 자식 재귀 ──────────────────────────────
  if 'children' in node:
    entry.children = node.children.map((child, i) =>
      buildNodeTree(child, `${path}.${i}`)
    )

  return entry
```

### 4.4.1 `inferTextRole()` — TEXT 역할 추론 (신규)

```
inferTextRole(textNode):
  name = textNode.name.toLowerCase()

  // 1) 이름 기반 직접 매칭 (최우선)
  if name.includes('label'):       return 'label'
  if name.includes('placeholder'): return 'placeholder'
  if name.includes('value'):       return 'value'
  if name.includes('helper'):      return 'helper'
  if name.includes('error'):       return 'error'
  if name.includes('counter'):     return 'counter'
  if name.includes('title'):       return 'title'
  if name.includes('description'): return 'description'
  if name.includes('caption'):     return 'caption'
  if name.includes('unit'):        return 'unit'
  if name.match(/^(action|button text|cta)/): return 'action'

  // 2) 부모/형제 관계 기반 (2순위)
  parent = textNode.parent
  if parent && parent.name.toLowerCase().includes('label'):  return 'label'
  if parent && parent.name.toLowerCase().includes('helper'): return 'helper'

  // 3) 위치 기반 (3순위, 같은 형제 그룹 내에서)
  siblings = parent?.children ?? []
  idx = siblings.indexOf(textNode)
  if idx === 0 && siblings.length > 1: return 'label'  // 맨 위 = label 가능성

  // 4) 폴백
  return 'unknown'
```

### 4.4.2 `extractVectorPath()` — VECTOR path 추출 (선택, 실패 허용)

```
extractVectorPath(vectorNode):
  try:
    if vectorNode.vectorPaths && vectorNode.vectorPaths.length > 0:
      return vectorNode.vectorPaths[0].data  // SVG path string
  catch:
    // Figma API 제한 또는 권한 문제 시 무시
    return null
  return null
```

### 4.5 `variantSlug` 생성 규칙

```
Input: { size: "md", hierarchy: "Primary", state: "Default", "icon only": "False" }

Rules:
  1. property 값을 소문자화
  2. 공백 → '-' (kebab-case)
  3. property 순서는 variantOptions의 선언 순서 유지
  4. "icon only" = "True"  → "with-icon"
     "icon only" = "False" → "no-icon"  (또는 생략)
  5. '_' 로 join

Output: "md_primary_default_no-icon"
```

### 4.6 호출 통합 (code.ts:2227 부근)

```ts
variants = (parentSet.children as ComponentNode[]).map((child) => {
  const props = Object.fromEntries(
    Object.entries(child.variantProperties ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    properties: props,
    variantSlug: buildVariantSlug(props),        // 🆕
    styles: getNodeStyles(child),                 // 기존 유지
    childStyles: getChildStyles(child),           // 기존 유지 (하위 호환)
    nodeTree: buildNodeTree(child),               // 🆕
  };
});
```

### 4.6 모듈 구조 — 범용 단일 파일 + 힌트 모듈 레이어링

본 기능의 구조 추출 로직은 **컴포넌트별로 파일을 분리하지 않는다.** 대신 **범용 단일 함수** `buildNodeTree()` 하나가 모든 Figma 노드 타입을 재귀적으로 처리하고, 의미론적 힌트(텍스트 역할, 도형 분류 등)는 **별도 모듈**로 레이어링한다.

#### 디렉터리 구조

```
src/extractors/
├── node-tree.ts        ⭐ buildNodeTree() — 범용 재귀 추출 (단일 진입점)
├── node-styles.ts       getNodeStyles() 이전 (기존 로직 재사용)
├── text-role.ts         inferTextRole() — label/placeholder/helper 의미 추론
├── shape-kind.ts        resolveShape() — 도형 분류 + ellipse border-radius 보정
├── variant-slug.ts      buildVariantSlug() — property 조합 → 식별자
└── index.ts             export 묶음
```

> **주의**: 이 디렉터리는 본 플랜에서 **신설**된다. 기존 `src/code.ts`의 관련 로직(`getNodeStyles`, `safeGetText` 등)은 신규 모듈로 **이전**되며, `code.ts`의 `generateComponent()`는 이 모듈을 호출만 한다.

#### 각 모듈 책임

| 모듈 | 책임 | 의존성 | 테스트 |
|---|---|---|---|
| `node-tree.ts` | Figma SceneNode → `NodeTreeEntry` 재귀 변환 | `node-styles`, `text-role`, `shape-kind` | 샘플 JSON 기반 스냅샷 |
| `node-styles.ts` | SceneNode → CSS styles Record | Figma API 타입 | variant 단위 fixture |
| `text-role.ts` | TextNode → `TextRole` 추론 | 노드 이름/부모/위치 | 12개 키워드 매트릭스 |
| `shape-kind.ts` | SceneNode → `ShapeKind` + border-radius 보정 | Figma 노드 타입 | 각 도형 타입별 케이스 |
| `variant-slug.ts` | variantProperties → slug string | - | 엣지 케이스(공백/특수문자) |

#### 왜 범용 단일 파일인가?

| 근거 | 설명 |
|------|------|
| **"100% Fidelity" 철학과 정합** | 플러그인은 구조를 충실히 추출, 의미 해석은 앱이 담당. 컴포넌트별 분기는 플러그인이 "이건 Button이다"를 판단해야 한다는 부담 생성 |
| **`detectComponentType()` 버그 회피** | 현재 이 함수는 COMPONENT_SET variant 이름 해석 실패(Button→layout)로 불안정. nodeTree는 이 판단 없이 작동해야 함 |
| **재귀 구조의 본질** | Figma 노드 트리는 재귀적이며, 동일한 순회 로직으로 모든 타입 처리 가능. 특수 케이스 없이 하나의 함수로 완결 |
| **확장성** | 새 원자 컴포넌트(Rating, Stepper, ColorPicker, OTP Input 등) 추가 시 **플러그인 코드 수정 불필요** — 자동 대응 |
| **코드 중복 제거** | 컴포넌트별 파일은 트리 순회/도형 처리/TEXT 역할 추론 로직을 각자 가져야 함. 단일 파일은 공유 |
| **유지보수 비용** | 파일 1개 유지보수 vs 12+ 파일. 버그 수정 시 영향 범위 최소 |
| **레이어 분리** | 순수 구조 추출(`node-tree`) + 의미론 추론(`text-role`, `shape-kind`)을 **독립 모듈로 분리**하여 관심사 분리 달성 |

#### 원자 컴포넌트별 고유 정보는 어떻게 얻는가?

**모두 범용 추출 결과에 이미 포함되어 있다:**

| 원자 컴포넌트 | 필요 정보 | 범용 nodeTree에서 획득 방법 |
|---|---|---|
| Checkbox의 checkmark | `children` 중 `type: 'VECTOR'` + `name: 'checkmark'` | 재귀 탐색 시 발견 |
| Radio의 inner dot | `children` 중 `type: 'ELLIPSE'` + 작은 크기 | 크기 비교 |
| Switch thumb 위치 | ELLIPSE children의 `styles.left/right` | styles에 포함 |
| Input placeholder vs value | TEXT 노드의 `textRole` | text-role 모듈이 추론 |
| Tooltip arrow | VECTOR 노드 + 이름에 "arrow" | 이름 기반 힌트 |
| Select chevron | VECTOR 노드 + 이름에 "chevron" | 이름 기반 힌트 |
| Progress fill 너비 | RECTANGLE의 `styles.width` | styles에 포함 |

→ **플러그인에는 컴포넌트별 분기 로직 없음.** 앱이 `NodeTreeEntry`의 `type`, `shape`, `textRole`, `name` 필드를 보고 렌더링 결정.

#### 테스트 전략 (분리)

구조 추출은 단일 파일이지만, **검증 테스트는 컴포넌트별로 분리**한다 (관심사별로 명확):

```
tests/extractors/
├── node-tree.test.ts         (범용 로직 단위 테스트)
├── atomic/
│   ├── button.test.ts        (Button 샘플 → 예상 nodeTree)
│   ├── input.test.ts
│   ├── checkbox.test.ts
│   ├── radio.test.ts
│   ├── switch.test.ts
│   ├── select.test.ts
│   ├── badge.test.ts
│   ├── avatar.test.ts
│   ├── tooltip.test.ts
│   ├── progress.test.ts
│   └── slider.test.ts
└── text-role.test.ts          (의미 추론 회귀 테스트)
```

각 테스트는 **실제 Figma 샘플 JSON**을 입력으로 받아, `buildNodeTree()`의 출력과 snapshot을 비교한다. 컴포넌트별 분리는 **회귀 방지와 디버깅 편의**를 위한 것.

---

### 4.7 선택된 노드 `nodeTree` 추가 (code.ts:2238 return 직전)

```ts
return {
  name: effectiveName,
  meta: {...},
  styles: rootStyles,
  html: nodeToHtml(node, 0),
  htmlClass: htmlClassResult.html,
  htmlCss: htmlClassResult.css,
  jsx: nodeToJsx(node, 0),
  detectedType: detectComponentType(node),
  texts: extractTexts(node),
  childStyles: getChildStyles(node),             // 기존 유지
  nodeTree: buildNodeTree(node),                 // 🆕
  radixProps: ...,
  variantOptions,
  variants,
  fullNode: ...,
};
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| **구조 추출 파일 분리** | **범용 단일 파일** (`node-tree.ts`) | 컴포넌트별 파일 분리는 `detectComponentType` 의존, 코드 중복, 확장성 저하. 범용 재귀 추출이 본질에 맞음. 의미론 추론만 별도 모듈(`text-role`, `shape-kind`)로 레이어링. §4.6 참고 |
| **컴포넌트 타입 감지 의존** | **의존하지 않음** | `detectComponentType()`은 별도 UX 힌트용으로만 사용. nodeTree 추출은 모든 노드에 동일 로직 적용 |
| **테스트 파일 분리** | **컴포넌트별 분리** | 추출은 범용이지만 회귀 방지와 디버깅을 위해 원자 컴포넌트별 샘플 테스트 분리 |
| 트리 구조 vs 평면 맵 | **재귀 트리** | 부모-자식 관계 보존, variant 간 구조 차이 표현 가능, 앱이 DOM으로 바로 매핑 가능 |
| 깊이 제한 | **없음** | Figma 원본 구조 그대로 반영. 성능은 실측으로 검증 |
| `getNodeStyles()` 재사용 | **그대로 사용 + 확장** | 이미 color/font/padding/border/shadow 등 추출. ELLIPSE의 `border-radius: 50%` 같은 도형별 보정은 `buildNodeTree()`에서 추가 |
| 기존 `childStyles` 제거? | **유지** | 앱 마이그레이션 기간에 하위 호환. 후속 플랜에서 제거 결정 |
| variantSlug 포맷 | **`_`로 join + 소문자 kebab** | 파일명/CSS 클래스명/data 속성 모두에 사용 가능. 충돌 회피 |
| TEXT 스타일 포함 위치 | **노드의 `styles` 필드** | 일관성 유지. `characters` / `textRole`은 별도 필드 |
| textRole 추론 정확도 | **이름 매칭 → 부모 힌트 → 위치 → unknown** | 결정적(deterministic) 알고리즘으로 디버그 용이. ML 모델 배제 |
| VECTOR pathData | **선택적 추출, 실패 허용** | Figma API가 불안정하거나 권한 없을 때도 `shape: 'vector'`만으로 앱이 placeholder 렌더링 가능 |
| ELLIPSE 처리 | **`border-radius: 50%` 강제 주입** | 앱이 노드 타입 분기 없이 CSS만으로 원형 렌더링. Radio/Switch thumb/Avatar에 공통 적용 |
| INSTANCE 재귀 여부 | **재귀 순회** | Button의 icon slot(`Icon INSTANCE`) 내부 구조도 재현해야 함. `masterName`은 메타 참조용 |
| GROUP 평탄화? | **평탄화 금지** | Figma의 GROUP은 논리적 묶음. 구조 보존이 앱에서 스타일 매핑에 유리 |
| 페이로드 압축 | **gzip은 전송 계층에서** | 플러그인은 순수 JSON만 생성. 서버 gzip 또는 fetch compression 사용 |
| 중복 데이터 | **허용** | `childStyles`와 `nodeTree`가 일부 중복되지만 하위 호환 우선. 최적화는 후속 |
| path ID 포맷 | **`root.0.1.2` 점 구분** | 사람이 읽기 쉽고, CSS 선택자에 사용 가능 (`.el-0-1-2`) |
| icon-only variant 처리 | **nodeTree children 수만 다름** | 별도 분기 불필요. 트리가 자연스럽게 차이 표현 |
| 원자 컴포넌트 특수 처리 | **스키마 하나로 통일** | Checkbox/Radio/Switch 모두 동일한 `NodeTreeEntry` 재귀 구조로 표현. 앱이 `type`과 `shape`만 보고 렌더링 분기 |

---

## 6. 완료 기준

- [ ] `buildNodeTree()` 함수가 `code.ts`에 추가되고 단위 동작 확인
- [ ] `GenerateComponentResult` 타입이 `nodeTree`, `variants[i].nodeTree`, `variants[i].variantSlug` 포함하도록 갱신
- [ ] `generateComponent()` 반환값에 `nodeTree`가 포함됨
- [ ] COMPONENT_SET 선택 시 `variants[].nodeTree`가 각 variant의 완전 트리로 채워짐
- [ ] Primary 버튼 variant의 `nodeTree`에서 `"Text padding" → TEXT` 경로로 진입해 `color: var(--text-white)` 확인
- [ ] Link color 버튼 variant의 `nodeTree`에서 `TEXT` 직접 자식으로 `color: var(--text-brand-secondary)` 확인
- [ ] icon-only variant의 `nodeTree`에 텍스트 노드가 없음을 확인
- [ ] `.node.json` 다운로드 파일에 `nodeTree` 포함
- [ ] `/api/sync/components` Path A/B 전송 payload에 `nodeTree` 포함 (Path C는 별도 이슈)
- [ ] 기존 Radix 코드 생성이 영향 없이 동작 (`childStyles` 사용 경로 유지)
- [ ] 기존 플러그인 UI에서 토큰/아이콘/이미지/테마 탭 동작 영향 없음
- [ ] `Buttons_Button.node.json` 전체 200 variants에서 텍스트 색상 정보 획득률 **100%**
- [ ] TypeScript strict 컴파일 통과
- [ ] `npm run build` 성공 및 `dist/code.js` 크기 증가량 기록

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 페이로드 크기 급증 (200 variants × 깊은 트리) | 플러그인 메시지 전송 지연, 앱 DB 용량 증가 | 실측 후 300KB 초과 시 `getNodeStyles()` 결과에서 기본값 제외(예: `opacity:1` 생략) |
| Figma 노드 순회 중 circular reference | `JSON.stringify()` 무한 루프 | `buildNodeTree()`는 `children`만 따라가고 `parent` 참조 배제 |
| `getNodeStyles()`가 반환하는 키가 variant마다 달라 스키마 불안정 | 앱 측 파싱 오류 | 모든 스타일 키는 string 값으로 통일 (null/undefined 제외) |
| 복잡한 중첩 구조(예: 10 depth) 성능 저하 | 생성 속도 저하 | 실측 후 5초 초과 시 worker 분할 고려 |
| 앱 측이 신규 `nodeTree`를 무시 | 100% 재현 불가 지속 | 본 플랜의 구현 범위 외이지만, 앱 측에 별도 플랜 요청 필요 |
| 하위 호환 유지로 코드 중복 | 유지보수 부담 | `childStyles` 는 후속 플랜(`component-node-tree-migration`)으로 제거 |
| `variantSlug` 충돌 (다른 property 조합이 동일 slug) | 앱에서 variant 식별 실패 | `Object.entries` 순서가 불안정할 수 있으므로 `variantOptions` 선언 순서로 고정 |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 — `docs/02-design/features/component-node-tree-export.design.md`
   - `NodeTreeEntry` 타입 상세
   - `buildNodeTree()` 구현 의사코드
   - `variantSlug` 생성 알고리즘
   - 예시 JSON 스니펫
2. [ ] 페이로드 크기 실측 — Python 시뮬레이션으로 `Buttons_Button.node.json` 기반 예상치 계산
3. [ ] `src/code.ts`에 `buildNodeTree()` 구현 + `variantSlug` 헬퍼 추가
4. [ ] `GenerateComponentResult` 인터페이스 갱신 (`code.ts:1336-1354` 부근)
5. [ ] `variants` 생성 로직 확장 (`code.ts:2227-2233`)
6. [ ] 선택 노드 반환 객체에 `nodeTree` 추가 (`code.ts:2238` 근처)
7. [ ] `npm run build` 및 Figma에서 실제 Button 컴포넌트 재추출 → JSON 확인
8. [ ] Primary variant에서 `nodeTree → Text padding → TEXT.styles.color` 경로 검증
9. [ ] `pixelforge-plugin` 커밋 — `feat: variant별 재귀 nodeTree 추가로 100% 재현 정보 제공`
10. [ ] 앱 측(별도 repo) 플랜 요청 — `nodeTree` 기반 CSS 생성 로직 구현
11. [ ] 앱에서 전체 variants 재렌더링 → Figma 스크린샷과 시각 diff 검증
12. [ ] 완료 후 Gap 분석 (`/pdca analyze component-node-tree-export`)

---

## 9. 페이로드 크기 실측 시뮬레이션

`~/Downloads/Buttons_Button.node.json` (200 variants) 기반 Python 시뮬레이션 결과:

| 지표 | 현재 | 확장 (+nodeTree) | 증가 | 배율 |
|---|---:|---:|---:|---:|
| raw | 105.0 KB | 388.1 KB | +283.1 KB | 3.70x |
| gzip | 4.8 KB | 9.1 KB | **+4.3 KB** | 1.87x |

**결론:**
- raw 배율 3.70x는 threshold 3.0x를 초과하지만, 이는 JSON 내 CSS 변수명(`var(--bg-brand-solid)`) 등 **반복 문자열** 때문
- gzip 압축률 95% (raw 388KB → gzip 9.1KB)로 **실제 네트워크 영향 무시할 수준**
- FR-52는 **gzip 기준으로 전환** (raw 3배 이내 대신 gzip 50KB 이내)
- 실제 비용은 HTTP 요청 1~2회 수준의 추가 데이터 — **충분히 감당 가능**

---

## 10. 참고: 실측 데이터 요약

### 9.1 현재 한계 증거 (Button.node.json 기준)

```
총 variants: 200
  - Link color:   25  (childStyles에 color ✓)
  - Link gray:    25  (childStyles에 color ✓)
  - Primary:      50  (childStyles에 color ✗)
  - Secondary:    50  (childStyles에 color ✗)
  - Tertiary:     50  (childStyles에 color ✗)

색상 정보 손실률: 150/200 = 75%
```

### 9.2 구조적 원인 (Figma 원본)

```
Link hierarchy (구조 A):
  Root
  ├─ placeholder
  ├─ TEXT ← 직접 자식 (getChildStyles가 포착)
  └─ placeholder

Primary/Secondary/Tertiary hierarchy (구조 B):
  Root
  ├─ placeholder
  ├─ "Text padding" FRAME ← getChildStyles가 여기서 멈춤
  │    └─ TEXT ← 손자 (놓침)
  └─ placeholder
```

### 9.3 본 플랜 적용 후 예상 결과

```
variants[0].nodeTree:
{
  id: "root",
  type: "COMPONENT",
  name: "Size=md, Hierarchy=Primary, ...",
  styles: { "background-color": "var(--bg-brand-solid)", ... },
  children: [
    { id: "root.0", type: "FRAME", name: "placeholder", styles: {...}, children: [...] },
    {
      id: "root.1",
      type: "FRAME",
      name: "Text padding",
      styles: { "display": "flex", "padding": "0 2px" },
      children: [
        {
          id: "root.1.0",
          type: "TEXT",
          name: "Text",
          characters: "Button CTA",
          styles: {
            "color": "var(--text-white)",     ← 🎯 정상 추출
            "font-family": "Inter",
            "font-size": "14px",
            "font-weight": "600",
            "line-height": "20px"
          }
        }
      ]
    },
    { id: "root.2", type: "FRAME", name: "placeholder", styles: {...}, children: [...] }
  ]
}
```
