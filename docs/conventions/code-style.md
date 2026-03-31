# Code Style — PixelForge Plugin

## 파일 구조

```
src/
├── code.ts              # Figma Sandbox (TypeScript strict)
├── ui.html              # HTML 템플릿 + CSS (인라인)
├── ui.js                # UI 로직 (ES5 호환 var, ES module import)
└── converters/          # JSON→CSS 변환 (순수 함수 모듈)
    ├── utils.js         # 공통 유틸 (escapeHtml, toCssName, figmaColorToCSS, toUnit)
    ├── variables.js     # Variable 변환 + 테마 분리
    ├── color-styles.js  # Paint Style 변환
    ├── typography.js    # Text Style → CSS class 변환
    ├── effects.js       # Shadow/Blur 변환
    └── highlight.js     # CSS 구문 강조
```

## 변수/함수/인터페이스 네이밍

### TypeScript (code.ts)

```typescript
// Interface: PascalCase + 의미 있는 접미사
interface VariableData { ... }
interface ExtractOptions { ... }
interface ExtractedTokens { ... }

// 함수: camelCase, 동사 시작
function getSourceNodes(useSelection: boolean): readonly SceneNode[] { ... }
function countVariableUsage(nodes: readonly SceneNode[]): Map<string, number> { ... }
async function extractAll(options: ExtractOptions): Promise<ExtractedTokens> { ... }

// 상수 (정규식): UPPER_SNAKE_CASE + _RE
const SPACING_RE = /\b(spacing|space|gap|padding|margin|gutter|inset|distance)\b/i;
const RADIUS_RE  = /\b(radius|corner|rounded|border.?radius)\b/i;

// 헬퍼 함수: camelCase, 변환 목적 명시
function toKebabCase(name: string): string { ... }
function toPascalCase(name: string): string { ... }
function figmaColorToHex(c: { r: number; g: number; b: number }): string { ... }
```

### JavaScript (ui.js, converters/*)

```javascript
// DOM 참조: camelCase, 요소 역할 기반
var extractBtn = $('extractBtn');
var previewPre = $('previewPre');
var headerFile = $('headerFile');

// 상태: camelCase, 명사
var extractedData = null;
var activeTab = 'json';
var cssUnit = 'px';
var collections = [];
var extractedColors = [];  // {name, hex}[]

// 함수: camelCase, 동사 시작
function showView(name) { ... }
function renderResult(data) { ... }
function updatePreview() { ... }
function generateCSS(data, unit, types) { ... }

// i18n: dot notation 경로
t('extract.btn')        // → '토큰 추출하기'
t('contrast.title')     // → 'WCAG 명도 대비 검사'
```

## TypeScript 패턴

### 타입 처리
```typescript
// Figma API 타입 접근 시 — as any 허용 (API 타입 미지원 케이스)
const fills = (node as any).fills;

// 타입 가드 패턴
if ("boundVariables" in node && node.boundVariables) { ... }
if ("children" in node) { ... }

// null 필터링
const resolvedVars = (await Promise.all(
  usedIds.map((id) => figma.variables.getVariableByIdAsync(id).catch(() => null))
)).filter((v): v is Variable => v !== null);
```

### 비동기 패턴
```typescript
// async/await 사용 (extractAll, exportIcons, extractThemes 등)
async function extractAll(options: ExtractOptions): Promise<ExtractedTokens> { ... }

// 메시지 핸들러에서 .then/.catch 체인
extractAll(options)
  .then((data) => figma.ui.postMessage({ type: "extract-result", data }))
  .catch((e) => figma.ui.postMessage({ type: "extract-error", message: String(e) }));
```

### 재귀 순회 패턴
```typescript
// 노드 트리 순회 — traverse 내부 함수 패턴
function countVariableUsage(nodes: readonly SceneNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  function traverse(node: SceneNode) {
    // 현재 노드 처리
    if ("children" in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child);
    }
  }
  for (const node of nodes) traverse(node);
  return counts;
}
```

## CSS 변수 사용 규칙

### :root 정의 (ui.html)
```css
:root {
  /* 배경 계층 */
  --bg: #1A1A1A;
  --surface: #2A2A2A;
  --surface2: #333333;

  /* 텍스트 계층 */
  --text-primary: rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.55);
  --text-muted: rgba(255,255,255,0.60);

  /* 강조색 + 파생 */
  --primary: #3B82F6;
  --primary-light: rgba(59,130,246,0.12);
  --primary-border: rgba(59,130,246,0.25);

  /* 시맨틱 */
  --success: #3DDC84;
  --warning: #F5B731;
  --danger: #FF4D4F;

  /* 크기 */
  --radius: 12px;
  --radius-sm: 8px;
  --radius-pill: 100px;
  --shadow: 0 2px 8px rgba(0,0,0,0.4);
}
```

### 사용 규칙
- 색상: 반드시 `var(--*)` 사용. `#` 하드코딩 금지 (예외: `#fff`, `#111111` 프리뷰 배경)
- 간격: 4px 배수만 사용 (4, 8, 12, 16, 20, 24, 32)
- 반경: `var(--radius)`, `var(--radius-sm)`, `var(--radius-pill)` 사용
- 새 파생색 필요 시: 기존 토큰의 rgba 변형으로 생성 (예: `rgba(59,130,246,0.12)`)

## Converter 모듈 작성 규칙

```javascript
// 1. utils.js에서 공통 함수 import
import { toCssName, figmaColorToCSS, toUnit } from './utils.js';

// 2. 단일 export 함수 (순수 함수)
export function convertColorStyles(colors) {
  if (!colors || colors.length === 0) return '';  // 빈 입력 early return
  var lines = '';
  var seen = new Set();                           // 중복 방지
  colors.forEach(function(s) {
    var name = toCssName('color-' + s.name);
    if (seen.has(name)) return;                   // 중복 스킵
    seen.add(name);
    lines += '  ' + name + ': ' + figmaColorToCSS(...) + ';\n';
  });
  return lines;                                   // CSS property lines만 반환 (:root 래핑 안함)
}
```

**핵심 규칙:**
- 입력: JSON 데이터, 출력: CSS 문자열
- `:root { }` 래핑은 caller(ui.js의 `generateCSS`)가 담당
- 중복 방지: `Set`으로 CSS 변수명 추적
- 빈 입력: 빈 문자열 반환 (에러 아님)
