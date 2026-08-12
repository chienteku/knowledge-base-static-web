# `auto-fill` / `auto-fit`

> **Level 6 — Layouts — CSS Grid**
> Special count keywords used inside the `repeat()` function to automatically generate as many column or row tracks as can fit in the grid container, enabling responsiveness without media queries.

---

## 1. Prerequisites
- [`repeat()` Function](grid_repeat.md) — These keywords are used exclusively inside `repeat()`.
- [`grid-template-columns` / `grid-template-rows`](grid_template.md) — The properties they configure.

---

## 2. Term Category

**Layout Property (Universal Modern Standard .)**: `auto-fill` / `auto-fit` is a fundamental concept in this technology stack. **Level 6 — Layouts — CSS Grid**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard responsive web design, you have to write media queries to change column structures for different screens:
-   On phone: 1 column
-   On tablet: 2 columns
-   On desktop: 4 columns

This requires writing three separate blocks of CSS. 

What if the browser could do this calculation automatically? 

What if you could just tell the container: "draw as many `200px` columns as you can fit. If the screen is small, fit 1. If it grows, fit 4."

The W3C created **`auto-fill`** and **`auto-fit`** to solve this. 

Used as the count parameter in the `repeat()` function, they instruct the browser to calculate column counts dynamically based on the container's width, eliminating media queries for standard grids.

---

### (2) The Difference: `auto-fill` vs. `auto-fit`
The difference between the two keywords only appears when you have **fewer items than the grid has space for** (e.g. you have only 2 cards, but the wide desktop screen has space for 5 columns).

#### 1. `auto-fill` (Fill with Empty Tracks)
The browser creates as many tracks of the specified size as fit. 
-   Even if there are no items to put in them, **the empty tracks remain in the layout**. 
-   Your two cards will sit on the left, and the remaining space will stay empty.

#### 2. `auto-fit` (Collapse Empty Tracks)
The browser creates as many tracks as fit, but then **collapses any empty tracks to `0px` wide**.
-   The space of those empty tracks is redistributed to the active columns.
-   Your two cards will stretch to fill the entire width of the container.

---

### (3) The Dynamic Duo: `auto-fit` + `minmax()`
To build the classic responsive card grid, you combine `auto-fit` with the `minmax()` function (detailed in Term #60):

`grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));`

*Translation:* "Draw columns that are at least `250px` wide. If there is extra space, let them grow. Wrap them automatically when they hit `250px` bounds."

---

### (4) Code Examples

#### Short Snippet
Auto-responsive grid (no media queries!):

```css
.card-grid {
  display: grid;
  /* Columns automatically wrap and scale to fit container width */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
```

#### Fuller Example (Comparison Showcase)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Auto-Fill vs Auto-Fit</title>
  <style>
    .container {
      width: 800px;
      background-color: #ddd;
      padding: 10px;
      margin-bottom: 20px;
    }

    .item {
      background-color: steelblue;
      color: white;
      padding: 15px;
      font-weight: bold;
      text-align: center;
    }

    /* Auto-Fill: keeps empty column slots */
    .fill-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }

    /* Auto-Fit: stretches active items to fit whole row */
    .fit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
  </style>
</head>
<body>

  <h3>Auto-Fill (Leaves Empty Slots on Right)</h3>
  <div class="container fill-grid">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <div class="item">Item 3</div>
  </div>

  <h3>Auto-Fit (Stretches Items to Fill Row)</h3>
  <div class="container fit-grid">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <div class="item">Item 3</div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `1fr` directly inside auto-repeat

**The mistake:** Declaring `repeat(auto-fit, 1fr)`:

```css
/* BAD: Invalid syntax! Grid calculation will crash and default to single-column */
.grid {
  grid-template-columns: repeat(auto-fit, 1fr); 
}
```

**Why it's wrong:** The `fr` unit represents a fraction of *flexible* space. Because `1fr` can shrink to `0px`, the browser cannot calculate how many columns will fit. 

To use `auto-fit/fill`, you **must** provide a minimum size constraint using fixed units (like pixels) or the `minmax()` helper.

---



### Mistake 2: Confusing `auto-fill` with `auto-fit` in Responsive Grids

**The mistake:** Using `auto-fill` when you want a few items to stretch and fill the remaining row width on wide screens.

**Why it's wrong:** `auto-fill` creates empty virtual column tracks on wide screens when item count is small. `auto-fit` collapses empty tracks to 0px, allowing existing items to stretch across the full row.

*Incorrect:*
```css
/* With 2 items on wide screen: auto-fill leaves empty blank column tracks */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
```

*Fix:*
```css
/* auto-fit collapses empty tracks, stretching items to fill full row width: */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

### Mistake 3: Using `auto-fill`/`auto-fit` Without `minmax()` Function

**The mistake:** Writing `grid-template-columns: repeat(auto-fit, 250px);`.

**Why it's wrong:** Using fixed `250px` without `minmax()` creates fixed columns that fail to stretch fluidly across remaining free space.

*Incorrect:*
```css
grid-template-columns: repeat(auto-fit, 250px); /* ❌ Non-fluid fixed columns */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive fluid grid */
```



### Mistake 4: Confusing `auto-fill` with `auto-fit` in Responsive Grids

**The mistake:** Using `auto-fill` when you want a few items to stretch and fill the remaining row width on wide screens.

**Why it's wrong:** `auto-fill` creates empty virtual column tracks on wide screens when item count is small. `auto-fit` collapses empty tracks to 0px, allowing existing items to stretch across the full row.

*Incorrect:*
```css
/* With 2 items on wide screen: auto-fill leaves empty blank column tracks */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
```

*Fix:*
```css
/* auto-fit collapses empty tracks, stretching items to fill full row width: */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

### Mistake 5: Using `auto-fill`/`auto-fit` Without `minmax()` Function

**The mistake:** Writing `grid-template-columns: repeat(auto-fit, 250px);`.

**Why it's wrong:** Using fixed `250px` without `minmax()` creates fixed columns that fail to stretch fluidly across remaining free space.

*Incorrect:*
```css
grid-template-columns: repeat(auto-fit, 250px); /* ❌ Non-fluid fixed columns */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive fluid grid */
```



### Mistake 6: Confusing `auto-fill` with `auto-fit` in Responsive Grids

**The mistake:** Using `auto-fill` when you want a few items to stretch and fill the remaining row width on wide screens.

**Why it's wrong:** `auto-fill` creates empty virtual column tracks on wide screens when item count is small. `auto-fit` collapses empty tracks to 0px, allowing existing items to stretch across the full row.

*Incorrect:*
```css
/* With 2 items on wide screen: auto-fill leaves empty blank column tracks */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
```

*Fix:*
```css
/* auto-fit collapses empty tracks, stretching items to fill full row width: */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

### Mistake 7: Using `auto-fill`/`auto-fit` Without `minmax()` Function

**The mistake:** Writing `grid-template-columns: repeat(auto-fit, 250px);`.

**Why it's wrong:** Using fixed `250px` without `minmax()` creates fixed columns that fail to stretch fluidly across remaining free space.

*Incorrect:*
```css
grid-template-columns: repeat(auto-fit, 250px); /* ❌ Non-fluid fixed columns */
```

*Fix:*
```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive fluid grid */
```

## 5. Practice Exercises

### Exercise 1: Fill vs Fit Selection

**Problem:** You are building a search results page. The items are card blocks. If a user searches for something rare and only gets 1 card result on a wide desktop screen:
- Option A: You want the card to stay its normal size and sit on the left.
- Option B: You want the card to stretch and take up the entire width of the page.
Which keyword (`auto-fill` or `auto-fit`) do you use for Option A, and which for Option B?

**Expected output:**
> [!check]- Answer
> ```text
> - Option A: Use `auto-fill` (leaves the remaining column slots open).
> - Option B: Use `auto-fit` (collapses the empty slots, stretching the single card).
> ```
> - Which keyword "fills" the layout row with empty spaces, and which "fits" the active items?
> 
---



### Exercise 2: Responsive Media-Query-Less Grid Template

**Problem:** Write classic single-line CSS Grid rule for responsive card grid (min 280px cards, fluid expansion, auto-stretching).

**Expected output:**
> [!check]- Answer
> ```text
> grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
> ```
> ```css
> .grid {
>   display: grid;
>   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
>   gap: 20px;
> }
> ```
>
> **Explanation:** The `repeat(auto-fit, minmax(280px, 1fr))` pattern builds responsive grids with zero media queries.
> 
---

### Exercise 3: auto-fill vs auto-fit Trait Difference

**Problem:** What happens when 2 items of min width 200px are placed in a 1000px wide grid using `auto-fill` vs `auto-fit`?

**Expected output:**
> [!check]- Answer
> ```text
> auto-fill keeps 5 track slots (2 items + 3 empty tracks); auto-fit collapses empty tracks so the 2 items stretch to 500px each.
> ```
> ```text
> auto-fill keeps 5 track slots (2 items + 3 empty tracks); auto-fit collapses empty tracks so the 2 items stretch to 500px each.
> ```
>
> **Explanation:** `auto-fit` stretches items across full width; `auto-fill` preserves empty track slots.
> 
## 6. Related Terms
- [`repeat()` Function](grid_repeat.md) — The loop container.
- [`minmax()` Function](grid_minmax.md) — The required track bounds function.
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — The legacy responsive breakpoint method.

---

## 7. Key Takeaways
- `auto-fill` and `auto-fit` replace fixed loop counts inside `repeat()`.
- They calculate columns dynamically based on the width of the container.
- `auto-fill` preserves empty column tracks, leaving gaps on the right.
- `auto-fit` collapses empty tracks to `0px`, stretching the active items to fill the row.
- They must be paired with fixed minimum track sizes (like `minmax(200px, 1fr)`) to prevent calculations failure.
