'use strict';

import { escapeHtml } from './converters/utils.js';
import { buildVarMap, convertVariables, convertFlatVars } from './converters/variables.js';
import { convertColorStyles } from './converters/color-styles.js';
import { convertTextStyles } from './converters/typography.js';
import { convertEffectStyles } from './converters/effects.js';
import { highlightCSS } from './converters/highlight.js';

// ── i18n ──
var i18n = {
  ko: {
    tabs: { extract: '추출', icon: '아이콘', contrast: '명도대비', theme: '테마', component: '컴포넌트' },
    extract: {
      tokenType: '토큰 타입', btn: '토큰 추출하기', inspect: '🔍 검사', scope: '추출 범위',
      allPage: '전체 페이지', selection: '선택 레이어만', collections: '컬렉션',
      loading: '토큰을 추출하고 있습니다...', back: '← 뒤로',
      copy: '📋 복사', unit: '단위:',
      metaFile: '파일', metaScope: '범위', metaNodes: '노드', metaTime: '추출 시각',
      scopeAll: '전체 페이지', scopeSelection: '선택 레이어',
      noCollections: '컬렉션 없음', noCollectionsFallback: '컬렉션 없음 — Figma에서 플러그인을 실행하세요',
      extracting: '추출 중...', minType: '최소 1개 타입을 선택해야 합니다',
      jsonCopied: 'JSON 복사됨', cssCopied: 'CSS 복사됨',
      jsonDownload: 'JSON 다운로드 시작!', cssDownload: 'CSS 다운로드 시작!',
      errorPrefix: '오류: ', extractFail: '추출 실패',
      layerSelected: '개 레이어 선택됨', more: '외 ',
      tokenHint: 'Spacing·Radius = FLOAT Variables 자동 감지 / Shadow = Effect Styles 포함',
    },
    icon: {
      title: '아이콘 SVG 추출', allMode: '전체 추출', selMode: '선택 추출',
      allBtn: '전체 아이콘 추출하기', selBtn: '선택 요소 추출하기',
      noSel: '선택된 노드 없음', copySvg: 'SVG 복사됨', copyReact: 'React 컴포넌트 복사됨',
      selected: '개 선택됨', extracting: '추출 중...',
      selectFirst: '먼저 아이콘을 선택하세요', noIcons: '추출된 아이콘 없음',
      downloadAll: '전체 SVG 다운로드', iconDownload: '아이콘 JSON 다운로드 시작!',
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
      detailCss: 'CSS',
      detailCopy: '복사',
      detailCopied: '복사됨',
      filterCount: '/{total}개',
    },
    contrast: {
      title: 'WCAG 명도 대비 검사', manual: '수동 검사', matrix: '컬러 매트릭스',
      bg: '배경색', fg: '텍스트색', preview: '미리보기 텍스트 Preview',
      noColors: '추출 탭에서 색상을 먼저 추출하세요. 추출된 색상으로 자동 매트릭스를 생성합니다.',
      hint: '추출 탭에서 토큰을 먼저 추출하면, 디자인 색상을 드롭다운에서 선택할 수 있습니다.',
      directInput: '직접 입력', fail: '미달',
      summaryTotal: '전체', summaryCombos: '조합',
      on: ' on ', ratio: '대비: ',
      sampleText: 'Sample 가나다ABC',
    },
    theme: {
      title: '다크/라이트 테마 비교', extract: '테마 추출', copyCss: 'CSS 복사',
      showAll: '전체 보기', changedOnly: '변경된 것만',
      noData: 'Variables의 Light/Dark 모드를 자동 감지하여 비교합니다.',
      noModes: '2개 이상의 모드가 있는 컬렉션이 없습니다',
      noChanged: '변경된 항목이 없습니다', noVars: '테마 변수가 없습니다',
      extracting: '추출 중...', cssCopied: 'CSS 변수 복사됨',
      extractFirst: '먼저 테마를 추출하세요', exportFail: '테마 추출 실패: ',
    },
    component: {
      title: '컴포넌트 코드 생성', generate: '코드 생성', copy: '복사', save: '코드 저장',
      noSel: '선택된 노드 없음', outputLang: '출력 언어:',
      selectFirst: '먼저 컴포넌트를 선택하세요', generating: '생성 중...',
      cannotGenerate: '선택된 노드에서 코드를 생성할 수 없습니다',
      copied: '복사됨', downloadStart: '다운로드 시작!',
      generateFail: '코드 생성 실패: ',
      subGenerate: '코드 생성', subRegistry: '레지스트리',
      typeLabel: '컴포넌트 타입', styleLabel: '스타일 방식',
      saveBtn: '레지스트리 저장',
      edit: '수정', update: '업데이트', delete: '삭제', cancel: '취소', saveEdit: '저장',
      backToList: '← 목록으로', registryEmpty: '저장된 컴포넌트가 없습니다',
      exportAll: '전체 내보내기',
    },
  },
  en: {
    tabs: { extract: 'Extract', icon: 'Icons', contrast: 'Contrast', theme: 'Theme', component: 'Component' },
    extract: {
      tokenType: 'Token Type', btn: 'Extract Tokens', inspect: '🔍 Inspect', scope: 'Scope',
      allPage: 'Entire Page', selection: 'Selection Only', collections: 'Collections',
      loading: 'Extracting tokens...', back: '← Back',
      copy: '📋 Copy', unit: 'Unit:',
      metaFile: 'File', metaScope: 'Scope', metaNodes: 'Nodes', metaTime: 'Time',
      scopeAll: 'Entire Page', scopeSelection: 'Selection',
      noCollections: 'No collections', noCollectionsFallback: 'No collections — Run plugin in Figma',
      extracting: 'Extracting...', minType: 'Select at least 1 type',
      jsonCopied: 'JSON copied', cssCopied: 'CSS copied',
      jsonDownload: 'JSON download started!', cssDownload: 'CSS download started!',
      errorPrefix: 'Error: ', extractFail: 'Extraction failed',
      layerSelected: ' layers selected', more: '+ ',
      tokenHint: 'Spacing·Radius = Auto-detected FLOAT Variables / Shadow = Included in Effect Styles',
    },
    icon: {
      title: 'Icon SVG Export', allMode: 'All Icons', selMode: 'Selection',
      allBtn: 'Export All Icons', selBtn: 'Export Selected',
      noSel: 'No node selected', copySvg: 'SVG copied', copyReact: 'React component copied',
      selected: ' selected', extracting: 'Exporting...',
      selectFirst: 'Select icons first', noIcons: 'No icons found',
      downloadAll: 'Download All SVG', iconDownload: 'Icon JSON download started!',
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
      detailCss: 'CSS',
      detailCopy: 'Copy',
      detailCopied: 'Copied',
      filterCount: '/{total}',
    },
    contrast: {
      title: 'WCAG Contrast Checker', manual: 'Manual', matrix: 'Color Matrix',
      bg: 'Background', fg: 'Text Color', preview: 'Preview Text Sample',
      noColors: 'Extract colors first from the Extract tab to generate the matrix.',
      hint: 'Extract tokens first to select design colors from the dropdown.',
      directInput: 'Manual input', fail: 'Fail',
      summaryTotal: 'Total', summaryCombos: 'combos',
      on: ' on ', ratio: 'Contrast: ',
      sampleText: 'Sample Text ABC',
    },
    theme: {
      title: 'Dark/Light Theme Compare', extract: 'Extract Theme', copyCss: 'Copy CSS',
      showAll: 'Show All', changedOnly: 'Changed Only',
      noData: 'Automatically detects and compares Light/Dark modes from Variables.',
      noModes: 'No collections with 2+ modes found',
      noChanged: 'No changed items', noVars: 'No theme variables',
      extracting: 'Extracting...', cssCopied: 'CSS variables copied',
      extractFirst: 'Extract theme first', exportFail: 'Theme export failed: ',
    },
    component: {
      title: 'Component Code', generate: 'Generate Code', copy: 'Copy', save: 'Save Code',
      noSel: 'No node selected', outputLang: 'Output:',
      selectFirst: 'Select a component first', generating: 'Generating...',
      cannotGenerate: 'Cannot generate code from selected node',
      copied: 'Copied', downloadStart: 'Download started!',
      generateFail: 'Code generation failed: ',
      subGenerate: 'Generate', subRegistry: 'Registry',
      typeLabel: 'Component Type', styleLabel: 'Style Mode',
      saveBtn: 'Save to Registry',
      edit: 'Edit', update: 'Update', delete: 'Delete', cancel: 'Cancel', saveEdit: 'Save',
      backToList: '← Back', registryEmpty: 'No saved components',
      exportAll: 'Export All',
    },
  }
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
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Update dynamic text that depends on language
  if (extractedData) {
    var meta = extractedData.meta;
    $('metaMode').textContent = meta.sourceMode === 'selection' ? t('extract.scopeSelection') : t('extract.scopeAll');
  }
}

// ── Lang toggle ──
document.querySelectorAll('.lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    lang = btn.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    applyLang();
    // Re-render matrix if visible
    if (a11ySubTab === 'matrix') renderMatrix();
  });
});

// ── State ──
var extractedData = null;
var collections = [];
var activeTab = 'json';
var cssUnit = 'px';
var activeStatTypes = new Set();
var extractedColors = []; // {name, hex}[] for matrix

// ── DOM ──
var $ = function(id) { return document.getElementById(id); };
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
  ['filter', 'loading', 'result'].forEach(function(v) {
    var el = $(v === name ? null : null);
    el = $('view-' + v);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  backBtn.classList.toggle('visible', name === 'result');
  updateExtractBtn();
}

// ── Toast ──
var toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ── Selected types ──
function getSelectedTypes() {
  return Array.from(document.querySelectorAll('.token-card.active')).map(function(c) { return c.dataset.type; });
}

// ── Selected collections ──
function getSelectedCollectionIds() {
  return Array.from(document.querySelectorAll('#colList input[type="checkbox"]:checked')).map(function(c) { return c.value; });
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
  if (!isSelMode) { selectionInfo.classList.add('hidden'); return; }

  selectionInfo.classList.remove('hidden');
  selCount.textContent = sel.count + t('extract.layerSelected');

  var MAX_SHOW = 5;
  var items = sel.names.slice(0, MAX_SHOW).map(function(name, i) {
    var type = (sel.nodeTypes[i] || '').toLowerCase();
    return '<span class="sel-item"><span class="sel-type">' + type + '</span><span class="sel-name-text">' + name + '</span></span>';
  });
  if (sel.count > MAX_SHOW) {
    items.push('<span class="sel-more">' + t('extract.more') + (sel.count - MAX_SHOW) + '</span>');
  }
  selNames.innerHTML = items.join('');
}

var lastSelection = { count: 0, names: [], nodeTypes: [], meta: null };

// ── Scope radio change ──
document.querySelectorAll('input[name="scope"]').forEach(function(r) {
  r.addEventListener('change', function() {
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
  colList.innerHTML = cols.map(function(c) {
    return '<label class="col-item"><input type="checkbox" value="' + c.id + '" checked><span class="col-name">' + c.name + '</span><span class="col-count">' + (c.variableIds ? c.variableIds.length : 0) + '</span></label>';
  }).join('');
  colList.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
    cb.addEventListener('change', updateExtractBtn);
  });
}

// ── Token card toggle ──
document.querySelectorAll('.token-card').forEach(function(card) {
  card.addEventListener('click', function() {
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
inspectBtn.addEventListener('click', function() {
  parent.postMessage({ pluginMessage: { type: 'inspect' } }, '*');
  showToast(lang === 'ko' ? '노드 데이터 읽는 중...' : 'Reading node data...');
});

// ── Extract ──
extractBtn.addEventListener('click', function() {
  var types = getSelectedTypes();
  if (types.length === 0) { showToast(t('extract.minType')); return; }
  showView('loading');
  var options = {
    collectionIds: getSelectedCollectionIds(),
    useSelection: getScope() === 'selection',
    tokenTypes: types,
  };
  parent.postMessage({ pluginMessage: { type: 'extract', options: options } }, '*');
});

// ── Back ──
backBtn.addEventListener('click', function() { showView('filter'); });

// ── Tab switching ──
tabJson.addEventListener('click', function() {
  activeTab = 'json';
  tabJson.classList.add('active');
  tabCss.classList.remove('active');
  unitToggle.style.display = 'none';
  updatePreview();
});

tabCss.addEventListener('click', function() {
  activeTab = 'css';
  tabCss.classList.add('active');
  tabJson.classList.remove('active');
  unitToggle.style.display = 'flex';
  updatePreview();
});

// ── Unit toggle ──
unitPx.addEventListener('click', function() {
  cssUnit = 'px';
  unitPx.classList.add('active');
  unitRem.classList.remove('active');
  if (activeTab === 'css') updatePreview();
});

unitRem.addEventListener('click', function() {
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
  var header = '/**\n * PixelForge Design Tokens\n * File: ' + (meta.fileName || '') + '\n * Extracted: ' + (meta.extractedAt || new Date().toISOString()) + '\n * Generated by PixelForge Token Extractor\n */\n\n';
  var all = !types || types.size === 0;

  // ── Step 1: collect :root lines (light / default values) ──
  var rootLines = '';
  var themeBlocks = [];   // [{modeName, comment, lines}]

  if (all || types.has('variables')) {
    var varResult = convertVariables(data, varMap, unit);
    if (varResult.rootLines) rootLines += varResult.rootLines;
    varResult.themeBlocks.forEach(function(b) { themeBlocks.push(b); });
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
  themeBlocks.forEach(function(b) {
    body += b.comment + '\n[data-theme="' + b.modeName + '"] {\n' + b.lines + '}\n\n';
  });

  // ── Step 3: @media (prefers-color-scheme) — system preference ──
  if (themeBlocks.length > 0) {
    // Group blocks by modeName — emit one @media block per theme
    var mediaMap = {};
    themeBlocks.forEach(function(b) {
      if (!mediaMap[b.modeName]) mediaMap[b.modeName] = { comment: b.comment, lines: '' };
      mediaMap[b.modeName].lines += b.lines;
    });
    Object.keys(mediaMap).forEach(function(modeName) {
      var entry = mediaMap[modeName];
      body += entry.comment + '\n@media (prefers-color-scheme: ' + modeName + ') {\n  :root {\n';
      entry.lines.split('\n').forEach(function(line) {
        if (line.trim()) body += '  ' + line + '\n';
      });
      body += '  }\n}\n\n';
    });
  }

  // ── Text Styles — class selectors (outside :root) ──
  if (all || types.has('texts')) {
    body += convertTextStyles(data.styles ? data.styles.texts : [], unit);
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
    spacing:   types.has('spacing')   ? d.spacing   : [],
    radius:    types.has('radius')    ? d.radius    : [],
    styles: {
      colors:  types.has('colors')  ? (d.styles ? d.styles.colors  : []) : [],
      texts:   types.has('texts')   ? (d.styles ? d.styles.texts   : []) : [],
      effects: types.has('effects') ? (d.styles ? d.styles.effects : []) : [],
    },
    icons: types.has('icons') ? d.icons : [],
    meta: d.meta,
  };
}

// ── Stat card filter ──
function updateStatCardStyles() {
  document.querySelectorAll('.stat-card[data-type]').forEach(function(card) {
    if (card.classList.contains('inactive')) return;
    var type = card.dataset.type;
    var isActive = activeStatTypes.has(type);
    card.classList.toggle('selected', isActive);
    card.classList.toggle('dimmed', !isActive);
  });
}

document.querySelectorAll('.stat-card[data-type]').forEach(function(card) {
  card.addEventListener('click', function() {
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
  var sanitize = function(s) { return s.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); };
  if (meta && meta.sourceMode === 'selection' && lastSelection.count > 0) {
    var names = lastSelection.names;
    var selPart;
    if (names.length === 1) selPart = sanitize(names[0]);
    else if (names.length <= 3) selPart = names.map(sanitize).join('+');
    else selPart = sanitize(names[0]) + '_외' + (names.length - 1) + '개';
    var filePart = meta.fileName ? sanitize(meta.fileName) : 'pixelforge';
    return filePart + '_' + selPart;
  }
  return (meta && meta.fileName) ? sanitize(meta.fileName) : 'tokens';
}

// ── Copy ──
copyBtn.addEventListener('click', function() {
  if (!extractedData) return;
  var filtered = getFilteredData();
  var text = activeTab === 'json' ? JSON.stringify(filtered, null, 2) : generateCSS(filtered, cssUnit, activeStatTypes);
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast(activeTab === 'json' ? t('extract.jsonCopied') : t('extract.cssCopied'));
});

// ── Download JSON ──
downloadJsonBtn.addEventListener('click', function() {
  if (!extractedData) return;
  var blob = new Blob([JSON.stringify(getFilteredData(), null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = buildFileBase() + '_tokens.json';
  a.click(); URL.revokeObjectURL(url);
  showToast(t('extract.jsonDownload'));
});

// ── Download CSS ──
downloadCssBtn.addEventListener('click', function() {
  if (!extractedData) return;
  var blob = new Blob([generateCSS(getFilteredData(), cssUnit, activeStatTypes)], { type: 'text/css' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = buildFileBase() + '_tokens.css';
  a.click(); URL.revokeObjectURL(url);
  showToast(t('extract.cssDownload'));
});

// ── Result rendering ──
function renderResult(data) {
  extractedData = data;
  var variables = data.variables, spacing = data.spacing, radius = data.radius;
  var styles = data.styles, icons = data.icons, meta = data.meta;

  var varCount     = variables ? variables.variables.length : 0;
  var spacingCount = spacing   ? spacing.length : 0;
  var radiusCount  = radius    ? radius.length  : 0;
  var colorCount   = styles    ? styles.colors.length  : 0;
  var textCount    = styles    ? styles.texts.length   : 0;
  var effectCount  = styles    ? styles.effects.length : 0;
  var iconCount    = icons     ? icons.length : 0;

  $('statVarNum').textContent     = varCount;
  $('statSpacingNum').textContent = spacingCount;
  $('statRadiusNum').textContent  = radiusCount;
  $('statColorNum').textContent   = colorCount;
  $('statTextNum').textContent    = textCount;
  $('statEffectNum').textContent  = effectCount;
  $('statIconsNum').textContent   = iconCount;

  [['statVar', varCount], ['statSpacing', spacingCount], ['statRadius', radiusCount],
   ['statColor', colorCount], ['statText', textCount], ['statEffect', effectCount], ['statIcons', iconCount]
  ].forEach(function(p) { $(p[0]).classList.toggle('inactive', p[1] === 0); });

  $('metaFile').textContent  = meta.fileName || '—';
  $('metaMode').textContent  = meta.sourceMode === 'selection' ? t('extract.scopeSelection') : t('extract.scopeAll');
  $('metaNodes').textContent = (meta.totalNodes || 0).toLocaleString() + '개';
  var d = new Date(meta.extractedAt);
  $('metaTime').textContent  = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  activeStatTypes.clear();
  var typeCounts = { variables: varCount, spacing: spacingCount, radius: radiusCount, colors: colorCount, texts: textCount, effects: effectCount, icons: iconCount };
  Object.keys(typeCounts).forEach(function(t) { if (typeCounts[t] > 0) activeStatTypes.add(t); });
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
window.onmessage = function(event) {
  var msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'init-data') {
    headerFile.textContent = msg.fileName || (lang === 'ko' ? 'Figma 파일' : 'Figma File');
    renderCollections(msg.collections || []);
    if (msg.selection) { lastSelection = msg.selection; renderSelectionInfo(msg.selection); }
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
    a.href = url; a.download = 'inspect_nodes.json';
    a.click(); URL.revokeObjectURL(url);
    showToast(lang === 'ko' ? 'inspect_nodes.json 저장됨' : 'inspect_nodes.json saved');
  }
  if (msg.type === 'extract-result') {
    renderResult(msg.data);
    populateA11yColors();
    buildExtractedColors();
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
    if (generateCompBtn) { generateCompBtn.disabled = false; generateCompBtn.textContent = t('component.generate'); }
    var d = msg.data;
    if (d) {
      var tsx = compState.styleMode === 'css-modules'
        ? buildCSSModulesTSX(compToPascalCase((d.name || 'Component').split('/').pop()), compState.componentType, compState.useTs)
        : buildStyledTSX(compToPascalCase((d.name || 'Component').split('/').pop()), compState.componentType, compState.useTs);
      var css = compState.styleMode === 'css-modules'
        ? buildCSSModulesCSS(d.styles || {}, compState.componentType)
        : '';
      showGeneratedResult(tsx, css, compState.styleMode);
    } else {
      showToast(t('component.cannotGenerate'));
    }
  }
  if (msg.type === 'generate-component-error') {
    if (generateCompBtn) { generateCompBtn.disabled = false; generateCompBtn.textContent = t('component.generate'); }
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
  extract:   $('panel-extract'),
  icons:     $('panel-icons'),
  a11y:      $('panel-a11y'),
  themes:    $('panel-themes'),
  component: $('panel-component'),
};

function switchMainTab(tab) {
  currentMainTab = tab;
  mainTabs.forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  Object.keys(tabPanels).forEach(function(k) {
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

mainTabs.forEach(function(t) {
  t.addEventListener('click', function() {
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
  return svg
    .replace(/fill="([^"]*)"/g, function(_, v) {
      if (KEEP.test(v)) return 'fill="' + v + '"';
      if (mode === 'currentColor') return 'fill="currentColor"';
      if (mode === 'cssVar') return 'fill="var(' + value + ')"';
      return 'fill="' + value + '"';
    })
    .replace(/stroke="([^"]*)"/g, function(_, v) {
      if (KEEP.test(v)) return 'stroke="' + v + '"';
      if (mode === 'currentColor') return 'stroke="currentColor"';
      if (mode === 'cssVar') return 'stroke="var(' + value + ')"';
      return 'stroke="' + value + '"';
    });
}

// ── React 컴포넌트 생성 ──
function buildReactComponent(icon, processedSvg) {
  var withProps = processedSvg.replace(/<svg/, '<svg {...props}');
  return 'import type { SVGProps } from "react";\n\nexport const '
    + icon.pascal + ' = (props: SVGProps<SVGSVGElement>) => (\n  '
    + withProps + '\n);';
}

// ── CSS 코드 생성 ──
function buildCssOutput(icon, mode, value) {
  var cls = '.' + icon.kebab;
  if (mode === 'currentColor') {
    return '/* currentColor — 부모 color 속성 상속 */\n'
      + ':root {\n  --color-icon: #1e293b; /* light */\n}\n'
      + '[data-theme="dark"] {\n  --color-icon: #f1f5f9; /* dark */\n}\n'
      + '@media (prefers-color-scheme: dark) {\n  :root { --color-icon: #f1f5f9; }\n}\n\n'
      + cls + ' {\n  color: var(--color-icon);\n}';
  }
  if (mode === 'cssVar') {
    return '/* CSS 변수 모드 */\n'
      + ':root {\n  ' + value + ': #1e293b; /* light */\n}\n'
      + '[data-theme="dark"] {\n  ' + value + ': #f1f5f9; /* dark */\n}\n'
      + '@media (prefers-color-scheme: dark) {\n  :root { ' + value + ': #f1f5f9; }\n}';
  }
  return '/* 커스텀 색상 */\n' + cls + ' {\n  color: ' + value + ';\n}';
}

// ── 검색 필터 ──
function filterIcons(query) {
  iconSearchQuery = query.trim().toLowerCase();
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
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

// ── 검색 결과 카운트 ──
function updateFilterCount() {
  var countEl = $('iconFilterCount');
  if (!countEl) return;
  if (!iconSearchQuery) {
    countEl.textContent = iconData.length + (lang === 'ko' ? '개' : ' icons');
  } else {
    countEl.textContent = iconFilteredData.length + '/' + iconData.length + (lang === 'ko' ? '개' : '');
  }
}

// ── 아이콘 그리드 렌더링 ──
function renderIconGrid() {
  var list = $('iconList');
  var data = iconFilteredData;
  if (data.length === 0) {
    var msg = iconSearchQuery ? t('icon.noSearchResult') : t('icon.noIcons');
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;grid-column:1/-1;">' + msg + '</div>';
    return;
  }
  list.innerHTML = data.map(function(icon, idx) {
    var isSelected = iconSelectedIdx === idx;
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

// ── 상세 패널 코드 업데이트 ──
function updateDetailCode() {
  if (iconSelectedIdx === null) return;
  var icon = iconFilteredData[iconSelectedIdx];
  if (!icon) return;

  var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
  var code = '';
  if (iconDetailTab === 'svg') {
    code = processed;
  } else if (iconDetailTab === 'react') {
    code = buildReactComponent(icon, processed);
  } else {
    code = buildCssOutput(icon, iconColorMode, iconColorValue);
  }
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
  thumb.innerHTML = cleanSvg(icon.svg);
  thumb.style.color = '';
  $('iconDetailBackdrop').classList.remove('hidden');
  iconDetailTab = 'svg';
  document.querySelectorAll('.icon-detail-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.dataset.detailTab === 'svg');
  });
  updateDetailCode();
}

// ── Icon mode toggle ──
document.querySelectorAll('[data-icon-mode]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    iconMode = btn.dataset.iconMode;
    document.querySelectorAll('[data-icon-mode]').forEach(function(b) {
      b.classList.toggle('active', b.dataset.iconMode === iconMode);
    });
    $('iconModeAll').style.display = iconMode === 'all' ? 'block' : 'none';
    $('iconModeSelection').style.display = iconMode === 'selection' ? 'block' : 'none';
  });
});

function updateIconSelInfo() {
  var info = $('iconSelInfo');
  if (lastSelection.count > 0) {
    info.textContent = lastSelection.count + t('icon.selected') + ' — ' + lastSelection.names.slice(0, 3).join(', ') + (lastSelection.count > 3 ? ' ' + t('extract.more') + (lastSelection.count - 3) : '');
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
exportIconsAllBtn.addEventListener('click', function() {
  exportIconsAllBtn.disabled = true;
  exportIconsAllBtn.textContent = t('icon.extracting');
  parent.postMessage({ pluginMessage: { type: 'export-icons-all' } }, '*');
});

// 선택 추출
exportIconsBtn.addEventListener('click', function() {
  if (lastSelection.count === 0) { showToast(t('icon.selectFirst')); return; }
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
  var fmt = date.getFullYear() + '-'
    + String(date.getMonth() + 1).padStart(2, '0') + '-'
    + String(date.getDate()).padStart(2, '0') + ' '
    + String(date.getHours()).padStart(2, '0') + ':'
    + String(date.getMinutes()).padStart(2, '0');
  label.textContent = (lang === 'ko' ? '캐시 · ' : 'cached · ') + fmt;
  badge.classList.remove('hidden');
}
function hideCacheBadge() {
  var badge = $('iconCacheBadge');
  if (badge) badge.classList.add('hidden');
}
$('iconCacheClearBtn').addEventListener('click', function() {
  parent.postMessage({ pluginMessage: { type: 'clear-icon-cache' } }, '*');
});

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
$('iconList').addEventListener('click', function(e) {
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
$('iconSearchInput').addEventListener('input', function() {
  var q = this.value;
  $('iconSearchClear').classList.toggle('hidden', q === '');
  clearTimeout(iconSearchDebounceTimer);
  iconSearchDebounceTimer = setTimeout(function() { filterIcons(q); }, 150);
});
$('iconSearchClear').addEventListener('click', function() {
  $('iconSearchInput').value = '';
  $('iconSearchClear').classList.add('hidden');
  filterIcons('');
  $('iconSearchInput').focus();
});

// ── 상세 패널 탭 ──
document.addEventListener('click', function(e) {
  var tab = e.target.closest('.icon-detail-tab');
  if (!tab) return;
  iconDetailTab = tab.dataset.detailTab;
  document.querySelectorAll('.icon-detail-tab').forEach(function(t2) {
    t2.classList.toggle('active', t2.dataset.detailTab === iconDetailTab);
  });
  updateDetailCode();
});

// ── 색상 모드 변경 ──
$('iconColorModeSelect').addEventListener('change', function() {
  iconColorMode = this.value;
  $('iconColorVarInput').classList.toggle('hidden', iconColorMode !== 'cssVar');
  $('iconColorPicker').classList.toggle('hidden', iconColorMode !== 'custom');
  if (iconColorMode === 'currentColor') iconColorValue = 'currentColor';
  if (iconColorMode === 'cssVar') iconColorValue = $('iconColorVarInput').value || '--icon-color';
  if (iconColorMode === 'custom') iconColorValue = $('iconColorPicker').value;
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

// ── 상세 패널 닫기 / 복사 ──
function closeIconModal() {
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
  renderIconGrid();
}
$('iconDetailClose').addEventListener('click', closeIconModal);
$('iconDetailBackdrop').addEventListener('click', function(e) {
  if (e.target === this) closeIconModal();
});
$('iconDetailCopyBtn').addEventListener('click', function() {
  copyToClipboard($('iconDetailCode').textContent);
  showToast(t('icon.detailCopied'));
});

// 전체 SVG 다운로드
$('iconDownloadAllBtn').addEventListener('click', function() {
  if (iconData.length === 0) { showToast(t('icon.noIcons')); return; }
  var json = JSON.stringify(iconData.map(function(icon) {
    return { name: icon.name, kebab: icon.kebab, pascal: icon.pascal, svg: cleanSvg(icon.svg) };
  }), null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'icons_' + iconData.length + '.json';
  a.click(); URL.revokeObjectURL(url);
  showToast(t('icon.iconDownload'));
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
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  var r = parseInt(hex.substring(0,2), 16);
  var g = parseInt(hex.substring(2,4), 16);
  var b = parseInt(hex.substring(4,6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function relativeLuminance(rgb) {
  var srgb = rgb.map(function(c) {
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
$('a11ySwapBtn').addEventListener('click', function() {
  var tmpHex = a11yBgHex.value;
  a11yBgHex.value = a11yFgHex.value;
  a11yFgHex.value = tmpHex;
  // Also swap select values
  var tmpSel = a11yBgSelect.value;
  a11yBgSelect.value = a11yFgSelect.value;
  a11yFgSelect.value = tmpSel;
  updateA11y();
});
a11yBgSelect.addEventListener('change', function() {
  if (this.value) { a11yBgHex.value = this.value; updateA11y(); }
});
a11yFgSelect.addEventListener('change', function() {
  if (this.value) { a11yFgHex.value = this.value; updateA11y(); }
});

// Populate a11y dropdowns from extracted data
function populateA11yColors() {
  if (!extractedData) return;
  var hint = $('a11yHint');
  if (hint) hint.style.display = 'none';
  var colors = [];
  // From color styles
  if (extractedData.styles && extractedData.styles.colors) {
    extractedData.styles.colors.forEach(function(s) {
      if (s.paints && s.paints.length > 0 && s.paints[0].type === 'SOLID') {
        var c = s.paints[0].color;
        var r = Math.round((c.r || 0) * 255);
        var g = Math.round((c.g || 0) * 255);
        var b = Math.round((c.b || 0) * 255);
        var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('').toUpperCase();
        colors.push({ name: s.name, hex: hex });
      }
    });
  }
  // From COLOR variables
  if (extractedData.variables && extractedData.variables.variables) {
    extractedData.variables.variables.forEach(function(v) {
      if (v.resolvedType !== 'COLOR') return;
      var modes = Object.keys(v.valuesByMode);
      if (modes.length === 0) return;
      var val = v.valuesByMode[modes[0]];
      if (val && typeof val === 'object' && val.r !== undefined) {
        var r = Math.round(val.r * 255);
        var g = Math.round(val.g * 255);
        var b = Math.round(val.b * 255);
        var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('').toUpperCase();
        colors.push({ name: v.name, hex: hex });
      }
    });
  }
  [a11yBgSelect, a11yFgSelect].forEach(function(sel) {
    // Keep the first option, update its text
    while (sel.options.length > 1) sel.remove(1);
    sel.options[0].textContent = t('contrast.directInput');
    colors.forEach(function(c) {
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
document.querySelectorAll('.a11y-subtab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    a11ySubTab = btn.dataset.a11ySub;
    document.querySelectorAll('.a11y-subtab').forEach(function(b) {
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
    extractedData.styles.colors.forEach(function(s) {
      if (s.paints && s.paints.length > 0 && s.paints[0].type === 'SOLID') {
        var c = s.paints[0].color;
        var r = Math.round((c.r || 0) * 255);
        var g = Math.round((c.g || 0) * 255);
        var b = Math.round((c.b || 0) * 255);
        var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('').toUpperCase();
        if (!seen[hex]) { seen[hex] = true; extractedColors.push({ name: s.name, hex: hex }); }
      }
    });
  }
  // From COLOR variables
  if (extractedData.variables && extractedData.variables.variables) {
    extractedData.variables.variables.forEach(function(v) {
      if (v.resolvedType !== 'COLOR') return;
      var modes = Object.keys(v.valuesByMode);
      if (modes.length === 0) return;
      var val = v.valuesByMode[modes[0]];
      if (val && typeof val === 'object' && val.r !== undefined) {
        var r = Math.round(val.r * 255);
        var g = Math.round(val.g * 255);
        var b = Math.round(val.b * 255);
        var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('').toUpperCase();
        if (!seen[hex]) { seen[hex] = true; extractedColors.push({ name: v.name, hex: hex }); }
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
    return '<div class="matrix-header-label">'
      + '<span class="matrix-swatch" style="background:' + c.hex + '"></span>'
      + '<span class="matrix-header-name" title="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</span>'
      + '<span class="matrix-header-hex">' + c.hex + '</span>'
      + '</div>';
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
  function getLevel(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA Large';
    return 'FAIL';
  }
  function levelChecks(ratio) {
    var aaa = ratio >= 7 ? '✓' : '✗';
    var aa = ratio >= 4.5 ? '✓' : '✗';
    var aaLarge = ratio >= 3 ? '✓' : '✗';
    return 'AAA ' + aaa + '  AA ' + aa + '  AA Large ' + aaLarge;
  }

  // Summary counters
  var countAAA = 0, countAA = 0, countAALarge = 0, countFail = 0;

  var html = '<thead><tr><th></th>';
  colors.forEach(function(c) {
    html += '<th>' + headerCell(c) + '</th>';
  });
  html += '</tr></thead><tbody>';

  colors.forEach(function(row) {
    html += '<tr><td>' + headerCell(row) + '</td>';
    var rowRgb = hexToRgb(row.hex);
    colors.forEach(function(col) {
      if (row.hex === col.hex) {
        html += '<td class="matrix-same"></td>';
        return;
      }
      var colRgb = hexToRgb(col.hex);
      if (!rowRgb || !colRgb) { html += '<td>-</td>'; return; }
      var ratio = contrastRatio(rowRgb, colRgb);
      var cls = getCellClass(ratio);
      var badge = getBadge(ratio);
      // Count
      if (ratio >= 7) countAAA++;
      else if (ratio >= 4.5) countAA++;
      else if (ratio >= 3) countAALarge++;
      else countFail++;

      var tooltipContent = escapeHtml(col.name) + t('contrast.on') + escapeHtml(row.name)
        + '<br>' + t('contrast.ratio') + ratio.toFixed(2) + ':1'
        + '<br>' + levelChecks(ratio)
        + '<br><br><span style="font-size:13px;font-weight:500;">' + t('contrast.sampleText') + '</span>';

      html += '<td class="' + cls + ' matrix-cell">'
        + ratio.toFixed(1) + ':1 ' + badge
        + '<div class="matrix-tooltip">'
        + '<div style="padding:6px 8px;border-radius:4px;background:' + row.hex + ';color:' + col.hex + ';margin-bottom:4px;text-align:center;">'
        + '<span style="font-size:13px;font-weight:500;">' + t('contrast.sampleText') + '</span></div>'
        + tooltipContent + '</div>'
        + '</td>';
    });
    html += '</tr>';
  });

  html += '</tbody>';
  $('matrixTable').innerHTML = html;

  // Summary stats
  var total = countAAA + countAA + countAALarge + countFail;
  var pct = function(n) { return total > 0 ? Math.round(n / total * 100) : 0; };
  $('matrixSummary').innerHTML = '<div class="matrix-summary">'
    + '<span style="font-weight:600;">' + t('contrast.summaryTotal') + ' ' + total + ' ' + t('contrast.summaryCombos') + '</span>'
    + '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#15803D;"></span> AAA ' + countAAA + ' (' + pct(countAAA) + '%)</span>'
    + '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#1D4ED8;"></span> AA ' + countAA + ' (' + pct(countAA) + '%)</span>'
    + '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#7C3AED;"></span> AA+ ' + countAALarge + ' (' + pct(countAALarge) + '%)</span>'
    + '<span class="matrix-summary-item"><span class="matrix-summary-dot" style="background:#DC2626;"></span> FAIL ' + countFail + ' (' + pct(countFail) + '%)</span>'
    + '</div>';
}

// ══════════════════════════════════════════════
// ── Theme Tab ──
// ══════════════════════════════════════════════
var themeData = null;
var showChangedOnly = false;
var extractThemesBtn = $('extractThemesBtn');
var themeFilterBtn = $('themeFilterBtn');

extractThemesBtn.addEventListener('click', function() {
  extractThemesBtn.disabled = true;
  extractThemesBtn.textContent = t('theme.extracting');
  parent.postMessage({ pluginMessage: { type: 'extract-themes' } }, '*');
});

themeFilterBtn.addEventListener('click', function() {
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
    $('themeContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">' + t('theme.noModes') + '</div>';
    return;
  }
  // Use first two modes for comparison
  var mode1 = modes[0];
  var mode2 = modes[1];
  var vars1 = themeData[mode1];
  var vars2 = themeData[mode2];

  // Build map for mode2
  var map2 = {};
  vars2.forEach(function(v) { map2[v.name] = v.value; });

  var rows = vars1.map(function(v) {
    var val2 = map2[v.name] || '—';
    var changed = v.value !== val2;
    return { name: v.name, val1: v.value, val2: val2, changed: changed };
  });

  if (showChangedOnly) {
    rows = rows.filter(function(r) { return r.changed; });
  }

  if (rows.length === 0) {
    $('themeContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">' + (showChangedOnly ? t('theme.noChanged') : t('theme.noVars')) + '</div>';
    return;
  }

  var html = '<div class="theme-grid">';
  html += '<div class="theme-header">' + escapeHtml(mode1) + ' (' + rows.length + ')</div>';
  html += '<div class="theme-header">' + escapeHtml(mode2) + '</div>';

  rows.forEach(function(r) {
    var hl = r.changed ? ' highlight' : '';
    html += '<div class="theme-row-light' + hl + '">'
      + '<div class="theme-swatch" style="background:' + r.val1 + '"></div>'
      + '<span class="theme-var-name">' + escapeHtml(r.name) + '</span>'
      + '<span class="theme-var-value">' + r.val1 + '</span>'
      + '</div>';
    html += '<div class="theme-row-dark' + hl + '">'
      + '<div class="theme-swatch" style="background:' + r.val2 + '"></div>'
      + '<span class="theme-var-name">' + escapeHtml(r.name) + '</span>'
      + '<span class="theme-var-value">' + r.val2 + '</span>'
      + '</div>';
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
  vars2.forEach(function(v) { map2[v.name] = v.value; });

  function toCssVar(name) {
    return '--' + name.replace(/\//g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  var css = '/* ' + mode1 + ' (default) */\n:root {\n';
  vars1.forEach(function(v) {
    css += '  ' + toCssVar(v.name) + ': ' + v.value + ';\n';
  });
  css += '}\n\n/* ' + mode2 + ' */\n[data-theme="' + mode2.toLowerCase() + '"] {\n';
  vars1.forEach(function(v) {
    var val2 = map2[v.name] || v.value;
    css += '  ' + toCssVar(v.name) + ': ' + val2 + ';\n';
  });
  css += '}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n';
  vars1.forEach(function(v) {
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
  themeCopyCssBtn.addEventListener('click', function() {
    var css = generateThemeCSS();
    if (!css) { showToast(t('theme.extractFirst')); return; }
    copyToClipboard(css);
    showToast(t('theme.cssCopied'));
  });
}

// ══════════════════════════════════════════════
// ── Component Tab ──
// ══════════════════════════════════════════════

var TYPE_KEYWORDS = {
  button:    ['button', 'btn', 'cta', 'action'],
  dialog:    ['dialog', 'modal', 'overlay', 'popup', 'sheet'],
  select:    ['select', 'dropdown', 'combobox', 'picker'],
  tabs:      ['tab', 'tabs', 'tabbar'],
  tooltip:   ['tooltip', 'hint'],
  checkbox:  ['checkbox', 'check'],
  switch:    ['switch', 'toggle'],
  accordion: ['accordion', 'collapse'],
  popover:   ['popover', 'flyout'],
};
var RADIX_MAP = {
  button: null, dialog: '@radix-ui/react-dialog', select: '@radix-ui/react-select',
  tabs: '@radix-ui/react-tabs', tooltip: '@radix-ui/react-tooltip',
  checkbox: '@radix-ui/react-checkbox', switch: '@radix-ui/react-switch',
  accordion: '@radix-ui/react-accordion', popover: '@radix-ui/react-popover', layout: null,
};
var SEMANTIC_TAGS = {
  header: 'header', gnb: 'header', nav: 'nav', footer: 'footer', sidebar: 'aside',
  card: 'article', item: 'article', section: 'section', panel: 'section',
};

function detectComponentType(nodeName) {
  var lower = nodeName.toLowerCase();
  var types = Object.keys(TYPE_KEYWORDS);
  for (var i = 0; i < types.length; i++) {
    var kws = TYPE_KEYWORDS[types[i]];
    for (var j = 0; j < kws.length; j++) { if (lower.indexOf(kws[j]) !== -1) return types[i]; }
  }
  return 'layout';
}
function getSemanticTag(nodeName) {
  var lower = nodeName.toLowerCase();
  var keys = Object.keys(SEMANTIC_TAGS);
  for (var i = 0; i < keys.length; i++) { if (lower.indexOf(keys[i]) !== -1) return SEMANTIC_TAGS[keys[i]]; }
  return 'div';
}
function compToPascalCase(str) {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, function(_, c) { return c.toUpperCase(); }).replace(/^(.)/, function(c) { return c.toUpperCase(); });
}
function stylesToCSSProps(styles) {
  if (!styles) return '';
  return Object.keys(styles).map(function(k) { return '  ' + k + ': ' + styles[k] + ';'; }).join('\n');
}
function buildCSSModulesCSS(styles, type) {
  var base = stylesToCSSProps(styles);
  var focus = '\n\n.root:focus-visible {\n  outline: 2px solid var(--primary);\n  outline-offset: 2px;\n}';
  if (type === 'dialog') return '.overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.5);\n  animation: overlayShow 150ms ease;\n}\n\n.content {\n' + base + '\n}\n\n.title {\n  font-size: 18px;\n  font-weight: 600;\n  margin-bottom: 16px;\n}\n\n.closeBtn {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n\n.closeBtn:focus-visible {\n  outline: 2px solid var(--primary);\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n\n@keyframes overlayShow {\n  from { opacity: 0; }\n  to   { opacity: 1; }\n}';
  if (type === 'tabs') return '.root {\n  display: flex;\n  flex-direction: column;\n}\n\n.list {\n  display: flex;\n  border-bottom: 1px solid var(--border);\n  margin-bottom: 16px;\n}\n\n.trigger {\n  padding: 8px 16px;\n  background: none;\n  border: none;\n  border-bottom: 2px solid transparent;\n  cursor: pointer;\n  font-size: 14px;\n  color: var(--text-secondary);\n}\n\n.trigger[data-state=active] {\n  color: var(--primary);\n  border-bottom-color: var(--primary);\n}\n\n.trigger:focus-visible {\n  outline: 2px solid var(--primary);\n  outline-offset: 2px;\n}\n\n.content {\n  padding: 8px 0;\n}';
  return '.root {\n' + base + '\n}\n\n.root:hover {\n  opacity: 0.9;\n}' + focus;
}
function buildCSSModulesTSX(name, type, useTs) {
  var pt, p;
  if (type === 'button') {
    pt = useTs ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n  onClick?: () => void;\n  disabled?: boolean;\n}\n\n' : '';
    p = useTs ? '{ children, onClick, disabled }: ' + name + 'Props' : '{ children, onClick, disabled }';
    return "import styles from './" + name + ".module.css';\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <button className={styles.root} onClick={onClick} disabled={disabled} type=\"button\">\n    {children}\n  </button>\n);";
  }
  if (type === 'dialog') {
    pt = useTs ? 'interface ' + name + 'Props {\n  open: boolean;\n  onClose: (open: boolean) => void;\n  title: string;\n  children: React.ReactNode;\n}\n\n' : '';
    p = useTs ? '{ open, onClose, title, children }: ' + name + 'Props' : '{ open, onClose, title, children }';
    return "import * as Dialog from '@radix-ui/react-dialog';\nimport styles from './" + name + ".module.css';\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <Dialog.Root open={open} onOpenChange={onClose}>\n    <Dialog.Portal>\n      <Dialog.Overlay className={styles.overlay} />\n      <Dialog.Content className={styles.content} aria-describedby={undefined}>\n        <Dialog.Title className={styles.title}>{title}</Dialog.Title>\n        {children}\n        <Dialog.Close asChild>\n          <button className={styles.closeBtn} aria-label=\"닫기\">×</button>\n        </Dialog.Close>\n      </Dialog.Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);";
  }
  if (type === 'tabs') {
    pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
    p = useTs ? "{ defaultValue = 'tab1' }: " + name + 'Props' : "{ defaultValue = 'tab1' }";
    return "import * as Tabs from '@radix-ui/react-tabs';\nimport styles from './" + name + ".module.css';\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <Tabs.Root className={styles.root} defaultValue={defaultValue}>\n    <Tabs.List className={styles.list} aria-label=\"탭 목록\">\n      <Tabs.Trigger className={styles.trigger} value=\"tab1\">탭 1</Tabs.Trigger>\n      <Tabs.Trigger className={styles.trigger} value=\"tab2\">탭 2</Tabs.Trigger>\n    </Tabs.List>\n    <Tabs.Content className={styles.content} value=\"tab1\">내용 1</Tabs.Content>\n    <Tabs.Content className={styles.content} value=\"tab2\">내용 2</Tabs.Content>\n  </Tabs.Root>\n);";
  }
  var tag = getSemanticTag(name);
  pt = useTs ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n}\n\n' : '';
  p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return "import styles from './" + name + ".module.css';\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <" + tag + " className={styles.root}>\n    {children}\n  </" + tag + ">\n);";
}
function buildStyledTSX(name, type, useTs) {
  var pt, p;
  if (type === 'dialog') {
    pt = useTs ? 'interface ' + name + 'Props {\n  open: boolean;\n  onClose: (open: boolean) => void;\n  title: string;\n  children: React.ReactNode;\n}\n\n' : '';
    p = useTs ? '{ open, onClose, title, children }: ' + name + 'Props' : '{ open, onClose, title, children }';
    return "import * as Dialog from '@radix-ui/react-dialog';\nimport styled, { keyframes } from 'styled-components';\n\nconst overlayShow = keyframes`\n  from { opacity: 0; }\n  to   { opacity: 1; }\n`;\nconst Overlay = styled(Dialog.Overlay)`\n  position: fixed; inset: 0; background: rgba(0,0,0,0.5);\n  animation: ${overlayShow} 150ms ease;\n`;\nconst Content = styled(Dialog.Content)`\n  position: fixed; top: 50%; left: 50%;\n  transform: translate(-50%,-50%);\n  background: var(--color-surface); border-radius: var(--radius-md); padding: 24px;\n`;\nconst Title = styled(Dialog.Title)`\n  font-size: 18px; font-weight: 600; margin-bottom: 16px;\n`;\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <Dialog.Root open={open} onOpenChange={onClose}>\n    <Dialog.Portal>\n      <Overlay />\n      <Content aria-describedby={undefined}>\n        <Title>{title}</Title>\n        {children}\n      </Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);";
  }
  if (type === 'button') {
    pt = useTs ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n  onClick?: () => void;\n  disabled?: boolean;\n}\n\n' : '';
    p = useTs ? '{ children, onClick, disabled }: ' + name + 'Props' : '{ children, onClick, disabled }';
    return "import styled from 'styled-components';\n\nconst StyledButton = styled.button`\n  display: inline-flex; align-items: center; justify-content: center;\n  padding: 8px 16px; background: var(--color-brand-primary);\n  color: var(--color-white); border: none; border-radius: var(--radius-sm);\n  font-size: 14px; font-weight: 500; cursor: pointer;\n  &:hover { opacity: 0.9; }\n  &:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }\n  &:disabled { opacity: 0.5; cursor: not-allowed; }\n`;\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <StyledButton onClick={onClick} disabled={disabled} type=\"button\">\n    {children}\n  </StyledButton>\n);";
  }
  var tag = getSemanticTag(name);
  pt = useTs ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n}\n\n' : '';
  p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return "import styled from 'styled-components';\n\nconst Wrapper = styled." + tag + "`\n  /* 스타일을 여기에 추가하세요 */\n`;\n\n" + pt + "export const " + name + " = (" + p + ") => (\n  <Wrapper>{children}</Wrapper>\n);";
}

var compState = {
  meta: null, componentType: 'layout', styleMode: 'css-modules', useTs: true,
  generatedTsx: '', generatedCss: '', registry: {}, currentEntry: null,
  activeCodeTab: 'tsx', activeDetailTab: 'tsx', editMode: false,
};

function showGeneratedResult(tsx, css, styleMode) {
  compState.generatedTsx = tsx; compState.generatedCss = css; compState.activeCodeTab = 'tsx';
  var cssTabBtn = $('compCssTabBtn');
  if (cssTabBtn) cssTabBtn.style.display = styleMode === 'css-modules' ? '' : 'none';
  document.querySelectorAll('[data-comp-code-tab]').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.compCodeTab === 'tsx'); });
  $('compCode').value = tsx;
  $('compResult').classList.remove('hidden');
  if (compState.meta) {
    var parts = compState.meta.nodeName.split('/');
    $('compNameInput').value = compToPascalCase(parts[parts.length - 1]);
  }
}

function switchCompSubTab(sub) {
  document.querySelectorAll('.comp-subtab').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.compSub === sub); });
  $('compGenerateView').style.display = sub === 'generate' ? '' : 'none';
  $('compRegistryView').style.display = sub === 'registry' ? '' : 'none';
  if (sub === 'registry') renderRegistryList();
}
document.querySelectorAll('.comp-subtab').forEach(function(btn) { btn.addEventListener('click', function() { switchCompSubTab(btn.dataset.compSub); }); });

function updateCompSelInfo() {
  var info = $('compSelInfo');
  if (!info) return;
  if (lastSelection.count > 0 && lastSelection.meta) {
    info.textContent = (lang === 'ko' ? '선택: ' : 'Selected: ') + lastSelection.meta.nodeName;
    info.style.color = 'var(--primary)'; info.style.background = 'var(--primary-light)'; info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = t('component.noSel'); info.style.color = 'var(--text-muted)'; info.style.background = 'var(--bg)'; info.style.border = 'none';
  }
}

function onCompSelectionChanged() {
  var meta = (lastSelection && lastSelection.meta) || null;
  compState.meta = meta;
  updateCompSelInfo();
  if (!meta) return;
  var detected = detectComponentType(meta.nodeName);
  compState.componentType = detected;
  var ts = $('compTypeSelect'); if (ts) ts.value = detected;
  updateTypeHint(detected);
  var key = meta.masterId || meta.nodeId;
  var entry = compState.registry[key];
  if (entry) { compState.currentEntry = entry; switchCompSubTab('registry'); showRegistryDetail(entry); }
}

function updateTypeHint(type) {
  var hint = $('compTypeHint'); if (!hint) return;
  var pkg = RADIX_MAP[type];
  hint.textContent = pkg ? 'Radix UI: ' + pkg : (type === 'layout' ? (lang === 'ko' ? '시맨틱 HTML 태그' : 'Semantic HTML') : 'Native element');
}

var _typeSelect = $('compTypeSelect');
if (_typeSelect) _typeSelect.addEventListener('change', function() { compState.componentType = _typeSelect.value; updateTypeHint(_typeSelect.value); });

document.querySelectorAll('.comp-style-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    compState.styleMode = btn.dataset.compStyle;
    document.querySelectorAll('.comp-style-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.compStyle === compState.styleMode); });
  });
});

var _compTsCheck = $('compTsCheck');
if (_compTsCheck) { _compTsCheck.checked = true; _compTsCheck.addEventListener('change', function() { compState.useTs = _compTsCheck.checked; }); }

var generateCompBtn = $('generateCompBtn');
if (generateCompBtn) {
  generateCompBtn.addEventListener('click', function() {
    if (lastSelection.count === 0) { showToast(t('component.selectFirst')); return; }
    generateCompBtn.disabled = true; generateCompBtn.textContent = t('component.generating');
    parent.postMessage({ pluginMessage: { type: 'generate-component' } }, '*');
  });
}

document.querySelectorAll('[data-comp-code-tab]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    compState.activeCodeTab = btn.dataset.compCodeTab;
    document.querySelectorAll('[data-comp-code-tab]').forEach(function(b) { b.classList.toggle('active', b.dataset.compCodeTab === compState.activeCodeTab); });
    $('compCode').value = compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss;
  });
});

var _compCopyBtn = $('compCopyBtn');
if (_compCopyBtn) _compCopyBtn.addEventListener('click', function() {
  copyToClipboard(compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss);
  showToast(t('component.copied'));
});

var _compSaveBtn = $('compSaveBtn');
if (_compSaveBtn) {
  _compSaveBtn.addEventListener('click', function() {
    var ni = $('compNameInput'); var nameVal = (ni && ni.value || '').trim();
    if (!nameVal) { showToast(lang === 'ko' ? '컴포넌트명을 입력하세요' : 'Enter component name'); return; }
    if (!compState.meta) { showToast(t('component.selectFirst')); return; }
    var key = compState.meta.masterId || compState.meta.nodeId;
    var entry = { name: nameVal, figmaNodeName: compState.meta.nodeName, figmaMasterNodeId: key,
      componentType: compState.componentType, radixPackage: RADIX_MAP[compState.componentType] || null,
      styleMode: compState.styleMode, useTs: compState.useTs,
      code: { tsx: compState.generatedTsx, css: compState.generatedCss },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    parent.postMessage({ pluginMessage: { type: 'registry-save', entry: entry } }, '*');
  });
}

function renderRegistryList() {
  var items = $('compRegistryItems'); var empty = $('compRegistryEmpty'); var count = $('compRegistryCount');
  if (!items) return;
  var query = ($('compSearchInput') ? $('compSearchInput').value : '').toLowerCase();
  var all = Object.keys(compState.registry).map(function(k) { return compState.registry[k]; });
  var entries = all.filter(function(e) { return !query || e.name.toLowerCase().indexOf(query) !== -1; });
  items.innerHTML = '';
  if (entries.length === 0) { if (empty) empty.style.display = ''; }
  else {
    if (empty) empty.style.display = 'none';
    entries.forEach(function(entry) {
      var updatedAt = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-';
      var item = document.createElement('div'); item.className = 'comp-registry-item';
      item.innerHTML = '<div class="comp-registry-item-info"><div class="comp-registry-item-name">' + entry.name + '</div><div class="comp-registry-item-meta">' + (entry.componentType || 'layout') + ' · ' + (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') + ' · ' + updatedAt + '</div></div><div class="comp-registry-item-actions"><button class="comp-registry-del-btn">' + (lang === 'ko' ? '삭제' : 'Del') + '</button></div>';
      item.querySelector('.comp-registry-item-info').addEventListener('click', function() { showRegistryDetail(entry); });
      item.querySelector('.comp-registry-del-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm(lang === 'ko' ? entry.name + '을 삭제할까요?' : 'Delete ' + entry.name + '?'))
          parent.postMessage({ pluginMessage: { type: 'registry-delete', masterId: entry.figmaMasterNodeId } }, '*');
      });
      items.appendChild(item);
    });
  }
  if (count) count.textContent = lang === 'ko' ? '총 ' + entries.length + '개' : entries.length + ' items';
}

var _compSearchInput = $('compSearchInput');
if (_compSearchInput) _compSearchInput.addEventListener('input', function() { renderRegistryList(); });

function showRegistryDetail(entry) {
  compState.currentEntry = entry; compState.activeDetailTab = 'tsx'; compState.editMode = false;
  $('compRegistryList').style.display = 'none'; $('compRegistryDetail').classList.remove('hidden');
  $('compDetailName').textContent = entry.name;
  $('compDetailMeta').textContent = (entry.componentType || 'layout') + ' · ' + (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') + ' · ' + (entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-');
  var cssBtn = $('compDetailCssTabBtn'); if (cssBtn) cssBtn.style.display = entry.styleMode === 'css-modules' ? '' : 'none';
  document.querySelectorAll('[data-comp-detail-tab]').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.compDetailTab === 'tsx'); });
  $('compDetailCode').value = entry.code.tsx; $('compDetailCode').readOnly = true;
  $('compDetailSaveEditBtn').style.display = 'none'; $('compDetailCancelEditBtn').style.display = 'none'; $('compDetailEditBtn').style.display = '';
}

document.querySelectorAll('[data-comp-detail-tab]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    compState.activeDetailTab = btn.dataset.compDetailTab;
    document.querySelectorAll('[data-comp-detail-tab]').forEach(function(b) { b.classList.toggle('active', b.dataset.compDetailTab === compState.activeDetailTab); });
    if (compState.currentEntry) $('compDetailCode').value = compState.activeDetailTab === 'tsx' ? compState.currentEntry.code.tsx : compState.currentEntry.code.css;
  });
});

var _detailCopyBtn = $('compDetailCopyBtn');
if (_detailCopyBtn) _detailCopyBtn.addEventListener('click', function() {
  if (!compState.currentEntry) return;
  copyToClipboard(compState.activeDetailTab === 'tsx' ? compState.currentEntry.code.tsx : compState.currentEntry.code.css);
  showToast(t('component.copied'));
});

var _detailEditBtn = $('compDetailEditBtn');
if (_detailEditBtn) _detailEditBtn.addEventListener('click', function() {
  $('compDetailCode').readOnly = false; $('compDetailCode').focus();
  $('compDetailSaveEditBtn').style.display = ''; $('compDetailCancelEditBtn').style.display = ''; $('compDetailEditBtn').style.display = 'none';
});

var _detailSaveEditBtn = $('compDetailSaveEditBtn');
if (_detailSaveEditBtn) _detailSaveEditBtn.addEventListener('click', function() {
  if (!compState.currentEntry) return;
  var edited = $('compDetailCode').value;
  if (compState.activeDetailTab === 'tsx') compState.currentEntry.code.tsx = edited; else compState.currentEntry.code.css = edited;
  compState.currentEntry.updatedAt = new Date().toISOString();
  parent.postMessage({ pluginMessage: { type: 'registry-save', entry: compState.currentEntry } }, '*');
  $('compDetailCode').readOnly = true; $('compDetailSaveEditBtn').style.display = 'none'; $('compDetailCancelEditBtn').style.display = 'none'; $('compDetailEditBtn').style.display = '';
});

var _detailCancelBtn = $('compDetailCancelEditBtn');
if (_detailCancelBtn) _detailCancelBtn.addEventListener('click', function() {
  if (!compState.currentEntry) return;
  $('compDetailCode').value = compState.activeDetailTab === 'tsx' ? compState.currentEntry.code.tsx : compState.currentEntry.code.css;
  $('compDetailCode').readOnly = true; $('compDetailSaveEditBtn').style.display = 'none'; $('compDetailCancelEditBtn').style.display = 'none'; $('compDetailEditBtn').style.display = '';
});

var _detailUpdateBtn = $('compDetailUpdateBtn');
if (_detailUpdateBtn) _detailUpdateBtn.addEventListener('click', function() {
  if (!compState.currentEntry) return;
  if (!confirm(lang === 'ko' ? '현재 Figma 데이터로 코드를 다시 생성하고 덮어씁니다. 계속할까요?' : 'Regenerate from Figma and overwrite. Continue?')) return;
  switchCompSubTab('generate');
  if (generateCompBtn) generateCompBtn.click();
});

var _detailDeleteBtn = $('compDetailDeleteBtn');
if (_detailDeleteBtn) _detailDeleteBtn.addEventListener('click', function() {
  if (!compState.currentEntry) return;
  if (!confirm(lang === 'ko' ? compState.currentEntry.name + '을 삭제할까요?' : 'Delete ' + compState.currentEntry.name + '?')) return;
  parent.postMessage({ pluginMessage: { type: 'registry-delete', masterId: compState.currentEntry.figmaMasterNodeId } }, '*');
});

var _detailBackBtn = $('compDetailBackBtn');
if (_detailBackBtn) _detailBackBtn.addEventListener('click', function() {
  $('compRegistryList').style.display = ''; $('compRegistryDetail').classList.add('hidden');
  compState.currentEntry = null; renderRegistryList();
});

var _exportAllBtn = $('compExportAllBtn');
if (_exportAllBtn) _exportAllBtn.addEventListener('click', function() {
  var blob = new Blob([JSON.stringify(compState.registry, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = 'component-registry.json'; a.click(); URL.revokeObjectURL(url);
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
  ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ── Init ──
showView('filter');

// Fallback: if no init-data arrives within 1s (non-Figma env), clear loading text
setTimeout(function() {
  if (headerFile.textContent === '로딩 중...' || headerFile.textContent === 'Loading...') {
    headerFile.textContent = lang === 'ko' ? 'Figma 파일' : 'Figma File';
  }
  if (colList.querySelector('.no-collections') && (colList.textContent.trim() === '로딩 중...' || colList.textContent.trim() === 'Loading...')) {
    colList.innerHTML = '<div class="no-collections">' + t('extract.noCollectionsFallback') + '</div>';
  }
}, 1000);
