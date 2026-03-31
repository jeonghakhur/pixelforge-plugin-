'use strict';
import { state } from './state.js';
import { t } from './i18n.js';
import { $, showToast } from './utils.js';
import { escapeHtml } from '../converters/utils.js';

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
export function populateA11yColors() {
  if (!state.extractedData) return;
  var hint = $('a11yHint');
  if (hint) hint.style.display = 'none';
  var colors = [];
  // From color styles
  if (state.extractedData.styles && state.extractedData.styles.colors) {
    state.extractedData.styles.colors.forEach(function (s) {
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
  if (state.extractedData.variables && state.extractedData.variables.variables) {
    state.extractedData.variables.variables.forEach(function (v) {
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
var a11ySubTab = 'matrix';
var matrixFilter = 'all';
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

// ── Matrix Filter Buttons ──
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.matrix-filter-btn');
  if (!btn) return;
  matrixFilter = btn.dataset.filter;
  document.querySelectorAll('.matrix-filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.filter === matrixFilter);
  });
  renderMatrix();
});

// ── Build extracted colors from data ──
export function buildExtractedColors() {
  state.extractedColors = [];
  if (!state.extractedData) return;
  var seen = {};
  // From color styles
  if (state.extractedData.styles && state.extractedData.styles.colors) {
    state.extractedData.styles.colors.forEach(function (s) {
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
          state.extractedColors.push({ name: s.name, hex: hex });
        }
      }
    });
  }
  // From COLOR variables
  if (state.extractedData.variables && state.extractedData.variables.variables) {
    state.extractedData.variables.variables.forEach(function (v) {
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
          state.extractedColors.push({ name: v.name, hex: hex });
        }
      }
    });
  }
}

// ── Matrix Rendering ──
export function renderMatrix() {
  if (state.extractedColors.length === 0) {
    $('matrixEmpty').style.display = 'block';
    $('matrixContent').classList.add('hidden');
    $('matrixSummary').innerHTML = '';
    return;
  }
  $('matrixEmpty').style.display = 'none';
  $('matrixContent').classList.remove('hidden');

  var colors = state.extractedColors;
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

  // Summary counters (upper triangle only)
  var countAAA = 0,
    countAA = 0,
    countAALarge = 0,
    countFail = 0;

  var html = '<thead><tr><th></th>';
  colors.forEach(function (c) {
    html += '<th>' + headerCell(c) + '</th>';
  });
  html += '</tr></thead><tbody>';

  colors.forEach(function (row, rowIdx) {
    html += '<tr><td>' + headerCell(row) + '</td>';
    var rowRgb = hexToRgb(row.hex);
    colors.forEach(function (col, colIdx) {
      // Lower triangle: empty
      if (colIdx < rowIdx) {
        html += '<td class="matrix-lower"></td>';
        return;
      }
      // Diagonal: same color
      if (colIdx === rowIdx) {
        html += '<td class="matrix-same"></td>';
        return;
      }
      // Upper triangle
      var colRgb = hexToRgb(col.hex);
      if (!rowRgb || !colRgb) {
        html += '<td>-</td>';
        return;
      }
      var ratio = contrastRatio(rowRgb, colRgb);

      // Count (regardless of filter)
      if (ratio >= 7) countAAA++;
      else if (ratio >= 4.5) countAA++;
      else if (ratio >= 3) countAALarge++;
      else countFail++;

      // Filter: hide non-passing cells
      var passes =
        matrixFilter === 'all' ||
        (matrixFilter === 'aa' && ratio >= 4.5) ||
        (matrixFilter === 'aaa' && ratio >= 7);
      if (!passes) {
        html += '<td class="matrix-filtered"></td>';
        return;
      }

      var cls = getCellClass(ratio);
      var badge = getBadge(ratio);

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

export function getA11ySubTab() { return a11ySubTab; }
