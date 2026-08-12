# `align-content`

> **Level 5 — Layouts — Flexbox**
> A parent-level Flexbox property that aligns and distributes multiple rows (or columns) of flex items along the Cross Axis when wrapping is enabled and there is extra vertical space.

---

## 1. Prerequisites
- [`flex-wrap`](flex_wrap.md) — `align-content` has **no effect** unless items wrap into multiple lines!
- [`align-items`](align_items.md) — Understanding single-row alignment.

---

## 2. Term Category

**Flexbox Property (Universal Modern Standard .)**: `align-content` is a fundamental concept in this technology stack. **Level 5 — Layouts — Flexbox**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Vertical Multi-Row Spacing in Multi-Line Wrapping Flex Containers

**Scenario:** An author controls vertical line spacing across multiple wrapped rows in a tag gallery using `align-content`.

**Requirements:**
1. Apply `display: flex; flex-wrap: wrap;`.
2. Set `min-height: 20rem`.
3. Apply `align-content: space-between` to distribute wrapped rows.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .tag-gallery {
>   display: flex;
>   flex-wrap: wrap;              /* Enables multi-line row wrapping */
>   min-height: 20rem;            /* Vertical container height threshold */
>   align-content: space-between; /* Distributes vertical space between wrapped rows */
>   padding: 1.5rem;
>   background-color: #ffffff;
>   border-radius: 0.5rem;
> }
>
> .tag-item {
>   padding: 0.5rem 1rem;
>   background-color: #f1f5f9;
>   border-radius: 9999px;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `align-content` Property**: Aligns multiple rows of flex items along the cross-axis when extra space exists in a multi-line flex container (`flex-wrap: wrap`).
> 2. **Multi-Line Prerequisite**: `align-content` has NO effect on single-line flex containers (`flex-wrap: nowrap`); it strictly targets multi-row wrapped flex lines.
> 3. **`space-between` Distribution**: Pushes the first flex row to the top edge and the last flex row to the bottom edge, distributing remaining vertical space between intermediate rows.
> 
---

### Exercise 2: Centering Wrapped Badge Tags Vertically

**Scenario:** Centers multiple rows of wrapped badge tags in the middle of a modal drawer using `align-content: center`.

**Requirements:**
1. Apply `align-content: center` to multi-line tag container.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .badge-drawer {
>   display: flex;
>   flex-wrap: wrap;
>   align-content: center;        /* Bundles wrapped flex rows together in vertical center */
>   gap: 0.75rem;
>   min-height: 15rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`align-content: center` Behavior**: Packs wrapped flex rows together tightly and positions the bundled group in the vertical center of the container.
> 2. **Differs from `align-items`**: `align-items` aligns individual items WITHIN each row; `align-content` aligns the ENTIRE multi-row group as a whole.
> 3. **Clean Drawer Layout**: Prevents unwanted empty whitespace gaps between wrapped badge rows.
> 
---

### Exercise 3: Comparing align-items vs align-content in Flexbox

**Scenario:** Demonstrates single-row vs multi-row cross-axis alignment behaviors.

**Requirements:**
1. Apply `align-items: center` for single-row item alignment.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .single-line-bar {
>   display: flex;
>   flex-wrap: nowrap;
>   align-items: center;          /* Aligns items vertically in a single row */
>   gap: 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Single-Row Alignment (`align-items`)**: Use `align-items` for single-line flex rows to center buttons, icons, and text.
> 2. **Multi-Row Alignment (`align-content`)**: Use `align-content` only when `flex-wrap: wrap` creates multiple flex line rows.
> 3. **Flexbox Cross-Axis Control**: Mastering both properties guarantees full control over cross-axis layout geometry.
## 6. Related Terms
- [`flex-wrap`](flex_wrap.md) — The required prerequisite.
- [`align-items`](align_items.md) — Single-line vertical alignment.
- [`justify-content`](justify_content.md) — Horizontal main axis alignment.

---

## 7. Key Takeaways
- `align-content` distributes space between **rows** of flex items.
- It **only works if wrapping (`flex-wrap: wrap`) is enabled** and there are multiple rows.
- The parent container must have an explicit height (or min-height) so there is vertical space to distribute.
- Use `align-items` to align items inside a single row; use `align-content` to align multiple rows.
