# `var()` (CSS Custom Properties)

> **Level 11 — Modern CSS Architecture & Functions**
> The native CSS feature that allows developers to save a value (like a specific color or size) once, and reuse it hundreds of times across their entire codebase.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — You must understand how to target elements to understand the `:root` selector.
- [The Cascade](../level_01/the_cascade.md) — Variables respect the cascade, meaning they can be overwritten!

---

## 2. Term Category

**CSS Function / Architecture (Universal Modern Standard .)**: `var()` (CSS Custom Properties) is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic Component Styling using CSS var Custom Properties

**Scenario:** An author styles a reusable alert card component using CSS `var()` custom properties.

**Requirements:**
1. Define CSS variable `--alert-color: #2563eb`.
2. Apply `background-color: var(--alert-color)`.
3. Override variable on modifier classes.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .alert-box {
>   --alert-bg: #f8fafc;
>   --alert-border: #cbd5e1;
>   --alert-text: #0f172a;
>
>   background-color: var(--alert-bg);
>   border-left: 4px solid var(--alert-border);
>   color: var(--alert-text);
>   padding: 1rem 1.5rem;
>   border-radius: 0.375rem;
> }
>
> /* Variant Overrides: Simply update variable values! */
> .alert-box--danger {
>   --alert-bg: #fef2f2;
>   --alert-border: #ef4444;
>   --alert-text: #991b1b;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `var()` Function**: Evaluates and inserts the value of a CSS custom property (e.g. `var(--alert-bg)`).
> 2. **Scoped Variable Overrides**: Component variants modify variable tokens locally without duplicating all structural CSS declarations!
> 3. **Dynamic DOM Inheritance**: CSS variables cascade down the DOM tree, reacting to scope changes and media queries dynamically.
> 
---

### Exercise 2: Defining Fallback Values in var Shorthand

**Scenario:** Provides a fallback default value inside `var()` in case a variable is undefined.

**Requirements:**
1. Apply `var(--color-primary, #2563eb)` with fallback.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .btn-primary {
>   /* Fallback: Uses #2563eb if --color-primary is not defined */
>   background-color: var(--color-primary, #2563eb);
>   color: var(--color-text, #ffffff);
> }
> ```
>
> #### Technical Explanation
>
> 1. **`var()` Fallback Parameter**: The second argument inside `var(name, fallback)` specifies a fallback default value used if the custom property is missing.
> 2. **Component Library Safety**: Prevents broken invisible components when custom theme variables are omitted in project configurations.
> 3. **Nested Fallbacks**: Supports nested fallbacks (`var(--a, var(--b, red))`).
> 
---

### Exercise 3: Context-Aware Property Overrides via CSS Variable Inheritance

**Scenario:** Demonstrates how CSS variables inherit and update contextually within nested DOM structures.

**Requirements:**
1. Demonstrate variable scoping inside `.dark-section`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .section {
>   --card-bg: #ffffff;
>   --card-text: #1e293b;
> }
>
> .section--dark {
>   --card-bg: #0f172a;
>   --card-text: #f8fafc;
> }
>
> /* Cards inside .section--dark automatically adopt dark theme variables! */
> .card {
>   background-color: var(--card-bg);
>   color: var(--card-text);
> }
> ```
>
> #### Technical Explanation
>
> 1. **Contextual Variable Inheritance**: Nested components inherit CSS variable values from their nearest ancestor container.
> 2. **Zero Component Duplication**: Cards render correctly in light or dark sections without writing separate `.section--dark .card` rules.
> 3. **Architectural Elegance**: The cleanest pattern for building complex design systems.
## 6. Related Terms
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Overwriting variables inside media queries for responsive layouts.
- [`:root` Pseudo-class](root_pseudo_class.md) — The global scope selector where custom properties are declared.
- [Dark Mode (`prefers-color-scheme`)](dark_mode.md) — Custom property theme swaps.
- [`calc()`](calc.md) — Related concept: `calc()`.

---

## 7. Key Takeaways
- Custom Properties (Variables) must begin with `--`.
- Define them globally on the `:root` selector.
- Access them using the `var(--variable-name)` function.
- They are the ultimate tool for maintainability, themeing, and Dark Mode.
