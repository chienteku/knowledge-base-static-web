# CSS Preprocessors (Sass & SCSS)

> **Level 11 — Modern CSS Architecture & Functions**
> Build-time compilation tools (such as Sass/SCSS) that extend standard CSS with programming features like nested selectors, mixins, math functions, and compilation-level variables before generating native CSS files.

---

## 1. Prerequisites
- [`var()` (CSS Custom Properties)](var.md) — Dynamic browser variables.
- [`@import` Rule](import.md) — Bundling modular styles.

---

## 2. Term Category
- **CSS Architecture / Build Tool**

---

## 3. Environment Context
- **Universal Developer Standard** (Pre-compiled. Browser engines cannot parse preprocessor syntaxes directly; SCSS code must run through a compiler like Dart Sass before production deployment).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Plain CSS is not a programming language; it is a stylesheet sheet. This means it lacks basic programming tools:
-   You cannot nest selectors (forcing you to repeat long parent strings like `.card`, `.card h2`, `.card p` over and over).
-   You cannot bundle files together without forcing the user to download them via slow HTTP requests.
-   You cannot reuse blocks of styling properties (macros) with different arguments.

As web applications grew in size, writing plain CSS became exhausting. 

To solve this, developers created **CSS Preprocessors** (with **Sass/SCSS** being the industry standard). 

A preprocessor lets you write clean code using nesting, macros, and variables, then compiles it into a standard, compressed CSS file that all browsers can read.

---

### (2) Key SCSS Features

#### 1. Nesting (Matched structures)
SCSS allows you to nest child rules inside parent rules, mirroring your HTML hierarchy. 

Use the **`&`** operator to reference the parent selector (extremely useful for BEM naming!):

```scss
/* SCSS Source */
.button {
  padding: 10px 20px;
  background-color: blue;

  &:hover {
    background-color: darkblue; /* Generates .button:hover */
  }

  &--large {
    padding: 15px 30px; /* Generates .button--large */
  }
}
```

#### 2. Preprocessor Variables ($) vs. CSS Variables (`--`)
-   **SCSS Variables (`$primary: blue;`)**: Compiled at build time. They disappear completely from the final CSS file, replaced by their raw values. They are fast, but static.
-   **CSS Custom Properties (`--primary: blue;`)**: Evaluated at runtime by the browser. They remain in the CSS file, can be modified using JavaScript, and respect DOM inheritance.

#### 3. Mixins (Styling Functions)
Mixins (`@mixin`) define reusable blocks of styles that can accept arguments:

```scss
/* Declare a center-flex mixin with variable spacing */
@mixin center-flex($gap: 10px) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $gap;
}

/* Use the mixin */
.navbar {
  @include center-flex(20px);
}
```

---

### (3) Code Examples

#### Compilation Comparison

```scss
/* 1. SCSS SOURCE FILE (style.scss) */
$primary-color: #ff007f;

.card {
  background-color: white;
  border-radius: 8px;

  .card__title {
    color: $primary-color;
  }
}
```

```css
/* 2. COMPILED CSS OUTPUT FILE (style.css) */
.card {
  background-color: white;
  border-radius: 8px;
}
.card .card__title {
  color: #ff007f;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Deep nesting selectors ("The Inception Rule")

**The mistake:** Nesting rules 5 or 6 layers deep in your SCSS file:

```scss
/* BAD: Compiles to massive, slow, overly-specific selectors! */
.nav {
  ul {
    li {
      a {
        span {
          color: red; /* Compiles to: .nav ul li a span */
        }
      }
    }
  }
}
```

**Why it's wrong:** Deep nesting creates highly specific, long selectors that slow down browser rendering, increase file size, and make it impossible to override styles later without resorting to `!important`.

**Fix: Follow the "3-Level Nesting Rule". Never nest selectors more than 3 levels deep in SCSS.**

---



### Mistake 2: Deeply Over-Nesting Selectors in Sass/SCSS (The 'Nesting Trap')

**The mistake:** Nesting CSS selectors 6 levels deep in SCSS (`nav ul li a span svg`).

**Why it's wrong:** Deep nesting compiles into hyper-specific CSS selectors (`nav ul li a span svg`), ruining CSS specificity architecture and making overrides impossible. Limit nesting depth to max 3 levels.

*Incorrect:*
```css
/* SCSS: nav { ul { li { a { span { color: red; } } } } } */
```

*Fix:*
```css
/* SCSS: .nav-link-text { color: red; } */
```

### Mistake 3: Using Sass Variables (`$bg-color`) When Native CSS Variables (`var(--bg-color)`) Are Needed

**The mistake:** Using Sass `$color: blue` for runtime JavaScript or dark mode theme switching.

**Why it's wrong:** Sass variables are compiled into static strings at build time and DO NOT exist in the browser runtime DOM. Use native CSS Custom Properties (`var(--color)`) for dynamic runtime changes.

*Incorrect:*
```css
/* Sass $variables cannot be changed dynamically via JS in browser DOM */
```

*Fix:*
```css
/* Use native CSS custom properties for dynamic runtime themes: */
:root { --brand-color: #005fcc; }
```

## 6. Practice Exercises

### Exercise 1: SCSS BEM Nesting

**Problem:** Rewrite the following plain CSS block into nested SCSS format using the parent reference operator (`&`).

```css
.card { padding: 20px; }
.card__header { font-weight: bold; }
.card__header:hover { color: red; }
```

**Expected output:**
> [!check]- Answer
> ```scss
> .card {
>   padding: 20px;
> 
>   &__header {
>     font-weight: bold;
> 
>     &:hover {
>       color: red;
>     }
>   }
> }
> ```
> - Nest the `__header` class inside `.card`.
> - Use the parent reference operator `&` to join the strings together.
> - Nest the `:hover` rule inside `__header`.

---



### Exercise 2: Sass Parent Selector & BEM Pattern

**Problem:** Write SCSS using parent selector `&` to generate `.btn` and `.btn--active` modifier.

**Expected output:**
> [!check]- Answer
> ```text
> .btn { color: red; &--active { color: blue; } }
> ```
> ```scss
> .btn {
>   color: red;
>   &--active {
>     color: blue;
>   }
> }
> ```
>
> **Explanation:** Parent selector `&` concatenates parent BEM class prefixes in SCSS.

---

### Exercise 3: Sass vs Native CSS Features

**Problem:** List 2 features historically requiring Sass preprocessors that are now natively supported in modern CSS.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Native CSS Variables (var())
> 2. Native CSS Nesting (& selector)
> (or calc(), color functions)
> ```
> ```text
> 1. Native CSS Variables (var())
> 2. Native CSS Nesting (& selector)
> ```
>
> **Explanation:** Modern CSS specifications natively adopt core preprocessor capabilities.

## 7. Related Terms
- [`@import` Rule](import.md) — Bundling modular styles.
- [CSS Methodologies (BEM, OOCSS, SMACSS)](methodologies.md) — Component naming schemes.

---

## 8. Key Takeaways
- CSS preprocessors extend CSS with nesting, variables, and mixins.
- SCSS is a strict superset of CSS (standard CSS is valid SCSS).
- Preprocessor code must compile into standard CSS before loading in browsers.
- Nesting makes stylesheets match HTML structures, but avoid nesting deeper than 3 levels.
- SCSS variables (`$`) compile at build time; CSS custom properties (`--`) evaluate at runtime.
- Mixins (`@mixin` / `@include`) act as reusable styling blocks that accept arguments.
