# `flex-grow` / `flex-shrink` / `flex-basis`

> **Level 5 — Layouts — Flexbox**
> The three child-level Flexbox properties (and their combined `flex` shorthand) used to control how individual flex items grow to fill empty space, shrink when container space is tight, and establish their baseline sizes.

---

## 1. Prerequisites
- [`display: flex`](../level_05/flex_parent.md) — Must be applied to the parent container.
- [`flex-direction`](../level_05/flex_direction.md) — Dictates which axis (width or height) the sizing math applies to.

---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Browsers dynamically solve system equations to divide container pixels among items based on these values).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web design, layouts must be fluid. If a user views your website on a wide desktop screen, you want your panels to expand and fill the screen. If they view it on a mobile phone, elements must shrink to fit.

By default, Flexbox sizes children based on their raw content or width. 

But designers need precise control over this stretching and squeezing:
-   Can this item expand?
-   Can that item shrink?
-   What should the item's starting size be before any stretching or shrinking happens?

To answer these, the W3C defined **`flex-grow`**, **`flex-shrink`**, and **`flex-basis`** as child-level properties.

---

### (2) The Three Sizing Knobs

#### 1. `flex-basis` (The Starting Size)
Defines the **initial baseline size** of a flex item before the browser calculates any empty space or packing.
-   Acts as a replacement for `width` (if `flex-direction: row`) or `height` (if `flex-direction: column`).
-   Syntax: `flex-basis: 200px;` or `flex-basis: auto;`.

#### 2. `flex-grow` (The Expansion Weight)
Defines the item's ability to grow and absorb remaining empty space in the container.
-   Value is a **unitless number** representing a weight. Default is **`0`** (do not grow).
-   If Container has `300px` of empty space, and two items both have `flex-grow: 1`, they each get `150px` of extra space.
-   If Item A has `flex-grow: 2` and Item B has `flex-grow: 1`, Item A gets `200px` (2/3) and Item B gets `100px` (1/3).

#### 3. `flex-shrink` (The Compression Weight)
Defines the item's ability to shrink when the container is too small to fit all items.
-   Value is a **unitless number**. Default is **`1`** (shrink proportionally to fit).
-   If you set `flex-shrink: 0;`, the item **refuses to shrink** under any circumstance, forcing other items to squeeze further or spilling out of the container.

---

### (3) The `flex` Shorthand (Best Practice)
Professional developers almost never write the three longhand properties. Instead, they use the combined **`flex` shorthand**:

`flex: [flex-grow] [flex-shrink] [flex-basis];`

-   Example: `flex: 1 1 200px;` (Grow: yes, Shrink: yes, Starting size: 200px).
-   **`flex: 1;`** — Shorthand for `flex: 1 1 0%;`. (Grow and shrink to fill the screen completely).
-   **`flex: 0 0 auto;`** — Shorthand for "Don't grow, don't shrink, just stick to my content size." (Perfect for fixed sidebars!).

---

### (4) Code Examples

#### Short Snippet
Fixed sidebar and fluid main content:

```css
.sidebar {
  /* Don't grow, don't shrink, stay exactly 250px wide */
  flex: 0 0 250px; 
}

.main-content {
  /* Grow and shrink dynamically to fill all remaining horizontal space */
  flex: 1; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flex Sizing Showcase</title>
  <style>
    .flex-container {
      display: flex;
      width: 700px;
      background-color: #eee;
      border: 2px solid black;
      padding: 10px;
    }

    .box {
      padding: 20px;
      font-weight: bold;
      text-align: center;
    }

    /* Grow ratios */
    .box-grow-1 {
      background-color: lightblue;
      flex: 1 1 100px; /* Grow weight: 1 */
    }

    .box-grow-2 {
      background-color: lightgreen;
      flex: 2 1 100px; /* Grow weight: 2. Gets double the empty space! */
    }

    .box-fixed {
      background-color: tomato;
      color: white;
      flex: 0 0 150px; /* Fixed: refuses to grow or shrink */
    }
  </style>
</head>
<body>

  <div class="flex-container">
    <div class="box box-grow-1">Grow 1 (100px base)</div>
    <div class="box box-grow-2">Grow 2 (100px base)</div>
    <div class="box box-fixed">Fixed (150px)</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `flex-basis` with a fixed `width` constraint

**The mistake:** Assuming setting `flex-basis: 300px;` means the box is locked to exactly 300px:

```css
/* BAD: This item can still shrink below 300px if space is tight! */
.card {
  flex-basis: 300px;
}
```

**Why it's wrong:** `flex-basis` is a *starting target* size, not a hard limit. If the parent container runs out of horizontal space, and the card has `flex-shrink: 1` (the default), the browser will squeeze it below 300px to prevent overflow. 

**Fix: To lock a box size completely, you must declare `flex: 0 0 300px;` (setting shrink to 0).**

---



### Mistake 2: Writing Longhand `flex-grow`, `flex-shrink`, `flex-basis` Separately (Syntax Inconsistency)

**The mistake:** Writing `flex-grow: 1; flex-shrink: 0; flex-basis: 0%;` as 3 separate rules.

**Why it's wrong:** Using separate longhands is verbose and prone to unit errors. Use the shorthand `flex: 1 0 0%` (or `flex: 1`).

*Incorrect:*
```css
.item {
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 0%; /* Verbose longhand declaration */
}
```

*Fix:*
```css
.item {
  flex: 1 0 0%; /* Recommended shorthand syntax */
}
```

### Mistake 3: Confusing `flex: 1` (`flex: 1 1 0%`) with `flex: auto` (`flex: 1 1 auto`)

**The mistake:** Using `flex: auto` expecting all columns to have equal width regardless of content size.

**Why it's wrong:** `flex: 1` uses `flex-basis: 0%`, ignoring content size to make columns EXACTLY equal width. `flex: auto` uses `flex-basis: auto`, sizing columns proportional to content.

*Incorrect:*
```css
.col { flex: auto; } /* ❌ Columns with long text become wider than columns with short text! */
```

*Fix:*
```css
.col { flex: 1; } /* All columns forced to equal 1:1 width ratio */
```

## 6. Practice Exercises

### Exercise 1: Space Division

**Problem:** You have a container that is `600px` wide. Inside it, you place three boxes. 
- Box A has `flex: 1 1 100px;`.
- Box B has `flex: 1 1 100px;`.
- Box C has `flex: 0 0 100px;`.
How many pixels wide will Box A be on the screen?

**Expected output:**
> [!check]- Answer
> ```text
> 250px! 
> 1. Starting sizes (flex-basis) total is 300px (100 + 100 + 100).
> 2. The remaining empty space is 300px (600 container - 300 baseline).
> 3. Box A and Box B have grow weight of 1, Box C has 0. Total grow weights = 2.
> 4. Box A gets half of the empty space: 300 / 2 = 150px.
> 5. Box A final size is 100px baseline + 150px growth = 250px.
> ```
> - Subtract the sum of baseline sizes from the parent container width.
> - Divide the remaining space among growing items based on their weights.

---



### Exercise 2: Flex Shorthand Expansion

**Problem:** Expand `flex: 1;` into its 3 longhand values (`flex-grow`, `flex-shrink`, `flex-basis`).

**Expected output:**
> [!check]- Answer
> ```text
> flex-grow: 1, flex-shrink: 1, flex-basis: 0%
> ```
> ```text
> flex-grow: 1
> flex-shrink: 1
> flex-basis: 0%
> ```
>
> **Explanation:** `flex: 1` expands to `1 1 0%`, allocating equal container space.

---

### Exercise 3: Preventing Item Shrinking

**Problem:** Write CSS `flex` declaration preventing a flex item from shrinking when container space is tight.

**Expected output:**
> [!check]- Answer
> ```text
> flex-shrink: 0; (or flex: 0 0 auto;)
> ```
> ```css
> .fixed-sidebar {
>   flex-shrink: 0;
> }
> ```
>
> **Explanation:** `flex-shrink: 0` locks flex item dimensions from shrinking.

## 7. Related Terms
- [`display: flex`](../level_05/flex_parent.md) — The parent container.
- [Shorthand vs Longhand Properties](../level_01/shorthand_longhand.md) — The combined syntax layout.

---

## 8. Key Takeaways
- `flex-basis` defines the initial target size of a flex item.
- `flex-grow` controls how much an item expands to absorb empty container space.
- `flex-shrink` controls how much an item compresses when space is constrained.
- Always use the `flex` shorthand: `flex: [grow] [shrink] [basis];`.
- To make a flex item fixed and unshrinkable, declare `flex: 0 0 [size];`.
