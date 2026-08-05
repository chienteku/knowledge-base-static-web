# `var()` (CSS Custom Properties)

> **Level 11 — Modern CSS Architecture & Functions**
> The native CSS feature that allows developers to save a value (like a specific color or size) once, and reuse it hundreds of times across their entire codebase.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — You must understand how to target elements to understand the `:root` selector.
- [The Cascade](../level_01/the_cascade.md) — Variables respect the cascade, meaning they can be overwritten!

---

## 2. Term Category
- **CSS Function / Architecture**

---

## 3. Environment Context
- **Universal Modern Standard** (The foundation of Dark Mode and modern "Design Systems").

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a website for a brand whose primary color is `rgb(25, 118, 210)`. You use this exact color code 500 times across 50 different CSS files (for buttons, links, borders, backgrounds). 
A year later, the brand rebrands to a slightly lighter blue. You now have to manually find and replace that color code 500 times.
The W3C created **CSS Custom Properties (Variables)** to solve this. You define the color *once* at the very top of your document, give it a name like `--primary-color`, and then use the **`var()`** function everywhere else. If the brand changes their color, you update the variable in ONE place, and the entire website instantly updates.

### (2) Reality Metaphor
Imagine a massive restaurant franchise with 1,000 locations. 
Instead of sending a letter to every single location telling them "The soup of the day is Tomato," headquarters writes "Tomato" on a central digital whiteboard. Every restaurant looks at the whiteboard (`var(--soup-of-the-day)`). When headquarters changes the whiteboard to "Chicken Noodle," all 1,000 restaurants instantly serve Chicken Noodle.

### (3) Code Examples

#### The `root` Definition and Usage
Variables in CSS MUST start with two dashes (`--`). They are typically defined on the `:root` pseudo-class, which is essentially the `<html>` tag, so they are available to every single element on the page.

```css
/* 1. Define the Variables */
:root {
  --primary-color: #3498db;
  --spacing-large: 2rem;
  --border-radius-default: 8px;
}

/* 2. Use the Variables */
.btn-primary {
  /* The browser swaps var() for the actual value! */
  background-color: var(--primary-color);
  padding: var(--spacing-large);
  border-radius: var(--border-radius-default);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Double Dashes

**The mistake:** Writing `primary-color: #3498db;` and trying to use `var(primary-color)`.

**Why it's wrong:** CSS has hundreds of built-in properties (like `color`, `width`, `margin`). If you could just name a variable `color`, the browser wouldn't know if you meant your custom variable or the built-in text color property! The W3C mandated that **all custom variables must begin with `--`** so the browser instantly knows it is a custom developer variable.

### Mistake 2: Not providing a Fallback

**The mistake:** `color: var(--my-text-color);` (but you accidentally deleted the variable definition).

**Why it's wrong:** If the browser can't find the variable, the CSS rule breaks and does nothing. You can provide a **fallback** as a second argument! 
`color: var(--my-text-color, black);` — "Use the variable, but if it doesn't exist, use black instead."

---



### Mistake 3: Forgetting `var()` Function Wrapper When Consuming CSS Custom Properties

**The mistake:** Writing `color: --primary-color;` without `var()`.

**Why it's wrong:** CSS custom properties MUST be consumed using the `var(--property-name)` function wrapper. Writing `--primary-color` directly is invalid property syntax.

*Incorrect:*
```css
button { color: --brand-color; } /* ❌ Missing var() function wrapper! */
```

*Fix:*
```css
button { color: var(--brand-color); }
```

### Mistake 4: Omitting Fallback Values in `var()` for Undefined Custom Properties

**The mistake:** Writing `color: var(--theme-color);` without a secondary fallback value.

**Why it's wrong:** If `--theme-color` is undefined, the property evaluates to invalid at computed-value time. Add a 2nd argument fallback: `var(--theme-color, #005fcc)`.

*Incorrect:*
```css
color: var(--undefined-color); /* Resolves to invalid if variable missing */
```

*Fix:*
```css
color: var(--undefined-color, #005fcc); /* Fallback color provided */
```

## 6. Practice Exercises

### Exercise 1: Dark Mode Magic

**Problem:** How does `var()` make implementing Dark Mode incredibly easy?

**Expected output:**
> [!check]- Answer
> ```text
> Because variables respect the Cascade! 
> You define `--bg-color: white;` and `--text-color: black;` in `:root`.
> You can then write a media query for Dark Mode (`@media (prefers-color-scheme: dark)`), and simply RE-DEFINE the variables to `--bg-color: black;` and `--text-color: white;`. The entire website will instantly swap colors without you having to write any new CSS for your actual elements!
> ```
> - Can you overwrite variables using media queries?

---



### Exercise 2: Consuming CSS Custom Property with Fallback

**Problem:** Write CSS `background-color` consuming variable `--accent` with fallback `#005fcc`.

**Expected output:**
> [!check]- Answer
> ```text
> background-color: var(--accent, #005fcc);
> ```
> ```css
> .btn {
>   background-color: var(--accent, #005fcc);
> }
> ```
>
> **Explanation:** `var(--name, fallback)` consumes custom properties with default fallbacks.

---

### Exercise 3: Updating Custom Properties in JavaScript

**Problem:** Write JavaScript line updating root custom property `--primary-color` to `'#6200ee'`. 

**Expected output:**
> [!check]- Answer
> ```text
> document.documentElement.style.setProperty('--primary-color', '#6200ee');
> ```
> ```javascript
> document.documentElement.style.setProperty('--primary-color', '#6200ee');
> ```
>
> **Explanation:** `setProperty()` modifies live DOM CSS custom variables dynamically in runtime.

## 7. Related Terms
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Overwriting variables inside media queries for responsive layouts.
- [`:root` Pseudo-class](root_pseudo_class.md) — The global scope selector where custom properties are declared.
- [Dark Mode (`prefers-color-scheme`)](dark_mode.md) — Custom property theme swaps.
- [`calc()`](calc.md) — Related concept: `calc()`.

---

## 8. Key Takeaways
- Custom Properties (Variables) must begin with `--`.
- Define them globally on the `:root` selector.
- Access them using the `var(--variable-name)` function.
- They are the ultimate tool for maintainability, themeing, and Dark Mode.
