# `::before` & `::after` (Pseudo-elements)

> **Level 9 — Visual Effects & State**
> CSS selectors that insert virtual, style-only elements into the page content tree before or after the target element's actual HTML content, without cluttering the HTML markup.

---

## 1. Prerequisites
- [CSS Selectors](../level_01/selectors.md) — Base class selectors.
- [Pseudo-classes (`:hover` & `:focus`)](hover_focus.md) — Understanding single-colon states.

---

## 2. Term Category
- **CSS Selector Hook**

---

## 3. Environment Context
- **Universal Modern Standard** (Compiled natively into the document tree. Creates a virtual inline layout node that inherits parent cascade properties).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When designing user interfaces, you often need to add purely decorative visual elements:
-   An accent color bar underneath a page heading.
-   A small folder icon in front of a list item.
-   A decorative background color overlay on top of a banner.

If you write these decorations directly in your HTML using empty tags (like `<span class="accent-line"></span>`), you clutter your code. 

HTML should only represent the **logical structure** of the page; visual decorations should be managed entirely in **CSS**.

To solve this, the W3C created **Pseudo-elements** (specifically `::before` and `::after`). 

They let you generate styling nodes out of thin air using CSS, keeping your HTML clean, readable, and accessible.

---

### (2) The Mandatory `content` Property
For a pseudo-element to render on the page, it **must** declare a `content` property. If you omit `content`, the pseudo-element is completely ignored by the browser:

```css
/* BAD: Nothing displays! */
.invalid-heading::before {
  background-color: red;
  width: 50px;
  height: 5px;
}

/* GOOD: Declaring the content key renders the box! */
.valid-heading::before {
  content: ""; /* Empty quotes work if you just want a colored box */
  background-color: red;
  width: 50px;
  height: 5px;
}
```

---

### (3) Single Colon (`:`) vs. Double Colon (`::`)
-   **Pseudo-classes (Single Colon, e.g. `:hover`)**: Select *existing* elements when they enter a specific *state*.
-   **Pseudo-elements (Double Colon, e.g. `::before`)**: Generate *new virtual elements* in the document tree.

*Note: Older CSS standards used a single colon for both. Modern browsers still support `:before` for backwards compatibility, but you should always write `::before` in modern code.*

---

### (4) Code Examples

#### Short Snippet
Adding a decorative symbol prefix:

```css
.external-link::after {
  content: " ↗"; /* Inserts an arrow character after the link text */
  font-weight: bold;
  color: gray;
}
```

#### Fuller Example (Accent Line Header)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pseudo-elements Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 40px;
      background-color: #fafafa;
    }

    .section-title {
      position: relative;
      color: #333;
      padding-bottom: 12px;
    }

    /* GENERATE AN ACCENT DECORATION UNDER THE HEADER */
    .section-title::after {
      content: ""; /* Required! */
      position: absolute;
      bottom: 0;
      left: 0;
      
      width: 60px;
      height: 4px;
      background-color: #ff007f;
      border-radius: 2px;
    }

    .btn {
      position: relative;
      padding: 12px 24px;
      border: 2px solid #333;
      background: none;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <h2 class="section-title">Decorated Section Title</h2>
  <p>The pink underline under the title above is not in the HTML markup. It is generated purely by CSS using an ::after pseudo-element!</p>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting dimensions on an inline pseudo-element

**The mistake:** Declaring `::before { content: ""; width: 50px; height: 50px; }` and wondering why the element has zero size.

**Why it's wrong:** Pseudo-elements default to `display: inline` by default. Inline elements ignore width and height settings. 

**Fix: Change the display type to block or inline-block: `::before { content: ""; display: block; width: 50px; height: 50px; }`.**

---



### Mistake 2: Omitting Mandatory `content: ""` Property in `::before` and `::after` Pseudo-Elements

**The mistake:** Creating `::before` pseudo-elements omitting `content: ""`.

**Why it's wrong:** Without the `content` property (even an empty string `content: ""`), browsers do NOT render `::before` or `::after` pseudo-elements on screen.

*Incorrect:*
```css
.card::before { background: red; width: 10px; } /* ❌ Missing content property! Nothing renders! */
```

*Fix:*
```css
.card::before {
  content: ""; /* Mandatory content property */
  background: red;
  width: 10px;
}
```

### Mistake 3: Attempting to Apply `::before` or `::after` to Void Elements (`<img>`, `<input>`)

**The mistake:** Adding `img::before` or `input::after` in CSS.

**Why it's wrong:** Pseudo-elements insert content INSIDE the target element container. Void elements (`<img>`, `<input>`, `<hr>`) cannot contain child content, so pseudo-elements fail.

*Incorrect:*
```css
img::after { content: "Caption"; } /* ❌ Void elements cannot have pseudo-elements! */
```

*Fix:*
```css
/* Wrap img in container div and apply pseudo-element to container: */
.img-wrapper::after { content: "Caption"; }
```

## 6. Practice Exercises

### Exercise 1: Bullet Customization

**Problem:** You want to add a green bullet character (`•`) in front of every paragraph having the class `.intro`. Write the CSS rule.

**Expected output:**
```css
.intro::before {
  content: "• ";
  color: green;
  font-weight: bold;
}
```

> [!check]- Answer
> - Target the content inserted *before* paragraph text.
> - Declare the character inside the mandatory property.

---



### Exercise 2: Custom Tooltip Pseudo-Element Pattern

**Problem:** Write CSS `::after` pseudo-element for `[data-tooltip]` displaying `attr(data-tooltip)` on hover.

**Expected output:**
```text
[data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; }
```

> [!check]- Answer
> ```css
> [data-tooltip]:hover::after {
>   content: attr(data-tooltip);
>   position: absolute;
>   background: #000;
>   color: #fff;
>   padding: 4px 8px;
> }
> ```
>
> **Explanation:** `content: attr(data-attribute)` dynamically displays HTML data attribute values.

### Exercise 3: Single vs Double Colon Pseudo-Element Syntax

**Problem:** Why does modern CSS specification use double colons (`::before`) for pseudo-elements and single colons (`:hover`) for pseudo-classes?

**Expected output:**
```text
To distinguish pseudo-elements (generated sub-nodes) from pseudo-classes (element states).
```

> [!check]- Answer
> ```text
> To distinguish pseudo-elements (generated sub-nodes) from pseudo-classes (element states).
> ```
>
> **Explanation:** Double colons (`::`) specify generated DOM sub-elements.

## 7. Related Terms
- [Pseudo-classes (`:hover` & `:focus`)](hover_focus.md) — Interactive state selectors.
- [`display`](../level_04/display.md) — Overriding default inline display constraints.

---

## 8. Key Takeaways
- Pseudo-elements generate virtual layout nodes inside parent elements.
- Always declare the mandatory `content` property for pseudo-elements to render.
- Use `::before` to insert decorations first, and `::after` to insert last.
- Pseudo-elements default to `display: inline` (override this to set width/height).
- Use pseudo-elements to keep decorative markup out of semantic HTML.
