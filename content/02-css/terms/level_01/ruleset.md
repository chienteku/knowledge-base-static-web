# Ruleset (Declaration, Property, Value)

> **Level 1 — Core Concepts**
> The complete block of CSS code that defines how a selector should be styled.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](selectors.md) — A ruleset always begins with a selector.

---

## 2. Term Category

**CSS Syntax (Universal Browser Support)**: Ruleset (Declaration, Property, Value) is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To write a language that computers can read, you need strict grammar. The W3C designed CSS around the concept of a **Ruleset**. 
A Ruleset consists of two main parts:
1. The **Selector**: *Who* are we talking to?
2. The **Declaration Block**: *What* are we telling them to do? (Everything inside the curly braces `{}`).

Inside the Declaration Block, you write individual **Declarations**. Every declaration is a key-value pair consisting of a **Property** (what aspect of the design you want to change, like `color` or `width`) and a **Value** (the specific setting, like `red` or `100px`).

### (2) Reality Metaphor
Imagine a boss giving instructions to an employee.
- **Selector**: "Hey, John..."
- **Declaration Block**: "...here is your list of tasks."
- **Property**: "Regarding your uniform..."
- **Value**: "...it must be blue."
- **Declaration**: "Your uniform must be blue."

### (3) Code Examples

#### Anatomy of a Ruleset
```css
/* The entire block of code below is ONE Ruleset */

/* "h1" is the Selector */
h1 {
  /* Everything inside here is the Declaration Block */
  
  /* "color" is the Property. "blue" is the Value. */
  /* Together, "color: blue;" is one Declaration. */
  color: blue;
  
  /* "font-size" is the Property. "24px" is the Value. */
  font-size: 24px;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the semicolon (`;`)

**The mistake:** Leaving off the semicolon at the end of a declaration.

**Why it's wrong:** In CSS, the semicolon acts as a hard stop, telling the browser, "I am finished with this instruction." If you forget the semicolon, the browser will read the current declaration and the *next* declaration as one massive, jumbled sentence. It will fail to understand both of them, and your styles will silently break.

*Incorrect:*
```css
.card {
  color: white  /* Missing semicolon! */
  background-color: black;
}
```

*Fix:*
```css
.card {
  color: white; /* Correct! */
  background-color: black;
}
```

### Mistake 2: Using an equals sign (`=`) instead of a colon (`:`)

**The mistake:** Writing `color = red;` instead of `color: red;`.

**Why it's wrong:** HTML uses equals signs for attributes (`class="btn"`). JavaScript uses equals signs for assignment (`let x = 5`). But CSS uses **colons** to separate properties from values! This is a very common muscle-memory mistake for beginners bouncing between languages.

---



### Mistake 3: Forgetting Semicolons Between CSS Declaration Statements

**The mistake:** Omitting semicolons between properties inside a declaration block.

**Why it's wrong:** CSS parsers require semicolons to separate property-value pairs. Omitting a semicolon causes the parser to merge adjacent properties, invalidating both rules.

*Incorrect:*
```css
div {
  color: red /* ❌ Missing semicolon! */
  font-size: 16px;
}
```

*Fix:*
```css
div {
  color: red;
  font-size: 16px;
}
```

### Mistake 4: Mismatching Curly Braces `{ }` in CSS Rulesets

**The mistake:** Omitting a closing curly brace `}` at the end of a ruleset.

**Why it's wrong:** Unclosed rulesets cause the CSS parser to treat all subsequent rulesets as nested content, breaking all remaining styles in the stylesheet.

*Incorrect:*
```css
.card {
  color: blue;
  /* ❌ Missing closing brace! */
.footer {
  margin: 10px;
}
```

*Fix:*
```css
.card {
  color: blue;
}
.footer {
  margin: 10px;
}
```

## 5. Practice Exercises

### Exercise 1: Syntax Dissection

**Problem:** In the following line of CSS, what is `margin`?
`margin: 20px;`

**Expected output:**
> [!check]- Answer
> ```text
> `margin` is the Property. (`20px` is the Value. Together they form a Declaration).
> ```
> - The left side of the colon is the "what", the right side is the "how much".
> 
---



### Exercise 2: Deconstructing CSS Ruleset Parts

**Problem:** Identify the 3 parts of `.title { color: red; }`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Selector: .title
> 2. Property: color
> 3. Value: red
> ```
> ```text
> 1. Selector: .title
> 2. Property: color
> 3. Value: red
> ```
>
> **Explanation:** A ruleset consists of a selector and a declaration block `{ property: value; }`.
> 
---

### Exercise 3: Grouping Multiple Selectors

**Problem:** Write a grouped CSS ruleset setting `color: green` on `<h1>`, `<h2>`, and `.highlight` simultaneously.

**Expected output:**
> [!check]- Answer
> ```text
> h1, h2, .highlight { color: green; }
> ```
> ```css
> h1, h2, .highlight {
>   color: green;
> }
> ```
>
> **Explanation:** Comma-separated selectors apply a single declaration block to multiple targets.
> 
## 6. Related Terms
- [Selectors (Element, Class, ID)](selectors.md) — The first part of the ruleset.
- [The Cascade](the_cascade.md) — How the browser decides which ruleset wins if two rulesets conflict.
- [Shorthand vs Longhand Properties](shorthand_longhand.md) — Formatting style parameters compactly.
- [CSS Comments (`/* */`)](comments.md) — Related concept: CSS Comments (`/* */`).
- [CSS (Cascading Style Sheets)](css.md) — Related concept: CSS (Cascading Style Sheets).

---

## 7. Key Takeaways
- A **Ruleset** is the entire block of code (Selector + Declaration Block).
- A **Property** is the feature you want to change (e.g., `color`, `width`).
- A **Value** is the specific setting you apply (e.g., `red`, `100px`).
- Properties and Values are separated by a **colon (`:`)**.
- Every Declaration MUST end with a **semicolon (`;`)**.
