# `fr` Unit (Fractional Unit)

> **Level 6 — Layouts — CSS Grid**
> A CSS Grid-specific unit of measurement that represents a fraction of the flexible, remaining free space inside a grid container after accounting for gaps and fixed-size columns.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent blueprint properties where the `fr` unit is declared.

---

## 2. Term Category
- **CSS Unit**

---

## 3. Environment Context
- **Universal Modern Standard** (Evaluated dynamically during browser paint loop computations. Calculates layout fractions in real-time on screen resizes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before CSS Grid was introduced, building fluid column layouts required developers to use percentages (like `width: 33.33%;` for three columns).

However, percentages create a mathematical nightmare the moment you add gaps between columns. 

If you write:
`grid-template-columns: 33.33% 33.33% 33.33%; gap: 20px;`

The total width of your container becomes **`100% + 40px` (the two gaps)**. 

Because `100% + 40px` is larger than the screen, the container overflows, breaking the page layout and forcing ugly horizontal scrollbars.

To solve this, the W3C introduced the **`fr` (Fractional) unit**. 

It is a smart unit that automatically calculates the available "free space" *after* subtracting all fixed columns and layout gaps. It guarantees your grid will never overflow the screen.

---

### (2) How the Browser Calculates `fr` Sizes
When rendering a grid containing `fr` units, the browser follows a simple calculation sequence:

1.  It starts with the total physical width of the grid container (e.g. `1000px`).
2.  It subtracts any fixed-pixel tracks (e.g. a sidebar column set to `200px`).
3.  It subtracts all gap spacing between columns (e.g. two gaps of `20px` = `40px`).
4.  The remaining pixels are defined as the **flexible free space** (`1000px - 200px - 40px = 760px`).
5.  It adds up all the `fr` units in the template, and divides the free space proportionally.

---

### (3) Ratios and Proportions
The number before the `fr` represents a share weight:
-   `grid-template-columns: 1fr 1fr 1fr;` — 3 total fractions. Each column gets 1/3 of the free space.
-   `grid-template-columns: 1fr 2fr;` — 3 total fractions. Column 1 gets 1/3, Column 2 gets 2/3.
-   `grid-template-columns: 200px 1fr;` — Column 1 is locked to `200px`. Column 2 takes up 100% of whatever space is left.

---

### (4) Code Examples

#### Short Snippet
A clean 2-column sidebar layout:

```css
.dashboard {
  display: grid;
  /* Sidebar is locked to 250px, Main takes up all remaining space */
  grid-template-columns: 250px 1fr;
  gap: 20px;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fractional Units Showcase</title>
  <style>
    .grid-container {
      display: grid;
      /* Column 1 gets 1 share, Column 2 gets 3 shares of free space */
      grid-template-columns: 1fr 3fr;
      gap: 30px;
      width: 800px;
      background-color: #ddd;
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

  <!-- Total width is 800px. 
       Gap is 30px. 
       Free space = 770px.
       Col 1 width = 770 / 4 = 192.5px.
       Col 2 width = 192.5 * 3 = 577.5px. -->
  <div class="grid-container">
    <div class="column">1fr (25% of free space)</div>
    <div class="column">3fr (75% of free space)</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `1fr` with `auto` sizing

**The mistake:** Assuming `grid-template-columns: 1fr;` and `grid-template-columns: auto;` behave identically:

```css
/* They are NOT identical! */
.grid-a { grid-template-columns: 1fr; }
.grid-b { grid-template-columns: auto; }
```

**Why it's wrong:** 
-   **`auto`** sizes the column to match the size of the content inside it. If the text is short, the column is narrow. If the text is long, the column stretches.
-   **`1fr`** tells the column to stretch and fill all available space in the container, regardless of whether it has content or not.

---



### Mistake 2: Combining `fr` Fraction Units with Percentage Widths Expecting Simple Addition

**The mistake:** Writing `grid-template-columns: 50% 1fr 1fr;`.

**Why it's wrong:** `fr` fraction units distribute remaining AVAILABLE free space AFTER non-flex items (percentages, pixels) are allocated. Mixing them requires understanding free space calculation.

*Incorrect:*
```css
/* Expecting 1fr to equal 25% when 50% is set */
```

*Fix:*
```css
/* Understanding 50% is allocated first, leaving 50% free space split 1:1 (25% each) */
grid-template-columns: 50% 1fr 1fr;
```

### Mistake 3: Using `1fr` on Grid Items with Long Non-Breaking Text Content (Grid Overflow Trap)

**The mistake:** Creating `grid-template-columns: 1fr 1fr;` where one column contains a long URL or string without `minmax(0, 1fr)`.

**Why it's wrong:** By default, grid items have implicit `min-width: auto` based on content length. Long non-breaking text forces the `1fr` column to expand beyond container bounds. Use `minmax(0, 1fr)`.

*Incorrect:*
```css
.grid { grid-template-columns: 1fr 1fr; } /* ❌ Expands column on long text! */
```

*Fix:*
```css
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```



### Mistake 4: Combining `fr` Fraction Units with Percentage Widths Expecting Simple Addition

**The mistake:** Writing `grid-template-columns: 50% 1fr 1fr;`.

**Why it's wrong:** `fr` fraction units distribute remaining AVAILABLE free space AFTER non-flex items (percentages, pixels) are allocated. Mixing them requires understanding free space calculation.

*Incorrect:*
```css
/* Expecting 1fr to equal 25% when 50% is set */
```

*Fix:*
```css
/* Understanding 50% is allocated first, leaving 50% free space split 1:1 (25% each) */
grid-template-columns: 50% 1fr 1fr;
```

### Mistake 5: Using `1fr` on Grid Items with Long Non-Breaking Text Content (Grid Overflow Trap)

**The mistake:** Creating `grid-template-columns: 1fr 1fr;` where one column contains a long URL or string without `minmax(0, 1fr)`.

**Why it's wrong:** By default, grid items have implicit `min-width: auto` based on content length. Long non-breaking text forces the `1fr` column to expand beyond container bounds. Use `minmax(0, 1fr)`.

*Incorrect:*
```css
.grid { grid-template-columns: 1fr 1fr; } /* ❌ Expands column on long text! */
```

*Fix:*
```css
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```



### Mistake 6: Combining `fr` Fraction Units with Percentage Widths Expecting Simple Addition

**The mistake:** Writing `grid-template-columns: 50% 1fr 1fr;`.

**Why it's wrong:** `fr` fraction units distribute remaining AVAILABLE free space AFTER non-flex items (percentages, pixels) are allocated. Mixing them requires understanding free space calculation.

*Incorrect:*
```css
/* Expecting 1fr to equal 25% when 50% is set */
```

*Fix:*
```css
/* Understanding 50% is allocated first, leaving 50% free space split 1:1 (25% each) */
grid-template-columns: 50% 1fr 1fr;
```

### Mistake 7: Using `1fr` on Grid Items with Long Non-Breaking Text Content (Grid Overflow Trap)

**The mistake:** Creating `grid-template-columns: 1fr 1fr;` where one column contains a long URL or string without `minmax(0, 1fr)`.

**Why it's wrong:** By default, grid items have implicit `min-width: auto` based on content length. Long non-breaking text forces the `1fr` column to expand beyond container bounds. Use `minmax(0, 1fr)`.

*Incorrect:*
```css
.grid { grid-template-columns: 1fr 1fr; } /* ❌ Expands column on long text! */
```

*Fix:*
```css
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```

## 6. Practice Exercises

### Exercise 1: Space Math

**Problem:** A grid container is `900px` wide. 
The CSS template is: `grid-template-columns: 200px 1fr 2fr; gap: 50px;`
What is the final width in pixels of the second column (the `1fr` column)?

**Expected output:**
```text
200px!
1. Start with total container width: 900px.
2. Subtract the fixed column: 900 - 200 = 700px.
3. Subtract the two gaps (each 50px): 700 - 100 = 600px of free space.
4. Total fr units = 3 (1fr + 2fr).
5. Column 2 gets 1 share: 600 / 3 = 200px.
```

> [!check]- Answer
> - Remember to subtract both gap spacings (three columns have two gaps!).
> - Divide the remaining space by the sum of the `fr` units.

---



### Exercise 2: Fractional Grid Ratio Calculation

**Problem:** For `grid-template-columns: 1fr 2fr 1fr;` in a 1000px container with 0 gap, calculate width of each column.

**Expected output:**
```text
Col 1: 250px (1/4)
Col 2: 500px (2/4)
Col 3: 250px (1/4)
```

> [!check]- Answer
> ```text
> Total fr = 1 + 2 + 1 = 4fr
> Col 1 = (1/4) * 1000 = 250px
> Col 2 = (2/4) * 1000 = 500px
> Col 3 = (1/4) * 1000 = 250px
> ```
>
> **Explanation:** `fr` units distribute available free space proportionally.

### Exercise 3: fr vs Percentage Difference

**Problem:** Why are `fr` units superior to `%` percentages in CSS Grid when using `gap`?

**Expected output:**
```text
fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
```

> [!check]- Answer
> ```text
> fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
> ```
>
> **Explanation:** `fr` units handle layout gap math automatically.



### Exercise 4: Fractional Grid Ratio Calculation

**Problem:** For `grid-template-columns: 1fr 2fr 1fr;` in a 1000px container with 0 gap, calculate width of each column.

**Expected output:**
```text
Col 1: 250px (1/4)
Col 2: 500px (2/4)
Col 3: 250px (1/4)
```

> [!check]- Answer
> ```text
> Total fr = 1 + 2 + 1 = 4fr
> Col 1 = (1/4) * 1000 = 250px
> Col 2 = (2/4) * 1000 = 500px
> Col 3 = (1/4) * 1000 = 250px
> ```
>
> **Explanation:** `fr` units distribute available free space proportionally.

### Exercise 5: fr vs Percentage Difference

**Problem:** Why are `fr` units superior to `%` percentages in CSS Grid when using `gap`?

**Expected output:**
```text
fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
```

> [!check]- Answer
> ```text
> fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
> ```
>
> **Explanation:** `fr` units handle layout gap math automatically.



### Exercise 6: Fractional Grid Ratio Calculation

**Problem:** For `grid-template-columns: 1fr 2fr 1fr;` in a 1000px container with 0 gap, calculate width of each column.

**Expected output:**
```text
Col 1: 250px (1/4)
Col 2: 500px (2/4)
Col 3: 250px (1/4)
```

> [!check]- Answer
> ```text
> Total fr = 1 + 2 + 1 = 4fr
> Col 1 = (1/4) * 1000 = 250px
> Col 2 = (2/4) * 1000 = 500px
> Col 3 = (1/4) * 1000 = 250px
> ```
>
> **Explanation:** `fr` units distribute available free space proportionally.

### Exercise 7: fr vs Percentage Difference

**Problem:** Why are `fr` units superior to `%` percentages in CSS Grid when using `gap`?

**Expected output:**
```text
fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
```

> [!check]- Answer
> ```text
> fr units automatically subtract gap spacing BEFORE allocating fractions, preventing row overflow.
> ```
>
> **Explanation:** `fr` units handle layout gap math automatically.

## 7. Related Terms
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent blueprint.
- [`minmax()`](../level_06/grid_minmax.md) — A function commonly used with `fr` units to set sizing caps.

---

## 8. Key Takeaways
- The `fr` unit is a smart, fluid unit designed specifically for CSS Grid.
- It represents a fraction of the available free space inside the container.
- It automatically subtracts pixels used by fixed columns and layout gaps before dividing space.
- Using `fr` units eliminates the risk of layout wrapping breaks caused by percentages.
- Standard ratios (like `1fr 2fr`) divide space based on proportional weights.
