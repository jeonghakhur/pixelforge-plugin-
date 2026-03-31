# PixelForge Plugin — Quality Rules

## 디자인 토큰 (변경 금지)
| Token | Value | Usage |
|-------|-------|-------|
| --bg / --bg-base | #1A1A1A | 최하단 배경 |
| --surface / --bg-card | #2A2A2A | 카드 배경 |
| --surface2 / --bg-card2 | #333333 | 중간 톤 |
| --border | #3A3A3A | 구분선 |
| --text-primary | rgba(255,255,255,0.95) | 주요 텍스트 |
| --text-secondary | rgba(255,255,255,0.55) | 보조 텍스트 |
| --text-muted | rgba(255,255,255,0.60) | 라벨/캡션 |
| --primary / --accent | #3B82F6 | 강조/버튼 |
| --primary-light | rgba(59,130,246,0.12) | 강조 배경 |
| --primary-border | rgba(59,130,246,0.25) | 강조 테두리 |
| --success | #3DDC84 | 성공/통과 |
| --warning | #F5B731 | 주의 |
| --danger | #FF4D4F | 실패/오류 |
| --radius | 12px | 카드 반경 |
| --radius-sm | 8px | 작은 반경 |
| --radius-pill | 100px | pill 반경 |

## 간격 (4px 배수 체계)
4, 8, 12, 16, 20, 24, 32px만 사용

## 타이포그래피
- 제목: 700 (Bold), 15–16px
- 본문: 400–500 (Regular/Medium), 13px
- 캡션/라벨: 500–600, 11px
- 최소 크기: 10px (매트릭스 셀), 11px (일반)
- 폰트 스택: `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif`

## 컴포넌트 규칙
- 버튼 최소 터치 타겟: 36px (Figma 플러그인 특성상 완화)
- 카드: 배경 --surface, border 1px solid --border, radius 12px, padding 14px
- 탭(메인): 언더라인 스타일, border-bottom 2px solid --primary
- 탭(서브/pill): border 1px solid --border, radius 100px, 11px
- 버튼(primary): height 40px, radius 10px, font-weight 600
- 버튼(ghost): height 40px, radius 10px, border 1px solid --border

## TypeScript 코드 컨벤션 (src/code.ts)

### 네이밍
| 대상 | 규칙 | 예시 |
|------|------|------|
| interface | PascalCase + `Data` 접미사 | `VariableData`, `ExtractOptions` |
| 함수 | camelCase, 동사로 시작 | `extractAll()`, `countNodes()`, `getSourceNodes()` |
| 상수 (정규식) | UPPER_SNAKE + `_RE` 접미사 | `SPACING_RE`, `RADIUS_RE` |
| private 헬퍼 | camelCase, 파일 스코프 함수 | `mapVariable()`, `fontWeightFromStyle()` |

### 함수 구조
```typescript
// 1. interface 정의 (파일 상단)
// 2. figma.showUI() 호출
// 3. 순수 헬퍼 함수 (traverse, count, map)
// 4. async 추출 함수 (extractAll, exportIcons, extractThemes)
// 5. 초기화 호출 (sendCollections)
// 6. 이벤트 리스너 (figma.on, figma.ui.onmessage)
```

### 에러 처리 패턴
```typescript
// 비동기 함수: .then/.catch 체인으로 UI에 에러 전달
extractAll(options)
  .then((data) => figma.ui.postMessage({ type: "extract-result", data }))
  .catch((e) => figma.ui.postMessage({ type: "extract-error", message: String(e) }));

// 동기 함수: try/catch로 감싸서 에러 메시지 전달
try {
  const data = inspectSelection();
  figma.ui.postMessage({ type: "inspect-result", data });
} catch (e) {
  figma.ui.postMessage({ type: "inspect-result", data: { error: String(e) } });
}
```

## JavaScript 코드 컨벤션 (src/ui.js, src/converters/*)

### 네이밍
| 대상 | 규칙 | 예시 |
|------|------|------|
| DOM 변수 | camelCase, 요소 역할 기반 | `extractBtn`, `previewPre`, `colList` |
| 상태 변수 | camelCase | `extractedData`, `activeTab`, `cssUnit` |
| 함수 | camelCase, 동사로 시작 | `showView()`, `renderResult()`, `updatePreview()` |
| i18n 키 | dot notation `탭.키` | `extract.btn`, `icon.title` |

### 규칙
- `var` 사용 (ES5 호환 — Figma iframe 환경)
- converter 모듈은 ES module (`import`/`export`)
- DOM 참조: `var $ = function(id) { return document.getElementById(id); }`
- 이벤트: `addEventListener('click', function() { ... })`

## HTML/CSS 네이밍 규칙

### CSS 클래스 (하이픈 케이스, 컴포넌트-요소-상태)
```
.section-card          → 컴포넌트
.section-label         → 컴포넌트-요소
.token-card            → 컴포넌트
.token-card.active     → 컴포넌트.상태
.token-card-icon       → 컴포넌트-요소
.token-card-label      → 컴포넌트-요소
.btn-primary           → 컴포넌트-변형
.btn-ghost             → 컴포넌트-변형
.stat-card.inactive    → 컴포넌트.상태
```

### CSS 변수
- 색상: `--bg`, `--surface`, `--primary`, `--text-*`, `--success/warning/danger`
- 파생값: `--primary-light`, `--primary-border` (rgba 사용)
- 크기: `--radius`, `--radius-sm`, `--radius-pill`
- 효과: `--shadow`

### HTML id (camelCase, 기능 기반)
```html
<div id="colList">         → 컬렉션 목록
<button id="extractBtn">   → 추출 버튼
<pre id="previewPre">      → 프리뷰 영역
<span id="metaFile">       → 메타 파일명
<span id="statVarNum">     → 통계 숫자
```

## 커밋 메시지 규칙
```
<type>: <한글 설명>

type: feat | fix | docs | chore | refactor
```

**예시:**
```
feat: 명도대비 자동 매트릭스 + 아이콘 전체/선택 추출 모드
fix: 서브 탭 pill 스타일로 메인 탭과 시각적 구분 강화
docs: PDCA 설계 문서 + 우선순위 개선사항 구현
chore: .gitignore에 bkit 런타임 디렉토리 추가
```

## Claude Code 작업 규칙

### 작업 전 필수
1. `QUALITY_RULES.md` 읽기
2. `ARCHITECTURE.md`에서 수정 대상 파일의 역할 확인
3. 수정할 파일의 기존 패턴 확인 (네이밍, 구조)

### 작업 중 금지
1. 위 토큰 외 새 색상값 임의 추가 금지 (`#` 하드코딩 금지)
2. 간격은 4px 배수만 사용
3. `any` 타입 사용 금지 (Figma API 타입 미지원 시 예외)
4. 외부 런타임 의존성 추가 금지

### 작업 후 필수
1. `npm run build` 성공 확인
2. 색상/간격 하드코딩 검수 (CSS 변수 사용 여부)
3. 새 메시지 타입 추가 시 ARCHITECTURE.md 메시지 플로우 테이블 업데이트
