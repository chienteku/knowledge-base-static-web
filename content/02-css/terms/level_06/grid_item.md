# `grid-column` / `grid-row` (Grid Item Placement)

> **Level 6 — Layouts — CSS Grid**
> The child-level CSS Grid properties used to align and span individual items across multiple grid tracks by referencing grid line coordinates.

---

## 1. Prerequisites
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent properties that define the grid lines items place themselves against.

---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Supported natively by all modern browsers. Stretches child layout boxes across computed track offsets).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing 1-Based Grid Line Numbers with Column Count Indexing

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

### Mistake 5: Applying Grid Item Placement Properties (`grid-column`) to Non-Grid Parent Elements

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



### Mistake 6: Confusing 1-Based Grid Line Numbers with Column Count Indexing

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

### Mistake 7: Applying Grid Item Placement Properties (`grid-column`) to Non-Grid Parent Elements

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

## 6. Practice Exercises

### Exercise 1: Full-Width Footer

**Problem:** You have a grid container with 12 responsive columns. Write the ruleset for a `.footer` child element so that it always spans the entire width of the grid, regardless of screen resizing.

**Expected output:**
> [!check]- Answer
> ```css
> .footer {
>   grid-column: 1 / -1;
> }
> ```
> - Remember the negative index shortcut that targets the final grid boundary line.

---



### Exercise 2: Full-Width Grid Column Span Pattern

**Problem:** Write CSS `grid-column` shorthand spanning a grid item across all columns from first line to last line.

**Expected output:**
> [!check]- Answer
> ```text
> grid-column: 1 / -1;
> ```
> ```css
> .full-width {
>   grid-column: 1 / -1;
> }
> ```
>
> **Explanation:** `1 / -1` spans from line 1 to the final grid line (-1).

---

### Exercise 3: Span Keyword Syntax

**Problem:** Write `grid-column` syntax starting at column line 2 and spanning 3 columns.

**Expected output:**
> [!check]- Answer
> ```text
> grid-column: 2 / span 3;
> ```
> ```css
> .span-item {
>   grid-column: 2 / span 3;
> }
> ```
>
> **Explanation:** `span N` specifies relative track span count.

## 7. Related Terms
- [`grid-template-columns` / `grid-template-rows`](../level_06/grid_template.md) — The parent coordinate blueprint.
- [`grid-template-areas`](../level_06/grid_template_areas.md) — The visual name placement alternative.

---

## 8. Key Takeaways
- `grid-column` and `grid-row` are child-level properties.
- They position items on the grid by targeting numbered grid lines (1-indexed).
- Shorthand syntax uses a slash: `start / end` (e.g. `grid-column: 2 / 5`).
- The `span` keyword tells the browser how many tracks to cover (e.g. `span 3`).
- Use the negative coordinate `-1` as a shortcut to target the absolute final line of the grid.
