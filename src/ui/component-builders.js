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

// ─── CSS Modules 빌더 — Radix Themes 기준 ───────────────────────────────────

function _rp(d) {
  return (d && d.radixProps) || {};
}

function buildButtonCSSModules(d, name, useTs) {
  var rp = _rp(d);
  var variant = rp.variant || 'solid';
  var color = rp.color;
  var size = rp.size || '2';
  var label = (d.texts && d.texts.title) || name;
  var colorProp = color ? '\n    color="' + color + '"' : '';
  return (
    _imp('Button') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  onClick?: () => void;\n  disabled?: boolean;\n  variant?: "solid" | "soft" | "outline" | "ghost";\n  size?: "1" | "2" | "3" | "4";\n  color?: string;\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ onClick, disabled, variant = "' + variant + '", size = "' + size + '", color' + (color ? ' = "' + color + '"' : '') + ', children }: ' + name + 'Props' : '{ onClick, disabled, variant = "' + variant + '", size = "' + size + '", color' + (color ? ' = "' + color + '"' : '') + ', children }') +
    ') => (\n  <Button\n    variant={variant}' + colorProp +
    '\n    size={size}\n    onClick={onClick}\n    disabled={disabled}\n    className={styles.root}\n  >\n    {children ?? \'' + label + '\'}\n  </Button>\n);'
  );
}

function buildIconButtonCSSModules(d, name, useTs) {
  return (
    _imp('IconButton') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  onClick?: () => void;\n  variant?: "solid" | "soft" | "outline" | "ghost";\n  size?: "1" | "2" | "3" | "4";\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ onClick, variant = "soft", size = "2", children }: ' + name + 'Props' : '{ onClick, variant = "soft", size = "2", children }') +
    ") => (\n  <IconButton variant={variant} size={size} onClick={onClick} className={styles.root}>\n    {children ?? '\\u2605'}\n  </IconButton>\n);"
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
    ') => (\n  <Text as="label" size="2">\n    <Flex gap="2" align="center">\n      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />\n      {label}\n    </Flex>\n  </Text>\n);'
  );
}

function buildSwitchCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  return (
    _imp('Switch, Flex, Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n  label?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ checked, onCheckedChange, label = "' + label + '" }: ' + name + 'Props' : '{ checked, onCheckedChange, label = "' + label + '" }') +
    ') => (\n  <Text as="label" size="2">\n    <Flex gap="2" align="center">\n      <Switch checked={checked} onCheckedChange={onCheckedChange} />\n      {label}\n    </Flex>\n  </Text>\n);'
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
    ') => (\n  <Tooltip content={content}>\n    {children ?? <IconButton variant="ghost" size="1">?</IconButton>}\n  </Tooltip>\n);'
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
    _imp('HoverCard, Flex, Text, Avatar') + '\n\n' +
    _pt(name, '  trigger?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ trigger }: ' + name + 'Props' : '{ trigger }') +
    ') => (\n  <HoverCard.Root>\n    <HoverCard.Trigger>\n      {trigger ?? <Text>' + triggerText + '</Text>}\n    </HoverCard.Trigger>\n    <HoverCard.Content maxWidth="300px">\n      <Flex gap="3">\n        <Avatar size="3" fallback="U" radius="full" />\n        <Flex direction="column" gap="1">\n          <Text size="2" weight="bold">' + triggerText + '</Text>\n          <Text size="1" color="gray">' + desc + '</Text>\n        </Flex>\n      </Flex>\n    </HoverCard.Content>\n  </HoverCard.Root>\n);'
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
    _imp('Avatar') + '\n\n' +
    _pt(name, '  src?: string;\n  fallback?: string;\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ src, fallback = "' + fallback + '", size = "3" }: ' + name + 'Props' : '{ src, fallback = "' + fallback + '", size = "3" }') +
    ') => (\n  <Avatar src={src} fallback={fallback} size={size} radius="full" />\n);'
  );
}

function buildBadgeCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  return (
    _imp('Badge') + '\n\n' +
    _pt(name, '  label?: string;\n  color?: string;\n  variant?: "solid" | "soft" | "outline" | "surface";', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ label = "' + label + '", color, variant = "soft" }: ' + name + 'Props' : '{ label = "' + label + '", color, variant = "soft" }') +
    ') => (\n  <Badge color={color} variant={variant}>{label}</Badge>\n);'
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
    (title ? '      {title && <Heading size="4">{title}</Heading>}\n' : '') +
    (description ? '      {description && <Text size="2" color="gray">{description}</Text>}\n' : '') +
    '      {children}\n    </Flex>\n  </Card>\n);'
  );
}

function buildHeadingCSSModules(d, name, useTs) {
  var title = (d.texts && d.texts.title) || name;
  return (
    _imp('Heading') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  children?: React.ReactNode;\n  className?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ as = "h2", size = "6", children, className }: ' + name + 'Props' : '{ as = "h2", size = "6", children, className }') +
    ') => (\n  <Heading\n    as={as}\n    size={size}\n    className={`${styles.root}${className ? " " + className : ""}`}\n  >\n    {children ?? "' + title + '"}\n  </Heading>\n);'
  );
}

function buildTextCSSModules(d, name, useTs) {
  var body = (d.texts && d.texts.title) || 'Body text';
  return (
    _imp('Text') + "\nimport styles from './" + name + ".module.css';\n\n" +
    _pt(name, '  as?: "p" | "span" | "div" | "label";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  weight?: "light" | "regular" | "medium" | "bold";\n  children?: React.ReactNode;\n  className?: string;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ as = "p", size = "3", weight = "regular", children, className }: ' + name + 'Props' : '{ as = "p", size = "3", weight = "regular", children, className }') +
    ') => (\n  <Text\n    as={as}\n    size={size}\n    weight={weight}\n    className={`${styles.root}${className ? " " + className : ""}`}\n  >\n    {children ?? "' + body + '"}\n  </Text>\n);'
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
    ') => (\n  <Flex direction="column" gap="1" className={styles.root}>\n    <Text as="label" size="2" weight="medium">{label}</Text>\n    <TextField.Root\n      value={value}\n      onChange={(e) => onChange?.(e.target.value)}\n      placeholder={placeholder}\n      disabled={disabled}\n    />\n  </Flex>\n);'
  );
}

function buildSeparatorCSSModules(d, name, useTs) {
  return (
    _imp('Separator') + '\n\n' +
    _pt(name, '  orientation?: "horizontal" | "vertical";\n  size?: "1" | "2" | "3" | "4";', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ orientation = "horizontal", size = "4" }: ' + name + 'Props' : '{ orientation = "horizontal", size = "4" }') +
    ') => (\n  <Separator orientation={orientation} size={size} />\n);'
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
    ') => (\n  <ScrollArea size="2" scrollbars="vertical" className={styles.root} style={{ maxHeight: 300 }}>\n    {children}\n  </ScrollArea>\n);'
  );
}

function buildSpinnerCSSModules(d, name, useTs) {
  return (
    _imp('Spinner') + '\n\n' +
    _pt(name, '  size?: "1" | "2" | "3";\n  loading?: boolean;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ size = "2", loading = true }: ' + name + 'Props' : '{ size = "2", loading = true }') +
    ') => (\n  <Spinner size={size} loading={loading} />\n);'
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
  var text = (d.texts && d.texts.title) || 'Callout message';
  return (
    _imp('Callout') + '\n\n' +
    _pt(name, '  color?: string;\n  variant?: "soft" | "surface" | "outline";\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ color = "blue", variant = "soft", children }: ' + name + 'Props' : '{ color = "blue", variant = "soft", children }') +
    ') => (\n  <Callout.Root color={color} variant={variant}>\n    <Callout.Text>{children ?? "' + text + '"}</Callout.Text>\n  </Callout.Root>\n);'
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
    _imp('Code') + '\n\n' +
    _pt(name, '  variant?: "soft" | "outline" | "ghost";\n  children?: React.ReactNode;', useTs) +
    'export const ' + name + ' = (' +
    (useTs ? '{ variant = "soft", children }: ' + name + 'Props' : '{ variant = "soft", children }') +
    ') => (\n  <Code variant={variant}>{children ?? "' + content + '"}</Code>\n);'
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
    return '    <Checkbox /><Text size="2">' + o + '</Text>';
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
    // 이 타입들은 커스텀 CSS가 유의미함
    if (type === 'card' || type === 'layout') {
      return '.root {\n' + rootCss + '\n}';
    }
    // heading/text — 타이포그래피 커스텀만
    if (type === 'heading') {
      var headingCss = stylesToCSSProps(filterTypographyStyles(d.styles));
      return headingCss ? '.root {\n' + headingCss + '\n}' : '/* Radix Themes handles styling via props */';
    }
    if (type === 'text') {
      var textCss = stylesToCSSProps(filterTypographyStyles(d.styles));
      return textCss ? '.root {\n' + textCss + '\n}' : '/* Radix Themes handles styling via props */';
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
      _pt(name, '  onClick?: () => void;\n  disabled?: boolean;\n  variant?: "solid" | "soft" | "outline" | "ghost";\n  size?: "1" | "2" | "3" | "4";\n  children?: React.ReactNode;', useTs) +
      'export const ' + name + ' = (' +
      (useTs ? '{ onClick, disabled, variant = "solid", size = "2", children }: ' + name + 'Props' : '{ onClick, disabled, variant = "solid", size = "2", children }') +
      ') => (\n  <' + comp + ' variant={variant} size={size} onClick={onClick} disabled={disabled}>\n    {children ?? \'' + label + '\'}\n  </' + comp + '>\n);'
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
