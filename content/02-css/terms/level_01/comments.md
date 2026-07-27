# CSS Comments (`/* */`)

> **Level 1 — Core Concepts**
> Annotations written inside a CSS stylesheet wrapped in `/*` and `*/` that are ignored by the browser's CSS parser, used to organize code and document styling choices.

---

## 1. Prerequisites
- [CSS](../level_01/css.md) — The language stylesheet where comments are written.

---

## 2. Term Category
- **CSS Syntax**

---

## 3. Environment Context
- **Universal Browser Support** (Parsed and ignored during tokenization. Does not impact visual paint steps).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Comment Cleanup

**Problem:** Fix the comment syntax errors in the following CSS block so that `color: blue;` is active and the other items are properly commented out:

```css
.profile {
  // border: 1px solid black;
  color: blue;
  /* padding: 10px; /* inner comment */ */
}
```

**Expected output:**
```css
.profile {
  /* border: 1px solid black; */
  color: blue;
  /* padding: 10px; inner comment */
}
```

> [!check]- Answer
> - Replace `//` with `/* ... */`.
> - Remove the nested `/*` inside the padding comment.

---



### Exercise 2: Writing Valid CSS Comments

**Problem:** Write multi-line CSS comment describing section header styles.

**Expected output:**
```text
/* 
 * Header Navigation Styles
 */
```

> [!check]- Answer
> ```css
> /* 
>  * Header Navigation Styles
>  */
> ```
>
> **Explanation:** CSS comments begin with `/*` and end with `*/`.

### Exercise 3: Commenting Out CSS Rules

**Problem:** Comment out `background: red;` property declaration inside `.box { background: red; color: white; }`.

**Expected output:**
```text
.box { /* background: red; */ color: white; }
```

> [!check]- Answer
> ```css
> .box {
>   /* background: red; */
>   color: white;
> }
> ```
>
> **Explanation:** Wrapping CSS properties in `/* */` disables them without deleting code.

## 7. Related Terms
- [CSS (Cascading Style Sheets)](../level_01/css.md) — The parent language.
- [Ruleset (Declaration, Property, Value)](../level_01/ruleset.md) — The container syntax holding comments.

---

## 8. Key Takeaways
- CSS comments are wrapped exclusively in `/*` and `*/`.
- CSS does not support single-line `//` comments; using them causes silent parsing bugs.
- Comments can span multiple lines.
- Nesting comments is not supported; the first `*/` always terminates the comment block.
