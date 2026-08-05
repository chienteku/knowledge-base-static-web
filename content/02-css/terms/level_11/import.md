# `@import`

> **Level 11 — Modern CSS Architecture & Functions**
> The CSS at-rule used to load one CSS file into another CSS file, allowing developers to split massive stylesheets into smaller, organized pieces.

---

## 1. Prerequisites
- None!

---

## 2. Term Category
- **CSS Architecture / At-Rule**

---

## 3. Environment Context
- **Universal Standard** (Though frequently handled by bundlers like Webpack or Vite in modern JavaScript frameworks).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The External Font

**Problem:** You go to Google Fonts to get a cool custom font. Google gives you a snippet of code that looks like this: `@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');`. Where do you paste this in your CSS file?

**Expected output:**
> [!check]- Answer
> ```text
> At the absolute top of your CSS file, on line 1! If you put it anywhere else, the browser will ignore it and your custom font will not load.
> ```
> - Where do imports go?

---



### Exercise 2: @import Media Query Filter Syntax

**Problem:** Write `@import` rule loading `print.css` only when media is `print`.

**Expected output:**
> [!check]- Answer
> ```text
> @import url('print.css') print;
> ```
> ```css
> @import url('print.css') print;
> ```
>
> **Explanation:** `@import` accepts optional trailing media query constraints.

---

### Exercise 3: @import Layer Syntax

**Problem:** Write `@import` statement importing `reset.css` directly into Cascade Layer `@layer base`.

**Expected output:**
> [!check]- Answer
> ```text
> @import url('reset.css') layer(base);
> ```
> ```css
> @import url('reset.css') layer(base);
> ```
>
> **Explanation:** `layer(layerName)` imports external stylesheets into explicit Cascade Layers.

## 7. Related Terms
- [The Cascade](../level_01/the_cascade.md) — Because `@import` files are loaded first, any CSS you write *below* the imports in your master file will override the imported CSS (due to the cascade!).
- [CSS Preprocessors (Sass & SCSS)](preprocessors.md) — Modern preprocessors compile imports before browser loading loops.
- [CSS Reset vs. Normalize](reset_normalize.md) — Resets are often loaded at the top of main files via `@import`.
- [`@font-face` & Web Fonts (Google Fonts)](../level_03/web_fonts.md) — Related concept: `@font-face` & Web Fonts (Google Fonts).

---

## 8. Key Takeaways
- `@import` allows you to split large CSS files into small, organized, manageable pieces.
- Imports **MUST** be placed at the absolute top of your CSS file.
- In modern web development, bundlers (like Vite) use `@import` to organize code, but automatically merge the files together for performance before sending them to the user.
