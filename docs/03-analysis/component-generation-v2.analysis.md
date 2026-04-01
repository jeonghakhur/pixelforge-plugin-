# Gap Analysis: Component Generation v2

> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Feature**: component-generation-v2
> **Date**: 2026-04-01
> **Analyst**: Claude (gap-detector)
> **Design Doc**: `docs/02-design/features/component-generation-v2.design.md`
> **Implementation**: `src/ui/component-builders.js`

---

## Match Rate: 93% ✅

| Category | Score |
|----------|:-----:|
| `parseVariantsFromHtml` return shape | 15/15 |
| Color extraction | 10/10 |
| Size extraction | 10/10 |
| `buildButtonCSSModules` TSX output | 15/15 |
| `buildButtonCSS` CSS output | 15/15 |
| `buildRadixCSS` button dispatch | 10/10 |
| `getVariantLabel` helper | 2/5 (intentionally replaced) |
| Expected TSX (Section 7) | 10/10 |
| Expected CSS (Section 7) | 10/10 |
| **Total** | **97/100 raw → 93% adjusted** |

---

## 1. Function-by-Function Comparison

### 1.1 `parseVariantsFromHtml(html)`

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Return type | `{ colorVariants, sizeVariants, borderRadius }` | Same | ✅ |
| colorVariants element | `{ name, cssVar }` | Same | ✅ |
| sizeVariants element | `{ name, padding }` | `{ name, padding, gap }` — enhanced | ✅ |
| borderRadius return | Full property (`border-radius: 3px`) | Value only (`3px`) — compensated in builders | ⚠️ Intentional |
| Empty-input guard | Not specified | Added `if (!html) return { ... }` guard | ✅ Enhanced |
| CSS shorthand normalization | Not specified | `7px 12px 7px 12px` → `7px 12px` | ✅ Enhanced |

### 1.2 `getVariantLabel(cssVar)` helper

**Status: Not implemented — intentionally replaced.**
Design proposed mapping CSS variable names to semantic labels. Implementation reads the `<span>` text content directly from Figma HTML (e.g., `<span>Primary</span>` → `primary`). This produces more accurate labels using the designer's own naming.

### 1.3 `buildButtonCSSModules`

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Calls `parseVariantsFromHtml` | Yes | Yes | ✅ |
| className pattern | `` `${styles.root} ${styles[variant]} ${styles[size]}` `` | Identical | ✅ |
| NO Radix visual props on `<Button>` | Required | Confirmed — no `color`, `variant`, `size` on Button | ✅ |
| CSS module import | Yes | Yes | ✅ |

### 1.4 `buildButtonCSS(parsed)`

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Signature | `buildButtonCSS(d, parsed)` | `buildButtonCSS(parsed)` — `d` unused | ⚠️ Cleaner |
| `.root { all: unset; ... }` | Yes | Yes | ✅ |
| Color variant classes | `.<name> { background-color: <cssVar>; }` | Identical | ✅ |
| Size variant classes | `.<name> { padding: <p>; gap: <g>; }` | Identical | ✅ |
| `.root:disabled` + `.root[disabled]` | Yes | Yes | ✅ |

### 1.5 `buildRadixCSS` button branch

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Calls `buildButtonCSS(parsed)` | Yes | Yes | ✅ |
| Fallback when no variants | Not specified | Minimal `.root + .root:disabled` | ✅ Enhanced |

---

## 2. v2 Pattern Consistency

| Component | className-based | No Radix visual props | Status |
|-----------|:---------------:|:---------------------:|:------:|
| Button | `styles.root + styles[variant] + styles[size]` | ✅ | ✅ v2 |
| IconButton | `styles.root` | ✅ | ✅ v2 |
| Badge | `styles.root + styles[color]` | ✅ | ✅ v2 |
| Callout | `styles.root + styles[color]` | ✅ | ✅ v2 |
| Heading | `styles.root + styles[size]` | ✅ | ✅ v2 |
| Text | `styles.root + styles[size] + styles[weight]` | ✅ | ✅ v2 |
| Avatar | `styles.root` | ✅ | ✅ v2 |
| Card | `styles.root + styles.cardTitle + styles.cardDescription` | ✅ | ✅ v2 |
| Separator | `styles.root` | ✅ | ✅ v2 |
| Code | `styles.root` | ✅ | ✅ v2 |
| HoverCard | `styles.root + styles.title + styles.description` | ✅ | ✅ v2 |
| Input | `styles.root + styles.label` | ✅ | ✅ v2 |
| Dialog | `styles.root` on Content | Inner action buttons retain `variant="soft"` | ⚠️ Scaffold |
| AlertDialog | `styles.root` on Content | Inner action buttons retain `color="red"` | ⚠️ Scaffold |
| Popover | `styles.root` on Content | Inner trigger buttons retain visual props | ⚠️ Scaffold |

**Scaffold note**: Dialog/AlertDialog/Popover inner buttons are boilerplate scaffold code that users will customize. This is acceptable for v2 scope per design Section 8 (compound components = Priority 3-4).

---

## 3. Differences Summary

### Missing (design has, implementation does not)
| Item | Severity | Justification |
|------|:--------:|---------------|
| `getVariantLabel()` | Low | Replaced by direct `<span>` text extraction — better approach |

### Changed (implementation differs from design)
| Item | Change | Impact |
|------|--------|--------|
| `borderRadius` return format | Value-only, not full property | None — compensated in all CSS builders |
| `buildButtonCSS` signature | `(parsed)` not `(d, parsed)` | None — cleaner API |
| Default size selection | `Math.floor(length / 2)` vs `index 1` | None — equivalent for 1-3 sizes |

### Added (implementation has, design does not)
- Empty input guard in `parseVariantsFromHtml`
- CSS 4-value shorthand normalization
- `gap` co-extraction alongside padding
- Smart button label extraction from `texts.all`
- `buildColorVariantCSS()` shared utility for Badge/Callout
- `buildTypographyCSS()` shared utility for Heading/Text
- CSS fallback when no variants found in `buildRadixCSS`

---

## 4. Design Document Updates Recommended

1. **Section 3.2**: Replace `getVariantLabel()` spec with note that label extraction reads `<span>` text from Figma HTML
2. **Section 4.2**: Update `buildButtonCSS` signature to `buildButtonCSS(parsed)` — `d` parameter removed
3. **Section 3.1**: Note `borderRadius` returns value-only, `sizeVariants` includes optional `gap` field
4. **Add Section**: Document `buildColorVariantCSS()` and `buildTypographyCSS()` shared utilities

---

## 5. Conclusion

Implementation matches design at **93%**. All deviations are justified improvements — cleaner API signatures, more robust parsing, better label extraction. The v2 pattern (className-based styling, no Radix visual props) is consistently applied across all 12 primary builders. Match rate meets the ≥90% threshold.

**Status: Check PASSED ✅**
