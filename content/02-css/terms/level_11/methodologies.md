# CSS Methodologies (BEM, OOCSS, SMACSS)

> **Level 11 — Modern CSS Architecture & Functions**
> Standardized naming conventions and organizational patterns (such as Block-Element-Modifier) designed to prevent class conflicts, keep specificity low, and make CSS codebases scalable and maintainable.

---

## 1. Prerequisites
- [CSS Selectors](../level_01/selectors.md) — Writing target classes.
- [Specificity](../level_01/specificity.md) — Understanding the danger of selector matching weight.

---

## 2. Term Category
- **CSS Architecture**

---

## 3. Environment Context
- **Universal Developer Standard** (A convention governing how class strings are named and structured in HTML templates and stylesheets to avoid global namespace collisions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you write CSS for a simple 1-page website, you can name classes whatever you want. 

But when a project grows to hundreds of pages managed by dozens of developers, writing ad-hoc CSS becomes a disaster:
-   Class names collide (e.g., two developers write different `.title` rules, overriding each other).
-   Selector nesting gets out of control (e.g., `.header .nav ul li .btn span a`), ballooning stylesheet size and creating specificity wars.
-   Developers start adding `!important` to force overrides, breaking cascade logic.

To solve this scaling problem, the community created **CSS Methodologies** — systems of rules for how to structure and name your classes.

---

### (2) BEM (Block, Element, Modifier)
Created by Yandex, BEM is the most widely adopted naming methodology in modern web development. It divides components into three layers:

1.  **Block (`block`)**: A standalone, self-contained layout component that is reusable (e.g. `.card`, `.btn`, `.menu`).
2.  **Element (`block__element`)**: A nested part of a block that has no standalone meaning and is tied to its parent block (uses **double underscores** `__`, e.g. `.card__title`, `.card__button`).
3.  **Modifier (`block--modifier` or `block__element--modifier`)**: A flag used to change the style, state, or theme variation of a block or element (uses **double hyphens** `--`, e.g. `.card--featured`, `.btn--large`, `.btn--disabled`).

```css
/* BEM STYLESHEET STRUCTURE */

/* Block (Low specificity class) */
.card { background-color: white; }

/* Element (Direct style hook, flat hierarchy) */
.card__title { font-size: 1.5rem; }

/* Modifier (Variant) */
.card--featured { border: 2px solid gold; }
```

```html
<!-- HTML IMPLEMENTATION -->
<div class="card card--featured">
  <h2 class="card__title">Featured Item</h2>
</div>
```

---

### (3) OOCSS & SMACSS

#### 1. OOCSS (Object-Oriented CSS)
Coined by Nicole Sullivan, OOCSS focuses on separating **structure** (layout, width, margins) from **skin** (colors, gradients, themes). 
-   Instead of creating unique button styles, you create a generic `.btn` class for size and padding, and combine it with utility classes like `.btn-primary` or `.theme-dark` to paint the colors.

#### 2. SMACSS (Scalable and Modular Architecture)
Created by Jonathan Snook, SMACSS categorizes CSS rules into 5 distinct categories:
1.  **Base:** Default HTML elements reset rules (e.g. `html`, `body`, `p`).
2.  **Layout:** Big grid structures (e.g. `.header`, `.main-grid`).
3.  **Module:** Reusable components (corresponds to BEM Blocks).
4.  **State:** Toggles (e.g. `.is-active`, `.is-collapsed`).
5.  **Theme:** Visual skins.

---

### (4) Code Examples

#### BEM Class Mapping
```css
/* Normal, highly nested CSS (BAD - high specificity, hard to override!) */
.menu ul li a {
  color: black;
}
.menu ul li a:hover {
  color: red;
}

/* BEM alternative (GOOD - flat hierarchy, specificity is 10 everywhere!) */
.menu__link {
  color: black;
}
.menu__link:hover {
  color: red;
}
.menu__link--active {
  color: blue;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Deep nesting BEM names (Grandchildren elements)

**The mistake:** Naming classes by following the exact HTML structure tree down:

```css
/* BAD: Extremely long class names, binds styling rigidly to HTML hierarchy! */
.card__header__title__link {
  color: blue;
}
```

**Why it's wrong:** BEM elements should be kept flat. You should never write grandchildren selectors. An element is always a direct child of the **Block**, even if it is physically nested three layers deep inside the HTML structure.

**Fix: Keep names flat. Use `.card__link` directly, omitting the header/title levels.**

---



### Mistake 2: Violating BEM Naming Conventions by Combining Block-Element-Modifier Delimiters Incorrectly

**The mistake:** Writing `.card_title-active` or `.card--title__active`.

**Why it's wrong:** Standard BEM (Block Element Modifier) methodology uses strictly: `block__element--modifier` (Double Underscore `__` for elements, Double Hyphen `--` for modifiers).

*Incorrect:*
```css
.card-title-active { } /* ❌ Ambiguous BEM naming! */
```

*Fix:*
```css
.card__title--active { } /* Correct BEM: block__element--modifier */
```

### Mistake 3: Over-Nesting BEM Element Selectors (`.card__header__title__text`)

**The mistake:** Writing `.card__header__title__text` for deeply nested elements.

**Why it's wrong:** BEM elements should NEVER be multi-nested (`block__elem1__elem2`). Keep element names flat relative to the Block root (`.card__title-text`).

*Incorrect:*
```css
.card__header__title { } /* ❌ Multi-nested element anti-pattern! */
```

*Fix:*
```css
.card__title { } /* Flat element name relative to Block */
```

## 6. Practice Exercises

### Exercise 1: BEM Refactor

**Problem:** Refactor the following nested CSS ruleset into BEM classes. Assume the component block name is `navbar`.

```css
.navbar { background-color: #333; }
.navbar ul li { display: inline-block; }
.navbar ul li a { color: white; }
.navbar ul li a.active { color: yellow; }
```

**Expected output:**
> [!check]- Answer
> ```css
> .navbar { background-color: #333; }
> .navbar__item { display: inline-block; }
> .navbar__link { color: white; }
> .navbar__link--active { color: yellow; }
> ```
> - The Block name is `navbar`.
> - Identify sub-elements (`item`, `link`) and modifiers (`active`).
> - Use BEM delimiters (`__` for elements, `--` for modifiers) to write classes with single specificity weights.

---



### Exercise 2: BEM Component Deconstruction

**Problem:** Write BEM class names for: Button block (`btn`), Icon element inside button (`btn__icon`), Disabled modifier (`btn--disabled`).

**Expected output:**
> [!check]- Answer
> ```text
> Block: .btn
> Element: .btn__icon
> Modifier: .btn--disabled
> ```
> ```html
> <button class="btn btn--disabled">
>   <svg class="btn__icon"></svg>
>   Submit
> </button>
> ```
>
> **Explanation:** BEM constructs modular, self-documenting CSS class names.

---

### Exercise 3: CSS Methodologies Overview

**Problem:** Match CSS methodology acronym to full name:
1. BEM
2. OOCSS
3. SMACSS

**Expected output:**
> [!check]- Answer
> ```text
> 1. Block Element Modifier
> 2. Object-Oriented CSS
> 3. Scalable and Modular Architecture for CSS
> ```
> ```text
> 1. BEM -> Block Element Modifier
> 2. OOCSS -> Object-Oriented CSS
> 3. SMACSS -> Scalable and Modular Architecture for CSS
> ```
>
> **Explanation:** CSS methodologies establish naming and architectural conventions.

## 7. Related Terms
- [CSS Preprocessors](preprocessors.md) — Tools that help organize BEM naming modules.
- [CSS Reset vs. Normalize](reset_normalize.md) — Base architecture configs.

---

## 8. Key Takeaways
- CSS Methodologies provide standard naming conventions to keep codebases scalable.
- BEM splits components into Blocks, Elements (`__`), and Modifiers (`--`).
- BEM keeps specificity low and constant, avoiding selector overrides.
- Do not nested BEM classes into grandchildren selectors (keep elements flat).
- OOCSS separates structural layouts from aesthetic visual skins.
- SMACSS categorizes rules into Base, Layout, Module, State, and Theme buckets.
