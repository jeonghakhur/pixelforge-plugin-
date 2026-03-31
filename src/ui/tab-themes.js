'use strict';
import { escapeHtml } from '../converters/utils.js';
import { t } from './i18n.js';
import { $, showToast, copyToClipboard } from './utils.js';

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

export function onExtractThemesResult(data) {
  extractThemesBtn.disabled = false;
  extractThemesBtn.textContent = t('theme.extract');
  themeData = data;
  themeFilterBtn.disabled = false;
  if (themeCopyCssBtn) themeCopyCssBtn.disabled = false;
  renderThemes();
}

export function onExtractThemesError(message) {
  extractThemesBtn.disabled = false;
  extractThemesBtn.textContent = t('theme.extract');
  showToast(t('theme.exportFail') + (message || ''));
}
