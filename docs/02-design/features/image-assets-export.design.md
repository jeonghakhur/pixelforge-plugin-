# Design: Image Assets Export

> Plan 참조: `docs/01-plan/features/image-assets-export.plan.md`

---

## 1. 화면 플로우

```
[images-view]  ← 메인 탭 "Images" 클릭
  │
  ├─ 옵션 바 (포맷 / 배율 / 범위 선택)
  │
  ├─ [이미지 탐지하기] 버튼 클릭
  │     ↓
  ├─ [detecting-state] "이미지를 탐지하고 있습니다..."
  │     ↓
  ├─ 탐지 결과 없음 → [empty-state] 안내 메시지
  │
  └─ 탐지 결과 있음 → [image-list]
        │  썸네일 + 파일명 + 크기 + 개별 다운로드 버튼
        │
        └─ [footer] "전체 ZIP 다운로드 (N개 × M배율)"
```

---

## 2. 탭 통합 — 기존 메인 탭에 "Images" 추가

### 현재 탭 구성

```
[ 추출 ]  [ 아이콘 ]  [ 명도대비 ]  [ 테마 ]  [ 컴포넌트 ]
```

### 변경 후

```
[ 추출 ]  [ 아이콘 ]  [ 명도대비 ]  [ 테마 ]  [ 컴포넌트 ]  [ 이미지 ]
```

- i18n 키 추가: `tabs.image` = `'이미지'` (ko) / `'Images'` (en)
- 탭 ID: `'image'`
- 탭 핸들러: 기존 `switchTab()` 패턴 그대로 사용

---

## 3. Images 탭 — 상세 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  PF PixelForge  │  [파일명]                             │  ← 공통 Header
├─────────────────────────────────────────────────────────┤
│  [ 추출 ][ 아이콘 ][ 명도대비 ][ 테마 ][ 컴포넌트 ][ 이미지 ]│  ← 메인 탭
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── 옵션 바 ──────────────────────────────────────┐  │
│  │  포맷   [● PNG  ○ JPG]                           │  │
│  │  배율   [☑ 1×]  [☑ 2×]  [☐ 3×]                  │  │
│  │  범위   [● 전체 페이지   ○ 선택 레이어]           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [ 이미지 탐지하기 ]  ← 버튼 (full-width)              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── 탐지 전 (초기) ──────────────────────────────────── │
│  [🖼 이미지를 탐지하려면 위 버튼을 클릭하세요]         │
│                                                         │
│  ── 탐지 중 ─────────────────────────────────────────── │
│  [⏳ 이미지를 탐지하고 있습니다...]                    │
│                                                         │
│  ── 결과 없음 ───────────────────────────────────────── │
│  [📭 이미지 에셋을 찾을 수 없습니다]                   │
│  IMAGE fill이 적용된 노드가 없거나                     │
│  선택 범위 내에 포함되지 않았습니다.                   │
│                                                         │
│  ── 결과 목록 ───────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ┌──────┐  hero-banner          1440 × 480 px  [⬇]│  │
│  │ │ 🖼   │  hero-banner@1x.png · hero-banner@2x.png│  │
│  │ └──────┘                                         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ┌──────┐  product-card-bg        800 × 600 px [⬇]│  │
│  │ │ 🖼   │  product-card-bg@1x.png · @2x.png       │  │
│  │ └──────┘                                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [⬇ 전체 ZIP 다운로드  (3개 · 6파일)]                  │  ← 고정 푸터
└─────────────────────────────────────────────────────────┘
```

---

## 4. 컴포넌트 상세 스펙

### 4.1 옵션 바

```
포맷 선택 — radio group
  ● PNG  ○ JPG
  (기본: PNG)

배율 선택 — checkbox group (복수 선택)
  [☑ 1×]  [☑ 2×]  [☐ 3×]
  (기본: 1×, 2× 선택)
  → 최소 1개 이상 선택 강제 (모두 해제 불가)

범위 선택 — radio group
  ● 전체 페이지  ○ 선택 레이어
  (선택 레이어가 없을 때 "선택 레이어" 옵션 비활성화 + 툴팁)
```

### 4.2 이미지 목록 아이템

```
┌──────────────────────────────────────────────────────┐
│ ┌──────┐  {이름}              {width} × {height} px  │
│ │ img  │  {파일명1} · {파일명2} · ...                 │
│ │  썸  │                                          [⬇] │
│ │  네  │                                              │
│ │  일  │                                              │
│ └──────┘                                              │
└──────────────────────────────────────────────────────┘
```

- **썸네일**: 60×60px, `object-fit: cover`, `border-radius: 4px`
- **이름**: kebab-case, 넘칠 경우 ellipsis
- **크기**: `{width} × {height} px` (원본 크기 기준)
- **파일명 목록**: 선택된 배율 조합 — `hero@1x.png · hero@2x.png`
- **개별 다운로드 버튼** `[⬇]`: 선택된 모든 배율을 해당 이미지만 ZIP으로 다운로드 (배율이 1개면 단일 파일)

### 4.3 푸터 다운로드 바

```
[⬇ 전체 ZIP 다운로드  (N개 · M파일)]
```

- `N개`: 탐지된 이미지 노드 수
- `M파일`: N × 선택 배율 수
- 이미지가 없으면 버튼 비활성화

---

## 5. 상태 전이

```
idle ──[탐지 클릭]──► detecting ──[성공, 0개]──► empty
                                 └─[성공, 1+개]──► list
                                 └─[실패]────────► error
```

| 상태 | 표시 요소 |
|------|-----------|
| `idle` | 안내 텍스트 ("위 버튼을 클릭하세요") |
| `detecting` | 스피너 + 로딩 텍스트 |
| `empty` | 빈 상태 일러스트 + 안내 메시지 |
| `list` | 이미지 목록 + 푸터 다운로드 바 |
| `error` | 오류 메시지 + 재시도 버튼 |

---

## 6. 데이터 흐름 — 상세

### 6.1 code.ts 추가 함수

```typescript
// 이미지 fill을 가진 노드 탐지
function findImageNodes(useSelection: boolean): ImageData[] {
  const EXPORTABLE = new Set(['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);
  const source = useSelection && figma.currentPage.selection.length > 0
    ? figma.currentPage.selection
    : figma.currentPage.children;

  const results: ImageData[] = [];
  const seen = new Set<string>();

  function traverse(node: SceneNode) {
    if (!EXPORTABLE.has(node.type)) return;
    if (seen.has(node.id)) return;

    const fills = (node as any).fills;
    const hasImageFill = Array.isArray(fills) &&
      fills.some((p: any) => p.type === 'IMAGE' && p.visible !== false);

    if (hasImageFill) {
      seen.add(node.id);
      results.push({
        id: node.id,
        name: node.name,
        kebab: toKebabCase(node.name),
        nodeType: node.type,
        width: Math.round(node.width),
        height: Math.round(node.height),
      });
    }

    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) traverse(child as SceneNode);
    }
  }

  for (const node of source) traverse(node as SceneNode);
  return results;
}

// 탐지된 노드들을 지정 포맷/배율로 익스포트
async function extractImages(options: ExtractImagesOptions): Promise<ImageAsset[]> {
  const nodes = findImageNodes(options.useSelection);
  const ext = options.format === 'PNG' ? 'png' : 'jpg';
  const mime = options.format === 'PNG' ? 'image/png' : 'image/jpeg';
  const results: ImageAsset[] = [];

  for (const nodeData of nodes) {
    const node = await figma.getNodeByIdAsync(nodeData.id) as SceneNode | null;
    if (!node) continue;

    for (const scale of options.scales) {
      try {
        const bytes = await (node as any).exportAsync({
          format: options.format,
          constraint: { type: 'SCALE', value: scale },
        });
        const base64 = uint8ToBase64(new Uint8Array(bytes));
        results.push({
          ...nodeData,
          format: options.format,
          scale,
          fileName: `${nodeData.kebab}@${scale}x.${ext}`,
          base64,
          mimeType: mime,
          byteSize: bytes.byteLength,
        });
      } catch (_) {
        // 익스포트 불가 노드 skip
      }
    }
  }
  return results;
}

// Uint8Array → base64 문자열
function uint8ToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
```

### 6.2 메시지 핸들러 (code.ts onmessage 추가)

```typescript
if (msg.type === 'extract-images') {
  const options: ExtractImagesOptions = msg.options ?? {
    format: 'PNG',
    scales: [1, 2],
    useSelection: false,
  };
  extractImages(options)
    .then((data) => figma.ui.postMessage({ type: 'extract-images-result', data }))
    .catch((e) => figma.ui.postMessage({ type: 'extract-images-error', message: String(e) }));
}
```

### 6.3 UI 상태 관리 (ui.js 추가)

```javascript
// 상태
let imageState = 'idle'; // idle | detecting | empty | list | error
let imageAssets = [];    // ImageAsset[]
let imageFormat = 'PNG';
let imageScales = [1, 2]; // 선택된 배율 배열
let imageUseSelection = false;

// 탐지 실행
function detectImages() {
  imageState = 'detecting';
  renderImageView();
  parent.postMessage({
    pluginMessage: {
      type: 'extract-images',
      options: { format: imageFormat, scales: imageScales, useSelection: imageUseSelection },
    }
  }, '*');
}

// 메시지 수신
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'extract-images-result') {
    imageAssets = msg.data;
    imageState = imageAssets.length === 0 ? 'empty' : 'list';
    renderImageView();
  }
  if (msg.type === 'extract-images-error') {
    imageState = 'error';
    renderImageView();
  }
};
```

---

## 7. ZIP 생성 — Store-only 구현

```javascript
// Store-only ZIP (압축 없음, 순수 JS)
function buildStoreZip(files) {
  // files: Array<{ name: string, data: Uint8Array }>
  const encoder = new TextEncoder();
  const parts = [];
  const centralDir = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const localHeader = buildLocalFileHeader(nameBytes, file.data, offset);
    centralDir.push(buildCentralDirEntry(nameBytes, file.data, offset));
    parts.push(localHeader, file.data);
    offset += localHeader.byteLength + file.data.byteLength;
  }

  const eocd = buildEOCD(files.length, offset, centralDir);
  return concatenate([...parts, ...centralDir, eocd]);
}

// base64 → Uint8Array 변환
function base64ToUint8(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// Blob URL 다운로드
function downloadBlob(data, fileName, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
```

**ZIP 다운로드 트리거:**

```javascript
function downloadAllZip() {
  const files = imageAssets.map((asset) => ({
    name: asset.fileName,
    data: base64ToUint8(asset.base64),
  }));
  const zip = buildStoreZip(files);
  const fileName = `${figmaFileName}-images.zip`;
  downloadBlob(zip, fileName, 'application/zip');
}

// 개별 이미지 다운로드 (배율이 1개면 단일 파일, 여러 개면 소형 ZIP)
function downloadSingleImage(nodeId) {
  const assets = imageAssets.filter((a) => a.id === nodeId);
  if (assets.length === 1) {
    const a = assets[0];
    downloadBlob(base64ToUint8(a.base64), a.fileName, a.mimeType);
  } else {
    const files = assets.map((a) => ({ name: a.fileName, data: base64ToUint8(a.base64) }));
    const zip = buildStoreZip(files);
    downloadBlob(zip, `${assets[0].kebab}.zip`, 'application/zip');
  }
}
```

---

## 8. i18n 추가 키

```javascript
// ko
image: {
  title: '이미지 에셋 추출',
  format: '포맷',
  scale: '배율',
  scope: '범위',
  allPage: '전체 페이지',
  selection: '선택 레이어',
  detectBtn: '이미지 탐지하기',
  detecting: '이미지를 탐지하고 있습니다...',
  idle: '위 버튼을 클릭하여 이미지 에셋을 탐지하세요.',
  empty: '이미지 에셋을 찾을 수 없습니다.',
  emptyHint: 'IMAGE fill이 적용된 노드가 없거나 선택 범위에 포함되지 않았습니다.',
  downloadAll: '전체 ZIP 다운로드',
  downloadAllCount: '({n}개 · {m}파일)',
  downloadOne: '개별 다운로드',
  error: '이미지 추출 실패: ',
  noSelection: '먼저 레이어를 선택하세요',
},

// en
image: {
  title: 'Image Asset Export',
  format: 'Format',
  scale: 'Scale',
  scope: 'Scope',
  allPage: 'Entire Page',
  selection: 'Selection',
  detectBtn: 'Detect Images',
  detecting: 'Detecting image assets...',
  idle: 'Click the button above to detect image assets.',
  empty: 'No image assets found.',
  emptyHint: 'No nodes with IMAGE fill found in the current scope.',
  downloadAll: 'Download All ZIP',
  downloadAllCount: '({n} images · {m} files)',
  downloadOne: 'Download',
  error: 'Image export failed: ',
  noSelection: 'Select layers first',
},
```

---

## 9. 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/code.ts` | `ImageData`, `ImageAsset`, `ExtractImagesOptions` 인터페이스 추가; `findImageNodes()`, `extractImages()`, `uint8ToBase64()` 함수 추가; `onmessage`에 `extract-images` 핸들러 추가 |
| `src/ui.js` | i18n `image` 키 추가; `tabs.image` 추가; Images 탭 렌더링 함수(`renderImageView`) 추가; `buildStoreZip()`, `downloadAllZip()`, `downloadSingleImage()` 유틸 추가; `onmessage`에 `extract-images-result` / `extract-images-error` 핸들러 추가 |

---

## 10. 완료 기준 (Plan 대응)

| Plan FR | 설계 반영 |
|---------|-----------|
| FR-01 | `findImageNodes()` — IMAGE fill 순회 탐지 |
| FR-02 | `useSelection` 옵션 → `figma.currentPage.selection` 사용 |
| FR-03 | `exportAsync({ format, constraint: { type: 'SCALE', value } })` |
| FR-04 | `uint8ToBase64()` — bytes → base64 변환 후 postMessage |
| FR-05 | `<img src="data:{mime};base64,{base64}">` 썸네일 렌더링 |
| FR-06 | `downloadSingleImage(nodeId)` |
| FR-07 | `buildStoreZip()` + `downloadAllZip()` |
| FR-08 | PNG/JPG 라디오 UI |
| FR-09 | 1×/2×/3× 체크박스, `scales` 배열 전달 |
| FR-10 | `tabs.image` 추가, 기존 `switchTab()` 패턴 사용 |
| FR-11 | `empty` 상태 → 빈 상태 메시지 |
