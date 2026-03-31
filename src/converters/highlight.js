import { escapeHtml } from './utils.js';

export function highlightCSS(text) {
  return text
    .split('\n')
    .map(function (line) {
      var t = line.trim();
      if (t.startsWith('/*') || t.startsWith('*')) {
        return '<span class="cc">' + escapeHtml(line) + '</span>';
      }
      if (t === '}' || t === '') return escapeHtml(line);
      if (t.endsWith('{')) {
        return (
          '<span class="cs">' +
          escapeHtml(line.slice(0, line.lastIndexOf('{'))) +
          '</span>' +
          escapeHtml(line.slice(line.lastIndexOf('{')))
        );
      }
      var colon = line.indexOf(':');
      if (colon > 0) {
        var semi = line.lastIndexOf(';');
        if (semi > colon) {
          var indent = line.match(/^(\s*)/)[1];
          var propRaw = line.slice(0, colon).trim();
          var valRaw = line.slice(colon + 1, semi).trim();
          var tail = escapeHtml(line.slice(semi));
          if (propRaw.indexOf('--') === 0) {
            return (
              escapeHtml(indent) +
              '<span class="cp">' +
              escapeHtml(propRaw) +
              '</span>: <span class="cv">' +
              escapeHtml(valRaw) +
              '</span>' +
              tail
            );
          }
          return (
            escapeHtml(indent + propRaw) +
            ': <span class="cv">' +
            escapeHtml(valRaw) +
            '</span>' +
            tail
          );
        }
      }
      return escapeHtml(line);
    })
    .join('\n');
}
