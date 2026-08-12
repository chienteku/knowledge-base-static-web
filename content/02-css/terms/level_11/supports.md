# `@supports` (Feature Queries)

> **Level 11 — Modern CSS Architecture & Functions**
> A CSS at-rule that acts as a feature query, checking if the browser engine supports a specific property-value declaration before applying the wrapped CSS styles, enabling progressive enhancement.

---

## 1. Prerequisites
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — The foundation of conditional at-rule wrappers.
- [Responsive Design (Concept)](../level_08/responsive_design.md) — Designing layout adapters for various environments.

---

## 2. Term Category

**CSS At-Rule (Universal Modern Standard .)**: `@supports` (Feature Queries) is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
CSS evolves rapidly. Amazing new features like CSS Grid, Backdrop Filters, and Container Queries are constantly introduced. 

However, users do not all update their web browsers at the same time. A visitor on your site might be running an older smartphone or an enterprise-locked browser version that doesn't understand these new properties.

If you write CSS using a cutting-edge property and the user's browser doesn't support it, the browser simply ignores that line of code. 

If that property was a structural layout rule (like `display: grid;`), your website's layout will fall apart completely.

Historically, developers had to use heavy JavaScript libraries (like Modernizr) to detect browser features and inject class names.

To solve this, the W3C added **`@supports`**. Natively in CSS, you can query the browser: *"Do you support this property and value? If yes, apply this CSS block. If no, skip it."*

---

### (2) How to use `@supports` (Feature Detection)
The `@supports` rule checks for a specific **property-value combination** (not just the property name):

```css
/* 1. DEFAULT FALLBACK STYLE (Flexbox) */
/* This code runs on all browsers. It serves as our safety net. */
.layout {
  display: flex;
  flex-wrap: wrap;
}

/* 2. THE UPGRADE (CSS Grid) */
/* This block ONLY runs if the browser supports CSS Grid. */
@supports (display: grid) {
  .layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
```

---

### (3) Combining Queries with Logic Operators
You can chain multiple checks together using logical operators:
-   **`and`**: All conditions must be true (e.g. `@supports (display: grid) and (gap: 20px)`).
-   **`or`**: At least one condition must be true.
-   **`not`**: Negate a check (runs only if the feature is **not** supported).
    ```css
    /* Style specifically for browsers that DO NOT support backdrop-filter */
    @supports not (backdrop-filter: blur(10px)) {
      .card {
        background: rgba(0, 0, 0, 0.9); /* Solid fallback background */
      }
    }
    ```

---

### (4) Code Examples

#### Short Snippet
Checking modern display properties:

```css
.card {
  display: block; /* Fallback for ancient browsers */
}

@supports (display: flex) {
  .card {
    display: flex;
    align-items: center;
  }
}
```

#### Fuller Example (Glassmorphism Fallback)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Queries Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 40px;
      min-height: 100vh;
      background-image: linear-gradient(45deg, #00c6ff, #0072ff);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal {
      width: 320px;
      padding: 24px;
      border-radius: 12px;
      color: white;
      text-align: center;
      
      /* 1. DEFAULT STYLE: Translucent dark background (Safe Fallback) */
      background-color: rgba(0, 0, 0, 0.85);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }

    /* 2. UPGRADE: Frosted Glass (Runs only if backdrop-filter works!) */
    @supports (backdrop-filter: blur(10px)) {
      .modal {
        background-color: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    }
  </style>
</head>
<body>

  <div class="modal">
    <h2>Smart fallback card</h2>
    <p>If your browser supports backdrop filters, this card looks like frosted glass. If not, it uses a solid dark overlay to keep the text readable!</p>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting parentheses around the query declaration

**The mistake:** Declaring `@supports display: grid { ... }`.

**Why it's wrong:** The query condition **must** be wrapped in parentheses, and it must contain both a property and a value. Omitting the parentheses is a syntax error, causing the browser to ignore the entire query.

**Fix: Always wrap the query parameter in parentheses: `@supports (display: grid)`.**

---



### Mistake 2: Testing Non-Existent or Unsupported Feature Strings in `@supports`

**The mistake:** Writing `@supports (display: flexbox)` with incorrect property names.

**Why it's wrong:** `@supports` evaluates feature syntax strictly. Testing incorrect property-value syntax causes `@supports` to evaluate to `false`.

*Incorrect:*
```css
@media ... @supports (display: flexbox) { } /* ❌ Incorrect property syntax! */
```

*Fix:*
```css
@supports (display: flex) { ... }
```

### Mistake 3: Forgetting Parentheses Around Condition Arguments in `@supports` Queries

**The mistake:** Writing `@supports display: grid` without parentheses.

**Why it's wrong:** CSS specifications mandate that property-value conditions inside `@supports` MUST be enclosed in parentheses (`@supports (display: grid)`).

*Incorrect:*
```css
@supports display: grid { } /* ❌ Missing parentheses! Syntax error! */
```

*Fix:*
```css
@supports (display: grid) { ... }
```

## 5. Practice Exercises

### Exercise 1: Feature Detection for Modern CSS Subgrid using @supports

**Scenario:** An author uses `@supports` to detect browser support for CSS Grid `subgrid` and provide a fallback grid layout.

**Requirements:**
1. Write baseline fallback grid.
2. Add `@supports (grid-template-columns: subgrid)` enhancement.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Baseline Fallback for older browsers */
> .card-grid {
>   display: grid;
>   grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
> }
>
> /* Progressive Enhancement for browsers supporting CSS Subgrid */
> @supports (grid-template-columns: subgrid) {
>   .card-body {
>     display: grid;
>     grid-template-rows: subgrid;
>     grid-row: span 3;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `@supports` Feature Query**: Tests whether the user's browser supports a specific CSS property-value pair before applying styles.
> 2. **Progressive Enhancement**: Allows developers to use cutting-edge modern CSS features safely without breaking experience on older browsers.
> 3. **Zero JavaScript Feature Sniffing**: Replaces legacy JavaScript feature detection libraries (like Modernizr) with native CSS.
> 
---

### Exercise 2: Feature Detection for backdrop-filter with Opaque Fallback

**Scenario:** Provides a solid fallback color when `backdrop-filter` is unsupported.

**Requirements:**
1. Apply `@supports (backdrop-filter: blur(1px))`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .overlay-header {
>   background-color: #0f172a;    /* Opaque fallback */
> }
>
> @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
>   .overlay-header {
>     background-color: rgb(15 23 42 / 0.8);
>     backdrop-filter: blur(8px);
>     -webkit-backdrop-filter: blur(8px);
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Combining Feature Conditions**: Supports logical operators (`or`, `and`, `not`) inside `@supports` queries.
> 2. **Vendor Prefix Testing**: Tests both standard `backdrop-filter` and `-webkit-backdrop-filter`.
> 3. **Defensive Styling**: Ensures text readability regardless of browser support.
> 
---

### Exercise 3: Negation Feature Query (@supports not)

**Scenario:** Applies alternative fallback styles specifically when a feature is NOT supported using `not`.

**Requirements:**
1. Apply `@supports not (aspect-ratio: 1/1)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Fallback padding hack ONLY for browsers that do NOT support aspect-ratio */
> @supports not (aspect-ratio: 1 / 1) {
>   .square-box {
>     padding-top: 100%;
>     position: relative;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `not` Operator**: Executes CSS rules strictly when the specified CSS feature is unsupported.
> 2. **Targeted Polyfill Styles**: Isolates legacy fallback hacks so modern browsers parse clean code.
> 3. **Maintainable Modern CSS**: Simplifies eventual legacy code removal.
## 6. Related Terms
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Viewport sizing at-rules.
- [Container Queries (`@container`)](container_queries.md) — Component container queries.

---

## 7. Key Takeaways
- `@supports` feature queries test if browser engines support specific CSS properties.
- They are the foundation of Progressive Enhancement: build fallbacks first, then upgrade.
- Always include parentheses around the query (e.g. `(display: grid)`).
- Combine features using logical operators: `and`, `or`, and `not`.
- Feature queries check for property-value compatibility, not just property names.
