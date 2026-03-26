export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toCssName(path) {
  return '--' + path
    .replace(/([a-z])([A-Z])/g, '$1-$2')   // camelCase → kebab-case
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function figmaColorToCSS(c) {
  var r = Math.round((c.r || 0) * 255);
  var g = Math.round((c.g || 0) * 255);
  var b = Math.round((c.b || 0) * 255);
  var a = c.a !== undefined ? c.a : 1;
  if (a >= 0.999) {
    return '#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (Math.round(a * 100) / 100) + ')';
}

export function toUnit(value, unit) {
  if (unit === 'rem') return (Math.round(value / 16 * 1000) / 1000) + 'rem';
  return value + 'px';
}
