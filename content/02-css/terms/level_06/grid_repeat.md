# `repeat()` Function

> **Level 6 — Layouts — CSS Grid**
> A CSS function used within grid template definitions to repeat track size patterns, reducing code redundancy and keeping layout code clean.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent blueprint properties where `repeat()` is declared.
- [`fr` Unit (Fractional Unit)](fr_unit.md) — The dynamic unit commonly repeated.

---

## 2. Term Category
- **CSS Function**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Instantly expands arguments into full track arrays during page reflow calculations).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Nesting `repeat()` Functions Inside Another `repeat()` Function

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

### Mistake 5: Using `auto-fill` with Fixed Track Lists Containing Multiple `fr` Units

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



### Mistake 6: Nesting `repeat()` Functions Inside Another `repeat()` Function

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

### Mistake 7: Using `auto-fill` with Fixed Track Lists Containing Multiple `fr` Units

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

## 6. Practice Exercises

### Exercise 1: Clean Up Layout Code

**Problem:** You have a design with 8 columns. The columns alternate between `100px` (fixed) and `1fr` (fluid):
`grid-template-columns: 100px 1fr 100px 1fr 100px 1fr 100px 1fr;`
Simplify this layout blueprint line using the `repeat()` function.

**Expected output:**
> [!check]- Answer
> ```css
> grid-template-columns: repeat(4, 100px 1fr);
> ```
> - Identify the repeating pattern. Here, the pattern consists of two track sizes: `100px 1fr`.
> - Count how many times this two-column pattern is repeated.

---



### Exercise 2: 12-Column Grid Repeat Syntax

**Problem:** Write `grid-template-columns` using `repeat()` to create standard 12-column equal `1fr` grid.

**Expected output:**
> [!check]- Answer
> ```text
> grid-template-columns: repeat(12, 1fr);
> ```
> ```css
> .grid-12 {
>   display: grid;
>   grid-template-columns: repeat(12, 1fr);
> }
> ```
>
> **Explanation:** `repeat(12, 1fr)` defines 12 equal-width column tracks.

---

### Exercise 3: Mixed Track Pattern Repeat

**Problem:** Write `grid-template-columns` repeating pattern of 1 fixed 100px column and 1 fluid 1fr column 3 times.

**Expected output:**
> [!check]- Answer
> ```text
> grid-template-columns: repeat(3, 100px 1fr);
> ```
> ```css
> .grid {
>   grid-template-columns: repeat(3, 100px 1fr);
> }
> ```
>
> **Explanation:** `repeat(3, 100px 1fr)` repeats multi-track patterns 3 times (6 columns total).

## 7. Related Terms
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent coordinate blueprint.
- [`auto-fill` / `auto-fit`](grid_auto_fill_fit.md) — Keywords used inside `repeat()` to automate responsive grid counts.
- [`minmax()` Function](grid_minmax.md) — Related concept: `minmax()` Function.

---

## 8. Key Takeaways
- `repeat()` is a shorthand CSS function that automates grid track duplication.
- It is only valid within grid-template definitions (columns/rows).
- The syntax is `repeat(count, pattern)`.
- It can be mixed with fixed track listings (e.g. `100px repeat(3, 1fr)`).
- It can repeat complex sequences (e.g. `repeat(2, 50px 1fr)`).
