# `<sup>` & `<sub>`

> **Level 2 — Text & Content**
> Inline elements used to render characters offset above (superscript) or below (subscript) the text baseline for math, science, and annotations.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Opening and closing tag boundaries.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since these elements flow inline within paragraphs.

---

## 2. Term Category

**Inline Text Semantics (Universal Browser Support .)**: `<sup>` & `<sub>` is a fundamental concept in this technology stack. **Level 2 — Text & Content**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When presenting documents on the web, developers often need to display content that requires special typographic formatting:
-   **Mathematics:** Writing exponent equations like $A^2 + B^2 = C^2$.
-   **Chemistry:** Writing molecular formulas like $H_2O$ or $CO_2$.
-   **Annotations:** Displaying footnote reference numbers like "this claim[1]".
-   **Dates/Ordinals:** Displaying suffix ordinals like "the 5th of July".

If we render these characters on the same flat line as normal text, they are confusing and grammatically incorrect. The W3C designed `<sup>` and `<sub>` as semantic inline wrappers to shift targeted characters vertically.

---

### (2) Superscript (`<sup>`) vs Subscript (`<sub>`)
-   **`<sup>` (Superscript):** Shifts text slightly **above** the normal text line and renders it in a smaller size.
-   **`<sub>` (Subscript):** Shifts text slightly **below** the normal text line and renders it in a smaller size.

Because these are inline elements, they only affect the exact text wrapped inside their tags, allowing the rest of the sentence to flow normally.

---

### (3) Code Examples

#### Short Snippet
Basic math and chemistry markup:

```html
<!-- Superscript Exponent -->
<p>Pythagorean theorem: a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup></p>

<!-- Subscript Chemical Formula -->
<p>Water is made of H<sub>2</sub>O molecules.</p>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scientific Documentation</title>
</head>
<body>

  <h1>Physics & Chemistry Lab Notes</h1>

  <h2>1. Mathematical Equations</h2>
  <p>
    Einstein's famous mass-energy equivalence equation is E = mc<sup>2</sup>, 
    where <em>E</em> is energy, <em>m</em> is mass, and <em>c</em> is the speed of light.
  </p>

  <h2>2. Chemical Reaction</h2>
  <p>
    When glucose (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>) reacts with oxygen 
    (O<sub>2</sub>), it produces carbon dioxide (CO<sub>2</sub>) and water 
    (H<sub>2</sub>O)<sup>[1]</sup>.
  </p>

  <hr>

  <!-- Footnote citation list -->
  <footer>
    <p>
      <sup>[1]</sup> Citation: Lab Manual Section 4.5, page 12.
    </p>
  </footer>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Wrapping the entire word instead of the offset character

**The mistake:** Wrapping the prefix base word along with the superscript/subscript suffix:

```html
<!-- BAD: This renders the entire word "1st" shifted upward! -->
<p>I finished in <sup>1st</sup> place.</p>
```

**Why it's wrong:** The prefix base number "1" should remain on the normal text baseline. Only the suffix "st" needs to be shifted.

**Fix:**
```html
<p>I finished in 1<sup>st</sup> place.</p>
```

---



### Mistake 2: Using `<sup>` or `<sub>` for Visual Font Size Reduction

**The mistake:** Using `<sub>Text</sub>` to make body text look smaller.

**Why it's wrong:** `<sup>` (superscript) and `<sub>` (subscript) alter baseline positioning for mathematical/chemical notations ($X^2$, $H_2O$). Use CSS `font-size` or `<small>` for small text.

*Incorrect:*
```html
<p>Terms and <sub>conditions</sub></p> <!-- ❌ Improper baseline shift! -->
```

*Fix:*
```html
<p>Terms and <small>conditions</small></p>
```

### Mistake 3: Omitting CSS Line-Height Adjustments for Superscripts Causing Line Height Distortion

**The mistake:** Adding `<sup>` tags into tight line-height paragraphs causing text line spacing to jump.

**Why it's wrong:** Browser default `<sup>` and `<sub>` styles shift baseline vertical alignment, causing uneven line-height paragraph spacing. Reset with CSS `line-height: 0`.

*Incorrect:*
```html
<!-- Default sup causing paragraph line-height jumps -->
```

*Fix:*
```html
sup, sub { line-height: 0; position: relative; vertical-align: baseline; }
```



### Mistake 4: Using `<sup>` or `<sub>` for Visual Font Size Reduction

**The mistake:** Using `<sub>Text</sub>` to make body text look smaller.

**Why it's wrong:** `<sup>` (superscript) and `<sub>` (subscript) alter baseline positioning for mathematical/chemical notations ($X^2$, $H_2O$). Use CSS `font-size` or `<small>` for small text.

*Incorrect:*
```html
<p>Terms and <sub>conditions</sub></p> <!-- ❌ Improper baseline shift! -->
```

*Fix:*
```html
<p>Terms and <small>conditions</small></p>
```

### Mistake 5: Omitting CSS Line-Height Adjustments for Superscripts Causing Line Height Distortion

**The mistake:** Adding `<sup>` tags into tight line-height paragraphs causing text line spacing to jump.

**Why it's wrong:** Browser default `<sup>` and `<sub>` styles shift baseline vertical alignment, causing uneven line-height paragraph spacing. Reset with CSS `line-height: 0`.

*Incorrect:*
```html
<!-- Default sup causing paragraph line-height jumps -->
```

*Fix:*
```html
sup, sub { line-height: 0; position: relative; vertical-align: baseline; }
```



### Mistake 6: Using `<sup>` or `<sub>` for Visual Font Size Reduction

**The mistake:** Using `<sub>Text</sub>` to make body text look smaller.

**Why it's wrong:** `<sup>` (superscript) and `<sub>` (subscript) alter baseline positioning for mathematical/chemical notations ($X^2$, $H_2O$). Use CSS `font-size` or `<small>` for small text.

*Incorrect:*
```html
<p>Terms and <sub>conditions</sub></p> <!-- ❌ Improper baseline shift! -->
```

*Fix:*
```html
<p>Terms and <small>conditions</small></p>
```

### Mistake 7: Omitting CSS Line-Height Adjustments for Superscripts Causing Line Height Distortion

**The mistake:** Adding `<sup>` tags into tight line-height paragraphs causing text line spacing to jump.

**Why it's wrong:** Browser default `<sup>` and `<sub>` styles shift baseline vertical alignment, causing uneven line-height paragraph spacing. Reset with CSS `line-height: 0`.

*Incorrect:*
```html
<!-- Default sup causing paragraph line-height jumps -->
```

*Fix:*
```html
sup, sub { line-height: 0; position: relative; vertical-align: baseline; }
```

## 5. Practice Exercises

### Exercise 1: Formulating Chemistry

**Problem:** Write the HTML markup to display the following text exactly as shown:
"Sulfuric acid is represented as H2SO4."

**Expected output:**
> [!check]- Answer
> ```html
> <p>Sulfuric acid is represented as H<sub>2</sub>SO<sub>4</sub>.</p>
> ```
> - Only the numbers "2" and "4" need to be shifted downwards.
> - Wrap those specific numbers in `<sub>` and `</sub>` tags.
> 
---

### Exercise 2: Mathematical and Chemical Notation

**Problem:** Write HTML for:
1. $E = mc^2$
2. $H_2O$

**Expected output:**
> [!check]- Answer
> ```html
> <p>E = mc<sup>2</sup></p>
> <p>H<sub>2</sub>O</p>
> ```
>
> **Explanation:** `<sup>` renders exponent superscript; `<sub>` renders chemical subscript.
> 
---

### Exercise 3: Footnote Anchor Reference

**Problem:** Write HTML footnote link reference `[1]` pointing to `#fn1` using `<sup>`.

**Expected output:**
> [!check]- Answer
> ```html
> <sup><a href="#fn1">[1]</a></sup>
> ```
>
> **Explanation:** `<sup>` wraps footnote numbers above the baseline.
> 
## 6. Related Terms
- [`<strong>` & `<em>`](strong_em.md) — Standard inline formatting tags.
- [`<span>` (Inline container)](span.md) — The non-semantic inline container.

---

## 7. Key Takeaways
- `<sup>` shifts characters above the baseline (superscript).
- `<sub>` shifts characters below the baseline (subscript).
- Both tags render text in a smaller font size by default.
- They are inline phrasing elements that flow with surrounding text.
- Only wrap the specific characters you want shifted, never the whole word.
