'use strict';

import { escapeHtml } from '../converters/utils.js';
import { buildVarMap, convertVariables, convertFlatVars } from '../converters/variables.js';
import { convertColorStyles } from '../converters/color-styles.js';
import { convertTextStyles, convertFonts, convertLetterSpacingVars } from '../converters/typography.js';
import { convertEffectStyles } from '../converters/effects.js';
import { convertGridStyles } from '../converters/grids.js';
import { highlightCSS, highlightJSON } from '../converters/highlight.js';
import { state } from './state.js';
import { lang, t } from './i18n.js';
import { $, showToast, getScope, sendToPixelForge } from './utils.js';

// ── State ──
var collections = [];
var activeTab = 'json';
var cssUnit = 'px';
var activeStatTypes = new Set();

// ── DOM ──
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

// ── View System ──
export function showView(name) {
  ['filter', 'loading', 'result'].forEach(function (v) {
    var el = $('view-' + v);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  backBtn.classList.toggle('visible', name === 'result');
  updateExtractBtn();
  if (name === 'filter') updateFilterCacheBanner();
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

// ── Selection Info Display ──
export function renderSelectionInfo(sel) {
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

// ── Scope radio change ──
document.querySelectorAll('input[name="scope"]').forEach(function (r) {
  r.addEventListener('change', function () {
    renderSelectionInfo(state.lastSelection);
    updateExtractBtn();
    // syncIconMode는 tab-icons에서 export, ui.js에서 연결
    if (window._syncIconMode) window._syncIconMode();
  });
});

// ── Extract button state ──
export function updateExtractBtn() {
  var types = getSelectedTypes();
  var isFilterView = !$('view-filter').classList.contains('hidden');
  extractBtn.disabled = isFilterView && types.length === 0;
}

// ── Extra vars summary (동적 필터 카드 배지) ──
export function renderExtraVarsSummary(summary) {
  var badge = $('extraVarsBadge');
  if (!badge) return;
  if (!summary || summary.length === 0) { badge.style.display = 'none'; return; }
  var total = summary.reduce(function (acc, s) { return acc + s.types.length; }, 0);
  badge.textContent = summary.map(function (s) { return s.collectionName; }).join(', ');
  badge.style.display = '';
}

// ── Collections rendering ──
export function renderCollections(cols) {
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
  var scope = getScope();
  var options = {
    collectionIds: getSelectedCollectionIds(),
    useSelection: scope === 'selection',
    useCurrentPage: scope === 'page',
    tokenTypes: types,
    useVisualParser: useVisualParser,
    figmaFileKey: state.figmaFileKey || '',
  };
  parent.postMessage({ pluginMessage: { type: 'extract', options: options } }, '*');
});

// ── Back ──
backBtn.addEventListener('click', function () {
  showView('filter');
});

// ── Tab switching (JSON/CSS) ──
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

  var rootLines = '';
  var themeBlocks = [];

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
    var el = convertEffectStyles(data.styles ? data.styles.effects : [], varMap);
    if (el) rootLines += el;
  }

  // Letter-spacing CSS variables from text styles
  var allTextsForLS = [];
  if (all || types.has('texts')) {
    allTextsForLS = allTextsForLS.concat(data.styles ? data.styles.texts || [] : []);
  }
  if (all || types.has('textStyles')) {
    allTextsForLS = allTextsForLS.concat(data.styles ? data.styles.textStyles || [] : []);
  }
  if (all || types.has('headings')) {
    allTextsForLS = allTextsForLS.concat(data.styles ? data.styles.headings || [] : []);
  }
  if (allTextsForLS.length > 0) {
    var lsl = convertLetterSpacingVars(allTextsForLS, unit);
    if (lsl) rootLines += lsl;
  }

  var body = '';

  if (rootLines) {
    body += ':root {\n' + rootLines + '}\n\n';
  }

  themeBlocks.forEach(function (b) {
    body += b.comment + '\n[data-theme="' + b.modeName + '"] {\n' + b.lines + '}\n\n';
  });

  if (themeBlocks.length > 0) {
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

  // Grid Styles → :root block
  if (all || types.has('grids')) {
    var gl = convertGridStyles(data.styles ? data.styles.grids || [] : []);
    if (gl) body += ':root {\n' + gl + '}\n\n';
  }

  // Extra Variables → :root block per group
  if (all || types.has('extra-vars')) {
    (data.extraVars || []).forEach(function (group) {
      var fl = convertFlatVars(group.variables, varMap, unit, true);
      if (fl) body += ':root {\n' + fl + '}\n\n';
    });
  }

  return header + body;
}

// ── Filtered data for JSON ──
function getFilteredData() {
  if (!state.extractedData) return null;
  var d = state.extractedData;
  var types = activeStatTypes;
  if (!types || types.size === 0) return d;
  return {
    variables: types.has('variables') ? d.variables : { collections: [], variables: [] },
    spacing: types.has('spacing') ? d.spacing : [],
    radius: types.has('radius') ? d.radius : [],
    extraVars: (d.extraVars || []).filter(function (g) {
      return types.has('extra-vars:' + g.collectionId + ':' + g.resolvedType);
    }),
    styles: {
      colors: types.has('colors') ? (d.styles ? d.styles.colors : []) : [],
      texts: types.has('texts') ? (d.styles ? d.styles.texts : []) : [],
      textStyles: types.has('textStyles') ? (d.styles ? d.styles.textStyles || [] : []) : [],
      headings: types.has('headings') ? (d.styles ? d.styles.headings || [] : []) : [],
      fonts: types.has('fonts') ? (d.styles ? d.styles.fonts || [] : []) : [],
      effects: types.has('effects') ? (d.styles ? d.styles.effects : []) : [],
      grids: types.has('grids') ? (d.styles ? d.styles.grids || [] : []) : [],
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
  if (!state.extractedData) return;
  var filtered = getFilteredData();
  if (activeTab === 'json') {
    previewPre.innerHTML = highlightJSON(JSON.stringify(filtered, null, 2));
  } else {
    previewPre.innerHTML = highlightCSS(generateCSS(filtered, cssUnit, activeStatTypes));
  }
}

// ── Build file name base ──
function buildFileBase() {
  var meta = state.extractedData && state.extractedData.meta;
  var sanitize = function (s) {
    return s
      .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };
  if (meta && meta.sourceMode === 'selection' && state.lastSelection.count > 0) {
    var names = state.lastSelection.names;
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
  if (!state.extractedData) return;
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
  if (!state.extractedData) return;
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
  if (!state.extractedData) return;
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

// ── PixelForge Send ──
var pfSendExtractBtn = $('pfSendExtractBtn');
if (pfSendExtractBtn) {
  pfSendExtractBtn.addEventListener('click', async function () {
    if (!state.extractedData) { showToast(t('extract.extractFail')); return; }
    pfSendExtractBtn.disabled = true;
    pfSendExtractBtn.textContent = t('settings.sending');
    try {
      var filtered = getFilteredData();
      var result = await sendToPixelForge('/api/sync/tokens', {
        tokens: filtered,
        css: generateCSS(filtered, cssUnit, activeStatTypes),
      });
      if (result) showToast(t('settings.sendSuccess'));
    } finally {
      pfSendExtractBtn.disabled = false;
      pfSendExtractBtn.textContent = t('settings.sendBtn');
    }
  });
}

// ── Result rendering ──
export function renderResult(data) {
  state.extractedData = data;
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
  var gridsCount = styles ? (styles.grids || []).length : 0;
  var iconCount = icons ? icons.length : 0;

  $('statVarNum').textContent = varCount;
  $('statSpacingNum').textContent = spacingCount;
  $('statRadiusNum').textContent = radiusCount;
  $('statColorNum').textContent = colorCount;
  $('statTextStylesNum').textContent = textStylesCount;
  $('statHeadingsNum').textContent = headingsCount;
  $('statFontsNum').textContent = fontsCount;
  $('statEffectNum').textContent = effectCount;
  $('statGridsNum').textContent = gridsCount;
  [
    ['statVar', varCount],
    ['statSpacing', spacingCount],
    ['statRadius', radiusCount],
    ['statColor', colorCount],
    ['statTextStyles', textStylesCount],
    ['statHeadings', headingsCount],
    ['statFonts', fontsCount],
    ['statEffect', effectCount],
    ['statGrids', gridsCount],
  ].forEach(function (p) {
    $(p[0]).classList.toggle('inactive', p[1] === 0);
  });

  // 동적 extra-vars stat 카드 — 그룹마다 고유 타입 키 부여
  var extraStatCards = $('extraStatCards');
  if (extraStatCards) {
    extraStatCards.innerHTML = '';
    var typeLabel = { FLOAT: 'Float', BOOLEAN: 'Boolean', STRING: 'String' };
    (data.extraVars || []).forEach(function (group) {
      var count = group.variables.length;
      var displayName = group.collectionName.replace(/^\d+\.\s*/, '');
      // 고유 타입 키: "extra-vars:COLLECTION_ID:RESOLVED_TYPE"
      var groupTypeKey = 'extra-vars:' + group.collectionId + ':' + group.resolvedType;
      var card = document.createElement('div');
      card.className = 'stat-card' + (count === 0 ? ' inactive' : '');
      card.dataset.type = groupTypeKey;
      card.innerHTML =
        '<div class="stat-value">' + count + '</div>' +
        '<div class="stat-label">' + displayName + '<br><small style="font-size:9px;opacity:.7">' + (typeLabel[group.resolvedType] || group.resolvedType) + '</small></div>';
      card.addEventListener('click', function () {
        if (card.classList.contains('inactive')) return;
        if (activeStatTypes.has(groupTypeKey)) {
          if (activeStatTypes.size === 1) return;
          activeStatTypes.delete(groupTypeKey);
        } else {
          activeStatTypes.add(groupTypeKey);
        }
        updateStatCardStyles();
        updatePreview();
      });
      extraStatCards.appendChild(card);
    });
  }

  $('metaFile').textContent = meta.fileName || '—';
  $('metaMode').textContent =
    meta.sourceMode === 'selection' ? t('extract.scopeSelection') :
    meta.sourceMode === 'page' ? t('extract.scopePage') :
    t('extract.scopeAll');
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
    grids: gridsCount,
    icons: iconCount,
  };
  Object.keys(typeCounts).forEach(function (tk) {
    if (typeCounts[tk] > 0) activeStatTypes.add(tk);
  });
  // extra-vars 그룹별 고유 키 등록
  (data.extraVars || []).forEach(function (group) {
    if (group.variables.length > 0) {
      activeStatTypes.add('extra-vars:' + group.collectionId + ':' + group.resolvedType);
    }
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

// ── export headerFile ref for window.onmessage ──
export { headerFile };

// ── Token Cache Badge & Banners ──
export function updateFilterCacheBanner() {
  var banner = $('filterCacheBanner');
  var dateEl = $('filterCacheSavedAt');
  if (!banner) return;
  if (!state.extractedData) {
    banner.classList.add('hidden');
    return;
  }
  if (dateEl && state.tokenCacheInfo && state.tokenCacheInfo.savedAt) {
    var d = new Date(state.tokenCacheInfo.savedAt);
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
      (state.tokenCacheInfo.figmaFileName ? state.tokenCacheInfo.figmaFileName + ' · ' : '') + fmt;
  }
  banner.classList.remove('hidden');
}

export function showTokenCacheBadge(savedAt, fileName) {
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

export function hideTokenCacheBadge() {
  var badge = $('tokenCacheBadge');
  if (badge) badge.classList.add('hidden');
}

export function showCacheBannerInTab(tabId, savedAt) {
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

export function hideCacheBannerInTab(tabId) {
  var banner = $(tabId + 'CacheBanner');
  if (banner) banner.classList.add('hidden');
}

export function applyTokenCacheToTabs(data) {
  if (data.styles && data.styles.colors && data.styles.colors.length > 0) {
    showCacheBannerInTab('a11y', state.tokenCacheInfo && state.tokenCacheInfo.savedAt);
  }
  showCacheBannerInTab('themes', state.tokenCacheInfo && state.tokenCacheInfo.savedAt);
  showCacheBannerInTab('images', state.tokenCacheInfo && state.tokenCacheInfo.savedAt);
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
