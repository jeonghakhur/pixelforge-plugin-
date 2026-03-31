# Airtable Apps UI Kit (Community) — 토큰 분석

> 분석 일자: 2026-03-31
> 원본 파일: `Airtable_Apps_UI_Kit_Community_tokens.json`
> 추출 일시: 2026-03-31T04:49:57Z
> 추출 도구: PixelForge Token Extractor
> 원본 Figma: https://www.figma.com/design/5LPkehVlcIbBRA5QJjDE7I/Airtable-Apps-UI-Kit--Community-

---

## 요약

| 항목 | 수량 | 비고 |
|------|------|------|
| Color Styles | 61개 | Grays 11 + 브랜드 10색 × 5단계 |
| Text Styles | 18개 | SF Pro Text / Display |
| Effect Styles | 0개 | Shadow 미사용 또는 미추출 |
| Variables | 0개 | Variables 시스템 미사용 |
| Spacing | 0개 | Variable 기반 없음 |
| Radius | 0개 | Variable 기반 없음 |
| Icons | 338개 | 순수 글리프 157 × 2사이즈 + 버튼 컴포넌트 24개 |
| 총 노드 수 | 2,136개 | |

---

## 1. 색상 스타일 (61개)

### 1.1 Grayscale (11개)

| 이름 | HEX | 용도 |
|------|-----|------|
| Black | `#0f0f0f` | Fine print |
| Dark gray 1 | `#292929` | Headings |
| Dark gray 2 | `#424242` | Body text (usage: 43) |
| Dark gray 3 | `#5c5c5c` | Lighter text |
| Light | `#757575` | Light text (usage: 130) |
| Dark | `#333333` | (usage: 759 — 최다 사용) |
| Gray | `#666666` | |
| Gray Dark 1 | `#444444` | |
| Gray Light 1 | `#cccccc` | |
| Gray Light 2 | `#eeeeee` | |
| White | `#ffffff` | (usage: 96) |
| Light gray 1 | `#fafafa` | |
| Light gray 2 | `#f2f2f2` | (usage: 60) |
| Light gray 3 | `#e8e8e8` | |
| Light gray 4 | `#e0e0e0` | (usage: 28) |
| Light gray 5 | `#d1d1d1` | |

### 1.2 브랜드 색상 (10색 × 5단계 = 50개)

각 색상은 `Bright → 기본 → Dark1 → Light1 → Light2` 5단계 구조.

| 색상 | Bright | 기본 | Dark1 | Light1 | Light2 |
|------|--------|------|-------|--------|--------|
| Yellow | `#fcb400` | `#e08d00` | `#b87503` | `#ffd66e` | `#ffeab6` |
| Orange | `#ff6f2c` | `#f7653b` | `#d74d26` | `#ffa981` | `#fee2d5` |
| Red | `#f82b60` | `#ef3061` | `#ba1e45` | `#ff9eb7` | `#ffdce5` |
| Pink | `#ff08c2` | `#e929ba` | `#b2158b` | `#f99de2` | `#ffdaf6` |
| Purple | `#8b46ff` | `#7c39ed` | `#6b1cb0` | `#cdb0ff` | `#ede3fe` |
| Blue | `#2d7ff9` | `#1283da` | `#2750ae` | `#9cc7ff` | `#cfdfff` |
| Cyan | `#18bfff` | `#01a9db` | `#0b76b7` | `#77d1f3` | `#d0f0fd` |
| Teal | `#20d9d2` | `#02aaa4` | `#06a09b` | `#72ddc3` | `#c2f5e9` |
| Green | `#20c933` | `#11af22` | `#338a17` | `#93e088` | `#d1f7c4` |
| Gray | `#666666` | — | `#444444` | `#cccccc` | `#eeeeee` |

**Primary (가장 많이 사용된 색상):** `blueBright #2d7ff9` (usage: 25), `red #ef3061` (usage: 15)

---

## 2. 텍스트 스타일 (18개)

폰트 패밀리: **SF Pro Text** / **SF Pro Display** (Apple 시스템 폰트)

### 2.1 Text (본문)

| 스타일 | 폰트 | 크기 | 행간 | 자간 | usage |
|--------|------|------|------|------|-------|
| Text / small | SF Pro Text Regular | 11px | 14px | 0 | 305 |
| Text / default | SF Pro Text Regular | 13px | 16px | 0 | 36 |
| Text / large | SF Pro Text Regular | 15px | 20px | 0 | 55 |
| Text / xlarge | SF Pro Text Regular | 17px | 24px | 0 | 1 |
| Text / small - paragraph | SF Pro Text Regular | 11px | 16px | 0 | 1 |
| Text / default - paragraph | SF Pro Text Regular | 13px | 20px | 0 | 1 |
| Text / large - paragraph | SF Pro Text Regular | 15px | 22px | 0 | 7 |
| Text / xlarge - paragraph | SF Pro Text Regular | 17px | 26px | 0 | 1 |

### 2.2 Label

| 스타일 | 폰트 | 크기 | 행간 | usage |
|--------|------|------|------|-------|
| Label / default | SF Pro Text Medium | 13px | 16px | 7 |

### 2.3 Heading

| 스타일 | 폰트 | 크기 | 행간 | 자간 | usage |
|--------|------|------|------|------|-------|
| Heading / xsmall | SF Pro Text Bold | 15px | 22px | 0 | 7 |
| Heading / small | SF Pro Text Semibold | 17px | 24px | 0 | 1 |
| Heading / default | SF Pro Display Medium | 21px | 26px | 0 | 2 |
| Heading / large | SF Pro Display Medium | 23px | 29px | 0 | 1 |
| Heading / xlarge | SF Pro Display Medium | 27px | 34px | 0 | 1 |
| Heading / xxlarge | SF Pro Display Medium | 35px | 44px | 0 | 1 |
| Heading / xsmall - caps | SF Pro Text Bold | 11px | 16px | 5% | 3 |
| Heading / small - caps | SF Pro Text Semibold | 13px | 16px | 5% | 1 |
| Heading / default - caps | SF Pro Text Medium | 15px | 20px | 5% | 1 |

**가장 많이 사용:** `Text / small` (305회) → UI 라벨, 보조 텍스트 중심

---

## 3. 아이콘 (338개)

### 3.1 구성

| 종류 | 수량 | 크기 | 설명 |
|------|------|------|------|
| 순수 글리프 (default) | 157개 | 16×16px | `Glyph=*, Size=default` |
| 순수 글리프 (micro) | 157개 | 12×12px | `Glyph=*, Size=micro` |
| 버튼 컴포넌트 (Icon=true) | 24개 | 다양 | Button 컴포넌트의 아이콘 variant |

### 3.2 사이즈

| Size | 크기 | 수량 |
|------|------|------|
| default | 16×16px | 157개 |
| micro | 12×12px | 157개 |
| small | 컴포넌트 내 | — |
| large | 컴포넌트 내 | — |
| xlarge | 컴포넌트 내 | — |

### 3.3 아이콘 전체 목록 (157개 글리프)

```
android, apple, apps, ascending, attachment, automations, autonumber,
barcode, bell, bold, bolt, book, calendar, caret, chart, chat,
check, checkbox, checkboxChecked, checkboxUnchecked, checklist,
chevronDown, chevronLeft, chevronRight, chevronUp, clipboard,
code, cog, collapse, collapseSidebar, count, count1, cube, cursor,
day, dayAuto, dedent, descending, dollar, down, download, dragHandle,
drive, duplicate, edit, envelope, envelope1, expand, expand1,
expandSidebar, feed, file, filter, flag, form, formula, fullscreen,
gallery, gantt, gift, grid, grid1, group, heart, help, hide, hide1,
history, home, hyperlink, hyperlinkCancel, indent, info, italic,
kanban, laptop, left, lightbulb, link, link1, lock, logout, lookup,
mapPin, markdown, menu, minus, mobile, multicollaborator, multiselect,
number, ol, overflow, paint, paragraph, paragraph1, pause, percent,
personal, personalAuto, phone, pivot, play, plus, plusFilled, premium,
print, public, publish, quote, radio, radioSelected, redo, redo1,
richText, right, rollup, rollup1, rowHeightExtraLarge, rowHeightLarge,
rowHeightMedium, rowHeightSmall, search, select, selectCaret, settings,
shapes, share, share1, show, show1, slack, smiley, sort, stack, star,
strikethrough, switcher, tabs, team, teamLocked, text, thumbsUp, time,
toggle, trash, twitter, ul, underline, undo, up, upload, video,
view, warning, windows, x
```

---

## 4. Variables / Spacing / Radius / Effects

| 항목 | 값 | 비고 |
|------|-----|------|
| Variables | 0개 | Figma Variables 시스템 미사용 |
| Spacing | 0개 | Spacing Variable 없음 |
| Radius | 0개 | Radius Variable 없음 |
| Effect Styles | 0개 | Shadow/Blur Style 없음 (컴포넌트에 직접 적용 추정) |

---

## 5. 특징 및 인사이트

### 색상 시스템
- **단일 레이어 구조**: Semantic 토큰(primary, danger 등) 없이 Raw 색상(blueBright, red 등) 직접 사용
- 10가지 브랜드 색상 × 5단계 스케일 → 일관된 팔레트
- `Dark (#333333)`이 usage 759회로 압도적 최다 → 기본 텍스트/보더 색상

### 타이포그래피
- **SF Pro Text / Display** (macOS/iOS 시스템 폰트) → iOS/macOS 앱 타겟
- 텍스트 스케일: 11 / 13 / 15 / 17px (4단계)
- 헤딩 스케일: 15 / 17 / 21 / 23 / 27 / 35px (6단계)
- Small caps 변형 (`letter-spacing: 5%`) 별도 제공

### 아이콘
- **157개 글리프** × 2사이즈 (16px / 12px) = 완전한 이중 스케일 아이콘 시스템
- 네이밍: camelCase (`chevronDown`, `rowHeightSmall` 등)
- PixelForge 플러그인의 `icon-registry` 기능으로 React 레지스트리 생성 가능

### 미추출 항목
Variables, Spacing, Radius, Effects가 모두 0인 이유:
- 이 파일은 구형 Figma Styles 기반 (Variables 도입 이전 설계)
- 스페이싱·보더 반경은 컴포넌트에 직접 하드코딩된 것으로 추정
