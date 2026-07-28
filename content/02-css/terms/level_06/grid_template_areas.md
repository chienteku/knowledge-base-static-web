# `grid-template-areas`

> **Level 6 — Layouts — CSS Grid**
> A parent-level CSS Grid property that allows developers to define a visual, self-documenting ASCII-art map of named areas in the grid, simplifying child element placement.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent track properties that establish the grid cell structure.
- [`grid-column` / `grid-row` (Grid Item Placement)](../level_06/grid_item.md) — Understanding the child-level placement system it overrides.

---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Parses string arrays to construct layout bounds).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Calculating numbered grid lines (like `grid-column: 1 / 4`) works fine for simple card grids. 

But for complex full-page dashboard layouts, tracking multiple line coordinates gets incredibly confusing.

If you decide to add a new column later, all your line numbers shift, forcing you to rewrite the coordinates for every single child element!

To solve this, the W3C created **`grid-template-areas`**. 

Instead of writing line numbers, it allows you to draw a literal text map of your website's layout directly inside your parent CSS rule. 

You name each cell in the grid using strings, and then tell the children to snap themselves to those names.

---

### (2) The ASCII-Art Grid Map
You define the map by writing strings (wrapped in quotes) for each row of the grid:

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 60px 1fr 50px;
  
  /* The Map */
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
```

-   Each row is written in its own set of quotes.
-   Inside the quotes, you name each cell, separated by spaces.
-   If you write the same name in adjacent cells (horizontally or vertically), the browser automatically merges those cells into one large area!
-   To leave a cell completely empty, use a period (**`.`**). E.g. `"sidebar . main"`.

---

### (3) Placing Children: The `grid-area` Property
Once the parent has defined the area map, placing the child elements is extremely simple. 

You use the **`grid-area`** property inside the child's CSS rule and reference the matching name:

```css
.page-header {
  grid-area: header; /* The browser automatically stretches it over the entire top row! */
}
```

---

### (4) Code Examples

#### Short Snippet
Leaving blank cells:

```css
.layout-with-gaps {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas:
    "header . sidebar"
    "main   . sidebar";
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grid Template Areas Demo</title>
  <style>
    .page-container {
      display: grid;
      grid-template-columns: 200px 1fr 150px;
      grid-template-rows: 80px 400px 60px;
      gap: 10px;
      
      /* Visual ASCII layout mapping */
      grid-template-areas:
        "logo   header header"
        "menu   main   aside"
        "footer footer footer";
    }

    /* Assigning child elements to areas */
    .logo-box   { grid-area: logo; background-color: tomato; }
    .header-box { grid-area: header; background-color: lightgreen; }
    .menu-box   { grid-area: menu; background-color: gold; }
    .main-box   { grid-area: main; background-color: white; border: 2px solid black; }
    .aside-box  { grid-area: aside; background-color: lightblue; }
    .footer-box { grid-area: footer; background-color: lightgray; }

    .panel {
      padding: 20px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="page-container">
    <div class="panel logo-box">Logo Panel</div>
    <div class="panel header-box">Main Header Navigation</div>
    <div class="panel menu-box">Vertical Menu</div>
    <div class="panel main-box">Main Article Content Area</div>
    <div class="panel aside-box">Sidebar Ads</div>
    <div class="panel footer-box">Footer Links Area</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating Non-Rectangular Area Shapes

**The mistake:** Trying to draw an "L-shaped" area or splitting areas in the text map:

```css
/* BAD: Invalid map! Browser will discard the entire grid-template-areas rule */
.layout {
  grid-template-areas:
    "header header sidebar"
    "main   main   sidebar"
    "main   footer footer"; /* Error: main is now L-shaped! */
}
```

**Why it's wrong:** The browser's layout engine can only calculate rectangular grid areas. If you try to stretch an area into an "L" or "T" shape, or disconnect a named area across separate columns, the syntax checker detects this as invalid and disables the map completely.

**Fix: Every named area must form a perfect, continuous rectangle.**

---



### Mistake 2: Creating Non-Rectangular Named Area Regions in `grid-template-areas`

**The mistake:** Creating an 'L-shaped' or non-rectangular region named area.

**Why it's wrong:** Every named area in `grid-template-areas` MUST form a single, contiguous RECTANGLE. Non-rectangular areas (L-shapes, T-shapes) invalidate the CSS rule.

*Incorrect:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "main head"; /* ❌ Non-rectangular 'head' area invalidates grid! */
```

*Fix:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "foot foot"; /* All areas form clean rectangles */
```

### Mistake 3: Mismatching Column Cell Counts Across Rows in `grid-template-areas` Strings

**The mistake:** Writing Row 1 with 3 named cells and Row 2 with 2 named cells.

**Why it's wrong:** Every string row inside `grid-template-areas` MUST contain the EXACT same number of cell tokens.

*Incorrect:*
```css
grid-template-areas:
  "head head head"
  "main side"; /* ❌ Mismatched column count (3 vs 2)! */
```

*Fix:*
```css
grid-template-areas:
  "head head head"
  "main main side"; /* 3 columns across both rows */
```



### Mistake 4: Creating Non-Rectangular Named Area Regions in `grid-template-areas`

**The mistake:** Creating an 'L-shaped' or non-rectangular region named area.

**Why it's wrong:** Every named area in `grid-template-areas` MUST form a single, contiguous RECTANGLE. Non-rectangular areas (L-shapes, T-shapes) invalidate the CSS rule.

*Incorrect:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "main head"; /* ❌ Non-rectangular 'head' area invalidates grid! */
```

*Fix:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "foot foot"; /* All areas form clean rectangles */
```

### Mistake 5: Mismatching Column Cell Counts Across Rows in `grid-template-areas` Strings

**The mistake:** Writing Row 1 with 3 named cells and Row 2 with 2 named cells.

**Why it's wrong:** Every string row inside `grid-template-areas` MUST contain the EXACT same number of cell tokens.

*Incorrect:*
```css
grid-template-areas:
  "head head head"
  "main side"; /* ❌ Mismatched column count (3 vs 2)! */
```

*Fix:*
```css
grid-template-areas:
  "head head head"
  "main main side"; /* 3 columns across both rows */
```



### Mistake 6: Creating Non-Rectangular Named Area Regions in `grid-template-areas`

**The mistake:** Creating an 'L-shaped' or non-rectangular region named area.

**Why it's wrong:** Every named area in `grid-template-areas` MUST form a single, contiguous RECTANGLE. Non-rectangular areas (L-shapes, T-shapes) invalidate the CSS rule.

*Incorrect:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "main head"; /* ❌ Non-rectangular 'head' area invalidates grid! */
```

*Fix:*
```css
grid-template-areas:
  "head head"
  "main sidebar"
  "foot foot"; /* All areas form clean rectangles */
```

### Mistake 7: Mismatching Column Cell Counts Across Rows in `grid-template-areas` Strings

**The mistake:** Writing Row 1 with 3 named cells and Row 2 with 2 named cells.

**Why it's wrong:** Every string row inside `grid-template-areas` MUST contain the EXACT same number of cell tokens.

*Incorrect:*
```css
grid-template-areas:
  "head head head"
  "main side"; /* ❌ Mismatched column count (3 vs 2)! */
```

*Fix:*
```css
grid-template-areas:
  "head head head"
  "main main side"; /* 3 columns across both rows */
```

## 6. Practice Exercises

### Exercise 1: ASCII Map Design

**Problem:** Look at the following HTML layout structure. Write the `grid-template-areas` CSS property that matches this layout grid (3 columns, 3 rows):
- Row 1: Header spans all 3 columns.
- Row 2: Sidebar is in Col 1, Content spans Col 2 and Col 3.
- Row 3: Footer spans Col 1 and Col 2. The 3rd column cell is left empty.

**Expected output:**
> [!check]- Answer
> ```css
> grid-template-areas:
>   "header header header"
>   "sidebar content content"
>   "footer footer .";
> ```
> - Represent each row inside a set of quotes.
> - Use a period (`.`) for the empty cell in the footer row.

---



### Exercise 2: Holy Grail Layout with Grid Template Areas

**Problem:** Write `grid-template-areas` for 3-row layout: Header (full width), Main + Sidebar, Footer (full width).

**Expected output:**
> [!check]- Answer
> ```text
> grid-template-areas: "header header" "main sidebar" "footer footer";
> ```
> ```css
> .layout {
>   display: grid;
>   grid-template-areas:
>     "header header"
>     "main   sidebar"
>     "footer footer";
> }
> ```
>
> **Explanation:** Named area strings define visual layout maps intuitively.

---

### Exercise 3: Empty Cell Dot Notation in Grid Areas

**Problem:** How do you represent an empty null cell in `grid-template-areas` string rows?

**Expected output:**
> [!check]- Answer
> ```text
> Using a period/dot character (.) e.g. "header ."
> ```
> ```css
> grid-template-areas:
>   "header ."
>   "main   sidebar";
> ```
>
> **Explanation:** Period `.` tokens represent empty grid cell slots.

## 7. Related Terms
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — Sizing the track grid.
- [`grid-column` / `grid-row`](../level_06/grid_item.md) — Placing items manually.

---

## 8. Key Takeaways
- `grid-template-areas` defines named regions inside a grid layout using an ASCII-art string map.
- Map strings are written row-by-row inside quotes.
- Adjacent identical names merge cells into larger rectangular regions.
- Names can only form rectangular blocks; L-shapes or separated blocks are invalid.
- Use a period (`.`) to leave a specific cell empty.
- Children snap to named regions using `grid-area: [area-name]`.
