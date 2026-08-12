# `@import`

> **Level 11 — Modern CSS Architecture & Functions**
> The CSS at-rule used to load one CSS file into another CSS file, allowing developers to split massive stylesheets into smaller, organized pieces.

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**CSS Architecture / At-Rule (Universal Standard .)**: `@import` is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard professional website has thousands of lines of CSS. If you put all of that into a single `styles.css` file, it becomes completely unmanageable. Finding the code for a specific button could take five minutes of scrolling.
To solve this, developers break their CSS into dozens of tiny files (e.g., `buttons.css`, `header.css`, `variables.css`). But you don't want to link 50 different CSS files in your HTML `<head>`.
The W3C created **`@import`** to allow CSS files to import *other* CSS files. You can have one master `main.css` file that just imports all the smaller files.

### (2) Reality Metaphor
Imagine building a Lego castle. 
Instead of dumping 5,000 mixed legos into one massive pile (`styles.css`), you organize the legos into separate boxes: one box for windows, one box for wall bricks, one box for roof tiles. When you build the castle (`main.css`), you pull pieces from the specific boxes as needed (`@import`).

### (3) Code Examples

#### The Master Stylesheet
```css
/* main.css */

/* You MUST put @imports at the absolute top of the file! */
@import url("variables.css");
@import url("reset.css");
@import url("typography.css");
@import url("components/buttons.css");
@import url("components/navbar.css");

/* Any CSS written below here will load AFTER all the imported files! */
body {
  background-color: var(--bg-color);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting `@import` in the middle of a file

**The mistake:** Writing a bunch of CSS rules, and then putting `@import url("buttons.css");` at the bottom of the file.

**Why it's wrong:** Browsers strictly enforce that **all `@import` statements must appear at the absolute top of the stylesheet** (before any other CSS rules are declared). If you put an `@import` after a normal CSS rule, the browser will completely ignore the import and the file will not load!

### Mistake 2: Performance Issues (The Waterfall)

**The mistake:** Using raw `@import` natively in the browser on a massive production website.

**Why it's wrong:** If `main.css` imports `buttons.css`, the browser has to download `main.css`, read it, *pause everything*, make a brand new network request to the server, and download `buttons.css`. This is called a "Network Waterfall" and it makes websites load very slowly.
**Modern Solution:** Today, we still use `@import` to organize our code, but we use tools like **Vite, Webpack, or Sass** to automatically combine all the files into one single file *before* we send it to the browser.

---



### Mistake 3: Placing `@import` Rules Below Standard CSS Rule Declarations (Invalid Syntax)

**The mistake:** Placing `@import url('reset.css');` at line 50 after component CSS rules.

**Why it's wrong:** CSS specifications require all `@import` statements to be placed at the VERY TOP of the stylesheet, preceding all other CSS rules (except `@charset` and `@layer`).

*Incorrect:*
```css
body { color: red; }
@import url('reset.css'); /* ❌ Invalid placement! Ignored by browser! */
```

*Fix:*
```css
@import url('reset.css'); /* Must be at line 1 of stylesheet */
body { color: red; }
```

### Mistake 4: Overusing Multiple `@import` Rules in Production Native CSS (Waterfall Network Delay)

**The mistake:** Chaining 10 sequential `@import` statements in native browser CSS.

**Why it's wrong:** Native browser `@import` creates sequential network waterfalls where the browser downloads `style1.css`, discovers `@import style2.css`, downloads `style2.css`, delaying page render. Use CSS bundlers or `<link>` tags.

*Incorrect:*
```css
/* 10 sequential @import statements creating network waterfalls */
```

*Fix:*
```css
/* Use build tool bundlers (Vite/webpack) to bundle CSS files into single network request */
```

## 5. Practice Exercises

### Exercise 1: Organizing CSS Modules using import and Highlighting Performance Hazards

**Scenario:** An author organizes CSS stylesheet modules using `@import` while documenting performance render-blocking hazards.

**Requirements:**
1. Demonstrate `@import` syntax.
2. Explain why build tools (Vite/PostCSS) are preferred.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Master Stylesheet (styles.css) */
> @import url("reset.css");
> @import url("typography.css");
> @import url("components/buttons.css");
>
> body {
>   font-family: system-ui, sans-serif;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `@import` Rule**: Imports CSS rules from another external stylesheet file into the current stylesheet.
> 2. **Render-Blocking Performance Hazard**: CSS `@import` creates sequential network download chains (waterfalls), delaying page rendering!
> 3. **Modern Bundler Superiority**: Use PostCSS or Vite to bundle CSS files at build time into a single HTTP download file rather than using native `@import` in production.
> 
---

### Exercise 2: Restructuring import Statements to Upper File Order Compliance

**Scenario:** Fixes an invalid `@import` declaration placed below CSS rulesets.

**Requirements:**
1. Place all `@import` rules at the absolute top of file.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ✅ VALID: All @import statements MUST appear at the absolute top of the stylesheet! */
> @import url("base.css");
> @import url("theme.css");
>
> /* CSS rulesets follow AFTER all imports */
> .container {
>   max-width: 70rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Upper File Placement Requirement**: All `@import` statements MUST be declared at the absolute TOP of the stylesheet before any other CSS rules.
> 2. **Browser Invalid Execution**: Any `@import` placed after standard CSS rulesets is completely IGNORED by browsers.
> 3. **Syntactic Strictness**: Mandatory CSS syntax specification rule.
> 
---

### Exercise 3: Replacing Native import with Build-Tool Bundlers for Zero Network Latency

**Scenario:** Refactors multiple native `@import` files into a single PostCSS bundle output.

**Requirements:**
1. Explain PostCSS/Vite bundling benefits.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # PostCSS CLI command bundles all @import references into single styles.min.css
> npx postcss src/styles.css -o dist/styles.min.css --use postcss-import cssnano
> ```
>
> #### Technical Explanation
>
> 1. **Zero Network Waterfall**: Bundling collapses 10 `@import` HTTP requests into 1 compressed CSS file download.
> 2. **Improved Core Web Vitals**: Significantly reduces FCP (First Contentful Paint) latency.
> 3. **Modern CSS Pipeline**: Best practice for enterprise front-end development.
## 6. Related Terms
- [The Cascade](../level_01/the_cascade.md) — Because `@import` files are loaded first, any CSS you write *below* the imports in your master file will override the imported CSS (due to the cascade!).
- [CSS Preprocessors (Sass & SCSS)](preprocessors.md) — Modern preprocessors compile imports before browser loading loops.
- [CSS Reset vs. Normalize](reset_normalize.md) — Resets are often loaded at the top of main files via `@import`.
- [`@font-face` & Web Fonts (Google Fonts)](../level_03/web_fonts.md) — Related concept: `@font-face` & Web Fonts (Google Fonts).

---

## 7. Key Takeaways
- `@import` allows you to split large CSS files into small, organized, manageable pieces.
- Imports **MUST** be placed at the absolute top of your CSS file.
- In modern web development, bundlers (like Vite) use `@import` to organize code, but automatically merge the files together for performance before sending them to the user.
