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

| 토큰 타입 | 컬렉션 이름 예시 | 포함 키워드 |
|----------|----------------|-----------|
| Spacing | `Spacing`, `Space`, `Gap` | `spacing`, `space`, `gap` |
| Radius | `Radius`, `Border Radius` | `radius`, `corner`, `rounded` |
| Typography Variables | `Typography`, `Font`, `Type Scale` | `typography`, `font`, `type` |
| Color | 컬렉션 타입이 Color면 자동 인식 | — |
| 기타 (extra-vars) | 위 규칙에 해당 없는 컬렉션 | — |

> ⚠️ **주의**: 타이포그래피 Variables를 "Design Tokens"처럼 범용 컬렉션에 넣으면
> 플러그인이 typography로 분류하지 못합니다. 반드시 별도 컬렉션으로 분리하세요.

---

## 🎨 토큰 타입별 네이밍 규칙 (20가지)

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

### 2️⃣ 간격 (Spacing)

```
spacing/{size}

✅ 예시:
  - spacing/xs (4px)
  - spacing/sm (8px)
  - spacing/md (12px)
  - spacing/lg (16px)
  - spacing/xl (24px)
  - spacing/2xl (32px)

❌ 금지: space/small, spacing-4, margin/small
```

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

### 1️⃣6️⃣ 간격 (Gap - Flex/Grid)

```
gap/{size}

✅ 예시:
  - gap/xs (4px)
  - gap/sm (8px)
  - gap/md (12px)
  - gap/lg (16px)
  - gap/xl (24px)

❌ 금지: flex-gap/sm, grid-spacing/md
```

> **플러그인 처리**: `gap/*` 변수는 `spacing` 타입으로 통합 분류됩니다.
> Figma에서는 Gap/Spacing을 구분할 수 있지만, CSS 출력 시 `:root` 변수로 동일하게 처리됩니다.

### 1️⃣7️⃣ 가로세로비 (Aspect-Ratio)

```
aspect-ratio/{ratio}

✅ 예시:
  - aspect-ratio/square (1/1)
  - aspect-ratio/video (16/9)
  - aspect-ratio/portrait (3/4)
  - aspect-ratio/thumbnail (4/3)

❌ 금지: ratio/16-9, proportions/square
```

### 1️⃣8️⃣ 대소문자 (Text-Transform)

```
text-transform/{style}

✅ 예시:
  - text-transform/uppercase
  - text-transform/lowercase
  - text-transform/capitalize
  - text-transform/none

❌ 금지: case/uppercase, text-case/upper
```

### 1️⃣9️⃣ 배경 필터 (Backdrop-Filter)

```
backdrop-filter/{effect}

✅ 예시:
  - backdrop-filter/blur
  - backdrop-filter/blur-light
  - backdrop-filter/blur-heavy
  - backdrop-filter/none

❌ 금지: filter/backdrop-blur, glass/effect
```

### 2️⃣0️⃣ 선 스타일 (Stroke)

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

- [ ] 색상 Variables: Color 타입, `color/{category}/{state}` 네이밍
- [ ] Spacing 컬렉션 이름에 `spacing` / `space` / `gap` 포함
- [ ] Radius 컬렉션 이름에 `radius` / `corner` / `rounded` 포함
- [ ] Typography Variables 컬렉션 이름에 `typography` / `font` / `type` 포함
- [ ] 타이포그래피 스타일은 Figma Text Styles로 정의
- [ ] 모든 변수가 `kebab-case` 형식 (대문자, 언더스코어 금지)
- [ ] Mode: "Light" 필수, "Dark" 선택
- [ ] 모든 컴포넌트가 Variables/Styles 사용 (하드코딩 금지)

> 컬렉션 이름 규칙을 지키지 않으면 해당 변수가 **extra-vars**로 분류됩니다.

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
✅ 올바른 예시 (20가지):

1. 색상
  - color/brand/primary
  - color/text/primary
  - color/background/light
  - color/alert/error

2. 간격
  - spacing/xs, spacing/sm, spacing/md, spacing/lg

3. 반경
  - radius/sm, radius/md, radius/lg, radius/full

4. 타이포
  - typography/sans/regular/sm
  - typography/mono/bold/md

5. 그림자
  - shadow/sm, shadow/md, shadow/lg

6. 테두리
  - border/solid/default
  - border/dashed/default

7. 투명도
  - opacity/sm, opacity/md, opacity/lg, opacity/full

8. 애니메이션
  - duration/fast, duration/normal, duration/slow

9. 레이어
  - z-index/base, z-index/dropdown, z-index/modal

10. 폰트
  - font-family/sans, font-family/mono

11. 줄높이
  - line-height/tight, line-height/normal, line-height/loose

12. 자간
  - letter-spacing/tight, letter-spacing/normal, letter-spacing/loose

13. 그라디언트
  - gradient/vertical/brand, gradient/horizontal/sunset

14. 블러
  - blur/sm, blur/md, blur/lg, blur/xl

15. 전환
  - transition/fast, transition/normal, transition/slow

16. 간격 (Gap)
  - gap/xs, gap/sm, gap/md, gap/lg

17. 가로세로비
  - aspect-ratio/square, aspect-ratio/video, aspect-ratio/portrait

18. 대소문자
  - text-transform/uppercase, text-transform/lowercase

19. 배경필터
  - backdrop-filter/blur, backdrop-filter/blur-light

20. 선스타일
  - stroke/solid/thin, stroke/dashed/default
```

---

**마지막 업데이트**: 2026-04-15
**작성자**: PixelForge Team
**버전**: 1.1

### 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.1 | 2026-04-15 | 타이포그래피 구조 개편 (Text Styles + Variables 분리), 컬렉션 명명 규칙 추가, 미구현 Lint 기능 안내, 실제 JSON 출력 구조 반영 |
| 1.0 | 2026-04-02 | 최초 작성 |
