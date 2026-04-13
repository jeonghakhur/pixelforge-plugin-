export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toCssName(path, isAlias) {
  // Semantic(alias): 마지막 세그먼트만 (Colors/Background/bg-brand-solid → --bg-brand-solid)
  // Primitive: 모든 세그먼트 유지하되 prefix 중복 제거
  var raw = isAlias && path.indexOf('/') >= 0 ? path.split('/').pop() : path;

  // Primitive: "Spacing/spacing-xxs" → "spacing-xxs" (prefix 중복 제거)
  if (!isAlias && path.indexOf('/') >= 0) {
    var segments = path.split('/');
    var firstSeg = segments[0].toLowerCase().replace(/\s+/g, '-');
    var lastSeg = segments[segments.length - 1].toLowerCase().replace(/\s+/g, '-');
    if (segments.length === 2 && lastSeg.indexOf(firstSeg + '-') === 0) {
      raw = segments[segments.length - 1];
    }
  }

  return (
    '--' +
    raw
      .replace(/\s*\(\d+\)\s*/g, '') // 괄호 shade 제거
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\//g, '-')
      .replace(/[\u2024]/g, '.') // U+2024 ONE DOT LEADER → 일반 마침표
      .replace(/[^a-zA-Z0-9_.-]/g, '-') // underscore, 마침표 유지
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  );
}

export function figmaColorToCSS(c) {
  var r = Math.floor((c.r || 0) * 255);
  var g = Math.floor((c.g || 0) * 255);
  var b = Math.floor((c.b || 0) * 255);
  var a = c.a !== undefined ? c.a : 1;
  if (a >= 0.999) {
    return (
      '#' +
      [r, g, b]
        .map(function (v) {
          return v.toString(16).padStart(2, '0');
        })
        .join('')
        .toUpperCase()
    );
  }
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + Math.round(a * 100) / 100 + ')';
}

export function toUnit(value, unit) {
  if (unit === 'rem') return Math.round((value / 16) * 1000) / 1000 + 'rem';
  return value + 'px';
}
