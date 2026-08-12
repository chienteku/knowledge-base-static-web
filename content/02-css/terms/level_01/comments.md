# CSS Comments (`/* */`)

> **Level 1 — Core Concepts**
> Annotations written inside a CSS stylesheet wrapped in `/*` and `*/` that are ignored by the browser's CSS parser, used to organize code and document styling choices.

---

## 1. Prerequisites
- [CSS (Cascading Style Sheets)](css.md) — The language stylesheet where comments are written.

---

## 2. Term Category

**CSS Syntax (Universal Browser Support .)**: CSS Comments (`/* */`) is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In a real web project, stylesheets can grow to contain thousands of lines of styling code. Without notes, stylesheets quickly become a messy, unreadable wall of text. 

Furthermore, during debugging, developers frequently need to temporarily disable specific lines of CSS to see how the layout behaves without them.

To solve this, the W3C defined the **CSS Comment** syntax. 

Comments are completely ignored by the web browser when it builds the CSSOM. This allows developers to leave readable notes for themselves and their teammates, partition sections of code, and temporarily mute CSS selectors during testing.

---

### (2) The CSS Comment Syntax
Unlike HTML which uses `<!-- -->` and JavaScript which supports both single-line `//` and block `/* */`, **CSS has only one comment syntax**:

-   **`/*`** starts the comment.
-   **`*/`** ends the comment.

CSS comments can span multiple lines:

```css
/* 
  This is a multi-line comment.
  Everything written in here is ignored.
*/
```

---

### (3) Code Examples

#### Short Snippet
Commenting inline and out:

```css
h1 {
  color: red; /* Make headings standout */
  /* font-size: 40px; */ /* Temporarily disabled during testing */
}
```

#### Fuller Example
Organizing a stylesheet into clear sections:

```css
/* ==========================================================================
   1. GLOBAL RESET & BASE STYLES
   ========================================================================== */

body {
  font-family: 'Helvetica', sans-serif;
  margin: 0;
  padding: 0;
}

/* ==========================================================================
   2. BUTTON WIDGETS
   ========================================================================== */

.btn-primary {
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

/* 
  TODO: Add hover styles once color theme is selected.
  .btn-primary:hover {
    background-color: darkblue;
  }
*/
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using single-line `//` comments

**The mistake:** Trying to comment out a line of CSS using double slashes:

```css
.card {
  background-color: white;
  // color: red;  /* BAD: The browser does not understand //! */
  margin: 10px;
}
```

**Why it's wrong:** The CSS specification does not support double-slash `//` comments. If the browser encounters `//`, it treats it as a syntax error. 

Depending on the browser, it may ignore the entire ruleset, skip the immediate next property, or break the parsing of the rest of the stylesheet.

---

### Mistake 2: Nesting comments

**The mistake:** Putting a comment inside another comment:

```css
/* 
  Main comment block
  /* Nested comment note */ 
  This text will cause syntax errors!
*/
```

**Why it's wrong:** The browser parser is simple. It searches for `/*` to start a comment, and then searches forward for the very first `*/` to end it. 

In the example above, the comment ends at the end of the nested comment (`*/`), leaving the text "This text will cause syntax errors!" exposed to the parser as if it were active CSS code, breaking compilation.

---



### Mistake 3: Using Single-Line HTML (`<!-- -->`) or JS (`//`) Comment Syntax in CSS Stylesheets

**The mistake:** Writing `// This is a comment` or `<!-- Comment -->` in `.css` files.

**Why it's wrong:** CSS syntax supports ONLY multi-line block comments (`/* ... */`). Using `//` or `<!--` causes CSS parsers to invalidate the subsequent selector rule.

*Incorrect:*
```css
// Set button color
button { color: red; } /* ❌ Invalid // comment invalidates selector! */
```

*Fix:*
```css
/* Set button color */
button { color: red; } /* Valid CSS comment */
```

### Mistake 4: Nesting CSS Block Comments (`/* /* comment */ */`)

**The mistake:** Nesting one `/* ... */` comment block inside another.

**Why it's wrong:** CSS comment parsers stop at the VERY FIRST `*/` closing sequence encountered. Remaining comment text leaks into stylesheet as invalid CSS syntax.

*Incorrect:*
```css
/* Outer comment
   /* Inner comment */
   color: blue; */ /* ❌ Leaks color: blue into stylesheet! */
```

*Fix:*
```css
/* Outer comment containing text without nested comment blocks */
```

## 5. Practice Exercises

### Exercise 1: Documenting CSS Design Tokens & Theme Variables with Block Comments

**Scenario:** An engineer organizes a production CSS stylesheet using structured block comments to delineate design tokens, layout rules, and component styles.

**Requirements:**
1. Create structured section header block comments using `/* === ... === */`.
2. Document CSS custom properties (variables).
3. Include inline comments explaining `rem` relative scaling.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ==========================================================================
>    DESIGN TOKENS & CORE SYSTEM VARIABLES
>    ========================================================================== */
>
> :root {
>   /* Brand Palette */
>   --color-primary: #2563eb;       /* Primary interactive blue */
>   --color-surface: #ffffff;       /* Main card background */
>
>   /* Typography Scale (using rem for a11y accessibility scaling) */
>   --font-size-base: 1rem;         /* 16px default browser baseline */
>   --font-size-heading: 1.75rem;   /* ~28px relative heading */
> }
>
> /* ==========================================================================
>    CARD COMPONENT STYLES
>    ========================================================================== */
>
> .card {
>   background-color: var(--color-surface);
>   padding: 1.5rem;                /* Scales proportionally with root font size */
>   border-radius: 0.5rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **CSS Comment Syntax**: CSS comments use multi-line syntax `/* comment */`; unlike JavaScript, single-line `//` comments are INVALID in standard CSS.
> 2. **Architectural Section Banners**: Using visually prominent banner comments establishes clean file navigation for large engineering teams.
> 3. **Documenting Design Rationale**: Use inline comments to explain *why* specific choices were made (e.g. why `rem` units were chosen over fixed `px`).
> 
---

### Exercise 2: Explaining Non-Obvious Specificity Hacks or Workarounds

**Scenario:** Adds explanatory inline comments above complex CSS selectors to explain specificity workarounds.

**Requirements:**
1. Add inline comments explaining complex selector specificity.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Note: Using double-class selector (.btn.btn) to match third-party library 
>    specificity without resorting to harmful !important declarations. */
> .btn.btn-custom {
>   background-color: var(--color-primary);
>   color: #ffffff;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Preventing Code Removal**: Comments prevent future developers from accidentally deleting seemingly redundant selector chains.
> 2. **Specificity Rationale**: Explains why specific selector weighting was necessary without resorting to `!important`.
> 3. **Maintainability Best Practice**: Clear explanations improve long-term codebase maintainability.
> 
---

### Exercise 3: Structuring Modular Stylesheet Sections using Standard Comment Banners

**Scenario:** Divides a global stylesheet into modular architecture sections.

**Requirements:**
1. Use clean comment dividers between CSS resets, utilities, and components.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* --------------------------------------------------------------------------
>    1. RESET & BASE
>    -------------------------------------------------------------------------- */
> *, *::before, *::after {
>   box-sizing: border-box;
> }
>
> /* --------------------------------------------------------------------------
>    2. UTILITIES
>    -------------------------------------------------------------------------- */
> .u-text-center {
>   text-align: center;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Stylesheet Modularization**: Separates stylesheet concerns logically into Reset, Layout, Components, and Utilities.
> 2. **Minification Safety**: Production CSS minifiers strip standard comments automatically during build steps.
> 3. **Codebase Navigation**: Enables quick searching across major stylesheet sections via Ctrl+F banner keywords.
## 6. Related Terms
- [CSS (Cascading Style Sheets)](css.md) — The parent language.
- [Ruleset (Declaration, Property, Value)](ruleset.md) — The container syntax holding comments.

---

## 7. Key Takeaways
- CSS comments are wrapped exclusively in `/*` and `*/`.
- CSS does not support single-line `//` comments; using them causes silent parsing bugs.
- Comments can span multiple lines.
- Nesting comments is not supported; the first `*/` always terminates the comment block.
