# `font-style` & `font-variant`

> **Level 3 — Typography & Colors**
> CSS properties used to control text emphasis (italics and slants via `font-style`) and typographic modifications (like converting lowercase letters to mini-capitals via `font-variant`).

---

## 1. Prerequisites
- [`font-size` & `font-weight`](font_size_weight.md) — The baseline typography configuration tags.

---

## 2. Term Category

**Typography Property (Universal Browser Support .)**: `font-style` & `font-variant` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Text formatting requires more options than simply changing size and thickness. To create professional visual layouts and hierarchies, designers need:
-   **Italic emphasis:** To highlight book titles, quotes, or draw attention to specific words.
-   **Small-caps headings:** A styling style where all lowercase letters are converted into uppercase letters, but are drawn at the size of lowercase letters. This is widely used in newsletters, business reports, and metadata headers.

The W3C created **`font-style`** and **`font-variant`** to handle these styling styles.

---

### (2) `font-style` Details
This property sets the posture of the font face:
-   **`normal`**: The default upright characters.
-   **`italic`**: Displays the **true italic version** of the typeface. True italics are not just slanted; they are custom-drawn by font designers and often feature handwriting-like curves (especially visible in letters like `a`, `f`, and `g`).
-   **`oblique`**: Takes standard upright characters and slants (skews) them at an angle. Useful if a font does not have a true italic file designed.

---

### (3) `font-variant` (Small-Caps)
This property sets font capitalizations:
-   **`normal`**: Default casing.
-   **`small-caps`**: Converts lowercase letters into capital letters, but scales their height down to match the height of a standard lowercase 'x' (known as the x-height).
-   *Example:* `"User Profile"` styled with `small-caps` renders visually as `"USER PROFILE"`, but the 'U' and 'P' are taller than the rest of the letters.

---

### (4) Placement inside the `font` Shorthand
Both properties can be packed into the master `font` shorthand. The standard sequence order is:

`font: [style] [variant] [weight] [size]/[line-height] [family];`

Example:
`font: italic small-caps bold 1.2rem/1.5 Arial, sans-serif;`

---

### (5) Code Examples

#### Short Snippet
Basic italic and small-caps declarations:

```css
blockquote {
  font-style: italic; /* Emphasize quotes */
}

h3 {
  font-variant: small-caps; /* Professional subheadings */
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Font Posture and Variants</title>
  <style>
    body {
      font-family: Georgia, serif;
      margin: 30px;
    }

    .quote-text {
      /* Displays true Georgia italics */
      font-style: italic; 
      color: #555;
    }

    .metadata-label {
      /* Lowercase letters become small-caps */
      font-variant: small-caps; 
      font-size: 0.9rem;
      letter-spacing: 1px;
      color: darkblue;
    }

    /* Combined using shorthand font property */
    .special-header {
      font: italic small-caps bold 24px/1.4 Georgia, serif;
    }
  </style>
</head>
<body>

  <div class="metadata-label">published by sourdough portal</div>
  <h2 class="special-header">Classic Baking Methods</h2>
  
  <p class="quote-text">
    "Wild yeast starters require patience, clean water, and regular feedings..."
  </p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `font-style: italic` with synthetic slanting (Faux Italics)

**The mistake:** Setting `font-style: italic` on a custom font family where you did not import the italic font-weight file:

```css
/* BAD: If only the regular weight was imported, the browser slants it artificially */
.card-title {
  font-family: 'Open Sans', sans-serif; /* Only regular 400 imported */
  font-style: italic; 
}
```

**Why it's wrong:** If the browser doesn't have a true italic font file loaded, it forcibly skews (slants) the regular upright letters. This is called a **Faux Italic**. 

Faux italics look unpolished, have jagged pixel edges, and ignore the designer's intent. 

**Fix:** Always ensure that you import both the regular and italic files of a custom typeface.

---



### Mistake 2: Using `font-style: italic` When No True Italic Web Font File Is Loaded

**The mistake:** Applying `font-style: italic` to a custom web font that only includes a `normal` style font file.

**Why it's wrong:** When no true italic font file exists, browsers slant regular font glyphs artificially (synthetic/faux italic), creating distorted text typography.

*Incorrect:*
```css
/* Web font imports only normal style file */
em { font-style: italic; } /* ❌ Renders synthetic slanted font! */
```

*Fix:*
```css
/* Import italic variant in @font-face definition: */
@font-face { font-family: 'Custom'; src: url('custom-italic.woff2'); font-style: italic; }
```

### Mistake 3: Confusing `font-style` with `font-variant`

**The mistake:** Using `font-style: small-caps` to create small-caps typography.

**Why it's wrong:** Small-caps typography is controlled by `font-variant: small-caps` or `font-feature-settings`, NOT `font-style` (`italic`/`oblique`/`normal`).

*Incorrect:*
```css
span { font-style: small-caps; } /* ❌ Invalid font-style value! */
```

*Fix:*
```css
span { font-variant: small-caps; }
```

## 5. Practice Exercises

### Exercise 1: Styling Italics and Oblique Text using font-style

**Scenario:** An author styles publication citations and emphasis using `font-style: italic`.

**Requirements:**
1. Apply `font-style: italic` to `<cite>` and `.caption`.
2. Reset `font-style: normal` on `<em>` when nested.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> cite, .publication-title {
>   font-style: italic;           /* Renders true italic font glyphs */
> }
>
> .caption {
>   font-style: italic;
>   font-size: 0.875rem;
>   color: #64748b;
> }
>
> /* Reset font-style on nested elements */
> cite em {
>   font-style: normal;           /* Reverts to upright text for contrast */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `font-style` Property**: Controls italic vs upright text rendering (`normal`, `italic`, `oblique`).
> 2. **Italic vs Oblique**: `italic` uses designed cursive italic font glyphs; `oblique` mechanically slants upright glyphs.
> 3. **Semantic Tag Styling**: HTML `<cite>` and `<em>` default to `font-style: italic` in user-agent stylesheets.
> 
---

### Exercise 2: OpenType Tabular Numbers and Small Caps via font-variant

**Scenario:** Uses `font-variant-numeric: tabular-nums` to align data numbers in financial tables.

**Requirements:**
1. Apply `font-variant-numeric: tabular-nums` to financial data table cells.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .financial-table td {
>   /* Enforces monospaced numeric digits for vertical column alignment */
>   font-variant-numeric: tabular-nums;
> }
>
> .acronym-text {
>   /* Renders lowercase letters as small capital glyphs */
>   font-variant-caps: small-caps;
> }
> ```
>
> #### Technical Explanation
>
> 1. **OpenType `font-variant-numeric`**: `tabular-nums` forces all numeric digits (0-9) to have identical character widths.
> 2. **Financial Table Alignment**: Prevents financial figures from jittering horizontally when numbers update dynamically.
> 3. **`font-variant-caps`**: Unlocks native OpenType small caps glyphs without altering underlying HTML string data.
> 
---

### Exercise 3: Resetting Font Styles on UI Indicators

**Scenario:** Resets `font-style: normal` on `<i>` icon font tags.

**Requirements:**
1. Set `font-style: normal` on `.icon`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .icon {
>   font-style: normal;           /* Prevents icon fonts from tilting sideways */
>   line-height: 1;
>   display: inline-block;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Icon Font Reset**: Prevents legacy `<i>` icon tags from inheriting unwanted italic slants.
> 2. **Display Inline Block**: Ensures vector icon spans transform predictably.
> 3. **Clean Utility Styling**: Maintains upright icon rendering across browsers.
## 6. Related Terms
- [`font-size` & `font-weight`](font_size_weight.md) — The parent typography properties.
- [`text-transform`](../level_07/text_transform.md) — Uppercase/lowercase formatting overrides (different from small-caps).
- [`line-height`](line_height.md) — Related concept: `line-height`.

---

## 7. Key Takeaways
- `font-style` controls text posture: `normal`, `italic`, or slanted `oblique`.
- True italics use unique custom letter curves, whereas oblique simply skews standard letters.
- `font-variant: small-caps` converts lowercase letters to scaled-down capital letters.
- Both properties can be combined inside the unified `font` shorthand.
- Ensure italic font files are imported to prevent browsers from drawing ugly "faux italics".
