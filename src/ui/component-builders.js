'use strict';

export var TYPE_KEYWORDS = {
  button: ['button', 'btn', 'cta', 'action'],
  dialog: ['dialog', 'modal', 'overlay', 'popup', 'sheet'],
  select: ['select', 'dropdown', 'combobox', 'picker'],
  tabs: ['tab', 'tabs', 'tabbar'],
  tooltip: ['tooltip', 'hint', 'popover-tip'],
  checkbox: ['checkbox', 'check'],
  switch: ['switch', 'toggle'],
  accordion: ['accordion', 'collapse', 'expand'],
  popover: ['popover', 'flyout'],
};
/**
 * RADIX_COMPONENT_REGISTRY
 * 모든 Radix UI 컴포넌트를 내제화한 단일 참조 소스.
 * 각 항목: { pkg, ns, keywords, exactNames, props, installHint }
 * - pkg: npm 패키지명 (null = 네이티브)
 * - ns: namespace import 별칭 (import * as NS from pkg)
 * - keywords: detectComponentType에서 사용하는 검색어 (부분 일치)
 * - exactNames: 프레임 이름이 정확히 일치할 때 (대소문자 무관)
 * - props: 주요 props 목록 (코드 생성 참조)
 * - themeComponent: @radix-ui/themes에서 제공하는 경우 true
 */
export var RADIX_COMPONENT_REGISTRY = {
  /* ── Radix Themes ── */
  button:          { pkg: null,                         ns: null,          keywords: ['button','btn','cta','action'], themeComponent: true },
  heading:         { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['heading','headings','typography','typescale','typeface'], exactNames: [], props: 'as, size, weight, color' },
  text:            { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['text style','text styles','body text','paragraph'], exactNames: ['text','texts'], props: 'as, size, weight, color' },
  badge:           { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['badge','chip','tag','pill'], props: 'variant, color, radius' },
  card:            { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['card','tile'], props: 'size, variant' },
  input:           { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['input','textfield','text field','text-input'], props: 'size, variant, placeholder, disabled' },
  textarea:        { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['textarea','text area','multiline','multi-line'], props: 'size, variant, placeholder, resize, rows' },
  progress:        { pkg: '@radix-ui/react-progress',   ns: 'Progress',    keywords: ['progress','progress bar','progressbar','loading bar'], props: 'value, max' },
  slider:          { pkg: '@radix-ui/react-slider',     ns: 'Slider',      keywords: ['slider','range','range input','handle'], props: 'value, min, max, step, orientation' },
  'radio-group':   { pkg: '@radix-ui/react-radio-group',ns: 'RadioGroup',  keywords: ['radio','radio group','radio button','option group'], props: 'value, defaultValue, orientation' },
  'toggle':        { pkg: '@radix-ui/react-toggle',     ns: 'Toggle',      keywords: ['icon toggle','toggle button'], props: 'pressed, defaultPressed' },
  'toggle-group':  { pkg: '@radix-ui/react-toggle-group',ns:'ToggleGroup', keywords: ['toggle group','segmented control','button group'], props: 'type, value, orientation' },
  'scroll-area':   { pkg: '@radix-ui/react-scroll-area',ns: 'ScrollArea',  keywords: ['scroll area','scrollable','scroll container'], props: 'type, scrollHideDelay' },
  'dropdown-menu': { pkg: '@radix-ui/react-dropdown-menu',ns:'DropdownMenu',keywords: ['dropdown menu','action menu','options menu'], props: 'open, side, align' },
  'context-menu':  { pkg: '@radix-ui/react-context-menu',ns:'ContextMenu', keywords: ['context menu','right click menu'], props: 'open' },
  'navigation-menu':{ pkg: '@radix-ui/react-navigation-menu',ns:'NavigationMenu', keywords: ['navigation menu','nav menu','gnb menu'], props: 'orientation' },
  'hover-card':    { pkg: '@radix-ui/react-hover-card', ns: 'HoverCard',   keywords: ['hover card','preview card'], props: 'open, side, align, openDelay' },
  'alert-dialog':  { pkg: '@radix-ui/react-alert-dialog',ns:'AlertDialog', keywords: ['alert dialog','confirm dialog','warning dialog'], props: 'open, onOpenChange' },
  'collapsible':   { pkg: '@radix-ui/react-collapsible',ns: 'Collapsible', keywords: ['collapsible','expandable section'], props: 'open, defaultOpen' },
  callout:         { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['callout','notice','info box','warning box','alert box'], props: 'color, variant' },
  table:           { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['table','data table','spreadsheet'], props: 'size, variant, layout' },
  'aspect-ratio':  { pkg: '@radix-ui/react-aspect-ratio',ns:'AspectRatio', keywords: ['aspect ratio','ratio box'], props: 'ratio' },
  skeleton:        { pkg: '@radix-ui/themes',           ns: 'Theme',       keywords: ['skeleton','placeholder','loading state','shimmer'], props: 'loading, width, height' },
  /* ── 기존 전용 빌더 보유 ── */
  dialog:          { pkg: '@radix-ui/react-dialog',     ns: 'Dialog',      keywords: ['dialog','modal','confirm','alert','popup'] },
  tabs:            { pkg: '@radix-ui/react-tabs',       ns: 'Tabs',        keywords: ['tab','tabs'] },
  checkbox:        { pkg: '@radix-ui/react-checkbox',   ns: 'Checkbox',    keywords: ['checkbox','check box'] },
  switch:          { pkg: '@radix-ui/react-switch',     ns: 'Switch',      keywords: ['switch','toggle'] },
  tooltip:         { pkg: '@radix-ui/react-tooltip',    ns: 'Tooltip',     keywords: ['tooltip','hint','tip'] },
  accordion:       { pkg: '@radix-ui/react-accordion',  ns: 'Accordion',   keywords: ['accordion','collapse','expand'] },
  popover:         { pkg: '@radix-ui/react-popover',    ns: 'Popover',     keywords: ['popover','flyout'] },
  select:          { pkg: '@radix-ui/react-select',     ns: 'Select',      keywords: ['select','combobox','picker'] },
  avatar:          { pkg: '@radix-ui/react-avatar',     ns: 'Avatar',      keywords: ['avatar','profile-pic'] },
  separator:       { pkg: '@radix-ui/react-separator',  ns: 'Separator',   keywords: ['separator','divider','hr','rule'] },
  layout:          { pkg: null,                         ns: null,          keywords: [] },
};
// RADIX_MAP은 RADIX_COMPONENT_REGISTRY에서 자동 파생
export var RADIX_MAP = Object.keys(RADIX_COMPONENT_REGISTRY).reduce(function(acc, key) {
  acc[key] = RADIX_COMPONENT_REGISTRY[key].pkg || null;
  return acc;
}, {});
export var SEMANTIC_TAGS = {
  header: 'header',
  gnb: 'header',
  nav: 'nav',
  footer: 'footer',
  sidebar: 'aside',
  card: 'article',
  item: 'article',
  section: 'section',
  panel: 'section',
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
    .replace(/[^a-zA-Z0-9]+(.)/g, function (_, c) {
      return c.toUpperCase();
    })
    .replace(/^(.)/, function (c) {
      return c.toUpperCase();
    });
}
// ─── Radix UI 코드 생성 함수 (shadcn/ui 컨셉) ───────────────────────────────

function buildHeadingCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  children?: React.ReactNode;\n  className?: string;\n}\n\n'
    : '';
  var p = useTs
    ? '{ as = "h2", size = "6", children, className }: ' + name + 'Props'
    : '{ as = "h2", size = "6", children, className }';
  var title = (d.texts && d.texts.title) || name;
  return (
    "import * as Theme from '@radix-ui/themes';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Theme.Heading\n    as={as}\n    size={size}\n    className={`${styles.root}${className ? " " + className : ""}`}\n  >\n    {children ?? "' +
    title +
    '"}\n  </Theme.Heading>\n);'
  );
}
function buildTextCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  as?: "p" | "span" | "div" | "label";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  weight?: "light" | "regular" | "medium" | "bold";\n  children?: React.ReactNode;\n  className?: string;\n}\n\n'
    : '';
  var p = useTs
    ? '{ as = "p", size = "3", weight = "regular", children, className }: ' + name + 'Props'
    : '{ as = "p", size = "3", weight = "regular", children, className }';
  var body = (d.texts && d.texts.title) || 'Body text';
  return (
    "import * as Theme from '@radix-ui/themes';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Theme.Text\n    as={as}\n    size={size}\n    weight={weight}\n    className={`${styles.root}${className ? " " + className : ""}`}\n  >\n    {children ?? "' +
    body +
    '"}\n  </Theme.Text>\n);'
  );
}
function buildCardCSSModules(d, name, useTs) {
  var texts = (d && d.texts) || {};
  var title = texts.title || '';
  var description = texts.description || '';
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  title?: string;\n  description?: string;\n  children?: React.ReactNode;\n  className?: string;\n}\n\n'
    : '';
  var p = useTs
    ? '{ title, description, children, className }: ' + name + 'Props'
    : '{ title, description, children, className }';
  return (
    "import * as Theme from '@radix-ui/themes';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Theme.Card className={`${styles.root}${className ? " " + className : ""}`}>\n    <Theme.Flex direction="column" gap="2">\n' +
    (title
      ? '      {title && <Theme.Heading size="4" className={styles.title}>{title ?? "' + title + '"}</Theme.Heading>}\n'
      : '') +
    (description
      ? '      {description && <Theme.Text size="2" color="gray" className={styles.description}>{description ?? "' + description + '"}</Theme.Text>}\n'
      : '') +
    '      {children}\n    </Theme.Flex>\n  </Theme.Card>\n);'
  );
}
function buildBadgeCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  label?: string;\n  color?: string;\n  variant?: "solid" | "soft" | "outline" | "surface";\n}\n\n'
    : '';
  var p = useTs
    ? '{ label = "' + label + '", color, variant = "soft" }: ' + name + 'Props'
    : '{ label = "' + label + '", color, variant = "soft" }';
  return (
    "import * as Theme from '@radix-ui/themes';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Theme.Badge color={color} variant={variant} className={styles.root}>\n    {label}\n  </Theme.Badge>\n);'
  );
}
function buildAvatarCSSModules(d, name, useTs) {
  var fallback = (d.texts && d.texts.title && d.texts.title.slice(0, 2).toUpperCase()) || name.slice(0, 2).toUpperCase();
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  src?: string;\n  alt?: string;\n  fallback?: string;\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n}\n\n'
    : '';
  var p = useTs
    ? '{ src, alt = "", fallback = "' + fallback + '", size = "3" }: ' + name + 'Props'
    : '{ src, alt = "", fallback = "' + fallback + '", size = "3" }';
  return (
    "import * as Avatar from '@radix-ui/react-avatar';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Avatar.Root className={`${styles.root} ${styles["size" + size]}`}>\n    <Avatar.Image className={styles.image} src={src} alt={alt} />\n    <Avatar.Fallback className={styles.fallback}>{fallback}</Avatar.Fallback>\n  </Avatar.Root>\n);'
  );
}
function buildSeparatorCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  orientation?: "horizontal" | "vertical";\n  decorative?: boolean;\n  className?: string;\n}\n\n'
    : '';
  var p = useTs
    ? '{ orientation = "horizontal", decorative = true, className }: ' + name + 'Props'
    : '{ orientation = "horizontal", decorative = true, className }';
  return (
    "import * as Separator from '@radix-ui/react-separator';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Separator.Root\n    orientation={orientation}\n    decorative={decorative}\n    className={`${styles.root} ${styles[orientation]}${className ? " " + className : ""}`}\n  />\n);'
  );
}
function buildInputCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Enter value…';
  var label = (d.texts && d.texts.description) || name;
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  value?: string;\n  onChange?: (value: string) => void;\n  placeholder?: string;\n  label?: string;\n  disabled?: boolean;\n}\n\n'
    : '';
  var p = useTs
    ? '{ value, onChange, placeholder = "' + placeholder + '", label = "' + label + '", disabled }: ' + name + 'Props'
    : '{ value, onChange, placeholder = "' + placeholder + '", label = "' + label + '", disabled }';
  return (
    "import * as Theme from '@radix-ui/themes';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <div className={styles.root}>\n    <Theme.Text as="label" size="2" className={styles.label}>{label}</Theme.Text>\n    <Theme.TextField.Root\n      className={styles.input}\n      value={value}\n      onChange={(e) => onChange?.(e.target.value)}\n      placeholder={placeholder}\n      disabled={disabled}\n    />\n  </div>\n);'
  );
}
/**
 * 레지스트리 기반 제네릭 빌더 — 전용 빌더가 없는 새 타입에 사용
 */
function buildGenericCSSModules(d, name, useTs, type) {
  var entry = RADIX_COMPONENT_REGISTRY[type] || {};
  var ns = entry.ns || 'Radix';
  var pkg = entry.pkg || '';
  var importLine = pkg ? "import * as " + ns + " from '" + pkg + "';" : '';
  var templates = {
    'textarea': {
      props: 'value?: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; disabled?: boolean',
      defs: '{ value, onChange, placeholder = "' + ((d.texts && d.texts.title) || 'Enter text…') + '", rows = 4, disabled }',
      jsx: '<Theme.TextArea\n    value={value}\n    onChange={(e) => onChange?.(e.target.value)}\n    placeholder={placeholder}\n    rows={rows}\n    disabled={disabled}\n    className={styles.root}\n  />',
      importLine: "import * as Theme from '@radix-ui/themes';",
    },
    'progress': {
      props: 'value?: number; max?: number',
      defs: '{ value = 50, max = 100 }',
      jsx: '<Progress.Root value={value} max={max} className={styles.root}>\n    <Progress.Indicator\n      className={styles.indicator}\n      style={{ transform: `translateX(-${100 - ((value ?? 50) / (max ?? 100)) * 100}%)` }}\n    />\n  </Progress.Root>',
    },
    'slider': {
      props: 'value?: number[]; min?: number; max?: number; step?: number; onValueChange?: (v: number[]) => void',
      defs: '{ value = [50], min = 0, max = 100, step = 1, onValueChange }',
      jsx: '<Slider.Root\n    value={value}\n    min={min}\n    max={max}\n    step={step}\n    onValueChange={onValueChange}\n    className={styles.root}\n  >\n    <Slider.Track className={styles.track}>\n      <Slider.Range className={styles.range} />\n    </Slider.Track>\n    <Slider.Thumb className={styles.thumb} aria-label="Value" />\n  </Slider.Root>',
    },
    'radio-group': {
      props: 'value?: string; onValueChange?: (v: string) => void; options?: string[]',
      defs: '{ value, onValueChange, options = ["Option 1", "Option 2"] }',
      jsx: '<RadioGroup.Root value={value} onValueChange={onValueChange} className={styles.root}>\n    {options.map((opt) => (\n      <div key={opt} className={styles.item}>\n        <RadioGroup.Item value={opt} id={opt} className={styles.radio}>\n          <RadioGroup.Indicator className={styles.indicator} />\n        </RadioGroup.Item>\n        <label htmlFor={opt} className={styles.label}>{opt}</label>\n      </div>\n    ))}\n  </RadioGroup.Root>',
    },
    'dropdown-menu': {
      props: 'trigger?: string; items?: string[]',
      defs: '{ trigger = "Open", items = ["Item 1", "Item 2", "Item 3"] }',
      jsx: '<DropdownMenu.Root>\n    <DropdownMenu.Trigger asChild>\n      <button className={styles.trigger}>{trigger}</button>\n    </DropdownMenu.Trigger>\n    <DropdownMenu.Portal>\n      <DropdownMenu.Content className={styles.content}>\n        {items.map((item) => (\n          <DropdownMenu.Item key={item} className={styles.item}>{item}</DropdownMenu.Item>\n        ))}\n      </DropdownMenu.Content>\n    </DropdownMenu.Portal>\n  </DropdownMenu.Root>',
    },
    'alert-dialog': {
      props: 'open: boolean; onOpenChange: (open: boolean) => void; title?: string; description?: string',
      defs: '{ open, onOpenChange, title = "' + ((d.texts && d.texts.title) || 'Confirm') + '", description = "' + ((d.texts && d.texts.description) || 'Are you sure?') + '" }',
      jsx: '<AlertDialog.Root open={open} onOpenChange={onOpenChange}>\n    <AlertDialog.Portal>\n      <AlertDialog.Overlay className={styles.overlay} />\n      <AlertDialog.Content className={styles.content}>\n        <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>\n        <AlertDialog.Description className={styles.description}>{description}</AlertDialog.Description>\n        <div className={styles.footer}>\n          <AlertDialog.Cancel asChild>\n            <button className={styles.cancelBtn}>Cancel</button>\n          </AlertDialog.Cancel>\n          <AlertDialog.Action asChild>\n            <button className={styles.confirmBtn}>Confirm</button>\n          </AlertDialog.Action>\n        </div>\n      </AlertDialog.Content>\n    </AlertDialog.Portal>\n  </AlertDialog.Root>',
    },
    'callout': {
      props: 'color?: string; variant?: "soft" | "surface" | "outline"; children?: React.ReactNode',
      defs: '{ color = "blue", variant = "soft", children }',
      jsx: '<Theme.Callout.Root color={color} variant={variant} className={styles.root}>\n    <Theme.Callout.Icon>ℹ</Theme.Callout.Icon>\n    <Theme.Callout.Text>{children ?? "' + ((d.texts && d.texts.title) || 'Callout message') + '"}</Theme.Callout.Text>\n  </Theme.Callout.Root>',
      importLine: "import * as Theme from '@radix-ui/themes';",
    },
    'table': {
      props: 'rows?: Record<string, string>[]',
      defs: '{ rows = [] }',
      jsx: '<Theme.Table.Root className={styles.root}>\n    <Theme.Table.Body>\n      {rows.map((row, i) => (\n        <Theme.Table.Row key={i}>\n          {Object.values(row).map((cell, j) => (\n            <Theme.Table.Cell key={j}>{cell}</Theme.Table.Cell>\n          ))}\n        </Theme.Table.Row>\n      ))}\n    </Theme.Table.Body>\n  </Theme.Table.Root>',
      importLine: "import * as Theme from '@radix-ui/themes';",
    },
    'collapsible': {
      props: 'open?: boolean; onOpenChange?: (open: boolean) => void; trigger?: string; children?: React.ReactNode',
      defs: '{ open, onOpenChange, trigger = "' + ((d.texts && d.texts.title) || 'Toggle') + '", children }',
      jsx: '<Collapsible.Root open={open} onOpenChange={onOpenChange} className={styles.root}>\n    <Collapsible.Trigger className={styles.trigger}>{trigger}</Collapsible.Trigger>\n    <Collapsible.Content className={styles.content}>{children}</Collapsible.Content>\n  </Collapsible.Root>',
    },
    'toggle': {
      props: 'pressed?: boolean; onPressedChange?: (v: boolean) => void; children?: React.ReactNode',
      defs: '{ pressed, onPressedChange, children }',
      jsx: '<Toggle.Root pressed={pressed} onPressedChange={onPressedChange} className={styles.root}>\n    {children}\n  </Toggle.Root>',
    },
    'scroll-area': {
      props: 'children?: React.ReactNode; className?: string',
      defs: '{ children, className }',
      jsx: '<ScrollArea.Root className={`${styles.root}${className ? " " + className : ""}`}>\n    <ScrollArea.Viewport className={styles.viewport}>{children}</ScrollArea.Viewport>\n    <ScrollArea.Scrollbar orientation="vertical" className={styles.scrollbar}>\n      <ScrollArea.Thumb className={styles.thumb} />\n    </ScrollArea.Scrollbar>\n  </ScrollArea.Root>',
    },
    'skeleton': {
      props: 'loading?: boolean; width?: string; height?: string',
      defs: '{ loading = true, width, height }',
      jsx: '<Theme.Skeleton loading={loading} width={width} height={height} className={styles.root} />',
      importLine: "import * as Theme from '@radix-ui/themes';",
    },
  };
  var tpl = templates[type];
  if (!tpl) {
    // 알 수 없는 타입 → layout 폴백
    return buildLayoutCSSModules(d, name, useTs);
  }
  var resolvedImport = tpl.importLine || importLine;
  var pt = useTs ? 'interface ' + name + 'Props {\n  ' + tpl.props + ';\n}\n\n' : '';
  var p = useTs ? tpl.defs + ': ' + name + 'Props' : tpl.defs;
  return (
    resolvedImport + "\nimport styles from './" + name + ".module.css';\n\n" +
    pt +
    'export const ' + name + ' = (' + p + ') => (\n  ' + tpl.jsx + '\n);'
  );
}
function buildDialogCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  open: boolean;\n  onOpenChange: (open: boolean) => void;\n}\n\n'
    : '';
  var p = useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }';
  var title = d.texts.title || 'Dialog Title';
  var desc = d.texts.description
    ? '\n        <Dialog.Description className={styles.description}>\n          ' +
      d.texts.description +
      '\n        </Dialog.Description>'
    : '';
  var cancel = (d.texts.actions && d.texts.actions[0]) || 'Cancel';
  var confirm = (d.texts.actions && d.texts.actions[1]) || 'Confirm';
  return (
    "import * as Dialog from '@radix-ui/react-dialog';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Portal>\n      <Dialog.Overlay className={styles.overlay} />\n      <Dialog.Content className={styles.content} aria-describedby={undefined}>\n        <Dialog.Title className={styles.title}>' +
    title +
    '</Dialog.Title>' +
    desc +
    '\n        <div className={styles.footer}>\n          <Dialog.Close asChild>\n            <button className={styles.cancelBtn}>' +
    cancel +
    '</button>\n          </Dialog.Close>\n          <button className={styles.confirmBtn}>' +
    confirm +
    '</button>\n        </div>\n      </Dialog.Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);'
  );
}
function buildButtonCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;\n}\n\n'
    : '';
  var p = useTs
    ? '{ onClick, disabled, children }: ' + name + 'Props'
    : '{ onClick, disabled, children }';
  var label = (d.texts && d.texts.title) || name;
  return (
    "import styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <button\n    className={styles.root}\n    onClick={onClick}\n    disabled={disabled}\n    type="button"\n  >\n    {children ?? \'' +
    label +
    "'}\n  </button>\n);"
  );
}
function buildTabsCSSModules(d, name, useTs) {
  var labels =
    d.texts && d.texts.all
      ? d.texts.all.filter(function (t) {
          return t.length < 30;
        })
      : [];
  if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs
    ? "{ defaultValue = '" + labels[0] + "' }: " + name + 'Props'
    : "{ defaultValue = '" + labels[0] + "' }";
  var triggers = labels
    .map(function (l, i) {
      return (
        '      <Tabs.Trigger className={styles.trigger} value="tab' +
        (i + 1) +
        '">' +
        l +
        '</Tabs.Trigger>'
      );
    })
    .join('\n');
  var contents = labels
    .map(function (l, i) {
      return (
        '    <Tabs.Content className={styles.content} value="tab' +
        (i + 1) +
        '">\n      {/* ' +
        l +
        ' 내용 */}\n    </Tabs.Content>'
      );
    })
    .join('\n');
  return (
    "import * as Tabs from '@radix-ui/react-tabs';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Tabs.Root className={styles.root} defaultValue={defaultValue}>\n    <Tabs.List className={styles.list}>\n' +
    triggers +
    '\n    </Tabs.List>\n' +
    contents +
    '\n  </Tabs.Root>\n);'
  );
}
function buildCheckboxCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
    : '';
  var p = useTs
    ? '{ checked, onCheckedChange }: ' + name + 'Props'
    : '{ checked, onCheckedChange }';
  return (
    "import * as Checkbox from '@radix-ui/react-checkbox';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <label className={styles.root}>\n    <Checkbox.Root className={styles.checkbox} checked={checked} onCheckedChange={onCheckedChange}>\n      <Checkbox.Indicator className={styles.indicator}>\n        <svg viewBox="0 0 16 16" width="12" height="12">\n          <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" />\n        </svg>\n      </Checkbox.Indicator>\n    </Checkbox.Root>\n    <span className={styles.label}>' +
    label +
    '</span>\n  </label>\n);'
  );
}
function buildSwitchCSSModules(d, name, useTs) {
  var label = (d.texts && d.texts.title) || name;
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
    : '';
  var p = useTs
    ? '{ checked, onCheckedChange }: ' + name + 'Props'
    : '{ checked, onCheckedChange }';
  return (
    "import * as Switch from '@radix-ui/react-switch';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <label className={styles.root}>\n    <span className={styles.label}>' +
    label +
    '</span>\n    <Switch.Root className={styles.switch} checked={checked} onCheckedChange={onCheckedChange}>\n      <Switch.Thumb className={styles.thumb} />\n    </Switch.Root>\n  </label>\n);'
  );
}
function buildSelectCSSModules(d, name, useTs) {
  var placeholder = (d.texts && d.texts.title) || 'Select...';
  var opts =
    d.texts && d.texts.all
      ? d.texts.all.slice(1).filter(function (t) {
          return t.length < 40;
        })
      : [];
  if (opts.length === 0) opts = ['Option 1', 'Option 2', 'Option 3'];
  var pt = useTs
    ? 'interface ' +
      name +
      'Props {\n  value?: string;\n  onValueChange?: (value: string) => void;\n}\n\n'
    : '';
  var p = useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }';
  var items = opts
    .map(function (o) {
      var v = o.toLowerCase().replace(/\s+/g, '-');
      return (
        '      <Select.Item className={styles.item} value="' +
        v +
        '">\n        <Select.ItemText>' +
        o +
        '</Select.ItemText>\n      </Select.Item>'
      );
    })
    .join('\n');
  return (
    "import * as Select from '@radix-ui/react-select';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Select.Trigger className={styles.trigger}>\n      <Select.Value placeholder="' +
    placeholder +
    '" />\n    </Select.Trigger>\n    <Select.Portal>\n      <Select.Content className={styles.content}>\n        <Select.Viewport>\n' +
    items +
    '\n        </Select.Viewport>\n      </Select.Content>\n    </Select.Portal>\n  </Select.Root>\n);'
  );
}
function buildTooltipCSSModules(d, name, useTs) {
  var content = (d.texts && d.texts.title) || 'Tooltip content';
  var trigger = (d.texts && d.texts.all && d.texts.all[1]) || '?';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Tooltip from '@radix-ui/react-tooltip';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ") => (\n  <Tooltip.Provider>\n    <Tooltip.Root>\n      <Tooltip.Trigger asChild>\n        <button className={styles.trigger}>{children ?? '" +
    trigger +
    "'}</button>\n      </Tooltip.Trigger>\n      <Tooltip.Portal>\n        <Tooltip.Content className={styles.content} sideOffset={4}>\n          " +
    content +
    '\n          <Tooltip.Arrow className={styles.arrow} />\n        </Tooltip.Content>\n      </Tooltip.Portal>\n    </Tooltip.Root>\n  </Tooltip.Provider>\n);'
  );
}
function buildAccordionCSSModules(d, name, useTs) {
  var items =
    d.texts && d.texts.all
      ? d.texts.all.filter(function (t) {
          return t.length < 50;
        })
      : [];
  if (items.length < 2) items = ['Item 1', 'Item 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }';
  var accItems = items
    .map(function (l, i) {
      var v = 'item-' + (i + 1);
      return (
        '    <Accordion.Item className={styles.item} value="' +
        v +
        '">\n      <Accordion.Trigger className={styles.trigger}>' +
        l +
        '</Accordion.Trigger>\n      <Accordion.Content className={styles.content}>\n        {/* ' +
        l +
        ' 내용 */}\n      </Accordion.Content>\n    </Accordion.Item>'
      );
    })
    .join('\n');
  return (
    "import * as Accordion from '@radix-ui/react-accordion';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Accordion.Root className={styles.root} type="single" defaultValue={defaultValue} collapsible>\n' +
    accItems +
    '\n  </Accordion.Root>\n);'
  );
}
function buildPopoverCSSModules(d, name, useTs) {
  var triggerLabel = (d.texts && d.texts.title) || 'Open';
  var content = (d.texts && d.texts.description) || 'Popover content';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Popover from '@radix-ui/react-popover';\nimport styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <Popover.Root>\n    <Popover.Trigger asChild>\n      <button className={styles.trigger}>' +
    triggerLabel +
    '</button>\n    </Popover.Trigger>\n    <Popover.Portal>\n      <Popover.Content className={styles.content} sideOffset={4}>\n        {children ?? <p>' +
    content +
    '</p>}\n        <Popover.Close className={styles.closeBtn} aria-label="Close">×</Popover.Close>\n        <Popover.Arrow className={styles.arrow} />\n      </Popover.Content>\n    </Popover.Portal>\n  </Popover.Root>\n);'
  );
}
function buildLayoutCSSModules(d, name, useTs) {
  var tag = getSemanticTag(name);
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import styles from './" +
    name +
    ".module.css';\n\n" +
    pt +
    'export const ' +
    name +
    ' = (' +
    p +
    ') => (\n  <' +
    tag +
    ' className={styles.root}>\n    {children}\n  </' +
    tag +
    '>\n);'
  );
}
export function buildRadixCSSModules(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  switch (type) {
    case 'dialog':
      return buildDialogCSSModules(d, name, useTs);
    case 'button':
      return buildButtonCSSModules(d, name, useTs);
    case 'tabs':
      return buildTabsCSSModules(d, name, useTs);
    case 'checkbox':
      return buildCheckboxCSSModules(d, name, useTs);
    case 'switch':
      return buildSwitchCSSModules(d, name, useTs);
    case 'select':
      return buildSelectCSSModules(d, name, useTs);
    case 'tooltip':
      return buildTooltipCSSModules(d, name, useTs);
    case 'accordion':
      return buildAccordionCSSModules(d, name, useTs);
    case 'popover':
      return buildPopoverCSSModules(d, name, useTs);
    case 'heading':
      return buildHeadingCSSModules(d, name, useTs);
    case 'text':
      return buildTextCSSModules(d, name, useTs);
    case 'card':
      return buildCardCSSModules(d, name, useTs);
    case 'badge':
      return buildBadgeCSSModules(d, name, useTs);
    case 'avatar':
      return buildAvatarCSSModules(d, name, useTs);
    case 'separator':
      return buildSeparatorCSSModules(d, name, useTs);
    case 'input':
      return buildInputCSSModules(d, name, useTs);
    case 'textarea':
    case 'progress':
    case 'slider':
    case 'radio-group':
    case 'dropdown-menu':
    case 'alert-dialog':
    case 'callout':
    case 'table':
    case 'collapsible':
    case 'toggle':
    case 'scroll-area':
    case 'skeleton':
      return buildGenericCSSModules(d, name, useTs, type);
    default:
      return buildLayoutCSSModules(d, name, useTs);
  }
}
export function buildRadixCSS(d) {
  var type = (d && d.detectedType) || 'layout';
  var rootCss = stylesToCSSProps(d.styles);
  if (type === 'dialog') {
    return (
      '.overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.5);\n}\n\n.content {\n' +
      rootCss +
      '\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%,-50%);\n}\n\n.title {\n  font-size: 18px;\n  font-weight: 600;\n  margin-bottom: 8px;\n}\n\n.description {\n  color: var(--text-secondary);\n  margin-bottom: 16px;\n}\n\n.footer {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n  margin-top: 16px;\n}\n\n.cancelBtn {\n  padding: 6px 14px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm, 4px);\n  background: none;\n  cursor: pointer;\n}\n\n.confirmBtn {\n  padding: 6px 14px;\n  background: var(--color-primary, #2d7ff9);\n  color: #fff;\n  border: none;\n  border-radius: var(--radius-sm, 4px);\n  cursor: pointer;\n}'
    );
  }
  if (type === 'tabs') {
    return (
      '.root {\n' +
      rootCss +
      "\n}\n\n.list {\n  display: flex;\n  border-bottom: 1px solid var(--border);\n}\n\n.trigger {\n  padding: 8px 16px;\n  border: none;\n  background: none;\n  cursor: pointer;\n  border-bottom: 2px solid transparent;\n}\n\n.trigger[data-state='active'] {\n  border-bottom-color: var(--color-primary, #2d7ff9);\n  font-weight: 600;\n}\n\n.content {\n  padding: 16px 0;\n}"
    );
  }
  if (type === 'checkbox') {
    return ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n}\n\n.checkbox {\n  width: 18px;\n  height: 18px;\n  border: 2px solid var(--border);\n  border-radius: 3px;\n  background: var(--surface);\n}\n\n.checkbox[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n  border-color: var(--color-primary, #2d7ff9);\n}\n\n.indicator {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #fff;\n}\n\n.label {\n  font-size: 14px;\n}";
  }
  if (type === 'switch') {
    return ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.switch {\n  width: 42px;\n  height: 24px;\n  border-radius: 12px;\n  background: var(--border);\n  position: relative;\n  cursor: pointer;\n  border: none;\n}\n\n.switch[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n}\n\n.thumb {\n  display: block;\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  background: #fff;\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  transition: transform 150ms;\n}\n\n.thumb[data-state='checked'] {\n  transform: translateX(18px);\n}";
  }
  if (type === 'select') {
    return (
      '.trigger {\n' +
      rootCss +
      '\n  display: inline-flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  gap: 8px;\n  cursor: pointer;\n}\n\n.content {\n  background: var(--color-surface, #fff);\n  border: 1px solid var(--border);\n  border-radius: 6px;\n  padding: 4px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n}\n\n.item {\n  padding: 8px 12px;\n  cursor: pointer;\n  border-radius: 4px;\n}\n\n.item[data-highlighted] {\n  background: var(--color-primary-light);\n  outline: none;\n}'
    );
  }
  if (type === 'tooltip') {
    return '.content {\n  background: #1a1a1a;\n  color: #fff;\n  padding: 6px 10px;\n  border-radius: 4px;\n  font-size: 12px;\n  animation: fadeIn 150ms ease;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(2px); }\n  to   { opacity: 1; transform: translateY(0); }\n}';
  }
  if (type === 'accordion') {
    return (
      '.root {\n' +
      rootCss +
      "\n}\n\n.item {\n  border-bottom: 1px solid var(--border);\n}\n\n.trigger {\n  width: 100%;\n  padding: 16px;\n  background: none;\n  border: none;\n  text-align: left;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  display: flex;\n  justify-content: space-between;\n}\n\n.trigger[data-state='open'] {\n  color: var(--color-primary, #2d7ff9);\n}\n\n.content {\n  padding: 0 16px 16px;\n  font-size: 14px;\n  color: var(--text-secondary);\n}"
    );
  }
  if (type === 'popover') {
    return (
      '.content {\n' +
      rootCss +
      '\n  border-radius: 8px;\n  box-shadow: 0 4px 16px rgba(0,0,0,0.15);\n  padding: 16px;\n}\n\n.closeBtn {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 16px;\n}'
    );
  }
  if (type === 'heading') {
    var headingCss = stylesToCSSProps(filterTypographyStyles(d.styles));
    return '.root {\n' + (headingCss || '') + '\n  line-height: 1.2;\n  letter-spacing: -0.02em;\n}';
  }
  if (type === 'text') {
    var textCss = stylesToCSSProps(filterTypographyStyles(d.styles));
    return '.root {\n' + (textCss || '') + '\n  line-height: 1.5;\n}';
  }
  if (type === 'card') {
    return (
      '.root {\n' +
      rootCss +
      '\n  border-radius: var(--radius-md, 8px);\n  box-shadow: 0 1px 4px rgba(0,0,0,0.08);\n  padding: 16px;\n  overflow: hidden;\n}\n\n.title {\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--text-primary);\n}\n\n.description {\n  font-size: 13px;\n  color: var(--text-secondary);\n}'
    );
  }
  if (type === 'badge') {
    return (
      '.root {\n' +
      rootCss +
      '\n  display: inline-flex;\n  align-items: center;\n  padding: 2px 8px;\n  border-radius: 999px;\n  font-size: 12px;\n  font-weight: 500;\n}'
    );
  }
  if (type === 'avatar') {
    return (
      '.root {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  overflow: hidden;\n  ' +
      rootCss +
      '\n}\n\n.image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.fallback {\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--text-primary);\n  background: var(--surface2);\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.size1 { width: 16px; height: 16px; }\n.size2 { width: 24px; height: 24px; }\n.size3 { width: 32px; height: 32px; }\n.size4 { width: 40px; height: 40px; }\n.size5 { width: 48px; height: 48px; }'
    );
  }
  if (type === 'separator') {
    return (
      '.root {\n  border: none;\n  background: var(--border);\n}\n\n.horizontal {\n  width: 100%;\n  height: 1px;\n}\n\n.vertical {\n  width: 1px;\n  height: 100%;\n}'
    );
  }
  if (type === 'input') {
    return (
      '.root {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  ' +
      rootCss +
      '\n}\n\n.label {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--text-secondary);\n}\n\n.input {\n  width: 100%;\n  padding: 8px 12px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm, 4px);\n  font-size: 14px;\n  background: var(--surface);\n  color: var(--text-primary);\n  outline: none;\n}\n\n.input:focus {\n  border-color: var(--color-primary, #2d7ff9);\n  box-shadow: 0 0 0 2px rgba(45,127,249,0.15);\n}'
    );
  }
  return '.root {\n' + rootCss + '\n}';
}
export function buildRadixStyled(d, name, useTs) {
  var type = (d && d.detectedType) || 'layout';
  if (type === 'dialog') {
    var pt = useTs
      ? 'interface ' +
        name +
        'Props {\n  open: boolean;\n  onOpenChange: (open: boolean) => void;\n}\n\n'
      : '';
    var p = useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }';
    var title = (d.texts && d.texts.title) || 'Dialog Title';
    var cancel = (d.texts && d.texts.actions && d.texts.actions[0]) || 'Cancel';
    var confirm = (d.texts && d.texts.actions && d.texts.actions[1]) || 'Confirm';
    return (
      "import * as Dialog from '@radix-ui/react-dialog';\nimport styled from 'styled-components';\n\nconst Overlay = styled(Dialog.Overlay)`\n  position: fixed; inset: 0; background: rgba(0,0,0,0.5);\n`;\nconst Content = styled(Dialog.Content)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  position: fixed; top: 50%; left: 50%;\n  transform: translate(-50%,-50%);\n`;\n\n' +
      pt +
      'export const ' +
      name +
      ' = (' +
      p +
      ') => (\n  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n    <Dialog.Portal>\n      <Overlay />\n      <Content aria-describedby={undefined}>\n        <Dialog.Title>' +
      title +
      "</Dialog.Title>\n        <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>\n          <Dialog.Close asChild><button>" +
      cancel +
      '</button></Dialog.Close>\n          <button>' +
      confirm +
      '</button>\n        </div>\n      </Content>\n    </Dialog.Portal>\n  </Dialog.Root>\n);'
    );
  }
  if (type === 'button') {
    var pt2 = useTs
      ? 'interface ' +
        name +
        'Props {\n  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;\n}\n\n'
      : '';
    var p2 = useTs
      ? '{ onClick, disabled, children }: ' + name + 'Props'
      : '{ onClick, disabled, children }';
    var label = (d.texts && d.texts.title) || name;
    return (
      "import styled from 'styled-components';\n\nconst StyledButton = styled.button`\n" +
      stylesToCSSProps(d.styles) +
      '\n  cursor: pointer;\n  &:hover { opacity: 0.9; }\n  &:disabled { opacity: 0.5; cursor: not-allowed; }\n`;\n\n' +
      pt2 +
      'export const ' +
      name +
      ' = (' +
      p2 +
      ') => (\n  <StyledButton onClick={onClick} disabled={disabled} type="button">\n    {children ?? \'' +
      label +
      "'}\n  </StyledButton>\n);"
    );
  }
  if (type === 'tabs') {
    var labels =
      d.texts && d.texts.all
        ? d.texts.all.filter(function (t) {
            return t.length < 30;
          })
        : [];
    if (labels.length < 2) labels = ['Tab 1', 'Tab 2'];
    var triggers = labels
      .map(function (l, i) {
        return '      <Tabs.Trigger value="tab' + (i + 1) + '">' + l + '</Tabs.Trigger>';
      })
      .join('\n');
    var contents = labels
      .map(function (l, i) {
        return (
          '    <Tabs.Content value="tab' +
          (i + 1) +
          '">\n      {/* ' +
          l +
          ' 내용 */}\n    </Tabs.Content>'
        );
      })
      .join('\n');
    var ptTabs = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
    var pTabs = useTs
      ? "{ defaultValue = '" + labels[0] + "' }: " + name + 'Props'
      : "{ defaultValue = '" + labels[0] + "' }";
    return (
      "import * as Tabs from '@radix-ui/react-tabs';\nimport styled from 'styled-components';\n\nconst Root = styled(Tabs.Root)`\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst List = styled(Tabs.List)`\n  display: flex;\n  border-bottom: 1px solid var(--border);\n`;\nconst Trigger = styled(Tabs.Trigger)`\n  padding: 8px 16px; background: none; border: none;\n  border-bottom: 2px solid transparent; cursor: pointer;\n  &[data-state="active"] { border-bottom-color: var(--color-primary, #2d7ff9); font-weight: 600; }\n`;\nconst Content = styled(Tabs.Content)`\n  padding: 16px 0;\n`;\n\n' +
      ptTabs +
      'export const ' +
      name +
      ' = (' +
      pTabs +
      ') => (\n  <Root defaultValue={defaultValue}>\n    <List>\n' +
      triggers +
      '\n    </List>\n' +
      contents +
      '\n  </Root>\n);'
    );
  }
  if (type === 'checkbox') {
    var labelCb = (d.texts && d.texts.title) || name;
    var ptCb = useTs
      ? 'interface ' +
        name +
        'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
      : '';
    var pCb = useTs
      ? '{ checked, onCheckedChange }: ' + name + 'Props'
      : '{ checked, onCheckedChange }';
    return (
      "import * as Checkbox from '@radix-ui/react-checkbox';\nimport styled from 'styled-components';\n\nconst Root = styled.div`\n  display: flex; align-items: center; gap: 8px; cursor: pointer;\n`;\nconst StyledCheckbox = styled(Checkbox.Root)`\n  width: 18px; height: 18px; border: 2px solid var(--border);\n  border-radius: 3px; background: var(--color-surface);\n  &[data-state=\"checked\"] { background: var(--color-primary, #2d7ff9); border-color: var(--color-primary, #2d7ff9); }\n`;\nconst Indicator = styled(Checkbox.Indicator)`\n  display: flex; align-items: center; justify-content: center; color: #fff;\n`;\n\n" +
      ptCb +
      'export const ' +
      name +
      ' = (' +
      pCb +
      ') => (\n  <Root>\n    <StyledCheckbox checked={checked} onCheckedChange={onCheckedChange}>\n      <Indicator>✓</Indicator>\n    </StyledCheckbox>\n    <label>' +
      labelCb +
      '</label>\n  </Root>\n);'
    );
  }
  if (type === 'switch') {
    var labelSw = (d.texts && d.texts.title) || name;
    var ptSw = useTs
      ? 'interface ' +
        name +
        'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n'
      : '';
    var pSw = useTs
      ? '{ checked, onCheckedChange }: ' + name + 'Props'
      : '{ checked, onCheckedChange }';
    return (
      'import * as Switch from \'@radix-ui/react-switch\';\nimport styled from \'styled-components\';\n\nconst Root = styled.div`\n  display: flex; align-items: center; gap: 8px;\n`;\nconst StyledSwitch = styled(Switch.Root)`\n  width: 42px; height: 24px; border-radius: 12px;\n  background: var(--border); border: none; cursor: pointer; position: relative;\n  &[data-state="checked"] { background: var(--color-primary, #2d7ff9); }\n`;\nconst Thumb = styled(Switch.Thumb)`\n  display: block; width: 18px; height: 18px; border-radius: 50%;\n  background: #fff; position: absolute; top: 3px; left: 3px;\n  transition: transform 150ms;\n  &[data-state="checked"] { transform: translateX(18px); }\n`;\n\n' +
      ptSw +
      'export const ' +
      name +
      ' = (' +
      pSw +
      ') => (\n  <Root>\n    <StyledSwitch checked={checked} onCheckedChange={onCheckedChange}>\n      <Thumb />\n    </StyledSwitch>\n    <span>' +
      labelSw +
      '</span>\n  </Root>\n);'
    );
  }
  if (type === 'select') {
    var ptSel = useTs
      ? 'interface ' +
        name +
        'Props {\n  value?: string;\n  onValueChange?: (value: string) => void;\n  placeholder?: string;\n}\n\n'
      : '';
    var pSel = useTs
      ? '{ value, onValueChange, placeholder = "선택..." }: ' + name + 'Props'
      : '{ value, onValueChange, placeholder = "선택..." }';
    return (
      "import * as Select from '@radix-ui/react-select';\nimport styled from 'styled-components';\n\nconst Trigger = styled(Select.Trigger)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  display: inline-flex; align-items: center; justify-content: space-between;\n  padding: 8px 12px; gap: 8px; cursor: pointer;\n`;\nconst Content = styled(Select.Content)`\n  background: var(--color-surface); border: 1px solid var(--border);\n  border-radius: 6px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n`;\nconst Item = styled(Select.Item)`\n  padding: 8px 12px; cursor: pointer; border-radius: 4px;\n  &[data-highlighted] { background: var(--color-primary-light); outline: none; }\n`;\n\n' +
      ptSel +
      'export const ' +
      name +
      ' = (' +
      pSel +
      ') => (\n  <Select.Root value={value} onValueChange={onValueChange}>\n    <Trigger>\n      <Select.Value placeholder={placeholder} />\n      <Select.Icon>▾</Select.Icon>\n    </Trigger>\n    <Select.Portal>\n      <Content>\n        <Select.Viewport>\n          <Item value="option1"><Select.ItemText>옵션 1</Select.ItemText></Item>\n          <Item value="option2"><Select.ItemText>옵션 2</Select.ItemText></Item>\n        </Select.Viewport>\n      </Content>\n    </Select.Portal>\n  </Select.Root>\n);'
    );
  }
  if (type === 'tooltip') {
    var labelTt = (d.texts && d.texts.title) || '툴팁 내용';
    var ptTt = useTs
      ? 'interface ' + name + 'Props {\n  children: React.ReactNode;\n  content?: string;\n}\n\n'
      : '';
    var pTt = useTs
      ? '{ children, content = "' + labelTt + '" }: ' + name + 'Props'
      : '{ children, content = "' + labelTt + '" }';
    return (
      "import * as Tooltip from '@radix-ui/react-tooltip';\nimport styled from 'styled-components';\n\nconst Content = styled(Tooltip.Content)`\n  background: #1a1a1a; color: #fff; padding: 6px 10px;\n  border-radius: 4px; font-size: 12px;\n  animation: fadeIn 150ms ease;\n`;\n\n" +
      ptTt +
      'export const ' +
      name +
      ' = (' +
      pTt +
      ') => (\n  <Tooltip.Provider>\n    <Tooltip.Root>\n      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>\n      <Tooltip.Portal>\n        <Content sideOffset={4}>{content}<Tooltip.Arrow /></Content>\n      </Tooltip.Portal>\n    </Tooltip.Root>\n  </Tooltip.Provider>\n);'
    );
  }
  if (type === 'accordion') {
    var accLabels =
      d.texts && d.texts.all
        ? d.texts.all.filter(function (t) {
            return t.length < 40;
          })
        : [];
    if (accLabels.length < 2) accLabels = ['섹션 1', '섹션 2'];
    var items = accLabels
      .map(function (l, i) {
        return (
          '  <Item value="item' +
          (i + 1) +
          '">\n    <Header><Trigger>' +
          l +
          '</Trigger></Header>\n    <Content>{/* ' +
          l +
          ' 내용 */}</Content>\n  </Item>'
        );
      })
      .join('\n');
    var ptAcc = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
    var pAcc = useTs ? '{ defaultValue }: ' + name + 'Props' : '{ defaultValue }';
    return (
      "import * as Accordion from '@radix-ui/react-accordion';\nimport styled from 'styled-components';\n\nconst Root = styled(Accordion.Root)`\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst Item = styled(Accordion.Item)`\n  border-bottom: 1px solid var(--border);\n`;\nconst Header = styled(Accordion.Header)`\n  margin: 0;\n`;\nconst Trigger = styled(Accordion.Trigger)`\n  width: 100%; padding: 16px; background: none; border: none;\n  text-align: left; cursor: pointer; font-size: 14px; font-weight: 500;\n  display: flex; justify-content: space-between;\n  &[data-state="open"]::after { content: "▲"; }\n  &[data-state="closed"]::after { content: "▼"; }\n`;\nconst Content = styled(Accordion.Content)`\n  padding: 0 16px 16px;\n`;\n\n' +
      ptAcc +
      'export const ' +
      name +
      ' = (' +
      pAcc +
      ') => (\n  <Root type="single" collapsible defaultValue={defaultValue}>\n' +
      items +
      '\n  </Root>\n);'
    );
  }
  if (type === 'popover') {
    var labelPop = (d.texts && d.texts.title) || '열기';
    var ptPop = useTs ? 'interface ' + name + 'Props {\n  triggerLabel?: string;\n}\n\n' : '';
    var pPop = useTs
      ? '{ triggerLabel = "' + labelPop + '" }: ' + name + 'Props'
      : '{ triggerLabel = "' + labelPop + '" }';
    return (
      "import * as Popover from '@radix-ui/react-popover';\nimport styled from 'styled-components';\n\nconst Content = styled(Popover.Content)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);\n`;\n\n' +
      ptPop +
      'export const ' +
      name +
      ' = (' +
      pPop +
      ') => (\n  <Popover.Root>\n    <Popover.Trigger asChild>\n      <button>{triggerLabel}</button>\n    </Popover.Trigger>\n    <Popover.Portal>\n      <Content sideOffset={4}>\n        {/* 팝오버 내용 */}\n        <Popover.Close aria-label="닫기">×</Popover.Close>\n        <Popover.Arrow />\n      </Content>\n    </Popover.Portal>\n  </Popover.Root>\n);'
    );
  }
  if (type === 'heading') {
    var ptH = useTs
      ? 'interface ' + name + 'Props {\n  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  children?: React.ReactNode;\n  className?: string;\n}\n\n'
      : '';
    var pHStr = useTs
      ? '{ as = "h2", size = "6", children, className }: ' + name + 'Props'
      : '{ as = "h2", size = "6", children, className }';
    var headingTitle = (d.texts && d.texts.title) || name;
    var headingTypoCss = stylesToCSSProps(filterTypographyStyles(d.styles));
    return (
      "import * as Theme from '@radix-ui/themes';\nimport styled from 'styled-components';\n\nconst StyledHeading = styled(Theme.Heading)`\n" +
      (headingTypoCss ? headingTypoCss + '\n' : '') +
      '  line-height: 1.2;\n  letter-spacing: -0.02em;\n`;\n\n' +
      ptH +
      'export const ' +
      name +
      ' = (' +
      pHStr +
      ') => (\n  <StyledHeading as={as} size={size} className={className}>\n    {children ?? "' +
      headingTitle +
      '"}\n  </StyledHeading>\n);'
    );
  }
  if (type === 'text') {
    var ptTx = useTs
      ? 'interface ' + name + 'Props {\n  as?: "p" | "span" | "div" | "label";\n  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";\n  weight?: "light" | "regular" | "medium" | "bold";\n  children?: React.ReactNode;\n  className?: string;\n}\n\n'
      : '';
    var pTxStr = useTs
      ? '{ as = "p", size = "3", weight = "regular", children, className }: ' + name + 'Props'
      : '{ as = "p", size = "3", weight = "regular", children, className }';
    var textBody = (d.texts && d.texts.title) || 'Body text';
    var textTypoCss = stylesToCSSProps(filterTypographyStyles(d.styles));
    return (
      "import * as Theme from '@radix-ui/themes';\nimport styled from 'styled-components';\n\nconst StyledText = styled(Theme.Text)`\n" +
      (textTypoCss ? textTypoCss + '\n' : '') +
      '  line-height: 1.5;\n`;\n\n' +
      ptTx +
      'export const ' +
      name +
      ' = (' +
      pTxStr +
      ') => (\n  <StyledText as={as} size={size} weight={weight} className={className}>\n    {children ?? "' +
      textBody +
      '"}\n  </StyledText>\n);'
    );
  }
  if (type === 'card') {
    var ptC = useTs
      ? 'interface ' + name + 'Props {\n  title?: string;\n  description?: string;\n  children?: React.ReactNode;\n}\n\n'
      : '';
    var pCStr = useTs ? '{ title, description, children }: ' + name + 'Props' : '{ title, description, children }';
    var cardTitle = (d.texts && d.texts.title) || '';
    var cardDesc = (d.texts && d.texts.description) || '';
    return (
      "import * as Theme from '@radix-ui/themes';\nimport styled from 'styled-components';\n\nconst StyledCard = styled(Theme.Card)`\n" +
      stylesToCSSProps(d.styles) +
      '\n  border-radius: var(--radius-md, 8px);\n`;\n\n' +
      ptC +
      'export const ' +
      name +
      ' = (' +
      pCStr +
      ') => (\n  <StyledCard>\n    <Flex direction="column" gap="2">\n' +
      (cardTitle ? '      {title && <Heading size="4">{title ?? "' + cardTitle + '"}</Heading>}\n' : '') +
      (cardDesc ? '      {description && <Text size="2" color="gray">{description ?? "' + cardDesc + '"}</Text>}\n' : '') +
      '      {children}\n    </Flex>\n  </StyledCard>\n);'
    );
  }
  if (type === 'badge') {
    var badgeLabel = (d.texts && d.texts.title) || name;
    var ptB = useTs
      ? 'interface ' + name + 'Props {\n  label?: string;\n  color?: string;\n  variant?: "solid" | "soft" | "outline" | "surface";\n}\n\n'
      : '';
    var pBStr = useTs
      ? '{ label = "' + badgeLabel + '", color, variant = "soft" }: ' + name + 'Props'
      : '{ label = "' + badgeLabel + '", color, variant = "soft" }';
    return (
      "import * as Theme from '@radix-ui/themes';\nimport styled from 'styled-components';\n\nconst StyledBadge = styled(Theme.Badge)`\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\n\n' +
      ptB +
      'export const ' +
      name +
      ' = (' +
      pBStr +
      ') => (\n  <StyledBadge color={color} variant={variant}>{label}</StyledBadge>\n);'
    );
  }
  if (type === 'avatar') {
    var avatarFallback = (d.texts && d.texts.title && d.texts.title.slice(0, 2).toUpperCase()) || name.slice(0, 2).toUpperCase();
    var ptAv = useTs
      ? 'interface ' + name + 'Props {\n  src?: string;\n  alt?: string;\n  fallback?: string;\n  size?: "1" | "2" | "3" | "4" | "5";\n}\n\n'
      : '';
    var pAvStr = useTs
      ? '{ src, alt = "", fallback = "' + avatarFallback + '", size = "3" }: ' + name + 'Props'
      : '{ src, alt = "", fallback = "' + avatarFallback + '", size = "3" }';
    return (
      "import * as Avatar from '@radix-ui/react-avatar';\nimport styled from 'styled-components';\n\nconst Root = styled(Avatar.Root)`\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  overflow: hidden;\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst Img = styled(Avatar.Image)`\n  width: 100%; height: 100%; object-fit: cover;\n`;\nconst Fallback = styled(Avatar.Fallback)`\n  font-size: 14px; font-weight: 600;\n  background: var(--surface2); color: var(--text-primary);\n  width: 100%; height: 100%;\n  display: flex; align-items: center; justify-content: center;\n`;\n\n' +
      ptAv +
      'export const ' +
      name +
      ' = (' +
      pAvStr +
      ') => (\n  <Root>\n    <Img src={src} alt={alt} />\n    <Fallback>{fallback}</Fallback>\n  </Root>\n);'
    );
  }
  if (type === 'separator') {
    var ptSep = useTs
      ? 'interface ' + name + 'Props {\n  orientation?: "horizontal" | "vertical";\n  decorative?: boolean;\n}\n\n'
      : '';
    var pSepStr = useTs
      ? '{ orientation = "horizontal", decorative = true }: ' + name + 'Props'
      : '{ orientation = "horizontal", decorative = true }';
    return (
      "import * as Separator from '@radix-ui/react-separator';\nimport styled from 'styled-components';\n\nconst StyledSeparator = styled(Separator.Root)`\n  border: none;\n  background: var(--border);\n  &[data-orientation='horizontal'] { height: 1px; width: 100%; }\n  &[data-orientation='vertical'] { width: 1px; height: 100%; }\n`;\n\n" +
      ptSep +
      'export const ' +
      name +
      ' = (' +
      pSepStr +
      ') => (\n  <StyledSeparator orientation={orientation} decorative={decorative} />\n);'
    );
  }
  if (type === 'input') {
    var inputPlaceholder = (d.texts && d.texts.title) || 'Enter value…';
    var inputLabel = (d.texts && d.texts.description) || name;
    var ptIn = useTs
      ? 'interface ' + name + 'Props {\n  value?: string;\n  onChange?: (value: string) => void;\n  placeholder?: string;\n  label?: string;\n  disabled?: boolean;\n}\n\n'
      : '';
    var pInStr = useTs
      ? '{ value, onChange, placeholder = "' + inputPlaceholder + '", label = "' + inputLabel + '", disabled }: ' + name + 'Props'
      : '{ value, onChange, placeholder = "' + inputPlaceholder + '", label = "' + inputLabel + '", disabled }';
    return (
      "import * as Theme from '@radix-ui/themes';\nimport styled from 'styled-components';\n\nconst Wrapper = styled.div`\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n" +
      stylesToCSSProps(d.styles) +
      '\n`;\nconst StyledInput = styled(TextField.Root)`\n  width: 100%;\n  padding: 8px 12px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm, 4px);\n  font-size: 14px;\n`;\n\n' +
      ptIn +
      'export const ' +
      name +
      ' = (' +
      pInStr +
      ') => (\n  <Wrapper>\n    <Text as="label" size="2">{label}</Text>\n    <StyledInput\n      value={value}\n      onChange={(e) => onChange?.(e.target.value)}\n      placeholder={placeholder}\n      disabled={disabled}\n    />\n  </Wrapper>\n);'
    );
  }
  var tag = getSemanticTag(name);
  var pt3 = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p3 = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import styled from 'styled-components';\n\nconst Wrapper = styled." +
    tag +
    '`\n' +
    stylesToCSSProps(d.styles) +
    '\n`;\n\n' +
    pt3 +
    'export const ' +
    name +
    ' = (' +
    p3 +
    ') => (\n  <Wrapper>{children}</Wrapper>\n);'
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
    .map(function (k) {
      return '  ' + k + ': ' + styles[k] + ';';
    })
    .join('\n');
}
