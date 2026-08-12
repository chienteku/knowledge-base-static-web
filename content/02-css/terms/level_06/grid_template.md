# `grid-template-columns` / `grid-template-rows`

> **Level 6 — Layouts — CSS Grid**
> The parent-level CSS Grid properties used to define the number, sizes, and track boundaries of columns and rows within a grid container.

---

## 1. Prerequisites
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — The parent container trigger that activates Grid math.

---

## 2. Term Category

**Layout Property (Universal Modern Standard .)**: `grid-template-columns` / `grid-template-rows` is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Declaring `display: grid;` on a parent container turns on the CSS Grid layout engine, but it doesn't automatically arrange your cards. By default, you just get a single-column stack.

To build grids (like card sheets or multi-column newspaper layouts), the browser needs a blueprint. It needs to know:
-   How many columns and rows do you want?
-   How wide or tall should each individual track be?

The W3C created **`grid-template-columns`** and **`grid-template-rows`** to act as this layout blueprint. 

You write a space-separated list of values, and the browser draws matching guidelines across the container.

---

### (2) Defining Grid Tracks
The values you pass to these properties dictate both the **number** of tracks and their **sizes**. 

Each space-separated value represents one track:

```css
.grid {
  display: grid;
  /* Draws 3 columns: first is 200px, second is 100px, third is 200px */
  grid-template-columns: 200px 100px 200px;
}
```

You can use any standard CSS sizing unit:
-   **Fixed Units (`px`)**: Hard values that never scale.
-   **Fluid Percentages (`%`)**: Scales relative to the container width.
-   **Content-Based (`auto`)**: The track expands or shrinks to fit the content inside it.
-   **Fractional Units (`fr`)**: Distributes the remaining free space of the container (detailed in Term #56).

---

### (3) Grid Line Numbering
When the browser draws your columns and rows, it automatically numbers the boundaries between them (called **Grid Lines**).

Lines are 1-indexed, starting from the start edge:
-   If you define **3 columns**, the browser draws **4 vertical lines**:
    `Line 1` (left edge) | `Track 1` | `Line 2` | `Track 2` | `Line 3` | `Track 3` | `Line 4` (right edge).
-   These lines are used to place and stretch child items (detailed in Term #55).

---

### (4) Code Examples

#### Short Snippet
A standard 3-column card grid:

```css
.card-grid {
  display: grid;
  /* 3 equal columns sharing space */
  grid-template-columns: 1fr 1fr 1fr;
  /* 2 rows: first is 150px tall, second fits its content */
  grid-template-rows: 150px auto;
  gap: 15px;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grid Templates Showcase</title>
  <style>
    .grid-layout {
      display: grid;
      /* Column 1 (sidebar): 200px wide
         Column 2 (main content): takes up all remaining space */
      grid-template-columns: 200px 1fr;
      
      /* Row 1 (header): 80px tall
         Row 2 (content panel): 300px tall
         Row 3 (footer): 60px tall */
      grid-template-rows: 80px 300px 60px;
      gap: 10px;
      background-color: #ddd;
    }

    .cell {
      background-color: white;
      border: 1px solid #333;
      padding: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div class="grid-layout">
    <div class="cell">Header / Logo</div>
    <div class="cell">Header Navigation</div>
    <div class="cell">Sidebar Panel</div>
    <div class="cell">Main Article Space</div>
    <div class="cell">Footer Left</div>
    <div class="cell">Footer Right</div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using commas to separate track sizes

**The mistake:** Writing track sizes like a comma-separated function argument list:

```css
/* BAD: Invalid syntax! Browser will ignore this template rule */
.grid {
  grid-template-columns: 1fr, 2fr, 1fr; 
}
```

**Why it's wrong:** The CSS Grid specifications require track sizes to be **space-separated** values. Commas are syntax errors and will cause the browser to discard the entire layout instruction.

**Fix: Remove the commas.**
```css
/* CORRECT */
.grid {
  grid-template-columns: 1fr 2fr 1fr;
}
```

---



### Mistake 2: Mismatching Column Counts Between `grid-template-columns` and `grid-template-rows`

**The mistake:** Confusing `grid-template-columns` with `grid-template-rows`.

**Why it's wrong:** `grid-template-columns` defines HORIZONTAL column tracks; `grid-template-rows` defines VERTICAL row track heights.

*Incorrect:*
```css
/* Trying to create 3 horizontal columns using grid-template-rows */
.grid { grid-template-rows: 1fr 1fr 1fr; } /* ❌ Creates 3 vertical rows instead! */
```

*Fix:*
```css
.grid { grid-template-columns: 1fr 1fr 1fr; } /* 3 horizontal columns */
```

### Mistake 3: Forgetting the Forward Slash `/` Separator in `grid-template` Shorthand

**The mistake:** Writing `grid-template: 100px 1fr 200px 1fr;` without slash.

**Why it's wrong:** In `grid-template` shorthand, row tracks are defined BEFORE the slash `/`, and column tracks AFTER the slash (`grid-template: rows / columns`).

*Incorrect:*
```css
/* Missing slash separator in grid-template shorthand */
.grid { grid-template: 100px 1fr 200px 1fr; }
```

*Fix:*
```css
.grid { grid-template: 100px 1fr / 200px 1fr; } /* rows / columns */
```



### Mistake 4: Mismatching Column Counts Between `grid-template-columns` and `grid-template-rows`

**The mistake:** Confusing `grid-template-columns` with `grid-template-rows`.

**Why it's wrong:** `grid-template-columns` defines HORIZONTAL column tracks; `grid-template-rows` defines VERTICAL row track heights.

*Incorrect:*
```css
/* Trying to create 3 horizontal columns using grid-template-rows */
.grid { grid-template-rows: 1fr 1fr 1fr; } /* ❌ Creates 3 vertical rows instead! */
```

*Fix:*
```css
.grid { grid-template-columns: 1fr 1fr 1fr; } /* 3 horizontal columns */
```

### Mistake 5: Forgetting the Forward Slash `/` Separator in `grid-template` Shorthand

**The mistake:** Writing `grid-template: 100px 1fr 200px 1fr;` without slash.

**Why it's wrong:** In `grid-template` shorthand, row tracks are defined BEFORE the slash `/`, and column tracks AFTER the slash (`grid-template: rows / columns`).

*Incorrect:*
```css
/* Missing slash separator in grid-template shorthand */
.grid { grid-template: 100px 1fr 200px 1fr; }
```

*Fix:*
```css
.grid { grid-template: 100px 1fr / 200px 1fr; } /* rows / columns */
```



### Mistake 6: Mismatching Column Counts Between `grid-template-columns` and `grid-template-rows`

**The mistake:** Confusing `grid-template-columns` with `grid-template-rows`.

**Why it's wrong:** `grid-template-columns` defines HORIZONTAL column tracks; `grid-template-rows` defines VERTICAL row track heights.

*Incorrect:*
```css
/* Trying to create 3 horizontal columns using grid-template-rows */
.grid { grid-template-rows: 1fr 1fr 1fr; } /* ❌ Creates 3 vertical rows instead! */
```

*Fix:*
```css
.grid { grid-template-columns: 1fr 1fr 1fr; } /* 3 horizontal columns */
```

### Mistake 7: Forgetting the Forward Slash `/` Separator in `grid-template` Shorthand

**The mistake:** Writing `grid-template: 100px 1fr 200px 1fr;` without slash.

**Why it's wrong:** In `grid-template` shorthand, row tracks are defined BEFORE the slash `/`, and column tracks AFTER the slash (`grid-template: rows / columns`).

*Incorrect:*
```css
/* Missing slash separator in grid-template shorthand */
.grid { grid-template: 100px 1fr 200px 1fr; }
```

*Fix:*
```css
.grid { grid-template: 100px 1fr / 200px 1fr; } /* rows / columns */
```

## 5. Practice Exercises

### Exercise 1: Standard Dashboard Blueprint

**Problem:** Build the CSS rule for a grid container that has a fixed sidebar on the left (`250px`), a fluid center content column, and a fixed details pane on the right (`300px`).

**Expected output:**
> [!check]- Answer
> ```css
> .dashboard-grid {
>   display: grid;
>   grid-template-columns: 250px 1fr 300px;
> }
> ```
> - Define three space-separated track widths.
> - Use pixels for fixed columns, and fractional units for fluid columns.
> 
---



### Exercise 2: Explicit Grid Template Layout

**Problem:** Write CSS for `.app` grid defining 3 rows (`60px`, `1fr`, `40px`) and 2 columns (`250px`, `1fr`).

**Expected output:**
> [!check]- Answer
> ```text
> .app { display: grid; grid-template-rows: 60px 1fr 40px; grid-template-columns: 250px 1fr; }
> ```
> ```css
> .app {
>   display: grid;
>   grid-template-rows: 60px 1fr 40px;
>   grid-template-columns: 250px 1fr;
> }
> ```
>
> **Explanation:** `grid-template-rows` and `grid-template-columns` define explicit grid structures.
> 
---

### Exercise 3: grid-template Shorthand Syntax

**Problem:** Combine rows (`60px 1fr`) and columns (`200px 1fr`) into single `grid-template` shorthand rule.

**Expected output:**
> [!check]- Answer
> ```text
> grid-template: 60px 1fr / 200px 1fr;
> ```
> ```css
> .layout {
>   display: grid;
>   grid-template: 60px 1fr / 200px 1fr;
> }
> ```
>
> **Explanation:** `grid-template` shorthand combines `rows / columns`.
> 
## 6. Related Terms
- [CSS Grid (Concept) & `display: grid`](grid_concept.md) — The parent trigger.
- [`fr` Unit (Fractional Unit)](fr_unit.md) — The flexible track sizing unit.
- [`grid-column` / `grid-row` (Grid Item Placement)](grid_item.md) — Positioning children on the grid lines.
- [`gap` (Grid Gap)](gap.md) — Related concept: `gap` (Grid Gap).
- [`minmax()` Function](grid_minmax.md) — Related concept: `minmax()` Function.
- [`repeat()` Function](grid_repeat.md) — Related concept: `repeat()` Function.
- [`grid-template-areas`](grid_template_areas.md) — Related concept: `grid-template-areas`.

---

## 7. Key Takeaways
- `grid-template-columns` and `grid-template-rows` draw the grid's lines.
- Each space-separated value defines the size of one track (column or row).
- Track sizes can mix absolute units (`px`), relative units (`%`), `auto`, and `fr`.
- Never use commas to separate track sizes.
- Defining tracks automatically creates numbered Grid Lines (1-indexed) used for item placements.
