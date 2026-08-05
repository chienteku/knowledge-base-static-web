# CSS Grid (Concept) & `display: grid`

> **Level 6 — Layouts — CSS Grid**
> The most powerful layout system in CSS, designed to handle complex, two-dimensional (rows AND columns simultaneously) webpage structures.

---

## 1. Prerequisites
- [Flexbox (Concept) & `display: flex`](../level_05/flex_parent.md) — Grid uses similar concepts (like Parent/Child relationships and `gap`), but takes them to the next level.
---

## 2. Term Category
- **Layout System (Grid)**

---

## 3. Environment Context
- **Universal Modern Standard** (Used for macro-layouts, while Flexbox is used for micro-layouts).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Flexbox is incredible, but it is **one-dimensional**. It is designed to lay things out in a single Row *or* a single Column. While `flex-wrap` allows things to wrap to a new line, you cannot strictly control how the items align vertically with the row above them. 
The W3C created **CSS Grid** to handle **two-dimensional** layouts. With Grid, the Parent container draws a literal invisible grid of intersecting rows and columns over itself. You can then take a Child element and say: "I want you to span from Column 1 to Column 3, and from Row 2 to Row 4."
It is the ultimate tool for defining the overall macro-structure of a webpage (e.g., Header, Sidebar, Main Content, Footer).

### (2) Reality Metaphor
**Flexbox** is like stringing beads on a necklace. You push them all to the left, or spread them out, but they are all stuck on a single string (1D).
**Grid** is like an Excel Spreadsheet or a chessboard. You define exactly how many columns and rows exist, and you can place elements into specific cells (2D).

### (3) Code Examples

#### Building a 3-Column Grid
Grid introduces a brand new CSS unit called the **`fr` (Fractional Unit)**. `1fr` means "take up 1 fraction of the available free space."

```html
<div class="grid-container">
  <div class="card">1</div>
  <div class="card">2</div>
  <div class="card">3</div>
  <div class="card">4</div>
</div>
```
```css
.grid-container {
  /* Turn on the Grid engine */
  display: grid;
  
  /* Define the Columns: 
     "I want 3 columns. Each column should take up 1 equal fraction (1fr) of the space." */
  grid-template-columns: 1fr 1fr 1fr;
  
  /* Use gap to space the grid cells out! */
  gap: 20px;
}

/* 
   Result: The container draws a 3-column grid. 
   Card 1 goes in Col 1. Card 2 goes in Col 2. Card 3 goes in Col 3. 
   Because there are only 3 columns, Grid automatically creates a new row, and Card 4 goes into Col 1 of the new row! 
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Grid when Flexbox is better (and vice-versa)

**The mistake:** Using Grid to align three buttons in a navigation bar, or using Flexbox to build a complex 12-column magazine layout.

**Why it's wrong:** While they overlap in capabilities, they have different purposes:
- **Use Flexbox** for **1D content-first** layouts: Navigation bars, aligning an icon next to text, or wrapping a list of tags. You let the size of the *content* dictate the layout.
- **Use Grid** for **2D layout-first** structures: The main skeleton of the webpage (Header, Sidebar, Main, Footer), or strict photo galleries where everything must perfectly align both vertically and horizontally. You let the *layout* dictate the size of the content.

---



### Mistake 2: Using CSS Grid for Simple 1D Single-Row Navigation Bars (Over-Engineering)

**The mistake:** Using CSS Grid to align 4 menu items in a single horizontal navigation row.

**Why it's wrong:** CSS Grid is designed for 2D layouts (rows AND columns simultaneously). For 1D single-row or single-column layouts, Flexbox is lighter and more appropriate.

*Incorrect:*
```css
/* Over-engineering 1D navigation bar with CSS Grid */
nav { display: grid; grid-template-columns: repeat(4, 1fr); }
```

*Fix:*
```css
/* Use Flexbox for 1D navigation layouts: */
nav { display: flex; gap: 20px; }
```

### Mistake 3: Confusing Explicit Grid Tracks with Implicit Grid Auto-Tracks

**The mistake:** Defining explicit columns `grid-template-columns` without configuring `grid-auto-rows` for dynamic rows.

**Why it's wrong:** When items exceed explicit grid definitions, CSS Grid generates implicit tracks. Configure `grid-auto-rows: minmax(100px, auto)` to control implicit row sizes.

*Incorrect:*
```css
/* Extra dynamic data rows take default height 0 or auto without min height */
```

*Fix:*
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(150px, auto); /* Implicit row height */
}
```



### Mistake 4: Using CSS Grid for Simple 1D Single-Row Navigation Bars (Over-Engineering)

**The mistake:** Using CSS Grid to align 4 menu items in a single horizontal navigation row.

**Why it's wrong:** CSS Grid is designed for 2D layouts (rows AND columns simultaneously). For 1D single-row or single-column layouts, Flexbox is lighter and more appropriate.

*Incorrect:*
```css
/* Over-engineering 1D navigation bar with CSS Grid */
nav { display: grid; grid-template-columns: repeat(4, 1fr); }
```

*Fix:*
```css
/* Use Flexbox for 1D navigation layouts: */
nav { display: flex; gap: 20px; }
```

### Mistake 5: Confusing Explicit Grid Tracks with Implicit Grid Auto-Tracks

**The mistake:** Defining explicit columns `grid-template-columns` without configuring `grid-auto-rows` for dynamic rows.

**Why it's wrong:** When items exceed explicit grid definitions, CSS Grid generates implicit tracks. Configure `grid-auto-rows: minmax(100px, auto)` to control implicit row sizes.

*Incorrect:*
```css
/* Extra dynamic data rows take default height 0 or auto without min height */
```

*Fix:*
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(150px, auto); /* Implicit row height */
}
```



### Mistake 6: Using CSS Grid for Simple 1D Single-Row Navigation Bars (Over-Engineering)

**The mistake:** Using CSS Grid to align 4 menu items in a single horizontal navigation row.

**Why it's wrong:** CSS Grid is designed for 2D layouts (rows AND columns simultaneously). For 1D single-row or single-column layouts, Flexbox is lighter and more appropriate.

*Incorrect:*
```css
/* Over-engineering 1D navigation bar with CSS Grid */
nav { display: grid; grid-template-columns: repeat(4, 1fr); }
```

*Fix:*
```css
/* Use Flexbox for 1D navigation layouts: */
nav { display: flex; gap: 20px; }
```

### Mistake 7: Confusing Explicit Grid Tracks with Implicit Grid Auto-Tracks

**The mistake:** Defining explicit columns `grid-template-columns` without configuring `grid-auto-rows` for dynamic rows.

**Why it's wrong:** When items exceed explicit grid definitions, CSS Grid generates implicit tracks. Configure `grid-auto-rows: minmax(100px, auto)` to control implicit row sizes.

*Incorrect:*
```css
/* Extra dynamic data rows take default height 0 or auto without min height */
```

*Fix:*
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(150px, auto); /* Implicit row height */
}
```

## 6. Practice Exercises

### Exercise 1: The Asymmetrical Grid

**Problem:** You want a grid with 2 columns. You want the left column to be exactly 250px wide (for a sidebar), and you want the right column to take up all the remaining flexible space. How do you write `grid-template-columns`?

**Expected output:**
> [!check]- Answer
> ```css
> grid-template-columns: 250px 1fr;
> ```
> - You can mix hard pixels with fractional (`fr`) units!

---



### Exercise 2: 2D Layout Architecture Choice

**Problem:** When is CSS Grid superior to Flexbox?

**Expected output:**
> [!check]- Answer
> ```text
> When designing 2D layouts requiring strict control over both rows AND columns simultaneously.
> ```
> ```text
> When designing 2D layouts requiring strict control over both rows AND columns simultaneously.
> ```
>
> **Explanation:** Grid controls 2D layout tracks; Flexbox controls 1D flow alignment.

---

### Exercise 3: Implicit Row Track Sizing

**Problem:** Which CSS property defines height dimensions for implicitly generated grid rows?

**Expected output:**
> [!check]- Answer
> ```text
> grid-auto-rows
> ```
> ```css
> .grid {
>   grid-auto-rows: minmax(100px, auto);
> }
> ```
>
> **Explanation:** `grid-auto-rows` sets dimensions for implicit rows generated beyond explicit templates.

## 7. Related Terms
- [Flexbox (Concept) & `display: flex`](../level_05/flex_parent.md) — The 1D alternative.
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — Track columns and rows template definitions.
- [`gap` (Grid Gap)](gap.md) — Spacing between cells.
- [`fr` Unit (Fractional Unit)](fr_unit.md) — The fractional grid track unit.
- [`grid-template-areas`](grid_template_areas.md) — Named grid areas.
---

## 8. Key Takeaways
- `display: grid;` creates a two-dimensional layout system.
- You explicitly define the columns using `grid-template-columns`.
- The `fr` (Fractional Unit) is the secret weapon of CSS Grid, allowing columns to dynamically share available space.
- **Rule of Thumb**: Flexbox is for 1D rows/columns (micro-layout). Grid is for 2D structures (macro-layout).
