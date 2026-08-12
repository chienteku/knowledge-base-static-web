# `repeat()` Function

> **Level 6 — Layouts — CSS Grid**
> A CSS function used within grid template definitions to repeat track size patterns, reducing code redundancy and keeping layout code clean.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent blueprint properties where `repeat()` is declared.
- [`fr` Unit (Fractional Unit)](fr_unit.md) — The dynamic unit commonly repeated.

---

## 2. Term Category

**CSS Function (Universal Modern Standard .)**: `repeat()` Function is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to build a simple three-column grid, writing `grid-template-columns: 1fr 1fr 1fr;` is easy.

But what if you are building a professional web app dashboard, or a complex magazine layout, which requires a **12-column or 24-column layout grid**?

Writing this:
`grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;`

...is tedious, looks messy, and is hard to scan. 

To keep CSS code **DRY (Don't Repeat Yourself)**, the W3C introduced the **`repeat()`** helper function. 

It is a shorthand loop tool. It tells the browser: "take this track pattern, and repeat it X times for me."

---

### (2) Function Syntax
The function takes two parameters, separated by a comma:

`repeat([count], [pattern]);`

-   **`count`**: How many times you want to repeat the size (must be a positive integer, or one of the special keywords like `auto-fill` detailed in Term #59).
-   **`pattern`**: The size, unit, or combination of sizes you want to repeat.

---

### (3) Advanced Patterns
You can mix and match `repeat()` with normal sizing units, or repeat complex multi-track sequences:

-   **Simple Repeat**: `repeat(12, 1fr)` (Creates 12 equal columns).
-   **Mixed Layout**: `200px repeat(3, 1fr) 50px` (Draws a `200px` sidebar, three equal `1fr` content columns, and a `50px` edge spacer).
-   **Track Pattern Repeat**: `repeat(2, 1fr 2fr)` (Repeats the double-column sequence `1fr 2fr` twice, resulting in: `1fr 2fr 1fr 2fr`).

---

### (4) Code Examples

#### Short Snippet
A clean 12-column grid:

```css
.bootstrap-style-grid {
  display: grid;
  /* Expands to 12 equal columns */
  grid-template-columns: repeat(12, 1fr); 
  gap: 10px;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Repeat Function Demo</title>
  <style>
    .grid-container {
      display: grid;
      /* Pattern: 1 column of 80px, followed by 3 columns of 1fr. 
         Equivalent to: 80px 1fr 1fr 1fr; */
      grid-template-columns: 80px repeat(3, 1fr);
      gap: 15px;
      background-color: #f5f5f5;
      padding: 15px;
    }

    .item {
      background-color: cadetblue;
      color: white;
      padding: 20px;
      text-align: center;
      font-weight: bold;
    }

    .sidebar {
      background-color: darkslategrey;
    }
  </style>
</head>
<body>

  <div class="grid-container">
    <div class="item sidebar">Menu</div>
    <div class="item">Card 1</div>
    <div class="item">Card 2</div>
    <div class="item">Card 3</div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `repeat()` for non-grid values

**The mistake:** Declaring `repeat()` on margins, paddings, or font sizes:

```css
/* BAD: Invalid CSS! repeat() only works on grid-template rules */
.box {
  margin: repeat(4, 10px); 
}
```

**Why it's wrong:** The `repeat()` function is a specialized tool parsed exclusively by the CSS Grid layout engine. Normal properties like margins do not recognize it and will discard the style instruction completely.

---



### Mistake 2: Nesting `repeat()` Functions Inside Another `repeat()` Function

**The mistake:** Writing `grid-template-columns: repeat(2, repeat(3, 1fr));`.

**Why it's wrong:** CSS Grid specifications forbid nesting `repeat()` functions inside another `repeat()` call.

*Incorrect:*
```css
/* ❌ Illegal nested repeat functions! */
grid-template-columns: repeat(2, repeat(3, 1fr));
```

*Fix:*
```css
grid-template-columns: repeat(6, 1fr);
```

### Mistake 3: Using `auto-fill` with Fixed Track Lists Containing Multiple `fr` Units

**The mistake:** Writing `grid-template-columns: repeat(auto-fill, 1fr 2fr);`.

**Why it's wrong:** `auto-fill` and `auto-fit` require at least one track dimension to be a fixed length (`px`, `rem`) or `minmax()` with fixed minimums. Pure `fr` units cause calculation failure.

*Incorrect:*
```css
/* ❌ Cannot calculate auto-fill track count with pure fr units! */
grid-template-columns: repeat(auto-fill, 1fr 2fr);
```

*Fix:*
```css
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
```

## 5. Practice Exercises

### Exercise 1: Simplifying Uniform Multi-Column Definitions with repeat

**Scenario:** An author defines a 12-column grid layout cleanly using the `repeat()` notation.

**Requirements:**
1. Apply `grid-template-columns: repeat(12, 1fr)`.
2. Add `gap: 1rem`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .grid-12-col {
>   display: grid;
>   grid-template-columns: repeat(12, 1fr); /* Expands to 12 equal 1fr columns! */
>   gap: 1rem;
> }
>
> .span-8 { grid-column: span 8; }
> .span-4 { grid-column: span 4; }
> ```
>
> #### Technical Explanation
>
> 1. **The `repeat()` Function**: Shorthand syntax for defining repetitive grid track patterns without writing out identical values.
> 2. **12-Column Grid System**: `repeat(12, 1fr)` creates a standard 12-column responsive layout system.
> 3. **DRY CSS Architecture**: Replaces writing `1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr` manually.
> 
---

### Exercise 2: Combining Fixed Pattern Repeats

**Scenario:** Defines a repeating pattern of alternating column widths using `repeat(3, 1fr 2fr)`.

**Requirements:**
1. Apply `grid-template-columns: repeat(3, 1fr 2fr)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .pattern-grid {
>   display: grid;
>   /* Pattern expands to: 1fr 2fr 1fr 2fr 1fr 2fr (6 total columns) */
>   grid-template-columns: repeat(3, 1fr 2fr);
>   gap: 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Value Repeat Patterns**: `repeat(COUNT, PATTERN)` accepts multi-track patterns (e.g. `repeat(3, 1fr 2fr)`).
> 2. **Complex Layout Grids**: Ideal for complex magazine or dashboard layout grids.
> 3. **Code Legibility**: Keeps complex grid track declarations readable.
> 
---

### Exercise 3: Responsive Auto-Repeats with repeat(auto-fit, minmax(20rem, 1fr))

**Scenario:** Combines `repeat()`, `auto-fit`, and `minmax()` for fluid responsive grid galleries.

**Requirements:**
1. Apply `grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .gallery-grid {
>   display: grid;
>   grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
>   gap: 1.5rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The Responsive Trifecta**: Combining `repeat()`, `auto-fit`, and `minmax()` is the most powerful responsive layout pattern in modern CSS.
> 2. **No Breakpoint Maintenance**: Calculates optimal column counts dynamically based on container width.
> 3. **Production Standard**: The gold standard pattern for component card galleries.
## 6. Related Terms
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent coordinate blueprint.
- [`auto-fill` / `auto-fit`](grid_auto_fill_fit.md) — Keywords used inside `repeat()` to automate responsive grid counts.
- [`minmax()` Function](grid_minmax.md) — Related concept: `minmax()` Function.

---

## 7. Key Takeaways
- `repeat()` is a shorthand CSS function that automates grid track duplication.
- It is only valid within grid-template definitions (columns/rows).
- The syntax is `repeat(count, pattern)`.
- It can be mixed with fixed track listings (e.g. `100px repeat(3, 1fr)`).
- It can repeat complex sequences (e.g. `repeat(2, 50px 1fr)`).
