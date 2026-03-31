# Design: Token Cache (마지막 추출 데이터 캐시)

> **Plan**: [token-cache.plan.md](../../01-plan/features/token-cache.plan.md)
> **Version**: 0.1.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 추출 데이터가 메모리에만 존재 — 플러그인 재오픈 시 소실, 모든 탭에서 재추출 필요 |
| **Solution** | `extractAll()` 결과를 `pf-token-cache` 키로 자동 저장, `sendCollections()` 시 자동 복원해 모든 탭에 전파 |
| **Function/UX Effect** | 재오픈 즉시 모든 탭에서 캐시 데이터 사용 가능 — 명도대비·테마 탭은 별도 조작 없이 자동 로드 |
| **Core Value** | 추출 1회로 전 탭 영구 활용 — 반복 작업 제거 |

---

## 1. 데이터 모델

### 1.1 TokenCacheEntry (저장 형식)

```typescript
interface TokenCacheEntry {
  data: ExtractedTokens;   // 전체 추출 결과 (variables, styles, meta 등)
  savedAt: string;         // ISO 8601 날짜 (예: "2026-03-30T14:22:00.000Z")
  figmaFileId: string;     // 저장 시점 figma.root.id
  figmaFileName: string;   // 저장 시점 figma.root.name (UI 배지 표시용)
}
```

### 1.2 저장 키

```typescript
const TOKEN_CACHE_KEY = 'pf-token-cache';
```

- 파일 무관 단일 키 (단순성 우선)
- 저장 위치: `figma.clientStorage` (플러그인 샌드박스 전용)

---

## 2. 메시지 프로토콜

### 2.1 자동 복원 (플러그인 오픈 시)

```
code.ts: sendCollections()
  └─ figma.clientStorage.getAsync('pf-token-cache')
       ├─ 캐시 있음 → postMessage({ type: 'cached-token-data', ...entry })
       └─ 캐시 없음 → 아무것도 하지 않음
```

**메시지 형식:**
```typescript
// code.ts → UI
{
  type: 'cached-token-data';
  data: ExtractedTokens;
  savedAt: string;
  figmaFileId: string;
  figmaFileName: string;
}
```

### 2.2 추출 완료 시 자동 저장

```
code.ts: msg.type === 'extract' 처리 시
  └─ extractAll(options).then(data =>
       figma.ui.postMessage({ type: 'extract-result', data })  // 기존
       figma.clientStorage.setAsync('pf-token-cache', {        // 신규
         data, savedAt, figmaFileId, figmaFileName
       })
     )
```

**변경 위치:** `code.ts:937~939` — `extractAll().then()` 콜백 확장

### 2.3 사용자 삭제

```
UI → code.ts:
  { type: 'token-cache-clear' }

code.ts → UI:
  figma.clientStorage.deleteAsync('pf-token-cache')
  .then(() => postMessage({ type: 'token-cache-cleared' }))
  .catch(()  => postMessage({ type: 'token-cache-cleared' }))  // 실패도 cleared 처리
```

---

## 3. code.ts 변경 사항

### 3.1 sendCollections() 확장

```typescript
// 기존 아이콘 캐시 복원 다음에 추가
async function sendCollections() {
  // ... 기존 코드 ...

  // 토큰 캐시 복원 (신규)
  try {
    const tokenCache = await figma.clientStorage.getAsync(TOKEN_CACHE_KEY) as TokenCacheEntry | undefined;
    if (tokenCache?.data) {
      figma.ui.postMessage({
        type: 'cached-token-data',
        data: tokenCache.data,
        savedAt: tokenCache.savedAt,
        figmaFileId: tokenCache.figmaFileId,
        figmaFileName: tokenCache.figmaFileName,
      });
    }
  } catch (_) {}
}
```

### 3.2 extract 핸들러 확장

```typescript
// 기존 (code.ts:937)
if (msg.type === "extract") {
  extractAll(options)
    .then((data) => figma.ui.postMessage({ type: "extract-result", data }))
    .catch((e) => figma.ui.postMessage({ type: "extract-error", message: String(e) }));
}

// 변경 후
if (msg.type === "extract") {
  extractAll(options)
    .then(async (data) => {
      figma.ui.postMessage({ type: "extract-result", data });
      // 캐시 저장 (실패해도 추출 결과에 영향 없음)
      try {
        await figma.clientStorage.setAsync(TOKEN_CACHE_KEY, {
          data,
          savedAt: new Date().toISOString(),
          figmaFileId: figma.root.id,
          figmaFileName: figma.root.name,
        } as TokenCacheEntry);
      } catch (_) {}
    })
    .catch((e) => figma.ui.postMessage({ type: "extract-error", message: String(e) }));
}
```

### 3.3 token-cache-clear 핸들러 추가

```typescript
if (msg.type === "token-cache-clear") {
  figma.clientStorage.deleteAsync(TOKEN_CACHE_KEY)
    .then(() => figma.ui.postMessage({ type: 'token-cache-cleared' }))
    .catch(() => figma.ui.postMessage({ type: 'token-cache-cleared' }));
}
```

---

## 4. ui.js 변경 사항

### 4.1 전역 캐시 상태 변수 추가

```javascript
// 기존 extractedData 변수 근처 (ui.js:235)
var tokenCacheInfo = null;  // { savedAt, figmaFileId, figmaFileName }
```

### 4.2 cached-token-data 메시지 핸들러

```javascript
if (msg.type === 'cached-token-data') {
  // 추출 탭에 동일하게 렌더링
  renderResult(msg.data);
  populateA11yColors();

  // 캐시 정보 저장 및 배지 표시
  tokenCacheInfo = {
    savedAt: msg.savedAt,
    figmaFileId: msg.figmaFileId,
    figmaFileName: msg.figmaFileName,
  };
  showTokenCacheBadge(msg.savedAt, msg.figmaFileName);

  // 탭별 자동 로드
  applyTokenCacheToTabs(msg.data);
}
```

### 4.3 extract-result 핸들러 확장

```javascript
// 기존 핸들러에 캐시 배지 갱신 추가
if (msg.type === 'extract-result') {
  renderResult(msg.data);
  populateA11yColors();

  // 캐시 배지 갱신 (신규) — savedAt은 code.ts가 저장한 시점
  // token-cache-saved 메시지 대신 extract-result 수신 후 현재 시간 표시
  showTokenCacheBadge(new Date().toISOString(), null);
  applyTokenCacheToTabs(msg.data);
}
```

### 4.4 token-cache-cleared 핸들러

```javascript
if (msg.type === 'token-cache-cleared') {
  tokenCacheInfo = null;
  hideTokenCacheBadge();
  // 각 탭 캐시 데이터 초기화 (선택적 — 세션 중 메모리 데이터는 유지)
  showToast(t('extract.cacheCleared'));
}
```

### 4.5 탭별 자동 로드 함수

```javascript
function applyTokenCacheToTabs(data) {
  // 명도대비 탭: 색상 토큰이 있으면 자동 로드
  if (data.styles && data.styles.colors && data.styles.colors.length > 0) {
    populateA11yColors();  // extractedData가 이미 설정된 상태이므로 정상 동작
    showCacheBannerInTab('a11y', tokenCacheInfo && tokenCacheInfo.savedAt);
  }

  // 테마 탭: 캐시 데이터 있으면 안내 배너만 표시
  // (테마는 별도 extract-themes 필요 — 자동 실행 대신 안내)
  showCacheBannerInTab('themes', tokenCacheInfo && tokenCacheInfo.savedAt);

  // 컴포넌트 탭: extractedData 갱신으로 간접 활용 (별도 액션 불필요)
  // 이미지 탭: extract-images 별도 필요 — 안내 배너만 표시
  showCacheBannerInTab('images', tokenCacheInfo && tokenCacheInfo.savedAt);
}
```

---

## 5. ui.html 변경 사항

### 5.1 추출 탭 — 캐시 배지

**위치:** 추출 결과 카운트 헤더 영역 (기존 `#extractCount` 근처)

```html
<!-- 추출 결과 헤더 영역 (기존 레이아웃에 배지 추가) -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
  <div style="display:flex;align-items:center;gap:6px;">
    <div class="section-label" style="margin-bottom:0;">
      추출 결과 (<span id="extractCount">0</span>개)
    </div>
    <!-- 캐시 배지 (신규) -->
    <span id="tokenCacheBadge" class="hidden"
          style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-muted);">
      <span id="tokenCacheSavedAt"></span>
      <button id="tokenCacheClearBtn"
              style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:0 2px;line-height:1;"
              title="캐시 삭제">×</button>
    </span>
  </div>
  <!-- 기존 다운로드 버튼 -->
  ...
</div>
```

### 5.2 CSS 추가

```css
/* 캐시 배지 — 아이콘 탭 기존 스타일 재사용 */
/* iconCacheBadge와 동일한 스타일 패턴 적용 */
/* .hidden { display: none; } — 이미 존재 */
```

### 5.3 탭별 캐시 안내 배너 (공통 템플릿)

명도대비·테마·이미지 탭에 캐시 출처 표시용 배너:

```html
<!-- 각 탭 패널 상단 (캐시 복원 시 표시) -->
<div id="{tab}CacheBanner" class="hidden"
     style="font-size:11px;color:var(--text-muted);padding:4px 10px;background:var(--bg);
            border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
  <span data-i18n="extract.cacheRestoredFrom">캐시에서 복원됨:</span>
  <span id="{tab}CacheBannerDate"></span>
</div>
```

---

## 6. i18n 키 추가

### ko

```javascript
extract: {
  // 기존 키 유지 ...
  cacheLabel: '캐시',          // 배지 레이블
  cacheCleared: '캐시가 삭제됐습니다',
  cacheRestoredFrom: '캐시에서 복원:',
  cacheClearConfirm: '추출 캐시를 삭제할까요? 다음 추출 전까지 복원할 수 없습니다.',
}
```

### en

```javascript
extract: {
  // 기존 키 유지 ...
  cacheLabel: 'Cache',
  cacheCleared: 'Cache cleared',
  cacheRestoredFrom: 'Restored from cache:',
  cacheClearConfirm: 'Delete extraction cache? Cannot be restored until next extraction.',
}
```

---

## 7. ui.js 헬퍼 함수

### 7.1 showTokenCacheBadge / hideTokenCacheBadge

```javascript
function showTokenCacheBadge(savedAt, fileName) {
  var badge = $('tokenCacheBadge');
  var dateEl = $('tokenCacheSavedAt');
  if (!badge || !dateEl) return;
  var d = new Date(savedAt);
  var label = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (fileName) label = fileName + ' · ' + label;
  dateEl.textContent = label;
  badge.classList.remove('hidden');
  badge.style.display = 'flex';
}

function hideTokenCacheBadge() {
  var badge = $('tokenCacheBadge');
  if (badge) { badge.classList.add('hidden'); badge.style.display = 'none'; }
}
```

### 7.2 showCacheBannerInTab / hideCacheBannerInTab

```javascript
function showCacheBannerInTab(tabId, savedAt) {
  var banner = $(tabId + 'CacheBanner');
  var dateEl = $(tabId + 'CacheBannerDate');
  if (!banner || !savedAt) return;
  if (dateEl) dateEl.textContent = new Date(savedAt).toLocaleDateString();
  banner.classList.remove('hidden');
  banner.style.display = 'flex';
}

function hideCacheBannerInTab(tabId) {
  var banner = $(tabId + 'CacheBanner');
  if (banner) { banner.classList.add('hidden'); banner.style.display = 'none'; }
}
```

### 7.3 tokenCacheClearBtn 이벤트

```javascript
var _tokenCacheClearBtn = $('tokenCacheClearBtn');
if (_tokenCacheClearBtn) {
  _tokenCacheClearBtn.addEventListener('click', function() {
    if (!confirm(t('extract.cacheClearConfirm'))) return;
    parent.postMessage({ pluginMessage: { type: 'token-cache-clear' } }, '*');
  });
}
```

---

## 8. 구현 순서

### Phase 1: code.ts (백엔드)
1. `TOKEN_CACHE_KEY` 상수 선언
2. `TokenCacheEntry` 인터페이스 추가
3. `sendCollections()` — 토큰 캐시 복원 로직 추가
4. `extract` 핸들러 — 저장 로직 추가 (async 확장)
5. `token-cache-clear` 핸들러 추가

### Phase 2: ui.html (뷰)
1. 추출 탭 캐시 배지 HTML 추가 (`tokenCacheBadge`, `tokenCacheSavedAt`, `tokenCacheClearBtn`)
2. 명도대비 탭 캐시 안내 배너 추가 (`a11yCacheBanner`)
3. 테마 탭 캐시 안내 배너 추가 (`themesCacheBanner`)
4. 이미지 탭 캐시 안내 배너 추가 (`imagesCacheBanner`)

### Phase 3: ui.js (로직)
1. `tokenCacheInfo` 변수 추가
2. i18n `extract` 섹션에 캐시 키 추가 (ko/en)
3. `showTokenCacheBadge()`, `hideTokenCacheBadge()` 헬퍼
4. `showCacheBannerInTab()`, `hideCacheBannerInTab()` 헬퍼
5. `applyTokenCacheToTabs()` 함수
6. `cached-token-data` 메시지 핸들러
7. `token-cache-cleared` 메시지 핸들러
8. `extract-result` 핸들러에 `showTokenCacheBadge()` + `applyTokenCacheToTabs()` 추가
9. `tokenCacheClearBtn` 이벤트 리스너

---

## 9. 완료 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| 1 | 추출 완료 시 `pf-token-cache` 저장 | Figma 재오픈 후 배지 표시 확인 |
| 2 | 재오픈 시 캐시 자동 복원 → 추출 탭 데이터 표시 | 플러그인 닫고 재오픈 |
| 3 | 추출 탭 배지 날짜 + × 버튼 표시 | 시각 확인 |
| 4 | × 버튼 → 확인 다이얼로그 → 삭제 → 배지 사라짐 | 클릭 테스트 |
| 5 | 명도대비 탭 자동 색상 토큰 로드 + 배너 | 탭 전환 확인 |
| 6 | 테마 탭 캐시 배너 표시 | 탭 전환 확인 |
| 7 | 이미지 탭 캐시 배너 표시 | 탭 전환 확인 |
| 8 | 아이콘 탭 기존 `lastIconData` 캐시 영향 없음 | 아이콘 탭 정상 동작 확인 |
| 9 | 한/영 i18n 정상 표시 | 언어 전환 확인 |

---

## 10. 변경 파일 요약

| 파일 | 변경 유형 | 변경 내용 |
|------|----------|----------|
| `src/code.ts` | 수정 | `TOKEN_CACHE_KEY` 상수, `TokenCacheEntry` 인터페이스, `sendCollections()` 확장, `extract` 핸들러 확장, `token-cache-clear` 핸들러 추가 |
| `src/ui.html` | 수정 | 캐시 배지 HTML (추출 탭), 캐시 배너 HTML (명도대비·테마·이미지 탭) |
| `src/ui.js` | 수정 | `tokenCacheInfo` 변수, i18n 키 추가, 헬퍼 함수 4개, 메시지 핸들러 2개, 기존 핸들러 확장 1개, 이벤트 리스너 1개 |
