import { toCssName, figmaColorToCSS } from './utils.js';

/**
 * Returns CSS property lines only (no :root wrapper).
 * Caller appends to the shared :root block.
 */
export function convertColorStyles(colors) {
  if (!colors || colors.length === 0) return '';
  var lines = '';
  var seen = new Set();
  colors.forEach(function(s) {
    var paint = (s.paints || []).find(function(p) { return p.type === 'SOLID'; });
    if (!paint || !paint.color) return;
    var name = toCssName('color-' + s.name);
    if (seen.has(name)) return;
    seen.add(name);
    var alpha = paint.opacity !== undefined ? paint.opacity : 1;
    lines += '  ' + name + ': ' + figmaColorToCSS({ r: paint.color.r, g: paint.color.g, b: paint.color.b, a: alpha }) + ';\n';
  });
  return lines;
}
