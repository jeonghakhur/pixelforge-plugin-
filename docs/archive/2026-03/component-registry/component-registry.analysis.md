# Component Registry Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Analyst**: gap-detector
> **Date**: 2026-03-30
> **Design Doc**: [component-registry.design.md](../../02-design/features/component-registry.design.md)

## Related Documents

- Plan: [component-registry.plan.md](../../01-plan/features/component-registry.plan.md)
- Design: [component-registry.design.md](../../02-design/features/component-registry.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design 문서(component-registry.design.md)와 실제 구현 코드(code.ts, ui.html, ui.js) 간의
Gap을 식별하고 Match Rate를 산출한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/component-registry.design.md`
- **Implementation Files**:
  - `src/code.ts` — NodeMeta, getSelectionInfo(), generateComponent(), registry handlers
  - `src/ui.html` — Component panel HTML structure
  - `src/ui.js` — Code generation functions, registry CRUD, event handlers

---

## 2. Overall Scores

| Category | Items | Matched | Score | Status |
|----------|:-----:|:-------:|:-----:|:------:|
| Data Model | 17 | 17 | 100% | Pass |
| Message Protocol | 11 | 8 | 73% | Warn |
| Type Detection | 21 | 19 | 90% | Pass |
| Code Generation | 16 | 14 | 88% | Warn |
| UI Layout | 22 | 20 | 91% | Pass |
| Registry CRUD | 7 | 7 | 100% | Pass |
| code.ts Changes | 6 | 5 | 83% | Warn |
| Completion Criteria | 9 | 9 | 100% | Pass |
| **TOTAL** | **109** | **99** | **91%** | **Pass** |

---

## 3. Gap Analysis (Design vs Implementation)

### 3.1 Data Model (Design Section 4)

#### ComponentEntry

| Field | Design | Implementation | Status |
|-------|--------|----------------|--------|
| name | string | string | Match |
| figmaNodeName | string | string | Match |
| figmaMasterNodeId | string | string | Match |
| componentType | ComponentType (10 types) | string (same 10 types) | Match |
| radixPackage | string / null | string / null | Match |
| styleMode | 'css-modules' / 'styled' | 'css-modules' / 'styled' | Match |
| useTs | boolean | boolean | Match |
| code.tsx | string | string | Match |
| code.css | string | string | Match |
| createdAt | string (ISO) | string (ISO) | Match |
| updatedAt | string (ISO) | string (ISO) | Match |

#### NodeMeta (code.ts:221-228)

All 6 fields match exactly. **100%**

#### Registry Storage Key

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Format | `pf-registry-{figmaFileKey}` | `pf-registry-${figma.root.id}` | Match |

**Data Model Score: 100%**

---

### 3.2 Message Protocol (Design Section 5)

#### Registry CRUD Messages (Section 5.2)

| Message | Design | Implementation | Status |
|---------|--------|----------------|--------|
| `registry-get` | `{ type, fileId }` | `{ type }` (no fileId) | Changed |
| `registry-save` | `{ type, fileId, entry }` | `{ type, entry }` | Changed |
| `registry-delete` | `{ type, fileId, masterId }` | `{ type, masterId }` | Changed |
| Responses (4 types) | Match | Match | Match |

`fileId` 제거는 의도적 단순화. `code.ts`가 `figma.root.id`를 직접 사용.

#### generate-component Message (Section 5.3)

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| UI sends options | `styleMode`, `componentType`, `useTs` | `{ type }` only | Changed |
| Response `meta` + `styles` | Required | Present | Match |
| Return type annotation | `{ name, meta, styles }` | Fixed (was `{name,html,react}`) | Fixed |

**Message Protocol Score: 73%** (intentional simplifications)

---

### 3.3 Type Detection (Design Section 6)

#### TYPE_KEYWORDS

| Type | Design Keywords | Implementation | Status |
|------|----------------|----------------|--------|
| button | button, btn, cta, action | Match | Match |
| dialog | dialog, modal, overlay, popup, sheet | Match | Match |
| select | select, dropdown, combobox, picker | Match | Match |
| tabs | tab, tabs, tabbar | Match | Match |
| tooltip | tooltip, hint, popover-tip | Fixed (added popover-tip) | Fixed |
| checkbox | checkbox, check | Match | Match |
| switch | switch, toggle | Match | Match |
| accordion | accordion, collapse, expand | Fixed (added expand) | Fixed |
| popover | popover, flyout | Match | Match |

**Type Detection Score: 90%** (2 keywords fixed)

---

### 3.4 Code Generation Templates (Design Section 7)

#### CSS Modules: 4 templates (Button, Dialog, Tabs, Layout) — all match.

#### Styled-Components

| Type | Status |
|------|--------|
| Dialog | Match |
| Button | Match |
| **Tabs** | **Missing — falls to generic layout** |
| Layout | Match |

**Code Generation Score: 88%**

---

### 3.5 UI Layout (Design Sections 2-3)

- Sub-tabs, type dropdown (10 options), style pills, TS checkbox, generate button — all match
- Result area: TSX/CSS tabs, copy, name input, save — all match
- Registry: search, list, detail (edit/update/delete/back) — all match
- **Missing**: "[React]" language indicator from design Section 3.1
- **Changed**: "불러오기" is click-on-item instead of separate button (UX improvement)

**UI Layout Score: 91%**

---

### 3.6 Registry CRUD (Design Section 8)

Save, Load (auto), Edit, Update, Delete (list/detail), Export All — **all 7 operations match.**

**Registry CRUD Score: 100%**

---

### 3.7 Completion Criteria (Design Section 12)

9/9 criteria met. **100%**

| # | Criterion | Status |
|---|-----------|--------|
| 1 | NodeMeta in selection-changed | Done |
| 2 | Type auto-detection (4+ types) | Done (9 types) |
| 3 | CSS Modules code gen | Done |
| 4 | Styled-Components code gen | Done |
| 5 | focus-visible default | Done |
| 6 | Registry CRUD | Done |
| 7 | Same node shows saved code | Done |
| 8 | Registry list search | Done |
| 9 | "JSON 저장" → "코드 저장" | Done |

---

## 4. Differences Summary

### 4.1 Missing Features (Design O, Implementation X)

| # | Item | Impact | Status |
|---|------|--------|--------|
| 1 | ~~TYPE_KEYWORDS: `popover-tip`~~ | Low | **Fixed** |
| 2 | ~~TYPE_KEYWORDS: `expand`~~ | Low | **Fixed** |
| 3 | Styled Tabs template | Medium | Open |
| 4 | React language indicator | Low | Open |
| 5 | Storage capacity warning (1MB) | Low | Open |

### 4.2 Changed Features (Design ≠ Implementation)

| # | Item | Impact | Note |
|---|------|--------|------|
| 1 | Registry messages: no fileId | Low | Intentional (code.ts uses figma.root.id directly) |
| 2 | generate-component: no options payload | Low | Intentional (UI-side code gen) |
| 3 | ~~generateComponent() type annotation~~ | Medium | **Fixed** |
| 4 | "불러오기" is click-on-item | Low | UX improvement |

### 4.3 Added Features (Design X, Implementation O)

| # | Item | Description |
|---|------|-------------|
| 1 | Export All JSON | Registry JSON download (Plan FR-16 optional) |

---

## 5. Fixes Applied

| # | Fix | File | Description |
|---|-----|------|-------------|
| 1 | Type annotation bug | `src/code.ts:716` | Return type corrected to `{ name, meta, styles }` |
| 2 | Missing keyword | `src/ui.js:1619` | tooltip: added `'popover-tip'` |
| 3 | Missing keyword | `src/ui.js:1622` | accordion: added `'expand'` |

---

## 6. Remaining Recommendations

| Priority | Item | Action |
|----------|------|--------|
| P3 | Styled Tabs template | Add tabs branch in `buildStyledTSX()` |
| P4 | React label | Add "[React]" indicator or remove from design |
| P4 | Storage warning | Add 1MB capacity check before save |
| Doc | Design Section 5.2/5.3 | Reflect fileId removal and options handling |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-30 | Initial gap analysis + P1/P2 fixes applied | gap-detector |
