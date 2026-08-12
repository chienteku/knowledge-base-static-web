# `position: sticky`

> **Level 4 — Display & Positioning**
> A hybrid positioning property that treats an element as `position: relative` (scrolling normally) until it reaches a specified scroll threshold, at which point it "sticks" to the screen like `position: fixed`.

---

## 1. Prerequisites
- [`position: static` vs `relative`](position_static_relative.md) — Sticky starts as a relative offset.
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Sticky mimics fixed positioning during scroll locks.
- [`top`, `bottom`, `left`, `right`](top_bottom_left_right.md) — The required threshold coordinates.

---

## 2. Term Category

**Layout Property (Universal Browser Support .)**: `position: sticky` is a fundamental concept in this technology stack. **Level 4 — Display & Positioning**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users read a long article or browse a huge data table, they often lose track of where they are if the main navigation bar or table headers scroll off the top of the screen.

In the past, to build a "sticky" header that stayed visible, developers had to write complex JavaScript scroll-listeners to calculate offsets in real-time, swapping classes from relative to fixed on the fly. 

This was slow, hit CPU performance on mobile, and caused screen jitter.

The W3C created **`position: sticky`** to solve this natively. 

It lets you declare that an element should scroll naturally at first, but lock itself to the edge of the screen once it hits a specific scroll boundary.

---

### (2) The Parent Boundary Rule
A sticky element behaves under one strict rule: **It is trapped inside its parent container.**

-   It will stick to the screen as long as its parent container is still visible.
-   Once the parent container scrolls completely off the screen, it pulls the sticky child away with it.
-   If the parent container has the exact same height as the sticky child, the child has no room to slide, so it will **never stick**.

---

### (3) Code Examples

#### Short Snippet
A navigation bar that sticks to the top of the browser:

```css
.nav-header {
  position: sticky;
  /* CRITICAL: You must declare where it should stick! */
  top: 0; 
  background-color: white;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sticky Positioning Demos</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      height: 2000px; /* Force page scrolling */
    }

    .header {
      background-color: #333;
      color: white;
      padding: 15px;
      text-align: center;
      /* Sticks to the very top of the window when you scroll past it */
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .container {
      margin: 50px auto;
      width: 500px;
      height: 600px; /* Big parent container */
      background-color: #eee;
      position: relative;
    }

    .sticky-sidebar {
      background-color: tomato;
      color: white;
      padding: 20px;
      width: 150px;
      /* Sticks 20px below the header when scrolling within .container */
      position: sticky;
      top: 70px; /* 50px header + 20px gap */
    }
  </style>
</head>
<body>

  <div class="header">Sticky Navigation Bar</div>

  <div class="container">
    <p>Scroll down to see the sidebar stick...</p>
    <div class="sticky-sidebar">Sticky Sidebar</div>
    <p style="margin-top: 400px;">
      Once this gray container scrolls off the screen, the red sidebar 
      will be pulled away with it.
    </p>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the coordinate threshold

**The mistake:** Declaring `position: sticky;` but omitting the offset coordinate:

```css
/* BAD: This element will behave like position: relative and never stick! */
.header {
  position: sticky;
}
```

**Why it's wrong:** The browser needs to know *at what point* to lock the element. Without declaring a coordinate threshold like `top: 0;` or `bottom: 10px;`, the engine assumes no limit is active, and the element scrolls away normally.

---

### Mistake 2: The Overflow Killer

**The mistake:** Setting `position: sticky; top: 0;` on an element, but one of its parent containers has `overflow: hidden;` applied:

```css
/* BAD: Setting this on a parent disables sticky on all children! */
.page-wrapper {
  overflow: hidden;
}
```

**Why it's wrong:** The sticky layout engine calculates scrolling offsets relative to the closest scrollable parent. If a parent container has `overflow: hidden`, `scroll`, or `auto`, the parent acts as the scroll boundary, blocking the viewport calculation and preventing the child from sticking to the page.

---



### Mistake 3: Forgetting to Specify at Least One Offset Property (`top`, `bottom`) on Sticky Elements

**The mistake:** Setting `position: sticky` on a header without setting `top: 0`.

**Why it's wrong:** For `position: sticky` to function, you MUST specify at least one threshold offset property (e.g. `top: 0`). Without an offset property, the element remains static.

*Incorrect:*
```css
.header { position: sticky; } /* ❌ Missing top: 0! Sticky positioning fails! */
```

*Fix:*
```css
.header { position: sticky; top: 0; } /* Explicit sticky top threshold */
```

### Mistake 4: Placing `position: sticky` Elements Inside Parent Containers with `overflow: hidden` or `overflow: auto`

**The mistake:** Placing a sticky nav header inside a parent container with `overflow: hidden`.

**Why it's wrong:** If ANY ancestor container has `overflow: hidden`, `overflow: auto`, or `overflow: scroll`, sticky positioning breaks completely because the scroll context is locked to the parent container.

*Incorrect:*
```css
<div style="overflow: hidden;">
  <header style="position: sticky; top: 0;">Header</header> <!-- ❌ Sticky fails due to parent overflow! -->
</div>
```

*Fix:*
```css
/* Remove overflow: hidden from ancestor containers to restore sticky scrolling */
```

## 5. Practice Exercises

### Exercise 1: Sticky Navigation Bar Header with position sticky

**Scenario:** An author builds a sticky website header that scrolls naturally until reaching the top of the viewport, where it pins.

**Requirements:**
1. Apply `position: sticky; top: 0;` to header.
2. Set `z-index: 100`.
3. Verify background color is opaque.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .site-header {
>   position: sticky;             /* Hybrid: Scrolls naturally, then pins at top: 0! */
>   top: 0;                       /* Sticky threshold boundary */
>   background-color: #ffffff;    /* Opaque background prevents text bleed-through */
>   padding: 1rem 2rem;
>   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
>   z-index: 100;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `position: sticky` Property**: A hybrid positioning mode that acts like `position: relative` until its container crosses a specified threshold (`top: 0`), then acts like `position: fixed`!
> 2. **Mandatory Threshold Offset**: `position: sticky` REQUIRES at least one offset property (`top`, `bottom`, `left`, `right`) to function.
> 3. **No Body Padding Needed**: Unlike `position: fixed`, sticky headers occupy space in normal flow initially, so no compensatory `body` top padding is required.
> 
---

### Exercise 2: Sticky Table Column and Header Rows in Data Tables

**Scenario:** Pins data table headers to the top during long table scrolling.

**Requirements:**
1. Apply `position: sticky; top: 0;` to `<th>` elements.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .data-table th {
>   position: sticky;
>   top: 0;
>   background-color: #f8fafc;    /* Required to hide scrolling data rows behind header */
>   z-index: 10;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Sticky Table Headers**: Keeps dataset column headers visible while users scroll down long financial or analytics tables.
> 2. **Container Bound Limit**: Sticky elements pin ONLY within the physical boundaries of their parent container (e.g. `<table>` or `<article>`).
> 3. **Opaque Background Rule**: Always set solid `background-color` on sticky headers to prevent scrolling content from showing through.
> 
---

### Exercise 3: Debugging Sticky Positioning Failures caused by Parent Overflow

**Scenario:** Fixes a broken sticky header caused by a parent container having `overflow: hidden`.

**Requirements:**
1. Remove `overflow: hidden` on parent containers of sticky elements.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ Parent with overflow: hidden BREAKS sticky positioning on children!
> .parent-container { overflow: hidden; } 
> */
>
> /* ✅ Clean Parent Container (Allows sticky children to track viewport) */
> .parent-container {
>   overflow: visible;            /* Restores sticky scrolling functionality */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Sticky Parent Overflow Pitfall**: If ANY parent ancestor of a sticky element has `overflow: hidden|auto|scroll`, sticky positioning BROKES completely!
> 2. **Debugging Checklist**: When sticky positioning fails: 1) Check for parent `overflow`, 2) Verify `top` offset exists, 3) Ensure parent height is taller than sticky item.
> 3. **Parent Height Boundary**: A sticky element cannot stick if its parent container is the exact same height as the sticky item.
## 6. Related Terms
- [`position: static` vs `relative`](position_static_relative.md) — The parent relative settings.
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Viewport locked layouts.
- [`overflow` (hidden, scroll, auto, visible)](../level_02/overflow.md) — The parent parameters that disable sticky positioning.
- [`top`, `bottom`, `left`, `right`](top_bottom_left_right.md) — Related concept: `top`, `bottom`, `left`, `right`.

---

## 7. Key Takeaways
- `position: sticky` is a hybrid of relative and fixed positioning.
- Sticky elements scroll naturally until they reach a threshold, then lock in place.
- **You must define an offset coordinate** (like `top: 0;`) to activate sticky behavior.
- Sticky elements are bound by their parent container's borders.
- Any parent container with `overflow: hidden` (or `scroll`/`auto`) will completely disable sticky positioning.
