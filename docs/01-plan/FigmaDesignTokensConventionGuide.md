# Figma Design Tokens Convention Guide

_Figma Variables를 사용한 PixelForge 토큰 정의 가이드_

---

## 📌 기본 원칙

- **플랫폼**: Figma Variables (내장 기능, 설치 불필요)
- **위치**: Assets panel → Variables 섹션
- **네이밍**: `kebab-case` (모두 소문자, 하이픈으로 단어 구분)
- **구조**: `category/subcategory/state` 또는 `category/value`
- **변수 유형**: Color, Number, String, Boolean 등 타입 지정

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

```
typography/{family}/{weight}/{size}

✅ 예시:
  - typography/sans/regular/sm
  - typography/sans/bold/md
  - typography/mono/regular/xs
  - typography/serif/medium/lg

❌ 금지: font/body/regular, text-large, heading-1
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

배포 전에 확인:

- [ ] Assets panel → Variables에서 모든 토큰 정의됨
- [ ] 컬렉션명: "Design Tokens"
- [ ] Mode: "Light" (+ "Dark" 옵션)
- [ ] 모든 변수가 `kebab-case` 형식
- [ ] 색상: `color/{category}/{state}` (Type: Color)
- [ ] 간격: `spacing/{size}` (Type: Number, 단위: px)
- [ ] 반경: `radius/{type}` (Type: Number)
- [ ] 타이포: `typography/{family}/{weight}/{size}` (Type: String)
- [ ] 모든 컴포넌트가 Variables를 사용 (하드코딩 금지)
- [ ] 라이트/다크 모드 모두 정의됨 (라이트는 필수)
- [ ] 한국어 텍스트 없음 (영문만)

---

## 🔧 플러그인 동작

### PixelForge 플러그인이 할 일:

```
1. Figma Variables 자동 감지
   → Assets panel의 모든 변수 읽기

2. 검증 (Lint)
   ⚠️ 경고:
     - "color_primary" → 언더스코어 사용 금지
     - "colors/primary" → 복수형 금지
     - "Color/Primary" → 대문자 사용 금지
     - "color/primary" (state 없음) → state 권장

   ❌ 거부:
     - "primary" (type 없음)
     - "c-primary" (약자 사용)

3. 추출 및 정규화
   → JSON 형식으로 export
   → PixelForge 앱으로 전송
```

### 플러그인이 추출할 데이터:

```json
{
  "tokens": {
    "color/primary/default": "#0066FF",
    "color/primary/hover": "#0052CC",
    "spacing/xs": 4,
    "spacing/sm": 8,
    ...
  },
  "modes": ["Light", "Dark"],
  "extractedAt": "2026-04-02T20:40:00Z"
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

**마지막 업데이트**: 2026-04-02
**작성자**: PixelForge Team
**버전**: 1.0
