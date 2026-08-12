# `flex-grow` / `flex-shrink` / `flex-basis`

> **Level 5 — Layouts — Flexbox**
> The three child-level Flexbox properties (and their combined `flex` shorthand) used to control how individual flex items grow to fill empty space, shrink when container space is tight, and establish their baseline sizes.

---

## 1. Prerequisites
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — Must be applied to the parent container.
- [`flex-direction`](flex_direction.md) — Dictates which axis (width or height) the sizing math applies to.

---

## 2. Term Category

**Flexbox Property (Universal Modern Standard .)**: `flex-grow` / `flex-shrink` / `flex-basis` is a fundamental concept in this technology stack. **Level 5 — Layouts — Flexbox**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Fluid Resizable Card Grids using flex Shorthand

**Scenario:** An author builds a responsive fluid card grid using the `flex` shorthand property (`flex: 1 1 20rem`).

**Requirements:**
1. Apply `flex: 1 1 20rem` to card items.
2. Set `flex-wrap: wrap` on container.
3. Verify fluid shrinking and growing.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .grid-container {
>   display: flex;
>   flex-wrap: wrap;
>   gap: 1.5rem;
> }
>
> .grid-card {
>   /* Flex Shorthand: flex-grow | flex-shrink | flex-basis */
>   flex: 1 1 20rem;              /* Grows, shrinks, ideal baseline width 20rem (320px) */
>   padding: 1.5rem;
>   background-color: #ffffff;
>   border-radius: 0.5rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `flex` Shorthand Property**: Combines `flex-grow`, `flex-shrink`, and `flex-basis` into a single declaration.
> 2. **`flex-grow: 1`**: Allows the item to expand to fill remaining available space in the flex line.
> 3. **`flex-shrink: 1`**: Allows the item to shrink proportionally if container space is constricted.
> 4. **`flex-basis: 20rem`**: Sets the initial ideal size of the flex item before space distribution occurs.
> 
---

### Exercise 2: Fixed-Width Sidebar with Flexible Content Area

**Scenario:** Creates a layout with a fixed 18rem sidebar and a fluid main content area using `flex` properties.

**Requirements:**
1. Apply `flex: 0 0 18rem` to sidebar.
2. Apply `flex: 1 1 auto` to main content.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .layout-wrapper {
>   display: flex;
>   gap: 2rem;
> }
>
> .sidebar {
>   flex: 0 0 18rem;              /* Do NOT grow, do NOT shrink, fixed 18rem width */
> }
>
> .main-content {
>   flex: 1 1 0;                  /* Grow to fill remaining width, shrink as needed */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Fixed Flex Item (`flex: 0 0 18rem`)**: Setting grow and shrink to `0` locks the item to an exact fixed width (`18rem`).
> 2. **Fluid Flex Item (`flex: 1 1 0`)**: Setting grow to `1` forces the main content area to consume all remaining horizontal space.
> 3. **Zero Basis Hack**: Using `flex-basis: 0` in `flex: 1 1 0` distributes space based purely on ratio rather than content size.
> 
---

### Exercise 3: Preventing Flex Child Shrinking Bugs with flex-shrink: 0

**Scenario:** Prevents fixed-size avatar images or icons from squishing inside flex rows using `flex-shrink: 0`.

**Requirements:**
1. Apply `flex-shrink: 0` to avatar image.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .avatar-img {
>   width: 3rem;
>   height: 3rem;
>   flex-shrink: 0;               /* Prevents flex container from squishing avatar image! */
>   border-radius: 9999px;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Flex Shrink Squishing Bug**: By default, flex items have `flex-shrink: 1`, causing fixed-size icons or images to distort when text overflows.
> 2. **`flex-shrink: 0` Lock**: Setting `flex-shrink: 0` guarantees the icon preserves its exact width and height regardless of container constrictions.
> 3. **Essential for Media Objects**: Standard defensive CSS pattern for user avatars and icon buttons.
## 6. Related Terms
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — The parent container.
- [Shorthand vs Longhand Properties](../level_01/shorthand_longhand.md) — The combined syntax layout.

---

## 7. Key Takeaways
- `flex-basis` defines the initial target size of a flex item.
- `flex-grow` controls how much an item expands to absorb empty container space.
- `flex-shrink` controls how much an item compresses when space is constrained.
- Always use the `flex` shorthand: `flex: [grow] [shrink] [basis];`.
- To make a flex item fixed and unshrinkable, declare `flex: 0 0 [size];`.
