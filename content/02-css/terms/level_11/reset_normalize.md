# CSS Reset vs. Normalize

> **Level 11 — Modern CSS Architecture & Functions**
> Architecture files and coding practices used to clear or homogenize browser-default styles (User-Agent Stylesheets), ensuring a consistent visual baseline across Chrome, Firefox, Safari, and Edge.

---

## 1. Prerequisites
- [The Cascade](../level_01/the_cascade.md) — Overwriting default rules.
- [`box-sizing: border-box`](../level_02/box_sizing.md) — The core layout adjustment.
---

## 2. Term Category
- **CSS Architecture**

---

## 3. Environment Context
- **Universal Modern Standard** (Loaded at the absolute top of the CSS parsing queue to override the browser engine's built-in User-Agent Stylesheet rules).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before the browser reads a single line of your custom CSS, it applies a built-in default style sheet called the **User-Agent Stylesheet**. This is why:
-   `<body>` has a default `8px` margin around it.
-   Headers (`<h1>` through `<h6>`) have large margins and bold fonts.
-   Lists (`<ul>`, `<ol>`) have margins and left indentations.

However, different browsers (Chrome, Safari, Firefox) have slightly different default rules. 

If you build a layout without neutralizing these default margins and paddings, your site will render inconsistently across different browsers.

To solve this cross-browser rendering problem, CSS architects created two distinct solutions: **CSS Resets** and **Normalize.css**.

---

### (2) CSS Reset vs. Normalize

#### 1. CSS Reset (Aggressive Wipe)
An aggressive style sheet that strips **all** browser styling, setting all margins, paddings, borders, and margins to `0`. 
-   *Behavior:* It resets everything to a completely flat, blank slate. A `<h1>` heading looks identical to plain text, and list items have no bullets or indentations.
-   *Pro:* Zero browser defaults to fight against.
-   *Con:* You must manually rebuild basic element styles (like list bullets and heading sizes) from scratch.

```css
/* Example simple reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

#### 2. Normalize.css (Gentle Unification)
A style sheet that unifies styles across browsers without wiping them out.
-   *Behavior:* It preserves useful defaults (like headings looking larger, standard input borders) but resolves bugs and inconsistencies between Chrome, Firefox, and Safari.
-   *Pro:* Keeps default layouts working out of the box; cleaner HTML elements code.
-   *Con:* You still inherit default margins/paddings that you might need to override later.

---

### (3) Modern Custom Reset (Best of Both)
Today, most front-end developers write a small, custom reset that combines the best of resets and normalization:

```css
/* THE MODERN RESET BASELINE */

/* 1. Use border-box for easier layout math */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 2. Remove default margins from common elements */
body, h1, h2, h3, p, ul, ol, figure {
  margin: 0;
}

/* 3. Set up smooth scroll and clean body defaults */
html {
  scroll-behavior: smooth;
}
body {
  line-height: 1.5;
  font-family: system-ui, sans-serif;
  min-height: 100vh;
}

/* 4. Make images responsive and remove vertical gaps */
img, picture, video {
  max-width: 100%;
  display: block;
}
```

---

### (4) Code Examples

#### Short Snippet
HTML structure index file loading order:

```html
<head>
  <!-- Load reset first so custom styles override it! -->
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="styles.css">
</head>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Loading the reset stylesheet AFTER your custom styles

**The mistake:** Ordering files in HTML head like this:
`<link rel="stylesheet" href="styles.css">`
`<link rel="stylesheet" href="reset.css">`

**Why it's wrong:** The cascade evaluates rules from top to bottom. If the reset is loaded last, its `margin: 0` rules will override all the custom margin spacing you defined in `styles.css`.

**Fix: Always load the reset/normalize file at the absolute top of your CSS import list.**

---



### Mistake 2: Confusing CSS Reset (Zeroing All Styles) with Normalize.css (Standardizing Cross-Browser Defaults)

**The mistake:** Using a aggressive CSS Reset when you want consistent default heading sizes and list bullets.

**Why it's wrong:** A **Reset** (`* { margin: 0; padding: 0; border: 0; }`) strips ALL default styling, requiring you to rebuild typography from scratch. **Normalize.css** preserves useful defaults while fixing cross-browser bugs.

*Incorrect:*
```css
/* Aggressive reset stripping all h1 font sizes and list bullet styles */
```

*Fix:*
```css
/* Use Modern Reset or Normalize.css based on project requirements */
```

### Mistake 3: Omitting `box-sizing: border-box` from CSS Resets

**The mistake:** Using a basic CSS reset that zeroes margins/paddings but omits global `box-sizing: border-box`.

**Why it's wrong:** Without `border-box` in your reset, padding and border additions break element width calculations.

*Incorrect:*
```css
* { margin: 0; padding: 0; } /* Missing box-sizing reset */
```

*Fix:*
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

## 6. Practice Exercises

### Exercise 1: Reset Audit

**Problem:** You are starting a fresh project and want to write a basic CSS Reset that sets `box-sizing: border-box` on all elements, removes margins and paddings from all elements, and makes sure image tags (`<img>`) are displayed as block elements with a maximum width of 100% to prevent overflow. Write the CSS.

**Expected output:**
> [!check]- Answer
> ```css
> *, *::before, *::after {
>   box-sizing: border-box;
>   margin: 0;
>   padding: 0;
> }
> 
> img {
>   display: block;
>   max-width: 100%;
> }
> ```
> - Use the universal selector `*` to target all boxes.
> - Select the image tag specifically to assign block and max-width layout limits.

---



### Exercise 2: Modern Minimal CSS Reset Template

**Problem:** Write minimal modern CSS reset covering `border-box`, margin/padding reset, and responsive media handling.

**Expected output:**
> [!check]- Answer
> ```text
> *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } img, picture, video { max-width: 100%; display: block; }
> ```
> ```css
> *, *::before, *::after {
>   box-sizing: border-box;
>   margin: 0;
>   padding: 0;
> }
> img, picture, video {
>   max-width: 100%;
>   display: block;
> }
> ```
>
> **Explanation:** Modern CSS resets provide clean baseline defaults for modern web apps.

---

### Exercise 3: Normalize.css Core Strategy

**Problem:** What is the primary architectural goal of Normalize.css?

**Expected output:**
> [!check]- Answer
> ```text
> To normalize cross-browser default styles while preserving useful browser defaults (like heading sizes and list markers).
> ```
> ```text
> To normalize cross-browser default styles while preserving useful browser defaults (like heading sizes and list markers).
> ```
>
> **Explanation:** Normalize.css fixes browser inconsistencies without stripping all typography.

## 7. Related Terms
- [`@import` Rule](import.md) — Loading modular sheets.
- [`box-sizing: border-box`](../level_02/box_sizing.md) — Sizing layouts easily.
- [CSS Methodologies (BEM, OOCSS, SMACSS)](methodologies.md) — Related concept: CSS Methodologies (BEM, OOCSS, SMACSS).
---

## 8. Key Takeaways
- User-Agent Stylesheets are built-in browser default styles.
- CSS Resets aggressively wipe all default styles to `0` for a blank slate.
- Normalize unifies browser styling variations while keeping standard element defaults.
- Modern custom resets establish base fonts, border-box sizing, and clean image defaults.
- Always load resets/normalize at the absolute top of the stylesheet parsing list.
