import { toCssName, figmaColorToCSS, toUnit } from './utils.js';

export function buildVarMap(data) {
  var map = {};
  if (data.variables && data.variables.variables) {
    data.variables.variables.forEach(function (v) {
      map[v.id] = v;
    });
  }
  return map;
}

export function resolveValue(val, varMap, depth, modeId) {
  if (depth > 10) return null;
  if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
    var ref = varMap[val.id];
    if (!ref) return null;
    // mode-aware: 동일 modeId가 있으면 해당 mode 값 사용, 없으면 첫 mode fallback
    var refVal =
      modeId && ref.valuesByMode[modeId] !== undefined
        ? ref.valuesByMode[modeId]
        : Object.values(ref.valuesByMode || {})[0];
    if (refVal === undefined) return null;
    return resolveValue(refVal, varMap, depth + 1, modeId);
  }
  return val;
}

// Collection name → detect dark-mode collection
var DARK_RE = /\b(dark|night|dim)\b/i;

// Build [{name, line}] entries for one mode
function buildVarEntries(colVars, mode, varMap, unit) {
  var entries = [];
  colVars.forEach(function (v) {
    var raw = (v.valuesByMode || {})[mode.modeId];
    var isAlias = raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS';
    var name = toCssName(v.name, isAlias);
    var cssVal = null;

    if (isAlias) {
      // alias → var(--target-name) 참조로 출력
      var ref = varMap[raw.id];
      if (ref) {
        var refIsAlias = false;
        var refRaw = Object.values(ref.valuesByMode || {})[0];
        if (refRaw && typeof refRaw === 'object' && refRaw.type === 'VARIABLE_ALIAS')
          refIsAlias = true;
        cssVal = 'var(' + toCssName(ref.name, refIsAlias) + ')';
      }
    }

    // alias 해석 실패 또는 primitive → 값 직접 출력
    if (cssVal === null) {
      var val = resolveValue(raw, varMap, 0, mode.modeId);
      if (val === null || val === undefined) return;
      if (v.resolvedType === 'COLOR') {
        if (typeof val === 'object' && 'r' in val) cssVal = figmaColorToCSS(val);
      } else if (v.resolvedType === 'FLOAT') {
        if (typeof val === 'number') cssVal = toUnit(val, unit);
      } else if (v.resolvedType === 'STRING') {
        if (typeof val === 'string') cssVal = val;
      }
    }

    if (cssVal !== null) entries.push({ name: name, line: '  ' + name + ': ' + cssVal + ';\n' });
  });
  return entries;
}

/**
 * Returns:
 *   rootLines   — deduplicated property lines for the shared :root {} (light/default values)
 *   themeBlocks — Array<{modeName, comment, lines}> for non-default modes
 *
 * Theming rules:
 *   Multi-mode collection  → mode 0 = :root, mode 1+ = [data-theme]
 *   Single-mode, name~dark → treated as dark theme, not :root
 *   Single-mode, otherwise → :root (with deduplication; first definition wins)
 */
export function convertVariables(data, varMap, unit) {
  if (!data.variables || !data.variables.variables || !data.variables.collections) {
    return { rootLines: '', themeBlocks: [] };
  }
  var vars = data.variables.variables;
  var cols = data.variables.collections;
  if (vars.length === 0) return { rootLines: '', themeBlocks: [] };

  var rootLines = '';
  var seenInRoot = new Set(); // dedup tracker for :root
  var themeMap = {}; // modeName → {comment, seen: Set, lines}

  function addToRoot(entries) {
    entries.forEach(function (e) {
      if (!seenInRoot.has(e.name)) {
        seenInRoot.add(e.name);
        rootLines += e.line;
      }
    });
  }

  function addToTheme(modeName, comment, entries) {
    if (!themeMap[modeName]) {
      themeMap[modeName] = { comment: comment, seen: new Set(), lines: '' };
    }
    var bucket = themeMap[modeName];
    entries.forEach(function (e) {
      if (!bucket.seen.has(e.name)) {
        bucket.seen.add(e.name);
        bucket.lines += e.line;
      }
    });
  }

  cols.forEach(function (col) {
    var colVars = vars.filter(function (v) {
      return v.collectionId === col.id && v.resolvedType !== 'BOOLEAN';
    });
    if (colVars.length === 0) return;
    var modes = col.modes || [];
    if (modes.length === 0) return;

    var isMultiMode = modes.length > 1;

    modes.forEach(function (mode, modeIdx) {
      var entries = buildVarEntries(colVars, mode, varMap, unit);
      if (entries.length === 0) return;

      if (isMultiMode) {
        // Multi-mode collection: mode 0 → :root, others → [data-theme="modeName"]
        if (modeIdx === 0) {
          addToRoot(entries);
        } else {
          var mn = mode.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          addToTheme(mn, '/* ' + col.name + ' / ' + mode.name + ' */', entries);
        }
      } else {
        // Single-mode: categorize by collection name
        if (DARK_RE.test(col.name)) {
          addToTheme('dark', '/* ' + col.name + ' */', entries);
        } else {
          addToRoot(entries);
        }
      }
    });
  });

  // Flatten themeMap → themeBlocks array
  var themeBlocks = Object.keys(themeMap).map(function (mn) {
    return { modeName: mn, comment: themeMap[mn].comment, lines: themeMap[mn].lines };
  });

  return { rootLines: rootLines, themeBlocks: themeBlocks };
}

/**
 * Converts a flat VariableData[] (spacing or radius) to CSS property lines.
 * @param {boolean} stripGroupPrefix - when true, use only the leaf segment of grouped names
 *   (e.g., "Widths/width-xxs" → "--width-xxs" instead of "--widths-width-xxs").
 *   Numeric-only leaves (e.g., "Spacing/0") keep the full path.
 */
export function convertFlatVars(vars, varMap, unit, stripGroupPrefix) {
  if (!vars || vars.length === 0) return '';
  var lines = '';
  var seen = new Set();
  vars.forEach(function (v) {
    var raw = Object.values(v.valuesByMode || {})[0];
    var isAlias = raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS';

    // When stripGroupPrefix is set and the name has a group prefix, use only the leaf
    var effectiveName = v.name;
    if (stripGroupPrefix && !isAlias && v.name.indexOf('/') >= 0) {
      var leaf = v.name.split('/').pop();
      if (!/^[\d.]+$/.test(leaf)) effectiveName = leaf;
    }

    var name = toCssName(effectiveName, isAlias);
    if (seen.has(name)) return;
    seen.add(name);

    var cssVal = null;
    if (isAlias) {
      var ref = varMap[raw.id];
      if (ref) {
        var refRaw = Object.values(ref.valuesByMode || {})[0];
        var refIsAlias = refRaw && typeof refRaw === 'object' && refRaw.type === 'VARIABLE_ALIAS';
        cssVal = 'var(' + toCssName(ref.name, refIsAlias) + ')';
      }
    }
    if (cssVal === null) {
      var val = resolveValue(raw, varMap, 0);
      if (typeof val === 'number') cssVal = toUnit(val, unit);
    }
    if (cssVal !== null) {
      lines += '  ' + name + ': ' + cssVal + ';\n';
    }
  });
  return lines;
}
