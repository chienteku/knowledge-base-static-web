# `:root` Pseudo-class

> **Level 11 — Modern CSS Architecture & Functions**
> The CSS pseudo-class that targets the highest-level parent element in the document tree (the `<html>` element in web pages), serving as the standard global scope location for defining CSS variables.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — Target elements in the document.
- [`var()` (CSS Custom Properties)](var.md) — The variables stored inside `:root`.

---

## 2. Term Category

**CSS Pseudo-class (Universal Modern Standard .)**: `:root` Pseudo-class is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern CSS, variables (`--variable-name`) allow you to store theme colors, spacing units, and font sizes in one place. But for a variable to be usable by *any* element on your website, it must be declared at the highest possible parent element so it can inherit down to all children.

While you *could* declare variables on the `html` selector, the W3C introduced the **`:root`** pseudo-class for two specific architectural reasons:

1.  **Higher Specificity:** `:root` is a pseudo-class (specificity weight of 10), which gives it higher priority than the tag selector `html` (specificity weight of 1). This ensures theme variables are harder to accidentally override.
2.  **XML/SVG Compatibility:** `:root` represents the root element of *any* document type. In an XML or SVG file, there is no `<html>` element, but `:root` still targets the highest-level tag, making your variables portable.

---

### (2) Declaring and Using `:root` Variables
By placing variables inside `:root`, you make them globally accessible:

```css
/* 1. DECLARE GLOBALLY */
:root {
  --primary-color: #58a6ff;
  --main-padding: 1.5rem;
}

/* 2. ACCESS ANYWHERE */
.card {
  padding: var(--main-padding);
  border-left: 4px solid var(--primary-color);
}
```

---

### (3) Code Examples

#### Short Snippet
Theme overrides on specific components:

```css
:root {
  --theme-color: blue;
}

/* You can override root variables inside specific containers! */
.admin-panel {
  --theme-color: red; /* Child items inside .admin-panel now use red! */
}
```

#### Fuller Example (Global Theme Configuration)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>:root Variables Demo</title>
  <style>
    /* GLOBAL VARIABLE STORAGE */
    :root {
      --bg-color: #f0f2f5;
      --card-bg: #ffffff;
      --text-color: #1c1e21;
      --accent: #1877f2;
      --radius: 8px;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: sans-serif;
      margin: 40px;
    }

    .container {
      max-width: 400px;
      margin: 0 auto;
    }

    .profile-card {
      background-color: var(--card-bg);
      padding: 24px;
      border-radius: var(--radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-top: 5px solid var(--accent);
    }

    .btn {
      background-color: var(--accent);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: var(--radius);
      cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="profile-card">
      <h2>John Doe</h2>
      <p>This profile card styles its borders, background, and button colors using global variables defined inside the :root pseudo-class.</p>
      <button class="btn">Connect</button>
    </div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `:root` and `body` for variable declaration

**The mistake:** Declaring layout variables (like custom grid settings or theme overrides) on the `body` tag:

```css
/* BAD: Variables aren't accessible to elements outside the <body> (like <html>) */
body {
  --main-color: red;
}
```

**Why it's wrong:** The `body` tag is not the highest element in the DOM tree. If you declare variables on `body`, they are not available to style the `html` root background or handle early head script animations.

**Fix: Always define global CSS variables inside the `:root` block.**

---



### Mistake 2: Defining Global CSS Custom Variables on `body` Instead of `:root`

**The mistake:** Writing `body { --primary-color: #005fcc; }` for global variables.

**Why it's wrong:** The `:root` pseudo-class targets the top-level `<html>` element, guaranteeing global custom variable availability to ALL DOM elements including `<head>` styles, modals, and portals.

*Incorrect:*
```css
body { --brand: blue; } /* ❌ Variables not available to elements outside body */
```

*Fix:*
```css
:root { --brand: blue; } /* Globally available to entire DOM tree */
```

### Mistake 3: Confusing `:root` Specificity with `html` Type Selector

**The mistake:** Expecting `html { --color: red; }` to override `:root { --color: blue; }`.

**Why it's wrong:** The `:root` pseudo-class has Class-level specificity (`0-1-0`). The `html` type selector has lower Element-level specificity (`0-0-1`). `:root` rules override `html` rules.

*Incorrect:*
```css
html { --color: red; } /* (0-0-1) LOSES to :root (0-1-0) */
```

*Fix:*
```css
:root { --color: red; } /* (0-1-0) Specificity matching */
```

## 5. Practice Exercises

### Exercise 1: Defining Application Global Design System Tokens inside :root

**Scenario:** An author defines global color, typography, and spacing tokens inside the `:root` pseudo-class.

**Requirements:**
1. Define `:root` tokens.
2. Apply `--spacing-unit: 1rem`.
3. Apply tokens to component classes.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Global Design System Tokens */
> :root {
>   --color-primary: #2563eb;
>   --color-primary-hover: #1d4ed8;
>   --color-text-main: #0f172a;
>   --color-surface-bg: #ffffff;
>
>   --font-family-sans: system-ui, -apple-system, sans-serif;
>   --spacing-base: 1rem;
>   --radius-card: 0.5rem;
> }
>
> body {
>   font-family: var(--font-family-sans);
>   color: var(--color-text-main);
>   background-color: var(--color-surface-bg);
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `:root` Pseudo-Class**: Selects the highest-level element in the document tree (the `<html>` element in HTML documents).
> 2. **Global CSS Custom Properties**: The standard location to define global CSS design tokens (`--color-primary`) accessible throughout the entire document.
> 3. **Specificity Supremacy**: `:root` has pseudo-class specificity `(0,1,0)`, which is higher than the `html` element selector `(0,0,1)`.
> 
---

### Exercise 2: Specificity Hierarchy: :root vs html Selector

**Scenario:** Demonstrates why `:root` overrides `html` selector declarations.

**Requirements:**
1. Compare `:root` specificity `(0,1,0)` vs `html` `(0,0,1)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Specificity (0,0,1) */
> html {
>   --theme-color: red;
> }
>
> /* Specificity (0,1,0) - WINS THE CASCADE! */
> :root {
>   --theme-color: blue;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Pseudo-Class Specificity**: `:root` is a pseudo-class, giving it a specificity score of `(0,1,0)`.
> 2. **Element Specificity**: `html` is an element tag selector with a specificity score of `(0,0,1)`.
> 3. **Cascading Precedence**: Tokens defined in `:root` override tokens defined in `html` regardless of declaration order.
> 
---

### Exercise 3: Dynamic Runtime Theme Token Swapping via JavaScript

**Scenario:** Updates `:root` custom properties dynamically using `document.documentElement.style.setProperty()`.

**Requirements:**
1. Demonstrate JS runtime variable modification.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // Dynamically update primary brand color token at runtime!
> document.documentElement.style.setProperty('--color-primary', '#10b981');
> ```
>
> #### Technical Explanation
>
> 1. **Runtime JavaScript Mutation**: CSS variables in `:root` can be read and mutated dynamically in real time via JavaScript.
> 2. **Instant Global Theme Updates**: Changing a single `:root` variable instantly updates every component using `var(--color-primary)` across the entire page.
> 3. **Zero Repaint Overhead**: Highly efficient for user theme customizers and brand color pickers.
## 6. Related Terms
- [`var()` (CSS Custom Properties)](var.md) — The variables stored inside `:root`.
- [Dark Mode (`prefers-color-scheme`)](dark_mode.md) — Overwriting `:root` values.

---

## 7. Key Takeaways
- `:root` targets the highest-level element in the document (the `<html>` tag).
- It is the standard global storage area for CSS custom properties (variables).
- `:root` has a higher specificity weight than the standard `html` tag selector.
- Declaring variables globally on `:root` makes them accessible to all child elements.
- You can override root variables locally inside specific containers or media queries.
