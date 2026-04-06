'use strict';

import { toCssName } from './utils.js';

/**
 * Figma GridStyle → CSS custom properties
 * Returns CSS lines only (no :root wrapper).
 */
export function convertGridStyles(grids) {
  if (!grids || grids.length === 0) return '';
  var lines = '';
  grids.forEach(function (s) {
    var base = toCssName('grid-' + s.name);
    (s.layoutGrids || []).forEach(function (g, i) {
      var suffix = s.layoutGrids.length > 1 ? '-' + (i + 1) : '';
      var prefix = base + suffix;
      if (g.pattern === 'COLUMNS') {
        if (g.count != null) lines += '  ' + prefix + '-columns: ' + g.count + ';\n';
        if (g.gutterSize != null) lines += '  ' + prefix + '-gutter: ' + g.gutterSize + 'px;\n';
        if (g.offset != null) lines += '  ' + prefix + '-margin: ' + g.offset + 'px;\n';
        if (g.sectionSize != null)
          lines += '  ' + prefix + '-column-width: ' + g.sectionSize + 'px;\n';
      } else if (g.pattern === 'ROWS') {
        if (g.count != null) lines += '  ' + prefix + '-rows: ' + g.count + ';\n';
        if (g.gutterSize != null) lines += '  ' + prefix + '-gutter: ' + g.gutterSize + 'px;\n';
        if (g.offset != null) lines += '  ' + prefix + '-margin: ' + g.offset + 'px;\n';
        if (g.sectionSize != null)
          lines += '  ' + prefix + '-row-height: ' + g.sectionSize + 'px;\n';
      } else if (g.pattern === 'GRID') {
        if (g.sectionSize != null) lines += '  ' + prefix + '-size: ' + g.sectionSize + 'px;\n';
      }
    });
  });
  return lines;
}
