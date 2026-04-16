# Figma Design Tokens Convention Guide

_PixelForge 플러그인과 협업하기 위한 Figma 토큰 정의 가이드_

> **범용성 안내**: 이 가이드는 PixelForge 팀의 권장 컨벤션입니다.
> 플러그인은 Untitled UI PRO 등 외부 라이브러리도 추출 가능하도록 설계되어 있으나,
> 이 컨벤션을 따를 때 가장 정확한 분류와 완전한 추출을 보장합니다.

---

## 📌 기본 원칙

- **플랫폼**: Figma Variables (내장 기능, 설치 불필요) + Text Styles (타이포그래피)
- **위치**: Assets panel → Variables / Text Styles 섹션
- **네이밍**: `kebab-case` (모두 소문자, 하이픈으로 단어 구분)
- **구조**: `category/subcategory/state` 또는 `category/value`
- **변수 유형**: Color, Number, String, Boolean 등 타입 지정

### 컬렉션 명명 규칙 (중요)

플러그인은 **컬렉션 이름**을 기준으로 토큰 타입을 분류합니다. 아래 규칙을 따르세요:

| 토큰 타입 | 컬렉션 이름 예시 | 인식 키워드 (정규식 기반) |
|----------|----------------|------------------------|
| Spacing | `Spacing`, `Space`, `Gap`, `Padding` | `spacing`, `space`, `gap`, `padding`, `margin`, `gutter`, `inset`, `distance` |
| Radius | `Radius`, `Border Radius`, `Rounded` | `radius`, `corner`, `rounded`, `border-radius` |
| Typography Variables | `Typography`, `Font`, `Type Scale` | `typograph`, `font`, `type` |
| Color | 컬렉션 타입이 Color면 자동 인식 | — |
| 기타 (extra-vars) | 위 규칙에 해당 없는 컬렉션 | — |

> ⚠️ **주의**: 타이포그래피 Variables를 "Design Tokens"처럼 범용 컬렉션에 넣으면
> 플러그인이 typography로 분류하지 못합니다. 반드시 별도 컬렉션으로 분리하세요.

---

## 🎨 토큰 타입별 네이밍 규칙

토큰은 플러그인 지원 수준에 따라 **두 단계**로 나뉩니다:

| 단계 | 설명 | 토큰 타입 |
|------|------|----------|
| **Tier 1** — 자동 분류 | 플러그인이 컬렉션 이름/타입으로 자동 분류 | Color, Spacing, Radius, Typography, Shadow, Blur |
| **Tier 2** — 네이밍 권장 | 네이밍 컨벤션만 제공. 플러그인은 **extra-vars**로 분류 | Border, Opacity, Duration, Z-Index, Font-Family, Line-Height, Letter-Spacing, Gradient, Transition, Aspect-Ratio, Text-Transform, Backdrop-Filter, Stroke |

> Tier 2 토큰은 별도 컬렉션(예: "Motion", "Layout")에 정의하면 extra-vars로 깔끔하게 그룹핑됩니다.
> 향후 플러그인 업데이트로 Tier 1 승격이 예정되어 있습니다.

---

### Tier 1 — 자동 분류 토큰

### 1️⃣ 색상 (Color)

```
color/{category}/{state}

✅ 예시:
  - color/primary/default
  - color/primary/hover
  - color/primary/active
  - color/secondary/disabled
  - color/background/light
  - color/text/primary
  - color/text/muted
  - color/border/divider
  - color/alert/error
  - color/alert/warning
  - color/alert/success

❌ 금지: colors, color_primary, primary-color, c-primary
```

### 2️⃣ 간격 (Spacing + Gap)

```
spacing/{size}
gap/{size}        ← spacing으로 통합 분류됨

✅ 예시:
  - spacing/xs (4px)
  - spacing/sm (8px)
  - spacing/md (12px)
  - spacing/lg (16px)
  - spacing/xl (24px)
  - spacing/2xl (32px)
  - gap/xs (4px)
  - gap/sm (8px)
  - gap/md (16px)

❌ 금지: space/small, spacing-4, margin/small, flex-gap/sm
```

> **Gap과 Spacing의 관계**: `gap/*` 변수는 플러그인에서 `spacing` 타입으로 통합 분류됩니다.
> 컬렉션 이름에 `gap` 키워드가 있어도 spacing으로 처리되며, CSS 출력 시 동일한 `:root` 변수로 생성됩니다.
> Figma에서 의미 구분이 필요하면 같은 컬렉션 내에서 그룹 폴더로 분리하세요.

### 3️⃣ 반경 (Radius)

```
radius/{type}

✅ 예시:
  - radius/none
  - radius/sm (2px)
  - radius/md (4px)
  - radius/lg (8px)
  - radius/xl (12px)
  - radius/full (9999px)

❌ 금지: corner/small, border-radius/md
```

### 4️⃣ 타이포그래피 (Typography)

타이포그래피는 **Text Styles** (주요 스타일) + **Variables** (원시값) 두 가지로 관리합니다.

#### Text Styles (Figma Assets → Text Styles)

텍스트 컴포넌트에 직접 적용하는 스타일. 이름 패턴:

```
{role} {size}/{weight}

✅ 예시 (body):
  - Text xs/Regular
  - Text sm/Medium
  - Text md/Semibold
  - Text lg/Bold

✅ 예시 (display/heading):
  - Display 2xl/Semibold
  - Display xl/Bold
  - Heading md/Semibold

❌ 금지: text-large, body-bold, font/sans/bold
```

> Display, Heading, Title, H1~H6 키워드가 포함된 스타일은 자동으로 `display` 카테고리로 분류됩니다.

#### Typography Variables (컬렉션 이름: "Typography" 또는 "Font")

폰트 크기, 줄높이, 패밀리 등의 원시값 Variables:

```
font-size/{scale}       → Number
line-height/{scale}     → Number
font-family/{role}      → String
font-weight/{role}      → String (예: "Semibold")

✅ 예시:
  - font-size/text-xs (12)
  - font-size/text-sm (14)
  - line-height/text-xs (18)
  - font-family/body ("Pretendard")
  - font-family/display ("Pretendard")
  - font-weight/regular ("Regular")
  - font-weight/semibold ("Semibold")

❌ 금지: typography/sans/bold/md (Variables에 슬래시 depth 3+ 금지)
```

### 5️⃣ 그림자 (Shadow)

```
shadow/{elevation}

✅ 예시:
  - shadow/sm
  - shadow/md
  - shadow/lg
  - shadow/none

❌ 금지: drop-shadow/small, box-shadow-md
```

---

### Tier 2 — 네이밍 권장 토큰 (extra-vars로 분류)

> 아래 토큰들은 플러그인에서 별도 분류하지 않습니다.
> 네이밍 컨벤션을 따르면 extra-vars 내에서 일관된 구조를 유지할 수 있습니다.
> 별도 컬렉션(예: "Motion", "Layout", "Border")에 넣으면 extra-vars 그룹명으로 활용됩니다.

### 6️⃣ 테두리 (Border)

```
border/{type}/{size}

✅ 예시:
  - border/solid/thin
  - border/solid/default
  - border/solid/thick
  - border/dashed/default
  - border/dotted/default

❌ 금지: stroke-width, border-style/solid
```

### 7️⃣ 투명도 (Opacity)

```
opacity/{level}

✅ 예시:
  - opacity/none (0%)
  - opacity/sm (25%)
  - opacity/md (50%)
  - opacity/lg (75%)
  - opacity/full (100%)

❌ 금지: transparency/light, alpha-50
```

### 8️⃣ 애니메이션 (Duration)

```
duration/{speed}

✅ 예시:
  - duration/fast (100ms)
  - duration/normal (200ms)
  - duration/slow (300ms)
  - duration/slower (500ms)

❌ 금지: transition-duration/fast, timing/ms
```

### 9️⃣ 레이어 깊이 (Z-Index)

```
z-index/{level}

✅ 예시:
  - z-index/base (0)
  - z-index/dropdown (100)
  - z-index/modal (1000)
  - z-index/tooltip (1100)
  - z-index/popover (1200)

❌ 금지: z/dropdown, layer-order
```

### 🔟 폰트 (Font-Family)

```
font-family/{name}

✅ 예시:
  - font-family/sans
  - font-family/serif
  - font-family/mono
  - font-family/system

❌ 금지: font/sans-serif, typeface/default
```

### 1️⃣1️⃣ 줄높이 (Line-Height)

```
line-height/{type}

✅ 예시:
  - line-height/tight (1.2)
  - line-height/normal (1.5)
  - line-height/relaxed (1.75)
  - line-height/loose (2)

❌ 금지: leading/tight, line-spacing/md
```

### 1️⃣2️⃣ 자간 (Letter-Spacing)

```
letter-spacing/{type}

✅ 예시:
  - letter-spacing/tight (-0.02em)
  - letter-spacing/normal (0)
  - letter-spacing/relaxed (0.05em)
  - letter-spacing/loose (0.1em)

❌ 금지: tracking/normal, char-spacing/md
```

### 1️⃣3️⃣ 그라디언트 (Gradient)

```
gradient/{direction}/{name}

✅ 예시:
  - gradient/vertical/brand
  - gradient/horizontal/sunset
  - gradient/diagonal/ocean
  - gradient/radial/glow

❌ 금지: linear-gradient/brand, bg-gradient/primary
```

### 1️⃣4️⃣ 블러 (Blur)

```
blur/{level}

✅ 예시:
  - blur/sm (4px)
  - blur/md (8px)
  - blur/lg (12px)
  - blur/xl (16px)

❌ 금지: filter-blur/small, backdrop/blur-md
```

### 1️⃣5️⃣ 전환 (Transition)

```
transition/{type}

✅ 예시:
  - transition/fast
  - transition/normal
  - transition/slow
  - transition/ease-in
  - transition/ease-out

❌ 금지: animation/transition-fast, timing/default
```

### 1️⃣5️⃣ 가로세로비 (Aspect-Ratio)

```
aspect-ratio/{ratio}

✅ 예시:
  - aspect-ratio/square (1/1)
  - aspect-ratio/video (16/9)
  - aspect-ratio/portrait (3/4)
  - aspect-ratio/thumbnail (4/3)

❌ 금지: ratio/16-9, proportions/square
```

### 1️⃣7️⃣ 대소문자 (Text-Transform)

```
text-transform/{style}

✅ 예시:
  - text-transform/uppercase
  - text-transform/lowercase
  - text-transform/capitalize
  - text-transform/none

❌ 금지: case/uppercase, text-case/upper
```

### 1️⃣8️⃣ 배경 필터 (Backdrop-Filter)

```
backdrop-filter/{effect}

✅ 예시:
  - backdrop-filter/blur
  - backdrop-filter/blur-light
  - backdrop-filter/blur-heavy
  - backdrop-filter/none

❌ 금지: filter/backdrop-blur, glass/effect
```

### 1️⃣9️⃣ 선 스타일 (Stroke)

```
stroke/{type}/{width}

✅ 예시:
  - stroke/solid/thin
  - stroke/solid/default
  - stroke/dashed/default
  - stroke/dotted/default
  - stroke/double/default

❌ 금지: line-style/solid, border-stroke/thin
```

---

## 🎯 Figma Variables 설정 방법

### Step 1: Assets Panel 열기

```
Figma 상단 메뉴
→ Assets (왼쪽 패널)
→ Variables (탭)
```

### Step 2: 변수 컬렉션 생성

```
+ Create variable set
  └ "Design Tokens" (이름)
     └ "Light" (Default mode - 라이트 테마)
     └ "Dark" (선택사항 - 다크 테마)
```

### Step 3: 변수 생성 예시 (색상)

```
Variable Name: color/primary/default
  Type: Color
  Value: #0066FF (or RGB)
  Mode: Light

Variable Name: color/primary/hover
  Type: Color
  Value: #0052CC
  Mode: Light
```

### Step 4: 레이아웃

```
Variables Panel (Assets → Variables)
├── Design Tokens (Collection)
│   ├── Light (Mode)
│   │   ├── color/brand/primary
│   │   ├── color/brand/secondary
│   │   ├── color/text/primary
│   │   ├── spacing/xs
│   │   ├── spacing/sm
│   │   └── ...
│   └── Dark (Mode - 선택사항)
│       ├── color/brand/primary
│       └── ...
└── (다른 컬렉션들)
```

### 컴포넌트에서 사용

```
Button 컴포넌트
└── Fill color → Variables 선택
    → "Design Tokens" / "Light"
    → "color/primary/default"
```

---

## ✅ 체크리스트

플러그인 추출 전에 확인:

**Tier 1 (자동 분류) 확인:**
- [ ] 색상 Variables: Color 타입, `color/{category}/{state}` 네이밍
- [ ] Spacing 컬렉션 이름에 키워드 포함 (`spacing`/`space`/`gap`/`padding`/`margin`/`gutter`/`inset`/`distance`)
- [ ] Radius 컬렉션 이름에 키워드 포함 (`radius`/`corner`/`rounded`/`border-radius`)
- [ ] Typography Variables 컬렉션 이름에 키워드 포함 (`typography`/`font`/`type`)
- [ ] 타이포그래피 스타일은 Figma Text Styles로 정의
- [ ] Shadow/Blur는 Figma Effect Styles로 정의

**Tier 2 (네이밍 권장) 확인:**
- [ ] Tier 2 토큰은 별도 컬렉션에 정의 (extra-vars 그룹명으로 활용)
- [ ] 컬렉션 이름을 용도별로 구분 (예: "Motion", "Layout", "Border")

**공통:**
- [ ] 모든 변수가 `kebab-case` 형식 (대문자, 언더스코어 금지)
- [ ] Mode: "Light" 필수, "Dark" 선택
- [ ] 모든 컴포넌트가 Variables/Styles 사용 (하드코딩 금지)

> Tier 1 컬렉션 이름 규칙을 지키지 않으면 해당 변수가 **extra-vars**로 분류됩니다.
> Tier 2 토큰은 의도적으로 extra-vars로 분류되므로, 컬렉션 이름을 의미 있게 지정하면 됩니다.

---

## 🔧 플러그인 동작

### PixelForge 플러그인이 하는 일:

```
1. Figma Variables + Text Styles 자동 감지
   → 모든 컬렉션의 Variables 읽기
   → 모든 Text Styles 읽기

2. 타입 자동 분류 (컬렉션 이름 + 변수 이름 기반)
   → Color Variables → colors
   → Spacing 컬렉션 Variables → spacing
   → Radius 컬렉션 Variables → radius
   → Typography/Font 컬렉션 Variables + Text Styles → typography
   → 그 외 Variables → extra-vars (컬렉션별 그룹)

3. 추출 및 전송
   → JSON/CSS 형식으로 export
   → PixelForge 앱으로 전송
```

> **네이밍 검증(Lint) 기능은 현재 미구현입니다.**
> 컨벤션을 벗어난 이름을 사용해도 플러그인이 경고하지 않으며,
> 분류가 잘못되거나 `extra-vars`로 빠질 수 있습니다.

### 실제 추출 데이터 구조:

```json
{
  "variables": { "collections": [...], "variables": [...] },
  "spacing": [ { "id": "...", "name": "spacing/sm", "value": "8" } ],
  "radius": [ { "id": "...", "name": "radius/md", "value": "8" } ],
  "styles": {
    "colors": [...],
    "effects": [...]
  },
  "typography": {
    "textStyles": [ { "name": "Text sm/Regular", "category": "body", "fontSize": 14, ... } ],
    "fontSizes": [ { "name": "font-size/text-sm", "value": 14 } ],
    "lineHeights": [...],
    "fontFamilies": [...],
    "fontWeights": [...]
  },
  "extraVars": [ { "collectionName": "Motion", "variables": [...] } ],
  "meta": { "fileName": "...", "extractedAt": "..." }
}
```

---

## 📞 FAQ

### Q: Figma Variables는 어디에 있어?

**A**: Figma 상단 메뉴 → Assets (왼쪽 패널) → Variables 탭

### Q: Mode는 뭐야?

**A**: 라이트/다크 테마처럼 같은 변수의 다른 값.

- Light 모드 (필수): #0066FF
- Dark 모드 (선택): #00CCFF

### Q: 상태(state)를 꼭 써야 하나?

**A**: Yes. `color/primary`만으로는 기본/호버/활성/비활성 등 상태 구분 불가. 항상 state 포함.

### Q: 변수 타입은?

**A**:

- 색상: Color
- 간격/크기: Number (px 단위)
- 폰트명/전환: String
- 필요시: Boolean

### Q: 컴포넌트에서 하드코딩하면?

**A**: ❌ 금지. 모든 스타일은 Variables 사용.

- 색상: fill/stroke color 변수화
- 간격: 너비/높이/padding/margin 변수화
- 타이포: 폰트 크기/줄높이 변수화

### Q: 새로운 카테고리 추가할 때?

**A**: 팀 합의 후 가이드 업데이트. (예: `color/info/default`)

### Q: 색상 토큰이 100개 넘으면?

**A**: 세 번째 depth 추가: `color/primary/button/default`, `color/primary/card/default` 등

### Q: Token Studio로 upgrade하려면?

**A**: 나중에. 지금은 Figma Variables만으로 충분. 필요시 GitHub 연동 추가.

---

## 📝 예시 완전판

```
── Tier 1: 자동 분류 토큰 ──────────────────────

1. 색상 (Color 컬렉션)
  - color/brand/primary
  - color/text/primary
  - color/background/light
  - color/alert/error

2. 간격 + Gap (Spacing 컬렉션)
  - spacing/xs, spacing/sm, spacing/md, spacing/lg
  - gap/xs, gap/sm, gap/md

3. 반경 (Radius 컬렉션)
  - radius/sm, radius/md, radius/lg, radius/full

4. 타이포 Variables (Typography 컬렉션)
  - font-size/text-sm, font-size/text-md
  - line-height/text-sm, line-height/text-md
  - font-family/body, font-family/display
  - font-weight/regular, font-weight/semibold

4-b. 타이포 Text Styles (Figma Text Styles)
  - Text sm/Regular, Text md/Semibold
  - Display xl/Bold, Heading md/Semibold

5. 그림자 (Figma Effect Styles)
  - shadow/sm, shadow/md, shadow/lg

5-b. 블러 (Figma Effect Styles)
  - blur/sm, blur/md, blur/lg, blur/xl

── Tier 2: 네이밍 권장 토큰 (extra-vars) ────────

6. 테두리 → 컬렉션 "Border" 권장
  - border/solid/default, border/dashed/default

7. 투명도 → 컬렉션 "Opacity" 권장
  - opacity/sm, opacity/md, opacity/lg, opacity/full

8. 애니메이션 → 컬렉션 "Motion" 권장
  - duration/fast, duration/normal, duration/slow

9. 레이어 → 컬렉션 "Layout" 권장
  - z-index/base, z-index/dropdown, z-index/modal

10. 폰트
  - font-family/sans, font-family/mono

11. 줄높이
  - line-height/tight, line-height/normal, line-height/loose

12. 자간
  - letter-spacing/tight, letter-spacing/normal, letter-spacing/loose

13. 그라디언트
  - gradient/vertical/brand, gradient/horizontal/sunset

14. 전환 → 컬렉션 "Motion" 권장
  - transition/fast, transition/normal, transition/slow

15. 가로세로비 → 컬렉션 "Layout" 권장
  - aspect-ratio/square, aspect-ratio/video, aspect-ratio/portrait

16. 대소문자
  - text-transform/uppercase, text-transform/lowercase

17. 배경필터
  - backdrop-filter/blur, backdrop-filter/blur-light

18. 선스타일 → 컬렉션 "Border" 권장
  - stroke/solid/thin, stroke/dashed/default
```

---

**마지막 업데이트**: 2026-04-16
**작성자**: PixelForge Team
**버전**: 1.2

### 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.2 | 2026-04-16 | 토큰 Tier 1/Tier 2 분류 도입, 컬렉션 키워드 실제 regex 반영 (Spacing 8개, Radius 4개), Gap을 Spacing에 통합, 체크리스트 Tier별 재구성, 예시 Tier 구분 적용 |
| 1.1 | 2026-04-15 | 타이포그래피 구조 개편 (Text Styles + Variables 분리), 컬렉션 명명 규칙 추가, 미구현 Lint 기능 안내, 실제 JSON 출력 구조 반영 |
| 1.0 | 2026-04-02 | 최초 작성 |
