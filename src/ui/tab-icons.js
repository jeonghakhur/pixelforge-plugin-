'use strict';
import JSZip from 'jszip';
import { escapeHtml } from '../converters/utils.js';
import { highlightTSX } from '../converters/highlight.js';
import { state } from './state.js';
import { lang, t } from './i18n.js';
import { $, showToast, copyToClipboard, getScope, sendToPixelForge } from './utils.js';

// ══════════════════════════════════════════════
// ── Icon Tab ──
// ══════════════════════════════════════════════
var iconData = [];        // flat list — UI 렌더링용
var iconRawData = [];     // grouped IconSetResult[] — JSON 다운로드/전송용
var iconMode = 'all';

// IconSetResult[] → flat IconResult[] 어댑터 (UI 렌더링 호환)
function flattenIconSets(sets) {
  return sets.flatMap(function (iconSet) {
    // 구 포맷(string[] variants) 그대로 패스
    if (!iconSet.variants || typeof iconSet.variants[0] === 'string') return [iconSet];
    return iconSet.variants.map(function (variant) {
      return {
        name: iconSet.name,
        kebab: iconSet.kebab,
        pascal: iconSet.pascal,
        section: iconSet.section,
        variants: Object.entries(variant.props || {}).map(function (entry) {
          return (entry[0] + '-' + entry[1]).toLowerCase().replace(/\s+/g, '-');
        }),
        colorTokens: variant.colorTokens,
        svg: variant.svg,
        format: variant.format,
        pngBase64: variant.pngBase64,
      };
    });
  });
}
export var exportIconsBtn = $('exportIconsBtn');
export var exportIconsAllBtn = $('exportIconsAllBtn');

// ── Icon Search & Detail 상태 ──
var iconSearchQuery = '';
var iconFilteredData = [];
var iconSelectedIdx = null;
var iconColorMode = 'currentColor';
var iconColorValue = 'currentColor';
var iconDetailTab = 'svg';

// ── SVG 색상 치환 ──
function replaceSvgColor(svg, mode, value) {
  var KEEP = /^(none|transparent|currentColor)$/i;

  // <clipPath>...</clipPath> 블록은 클리핑 마스크 정의용 — fill 변환 제외
  // 블록 밖 구간만 치환하기 위해 split 후 홀수 인덱스(블록 내부)는 원본 유지
  function replaceOutsideClipPath(str, replacer) {
    return str
      .split(/(<clipPath[\s\S]*?<\/clipPath>)/g)
      .map(function (chunk, i) {
        return i % 2 === 0 ? replacer(chunk) : chunk;
      })
      .join('');
  }

  return replaceOutsideClipPath(svg, function (chunk) {
    return chunk
      .replace(/fill="([^"]*)"/g, function (_, v) {
        if (KEEP.test(v)) return 'fill="' + v + '"';
        if (mode === 'currentColor') return 'fill="currentColor"';
        if (mode === 'cssVar') return 'fill="var(' + value + ')"';
        return 'fill="' + value + '"';
      })
      .replace(/stroke="([^"]*)"/g, function (_, v) {
        if (KEEP.test(v)) return 'stroke="' + v + '"';
        if (mode === 'currentColor') return 'stroke="currentColor"';
        if (mode === 'cssVar') return 'stroke="var(' + value + ')"';
        return 'stroke="' + value + '"';
      });
  });
}

// void 요소 self-closing 보장: <path ...> → <path ... />
// formatXml 전후 두 단계로 처리 (단일 줄 + 여러 줄 속성 분리 케이스)
function applySelfClosing(svg) {
  var VOID_RE =
    /<(path|circle|ellipse|line|polyline|polygon|rect|use|stop|animate|animateTransform)(\b[^>]*)>/g;
  // step 1: 단일 줄 void 요소
  var result = svg.replace(VOID_RE, function (m, tag, attrs) {
    return attrs.endsWith('/') ? m : '<' + tag + attrs + ' />';
  });
  // step 2: 여러 줄로 분리된 경우 — 단독 ">" 줄을 "/>" 로 교체
  var VOID_TAGS =
    /^<(path|circle|ellipse|line|polyline|polygon|rect|use|stop|animate|animateTransform)\b/;
  var inVoid = false;
  return result
    .split('\n')
    .map(function (line) {
      var t = line.trim();
      if (VOID_TAGS.test(t)) {
        inVoid = true;
      }
      if (inVoid) {
        if (/\/>$/.test(t)) {
          inVoid = false;
          return line;
        }
        if (t === '>') {
          inVoid = false;
          return line.replace('>', '/>');
        }
        if (/>$/.test(t) && !/<\//.test(t)) {
          inVoid = false;
          return line.slice(0, line.lastIndexOf('>')) + '/>';
        }
      }
      return line;
    })
    .join('\n');
}

// ── XML/SVG 포맷터 ──

// 태그 한 줄을 받아 속성이 2개 이상 & 80자 초과면 속성마다 줄 나눔
function formatTagAttrs(tag, baseIndent) {
  // 태그명과 속성 파싱: <tagName attr1="v1" attr2="v2" ...(/?)>
  var m = tag.match(/^(<\/?\w[\w.-]*)(\s[^>]*)?(\/?>)$/);
  if (!m) return baseIndent + tag;
  var open = m[1]; // e.g. "<svg"
  var attrStr = m[2] || ''; // e.g. ' xmlns="..." viewBox="..."'
  var close = m[3]; // ">" or "/>"

  // 속성 파싱 (값에 공백 포함 가능 → 따옴표 기준으로 분리)
  var attrs = [];
  var re = /\s+([\w:.-]+)(?:="([^"]*)")?/g;
  var hit;
  while ((hit = re.exec(attrStr)) !== null) {
    attrs.push(hit[2] !== undefined ? hit[1] + '="' + hit[2] + '"' : hit[1]);
  }

  // 속성 1개 이하이거나 한 줄이 80자 이하면 그대로
  var oneLiner = baseIndent + open + (attrStr || '') + close;
  if (attrs.length <= 1 || oneLiner.length <= 80) return oneLiner;

  // 속성마다 줄 나눔
  var attrIndent = baseIndent + '  ';
  return (
    baseIndent +
    open +
    '\n' +
    attrs
      .map(function (a) {
        return attrIndent + a;
      })
      .join('\n') +
    '\n' +
    baseIndent +
    close
  );
}

function formatXml(xml) {
  var pad = 0;
  var lines = xml
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);
  return lines
    .map(function (line) {
      var isClosing = /^<\//.test(line);
      var isSelfClose = /\/>$/.test(line);
      var isInline = /^<[^/!][^>]*>[^<]+<\//.test(line);
      if (isClosing) pad = Math.max(0, pad - 1);
      var indent = '  '.repeat(pad);
      var result =
        /^<[^?!]/.test(line) && !isClosing ? formatTagAttrs(line, indent) : indent + line;
      if (!isClosing && !isSelfClose && !isInline && /^<[^?!]/.test(line)) pad++;
      return result;
    })
    .join('\n');
}

// 아이콘 목록에서 Size variant 값 수집 → ["default", "micro"]
function collectIconSizes(icons) {
  var sizes = new Set();
  icons.forEach(function (icon) {
    (icon.variants || []).forEach(function (v) {
      var m = v.match(/^size-(.+)$/);
      if (m) sizes.add(m[1]);
    });
  });
  return Array.from(sizes).sort();
}

// size 이름 → 실제 px 맵핑: SVG viewBox에서 읽음
function collectIconSizePx(icons) {
  var map = {}; // { default: 16, micro: 12, ... }
  icons.forEach(function (icon) {
    var vb = icon.svg.match(/viewBox="0 0 (\d+(?:\.\d+)?)/);
    var px = vb ? Math.round(parseFloat(vb[1])) : 16;
    (icon.variants || []).forEach(function (v) {
      var m = v.match(/^size-(.+)$/);
      if (m && !(m[1] in map)) map[m[1]] = px;
    });
  });
  return map;
}

// icon의 전체 className 문자열 생성: "icon-glyph-android size-default"
function iconClassNames(icon) {
  var base = 'icon-' + icon.kebab;
  var extras = (icon.variants || []).join(' ');
  return extras ? base + ' ' + extras : base;
}

// variant-aware SVG 파일명 생성: "icon-dot--size-md--outline-false"
function iconFileName(icon) {
  var vs = (icon.variants || []).filter(Boolean);
  return 'icon-' + icon.kebab + (vs.length > 0 ? '--' + vs.join('--') : '');
}

// SVG 하이픈 속성명 → JSX camelCase
var JSX_ATTR = {
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'xlink:href': 'href',
  'color-interpolation-filters': 'colorInterpolationFilters',
};

// SVG에 React JSX props 주입 + 포맷팅
// svg 태그는 수동 빌드(JSX 표현식 포함), children만 formatXml
function prepareSvg(processedSvg, classNames) {
  var cleaned = processedSvg.replace(/\s*width="[^"]*"/, '').replace(/\s*height="[^"]*"/, '');

  // 1. svg 태그 기존 XML 속성 추출
  var svgTagMatch = cleaned.match(/<svg([^>]*)>/);
  var svgAttrStr = svgTagMatch ? svgTagMatch[1] : '';
  var xmlAttrs = [];
  var attrRe = /\s+([\w:.-]+)(?:="([^"]*)")?/g,
    hit;
  while ((hit = attrRe.exec(svgAttrStr)) !== null) {
    xmlAttrs.push(hit[2] !== undefined ? hit[1] + '="' + hit[2] + '"' : hit[1]);
  }

  // 2. JSX <svg> 태그 빌드 (항상 속성 줄 나눔)
  // base 클래스에서 size variant 제거 — size는 prop으로만 적용
  var baseCls = classNames
    .split(' ')
    .filter(function (c) {
      return !/^size-/.test(c);
    })
    .join(' ');
  var jsxProps = [
    'width={typeof size === "number" ? size : (size ? undefined : 16)}',
    'height={typeof size === "number" ? size : (size ? undefined : 16)}',
    'className={["icon", ' +
      JSON.stringify(baseCls) +
      ', typeof size === "string" && "size-" + size, className].filter(Boolean).join(" ")}',
    'style={{ ...(color ? { color } : {}), ...style }}',
    '{...props}',
  ].concat(xmlAttrs);
  var svgOpen =
    '<svg\n' +
    jsxProps
      .map(function (p) {
        return '  ' + p;
      })
      .join('\n') +
    '\n>';

  // 3. 내부 children: camelCase 속성 + 자기닫힘 + formatXml
  var inner = cleaned
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg\s*>\s*$/, '')
    .trim();
  if (!inner) return svgOpen + '\n</svg>';

  // 하이픈 속성명 → camelCase
  inner = inner.replace(
    /\b(fill-rule|clip-rule|stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|stroke-miterlimit|stop-color|stop-opacity|font-size|font-family|text-anchor|dominant-baseline)(?==)/g,
    function (attr) {
      return JSX_ATTR[attr] || attr;
    }
  );

  var formatted = applySelfClosing(formatXml(inner));

  var formattedInner = formatted
    .split('\n')
    .map(function (l) {
      return '  ' + l;
    })
    .join('\n');

  return svgOpen + '\n' + formattedInner + '\n</svg>';
}

// React 컴포넌트 body (preview & file 공통)
// iconSizes: ["default", "micro"] → size?: "default" | "micro"
// iconSizes: []                   → size?: string (fallback)
function buildReactBody(name, baseCls, variantClasses, formattedSvg, iconSizes, trailingNewline) {
  var sizeType =
    'number | ' +
    (iconSizes && iconSizes.length > 0
      ? iconSizes
          .map(function (s) {
            return '"' + s + '"';
          })
          .join(' | ')
      : 'string');
  var indentedSvg = formattedSvg
    .split('\n')
    .map(function (l) {
      return '  ' + l;
    })
    .join('\n');
  return (
    'import type { SVGProps } from "react";\n\n' +
    'interface ' +
    name +
    'Props extends Omit<SVGProps<SVGSVGElement>, "color"> {\n' +
    '  size?: ' +
    sizeType +
    ';\n' +
    '  color?: string; // CSS color 값 — style.color 로 적용됨 (fill="currentColor" 상속)\n' +
    '}\n\n' +
    'export const ' +
    name +
    ' = ({ size, color, className, style, ...props }: ' +
    name +
    'Props) => (\n' +
    indentedSvg +
    '\n' +
    ');' +
    (trailingNewline ? '\n' : '')
  );
}

// ── React 컴포넌트 생성 ──
// 모달 미리보기용 — 전체 iconData 기준으로 sizes 수집
function buildReactComponent(icon, processedSvg) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  var sizes = collectIconSizes(iconData);
  return buildReactBody(
    name,
    'icon-' + icon.kebab,
    icon.variants || [],
    prepareSvg(processedSvg, cls),
    sizes,
    false
  );
}

// ZIP 다운로드용 개별 React 파일 생성
function buildReactFile(icon, processedSvg, iconSizes) {
  var name = 'Icon' + icon.pascal;
  var cls = iconClassNames(icon);
  return buildReactBody(
    name,
    'icon-' + icon.kebab,
    icon.variants || [],
    prepareSvg(processedSvg, cls),
    iconSizes,
    true
  );
}

// ZIP 전체 CSS 파일 생성
// allIcons: 사이즈 수집용 전체 목록, icons: CSS 클래스 생성용 (중복제거된) 목록
function buildIconsCss(icons, allIcons) {
  var date = new Date().toISOString().slice(0, 10);
  var sizePxMap = collectIconSizePx(allIcons || icons);
  var sizeEntries = Object.keys(sizePxMap).sort();

  var sizeClasses = sizeEntries.length
    ? sizeEntries
        .map(function (name) {
          var px = sizePxMap[name];
          return '.size-' + name + ' { width: ' + px + 'px; height: ' + px + 'px; }';
        })
        .join('\n') + '\n\n'
    : '';

  var header =
    '/* PixelForge Icon CSS — ' +
    date +
    ' */\n' +
    '/* Usage: <span class="icon icon-android size-default"></span> */\n\n' +
    '.icon {\n' +
    '  display: inline-block;\n' +
    '  width: 1em;\n' +
    '  height: 1em;\n' +
    '  background-color: currentColor;\n' +
    '  mask-repeat: no-repeat;\n' +
    '  mask-size: contain;\n' +
    '  mask-position: center;\n' +
    '  -webkit-mask-repeat: no-repeat;\n' +
    '  -webkit-mask-size: contain;\n' +
    '  -webkit-mask-position: center;\n' +
    '}\n\n' +
    sizeClasses;

  var classes = icons
    .map(function (icon) {
      var fname = iconFileName(icon);
      return (
        '.' + fname + ' {\n' +
        '  mask-image: url("../svg/' + fname + '.svg");\n' +
        '  -webkit-mask-image: url("../svg/' + fname + '.svg");\n' +
        '}'
      );
    })
    .join('\n\n');

  return header + classes + '\n';
}

// ZIP 레지스트리 파일 (Icon.tsx)
function buildIconRegistryFile(icons, iconSizes) {
  if (!icons || icons.length === 0) return '';

  // kebab 기준 중복 제거
  var seen = new Set();
  var uniq = icons.filter(function (icon) {
    if (seen.has(icon.kebab)) return false;
    seen.add(icon.kebab);
    return true;
  });

  var imports = uniq
    .map(function (icon) {
      return 'import { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
    })
    .join('\n');

  var iconNameType = uniq
    .map(function (icon) {
      return '"' + icon.kebab + '"';
    })
    .join(' | ');

  var iconSizeType =
    'number | ' +
    (iconSizes && iconSizes.length > 0
      ? iconSizes
          .map(function (s) {
            return '"' + s + '"';
          })
          .join(' | ')
      : 'string');

  // 하이픈 포함 키는 반드시 따옴표로 감쌈
  var mapEntries = uniq
    .map(function (icon) {
      return '  "' + icon.kebab + '": Icon' + icon.pascal + ',';
    })
    .join('\n');

  return (
    'import type { SVGProps, ComponentType } from "react";\n' +
    imports +
    '\n\n' +
    'export type IconName = ' +
    iconNameType +
    ';\n' +
    'export type IconSize = ' +
    iconSizeType +
    ';\n\n' +
    'interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {\n' +
    '  name: IconName;\n' +
    '  size?: number | IconSize;\n' +
    '  color?: string;\n' +
    '}\n\n' +
    'const ICON_MAP: Record<IconName, ComponentType<Omit<IconProps, "name">>> = {\n' +
    mapEntries +
    '\n' +
    '};\n\n' +
    'export const Icon = ({ name, size, color, className, ...props }: IconProps) => {\n' +
    '  const Comp = ICON_MAP[name];\n' +
    '  return Comp ? <Comp size={size} color={color} className={className} {...props} /> : null;\n' +
    '};\n'
  );
}

// ZIP 배럴 파일 (index.ts)
function buildIndexFile(icons) {
  var exports = icons.map(function (icon) {
    return 'export { Icon' + icon.pascal + ' } from "./Icon' + icon.pascal + '";';
  });
  exports.push('export { Icon, type IconName, type IconSize } from "./Icon";');
  return exports.join('\n') + '\n';
}

// SVG ZIP: svg/ + css/
async function downloadSvgZip(icons) {
  var zip = new JSZip();
  var svgFolder = zip.folder('svg');
  var cssFolder = zip.folder('css');
  icons.forEach(function (icon) {
    var fname = iconFileName(icon);
    svgFolder.file(
      fname + '.svg',
      replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue)
    );
  });
  cssFolder.file('icons.css', buildIconsCss(icons, icons));
  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-svg-' + icons.length + '.zip';
  a.click();
  URL.revokeObjectURL(url);
}

// SVG 코드 ZIP: icons.ts (SVG 문자열 상수 export) + index.ts
async function downloadSvgCodeZip(icons) {
  var date = new Date().toISOString().slice(0, 10);
  var svgMap = {};
  var items = icons
    .map(function (icon) {
      var rawSvg = applySelfClosing(
        formatXml(replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue))
      );
      var fullCls = iconClassNames(icon);
      // SVG 태그에 class 추가 — React 버전과 동일한 클래스명
      rawSvg = rawSvg.replace(/^<svg\b/, '<svg class="' + fullCls + '"');
      // 크기별 고유 key: 사이즈 variant가 있으면 "icon-android--size-default" 형태
      var sizeVariant = (icon.variants || []).find(function (v) {
        return /^size-/.test(v);
      });
      var dataKey = 'icon-' + icon.kebab + (sizeVariant ? '--' + sizeVariant : '');
      svgMap[dataKey] = rawSvg;
      var indented = rawSvg
        .split('\n')
        .map(function (l) {
          return '      ' + l;
        })
        .join('\n');
      var variantBadges = (icon.variants || [])
        .map(function (v) {
          return '<span class="variant-badge">' + v + '</span>';
        })
        .join('');
      return (
        '    <div class="icon-item" data-name="' +
        dataKey +
        '" title="클릭하여 SVG 복사">\n' +
        '      <div class="' +
        fullCls +
        ' icon-node">\n' +
        indented +
        '\n' +
        '      </div>\n' +
        '      <span class="icon-label">icon-' +
        icon.kebab +
        '</span>\n' +
        (variantBadges ? '      <div class="variant-badges">' + variantBadges + '</div>\n' : '') +
        '    </div>'
      );
    })
    .join('\n');

  var html =
    '<!DOCTYPE html>\n' +
    '<html lang="ko">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>PixelForge Icons — ' +
    icons.length +
    ' (' +
    date +
    ')</title>\n' +
    '  <style>\n' +
    '    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; }\n' +
    '    h1 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #0f172a; }\n' +
    '    h1 span { font-size: 13px; font-weight: 400; color: #64748b; margin-left: 8px; }\n' +
    '    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }\n' +
    '    .icon-item { display: flex; flex-direction: column; align-items: center; gap: 8px;\n' +
    '      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 8px 12px;\n' +
    '      cursor: pointer; transition: border-color .15s, background .15s, transform .1s; position: relative; }\n' +
    '    .icon-item:hover { border-color: #6366f1; background: #f5f3ff; transform: translateY(-1px); }\n' +
    '    .icon-item:active { transform: translateY(0); }\n' +
    '    .icon-item.copied { border-color: #22c55e !important; background: #f0fdf4 !important; }\n' +
    '    .icon-node { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: #1e293b; pointer-events: none; }\n' +
    '    .icon-node svg { width: 100%; height: 100%; }\n' +
    '    .icon-label { font-size: 10px; color: #64748b; text-align: center; word-break: break-all; line-height: 1.4; pointer-events: none; }\n' +
    '    .variant-badges { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }\n' +
    '    .variant-badge { font-size: 9px; background: #e0e7ff; color: #4338ca; border-radius: 3px; padding: 1px 4px; pointer-events: none; }\n' +
    '    .copy-badge { position: absolute; top: 6px; right: 6px; font-size: 9px; background: #22c55e;\n' +
    '      color: #fff; border-radius: 4px; padding: 1px 5px; opacity: 0; transition: opacity .2s; pointer-events: none; }\n' +
    '    .icon-item.copied .copy-badge { opacity: 1; }\n' +
    '    #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);\n' +
    '      background: #1e293b; color: #fff; font-size: 13px; padding: 8px 18px; border-radius: 8px;\n' +
    '      opacity: 0; transition: opacity .2s, transform .2s; pointer-events: none; white-space: nowrap; }\n' +
    '    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <h1>PixelForge Icons <span>' +
    icons.length +
    ' icons · ' +
    date +
    '</span></h1>\n' +
    '  <div class="icon-grid">\n' +
    items +
    '\n' +
    '  </div>\n' +
    '  <div id="toast"></div>\n' +
    '  <script>\n' +
    '    var SVG_DATA = ' +
    JSON.stringify(svgMap) +
    ';\n' +
    '    var toast = document.getElementById("toast");\n' +
    '    var toastTimer;\n' +
    '    function showToast(msg) {\n' +
    '      toast.textContent = msg;\n' +
    '      toast.classList.add("show");\n' +
    '      clearTimeout(toastTimer);\n' +
    '      toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 1800);\n' +
    '    }\n' +
    '    document.querySelector(".icon-grid").addEventListener("click", function(e) {\n' +
    '      var item = e.target.closest(".icon-item");\n' +
    '      if (!item) return;\n' +
    '      var name = item.dataset.name;\n' +
    '      var svg = SVG_DATA[name] || "";\n' +
    '      navigator.clipboard.writeText(svg).then(function() {\n' +
    '        item.classList.add("copied");\n' +
    '        setTimeout(function() { item.classList.remove("copied"); }, 1500);\n' +
    '        showToast(name + " SVG 복사됨");\n' +
    '      });\n' +
    '    });\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>\n';

  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-preview-' + icons.length + '.html';
  a.click();
  URL.revokeObjectURL(url);
}

// React ZIP: react/ (tsx 개별 파일 + index.ts)
async function downloadReactZip(icons) {
  // kebab 기준 중복 제거 — index.ts / Icon.tsx 모두 동일 목록 사용
  var seenKebab = new Set();
  icons = icons.filter(function (icon) {
    if (seenKebab.has(icon.kebab)) return false;
    seenKebab.add(icon.kebab);
    return true;
  });

  var zip = new JSZip();
  var reactFolder = zip.folder('react');
  var iconSizes = collectIconSizes(icons);
  icons.forEach(function (icon) {
    var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
    reactFolder.file('Icon' + icon.pascal + '.tsx', buildReactFile(icon, processed, iconSizes));
  });
  reactFolder.file('Icon.tsx', buildIconRegistryFile(icons, iconSizes));
  reactFolder.file('index.ts', buildIndexFile(icons));
  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-react-' + icons.length + '.zip';
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSS 코드 생성 ──
// ── 검색 필터 ──
function filterIcons(query) {
  iconSearchQuery = query.trim().toLowerCase();
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
  if (!iconSearchQuery) {
    iconFilteredData = iconData.slice();
  } else {
    iconFilteredData = iconData.filter(function (icon) {
      return (
        icon.name.toLowerCase().indexOf(iconSearchQuery) !== -1 ||
        icon.kebab.toLowerCase().indexOf(iconSearchQuery) !== -1
      );
    });
  }
  renderIconGrid();
  updateFilterCount();
}

// ── 검색 결과 카운트 ──
function updateFilterCount() {
  var countEl = $('iconFilterCount');
  if (!countEl) return;
  if (!iconSearchQuery) {
    countEl.textContent = iconData.length + (lang === 'ko' ? '개' : ' icons');
  } else {
    countEl.textContent =
      iconFilteredData.length + '/' + iconData.length + (lang === 'ko' ? '개' : '');
  }
}

// ── 아이콘 그리드 렌더링 ──
function renderIconGrid() {
  var list = $('iconList');
  var data = iconFilteredData;
  if (data.length === 0) {
    if (iconSearchQuery) {
      list.innerHTML =
        '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;grid-column:1/-1;">' +
        t('icon.noSearchResult') +
        '</div>';
    } else {
      list.innerHTML =
        '<div style="text-align:center;padding:32px 20px;color:var(--text-muted);font-size:12px;grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:12px;">' +
        '<span>' + t('icon.noIcons') + '</span>' +
        '<button id="iconReExtractBtn" class="btn-secondary" style="font-size:12px;padding:6px 16px;">' +
        (lang === 'ko' ? '다시 추출' : 'Re-extract') +
        '</button>' +
        '</div>';
      var reBtn = $('iconReExtractBtn');
      if (reBtn) {
        reBtn.addEventListener('click', function () {
          $('iconResults').classList.add('hidden');
        });
      }
    }
    return;
  }
  list.innerHTML = data
    .map(function (icon, idx) {
      var isSelected = iconSelectedIdx === idx;
      return (
        '<div class="icon-card' +
        (isSelected ? ' selected' : '') +
        '" data-idx="' +
        idx +
        '">' +
        '<div class="icon-card-preview">' +
        cleanSvg(icon.svg) +
        '</div>' +
        '<div class="icon-card-name">' +
        escapeHtml(icon.name) +
        '</div>' +
        '<div class="icon-card-actions">' +
        '<button class="btn-ghost icon-copy-btn" data-idx="' +
        idx +
        '" data-action="svg" style="height:24px;padding:0 6px;font-size:9px;">SVG</button>' +
        '<button class="btn-ghost icon-copy-btn" data-idx="' +
        idx +
        '" data-action="react" style="height:24px;padding:0 6px;font-size:9px;">React</button>' +
        '</div>' +
        '</div>'
      );
    })
    .join('');
}

// ── 상세 패널 코드 업데이트 ──
function updateDetailCode() {
  if (iconSelectedIdx === null) return;
  var icon = iconFilteredData[iconSelectedIdx];
  if (!icon) return;

  var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
  var code = iconDetailTab === 'react' ? buildReactComponent(icon, processed) : processed;
  $('iconDetailCode').innerHTML = highlightTSX(code);

  // 썸네일 색상 반영 (custom 모드)
  if (iconColorMode === 'custom') {
    var thumb = $('iconDetailThumb');
    thumb.style.color = iconColorValue;
  }
}

// ── 아이콘 선택 → 상세 패널 ──
function selectIcon(idx) {
  // toggle: 같은 아이콘 재클릭 시 닫기
  if (iconSelectedIdx === idx) {
    iconSelectedIdx = null;
    $('iconDetailBackdrop').classList.add('hidden');
    renderIconGrid();
    return;
  }
  iconSelectedIdx = idx;
  var icon = iconFilteredData[idx];
  if (!icon) return;

  renderIconGrid();
  $('iconDetailName').textContent = icon.name;
  var thumb = $('iconDetailThumb');
  thumb.innerHTML = replaceSvgColor(cleanSvg(icon.svg), 'currentColor', 'currentColor');
  thumb.style.color = '';
  $('iconDetailBackdrop').classList.remove('hidden');
  iconDetailTab = 'svg';
  document.querySelectorAll('.icon-detail-tab').forEach(function (tab) {
    tab.classList.toggle('active', tab.dataset.detailTab === 'svg');
  });
  updateDetailCode();
}

// ── Icon mode sync with global scope ──
export function syncIconMode() {
  iconMode = getScope();
  $('iconModeAll').style.display = iconMode === 'all' ? 'block' : 'none';
  $('iconModeSelection').style.display = iconMode === 'selection' ? 'block' : 'none';
}

export function updateIconSelInfo() {
  var info = $('iconSelInfo');
  if (state.lastSelection.count > 0) {
    info.textContent =
      state.lastSelection.count +
      t('icon.selected') +
      ' — ' +
      state.lastSelection.names.slice(0, 3).join(', ') +
      (state.lastSelection.count > 3 ? ' ' + t('extract.more') + (state.lastSelection.count - 3) : '');
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = '0' + t('icon.selected');
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

// 전체 추출
exportIconsAllBtn.addEventListener('click', function () {
  exportIconsAllBtn.disabled = true;
  exportIconsAllBtn.textContent = t('icon.extracting');
  parent.postMessage({ pluginMessage: { type: 'export-icons-all' } }, '*');
});

// 선택 추출
exportIconsBtn.addEventListener('click', function () {
  if (state.lastSelection.count === 0) {
    showToast(t('icon.selectFirst'));
    return;
  }
  exportIconsBtn.disabled = true;
  exportIconsBtn.textContent = t('icon.extracting');
  parent.postMessage({ pluginMessage: { type: 'export-icons' } }, '*');
});

// ── 캐시 배지 ──
export function showCacheBadge(savedAt) {
  var badge = $('iconCacheBadge');
  var label = $('iconCacheSavedAt');
  if (!badge || !label) return;
  var date = new Date(savedAt);
  var fmt =
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0') +
    ' ' +
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0');
  label.textContent = (lang === 'ko' ? '캐시 · ' : 'cached · ') + fmt;
  badge.classList.remove('hidden');
}
export function hideCacheBadge() {
  var badge = $('iconCacheBadge');
  if (badge) badge.classList.add('hidden');
}
try { $('iconCacheClearBtn').addEventListener('click', function () {
  parent.postMessage({ pluginMessage: { type: 'clear-icon-cache' } }, '*');
}); } catch(e) { showToast('[icons init] iconCacheClearBtn: ' + e.message); }

export function renderIconResults(data) {
  iconRawData = data;
  iconData = flattenIconSets(data);
  iconFilteredData = iconData.slice();
  iconSearchQuery = '';
  iconSelectedIdx = null;

  $('iconCount').textContent = iconData.length;
  $('iconResults').classList.remove('hidden');
  $('iconDetailBackdrop').classList.add('hidden');
  var iconResultBar = $('iconResultBar');
  if (iconResultBar) iconResultBar.classList.toggle('hidden', data.length === 0);

  // 검색바 표시 (아이콘이 있을 때만)
  var searchRow = $('iconSearchRow');
  searchRow.classList.toggle('hidden', data.length === 0);
  $('iconSearchInput').value = '';
  $('iconSearchClear').classList.add('hidden');

  updateFilterCount();
  renderIconGrid();
}

// SVG 정리: xml 선언, 불필요 속성 제거, viewBox 보존
function cleanSvg(svg) {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+xmlns:xlink="[^"]*"/g, '')
    .trim();
}

// 이벤트 위임: 아이콘 카드 클릭 + 복사 버튼
try { $('iconList').addEventListener('click', function (e) {
  var btn = e.target.closest('.icon-copy-btn');
  if (btn) {
    var idx = parseInt(btn.dataset.idx, 10);
    var action = btn.dataset.action;
    var icon = iconFilteredData[idx];
    if (!icon) return;
    if (action === 'svg') {
      var processed = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
      copyToClipboard(processed);
      showToast(t('icon.copySvg'));
    } else if (action === 'react') {
      var processed2 = replaceSvgColor(cleanSvg(icon.svg), iconColorMode, iconColorValue);
      copyToClipboard(buildReactComponent(icon, processed2));
      showToast(t('icon.copyReact'));
    }
    return;
  }
  var card = e.target.closest('.icon-card');
  if (card) {
    selectIcon(parseInt(card.dataset.idx, 10));
  }
}); } catch(e) { showToast('[icons init] iconList: ' + e.message); }

// ── 검색 이벤트 ──
var iconSearchDebounceTimer = null;
try { $('iconSearchInput').addEventListener('input', function () {
  var q = this.value;
  $('iconSearchClear').classList.toggle('hidden', q === '');
  clearTimeout(iconSearchDebounceTimer);
  iconSearchDebounceTimer = setTimeout(function () {
    filterIcons(q);
  }, 150);
}); } catch(e) { showToast('[icons init] iconSearchInput: ' + e.message); }
try { $('iconSearchClear').addEventListener('click', function () {
  $('iconSearchInput').value = '';
  $('iconSearchClear').classList.add('hidden');
  filterIcons('');
  $('iconSearchInput').focus();
}); } catch(e) { showToast('[icons init] iconSearchClear: ' + e.message); }

// ── 상세 패널 탭 ──
document.addEventListener('click', function (e) {
  var tab = e.target.closest('.icon-detail-tab');
  if (!tab) return;
  iconDetailTab = tab.dataset.detailTab;
  document.querySelectorAll('.icon-detail-tab').forEach(function (t2) {
    t2.classList.toggle('active', t2.dataset.detailTab === iconDetailTab);
  });
  updateDetailCode();
});

// ── 색상 모드 변경 ──
try { $('iconColorModeSelect').addEventListener('change', function () {
  iconColorMode = this.value;
  $('iconColorVarInput').classList.toggle('hidden', iconColorMode !== 'cssVar');
  $('iconColorPicker').classList.toggle('hidden', iconColorMode !== 'custom');
  if (iconColorMode === 'currentColor') iconColorValue = 'currentColor';
  if (iconColorMode === 'cssVar') iconColorValue = $('iconColorVarInput').value || '--icon-color';
  if (iconColorMode === 'custom') iconColorValue = $('iconColorPicker').value;
  updateDetailCode();
}); } catch(e) { showToast('[icons init] iconColorModeSelect: ' + e.message); }
try { $('iconColorVarInput').addEventListener('input', function () {
  iconColorValue = this.value || '--icon-color';
  updateDetailCode();
}); } catch(e) { showToast('[icons init] iconColorVarInput: ' + e.message); }
try { $('iconColorPicker').addEventListener('input', function () {
  iconColorValue = this.value;
  updateDetailCode();
}); } catch(e) { showToast('[icons init] iconColorPicker: ' + e.message); }

// ── 상세 패널 닫기 / 복사 ──
function closeIconModal() {
  iconSelectedIdx = null;
  $('iconDetailBackdrop').classList.add('hidden');
  renderIconGrid();
}
try { $('iconDetailClose').addEventListener('click', closeIconModal);
} catch(e) { showToast('[icons init] iconDetailClose: ' + e.message); }
try { $('iconDetailBackdrop').addEventListener('click', function (e) {
  if (e.target === this) closeIconModal();
}); } catch(e) { showToast('[icons init] iconDetailBackdrop: ' + e.message); }
try { $('iconDetailCopyBtn').addEventListener('click', function () {
  copyToClipboard($('iconDetailCode').textContent);
  showToast(t('icon.detailCopied'));
}); } catch(e) { showToast('[icons init] iconDetailCopyBtn: ' + e.message); }

// Node JSON 저장
try { $('iconCopyAllBtn').addEventListener('click', function () {
  if (iconData.length === 0) { showToast(t('icon.noIcons')); return; }
  var sections = iconRawData.reduce(function(acc, ic) {
    if (ic.section && acc.indexOf(ic.section) === -1) acc.push(ic.section);
    return acc;
  }, []);
  var variantCount = iconData.length;
  var payload = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalCount: iconRawData.length,
      variantCount: variantCount,
      sections: sections,
    },
    icons: iconRawData,
  };
  var json = JSON.stringify(payload, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'icons-node-' + variantCount + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(lang === 'ko' ? 'icons-node-' + variantCount + '.json 저장됨' : 'Saved icons-node-' + variantCount + '.json');
}); } catch(e) { showToast('[icons init] iconCopyAllBtn: ' + e.message); }

// SVG ZIP 다운로드
try { $('iconDownloadSvgBtn').addEventListener('click', function () {
  if (iconData.length === 0) {
    showToast(t('icon.noIcons'));
    return;
  }
  $('iconDownloadSvgBtn').disabled = true;
  $('iconDownloadSvgBtn').textContent = t('icon.extracting');
  downloadSvgZip(iconData)
    .then(function () {
      $('iconDownloadSvgBtn').disabled = false;
      $('iconDownloadSvgBtn').textContent = t('icon.downloadSvg');
      showToast(t('icon.downloadSvgDone'));
    })
    .catch(function () {
      $('iconDownloadSvgBtn').disabled = false;
      $('iconDownloadSvgBtn').textContent = t('icon.downloadSvg');
    });
}); } catch(e) { showToast('[icons init] iconDownloadSvgBtn: ' + e.message); }

// React ZIP 다운로드
try { $('iconDownloadReactBtn').addEventListener('click', function () {
  if (iconData.length === 0) {
    showToast(t('icon.noIcons'));
    return;
  }
  $('iconDownloadReactBtn').disabled = true;
  $('iconDownloadReactBtn').textContent = t('icon.extracting');
  downloadReactZip(iconData)
    .then(function () {
      $('iconDownloadReactBtn').disabled = false;
      $('iconDownloadReactBtn').textContent = t('icon.downloadReact');
      showToast(t('icon.downloadReactDone'));
    })
    .catch(function () {
      $('iconDownloadReactBtn').disabled = false;
      $('iconDownloadReactBtn').textContent = t('icon.downloadReact');
    });
}); } catch(e) { showToast('[icons init] iconDownloadReactBtn: ' + e.message); }

// ── PixelForge Send ──
var pfSendIconsBtn = $('pfSendIconsBtn');
if (pfSendIconsBtn) {
  pfSendIconsBtn.addEventListener('click', async function () {
    if (!iconData || iconData.length === 0) {
      showToast(t('icon.noIcons'));
      return;
    }
    pfSendIconsBtn.disabled = true;
    pfSendIconsBtn.textContent = t('settings.sending');
    try {
      var sections = iconRawData.reduce(function(acc, ic) {
        if (ic.section && acc.indexOf(ic.section) === -1) acc.push(ic.section);
        return acc;
      }, []);
      var result = await sendToPixelForge('/api/sync/icons', {
        meta: {
          extractedAt: new Date().toISOString(),
          totalCount: iconRawData.length,
          variantCount: iconData.length,
          sections: sections,
        },
        icons: iconRawData,
      });
      if (result) showToast(t('settings.sendSuccess'));
    } finally {
      pfSendIconsBtn.disabled = false;
      pfSendIconsBtn.textContent = t('settings.sendBtn');
    }
  });
}
