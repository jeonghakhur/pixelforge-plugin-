'use strict';

import JSZip from 'jszip';
import { escapeHtml } from './converters/utils.js';
import { buildVarMap, convertVariables, convertFlatVars } from './converters/variables.js';
import { convertColorStyles } from './converters/color-styles.js';
import { convertTextStyles, convertFonts } from './converters/typography.js';
import { convertEffectStyles } from './converters/effects.js';
import { highlightCSS } from './converters/highlight.js';

// ── i18n ──
var i18n = {
  ko: {
    tabs: {
      extract: '추출',
      icon: '아이콘',
      contrast: '명도대비',
      theme: '테마',
      component: '컴포넌트',
      image: '이미지',
    },
    extract: {
      tokenType: '토큰 타입',
      btn: '토큰 추출하기',
      inspect: '🔍 검사',
      scope: '추출 범위',
      allPage: '전체 페이지',
      selection: '선택 레이어만',
      collections: '컬렉션',
      loading: '토큰을 추출하고 있습니다...',
      back: '← 뒤로',
      copy: '📋 복사',
      unit: '단위:',
      metaFile: '파일',
      metaScope: '범위',
      metaNodes: '노드',
      metaTime: '추출 시각',
      scopeAll: '전체 페이지',
      scopeSelection: '선택 레이어',
      noCollections: '컬렉션 없음',
      noCollectionsFallback: '컬렉션 없음 — Figma에서 플러그인을 실행하세요',
      extracting: '추출 중...',
      minType: '최소 1개 타입을 선택해야 합니다',
      jsonCopied: 'JSON 복사됨',
      cssCopied: 'CSS 복사됨',
      jsonDownload: 'JSON 다운로드 시작!',
      cssDownload: 'CSS 다운로드 시작!',
      errorPrefix: '오류: ',
      extractFail: '추출 실패',
      layerSelected: '개 레이어 선택됨',
      more: '외 ',
      tokenHint: 'Spacing·Radius = FLOAT Variables 자동 감지 / Shadow = Effect Styles 포함',
      cacheRestoredFrom: '캐시에서 복원:',
      cacheCleared: '캐시가 삭제됐습니다',
      cacheClearConfirm: '추출 캐시를 삭제할까요? 다음 추출 전까지 복원할 수 없습니다.',
      filterCacheTitle: '이전 추출 결과',
      filterCacheView: '결과 보기',
      filterCacheDelete: '삭제',
      visualParserLabel: '시각 프레임 파싱 (Variables 없는 파일용)',
      textStylesCard: '본문 스타일',
      headingsCard: '헤딩',
      fontsCard: '폰트',
    },
    icon: {
      title: '아이콘 SVG 추출',
      allMode: '전체 추출',
      selMode: '선택 추출',
      allBtn: '전체 아이콘 추출하기',
      selBtn: '선택 요소 추출하기',
      noSel: '선택된 노드 없음',
      copySvg: 'SVG 복사됨',
      copyReact: 'React 컴포넌트 복사됨',
      selected: '개 선택됨',
      extracting: '추출 중...',
      selectFirst: '먼저 아이콘을 선택하세요',
      noIcons: '추출된 아이콘 없음',
      downloadSvg: 'SVG 파일',
      downloadSvgCode: 'SVG 코드',
      downloadReact: 'React',
      downloadSvgDone: 'SVG ZIP 다운로드 시작!',
      downloadSvgCodeDone: 'SVG 코드 다운로드 시작!',
      downloadReactDone: 'React ZIP 다운로드 시작!',
      exportFail: '아이콘 추출 실패: ',
      searchPlaceholder: '아이콘 검색...',
      noSearchResult: '검색 결과 없음',
      colorMode: '색상 모드',
      colorModeCC: 'currentColor',
      colorModeCssVar: 'CSS 변수',
      colorModeCustom: '커스텀 색상',
      cssVarPlaceholder: '--icon-color',
      detailSvg: 'SVG',
      detailReact: 'React',
      detailCopy: '복사',
      detailCopied: '복사됨',
      filterCount: '/{total}개',
    },
    contrast: {
      title: 'WCAG 명도 대비 검사',
      manual: '수동 검사',
      matrix: '컬러 매트릭스',
      bg: '배경색',
      fg: '텍스트색',
      preview: '미리보기 텍스트 Preview',
      noColors: '추출 탭에서 색상을 먼저 추출하세요. 추출된 색상으로 자동 매트릭스를 생성합니다.',
      hint: '추출 탭에서 토큰을 먼저 추출하면, 디자인 색상을 드롭다운에서 선택할 수 있습니다.',
      directInput: '직접 입력',
      fail: '미달',
      summaryTotal: '전체',
      summaryCombos: '조합',
      on: ' on ',
      ratio: '대비: ',
      sampleText: 'Sample 가나다ABC',
    },
    theme: {
      title: '다크/라이트 테마 비교',
      extract: '테마 추출',
      copyCss: 'CSS 복사',
      showAll: '전체 보기',
      changedOnly: '변경된 것만',
      noData: 'Variables의 Light/Dark 모드를 자동 감지하여 비교합니다.',
      noModes: '2개 이상의 모드가 있는 컬렉션이 없습니다',
      noChanged: '변경된 항목이 없습니다',
      noVars: '테마 변수가 없습니다',
      extracting: '추출 중...',
      cssCopied: 'CSS 변수 복사됨',
      extractFirst: '먼저 테마를 추출하세요',
      exportFail: '테마 추출 실패: ',
    },
    component: {
      title: '컴포넌트 코드 생성',
      generate: '코드 생성',
      copy: '복사',
      save: '코드 저장',
      noSel: '선택된 노드 없음',
      outputLang: '출력 언어:',
      selectFirst: '먼저 컴포넌트를 선택하세요',
      generating: '생성 중...',
      cannotGenerate: '선택된 노드에서 코드를 생성할 수 없습니다',
      copied: '복사됨',
      downloadStart: '다운로드 시작!',
      generateFail: '코드 생성 실패: ',
      subGenerate: '코드 생성',
      subRegistry: '레지스트리',
      typeLabel: '컴포넌트 타입',
      styleLabel: '스타일 방식',
      saveBtn: '레지스트리 저장',
      edit: '수정',
      update: '업데이트',
      delete: '삭제',
      cancel: '취소',
      saveEdit: '저장',
      backToList: '← 목록으로',
      registryEmpty: '저장된 컴포넌트가 없습니다',
      exportAll: '전체 내보내기',
    },
    image: {
      format: '포맷',
      scale: '배율',
      scope: '범위',
      allPage: '전체 페이지',
      selection: '선택 레이어',
      detectBtn: '이미지 탐지하기',
      idleTitle: '이미지 에셋 탐지',
      idle: '위 버튼을 클릭하여 이미지 에셋을 탐지하세요.',
      detecting: '이미지를 탐지하고 있습니다...',
      empty: '이미지 에셋을 찾을 수 없습니다.',
      emptyHint: 'IMAGE fill이 적용된 노드가 없거나 선택 범위에 포함되지 않았습니다.',
      downloadAll: '전체 ZIP 다운로드',
      downloadAllCount: '({n}개 · {m}파일)',
      downloadOne: '다운로드',
      retry: '다시 시도',
      noSelection: '먼저 레이어를 선택하세요',
      error: '이미지 추출 실패: ',
    },
  },
  en: {
    tabs: {
      extract: 'Extract',
      icon: 'Icons',
      contrast: 'Contrast',
      theme: 'Theme',
      component: 'Component',
      image: 'Images',
    },
    extract: {
      tokenType: 'Token Type',
      btn: 'Extract Tokens',
      inspect: '🔍 Inspect',
      scope: 'Scope',
      allPage: 'Entire Page',
      selection: 'Selection Only',
      collections: 'Collections',
      loading: 'Extracting tokens...',
      back: '← Back',
      copy: '📋 Copy',
      unit: 'Unit:',
      metaFile: 'File',
      metaScope: 'Scope',
      metaNodes: 'Nodes',
      metaTime: 'Time',
      scopeAll: 'Entire Page',
      scopeSelection: 'Selection',
      noCollections: 'No collections',
      noCollectionsFallback: 'No collections — Run plugin in Figma',
      extracting: 'Extracting...',
      minType: 'Select at least 1 type',
      jsonCopied: 'JSON copied',
      cssCopied: 'CSS copied',
      jsonDownload: 'JSON download started!',
      cssDownload: 'CSS download started!',
      errorPrefix: 'Error: ',
      extractFail: 'Extraction failed',
      layerSelected: ' layers selected',
      more: '+ ',
      tokenHint:
        'Spacing·Radius = Auto-detected FLOAT Variables / Shadow = Included in Effect Styles',
      cacheRestoredFrom: 'Restored from cache:',
      cacheCleared: 'Cache cleared',
      cacheClearConfirm: 'Delete extraction cache? Cannot be restored until next extraction.',
      filterCacheTitle: 'Previous Extraction',
      filterCacheView: 'View Results',
      filterCacheDelete: 'Delete',
      visualParserLabel: 'Visual frame parsing (for pre-Variables files)',
      textStylesCard: 'Text Styles',
      headingsCard: 'Headings',
      fontsCard: 'Fonts',
    },
    icon: {
      title: 'Icon SVG Export',
      allMode: 'All Icons',
      selMode: 'Selection',
      allBtn: 'Export All Icons',
      selBtn: 'Export Selected',
      noSel: 'No node selected',
      copySvg: 'SVG copied',
      copyReact: 'React component copied',
      selected: ' selected',
      extracting: 'Exporting...',
      selectFirst: 'Select icons first',
      noIcons: 'No icons found',
      downloadSvg: 'SVG Files',
      downloadSvgCode: 'SVG Code',
      downloadReact: 'React',
      downloadSvgDone: 'SVG ZIP downloaded!',
      downloadSvgCodeDone: 'SVG code downloaded!',
      downloadReactDone: 'React ZIP downloaded!',
      exportFail: 'Icon export failed: ',
      searchPlaceholder: 'Search icons...',
      noSearchResult: 'No results',
      colorMode: 'Color mode',
      colorModeCC: 'currentColor',
      colorModeCssVar: 'CSS variable',
      colorModeCustom: 'Custom color',
      cssVarPlaceholder: '--icon-color',
      detailSvg: 'SVG',
      detailReact: 'React',
      detailCopy: 'Copy',
      detailCopied: 'Copied',
      filterCount: '/{total}',
    },
    contrast: {
      title: 'WCAG Contrast Checker',
      manual: 'Manual',
      matrix: 'Color Matrix',
      bg: 'Background',
      fg: 'Text Color',
      preview: 'Preview Text Sample',
      noColors: 'Extract colors first from the Extract tab to generate the matrix.',
      hint: 'Extract tokens first to select design colors from the dropdown.',
      directInput: 'Manual input',
      fail: 'Fail',
      summaryTotal: 'Total',
      summaryCombos: 'combos',
      on: ' on ',
      ratio: 'Contrast: ',
      sampleText: 'Sample Text ABC',
    },
    theme: {
      title: 'Dark/Light Theme Compare',
      extract: 'Extract Theme',
      copyCss: 'Copy CSS',
      showAll: 'Show All',
      changedOnly: 'Changed Only',
      noData: 'Automatically detects and compares Light/Dark modes from Variables.',
      noModes: 'No collections with 2+ modes found',
      noChanged: 'No changed items',
      noVars: 'No theme variables',
      extracting: 'Extracting...',
      cssCopied: 'CSS variables copied',
      extractFirst: 'Extract theme first',
      exportFail: 'Theme export failed: ',
    },
    component: {
      title: 'Component Code',
      generate: 'Generate Code',
      copy: 'Copy',
      save: 'Save Code',
      noSel: 'No node selected',
      outputLang: 'Output:',
      selectFirst: 'Select a component first',
      generating: 'Generating...',
      cannotGenerate: 'Cannot generate code from selected node',
      copied: 'Copied',
      downloadStart: 'Download started!',
      generateFail: 'Code generation failed: ',
      subGenerate: 'Generate',
      subRegistry: 'Registry',
      typeLabel: 'Component Type',
      styleLabel: 'Style Mode',
      saveBtn: 'Save to Registry',
      edit: 'Edit',
      update: 'Update',
      delete: 'Delete',
      cancel: 'Cancel',
      saveEdit: 'Save',
      backToList: '← Back',
      registryEmpty: 'No saved components',
      exportAll: 'Export All',
    },
    image: {
      format: 'Format',
      scale: 'Scale',
      scope: 'Scope',
      allPage: 'Entire Page',
      selection: 'Selection',
      detectBtn: 'Detect Images',
      idleTitle: 'Image Asset Export',
      idle: 'Click the button above to detect image assets.',
      detecting: 'Detecting image assets...',
      empty: 'No image assets found.',
      emptyHint: 'No nodes with IMAGE fill found in the current scope.',
      downloadAll: 'Download All ZIP',
      downloadAllCount: '({n} items · {m} files)',
      downloadOne: 'Download',
      retry: 'Retry',
      noSelection: 'Select layers first',
      error: 'Image export failed: ',
    },
  },
};

var lang = 'ko';

function t(path) {
  var parts = path.split('.');
  var obj = i18n[lang];
  for (var i = 0; i < parts.length; i++) {
    if (!obj) return path;
    obj = obj[parts[i]];
  }
  return obj || path;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Update dynamic text that depends on language
  if (extractedData) {
    var meta = extractedData.meta;
    $('metaMode').textContent =
      meta.sourceMode === 'selection' ? t('extract.scopeSelection') : t('extract.scopeAll');
  }
}

// ── Lang toggle ──
document.querySelectorAll('.lang-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    lang = btn.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    applyLang();
    // Re-render matrix if visible
    if (a11ySubTab === 'matrix') renderMatrix();
  });
});

// ── State ──
var extractedData = null;
var tokenCacheInfo = null; // { savedAt, figmaFileId, figmaFileName }
var collections = [];
var activeTab = 'json';
var cssUnit = 'px';
var activeStatTypes = new Set();
var extractedColors = []; // {name, hex}[] for matrix

// ── DOM ──
var $ = function (id) {
  return document.getElementById(id);
};
var headerFile = $('headerFile');
var backBtn = $('backBtn');
var colList = $('colList');
var extractBtn = $('extractBtn');
var selectionInfo = $('selectionInfo');
var selCount = $('selCount');
var selNames = $('selNames');
var inspectBtn = $('inspectBtn');
var copyBtn = $('copyBtn');
var downloadJsonBtn = $('downloadJsonBtn');
var downloadCssBtn = $('downloadCssBtn');
var previewPre = $('previewPre');
var tabJson = $('tabJson');
var tabCss = $('tabCss');
var unitPx = $('unitPx');
var unitRem = $('unitRem');
var unitToggle = $('unitToggle');
var toast = $('toast');

// ── View System ──
function showView(name) {
  ['filter', 'loading', 'result'].forEach(function (v) {
    var el = $('view-' + v);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  backBtn.classList.toggle('visible', name === 'result');
  updateExtractBtn();
  if (name === 'filter') updateFilterCacheBanner();
}

// ── Toast ──
var toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 2500);
}

// ── Selected types ──
function getSelectedTypes() {
  return Array.from(document.querySelectorAll('.token-card.active')).map(function (c) {
    return c.dataset.type;
  });
}

// ── Selected collections ──
function getSelectedCollectionIds() {
  return Array.from(document.querySelectorAll('#colList input[type="checkbox"]:checked')).map(
    function (c) {
      return c.value;
    }
  );
}

// ── Scope ──
function getScope() {
  var r = document.querySelector('input[name="scope"]:checked');
  return r ? r.value : 'all';
}

// ── Selection Info Display ──
function renderSelectionInfo(sel) {
  if (!sel || sel.count === 0) {
    selectionInfo.classList.add('hidden');
    return;
  }
  var isSelMode = getScope() === 'selection';
  if (!isSelMode) {
    selectionInfo.classList.add('hidden');
    return;
  }

  selectionInfo.classList.remove('hidden');
  selCount.textContent = sel.count + t('extract.layerSelected');

  var MAX_SHOW = 5;
  var items = sel.names.slice(0, MAX_SHOW).map(function (name, i) {
    var type = (sel.nodeTypes[i] || '').toLowerCase();
    return (
      '<span class="sel-item"><span class="sel-type">' +
      type +
      '</span><span class="sel-name-text">' +
      name +
      '</span></span>'
    );
  });
  if (sel.count > MAX_SHOW) {
    items.push('<span class="sel-more">' + t('extract.more') + (sel.count - MAX_SHOW) + '</span>');
  }
  selNames.innerHTML = items.join('');
}

var lastSelection = { count: 0, names: [], nodeTypes: [], meta: null };

// ── Scope radio change ──
document.querySelectorAll('input[name="scope"]').forEach(function (r) {
  r.addEventListener('change', function () {
    renderSelectionInfo(lastSelection);
    updateExtractBtn();
  });
});

// ── Extract button state ──
function updateExtractBtn() {
  var types = getSelectedTypes();
  var isFilterView = !$('view-filter').classList.contains('hidden');
  extractBtn.disabled = isFilterView && types.length === 0;
}

// ── Collections rendering ──
function renderCollections(cols) {
  collections = cols;
  if (!cols || cols.length === 0) {
    colList.innerHTML = '<div class="no-collections">' + t('extract.noCollections') + '</div>';
    return;
  }
  colList.innerHTML = cols
    .map(function (c) {
      return (
        '<label class="col-item"><input type="checkbox" value="' +
        c.id +
        '" checked><span class="col-name">' +
        c.name +
        '</span><span class="col-count">' +
        (c.variableIds ? c.variableIds.length : 0) +
        '</span></label>'
      );
    })
    .join('');
  colList.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', updateExtractBtn);
  });
}

// ── Token card toggle ──
document.querySelectorAll('.token-card').forEach(function (card) {
  card.addEventListener('click', function () {
    var isActive = card.classList.contains('active');
    var active = getSelectedTypes();
    if (isActive && active.length === 1) {
      showToast(t('extract.minType'));
      return;
    }
    card.classList.toggle('active');
    updateExtractBtn();
  });
});

// ── Inspect ──
inspectBtn.addEventListener('click', function () {
  parent.postMessage({ pluginMessage: { type: 'inspect' } }, '*');
  showToast(lang === 'ko' ? '노드 데이터 읽는 중...' : 'Reading node data...');
});

// ── Extract ──
extractBtn.addEventListener('click', function () {
  var types = getSelectedTypes();
  if (types.length === 0) {
    showToast(t('extract.minType'));
    return;
  }
  showView('loading');
  var useVisualParser = $('useVisualParserToggle') ? $('useVisualParserToggle').checked : false;
  var options = {
    collectionIds: getSelectedCollectionIds(),
    useSelection: getScope() === 'selection',
    tokenTypes: types,
    useVisualParser: useVisualParser,
  };
  parent.postMessage({ pluginMessage: { type: 'extract', options: options } }, '*');
});

// ── Back ──
backBtn.addEventListener('click', function () {
  showView('filter');
});

// ── Tab switching ──
tabJson.addEventListener('click', function () {
  activeTab = 'json';
  tabJson.classList.add('active');
  tabCss.classList.remove('active');
  unitToggle.style.display = 'none';
  updatePreview();
});

tabCss.addEventListener('click', function () {
  activeTab = 'css';
  tabCss.classList.add('active');
  tabJson.classList.remove('active');
  unitToggle.style.display = 'flex';
  updatePreview();
});

// ── Unit toggle ──
unitPx.addEventListener('click', function () {
  cssUnit = 'px';
  unitPx.classList.add('active');
  unitRem.classList.remove('active');
  if (activeTab === 'css') updatePreview();
});

unitRem.addEventListener('click', function () {
  cssUnit = 'rem';
  unitRem.classList.add('active');
  unitPx.classList.remove('active');
  if (activeTab === 'css') updatePreview();
});

// ── CSS Generation ──
function generateCSS(data, unit, types) {
  if (!data) return '';
  var varMap = buildVarMap(data);
  var meta = data.meta || {};
  var header =
    '/**\n * PixelForge Design Tokens\n * File: ' +
    (meta.fileName || '') +
    '\n * Extracted: ' +
    (meta.extractedAt || new Date().toISOString()) +
    '\n * Generated by PixelForge Token Extractor\n */\n\n';
  var all = !types || types.size === 0;

  // ── Step 1: collect :root lines (light / default values) ──
  var rootLines = '';
  var themeBlocks = []; // [{modeName, comment, lines}]

  if (all || types.has('variables')) {
    var varResult = convertVariables(data, varMap, unit);
    if (varResult.rootLines) rootLines += varResult.rootLines;
    varResult.themeBlocks.forEach(function (b) {
      themeBlocks.push(b);
    });
  }
  if ((all || types.has('spacing')) && data.spacing && data.spacing.length > 0) {
    var sl = convertFlatVars(data.spacing, varMap, unit);
    if (sl) rootLines += sl;
  }
  if ((all || types.has('radius')) && data.radius && data.radius.length > 0) {
    var rl = convertFlatVars(data.radius, varMap, unit);
    if (rl) rootLines += rl;
  }
  if (all || types.has('colors')) {
    var cl = convertColorStyles(data.styles ? data.styles.colors : []);
    if (cl) rootLines += cl;
  }
  if (all || types.has('effects')) {
    var el = convertEffectStyles(data.styles ? data.styles.effects : []);
    if (el) rootLines += el;
  }

  var body = '';

  // ── Step 1: :root — light/default ──
  if (rootLines) {
    body += ':root {\n' + rootLines + '}\n\n';
  }

  // ── Step 2: [data-theme="dark"] — explicit JS toggle ──
  themeBlocks.forEach(function (b) {
    body += b.comment + '\n[data-theme="' + b.modeName + '"] {\n' + b.lines + '}\n\n';
  });

  // ── Step 3: @media (prefers-color-scheme) — system preference ──
  if (themeBlocks.length > 0) {
    // Group blocks by modeName — emit one @media block per theme
    var mediaMap = {};
    themeBlocks.forEach(function (b) {
      if (!mediaMap[b.modeName]) mediaMap[b.modeName] = { comment: b.comment, lines: '' };
      mediaMap[b.modeName].lines += b.lines;
    });
    Object.keys(mediaMap).forEach(function (modeName) {
      var entry = mediaMap[modeName];
      body += entry.comment + '\n@media (prefers-color-scheme: ' + modeName + ') {\n  :root {\n';
      entry.lines.split('\n').forEach(function (line) {
        if (line.trim()) body += '  ' + line + '\n';
      });
      body += '  }\n}\n\n';
    });
  }

  // ── Text Styles — class selectors (outside :root) ──
  if (all || types.has('texts')) {
    body += convertTextStyles(data.styles ? data.styles.texts : [], unit);
  }
  if (all || types.has('textStyles')) {
    body += convertTextStyles(data.styles ? data.styles.textStyles || [] : [], unit);
  }
  if (all || types.has('headings')) {
    body += convertTextStyles(data.styles ? data.styles.headings || [] : [], unit);
  }
  if (all || types.has('fonts')) {
    body += convertFonts(data.styles ? data.styles.fonts || [] : []);
  }

  return header + body;
}

// ── Filtered data for JSON ──
function getFilteredData() {
  if (!extractedData) return null;
  var d = extractedData;
  var types = activeStatTypes;
  if (!types || types.size === 0) return d;
  return {
    variables: types.has('variables') ? d.variables : { collections: [], variables: [] },
    spacing: types.has('spacing') ? d.spacing : [],
    radius: types.has('radius') ? d.radius : [],
    styles: {
      colors: types.has('colors') ? (d.styles ? d.styles.colors : []) : [],
      texts: types.has('texts') ? (d.styles ? d.styles.texts : []) : [],
      textStyles: types.has('textStyles') ? (d.styles ? d.styles.textStyles || [] : []) : [],
      headings: types.has('headings') ? (d.styles ? d.styles.headings || [] : []) : [],
      fonts: types.has('fonts') ? (d.styles ? d.styles.fonts || [] : []) : [],
      effects: types.has('effects') ? (d.styles ? d.styles.effects : []) : [],
    },
    icons: types.has('icons') ? d.icons : [],
    meta: d.meta,
  };
}

// ── Stat card filter ──
function updateStatCardStyles() {
  document.querySelectorAll('.stat-card[data-type]').forEach(function (card) {
    if (card.classList.contains('inactive')) return;
    var type = card.dataset.type;
    var isActive = activeStatTypes.has(type);
    card.classList.toggle('selected', isActive);
    card.classList.toggle('dimmed', !isActive);
  });
}

document.querySelectorAll('.stat-card[data-type]').forEach(function (card) {
  card.addEventListener('click', function () {
    if (card.classList.contains('inactive')) return;
    var type = card.dataset.type;
    if (activeStatTypes.has(type)) {
      if (activeStatTypes.size === 1) return;
      activeStatTypes.delete(type);
    } else {
      activeStatTypes.add(type);
    }
    updateStatCardStyles();
    updatePreview();
  });
});

// ── Update Preview ──
function updatePreview() {
  if (!extractedData) return;
  var filtered = getFilteredData();
  if (activeTab === 'json') {
    previewPre.innerHTML = escapeHtml(JSON.stringify(filtered, null, 2));
  } else {
    previewPre.innerHTML = highlightCSS(generateCSS(filtered, cssUnit, activeStatTypes));
  }
}

// ── Build file name base ──
function buildFileBase() {
  var meta = extractedData && extractedData.meta;
  var sanitize = function (s) {
    return s
      .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };
  if (meta && meta.sourceMode === 'selection' && lastSelection.count > 0) {
    var names = lastSelection.names;
    var selPart;
    if (names.length === 1) selPart = sanitize(names[0]);
    else if (names.length <= 3) selPart = names.map(sanitize).join('+');
    else selPart = sanitize(names[0]) + '_외' + (names.length - 1) + '개';
    var filePart = meta.fileName ? sanitize(meta.fileName) : 'pixelforge';
    return filePart + '_' + selPart;
  }
  return meta && meta.fileName ? sanitize(meta.fileName) : 'tokens';
}

// ── Copy ──
copyBtn.addEventListener('click', function () {
  if (!extractedData) return;
  var filtered = getFilteredData();
  var text =
    activeTab === 'json'
      ? JSON.stringify(filtered, null, 2)
      : generateCSS(filtered, cssUnit, activeStatTypes);
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast(activeTab === 'json' ? t('extract.jsonCopied') : t('extract.cssCopied'));
});

// ── Download JSON ──
downloadJsonBtn.addEventListener('click', function () {
  if (!extractedData) return;
  var blob = new Blob([JSON.stringify(getFilteredData(), null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = buildFileBase() + '_tokens.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('extract.jsonDownload'));
});

// ── Download CSS ──
downloadCssBtn.addEventListener('click', function () {
  if (!extractedData) return;
  var blob = new Blob([generateCSS(getFilteredData(), cssUnit, activeStatTypes)], {
    type: 'text/css',
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = buildFileBase() + '_tokens.css';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('extract.cssDownload'));
});

// ── Result rendering ──
function renderResult(data) {
  extractedData = data;
  var variables = data.variables,
    spacing = data.spacing,
    radius = data.radius;
  var styles = data.styles,
    icons = data.icons,
    meta = data.meta;

  var varCount = variables ? variables.variables.length : 0;
  var spacingCount = spacing ? spacing.length : 0;
  var radiusCount = radius ? radius.length : 0;
  var colorCount = styles ? styles.colors.length : 0;
  var textStylesCount = styles ? (styles.textStyles || []).length : 0;
  var headingsCount = styles ? (styles.headings || []).length : 0;
  var fontsCount = styles ? (styles.fonts || []).length : 0;
  var effectCount = styles ? styles.effects.length : 0;
  var iconCount = icons ? icons.length : 0;

  $('statVarNum').textContent = varCount;
  $('statSpacingNum').textContent = spacingCount;
  $('statRadiusNum').textContent = radiusCount;
  $('statColorNum').textContent = colorCount;
  $('statTextStylesNum').textContent = textStylesCount;
  $('statHeadingsNum').textContent = headingsCount;
  $('statFontsNum').textContent = fontsCount;
  $('statEffectNum').textContent = effectCount;
  [
    ['statVar', varCount],
    ['statSpacing', spacingCount],
    ['statRadius', radiusCount],
    ['statColor', colorCount],
    ['statTextStyles', textStylesCount],
    ['statHeadings', headingsCount],
    ['statFonts', fontsCount],
    ['statEffect', effectCount],
  ].forEach(function (p) {
    $(p[0]).classList.toggle('inactive', p[1] === 0);
  });

  $('metaFile').textContent = meta.fileName || '—';
  $('metaMode').textContent =
    meta.sourceMode === 'selection' ? t('extract.scopeSelection') : t('extract.scopeAll');
  $('metaNodes').textContent = (meta.totalNodes || 0).toLocaleString() + '개';
  var d = new Date(meta.extractedAt);
  $('metaTime').textContent = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  activeStatTypes.clear();
  var typeCounts = {
    variables: varCount,
    spacing: spacingCount,
    radius: radiusCount,
    colors: colorCount,
    textStyles: textStylesCount,
    headings: headingsCount,
    fonts: fontsCount,
    effects: effectCount,
    icons: iconCount,
  };
  Object.keys(typeCounts).forEach(function (t) {
    if (typeCounts[t] > 0) activeStatTypes.add(t);
  });
  updateStatCardStyles();

  activeTab = 'json';
  cssUnit = 'px';
  tabJson.classList.add('active');
  tabCss.classList.remove('active');
  unitToggle.style.display = 'none';
  unitPx.classList.add('active');
  unitRem.classList.remove('active');
  updatePreview();
  showView('result');
}

// ── Messages from Figma ──
window.onmessage = function (event) {
  var msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'init-data') {
    headerFile.textContent = msg.fileName || (lang === 'ko' ? 'Figma 파일' : 'Figma File');
    renderCollections(msg.collections || []);
    if (msg.selection) {
      lastSelection = msg.selection;
      renderSelectionInfo(msg.selection);
    }
    updateExtractBtn();
  }
  if (msg.type === 'selection-changed') {
    lastSelection = msg.selection || { count: 0, names: [], nodeTypes: [], meta: null };
    renderSelectionInfo(lastSelection);
  }
  if (msg.type === 'inspect-result') {
    var json = JSON.stringify(msg.data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'inspect_nodes.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'ko' ? 'inspect_nodes.json 저장됨' : 'inspect_nodes.json saved');
  }
  if (msg.type === 'extract-result') {
    renderResult(msg.data);
    populateA11yColors();
    buildExtractedColors();
    tokenCacheInfo = {
      savedAt: new Date().toISOString(),
      figmaFileId: null,
      figmaFileName: msg.data && msg.data.meta ? msg.data.meta.fileName : null,
    };
    showTokenCacheBadge(tokenCacheInfo.savedAt, tokenCacheInfo.figmaFileName);
    applyTokenCacheToTabs(msg.data);
  }
  if (msg.type === 'extract-error') {
    showView('filter');
    showToast(t('extract.errorPrefix') + (msg.message || t('extract.extractFail')));
  }
  // Icon results
  if (msg.type === 'export-icons-result') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = t('icon.selBtn');
    renderIconResults(msg.data || []);
    hideCacheBadge();
  }
  if (msg.type === 'export-icons-error') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = t('icon.selBtn');
    showToast(t('icon.exportFail') + (msg.message || ''));
  }
  if (msg.type === 'export-icons-all-result') {
    exportIconsAllBtn.disabled = false;
    exportIconsAllBtn.textContent = t('icon.allBtn');
    renderIconResults(msg.data || []);
    hideCacheBadge();
  }
  if (msg.type === 'export-icons-all-error') {
    exportIconsAllBtn.disabled = false;
    exportIconsAllBtn.textContent = t('icon.allBtn');
    showToast(t('icon.exportFail') + (msg.message || ''));
  }
  if (msg.type === 'cached-icon-data') {
    renderIconResults(msg.data || []);
    showCacheBadge(msg.savedAt);
  }
  if (msg.type === 'clear-icon-cache-done') {
    hideCacheBadge();
    renderIconResults([]);
    $('iconResults').classList.add('hidden');
  }
  // Theme results
  if (msg.type === 'extract-themes-result') {
    extractThemesBtn.disabled = false;
    extractThemesBtn.textContent = t('theme.extract');
    themeData = msg.data;
    themeFilterBtn.disabled = false;
    if (themeCopyCssBtn) themeCopyCssBtn.disabled = false;
    renderThemes();
  }
  if (msg.type === 'extract-themes-error') {
    extractThemesBtn.disabled = false;
    extractThemesBtn.textContent = t('theme.extract');
    showToast(t('theme.exportFail') + (msg.message || ''));
  }
  // Component results
  if (msg.type === 'generate-component-result') {
    if (generateCompBtn) {
      generateCompBtn.disabled = false;
      generateCompBtn.textContent = t('component.generate');
    }
    var d = msg.data;
    if (d) {
      var name = compToPascalCase((d.name || 'Component').split('/').pop());
      // 자동 감지 타입을 드롭다운에 반영
      if (d.detectedType && d.detectedType !== 'layout') {
        compState.componentType = d.detectedType;
        var _typeSelectEl = $('compTypeSelect');
        if (_typeSelectEl) _typeSelectEl.value = d.detectedType;
        updateTypeHint(d.detectedType);
      }
      var tsx, css;
      if (compState.styleMode === 'html') {
        tsx = d.html || '<div></div>';
        css = '';
      } else if (compState.styleMode === 'css-modules') {
        tsx = buildRadixCSSModules(d, name, compState.useTs);
        css = buildRadixCSS(d);
      } else {
        tsx = buildRadixStyled(d, name, compState.useTs);
        css = '';
      }
      showGeneratedResult(tsx, css, compState.styleMode);
    } else {
      showToast(t('component.cannotGenerate'));
    }
  }
  if (msg.type === 'generate-component-error') {
    if (generateCompBtn) {
      generateCompBtn.disabled = false;
      generateCompBtn.textContent = t('component.generate');
    }
    showToast(t('component.generateFail') + (msg.message || ''));
  }
  // Registry messages
  if (msg.type === 'registry-data') {
    compState.registry = msg.registry || {};
    renderRegistryList();
  }
  if (msg.type === 'registry-saved') {
    parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');
    showToast(lang === 'ko' ? '레지스트리에 저장됐습니다' : 'Saved to registry');
    switchCompSubTab('registry');
  }
  if (msg.type === 'registry-deleted') {
    parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');
    showToast(lang === 'ko' ? '삭제됐습니다' : 'Deleted');
    $('compRegistryList').style.display = '';
    $('compRegistryDetail').classList.add('hidden');
    compState.currentEntry = null;
  }
  if (msg.type === 'registry-error') {
    showToast((lang === 'ko' ? '레지스트리 오류: ' : 'Registry error: ') + (msg.message || ''));
  }
  // Image results
  if (msg.type === 'extract-images-result') {
    imageAssets = msg.data || [];
    if (imageAssets.length === 0) {
      setImgState('imgStateEmpty');
    } else {
      setImgState('imgStateList');
      renderImageList(imageAssets);
    }
  }
  if (msg.type === 'extract-images-error') {
    $('imgErrorMsg').textContent = t('image.error') + (msg.message || '');
    setImgState('imgStateError');
  }
  // Token cache
  if (msg.type === 'cached-token-data') {
    renderResult(msg.data);
    populateA11yColors();
    buildExtractedColors();
    tokenCacheInfo = {
      savedAt: msg.savedAt,
      figmaFileId: msg.figmaFileId,
      figmaFileName: msg.figmaFileName,
    };
    showTokenCacheBadge(msg.savedAt, msg.figmaFileName);
    applyTokenCacheToTabs(msg.data);
  }
  if (msg.type === 'token-cache-cleared') {
    extractedData = null;
    tokenCacheInfo = null;
    hideTokenCacheBadge();
    updateFilterCacheBanner();
    hideCacheBannerInTab('a11y');
    hideCacheBannerInTab('themes');
    hideCacheBannerInTab('images');
    showView('filter');
    showToast(t('extract.cacheCleared'));
  }
  // Component-specific selection handling (lastSelection already updated above)
  if (msg.type === 'selection-changed') {
    if (currentMainTab === 'icons') updateIconSelInfo();
    if (currentMainTab === 'component') onCompSelectionChanged();
  }
};

// ══════════════════════════════════════════════
// ── Main Tab System ──
// ══════════════════════════════════════════════
var currentMainTab = 'extract';
var mainTabs = document.querySelectorAll('.main-tab');
var tabPanels = {
  extract: $('panel-extract'),
  icons: $('panel-icons'),
  a11y: $('panel-a11y'),
  themes: $('panel-themes'),
  component: $('panel-component'),
  images: $('panel-images'),
};

function switchMainTab(tab) {
  currentMainTab = tab;
  mainTabs.forEach(function (t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  Object.keys(tabPanels).forEach(function (k) {
    var el = tabPanels[k];
    if (k === tab) {
      el.style.display = 'flex';
      el.classList.remove('hidden');
    } else {
      el.style.display = 'none';
    }
  });
  // Update selection info for relevant tabs
  if (tab === 'icons') updateIconSelInfo();
  if (tab === 'component') updateCompSelInfo();
}

mainTabs.forEach(function (t) {
  t.addEventListener('click', function () {
    switchMainTab(t.dataset.tab);
  });
});

// ══════════════════════════════════════════════
// ── Icon Tab ──
// ══════════════════════════════════════════════
var iconData = [];
var iconMode = 'all';
var exportIconsBtn = $('exportIconsBtn');
var exportIconsAllBtn = $('exportIconsAllBtn');

// ── Icon Search & Detail 상태 ──
var iconSearchQuery = '';
var iconFilteredData = [];
var iconSelectedIdx = null;
var iconColorMode = 'currentColor';
var iconColorValue = 'currentColor';
var iconDetailTab = 'svg';

// ── SVG 색상 치환 ──
function replaceSvgColor(svg, mode, value) {
  var KEEP = /^(none|transparent|currentColor)$/i;

  // <clipPath>...</clipPath> 블록은 클리핑 마스크 정의용 — fill 변환 제외
  // 블록 밖 구간만 치환하기 위해 split 후 홀수 인덱스(블록 내부)는 원본 유지
  function replaceOutsideClipPath(str, replacer) {
    return str
      .split(/(<clipPath[\s\S]*?<\/clipPath>)/g)
      .map(function (chunk, i) {
        return i % 2 === 0 ? replacer(chunk) : chunk;
      })
      .join('');
  }

  return replaceOutsideClipPath(svg, function (chunk) {
    return chunk
      .replace(/fill="([^"]*)"/g, function (_, v) {
        if (KEEP.test(v)) return 'fill="' + v + '"';
        if (mode === 'currentColor') return 'fill="currentColor"';
        if (mode === 'cssVar') return 'fill="var(' + value + ')"';
        return 'fill="' + value + '"';
      })
      .replace(/stroke="([^"]*)"/g, function (_, v) {
        if (KEEP.test(v)) return 'stroke="' + v + '"';
        if (mode === 'currentColor') return 'stroke="currentColor"';
        if (mode === 'cssVar') return 'stroke="var(' + value + ')"';
        return 'stroke="' + value + '"';
      });
  });
}

// void 요소 self-closing 보장: <path ...> → <path ... />
// formatXml 전후 두 단계로 처리 (단일 줄 + 여러 줄 속성 분리 케이스)
function applySelfClosing(svg) {
  var VOID_RE =
    /<(path|circle|ellipse|line|polyline|polygon|rect|use|stop|animate|animateTransform)(\b[^>]*)>/g;
  // step 1: 단일 줄 void 요소
  var result = svg.replace(VOID_RE, function (m, tag, attrs) {
    return attrs.endsWith('/') ? m : '<' + tag + attrs + ' />';
  });
  // step 2: 여러 줄로 분리된 경우 — 단독 ">" 줄을 "/>" 로 교체
  var VOID_TAGS =
    /^<(path|circle|ellipse|line|polyline|polygon|rect|use|stop|animate|animateTransform)\b/;
  var inVoid = false;
  return result
    .split('\n')
    .map(function (line) {
      var t = line.trim();
      if (VOID_TAGS.test(t)) {
        inVoid = true;
      }
      if (inVoid) {
        if (/\/>$/.test(t)) {
          inVoid = false;
          return line;
        }
        if (t === '>') {
          inVoid = false;
          return line.replace('>', '/>');
        }
        if (/>$/.test(t) && !/<\//.test(t)) {
          inVoid = false;
          return line.slice(0, line.lastIndexOf('>')) + '/>';
        }
      }
      return line;
    })
    .join('\n');
}

// ── XML/SVG 포맷터 ──

// 태그 한 줄을 받아 속성이 2개 이상 & 80자 초과면 속성마다 줄 나눔
function formatTagAttrs(tag, baseIndent) {
  // 태그명과 속성 파싱: <tagName attr1="v1" attr2="v2" ...(/?)>
  var m = tag.match(/^(<\/?\w[\w.-]*)(\s[^>]*)?(\/?>)$/);
  if (!m) return baseIndent + tag;
  var open = m[1]; // e.g. "<svg"
  var attrStr = m[2] || ''; // e.g. ' xmlns="..." viewBox="..."'
  var close = m[3]; // ">" or "/>"

  // 속성 파싱 (값에 공백 포함 가능 → 따옴표 기준으로 분리)
  var attrs = [];
  var re = /\s+([\w:.-]+)(?:="([^"]*)")?/g;
  var hit;
  while ((hit = re.exec(attrStr)) !== null) {
    attrs.push(hit[2] !== undefined ? hit[1] + '="' + hit[2] + '"' : hit[1]);
  }

  // 속성 1개 이하이거나 한 줄이 80자 이하면 그대로
  var oneLiner = baseIndent + open + (attrStr || '') + close;
  if (attrs.length <= 1 || oneLiner.length <= 80) return oneLiner;

  // 속성마다 줄 나눔
  var attrIndent = baseIndent + '  ';
  return (
    baseIndent +
    open +
    '\n' +
    attrs
      .map(function (a) {
        return attrIndent + a;
      })
      .join('\n') +
    '\n' +
    baseIndent +
    close
  );
}

function formatXml(xml) {
  var pad = 0;
  var lines = xml
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);
  return lines
    .map(function (line) {
      var isClosing = /^<\//.test(line);
      var isSelfClose = /\/>$/.test(line);
      var isInline = /^<[^/!][^>]*>[^<]+<\//.test(line);
      if (isClosing) pad = Math.max(0, pad - 1);
      var indent = '  '.repeat(pad);
      var result =
        /^<[^?!]/.test(line) && !isClosing ? formatTagAttrs(line, indent) : indent + line;
      if (!isClosing && !isSelfClose && !isInline && /^<[^?!]/.test(line)) pad++;
      return result;
    })
    .join('\n');
}

// 아이콘 목록에서 Size variant 값 수집 → ["default", "micro"]
function collectIconSizes(icons) {
  var sizes = new Set();
  icons.forEach(function (icon) {
    (icon.variants || []).forEach(function (v) {
      var m = v.match(/^size-(.+)$/);
      if (m) sizes.add(m[1]);
    });
  });
  return Array.from(sizes).sort();
}

// size 이름 → 실제 px 맵핑: SVG viewBox에서 읽음
function collectIconSizePx(icons) {
  var map = {}; // { default: 16, micro: 12, ... }
  icons.forEach(function (icon) {
    var vb = icon.svg.match(/viewBox="0 0 (\d+(?:\.\d+)?)/);
    var px = vb ? Math.round(parseFloat(vb[1])) : 16;
    (icon.variants || []).forEach(function (v) {
      var m = v.match(/^size-(.+)$/);
      if (m && !(m[1] in map)) map[m[1]] = px;
    });
  });
  return map;
}

// icon의 전체 className 문자열 생성: "icon-glyph-android size-default"
function iconClassNames(icon) {
  var base = 'icon-' + icon.kebab;
  var extras = (icon.variants || []).join(' ');
  return extras ? base + ' ' + extras : base;
}

// SVG 하이픈 속성명 → JSX camelCase
var JSX_ATTR = {
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'xlink:href': 'href',
  'color-interpolation-filters': 'colorInterpolationFilters',
};

// SVG에 React JSX props 주입 + 포맷팅
// svg 태그는 수동 빌드(JSX 표현식 포함), children만 formatXml
function prepareSvg(processedSvg, classNames) {
  var cleaned = processedSvg.replace(/\s*width="[^"]*"/, '').replace(/\s*height="[^"]*"/, '');

  // 1. svg 태그 기존 XML 속성 추출
  var svgTagMatch = cleaned.match(/<svg([^>]*)>/);
  var svgAttrStr = svgTagMatch ? svgTagMatch[1] : '';
  var xmlAttrs = [];
  var attrRe = /\s+([\w:.-]+)(?:="([^"]*)")?/g,
    hit;
  while ((hit = attrRe.exec(svgAttrStr)) !== null) {
    xmlAttrs.push(hit[2] !== undefined ? hit[1] + '="' + hit[2] + '"' : hit[1]);
  }

  // 2. JSX <svg> 태그 빌드 (항상 속성 줄 나눔)
  // base 클래스에서 size variant 제거 — size는 prop으로만 적용
  var baseCls = classNames
    .split(' ')
    .filter(function (c) {
      return !/^size-/.test(c);
    })
    .join(' ');
  var jsxProps = [
    'width={typeof size === "number" ? size : 16}',
    'height={typeof size === "number" ? size : 16}',
    'className={["icon", ' +
      JSON.stringify(baseCls) +
      ', typeof size === "string" && "size-" + size, className].filter(Boolean).join(" ")}',
    'style={color ? { color } : undefined}',
    '{...props}',
  ].concat(xmlAttrs);
  var svgOpen =
    '<svg\n' +
    jsxProps
      .map(function (p) {
        return '  ' + p;
      })
      .join('\n') +
    '\n>';

  // 3. 내부 children: camelCase 속성 + 자기닫힘 + formatXml
  var inner = cleaned
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg\s*>\s*$/, '')
    .trim();
  if (!inner) return svgOpen + '\n</svg>';

  // 하이픈 속성명 → camelCase
  inner = inner.replace(
    /\b(fill-rule|clip-rule|stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|stroke-miterlimit|stop-color|stop-opacity|font-size|font-family|text-anchor|dominant-baseline)(?==)/g,
    function (attr) {
      return JSX_ATTR[attr] || attr;
    }
  );

  var formatted = applySelfClosing(formatXml(inner));

  var formattedInner = formatted
    .split('\n')
    .map(function (l) {
      return '  ' + l;
    })
    .join('\n');

  return svgOpen + '\n' + formattedInner + '\n</svg>';
}

// React 컴포넌트 body (preview & file 공통)
// iconSizes: ["default", "micro"] → size?: "default" | "micro"
// iconSizes: []                   → size?: string (fallback)
function buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline) {
  var sizeType =
    'number | ' +
    (iconSizes && iconSizes.length > 0
      ? iconSizes
          .map(function (s) {
            return '"' + s + '"';
          })
          .join(' | ')
      : 'string');
  var indentedSvg = formattedSvg
    .split('\n')
    .map(function (l) {
      return '  ' + l;
    })
    .join('\n');
  return (
    'import type { SVGProps } from "react";\n\n' +
    'interface ' +
    name +
    'Props extends Omit<SVGProps<SVGSVGElement>, "color"> {\n' +
    '  size?: ' +
    sizeType +
    ';\n' +
    '  color?: string; // CSS color 값 — style.color 로 적용됨 (fill="currentColor" 상속)\n' +
    '}\n\n' +
    'export const ' +
    name +
    ' = ({ size, color, className, ...props }: ' +
    name +
    'Props) => (\n' +
    indentedSvg +
    '\n' +
    ');' +
    (trailingNewline ? '\n' : '')
  );
}

// ── React 컴포넌트 생성 ──
// 모달 미리보기용 — 전체 iconData 기준으로 sizes 수집
function buildReactComponent(icon, processedSvg) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  var sizes = collectIconSizes(iconData);
  return buildReactBody(
    name,
    'icon-' + icon.kebab,
    icon.variants || [],
    prepareSvg(processedSvg, cls),
    sizes,
    false
  );
}

// ZIP 다운로드용 개별 React 파일 생성
function buildReactFile(icon, processedSvg, iconSizes) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  return buildReactBody(
    name,
    'icon-' + icon.kebab,
    icon.variants || [],
    prepareSvg(processedSvg, cls),
    iconSizes,
    true
  );
}

// ZIP 전체 CSS 파일 생성
// allIcons: 사이즈 수집용 전체 목록, icons: CSS 클래스 생성용 (중복제거된) 목록
function buildIconsCss(icons, allIcons) {
  var date = new Date().toISOString().slice(0, 10);
  var sizePxMap = collectIconSizePx(allIcons || icons);
  var sizeEntries = Object.keys(sizePxMap).sort();

  var sizeClasses = sizeEntries.length
    ? sizeEntries
        .map(function (name) {
          var px = sizePxMap[name];
          return '.size-' + name + ' { width: ' + px + 'px; height: ' + px + 'px; }';
        })
        .join('\n') + '\n\n'
    : '';

  var header =
    '/* PixelForge Icon CSS — ' +
    date +
    ' */\n' +
    '/* Usage: <span class="icon icon-android size-default"></span> */\n\n' +
    '.icon {\n' +
    '  display: inline-block;\n' +
    '  width: 1em;\n' +
    '  height: 1em;\n' +
    '  background-color: currentColor;\n' +
    '  mask-repeat: no-repeat;\n' +
    '  mask-size: contain;\n' +
    '  mask-position: center;\n' +
    '  -webkit-mask-repeat: no-repeat;\n' +
    '  -webkit-mask-size: contain;\n' +
    '  -webkit-mask-position: center;\n' +
    '}\n\n' +
    sizeClasses;

  var classes = icons
    .map(function (icon) {
      var cls = 'icon-' + icon.kebab;
      return (
        '.' +
        cls +
        ' {\n' +
        '  mask-image: url("../svg/icon-' +
        icon.kebab +
        '.svg");\n' +
        '  -webkit-mask-image: url("../svg/icon-' +
        icon.kebab +
        '.svg");\n' +
        '}'
      );
    })
    .join('\n\n');

  return header + classes + '\n';
}

// ZIP 레지스트리 파일 (Icon.tsx)
function buildIconRegistryFile(icons, iconSizes) {
  if (!icons || icons.length === 0) return '';

  // kebab 기준 중복 제거
  var seen = new Set();
  var uniq = icons.filter(function (icon) {
    if (seen.has(icon.kebab)) return false;
    seen.add(icon.kebab);
    return true;
  });

  var imports = uniq
    .map(function (icon) {
      return 'import { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
    })
    .join('\n');

  var iconNameType = uniq
    .map(function (icon) {
      return '"' + icon.kebab + '"';
    })
    .join(' | ');

  var iconSizeType =
    'number | ' +
    (iconSizes && iconSizes.length > 0
      ? iconSizes
          .map(function (s) {
            return '"' + s + '"';
          })
          .join(' | ')
      : 'string');

  // 하이픈 포함 키는 반드시 따옴표로 감쌈
  var mapEntries = uniq
    .map(function (icon) {
      return '  "' + icon.kebab + '": Icon' + icon.pascal + ',';
    })
    .join('\n');

  return (
    'import type { SVGProps, ComponentType } from "react";\n' +
    imports +
    '\n\n' +
    'export type IconName = ' +
    iconNameType +
    ';\n' +
    'export type IconSize = ' +
    iconSizeType +
    ';\n\n' +
    'interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {\n' +
    '  name: IconName;\n' +
    '  size?: number | IconSize;\n' +
    '  color?: string;\n' +
    '}\n\n' +
    'const ICON_MAP: Record<IconName, ComponentType<Omit<IconProps, "name">>> = {\n' +
    mapEntries +
    '\n' +
    '};\n\n' +
    'export const Icon = ({ name, size, color, className, ...props }: IconProps) => {\n' +
    '  const Comp = ICON_MAP[name];\n' +
    '  return Comp ? <Comp size={size} color={color} className={className} {...props} /> : null;\n' +
    '};\n'
  );
}

// ZIP 배럴 파일 (index.ts)
function buildIndexFile(icons) {
  var exports = icons.map(function (icon) {
    return 'export { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
  });
  exports.push('export { Icon, type IconName, type IconSize } from "./Icon";');
  return exports.join('\n') + '\n';
}

// SVG ZIP: svg/ + css/
async function downloadSvgZip(icons) {
  // kebab 기준 중복제거 — 같은 아이콘의 여러 size variant 중 첫 번째만 저장
  var seenKebab = new Set();
  var uniqIcons = icons.filter(function (icon) {
    if (seenKebab.has(icon.kebab)) return false;
    seenKebab.add(icon.kebab);
    return true;
  });
  var zip = new JSZip();
  var svgFolder = zip.folder('svg');
  var cssFolder = zip.folder('css');
  uniqIcons.forEach(function (icon) {
    svgFolder.file(
      'icon-' + icon.kebab + '.svg',
      replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue)
    );
  });
  cssFolder.file('icons.css', buildIconsCss(uniqIcons, icons));
  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-svg-' + uniqIcons.length + '.zip';
  a.click();
  URL.revokeObjectURL(url);
}

// SVG 코드 ZIP: icons.ts (SVG 문자열 상수 export) + index.ts
async function downloadSvgCodeZip(icons) {
  var date = new Date().toISOString().slice(0, 10);
  var svgMap = {};
  var items = icons
    .map(function (icon) {
      var rawSvg = applySelfClosing(
        formatXml(replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue))
      );
      var fullCls = iconClassNames(icon);
      // SVG 태그에 class 추가 — React 버전과 동일한 클래스명
      rawSvg = rawSvg.replace(/^<svg\b/, '<svg class="' + fullCls + '"');
      // 크기별 고유 key: 사이즈 variant가 있으면 "icon-android--size-default" 형태
      var sizeVariant = (icon.variants || []).find(function (v) {
        return /^size-/.test(v);
      });
      var dataKey = 'icon-' + icon.kebab + (sizeVariant ? '--' + sizeVariant : '');
      svgMap[dataKey] = rawSvg;
      var indented = rawSvg
        .split('\n')
        .map(function (l) {
          return '      ' + l;
        })
        .join('\n');
      var variantBadges = (icon.variants || [])
        .map(function (v) {
          return '<span class="variant-badge">' + v + '</span>';
        })
        .join('');
      return (
        '    <div class="icon-item" data-name="' +
        dataKey +
        '" title="클릭하여 SVG 복사">\n' +
        '      <div class="' +
        fullCls +
        ' icon-node">\n' +
        indented +
        '\n' +
        '      </div>\n' +
        '      <span class="icon-label">icon-' +
        icon.kebab +
        '</span>\n' +
        (variantBadges ? '      <div class="variant-badges">' + variantBadges + '</div>\n' : '') +
        '    </div>'
      );
    })
    .join('\n');

  var html =
    '<!DOCTYPE html>\n' +
    '<html lang="ko">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>PixelForge Icons — ' +
    icons.length +
    ' (' +
    date +
    ')</title>\n' +
    '  <style>\n' +
    '    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; }\n' +
    '    h1 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #0f172a; }\n' +
    '    h1 span { font-size: 13px; font-weight: 400; color: #64748b; margin-left: 8px; }\n' +
    '    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }\n' +
    '    .icon-item { display: flex; flex-direction: column; align-items: center; gap: 8px;\n' +
    '      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 8px 12px;\n' +
    '      cursor: pointer; transition: border-color .15s, background .15s, transform .1s; position: relative; }\n' +
    '    .icon-item:hover { border-color: #6366f1; background: #f5f3ff; transform: translateY(-1px); }\n' +
    '    .icon-item:active { transform: translateY(0); }\n' +
    '    .icon-item.copied { border-color: #22c55e !important; background: #f0fdf4 !important; }\n' +
    '    .icon-node { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: #1e293b; pointer-events: none; }\n' +
    '    .icon-node svg { width: 100%; height: 100%; }\n' +
    '    .icon-label { font-size: 10px; color: #64748b; text-align: center; word-break: break-all; line-height: 1.4; pointer-events: none; }\n' +
    '    .variant-badges { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }\n' +
    '    .variant-badge { font-size: 9px; background: #e0e7ff; color: #4338ca; border-radius: 3px; padding: 1px 4px; pointer-events: none; }\n' +
    '    .copy-badge { position: absolute; top: 6px; right: 6px; font-size: 9px; background: #22c55e;\n' +
    '      color: #fff; border-radius: 4px; padding: 1px 5px; opacity: 0; transition: opacity .2s; pointer-events: none; }\n' +
    '    .icon-item.copied .copy-badge { opacity: 1; }\n' +
    '    #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);\n' +
    '      background: #1e293b; color: #fff; font-size: 13px; padding: 8px 18px; border-radius: 8px;\n' +
    '      opacity: 0; transition: opacity .2s, transform .2s; pointer-events: none; white-space: nowrap; }\n' +
    '    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <h1>PixelForge Icons <span>' +
    icons.length +
    ' icons · ' +
    date +
    '</span></h1>\n' +
    '  <div class="icon-grid">\n' +
    items +
    '\n' +
    '  </div>\n' +
    '  <div id="toast"></div>\n' +
    '  <script>\n' +
    '    var SVG_DATA = ' +
    JSON.stringify(svgMap) +
    ';\n' +
    '    var toast = document.getElementById("toast");\n' +
    '    var toastTimer;\n' +
    '    function showToast(msg) {\n' +
    '      toast.textContent = msg;\n' +
    '      toast.classList.add("show");\n' +
    '      clearTimeout(toastTimer);\n' +
    '      toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 1800);\n' +
    '    }\n' +
    '    document.querySelector(".icon-grid").addEventListener("click", function(e) {\n' +
    '      var item = e.target.closest(".icon-item");\n' +
    '      if (!item) return;\n' +
    '      var name = item.dataset.name;\n' +
    '      var svg = SVG_DATA[name] || "";\n' +
    '      navigator.clipboard.writeText(svg).then(function() {\n' +
    '        item.classList.add("copied");\n' +
    '        setTimeout(function() { item.classList.remove("copied"); }, 1500);\n' +
    '        showToast(name + " SVG 복사됨");\n' +
    '      });\n' +
    '    });\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>\n';

  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-preview-' + icons.length + '.html';
  a.click();
  URL.revokeObjectURL(url);
}

// React ZIP: react/ (tsx 개별 파일 + index.ts)
async function downloadReactZip(icons) {
  // kebab 기준 중복 제거 — index.ts / Icon.tsx 모두 동일 목록 사용
  var seenKebab = new Set();
  icons = icons.filter(function (icon) {
    if (seenKebab.has(icon.kebab)) return false;
    seenKebab.add(icon.kebab);
    return true;
  });

  var zip = new JSZip();
  var reactFolder = zip.folder('react');
  var iconSizes = collectIconSizes(icons);
  icons.forEach(function (icon) {
    var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
    reactFolder.file('Icon' + icon.pascal + '.tsx', buildReactFile(icon, processed, iconSizes));
  });
  reactFolder.file('Icon.tsx', buildIconRegistryFile(icons, iconSizes));
  reactFolder.file('index.ts', buildIndexFile(icons));
  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-react-' + icons.length + '.zip';
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSS 코드 생성 ──
// ── 검색 필터 ──
function filterIcons(query) {
  iconSearchQuery = query.trim().toLowerCase();
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
  if (!iconSearchQuery) {
    iconFilteredData = iconData.slice();
  } else {
    iconFilteredData = iconData.filter(function (icon) {
      return (
        icon.name.toLowerCase().indexOf(iconSearchQuery) !== -1 ||
        icon.kebab.toLowerCase().indexOf(iconSearchQuery) !== -1
      );
    });
  }
  renderIconGrid();
  updateFilterCount();
}

// ── 검색 결과 카운트 ──
function updateFilterCount() {
  var countEl = $('iconFilterCount');
  if (!countEl) return;
  if (!iconSearchQuery) {
    countEl.textContent = iconData.length + (lang === 'ko' ? '개' : ' icons');
  } else {
    countEl.textContent =
      iconFilteredData.length + '/' + iconData.length + (lang === 'ko' ? '개' : '');
  }
}

// ── 아이콘 그리드 렌더링 ──
function renderIconGrid() {
  var list = $('iconList');
  var data = iconFilteredData;
  if (data.length === 0) {
    var msg = iconSearchQuery ? t('icon.noSearchResult') : t('icon.noIcons');
    list.innerHTML =
      '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;grid-column:1/-1;">' +
      msg +
      '</div>';
    return;
  }
  list.innerHTML = data
    .map(function (icon, idx) {
      var isSelected = iconSelectedIdx === idx;
      return (
        '<div class="icon-card' +
        (isSelected ? ' selected' : '') +
        '" data-idx="' +
        idx +
        '">' +
        '<div class="icon-card-preview">' +
        cleanSvg(icon.svg) +
        '</div>' +
        '<div class="icon-card-name">' +
        escapeHtml(icon.name) +
        '</div>' +
        '<div class="icon-card-actions">' +
        '<button class="btn-ghost icon-copy-btn" data-idx="' +
        idx +
        '" data-action="svg" style="height:24px;padding:0 6px;font-size:9px;">SVG</button>' +
        '<button class="btn-ghost icon-copy-btn" data-idx="' +
        idx +
        '" data-action="react" style="height:24px;padding:0 6px;font-size:9px;">React</button>' +
        '</div>' +
        '</div>'
      );
    })
    .join('');
}

// ── 상세 패널 코드 업데이트 ──
function updateDetailCode() {
  if (iconSelectedIdx === null) return;
  var icon = iconFilteredData[iconSelectedIdx];
  if (!icon) return;

  var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
  var code = iconDetailTab === 'react' ? buildReactComponent(icon, processed) : processed;
  $('iconDetailCode').textContent = code;

  // 썸네일 색상 반영 (custom 모드)
  if (iconColorMode === 'custom') {
    var thumb = $('iconDetailThumb');
    thumb.style.color = iconColorValue;
  }
}

// ── 아이콘 선택 → 상세 패널 ──
function selectIcon(idx) {
  // toggle: 같은 아이콘 재클릭 시 닫기
  if (iconSelectedIdx === idx) {
    iconSelectedIdx = null;
    $('iconDetailBackdrop').classList.add('hidden');
    renderIconGrid();
    return;
  }
  iconSelectedIdx = idx;
  var icon = iconFilteredData[idx];
  if (!icon) return;

  renderIconGrid();
  $('iconDetailName').textContent = icon.name;
  var thumb = $('iconDetailThumb');
  thumb.innerHTML = replaceSvgColor(cleanSvg(icon.svg), 'currentColor', 'currentColor');
  thumb.style.color = '';
  $('iconDetailBackdrop').classList.remove('hidden');
  iconDetailTab = 'svg';
  document.querySelectorAll('.icon-detail-tab').forEach(function (tab) {
    tab.classList.toggle('active', tab.dataset.detailTab === 'svg');
  });
  updateDetailCode();
}

// ── Icon mode toggle ──
document.querySelectorAll('[data-icon-mode]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    iconMode = btn.dataset.iconMode;
    document.querySelectorAll('[data-icon-mode]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.iconMode === iconMode);
    });
    $('iconModeAll').style.display = iconMode === 'all' ? 'block' : 'none';
    $('iconModeSelection').style.display = iconMode === 'selection' ? 'block' : 'none';
  });
});

function updateIconSelInfo() {
  var info = $('iconSelInfo');
  if (lastSelection.count > 0) {
    info.textContent =
      lastSelection.count +
      t('icon.selected') +
      ' — ' +
      lastSelection.names.slice(0, 3).join(', ') +
      (lastSelection.count > 3 ? ' ' + t('extract.more') + (lastSelection.count - 3) : '');
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = '0' + t('icon.selected');
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

// 전체 추출
exportIconsAllBtn.addEventListener('click', function () {
  exportIconsAllBtn.disabled = true;
  exportIconsAllBtn.textContent = t('icon.extracting');
  parent.postMessage({ pluginMessage: { type: 'export-icons-all' } }, '*');
});

// 선택 추출
exportIconsBtn.addEventListener('click', function () {
  if (lastSelection.count === 0) {
    showToast(t('icon.selectFirst'));
    return;
  }
  exportIconsBtn.disabled = true;
  exportIconsBtn.textContent = t('icon.extracting');
  parent.postMessage({ pluginMessage: { type: 'export-icons' } }, '*');
});

// ── 캐시 배지 ──
function showCacheBadge(savedAt) {
  var badge = $('iconCacheBadge');
  var label = $('iconCacheSavedAt');
  if (!badge || !label) return;
  var date = new Date(savedAt);
  var fmt =
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0') +
    ' ' +
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0');
  label.textContent = (lang === 'ko' ? '캐시 · ' : 'cached · ') + fmt;
  badge.classList.remove('hidden');
}
function hideCacheBadge() {
  var badge = $('iconCacheBadge');
  if (badge) badge.classList.add('hidden');
}
$('iconCacheClearBtn').addEventListener('click', function () {
  parent.postMessage({ pluginMessage: { type: 'clear-icon-cache' } }, '*');
});

// ── Token Cache Badge & Banners ──
function updateFilterCacheBanner() {
  var banner = $('filterCacheBanner');
  var dateEl = $('filterCacheSavedAt');
  if (!banner) return;
  if (!extractedData) {
    banner.classList.add('hidden');
    return;
  }
  if (dateEl && tokenCacheInfo && tokenCacheInfo.savedAt) {
    var d = new Date(tokenCacheInfo.savedAt);
    var fmt =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0');
    dateEl.textContent =
      (tokenCacheInfo.figmaFileName ? tokenCacheInfo.figmaFileName + ' · ' : '') + fmt;
  }
  banner.classList.remove('hidden');
}
function showTokenCacheBadge(savedAt, fileName) {
  var badge = $('tokenCacheBadge');
  var dateEl = $('tokenCacheSavedAt');
  if (!badge || !dateEl) return;
  var d = new Date(savedAt);
  var fmt =
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0') +
    ' ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0');
  dateEl.textContent = fileName ? fileName + ' · ' + fmt : fmt;
  badge.classList.remove('hidden');
}
function hideTokenCacheBadge() {
  var badge = $('tokenCacheBadge');
  if (badge) badge.classList.add('hidden');
}
function showCacheBannerInTab(tabId, savedAt) {
  var banner = $(tabId + 'CacheBanner');
  var dateEl = $(tabId + 'CacheBannerDate');
  if (!banner || !savedAt) return;
  if (dateEl) {
    var d = new Date(savedAt);
    dateEl.textContent =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
  }
  banner.classList.remove('hidden');
}
function hideCacheBannerInTab(tabId) {
  var banner = $(tabId + 'CacheBanner');
  if (banner) banner.classList.add('hidden');
}
function applyTokenCacheToTabs(data) {
  if (data.styles && data.styles.colors && data.styles.colors.length > 0) {
    showCacheBannerInTab('a11y', tokenCacheInfo && tokenCacheInfo.savedAt);
  }
  showCacheBannerInTab('themes', tokenCacheInfo && tokenCacheInfo.savedAt);
  showCacheBannerInTab('images', tokenCacheInfo && tokenCacheInfo.savedAt);
}
var _tokenCacheClearBtn = $('tokenCacheClearBtn');
if (_tokenCacheClearBtn) {
  _tokenCacheClearBtn.addEventListener('click', function () {
    if (!confirm(t('extract.cacheClearConfirm'))) return;
    parent.postMessage({ pluginMessage: { type: 'token-cache-clear' } }, '*');
  });
}
var _filterCacheViewBtn = $('filterCacheViewBtn');
if (_filterCacheViewBtn) {
  _filterCacheViewBtn.addEventListener('click', function () {
    showView('result');
  });
}
var _filterCacheClearBtn = $('filterCacheClearBtn');
if (_filterCacheClearBtn) {
  _filterCacheClearBtn.addEventListener('click', function () {
    if (!confirm(t('extract.cacheClearConfirm'))) return;
    parent.postMessage({ pluginMessage: { type: 'token-cache-clear' } }, '*');
  });
}

function renderIconResults(data) {
  iconData = data;
  iconFilteredData = data.slice();
  iconSearchQuery = '';
  iconSelectedIdx = null;

  $('iconCount').textContent = data.length;
  $('iconResults').classList.remove('hidden');
  $('iconDetailBackdrop').classList.add('hidden');

  // 검색바 표시 (아이콘이 있을 때만)
  var searchRow = $('iconSearchRow');
  searchRow.classList.toggle('hidden', data.length === 0);
  $('iconSearchInput').value = '';
  $('iconSearchClear').classList.add('hidden');

  updateFilterCount();
  renderIconGrid();
}

// SVG 정리: xml 선언, 불필요 속성 제거, viewBox 보존
function cleanSvg(svg) {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+xmlns:xlink="[^"]*"/g, '')
    .trim();
}

// 이벤트 위임: 아이콘 카드 클릭 + 복사 버튼
$('iconList').addEventListener('click', function (e) {
  var btn = e.target.closest('.icon-copy-btn');
  if (btn) {
    var idx = parseInt(btn.dataset.idx, 10);
    var action = btn.dataset.action;
    var icon = iconFilteredData[idx];
    if (!icon) return;
    if (action === 'svg') {
      var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
      copyToClipboard(processed);
      showToast(t('icon.copySvg'));
    } else if (action === 'react') {
      var processed2 = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
      copyToClipboard(buildReactComponent(icon, processed2));
      showToast(t('icon.copyReact'));
    }
    return;
  }
  var card = e.target.closest('.icon-card');
  if (card) {
    selectIcon(parseInt(card.dataset.idx, 10));
  }
});

// ── 검색 이벤트 ──
var iconSearchDebounceTimer = null;
$('iconSearchInput').addEventListener('input', function () {
  var q = this.value;
  $('iconSearchClear').classList.toggle('hidden', q === '');
  clearTimeout(iconSearchDebounceTimer);
  iconSearchDebounceTimer = setTimeout(function () {
    filterIcons(q);
  }, 150);
});
$('iconSearchClear').addEventListener('click', function () {
  $('iconSearchInput').value = '';
  $('iconSearchClear').classList.add('hidden');
  filterIcons('');
  $('iconSearchInput').focus();
});

// ── 상세 패널 탭 ──
document.addEventListener('click', function (e) {
  var tab = e.target.closest('.icon-detail-tab');
  if (!tab) return;
  iconDetailTab = tab.dataset.detailTab;
  document.querySelectorAll('.icon-detail-tab').forEach(function (t2) {
    t2.classList.toggle('active', t2.dataset.detailTab === iconDetailTab);
  });
  updateDetailCode();
});

// ── 색상 모드 변경 ──
$('iconColorModeSelect').addEventListener('change', function () {
  iconColorMode = this.value;
  $('iconColorVarInput').classList.toggle('hidden', iconColorMode !== 'cssVar');
  $('iconColorPicker').classList.toggle('hidden', iconColorMode !== 'custom');
  if (iconColorMode === 'currentColor') iconColorValue = 'currentColor';
  if (iconColorMode === 'cssVar') iconColorValue = $('iconColorVarInput').value || '--icon-color';
  if (iconColorMode === 'custom') iconColorValue = $('iconColorPicker').value;
  updateDetailCode();
});
$('iconColorVarInput').addEventListener('input', function () {
  iconColorValue = this.value || '--icon-color';
  updateDetailCode();
});
$('iconColorPicker').addEventListener('input', function () {
  iconColorValue = this.value;
  updateDetailCode();
});

// ── 상세 패널 닫기 / 복사 ──
function closeIconModal() {
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
  renderIconGrid();
}
$('iconDetailClose').addEventListener('click', closeIconModal);
$('iconDetailBackdrop').addEventListener('click', function (e) {
  if (e.target === this) closeIconModal();
});
$('iconDetailCopyBtn').addEventListener('click', function () {
  copyToClipboard($('iconDetailCode').textContent);
  showToast(t('icon.detailCopied'));
});

// SVG ZIP 다운로드
$('iconDownloadSvgBtn').addEventListener('click', function () {
  if (iconData.length === 0) {
    showToast(t('icon.noIcons'));
    return;
  }
  $('iconDownloadSvgBtn').disabled = true;
  $('iconDownloadSvgBtn').textContent = t('icon.extracting');
  downloadSvgZip(iconData)
    .then(function () {
      $('iconDownloadSvgBtn').disabled = false;
      $('iconDownloadSvgBtn').textContent = t('icon.downloadSvg');
      showToast(t('icon.downloadSvgDone'));
    })
    .catch(function () {
      $('iconDownloadSvgBtn').disabled = false;
      $('iconDownloadSvgBtn').textContent = t('icon.downloadSvg');
    });
});

// SVG 코드 다운로드
$('iconDownloadSvgCodeBtn').addEventListener('click', function () {
  if (iconData.length === 0) {
    showToast(t('icon.noIcons'));
    return;
  }
  $('iconDownloadSvgCodeBtn').disabled = true;
  $('iconDownloadSvgCodeBtn').textContent = t('icon.extracting');
  downloadSvgCodeZip(iconData)
    .then(function () {
      $('iconDownloadSvgCodeBtn').disabled = false;
      $('iconDownloadSvgCodeBtn').textContent = t('icon.downloadSvgCode');
      showToast(t('icon.downloadSvgCodeDone'));
    })
    .catch(function () {
      $('iconDownloadSvgCodeBtn').disabled = false;
      $('iconDownloadSvgCodeBtn').textContent = t('icon.downloadSvgCode');
    });
});

// React ZIP 다운로드
$('iconDownloadReactBtn').addEventListener('click', function () {
  if (iconData.length === 0) {
    showToast(t('icon.noIcons'));
    return;
  }
  $('iconDownloadReactBtn').disabled = true;
  $('iconDownloadReactBtn').textContent = t('icon.extracting');
  downloadReactZip(iconData)
    .then(function () {
      $('iconDownloadReactBtn').disabled = false;
      $('iconDownloadReactBtn').textContent = t('icon.downloadReact');
      showToast(t('icon.downloadReactDone'));
    })
    .catch(function () {
      $('iconDownloadReactBtn').disabled = false;
      $('iconDownloadReactBtn').textContent = t('icon.downloadReact');
    });
});

// ══════════════════════════════════════════════
// ── Accessibility Tab ──
// ══════════════════════════════════════════════
var a11yBgSelect = $('a11yBgSelect');
var a11yFgSelect = $('a11yFgSelect');
var a11yBgHex = $('a11yBgHex');
var a11yFgHex = $('a11yFgHex');
var a11yBgPreview = $('a11yBgPreview');
var a11yFgPreview = $('a11yFgPreview');

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function relativeLuminance(rgb) {
  var srgb = rgb.map(function (c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(bg, fg) {
  var l1 = relativeLuminance(bg);
  var l2 = relativeLuminance(fg);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function updateA11y() {
  var bgHex = a11yBgHex.value.trim();
  var fgHex = a11yFgHex.value.trim();
  if (!bgHex.startsWith('#')) bgHex = '#' + bgHex;
  if (!fgHex.startsWith('#')) fgHex = '#' + fgHex;

  var bgRgb = hexToRgb(bgHex);
  var fgRgb = hexToRgb(fgHex);

  a11yBgPreview.style.background = bgRgb ? bgHex : '#FFFFFF';
  a11yFgPreview.style.background = fgRgb ? fgHex : '#000000';

  if (!bgRgb || !fgRgb) return;

  var ratio = contrastRatio(bgRgb, fgRgb);
  var ratioStr = ratio.toFixed(2) + ':1';
  $('a11yRatio').textContent = ratioStr;

  // AA normal: 4.5:1, AA large: 3:1, AAA: 7:1
  var aa = ratio >= 4.5;
  var aaLarge = ratio >= 3;
  var aaa = ratio >= 7;

  $('a11yAA').className = 'a11y-badge ' + (aa ? 'pass' : 'fail');
  $('a11yAA').textContent = 'AA Normal ' + (aa ? '✓' : '✗');
  $('a11yAALarge').className = 'a11y-badge ' + (aaLarge ? 'pass' : 'fail');
  $('a11yAALarge').textContent = 'AA Large ' + (aaLarge ? '✓' : '✗');
  $('a11yAAA').className = 'a11y-badge ' + (aaa ? 'pass' : 'fail');
  $('a11yAAA').textContent = 'AAA ' + (aaa ? '✓' : '✗');

  // Color the ratio text
  if (ratio >= 7) $('a11yRatio').style.color = '#15803D';
  else if (ratio >= 4.5) $('a11yRatio').style.color = 'var(--primary)';
  else if (ratio >= 3) $('a11yRatio').style.color = '#D97706';
  else $('a11yRatio').style.color = '#DC2626';

  // Preview
  $('a11yPreviewBox').style.background = bgHex;
  $('a11yPreviewText').style.color = fgHex;

  // Add visible border when background is light
  var bgLum = relativeLuminance(bgRgb);
  $('a11yPreviewBox').style.border = bgLum > 0.8 ? '1px solid #ddd' : '1px solid transparent';
}

a11yBgHex.addEventListener('input', updateA11y);
a11yFgHex.addEventListener('input', updateA11y);

// Swap button
$('a11ySwapBtn').addEventListener('click', function () {
  var tmpHex = a11yBgHex.value;
  a11yBgHex.value = a11yFgHex.value;
  a11yFgHex.value = tmpHex;
  // Also swap select values
  var tmpSel = a11yBgSelect.value;
  a11yBgSelect.value = a11yFgSelect.value;
  a11yFgSelect.value = tmpSel;
  updateA11y();
});
a11yBgSelect.addEventListener('change', function () {
  if (this.value) {
    a11yBgHex.value = this.value;
    updateA11y();
  }
});
a11yFgSelect.addEventListener('change', function () {
  if (this.value) {
    a11yFgHex.value = this.value;
    updateA11y();
  }
});

// Populate a11y dropdowns from extracted data
function populateA11yColors() {
  if (!extractedData) return;
  var hint = $('a11yHint');
  if (hint) hint.style.display = 'none';
  var colors = [];
  // From color styles
  if (extractedData.styles && extractedData.styles.colors) {
    extractedData.styles.colors.forEach(function (s) {
      if (s.paints && s.paints.length > 0 && s.paints[0].type === 'SOLID') {
        var c = s.paints[0].color;
        var r = Math.round((c.r || 0) * 255);
        var g = Math.round((c.g || 0) * 255);
        var b = Math.round((c.b || 0) * 255);
        var hex =
          '#' +
          [r, g, b]
            .map(function (v) {
              return v.toString(16).padStart(2, '0');
            })
            .join('')
            .toUpperCase();
        colors.push({ name: s.name, hex: hex });
      }
    });
  }
  // From COLOR variables
  if (extractedData.variables && extractedData.variables.variables) {
    extractedData.variables.variables.forEach(function (v) {
      if (v.resolvedType !== 'COLOR') return;
      var modes = Object.keys(v.valuesByMode);
      if (modes.length === 0) return;
      var val = v.valuesByMode[modes[0]];
      if (val && typeof val === 'object' && val.r !== undefined) {
        var r = Math.round(val.r * 255);
        var g = Math.round(val.g * 255);
        var b = Math.round(val.b * 255);
        var hex =
          '#' +
          [r, g, b]
            .map(function (v) {
              return v.toString(16).padStart(2, '0');
            })
            .join('')
            .toUpperCase();
        colors.push({ name: v.name, hex: hex });
      }
    });
  }
  [a11yBgSelect, a11yFgSelect].forEach(function (sel) {
    // Keep the first option, update its text
    while (sel.options.length > 1) sel.remove(1);
    sel.options[0].textContent = t('contrast.directInput');
    colors.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.hex;
      opt.textContent = c.name + ' (' + c.hex + ')';
      sel.appendChild(opt);
    });
  });
}

updateA11y();

// ── A11y Sub-Tab Switching ──
var a11ySubTab = 'manual';
document.querySelectorAll('.a11y-subtab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    a11ySubTab = btn.dataset.a11ySub;
    document.querySelectorAll('.a11y-subtab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.a11ySub === a11ySubTab);
    });
    $('a11yManualPanel').style.display = a11ySubTab === 'manual' ? 'flex' : 'none';
    $('a11yMatrixPanel').style.display = a11ySubTab === 'matrix' ? 'flex' : 'none';
    if (a11ySubTab === 'matrix') renderMatrix();
  });
});

// ── Build extracted colors from data ──
function buildExtractedColors() {
  extractedColors = [];
  if (!extractedData) return;
  var seen = {};
  // From color styles
  if (extractedData.styles && extractedData.styles.colors) {
    extractedData.styles.colors.forEach(function (s) {
      if (s.paints && s.paints.length > 0 && s.paints[0].type === 'SOLID') {
        var c = s.paints[0].color;
        var r = Math.round((c.r || 0) * 255);
        var g = Math.round((c.g || 0) * 255);
        var b = Math.round((c.b || 0) * 255);
        var hex =
          '#' +
          [r, g, b]
            .map(function (v) {
              return v.toString(16).padStart(2, '0');
            })
            .join('')
            .toUpperCase();
        if (!seen[hex]) {
          seen[hex] = true;
          extractedColors.push({ name: s.name, hex: hex });
        }
      }
    });
  }
  // From COLOR variables
  if (extractedData.variables && extractedData.variables.variables) {
    extractedData.variables.variables.forEach(function (v) {
      if (v.resolvedType !== 'COLOR') return;
      var modes = Object.keys(v.valuesByMode);
      if (modes.length === 0) return;
      var val = v.valuesByMode[modes[0]];
      if (val && typeof val === 'object' && val.r !== undefined) {
        var r = Math.round(val.r * 255);
        var g = Math.round(val.g * 255);
        var b = Math.round(val.b * 255);
        var hex =
          '#' +
          [r, g, b]
            .map(function (v) {
              return v.toString(16).padStart(2, '0');
            })
            .join('')
            .toUpperCase();
        if (!seen[hex]) {
          seen[hex] = true;
          extractedColors.push({ name: v.name, hex: hex });
        }
      }
    });
  }
}

// ── Matrix Rendering ──
function renderMatrix() {
  if (extractedColors.length === 0) {
    $('matrixEmpty').style.display = 'block';
    $('matrixContent').classList.add('hidden');
    $('matrixSummary').innerHTML = '';
    return;
  }
  $('matrixEmpty').style.display = 'none';
  $('matrixContent').classList.remove('hidden');

  // Limit to 20 colors
  var colors = extractedColors.slice(0, 20);
  $('matrixColorCount').textContent = colors.length;

  // Header cell with full name + hex + swatch
  function headerCell(c) {
    return (
      '<div class="matrix-header-label">' +
      '<span class="matrix-swatch" style="background:' +
      c.hex +
      '"></span>' +
      '<span class="matrix-header-name" title="' +
      escapeHtml(c.name) +
      '">' +
      escapeHtml(c.name) +
      '</span>' +
      '<span class="matrix-header-hex">' +
      c.hex +
      '</span>' +
      '</div>'
    );
  }

  // Badge helpers
  function getBadge(ratio) {
    if (ratio >= 7) return '<span class="matrix-badge badge-aaa">AAA</span>';
    if (ratio >= 4.5) return '<span class="matrix-badge badge-aa">AA</span>';
    if (ratio >= 3) return '<span class="matrix-badge badge-aa-large">AA+</span>';
    return '<span class="matrix-badge badge-fail">FAIL</span>';
  }
  function getCellClass(ratio) {
    if (ratio >= 7) return 'matrix-aaa';
    if (ratio >= 4.5) return 'matrix-aa';
    if (ratio >= 3) return 'matrix-aa-large';
    return 'matrix-fail';
  }
  function levelChecks(ratio) {
    var aaa = ratio >= 7 ? '✓' : '✗';
    var aa = ratio >= 4.5 ? '✓' : '✗';
    var aaLarge = ratio >= 3 ? '✓' : '✗';
    return 'AAA ' + aaa + '  AA ' + aa + '  AA Large ' + aaLarge;
  }

  // Summary counters
  var countAAA = 0,
    countAA = 0,
    countAALarge = 0,
    countFail = 0;

  var html = '<thead><tr><th></th>';
  colors.forEach(function (c) {
    html += '<th>' + headerCell(c) + '</th>';
  });
  html += '</tr></thead><tbody>';

  colors.forEach(function (row) {
    html += '<tr><td>' + headerCell(row) + '</td>';
    var rowRgb = hexToRgb(row.hex);
    colors.forEach(function (col) {
      if (row.hex === col.hex) {
        html += '<td class="matrix-same"></td>';
        return;
      }
      var colRgb = hexToRgb(col.hex);
      if (!rowRgb || !colRgb) {
        html += '<td>-</td>';
        return;
      }
      var ratio = contrastRatio(rowRgb, colRgb);
      var cls = getCellClass(ratio);
      var badge = getBadge(ratio);
      // Count
      if (ratio >= 7) countAAA++;
      else if (ratio >= 4.5) countAA++;
      else if (ratio >= 3) countAALarge++;
      else countFail++;

      var tooltipContent =
        escapeHtml(col.name) +
        t('contrast.on') +
        escapeHtml(row.name) +
        '<br>' +
        t('contrast.ratio') +
        ratio.toFixed(2) +
        ':1' +
        '<br>' +
        levelChecks(ratio) +
        '<br><br><span style="font-size:13px;font-weight:500;">' +
        t('contrast.sampleText') +
        '</span>';

      html +=
        '<td class="' +
        cls +
        ' matrix-cell">' +
        ratio.toFixed(1) +
        ':1 ' +
        badge +
        '<div class="matrix-tooltip">' +
        '<div style="padding:6px 8px;border-radius:4px;background:' +
        row.hex +
        ';color:' +
        col.hex +
        ';margin-bottom:4px;text-align:center;">' +
        '<span style="font-size:13px;font-weight:500;">' +
        t('contrast.sampleText') +
        '</span></div>' +
        tooltipContent +
        '</div>' +
        '</td>';
    });
    html += '</tr>';
  });

  html += '</tbody>';
  $('matrixTable').innerHTML = html;

  // Summary stats
  var total = countAAA + countAA + countAALarge + countFail;
  var pct = function (n) {
    return total > 0 ? Math.round((n / total) * 100) : 0;
  };
  $('matrixSummary').innerHTML =
    '<div class="matrix-summary">' +
    '<span style="font-weight:600;">' +
    t('contrast.summaryTotal') +
    ' ' +
    total +
    ' ' +
    t('contrast.summaryCombos') +
    '</span>' +
    '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#15803D;"></span> AAA ' +
    countAAA +
    ' (' +
    pct(countAAA) +
    '%)</span>' +
    '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#1D4ED8;"></span> AA ' +
    countAA +
    ' (' +
    pct(countAA) +
    '%)</span>' +
    '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#7C3AED;"></span> AA+ ' +
    countAALarge +
    ' (' +
    pct(countAALarge) +
    '%)</span>' +
    '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#DC2626;"></span> FAIL ' +
    countFail +
    ' (' +
    pct(countFail) +
    '%)</span>' +
    '</div>';
}

// ══════════════════════════════════════════════
// ── Theme Tab ──
// ══════════════════════════════════════════════
var themeData = null;
var showChangedOnly = false;
var extractThemesBtn = $('extractThemesBtn');
var themeFilterBtn = $('themeFilterBtn');

extractThemesBtn.addEventListener('click', function () {
  extractThemesBtn.disabled = true;
  extractThemesBtn.textContent = t('theme.extracting');
  parent.postMessage({ pluginMessage: { type: 'extract-themes' } }, '*');
});

themeFilterBtn.addEventListener('click', function () {
  showChangedOnly = !showChangedOnly;
  themeFilterBtn.textContent = showChangedOnly ? t('theme.changedOnly') : t('theme.showAll');
  renderThemes();
});

function renderThemes() {
  if (!themeData) return;
  var emptyState = $('themeEmptyState');
  if (emptyState) emptyState.style.display = 'none';
  var modes = Object.keys(themeData);
  if (modes.length < 2) {
    $('themeContent').innerHTML =
      '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">' +
      t('theme.noModes') +
      '</div>';
    return;
  }
  // Use first two modes for comparison
  var mode1 = modes[0];
  var mode2 = modes[1];
  var vars1 = themeData[mode1];
  var vars2 = themeData[mode2];

  // Build map for mode2
  var map2 = {};
  vars2.forEach(function (v) {
    map2[v.name] = v.value;
  });

  var rows = vars1.map(function (v) {
    var val2 = map2[v.name] || '—';
    var changed = v.value !== val2;
    return { name: v.name, val1: v.value, val2: val2, changed: changed };
  });

  if (showChangedOnly) {
    rows = rows.filter(function (r) {
      return r.changed;
    });
  }

  if (rows.length === 0) {
    $('themeContent').innerHTML =
      '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">' +
      (showChangedOnly ? t('theme.noChanged') : t('theme.noVars')) +
      '</div>';
    return;
  }

  var html = '<div class="theme-grid">';
  html += '<div class="theme-header">' + escapeHtml(mode1) + ' (' + rows.length + ')</div>';
  html += '<div class="theme-header">' + escapeHtml(mode2) + '</div>';

  rows.forEach(function (r) {
    var hl = r.changed ? ' highlight' : '';
    html +=
      '<div class="theme-row-light' +
      hl +
      '">' +
      '<div class="theme-swatch" style="background:' +
      r.val1 +
      '"></div>' +
      '<span class="theme-var-name">' +
      escapeHtml(r.name) +
      '</span>' +
      '<span class="theme-var-value">' +
      r.val1 +
      '</span>' +
      '</div>';
    html +=
      '<div class="theme-row-dark' +
      hl +
      '">' +
      '<div class="theme-swatch" style="background:' +
      r.val2 +
      '"></div>' +
      '<span class="theme-var-name">' +
      escapeHtml(r.name) +
      '</span>' +
      '<span class="theme-var-value">' +
      r.val2 +
      '</span>' +
      '</div>';
  });

  html += '</div>';
  $('themeContent').innerHTML = html;
}

// 테마 CSS 변수 생성
function generateThemeCSS() {
  if (!themeData) return '';
  var modes = Object.keys(themeData);
  if (modes.length < 2) return '';
  var mode1 = modes[0];
  var mode2 = modes[1];
  var vars1 = themeData[mode1];
  var vars2 = themeData[mode2];
  var map2 = {};
  vars2.forEach(function (v) {
    map2[v.name] = v.value;
  });

  function toCssVar(name) {
    return (
      '--' +
      name
        .replace(/\//g, '-')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
    );
  }

  var css = '/* ' + mode1 + ' (default) */\n:root {\n';
  vars1.forEach(function (v) {
    css += '  ' + toCssVar(v.name) + ': ' + v.value + ';\n';
  });
  css += '}\n\n/* ' + mode2 + ' */\n[data-theme="' + mode2.toLowerCase() + '"] {\n';
  vars1.forEach(function (v) {
    var val2 = map2[v.name] || v.value;
    css += '  ' + toCssVar(v.name) + ': ' + val2 + ';\n';
  });
  css += '}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n';
  vars1.forEach(function (v) {
    var val2 = map2[v.name] || v.value;
    if (v.value !== val2) {
      css += '    ' + toCssVar(v.name) + ': ' + val2 + ';\n';
    }
  });
  css += '  }\n}\n';
  return css;
}

// 테마 CSS 복사 버튼 (ui.html에 id="themeCopyCssBtn" 필요)
var themeCopyCssBtn = $('themeCopyCssBtn');
if (themeCopyCssBtn) {
  themeCopyCssBtn.addEventListener('click', function () {
    var css = generateThemeCSS();
    if (!css) {
      showToast(t('theme.extractFirst'));
      return;
    }
    copyToClipboard(css);
    showToast(t('theme.cssCopied'));
  });
}

// ══════════════════════════════════════════════
// ── Component Tab ──
// ══════════════════════════════════════════════

var TYPE_KEYWORDS = {
  button: ['button', 'btn', 'cta', 'action'],
  dialog: ['dialog', 'modal', 'overlay', 'popup', 'sheet'],
  select: ['select', 'dropdown', 'combobox', 'picker'],
  tabs: ['tab', 'tabs', 'tabbar'],
  tooltip: ['tooltip', 'hint', 'popover-tip'],
  checkbox: ['checkbox', 'check'],
  switch: ['switch', 'toggle'],
  accordion: ['accordion', 'collapse', 'expand'],
  popover: ['popover', 'flyout'],
};
var RADIX_MAP = {
  button: null,
  dialog: '@radix-ui/react-dialog',
  select: '@radix-ui/react-select',
  tabs: '@radix-ui/react-tabs',
  tooltip: '@radix-ui/react-tooltip',
  checkbox: '@radix-ui/react-checkbox',
  switch: '@radix-ui/react-switch',
  accordion: '@radix-ui/react-accordion',
  popover: '@radix-ui/react-popover',
  layout: null,
};
var SEMANTIC_TAGS = {
  header: 'header',
  gnb: 'header',
  nav: 'nav',
  footer: 'footer',
  sidebar: 'aside',
  card: 'article',
  item: 'article',
  section: 'section',
  panel: 'section',
};

function detectComponentType(nodeName) {
  var lower = nodeName.toLowerCase();
  var types = Object.keys(TYPE_KEYWORDS);
  for (var i = 0; i < types.length; i++) {
    var kws = TYPE_KEYWORDS[types[i]];
    for (var j = 0; j < kws.length; j++) {
      if (lower.indexOf(kws[j]) !== -1) return types[i];
    }
  }
  return 'layout';
}
function getSemanticTag(nodeName) {
  var lower = nodeName.toLowerCase();
  var keys = Object.keys(SEMANTIC_TAGS);
  for (var i = 0; i < keys.length; i++) {
    if (lower.indexOf(keys[i]) !== -1) return SEMANTIC_TAGS[keys[i]];
  }
  return 'div';
}
function compToPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, function (_, c) {
      return c.toUpperCase();
    })
    .replace(/^(.)/, function (c) {
      return c.toUpperCase();
    });
}
// ─── Radix UI 코드 생성 함수 (shadcn/ui 컨셉) ───────────────────────────────

function buildDialogCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  open: boolean;\n  onOpenChange: (open: boolean) => void;\n}\n\n'
    : '';
  var p = useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }';
  var title = d.texts.title || 'Dialog Title';
  var desc = d.texts.description
    ? '\n        <Dialog.Description className={styles.description}>\n          ' +
      d.texts.description +
      '\n        </Dialog.Description>'
    : '';
  var cancel = (d.texts.actions && d.texts.actions[0]) || 'Cancel';
  var confirm = (d.texts.actions && d.texts.actions[1]) || 'Confirm';
  return (
    "import * as Dialog from '@radix-ui/react-dialog';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Portal>\n      <Dialog.Overlay className={styles.overlay} />\n      <Dialog.Content className={styles.content} aria-describedby={undefined}>\n        <Dialog.Title className={styles.title}>' +
    title +
    '</Dialog.Title>' +
    desc +
    '\n        <div className={styles.footer}>\n          <Dialog.Close asChild>\n            <button className={styles.cancelBtn}>' +
    cancel +
    '</button>\n          </Dialog.Close>\n          <button className={styles.confirmBtn}>' +
    confirm +
    '</button>\n        </div>\n      </Dialog.Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);'
  );
}
function buildButtonCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;\n}\n\n'
    : '';
  var p = useTs
    ? '{ onClick, disabled, children }: ' + name + 'Props'
    : '{ onClick, disabled, children }';
  var label = (d.texts && d.texts.title) || name;
  return (
    "import styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <button\n    className={styles.root}\n    onClick={onClick}\n    disabled={disabled}\n    type="button"\n  >\n    {children ?? \'' +
    label +
    "'}\n  </button>\n);"
  );
}
function buildTabsCSSModules(d, name, useTs) {
  var labels =
    d.texts && d.texts.all
      ? d.texts.all.filter(function (t) {
          return t.length < 30;
        })
      : [];
  if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs
    ? "{ defaultValue = '" + labels[0] + "' }: " + name + 'Props'
    : "{ defaultValue = '" + labels[0] + "' }";
  var triggers = labels
    .map(function (l, i) {
      return (
        '      <Tabs.Trigger className={styles.trigger} value="tab' +
        (i + 1) +
        '">' +
        l +
        '</Tabs.Trigger>'
      );
    })
    .join('\n');
  var contents = labels
    .map(function (l, i) {
      return (
        '    <Tabs.Content className={styles.content} value="tab' +
        (i + 1) +
        '">\n      {/* ' +
        l +
        ' 내용 */}\n    </Tabs.Content>'
      );
    })
    .join('\n');
  return (
    "import * as Tabs from '@radix-ui/react-tabs';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Tabs.Root className={styles.root} defaultValue={defaultValue}>\n    <Tabs.List className={styles.list}>\n' +
    triggers +
    '\n    </Tabs.List>\n' +
    contents +
    '\n  </Tabs.Root>\n);'
  );
}
function buildCheckboxCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
    : '';
  var p = useTs
    ? '{ checked, onCheckedChange }: ' + name + 'Props'
    : '{ checked, onCheckedChange }';
  return (
    "import * as Checkbox from '@radix-ui/react-checkbox';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <label className={styles.root}>\n    <Checkbox.Root className={styles.checkbox} checked={checked} onCheckedChange={onCheckedChange}>\n      <Checkbox.Indicator className={styles.indicator}>\n        <svg viewBox="0 0 16 16" width="12" height="12">\n          <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" />\n        </svg>\n      </Checkbox.Indicator>\n    </Checkbox.Root>\n    <span className={styles.label}>' +
    label +
    '</span>\n  </label>\n);'
  );
}
function buildSwitchCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
    : '';
  var p = useTs
    ? '{ checked, onCheckedChange }: ' + name + 'Props'
    : '{ checked, onCheckedChange }';
  return (
    "import * as Switch from '@radix-ui/react-switch';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <label className={styles.root}>\n    <span className={styles.label}>' +
    label +
    '</span>\n    <Switch.Root className={styles.switch} checked={checked} onCheckedChange={onCheckedChange}>\n      <Switch.Thumb className={styles.thumb} />\n    </Switch.Root>\n  </label>\n);'
  );
}
function buildSelectCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Select...';
  var opts =
    d.texts && d.texts.all
      ? d.texts.all.slice(1).filter(function (t) {
          return t.length < 40;
        })
      : [];
  if (opts.length === 0) opts = ['Option 1', 'Option 2', 'Option 3'];
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  value?: string;\n  onValueChange?: (value: string) => void;\n}\n\n'
    : '';
  var p = useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }';
  var items = opts
    .map(function (o) {
      var v = o.toLowerCase().replace(/\s+/g, '-');
      return (
        '      <Select.Item className={styles.item} value="' +
        v +
        '">\n        <Select.ItemText>' +
        o +
        '</Select.ItemText>\n      </Select.Item>'
      );
    })
    .join('\n');
  return (
    "import * as Select from '@radix-ui/react-select';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Select.Trigger className={styles.trigger}>\n      <Select.Value placeholder="' +
    placeholder +
    '" />\n    </Select.Trigger>\n    <Select.Portal>\n      <Select.Content className={styles.content}>\n        <Select.Viewport>\n' +
    items +
    '\n        </Select.Viewport>\n      </Select.Content>\n    </Select.Portal>\n  </Select.Root>\n);'
  );
}
function buildTooltipCSSModules(d, name, useTs) {
  var content = (d.texts && d.texts.title) || 'Tooltip content';
  var trigger = (d.texts && d.texts.all && d.texts.all[1]) || '?';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Tooltip from '@radix-ui/react-tooltip';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ") => (\n  <Tooltip.Provider>\n    <Tooltip.Root>\n      <Tooltip.Trigger asChild>\n        <button className={styles.trigger}>{children ?? '" +
    trigger +
    "'}</button>\n      </Tooltip.Trigger>\n      <Tooltip.Portal>\n        <Tooltip.Content className={styles.content} sideOffset={4}>\n          " +
    content +
    '\n          <Tooltip.Arrow className={styles.arrow} />\n        </Tooltip.Content>\n      </Tooltip.Portal>\n    </Tooltip.Root>\n  </Tooltip.Provider>\n);'
  );
}
function buildAccordionCSSModules(d, name, useTs) {
  var items =
    d.texts && d.texts.all
      ? d.texts.all.filter(function (t) {
          return t.length < 50;
        })
      : [];
  if (items.length < 2) items = ['Item 1', 'Item 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }';
  var accItems = items
    .map(function (l, i) {
      var v = 'item-' + (i + 1);
      return (
        '    <Accordion.Item className={styles.item} value="' +
        v +
        '">\n      <Accordion.Trigger className={styles.trigger}>' +
        l +
        '</Accordion.Trigger>\n      <Accordion.Content className={styles.content}>\n        {/* ' +
        l +
        ' 내용 */}\n      </Accordion.Content>\n    </Accordion.Item>'
      );
    })
    .join('\n');
  return (
    "import * as Accordion from '@radix-ui/react-accordion';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Accordion.Root className={styles.root} type="single" defaultValue={defaultValue} collapsible>\n' +
    accItems +
    '\n  </Accordion.Root>\n);'
  );
}
function buildPopoverCSSModules(d, name, useTs) {
  var triggerLabel = (d.texts && d.texts.title) || 'Open';
  var content = (d.texts && d.texts.description) || 'Popover content';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Popover from '@radix-ui/react-popover';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Popover.Root>\n    <Popover.Trigger asChild>\n      <button className={styles.trigger}>' +
    triggerLabel +
    '</button>\n    </Popover.Trigger>\n    <Popover.Portal>\n      <Popover.Content className={styles.content} sideOffset={4}>\n        {children ?? <p>' +
    content +
    '</p>}\n        <Popover.Close className={styles.closeBtn} aria-label="Close">×</Popover.Close>\n        <Popover.Arrow className={styles.arrow} />\n      </Popover.Content>\n    </Popover.Portal>\n  </Popover.Root>\n);'
  );
}
function buildLayoutCSSModules(d, name, useTs) {
  var tag = getSemanticTag(name);
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <' +
    tag +
    ' className={styles.root}>\n    {children}\n  </' +
    tag +
    '>\n);'
  );
}
function buildRadixCSSModules(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  switch (type) {
    case 'dialog':
      return buildDialogCSSModules(d, name, useTs);
    case 'button':
      return buildButtonCSSModules(d, name, useTs);
    case 'tabs':
      return buildTabsCSSModules(d, name, useTs);
    case 'checkbox':
      return buildCheckboxCSSModules(d, name, useTs);
    case 'switch':
      return buildSwitchCSSModules(d, name, useTs);
    case 'select':
      return buildSelectCSSModules(d, name, useTs);
    case 'tooltip':
      return buildTooltipCSSModules(d, name, useTs);
    case 'accordion':
      return buildAccordionCSSModules(d, name, useTs);
    case 'popover':
      return buildPopoverCSSModules(d, name, useTs);
    default:
      return buildLayoutCSSModules(d, name, useTs);
  }
}
function buildRadixCSS(d) {
  var type = (d && d.detectedType) || 'layout';
  var rootCss = stylesToCSSProps(d.styles);
  if (type === 'dialog') {
    return (
      '.overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.5);\n}\n\n.content {\n' +
      rootCss +
      '\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%,-50%);\n}\n\n.title {\n  font-size: 18px;\n  font-weight: 600;\n  margin-bottom: 8px;\n}\n\n.description {\n  color: var(--text-secondary);\n  margin-bottom: 16px;\n}\n\n.footer {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n  margin-top: 16px;\n}\n\n.cancelBtn {\n  padding: 6px 14px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm, 4px);\n  background: none;\n  cursor: pointer;\n}\n\n.confirmBtn {\n  padding: 6px 14px;\n  background: var(--color-primary, #2d7ff9);\n  color: #fff;\n  border: none;\n  border-radius: var(--radius-sm, 4px);\n  cursor: pointer;\n}'
    );
  }
  if (type === 'tabs') {
    return (
      '.root {\n' +
      rootCss +
      "\n}\n\n.list {\n  display: flex;\n  border-bottom: 1px solid var(--border);\n}\n\n.trigger {\n  padding: 8px 16px;\n  border: none;\n  background: none;\n  cursor: pointer;\n  border-bottom: 2px solid transparent;\n}\n\n.trigger[data-state='active'] {\n  border-bottom-color: var(--color-primary, #2d7ff9);\n  font-weight: 600;\n}\n\n.content {\n  padding: 16px 0;\n}"
    );
  }
  if (type === 'checkbox') {
    return ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n}\n\n.checkbox {\n  width: 18px;\n  height: 18px;\n  border: 2px solid var(--border);\n  border-radius: 3px;\n  background: var(--surface);\n}\n\n.checkbox[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n  border-color: var(--color-primary, #2d7ff9);\n}\n\n.indicator {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #fff;\n}\n\n.label {\n  font-size: 14px;\n}";
  }
  if (type === 'switch') {
    return ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.switch {\n  width: 42px;\n  height: 24px;\n  border-radius: 12px;\n  background: var(--border);\n  position: relative;\n  cursor: pointer;\n  border: none;\n}\n\n.switch[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n}\n\n.thumb {\n  display: block;\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  background: #fff;\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  transition: transform 150ms;\n}\n\n.thumb[data-state='checked'] {\n  transform: translateX(18px);\n}";
  }
  if (type === 'select') {
    return (
      '.trigger {\n' +
      rootCss +
      '\n  display: inline-flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  gap: 8px;\n  cursor: pointer;\n}\n\n.content {\n  background: var(--color-surface, #fff);\n  border: 1px solid var(--border);\n  border-radius: 6px;\n  padding: 4px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n}\n\n.item {\n  padding: 8px 12px;\n  cursor: pointer;\n  border-radius: 4px;\n}\n\n.item[data-highlighted] {\n  background: var(--color-primary-light);\n  outline: none;\n}'
    );
  }
  if (type === 'tooltip') {
    return '.content {\n  background: #1a1a1a;\n  color: #fff;\n  padding: 6px 10px;\n  border-radius: 4px;\n  font-size: 12px;\n  animation: fadeIn 150ms ease;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(2px); }\n  to   { opacity: 1; transform: translateY(0); }\n}';
  }
  if (type === 'accordion') {
    return (
      '.root {\n' +
      rootCss +
      "\n}\n\n.item {\n  border-bottom: 1px solid var(--border);\n}\n\n.trigger {\n  width: 100%;\n  padding: 16px;\n  background: none;\n  border: none;\n  text-align: left;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  display: flex;\n  justify-content: space-between;\n}\n\n.trigger[data-state='open'] {\n  color: var(--color-primary, #2d7ff9);\n}\n\n.content {\n  padding: 0 16px 16px;\n  font-size: 14px;\n  color: var(--text-secondary);\n}"
    );
  }
  if (type === 'popover') {
    return (
      '.content {\n' +
      rootCss +
      '\n  border-radius: 8px;\n  box-shadow: 0 4px 16px rgba(0,0,0,0.15);\n  padding: 16px;\n}\n\n.closeBtn {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 16px;\n}'
    );
  }
  return '.root {\n' + rootCss + '\n}';
}
function buildRadixStyled(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  if (type === 'dialog') {
    var pt = useTs
      ? 'interface ' +
        name +
        'Props {\n  open: boolean;\n  onOpenChange: (open: boolean) => void;\n}\n\n'
      : '';
    var p = useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }';
    var title = (d.texts && d.texts.title) || 'Dialog Title';
    var cancel = (d.texts && d.texts.actions && d.texts.actions[0]) || 'Cancel';
    var confirm = (d.texts && d.texts.actions && d.texts.actions[1]) || 'Confirm';
    return (
      "import * as Dialog from '@radix-ui/react-dialog';\nimport styled from 'styled-components';\n\nconst Overlay = styled(Dialog.Overlay)`\n  position: fixed; inset: 0; background: rgba(0,0,0,0.5);\n`;\nconst Content = styled(Dialog.Content)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  position: fixed; top: 50%; left: 50%;\n  transform: translate(-50%,-50%);\n`;\n\n' +
      pt +
      'export const ' +
      name +
      ' = (' +
      p +
      ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Portal>\n      <Overlay />\n      <Content aria-describedby={undefined}>\n        <Dialog.Title>' +
      title +
      "</Dialog.Title>\n        <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>\n          <Dialog.Close asChild><button>" +
      cancel +
      '</button></Dialog.Close>\n          <button>' +
      confirm +
      '</button>\n        </div>\n      </Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);'
    );
  }
  if (type === 'button') {
    var pt2 = useTs
      ? 'interface ' +
        name +
        'Props {\n  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;\n}\n\n'
      : '';
    var p2 = useTs
      ? '{ onClick, disabled, children }: ' + name + 'Props'
      : '{ onClick, disabled, children }';
    var label = (d.texts && d.texts.title) || name;
    return (
      "import styled from 'styled-components';\n\nconst StyledButton = styled.button`\n" +
      stylesToCSSProps(d.styles) +
      '\n  cursor: pointer;\n  &:hover { opacity: 0.9; }\n  &:disabled { opacity: 0.5; cursor: not-allowed; }\n`;\n\n' +
      pt2 +
      'export const ' +
      name +
      ' = (' +
      p2 +
      ') => (\n  <StyledButton onClick={onClick} disabled={disabled} type="button">\n    {children ?? \'' +
      label +
      "'}\n  </StyledButton>\n);"
    );
  }
  if (type === 'tabs') {
    var labels =
      d.texts && d.texts.all
        ? d.texts.all.filter(function (t) {
            return t.length < 30;
          })
        : [];
    if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
    var triggers = labels
      .map(function (l, i) {
        return '      <Tabs.Trigger value="tab' + (i + 1) + '">' + l + '</Tabs.Trigger>';
      })
      .join('\n');
    var contents = labels
      .map(function (l, i) {
        return (
          '    <Tabs.Content value="tab' +
          (i + 1) +
          '">\n      {/* ' +
          l +
          ' 내용 */}\n    </Tabs.Content>'
        );
      })
      .join('\n');
    var ptTabs = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
    var pTabs = useTs
      ? "{ defaultValue = '" + labels[0] + "' }: " + name + 'Props'
      : "{ defaultValue = '" + labels[0] + "' }";
    return (
      "import * as Tabs from '@radix-ui/react-tabs';\nimport styled from 'styled-components';\n\nconst Root = styled(Tabs.Root)`\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst List = styled(Tabs.List)`\n  display: flex;\n  border-bottom: 1px solid var(--border);\n`;\nconst Trigger = styled(Tabs.Trigger)`\n  padding: 8px 16px; background: none; border: none;\n  border-bottom: 2px solid transparent; cursor: pointer;\n  &[data-state="active"] { border-bottom-color: var(--color-primary, #2d7ff9); font-weight: 600; }\n`;\nconst Content = styled(Tabs.Content)`\n  padding: 16px 0;\n`;\n\n' +
      ptTabs +
      'export const ' +
      name +
      ' = (' +
      pTabs +
      ') => (\n  <Root defaultValue={defaultValue}>\n    <List>\n' +
      triggers +
      '\n    </List>\n' +
      contents +
      '\n  </Root>\n);'
    );
  }
  if (type === 'checkbox') {
    var labelCb = (d.texts && d.texts.title) || name;
    var ptCb = useTs
      ? 'interface ' +
        name +
        'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
      : '';
    var pCb = useTs
      ? '{ checked, onCheckedChange }: ' + name + 'Props'
      : '{ checked, onCheckedChange }';
    return (
      "import * as Checkbox from '@radix-ui/react-checkbox';\nimport styled from 'styled-components';\n\nconst Root = styled.div`\n  display: flex; align-items: center; gap: 8px; cursor: pointer;\n`;\nconst StyledCheckbox = styled(Checkbox.Root)`\n  width: 18px; height: 18px; border: 2px solid var(--border);\n  border-radius: 3px; background: var(--color-surface);\n  &[data-state=\"checked\"] { background: var(--color-primary, #2d7ff9); border-color: var(--color-primary, #2d7ff9); }\n`;\nconst Indicator = styled(Checkbox.Indicator)`\n  display: flex; align-items: center; justify-content: center; color: #fff;\n`;\n\n" +
      ptCb +
      'export const ' +
      name +
      ' = (' +
      pCb +
      ') => (\n  <Root>\n    <StyledCheckbox checked={checked} onCheckedChange={onCheckedChange}>\n      <Indicator>✓</Indicator>\n    </StyledCheckbox>\n    <label>' +
      labelCb +
      '</label>\n  </Root>\n);'
    );
  }
  if (type === 'switch') {
    var labelSw = (d.texts && d.texts.title) || name;
    var ptSw = useTs
      ? 'interface ' +
        name +
        'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
      : '';
    var pSw = useTs
      ? '{ checked, onCheckedChange }: ' + name + 'Props'
      : '{ checked, onCheckedChange }';
    return (
      'import * as Switch from \'@radix-ui/react-switch\';\nimport styled from \'styled-components\';\n\nconst Root = styled.div`\n  display: flex; align-items: center; gap: 8px;\n`;\nconst StyledSwitch = styled(Switch.Root)`\n  width: 42px; height: 24px; border-radius: 12px;\n  background: var(--border); border: none; cursor: pointer; position: relative;\n  &[data-state="checked"] { background: var(--color-primary, #2d7ff9); }\n`;\nconst Thumb = styled(Switch.Thumb)`\n  display: block; width: 18px; height: 18px; border-radius: 50%;\n  background: #fff; position: absolute; top: 3px; left: 3px;\n  transition: transform 150ms;\n  &[data-state="checked"] { transform: translateX(18px); }\n`;\n\n' +
      ptSw +
      'export const ' +
      name +
      ' = (' +
      pSw +
      ') => (\n  <Root>\n    <StyledSwitch checked={checked} onCheckedChange={onCheckedChange}>\n      <Thumb />\n    </StyledSwitch>\n    <span>' +
      labelSw +
      '</span>\n  </Root>\n);'
    );
  }
  if (type === 'select') {
    var ptSel = useTs
      ? 'interface ' +
        name +
        'Props {\n  value?: string;\n  onValueChange?: (value: string) => void;\n  placeholder?: string;\n}\n\n'
      : '';
    var pSel = useTs
      ? '{ value, onValueChange, placeholder = "선택..." }: ' + name + 'Props'
      : '{ value, onValueChange, placeholder = "선택..." }';
    return (
      "import * as Select from '@radix-ui/react-select';\nimport styled from 'styled-components';\n\nconst Trigger = styled(Select.Trigger)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  display: inline-flex; align-items: center; justify-content: space-between;\n  padding: 8px 12px; gap: 8px; cursor: pointer;\n`;\nconst Content = styled(Select.Content)`\n  background: var(--color-surface); border: 1px solid var(--border);\n  border-radius: 6px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n`;\nconst Item = styled(Select.Item)`\n  padding: 8px 12px; cursor: pointer; border-radius: 4px;\n  &[data-highlighted] { background: var(--color-primary-light); outline: none; }\n`;\n\n' +
      ptSel +
      'export const ' +
      name +
      ' = (' +
      pSel +
      ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Trigger>\n      <Select.Value placeholder={placeholder} />\n      <Select.Icon>▾</Select.Icon>\n    </Trigger>\n    <Select.Portal>\n      <Content>\n        <Select.Viewport>\n          <Item value="option1"><Select.ItemText>옵션 1</Select.ItemText></Item>\n          <Item value="option2"><Select.ItemText>옵션 2</Select.ItemText></Item>\n        </Select.Viewport>\n      </Content>\n    </Select.Portal>\n  </Select.Root>\n);'
    );
  }
  if (type === 'tooltip') {
    var labelTt = (d.texts && d.texts.title) || '툴팁 내용';
    var ptTt = useTs
      ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n  content?: string;\n}\n\n'
      : '';
    var pTt = useTs
      ? '{ children, content = "' + labelTt + '" }: ' + name + 'Props'
      : '{ children, content = "' + labelTt + '" }';
    return (
      "import * as Tooltip from '@radix-ui/react-tooltip';\nimport styled from 'styled-components';\n\nconst Content = styled(Tooltip.Content)`\n  background: #1a1a1a; color: #fff; padding: 6px 10px;\n  border-radius: 4px; font-size: 12px;\n  animation: fadeIn 150ms ease;\n`;\n\n" +
      ptTt +
      'export const ' +
      name +
      ' = (' +
      pTt +
      ') => (\n  <Tooltip.Provider>\n    <Tooltip.Root>\n      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>\n      <Tooltip.Portal>\n        <Content sideOffset={4}>{content}<Tooltip.Arrow /></Content>\n      </Tooltip.Portal>\n    </Tooltip.Root>\n  </Tooltip.Provider>\n);'
    );
  }
  if (type === 'accordion') {
    var accLabels =
      d.texts && d.texts.all
        ? d.texts.all.filter(function (t) {
            return t.length < 40;
          })
        : [];
    if (accLabels.length < 2) accLabels = ['섹션 1', '섹션 2'];
    var items = accLabels
      .map(function (l, i) {
        return (
          '  <Item value="item' +
          (i + 1) +
          '">\n    <Header><Trigger>' +
          l +
          '</Trigger></Header>\n    <Content>{/* ' +
          l +
          ' 내용 */}</Content>\n  </Item>'
        );
      })
      .join('\n');
    var ptAcc = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
    var pAcc = useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }';
    return (
      "import * as Accordion from '@radix-ui/react-accordion';\nimport styled from 'styled-components';\n\nconst Root = styled(Accordion.Root)`\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst Item = styled(Accordion.Item)`\n  border-bottom: 1px solid var(--border);\n`;\nconst Header = styled(Accordion.Header)`\n  margin: 0;\n`;\nconst Trigger = styled(Accordion.Trigger)`\n  width: 100%; padding: 16px; background: none; border: none;\n  text-align: left; cursor: pointer; font-size: 14px; font-weight: 500;\n  display: flex; justify-content: space-between;\n  &[data-state="open"]::after { content: "▲"; }\n  &[data-state="closed"]::after { content: "▼"; }\n`;\nconst Content = styled(Accordion.Content)`\n  padding: 0 16px 16px;\n`;\n\n' +
      ptAcc +
      'export const ' +
      name +
      ' = (' +
      pAcc +
      ') => (\n  <Root type="single" collapsible defaultValue={defaultValue}>\n' +
      items +
      '\n  </Root>\n);'
    );
  }
  if (type === 'popover') {
    var labelPop = (d.texts && d.texts.title) || '열기';
    var ptPop = useTs ? 'interface ' + name + 'Props {\n  triggerLabel?: string;\n}\n\n' : '';
    var pPop = useTs
      ? '{ triggerLabel = "' + labelPop + '" }: ' + name + 'Props'
      : '{ triggerLabel = "' + labelPop + '" }';
    return (
      "import * as Popover from '@radix-ui/react-popover';\nimport styled from 'styled-components';\n\nconst Content = styled(Popover.Content)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);\n`;\n\n' +
      ptPop +
      'export const ' +
      name +
      ' = (' +
      pPop +
      ') => (\n  <Popover.Root>\n    <Popover.Trigger asChild>\n      <button>{triggerLabel}</button>\n    </Popover.Trigger>\n    <Popover.Portal>\n      <Content sideOffset={4}>\n        {/* 팝오버 내용 */}\n        <Popover.Close aria-label="닫기">×</Popover.Close>\n        <Popover.Arrow />\n      </Content>\n    </Popover.Portal>\n  </Popover.Root>\n);'
    );
  }
  var tag = getSemanticTag(name);
  var pt3 = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p3 = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import styled from 'styled-components';\n\nconst Wrapper = styled." +
    tag +
    '`\n' +
    stylesToCSSProps(d.styles) +
    '\n`;\n\n' +
    pt3 +
    'export const ' +
    name +
    ' = (' +
    p3 +
    ') => (\n  <Wrapper>{children}</Wrapper>\n);'
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function stylesToCSSProps(styles) {
  if (!styles) return '';
  return Object.keys(styles)
    .map(function (k) {
      return '  ' + k + ': ' + styles[k] + ';';
    })
    .join('\n');
}

var compState = {
  meta: null,
  componentType: 'layout',
  styleMode: 'css-modules',
  useTs: true,
  generatedTsx: '',
  generatedCss: '',
  registry: {},
  currentEntry: null,
  activeCodeTab: 'tsx',
  activeDetailTab: 'tsx',
  editMode: false,
};

function showGeneratedResult(tsx, css, styleMode) {
  compState.generatedTsx = tsx;
  compState.generatedCss = css;
  compState.activeCodeTab = 'tsx';
  var cssTabBtn = $('compCssTabBtn');
  if (cssTabBtn) cssTabBtn.style.display = styleMode === 'css-modules' ? '' : 'none';
  var tsxTabBtn = document.querySelector('[data-comp-code-tab="tsx"]');
  if (tsxTabBtn) tsxTabBtn.textContent = styleMode === 'html' ? 'HTML' : 'TSX';
  document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compCodeTab === 'tsx');
  });
  $('compCode').value = tsx;
  $('compResult').classList.remove('hidden');
  if (compState.meta) {
    var parts = compState.meta.nodeName.split('/');
    $('compNameInput').value = compToPascalCase(parts[parts.length - 1]);
  }
}

function switchCompSubTab(sub) {
  document.querySelectorAll('.comp-subtab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compSub === sub);
  });
  $('compGenerateView').style.display = sub === 'generate' ? '' : 'none';
  $('compRegistryView').style.display = sub === 'registry' ? '' : 'none';
  if (sub === 'registry') renderRegistryList();
}
document.querySelectorAll('.comp-subtab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    switchCompSubTab(btn.dataset.compSub);
  });
});

function updateCompSelInfo() {
  var info = $('compSelInfo');
  if (!info) return;
  if (lastSelection.count > 0 && lastSelection.meta) {
    info.textContent = (lang === 'ko' ? '선택: ' : 'Selected: ') + lastSelection.meta.nodeName;
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = t('component.noSel');
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

function onCompSelectionChanged() {
  var meta = (lastSelection && lastSelection.meta) || null;
  compState.meta = meta;
  updateCompSelInfo();
  if (!meta) return;
  var detected = detectComponentType(meta.nodeName);
  compState.componentType = detected;
  var ts = $('compTypeSelect');
  if (ts) ts.value = detected;
  updateTypeHint(detected);
  var key = meta.masterId || meta.nodeId;
  var entry = compState.registry[key];
  if (entry) {
    compState.currentEntry = entry;
    switchCompSubTab('registry');
    showRegistryDetail(entry);
  }
}

function updateTypeHint(type) {
  var hint = $('compTypeHint');
  if (!hint) return;
  var pkg = RADIX_MAP[type];
  hint.textContent = pkg
    ? 'Radix UI: ' + pkg
    : type === 'layout'
      ? lang === 'ko'
        ? '시맨틱 HTML 태그'
        : 'Semantic HTML'
      : 'Native element';
}

var _typeSelect = $('compTypeSelect');
if (_typeSelect)
  _typeSelect.addEventListener('change', function () {
    compState.componentType = _typeSelect.value;
    updateTypeHint(_typeSelect.value);
  });

document.querySelectorAll('.comp-style-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.styleMode = btn.dataset.compStyle;
    document.querySelectorAll('.comp-style-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compStyle === compState.styleMode);
    });
  });
});

var _compTsCheck = $('compTsCheck');
if (_compTsCheck) {
  _compTsCheck.checked = true;
  _compTsCheck.addEventListener('change', function () {
    compState.useTs = _compTsCheck.checked;
  });
}

var generateCompBtn = $('generateCompBtn');
if (generateCompBtn) {
  generateCompBtn.addEventListener('click', function () {
    if (lastSelection.count === 0) {
      showToast(t('component.selectFirst'));
      return;
    }
    generateCompBtn.disabled = true;
    generateCompBtn.textContent = t('component.generating');
    parent.postMessage({ pluginMessage: { type: 'generate-component' } }, '*');
  });
}

document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.activeCodeTab = btn.dataset.compCodeTab;
    document.querySelectorAll('[data-comp-code-tab]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compCodeTab === compState.activeCodeTab);
    });
    $('compCode').value =
      compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss;
  });
});

var _compCopyBtn = $('compCopyBtn');
if (_compCopyBtn)
  _compCopyBtn.addEventListener('click', function () {
    copyToClipboard(
      compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss
    );
    showToast(t('component.copied'));
  });

var _compSaveBtn = $('compSaveBtn');
if (_compSaveBtn) {
  _compSaveBtn.addEventListener('click', function () {
    var ni = $('compNameInput');
    var nameVal = ((ni && ni.value) || '').trim();
    if (!nameVal) {
      showToast(lang === 'ko' ? '컴포넌트명을 입력하세요' : 'Enter component name');
      return;
    }
    if (!compState.meta) {
      showToast(t('component.selectFirst'));
      return;
    }
    var key = compState.meta.masterId || compState.meta.nodeId;
    var entry = {
      name: nameVal,
      figmaNodeName: compState.meta.nodeName,
      figmaMasterNodeId: key,
      componentType: compState.componentType,
      radixPackage: RADIX_MAP[compState.componentType] || null,
      styleMode: compState.styleMode,
      useTs: compState.useTs,
      code: { tsx: compState.generatedTsx, css: compState.generatedCss },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    parent.postMessage({ pluginMessage: { type: 'registry-save', entry: entry } }, '*');
  });
}

function renderRegistryList() {
  var items = $('compRegistryItems');
  var empty = $('compRegistryEmpty');
  var count = $('compRegistryCount');
  if (!items) return;
  var query = ($('compSearchInput') ? $('compSearchInput').value : '').toLowerCase();
  var all = Object.keys(compState.registry).map(function (k) {
    return compState.registry[k];
  });
  var entries = all.filter(function (e) {
    return !query || e.name.toLowerCase().indexOf(query) !== -1;
  });
  items.innerHTML = '';
  if (entries.length === 0) {
    if (empty) empty.style.display = '';
  } else {
    if (empty) empty.style.display = 'none';
    entries.forEach(function (entry) {
      var updatedAt = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-';
      var item = document.createElement('div');
      item.className = 'comp-registry-item';
      item.innerHTML =
        '<div class="comp-registry-item-info"><div class="comp-registry-item-name">' +
        entry.name +
        '</div><div class="comp-registry-item-meta">' +
        (entry.componentType || 'layout') +
        ' · ' +
        (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') +
        ' · ' +
        updatedAt +
        '</div></div><div class="comp-registry-item-actions"><button class="comp-registry-del-btn">' +
        (lang === 'ko' ? '삭제' : 'Del') +
        '</button></div>';
      item.querySelector('.comp-registry-item-info').addEventListener('click', function () {
        showRegistryDetail(entry);
      });
      item.querySelector('.comp-registry-del-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm(lang === 'ko' ? entry.name + '을 삭제할까요?' : 'Delete ' + entry.name + '?'))
          parent.postMessage(
            { pluginMessage: { type: 'registry-delete', masterId: entry.figmaMasterNodeId } },
            '*'
          );
      });
      items.appendChild(item);
    });
  }
  if (count)
    count.textContent = lang === 'ko' ? '총 ' + entries.length + '개' : entries.length + ' items';
}

var _compSearchInput = $('compSearchInput');
if (_compSearchInput)
  _compSearchInput.addEventListener('input', function () {
    renderRegistryList();
  });

function showRegistryDetail(entry) {
  compState.currentEntry = entry;
  compState.activeDetailTab = 'tsx';
  compState.editMode = false;
  $('compRegistryList').style.display = 'none';
  $('compRegistryDetail').classList.remove('hidden');
  $('compDetailName').textContent = entry.name;
  $('compDetailMeta').textContent =
    (entry.componentType || 'layout') +
    ' · ' +
    (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') +
    ' · ' +
    (entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-');
  var cssBtn = $('compDetailCssTabBtn');
  if (cssBtn) cssBtn.style.display = entry.styleMode === 'css-modules' ? '' : 'none';
  document.querySelectorAll('[data-comp-detail-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compDetailTab === 'tsx');
  });
  $('compDetailCode').value = entry.code.tsx;
  $('compDetailCode').readOnly = true;
  $('compDetailSaveEditBtn').style.display = 'none';
  $('compDetailCancelEditBtn').style.display = 'none';
  $('compDetailEditBtn').style.display = '';
}

document.querySelectorAll('[data-comp-detail-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.activeDetailTab = btn.dataset.compDetailTab;
    document.querySelectorAll('[data-comp-detail-tab]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compDetailTab === compState.activeDetailTab);
    });
    if (compState.currentEntry)
      $('compDetailCode').value =
        compState.activeDetailTab === 'tsx'
          ? compState.currentEntry.code.tsx
          : compState.currentEntry.code.css;
  });
});

var _detailCopyBtn = $('compDetailCopyBtn');
if (_detailCopyBtn)
  _detailCopyBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    copyToClipboard(
      compState.activeDetailTab === 'tsx'
        ? compState.currentEntry.code.tsx
        : compState.currentEntry.code.css
    );
    showToast(t('component.copied'));
  });

var _detailEditBtn = $('compDetailEditBtn');
if (_detailEditBtn)
  _detailEditBtn.addEventListener('click', function () {
    $('compDetailCode').readOnly = false;
    $('compDetailCode').focus();
    $('compDetailSaveEditBtn').style.display = '';
    $('compDetailCancelEditBtn').style.display = '';
    $('compDetailEditBtn').style.display = 'none';
  });

var _detailSaveEditBtn = $('compDetailSaveEditBtn');
if (_detailSaveEditBtn)
  _detailSaveEditBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    var edited = $('compDetailCode').value;
    if (compState.activeDetailTab === 'tsx') compState.currentEntry.code.tsx = edited;
    else compState.currentEntry.code.css = edited;
    compState.currentEntry.updatedAt = new Date().toISOString();
    parent.postMessage(
      { pluginMessage: { type: 'registry-save', entry: compState.currentEntry } },
      '*'
    );
    $('compDetailCode').readOnly = true;
    $('compDetailSaveEditBtn').style.display = 'none';
    $('compDetailCancelEditBtn').style.display = 'none';
    $('compDetailEditBtn').style.display = '';
  });

var _detailCancelBtn = $('compDetailCancelEditBtn');
if (_detailCancelBtn)
  _detailCancelBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    $('compDetailCode').value =
      compState.activeDetailTab === 'tsx'
        ? compState.currentEntry.code.tsx
        : compState.currentEntry.code.css;
    $('compDetailCode').readOnly = true;
    $('compDetailSaveEditBtn').style.display = 'none';
    $('compDetailCancelEditBtn').style.display = 'none';
    $('compDetailEditBtn').style.display = '';
  });

var _detailUpdateBtn = $('compDetailUpdateBtn');
if (_detailUpdateBtn)
  _detailUpdateBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    if (
      !confirm(
        lang === 'ko'
          ? '현재 Figma 데이터로 코드를 다시 생성하고 덮어씁니다. 계속할까요?'
          : 'Regenerate from Figma and overwrite. Continue?'
      )
    )
      return;
    switchCompSubTab('generate');
    if (generateCompBtn) generateCompBtn.click();
  });

var _detailDeleteBtn = $('compDetailDeleteBtn');
if (_detailDeleteBtn)
  _detailDeleteBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    if (
      !confirm(
        lang === 'ko'
          ? compState.currentEntry.name + '을 삭제할까요?'
          : 'Delete ' + compState.currentEntry.name + '?'
      )
    )
      return;
    parent.postMessage(
      {
        pluginMessage: {
          type: 'registry-delete',
          masterId: compState.currentEntry.figmaMasterNodeId,
        },
      },
      '*'
    );
  });

var _detailBackBtn = $('compDetailBackBtn');
if (_detailBackBtn)
  _detailBackBtn.addEventListener('click', function () {
    $('compRegistryList').style.display = '';
    $('compRegistryDetail').classList.add('hidden');
    compState.currentEntry = null;
    renderRegistryList();
  });

var _exportAllBtn = $('compExportAllBtn');
if (_exportAllBtn)
  _exportAllBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(compState.registry, null, 2)], {
      type: 'application/json',
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'component-registry.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('component.downloadStart'));
  });

parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');

// ══════════════════════════════════════════════
// ── Clipboard helper ──
// ══════════════════════════════════════════════
function copyToClipboard(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ══════════════════════════════════════════════
// ── Images Tab ──
// ══════════════════════════════════════════════
var imageAssets = []; // ImageAsset[]
var imageFormat = 'PNG';
var imageScales = [1, 2]; // 선택된 배율 배열
var imageUseSelection = false;

// 포맷 버튼
document.querySelectorAll('.image-format-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    imageFormat = btn.dataset.fmt;
    document.querySelectorAll('.image-format-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.fmt === imageFormat);
    });
  });
});

// 배율 체크박스 토글
document.querySelectorAll('.image-scale-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var scale = parseInt(btn.dataset.scale, 10);
    var isActive = btn.classList.contains('active');
    if (isActive && imageScales.length === 1) return; // 최소 1개 유지
    if (isActive) {
      imageScales = imageScales.filter(function (s) {
        return s !== scale;
      });
    } else {
      imageScales.push(scale);
      imageScales.sort();
    }
    btn.classList.toggle('active', !isActive);
  });
});

// 범위 라디오
document.querySelectorAll('input[name="imgScope"]').forEach(function (r) {
  r.addEventListener('change', function () {
    imageUseSelection = r.value === 'selection';
  });
});

function setImgState(state) {
  ['imgStateIdle', 'imgStateDetecting', 'imgStateEmpty', 'imgStateError', 'imgStateList'].forEach(
    function (id) {
      $(id).classList.add('hidden');
    }
  );
  $(state).classList.remove('hidden');
}

function renderImageList(assets) {
  var listEl = $('imgList');
  if (!listEl) return;

  // 노드별로 그룹핑 (같은 id의 여러 배율)
  var grouped = {};
  var order = [];
  assets.forEach(function (a) {
    if (!grouped[a.id]) {
      grouped[a.id] = [];
      order.push(a.id);
    }
    grouped[a.id].push(a);
  });

  listEl.innerHTML = order
    .map(function (nodeId) {
      var group = grouped[nodeId];
      var first = group[0];
      var thumbSrc = 'data:' + first.mimeType + ';base64,' + first.base64;
      var fileNames = group
        .map(function (a) {
          return a.fileName;
        })
        .join(' · ');
      return (
        '<div class="image-item">' +
        '<div class="image-thumb"><img src="' +
        thumbSrc +
        '" alt="' +
        escapeHtml(first.name) +
        '" /></div>' +
        '<div class="image-info">' +
        '<div class="image-name" title="' +
        escapeHtml(first.name) +
        '">' +
        escapeHtml(first.name) +
        '</div>' +
        '<div class="image-size">' +
        first.width +
        ' × ' +
        first.height +
        ' px</div>' +
        '<div class="image-files">' +
        escapeHtml(fileNames) +
        '</div>' +
        '</div>' +
        '<button class="image-dl-btn" data-node-id="' +
        nodeId +
        '">' +
        t('image.downloadOne') +
        '</button>' +
        '</div>'
      );
    })
    .join('');

  // 개별 다운로드 버튼
  listEl.querySelectorAll('.image-dl-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      downloadSingleImage(btn.dataset.nodeId);
    });
  });

  // 전체 다운로드 버튼 업데이트
  var totalFiles = assets.length;
  var nodeCount = order.length;
  var allBtn = $('imgDownloadAllBtn');
  if (allBtn) {
    allBtn.disabled = totalFiles === 0;
    $('imgDownloadAllCount').textContent =
      ' ' + t('image.downloadAllCount').replace('{n}', nodeCount).replace('{m}', totalFiles);
  }
}

// ── ZIP 유틸 (Store-only) ──
function strToBytes(str) {
  var bytes = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
  return bytes;
}

function uint32LE(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}
function uint16LE(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function concatBuffers(arrays) {
  var total = arrays.reduce(function (s, a) {
    return s + a.length;
  }, 0);
  var out = new Uint8Array(total);
  var pos = 0;
  arrays.forEach(function (a) {
    out.set(a, pos);
    pos += a.length;
  });
  return out;
}

function crc32(data) {
  var table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    crc32.table = table;
  }
  var crc = 0xffffffff;
  for (var k = 0; k < data.length; k++) crc = table[(crc ^ data[k]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoreZip(files) {
  // files: Array<{ name: string, data: Uint8Array }>
  var localParts = [];
  var centralParts = [];
  var offsets = [];
  var offset = 0;

  files.forEach(function (file) {
    var nameBytes = strToBytes(file.name);
    var crc = crc32(file.data);
    var size = file.data.length;

    // Local file header
    var local = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
      uint16LE(20), // version needed
      uint16LE(0), // general purpose bit flag
      uint16LE(0), // compression method (store)
      uint16LE(0), // last mod time
      uint16LE(0), // last mod date
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameBytes.length),
      uint16LE(0), // extra field length
      nameBytes,
      file.data,
    ]);

    offsets.push(offset);
    offset += local.length;
    localParts.push(local);

    // Central directory entry
    var central = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
      uint16LE(20), // version made by
      uint16LE(20), // version needed
      uint16LE(0), // general purpose bit flag
      uint16LE(0), // compression method
      uint16LE(0), // last mod time
      uint16LE(0), // last mod date
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameBytes.length),
      uint16LE(0), // extra field length
      uint16LE(0), // file comment length
      uint16LE(0), // disk number start
      uint16LE(0), // internal file attributes
      uint32LE(0), // external file attributes
      uint32LE(offsets[offsets.length - 1]),
      nameBytes,
    ]);
    centralParts.push(central);
  });

  var centralSize = centralParts.reduce(function (s, c) {
    return s + c.length;
  }, 0);
  var eocd = concatBuffers([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // signature
    uint16LE(0), // disk number
    uint16LE(0), // disk with central dir
    uint16LE(files.length),
    uint16LE(files.length),
    uint32LE(centralSize),
    uint32LE(offset),
    uint16LE(0), // comment length
  ]);

  return concatBuffers(localParts.concat(centralParts).concat([eocd]));
}

function base64ToUint8(b64) {
  var bin = atob(b64);
  var arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function downloadBlob(data, fileName, mime) {
  var blob = new Blob([data], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadSingleImage(nodeId) {
  var group = imageAssets.filter(function (a) {
    return a.id === nodeId;
  });
  if (group.length === 0) return;
  if (group.length === 1) {
    var a = group[0];
    downloadBlob(base64ToUint8(a.base64), a.fileName, a.mimeType);
  } else {
    var files = group.map(function (a) {
      return { name: a.fileName, data: base64ToUint8(a.base64) };
    });
    var zip = buildStoreZip(files);
    downloadBlob(zip, group[0].kebab + '.zip', 'application/zip');
  }
}

function downloadAllImagesZip() {
  if (imageAssets.length === 0) return;
  var files = imageAssets.map(function (a) {
    return { name: a.fileName, data: base64ToUint8(a.base64) };
  });
  var zip = buildStoreZip(files);
  var baseName =
    extractedData && extractedData.meta && extractedData.meta.fileName
      ? extractedData.meta.fileName
      : 'images';
  downloadBlob(zip, baseName + '-images.zip', 'application/zip');
}

var detectImagesBtn = $('detectImagesBtn');
var imgDownloadAllBtn = $('imgDownloadAllBtn');

if (detectImagesBtn) {
  detectImagesBtn.addEventListener('click', function () {
    setImgState('imgStateDetecting');
    parent.postMessage(
      {
        pluginMessage: {
          type: 'extract-images',
          options: { format: imageFormat, scales: imageScales, useSelection: imageUseSelection },
        },
      },
      '*'
    );
  });
}

if (imgDownloadAllBtn) {
  imgDownloadAllBtn.addEventListener('click', downloadAllImagesZip);
}

var imgRetryBtn = $('imgRetryBtn');
if (imgRetryBtn) {
  imgRetryBtn.addEventListener('click', function () {
    setImgState('imgStateDetecting');
    parent.postMessage(
      {
        pluginMessage: {
          type: 'extract-images',
          options: { format: imageFormat, scales: imageScales, useSelection: imageUseSelection },
        },
      },
      '*'
    );
  });
}

// ── Init ──
showView('filter');

// Fallback: if no init-data arrives within 1s (non-Figma env), clear loading text
setTimeout(function () {
  if (headerFile.textContent === '로딩 중...' || headerFile.textContent === 'Loading...') {
    headerFile.textContent = lang === 'ko' ? 'Figma 파일' : 'Figma File';
  }
  if (
    colList.querySelector('.no-collections') &&
    (colList.textContent.trim() === '로딩 중...' || colList.textContent.trim() === 'Loading...')
  ) {
    colList.innerHTML =
      '<div class="no-collections">' + t('extract.noCollectionsFallback') + '</div>';
  }
}, 1000);
