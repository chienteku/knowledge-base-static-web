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
- **Layout Property**

---

## 3. Environment Context
- **Universal Browser Support** (Requires parent container viewport calculation logic. Disables itself automatically if parent overflows are detected).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 5: Forgetting to Specify at Least One Offset Property (`top`, `bottom`) on Sticky Elements

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

### Mistake 6: Placing `position: sticky` Elements Inside Parent Containers with `overflow: hidden` or `overflow: auto`

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



### Mistake 7: Forgetting to Specify at Least One Offset Property (`top`, `bottom`) on Sticky Elements

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

### Mistake 8: Placing `position: sticky` Elements Inside Parent Containers with `overflow: hidden` or `overflow: auto`

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

## 6. Practice Exercises

### Exercise 1: Table Headers

**Problem:** You are styling a long table (`<table>`) and want the table header row (`<tr>`) to remain visible at the top of the viewport when scrolling. What ruleset do you write?

**Expected output:**
> [!check]- Answer
> ```css
> /* Note: You must target the <th> tags directly, as <tr> tags do not support sticky positioning natively on some browsers. */
> th {
>   position: sticky;
>   top: 0;
>   background-color: white; /* Prevent background rows from bleeding through text */
> }
> ```
> - Target table headers `<th>`, not parent table elements.
> - Give them a solid background color so overlapping rows don't show through.

---



### Exercise 2: Sticky Header Navigation Bar

**Problem:** Write CSS pinning `.navbar` to the top of the viewport when scrolled, with `z-index: 100`.

**Expected output:**
> [!check]- Answer
> ```text
> .navbar { position: sticky; top: 0; z-index: 100; }
> ```
> ```css
> .navbar {
>   position: sticky;
>   top: 0;
>   z-index: 100;
> }
> ```
>
> **Explanation:** `position: sticky; top: 0` sticks the navbar to the top viewport edge during page scroll.

---

### Exercise 3: Sticky Positioning Container Boundary

**Problem:** What limits how far down a sticky element will scroll before stopping?

**Expected output:**
> [!check]- Answer
> ```text
> A sticky element scrolls ONLY within the boundary of its immediate parent container element.
> ```
> ```text
> A sticky element scrolls ONLY within the boundary of its immediate parent container element.
> ```
>
> **Explanation:** Sticky elements stop scrolling when reaching the bottom boundary of their parent container.

## 7. Related Terms
- [`position: static` vs `relative`](position_static_relative.md) — The parent relative settings.
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Viewport locked layouts.
- [`overflow` (hidden, scroll, auto, visible)](../level_02/overflow.md) — The parent parameters that disable sticky positioning.
- [`top`, `bottom`, `left`, `right`](top_bottom_left_right.md) — Related concept: `top`, `bottom`, `left`, `right`.

---

## 8. Key Takeaways
- `position: sticky` is a hybrid of relative and fixed positioning.
- Sticky elements scroll naturally until they reach a threshold, then lock in place.
- **You must define an offset coordinate** (like `top: 0;`) to activate sticky behavior.
- Sticky elements are bound by their parent container's borders.
- Any parent container with `overflow: hidden` (or `scroll`/`auto`) will completely disable sticky positioning.
