import { toCssName, figmaColorToCSS } from './utils.js';

/**
 * Returns CSS property lines only (no :root wrapper).
 * Caller appends to the shared :root block.
 * @param {Array} effects - array of EffectStyleData
 * @param {Object} varMap - variable ID → variable object (for color var references)
 */
export function convertEffectStyles(effects, varMap) {
  if (!effects || effects.length === 0) return '';
  var lines = '';
  effects.forEach(function (s) {
    // Use last segment of grouped name (e.g., "Shadows/shadow-xs" → "shadow-xs")
    var lastSeg = s.name.indexOf('/') >= 0 ? s.name.split('/').pop() : s.name;

    var shadows = (s.effects || []).filter(function (e) {
      return e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW';
    });
    var layerBlurs = (s.effects || []).filter(function (e) {
      return e.type === 'LAYER_BLUR';
    });
    var backdropBlurs = (s.effects || []).filter(function (e) {
      return e.type === 'BACKGROUND_BLUR';
    });

    if (shadows.length > 0) {
      var name = toCssName(lastSeg);
      var parts = shadows.map(function (e) {
        var inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
        var x = e.offset ? e.offset.x : 0;
        var y = e.offset ? e.offset.y : 0;
        var blur = e.radius || 0;
        var spread = e.spread || 0;

        // Use CSS variable reference if color is bound to a variable
        var col;
        var colorVarId = e.boundVariables && e.boundVariables.color && e.boundVariables.color.id;
        if (colorVarId && varMap && varMap[colorVarId]) {
          var ref = varMap[colorVarId];
          var refRaw = Object.values(ref.valuesByMode || {})[0];
          var refIsAlias = refRaw && typeof refRaw === 'object' && refRaw.type === 'VARIABLE_ALIAS';
          col = 'var(' + toCssName(ref.name, refIsAlias) + ')';
        } else {
          col = figmaColorToCSS({ r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a });
        }

        return inset + x + 'px ' + y + 'px ' + blur + 'px ' + spread + 'px ' + col;
      });
      lines += '  ' + name + ': ' + parts.join(', ') + ';\n';
    }

    if (layerBlurs.length > 0) {
      var bname = toCssName(lastSeg);
      lines += '  ' + bname + ': blur(' + (layerBlurs[0].radius || 0) + 'px);\n';
    }

    if (backdropBlurs.length > 0) {
      var bdname = toCssName(lastSeg);
      lines += '  ' + bdname + ': blur(' + (backdropBlurs[0].radius || 0) + 'px);\n';
    }
  });
  return lines;
}
