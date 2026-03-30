# Design: icon-search-preview

> Plan 참조: `docs/01-plan/features/icon-search-preview.plan.md`

---

## 1. 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/ui.js` | 수정 | 검색 UI, 상세 패널, 색상 모드, i18n 추가 |
| `src/code.ts` | 변경 없음 | SVG 이미 추출됨 |

---

## 2. 상태 설계 (State)

### 2.1 신규 상태 변수 (`src/ui.js` 전역)

```javascript
// 기존 iconData = [] 유지
var iconSearchQuery = '';          // 현재 검색어
var iconFilteredData = [];         // 검색 필터 결과
var iconSelectedIdx = null;        // 선택된 아이콘 인덱스 (filteredData 기준)
var iconColorMode = 'currentColor'; // 'currentColor' | 'cssVar' | 'custom'
var iconColorValue = '--icon-color'; // cssVar 모드: CSS변수명 / custom 모드: hex
var iconDetailTab = 'svg';          // 'svg' | 'react' | 'css'
```

### 2.2 기존 상태 유지

```javascript
var iconData = [];    // 전체 아이콘 (변경 없음)
var iconMode = 'all'; // 전체/선택 모드 (변경 없음)
```

---

## 3. HTML 구조 변경

### 3.1 신규 DOM 요소 (아이콘 탭 내 추가)

#### A. 검색바 (`#iconSearchRow`)
**삽입 위치**: 아이콘 탭 내 `#iconResults` 바로 위, 추출 버튼 아래

```html
<!-- 검색 바 (추출 전: hidden, 추출 후: visible) -->
<div id="iconSearchRow" class="icon-search-row hidden">
  <div class="icon-search-box">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <input id="iconSearchInput" type="text" class="icon-search-input"
           placeholder="아이콘 검색..." autocomplete="off" />
    <button id="iconSearchClear" class="icon-search-clear hidden">×</button>
  </div>
  <span id="iconFilterCount" class="icon-filter-count"></span>
</div>
```

#### B. 상세 패널 (`#iconDetailPanel`)
**삽입 위치**: `#iconResults` 바로 아래

```html
<div id="iconDetailPanel" class="icon-detail-panel hidden">
  <!-- 헤더 -->
  <div class="icon-detail-header">
    <div class="icon-detail-header-left">
      <div id="iconDetailThumb" class="icon-detail-thumb"></div>
      <span id="iconDetailName" class="icon-detail-name"></span>
    </div>
    <button id="iconDetailClose" class="btn-ghost icon-detail-close">×</button>
  </div>

  <!-- 색상 컨트롤 -->
  <div class="icon-color-controls">
    <span class="icon-color-label" data-i18n="icon.colorMode">색상 모드</span>
    <div class="icon-color-row">
      <select id="iconColorModeSelect" class="icon-color-select">
        <option value="currentColor">currentColor</option>
        <option value="cssVar">CSS 변수</option>
        <option value="custom">커스텀 색상</option>
      </select>
      <input id="iconColorVarInput" type="text" class="icon-color-var-input hidden"
             placeholder="--icon-color" />
      <input id="iconColorPicker" type="color" class="icon-color-picker hidden" value="#000000" />
    </div>
  </div>

  <!-- 소스 탭 -->
  <div class="icon-detail-tabs">
    <button class="icon-detail-tab active" data-detail-tab="svg">SVG</button>
    <button class="icon-detail-tab" data-detail-tab="react">React</button>
    <button class="icon-detail-tab" data-detail-tab="css">CSS</button>
  </div>

  <!-- 코드 영역 -->
  <div class="icon-detail-code-wrap">
    <pre id="iconDetailCode" class="icon-detail-code"></pre>
    <button id="iconDetailCopyBtn" class="btn-ghost icon-detail-copy">복사</button>
  </div>
</div>
```

### 3.2 기존 `renderIconResults` 변경점

- `#iconResults` 내 카드에 `data-idx` 추가 (이미 있음 — 재사용)
- 카드 클릭 이벤트 추가 (기존 버튼 클릭과 별도)
- `#iconCount` → `#iconCount` (유지) + `#iconFilterCount` (신규, 검색 결과용)

---

## 4. CSS 추가 (ui.js 내 `<style>` 블록)

```css
/* ── Icon Search ── */
.icon-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.icon-search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 10px;
  height: 32px;
  transition: border-color 0.15s;
}
.icon-search-box:focus-within {
  border-color: var(--primary);
}
.search-icon { color: var(--text-muted); flex-shrink: 0; }
.icon-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text);
  min-width: 0;
}
.icon-search-input::placeholder { color: var(--text-muted); }
.icon-search-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}
.icon-filter-count {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Icon Detail Panel ── */
.icon-detail-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 8px;
  overflow: hidden;
}
.icon-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.icon-detail-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-detail-thumb {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-alt);
  border-radius: 4px;
}
.icon-detail-thumb svg { width: 20px; height: 20px; color: var(--text); }
.icon-detail-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon-detail-close {
  color: var(--text-muted);
  font-size: 16px;
  padding: 2px 6px;
}

/* ── Color Controls ── */
.icon-color-controls {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.icon-color-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.icon-color-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.icon-color-select {
  height: 26px;
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
  padding: 0 6px;
  cursor: pointer;
}
.icon-color-var-input {
  flex: 1;
  height: 26px;
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
  padding: 0 8px;
  outline: none;
  font-family: var(--font-mono, monospace);
}
.icon-color-var-input:focus { border-color: var(--primary); }
.icon-color-picker {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  background: var(--bg);
}

/* ── Detail Tabs ── */
.icon-detail-tabs {
  display: flex;
  gap: 0;
  padding: 8px 12px 0;
}
.icon-detail-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.icon-detail-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.icon-detail-tab:hover:not(.active) { color: var(--text); }

/* ── Code Area ── */
.icon-detail-code-wrap {
  position: relative;
  margin: 8px 12px 12px;
}
.icon-detail-code {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 36px 10px 10px;
  font-size: 10px;
  font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow-y: auto;
  margin: 0;
}
.icon-detail-copy {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px;
  padding: 2px 8px;
  height: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
}
.icon-detail-copy:hover { color: var(--text); border-color: var(--primary); }

/* ── 선택된 아이콘 카드 강조 ── */
.icon-card.selected {
  border-color: var(--primary) !important;
  background: var(--primary-light) !important;
}
```

---

## 5. 함수 설계

### 5.1 `replaceSvgColor(svg, mode, value)` — SVG 색상 치환

```javascript
function replaceSvgColor(svg, mode, value) {
  var KEEP = /^(none|transparent|currentColor)$/i;
  var fillRe = /fill="([^"]*)"/g;
  var strokeRe = /stroke="([^"]*)"/g;

  function replace(attr, val) {
    if (KEEP.test(val)) return attr + '="' + val + '"';
    if (mode === 'currentColor') return attr + '="currentColor"';
    if (mode === 'cssVar')       return attr + '="var(' + value + ')"';
    /* custom */                 return attr + '="' + value + '"';
  }

  return svg
    .replace(fillRe, function(_, v) { return replace('fill', v); })
    .replace(strokeRe, function(_, v) { return replace('stroke', v); });
}
```

### 5.2 `buildReactComponent(icon, processedSvg)` — React 코드 생성

```javascript
function buildReactComponent(icon, processedSvg) {
  var clean = cleanSvg(processedSvg);
  // SVG에 {...props} 추가
  var withProps = clean.replace(/<svg/, '<svg {...props}');
  return 'import type { SVGProps } from "react";\n\n'
    + 'export const ' + icon.pascal + ' = (props: SVGProps<SVGSVGElement>) => (\n'
    + '  ' + withProps + '\n'
    + ');';
}
```

### 5.3 `buildCssOutput(icon, mode, value)` — CSS 코드 생성

```javascript
function buildCssOutput(icon, mode, value) {
  var cls = '.' + icon.kebab;
  var lines = [];

  if (mode === 'currentColor') {
    lines.push('/* currentColor — 부모 color 속성 상속 */');
    lines.push(':root {');
    lines.push('  --color-icon: #1e293b; /* light */');
    lines.push('}');
    lines.push('[data-theme="dark"] {');
    lines.push('  --color-icon: #f1f5f9; /* dark */');
    lines.push('}');
    lines.push('');
    lines.push(cls + ' {');
    lines.push('  color: var(--color-icon);');
    lines.push('}');
  } else if (mode === 'cssVar') {
    lines.push('/* CSS 변수 모드 */');
    lines.push(':root {');
    lines.push('  ' + value + ': #1e293b; /* light */');
    lines.push('}');
    lines.push('[data-theme="dark"] {');
    lines.push('  ' + value + ': #f1f5f9; /* dark */');
    lines.push('}');
  } else {
    lines.push('/* 커스텀 색상 */');
    lines.push(cls + ' {');
    lines.push('  color: ' + value + ';');
    lines.push('}');
  }

  return lines.join('\n');
}
```

### 5.4 `filterIcons(query)` — 검색 필터

```javascript
function filterIcons(query) {
  iconSearchQuery = query.trim().toLowerCase();
  if (!iconSearchQuery) {
    iconFilteredData = iconData.slice();
  } else {
    iconFilteredData = iconData.filter(function(icon) {
      return icon.name.toLowerCase().indexOf(iconSearchQuery) !== -1
          || icon.kebab.toLowerCase().indexOf(iconSearchQuery) !== -1;
    });
  }
  renderIconGrid();
  updateFilterCount();
}
```

### 5.5 `renderIconGrid()` — 그리드 렌더링 (기존 renderIconResults에서 분리)

```javascript
function renderIconGrid() {
  var list = $('iconList');
  var data = iconFilteredData.length > 0 || iconSearchQuery
    ? iconFilteredData
    : iconData;

  if (data.length === 0) {
    var msg = iconSearchQuery
      ? (lang === 'ko' ? '검색 결과 없음' : 'No results')
      : t('icon.noIcons');
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;grid-column:1/-1;">' + msg + '</div>';
    return;
  }

  list.innerHTML = data.map(function(icon, idx) {
    var isSelected = iconSelectedIdx !== null && iconFilteredData[iconSelectedIdx] === icon;
    return '<div class="icon-card' + (isSelected ? ' selected' : '') + '" data-idx="' + idx + '">'
      + '<div class="icon-card-preview">' + cleanSvg(icon.svg) + '</div>'
      + '<div class="icon-card-name">' + escapeHtml(icon.name) + '</div>'
      + '<div class="icon-card-actions">'
      + '<button class="btn-ghost icon-copy-btn" data-idx="' + idx + '" data-action="svg" style="height:24px;padding:0 6px;font-size:9px;">SVG</button>'
      + '<button class="btn-ghost icon-copy-btn" data-idx="' + idx + '" data-action="react" style="height:24px;padding:0 6px;font-size:9px;">React</button>'
      + '</div>'
      + '</div>';
  }).join('');
}
```

### 5.6 `selectIcon(idx)` — 아이콘 선택 → 상세 패널 표시

```javascript
function selectIcon(idx) {
  var data = iconFilteredData.length > 0 || iconSearchQuery
    ? iconFilteredData : iconData;
  var icon = data[idx];
  if (!icon) return;

  // Toggle: 같은 아이콘 클릭 시 패널 닫기
  if (iconSelectedIdx === idx) {
    iconSelectedIdx = null;
    $('iconDetailPanel').classList.add('hidden');
    renderIconGrid();
    return;
  }

  iconSelectedIdx = idx;
  renderIconGrid(); // 선택 강조 업데이트

  // 패널 채우기
  $('iconDetailName').textContent = icon.name;
  $('iconDetailThumb').innerHTML = cleanSvg(icon.svg);
  $('iconDetailPanel').classList.remove('hidden');
  updateDetailCode();
}
```

### 5.7 `updateDetailCode()` — 탭/색상 모드 변경 시 코드 갱신

```javascript
function updateDetailCode() {
  var data = iconFilteredData.length > 0 || iconSearchQuery
    ? iconFilteredData : iconData;
  if (iconSelectedIdx === null) return;
  var icon = data[iconSelectedIdx];
  if (!icon) return;

  var processedSvg = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
  var code = '';

  if (iconDetailTab === 'svg') {
    code = processedSvg;
  } else if (iconDetailTab === 'react') {
    code = buildReactComponent(icon, processedSvg);
  } else if (iconDetailTab === 'css') {
    code = buildCssOutput(icon, iconColorMode, iconColorValue);
  }

  $('iconDetailCode').textContent = code;

  // 썸네일도 색상 모드 반영 (custom만)
  if (iconColorMode === 'custom') {
    var thumb = $('iconDetailThumb');
    thumb.style.color = iconColorValue;
    thumb.innerHTML = cleanSvg(icon.svg);
  }
}
```

### 5.8 `updateFilterCount()` — 검색 결과 카운트 업데이트

```javascript
function updateFilterCount() {
  var countEl = $('iconFilterCount');
  if (!iconSearchQuery) {
    countEl.textContent = iconData.length + (lang === 'ko' ? '개' : ' icons');
  } else {
    var f = iconFilteredData.length;
    var t2 = iconData.length;
    countEl.textContent = lang === 'ko'
      ? f + '/' + t2 + '개'
      : f + '/' + t2;
  }
}
```

---

## 6. 이벤트 바인딩

### 6.1 검색 입력

```javascript
var iconSearchInput = $('iconSearchInput');
var iconSearchClear = $('iconSearchClear');
var iconSearchDebounce = null;

iconSearchInput.addEventListener('input', function() {
  clearTimeout(iconSearchDebounce);
  var q = iconSearchInput.value;
  iconSearchClear.classList.toggle('hidden', q === '');
  iconSearchDebounce = setTimeout(function() {
    filterIcons(q);
  }, 150);
});

iconSearchClear.addEventListener('click', function() {
  iconSearchInput.value = '';
  iconSearchClear.classList.add('hidden');
  filterIcons('');
  iconSearchInput.focus();
});
```

### 6.2 아이콘 카드 클릭 (이벤트 위임 — 기존 핸들러 수정)

```javascript
// 기존 $('iconList').addEventListener('click', ...) 수정
$('iconList').addEventListener('click', function(e) {
  var btn = e.target.closest('.icon-copy-btn');
  if (btn) {
    // 기존 복사 로직 유지 (변경 없음)
    var idx = parseInt(btn.dataset.idx, 10);
    var action = btn.dataset.action;
    var data = iconFilteredData.length > 0 || iconSearchQuery ? iconFilteredData : iconData;
    var icon = data[idx];
    if (!icon) return;
    if (action === 'svg') { copyToClipboard(cleanSvg(icon.svg)); showToast(t('icon.copySvg')); }
    else if (action === 'react') {
      var react = buildReactComponent(icon, replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue));
      copyToClipboard(react); showToast(t('icon.copyReact'));
    }
    return;
  }
  // 카드 클릭 → 상세 패널
  var card = e.target.closest('.icon-card');
  if (card) {
    selectIcon(parseInt(card.dataset.idx, 10));
  }
});
```

### 6.3 상세 패널 탭 전환

```javascript
document.addEventListener('click', function(e) {
  var tab = e.target.closest('.icon-detail-tab');
  if (!tab) return;
  iconDetailTab = tab.dataset.detailTab;
  document.querySelectorAll('.icon-detail-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.detailTab === iconDetailTab);
  });
  updateDetailCode();
});
```

### 6.4 색상 모드 변경

```javascript
$('iconColorModeSelect').addEventListener('change', function() {
  iconColorMode = this.value;
  $('iconColorVarInput').classList.toggle('hidden', iconColorMode !== 'cssVar');
  $('iconColorPicker').classList.toggle('hidden', iconColorMode !== 'custom');

  if (iconColorMode === 'cssVar') iconColorValue = $('iconColorVarInput').value || '--icon-color';
  if (iconColorMode === 'custom') iconColorValue = $('iconColorPicker').value;
  if (iconColorMode === 'currentColor') iconColorValue = 'currentColor';

  updateDetailCode();
});

$('iconColorVarInput').addEventListener('input', function() {
  iconColorValue = this.value || '--icon-color';
  updateDetailCode();
});

$('iconColorPicker').addEventListener('input', function() {
  iconColorValue = this.value;
  updateDetailCode();
});
```

### 6.5 상세 패널 닫기 / 복사

```javascript
$('iconDetailClose').addEventListener('click', function() {
  iconSelectedIdx = null;
  $('iconDetailPanel').classList.add('hidden');
  renderIconGrid();
});

$('iconDetailCopyBtn').addEventListener('click', function() {
  copyToClipboard($('iconDetailCode').textContent);
  showToast(lang === 'ko' ? '복사됨' : 'Copied');
});
```

### 6.6 `renderIconResults` 수정 (기존 함수 변경)

```javascript
// 기존 renderIconResults 수정
function renderIconResults(data) {
  iconData = data;
  iconFilteredData = data.slice(); // 초기화
  iconSearchQuery = '';
  iconSelectedIdx = null;

  $('iconCount').textContent = data.length;
  $('iconResults').classList.remove('hidden');

  // 검색바 표시
  $('iconSearchRow').classList.toggle('hidden', data.length === 0);
  $('iconDetailPanel').classList.add('hidden');

  updateFilterCount();
  renderIconGrid();
}
```

---

## 7. i18n 추가 문자열

```javascript
// ko.icon 에 추가
icon: {
  // ... 기존 유지 ...
  searchPlaceholder: '아이콘 검색...',
  filterCount: '/{total}개',
  noSearchResult: '검색 결과 없음',
  colorMode: '색상 모드',
  colorModeCC: 'currentColor',
  colorModeCssVar: 'CSS 변수',
  colorModeCustom: '커스텀 색상',
  cssVarPlaceholder: '--icon-color',
  detailSvg: 'SVG',
  detailReact: 'React',
  detailCss: 'CSS',
  detailCopy: '복사',
  detailCopied: '복사됨',
}

// en.icon 에 추가
icon: {
  // ... 기존 유지 ...
  searchPlaceholder: 'Search icons...',
  filterCount: '/{total}',
  noSearchResult: 'No results',
  colorMode: 'Color mode',
  colorModeCC: 'currentColor',
  colorModeCssVar: 'CSS variable',
  colorModeCustom: 'Custom color',
  cssVarPlaceholder: '--icon-color',
  detailSvg: 'SVG',
  detailReact: 'React',
  detailCss: 'CSS',
  detailCopy: 'Copy',
  detailCopied: 'Copied',
}
```

---

## 8. 구현 순서 (Do 단계)

| 순서 | 작업 | 파일 위치 |
|------|------|-----------|
| 1 | i18n 문자열 추가 (ko + en) | `src/ui.js` 상단 i18n 객체 |
| 2 | CSS 스타일 추가 | `src/ui.js` 내 `<style>` 블록 |
| 3 | HTML 추가 — 검색바 + 상세 패널 | `src/ui.js` 내 HTML 템플릿 (아이콘 탭 섹션) |
| 4 | 신규 상태 변수 선언 | `src/ui.js` 상태 섹션 |
| 5 | `replaceSvgColor()` 함수 추가 | `src/ui.js` 아이콘 섹션 |
| 6 | `buildReactComponent()`, `buildCssOutput()` 추가 | `src/ui.js` 아이콘 섹션 |
| 7 | `filterIcons()`, `renderIconGrid()` 추가 | `src/ui.js` 아이콘 섹션 |
| 8 | `selectIcon()`, `updateDetailCode()`, `updateFilterCount()` 추가 | `src/ui.js` 아이콘 섹션 |
| 9 | 이벤트 바인딩 추가 (검색, 색상, 탭, 닫기, 복사) | `src/ui.js` 이벤트 섹션 |
| 10 | `renderIconResults()` 수정 | `src/ui.js` 아이콘 섹션 |
| 11 | 기존 `$('iconList')` 이벤트 위임 수정 | `src/ui.js` 아이콘 섹션 |
| 12 | `npm run build` 확인 | 빌드 |

---

## 9. 완료 기준 (DoD 검증)

| 항목 | 검증 방법 |
|------|----------|
| 검색 필터링 | 검색어 입력 → 150ms 후 그리드 갱신 |
| 검색 결과 없음 | 매칭 없을 때 안내 메시지 표시 |
| 카드 클릭 → 패널 | 선택 강조 + 상세 패널 출현 |
| Toggle | 같은 카드 재클릭 → 패널 닫힘 |
| SVG 탭 | `fill="currentColor"` 치환 확인 |
| React 탭 | `SVGProps` 포함 컴포넌트 생성 |
| CSS 탭 | `:root` + `[data-theme="dark"]` 포함 CSS |
| CSS 변수 모드 | 입력 변수명 SVG에 반영 (`var(--xxx)`) |
| 커스텀 모드 | 컬러피커 색상으로 치환 |
| 기존 기능 | SVG/React 직접 복사 버튼 정상 동작 |
| 빌드 | `npm run build` 오류 없음 |
