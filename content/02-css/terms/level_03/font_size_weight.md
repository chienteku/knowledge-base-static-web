# `font-size` & `font-weight`

> **Level 3 — Typography & Colors**
> The properties used to control how large and how thick the text appears on the screen.

---

## 1. Prerequisites
- [`font-family`](font_family.md) — It helps to know how to select the font before you resize it.

---

## 2. Term Category

**Typography Property (Universal Browser Support)**: `font-size` & `font-weight` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A website needs visual hierarchy. A page title must be huge and bold, while a footer copyright notice should be small and thin. 
- **`font-size`** controls the exact height of the text characters.
- **`font-weight`** controls the thickness (boldness) of the text characters.

While you can define `font-size` using fixed pixels (`px`), modern web development highly encourages using relative units like `rem` (Root EM). `1rem` equals the default font size of the user's browser (usually 16px). Using `rem` ensures that if a visually impaired user increases their default browser text size to 24px, your website scales up perfectly to match their needs!

### (2) Reality Metaphor
If your text is a printed book:
**`font-size`** is the difference between large-print books for the elderly, and the tiny fine-print at the bottom of a contract.
**`font-weight`** is the difference between writing with a fine-tip pen (thin) and writing with a thick Sharpie marker (bold).

### (3) Code Examples

#### Using REMs and Weights
```css
/* The browser default is usually 16px */

h1 {
  /* 2.5 * 16px = 40px */
  font-size: 2.5rem; 
  /* 700 is the standard numerical value for 'bold' */
  font-weight: 700; 
}

p {
  /* 1 * 16px = 16px */
  font-size: 1rem;
  /* 400 is the standard numerical value for 'normal' */
  font-weight: 400; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Pixels (`px`) for font size

**The mistake:** Setting all the text on your website using `font-size: 16px;`.

**Why it's wrong:** Pixels are an absolute, fixed unit. If a visually impaired user goes into their Google Chrome settings and changes their default font size from 16px to 24px, your website will **ignore** their settings and force the text to stay at 16px. This is a massive failure in Accessibility (a11y). By using `font-size: 1rem;` instead, the text will automatically scale up to 24px to respect the user's settings.

### Mistake 2: Requesting a font weight you didn't download

**The mistake:** Setting `font-weight: 900;` (ultra-black) when you only imported the `400` (normal) version of the font from Google Fonts.

**Why it's wrong:** A font file only contains the specific weights you download. If you ask the browser for an ultra-thick weight that doesn't exist, the browser will try to artificially "smear" the normal text to make it look thicker. It looks terrible and blurry. Always make sure you import the exact weights you plan to use!

---



### Mistake 3: Using Hardcoded Absolute Pixels (`font-size: 16px`) Impairing User Browser Zooming Settings

**The mistake:** Setting all body typography using fixed pixel units `font-size: 14px`.

**Why it's wrong:** Fixed `px` font sizes override user-agent font size preferences in browser accessibility settings. Use relative `rem` units based on root 16px default.

*Incorrect:*
```css
body { font-size: 16px; } p { font-size: 14px; } /* ❌ Hardcoded pixel sizes */
```

*Fix:*
```css
html { font-size: 100%; } p { font-size: 0.875rem; } /* Accessible rem units */
```

### Mistake 4: Specifying Numeric `font-weight` Values (e.g. `font-weight: 600`) Not Loaded by Web Font File

**The mistake:** Setting `font-weight: 600` when `@font-face` only imports 400 and 700 weights.

**Why it's wrong:** If a specific numeric weight (e.g. 600) is not included in the imported web font file, browsers perform artificial 'fake bolding' (synthetic bold), producing distorted glyph rendering.

*Incorrect:*
```css
/* Font file imports 400 and 700 weights only */
h2 { font-weight: 600; } /* ❌ Triggers synthetic bolding distortion! */
```

*Fix:*
```css
h2 { font-weight: 700; } /* Use explicitly imported font weight */
```

## 5. Practice Exercises

### Exercise 1: Accessible Typographic Scale using rem Font Sizes and Font Weight

**Scenario:** An author constructs an accessible typographic hierarchy using `rem` font sizes and numerical font weights.

**Requirements:**
1. Define `html { font-size: 100%; }`.
2. Set `h1` to `font-size: 2.25rem` and `font-weight: 700`.
3. Set body text to `font-size: 1rem` and `font-weight: 400`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> html {
>   font-size: 100%;             /* Baseline browser default (16px) */
> }
>
> body {
>   font-size: 1rem;            /* 16px baseline */
>   font-weight: 400;           /* Normal weight */
>   color: #1e293b;
> }
>
> h1 {
>   font-size: 2.25rem;         /* ~36px relative heading */
>   font-weight: 700;           /* Bold weight */
>   line-height: 1.25;
> }
>
> .subheading {
>   font-size: 1.25rem;         /* ~20px subheading */
>   font-weight: 600;           /* Semi-bold weight */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`font-size` Relative `rem` Units**: `1rem` equals root element font size; using `rem` allows visually impaired users to enlarge text via browser settings.
> 2. **Numerical `font-weight` Scale**: Numeric weights range from `100` (Thin) to `900` (Black); `400` is Normal and `700` is Bold.
> 3. **Avoiding Fixed Pixels**: Avoid fixed `px` font sizes on body text, as they prevent browser font scaling overrides.
> 
---

### Exercise 2: Fluid Responsive Typography using clamp()

**Scenario:** Creates fluid responsive headings that scale smoothly between screen sizes without media queries using `clamp()`.

**Requirements:**
1. Apply `font-size: clamp(1.75rem, 4vw, 3rem)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .hero-title {
>   /* clamp(MIN, VAL, MAX): Scales between 1.75rem (~28px) and 3rem (~48px) */
>   font-size: clamp(1.75rem, 4vw + 1rem, 3rem);
>   font-weight: 800;
>   line-height: 1.15;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `clamp()` Function**: `clamp(MIN, VAL, MAX)` calculates fluid font sizes based on viewport width while preventing text from becoming unreadably tiny or huge.
> 2. **Accessibility Safety Net**: Using `4vw + 1rem` as the middle value ensures users can still zoom text manually.
> 3. **Zero Media Query Overhead**: Eliminates multiple breakpoint media query rules for headings.
> 
---

### Exercise 3: Variable Font Weight Interpolation

**Scenario:** Utilizes CSS variable fonts to animate smooth weight transitions on hover.

**Requirements:**
1. Apply `font-weight: 350` to `750` transition.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .variable-btn {
>   font-family: "Inter Variable", sans-serif;
>   font-weight: 400;
>   transition: font-weight 0.2s ease;
> }
>
> .variable-btn:hover {
>   font-weight: 600;             /* Smooth variable weight interpolation */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Variable Font Capability**: Variable fonts contain entire weight ranges (100-900) in a single lightweight font file.
> 2. **Arbitrary Numerical Weights**: Supports non-standard numeric weights (e.g. `font-weight: 450`).
> 3. **Performance Optimization**: Reduces HTTP font requests by replacing 4 static WOFF2 files with 1 variable font.
## 6. Related Terms
- [`font-family`](font_family.md) — Defines the actual typeface.
- [`font-style` & `font-variant`](font_style_variant.md) — Styling and small-caps variations.
- [`rem` vs `em`](../level_08/rem_em.md) — Responsive typography units.
- [`line-height`](line_height.md) — Related concept: `line-height`.
- [`text-transform`](../level_07/text_transform.md) — Related concept: `text-transform`.

---

## 7. Key Takeaways
- `font-size` controls text height; `font-weight` controls text thickness.
- Font weights are usually defined numerically from `100` (thin) to `900` (black). `400` is normal, `700` is bold.
- **Accessibility Rule**: Always use `rem` instead of `px` for `font-size` so visually impaired users can scale your text!
