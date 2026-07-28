# `<style>` Element

> **Level 8 — Metadata, SEO & Head**
> An element primarily placed in the `<head>` used to define internal CSS (Cascading Style Sheets) rules that style the visual appearance of elements on the webpage.

---

## 1. Prerequisites
- [`<head>`](../level_01/head.md) — The parent container where `<style>` blocks are hosted.
- [`style` Attribute](../level_07/style.md) — The inline visual formatting attribute that contrasts with the style tag.

---

## 2. Term Category
- **Metadata Tag**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively. The browser pauses HTML construction to compile CSS selectors declared inside this tag).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Stylesheet Conversion

**Problem:** Convert these inline styles into a single `<style>` block targeting the paragraph class "card-desc".

```html
<p class="card-desc" style="color: gray; margin: 10px;">Card description.</p>
```

**Expected output:**
> [!check]- Answer
> ```html
> <style>
>   .card-desc {
>     color: gray;
>     margin: 10px;
>   }
> </style>
> <p class="card-desc">Card description.</p>
> ```
> - Write class selectors in CSS starting with a dot (`.card-desc`).
> - Wrap the rules in curly braces (`{ ... }`).
> - Remove the `style="..."` attribute from the `<p>` tag.

---



### Exercise 2: Media Query Internal Style Tag

**Problem:** Write `<style>` tag with `media="print"` hiding element `.no-print`.

**Expected output:**
> [!check]- Answer
> ```text
> <style media="print">.no-print { display: none; }</style>
> ```
> ```html
> <style media="print">
>   .no-print { display: none; }
> </style>
> ```
>
> **Explanation:** `media` attribute restricts internal CSS rules to specific output media (e.g. print).

---

### Exercise 3: CSS Type Attribute Redundancy

**Problem:** Is `type="text/css"` required on HTML5 `<style>` tags? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```text
> No. HTML5 defaults <style> elements to CSS automatically.
> ```
> ```text
> No. HTML5 defaults <style> elements to CSS automatically.
> ```
>
> **Explanation:** `type="text/css"` is redundant in modern HTML5.

## 7. Related Terms
- [`style` Attribute](../level_07/style.md) — The inline styling attribute.
- [`<link>`](../level_08/link.md) — The element used to connect external CSS.
- [`class` Attribute](../level_07/class.md) — The category naming selector.

---

## 8. Key Takeaways
- The `<style>` element houses internal CSS code inside the HTML file.
- It is placed in the `<head>` section of the document.
- Use `<style>` for quick styling sandboxes or standalone pages.
- Standard production sites should use `<link>` to import external `.css` files for caching and maintenance.
- Do not write HTML markup inside the `<style>` tag.
