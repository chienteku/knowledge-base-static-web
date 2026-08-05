# `align-content`

> **Level 5 — Layouts — Flexbox**
> A parent-level Flexbox property that aligns and distributes multiple rows (or columns) of flex items along the Cross Axis when wrapping is enabled and there is extra vertical space.

---

## 1. Prerequisites
- [`flex-wrap`](flex_wrap.md) — `align-content` has **no effect** unless items wrap into multiple lines!
- [`align-items`](align_items.md) — Understanding single-row alignment.
---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Supported natively by all browsers. Calculates spacing parameters for multi-line layout blocks).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you use `flex-wrap: wrap;` in a Flex Container, items that don't fit on the first line drop down to start a second line. 

If your container is tall (for example, a dashboard widget grid that is `500px` tall), you now have two lines of items sitting in a large box.

By default, the browser spaces these lines out, leaving large gaps of empty space between the rows. 

But what if you want all the rows to cluster tightly together in the exact center of the widget? 

What if you want to push them all to the bottom?

The W3C created **`align-content`** to solve this. 

While `justify-content` distributes items horizontally along the Main Axis, and `align-items` aligns individual items inside a *single* row, `align-content` aligns the **rows themselves** along the Cross Axis.

---

### (2) The Difference: `align-items` vs. `align-content`
-   **`align-items`**: Thinks about the individual items *inside* a single line. It asks: *"Should the text in this row sit at the top or bottom of this specific row?"*
-   **`align-content`**: Thinks about the *entire lines* as blocks. It asks: *"Should the first row and second row be pushed together, or spaced apart?"*

---

### (3) The Core Values
Assuming `flex-wrap: wrap` and `flex-direction: row` (vertical Cross Axis distribution):

-   **`stretch` (Default)**: Rows stretch to split and fill the remaining height of the container.
-   **`flex-start`**: Packs all rows tightly at the top of the container.
-   **`flex-end`**: Packs all rows tightly at the bottom of the container.
-   **`center`**: Packs all rows tightly in the vertical center.
-   **`space-between`**: Puts the first row at the top edge, the last row at the bottom edge, and spaces the remaining rows out evenly.
-   **`space-around`**: Distributes equal space around each row block.

---

### (4) Code Examples

#### Short Snippet
Centering multi-row grids:

```css
.card-grid {
  display: flex;
  flex-wrap: wrap; /* CRITICAL: Enables multi-row wrapping */
  height: 500px;
  
  /* Packs both rows tightly together in the vertical center of the 500px height */
  align-content: center; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Align Content Demo</title>
  <style>
    .grid {
      display: flex;
      flex-wrap: wrap; /* Required for align-content to work! */
      height: 350px;
      width: 250px;
      background-color: #f4f4f4;
      border: 2px solid black;
      margin: 10px;
      float: left;
    }

    .box {
      width: 100px;
      height: 50px;
      margin: 5px;
      background-color: lightcoral;
      text-align: center;
      line-height: 50px;
      font-weight: bold;
    }

    /* Distribution values */
    .start  { align-content: flex-start; }
    .center { align-content: center; }
    .between { align-content: space-between; }
  </style>
</head>
<body>

  <!-- Case 1: Rows packed at top -->
  <div class="grid start">
    <div class="box">1</div>
    <div class="box">2</div>
    <div class="box">3</div>
    <div class="box">4</div>
  </div>

  <!-- Case 2: Rows centered together -->
  <div class="grid center">
    <div class="box">1</div>
    <div class="box">2</div>
    <div class="box">3</div>
    <div class="box">4</div>
  </div>

  <!-- Case 3: Rows spaced apart -->
  <div class="grid between">
    <div class="box">1</div>
    <div class="box">2</div>
    <div class="box">3</div>
    <div class="box">4</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `align-content` on a single-row flexbox

**The mistake:** Declaring `align-content: center;` on a navigation bar where all items fit perfectly in a single row:

```css
/* BAD: align-content does absolutely nothing here! */
.navbar {
  display: flex;
  height: 80px;
  align-content: center; 
}
```

**Why it's wrong:** `align-content` works exclusively on **flex lines** (multiple rows). If there is only a single row, there are no lines to space out, so the browser ignores this property. 

To center elements inside a single row vertically, you must use **`align-items: center;`** instead.

---



### Mistake 2: Attempting to Use `align-content` on Single-Line Flex Containers Without `flex-wrap: wrap`

**The mistake:** Adding `align-content: center` to a single-line flex container (`flex-wrap: nowrap`).

**Why it's wrong:** `align-content` controls space distribution between MULTIPLE flex lines. On a single-line flex container, `align-content` has ZERO effect! Use `align-items` for single-line alignment.

*Incorrect:*
```css
.container { display: flex; align-content: center; } /* ❌ Ignored on single-line flex container! */
```

*Fix:*
```css
.container { display: flex; flex-wrap: wrap; align-content: center; }
```

### Mistake 3: Confusing `align-content` (Multi-Line Spacing) with `align-items` (Single-Item Alignment)

**The mistake:** Using `align-content: center` expecting individual items on a single row to align vertically.

**Why it's wrong:** `align-items` aligns individual flex items along the cross axis inside a single flex line. `align-content` aligns entire flex lines relative to each other.

*Incorrect:*
```css
/* Trying to align items on 1 row vertically using align-content */
```

*Fix:*
```css
.container { display: flex; align-items: center; } /* Aligns items on single row */
```

## 6. Practice Exercises

### Exercise 1: Spacing Rows

**Problem:** You are building a responsive image gallery. The images wrap onto three rows inside a container that has a fixed height of `600px`. You want the first row at the top edge, the third row at the bottom edge, and the middle row centered. What property and value do you declare?

**Expected output:**
> [!check]- Answer
> ```css
> .gallery-container {
>   display: flex;
>   flex-wrap: wrap;
>   height: 600px;
>   align-content: space-between;
> }
> ```
> - Check which property handles rows distribution, and which value pins elements to the outer edges.

---



### Exercise 2: Multi-Line Flex Alignment Setup

**Problem:** Write CSS for multi-line flex container distributing flex lines with equal space between them.

**Expected output:**
> [!check]- Answer
> ```text
> .container { display: flex; flex-wrap: wrap; align-content: space-between; }
> ```
> ```css
> .container {
>   display: flex;
>   flex-wrap: wrap;
>   align-content: space-between;
> }
> ```
>
> **Explanation:** `align-content: space-between` distributes extra vertical space between wrapped flex lines.

---

### Exercise 3: align-content Default Value

**Problem:** What is default value of `align-content` in CSS Flexbox?

**Expected output:**
> [!check]- Answer
> ```text
> align-content: normal (or stretch).
> ```
> ```text
> align-content: normal (or stretch).
> ```
>
> **Explanation:** Default `normal`/`stretch` expands flex lines to fill container height.

## 7. Related Terms
- [`flex-wrap`](flex_wrap.md) — The required prerequisite.
- [`align-items`](align_items.md) — Single-line vertical alignment.
- [`justify-content`](justify_content.md) — Horizontal main axis alignment.
---

## 8. Key Takeaways
- `align-content` distributes space between **rows** of flex items.
- It **only works if wrapping (`flex-wrap: wrap`) is enabled** and there are multiple rows.
- The parent container must have an explicit height (or min-height) so there is vertical space to distribute.
- Use `align-items` to align items inside a single row; use `align-content` to align multiple rows.
