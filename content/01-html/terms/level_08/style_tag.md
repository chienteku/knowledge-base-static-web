# `<style>` Element

> **Level 8 — Metadata, SEO & Head**
> An element primarily placed in the `<head>` used to define internal CSS (Cascading Style Sheets) rules that style the visual appearance of elements on the webpage.

---

## 1. Prerequisites
- [`<head>`](../level_01/head.md) — The parent container where `<style>` blocks are hosted.
- [`style` Attribute](../level_07/style.md) — The inline visual formatting attribute that contrasts with the style tag.

---

## 2. Term Category

**Metadata Tag (Universal Browser Support .)**: `<style>` Element is a fundamental concept in this technology stack. **Level 8 — Metadata, SEO & Head**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
We want our webpages to look appealing (with colors, custom layouts, fonts, and borders) instead of plain black text on a white background. 

A developer could use the inline `style` attribute on every single tag:
```html
<p style="color: blue; font-family: sans-serif;">Paragraph 1</p>
<p style="color: blue; font-family: sans-serif;">Paragraph 2</p>
```
But if you have 100 paragraphs, copying and pasting those styles on every single element is unmaintainable. If you later decide to change the font or color, you have to edit 100 lines.

To solve this, the W3C created the **`<style>` tag**. It allows you to extract visual design rules into a single, unified block. Using CSS selectors, you can target multiple HTML elements simultaneously:

```html
<style>
  p {
    color: blue;
    font-family: sans-serif;
  }
</style>
```

---

### (2) Internal CSS vs. External CSS
There are two primary ways to declare site CSS:

| Strategy | Implementation | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Internal CSS** (using `<style>` element) | CSS code is written directly inside the HTML file's `<head>`. | Quick to set up. Excellent for single-page tests, sandboxes, or sending HTML emails. | Cannot be cached by the browser. Bloats the HTML file size. Must be copied manually to style other pages. |
| **External CSS** (using `<link>` element) | CSS code lives in a separate `.css` file and is linked. | Standard for production. The browser caches the file, loading subsequent pages instantly. Easy to maintain. | Requires managing separate files. |

---

### (3) Code Examples

#### Short Snippet
A simple internal CSS block:

```html
<head>
  <style>
    /* CSS rules go here */
    body {
      background-color: #f0f2f5;
    }
    .highlight {
      font-weight: bold;
    }
  </style>
</head>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal Stylesheet Demo</title>

  <!-- Declaring CSS design rules within a style block -->
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }

    h1 {
      border-bottom: 2px solid green;
      padding-bottom: 10px;
    }

    .alert-text {
      color: red;
      font-style: italic;
    }
  </style>
</head>
<body>

  <h1>Cooking Guides</h1>
  <p>Welcome to our recipe catalog.</p>
  <p class="alert-text">Warning: Always wash your hands before cooking.</p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing HTML tags inside the `<style>` tag

**The mistake:** Nesting HTML elements inside the CSS rules:

```html
<style>
  .warning-box {
    /* WRONG: You cannot put HTML tags inside CSS! */
    <p>color: red;</p>
    background-color: yellow;
  }
</style>
```

**Why it's wrong:** The browser expects anything inside a `<style>` block to be strictly valid CSS code. The browser does not compile HTML inside this container, and encountering tags will cause the browser to fail to parse the styles, leaving the page unstyled.

---



### Mistake 2: Placing `<style>` Elements Inside the `<body>` Section

**The mistake:** Placing `<style>body { background: blue; }</style>` inside `<body>`.

**Why it's wrong:** Placing internal `<style>` tags inside `<body>` causes Flash of Unstyled Content (FOUC) and breaks HTML5 structure specifications. Place all `<style>` tags in `<head>`.

*Incorrect:*
```html
<body>
  <style>h1 { color: red; }</style> <!-- ❌ Causes FOUC layout shift! -->
</body>
```

*Fix:*
```html
<head>
  <style>h1 { color: red; }</style>
</head>
```

### Mistake 3: Using Internal `<style>` Tags for Multi-Page Website Styles

**The mistake:** Duplicating 500 lines of `<style>` CSS inside `<head>` across 20 HTML files.

**Why it's wrong:** Duplicating CSS across files prevents browser stylesheet caching, increases HTML download sizes, and makes site-wide maintenance impossible. Use external `.css` files via `<link>`.

*Incorrect:*
```html
<!-- 500 lines of identical internal CSS copied into 20 HTML files -->
```

*Fix:*
```html
<link rel="stylesheet" href="styles.css"> <!-- Cached external stylesheet -->
```

## 5. Practice Exercises

### Exercise 1: Critical Above-the-Fold CSS Inlining using style in head

**Scenario:** An author inlines critical above-the-fold CSS styles using `<style>` in `<head>` to speed up First Contentful Paint.

**Requirements:**
1. Place `<style>` inside `<head>`.
2. Write valid CSS rules inside.
3. Target core layout elements.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Fast FCP Web Portal</title>
>
>   <!-- Critical Above-The-Fold CSS -->
>   <style>
>     body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }
>     .hero { background: #0f172a; color: #ffffff; padding: 4rem 2rem; text-align: center; }
>   </style>
>
>   <!-- Non-critical stylesheet deferred -->
>   <link rel="stylesheet" href="css/non-critical.css" media="print" onload="this.media='all'">
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **The `<style>` Element**: Embeds CSS styling rules directly within an HTML document; MUST be placed in `<head>`.
> 2. **Critical CSS Inlining**: Inlining small critical CSS (under 10KB) eliminates RTT network round-trips for initial page rendering.
> 3. **FCP Performance Optimization**: Dramatically improves First Contentful Paint (FCP) scores on mobile connections.
> 
---

### Exercise 2: Scoped Component Styles for Web Components

**Scenario:** Uses `<style>` inside Shadow DOM web components for component-scoped CSS isolation.

**Requirements:**
1. Place `<style>` inside web component template.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <template id="custom-card-template">
>   <style>
>     :host { display: block; border: 1px solid #ccc; padding: 16px; }
>     h2 { color: #2563eb; margin-top: 0; }
>   </style>
>   <h2>Component Title</h2>
>   <slot></slot>
> </template>
> ```
>
> #### Technical Explanation
>
> 1. **Shadow DOM Styling Isolation**: Styles defined inside Shadow DOM templates do NOT leak out to main document elements.
> 2. **Component Encapsulation**: Prevents class name collisions in large component libraries.
> 3. **Native Web Components**: Standard pattern for native HTML5 Web Components.
> 
---

### Exercise 3: Media-Query Conditioned Embedded Stylesheet Rules

**Scenario:** Includes media queries within `<style>` tag for responsive embedded themes.

**Requirements:**
1. Write `@media` print rules inside `<style>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <style>
>   @media print {
>     body { background: white; color: black; }
>     .no-print { display: none !important; }
>   }
> </style>
> ```
>
> #### Technical Explanation
>
> 1. **Print Media Rules**: Customizes document output when printed to paper or PDF.
> 2. **Hiding Unnecessary UI**: Hides navigation menus and advertisements (`display: none`) in print mode.
> 3. **Valid HTML5 Placement**: `<style>` tags should reside in `<head>`.
## 6. Related Terms
- [`style` Attribute](../level_07/style.md) — The inline styling attribute.
- [`<link>`](link.md) — The element used to connect external CSS.
- [`class` Attribute](../level_07/class.md) — The category naming selector.

---

## 7. Key Takeaways
- The `<style>` element houses internal CSS code inside the HTML file.
- It is placed in the `<head>` section of the document.
- Use `<style>` for quick styling sandboxes or standalone pages.
- Standard production sites should use `<link>` to import external `.css` files for caching and maintenance.
- Do not write HTML markup inside the `<style>` tag.
