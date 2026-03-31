import { toUnit } from './utils.js';

export function convertTextStyles(texts, unit) {
  if (!texts || texts.length === 0) return '';
  var out = '/* === Text Styles === */\n';
  texts.forEach(function (s) {
    var cls =
      '.text-' +
      s.name
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
    out += cls + ' {\n';
    if (s.fontName && s.fontName.family)
      out += "  font-family: '" + s.fontName.family + "', sans-serif;\n";
    if (s.fontSize) out += '  font-size: ' + toUnit(s.fontSize, unit) + ';\n';
    if (s.fontWeight) out += '  font-weight: ' + s.fontWeight + ';\n';
    if (s.lineHeight) {
      var lh = s.lineHeight;
      if (lh.unit === 'PERCENT')
        out += '  line-height: ' + Math.round((lh.value / 100) * 100) / 100 + ';\n';
      else if (lh.unit === 'PIXELS') out += '  line-height: ' + toUnit(lh.value, unit) + ';\n';
      else out += '  line-height: normal;\n';
    }
    if (s.letterSpacing) {
      var ls = s.letterSpacing;
      if (ls.unit === 'PERCENT')
        out += '  letter-spacing: ' + Math.round((ls.value / 100) * 10000) / 10000 + 'em;\n';
      else if (ls.unit === 'PIXELS') out += '  letter-spacing: ' + toUnit(ls.value, unit) + ';\n';
    }
    if (s.textCase && s.textCase !== 'ORIGINAL') {
      var tcMap = {
        UPPER: 'uppercase',
        LOWER: 'lowercase',
        TITLE: 'capitalize',
        SMALL_CAPS: 'small-caps',
      };
      if (tcMap[s.textCase]) out += '  text-transform: ' + tcMap[s.textCase] + ';\n';
    }
    if (s.textDecoration && s.textDecoration !== 'NONE') {
      var tdMap = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' };
      if (tdMap[s.textDecoration]) out += '  text-decoration: ' + tdMap[s.textDecoration] + ';\n';
    }
    out += '}\n';
  });
  out += '\n';
  return out;
}
