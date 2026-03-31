import { toCssName, figmaColorToCSS } from './utils.js';

/**
 * Returns CSS property lines only (no :root wrapper).
 * Caller appends to the shared :root block.
 */
export function convertEffectStyles(effects) {
  if (!effects || effects.length === 0) return '';
  var lines = '';
  effects.forEach(function (s) {
    var shadows = (s.effects || []).filter(function (e) {
      return e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW';
    });
    var blurs = (s.effects || []).filter(function (e) {
      return e.type === 'LAYER_BLUR';
    });
    if (shadows.length > 0) {
      var name = toCssName('shadow-' + s.name);
      var parts = shadows.map(function (e) {
        var inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
        var x = e.offset ? e.offset.x : 0;
        var y = e.offset ? e.offset.y : 0;
        var blur = e.radius || 0;
        var spread = e.spread || 0;
        var col = figmaColorToCSS({ r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a });
        return inset + x + 'px ' + y + 'px ' + blur + 'px ' + spread + 'px ' + col;
      });
      lines += '  ' + name + ': ' + parts.join(', ') + ';\n';
    }
    if (blurs.length > 0) {
      var bname = toCssName('blur-' + s.name);
      lines += '  ' + bname + ': blur(' + (blurs[0].radius || 0) + 'px);\n';
    }
  });
  return lines;
}
