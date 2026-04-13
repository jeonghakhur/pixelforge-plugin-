'use strict';
import { state } from './state.js';
import { t } from './i18n.js';
import { $ } from './utils.js';
import { escapeHtml } from '../converters/utils.js';

// ══════════════════════════════════════════════
// ── Accessibility Tab ──
// ══════════════════════════════════════════════

var selectedBgHexes = new Set();
var contrastFilter = 'all';

// ── Color utilities ──
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

// ── Build extracted colors from state ──
export function buildExtractedColors() {
  state.extractedColors = [];
  if (!state.extractedData) return;
  var seen = {};
  if (state.extractedData.styles && state.extractedData.styles.colors) {
    state.extractedData.styles.colors.forEach(function (s) {
      if (s.paints && s.paints.length > 0 && s.paints[0].type === 'SOLID') {
        var c = s.paints[0].color;
        var hex = '#' + [Math.floor((c.r || 0) * 255), Math.floor((c.g || 0) * 255), Math.floor((c.b || 0) * 255)]
          .map(function (v) { return v.toString(16).padStart(2, '0'); }).join('').toUpperCase();
        if (!seen[hex]) { seen[hex] = true; state.extractedColors.push({ name: s.name, hex: hex }); }
      }
    });
  }
  if (state.extractedData.variables && state.extractedData.variables.variables) {
    state.extractedData.variables.variables.forEach(function (v) {
      if (v.resolvedType !== 'COLOR') return;
      var modes = Object.keys(v.valuesByMode);
      if (modes.length === 0) return;
      var val = v.valuesByMode[modes[0]];
      if (val && typeof val === 'object' && val.r !== undefined) {
        var hex = '#' + [Math.floor(val.r * 255), Math.floor(val.g * 255), Math.floor(val.b * 255)]
          .map(function (v2) { return v2.toString(16).padStart(2, '0'); }).join('').toUpperCase();
        if (!seen[hex]) { seen[hex] = true; state.extractedColors.push({ name: v.name, hex: hex }); }
      }
    });
  }
}

// ── Filter button events ──
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.contrast-filter-btn');
  if (!btn) return;
  contrastFilter = btn.dataset.filter;
  document.querySelectorAll('.contrast-filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.filter === contrastFilter);
  });
  renderContrastResults();
});

// ── Chip click events ──
document.addEventListener('click', function (e) {
  var chip = e.target.closest('.bg-chip');
  if (!chip) return;
  var hex = chip.dataset.hex;
  if (selectedBgHexes.has(hex)) {
    selectedBgHexes.delete(hex);
    chip.classList.remove('active');
  } else {
    selectedBgHexes.add(hex);
    chip.classList.add('active');
  }
  renderContrastResults();
});

// ── Render chips ──
function renderBgChips() {
  var html = '';
  state.extractedColors.forEach(function (c) {
    var active = selectedBgHexes.has(c.hex) ? ' active' : '';
    html +=
      '<button class="bg-chip' + active + '" data-hex="' + c.hex + '">' +
      '<span class="chip-swatch" style="background:' + c.hex + '"></span>' +
      '<span class="chip-name">' + escapeHtml(c.name) + '</span>' +
      '</button>';
  });
  $('a11yBgChips').innerHTML = html;
}

// ── Render results ──
function renderContrastResults() {
  var resultsEl = $('a11yResults');
  if (selectedBgHexes.size === 0) {
    resultsEl.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:24px 0;">' +
      t('contrast.selectBgHint') + '</p>';
    return;
  }

  var html = '';
  selectedBgHexes.forEach(function (bgHex) {
    var bgColor = state.extractedColors.find(function (c) { return c.hex === bgHex; });
    if (!bgColor) return;
    var bgRgb = hexToRgb(bgHex);

    var rows = '';
    state.extractedColors.forEach(function (fg) {
      if (fg.hex === bgHex) return;
      var fgRgb = hexToRgb(fg.hex);
      if (!bgRgb || !fgRgb) return;
      var ratio = contrastRatio(bgRgb, fgRgb);

      var passes =
        contrastFilter === 'all' ||
        (contrastFilter === 'aa' && ratio >= 4.5) ||
        (contrastFilter === 'aaa' && ratio >= 7);
      if (!passes) return;

      var level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA+' : 'FAIL';
      var levelClass = ratio >= 7 ? 'badge-aaa' : ratio >= 4.5 ? 'badge-aa' : ratio >= 3 ? 'badge-aa-large' : 'badge-fail';

      rows +=
        '<div class="contrast-row">' +
        '<span class="row-preview" style="background:' + bgHex + ';color:' + fg.hex + '">Aa</span>' +
        '<span class="row-swatch" style="background:' + fg.hex + '"></span>' +
        '<span class="row-name">' + escapeHtml(fg.name) + '</span>' +
        '<span class="row-ratio">' + ratio.toFixed(1) + ':1</span>' +
        '<span class="matrix-badge ' + levelClass + '">' + level + '</span>' +
        '</div>';
    });

    if (!rows) {
      rows =
        '<div style="font-size:11px;color:var(--text-muted);padding:10px 12px;">' +
        t('contrast.noPass') + '</div>';
    }

    html +=
      '<div class="contrast-card">' +
      '<div class="contrast-card-header">' +
      '<span class="card-swatch" style="background:' + bgHex + '"></span>' +
      '<span class="card-name">' + escapeHtml(bgColor.name) + '</span>' +
      '<span class="card-hex">' + bgHex + '</span>' +
      '</div>' +
      '<div class="contrast-card-rows">' + rows + '</div>' +
      '</div>';
  });

  resultsEl.innerHTML = html;
}

// ── Main render ──
export function renderA11yView() {
  if (state.extractedColors.length === 0) {
    $('a11yEmpty').style.display = 'block';
    $('a11yMain').classList.add('hidden');
    return;
  }
  $('a11yEmpty').style.display = 'none';
  $('a11yMain').classList.remove('hidden');
  renderBgChips();
  renderContrastResults();
}
