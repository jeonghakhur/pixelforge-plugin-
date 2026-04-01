import { escapeHtml } from './utils.js';

export function highlightJSON(text) {
  var result = '';
  var i = 0;
  var j;
  var len = text.length;
  while (i < len) {
    var ch = text[i];
    if (ch === '"') {
      j = i + 1;
      while (j < len) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      var str = escapeHtml(text.slice(i, j));
      var k = j;
      while (k < len && (text[k] === ' ' || text[k] === '\t')) k++;
      if (text[k] === ':') {
        result += '<span class="cjk">' + str + '</span>';
      } else {
        result += '<span class="cv">' + str + '</span>';
      }
      i = j;
    } else if (ch === '-' || (ch >= '0' && ch <= '9')) {
      j = i;
      while (j < len && /[-+.eE0-9]/.test(text[j])) j++;
      result += '<span class="cn">' + escapeHtml(text.slice(i, j)) + '</span>';
      i = j;
    } else if (text.slice(i, i + 4) === 'true') {
      result += '<span class="cb">true</span>';
      i += 4;
    } else if (text.slice(i, i + 5) === 'false') {
      result += '<span class="cb">false</span>';
      i += 5;
    } else if (text.slice(i, i + 4) === 'null') {
      result += '<span class="cb">null</span>';
      i += 4;
    } else {
      result += escapeHtml(ch);
      i++;
    }
  }
  return result;
}

var TSX_KEYWORDS = [
  'import',
  'export',
  'from',
  'const',
  'let',
  'var',
  'function',
  'return',
  'type',
  'interface',
  'extends',
  'implements',
  'default',
  'class',
  'new',
  'if',
  'else',
  'for',
  'while',
  'of',
  'in',
  'as',
  'async',
  'await',
];

export function highlightTSX(text) {
  return text
    .split('\n')
    .map(function (line) {
      var result = '';
      var i = 0;
      var j;
      var len = line.length;
      while (i < len) {
        // Single-line comment
        if (line[i] === '/' && line[i + 1] === '/') {
          result += '<span class="cc">' + escapeHtml(line.slice(i)) + '</span>';
          i = len;
          continue;
        }
        // String literal (" or ')
        if (line[i] === '"' || line[i] === "'") {
          var q = line[i];
          j = i + 1;
          while (j < len && line[j] !== q) {
            if (line[j] === '\\') j++;
            j++;
          }
          j++;
          result += '<span class="cv">' + escapeHtml(line.slice(i, j)) + '</span>';
          i = j;
          continue;
        }
        // Template literal
        if (line[i] === '`') {
          j = i + 1;
          while (j < len && line[j] !== '`') {
            if (line[j] === '\\') j++;
            j++;
          }
          j++;
          result += '<span class="cv">' + escapeHtml(line.slice(i, j)) + '</span>';
          i = j;
          continue;
        }
        // JSX closing tag </Foo or self-closing />
        if (line[i] === '<' && line[i + 1] === '/') {
          j = i + 2;
          while (j < len && /[\w.]/.test(line[j])) j++;
          if (j > i + 2) {
            result += '&lt;/<span class="ct">' + escapeHtml(line.slice(i + 2, j)) + '</span>';
            i = j;
            continue;
          }
        }
        // JSX opening tag <Foo
        if (line[i] === '<' && i + 1 < len && /[a-zA-Z]/.test(line[i + 1])) {
          j = i + 1;
          while (j < len && /[\w.]/.test(line[j])) j++;
          result += '&lt;<span class="ct">' + escapeHtml(line.slice(i + 1, j)) + '</span>';
          i = j;
          continue;
        }
        // Word (keyword or identifier)
        if (/[a-zA-Z_$]/.test(line[i])) {
          j = i;
          while (j < len && /[\w$]/.test(line[j])) j++;
          var word = line.slice(i, j);
          if (TSX_KEYWORDS.indexOf(word) >= 0) {
            result += '<span class="ck">' + escapeHtml(word) + '</span>';
          } else {
            result += escapeHtml(word);
          }
          i = j;
          continue;
        }
        result += escapeHtml(line[i]);
        i++;
      }
      return result;
    })
    .join('\n');
}

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
