# Design: Token Type Filter

> Plan 참조: `docs/01-plan/features/token-type-filter.plan.md`

---

## 1. UI 전체 구조 (앱 레이아웃)

현재 플러그인을 단순 도구가 아닌 **앱처럼** 느껴지도록 3-섹션 레이아웃으로 재설계한다.

```
┌─────────────────────────────────────┐
│  Header                             │  ← 고정 (브랜드 + 현재 파일명)
├─────────────────────────────────────┤
│  Filter Panel                       │  ← 스크롤 가능
│  ┌─ 토큰 타입 ───────────────────┐  │
│  │  [Var] [Color] [Text] [Effect] │  │  ← 신규: 타입 칩
│  └────────────────────────────────┘  │
│  ┌─ 추출 범위 ───────────────────┐  │
│  │  ○ 전체 페이지  ● 선택 레이어 │  │  ← 라디오 버튼으로 변경
│  └────────────────────────────────┘  │
│  ┌─ 컬렉션 ──────────────────────┐  │
│  │  ☑ Primitives  ☑ Semantic     │  │
│  └────────────────────────────────┘  │
├─────────────────────────────────────┤
│  Action Bar                         │  ← 고정 (하단 CTA)
│  [──────── 토큰 추출하기 ────────]  │
└─────────────────────────────────────┘
```

추출 결과는 별도 **Result Panel**로 전환 (페이지 전환 UX):
```
┌─────────────────────────────────────┐
│  Header  [← 뒤로]                   │
├─────────────────────────────────────┤
│  Result Summary                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  24  │ │  12  │ │  8   │        │  ← stat 카드
│  │ 변수 │ │ 색상 │ │ 텍스트│        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  JSON Preview ▾                     │
│  ┌─────────────────────────────┐   │
│  │ { ... }                     │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  [JSON 복사]  [파일 다운로드]        │
└─────────────────────────────────────┘
```

---

## 2. 토큰 타입 칩 (핵심 신규 컴포넌트)

### 2.1 비주얼 디자인

```
비활성:  ┌──────────────┐
         │  ◈ Variables │  배경: #F1F5F9  텍스트: #94A3B8
         └──────────────┘

활성:    ┌──────────────┐
         │  ◈ Variables │  배경: #EFF6FF  텍스트: #2563EB
         └──────────────┘  테두리: #BFDBFE  font-weight: 600

비활성 hover: 배경 #E2E8F0
```

### 2.2 칩 목록

| 칩 | 아이콘 | 담당 데이터 |
|----|--------|-------------|
| Variables | `⬡` | variables.variables + collections |
| Color Styles | `◉` | styles.colors |
| Text Styles | `T` | styles.texts |
| Effect Styles | `✦` | styles.effects |

### 2.3 인터랙션 규칙

- 클릭: 선택/해제 토글
- 모두 해제 시: "최소 1개 선택 필요" 토스트 + 추출 버튼 비활성
- All 버튼: 전체 선택/해제 빠른 토글

---

## 3. 색상 팔레트 & 타이포그래피

### 색상

| 용도 | 값 |
|------|-----|
| Primary | `#2563EB` |
| Primary Light | `#EFF6FF` |
| Primary Border | `#BFDBFE` |
| Text Primary | `#1E293B` |
| Text Secondary | `#64748B` |
| Text Muted | `#94A3B8` |
| Border | `#E2E8F0` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Success | `#16A34A` |
| Success Light | `#F0FDF4` |

### 타이포그래피

| 역할 | 크기 | 굵기 |
|------|------|------|
| App Title | 15px | 700 |
| Section Label | 11px | 600 (uppercase, letter-spacing 0.05em) |
| Body | 13px | 400 |
| Chip | 12px | 500/600 |
| Stat Value | 20px | 700 |
| Stat Label | 10px | 400 |
| Muted / Meta | 11px | 400 |

---

## 4. 컴포넌트 스펙

### 4.1 Header
```
높이: 48px
내용: 로고(16px) + 플러그인명(15px bold) + 파일명(11px muted)
배경: #FFFFFF
하단 border: 1px solid #E2E8F0
```

### 4.2 Section Card
```
배경: #FFFFFF
border: 1px solid #E2E8F0
border-radius: 10px
padding: 12px 14px
margin-bottom: 10px
```

### 4.3 Token Type Chip
```
display: inline-flex
align-items: center
gap: 5px
padding: 6px 12px
border-radius: 20px (pill)
border: 1.5px solid
font-size: 12px
cursor: pointer
transition: all 0.15s
```

### 4.4 Scope Radio
```
기존 checkbox → radio button 스타일
accent-color: #2563EB
선택된 항목: 텍스트 color #1E293B, font-weight 600
미선택: color #64748B
```

### 4.5 Primary Button
```
height: 40px
border-radius: 8px
background: #2563EB
font-size: 13px, font-weight: 600
disabled: background #93C5FD, cursor not-allowed
```

### 4.6 Stat Card (결과 화면)
```
배경: #FFFFFF
border: 1px solid #E2E8F0
border-radius: 8px
padding: 10px
text-align: center
stat-value: 20px, #2563EB, bold
```

### 4.7 Toast (경고 메시지)
```
위치: 하단 고정, margin 12px
배경: #1E293B
텍스트: #FFFFFF, 12px
border-radius: 8px
padding: 8px 14px
auto-dismiss: 2500ms
```

---

## 5. 화면 전환 (View State)

```
[filter-view] ──(추출 클릭)──→ [loading-view] ──(완료)──→ [result-view]
                                                    ↓(에러)
                                               [filter-view + toast]

[result-view] ──(뒤로)──→ [filter-view]
```

### 구현 방식

HTML 내 두 개 div를 show/hide로 전환 (SPA 방식):
```html
<div id="view-filter">...</div>
<div id="view-result" class="hidden">...</div>
```

JavaScript에서 `showView('filter')` / `showView('result')` 함수로 전환.

---

## 6. code.ts 변경 사항

### ExtractOptions 타입 추가

```typescript
interface ExtractOptions {
  collectionIds: string[];
  useSelection: boolean;
  tokenTypes: Array<'variables' | 'colors' | 'texts' | 'effects'>;  // 신규
}
```

### extractAll 조건부 처리

```typescript
const includeVariables = options.tokenTypes.includes('variables');
const includeColors    = options.tokenTypes.includes('colors');
const includeTexts     = options.tokenTypes.includes('texts');
const includeEffects   = options.tokenTypes.includes('effects');

// 미포함 타입은 빈 배열 대신 아예 처리 생략 → 성능 최적화
const variables = includeVariables ? await extractVariables(...) : { collections: [], variables: [] };
const colors    = includeColors    ? await extractColors(...)    : [];
// ...
```

---

## 7. 파일 변경 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/ui.html` | 전체 레이아웃 재설계, 타입 칩 추가, 뷰 전환 로직 |
| `src/code.ts` | `ExtractOptions`에 `tokenTypes` 추가, 조건부 추출 |
| `dist/ui.html` | 빌드 결과 (자동 생성) |

---

## 8. 완료 기준 (Design → Do 체크리스트)

- [ ] Header: 파일명 표시
- [ ] 타입 칩 4개: 선택/해제 토글, 최소 1개 강제
- [ ] 추출 범위: 라디오 버튼 스타일
- [ ] 컬렉션 필터: 기존 동일
- [ ] Filter → Loading → Result 뷰 전환
- [ ] Result: stat 카드 + JSON preview + 복사/다운로드
- [ ] 뒤로가기 버튼으로 filter 화면 복귀
- [ ] 토스트 메시지 컴포넌트
- [ ] code.ts tokenTypes 필터링 동작
