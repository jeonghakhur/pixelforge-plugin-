# Gap Analysis: component-generation-improvement

> **Date**: 2026-03-31
> **Match Rate**: 91.7%
> **Status**: Pass (>= 90%)

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| RADIX_COMPONENT_REGISTRY (2.1) | 93% | Warning |
| TYPE_KEYWORDS (2.2) | 90% | Warning |
| Builder Functions (3.2-3.3) | 88% | Warning |
| buildRadixCSS (4) | 95% | Pass |
| buildRadixStyled (5) | 85% | Warning |
| code.ts ComponentType (6) | 100% | Pass |
| UI Dropdown (7) | 88% | Warning |
| Install Hint (7) | 100% | Pass |
| **Overall** | **91.7%** | **Pass** |

---

## Gap Summary

### Missing (Design O, Implementation X)

| # | Item | Impact |
|---|------|--------|
| 1 | `em` builder — falls to layout default | Medium |
| 2 | `strong` builder — falls to layout default | Medium |
| 3 | `checkbox-cards` REGISTRY + builder | Medium |
| 4 | `checkbox-group` REGISTRY + builder | Medium |
| 5 | `radio-cards` REGISTRY + builder | Medium |
| 6 | `navigation-menu` builder | Low |
| 7 | UI dropdown: 6 missing options | Medium |
| 8 | REGISTRY `import` field | Low |

### Recommended Actions

1. Add `em`/`strong` builders + switch cases
2. Add `checkbox-cards`/`checkbox-group`/`radio-cards` to REGISTRY + builders
3. Add missing UI dropdown options (Em, Strong, NavigationMenu, CheckboxCards, CheckboxGroup, RadioCards)
4. Expand `buildRadixStyled` coverage for more Themes types (optional)
