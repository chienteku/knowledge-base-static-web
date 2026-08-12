# `text-align` & `text-decoration`

> **Level 3 — Typography & Colors**
> Properties used to align text horizontally within its container and apply visual lines (like underlines) to text.

---

## 1. Prerequisites
- [Width / Height](../level_02/width_height.md) — Text alignment only works if the container is actually wider than the text itself.
- [`<a>` (Anchor / Link)](../../../01-html/terms/level_02/a.md) — The HTML element that most commonly uses `text-decoration`.

---

## 2. Term Category

**Typography Property (Universal Browser Support)**: `text-align` & `text-decoration` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Text formatting goes beyond just picking a font and a size. You need to control how text sits inside its container. Should the title be perfectly centered? Should the paragraph be aligned to the right edge of the screen? The W3C created **`text-align`** for this exact purpose (it works exactly like the Left/Center/Right align buttons in Microsoft Word).
Additionally, we need a way to draw attention to specific words or indicate that they are clickable links. The W3C created **`text-decoration`** to allow developers to draw lines under, over, or straight through text.

### (2) Reality Metaphor
**`text-align`** is like formatting a term paper. You center the title at the top of the page, and you left-align all the paragraphs.
**`text-decoration`** is like taking a red pen and underlining an important sentence, or crossing out a mistake (strikethrough).

### (3) Code Examples

#### Text Alignment
```css
h1 {
  /* Pushes the text to the exact horizontal center of the container */
  text-align: center;
}

.arabic-text {
  /* Useful for languages that read right-to-left */
  text-align: right;
}
```

#### Text Decoration
```css
a {
  /* Removes the ugly default underline from all links! */
  text-decoration: none;
}

.discounted-price {
  /* Draws a line straight through the text (strikethrough) */
  text-decoration: line-through;
  color: gray;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `text-align: center` to center a `<div>`

**The mistake:** Creating a 300px wide `<div>` container, and applying `text-align: center;` to its parent container, expecting the `<div>` itself to move to the center of the screen.

**Why it's wrong:** `text-align` ONLY aligns the **inline text** (and inline elements like images) *inside* a container. It does NOT center the physical box itself! If you want to center an actual block element (like a `<div>` or a `<section>`), you must use the Box Model trick: `margin: 0 auto;`. 
- `margin: 0 auto;` centers the **box**.
- `text-align: center;` centers the **text inside the box**.

---



### Mistake 2: Attempting to Centering Block Elements (`<div>`, `<table>`) Using `text-align: center`

**The mistake:** Adding `text-align: center` to a parent `<div>` expecting child `<div>` boxes to center.

**Why it's wrong:** `text-align: center` centers INLINE content (text, images, spans) inside a block container. It does NOT center block elements (`<div>`). Use `margin: 0 auto` or Flexbox.

*Incorrect:*
```css
.parent { text-align: center; } /* ❌ Child <div> boxes remain left-aligned! */
```

*Fix:*
```css
.child-box { margin-left: auto; margin-right: auto; width: 300px; }
```

### Mistake 3: Using `text-align: justify` Without Adjusting Word Spacing (Unusable Gaps Trap)

**The mistake:** Applying `text-align: justify` to narrow text column containers.

**Why it's wrong:** Justified text in narrow columns creates irregular, wide white spaces between words ('rivers of white space'), degrading text readability. Avoid full justification on the web.

*Incorrect:*
```css
.col { text-align: justify; } /* ❌ Creates awkward wide white spaces */
```

*Fix:*
```css
.col { text-align: left; }
```

## 5. Practice Exercises

### Exercise 1: Aligning Text Blocks and Logical Alignment

**Scenario:** An author aligns card headers and body paragraphs using `text-align` and logical `text-align: start`.

**Requirements:**
1. Apply `text-align: center` to card header.
2. Apply `text-align: start` for RTL/LTR internationalization.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-header {
>   text-align: center;           /* Centers heading and subtitle text */
> }
>
> .card-body {
>   text-align: start;            /* Logical left in LTR, right in RTL */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `text-align` Property**: Controls the horizontal alignment of inline content inside a block container.
> 2. **Logical `text-align: start`**: `start` aligns text to the left in LTR languages (English) and to the right in RTL languages (Arabic/Hebrew).
> 3. **Justify Caution**: Avoid `text-align: justify` on web text, as it creates uneven whitespace rivers that impair readability for dyslexic users.
> 
---

### Exercise 2: Modern Underline Styling using text-decoration Properties

**Scenario:** Styles accessible hyperlink underlines using modern `text-decoration-color`, `thickness`, and `offset`.

**Requirements:**
1. Apply `text-decoration-line: underline`.
2. Set `text-decoration-color`, `text-decoration-thickness: 2px`, and `text-underline-offset: 4px`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .custom-link {
>   color: #2563eb;
>   text-decoration-line: underline;
>   text-decoration-color: #93c5fd;
>   text-decoration-thickness: 2px;
>   text-underline-offset: 4px;   /* Pushes underline below font descenders */
>   transition: text-decoration-color 0.2s ease;
> }
>
> .custom-link:hover {
>   text-decoration-color: #2563eb;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`text-underline-offset`**: Pushes the underline link stroke away from the text baseline, preventing it from clipping font descenders (like 'g' and 'p').
> 2. **`text-decoration-thickness`**: Controls underline stroke weight without using pseudo-element border hacks.
> 3. **Color Disambiguation**: Using a lighter underline color (`#93c5fd`) retains link visibility while keeping text clean.
> 
---

### Exercise 3: Removing Default Hyperlink Underlines Safely

**Scenario:** Removes default link underlines ONLY when alternative visual indicators and focus rings exist.

**Requirements:**
1. Remove underline on specific nav link, preserving hover and `:focus-visible`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .nav-link {
>   color: #334155;
>   text-decoration: none;        /* Removes default underline inside navigation bar */
>   padding: 0.5rem 1rem;
> }
>
> .nav-link:hover, .nav-link:focus-visible {
>   color: #2563eb;
>   text-decoration: underline;    /* Restores underline on hover/focus */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Accessibility Warning**: Do NOT remove link underlines in body text unless links are distinguished by 3:1 color contrast AND hover/focus indicators!
> 2. **Nav Exemption**: Removing underlines inside obvious header navigation bars is acceptable because layout context implies interactivity.
> 3. **Keyboard Focus Indicator**: Always restore underlines or focus rings on `:focus-visible`.
## 6. Related Terms
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — The display type that `text-align` affects.
- [Margin](../level_02/margin.md) — The spacing property used to center boxes rather than inline text.

---

## 7. Key Takeaways
- `text-align` accepts `left`, `right`, `center`, and `justify`.
- `text-align` ONLY centers text/inline content inside a box; it does NOT center the box itself.
- `text-decoration` accepts `none`, `underline`, `overline`, and `line-through`.
- Setting `text-decoration: none` is the standard way to remove the default underlines from `<a>` links.
