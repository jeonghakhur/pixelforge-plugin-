'use strict';

import { escapeHtml } from './converters/utils.js';
import { buildVarMap, convertVariables, convertFlatVars } from './converters/variables.js';
import { convertColorStyles } from './converters/color-styles.js';
import { convertTextStyles } from './converters/typography.js';
import { convertEffectStyles } from './converters/effects.js';
import { highlightCSS } from './converters/highlight.js';

// ── State ──
var extractedData = null;
var collections = [];
var activeTab = 'json';
var cssUnit = 'px';
var activeStatTypes = new Set();

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
  selCount.textContent = sel.count + '개 레이어 선택됨';

  var MAX_SHOW = 5;
  var items = sel.names.slice(0, MAX_SHOW).map(function(name, i) {
    var type = (sel.nodeTypes[i] || '').toLowerCase();
    return '<span class="sel-item"><span class="sel-type">' + type + '</span><span class="sel-name-text">' + name + '</span></span>';
  });
  if (sel.count > MAX_SHOW) {
    items.push('<span class="sel-more">외 ' + (sel.count - MAX_SHOW) + '개</span>');
  }
  selNames.innerHTML = items.join('');
}

var lastSelection = { count: 0, names: [], nodeTypes: [] };

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
    colList.innerHTML = '<div class="no-collections">컬렉션 없음</div>';
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
      showToast('최소 1개 타입을 선택해야 합니다');
      return;
    }
    card.classList.toggle('active');
    updateExtractBtn();
  });
});

// ── Inspect ──
inspectBtn.addEventListener('click', function() {
  parent.postMessage({ pluginMessage: { type: 'inspect' } }, '*');
  showToast('노드 데이터 읽는 중...');
});

// ── Extract ──
extractBtn.addEventListener('click', function() {
  var types = getSelectedTypes();
  if (types.length === 0) { showToast('최소 1개 타입을 선택해야 합니다'); return; }
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
  showToast(activeTab === 'json' ? 'JSON 복사됨' : 'CSS 복사됨');
});

// ── Download JSON ──
downloadJsonBtn.addEventListener('click', function() {
  if (!extractedData) return;
  var blob = new Blob([JSON.stringify(getFilteredData(), null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = buildFileBase() + '_tokens.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('JSON 다운로드 시작!');
});

// ── Download CSS ──
downloadCssBtn.addEventListener('click', function() {
  if (!extractedData) return;
  var blob = new Blob([generateCSS(getFilteredData(), cssUnit, activeStatTypes)], { type: 'text/css' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = buildFileBase() + '_tokens.css';
  a.click(); URL.revokeObjectURL(url);
  showToast('CSS 다운로드 시작!');
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
  $('metaMode').textContent  = meta.sourceMode === 'selection' ? '선택 레이어' : '전체 페이지';
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
    headerFile.textContent = msg.fileName || 'Figma 파일';
    renderCollections(msg.collections || []);
    if (msg.selection) { lastSelection = msg.selection; renderSelectionInfo(msg.selection); }
    updateExtractBtn();
  }
  if (msg.type === 'selection-changed') {
    lastSelection = msg.selection || { count: 0, names: [], nodeTypes: [] };
    renderSelectionInfo(lastSelection);
  }
  if (msg.type === 'inspect-result') {
    var json = JSON.stringify(msg.data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'inspect_nodes.json';
    a.click(); URL.revokeObjectURL(url);
    showToast('inspect_nodes.json 저장됨');
  }
  if (msg.type === 'extract-result') { renderResult(msg.data); }
  if (msg.type === 'extract-error') {
    showView('filter');
    showToast('오류: ' + (msg.message || '추출 실패'));
  }
};

// ── Init ──
showView('filter');
