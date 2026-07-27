# Missing CSS Terms — AI Knowledge-Base Gap Analysis

> **Purpose of this file.** The current curriculum in `terms/level_01` … `terms/level_10`
> defines **50 terms** (see `_meta/css_terms_zero_to_hero.md`). Reviewing it as a
> junior engineer trying to *learn CSS from these files alone*, I hit **gaps**:
> concepts that the existing docs **use, assume, or reference in prose but never define as
> their own term**. This file catalogs those gaps so an AI can generate the missing term
> docs and make the knowledge base self-contained.
>
> **How to read this file.**
> - **Section 1** — the critical gaps (concepts used everywhere but never taught).
> - **Section 2** — the full list of missing terms, grouped by the level they belong to.
>   Each row is shaped to drop straight into the term-doc template: it names the
>   **prerequisites** and **related terms** so the `## 1. Prerequisites` and
>   `## 7. Related Terms` sections can be filled in automatically.
> - **Section 3** — the relationship map (dependency graph) between missing terms and
>   existing terms.
> - **Section 4** — suggested generation priority.
>
> **Evidence method.** "Gap" = concept appears in prose/code of ≥1 existing term file but
> has no dedicated `terms/level_XX/<term>.md`. Also includes concepts a junior learner
> would need to bridge between levels to achieve smooth progressive learning.

---

## 0. Inventory Mismatch

Before listing gaps, note that the zero-to-hero master list and the actual file tree have drifted:

### Listed in zero-to-hero but MISSING a dedicated file

| # | Term from master list | Level | Status |
|---|----------------------|-------|--------|
| 23 | Flexbox (Concept) | 5 | Merged into `flex_parent.md` — no standalone concept doc |
| 29 | `flex-grow` / `flex-shrink` / `flex-basis` | 5 | **NO FILE** |
| 30 | CSS Grid (Concept) | 6 | File exists but in `level_05/grid_concept.md` (wrong level vs list) |
| 31 | `display: grid` | 6 | Merged into `grid_concept.md` — no standalone file |
| 32 | `grid-template-columns` / `grid-template-rows` | 6 | **NO FILE** (mentioned in `grid_concept.md` prose only) |
| 34 | `grid-column` / `grid-row` | 6 | **NO FILE** |
| 35 | `fr` unit | 6 | **NO FILE** (mentioned in `grid_concept.md` prose only) |
| 36 | Responsive Design (Concept) | 7 | **NO FILE** |
| 37 | Media Queries | 7 | File exists as `media_queries.md` (Term #40 in file, vs #37 in list) |
| 40 | `max-width` (Fluidity) | 7 | **NO FILE** |
| 41 | Pseudo-classes (`:hover`, `:focus`, `:active`) | 8 | File exists but in `level_09/hover_focus.md` (wrong level vs list) |
| 42 | Pseudo-elements (`::before`, `::after`) | 8 | **NO FILE** |
| 45 | `opacity` & `rgba()` | 8 | `opacity.md` exists; `rgba()` is only mentioned in prose |
| 46 | `transition` | 9 | File exists but in `level_09/transition.md` (matches) |
| 48 | `@keyframes` & `animation` | 9 | **NO FILE** |
| 50 | CSS Functions (`calc()`, `min()`, `max()`, `clamp()`) | 10 | `calc.md` exists in `level_07`; `min()`/`max()`/`clamp()` **NO FILE** |

### Extra files NOT in the zero-to-hero list

| File | Level | Content |
|------|-------|---------|
| `level_06/letter_word_spacing.md` | 6 | Typography II |
| `level_06/list_style.md` | 6 | List styling |
| `level_06/text_overflow.md` | 6 | Text overflow |
| `level_06/text_shadow.md` | 6 | Text shadow |
| `level_06/text_transform.md` | 6 | Text transform |
| `level_06/white_space.md` | 6 | White space |
| `level_07/calc.md` | 7 | `calc()` function |
| `level_07/percentages.md` | 7 | Percentage units |
| `level_08/cursor.md` | 8 | Cursor property |
| `level_10/import.md` | 10 | `@import` |

> These extra files are valuable additions beyond the original 50, but the master list should
> be updated to reflect them once all gaps are filled.

---

## 1. Critical Gaps (used pervasively, never defined)

These block comprehension the most because existing lessons rely on them without explanation.

| Gap | Evidence (files mentioning it) | Why it blocks learning |
|-----|-------------------------------|------------------------|
| **Inheritance** | `the_cascade.md` mentions it implicitly; `font_family.md`, `color_vs_background.md`, `line_height.md` all rely on inherited values | The third pillar of CSS (alongside Cascade and Specificity) is never defined. A learner doesn't understand why setting `color` on `body` magically affects all `<p>` tags, or why `border` doesn't inherit. |
| **`!important`** | `specificity.md` warns against it; `the_cascade.md` implies it | The nuclear option is referenced repeatedly but never formally defined — what it does, why it wins, when (rarely) it's acceptable. |
| **Colors (hex, rgb, rgba, hsl, hsla, named)** | `color_vs_background.md`, `opacity.md` uses `rgba()`, `box_shadow.md`, `border.md` — virtually every file uses color values | Color notation is the most-used CSS value type and is never explained. A learner sees `#3498db`, `rgb(25,118,210)`, `rgba()`, `hsl()` in every example but has no idea how to read or write them. |
| **`overflow` (hidden, scroll, auto, visible)** | `text_overflow.md` requires `overflow: hidden`, `z_index.md` references stacking context from overflow, position docs assume it | The `overflow` property is a prerequisite of text truncation, scroll containers, and stacking contexts, yet it has no term doc. |
| **`display: none` vs `visibility: hidden`** | `opacity.md` explicitly contrasts `opacity: 0` vs `display: none`, `display.md` covers block/inline but never mentions `none` | Two of the most common ways to hide elements are never defined. The learner sees "use `display: none`" in the opacity doc but has nowhere to learn what it does. |
| **Pseudo-elements (`::before`, `::after`)** | Listed in zero-to-hero #42, but no file exists; `hover_focus.md` teaches pseudo-*classes* but explicitly doesn't cover pseudo-*elements* | Pseudo-elements are one of the most powerful CSS features (decorative icons, clearfixes, custom bullets) and are completely absent. |
| **`@keyframes` & `animation`** | Listed in zero-to-hero #48, but no file exists; `transition.md` and `transform.md` build up to animations but stop short | The curriculum teaches transitions (A→B) but never teaches animations (A→B→C→D→A loop). This is the natural culmination of Level 9. |
| **`flex-grow` / `flex-shrink` / `flex-basis`** | Listed in zero-to-hero #29, but no file; `flex_parent.md` and `flex_wrap.md` both assume the learner knows how items grow/shrink | The most confusing part of Flexbox is completely missing. A learner can center items but cannot control how they distribute remaining space. |
| **Stacking Context** | `z_index.md` mentions "The Stacking Context Trap (Advanced)" but never defines it | The z-index doc warns about stacking contexts trapping children but never explains what creates a stacking context. This is the #1 z-index debugging issue. |
| **CSS Reset / Normalize** | `box_sizing.md` teaches the `* { box-sizing: border-box; }` reset, `margin.md` mentions browser defaults | Every real project starts with a CSS reset, but the concept of browser default styles (User-Agent Stylesheet) and how to override them is never introduced. |

---

## 2. Missing Terms by Level

> Legend for **Category**: `Core Concept` / `Layout Property` / `Typography` / `Visual Effect` /
> `CSS At-Rule` / `CSS Unit` / `CSS Function` / `Architecture`
> (per `_meta/technology_context.md`). **Prereqs** and **Related** reference existing terms by
> name or other *missing* terms (marked with 🆕).

### Level 1 — Core Concepts (fundamental gaps)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 1 | **Inheritance** [DONE] | The mechanism by which certain CSS properties (like `color`, `font-family`) automatically pass down from parent to child elements. | Core Concept | The Cascade, Selectors | Specificity, 🆕 `!important`, 🆕 Computed vs Used Values |
| 2 | **`!important` Declaration** [DONE] | A flag that overrides all normal Specificity and Cascade rules, giving a declaration the highest priority. | Core Concept | Specificity, The Cascade | 🆕 Inheritance |
| 3 | **CSS Comments (`/* */`)** [DONE] | How to write notes in CSS code that are ignored by the browser. | Core Concept | Ruleset | CSS (exists) |
| 4 | **Shorthand vs Longhand Properties** [DONE] | How CSS condenses multiple related properties (like `margin-top`, `margin-right`, etc.) into one shorthand (`margin`). | Core Concept | Ruleset | Margin, Padding, Border, 🆕 `background` shorthand |

### Level 2 — The Box Model (completing the model)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 5 | **Margin Collapse** [DONE] | The CSS behavior where adjacent vertical margins merge into one, taking the larger value instead of adding together. | Core Concept | Margin, The Box Model | Padding, 🆕 Block Formatting Context |
| 6 | **`overflow` (hidden, scroll, auto, visible)** [DONE] | The property that controls what happens when content is larger than its container — hide it, add scrollbars, or let it spill out. | Layout Property | The Box Model, Width/Height | 🆕 `text-overflow` (exists), 🆕 Stacking Context, 🆕 `display: none` |

### Level 3 — Typography & Colors (color system gap)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 7 | **Color Values (hex, rgb, rgba, hsl, named)** [DONE] | The different notation systems for defining colors in CSS: named colors, hexadecimal (`#ff0000`), `rgb()`, `rgba()`, `hsl()`, and `hsla()`. | Core Concept | Ruleset, `color` vs `background-color` | `opacity`, `box-shadow`, 🆕 Gradients |
| 8 | **`background` Shorthand & `background-image`** [DONE] | The full `background` property including images, gradients, size, position, and repeat behavior. | Visual Effect | `color` vs `background-color`, The Box Model | 🆕 Gradients, 🆕 `background-size` / `cover` / `contain` |
| 9 | **`@font-face` & Web Fonts (Google Fonts)** [DONE] | How to load custom fonts from external sources or local files, beyond the default system fonts. | Typography | `font-family` | `@import` (exists), `<link>` (HTML) |
| 10 | **`font-style` & `font-variant`** [DONE] | Properties for italic text and small-caps, completing the font property family. | Typography | `font-size` & `font-weight` | `text-decoration`, `text-transform` (exists) |

### Level 4 — Display & Positioning (critical missing concepts)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 11 | **`display: none` vs `visibility: hidden`** [DONE] | Two fundamentally different ways to hide elements: removing from layout vs making invisible while preserving space. | Layout Property | `display`, The Box Model | `opacity`, 🆕 Accessibility concerns |
| 12 | **`position: sticky`** [DONE] | A hybrid of `relative` and `fixed` that scrolls normally until reaching a threshold, then "sticks" to the viewport. | Layout Property | `position: relative`, `position: fixed` | `top`/`bottom`/`left`/`right`, 🆕 `overflow` |
| 13 | **Stacking Context** [DONE] | An isolated layering system created by certain CSS properties (e.g., `position`, `opacity`, `transform`) that traps `z-index` values within its boundaries. | Core Concept | `z-index`, `position: absolute/fixed` | `opacity`, `transform` |
| 14 | **Document Flow (Normal Flow)** [DONE] | The default algorithm the browser uses to lay out elements on a page before any positioning or layout systems are applied. | Core Concept | `display: block/inline`, The Box Model | `position`, `float`, Flexbox, Grid |

### Level 5 — Flexbox (completing the system)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 15 | **`flex-grow` / `flex-shrink` / `flex-basis`** [DONE] | The three child-level properties that control how flex items distribute remaining space, shrink when space is tight, and set their initial size. | Layout Property | `display: flex`, `flex-direction` | `flex-wrap`, `justify-content`, `align-items` |
| 16 | **`align-self`** [DONE] | A child-level property that overrides the parent's `align-items` for a single flex item. | Layout Property | `align-items`, `display: flex` | `justify-content`, 🆕 `order` |
| 17 | **`order`** [DONE] | A child-level property that controls the visual order of flex items without changing the HTML source order. | Layout Property | `display: flex` | 🆕 `align-self`, `flex-direction` |
| 18 | **`align-content`** [DONE] | Controls how multiple rows/columns of flex items are distributed along the cross axis (only works with `flex-wrap: wrap`). | Layout Property | `flex-wrap`, `align-items` | `justify-content` |

### Level 6 — CSS Grid (the entire Grid sub-curriculum is skeletal)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 19 | **`grid-template-columns` / `grid-template-rows`** [DONE] | The Grid parent properties that define the number and sizes of columns and rows in the grid. | Layout Property | `display: grid` | 🆕 `fr` unit, `gap` |
| 20 | **`fr` Unit (Fractional Unit)** [DONE] | A CSS Grid-specific unit that represents one fraction of the available free space in the grid container. | CSS Unit | `grid-template-columns` | `display: grid`, 🆕 `repeat()`, `calc()` |
| 21 | **`grid-column` / `grid-row` (Grid Item Placement)** [DONE] | Child-level properties that let a grid item span across multiple columns or rows. | Layout Property | `grid-template-columns`, `display: grid` | 🆕 `grid-template-areas`, 🆕 `fr` |
| 22 | **`grid-template-areas`** [DONE] | A parent property that lets you define a visual ASCII-art map of named regions in the grid layout. | Layout Property | `grid-template-columns`, `grid-template-rows` | 🆕 `grid-area`, `grid-column`/`grid-row` |
| 23 | **`repeat()` Function** [DONE] | A CSS function used within `grid-template-columns/rows` to repeat column/row patterns (e.g., `repeat(3, 1fr)`). | CSS Function | `grid-template-columns`, `fr` unit | `display: grid`, 🆕 `auto-fill`/`auto-fit` |
| 24 | **`auto-fill` / `auto-fit`** [DONE] | Keywords used inside `repeat()` to automatically create as many grid columns as will fit, enabling responsive grids without media queries. | Layout Property | 🆕 `repeat()`, `grid-template-columns` | Media Queries, 🆕 `minmax()` |
| 25 | **`minmax()` Function** [DONE] | A CSS Grid function that defines a size range for a column/row (e.g., `minmax(200px, 1fr)`). | CSS Function | `grid-template-columns` | 🆕 `auto-fill`/`auto-fit`, `fr` unit |

### Level 7 — Responsive Design (concept & practical gaps)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 26 | **Responsive Design (Concept)** [DONE] | The design philosophy of building websites that adapt their layout and typography to fit any screen size, from phones to 4K monitors. | Core Concept | Media Queries, `rem`/`em`, Viewport Units | 🆕 Mobile-First Design, Flexbox, Grid |
| 27 | **Mobile-First Design** [DONE] | The practice of writing CSS for the smallest screens first, then using `min-width` media queries to progressively enhance for larger screens. | Core Concept | Media Queries, 🆕 Responsive Design | 🆕 Breakpoints, Flexbox |
| 28 | **Breakpoints** [DONE] | The specific screen widths (e.g., 768px, 1024px, 1440px) at which the layout changes via media queries. | Core Concept | Media Queries, 🆕 Responsive Design | 🆕 Mobile-First Design |
| 29 | **`max-width` & `min-height` (Fluidity)** [DONE] | Properties that set a maximum width / minimum height to prevent elements from growing too large or collapsing too small, enabling fluid layouts. | Layout Property | Width/Height, 🆕 Responsive Design | Viewport Units, `%` |
| 30 | **`min()`, `max()`, `clamp()` Functions** [DONE] | Modern CSS math functions that pick the minimum, maximum, or a clamped range of values, enabling truly responsive sizing without media queries. | CSS Function | `calc()`, `rem`/`em`, Viewport Units | 🆕 Responsive Design, `font-size` |

### Level 8 — Visual Effects & Aesthetics (missing effects)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 31 | **Gradients (`linear-gradient`, `radial-gradient`)** [DONE] | CSS functions that create smooth color transitions as background images, replacing the need for gradient image files. | Visual Effect | 🆕 Color Values, `background` | `background-image`, 🆕 `background-size` |
| 32 | **`background-size` / `cover` / `contain`** [DONE] | Controls how a background image is scaled to fit or fill its container. | Visual Effect | `background`, The Box Model | 🆕 Gradients, 🆕 Responsive Design |
| 33 | **`filter` (blur, brightness, grayscale, etc.)** [DONE] | A property that applies visual effects like blur, grayscale, sepia, or brightness to an entire element. | Visual Effect | `opacity` | `transform`, `transition` |
| 34 | **`backdrop-filter`** [DONE] | Applies visual effects (like blur) to the area *behind* an element, creating frosted-glass effects. | Visual Effect | 🆕 `filter`, `opacity` | `rgba()`, `position: fixed` |
| 35 | **`object-fit` & `object-position`** [DONE] | Properties that control how an `<img>` or `<video>` is resized to fit its container (like `background-size` but for content elements). | Visual Effect | Width/Height, `<img>` (HTML) | 🆕 `background-size`, `border-radius` |

### Level 9 — Pseudo-elements, Transitions & Animations (completing the system)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 36 | **Pseudo-elements (`::before` & `::after`)** [DONE] | Virtual HTML elements created entirely in CSS, injected before or after an element's real content, used for decorative effects. | Core Concept | Selectors, `content` property, `:hover` | `position: absolute`, `display` |
| 37 | **`@keyframes` & `animation`** [DONE] | A CSS at-rule that defines multi-step animations with full control over timing, iteration, direction, and intermediate states. | CSS At-Rule | `transition`, `transform` | `:hover`, 🆕 `animation-fill-mode` |
| 38 | **Other Pseudo-classes (`:nth-child`, `:first-child`, `:last-child`, `:not()`)** [DONE] | Structural pseudo-classes that target elements based on their position in the DOM tree or negation logic. | Core Concept | Selectors, `:hover`/`:focus` | Specificity, 🆕 Pseudo-elements |
| 39 | **`:active`, `:visited`, `:disabled`, `:checked`** [DONE] | State-based pseudo-classes for links, form elements, and interactive states beyond hover/focus. | Core Concept | `:hover`/`:focus`, Selectors | `<a>` (HTML), `<input>` (HTML), 🆕 `cursor` (exists) |

### Level 10 — Modern CSS Architecture (missing architecture concepts)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 40 | **CSS Reset / Normalize (User-Agent Stylesheet)** [DONE] | The concept of browser default styles and the practice of resetting or normalizing them for cross-browser consistency. | Architecture | The Cascade, `box-sizing` | 🆕 `@import`, 🆕 Inheritance |
| 41 | **Combinator Selectors (Descendant, Child, Sibling)** [DONE] | Advanced selector patterns: descendant (` `), child (`>`), adjacent sibling (`+`), and general sibling (`~`). | Core Concept | Selectors, Specificity | 🆕 Pseudo-classes, 🆕 Pseudo-elements |
| 42 | **Attribute Selectors** [DONE] | Selectors that target elements based on their HTML attributes or attribute values (e.g., `[type="email"]`, `[data-active]`). | Core Concept | Selectors, Specificity, HTML Attributes | 🆕 Combinator Selectors |
| 43 | **CSS Methodologies (BEM, OOCSS, SMACSS)** [DONE] | Naming conventions and organizational patterns for writing scalable, maintainable CSS in large projects. | Architecture | `class` (HTML), Selectors | `var()`, 🆕 CSS Reset, `@import` |
| 44 | **CSS Preprocessors (Sass/SCSS, Less) — Overview** [DONE] | Tools that extend CSS with variables, nesting, mixins, and functions, compiled into standard CSS before delivery to the browser. | Architecture | `var()`, `@import`, Selectors | 🆕 CSS Methodologies, Bundlers (JS knowledge base) |
| 45 | **`@supports` (Feature Queries)** [DONE] | A CSS at-rule that applies styles only if the browser supports a specific CSS feature, enabling progressive enhancement. | CSS At-Rule | Media Queries, The Cascade | `var()`, `display: grid` |
| 46 | **`aspect-ratio`** [DONE] | A modern CSS property that sets a preferred aspect ratio for an element, replacing the old "padding-top hack" for responsive containers. | Layout Property | Width/Height, 🆕 Responsive Design | `object-fit`, Viewport Units |
| 47 | **`scroll-behavior` & `scroll-snap`** [DONE] | Properties that enable smooth scrolling and CSS-controlled snap-to-position behavior for scroll containers. | Visual Effect | 🆕 `overflow`, The Box Model | `position: sticky`, Viewport Units |
| 48 | **Container Queries (`@container`)** [DONE] | A modern CSS feature that applies styles based on the size of a parent container (rather than the viewport), enabling truly component-based responsive design. | CSS At-Rule | Media Queries, 🆕 Responsive Design | `var()`, `display: grid` |
| 49 | **`accent-color`** [DONE] | A modern CSS property that styles the browser's built-in form controls (checkboxes, radio buttons, progress bars) with a single color. | Visual Effect | `color` vs `background-color`, `<input>` (HTML) | `var()`, 🆕 Color Values |
| 50 | **`:root` Pseudo-class** [DONE] | The CSS pseudo-class that targets the root element of the document (the `<html>` tag), used as the standard location for defining CSS variables. | Core Concept | Selectors, `var()` | Specificity, 🆕 Inheritance |
| 51 | **Dark Mode (`prefers-color-scheme`)** [DONE] | A media query that detects the user's OS-level light/dark theme preference, enabling automatic theme switching. | CSS At-Rule | Media Queries, `var()` | 🆕 Color Values, `rgba()` |

---

## 3. Relationship Map (dependency graph)

How the missing terms connect to each other and to existing terms. `A → B` means
"understanding A meaningfully requires B" (B is a prerequisite of A).

### 3.1 The Cascade "holy trinity" (Cascade + Specificity + Inheritance)

```
CSS (exists) → The Cascade (exists)
   → Specificity (exists)
        → !important 🆕  ← referenced in specificity.md but never defined
   → Inheritance 🆕  ← THE keystone CSS gap
        → font-family (exists), color (exists), line-height (exists)
        → "Why does body { color: red; } make ALL text red?"
```

### 3.2 Color system cluster (colors are used everywhere)

```
Ruleset (exists)
   → Color Values (hex/rgb/rgba/hsl) 🆕  ← every file uses colors, never taught
        → opacity (exists) uses rgba()
        → box-shadow (exists) uses color
        → Gradients 🆕 → background-image/background shorthand 🆕
        → Dark Mode (prefers-color-scheme) 🆕
```

### 3.3 Hiding elements cluster

```
display: block/inline (exists)
   → display: none vs visibility: hidden 🆕
        → opacity: 0 (exists — references display: none)
        → Accessibility concerns 🆕
overflow 🆕
   → text-overflow (exists — REQUIRES overflow: hidden)
   → Stacking Context 🆕 → z-index (exists)
   → scroll-behavior / scroll-snap 🆕
```

### 3.4 Flexbox completion

```
display: flex (exists) → flex-direction (exists)
   → justify-content (exists), align-items (exists)
   → flex-wrap (exists)
   → flex-grow / flex-shrink / flex-basis 🆕  ← the "how items share space" gap
        → align-self 🆕, order 🆕
        → align-content 🆕 (multi-row distribution)
```

### 3.5 Grid completion (barely started)

```
display: grid (exists, skeletal)
   → grid-template-columns / rows 🆕  ← mentioned in prose, no file
        → fr unit 🆕 (mentioned in prose)
        → repeat() 🆕 → auto-fill / auto-fit 🆕
        → minmax() 🆕
   → grid-column / grid-row 🆕  ← item placement
   → grid-template-areas 🆕  ← named areas
```

### 3.6 Responsive design cluster

```
Responsive Design (Concept) 🆕  ← umbrella concept, never introduced
   → Mobile-First Design 🆕 → Breakpoints 🆕
   → Media Queries (exists)
   → max-width / min-height 🆕
   → min() / max() / clamp() 🆕 → calc() (exists)
   → Container Queries (@container) 🆕
```

### 3.7 Pseudo-elements & animation cluster

```
Selectors (exists) → :hover / :focus (exists)
   → Pseudo-elements (::before / ::after) 🆕  ← entirely missing
   → Other pseudo-classes (:nth-child, :not()) 🆕
   → :active, :visited, :disabled 🆕
transition (exists) → transform (exists)
   → @keyframes & animation 🆕  ← the final boss of Level 9, missing
```

### 3.8 Advanced selectors cluster

```
Selectors (exists)
   → Combinator Selectors (descendant, child, sibling) 🆕
   → Attribute Selectors 🆕
   → :root pseudo-class 🆕 → var() (exists)
```

### 3.9 Visual effects cluster

```
background-color (exists)
   → background shorthand & background-image 🆕
        → Gradients 🆕
        → background-size / cover / contain 🆕
   → filter (blur, grayscale) 🆕 → backdrop-filter 🆕
   → object-fit 🆕 (for <img> elements)
```

### 3.10 Architecture cluster

```
box-sizing reset (exists)
   → CSS Reset / Normalize 🆕 (User-Agent Stylesheet concept)
   → CSS Methodologies (BEM) 🆕
   → CSS Preprocessors (Sass) 🆕 — overview only
   → @supports 🆕 (feature detection)
```

---

## 4. Suggested Generation Priority

Ordered so each batch unblocks the next (and repairs the most existing prose references).

| Tier | Rationale | Terms |
|------|-----------|-------|
| **P0 — Repairs pervasive references** | Used in existing docs but undefined; blocks basic comprehension | Inheritance; `!important`; Color Values (hex/rgb/rgba/hsl); `overflow`; `display: none` vs `visibility: hidden`; Document Flow; Margin Collapse; Shorthand vs Longhand |
| **P1 — Completes the zero-to-hero list** | Listed in master list but have no files | `flex-grow`/`flex-shrink`/`flex-basis`; `grid-template-columns`/`rows`; `grid-column`/`grid-row`; `fr` unit; Responsive Design (Concept); `max-width` (Fluidity); Pseudo-elements (`::before`/`::after`); `@keyframes` & `animation`; `min()`/`max()`/`clamp()` |
| **P2 — Completes Flexbox & Grid** | The two layout systems are skeletal without these | `align-self`; `order`; `align-content`; `grid-template-areas`; `repeat()`; `auto-fill`/`auto-fit`; `minmax()` |
| **P3 — Responsive design breadth** | Makes the responsive design level self-contained | Mobile-First Design; Breakpoints; Container Queries (`@container`); `aspect-ratio` |
| **P4 — Visual effects & backgrounds** | Essential daily-use effects missing from Levels 8–9 | `background` shorthand & `background-image`; Gradients; `background-size`/`cover`/`contain`; `filter`; `backdrop-filter`; `object-fit`; `@font-face` & Web Fonts |
| **P5 — Advanced selectors & pseudo-classes** | Complete the selector system | Combinator Selectors; Attribute Selectors; `:nth-child`/`:first-child`/`:last-child`/`:not()`; `:active`/`:visited`/`:disabled`/`:checked`; `:root`; Stacking Context |
| **P6 — Architecture & modern CSS** | Professional context for large projects | CSS Reset/Normalize; CSS Methodologies (BEM); CSS Preprocessors (Sass); `@supports`; Dark Mode (`prefers-color-scheme`); `scroll-behavior`/`scroll-snap`; `accent-color`; CSS Comments |

---

## 5. Notes for the Generating AI

- **Follow the existing template.** Every new file must mirror the 8-section structure used in
  `terms/level_XX/*.md` (Prerequisites → Term Category → Environment Context → Explanation
  [Design Motivation / Reality Metaphor / Code Examples] → Common Mistakes → Practice Exercises
  → Related Terms → Key Takeaways) and obey `_meta/technology_context.md` (Senior UI/UX
  Engineer & CSS Architect persona; Flexbox/Grid over floats; discourage `!important`; prefer
  `rem`/`em` over `px`; `border-box` gospel; Mobile-First; separation of concerns).
- **Wire the cross-links.** Use the **Prerequisites** and **Related** columns in Section 2 to
  populate `## 1. Prerequisites` and `## 7. Related Terms` with correct relative paths
  (`../level_XX/<term>.md`). When a new term links to another new term, create both.
- **Fix the inventory mismatch.** After generating, update `_meta/css_terms_zero_to_hero.md`
  to reflect the actual file tree (adding the extra Level 6/7/8 files that already exist but
  aren't listed, and adding all newly generated terms).
- **Renumber intentionally.** The current numbering is inconsistent between the master list
  and the files (e.g., `media_queries.md` says Term #40 but the list says #37). Decide on a
  numbering scheme and stay consistent.
- **Level placement notes.** The actual file tree has already reorganized some terms vs the
  master list (e.g., Grid concept is in `level_05`, pseudo-classes are in `level_09`). The
  generating AI should follow the *actual file tree structure*, not the master list, to avoid
  breaking existing cross-links. Update the master list afterward.
- **Cross-link to HTML knowledge base.** Several CSS terms naturally reference HTML concepts.
  Use `../../../01-html/terms/level_XX/<term>.md` for cross-technology links (following the
  pattern established in `css.md`, `selectors.md`, and `box_model.md`).
- **Tone.** Visual, structural, and strict on best practices. Remember the audience may have
  just finished the HTML knowledge base. Use vivid real-world metaphors (the existing docs
  excel at this — pizza boxes, parking garages, waterfalls, etc.).
