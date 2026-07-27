# Render-Blocking Resources

> **Level 9 — DOM, Rendering & Accessibility**
> Web assets (primarily CSS stylesheets and synchronous JavaScript files) that pause the browser's rendering pipeline, keeping the screen blank until they are fully downloaded and compiled.

---

## 1. Prerequisites
- [Critical Rendering Path](../level_09/critical_rendering_path.md) — The rendering stages impacted by blocking.
- [`<link>`](../level_08/link.md) — The tag primarily used to import CSS.
- [`<script>`](../level_08/script.md) — The tag primarily used to import JS.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (A core performance concept. Tracked heavily by page performance auditing tools like Google Lighthouse and PageSpeed Insights).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a user visits your website, they want to see content as fast as possible. If they stare at a blank white screen for longer than two seconds, they are likely to leave. 

Why does a browser sometimes display a blank page even when it has already downloaded the HTML file?

It is because the browser has run into **Render-Blocking Resources** in the `<head>`.

The browser parses the HTML and builds the DOM. But if it encounters a standard `<link rel="stylesheet">` or a `<script>` tag, it has to stop. It cannot display the page to the user until those files are fetched. 

Understanding what blocks rendering helps developers optimize asset loading so that the browser displays content immediately.

---

### (2) Why CSS is Render-Blocking by Default
If the browser rendered the HTML immediately before downloading the CSS, the user would see a raw, unstyled page (blue links, black bullet points, unstyled fonts) for a split second, followed by a sudden jump as the CSS loaded and styled the elements.

This visual glitch is called a **Flash of Unstyled Content (FOUC)**.

To prevent FOUC, the browser blocks rendering on purpose. It waits until the CSSOM tree is fully built before drawing anything. Because of this, **CSS is considered a render-blocking resource**.

*Optimization:* Keep stylesheets small, delete unused CSS, or inline "critical CSS" (styling for the top part of the page) directly into the HTML `<style>` tag, loading the rest of the styles later.

---

### (3) Why JavaScript is Render-Blocking by Default
JavaScript has the power to modify the DOM (e.g. adding new elements or writing contents). Because of this, if the browser hits a standard `<script src="file.js">` tag, it halts parsing the HTML, downloads the script, and executes it. 

*Optimization:* Add the `defer` or `async` attributes to external scripts. This tells the browser to download the JavaScript in the background *without* pausing the HTML parser.

---

### (4) Code Examples

#### Render-Blocking Page (Slow)
```html
<head>
  <meta charset="UTF-8">
  <title>Slow Website</title>

  <!-- BLOCKS: The screen remains white until this stylesheet downloads -->
  <link rel="stylesheet" href="massive-styles.css">

  <!-- BLOCKS: The browser stops drawing the page until this script runs -->
  <script src="heavy-analytics.js"></script>
</head>
```

#### Optimized Non-Blocking Page (Fast)
```html
<head>
  <meta charset="UTF-8">
  <title>Fast Website</title>

  <!-- Critical styles are inline (loads instantly!) -->
  <style>
    body { font-family: sans-serif; background-color: #fff; }
    h1 { color: #333; }
  </style>

  <!-- Non-critical styles are deferred (non-blocking) -->
  <link rel="stylesheet" href="non-essential.css" media="print" onload="this.media='all'">

  <!-- Analytics and scripts load in the background (non-blocking) -->
  <script src="heavy-analytics.js" async></script>
</head>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing non-essential styles or scripts in the `<head>`

**The mistake:** Putting external link tags for prints, dashboard styles, or widget scripts directly in the `<head>` without attributes:

```html
<!-- BAD: Blocks mobile users from seeing the page while downloading a print stylesheet! -->
<link rel="stylesheet" href="print-layout.css">
```

**Why it's wrong:** The print layout stylesheet is only needed when a user hits "Print Page". However, because it is a standard `<link>` in the head, the browser blocks rendering on mobile phones while it downloads a file it will never use!

**Fix:** Use the `media` attribute to tell the browser *when* the stylesheet is relevant. The browser will still download it in the background, but it won't block rendering:

```html
<!-- CORRECT: Non-blocking on screens -->
<link rel="stylesheet" href="print-layout.css" media="print">
```

---



### Mistake 2: Placing Large External CSS Stylesheets at Bottom of `<body>` Section

**The mistake:** Placing stylesheet `<link rel="stylesheet">` at the bottom of `<body>` to prevent render blocking.

**Why it's wrong:** Moving CSS to the bottom causes Flash of Unstyled Content (FOUC). CSS is intentionally render-blocking because browsers MUST construct the CSSOM before painting to avoid visual layout shifts. Keep CSS in `<head>`.

*Incorrect:*
```html
<body>
  <!-- Content renders unstyled, then jumps when CSS loads at bottom -->
  <link rel="stylesheet" href="main.css">
</body>
```

*Fix:*
```html
<head>
  <link rel="stylesheet" href="main.css"> <!-- Keep CSS in <head> for clean paint -->
</head>
```

### Mistake 3: Loading Non-Critical Third-Party JS Scripts Synchronously in `<head>`

**The mistake:** Loading widget scripts `<script src="chat.js"></script>` in `<head>` without `defer` or `async`.

**Why it's wrong:** Synchronous script loading blocks HTML parsing completely while fetching and executing scripts over network requests. Always use `defer` or `async`.

*Incorrect:*
```html
<head>
  <script src="chat-widget.js"></script> <!-- ❌ Blocks main page render! -->
</head>
```

*Fix:*
```html
<head>
  <script src="chat-widget.js" defer></script>
</head>
```

## 6. Practice Exercises

### Exercise 1: Bottleneck Audit

**Problem:** Look at this page code:
```html
<head>
  <meta charset="UTF-8">
  <script src="modal-widget.js"></script>
  <link rel="stylesheet" href="custom-theme.css">
</head>
```
Which of the two files (`modal-widget.js` or `custom-theme.css`) is blocking the other from starting to download?

**Expected output:**
```text
The script `modal-widget.js` blocks the stylesheet from downloading. Because the script tag is synchronous and declared first, the browser halts HTML parsing and stops searching for other links until the script is fully downloaded and executed.
```

> [!check]- Answer
> - The browser reads top-to-bottom. If a synchronous script halts the parser, does it see the lines below it?

---



### Exercise 2: Identifying Render-Blocking Resources

**Problem:** Which 2 of these resources are Render-Blocking by default in HTML?
1. External `<link rel="stylesheet">` in head
2. `<img>` tag assets
3. Synchronous `<script src="...">` in head without async/defer
4. Video media assets

**Expected output:**
```text
1 and 3.
```

> [!check]- Answer
> ```text
> 1. External <link rel="stylesheet"> in head
> 3. Synchronous <script src="..."> in head without async/defer
> ```
>
> **Explanation:** External CSS stylesheets and synchronous scripts block initial page paint.

### Exercise 3: Eliminating Render-Blocking CSS for Critical Path

**Problem:** How can critical above-the-fold CSS be delivered to eliminate render-blocking stylesheet network requests?

**Expected output:**
```text
Inline critical above-the-fold CSS inside a <style> tag in <head>, deferring non-critical CSS.
```

> [!check]- Answer
> ```html
> <head>
>   <style>/* Critical above-the-fold CSS */</style>
>   <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
> </head>
> ```
>
> **Explanation:** Inlining critical CSS enables instant above-the-fold rendering.

## 7. Related Terms
- [Critical Rendering Path](../level_09/critical_rendering_path.md) — The pipeline that gets blocked.
- [`<link>`](../level_08/link.md) — The stylesheet wrapper.
- [`<script>`](../level_08/script.md) — The script wrapper.
- [`defer` & `async` (Script Loading Strategies)](../level_08/defer_async.md) — The attributes used to make script loading non-blocking.

---

## 8. Key Takeaways
- Render-blocking resources prevent the browser from displaying visible page elements.
- CSS is render-blocking by default to prevent a Flash of Unstyled Content (FOUC).
- Synchronous JavaScript is render-blocking because scripts can modify the DOM mid-parse.
- Optimize JavaScript using the `defer` or `async` attributes.
- Optimize CSS by inline-injecting critical styles and using `media` attributes for non-essential sheets.
