# visual-frame-parser Design Document

> **Plan**: `docs/01-plan/features/visual-frame-parser.plan.md`
> **Date**: 2026-03-31
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | pre-Variables era Figma 파일의 Spacing 토큰이 Variables API에 존재하지 않아 추출 결과 0개 반환 |
| **Solution** | `extractAll()`에 `useVisualParser` 옵션 경로 추가 — `findAll()`로 Spacing 프레임 탐색 후 TEXT 노드에서 `숫자px` 파싱 |
| **Function/UX Effect** | 기존 Variables 경로 결과가 0일 때만 시각 파싱 실행. UI 토글로 사용자가 수동 활성화. `source: 'visual'` 배지로 신뢰도 명시 |
| **Core Value** | 기존 코드 무수정 원칙 유지하며 구형 파일 호환성 확보 |

---

## 1. 변경 파일 목록

| 파일 | 변경 유형 | 변경 내용 |
|------|----------|----------|
| `src/code.ts` | 수정 | `VariableData` + `ExtractOptions` 인터페이스 확장, 신규 함수 2개 추가, `extractAll()` 조건 분기 추가 |
| `src/ui.js` | 수정 | `useVisualParser` 토글 상태 관리, extract 메시지에 옵션 전달 |
| `src/ui.html` | 수정 | 필터 화면에 시각 파싱 토글 체크박스 추가 |

---

## 2. 인터페이스 변경 (`src/code.ts`)

### 2.1 `VariableData` — `source` 필드 추가

```typescript
interface VariableData {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  collectionId: string;
  usageCount: number;
  source?: 'variable' | 'visual';  // 추가 — undefined = 'variable' (기본)
}
```

### 2.2 `ExtractOptions` — `useVisualParser` 필드 추가

```typescript
interface ExtractOptions {
  collectionIds: string[];
  useSelection: boolean;
  tokenTypes: Array<'variables' | 'colors' | 'texts' | 'effects' | 'spacing' | 'radius' | 'icons'>;
  useVisualParser?: boolean;  // 추가 — undefined = false (기본)
}
```

---

## 3. 신규 함수 설계 (`src/code.ts`)

### 3.1 `findSpacingFrames()`

```typescript
function findSpacingFrames(): (FrameNode | GroupNode | SectionNode)[] {
  return figma.currentPage.findAll(
    (n) =>
      (n.type === 'FRAME' || n.type === 'GROUP' || n.type === 'SECTION') &&
      SPACING_RE.test(n.name)
  ) as (FrameNode | GroupNode | SectionNode)[];
}
```

- **역할**: 현재 페이지에서 이름이 `SPACING_RE`에 매칭되는 모든 프레임/그룹/섹션 반환
- **탐색 범위**: 페이지 전체 (selection 무관 — 시각 파싱은 항상 페이지 기준)
- **반환값**: 매칭된 컨테이너 노드 배열 (없으면 `[]`)

---

### 3.2 `parseSpacingFromFrame(frame)`

```typescript
const VISUAL_VALUE_RE = /(\d+(?:\.\d+)?)\s*(px|rem)/i;

interface VisualTokenRaw {
  value: number;      // px 환산값
  rawText: string;    // 원본 텍스트 ("4px", "0.25rem")
  tokenName: string;  // 토큰명 (노드명 > 원본 텍스트 > 인덱스 폴백은 호출부에서 처리)
}

function parseSpacingFromFrame(
  frame: FrameNode | GroupNode | SectionNode
): VisualTokenRaw[] {
  const results: VisualTokenRaw[] = [];

  function traverse(node: SceneNode, depth: number): void {
    if (depth > 3) return;  // 탐색 깊이 제한

    if (node.type === 'TEXT') {
      const match = VISUAL_VALUE_RE.exec(node.characters);
      if (match) {
        const numVal = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const pxValue = unit === 'rem' ? Math.round(numVal * 16) : numVal;
        // 노드 이름이 문자 내용과 다르면 토큰명으로 사용 (예: "spacing-xs" vs "4px")
        const tokenName =
          node.name !== node.characters ? node.name : node.characters;
        results.push({ value: pxValue, rawText: node.characters, tokenName });
      }
    }

    if ('children' in node) {
      for (const child of node.children as SceneNode[]) {
        traverse(child, depth + 1);
      }
    }
  }

  if ('children' in frame) {
    for (const child of frame.children as SceneNode[]) {
      traverse(child, 0);
    }
  }

  return results;
}
```

- **탐색 깊이**: `depth ≤ 3` — Spacing 프레임의 일반적인 중첩 구조 충분히 커버
- **단위 변환**: `rem → px` 시 기준값 `16px` (웹 기본값)
- **토큰명 우선순위**: 노드 이름 ≠ 노드 텍스트 → 노드 이름 사용 / 동일 → 텍스트 자체 사용

---

### 3.3 `extractVisualSpacing()`

```typescript
function extractVisualSpacing(): VariableData[] {
  try {
    const frames = findSpacingFrames();
    if (frames.length === 0) return [];

    const rawTokens: VisualTokenRaw[] = [];
    for (const frame of frames) {
      rawTokens.push(...parseSpacingFromFrame(frame));
    }

    // 값 기준 중복 제거 후 오름차순 정렬
    const seen = new Set<number>();
    const deduped = rawTokens.filter((t) => {
      if (seen.has(t.value)) return false;
      seen.add(t.value);
      return true;
    });
    deduped.sort((a, b) => a.value - b.value);

    return deduped.map((t, i): VariableData => ({
      id: `visual-spacing-${i}`,
      name: t.tokenName === t.rawText ? `spacing-${i}` : t.tokenName,
      resolvedType: 'FLOAT',
      valuesByMode: { visual: t.value },
      collectionId: 'visual',
      usageCount: 0,
      source: 'visual',
    }));
  } catch (e) {
    console.error('[visual-frame-parser] extractVisualSpacing failed:', e);
    return [];  // 기존 추출 결과에 영향 없도록 빈 배열 반환
  }
}
```

- **중복 제거**: px 값 기준 (동일 값이 여러 프레임에 있을 경우 첫 번째만)
- **정렬**: 오름차순 (4, 8, 16, 32, 64 ...)
- **오류 격리**: try/catch로 전체 추출 중단 방지
- **synthetic ID**: `visual-spacing-{i}` — Variables ID 충돌 없음 (Variables ID는 UUID 형식)
- **synthetic collectionId**: `'visual'` — Variables collectionId는 UUID 형식이라 충돌 없음

---

## 4. `extractAll()` 변경 (`src/code.ts`)

### 변경 위치: Spacing 추출 직후 (line ~391)

```typescript
// 기존 코드 (변경 없음)
let spacing: VariableData[] = [];
if (types.includes('spacing')) {
  spacing = allVariables
    .filter((v) => { ... })
    .map((v) => mapVariable(v, varUsage))
    .filter((v) => !isSelectionMode || v.usageCount > 0);
}

// 추가 — Variables Spacing이 없고 useVisualParser 활성화 시
if (types.includes('spacing') && spacing.length === 0 && options.useVisualParser) {
  spacing = extractVisualSpacing();
}
```

- **조건**: `spacing.length === 0` — Variables 결과가 1개라도 있으면 시각 파싱 실행 안 함 (FR-06)
- **위치**: 기존 spacing 할당 직후, radius 처리 전
- **기존 코드 변경 없음** — 조건부 추가만

---

## 5. UI 변경

### 5.1 `src/ui.html` — 필터 화면 토글 추가

추가 위치: 필터 화면(`view-filter`) 내 추출 옵션 영역

```html
<!-- 시각 프레임 파싱 토글 -->
<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;">
  <input type="checkbox" id="useVisualParserToggle" />
  <label for="useVisualParserToggle" style="font-size:12px;color:var(--text-secondary);">
    <span data-i18n="extract.visualParserLabel">시각 프레임 파싱 (Variables 없는 파일용)</span>
  </label>
</div>
```

### 5.2 `src/ui.js` — 토글 상태 → extract 메시지 전달

```javascript
// extract 버튼 클릭 핸들러에서
var useVisualParser = $('useVisualParserToggle') ? $('useVisualParserToggle').checked : false;

parent.postMessage({
  pluginMessage: {
    type: 'extract',
    collectionIds: selectedCollectionIds,
    useSelection: useSelectionMode,
    tokenTypes: selectedTokenTypes,
    useVisualParser: useVisualParser,  // 추가
  }
}, '*');
```

### 5.3 i18n 추가 (ko/en)

```javascript
// ko
'extract.visualParserLabel': '시각 프레임 파싱 (Variables 없는 파일용)',

// en
'extract.visualParserLabel': 'Visual frame parsing (for pre-Variables files)',
```

---

## 6. 데이터 흐름

```
[UI] useVisualParserToggle.checked = true
  ↓
[UI → code.ts] extract { useVisualParser: true }
  ↓
[code.ts] extractAll({ useVisualParser: true })
  → Variables API → spacing = []  (pre-Variables 파일)
  → spacing.length === 0 && useVisualParser
      → extractVisualSpacing()
          → findSpacingFrames()  ["Spacing" 프레임 발견]
          → parseSpacingFromFrame()  [TEXT 노드 파싱]
          → dedup + sort → VariableData[] { source: 'visual' }
      → spacing = [{ name: 'spacing-0', value: 4 }, ...]
  ↓
[code.ts → UI] extract-result { spacing: [...], meta: {...} }
  ↓
[UI] spacing 결과 표시 + source='visual' 배지
```

---

## 7. 성공 기준 (설계 기반 체크리스트)

| # | 항목 | 검증 방법 |
|---|------|----------|
| 1 | `useVisualParser` 없이 호출 시 기존 동작 100% 동일 | 기존 Variables 파일 추출 비교 |
| 2 | `findSpacingFrames()`가 "Spacing" 프레임 반환 | Airtable 파일 실행 확인 |
| 3 | `parseSpacingFromFrame()`이 `4px`, `8px` 등 파싱 | 함수 직접 호출 로그 확인 |
| 4 | `extractVisualSpacing()`이 오름차순 중복제거 배열 반환 | 결과값 확인 |
| 5 | `extractAll()` spacing 결과에 `source: 'visual'` 항목 포함 | extract-result 메시지 확인 |
| 6 | 토글 off 상태에서 시각 파싱 실행 안 됨 | `useVisualParser: false` 전달 확인 |
| 7 | `npm run build` 성공 | 빌드 실행 |

---

## 8. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|----------|
| Spacing 프레임이 없음 | `findSpacingFrames()` → `[]` → 빈 배열 반환 |
| TEXT 내용이 `px/rem` 없음 (`"small"`, `"xs"`) | `VISUAL_VALUE_RE` 불일치 → 건너뜀 |
| 동일 값 중복 (`4px`가 3개 프레임에 존재) | `seen Set` 기준 첫 번째만 유지 |
| `rem` 단위 (`0.25rem` = 4px) | `Math.round(0.25 * 16) = 4` |
| depth > 3 중첩 | 탐색 중단, 발견된 것만 반환 |
| 런타임 예외 | try/catch → `[]` 반환, `console.error` 로그 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-31 | Initial design |
