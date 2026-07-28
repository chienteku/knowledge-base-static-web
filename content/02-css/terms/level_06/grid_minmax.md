# `minmax()` Function

> **Level 6 — Layouts — CSS Grid**
> A CSS function used within grid track definitions to set a size range (minimum and maximum bounds) for columns or rows, ensuring layouts scale responsively without breaking.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent properties configured by `minmax()`.
- [`fr` Unit (Fractional Unit)](../level_06/fr_unit.md) — The dynamic unit commonly used as the maximum size.

---

## 2. Term Category
- **CSS Function**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Evaluates upper and lower sizing boundaries during container scale phases).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When designing web layouts, columns must adapt to various screens. 

If you set a column to a fixed width like `200px`, it looks fine on desktop. But on a mobile phone screen that is only `320px` wide, that column takes up almost the whole screen, leaving no room for content.

Conversely, if you make a column completely fluid using `1fr` or percentages, it can shrink to become tiny on mobile (e.g., `40px` wide). This squishes text and icons, making the site completely unreadable.

To solve this, the W3C created the **`minmax()`** function. 

It defines a safe size range for columns and rows. You tell the browser: *"This column must never shrink below `200px` (so the content is always readable), but if there is extra room on the screen, let it grow to fill the remaining space (`1fr`)."*

---

### (2) Function Syntax
The function takes two parameters:

`minmax([minimum-size], [maximum-size]);`

-   **`minimum-size`**: The lower bound constraint. Can be a fixed unit (like `200px`), a percentage, or content keywords (like `min-content` or `auto`).
-   **`maximum-size`**: The upper bound constraint. Can be a fixed unit, a percentage, or the flexible `fr` unit.

---

### (3) The Dynamic Auto Grid
When combined with `auto-fit` and `repeat()`, `minmax()` creates the modern, media-query-free responsive grid:

```css
.grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

If the parent container is `800px` wide, the browser fits 4 columns (each `200px` wide). If the container shrinks to `500px`, it drops to 2 columns (each stretching to `250px` because of the `1fr` maximum).

---

### (4) Code Examples

#### Short Snippet
Setting a constraint on a sidebar:

```css
.layout {
  display: grid;
  /* Sidebar is between 150px and 300px; Content fills the rest */
  grid-template-columns: minmax(150px, 300px) 1fr;
  gap: 20px;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Minmax Function Demo</title>
  <style>
    .grid-container {
      display: grid;
      /* Column 1: Min 150px, Max 1fr.
         Column 2: Min 300px, Max 2fr. */
      grid-template-columns: minmax(150px, 1fr) minmax(300px, 2fr);
      gap: 15px;
      background-color: #eee;
      padding: 10px;
    }

    .column {
      background-color: white;
      border: 2px solid black;
      padding: 20px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Try resizing your browser. 
       Column 1 will never shrink below 150px.
       Column 2 will never shrink below 300px. -->
  <div class="grid-container">
    <div class="column">Min: 150px / Max: 1fr</div>
    <div class="column">Min: 300px / Max: 2fr</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing `1fr` as the minimum size parameter

**The mistake:** Declaring `minmax(1fr, 300px)`:

```css
/* BAD: Invalid syntax! Browser will ignore this track setup */
.grid {
  grid-template-columns: minmax(1fr, 300px) 1fr; 
}
```

**Why it's wrong:** The `fr` unit represents flexible remaining space. A minimum size constraint must be a static or content-defined size. The browser cannot calculate a dynamic fraction as a minimum baseline. 

**Fix: Only use `fr` units as the maximum (second) parameter in `minmax()`.**

---



### Mistake 2: Reversing Min and Max Arguments in `minmax(max, min)`

**The mistake:** Writing `grid-template-columns: repeat(3, minmax(1fr, 200px));`.

**Why it's wrong:** The 1st argument of `minmax()` is the MINIMUM bound, and the 2nd argument is the MAXIMUM bound. If min > max, the rule is invalidated.

*Incorrect:*
```css
/* ❌ Min 1fr > Max 200px! Invalid minmax declaration! */
grid-template-columns: repeat(3, minmax(1fr, 200px));
```

*Fix:*
```css
grid-template-columns: repeat(3, minmax(200px, 1fr)); /* Min: 200px, Max: 1fr */
```

### Mistake 3: Using `minmax()` Without responsive `auto-fit` or `auto-fill`

**The mistake:** Writing `grid-template-columns: minmax(300px, 1fr);` without `repeat()`.

**Why it's wrong:** Using `minmax()` on a single column track simply sets a minimum bound for that column. Combine `repeat(auto-fit, minmax(...))` for responsive multi-column wrapping.

*Incorrect:*
```css
/* Single column minmax without repeat wrapping */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```



### Mistake 4: Reversing Min and Max Arguments in `minmax(max, min)`

**The mistake:** Writing `grid-template-columns: repeat(3, minmax(1fr, 200px));`.

**Why it's wrong:** The 1st argument of `minmax()` is the MINIMUM bound, and the 2nd argument is the MAXIMUM bound. If min > max, the rule is invalidated.

*Incorrect:*
```css
/* ❌ Min 1fr > Max 200px! Invalid minmax declaration! */
grid-template-columns: repeat(3, minmax(1fr, 200px));
```

*Fix:*
```css
grid-template-columns: repeat(3, minmax(200px, 1fr)); /* Min: 200px, Max: 1fr */
```

### Mistake 5: Using `minmax()` Without responsive `auto-fit` or `auto-fill`

**The mistake:** Writing `grid-template-columns: minmax(300px, 1fr);` without `repeat()`.

**Why it's wrong:** Using `minmax()` on a single column track simply sets a minimum bound for that column. Combine `repeat(auto-fit, minmax(...))` for responsive multi-column wrapping.

*Incorrect:*
```css
/* Single column minmax without repeat wrapping */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```



### Mistake 6: Reversing Min and Max Arguments in `minmax(max, min)`

**The mistake:** Writing `grid-template-columns: repeat(3, minmax(1fr, 200px));`.

**Why it's wrong:** The 1st argument of `minmax()` is the MINIMUM bound, and the 2nd argument is the MAXIMUM bound. If min > max, the rule is invalidated.

*Incorrect:*
```css
/* ❌ Min 1fr > Max 200px! Invalid minmax declaration! */
grid-template-columns: repeat(3, minmax(1fr, 200px));
```

*Fix:*
```css
grid-template-columns: repeat(3, minmax(200px, 1fr)); /* Min: 200px, Max: 1fr */
```

### Mistake 7: Using `minmax()` Without responsive `auto-fit` or `auto-fill`

**The mistake:** Writing `grid-template-columns: minmax(300px, 1fr);` without `repeat()`.

**Why it's wrong:** Using `minmax()` on a single column track simply sets a minimum bound for that column. Combine `repeat(auto-fit, minmax(...))` for responsive multi-column wrapping.

*Incorrect:*
```css
/* Single column minmax without repeat wrapping */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

## 6. Practice Exercises

### Exercise 1: Flexible Constraints

**Problem:** Write the CSS rule for a 3-column grid where:
- The first column is a fixed `200px`.
- The second column has a minimum of `250px` and a maximum of `500px`.
- The third column takes up all remaining available space.

**Expected output:**
> [!check]- Answer
> ```css
> .custom-grid {
>   display: grid;
>   grid-template-columns: 200px minmax(250px, 500px) 1fr;
> }
> ```
> - Define three space-separated track widths.
> - Use the `minmax()` helper for the second column constraint.

---



### Exercise 2: Sidebar and Main Content Responsive Template

**Problem:** Write `grid-template-columns` with fixed 250px sidebar and fluid main content scaling between 500px and 1fr.

**Expected output:**
> [!check]- Answer
> ```text
> grid-template-columns: 250px minmax(500px, 1fr);
> ```
> ```css
> .app-layout {
>   display: grid;
>   grid-template-columns: 250px minmax(500px, 1fr);
> }
> ```
>
> **Explanation:** `250px minmax(500px, 1fr)` defines fixed sidebar and fluid main area.

---

### Exercise 3: minmax Min Content Keyword

**Problem:** What does `minmax(min-content, 1fr)` enforce as the minimum column width boundary?

**Expected output:**
> [!check]- Answer
> ```text
> Minimum width equals the width of the longest un-wrapped word/content inside the column.
> ```
> ```text
> Minimum width equals the width of the longest un-wrapped word/content inside the column.
> ```
>
> **Explanation:** `min-content` clamps column width to minimum content requirements.

## 7. Related Terms
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent blueprint.
- [`auto-fill` / `auto-fit`](../level_06/grid_auto_fill_fit.md) — The responsive counts keywords often paired with `minmax()`.

---

## 8. Key Takeaways
- `minmax()` defines a bounding scale range (min-size and max-size) for grid tracks.
- The browser guarantees the track never shrinks below the minimum and never exceeds the maximum.
- Pair `repeat(auto-fit, minmax(size, 1fr))` to create fluid, media-query-free responsive column wraps.
- You can never use the `fr` unit as the first (minimum) parameter in `minmax()`.
