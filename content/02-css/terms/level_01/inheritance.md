# Inheritance

> **Level 1 — Core Concepts**
> The mechanism by which certain CSS property values (mostly text and typography settings) are automatically passed down from a parent element to all of its nested child elements in the DOM tree.

---

## 1. Prerequisites
- [The Cascade](the_cascade.md) — The priority engine that resolves style values.
- [Selectors (Element, Class, ID)](selectors.md) — The patterns used to target nodes.

---

## 2. Term Category

**Core Concept (Universal Browser Support .)**: Inheritance is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a website and want to use the Arial font for all your text content. 

If you had to write a selector targeting every single text-bearing tag on the page:
`body, div, p, span, h1, h2, h3, h4, h5, h6, li, a, label { font-family: Arial; }`
your CSS files would become bloated and extremely difficult to update.

To make styling efficient, the W3C built **Inheritance** into CSS. 

Inheritance matches the nested parent-child nature of HTML. When you declare a text style on a parent container (like `<body>`), the browser automatically passes that style down to all the child elements nested inside it. You only have to write the rule once.

---

### (2) Inherited vs. Non-Inherited Properties
Not all CSS properties inherit. It would be a visual disaster if they did:
-   **If `border` inherited:** Setting a border on a `<div>` would force every paragraph, span, list item, and link inside that div to draw its own individual border, creating visual clutter.

Because of this, CSS properties are divided into two categories:

#### 1. Inherited Properties (Mostly Typography)
These properties naturally pass down to children because they affect text styling.
-   `font-family`, `font-size`, `font-weight`, `line-height`
-   `color`
-   `text-align`
-   `visibility`

#### 2. Non-Inherited Properties (Mostly Box Model & Layout)
These properties do not pass down because they define layout boundaries.
-   `border`
-   `margin`
-   `padding`
-   `width`, `height`
-   `background-color` *(Note: Sighted users often assume background-color is inherited because child backgrounds look the same. In reality, child backgrounds are `transparent` by default, letting the parent's color show through).*

---

### (3) Forcing Inheritance: The `inherit` Keyword
You can manually force any non-inherited property to copy its parent's style by using the **`inherit`** keyword:

```css
.child-box {
  /* Force this box to inherit its parent's border style! */
  border: inherit; 
}
```

#### Other Global Reset Keywords
-   **`initial`**: Sets the property back to the browser's factory default (e.g. `color: black`).
-   **`unset`**: If the property is naturally inherited, it acts as `inherit`. If it is not, it acts as `initial`.

---

### (4) Code Examples

#### Short Snippet
Text styling inheritance:

```css
/* Styling the parent body */
body {
  font-family: Arial, sans-serif;
  color: darkgray;
}

/* All paragraphs nested inside body automatically use Arial and color darkgray! */
p {
  font-size: 16px;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inheritance Demo</title>
  <style>
    /* Parent container */
    .parent-card {
      font-family: Georgia, serif;
      color: darkblue; /* INHERITED by text nodes */
      
      border: 2px solid black; /* NOT inherited */
      padding: 20px; /* NOT inherited */
    }

    /* Child element with default styles */
    .child-text {
      font-size: 18px;
    }

    /* Child element forcing border inheritance */
    .child-special {
      border: inherit; /* Copies the parent's "2px solid black" border */
    }
  </style>
</head>
<body>

  <div class="parent-card">
    <p class="child-text">
      This text automatically inherits Georgia and darkblue color 
      from .parent-card, but does NOT inherit the border or padding.
    </p>
    
    <p class="child-special">
      This text also inherits fonts/colors, and manually forces 
      border inheritance.
    </p>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing transparency with background-color inheritance

**The mistake:** Assuming a child container inherits its parent's background color because they match visually, and trying to write overrides assuming a solid color background is active.

**Why it's wrong:** The default value of `background-color` is `transparent`. The child doesn't copy the parent's color value; it is simply glass-like, letting the parent's color show through from behind. 

If you apply visual layouts (like box-shadows or positioning offsets) assuming a solid background color, the transparency can cause visual overlapping conflicts.

---



### Mistake 2: Assuming All CSS Properties Are Naturally Inherited by Child Elements

**The mistake:** Expecting CSS `margin`, `padding`, or `border` set on `<body>` to inherit to child `<div>` tags.

**Why it's wrong:** Only text-related properties (`color`, `font-family`, `line-height`) inherit by default. Box-model properties (`margin`, `border`, `background`) do NOT inherit.

*Incorrect:*
```css
body { border: 1px solid black; } /* Expecting child divs to inherit border */
```

*Fix:*
```css
/* Explicitly apply border to target elements or use inherit keyword: */
div { border: inherit; }
```

### Mistake 3: Forgetting Form Controls (`<button>`, `<input>`) Do Not Inherit `font-family` from `body`

**The mistake:** Setting `body { font-family: Roboto; }` expecting `<button>` and `<input>` to use Roboto.

**Why it's wrong:** Form controls (`<button>`, `<input>`, `<select>`) use browser user-agent default system fonts and ignore inherited `font-family` from parent containers. Use `font-family: inherit`.

*Incorrect:*
```css
body { font-family: 'Inter', sans-serif; } /* ❌ Buttons still use system font! */
```

*Fix:*
```css
button, input, select, textarea {
  font-family: inherit; /* Force form controls to inherit parent font */
}
```

## 5. Practice Exercises

### Exercise 1: Leveraging Natural Property Inheritance for Typography

**Scenario:** An author defines typography properties on the `<body>` element, allowing child elements to inherit styles naturally.

**Requirements:**
1. Set `font-family`, `color`, and `line-height` on `body`.
2. Verify child headings and paragraphs inherit styles.
3. Override non-inherited box properties on child.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Typography properties inherit naturally to all child elements */
> body {
>   font-family: system-ui, -apple-system, sans-serif;
>   color: #334155;
>   line-height: 1.6;
> }
>
> .card {
>   /* Non-inherited box properties defined explicitly on container */
>   background-color: #ffffff;
>   padding: 1.5rem;
>   border-radius: 0.5rem;
> }
>
> /* Heading inherits font-family and line-height from body automatically */
> .card-title {
>   color: #0f172a;               /* Specific override for title color */
> }
> ```
>
> #### Technical Explanation
>
> 1. **CSS Property Inheritance**: Mechanism where certain CSS properties (like `color`, `font-family`, `line-height`) pass automatically from parent to child elements.
> 2. **Inherited vs Non-Inherited Properties**: Text and font properties inherit naturally; layout and box-model properties (`margin`, `padding`, `border`, `background`) DO NOT inherit.
> 3. **Dry Code Efficiency**: Defining typography on `body` avoids repeating font definitions on every child element.
> 
---

### Exercise 2: Forcing Non-Inherited Properties using inherit Keyword

**Scenario:** Forces a form button input to inherit font styles from its parent container using `font: inherit`.

**Requirements:**
1. Apply `font: inherit` and `color: inherit` to `<button>` and `<input>` elements.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Native buttons and inputs do NOT inherit typography by default; force inheritance */
> button, input, select, textarea {
>   font: inherit;
>   color: inherit;
>   letter-spacing: inherit;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `inherit` Keyword**: Explicitly forces an element to inherit a property value from its parent, even for non-inherited properties.
> 2. **Form Control Reset**: HTML `<button>` and `<input>` controls override font inheritance in user-agent stylesheets; `font: inherit` restores global styling.
> 3. **Theme Consistency**: Ensures form controls match the global typography design system seamlessly.
> 
---

### Exercise 3: Resetting Container Inheritance with unset and initial Keywords

**Scenario:** Resets inherited properties on a isolated component container using `unset`.

**Requirements:**
1. Apply `color: unset` and `all: unset` to reset inheritance.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .isolated-widget {
>   /* Resets all inherited and non-inherited properties back to default */
>   all: unset;
>   display: block;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `unset` Keyword**: Resets a property to its inherited value if it inherits naturally, or to its initial value if it does not.
> 2. **The `initial` Keyword**: Resets a property to the official W3C default value defined in CSS specs.
> 3. **The `all` Property Shorthand**: `all: unset` provides a clean slate for building un-styled Web Component widgets.
## 6. Related Terms
- [The Cascade](the_cascade.md) — The parent priority engine.
- [Specificity](specificity.md) — Selector point weights.
- [`!important` Declaration](important.md) — Priority overrides.
- [Selectors (Element, Class, ID)](selectors.md) — Related concept: Selectors (Element, Class, ID).

---

## 7. Key Takeaways
- Inheritance automatically passes property values from parent elements down to nested child elements.
- Typography properties (fonts, colors, sizes, alignments) are naturally inherited.
- Box model and layout properties (borders, margins, paddings, dimensions) are not inherited.
- Use `property: inherit;` to manually force a child element to copy its parent's styling.
- Use `property: initial;` to reset a styling property back to the browser's default settings.
