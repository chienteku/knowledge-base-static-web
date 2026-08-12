# CSS Reset vs. Normalize

> **Level 11 — Modern CSS Architecture & Functions**
> Architecture files and coding practices used to clear or homogenize browser-default styles (User-Agent Stylesheets), ensuring a consistent visual baseline across Chrome, Firefox, Safari, and Edge.

---

## 1. Prerequisites
- [The Cascade](../level_01/the_cascade.md) — Overwriting default rules.
- [`box-sizing: border-box`](../level_02/box_sizing.md) — The core layout adjustment.

---

## 2. Term Category

**CSS Architecture (Universal Modern Standard .)**: CSS Reset vs. Normalize is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Modern Defensive CSS Reset Architecture

**Scenario:** An author constructs a modern defensive CSS reset for new projects.

**Requirements:**
1. Apply `box-sizing: border-box` to `*, *::before, *::after`.
2. Apply `margin: 0`.
3. Set responsive media defaults.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Modern Defensive CSS Reset Baseline */
> *, *::before, *::after {
>   box-sizing: border-box;
> }
>
> * {
>   margin: 0;
> }
>
> html {
>   font-size: 100%;
>   -webkit-text-size-adjust: 100%;
> }
>
> body {
>   min-height: 100vh;
>   line-height: 1.5;
>   font-family: system-ui, -apple-system, sans-serif;
>   color: #1e293b;
>   background-color: #ffffff;
> }
>
> img, picture, video, canvas, svg {
>   display: block;
>   max-width: 100%;
> }
>
> input, button, textarea, select {
>   font: inherit;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Modern CSS Reset Goals**: Eliminates browser user-agent stylesheet inconsistencies (like default 8px body margin and button font discrepancies).
> 2. **Universal `border-box`**: Ensures all elements include padding and border inside width calculations.
> 3. **Fluid Media Reset**: `img { display: block; max-width: 100%; }` eliminates unwanted bottom inline baseline gaps and prevents image overflow.
> 4. **Form Font Inheritance**: `font: inherit` forces inputs and buttons to use the site's primary font family instead of browser default OS fonts.
> 
---

### Exercise 2: Comparing Global Reset vs Normalize.css

**Scenario:** Compares aggressive zero-margin resets (`* { margin: 0; }`) with Normalize.css element preservation.

**Requirements:**
1. Explain reset vs normalize philosophies.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Aggressive Reset: Strips ALL margins and paddings indiscriminately */
> * { margin: 0; padding: 0; }
>
> /* Normalize Philosophy: Preserves useful browser defaults (h1 size, list bullets) while fixing bugs */
> ```
>
> #### Technical Explanation
>
> 1. **Reset Philosophy**: Strips all default browser styles to a completely blank canvas.
> 2. **Normalize Philosophy**: Preserves useful browser defaults while harmonizing cross-browser bugs.
> 3. **Modern Consensus**: Modern web applications prefer lightweight custom resets (like Andy Bell's or Josh Comeau's reset).
> 
---

### Exercise 3: Form Element Font and Margin Reset Policies

**Scenario:** Resets default button and input styles for custom UI library components.

**Requirements:**
1. Apply `font: inherit`, `background: none`, `border: none`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> button, input, select, textarea {
>   font: inherit;
>   color: inherit;
>   letter-spacing: inherit;
> }
>
> button {
>   background-color: transparent;
>   border: none;
>   padding: 0;
>   cursor: pointer;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Form Style Inheritance**: By default, browsers do NOT inherit `font-family` or `color` on `<button>` and `<input>` elements!
> 2. **Explicit Inheritance Rule**: Declaring `font: inherit` and `color: inherit` harmonizes form typography.
> 3. **Base Button Cleaning**: Cleans native OS button bevels and backgrounds for custom design systems.
## 6. Related Terms
- [`@import`](import.md) — Loading modular sheets.
- [`box-sizing: border-box`](../level_02/box_sizing.md) — Sizing layouts easily.
- [CSS Methodologies (BEM, OOCSS, SMACSS)](methodologies.md) — Related concept: CSS Methodologies (BEM, OOCSS, SMACSS).

---

## 7. Key Takeaways
- User-Agent Stylesheets are built-in browser default styles.
- CSS Resets aggressively wipe all default styles to `0` for a blank slate.
- Normalize unifies browser styling variations while keeping standard element defaults.
- Modern custom resets establish base fonts, border-box sizing, and clean image defaults.
- Always load resets/normalize at the absolute top of the stylesheet parsing list.
