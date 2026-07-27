# `text-align` & `text-decoration`

> **Level 3 — Typography & Colors**
> Properties used to align text horizontally within its container and apply visual lines (like underlines) to text.

---

## 1. Prerequisites
- [Width / Height](../level_02/width_height.md) — Text alignment only works if the container is actually wider than the text itself.
- [`<a>` (Anchor)](../../../01-html/terms/level_02/a.md) — The HTML element that most commonly uses `text-decoration`.

---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Invisible Center

**Problem:** You write a paragraph: `<p style="text-align: center;">Hello</p>`. You test it, but the word "Hello" is sitting perfectly on the left side of the screen. Why didn't it center?

**Expected output:**
```text
The `<p>` container is probably only exactly as wide as the word "Hello" (maybe due to Flexbox or inline display). If the box is exactly the size of the word, there is no empty space for the word to slide into! `text-align: center` only works if the container is wider than the text.
```

> [!check]- Answer
> - If you stand inside a closet that is exactly as wide as your shoulders, can you step to the "center" of the room?

---



### Exercise 2: Modern Text Decoration Shorthand

**Problem:** Write CSS `text-decoration` shorthand applying wavy red underline with 2px thickness to `.error-link`.

**Expected output:**
```text
.error-link { text-decoration: underline wavy red 2px; }
```

> [!check]- Answer
> ```css
> .error-link {
>   text-decoration: underline wavy red 2px;
> }
> ```
>
> **Explanation:** Modern `text-decoration` combines line type, style, color, and thickness.

### Exercise 3: Removing Default Anchor Underlines

**Problem:** Write CSS rule removing default underline decoration from `<a>` anchor tags.

**Expected output:**
```text
a { text-decoration: none; }
```

> [!check]- Answer
> ```css
> a {
>   text-decoration: none;
> }
> ```
>
> **Explanation:** `text-decoration: none` removes default hyperlink underlines.

## 7. Related Terms
- [`display: inline`](../../level_04/display.md) — The display type that `text-align` affects.
- [Margin](../../level_02/margin.md) — The spacing property used to center boxes rather than inline text.

---

## 8. Key Takeaways
- `text-align` accepts `left`, `right`, `center`, and `justify`.
- `text-align` ONLY centers text/inline content inside a box; it does NOT center the box itself.
- `text-decoration` accepts `none`, `underline`, `overline`, and `line-through`.
- Setting `text-decoration: none` is the standard way to remove the default underlines from `<a>` links.
