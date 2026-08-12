# `fr` Unit (Fractional Unit)

> **Level 6 — Layouts — CSS Grid**
> A CSS Grid-specific unit of measurement that represents a fraction of the flexible, remaining free space inside a grid container after accounting for gaps and fixed-size columns.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent blueprint properties where the `fr` unit is declared.
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — Fractional fr unit in CSS Grid layout.

---

## 2. Term Category

**CSS Unit (Universal Modern Standard .)**: `fr` Unit (Fractional Unit) is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Proportional Column Division with Fractional Units

**Scenario:** An author divides a dashboard layout into three proportional columns using fractional `fr` units.

**Requirements:**
1. Apply `display: grid` to container.
2. Define 3 columns with ratio `1fr 2fr 1fr`.
3. Add `gap: 1.5rem`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .dashboard-grid {
>   display: grid;
>   grid-template-columns: 1fr 2fr 1fr;  /* 1:2:1 proportional column ratio */
>   gap: 1.5rem;
>   padding: 1.5rem;
>   background-color: #f8fafc;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `fr` (Fractional) Unit**: Represents a fraction of the remaining available free space in a CSS Grid container.
> 2. **Proportional Ratio Calculation**: `1fr 2fr 1fr` splits free space into 4 total parts (1+2+1=4): columns receive 25%, 50%, and 25% of available space after gaps are subtracted.
> 3. **Automatic Gap Deduction**: `fr` units automatically subtract explicit `gap` spacing BEFORE calculating column widths, eliminating layout overflow.
> 
---

### Exercise 2: Combining Fixed Units with Fractional fr Units

**Scenario:** Creates a layout with a fixed 18rem sidebar and a fluid remaining content column.

**Requirements:**
1. Apply `grid-template-columns: 18rem 1fr`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .app-layout {
>   display: grid;
>   grid-template-columns: 18rem 1fr;   /* 18rem fixed sidebar + 1fr fluid content */
>   gap: 2rem;
>   min-height: 100vh;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Mixed Fixed and Fractional Units**: CSS Grid allows mixing fixed units (`18rem`, `300px`) with flexible `fr` units seamlessly.
> 2. **Remaining Space Calculation**: The browser allocates `18rem` to column 1 first, then assigns 100% of ALL remaining space to the `1fr` column.
> 3. **Replaces Flexbox Hacks**: Replaces legacy flex calculations (`flex: 1`) with cleaner grid track declarations.
> 
---

### Exercise 3: Preventing Text Content Bloat from Blowing Out 1fr Columns

**Scenario:** Prevents long un-broken text strings from expanding `1fr` columns using `minmax(0, 1fr)`.

**Requirements:**
1. Apply `grid-template-columns: minmax(0, 1fr) minmax(0, 2fr)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .safe-grid {
>   display: grid;
>   /* minmax(0, 1fr) forces columns to shrink below content size if necessary */
>   grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
>   gap: 1.5rem;
> }
>
> .safe-grid p {
>   white-space: nowrap;
>   overflow: hidden;
>   text-overflow: ellipsis;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`1fr` Minimum Content Size Pitfall**: By default, a `1fr` grid track has an implicit minimum size of `auto` (`minmax(auto, 1fr)`), causing wide text or images to blow out column widths!
> 2. **The `minmax(0, 1fr)` Safeguard**: Using `minmax(0, 1fr)` allows the column to shrink to 0 width, enabling proper text truncation (`text-overflow: ellipsis`).
> 3. **Defensive CSS Grid Design**: Essential pattern when rendering dynamic user data inside grid columns.
## 6. Related Terms
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent blueprint.
- [`minmax()` Function](grid_minmax.md) — A function commonly used with `fr` units to set sizing caps.
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — Related concept: CSS Grid (Concept) & `display: grid`.

---

## 7. Key Takeaways
- The `fr` unit is a smart, fluid unit designed specifically for CSS Grid.
- It represents a fraction of the available free space inside the container.
- It automatically subtracts pixels used by fixed columns and layout gaps before dividing space.
- Using `fr` units eliminates the risk of layout wrapping breaks caused by percentages.
- Standard ratios (like `1fr 2fr`) divide space based on proportional weights.
