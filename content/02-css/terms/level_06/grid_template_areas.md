# `grid-template-areas`

> **Level 6 — Layouts — CSS Grid**
> A parent-level CSS Grid property that allows developers to define a visual, self-documenting ASCII-art map of named areas in the grid, simplifying child element placement.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent track properties that establish the grid cell structure.
- [`grid-column` / `grid-row` (Grid Item Placement)](grid_item.md) — Understanding the child-level placement system it overrides.

---

## 2. Term Category

**Layout Property (Universal Modern Standard .)**: `grid-template-areas` is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Semantic Page Layout Architecture using Named Areas

**Scenario:** An author builds a complete web page layout using ASCII-art named grid areas with `grid-template-areas`.

**Requirements:**
1. Define `grid-template-areas` grid map.
2. Assign `grid-area` names to `<header>`, `<nav>`, `<main>`, `<footer>`.
3. Set responsive area layout.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .page-grid {
>   display: grid;
>   grid-template-areas:
>     "header  header"
>     "sidebar main  "
>     "footer  footer";
>   grid-template-columns: 18rem 1fr;
>   grid-template-rows: auto 1fr auto;
>   gap: 1.5rem;
>   min-height: 100vh;
> }
>
> header  { grid-area: header; }
> aside   { grid-area: sidebar; }
> main    { grid-area: main; }
> footer  { grid-area: footer; }
> ```
>
> #### Technical Explanation
>
> 1. **The `grid-template-areas` Property**: Defines grid layout structure using intuitive ASCII-art string names assigned to grid cells.
> 2. **`grid-area` Component Binding**: Child elements bind to named grid regions using `grid-area: name` without needing line numbers.
> 3. **Visual Layout Readability**: Makes page layout architecture instantly readable in CSS source code.
> 
---

### Exercise 2: Mobile-to-Desktop Area Layout Shifts via Media Queries

**Scenario:** Re-arranges page layout structure for mobile screens by redefining `grid-template-areas`.

**Requirements:**
1. Set single-column mobile `grid-template-areas`.
2. Set 2-column desktop `grid-template-areas` inside `@media (min-width: 48rem)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Mobile Layout (Single Column Stack) */
> .page-grid {
>   display: grid;
>   grid-template-areas:
>     "header"
>     "main"
>     "sidebar"
>     "footer";
> }
>
> /* Desktop Layout (2-Column Grid) */
> @media (min-width: 48rem) {
>   .page-grid {
>     grid-template-areas:
>       "header  header"
>       "sidebar main"
>       "footer  footer";
>     grid-template-columns: 18rem 1fr;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-HTML Layout Shifts**: Re-arranges page layout completely for mobile screens without modifying HTML DOM source structure!
> 2. **Single Point of Change**: Updating `grid-template-areas` in media queries updates the entire page layout effortlessly.
> 3. **Clean Mobile Responsive Architecture**: Pushes sidebars below main content on mobile screens cleanly.
> 
---

### Exercise 3: Using Empty Grid Area Cells (.) for White Space Control

**Scenario:** Uses the period `.` token in `grid-template-areas` to leave empty whitespace grid cells.

**Requirements:**
1. Use `.` in `grid-template-areas` map to create empty column gaps.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .dashboard-grid {
>   display: grid;
>   grid-template-areas:
>     "widget1 . widget2";        /* Period '.' creates an empty un-assigned grid cell */
>   grid-template-columns: 1fr 1.5rem 1fr;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Empty Cell Token (`.`)**: A period `.` in `grid-template-areas` instructs grid to leave that cell empty.
> 2. **White Space Control**: Allows creating precise empty whitespace columns or rows without dummy HTML elements.
> 3. **Clean ASCII Grid Mapping**: Maintains clean ASCII grid alignment in CSS files.
## 6. Related Terms
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — Sizing the track grid.
- [`grid-column` / `grid-row` (Grid Item Placement)](grid_item.md) — Placing items manually.
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — Related concept: CSS Grid (Concept) & `display: grid`.

---

## 7. Key Takeaways
- `grid-template-areas` defines named regions inside a grid layout using an ASCII-art string map.
- Map strings are written row-by-row inside quotes.
- Adjacent identical names merge cells into larger rectangular regions.
- Names can only form rectangular blocks; L-shapes or separated blocks are invalid.
- Use a period (`.`) to leave a specific cell empty.
- Children snap to named regions using `grid-area: [area-name]`.
