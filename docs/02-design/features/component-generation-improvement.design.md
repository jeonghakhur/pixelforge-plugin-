# Design: Component Generation Improvement — Radix Themes 통일

> **Plan 참조**: `docs/01-plan/features/component-generation-improvement.plan.md`
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.3.0
> **Date**: 2026-03-31
> **Status**: Draft

---

## 1. 설계 개요

### 1.1 변경 대상 파일

| 파일 | 변경 범위 | 설명 |
|------|-----------|------|
| `src/ui/component-builders.js` | 주요 변경 | 모든 빌더 함수 Radix Themes 기준 재작성 |
| `src/code.ts` | 소규모 변경 | `ComponentType` 타입 확장 (신규 타입 추가) |
| `src/ui/tab-component.js` | 소규모 변경 | 드롭다운 옵션 추가, install hint 통일 |

### 1.2 설계 원칙

1. **단일 패키지**: 모든 Themes 컴포넌트는 `import { X } from '@radix-ui/themes'` 사용
2. **Props 우선**: CSS 커스텀 대신 Themes props(`variant`, `size`, `color`)로 스타일링
3. **레이아웃 유틸리티 활용**: `Flex`, `Box`, `Grid` 등 Themes 레이아웃 컴포넌트 적극 사용
4. **CSS 최소화**: Themes 기본 테마가 처리하는 스타일은 생성하지 않음
5. **Primitives 명시 분리**: Themes 미제공 타입은 import 경로에 주석으로 표시

---

## 2. RADIX_COMPONENT_REGISTRY 재설계

### 2.1 새 레지스트리 구조

```javascript
export var RADIX_COMPONENT_REGISTRY = {
  /* ── Radix Themes — import { X } from '@radix-ui/themes' ── */

  // Layout
  'layout':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Box, Flex' },

  // Typography
  'heading':           { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Heading' },
  'text':              { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Text' },
  'code':              { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Code' },
  'link':              { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Link' },
  'blockquote':        { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Blockquote' },
  'kbd':               { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Kbd' },
  'em':                { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Em' },
  'strong':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Strong' },

  // Interactive — Single Component
  'button':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Button' },
  'icon-button':       { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'IconButton' },
  'checkbox':          { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Checkbox, Text, Flex' },
  'checkbox-cards':    { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'CheckboxCards' },
  'checkbox-group':    { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'CheckboxGroup' },
  'switch':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Switch, Text, Flex' },
  'slider':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Slider' },
  'radio-group':       { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'RadioGroup' },
  'radio-cards':       { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'RadioCards' },
  'segmented-control': { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'SegmentedControl' },
  'input':             { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'TextField, Text' },
  'textarea':          { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'TextArea' },

  // Interactive — Compound Component (namespace import)
  'dialog':            { pkg: '@radix-ui/themes', ns: 'Dialog',       themeComponent: true, import: 'Dialog, Button, Flex' },
  'alert-dialog':      { pkg: '@radix-ui/themes', ns: 'AlertDialog',  themeComponent: true, import: 'AlertDialog, Button, Flex' },
  'tabs':              { pkg: '@radix-ui/themes', ns: 'Tabs',         themeComponent: true, import: 'Tabs, Box' },
  'select':            { pkg: '@radix-ui/themes', ns: 'Select',       themeComponent: true, import: 'Select' },
  'dropdown-menu':     { pkg: '@radix-ui/themes', ns: 'DropdownMenu', themeComponent: true, import: 'DropdownMenu, Button' },
  'context-menu':      { pkg: '@radix-ui/themes', ns: 'ContextMenu',  themeComponent: true, import: 'ContextMenu' },
  'popover':           { pkg: '@radix-ui/themes', ns: 'Popover',      themeComponent: true, import: 'Popover, Button, Flex' },
  'hover-card':        { pkg: '@radix-ui/themes', ns: 'HoverCard',    themeComponent: true, import: 'HoverCard, Flex, Text' },
  'tooltip':           { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'Tooltip, IconButton' },
  'tab-nav':           { pkg: '@radix-ui/themes', ns: 'TabNav',       themeComponent: true, import: 'TabNav' },

  // Display
  'avatar':            { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Avatar' },
  'badge':             { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Badge' },
  'card':              { pkg: '@radix-ui/themes', ns: null, themeComponent: true, import: 'Card, Flex, Heading, Text' },
  'callout':           { pkg: '@radix-ui/themes', ns: 'Callout',      themeComponent: true, import: 'Callout' },
  'data-list':         { pkg: '@radix-ui/themes', ns: 'DataList',     themeComponent: true, import: 'DataList' },
  'table':             { pkg: '@radix-ui/themes', ns: 'Table',        themeComponent: true, import: 'Table' },
  'separator':         { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'Separator' },
  'progress':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'Progress' },
  'skeleton':          { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'Skeleton' },
  'spinner':           { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'Spinner' },
  'scroll-area':       { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'ScrollArea' },
  'aspect-ratio':      { pkg: '@radix-ui/themes', ns: null,           themeComponent: true, import: 'AspectRatio' },

  /* ── Radix Primitives — import * as X from '@radix-ui/react-*' ── */
  'accordion':         { pkg: '@radix-ui/react-accordion',    ns: 'Accordion',      themeComponent: false },
  'collapsible':       { pkg: '@radix-ui/react-collapsible',  ns: 'Collapsible',    themeComponent: false },
  'navigation-menu':   { pkg: '@radix-ui/react-navigation-menu', ns: 'NavigationMenu', themeComponent: false },

  /* ── Deprecated (Themes 대체) ── */
  // 'toggle':         → 'icon-button' 또는 'segmented-control'로 대체
  // 'toggle-group':   → 'segmented-control'로 대체
};
```

### 2.2 TYPE_KEYWORDS 확장

```javascript
export var TYPE_KEYWORDS = {
  // 기존 (유지)
  button:              ['button', 'btn', 'cta', 'action'],
  dialog:              ['dialog', 'modal', 'overlay', 'popup', 'sheet'],
  select:              ['select', 'dropdown', 'combobox', 'picker'],
  tabs:                ['tab', 'tabs', 'tabbar'],
  tooltip:             ['tooltip', 'hint', 'popover-tip'],
  checkbox:            ['checkbox', 'check'],
  switch:              ['switch'],
  accordion:           ['accordion', 'collapse', 'expand'],
  popover:             ['popover', 'flyout'],

  // 신규 추가
  'icon-button':       ['icon-button', 'icon-btn', 'iconbutton'],
  'alert-dialog':      ['alert-dialog', 'confirm-dialog', 'alert dialog', 'confirm'],
  'dropdown-menu':     ['dropdown-menu', 'action-menu', 'context'],
  'segmented-control': ['segmented', 'segment', 'toggle-group', 'toggle group'],
  'radio-group':       ['radio', 'radio-group', 'option-group'],
  'tab-nav':           ['tab-nav', 'tabnav', 'navigation-tab'],
  'data-list':         ['data-list', 'datalist', 'key-value', 'definition'],
  'spinner':           ['spinner', 'loading'],
  'badge':             ['badge', 'chip', 'tag', 'pill'],
  'avatar':            ['avatar', 'profile-pic', 'user-icon'],
  'card':              ['card', 'tile'],
  'progress':          ['progress', 'progress-bar', 'loading-bar'],
  'slider':            ['slider', 'range'],
  'separator':         ['separator', 'divider', 'hr'],
  'kbd':               ['kbd', 'keyboard', 'shortcut', 'hotkey'],
  'code':              ['code', 'inline-code'],
  'link':              ['link', 'anchor', 'href'],
  'blockquote':        ['blockquote', 'quote', 'citation'],
};
```

---

## 3. 컴포넌트별 코드 생성 스펙

### 3.1 import 패턴

**Themes 컴포넌트 (Named Import):**
```tsx
import { Button, Flex, Text } from '@radix-ui/themes';
```

**Primitives 컴포넌트 (Namespace Import — 기존 유지):**
```tsx
import * as Accordion from '@radix-ui/react-accordion';
```

### 3.2 전환 대상 빌더 — 상세 생성 코드

---

#### 3.2.1 Button

**생성 코드 (CSS Modules):**
```tsx
import { Button } from '@radix-ui/themes';
import styles from './MyButton.module.css';

interface MyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "soft" | "outline" | "ghost";
  size?: "1" | "2" | "3" | "4";
  children?: React.ReactNode;
}

export const MyButton = ({ onClick, disabled, variant = "solid", size = "2", children }: MyButtonProps) => (
  <Button
    variant={variant}
    size={size}
    onClick={onClick}
    disabled={disabled}
    className={styles.root}
  >
    {children ?? 'Click me'}
  </Button>
);
```

**Variant 감지 로직:**
- Figma solid fill + 높은 채도 → `variant="solid"`
- Figma outline stroke + no fill → `variant="outline"`
- Figma 낮은 opacity fill → `variant="soft"`
- Figma no fill, no stroke → `variant="ghost"`

---

#### 3.2.2 Dialog

**생성 코드:**
```tsx
import { Dialog, Button, Flex } from '@radix-ui/themes';

interface MyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MyDialog = ({ open, onOpenChange }: MyDialogProps) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Trigger>
      <Button variant="soft">Open</Button>
    </Dialog.Trigger>
    <Dialog.Content maxWidth="450px">
      <Dialog.Title>Dialog Title</Dialog.Title>
      <Dialog.Description size="2">
        Description text
      </Dialog.Description>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">Cancel</Button>
        </Dialog.Close>
        <Dialog.Close>
          <Button>Confirm</Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
);
```

**텍스트 매핑:**
- `d.texts.title` → `<Dialog.Title>`
- `d.texts.description` → `<Dialog.Description>`
- `d.texts.actions[0]` → Cancel 버튼 텍스트
- `d.texts.actions[1]` → Confirm 버튼 텍스트

---

#### 3.2.3 AlertDialog

**생성 코드:**
```tsx
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface MyAlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MyAlertDialog = ({ open, onOpenChange }: MyAlertDialogProps) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Trigger>
      <Button color="red">Delete</Button>
    </AlertDialog.Trigger>
    <AlertDialog.Content maxWidth="450px">
      <AlertDialog.Title>Confirm</AlertDialog.Title>
      <AlertDialog.Description size="2">
        Are you sure?
      </AlertDialog.Description>
      <Flex gap="3" mt="4" justify="end">
        <AlertDialog.Cancel>
          <Button variant="soft" color="gray">Cancel</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button color="red">Delete</Button>
        </AlertDialog.Action>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);
```

---

#### 3.2.4 Tabs

**생성 코드:**
```tsx
import { Tabs, Box } from '@radix-ui/themes';

interface MyTabsProps {
  defaultValue?: string;
}

export const MyTabs = ({ defaultValue = "tab1" }: MyTabsProps) => (
  <Tabs.Root defaultValue={defaultValue}>
    <Tabs.List>
      <Tabs.Trigger value="tab1">Account</Tabs.Trigger>
      <Tabs.Trigger value="tab2">Settings</Tabs.Trigger>
    </Tabs.List>
    <Box pt="3">
      <Tabs.Content value="tab1">
        {/* Account content */}
      </Tabs.Content>
      <Tabs.Content value="tab2">
        {/* Settings content */}
      </Tabs.Content>
    </Box>
  </Tabs.Root>
);
```

**탭 수 감지:** `d.texts.all`에서 30자 미만 텍스트 → Trigger 라벨로 사용

---

#### 3.2.5 Checkbox

**생성 코드:**
```tsx
import { Checkbox, Flex, Text } from '@radix-ui/themes';

interface MyCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export const MyCheckbox = ({ checked, onCheckedChange, label = "Agree" }: MyCheckboxProps) => (
  <Text as="label" size="2">
    <Flex gap="2" align="center">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </Flex>
  </Text>
);
```

**Before vs After 차이점:**
- Primitives: `Checkbox.Root` + `Checkbox.Indicator` + SVG 아이콘 필요
- Themes: `<Checkbox />` 단일 컴포넌트, 체크 아이콘 내장

---

#### 3.2.6 Switch

**생성 코드:**
```tsx
import { Switch, Flex, Text } from '@radix-ui/themes';

interface MySwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export const MySwitch = ({ checked, onCheckedChange, label = "Enable" }: MySwitchProps) => (
  <Text as="label" size="2">
    <Flex gap="2" align="center">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </Flex>
  </Text>
);
```

---

#### 3.2.7 Select

**생성 코드:**
```tsx
import { Select } from '@radix-ui/themes';

interface MySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const MySelect = ({ value, onValueChange }: MySelectProps) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger placeholder="Select..." />
    <Select.Content>
      <Select.Item value="option-1">Option 1</Select.Item>
      <Select.Item value="option-2">Option 2</Select.Item>
      <Select.Item value="option-3">Option 3</Select.Item>
    </Select.Content>
  </Select.Root>
);
```

**Before vs After:** Portal, Viewport, ItemText 하위 요소 제거

---

#### 3.2.8 Tooltip

**생성 코드:**
```tsx
import { Tooltip, IconButton } from '@radix-ui/themes';

interface MyTooltipProps {
  content?: string;
  children?: React.ReactNode;
}

export const MyTooltip = ({ content = "Tooltip content", children }: MyTooltipProps) => (
  <Tooltip content={content}>
    {children ?? <IconButton variant="ghost" size="1">?</IconButton>}
  </Tooltip>
);
```

**Before vs After:** Provider, Root, Trigger, Portal, Content, Arrow 모두 제거 → 단일 `<Tooltip content="...">`

---

#### 3.2.9 Popover

**생성 코드:**
```tsx
import { Popover, Button, Flex, Text } from '@radix-ui/themes';

interface MyPopoverProps {
  children?: React.ReactNode;
}

export const MyPopover = ({ children }: MyPopoverProps) => (
  <Popover.Root>
    <Popover.Trigger>
      <Button variant="soft">Open</Button>
    </Popover.Trigger>
    <Popover.Content maxWidth="300px">
      <Flex direction="column" gap="2">
        <Text size="2">Popover content</Text>
        {children}
      </Flex>
      <Popover.Close>
        <Button variant="ghost" size="1">Close</Button>
      </Popover.Close>
    </Popover.Content>
  </Popover.Root>
);
```

---

#### 3.2.10 Avatar

**생성 코드:**
```tsx
import { Avatar } from '@radix-ui/themes';

interface MyAvatarProps {
  src?: string;
  fallback?: string;
  size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
}

export const MyAvatar = ({ src, fallback = "AB", size = "3" }: MyAvatarProps) => (
  <Avatar src={src} fallback={fallback} size={size} radius="full" />
);
```

**Before vs After:** `Avatar.Root` + `Avatar.Image` + `Avatar.Fallback` → 단일 `<Avatar />`

---

#### 3.2.11 Separator

**생성 코드:**
```tsx
import { Separator } from '@radix-ui/themes';

interface MySeparatorProps {
  orientation?: "horizontal" | "vertical";
  size?: "1" | "2" | "3" | "4";
}

export const MySeparator = ({ orientation = "horizontal", size = "4" }: MySeparatorProps) => (
  <Separator orientation={orientation} size={size} />
);
```

---

#### 3.2.12 RadioGroup

**생성 코드:**
```tsx
import { RadioGroup } from '@radix-ui/themes';

interface MyRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const MyRadioGroup = ({ value, onValueChange }: MyRadioGroupProps) => (
  <RadioGroup.Root value={value} onValueChange={onValueChange}>
    <RadioGroup.Item value="option-1">Option 1</RadioGroup.Item>
    <RadioGroup.Item value="option-2">Option 2</RadioGroup.Item>
  </RadioGroup.Root>
);
```

**Before vs After:** `RadioGroup.Indicator` 제거, Item이 라벨 직접 포함

---

#### 3.2.13 Slider

**생성 코드:**
```tsx
import { Slider } from '@radix-ui/themes';

interface MySliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const MySlider = ({ value = [50], onValueChange, min = 0, max = 100, step = 1 }: MySliderProps) => (
  <Slider value={value} onValueChange={onValueChange} min={min} max={max} step={step} />
);
```

**Before vs After:** `Slider.Root` + `Slider.Track` + `Slider.Range` + `Slider.Thumb` → 단일 `<Slider />`

---

#### 3.2.14 Progress

**생성 코드:**
```tsx
import { Progress } from '@radix-ui/themes';

interface MyProgressProps {
  value?: number;
}

export const MyProgress = ({ value = 50 }: MyProgressProps) => (
  <Progress value={value} />
);
```

**Before vs After:** `Progress.Root` + `Progress.Indicator` + inline transform → 단일 `<Progress value={n} />`

---

#### 3.2.15 ScrollArea

**생성 코드:**
```tsx
import { ScrollArea } from '@radix-ui/themes';

interface MyScrollAreaProps {
  children?: React.ReactNode;
}

export const MyScrollArea = ({ children }: MyScrollAreaProps) => (
  <ScrollArea size="2" scrollbars="vertical" style={{ maxHeight: 300 }}>
    {children}
  </ScrollArea>
);
```

**Before vs After:** `ScrollArea.Root` + `Viewport` + `Scrollbar` + `Thumb` → 단일 `<ScrollArea>`

---

#### 3.2.16 DropdownMenu

**생성 코드:**
```tsx
import { DropdownMenu, Button } from '@radix-ui/themes';

interface MyDropdownMenuProps {
  trigger?: string;
  items?: string[];
}

export const MyDropdownMenu = ({ trigger = "Options", items = ["Item 1", "Item 2"] }: MyDropdownMenuProps) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Button variant="soft">{trigger}</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      {items.map((item) => (
        <DropdownMenu.Item key={item}>{item}</DropdownMenu.Item>
      ))}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
);
```

**Before vs After:** Portal 제거, DropdownMenu.Trigger에 Button 직접 래핑

---

#### 3.2.17 HoverCard

**생성 코드:**
```tsx
import { HoverCard, Flex, Text, Avatar } from '@radix-ui/themes';

interface MyHoverCardProps {
  trigger?: React.ReactNode;
}

export const MyHoverCard = ({ trigger }: MyHoverCardProps) => (
  <HoverCard.Root>
    <HoverCard.Trigger>
      {trigger ?? <Text>Hover me</Text>}
    </HoverCard.Trigger>
    <HoverCard.Content maxWidth="300px">
      <Flex gap="3">
        <Avatar size="3" fallback="U" radius="full" />
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">User Name</Text>
          <Text size="1" color="gray">Description</Text>
        </Flex>
      </Flex>
    </HoverCard.Content>
  </HoverCard.Root>
);
```

---

### 3.3 신규 빌더 — 상세 생성 코드

#### 3.3.1 IconButton

```tsx
import { IconButton } from '@radix-ui/themes';

interface MyIconButtonProps {
  onClick?: () => void;
  variant?: "solid" | "soft" | "outline" | "ghost";
  size?: "1" | "2" | "3" | "4";
  children?: React.ReactNode;
}

export const MyIconButton = ({ onClick, variant = "soft", size = "2", children }: MyIconButtonProps) => (
  <IconButton variant={variant} size={size} onClick={onClick}>
    {children ?? '★'}
  </IconButton>
);
```

#### 3.3.2 Spinner

```tsx
import { Spinner } from '@radix-ui/themes';

interface MySpinnerProps {
  size?: "1" | "2" | "3";
  loading?: boolean;
}

export const MySpinner = ({ size = "2", loading = true }: MySpinnerProps) => (
  <Spinner size={size} loading={loading} />
);
```

#### 3.3.3 SegmentedControl

```tsx
import { SegmentedControl } from '@radix-ui/themes';

interface MySegmentedControlProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const MySegmentedControl = ({ value, onValueChange }: MySegmentedControlProps) => (
  <SegmentedControl.Root value={value} onValueChange={onValueChange}>
    <SegmentedControl.Item value="option1">Option 1</SegmentedControl.Item>
    <SegmentedControl.Item value="option2">Option 2</SegmentedControl.Item>
  </SegmentedControl.Root>
);
```

#### 3.3.4 TabNav

```tsx
import { TabNav } from '@radix-ui/themes';

export const MyTabNav = () => (
  <TabNav.Root>
    <TabNav.Link href="#" active>Home</TabNav.Link>
    <TabNav.Link href="#">About</TabNav.Link>
    <TabNav.Link href="#">Contact</TabNav.Link>
  </TabNav.Root>
);
```

#### 3.3.5 DataList

```tsx
import { DataList } from '@radix-ui/themes';

export const MyDataList = () => (
  <DataList.Root>
    <DataList.Item>
      <DataList.Label>Name</DataList.Label>
      <DataList.Value>John Doe</DataList.Value>
    </DataList.Item>
    <DataList.Item>
      <DataList.Label>Email</DataList.Label>
      <DataList.Value>john@example.com</DataList.Value>
    </DataList.Item>
  </DataList.Root>
);
```

#### 3.3.6 AspectRatio

```tsx
import { AspectRatio } from '@radix-ui/themes';

interface MyAspectRatioProps {
  ratio?: number;
  children?: React.ReactNode;
}

export const MyAspectRatio = ({ ratio = 16 / 9, children }: MyAspectRatioProps) => (
  <AspectRatio ratio={ratio}>
    {children}
  </AspectRatio>
);
```

#### 3.3.7 Typography (code, link, blockquote, kbd, em, strong)

```tsx
// Code
import { Code } from '@radix-ui/themes';
export const MyCode = ({ children }: { children?: React.ReactNode }) => (
  <Code variant="soft">{children ?? 'console.log()'}</Code>
);

// Link
import { Link } from '@radix-ui/themes';
export const MyLink = ({ href = "#", children }: { href?: string; children?: React.ReactNode }) => (
  <Link href={href}>{children ?? 'Link text'}</Link>
);

// Blockquote
import { Blockquote } from '@radix-ui/themes';
export const MyBlockquote = ({ children }: { children?: React.ReactNode }) => (
  <Blockquote>{children ?? 'Quote text'}</Blockquote>
);

// Kbd
import { Kbd } from '@radix-ui/themes';
export const MyKbd = ({ children }: { children?: React.ReactNode }) => (
  <Kbd>{children ?? '⌘ C'}</Kbd>
);
```

---

## 4. buildRadixCSS() 변경 설계

### 4.1 원칙: Themes 컴포넌트는 CSS 최소화

Radix Themes 컴포넌트는 테마 토큰으로 기본 스타일이 적용되므로, 생성 CSS는 **Figma에서 추출된 커스텀 스타일만** 포함.

### 4.2 CSS 생성 규칙

| 컴포넌트 그룹 | CSS 생성 | 이유 |
|--------------|----------|------|
| button, checkbox, switch, avatar, separator, progress, slider, spinner, badge | **빈 CSS** (`.root {}` only) | Themes props로 완전 커버 |
| dialog, alert-dialog, popover | **최소 CSS** (커스텀 배경색/여백만) | Content 기본 스타일 Themes 제공 |
| tabs | **최소 CSS** (활성 탭 커스텀만) | List/Trigger 기본 스타일 Themes 제공 |
| card | **커스텀 CSS** (Figma 스타일 반영) | Card 내부 레이아웃 커스텀 필요 |
| layout | **전체 CSS** (기존 유지) | 시맨틱 div 래퍼, 스타일 필수 |
| Primitives (accordion 등) | **전체 CSS** (기존 유지) | Unstyled 컴포넌트 |

### 4.3 생성 패턴

```javascript
// Themes 컴포넌트 → CSS 최소화
if (RADIX_COMPONENT_REGISTRY[type].themeComponent) {
  // Figma에서 추출된 커스텀 스타일만 .root에 포함
  var customOnly = filterThemeDefaultStyles(d.styles);
  return customOnly ? '.root {\n' + stylesToCSSProps(customOnly) + '\n}' : '/* Radix Themes handles styling via props */';
}
// Primitives → 기존 CSS 유지
return buildPrimitivesCSS(d, type);
```

---

## 5. buildRadixStyled() 변경 설계

### 5.1 Themes + styled-components 패턴

```tsx
// Themes 컴포넌트는 styled 래핑 최소화
import { Button } from '@radix-ui/themes';
import styled from 'styled-components';

// 커스텀 스타일이 있을 때만 styled 래핑
const StyledButton = styled(Button)`
  /* Figma 추출 커스텀 스타일만 */
`;

// 커스텀 스타일 없으면 styled 래핑 없이 직접 사용
export const MyButton = (props) => <Button {...props} />;
```

### 5.2 규칙

- Figma 추출 커스텀 스타일이 **없으면**: styled 래핑 없이 Themes 컴포넌트 직접 사용
- 커스텀 스타일이 **있으면**: `styled(ThemesComponent)` 래핑 + 커스텀 CSS만 포함

---

## 6. code.ts 변경 설계

### 6.1 ComponentType 확장

```typescript
type ComponentType =
  // 기존 유지
  | 'layout' | 'button' | 'dialog' | 'tabs' | 'checkbox' | 'switch'
  | 'select' | 'tooltip' | 'accordion' | 'popover' | 'heading' | 'text'
  | 'badge' | 'card' | 'input' | 'textarea' | 'avatar' | 'separator'
  | 'progress' | 'slider' | 'radio-group' | 'scroll-area'
  | 'dropdown-menu' | 'context-menu' | 'navigation-menu'
  | 'hover-card' | 'alert-dialog' | 'collapsible' | 'callout'
  | 'table' | 'aspect-ratio' | 'skeleton'
  // 신규 추가
  | 'icon-button' | 'spinner' | 'checkbox-cards' | 'checkbox-group'
  | 'radio-cards' | 'segmented-control' | 'tab-nav' | 'data-list'
  | 'code' | 'link' | 'blockquote' | 'kbd' | 'em' | 'strong';
```

### 6.2 detectComponentType 로직

기존 `code.ts`의 감지 로직은 유지. 새 타입 키워드는 `TYPE_KEYWORDS` 확장으로 `component-builders.js`에서 처리.

---

## 7. UI 변경 설계

### 7.1 tab-component.js 변경

1. **컴포넌트 타입 드롭다운**: 신규 타입 옵션 추가
2. **Install hint**: `npm install @radix-ui/themes` 단일 안내
3. **Primitives 구분 표시**: accordion, collapsible, navigation-menu는 "(Primitives)" 라벨

### 7.2 드롭다운 옵션 그룹

```
── Radix Themes ──
Button, IconButton, Dialog, AlertDialog, Tabs, TabNav, Select,
DropdownMenu, ContextMenu, Checkbox, CheckboxCards, Switch,
RadioGroup, RadioCards, SegmentedControl, Slider, Tooltip,
Popover, HoverCard, Avatar, Badge, Card, Callout, DataList,
Table, Separator, Progress, Spinner, Skeleton, ScrollArea,
AspectRatio, Heading, Text, Code, Link, Blockquote, Kbd, Em, Strong,
Input, TextArea

── Radix Primitives ──
Accordion, Collapsible, NavigationMenu

── Layout ──
Layout (div/section/aside wrapper)
```

---

## 8. 구현 순서

| 순서 | 작업 | 예상 변경량 |
|------|------|-------------|
| **1** | RADIX_COMPONENT_REGISTRY + TYPE_KEYWORDS 재구성 | ~100줄 |
| **2** | button 빌더 전환 (CSS Modules + Styled) | ~30줄 |
| **3** | checkbox, switch 빌더 전환 | ~40줄 |
| **4** | dialog, alert-dialog 빌더 전환 | ~60줄 |
| **5** | tabs 빌더 전환 | ~30줄 |
| **6** | select, dropdown-menu 빌더 전환 | ~50줄 |
| **7** | tooltip, popover, hover-card 빌더 전환 | ~50줄 |
| **8** | avatar, separator, progress, slider, scroll-area, aspect-ratio 빌더 전환 | ~60줄 |
| **9** | radio-group 빌더 전환 | ~20줄 |
| **10** | 신규 빌더 추가: icon-button, spinner, segmented-control, tab-nav, data-list | ~80줄 |
| **11** | 신규 빌더 추가: code, link, blockquote, kbd, em, strong | ~60줄 |
| **12** | buildRadixCSS() Themes 최소화 | ~50줄 |
| **13** | buildRadixStyled() Themes 기준 전환 | ~100줄 |
| **14** | buildRadixCSSModules() switch 문 확장 | ~30줄 |
| **15** | code.ts ComponentType 확장 | ~10줄 |
| **16** | tab-component.js 드롭다운/hint 업데이트 | ~30줄 |
| **17** | `npm run build` 검증 | - |

---

## 9. 테스트 검증 항목

| # | 검증 항목 | 기대 결과 |
|---|-----------|-----------|
| 1 | Button 생성 | `import { Button } from '@radix-ui/themes'` 포함 |
| 2 | Dialog 생성 | `Dialog.Root/Content/Title/Description/Close` Themes 구조 |
| 3 | Checkbox 생성 | `<Checkbox />` 단일, Indicator/SVG 없음 |
| 4 | Switch 생성 | `<Switch />` 단일, Thumb 없음 |
| 5 | Select 생성 | Portal/Viewport 없음 |
| 6 | Tooltip 생성 | Provider 없음, `<Tooltip content="...">` 패턴 |
| 7 | Avatar 생성 | 단일 `<Avatar src fallback />` |
| 8 | Accordion 생성 | `@radix-ui/react-accordion` (Primitives 유지) |
| 9 | CSS 출력 | Themes 컴포넌트는 빈 CSS 또는 커스텀만 |
| 10 | Styled 출력 | Themes 컴포넌트는 최소 styled 래핑 |
| 11 | Install hint | `npm install @radix-ui/themes` 단일 |
| 12 | 빌드 성공 | `npm run build` 에러 없음 |
| 13 | 신규 타입 | icon-button, spinner, segmented-control 등 정상 생성 |
| 14 | HTML 모드 | 기존 동작 유지 |
| 15 | Button variant 감지 | solid fill → `variant="solid"`, no fill → `variant="ghost"` |
| 16 | Button color 감지 | blue fill → `color="blue"`, red fill → `color="red"` |
| 17 | Button size 감지 | padding 기반 size="1"/"2"/"3" 추론 |
| 18 | em/strong 빌더 | `<Em>`, `<Strong>` Themes 컴포넌트 생성 |
| 19 | checkbox-cards 등 | REGISTRY + 빌더 + 드롭다운 옵션 |

---

## 10. Variant 분석 설계 (v0.3.1 추가)

### 10.1 목적

Figma 노드의 시각적 스타일(fill, stroke, padding, height)을 분석하여 Radix Themes의 `variant`, `color`, `size` props를 자동 추론한다.

### 10.2 code.ts — generateComponent() 반환값 확장

```typescript
interface GenerateComponentResult {
  // 기존 필드 유지
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;
  html: string;
  jsx: string;
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;

  // v0.3.1 추가
  radixProps: {
    variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'surface' | 'classic';
    color?: string;    // Radix color name: 'blue', 'red', 'gray', etc.
    size?: '1' | '2' | '3' | '4';
  };
}
```

### 10.3 Variant 추론 로직 (code.ts)

```
inferRadixVariant(node):
  fills = node.fills (visible, SOLID only)
  strokes = node.strokes (visible)

  if fills.length === 0 && strokes.length === 0:
    return 'ghost'
  if fills.length === 0 && strokes.length > 0:
    return 'outline'
  if fills[0].opacity < 0.3:
    return 'soft'
  return 'solid'
```

### 10.4 Color 추론 로직 (code.ts)

```
inferRadixColor(node, colorMap):
  fills = node.fills (visible, SOLID only)
  if fills.length === 0: return undefined

  hex = rgbToHex(fills[0].color)

  // 1. colorMap에서 CSS variable 이름 찾기
  cssVar = colorMap[hex]  // e.g., '--blue-bright'

  // 2. CSS variable 이름에서 Radix color 매핑
  FIGMA_TO_RADIX_COLOR = {
    'blue': 'blue', 'bright': 'blue', 'primary': 'blue',
    'red': 'red', 'danger': 'red', 'error': 'red',
    'green': 'green', 'success': 'green',
    'orange': 'orange', 'warning': 'orange',
    'gray': 'gray', 'grey': 'gray', 'light': 'gray', 'default': 'gray',
    'purple': 'purple', 'violet': 'violet',
    'cyan': 'cyan', 'teal': 'teal',
  }

  for keyword in FIGMA_TO_RADIX_COLOR:
    if cssVar contains keyword: return FIGMA_TO_RADIX_COLOR[keyword]

  // 3. hex 색상의 hue에서 추론
  hue = getHue(hex)
  if hue 200-260: return 'blue'
  if hue 0-15 or 345-360: return 'red'
  if hue 90-150: return 'green'
  // ... etc
  return undefined
```

### 10.5 Size 추론 로직 (code.ts)

```
inferRadixSize(node):
  height = node.height
  paddingV = node.paddingTop || 0

  // height 기반
  if height <= 24: return '1'
  if height <= 32: return '2'
  if height <= 40: return '3'
  return '4'

  // 또는 padding 기반 (보조)
  if paddingV <= 5: return '1'
  if paddingV <= 8: return '2'
  if paddingV <= 10: return '3'
  return '4'
```

### 10.6 component-builders.js — radixProps 활용

```javascript
function buildButtonCSSModules(d, name, useTs) {
  var rp = d.radixProps || {};
  var variant = rp.variant || 'solid';
  var color = rp.color;
  var size = rp.size || '2';
  var label = (d.texts && d.texts.title) || name;
  var colorProp = color ? '\n    color="' + color + '"' : '';

  return (
    _imp('Button') + ...
    '  <Button\n    variant="' + variant + '"' + colorProp +
    '\n    size="' + size + '"' + ...
  );
}
```

### 10.7 Gap 분석 누락 항목 해결

| Gap | 해결 방법 |
|-----|-----------|
| em/strong 빌더 | `buildEmCSSModules`, `buildStrongCSSModules` 추가 + switch case |
| checkbox-cards/group, radio-cards | REGISTRY 엔트리 + 빌더 + 드롭다운 옵션 |
| UI 드롭다운 6개 누락 | Em, Strong, CheckboxCards, CheckboxGroup, RadioCards, NavigationMenu 추가 |
