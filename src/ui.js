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
  if (msg.type === 'extract-result') {
    renderResult(msg.data);
    populateA11yColors();
  }
  if (msg.type === 'extract-error') {
    showView('filter');
    showToast('오류: ' + (msg.message || '추출 실패'));
  }
  // Icon results
  if (msg.type === 'export-icons-result') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = '선택한 아이콘 추출';
    renderIconResults(msg.data || []);
  }
  if (msg.type === 'export-icons-error') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = '선택한 아이콘 추출';
    showToast('아이콘 추출 실패: ' + (msg.message || ''));
  }
  // Theme results
  if (msg.type === 'extract-themes-result') {
    extractThemesBtn.disabled = false;
    extractThemesBtn.textContent = '테마 추출';
    themeData = msg.data;
    themeFilterBtn.disabled = false;
    if (themeCopyCssBtn) themeCopyCssBtn.disabled = false;
    renderThemes();
  }
  if (msg.type === 'extract-themes-error') {
    extractThemesBtn.disabled = false;
    extractThemesBtn.textContent = '테마 추출';
    showToast('테마 추출 실패: ' + (msg.message || ''));
  }
  // Component results
  if (msg.type === 'generate-component-result') {
    generateCompBtn.disabled = false;
    generateCompBtn.textContent = '코드 생성';
    compData = msg.data;
    if (compData) {
      compActiveTab = 'html';
      document.querySelectorAll('.comp-tab').forEach(function(ct) {
        ct.classList.toggle('active', ct.dataset.compTab === 'html');
      });
      updateCompCode();
      $('compResult').classList.remove('hidden');
    } else {
      showToast('선택된 노드에서 코드를 생성할 수 없습니다');
    }
  }
  if (msg.type === 'generate-component-error') {
    generateCompBtn.disabled = false;
    generateCompBtn.textContent = '코드 생성';
    showToast('코드 생성 실패: ' + (msg.message || ''));
  }
  // Selection change also updates icon/component tab info
  if (msg.type === 'selection-changed') {
    if (currentMainTab === 'icons') updateIconSelInfo();
    if (currentMainTab === 'component') updateCompSelInfo();
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
var exportIconsBtn = $('exportIconsBtn');

function updateIconSelInfo() {
  var info = $('iconSelInfo');
  if (lastSelection.count > 0) {
    info.textContent = lastSelection.count + '개 선택됨 — ' + lastSelection.names.slice(0, 3).join(', ') + (lastSelection.count > 3 ? ' 외 ' + (lastSelection.count - 3) + '개' : '');
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = '0개 선택됨';
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

exportIconsBtn.addEventListener('click', function() {
  if (lastSelection.count === 0) { showToast('먼저 아이콘을 선택하세요'); return; }
  exportIconsBtn.disabled = true;
  exportIconsBtn.textContent = '추출 중...';
  parent.postMessage({ pluginMessage: { type: 'export-icons' } }, '*');
});

function renderIconResults(data) {
  iconData = data;
  $('iconCount').textContent = data.length;
  var list = $('iconList');
  if (data.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">추출된 아이콘 없음</div>';
    $('iconResults').classList.remove('hidden');
    return;
  }
  list.innerHTML = data.map(function(icon, idx) {
    return '<div class="icon-item">'
      + '<div class="icon-preview">' + cleanSvg(icon.svg) + '</div>'
      + '<div class="icon-info">'
      + '<div class="icon-name">' + escapeHtml(icon.name) + '</div>'
      + '<div class="icon-names">' + icon.kebab + ' / ' + icon.pascal + '</div>'
      + '</div>'
      + '<div class="icon-actions">'
      + '<button class="btn-ghost icon-copy-btn" data-idx="' + idx + '" data-action="svg" style="height:28px;padding:0 8px;font-size:10px;">SVG 복사</button>'
      + '<button class="btn-ghost icon-copy-btn" data-idx="' + idx + '" data-action="react" style="height:28px;padding:0 8px;font-size:10px;">React 복사</button>'
      + '</div>'
      + '</div>';
  }).join('');
  $('iconResults').classList.remove('hidden');
}

// SVG 정리: xml 선언, 불필요 속성 제거, viewBox 보존
function cleanSvg(svg) {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+xmlns:xlink="[^"]*"/g, '')
    .trim();
}

// ── Icon format toggle ──
var iconFormat = 'svg';
document.querySelectorAll('[data-icon-fmt]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    iconFormat = btn.dataset.iconFmt;
    document.querySelectorAll('[data-icon-fmt]').forEach(function(b) {
      b.classList.toggle('active', b.dataset.iconFmt === iconFormat);
    });
  });
});

// 이벤트 위임: 아이콘 복사 버튼
$('iconList').addEventListener('click', function(e) {
  var btn = e.target.closest('.icon-copy-btn');
  if (!btn) return;
  var idx = parseInt(btn.dataset.idx, 10);
  var action = btn.dataset.action;
  var icon = iconData[idx];
  if (!icon) return;

  if (action === 'svg') {
    copyToClipboard(cleanSvg(icon.svg));
    showToast('SVG 복사됨');
  } else if (action === 'react') {
    var svgClean = cleanSvg(icon.svg);
    var react = 'import type { SVGProps } from "react";\n\nexport const ' + icon.pascal + ' = (props: SVGProps<SVGSVGElement>) => (\n  ' + svgClean.replace(/<svg/, '<svg {...props}') + '\n);';
    copyToClipboard(react);
    showToast('React 컴포넌트 복사됨');
  }
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
    // Keep the first "직접 입력" option
    while (sel.options.length > 1) sel.remove(1);
    colors.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.hex;
      opt.textContent = c.name + ' (' + c.hex + ')';
      sel.appendChild(opt);
    });
  });
}

updateA11y();

// ══════════════════════════════════════════════
// ── Theme Tab ──
// ══════════════════════════════════════════════
var themeData = null;
var showChangedOnly = false;
var extractThemesBtn = $('extractThemesBtn');
var themeFilterBtn = $('themeFilterBtn');

extractThemesBtn.addEventListener('click', function() {
  extractThemesBtn.disabled = true;
  extractThemesBtn.textContent = '추출 중...';
  parent.postMessage({ pluginMessage: { type: 'extract-themes' } }, '*');
});

themeFilterBtn.addEventListener('click', function() {
  showChangedOnly = !showChangedOnly;
  themeFilterBtn.textContent = showChangedOnly ? '변경된 것만' : '전체 보기';
  renderThemes();
});

function renderThemes() {
  if (!themeData) return;
  var emptyState = $('themeEmptyState');
  if (emptyState) emptyState.style.display = 'none';
  var modes = Object.keys(themeData);
  if (modes.length < 2) {
    $('themeContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">2개 이상의 모드가 있는 컬렉션이 없습니다</div>';
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
    $('themeContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:12px;">' + (showChangedOnly ? '변경된 항목이 없습니다' : '테마 변수가 없습니다') + '</div>';
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
    if (!css) { showToast('먼저 테마를 추출하세요'); return; }
    copyToClipboard(css);
    showToast('CSS 변수 복사됨');
  });
}

// ══════════════════════════════════════════════
// ── Component Tab ──
// ══════════════════════════════════════════════
var compData = null;
var compActiveTab = 'html';
var generateCompBtn = $('generateCompBtn');

function updateCompSelInfo() {
  var info = $('compSelInfo');
  if (lastSelection.count > 0) {
    info.textContent = '선택: ' + lastSelection.names[0] + (lastSelection.count > 1 ? ' 외 ' + (lastSelection.count - 1) + '개 (첫 번째 노드 사용)' : '');
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = '선택된 노드 없음';
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

// ── Component language toggle ──
var compLang = 'react';
document.querySelectorAll('[data-comp-lang]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    compLang = btn.dataset.compLang;
    document.querySelectorAll('[data-comp-lang]').forEach(function(b) {
      b.classList.toggle('active', b.dataset.compLang === compLang);
    });
  });
});

generateCompBtn.addEventListener('click', function() {
  if (lastSelection.count === 0) { showToast('먼저 컴포넌트를 선택하세요'); return; }
  generateCompBtn.disabled = true;
  generateCompBtn.textContent = '생성 중...';
  parent.postMessage({ pluginMessage: { type: 'generate-component' } }, '*');
});

// Component sub-tab switching
document.querySelectorAll('.comp-tab').forEach(function(t) {
  t.addEventListener('click', function() {
    compActiveTab = t.dataset.compTab;
    document.querySelectorAll('.comp-tab').forEach(function(ct) {
      ct.classList.toggle('active', ct.dataset.compTab === compActiveTab);
    });
    updateCompCode();
  });
});

function updateCompCode() {
  if (!compData) return;
  $('compCode').value = compActiveTab === 'html' ? compData.html : compData.react;
}

$('compCopyBtn').addEventListener('click', function() {
  if (!compData) return;
  var text = compActiveTab === 'html' ? compData.html : compData.react;
  copyToClipboard(text);
  showToast((compActiveTab === 'html' ? 'HTML' : 'React') + ' 복사됨');
});

$('compDownloadBtn').addEventListener('click', function() {
  if (!compData) return;
  var json = JSON.stringify(compData, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = (compData.name || 'component') + '.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('JSON 다운로드 시작!');
});

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
  if (headerFile.textContent === '로딩 중...') {
    headerFile.textContent = 'Figma 파일';
  }
  if (colList.querySelector('.no-collections') && colList.textContent.trim() === '로딩 중...') {
    colList.innerHTML = '<div class="no-collections">컬렉션 없음 — Figma에서 플러그인을 실행하세요</div>';
  }
}, 1000);
