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

## 5. Practice Exercises

### Exercise 1: Formatting Chemical Formulas and Mathematical Exponents

**Scenario:** A science author formats chemical formulas using `<sub>` and mathematical exponents using `<sup>`.

**Requirements:**
1. Use `<sub>` for chemical subscript numbers (`H<sub>2</sub>O`).
2. Use `<sup>` for mathematical exponents (`x<sup>2</sup>`).
3. Verify text baseline alignment.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="science-note">
>   <p>Water is represented by the chemical formula H<sub>2</sub>O.</p>
>   <p>The Pythagorean theorem is expressed as a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>.</p>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Subscript Tag (`<sub>`)**: Renders text lower and smaller than the main baseline; used for chemical formulas and math subscripts.
> 2. **Superscript Tag (`<sup>`)**: Renders text higher and smaller than the main baseline; used for exponents, footnotes, and ordinal numbers.
> 3. **CSS Line-Height Fixes**: Browsers adjust font size for `<sup>`/`<sub>`, but CSS `line-height: 0` is often used to prevent distending paragraph line spacing.
> 
---

### Exercise 2: Footnote Citation Numbers Linked to References

**Scenario:** An academic author formats superscript footnote numbers linking to bibliography references.

**Requirements:**
1. Wrap footnote number in `<sup>` containing an `<a>` link.
2. Target matching footnote reference ID.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   Web accessibility is mandated by international law<sup><a href="#fn1" id="ref1">[1]</a></sup>.
> </p>
>
> <!-- Footnotes Footer -->
> <footer class="footnotes">
>   <hr>
>   <ol>
>     <li id="fn1">WCAG 2.1 International Standards Guideline. <a href="#ref1">Back to text</a></li>
>   </ol>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **Academic Footnotes**: `<sup>` is standard HTML markup for footnote numbers in academic prose.
> 2. **Accessible Link Wrapping**: Wrapping `<a>` inside `<sup>` makes footnote citations keyboard accessible.
> 3. **Bi-directional Navigation**: Links allow users to jump to footnote details and back to reading position.
> 
---

### Exercise 3: Formatting Ordinal Numbers in Legal Dates

**Scenario:** Formats ordinal date suffixes using `<sup>` tags in legal documents.

**Requirements:**
1. Use `<sup>` for ordinal suffixes (`1<sup>st</sup>`, `2<sup>nd</sup>`).

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p class="legal-date">
>   Executed on this 15<sup>th</sup> day of August, 2026.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **Ordinal Date Formatting**: `<sup>` formats ordinal suffixes (`st`, `nd`, `rd`, `th`) in dates and rankings.
> 2. **Screen Reader Behavior**: Screen readers pronounce ordinal superscript suffixes naturally.
> 3. **Typographic Elegance**: Improves visual alignment of legal document dates.
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
