# `<base>` Element

> **Level 8 — Metadata, SEO & Head**
> A metadata element placed in the `<head>` that sets a default base URL and/or target window for all relative links and resource paths on a webpage.

---

## 1. Prerequisites
- [`<head>`](../level_01/head.md) — The parent container where `<base>` is hosted.
- [URL (Uniform Resource Locator)](../level_01/url.md) — Defining absolute vs. relative paths.
---

## 2. Term Category
- **Metadata Tag**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively. Intercepts all relative asset loading calls to resolve path structures).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a website, developers prefer using **relative paths** for links (`<a href="contact.html">`) and media images (`<img src="logo.png">`) instead of writing full absolute URLs (`https://example.com/logo.png`). 

This keeps code clean and makes it easy to test files locally.

Normally, the browser resolves relative paths using the current page's URL as the starting point. If you are on `https://example.com/blog/article.html`, a relative path like `logo.png` becomes `https://example.com/blog/logo.png`.

But what if all your images live in an asset directory located somewhere else entirely (e.g. on a Content Delivery Network like `https://cdn.mysite.com/assets/`)? 

Repeating that massive CDN path prefix on dozens of image elements is tedious.

The W3C created the **`<base>` tag** to solve this. It defines a **single global starting point** for resolving relative paths. Additionally, it can declare a default opening behavior (such as forcing all page links to open in a new tab).

---

### (2) Key Attributes
The `<base>` element is a void element supporting two key attributes:
-   **`href`:** The absolute base URL. All relative paths on the page (links, stylesheets, images, scripts) will resolve using this root path.
-   **`target`:** The default opening target for links (e.g., `_blank` to open in a new tab, or `_self` to open in the same frame).

---

### (3) Critical Usage Rules
1.  **Singular Usage:** You can have **at most one** `<base>` element per HTML document.
2.  **Placement:** It must be placed inside the `<head>` and must appear **before** any elements that refer to external assets (like `<link>`, `<script>`, or `<img>`).

---

### (4) Code Examples

#### Short Snippet
Basic base URL definition:

```html
<head>
  <!-- All relative links will now start with this prefix -->
  <base href="https://example.com/assets/">
</head>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  
  <!-- 1. Define base URL and force all links to open in a new tab -->
  <base href="https://cdn.company.com/assets/" target="_blank">

  <title>Global Base Demo</title>

  <!-- This stylesheet resolves to: https://cdn.company.com/assets/css/main.css -->
  <link rel="stylesheet" href="css/main.css">
</head>
<body>

  <h1>Welcome to our Portal</h1>

  <!-- This image resolves to: https://cdn.company.com/assets/images/logo.png -->
  <img src="images/logo.png" alt="Company Logo">

  <p>
    <!-- This link resolves to: https://cdn.company.com/assets/help.html -->
    <!-- It opens in a new tab because of target="_blank" in the base tag -->
    <a href="help.html">Read Help Guide</a>
  </p>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Broken page anchor links (The Jump-Link Trap)

**The mistake:** Using relative hash links to jump down to a section on the same page while a `<base>` tag is active:

```html
<head>
  <base href="https://example.com/subfolder/">
</head>
<body>
  <!-- BAD: Clicking this will reload the page to: https://example.com/subfolder/#conclusion -->
  <a href="#conclusion">Jump to Conclusion</a>

  <!-- ...content... -->
  <h2 id="conclusion">Conclusion</h2>
</body>
```

**Why it's wrong:** The browser treats `#conclusion` as a relative path. Because the `<base>` tag is active, the browser appends `#conclusion` to the base URL and performs a full navigation refresh instead of smooth-scrolling down the current page.

**Golden Rule:** If your website relies heavily on page jump-links (like single-page portfolios), avoid using the `<base>` tag.

---



### Mistake 2: Placing `<base>` Elements Outside the `<head>` Section or Below Relative Links

**The mistake:** Placing `<base href="https://cdn.com/">` in `<body>` or after stylesheet `<link>` tags.

**Why it's wrong:** The `<base>` element MUST be inside `<head>` and MUST precede all elements that reference external URLs (`<link>`, `script`, `img`). Placing it late breaks early relative URL resolution.

*Incorrect:*
```html
<head>
  <link rel="stylesheet" href="style.css"> <!-- Resolves before base URL! -->
  <base href="https://cdn.com/">
</head>
```

*Fix:*
```html
<head>
  <base href="https://cdn.com/"> <!-- Must be first URL-resolving element -->
  <link rel="stylesheet" href="style.css">
</head>
```

### Mistake 3: Including Multiple `<base>` Tags in a Single Document

**The mistake:** Adding two separate `<base>` elements to one document.

**Why it's wrong:** HTML specifications permit at most ONE `<base>` element per document. Multiple `<base>` tags cause browsers to ignore subsequent base declarations.

*Incorrect:*
```html
<base href="/v1/">
<base href="/v2/"> <!-- ❌ Second base tag ignored! -->
```

*Fix:*
```html
<base href="/v1/" target="_blank"> <!-- Single base element -->
```

## 6. Practice Exercises

### Exercise 1: Path Resolution

**Problem:** Given the following HTML configuration:

```html
<head>
  <base href="https://secure.myshop.com/store/">
</head>
<body>
  <a href="checkout/pay.html">Pay Now</a>
</body>
```

What is the absolute URL the browser will navigate to when the user clicks the "Pay Now" link?

**Expected output:**
> [!check]- Answer
> ```text
> https://secure.myshop.com/store/checkout/pay.html
> ```
> - Combine the `base` URL and the link's `href` string.

---



### Exercise 2: Base URL Resolution

**Problem:** If `<base href="https://cdn.example.com/assets/">` is set, what absolute URL does `<img src="logo.png">` resolve to?

**Expected output:**
> [!check]- Answer
> ```text
> https://cdn.example.com/assets/logo.png
> ```
> ```text
> https://cdn.example.com/assets/logo.png
> ```
>
> **Explanation:** Relative URL paths prepend the `<base href>` prefix.

---

### Exercise 3: Base Target Attribute

**Problem:** Write `<base>` tag setting base URL `https://example.com/` and default target `_blank` for all links.

**Expected output:**
> [!check]- Answer
> ```text
> <base href="https://example.com/" target="_blank">
> ```
> ```html
> <base href="https://example.com/" target="_blank">
> ```
>
> **Explanation:** `target="_blank"` on `<base>` sets global default link opening behavior.

## 7. Related Terms
- [`<head>`](../level_01/head.md) — The parent metadata container.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Elements impacted by base target modifications.
- [`href` Attribute](../level_02/href.md) — The path target attribute.
- [`<link>`](link.md) — Related concept: `<link>`.
---

## 8. Key Takeaways
- The `<base>` element sets a default root path for all relative links and assets on a page.
- Place it in the `<head>` before any asset links (`<link>`, `<img>`, etc.).
- You can have a maximum of **one** `<base>` tag per document.
- It can set a default window opening target (e.g. `target="_blank"`) for all page anchors.
- It intercepts page hash links (e.g., `<a href="#top">`), causing unwanted page reloads.
