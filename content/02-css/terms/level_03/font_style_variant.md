# `font-style` & `font-variant`

> **Level 3 — Typography & Colors**
> CSS properties used to control text emphasis (italics and slants via `font-style`) and typographic modifications (like converting lowercase letters to mini-capitals via `font-variant`).

---

## 1. Prerequisites
- [`font-size` & `font-weight`](font_size_weight.md) — The baseline typography configuration tags.
---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support** (Natively supported. Browsers request specific italic font face files dynamically if configured).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Shorthand Compiler

**Problem:** Compile these distinct typography declarations into a single, clean declaration using the `font` shorthand:

```css
.card-header {
  font-style: italic;
  font-variant: small-caps;
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 1.2;
  font-family: sans-serif;
}
```

**Expected output:**
> [!check]- Answer
> ```css
> .card-header {
>   font: italic small-caps bold 1.5rem/1.2 sans-serif;
> }
> ```
> - Follow the sequence: style -> variant -> weight -> size/line-height -> family.

---



### Exercise 2: Small-Caps Heading Styling

**Problem:** Write CSS rule applying small-caps variant to `.section-subtitle`.

**Expected output:**
> [!check]- Answer
> ```text
> .section-subtitle { font-variant: small-caps; }
> ```
> ```css
> .section-subtitle {
>   font-variant: small-caps;
> }
> ```
>
> **Explanation:** `font-variant: small-caps` renders lowercase letters as smaller uppercase glyphs.

---

### Exercise 3: Italic vs Oblique Font Style

**Problem:** What is the typographic difference between `font-style: italic` and `font-style: oblique`?

**Expected output:**
> [!check]- Answer
> ```text
> italic uses specially designed cursive italic glyph shapes; oblique mechanically slants standard normal font glyphs.
> ```
> ```text
> italic uses specially designed cursive italic glyph shapes; oblique mechanically slants standard normal font glyphs.
> ```
>
> **Explanation:** Italic is a distinct font design; Oblique is a slanting angle transformation.

## 7. Related Terms
- [`font-size` & `font-weight`](font_size_weight.md) — The parent typography properties.
- [`text-transform`](../level_07/text_transform.md) — Uppercase/lowercase formatting overrides (different from small-caps).
- [`line-height`](line_height.md) — Related concept: `line-height`.
---

## 8. Key Takeaways
- `font-style` controls text posture: `normal`, `italic`, or slanted `oblique`.
- True italics use unique custom letter curves, whereas oblique simply skews standard letters.
- `font-variant: small-caps` converts lowercase letters to scaled-down capital letters.
- Both properties can be combined inside the unified `font` shorthand.
- Ensure italic font files are imported to prevent browsers from drawing ugly "faux italics".
