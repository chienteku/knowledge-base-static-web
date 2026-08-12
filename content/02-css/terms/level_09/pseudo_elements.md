# `::before` & `::after` (Pseudo-elements)

> **Level 9 — Visual Effects & State**
> CSS selectors that insert virtual, style-only elements into the page content tree before or after the target element's actual HTML content, without cluttering the HTML markup.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — Base class selectors.
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Understanding single-colon states.

---

## 2. Term Category

**CSS Selector Hook (Universal Modern Standard .)**: `::before` & `::after` (Pseudo-elements) is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom Decorative Icon Accents using ::before and ::after

**Scenario:** An author adds a decorative bullet icon before list items using `::before` and `content: ""`.

**Requirements:**
1. Target `.custom-list li::before`.
2. Set `content: ""`.
3. Set `display: inline-block` and dimensions.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .custom-list {
>   list-style: none;
>   padding: 0;
> }
>
> .custom-list li {
>   position: relative;
>   padding-left: 1.5rem;
>   margin-bottom: 0.5rem;
> }
>
> /* Decorative Custom Bullet Accent */
> .custom-list li::before {
>   content: "";                  /* MANDATORY: Creates pseudo-element box */
>   position: absolute;
>   left: 0;
>   top: 0.5rem;
>   width: 0.5rem;
>   height: 0.5rem;
>   border-radius: 50%;
>   background-color: #2563eb;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `::before` & `::after` Pseudo-Elements**: Insert decorative inline box elements into the DOM before or after an element's actual content.
> 2. **Mandatory `content` Property**: Pseudo-elements WILL NOT RENDER unless `content: ""` is explicitly declared (even if empty string).
> 3. **Decorative HTML Cleanup**: Keeps decorative visual accents (bullets, badges, lines) strictly in CSS, keeping HTML clean and semantic.
> 
---

### Exercise 2: Custom Text Selection Highlights with ::selection

**Scenario:** Customizes visual text highlight colors when users select text on page using `::selection`.

**Requirements:**
1. Apply `::selection` background and text color.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Global Text Selection Style */
> ::selection {
>   background-color: #2563eb;    /* Primary brand blue background fill */
>   color: #ffffff;               /* Crisp white text color */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `::selection` Pseudo-Element**: Applies styles to the portion of an element that is highlighted/selected by the user's cursor.
> 2. **Brand Polish**: Replaces default blue browser selection colors with custom brand colors.
> 3. **Property Restrictions**: Only supports `color`, `background-color`, and `text-shadow` for security and performance.
> 
---

### Exercise 3: Styling Input Placeholders with ::placeholder

**Scenario:** Styles muted input placeholder text using `::placeholder`.

**Requirements:**
1. Apply `color: #94a3b8` and `font-style: italic` to `::placeholder`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .form-input::placeholder {
>   color: #94a3b8;               /* Muted slate text color */
>   font-style: italic;
>   opacity: 1;                   /* Fixes Firefox default placeholder opacity reduction */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `::placeholder` Pseudo-Element**: Targets placeholder text rendered inside `<input>` or `<textarea>` elements.
> 2. **Firefox Opacity Fix**: Firefox defaults `::placeholder` to `opacity: 0.54`; always add `opacity: 1` when setting custom placeholder colors.
> 3. **WCAG Contrast Requirement**: Ensure placeholder text color maintains sufficient contrast while remaining visually distinct from typed input text.
## 6. Related Terms
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Interactive state selectors.
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — Overriding default inline display constraints.
- [Advanced Pseudo-classes](pseudo_classes_advanced.md) — Related concept: Advanced Pseudo-classes.

---

## 7. Key Takeaways
- Pseudo-elements generate virtual layout nodes inside parent elements.
- Always declare the mandatory `content` property for pseudo-elements to render.
- Use `::before` to insert decorations first, and `::after` to insert last.
- Pseudo-elements default to `display: inline` (override this to set width/height).
- Use pseudo-elements to keep decorative markup out of semantic HTML.
