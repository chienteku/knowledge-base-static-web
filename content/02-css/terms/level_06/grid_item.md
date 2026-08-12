# `grid-column` / `grid-row` (Grid Item Placement)

> **Level 6 — Layouts — CSS Grid**
> The child-level CSS Grid properties used to align and span individual items across multiple grid tracks by referencing grid line coordinates.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent properties that define the grid lines items place themselves against.
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — Placing grid items inside CSS Grid containers.

---

## 2. Term Category

**Layout Property (Universal Modern Standard .)**: `grid-column` / `grid-row` (Grid Item Placement) is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, the browser places grid items automatically: Card 1 goes into the first grid square, Card 2 goes into the second, and so on. 

But what if you are building a dashboard and need a "Featured Post" card that spans two columns? 

What if you need a "Header" box that stretches across the entire width of the page?

The W3C created **`grid-column`** and **`grid-row`** to solve this. 

These child-level properties let you override auto-placement and pin an element to specific coordinate lines. 

You can declare exactly where an item starts, where it ends, or how many cells it should stretch to cover.

---

### (2) Placing Items on Grid Lines
Recall that a grid with **3 columns** has **4 vertical lines**. You target these lines to stretch elements:

```css
.featured-item {
  /* Start drawing at vertical line 1 (left edge) 
     and stop drawing at vertical line 3. 
     This stretches the element over 2 columns! */
  grid-column-start: 1;
  grid-column-end: 3;
}
```

---

### (3) Shorthand Syntax
Writing start and end properties separately is verbose, so developers use the shorthand slash (`/`) syntax:

`grid-column: [start-line] / [end-line];`
`grid-row: [start-line] / [end-line];`

Example:
`grid-column: 1 / 4;` (Spans from line 1 to line 4, covering 3 columns).

---

### (4) The `span` Keyword
If you don't want to calculate the exact ending line number, you can use the **`span`** keyword to declare how many tracks wide the item should be:

-   `grid-column: 1 / span 2;` (Start at line 1, stretch across **2 columns**).
-   `grid-column: span 3;` (Let the browser place it naturally, but force it to stretch **3 columns** wide).
-   `grid-column: 1 / -1;` (The **`-1` shortcut** pins the end to the last line of the grid, forcing the item to stretch across the entire width, regardless of how many columns exist!).

---

### (5) Code Examples

#### Short Snippet
Full-width header placement:

```css
.header-banner {
  /* Stretches from the first vertical line to the absolute last vertical line */
  grid-column: 1 / -1; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grid Item Spanning</title>
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr); /* 4 equal columns */
      grid-template-rows: 60px 200px 60px;
      gap: 10px;
      background-color: #eee;
      padding: 10px;
    }

    .box {
      background-color: lightblue;
      border: 2px solid black;
      padding: 15px;
      font-weight: bold;
      text-align: center;
    }

    /* Target specific children to span */
    .header {
      grid-column: 1 / -1; /* Spans all 4 columns */
      background-color: lightgreen;
    }

    .sidebar {
      grid-row: 2 / 3; /* Row 2 */
      grid-column: 1 / 2; /* Column 1 */
      background-color: gold;
    }

    .main {
      grid-row: 2 / 3; /* Row 2 */
      grid-column: 2 / span 3; /* Starts at line 2, spans remaining 3 columns */
      background-color: white;
    }

    .footer {
      grid-column: 1 / -1; /* Spans all 4 columns */
      background-color: lightgray;
    }
  </style>
</head>
<body>

  <div class="grid-container">
    <div class="box header">Header (Col 1 to End)</div>
    <div class="box sidebar">Sidebar (Col 1)</div>
    <div class="box main">Main Content (Col 2-4)</div>
    <div class="box footer">Footer (Col 1 to End)</div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing line numbers with track counts

**The mistake:** Declaring `grid-column: 1 / 3;` expecting the item to span exactly three columns:

```css
/* BAD: This item only spans 2 columns, not 3! */
.wide-panel {
  grid-column: 1 / 3; 
}
```

**Why it's wrong:** Grid line coordinates are boundaries, not tracks. Spanning from Line 1 to Line 3 covers only two columns (Track 1 and Track 2). To span three columns starting from the first line, you must target Line 4 (or write `1 / span 3`).

---



### Mistake 2: Confusing 1-Based Grid Line Numbers with Column Count Indexing

**The mistake:** Writing `grid-column: 1 / 3` expecting to span 3 columns.

**Why it's wrong:** Grid line numbers count the BOUNDARY LINES between columns. `1 / 3` spans from Line 1 to Line 3 (spanning 2 columns). To span 3 columns, use `1 / 4` or `span 3`.

*Incorrect:*
```css
/* Expecting to span 3 columns */
.card { grid-column: 1 / 3; } /* ❌ Spans 2 columns only (Line 1 to Line 3)! */
```

*Fix:*
```css
.card { grid-column: 1 / 4; } /* Or grid-column: span 3; */
```

### Mistake 3: Applying Grid Item Placement Properties (`grid-column`) to Non-Grid Parent Elements

**The mistake:** Writing `.item { grid-column: 1 / -1; }` on a child inside a `display: block` parent.

**Why it's wrong:** Grid placement properties (`grid-column`, `grid-row`, `grid-area`) function ONLY on direct child items of `display: grid` containers.

*Incorrect:*
```css
.item { grid-column: 1 / -1; } /* ❌ Ignored on non-grid child elements! */
```

*Fix:*
```css
.parent { display: grid; }
.parent > .item { grid-column: 1 / -1; }
```

## 5. Practice Exercises

### Exercise 1: Positioning Grid Items using Explicit Line Numbers

**Scenario:** An author places a hero card explicitly across grid lines 1 to 3 using `grid-column` and `grid-row`.

**Requirements:**
1. Target `.hero-card`.
2. Set `grid-column: 1 / 3`.
3. Set `grid-row: 1 / 2`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .dashboard-grid {
>   display: grid;
>   grid-template-columns: repeat(3, 1fr);
>   gap: 1.5rem;
> }
>
> /* Span hero item across first two columns explicitly */
> .hero-card {
>   grid-column: 1 / 3;           /* Starts at column line 1, ends at column line 3 */
>   grid-row: 1 / 2;              /* Starts at row line 1, ends at row line 2 */
>   background-color: #0f172a;
>   color: #ffffff;
>   padding: 2rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Grid Line Numbers**: Grid lines are numbered starting at `1` from the outer start edge of the grid.
> 2. **The `grid-column` Shorthand**: Combines `grid-column-start` and `grid-column-end` separated by a slash `/` (`1 / 3`).
> 3. **Overlapping Capabilities**: Multiple grid items can be positioned onto the exact same grid lines, allowing layered z-index overlapping!
> 
---

### Exercise 2: Spanning Featured Cards across Multiple Columns with span Keyword

**Scenario:** Uses the `span` keyword to make a featured card span 2 columns dynamically.

**Requirements:**
1. Apply `grid-column: span 2` to `.card-featured`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-featured {
>   grid-column: span 2;          /* Spans across 2 column tracks relative to current position */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `span` Keyword**: Instructs a grid item to span a relative number of tracks (`span 2`) from its current placement line.
> 2. **Dynamic Auto-Placement**: Works seamlessly with automatic grid item placement algorithms.
> 3. **Responsive Spanning Overrides**: Can be reset to `grid-column: span 1` on mobile screens via `@media` queries.
> 
---

### Exercise 3: Aligning Individual Grid Items with justify-self and align-self

**Scenario:** Aligns a single grid item within its track cell using `justify-self` and `align-self`.

**Requirements:**
1. Apply `justify-self: end` and `align-self: center`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .action-item {
>   justify-self: end;            /* Horizontal alignment within its grid cell */
>   align-self: center;           /* Vertical alignment within its grid cell */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`justify-self`**: Controls horizontal alignment of an individual grid item inside its assigned grid cell (`start`, `end`, `center`, `stretch`).
> 2. **`align-self`**: Controls vertical alignment of an individual grid item inside its assigned grid cell.
> 3. **Cell-Level Alignment Precision**: Provides granular 2D alignment control without affecting sibling grid items.
## 6. Related Terms
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The parent coordinate blueprint.
- [`grid-template-areas`](grid_template_areas.md) — The visual name placement alternative.

---

## 7. Key Takeaways
- `grid-column` and `grid-row` are child-level properties.
- They position items on the grid by targeting numbered grid lines (1-indexed).
- Shorthand syntax uses a slash: `start / end` (e.g. `grid-column: 2 / 5`).
- The `span` keyword tells the browser how many tracks to cover (e.g. `span 3`).
- Use the negative coordinate `-1` as a shortcut to target the absolute final line of the grid.
