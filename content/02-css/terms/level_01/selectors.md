# Selectors (Element, Class, ID)

> **Level 1 — Core Concepts**
> The patterns used in CSS to target specific HTML elements for styling.

---

## 1. Prerequisites
- [CSS (Cascading Style Sheets)](css.md) — Selectors are the foundation of writing CSS.
- [`id` Attribute](../../../01-html/terms/level_07/id.md) — The HTML attribute targeted by ID selectors.
- [`class` Attribute](../../../01-html/terms/level_07/class.md) — The HTML attribute targeted by Class selectors.

---

## 2. Term Category

**CSS Syntax (Universal Browser Support)**: Selectors (Element, Class, ID) is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When you write a CSS file, you are essentially yelling instructions into the void: "Make the background blue! Make the font size 20px!" But the browser needs to know *what* you want to style. 
The W3C created **Selectors** so developers could precisely target elements in the HTML tree. 
There are three primary selectors every developer must master:
1. **Element Selector**: Targets every instance of a specific HTML tag (e.g., all `<p>` tags).
2. **Class Selector (`.`)**: Targets any element that has a specific `class` attribute. Classes can be reused on multiple elements.
3. **ID Selector (`#`)**: Targets the one single element that has a specific `id` attribute. IDs must be perfectly unique on the page.

### (2) Reality Metaphor
Imagine a massive high school. The principal gets on the loudspeaker to give instructions (CSS).
- **Element Selector**: "All *Teachers*, report to the gym." (Targets a broad category).
- **Class Selector**: "All *Varsity Athletes*, report to the gym." (Targets a specific group that spans across multiple grades and roles).
- **ID Selector**: "Will *John Doe in 9th Grade*, report to the principal's office." (Targets one strictly unique individual).

### (3) Code Examples

#### Short Snippet
```css
/* 1. Element Selector (Targets all <h1> tags) */
h1 { color: black; }

/* 2. Class Selector (Notice the dot! Targets class="alert") */
.alert { color: red; }

/* 3. ID Selector (Notice the hashtag! Targets id="submit-btn") */
#submit-btn { background-color: blue; }
```

#### Fuller Example
```html
<!-- HTML -->
<h2 class="title">Welcome</h2>
<p class="highlight">This is a paragraph.</p>
<span class="highlight">This is a span.</span>
<button id="main-action">Click Me</button>
```

```css
/* CSS */

/* Targets the h2 specifically */
h2 {
  font-size: 2rem;
}

/* Targets BOTH the <p> and the <span> because they share the class */
.highlight {
  background-color: yellow;
}

/* Targets ONLY the single button with this exact ID */
#main-action {
  border-radius: 8px;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the dot (`.`) or hash (`#`) in CSS

**The mistake:** Writing `alert { color: red; }` in CSS when trying to target `<div class="alert">`.

**Why it's wrong:** If you omit the dot, CSS thinks you are using an Element Selector! It will search the entire HTML document for a custom tag literally called `<alert>`, which doesn't exist. You must prepend a dot (`.`) to tell the browser to look for a `class` attribute, or a hash (`#`) for an `id`.

*Incorrect:*
```css
/* The browser looks for a <card> tag! */
card { background-color: white; }
```

*Fix:*
```css
/* The browser looks for class="card" */
.card { background-color: white; }
```

---



### Mistake 2: Confusing Class Selectors (`.name`) with ID Selectors (`#name`)

**The mistake:** Writing `.header` to target `<div id="header">`.

**Why it's wrong:** Dot `.` selects CSS class names; hash `#` selects unique ID attributes. Mismatching prefix symbols fails to target elements.

*Incorrect:*
```css
/* HTML: <div id="main"> */
.main { color: red; } /* ❌ Dot selector fails to match ID! */
```

*Fix:*
```css
/* HTML: <div id="main"> */
#main { color: red; } /* Hash selector matches ID */
```

### Mistake 3: Confusing Descendant Selectors (`div p`) with Child Selectors (`div > p`)

**The mistake:** Using `div > p` expecting to select deeply nested paragraphs.

**Why it's wrong:** Child selector `>` targets ONLY immediate direct children. Descendant space selector ` ` targets paragraphs at ANY depth level inside the container.

*Incorrect:*
```css
div > p { color: blue; } /* ❌ Misses <p> nested inside <article>! */
```

*Fix:*
```css
div p { color: blue; } /* Selects all descendant paragraphs at any depth */
```

## 5. Practice Exercises

### Exercise 1: Reading Selectors

**Problem:** Based on the following CSS, what HTML attribute is the developer trying to target?
```css
#hero-image { width: 100%; }
```

**Expected output:**
> [!check]- Answer
> ```text
> An `id` attribute! The `#` symbol indicates an ID selector. The HTML would look like `<img id="hero-image" src="...">`.
> ```
> - Does it start with a dot, a hash, or a letter?
> 
---



### Exercise 2: Basic Selector Syntax Matrix

**Problem:** Match target HTML element to selector syntax:
1. Element `<button>` (`button`)
2. Class `<div class="card">` (`.card`)
3. ID `<div id="app">` (`#app`)
4. Universal selector (`*`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. button
> 2. .card
> 3. #app
> 4. *
> ```
> ```text
> 1. button -> Type selector
> 2. .card -> Class selector
> 3. #app -> ID selector
> 4. * -> Universal selector
> ```
>
> **Explanation:** CSS selectors target elements by tag name, class, ID, or universal patterns.
> 
---

### Exercise 3: Chaining Multiple Class Selectors

**Problem:** Write CSS selector targeting an element that has BOTH `btn` AND `primary` classes (`<button class="btn primary">`).

**Expected output:**
> [!check]- Answer
> ```text
> .btn.primary { color: white; }
> ```
> ```css
> .btn.primary {
>   color: white;
> }
> ```
>
> **Explanation:** Chaining class selectors without spaces (`.btn.primary`) targets elements possessing all listed classes.
> 
## 6. Related Terms
- [Specificity](specificity.md) — What happens when an Element selector and a Class selector both try to style the exact same element?
- [Ruleset (Declaration, Property, Value)](ruleset.md) — The curly braces and properties that come immediately *after* the selector.
- [Inheritance](inheritance.md) — How properties fall back to parent element style selectors.
- [CSS (Cascading Style Sheets)](css.md) — Related concept: CSS (Cascading Style Sheets).
- [Combinator Selectors](../level_11/combinators.md) — Selector combinators.
- [Attribute Selectors](../level_11/attribute_selectors.md) — Attribute selectors.

---

## 7. Key Takeaways
- Selectors define *which* HTML elements your CSS rules apply to.
- **Element selectors** (e.g., `p`) target all tags of that type.
- **Class selectors** (e.g., `.btn`) start with a dot and target `class` attributes. This is the most common way to style websites!
- **ID selectors** (e.g., `#header`) start with a hash and target the strictly unique `id` attribute.
