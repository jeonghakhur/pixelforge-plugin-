# text-token-split Gap Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: PixelForge Token Extractor
> **Analyst**: gap-detector
> **Date**: 2026-03-31
> **Design Doc**: [text-token-split.design.md](../02-design/features/text-token-split.design.md)
> **Match Rate**: 100%

---

## 1. Analysis Overview

**Design Document**: `docs/02-design/features/text-token-split.design.md` (Sections 2-11)
**Implementation Files**: `src/code.ts`, `src/converters/typography.js`, `src/ui.js`, `src/ui.html`

---

## 2. Section-by-Section Gap Analysis

### Section 2: Interface Changes (`src/code.ts`)

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `FontData { family, cssVar, styles }` | `code.ts` — identical | ✅ Match | |
| `ExtractedTokens.styles.texts` (backward compat) | preserved | ✅ Match | |
| `ExtractedTokens.styles.textStyles` | added | ✅ Match | |
| `ExtractedTokens.styles.headings` | added | ✅ Match | |
| `ExtractedTokens.styles.fonts` | added | ✅ Match | |
| `ExtractOptions.tokenTypes` with new types | includes `textStyles \| headings \| fonts` | ✅ Match | |

**Score: 6/6 (100%)**

### Section 3: `HEADING_RE` Constant

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `HEADING_RE = /\b(heading\|display\|title\|h[1-6])\b/i` | `code.ts` — identical, alongside SPACING_RE / RADIUS_RE | ✅ Match | |

**Score: 1/1 (100%)**

### Section 4: `extractAll()` Changes

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| Backward compat `texts` block preserved | ✅ | ✅ Match | |
| `needsTextSplit` check | ✅ | ✅ Match | |
| `allTexts` with `mapTextStyle` + selection filter | ✅ | ✅ Match | |
| `textStyles` filter via `!HEADING_RE.test` | ✅ | ✅ Match | |
| `headings` filter via `HEADING_RE.test` | ✅ | ✅ Match | |
| `fonts = collectFonts(allTexts)` | ✅ | ✅ Match | |
| `mapTextStyle()` extracted as standalone function | all fields match design | ✅ Match | |

**Score: 7/7 (100%)**

### Section 5: `collectFonts()` Function

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `Map<string, Set<string>>` dedup | ✅ | ✅ Match | |
| Alphabetical sort by family | ✅ | ✅ Match | |
| `cssVar` generation (lowercase, spaces→hyphens, strip special) | ✅ | ✅ Match | |
| Empty family guard (`!family.trim()`) | ✅ | ✅ Match | edge case from Section 11 |

**Score: 4/4 (100%)**

### Section 6: `extractAll()` Return Value

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `styles: { colors, texts, textStyles, headings, fonts, effects }` | exact field order matches | ✅ Match | |

**Score: 1/1 (100%)**

### Section 7: `convertFonts()` (`src/converters/typography.js`)

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| Guard `!fonts \|\| fonts.length === 0` | ✅ | ✅ Match | |
| Comment `/* === Font Families === */` | ✅ | ✅ Match | |
| `:root { ... }` wrapper | ✅ | ✅ Match | |
| CSS var output: `f.cssVar + ': "' + f.family + '"'` | ✅ | ✅ Match | |
| Trailing `}\n\n` | ✅ | ✅ Match | |

**Score: 5/5 (100%)**

### Section 8: `ui.js` Changes

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| 8.1 import `convertFonts` | ✅ | ✅ Match | |
| 8.2 `generateCSS()` texts block preserved | ✅ | ✅ Match | |
| 8.2 `textStyles` CSS generation | ✅ | ✅ Match | |
| 8.2 `headings` CSS generation | ✅ | ✅ Match | |
| 8.2 `fonts` CSS generation via `convertFonts` | ✅ | ✅ Match | |
| 8.3 `getFilteredData()` textStyles field | `\|\| []` fallback present | ✅ Match | |
| 8.3 `getFilteredData()` headings field | ✅ | ✅ Match | |
| 8.3 `getFilteredData()` fonts field | ✅ | ✅ Match | |
| 8.4 `textStylesCount` / `headingsCount` / `fontsCount` | ✅ | ✅ Match | |
| 8.4 `statTextStylesNum` / `statHeadingsNum` / `statFontsNum` DOM update | ✅ | ✅ Match | |
| 8.4 `inactive` toggle array includes new 3 entries | ✅ | ✅ Match | |
| 8.5 i18n ko: `textStylesCard`, `headingsCard`, `fontsCard` | ✅ | ✅ Match | |
| 8.5 i18n en: `textStylesCard`, `headingsCard`, `fontsCard` | ✅ | ✅ Match | |

**Score: 13/13 (100%)**

### Section 9: `ui.html` Changes

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| 9.1 All token-card `active` class removed | 0 occurrences in entire `src/` | ✅ Match | |
| 9.2 Old `texts` card removed | no `data-type="texts"` in HTML | ✅ Match | |
| 9.2 `textStyles` card with SVG (lines icon) | SVG path + data-i18n key match | ✅ Match | |
| 9.2 `headings` card with SVG (H icon) | SVG path + data-i18n key match | ✅ Match | |
| 9.2 `fonts` card with SVG (A icon) | SVG path + data-i18n key match | ✅ Match | |
| 9.3 Old `statText` stat-card removed | no `statText` ID in HTML | ✅ Match | |
| 9.3 `statTextStyles` stat-card | ✅ | ✅ Match | |
| 9.3 `statHeadings` stat-card | ✅ | ✅ Match | |
| 9.3 `statFonts` stat-card | ✅ | ✅ Match | |

**Score: 9/9 (100%)**

### Section 11: Edge Cases

| Edge Case | Design Handling | Implementation | Status |
|-----------|-----------------|---------------|:------:|
| Old cache data (`styles.textStyles` missing) | `\|\| []` fallback | `ui.js` getFilteredData + stats | ✅ |
| All text styles match HEADING_RE | textStyles=[], headings=all | filter logic correct | ✅ |
| Empty `fontName.family` | `family.trim() === '' -> skip` | `if (!family.trim()) continue` | ✅ |
| `texts` and `textStyles` selected simultaneously | independent extraction | separate blocks in extractAll | ✅ |

**Score: 4/4 (100%)**

---

## 3. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                   |
+---------------------------------------------+
|  Section 2 (Interfaces):     6/6   (100%)  |
|  Section 3 (HEADING_RE):     1/1   (100%)  |
|  Section 4 (extractAll):     7/7   (100%)  |
|  Section 5 (collectFonts):   4/4   (100%)  |
|  Section 6 (Return Value):   1/1   (100%)  |
|  Section 7 (convertFonts):   5/5   (100%)  |
|  Section 8 (ui.js):         13/13  (100%)  |
|  Section 9 (ui.html):        9/9   (100%)  |
|  Section 11 (Edge Cases):    4/4   (100%)  |
+---------------------------------------------+
|  TOTAL:  50/50 items  =  100%              |
+---------------------------------------------+
```

---

## 4. Differences Found

### Missing Features (Design O, Implementation X)

None.

### Added Features (Design X, Implementation O)

None.

### Changed Features (Design ≠ Implementation)

None.

---

## 5. Recommended Actions

No actions required. Design and implementation are fully aligned.

**Next Step**: `/pdca report text-token-split`
