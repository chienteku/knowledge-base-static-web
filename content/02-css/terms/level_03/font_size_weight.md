# `font-size` & `font-weight`

> **Level 3 — Typography & Colors**
> The properties used to control how large and how thick the text appears on the screen.

---

## 1. Prerequisites
- [`font-family`](../level_03/font_family.md) — It helps to know how to select the font before you resize it.

---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: REM Math

**Problem:** Assuming the browser's default font size is 16px, how many pixels is `font-size: 1.5rem;`?

**Expected output:**
```text
24px! (1.5 * 16 = 24).
```

> [!check]- Answer
> - `1rem` = 16px. Multiply 16 by 1.5.

---



### Exercise 2: Converting Pixels to rem Units

**Problem:** Convert `24px` font size to `rem` units assuming standard `16px` root font size.

**Expected output:**
```text
1.5rem (24 / 16 = 1.5)
```

> [!check]- Answer
> ```css
> h2 {
>   font-size: 1.5rem; /* 1.5 * 16px = 24px */
> }
> ```
>
> **Explanation:** `rem` values equal target pixel size divided by root font size (16px).

### Exercise 3: Font-Weight Keyword Mapping Matrix

**Problem:** Match numeric `font-weight` to keyword name:
1. `400` 
2. `700` 
3. `300` 
4. `900` 

**Expected output:**
```text
1. normal (or Regular)
2. bold
3. light
4. black (or Heavy)
```

> [!check]- Answer
> ```text
> 1. 400 -> normal / Regular
> 2. 700 -> bold
> 3. 300 -> Light
> 4. 900 -> Black / Heavy
> ```
>
> **Explanation:** Numeric font-weights map standard typographic font thickness grades.

## 7. Related Terms
- [`font-family`](../level_03/font_family.md) — Defines the actual typeface.
- [`font-style` & `font-variant`](../level_03/font_style_variant.md) — Styling and small-caps variations.
- [`rem` and `em`](../level_07/rem_em.md) — Responsive typography units.

---

## 8. Key Takeaways
- `font-size` controls text height; `font-weight` controls text thickness.
- Font weights are usually defined numerically from `100` (thin) to `900` (black). `400` is normal, `700` is bold.
- **Accessibility Rule**: Always use `rem` instead of `px` for `font-size` so visually impaired users can scale your text!
