'use strict';

// ─── TYPE_KEYWORDS — 컴포넌트 타입 감지용 키워드 ────────────────────────────
export var TYPE_KEYWORDS = {
  button:              ['button', 'btn', 'cta', 'action'],
  'icon-button':       ['icon-button', 'icon-btn', 'iconbutton'],
  dialog:              ['dialog', 'modal', 'popup', 'sheet'],
  'alert-dialog':      ['alert-dialog', 'confirm-dialog', 'alert dialog', 'confirm'],
  tabs:                ['tab', 'tabs', 'tabbar'],
  'tab-nav':           ['tab-nav', 'tabnav', 'navigation-tab'],
  select:              ['select', 'combobox', 'picker'],
  'dropdown-menu':     ['dropdown', 'dropdown-menu', 'action-menu'],
  'context-menu':      ['context-menu', 'right-click'],
  tooltip:             ['tooltip', 'hint', 'popover-tip'],
  popover:             ['popover', 'flyout'],
  'hover-card':        ['hover-card', 'preview-card'],
  checkbox:            ['checkbox', 'check'],
  switch:              ['switch'],
  'radio-group':       ['radio', 'radio-group', 'option-group'],
  slider:              ['slider', 'range'],
  'segmented-control': ['segmented', 'segment', 'toggle-group', 'toggle group'],
  accordion:           ['accordion', 'collapse', 'expand'],
  badge:               ['badge', 'chip', 'tag', 'pill'],
  avatar:              ['avatar', 'profile-pic', 'user-icon'],
  card:                ['card', 'tile'],
  progress:            ['progress', 'progress-bar', 'loading-bar'],
  separator:           ['separator', 'divider', 'hr'],
  spinner:             ['spinner', 'loading'],
  'data-list':         ['data-list', 'datalist', 'key-value', 'definition'],
  kbd:                 ['kbd', 'keyboard', 'shortcut', 'hotkey'],
  code:                ['code', 'inline-code'],
  link:                ['link', 'anchor'],
  blockquote:          ['blockquote', 'quote', 'citation'],
};

// ─── RADIX_COMPONENT_REGISTRY ───────────────────────────────────────────────
/**
 * 모든 Radix 컴포넌트를 내재화한 단일 참조 소스.
 * themeComponent: true → import { X } from '@radix-ui/themes'
 * themeComponent: false → import * as X from '@radix-ui/react-*'
 */
export var RADIX_COMPONENT_REGISTRY = {
  /* ── Radix Themes — import { X } from '@radix-ui/themes' ── */
  'layout':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'heading':           { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'text':              { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'code':              { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'link':              { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'blockquote':        { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'kbd':               { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'em':                { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'strong':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'button':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'icon-button':       { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'checkbox':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'switch':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'slider':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'radio-group':       { pkg: '@radix-ui/themes', ns: 'RadioGroup',   themeComponent: true },
  'segmented-control': { pkg: '@radix-ui/themes', ns: 'SegmentedControl', themeComponent: true },
  'input':             { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'textarea':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'dialog':            { pkg: '@radix-ui/themes', ns: 'Dialog',       themeComponent: true },
  'alert-dialog':      { pkg: '@radix-ui/themes', ns: 'AlertDialog',  themeComponent: true },
  'tabs':              { pkg: '@radix-ui/themes', ns: 'Tabs',         themeComponent: true },
  'tab-nav':           { pkg: '@radix-ui/themes', ns: 'TabNav',       themeComponent: true },
  'select':            { pkg: '@radix-ui/themes', ns: 'Select',       themeComponent: true },
  'dropdown-menu':     { pkg: '@radix-ui/themes', ns: 'DropdownMenu', themeComponent: true },
  'context-menu':      { pkg: '@radix-ui/themes', ns: 'ContextMenu',  themeComponent: true },
  'popover':           { pkg: '@radix-ui/themes', ns: 'Popover',      themeComponent: true },
  'hover-card':        { pkg: '@radix-ui/themes', ns: 'HoverCard',    themeComponent: true },
  'tooltip':           { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'avatar':            { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'badge':             { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'card':              { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'callout':           { pkg: '@radix-ui/themes', ns: 'Callout',      themeComponent: true },
  'data-list':         { pkg: '@radix-ui/themes', ns: 'DataList',     themeComponent: true },
  'table':             { pkg: '@radix-ui/themes', ns: 'Table',        themeComponent: true },
  'separator':         { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'progress':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'skeleton':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'spinner':           { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'scroll-area':       { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'aspect-ratio':      { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'checkbox-cards':    { pkg: '@radix-ui/themes', ns: 'CheckboxCards', themeComponent: true },
  'checkbox-group':    { pkg: '@radix-ui/themes', ns: null,           themeComponent: true },
  'radio-cards':       { pkg: '@radix-ui/themes', ns: 'RadioCards',   themeComponent: true },

  /* ── Radix Primitives — Themes 미제공 ── */
  'accordion':         { pkg: '@radix-ui/react-accordion',        ns: 'Accordion',      themeComponent: false },
  'collapsible':       { pkg: '@radix-ui/react-collapsible',      ns: 'Collapsible',    themeComponent: false },
  'navigation-menu':   { pkg: '@radix-ui/react-navigation-menu', ns: 'NavigationMenu', themeComponent: false },
};

export var RADIX_MAP = Object.keys(RADIX_COMPONENT_REGISTRY).reduce(function(acc, key) {
  acc[key] = RADIX_COMPONENT_REGISTRY[key].pkg || null;
  return acc;
}, {});

export var SEMANTIC_TAGS = {
  header: 'header', gnb: 'header', nav: 'nav', footer: 'footer',
  sidebar: 'aside', card: 'article', item: 'article',
  section: 'section', panel: 'section',
};

export function detectComponentType(nodeName) {
  var lower = nodeName.toLowerCase();
  var types = Object.keys(TYPE_KEYWORDS);
  for (var i = 0; i < types.length; i++) {
    var kws = TYPE_KEYWORDS[types[i]];
    for (var j = 0; j < kws.length; j++) {
      if (lower.indexOf(kws[j]) !== -1) return types[i];
    }
  }
  return 'layout';
}

export function getSemanticTag(nodeName) {
  var lower = nodeName.toLowerCase();
  var keys = Object.keys(SEMANTIC_TAGS);
  for (var i = 0; i < keys.length; i++) {
    if (lower.indexOf(keys[i]) !== -1) return SEMANTIC_TAGS[keys[i]];
  }
  return 'div';
}

export function compToPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, function (_, c) { return c.toUpperCase(); })
    .replace(/^(.)/, function (c) { return c.toUpperCase(); });
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

export var LAYOUT_STYLE_KEYS = ['width', 'height', 'display', 'flex-direction', 'flex-wrap', 'gap', 'padding', 'margin', 'position', 'top', 'left', 'right', 'bottom', 'overflow', 'align-items', 'justify-content'];

export function filterTypographyStyles(styles) {
  if (!styles) return {};
  return Object.keys(styles).reduce(function (acc, k) {
    if (!LAYOUT_STYLE_KEYS.includes(k)) acc[k] = styles[k];
    return acc;
  }, {});
}

export function stylesToCSSProps(styles) {
  if (!styles) return '';
  return Object.keys(styles)
    .map(function (k) { return '  ' + k + ': ' + styles[k] + ';'; })
    .join('\n');
}

function _imp(names) {
  return "import { " + names + " } from '@radix-ui/themes';";
}

function _pt(name, body, useTs) {
  return useTs ? 'interface ' + name + 'Props {\n' + body + '\n}\n\n' : '';
}

// ─── HTML/JSX 파싱 — Figma 구조에서 variant 정보 추출 ──────────────────────────

/**
 * Figma HTML 문자열에서 색상·크기 변형 정보를 추출한다.
 * 반환: { colorVariants: [{name, cssVar}], sizeVariants: [{name, padding, gap}], borderRadius }
 */
function parseVariantsFromHtml(html) {
  if (!html) return { colorVariants: [], sizeVariants: [], borderRadius: '' };

  var colorVariants = [];
  var sizeVariants  = [];
  var seenVars      = {};
  var seenPaddings  = {};

  // ── 색상 변형: background-color:var(--x) 바로 뒤에 오는 <span>텍스트 패턴 ──
  // ex) background-color: var(--blue-bright); ... ><span>Primary</span>
  var colorRe = /background-color:\s*(var\([^)]+\))[^>]*>(?:\s*<[^/][^>]*>\s*)*\s*<span>([^<]+)<\/span>/g;
  var m;
  while ((m = colorRe.exec(html)) !== null) {
    var cssVar = m[1];
    var raw    = m[2].trim().toLowerCase().replace(/\s+/g, '-');
    if (!seenVars[cssVar]) {
      seenVars[cssVar] = true;
      colorVariants.push({ name: raw, cssVar: cssVar });
    }
  }

  // ── 크기 변형: style 속성에서 padding + gap 함께 추출 ────────────────────────
  // ex) style="...; gap: 10px; padding: 7px 12px 7px 12px"
  var styleAttrRe = /style="([^"]+)"/g;
  while ((m = styleAttrRe.exec(html)) !== null) {
    var styleStr = m[1];
    var pMatch = styleStr.match(/padding:\s*([\d.]+px\s+[\d.]+px(?:\s+[\d.]+px\s+[\d.]+px)?)/);
    if (!pMatch) continue;
    var raw = pMatch[1].trim();
    // CSS shorthand 정규화: "Apx Bpx Apx Bpx" → "Apx Bpx"
    var parts = raw.split(/\s+/);
    var p = (parts.length === 4 && parts[0] === parts[2] && parts[1] === parts[3])
      ? parts[0] + ' ' + parts[1]
      : raw;
    if (seenPaddings[p]) continue;
    seenPaddings[p] = true;
    var gMatch = styleStr.match(/gap:\s*([\d.]+px)/);
    sizeVariants.push({ padding: p, gap: gMatch ? gMatch[1] : null });
  }
  // 세로(첫 번째) padding 값 기준 오름차순 → small/medium/large 순서 보장
  sizeVariants.sort(function(a, b) {
    return parseFloat(a.padding) - parseFloat(b.padding);
  });
  var sizeLabels = ['small', 'medium', 'large', 'xlarge'];
  sizeVariants = sizeVariants.map(function(v, i) {
    return { name: sizeLabels[i] || ('size-' + (i + 1)), padding: v.padding, gap: v.gap };
  });

  // ── root border-radius 추출 ───────────────────────────────────────────────
  var brMatch = html.match(/border-radius:\s*([\d.]+px)/);
  var borderRadius = brMatch ? brMatch[1] : '';

  return { colorVariants: colorVariants, sizeVariants: sizeVariants, borderRadius: borderRadius };
}

/**
 * 파싱된 variant 정보로 CSS module 내용을 생성한다.
 */
function buildButtonCSS(parsed) {
  var lines = [];

  // .root — 구조/공통 스타일 (Radix 기본 시각 스타일 초기화)
  lines.push('.root {');
  lines.push('  all: unset;');
  lines.push('  box-sizing: border-box;');
  lines.push('  display: inline-flex;');
  lines.push('  align-items: center;');
  lines.push('  justify-content: center;');
  lines.push('  cursor: pointer;');
  if (parsed.borderRadius) lines.push('  border-radius: ' + parsed.borderRadius + ';');
  lines.push('}');
  lines.push('');

  if (parsed.colorVariants.length > 0) {
    lines.push('/* Color variants */');
    parsed.colorVariants.forEach(function(v) {
      lines.push('.' + v.name + ' { background-color: ' + v.cssVar + '; }');
    });
    lines.push('');
  }

  if (parsed.sizeVariants.length > 0) {
    lines.push('/* Size variants */');
    parsed.sizeVariants.forEach(function(v) {
      var decls = 'padding: ' + v.padding + ';';
      if (v.gap) decls += ' gap: ' + v.gap + ';';
      lines.push('.' + v.name + ' { ' + decls + ' }');
    });
    lines.push('');
  }

  lines.push('.root:disabled,');
  lines.push('.root[disabled] {');
  lines.push('  opacity: 0.4;');
  lines.push('  cursor: not-allowed;');
  lines.push('}');

  return lines.join('\n');
}

/**
 * texts.all에서 디자인 시스템 사이즈 라벨을 추출한다.
 * ex) ["xsmall","small","default","large","xlarge","xxlarge"]
 */
var KNOWN_SIZE_LABELS = [
  'xsmall','xs','small','sm','default','base','normal',
  'medium','md','large','lg','xlarge','xl','xxlarge','xxl','2xl','3xl','4xl',
];
function parseSizeLabelsFromTexts(texts) {
  var all = (texts && texts.all) || [];
  var result = [];
  var seen = {};
  all.forEach(function(t) {
    var lower = (t || '').toLowerCase().trim();
    if (KNOWN_SIZE_LABELS.indexOf(lower) !== -1 && !seen[lower]) {
      seen[lower] = true;
      result.push(lower);
    }
  });
  return result;
}

/**
 * texts.all에서 굵기(weight) 라벨을 추출한다.
 */
var KNOWN_WEIGHT_LABELS = ['thin','light','regular','normal','medium','semibold','bold','extrabold','black'];
function parseWeightLabelsFromTexts(texts) {
  var all = (texts && texts.all) || [];
  var result = [];
  var seen = {};
  all.forEach(function(t) {
    var lower = (t || '').toLowerCase().trim();
    if (KNOWN_WEIGHT_LABELS.indexOf(lower) !== -1 && !seen[lower]) {
      seen[lower] = true;
      result.push(lower);
    }
  });
  return result;
}

/**
 * 사이즈 라벨 배열 → CSS module 내용 생성 (typography 전용).
 * font 값은 Figma HTML에서 추출 불가이므로 CSS 변수 참조 형태로 생성.
 */
function buildTypographyCSS(sizeLabels, weightLabels) {
  var lines = ['.root { }', ''];
  if (sizeLabels.length > 0) {
    lines.push('/* Size variants — map to your design system typography tokens */');
    sizeLabels.forEach(function(s) {
      lines.push('.' + s + ' { font-size: var(--font-size-' + s + '); }');
    });
    lines.push('');
  }
  if (weightLabels.length > 0) {
    lines.push('/* Weight variants */');
    weightLabels.forEach(function(w) {
      lines.push('.' + w + ' { font-weight: var(--font-weight-' + w + '); }');
    });
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/**
 * Badge/Callout 등 배경색 변형 컴포넌트용 CSS 생성.
 * Button의 buildButtonCSS와 동일 패턴, size 없이 color만.
 */
function buildColorVariantCSS(parsed, extraRootCss) {
  var lines = [];
  lines.push('.root {');
  lines.push('  all: unset;');
  lines.push('  box-sizing: border-box;');
  lines.push('  display: inline-flex;');
  lines.push('  align-items: center;');
  if (parsed.borderRadius) lines.push('  border-radius: ' + parsed.borderRadius + ';');
  if (extraRootCss) lines.push(extraRootCss);
  lines.push('}');
  lines.push('');
  if (parsed.colorVariants.length > 0) {
    lines.push('/* Color variants */');
    parsed.colorVariants.forEach(function(v) {
      lines.push('.' + v.name + ' { background-color: ' + v.cssVar + '; }');
    });
  }
  return lines.join('\n');
}

// ─── CSS Modules 빌더 — Radix Themes 기준 ───────────────────────────────────

function _rp(d) {
  return (d && d.radixProps) || {};
}

function buildButtonCSSModules(d, name, useTs) {
  var parsed = parseVariantsFromHtml(d.html || '');
  var colorVs = parsed.colorVariants;
  var sizeVs  = parsed.sizeVariants;

  // variant union: Figma에서 추출된 색상 변형 이름
  var variantNames = colorVs.length > 0
    ? colorVs.map(function(v) { return v.name; })
    : ['default'];
  var variantUnion = variantNames.map(function(n) { return '"' + n + '"'; }).join(' | ');
  var defaultVariant = variantNames[0];

  // size union: Figma에서 추출된 크기 변형 이름
  var sizeNames = sizeVs.length > 0
    ? sizeVs.map(function(v) { return v.name; })
    : ['medium'];
  var sizeUnion = sizeNames.map(function(n) { return '"' + n + '"'; }).join(' | ');
  // 중간값을 기본 크기로 사용
  var defaultSize = sizeNames[Math.floor(sizeNames.length / 2)] || sizeNames[0];

  // children 기본 텍스트: texts.all에서 짧고 '/' 없는 텍스트 우선
  var candidateTexts = (d.texts && d.texts.all) || [];
  var buttonLabel = candidateTexts.find(function(t) {
    return t && t.length < 30 && !t.includes('/');
  }) || defaultVariant;

  var propsBody = [
    '  onClick?: () => void;',
    '  disabled?: boolean;',
    '  variant?: ' + variantUnion + ';',
    '  size?: ' + sizeUnion + ';',
    '  children?: React.ReactNode;',
  ].join('\n');

  var destructure = useTs
    ? '{ onClick, disabled, variant = "' + defaultVariant + '", size = "' + defaultSize + '", children }: ' + name + 'Props'
    : '{ onClick, disabled, variant = "' + defaultVariant + '", size = "' + defaultSize + '", children }';

  return (
    _imp('Button') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsBody, useTs) +
    'export const ' + name + ' = (' + destructure + ') => (\n' +
    '  <Button\n' +
    '    onClick={onClick}\n' +
    '    disabled={disabled}\n' +
    '    className={`${styles.root} ${styles[variant]} ${styles[size]}`}\n' +
    '  >\n' +
    '    {children ?? \'' + buttonLabel + '\'}\n' +
    '  </Button>\n' +
    ');'
  );
}

function buildIconButtonCSSModules(d, name, useTs) {
  return (
    _imp('IconButton') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ onClick, disabled, children }: ' + name + 'Props' : '{ onClick, disabled, children }') +
    ") => (\n  <IconButton onClick={onClick} disabled={disabled} className={styles.root}>\n    {children ?? '\\u2605'}\n  </IconButton>\n);"
  );
}

function buildDialogCSSModules(d, name, useTs) {
  var title = (d.texts && d.texts.title) || 'Dialog Title';
  var desc = (d.texts && d.texts.description) || '';
  var cancel = (d.texts && d.texts.actions && d.texts.actions[0]) || 'Cancel';
  var confirm = (d.texts && d.texts.actions && d.texts.actions[1]) || 'Confirm';
  var descBlock = desc
    ? '\n        <Dialog.Description size="2">\n          ' + desc + '\n        </Dialog.Description>'
    : '';
  return (
    _imp('Dialog, Button, Flex') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  open?: boolean;\n  onOpenChange?: (open: boolean) => void;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }') +
    ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Trigger>\n      <Button variant="soft">Open</Button>\n    </Dialog.Trigger>\n    <Dialog.Content maxWidth="450px" className={styles.root}>\n      <Dialog.Title>' + title + '</Dialog.Title>' +
    descBlock +
    '\n      <Flex gap="3" mt="4" justify="end">\n        <Dialog.Close>\n          <Button variant="soft" color="gray">' + cancel + '</Button>\n        </Dialog.Close>\n        <Dialog.Close>\n          <Button>' + confirm + '</Button>\n        </Dialog.Close>\n      </Flex>\n    </Dialog.Content>\n  </Dialog.Root>\n);'
  );
}

function buildAlertDialogCSSModules(d, name, useTs) {
  var title = (d.texts && d.texts.title) || 'Confirm';
  var desc = (d.texts && d.texts.description) || 'Are you sure?';
  var cancel = (d.texts && d.texts.actions && d.texts.actions[0]) || 'Cancel';
  var action = (d.texts && d.texts.actions && d.texts.actions[1]) || 'Confirm';
  return (
    _imp('AlertDialog, Button, Flex') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  open?: boolean;\n  onOpenChange?: (open: boolean) => void;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }') +
    ') => (\n  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>\n    <AlertDialog.Trigger>\n      <Button color="red">Delete</Button>\n    </AlertDialog.Trigger>\n    <AlertDialog.Content maxWidth="450px" className={styles.root}>\n      <AlertDialog.Title>' + title + '</AlertDialog.Title>\n      <AlertDialog.Description size="2">\n        ' + desc + '\n      </AlertDialog.Description>\n      <Flex gap="3" mt="4" justify="end">\n        <AlertDialog.Cancel>\n          <Button variant="soft" color="gray">' + cancel + '</Button>\n        </AlertDialog.Cancel>\n        <AlertDialog.Action>\n          <Button color="red">' + action + '</Button>\n        </AlertDialog.Action>\n      </Flex>\n    </AlertDialog.Content>\n  </AlertDialog.Root>\n);'
  );
}

function buildTabsCSSModules(d, name, useTs) {
  var labels = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 30; })
    : [];
  if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
  var triggers = labels.map(function (l, i) {
    return '      <Tabs.Trigger value="tab' + (i + 1) + '">' + l + '</Tabs.Trigger>';
  }).join('\n');
  var contents = labels.map(function (l, i) {
    return '    <Tabs.Content value="tab' + (i + 1) + '">\n      {/* ' + l + ' content */}\n    </Tabs.Content>';
  }).join('\n');
  return (
    _imp('Tabs, Box') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  defaultValue?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? "{ defaultValue = 'tab1' }: " + name + 'Props' : "{ defaultValue = 'tab1' }") +
    ') => (\n  <Tabs.Root defaultValue={defaultValue} className={styles.root}>\n    <Tabs.List>\n' + triggers + '\n    </Tabs.List>\n    <Box pt="3">\n' + contents + '\n    </Box>\n  </Tabs.Root>\n);'
  );
}

function buildTabNavCSSModules(d, name, useTs) {
  var labels = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 30; })
    : [];
  if (labels.length < 2) labels = ['Home', 'About', 'Contact'];
  var links = labels.map(function (l, i) {
    return '    <TabNav.Link href="#" ' + (i === 0 ? 'active' : '') + '>' + l + '</TabNav.Link>';
  }).join('\n');
  return (
    _imp('TabNav') + '\n\n' +
    'export const ' + name + ' = () => (\n  <TabNav.Root>\n' + links + '\n  </TabNav.Root>\n);'
  );
}

function buildCheckboxCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  return (
    _imp('Checkbox, Flex, Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n  label?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ checked, onCheckedChange, label = "' + label + '" }: ' + name + 'Props' : '{ checked, onCheckedChange, label = "' + label + '" }') +
    ') => (\n  <Text as="label">\n    <Flex gap="2" align="center">\n      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />\n      {label}\n    </Flex>\n  </Text>\n);'
  );
}

function buildSwitchCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  return (
    _imp('Switch, Flex, Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n  label?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ checked, onCheckedChange, label = "' + label + '" }: ' + name + 'Props' : '{ checked, onCheckedChange, label = "' + label + '" }') +
    ') => (\n  <Text as="label">\n    <Flex gap="2" align="center">\n      <Switch checked={checked} onCheckedChange={onCheckedChange} />\n      {label}\n    </Flex>\n  </Text>\n);'
  );
}

function buildSelectCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Select...';
  var opts = d.texts && d.texts.all
    ? d.texts.all.slice(1).filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length === 0) opts = ['Option 1', 'Option 2', 'Option 3'];
  var items = opts.map(function (o) {
    var v = o.toLowerCase().replace(/\s+/g, '-');
    return '      <Select.Item value="' + v + '">' + o + '</Select.Item>';
  }).join('\n');
  return (
    _imp('Select') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  value?: string;\n  onValueChange?: (value: string) => void;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }') +
    ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Select.Trigger placeholder="' + placeholder + '" className={styles.root} />\n    <Select.Content>\n' + items + '\n    </Select.Content>\n  </Select.Root>\n);'
  );
}

function buildDropdownMenuCSSModules(d, name, useTs) {
  var trigger = (d.texts && d.texts.title) || 'Options';
  var opts = d.texts && d.texts.all
    ? d.texts.all.slice(1).filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length === 0) opts = ['Item 1', 'Item 2', 'Item 3'];
  var items = opts.map(function (o) {
    return '      <DropdownMenu.Item>' + o + '</DropdownMenu.Item>';
  }).join('\n');
  return (
    _imp('DropdownMenu, Button') + '\n\n' +
    _pt(name, '  trigger?: string;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ trigger = "' + trigger + '", children }: ' + name + 'Props' : '{ trigger = "' + trigger + '", children }') +
    ') => (\n  <DropdownMenu.Root>\n    <DropdownMenu.Trigger>\n      <Button variant="soft">{trigger}</Button>\n    </DropdownMenu.Trigger>\n    <DropdownMenu.Content>\n' + items + '\n    </DropdownMenu.Content>\n  </DropdownMenu.Root>\n);'
  );
}

function buildContextMenuCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length === 0) opts = ['Edit', 'Duplicate', 'Delete'];
  var items = opts.map(function (o) {
    return '      <ContextMenu.Item>' + o + '</ContextMenu.Item>';
  }).join('\n');
  return (
    _imp('ContextMenu') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <ContextMenu.Root>\n    <ContextMenu.Trigger>\n      {children ?? <div style={{ padding: 32, border: "1px dashed gray" }}>Right click here</div>}\n    </ContextMenu.Trigger>\n    <ContextMenu.Content>\n' + items + '\n    </ContextMenu.Content>\n  </ContextMenu.Root>\n);'
  );
}

function buildTooltipCSSModules(d, name, useTs) {
  var content = (d.texts && d.texts.title) || 'Tooltip content';
  return (
    _imp('Tooltip, IconButton') + '\n\n' +
    _pt(name, '  content?: string;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ content = "' + content + '", children }: ' + name + 'Props' : '{ content = "' + content + '", children }') +
    ') => (\n  <Tooltip content={content}>\n    {children ?? <IconButton>?</IconButton>}\n  </Tooltip>\n);'
  );
}

function buildPopoverCSSModules(d, name, useTs) {
  var triggerLabel = (d.texts && d.texts.title) || 'Open';
  var content = (d.texts && d.texts.description) || 'Popover content';
  return (
    _imp('Popover, Button, Flex, Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Popover.Root>\n    <Popover.Trigger>\n      <Button variant="soft">' + triggerLabel + '</Button>\n    </Popover.Trigger>\n    <Popover.Content maxWidth="300px" className={styles.root}>\n      <Flex direction="column" gap="2">\n        <Text size="2">' + content + '</Text>\n        {children}\n      </Flex>\n      <Popover.Close>\n        <Button variant="ghost" size="1">Close</Button>\n      </Popover.Close>\n    </Popover.Content>\n  </Popover.Root>\n);'
  );
}

function buildHoverCardCSSModules(d, name, useTs) {
  var triggerText = (d.texts && d.texts.title) || 'Hover me';
  var desc = (d.texts && d.texts.description) || 'Description';
  return (
    _imp('HoverCard, Flex, Text, Avatar') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  trigger?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ trigger }: ' + name + 'Props' : '{ trigger }') +
    ') => (\n  <HoverCard.Root>\n    <HoverCard.Trigger>\n      {trigger ?? <Text>' + triggerText + '</Text>}\n    </HoverCard.Trigger>\n    <HoverCard.Content maxWidth="300px">\n      <Flex gap="3">\n        <Avatar fallback="U" radius="full" />\n        <Flex direction="column" gap="1">\n          <Text className={styles.title}>' + triggerText + '</Text>\n          <Text className={styles.description}>' + desc + '</Text>\n        </Flex>\n      </Flex>\n    </HoverCard.Content>\n  </HoverCard.Root>\n);'
  );
}

function buildRadioGroupCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length < 2) opts = ['Option 1', 'Option 2'];
  var items = opts.map(function (o) {
    var v = o.toLowerCase().replace(/\s+/g, '-');
    return '    <RadioGroup.Item value="' + v + '">' + o + '</RadioGroup.Item>';
  }).join('\n');
  return (
    _imp('RadioGroup') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  value?: string;\n  onValueChange?: (value: string) => void;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }') +
    ') => (\n  <RadioGroup.Root value={value} onValueChange={onValueChange} className={styles.root}>\n' + items + '\n  </RadioGroup.Root>\n);'
  );
}

function buildSegmentedControlCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 30; })
    : [];
  if (opts.length < 2) opts = ['Option 1', 'Option 2'];
  var items = opts.map(function (o) {
    return '    <SegmentedControl.Item value="' + o.toLowerCase().replace(/\s+/g, '-') + '">' + o + '</SegmentedControl.Item>';
  }).join('\n');
  return (
    _imp('SegmentedControl') + '\n\n' +
    _pt(name, '  value?: string;\n  onValueChange?: (value: string) => void;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }') +
    ') => (\n  <SegmentedControl.Root value={value} onValueChange={onValueChange}>\n' + items + '\n  </SegmentedControl.Root>\n);'
  );
}

function buildAvatarCSSModules(d, name, useTs) {
  var fallback = (d.texts && d.texts.title && d.texts.title.slice(0, 2).toUpperCase()) || name.slice(0, 2).toUpperCase();
  return (
    _imp('Avatar') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  src?: string;\n  fallback?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ src, fallback = "' + fallback + '" }: ' + name + 'Props' : '{ src, fallback = "' + fallback + '" }') +
    ') => (\n  <Avatar src={src} fallback={fallback} radius="full" className={styles.root} />\n);'
  );
}

function buildBadgeCSSModules(d, name, useTs) {
  var parsed = parseVariantsFromHtml(d.html || '');
  var colorVs = parsed.colorVariants;
  var colorNames = colorVs.length > 0 ? colorVs.map(function(v) { return v.name; }) : ['default'];
  var colorUnion = colorNames.map(function(n) { return '"' + n + '"'; }).join(' | ');
  var defaultColor = colorNames[0];
  var candidateTexts = (d.texts && d.texts.all) || [];
  var badgeLabel = candidateTexts.find(function(t) {
    return t && t.length < 20 && !t.includes('/');
  }) || defaultColor;
  var propsBody = [
    '  color?: ' + colorUnion + ';',
    '  children?: React.ReactNode;',
  ].join('\n');
  var destructure = useTs
    ? '{ color = "' + defaultColor + '", children }: ' + name + 'Props'
    : '{ color = "' + defaultColor + '", children }';
  return (
    _imp('Badge') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsBody, useTs) +
    'export const ' + name + ' = (' + destructure + ') => (\n' +
    '  <Badge className={`${styles.root} ${styles[color]}`}>\n' +
    '    {children ?? \'' + badgeLabel + '\'}\n' +
    '  </Badge>\n' +
    ');'
  );
}

function buildCardCSSModules(d, name, useTs) {
  var texts = (d && d.texts) || {};
  var title = texts.title || '';
  var description = texts.description || '';
  return (
    _imp('Card, Flex, Heading, Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  title?: string;\n  description?: string;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ title, description, children }: ' + name + 'Props' : '{ title, description, children }') +
    ') => (\n  <Card className={styles.root}>\n    <Flex direction="column" gap="2">\n' +
    (title ? '      {title && <Heading className={styles.cardTitle}>{title}</Heading>}\n' : '') +
    (description ? '      {description && <Text className={styles.cardDescription}>{description}</Text>}\n' : '') +
    '      {children}\n    </Flex>\n  </Card>\n);'
  );
}

function buildHeadingCSSModules(d, name, useTs) {
  var sizes = parseSizeLabelsFromTexts(d.texts);
  var sizeUnion = sizes.length > 0
    ? sizes.map(function(s) { return '"' + s + '"'; }).join(' | ')
    : '"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"';
  var defaultSize = sizes.indexOf('default') !== -1 ? 'default'
    : sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : '4';
  var propsBody = [
    '  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";',
    '  size?: ' + sizeUnion + ';',
    '  children?: React.ReactNode;',
    '  className?: string;',
  ].join('\n');
  var destructure = useTs
    ? '{ as = "h2", size = "' + defaultSize + '", children, className }: ' + name + 'Props'
    : '{ as = "h2", size = "' + defaultSize + '", children, className }';
  return (
    _imp('Heading') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsBody, useTs) +
    'export const ' + name + ' = (' + destructure + ') => (\n' +
    '  <Heading\n' +
    '    as={as}\n' +
    '    className={`${styles.root} ${styles[size]}${className ? " " + className : ""}`}\n' +
    '  >\n' +
    '    {children ?? "Heading"}\n' +
    '  </Heading>\n' +
    ');'
  );
}

function buildTextCSSModules(d, name, useTs) {
  var sizes = parseSizeLabelsFromTexts(d.texts);
  var weights = parseWeightLabelsFromTexts(d.texts);
  var sizeUnion = sizes.length > 0
    ? sizes.map(function(s) { return '"' + s + '"'; }).join(' | ')
    : '"xs" | "sm" | "base" | "lg" | "xl"';
  var weightUnion = weights.length > 0
    ? weights.map(function(w) { return '"' + w + '"'; }).join(' | ')
    : '"light" | "regular" | "medium" | "bold"';
  var defaultSize = sizes.indexOf('default') !== -1 ? 'default'
    : sizes.indexOf('base') !== -1 ? 'base'
    : sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 'base';
  var defaultWeight = weights.indexOf('regular') !== -1 ? 'regular'
    : weights.indexOf('normal') !== -1 ? 'normal'
    : weights.length > 0 ? weights[0] : 'regular';
  var propsBody = [
    '  as?: "p" | "span" | "div" | "label";',
    '  size?: ' + sizeUnion + ';',
    '  weight?: ' + weightUnion + ';',
    '  children?: React.ReactNode;',
    '  className?: string;',
  ].join('\n');
  var destructure = useTs
    ? '{ as = "p", size = "' + defaultSize + '", weight = "' + defaultWeight + '", children, className }: ' + name + 'Props'
    : '{ as = "p", size = "' + defaultSize + '", weight = "' + defaultWeight + '", children, className }';
  return (
    _imp('Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsBody, useTs) +
    'export const ' + name + ' = (' + destructure + ') => (\n' +
    '  <Text\n' +
    '    as={as}\n' +
    '    className={`${styles.root} ${styles[size]} ${styles[weight]}${className ? " " + className : ""}`}\n' +
    '  >\n' +
    '    {children ?? "Text"}\n' +
    '  </Text>\n' +
    ');'
  );
}

function buildInputCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Enter value\u2026';
  var label = (d.texts && d.texts.description) || name;
  return (
    _imp('TextField, Text, Flex') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  value?: string;\n  onChange?: (value: string) => void;\n  placeholder?: string;\n  label?: string;\n  disabled?: boolean;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value, onChange, placeholder = "' + placeholder + '", label = "' + label + '", disabled }: ' + name + 'Props' : '{ value, onChange, placeholder = "' + placeholder + '", label = "' + label + '", disabled }') +
    ') => (\n  <Flex direction="column" gap="1" className={styles.root}>\n    <Text as="label" className={styles.label}>{label}</Text>\n    <TextField.Root\n      value={value}\n      onChange={(e) => onChange?.(e.target.value)}\n      placeholder={placeholder}\n      disabled={disabled}\n    />\n  </Flex>\n);'
  );
}

function buildSeparatorCSSModules(d, name, useTs) {
  return (
    _imp('Separator') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  orientation?: "horizontal" | "vertical";', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ orientation = "horizontal" }: ' + name + 'Props' : '{ orientation = "horizontal" }') +
    ') => (\n  <Separator orientation={orientation} className={styles.root} />\n);'
  );
}

function buildProgressCSSModules(d, name, useTs) {
  return (
    _imp('Progress') + '\n\n' +
    _pt(name, '  value?: number;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value = 50 }: ' + name + 'Props' : '{ value = 50 }') +
    ') => (\n  <Progress value={value} />\n);'
  );
}

function buildSliderCSSModules(d, name, useTs) {
  return (
    _imp('Slider') + '\n\n' +
    _pt(name, '  value?: number[];\n  onValueChange?: (value: number[]) => void;\n  min?: number;\n  max?: number;\n  step?: number;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value = [50], onValueChange, min = 0, max = 100, step = 1 }: ' + name + 'Props' : '{ value = [50], onValueChange, min = 0, max = 100, step = 1 }') +
    ') => (\n  <Slider value={value} onValueChange={onValueChange} min={min} max={max} step={step} />\n);'
  );
}

function buildScrollAreaCSSModules(d, name, useTs) {
  return (
    _imp('ScrollArea') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <ScrollArea scrollbars="vertical" className={styles.root} style={{ maxHeight: 300 }}>\n    {children}\n  </ScrollArea>\n);'
  );
}

function buildSpinnerCSSModules(d, name, useTs) {
  return (
    _imp('Spinner') + '\n\n' +
    _pt(name, '  loading?: boolean;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ loading = true }: ' + name + 'Props' : '{ loading = true }') +
    ') => (\n  <Spinner loading={loading} />\n);'
  );
}

function buildSkeletonCSSModules(d, name, useTs) {
  return (
    _imp('Skeleton') + '\n\n' +
    _pt(name, '  loading?: boolean;\n  width?: string;\n  height?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ loading = true, width, height }: ' + name + 'Props' : '{ loading = true, width, height }') +
    ') => (\n  <Skeleton loading={loading} width={width} height={height} />\n);'
  );
}

function buildAspectRatioCSSModules(d, name, useTs) {
  return (
    _imp('AspectRatio') + '\n\n' +
    _pt(name, '  ratio?: number;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ ratio = 16 / 9, children }: ' + name + 'Props' : '{ ratio = 16 / 9, children }') +
    ') => (\n  <AspectRatio ratio={ratio}>\n    {children}\n  </AspectRatio>\n);'
  );
}

function buildDataListCSSModules(d, name, useTs) {
  var texts = d.texts && d.texts.all ? d.texts.all : [];
  var pairs = [];
  for (var i = 0; i < texts.length - 1; i += 2) {
    pairs.push({ label: texts[i], value: texts[i + 1] });
  }
  if (pairs.length === 0) pairs = [{ label: 'Name', value: 'John Doe' }, { label: 'Email', value: 'john@example.com' }];
  var items = pairs.map(function (p) {
    return '    <DataList.Item>\n      <DataList.Label>' + p.label + '</DataList.Label>\n      <DataList.Value>' + p.value + '</DataList.Value>\n    </DataList.Item>';
  }).join('\n');
  return (
    _imp('DataList') + '\n\n' +
    'export const ' + name + ' = () => (\n  <DataList.Root>\n' + items + '\n  </DataList.Root>\n);'
  );
}

function buildCalloutCSSModules(d, name, useTs) {
  var parsed = parseVariantsFromHtml(d.html || '');
  var colorVs = parsed.colorVariants;
  var colorNames = colorVs.length > 0 ? colorVs.map(function(v) { return v.name; }) : ['info', 'warning', 'error', 'success'];
  var colorUnion = colorNames.map(function(n) { return '"' + n + '"'; }).join(' | ');
  var defaultColor = colorNames[0];
  var candidateTexts = (d.texts && d.texts.all) || [];
  var calloutText = candidateTexts.find(function(t) {
    return t && t.length > 5 && t.length < 80 && !t.includes('/');
  }) || 'Callout message';
  var propsBody = [
    '  color?: ' + colorUnion + ';',
    '  children?: React.ReactNode;',
  ].join('\n');
  var destructure = useTs
    ? '{ color = "' + defaultColor + '", children }: ' + name + 'Props'
    : '{ color = "' + defaultColor + '", children }';
  return (
    _imp('Callout') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, propsBody, useTs) +
    'export const ' + name + ' = (' + destructure + ') => (\n' +
    '  <Callout.Root className={`${styles.root} ${styles[color]}`}>\n' +
    '    <Callout.Text>{children ?? "' + calloutText + '"}</Callout.Text>\n' +
    '  </Callout.Root>\n' +
    ');'
  );
}

function buildTableCSSModules(d, name, useTs) {
  return (
    _imp('Table') + '\n\n' +
    _pt(name, '  rows?: Record<string, string>[];', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ rows = [] }: ' + name + 'Props' : '{ rows = [] }') +
    ') => (\n  <Table.Root>\n    <Table.Body>\n      {rows.map((row, i) => (\n        <Table.Row key={i}>\n          {Object.values(row).map((cell, j) => (\n            <Table.Cell key={j}>{cell}</Table.Cell>\n          ))}\n        </Table.Row>\n      ))}\n    </Table.Body>\n  </Table.Root>\n);'
  );
}

// ─── Typography 빌더 ─────────────────────────────────────────────────────────

function buildCodeCSSModules(d, name, useTs) {
  var content = (d.texts && d.texts.title) || 'console.log()';
  return (
    _imp('Code') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Code className={styles.root}>{children ?? "' + content + '"}</Code>\n);'
  );
}

function buildLinkCSSModules(d, name, useTs) {
  var text = (d.texts && d.texts.title) || 'Link text';
  return (
    _imp('Link') + '\n\n' +
    _pt(name, '  href?: string;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ href = "#", children }: ' + name + 'Props' : '{ href = "#", children }') +
    ') => (\n  <Link href={href}>{children ?? "' + text + '"}</Link>\n);'
  );
}

function buildBlockquoteCSSModules(d, name, useTs) {
  var text = (d.texts && d.texts.title) || 'Quote text';
  return (
    _imp('Blockquote') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Blockquote>{children ?? "' + text + '"}</Blockquote>\n);'
  );
}

function buildKbdCSSModules(d, name, useTs) {
  var text = (d.texts && d.texts.title) || '\u2318 C';
  return (
    _imp('Kbd') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Kbd>{children ?? "' + text + '"}</Kbd>\n);'
  );
}

function buildEmCSSModules(d, name, useTs) {
  var text = (d.texts && d.texts.title) || 'Emphasized text';
  return (
    _imp('Em') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Em>{children ?? "' + text + '"}</Em>\n);'
  );
}

function buildStrongCSSModules(d, name, useTs) {
  var text = (d.texts && d.texts.title) || 'Bold text';
  return (
    _imp('Strong') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Strong>{children ?? "' + text + '"}</Strong>\n);'
  );
}

function buildCheckboxCardsCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length < 2) opts = ['Option 1', 'Option 2'];
  var items = opts.map(function (o) {
    var v = o.toLowerCase().replace(/\s+/g, '-');
    return '    <CheckboxCards.Item value="' + v + '">' + o + '</CheckboxCards.Item>';
  }).join('\n');
  return (
    _imp('CheckboxCards') + '\n\n' +
    _pt(name, '  defaultValue?: string[];', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ defaultValue = [] }: ' + name + 'Props' : '{ defaultValue = [] }') +
    ') => (\n  <CheckboxCards.Root defaultValue={defaultValue} columns="2">\n' + items + '\n  </CheckboxCards.Root>\n);'
  );
}

function buildCheckboxGroupCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length < 2) opts = ['Option 1', 'Option 2'];
  var items = opts.map(function (o) {
    return '    <Text as="label" size="2">\n      <Flex gap="2" align="center">\n        <Checkbox />\n        ' + o + '\n      </Flex>\n    </Text>';
  }).join('\n');
  return (
    _imp('Checkbox, Flex, Text') + '\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Flex direction="column" gap="2">\n' + items + '\n  </Flex>\n);'
  );
}

function buildRadioCardsCSSModules(d, name, useTs) {
  var opts = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 40; })
    : [];
  if (opts.length < 2) opts = ['Option 1', 'Option 2'];
  var items = opts.map(function (o) {
    var v = o.toLowerCase().replace(/\s+/g, '-');
    return '    <RadioCards.Item value="' + v + '">' + o + '</RadioCards.Item>';
  }).join('\n');
  return (
    _imp('RadioCards') + '\n\n' +
    _pt(name, '  defaultValue?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }') +
    ') => (\n  <RadioCards.Root defaultValue={defaultValue} columns="2">\n' + items + '\n  </RadioCards.Root>\n);'
  );
}

function buildNavigationMenuCSSModules(d, name, useTs) {
  var labels = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 30; })
    : [];
  if (labels.length < 2) labels = ['Home', 'About', 'Contact'];
  var items = labels.map(function (l) {
    return '    <NavigationMenu.Item>\n      <NavigationMenu.Link href="#">' + l + '</NavigationMenu.Link>\n    </NavigationMenu.Item>';
  }).join('\n');
  return (
    "import * as NavigationMenu from '@radix-ui/react-navigation-menu';\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <NavigationMenu.Root className={styles.root}>\n    <NavigationMenu.List className={styles.list}>\n' + items + '\n    </NavigationMenu.List>\n  </NavigationMenu.Root>\n);'
  );
}

// ─── Primitives 빌더 (Themes 미제공) ─────────────────────────────────────────

function buildAccordionCSSModules(d, name, useTs) {
  var items = d.texts && d.texts.all
    ? d.texts.all.filter(function (t) { return t.length < 50; })
    : [];
  if (items.length < 2) items = ['Item 1', 'Item 2'];
  var accItems = items.map(function (l, i) {
    var v = 'item-' + (i + 1);
    return '    <Accordion.Item className={styles.item} value="' + v + '">\n      <Accordion.Trigger className={styles.trigger}>' + l + '</Accordion.Trigger>\n      <Accordion.Content className={styles.content}>\n        {/* ' + l + ' content */}\n      </Accordion.Content>\n    </Accordion.Item>';
  }).join('\n');
  return (
    "import * as Accordion from '@radix-ui/react-accordion';\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  defaultValue?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }') +
    ') => (\n  <Accordion.Root className={styles.root} type="single" defaultValue={defaultValue} collapsible>\n' + accItems + '\n  </Accordion.Root>\n);'
  );
}

function buildCollapsibleCSSModules(d, name, useTs) {
  var trigger = (d.texts && d.texts.title) || 'Toggle';
  return (
    "import * as Collapsible from '@radix-ui/react-collapsible';\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  open?: boolean;\n  onOpenChange?: (open: boolean) => void;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ open, onOpenChange, children }: ' + name + 'Props' : '{ open, onOpenChange, children }') +
    ') => (\n  <Collapsible.Root open={open} onOpenChange={onOpenChange} className={styles.root}>\n    <Collapsible.Trigger className={styles.trigger}>' + trigger + '</Collapsible.Trigger>\n    <Collapsible.Content className={styles.content}>{children}</Collapsible.Content>\n  </Collapsible.Root>\n);'
  );
}

// ─── Layout 폴백 ─────────────────────────────────────────────────────────────

function buildLayoutCSSModules(d, name, useTs) {
  var tag = getSemanticTag(name);
  return (
    _imp('Box') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Box asChild className={styles.root}>\n    <' + tag + '>{children}</' + tag + '>\n  </Box>\n);'
  );
}

// ─── buildRadixCSSModules 메인 디스패처 ──────────────────────────────────────

export function buildRadixCSSModules(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  switch (type) {
    // Interactive — Single
    case 'button':            return buildButtonCSSModules(d, name, useTs);
    case 'icon-button':       return buildIconButtonCSSModules(d, name, useTs);
    case 'checkbox':          return buildCheckboxCSSModules(d, name, useTs);
    case 'switch':            return buildSwitchCSSModules(d, name, useTs);
    case 'slider':            return buildSliderCSSModules(d, name, useTs);
    case 'radio-group':       return buildRadioGroupCSSModules(d, name, useTs);
    case 'segmented-control': return buildSegmentedControlCSSModules(d, name, useTs);
    case 'input':             return buildInputCSSModules(d, name, useTs);
    case 'textarea':          return buildTextareaCSSModules(d, name, useTs);
    // Interactive — Compound
    case 'dialog':            return buildDialogCSSModules(d, name, useTs);
    case 'alert-dialog':      return buildAlertDialogCSSModules(d, name, useTs);
    case 'tabs':              return buildTabsCSSModules(d, name, useTs);
    case 'tab-nav':           return buildTabNavCSSModules(d, name, useTs);
    case 'select':            return buildSelectCSSModules(d, name, useTs);
    case 'dropdown-menu':     return buildDropdownMenuCSSModules(d, name, useTs);
    case 'context-menu':      return buildContextMenuCSSModules(d, name, useTs);
    case 'tooltip':           return buildTooltipCSSModules(d, name, useTs);
    case 'popover':           return buildPopoverCSSModules(d, name, useTs);
    case 'hover-card':        return buildHoverCardCSSModules(d, name, useTs);
    // Display
    case 'avatar':            return buildAvatarCSSModules(d, name, useTs);
    case 'badge':             return buildBadgeCSSModules(d, name, useTs);
    case 'card':              return buildCardCSSModules(d, name, useTs);
    case 'callout':           return buildCalloutCSSModules(d, name, useTs);
    case 'data-list':         return buildDataListCSSModules(d, name, useTs);
    case 'table':             return buildTableCSSModules(d, name, useTs);
    case 'separator':         return buildSeparatorCSSModules(d, name, useTs);
    case 'progress':          return buildProgressCSSModules(d, name, useTs);
    case 'skeleton':          return buildSkeletonCSSModules(d, name, useTs);
    case 'spinner':           return buildSpinnerCSSModules(d, name, useTs);
    case 'scroll-area':       return buildScrollAreaCSSModules(d, name, useTs);
    case 'aspect-ratio':      return buildAspectRatioCSSModules(d, name, useTs);
    // Typography
    case 'heading':           return buildHeadingCSSModules(d, name, useTs);
    case 'text':              return buildTextCSSModules(d, name, useTs);
    case 'code':              return buildCodeCSSModules(d, name, useTs);
    case 'link':              return buildLinkCSSModules(d, name, useTs);
    case 'blockquote':        return buildBlockquoteCSSModules(d, name, useTs);
    case 'kbd':               return buildKbdCSSModules(d, name, useTs);
    case 'em':                return buildEmCSSModules(d, name, useTs);
    case 'strong':            return buildStrongCSSModules(d, name, useTs);
    case 'checkbox-cards':    return buildCheckboxCardsCSSModules(d, name, useTs);
    case 'checkbox-group':    return buildCheckboxGroupCSSModules(d, name, useTs);
    case 'radio-cards':       return buildRadioCardsCSSModules(d, name, useTs);
    // Primitives (Themes 미제공)
    case 'accordion':         return buildAccordionCSSModules(d, name, useTs);
    case 'collapsible':       return buildCollapsibleCSSModules(d, name, useTs);
    case 'navigation-menu':   return buildNavigationMenuCSSModules(d, name, useTs);
    // Fallback
    default:                  return buildLayoutCSSModules(d, name, useTs);
  }
}

// ─── textarea (Themes) ───────────────────────────────────────────────────────

function buildTextareaCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Enter text\u2026';
  return (
    _imp('TextArea') + '\n\n' +
    _pt(name, '  value?: string;\n  onChange?: (v: string) => void;\n  placeholder?: string;\n  rows?: number;\n  disabled?: boolean;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ value, onChange, placeholder = "' + placeholder + '", rows = 4, disabled }: ' + name + 'Props' : '{ value, onChange, placeholder = "' + placeholder + '", rows = 4, disabled }') +
    ') => (\n  <TextArea\n    value={value}\n    onChange={(e) => onChange?.(e.target.value)}\n    placeholder={placeholder}\n    rows={rows}\n    disabled={disabled}\n  />\n);'
  );
}

// ─── buildRadixCSS — Themes 컴포넌트는 CSS 최소화 ───────────────────────────

export function buildRadixCSS(d) {
  var type = (d && d.detectedType) || 'layout';
  var entry = RADIX_COMPONENT_REGISTRY[type];
  var rootCss = stylesToCSSProps(d.styles);

  // Themes 컴포넌트 — props로 스타일링하므로 커스텀 CSS만
  if (entry && entry.themeComponent) {
    // button — Figma HTML에서 추출한 variant CSS 생성
    if (type === 'button') {
      var parsed = parseVariantsFromHtml(d.html || '');
      if (parsed.colorVariants.length > 0 || parsed.sizeVariants.length > 0) {
        return buildButtonCSS(parsed);
      }
      // Figma 정보가 없으면 빈 root만
      return '.root {\n  all: unset;\n  box-sizing: border-box;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n}\n\n.root:disabled,\n.root[disabled] {\n  opacity: 0.4;\n  cursor: not-allowed;\n}';
    }
    // heading — texts에서 사이즈 라벨 추출 → typography CSS 클래스
    if (type === 'heading') {
      var hSizes = parseSizeLabelsFromTexts(d.texts);
      return buildTypographyCSS(hSizes, []);
    }
    // text — texts에서 사이즈·굵기 라벨 추출
    if (type === 'text') {
      var tSizes = parseSizeLabelsFromTexts(d.texts);
      var tWeights = parseWeightLabelsFromTexts(d.texts);
      return buildTypographyCSS(tSizes, tWeights);
    }
    // badge/callout — HTML에서 색상 변형 추출
    if (type === 'badge' || type === 'callout') {
      var bcParsed = parseVariantsFromHtml(d.html || '');
      if (bcParsed.colorVariants.length > 0) return buildColorVariantCSS(bcParsed, '  padding: 2px 8px;');
      return '.root { }\n\n/* Color variants — 디자인 토큰으로 채워주세요 */';
    }
    // icon-button
    if (type === 'icon-button') {
      return '.root {\n  all: unset;\n  box-sizing: border-box;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  width: 32px;\n  height: 32px;\n  border-radius: var(--radius-2, 4px);\n  background-color: var(--color-surface);\n}\n\n.root:disabled,\n.root[disabled] {\n  opacity: 0.4;\n  cursor: not-allowed;\n}';
    }
    // avatar
    if (type === 'avatar') {
      return '.root {\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  overflow: hidden;\n  background-color: var(--color-surface-alt);\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n}';
    }
    // separator
    if (type === 'separator') {
      return '.root {\n  border: none;\n  border-top: 1px solid var(--border);\n  width: 100%;\n  margin: 0;\n}';
    }
    // code
    if (type === 'code') {
      return '.root {\n  font-family: monospace;\n  font-size: 0.875em;\n  background-color: var(--code-bg, rgba(0,0,0,0.06));\n  padding: 2px 6px;\n  border-radius: var(--radius-1, 3px);\n}';
    }
    // hover-card
    if (type === 'hover-card') {
      return '.title {\n  font-size: var(--font-size-sm, 14px);\n  font-weight: var(--font-weight-bold, 700);\n}\n\n.description {\n  font-size: var(--font-size-xs, 12px);\n  color: var(--color-text-secondary);\n}';
    }
    // input
    if (type === 'input') {
      return '.root { }\n\n.label {\n  font-size: var(--font-size-sm, 14px);\n  font-weight: var(--font-weight-medium, 500);\n}';
    }
    // card
    if (type === 'card') {
      return '.root {\n' + (rootCss || '') + '\n}\n\n.cardTitle {\n  font-size: var(--font-size-lg, 18px);\n  font-weight: var(--font-weight-bold, 700);\n}\n\n.cardDescription {\n  font-size: var(--font-size-sm, 14px);\n  color: var(--color-text-secondary);\n}';
    }
    // layout — root 스타일 유지
    if (type === 'layout') {
      return '.root {\n' + rootCss + '\n}';
    }
    // 나머지 Themes 컴포넌트 — 커스텀 CSS 있으면 .root에만
    if (rootCss) {
      return '.root {\n' + rootCss + '\n}';
    }
    return '/* Radix Themes handles styling via props */';
  }

  // Primitives — 전체 CSS 필요
  if (type === 'accordion') {
    return '.root {\n' + rootCss + "\n}\n\n.item {\n  border-bottom: 1px solid var(--border);\n}\n\n.trigger {\n  width: 100%;\n  padding: 16px;\n  background: none;\n  border: none;\n  text-align: left;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  display: flex;\n  justify-content: space-between;\n}\n\n.trigger[data-state='open'] {\n  color: var(--color-primary, #2d7ff9);\n}\n\n.content {\n  padding: 0 16px 16px;\n  font-size: 14px;\n  color: var(--text-secondary);\n}";
  }
  if (type === 'collapsible') {
    return '.root {\n' + rootCss + '\n}\n\n.trigger {\n  padding: 8px 16px;\n  background: none;\n  border: 1px solid var(--border);\n  border-radius: 4px;\n  cursor: pointer;\n}\n\n.content {\n  padding: 16px;\n}';
  }

  return '.root {\n' + rootCss + '\n}';
}

// ─── buildRadixStyled — Radix Themes 기준 ───────────────────────────────────

export function buildRadixStyled(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  var entry = RADIX_COMPONENT_REGISTRY[type];
  var rootCss = stylesToCSSProps(d.styles);
  var hasCustom = rootCss && rootCss.trim().length > 0;

  // Themes 컴포넌트 — styled 래핑 최소화
  if (entry && entry.themeComponent) {
    return _buildThemesStyled(d, name, useTs, type, hasCustom);
  }

  // Primitives — 기존 styled 패턴 유지
  if (type === 'accordion') {
    return _buildAccordionStyled(d, name, useTs);
  }
  if (type === 'collapsible') {
    return _buildCollapsibleStyled(d, name, useTs);
  }

  // Layout fallback
  var tag = getSemanticTag(name);
  return (
    "import styled from 'styled-components';\n\nconst Wrapper = styled." + tag + '`\n' + rootCss + '\n`;\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Wrapper>{children}</Wrapper>\n);'
  );
}

function _buildThemesStyled(d, name, useTs, type, hasCustom) {
  // 각 타입별로 Themes import + 최소 styled 래핑
  // 커스텀 스타일 없으면 styled 없이 직접 사용
  var rootCss = stylesToCSSProps(d.styles);

  // ── Button ──
  if (type === 'button') {
    var label = (d.texts && d.texts.title) || name;
    var styledBlock = hasCustom
      ? "import styled from 'styled-components';\n\nconst StyledButton = styled(Button)`\n" + rootCss + "\n`;\n\n"
      : '';
    var comp = hasCustom ? 'StyledButton' : 'Button';
    return (
      _imp('Button') + '\n' + styledBlock +
      _pt(name, '  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ onClick, disabled, children }: ' + name + 'Props' : '{ onClick, disabled, children }') +
      ') => (\n  <' + comp + ' onClick={onClick} disabled={disabled}>\n    {children ?? \'' + label + '\'}\n  </' + comp + '>\n);'
    );
  }

  // ── Dialog ──
  if (type === 'dialog') {
    var title = (d.texts && d.texts.title) || 'Dialog Title';
    var desc = (d.texts && d.texts.description) || '';
    var cancel = (d.texts && d.texts.actions && d.texts.actions[0]) || 'Cancel';
    var confirm = (d.texts && d.texts.actions && d.texts.actions[1]) || 'Confirm';
    var descLine = desc ? '\n        <Dialog.Description size="2">' + desc + '</Dialog.Description>' : '';
    return (
      _imp('Dialog, Button, Flex') + '\n\n' +
      _pt(name, '  open?: boolean;\n  onOpenChange?: (open: boolean) => void;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }') +
      ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Trigger>\n      <Button variant="soft">Open</Button>\n    </Dialog.Trigger>\n    <Dialog.Content maxWidth="450px">\n      <Dialog.Title>' + title + '</Dialog.Title>' +
      descLine +
      '\n      <Flex gap="3" mt="4" justify="end">\n        <Dialog.Close>\n          <Button variant="soft" color="gray">' + cancel + '</Button>\n        </Dialog.Close>\n        <Dialog.Close>\n          <Button>' + confirm + '</Button>\n        </Dialog.Close>\n      </Flex>\n    </Dialog.Content>\n  </Dialog.Root>\n);'
    );
  }

  // ── Tabs ──
  if (type === 'tabs') {
    var labels = d.texts && d.texts.all ? d.texts.all.filter(function(t) { return t.length < 30; }) : [];
    if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
    var triggers = labels.map(function(l, i) {
      return '      <Tabs.Trigger value="tab' + (i+1) + '">' + l + '</Tabs.Trigger>';
    }).join('\n');
    var contents = labels.map(function(l, i) {
      return '    <Tabs.Content value="tab' + (i+1) + '">{/* ' + l + ' */}</Tabs.Content>';
    }).join('\n');
    return (
      _imp('Tabs, Box') + '\n\n' +
      _pt(name, '  defaultValue?: string;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? "{ defaultValue = 'tab1' }: " + name + 'Props' : "{ defaultValue = 'tab1' }") +
      ') => (\n  <Tabs.Root defaultValue={defaultValue}>\n    <Tabs.List>\n' + triggers + '\n    </Tabs.List>\n    <Box pt="3">\n' + contents + '\n    </Box>\n  </Tabs.Root>\n);'
    );
  }

  // ── Checkbox ──
  if (type === 'checkbox') {
    var labelCb = (d.texts && d.texts.title) || name;
    return (
      _imp('Checkbox, Flex, Text') + '\n\n' +
      _pt(name, '  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ checked, onCheckedChange }: ' + name + 'Props' : '{ checked, onCheckedChange }') +
      ') => (\n  <Text as="label" size="2">\n    <Flex gap="2" align="center">\n      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />\n      ' + labelCb + '\n    </Flex>\n  </Text>\n);'
    );
  }

  // ── Switch ──
  if (type === 'switch') {
    var labelSw = (d.texts && d.texts.title) || name;
    return (
      _imp('Switch, Flex, Text') + '\n\n' +
      _pt(name, '  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ checked, onCheckedChange }: ' + name + 'Props' : '{ checked, onCheckedChange }') +
      ') => (\n  <Text as="label" size="2">\n    <Flex gap="2" align="center">\n      <Switch checked={checked} onCheckedChange={onCheckedChange} />\n      ' + labelSw + '\n    </Flex>\n  </Text>\n);'
    );
  }

  // ── Select ──
  if (type === 'select') {
    var ph = (d.texts && d.texts.title) || 'Select...';
    return (
      _imp('Select') + '\n\n' +
      _pt(name, '  value?: string;\n  onValueChange?: (value: string) => void;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }') +
      ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Select.Trigger placeholder="' + ph + '" />\n    <Select.Content>\n      <Select.Item value="option-1">Option 1</Select.Item>\n      <Select.Item value="option-2">Option 2</Select.Item>\n    </Select.Content>\n  </Select.Root>\n);'
    );
  }

  // ── Tooltip ──
  if (type === 'tooltip') {
    var ttContent = (d.texts && d.texts.title) || 'Tooltip content';
    return (
      _imp('Tooltip, IconButton') + '\n\n' +
      _pt(name, '  content?: string;\n  children?: React.ReactNode;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ content = "' + ttContent + '", children }: ' + name + 'Props' : '{ content = "' + ttContent + '", children }') +
      ') => (\n  <Tooltip content={content}>\n    {children ?? <IconButton variant="ghost" size="1">?</IconButton>}\n  </Tooltip>\n);'
    );
  }

  // ── Avatar ──
  if (type === 'avatar') {
    var fb = (d.texts && d.texts.title && d.texts.title.slice(0, 2).toUpperCase()) || name.slice(0, 2).toUpperCase();
    return (
      _imp('Avatar') + '\n\n' +
      _pt(name, '  src?: string;\n  fallback?: string;\n  size?: "1" | "2" | "3" | "4" | "5";', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ src, fallback = "' + fb + '", size = "3" }: ' + name + 'Props' : '{ src, fallback = "' + fb + '", size = "3" }') +
      ') => (\n  <Avatar src={src} fallback={fallback} size={size} radius="full" />\n);'
    );
  }

  // ── Separator ──
  if (type === 'separator') {
    return (
      _imp('Separator') + '\n\n' +
      _pt(name, '  orientation?: "horizontal" | "vertical";\n  size?: "1" | "2" | "3" | "4";', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ orientation = "horizontal", size = "4" }: ' + name + 'Props' : '{ orientation = "horizontal", size = "4" }') +
      ') => (\n  <Separator orientation={orientation} size={size} />\n);'
    );
  }

  // ── Generic Themes fallback — styled 래핑으로 커스텀 스타일 적용 ──
  // heading, text, card, badge, input, popover, etc.
  var imp = _imp('Box');
  return (
    imp + "\nimport styled from 'styled-components';\n\nconst Wrapper = styled(Box)`\n" + rootCss + '\n`;\n\n' +
    _pt(name, '  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ children }: ' + name + 'Props' : '{ children }') +
    ') => (\n  <Wrapper>{children}</Wrapper>\n);'
  );
}

function _buildAccordionStyled(d, name, useTs) {
  var accLabels = d.texts && d.texts.all
    ? d.texts.all.filter(function(t) { return t.length < 40; })
    : [];
  if (accLabels.length < 2) accLabels = ['Section 1', 'Section 2'];
  var items = accLabels.map(function(l, i) {
    return '  <Item value="item' + (i+1) + '">\n    <Header><Trigger>' + l + '</Trigger></Header>\n    <Content>{/* ' + l + ' */}</Content>\n  </Item>';
  }).join('\n');
  return (
    "import * as Accordion from '@radix-ui/react-accordion';\nimport styled from 'styled-components';\n\nconst Root = styled(Accordion.Root)`\n" +
    stylesToCSSProps(d.styles) +
    "\n`;\nconst Item = styled(Accordion.Item)`\n  border-bottom: 1px solid var(--border);\n`;\nconst Header = styled(Accordion.Header)`\n  margin: 0;\n`;\nconst Trigger = styled(Accordion.Trigger)`\n  width: 100%; padding: 16px; background: none; border: none;\n  text-align: left; cursor: pointer; font-weight: 500;\n`;\nconst Content = styled(Accordion.Content)`\n  padding: 0 16px 16px;\n`;\n\n" +
    _pt(name, '  defaultValue?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }') +
    ') => (\n  <Root type="single" collapsible defaultValue={defaultValue}>\n' + items + '\n  </Root>\n);'
  );
}

function _buildCollapsibleStyled(d, name, useTs) {
  var trigger = (d.texts && d.texts.title) || 'Toggle';
  return (
    "import * as Collapsible from '@radix-ui/react-collapsible';\nimport styled from 'styled-components';\n\nconst Root = styled(Collapsible.Root)`\n" +
    stylesToCSSProps(d.styles) +
    "\n`;\nconst Trigger = styled(Collapsible.Trigger)`\n  padding: 8px 16px; background: none; border: 1px solid var(--border); border-radius: 4px; cursor: pointer;\n`;\nconst Content = styled(Collapsible.Content)`\n  padding: 16px;\n`;\n\n" +
    _pt(name, '  open?: boolean;\n  onOpenChange?: (open: boolean) => void;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ open, onOpenChange, children }: ' + name + 'Props' : '{ open, onOpenChange, children }') +
    ') => (\n  <Root open={open} onOpenChange={onOpenChange}>\n    <Trigger>' + trigger + '</Trigger>\n    <Content>{children}</Content>\n  </Root>\n);'
  );
}
