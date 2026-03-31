# Design: Component Radix Generation

> **Plan**: `docs/01-plan/features/component-radix-generation.plan.md`
> **Date**: 2026-03-30
> **Status**: Draft

---

## 1. 아키텍처 개요

```
[Figma 노드 선택]
       ↓
[code.ts] generateComponent()
  ├─ colorMap 구축 (Variables → CSS variable)
  ├─ detectComponentType(node)     ← NEW
  ├─ extractTexts(node)            ← NEW
  ├─ getNodeStyles(node)           (기존 유지)
  ├─ getChildStyles(node)          ← NEW
  ├─ nodeToHtml(node)              (기존 유지)
  └─ nodeToJsx(node)               (기존 유지)
       ↓ postMessage
[ui.js] generate-component-result 핸들러
  ├─ HTML 모드    → d.html 그대로 출력
  ├─ CSS Modules → buildRadixCSSModules(d, name, useTs)  ← NEW
  └─ Styled      → buildRadixStyled(d, name, useTs)      ← NEW
       ↓
[UI] 감지 타입 드롭다운 자동 선택 + 코드 출력
```

---

## 2. code.ts 변경 설계

### 2.1 반환 타입 확장

```typescript
// 기존
{ name, meta, styles, html, jsx }

// 확장 후
interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;          // 루트 노드 CSS
  html: string;                             // 인라인 스타일 HTML
  jsx: string;                              // 인라인 스타일 JSX
  detectedType: ComponentType;              // NEW: 자동 감지 타입
  texts: ExtractedTexts;                    // NEW: 텍스트 추출 결과
  childStyles: Record<string, Record<string, string>>; // NEW: 자식별 CSS
}

type ComponentType =
  | 'dialog' | 'button' | 'tabs' | 'checkbox'
  | 'switch' | 'tooltip' | 'accordion' | 'popover'
  | 'select' | 'layout';

interface ExtractedTexts {
  title: string;        // 첫 번째 텍스트 (제목/레이블)
  description: string;  // 두 번째 텍스트 (설명)
  actions: string[];    // 버튼 영역 텍스트 배열
  all: string[];        // 전체 텍스트 (순서대로)
}
```

### 2.2 `detectComponentType(node)` 함수

```typescript
function detectComponentType(node: SceneNode): ComponentType {
  const name = node.name.toLowerCase();

  // Step 1: 이름 기반 감지 (우선순위 순)
  const NAME_PATTERNS: Array<[string[], ComponentType]> = [
    [['dialog', 'modal', 'confirm', 'alert', 'popup'], 'dialog'],
    [['button', 'btn', 'cta', 'action'], 'button'],
    [['tab', 'tabs'], 'tabs'],
    [['checkbox', 'check'], 'checkbox'],
    [['switch', 'toggle'], 'switch'],
    [['tooltip', 'hint', 'tip'], 'tooltip'],
    [['accordion', 'collapse', 'expand'], 'accordion'],
    [['popover', 'dropdown', 'flyout'], 'popover'],
    [['select', 'combobox', 'picker'], 'select'],
  ];

  for (const [keywords, type] of NAME_PATTERNS) {
    if (keywords.some((kw) => name.includes(kw))) return type;
  }

  // Step 2: 구조 패턴 분석
  if (!('children' in node)) return 'layout';
  return detectByStructure(node as ChildrenMixin & SceneNode);
}

function detectByStructure(node: ChildrenMixin & SceneNode): ComponentType {
  const children = node.children as SceneNode[];
  const childCount = children.length;
  const textNodes = children.filter((c) => c.type === 'TEXT');
  const frameNodes = children.filter((c) => c.type === 'FRAME' || c.type === 'RECTANGLE');

  // 단일 텍스트 + 배경색 → button
  if (childCount <= 2 && textNodes.length === 1 && 'fills' in node) {
    const fills = (node as any).fills;
    if (Array.isArray(fills) && fills.some((f: any) => f.type === 'SOLID')) {
      return 'button';
    }
  }

  // 가로 나열 여러 자식 + 각각 텍스트 포함 → tabs
  if ('layoutMode' in node && (node as FrameNode).layoutMode === 'HORIZONTAL') {
    if (childCount >= 2 && frameNodes.length >= 2) return 'tabs';
  }

  // 작은 사각형(≤24px) + 텍스트 → checkbox
  const smallRect = frameNodes.find((f) => f.width <= 24 && f.height <= 24);
  if (smallRect && textNodes.length >= 1) return 'checkbox';

  // 좁고 긴 노드 + 텍스트 → switch
  if (node.width > node.height * 1.5 && 'fills' in node && textNodes.length <= 1) {
    if (node.width <= 60) return 'switch';
  }

  // 자식 중 overlay 역할 프레임 존재 → dialog
  const hasOverlay = frameNodes.some(
    (f) => f.width > node.width * 0.8 || f.opacity < 0.5
  );
  if (hasOverlay) return 'dialog';

  return 'layout';
}
```

### 2.3 `extractTexts(node)` 함수

```typescript
function extractTexts(node: SceneNode): ExtractedTexts {
  const texts: Array<{ text: string; y: number; x: number }> = [];

  function collect(n: SceneNode) {
    if (n.type === 'TEXT') {
      texts.push({ text: (n as TextNode).characters, y: n.y, x: n.x });
    } else if ('children' in n) {
      (n as ChildrenMixin).children.forEach((c) => collect(c as SceneNode));
    }
  }
  collect(node);

  // y좌표 기준 정렬
  texts.sort((a, b) => a.y - b.y || a.x - b.x);
  const all = texts.map((t) => t.text.trim()).filter(Boolean);

  // 전체 높이 기준으로 하단 1/3에 있는 텍스트 → actions
  const nodeHeight = 'height' in node ? (node as any).height : 100;
  const threshold = nodeHeight * 0.65;
  const actions = texts
    .filter((t) => t.y > threshold)
    .map((t) => t.text.trim())
    .filter(Boolean);

  return {
    title: all[0] || '',
    description: all[1] || '',
    actions,
    all,
  };
}
```

### 2.4 `getChildStyles(node)` 함수

```typescript
function getChildStyles(node: SceneNode): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  if (!('children' in node)) return result;

  (node as ChildrenMixin).children.forEach((child, i) => {
    const c = child as SceneNode;
    const key = c.name || 'child-' + i;
    result[key] = getNodeStyles(c);
  });

  return result;
}
```

### 2.5 `generateComponent()` 반환값 최종

```typescript
return {
  name: node.name,
  meta: { nodeId, nodeName, nodeType, masterId, masterName, figmaFileId },
  styles: getNodeStyles(node),
  html: nodeToHtml(node, 0),
  jsx: nodeToJsx(node, 0),
  detectedType: detectComponentType(node),   // NEW
  texts: extractTexts(node),                 // NEW
  childStyles: getChildStyles(node),         // NEW
};
```

---

## 3. ui.js 변경 설계

### 3.1 `generate-component-result` 핸들러 수정

```javascript
if (msg.type === 'generate-component-result') {
  var d = msg.data;
  if (d) {
    var name = compToPascalCase((d.name || 'Component').split('/').pop());

    // 자동 감지 타입을 드롭다운에 반영
    if (d.detectedType && d.detectedType !== 'layout') {
      compState.componentType = d.detectedType;
      var typeSelect = $('compTypeSelect');
      if (typeSelect) typeSelect.value = d.detectedType;
      updateTypeHint(d.detectedType);
    }

    var tsx, css;
    if (compState.styleMode === 'html') {
      tsx = d.html || '<div></div>';
      css = '';
    } else if (compState.styleMode === 'css-modules') {
      tsx = buildRadixCSSModules(d, name, compState.useTs);
      css = buildRadixCSS(d);
    } else {
      tsx = buildRadixStyled(d, name, compState.useTs);
      css = '';
    }
    showGeneratedResult(tsx, css, compState.styleMode);
  }
}
```

### 3.2 `buildRadixCSSModules(d, name, useTs)` 함수

컴포넌트 타입별 Radix UI 구조를 생성하는 메인 함수.

#### dialog

```javascript
function buildDialogCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  open: boolean;\n  onOpenChange: (open: boolean) => void;\n}\n\n'
    : '';
  var p = useTs ? '{ open, onOpenChange }: ' + name + 'Props' : '{ open, onOpenChange }';
  var title = d.texts.title || 'Dialog Title';
  var desc = d.texts.description ? '\n        <Dialog.Description className={styles.description}>\n          ' + d.texts.description + '\n        </Dialog.Description>' : '';
  var cancel = d.texts.actions[0] || 'Cancel';
  var confirm = d.texts.actions[1] || 'Confirm';

  return (
    "import * as Dialog from '@radix-ui/react-dialog';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Dialog.Root open={open} onOpenChange={onOpenChange}>\n" +
    "    <Dialog.Portal>\n" +
    "      <Dialog.Overlay className={styles.overlay} />\n" +
    "      <Dialog.Content className={styles.content} aria-describedby={undefined}>\n" +
    "        <Dialog.Title className={styles.title}>" + title + "</Dialog.Title>" +
    desc + "\n" +
    "        <div className={styles.footer}>\n" +
    "          <Dialog.Close asChild>\n" +
    "            <button className={styles.cancelBtn}>" + cancel + "</button>\n" +
    "          </Dialog.Close>\n" +
    "          <button className={styles.confirmBtn}>" + confirm + "</button>\n" +
    "        </div>\n" +
    "      </Dialog.Content>\n" +
    "    </Dialog.Portal>\n" +
    "  </Dialog.Root>\n" +
    ");"
  );
}
```

#### button

```javascript
function buildButtonCSSModules(d, name, useTs) {
  var pt = useTs
    ? 'interface ' + name + 'Props {\n  onClick?: () => void;\n  disabled?: boolean;\n  children?: React.ReactNode;\n}\n\n'
    : '';
  var p = useTs ? '{ onClick, disabled, children }: ' + name + 'Props' : '{ onClick, disabled, children }';
  var label = d.texts.title || d.texts.all[0] || name;
  return (
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <button\n" +
    "    className={styles.root}\n" +
    "    onClick={onClick}\n" +
    "    disabled={disabled}\n" +
    "    type=\"button\"\n" +
    "  >\n" +
    "    {children ?? '" + label + "'}\n" +
    "  </button>\n" +
    ");"
  );
}
```

#### tabs

```javascript
function buildTabsCSSModules(d, name, useTs) {
  var tabLabels = d.texts.all.filter(function(t) { return t.length < 30; });
  if (tabLabels.length < 2) tabLabels = ['Tab 1', 'Tab 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs ? "{ defaultValue = '" + tabLabels[0] + "' }: " + name + 'Props' : "{ defaultValue = '" + tabLabels[0] + "' }";

  var triggers = tabLabels.map(function(label, i) {
    return "      <Tabs.Trigger className={styles.trigger} value=\"tab" + (i + 1) + "\">" + label + "</Tabs.Trigger>";
  }).join('\n');
  var contents = tabLabels.map(function(label, i) {
    return "    <Tabs.Content className={styles.content} value=\"tab" + (i + 1) + "\">\n      {/* " + label + " 내용 */}\n    </Tabs.Content>";
  }).join('\n');

  return (
    "import * as Tabs from '@radix-ui/react-tabs';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Tabs.Root className={styles.root} defaultValue={defaultValue}>\n" +
    "    <Tabs.List className={styles.list}>\n" +
    triggers + "\n" +
    "    </Tabs.List>\n" +
    contents + "\n" +
    "  </Tabs.Root>\n" +
    ");"
  );
}
```

#### checkbox

```javascript
function buildCheckboxCSSModules(d, name, useTs) {
  var label = d.texts.title || name;
  var pt = useTs ? 'interface ' + name + 'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n' : '';
  var p = useTs ? '{ checked, onCheckedChange }: ' + name + 'Props' : '{ checked, onCheckedChange }';
  return (
    "import * as Checkbox from '@radix-ui/react-checkbox';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <label className={styles.root}>\n" +
    "    <Checkbox.Root\n" +
    "      className={styles.checkbox}\n" +
    "      checked={checked}\n" +
    "      onCheckedChange={onCheckedChange}\n" +
    "    >\n" +
    "      <Checkbox.Indicator className={styles.indicator}>\n" +
    "        <svg viewBox=\"0 0 16 16\" width=\"12\" height=\"12\">\n" +
    "          <path d=\"M2 8l4 4 8-8\" stroke=\"currentColor\" strokeWidth=\"2\" fill=\"none\" />\n" +
    "        </svg>\n" +
    "      </Checkbox.Indicator>\n" +
    "    </Checkbox.Root>\n" +
    "    <span className={styles.label}>" + label + "</span>\n" +
    "  </label>\n" +
    ");"
  );
}
```

#### switch

```javascript
function buildSwitchCSSModules(d, name, useTs) {
  var label = d.texts.title || name;
  var pt = useTs ? 'interface ' + name + 'Props {\n  checked?: boolean;\n  onCheckedChange?: (checked: boolean) => void;\n}\n\n' : '';
  var p = useTs ? '{ checked, onCheckedChange }: ' + name + 'Props' : '{ checked, onCheckedChange }';
  return (
    "import * as Switch from '@radix-ui/react-switch';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <label className={styles.root}>\n" +
    "    <span className={styles.label}>" + label + "</span>\n" +
    "    <Switch.Root className={styles.switch} checked={checked} onCheckedChange={onCheckedChange}>\n" +
    "      <Switch.Thumb className={styles.thumb} />\n" +
    "    </Switch.Root>\n" +
    "  </label>\n" +
    ");"
  );
}
```

#### select

```javascript
function buildSelectCSSModules(d, name, useTs) {
  var placeholder = d.texts.title || 'Select...';
  var options = d.texts.all.slice(1).filter(function(t) { return t.length < 40; });
  if (options.length === 0) options = ['Option 1', 'Option 2', 'Option 3'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  value?: string;\n  onValueChange?: (value: string) => void;\n}\n\n' : '';
  var p = useTs ? '{ value, onValueChange }: ' + name + 'Props' : '{ value, onValueChange }';
  var items = options.map(function(opt) {
    var val = opt.toLowerCase().replace(/\s+/g, '-');
    return "      <Select.Item className={styles.item} value=\"" + val + "\">\n        <Select.ItemText>" + opt + "</Select.ItemText>\n      </Select.Item>";
  }).join('\n');
  return (
    "import * as Select from '@radix-ui/react-select';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Select.Root value={value} onValueChange={onValueChange}>\n" +
    "    <Select.Trigger className={styles.trigger}>\n" +
    "      <Select.Value placeholder=\"" + placeholder + "\" />\n" +
    "    </Select.Trigger>\n" +
    "    <Select.Portal>\n" +
    "      <Select.Content className={styles.content}>\n" +
    "        <Select.Viewport>\n" +
    items + "\n" +
    "        </Select.Viewport>\n" +
    "      </Select.Content>\n" +
    "    </Select.Portal>\n" +
    "  </Select.Root>\n" +
    ");"
  );
}
```

#### tooltip

```javascript
function buildTooltipCSSModules(d, name, useTs) {
  var content = d.texts.title || 'Tooltip content';
  var trigger = d.texts.all[1] || '?';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Tooltip from '@radix-ui/react-tooltip';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Tooltip.Provider>\n" +
    "    <Tooltip.Root>\n" +
    "      <Tooltip.Trigger asChild>\n" +
    "        <button className={styles.trigger}>{children ?? '" + trigger + "'}</button>\n" +
    "      </Tooltip.Trigger>\n" +
    "      <Tooltip.Portal>\n" +
    "        <Tooltip.Content className={styles.content} sideOffset={4}>\n" +
    "          " + content + "\n" +
    "          <Tooltip.Arrow className={styles.arrow} />\n" +
    "        </Tooltip.Content>\n" +
    "      </Tooltip.Portal>\n" +
    "    </Tooltip.Root>\n" +
    "  </Tooltip.Provider>\n" +
    ");"
  );
}
```

#### accordion

```javascript
function buildAccordionCSSModules(d, name, useTs) {
  var items = d.texts.all.filter(function(t) { return t.length < 50; });
  if (items.length < 2) items = ['Item 1', 'Item 2'];
  var pt = useTs ? 'interface ' + name + 'Props {\n  defaultValue?: string;\n}\n\n' : '';
  var p = useTs ? "{ defaultValue }: " + name + 'Props' : "{ defaultValue }";
  var accItems = items.map(function(label, i) {
    var val = 'item-' + (i + 1);
    return (
      "    <Accordion.Item className={styles.item} value=\"" + val + "\">\n" +
      "      <Accordion.Trigger className={styles.trigger}>" + label + "</Accordion.Trigger>\n" +
      "      <Accordion.Content className={styles.content}>\n" +
      "        {/* " + label + " 내용 */}\n" +
      "      </Accordion.Content>\n" +
      "    </Accordion.Item>"
    );
  }).join('\n');
  return (
    "import * as Accordion from '@radix-ui/react-accordion';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Accordion.Root className={styles.root} type=\"single\" defaultValue={defaultValue} collapsible>\n" +
    accItems + "\n" +
    "  </Accordion.Root>\n" +
    ");"
  );
}
```

#### popover

```javascript
function buildPopoverCSSModules(d, name, useTs) {
  var triggerLabel = d.texts.title || 'Open';
  var content = d.texts.description || 'Popover content';
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import * as Popover from '@radix-ui/react-popover';\n" +
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <Popover.Root>\n" +
    "    <Popover.Trigger asChild>\n" +
    "      <button className={styles.trigger}>" + triggerLabel + "</button>\n" +
    "    </Popover.Trigger>\n" +
    "    <Popover.Portal>\n" +
    "      <Popover.Content className={styles.content} sideOffset={4}>\n" +
    "        {children ?? <p>" + content + "</p>}\n" +
    "        <Popover.Close className={styles.closeBtn} aria-label=\"Close\">×</Popover.Close>\n" +
    "        <Popover.Arrow className={styles.arrow} />\n" +
    "      </Popover.Content>\n" +
    "    </Popover.Portal>\n" +
    "  </Popover.Root>\n" +
    ");"
  );
}
```

#### layout (폴백)

```javascript
function buildLayoutCSSModules(d, name, useTs) {
  var tag = getSemanticTag(name);
  var pt = useTs ? 'interface ' + name + 'Props {\n  children?: React.ReactNode;\n}\n\n' : '';
  var p = useTs ? '{ children }: ' + name + 'Props' : '{ children }';
  return (
    "import styles from './" + name + ".module.css';\n\n" +
    pt +
    "export const " + name + " = (" + p + ") => (\n" +
    "  <" + tag + " className={styles.root}>\n" +
    "    {children}\n" +
    "  </" + tag + ">\n" +
    ");"
  );
}
```

#### `buildRadixCSSModules` 디스패처

```javascript
function buildRadixCSSModules(d, name, useTs) {
  var type = d.detectedType || 'layout';
  switch (type) {
    case 'dialog':    return buildDialogCSSModules(d, name, useTs);
    case 'button':    return buildButtonCSSModules(d, name, useTs);
    case 'tabs':      return buildTabsCSSModules(d, name, useTs);
    case 'checkbox':  return buildCheckboxCSSModules(d, name, useTs);
    case 'switch':    return buildSwitchCSSModules(d, name, useTs);
    case 'select':    return buildSelectCSSModules(d, name, useTs);
    case 'tooltip':   return buildTooltipCSSModules(d, name, useTs);
    case 'accordion': return buildAccordionCSSModules(d, name, useTs);
    case 'popover':   return buildPopoverCSSModules(d, name, useTs);
    default:          return buildLayoutCSSModules(d, name, useTs);
  }
}
```

### 3.3 `buildRadixCSS(d)` 함수 (CSS Modules용)

```javascript
function buildRadixCSS(d) {
  var type = d.detectedType || 'layout';
  var rootCss = stylesToCSSProps(d.styles);

  if (type === 'dialog') {
    return (
      ".overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.5);\n}\n\n" +
      ".content {\n" + rootCss + "\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%,-50%);\n}\n\n" +
      ".title {\n  font-size: 18px;\n  font-weight: 600;\n  margin-bottom: 8px;\n}\n\n" +
      ".description {\n  color: var(--text-secondary);\n  margin-bottom: 16px;\n}\n\n" +
      ".footer {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n}\n\n" +
      ".cancelBtn {\n  padding: 6px 14px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm);\n  background: none;\n  cursor: pointer;\n}\n\n" +
      ".confirmBtn {\n  padding: 6px 14px;\n  background: var(--color-primary, #2d7ff9);\n  color: #fff;\n  border: none;\n  border-radius: var(--radius-sm);\n  cursor: pointer;\n}"
    );
  }
  if (type === 'tabs') {
    return (
      ".root {\n" + rootCss + "\n}\n\n" +
      ".list {\n  display: flex;\n  border-bottom: 1px solid var(--border);\n  gap: 0;\n}\n\n" +
      ".trigger {\n  padding: 8px 16px;\n  border: none;\n  background: none;\n  cursor: pointer;\n  border-bottom: 2px solid transparent;\n}\n\n" +
      ".trigger[data-state='active'] {\n  border-bottom-color: var(--color-primary, #2d7ff9);\n  font-weight: 600;\n}\n\n" +
      ".content {\n  padding: 16px 0;\n}"
    );
  }
  if (type === 'checkbox') {
    return (
      ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n}\n\n" +
      ".checkbox {\n  width: 18px;\n  height: 18px;\n  border: 2px solid var(--border);\n  border-radius: 3px;\n  background: var(--surface);\n}\n\n" +
      ".checkbox[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n  border-color: var(--color-primary, #2d7ff9);\n}\n\n" +
      ".indicator {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #fff;\n}\n\n" +
      ".label {\n  font-size: 14px;\n}"
    );
  }
  if (type === 'switch') {
    return (
      ".root {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n" +
      ".switch {\n  width: 42px;\n  height: 24px;\n  border-radius: 12px;\n  background: var(--border);\n  position: relative;\n  cursor: pointer;\n  border: none;\n}\n\n" +
      ".switch[data-state='checked'] {\n  background: var(--color-primary, #2d7ff9);\n}\n\n" +
      ".thumb {\n  display: block;\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  background: #fff;\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  transition: transform 150ms;\n}\n\n" +
      ".thumb[data-state='checked'] {\n  transform: translateX(18px);\n}"
    );
  }
  // 기타 타입: 루트 스타일만
  return ".root {\n" + rootCss + "\n}";
}
```

### 3.4 `buildRadixStyled(d, name, useTs)` — Styled-Components 버전

CSS Modules 버전과 동일한 구조이지만 `className` 대신 `styled` 컴포넌트 사용.
구현은 CSS Modules 버전과 동일한 디스패처 패턴으로 `buildDialogStyled`, `buildButtonStyled` 등 각 타입별 함수 작성.

---

## 4. UI 변경 설계

### 4.1 타입 자동 감지 표시

```
[기존]
컴포넌트 타입: [드롭다운 - 사용자 수동 선택]

[변경 후]
컴포넌트 타입: [드롭다운] ← 자동 감지됨
                            (감지 시 드롭다운 값 자동 변경)
```

`generate-component-result` 수신 시:
```javascript
if (d.detectedType && d.detectedType !== 'layout') {
  compState.componentType = d.detectedType;
  $('compTypeSelect').value = d.detectedType;
  updateTypeHint(d.detectedType);
}
```

### 4.2 npm install 안내 (FR-12, 선택)

```javascript
var RADIX_PKG = {
  dialog: '@radix-ui/react-dialog',
  tabs: '@radix-ui/react-tabs',
  checkbox: '@radix-ui/react-checkbox',
  switch: '@radix-ui/react-switch',
  select: '@radix-ui/react-select',
  tooltip: '@radix-ui/react-tooltip',
  accordion: '@radix-ui/react-accordion',
  popover: '@radix-ui/react-popover',
};
// 코드 출력 아래에 주석으로 삽입
// // npm install @radix-ui/react-dialog
```

---

## 5. 데이터 플로우 요약

```
Figma Node
  → detectComponentType()   → detectedType: 'dialog'
  → extractTexts()          → { title: 'Are you sure?', description: '...', actions: ['Cancel','Confirm'] }
  → getNodeStyles()         → { background-color: 'var(--color-surface)', border-radius: '6px', ... }
  → getChildStyles()        → { 'footer': { display: 'flex', gap: '8px' }, ... }
  → nodeToHtml()            → '<div style="...">...</div>'
  ↓ postMessage
ui.js
  → detectedType → compTypeSelect.value = 'dialog'
  → buildRadixCSSModules(d, 'ConfirmationDialog', true)
    → buildDialogCSSModules()
      → Dialog.Root 구조 + 실제 텍스트 주입
  → buildRadixCSS(d)
    → dialog 전용 CSS 클래스 + 루트 스타일 병합
  → showGeneratedResult(tsx, css, 'css-modules')
```

---

## 6. 파일별 변경 목록

| 파일 | 변경 | 내용 |
|------|------|------|
| `src/code.ts` | 수정 | `generateComponent()` 내부에 `detectComponentType`, `extractTexts`, `getChildStyles` 추가; 반환값 확장 |
| `src/ui.js` | 수정 | `generate-component-result` 핸들러, `buildRadixCSSModules`, `buildRadixStyled`, `buildRadixCSS` 추가; 기존 `buildCSSModulesTSX`/`buildStyledTSX`는 폴백으로 유지 |
| `src/ui.html` | 수정 없음 | 드롭다운 옵션 변경 불필요 (기존 옵션 그대로 사용) |

---

## 7. 구현 순서

1. `code.ts` — `detectComponentType()` 구현 + 단위 확인 (console.log로 감지 결과 확인)
2. `code.ts` — `extractTexts()` 구현
3. `code.ts` — `getChildStyles()` 구현
4. `code.ts` — `generateComponent()` 반환값 확장
5. `ui.js` — `generate-component-result` 핸들러에 `detectedType` 드롭다운 반영 로직 추가
6. `ui.js` — `buildDialogCSSModules` ~ `buildLayoutCSSModules` 각 함수 구현
7. `ui.js` — `buildRadixCSSModules` 디스패처 구현
8. `ui.js` — `buildRadixCSS` CSS 생성 함수 구현
9. `ui.js` — `buildRadixStyled` Styled-Components 버전 구현
10. `npm run build` + Figma에서 각 컴포넌트 타입별 검증
