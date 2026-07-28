# `display: none` vs `visibility: hidden`

> **Level 4 — Display & Positioning**
> The two primary CSS properties used to hide HTML elements, differing fundamentally in whether they release or preserve the element's physical layout space.

---

## 1. Prerequisites
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — The parent display rules.
- [The Box Model](../../level_02/box_model.md) — The physical layout box that is hidden.

---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Browser Support** (Processed during the layout phase. `display: none` prevents layout box construction, whereas `visibility: hidden` constructs the box but skips painting it).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern interactive web pages, developers frequently need to hide and show elements. For instance, hiding a mobile sidebar menu until the user clicks the hamburger button, or displaying a custom tooltip popup when hovering over a button.

CSS provides two distinct tools to hide elements:
-   **`display: none;`**
-   **`visibility: hidden;`**

Although both make the element completely invisible to sighted users, their impact on the surrounding document layout is completely different. 

Choosing the wrong property can cause parts of your page to jump around unexpectedly or leave massive, awkward blank spaces.

---

### (2) The Differences

#### 1. `display: none;` (The Collapse)
-   **Visual:** Completely invisible.
-   **Layout Math:** The element is completely removed from the document flow. The browser acts as if the element does not exist.
-   **Result:** The space collapses. Any surrounding elements move up to fill the vacant spot.

#### 2. `visibility: hidden;` (The Ghost)
-   **Visual:** Completely invisible.
-   **Layout Math:** The element remains in the document flow. It keeps its exact physical width and height.
-   **Result:** The space is preserved. Sighted users see a blank, empty gap on the page. Surrounding elements do not shift.

---

### (3) Accessibility Warning (Screen Readers)
Both `display: none` and `visibility: hidden` hide content from **screen readers** (assistive technology used by blind and visually impaired users). 

If you hide a form label or button using these properties, a blind user will have no way of knowing it exists.

If your goal is to hide text *only from sighted users* while keeping it read aloud by screen readers (for search engines or accessibility instructions), **do not use these properties**. 

Instead, use a custom accessibility utility class (like `.sr-only` or `.visually-hidden`) that shrinks the box to a single transparent pixel using absolute positioning:

```css
/* Screen-reader-only utility class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

### (4) Code Examples

#### Short Snippet
Comparing declarations:

```css
.closed-menu {
  /* Renders nothing; adjacent elements slide up */
  display: none; 
}

.invisible-placeholder {
  /* Renders blank space; layout remains intact */
  visibility: hidden; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hiding Showcase</title>
  <style>
    .card {
      width: 150px;
      padding: 15px;
      margin: 10px;
      float: left;
      text-align: center;
      background-color: lightblue;
      border: 1px solid black;
    }

    .hide-display {
      display: none;
    }

    .hide-visibility {
      visibility: hidden;
    }
  </style>
</head>
<body>

  <!-- Normal Row -->
  <div class="card">Card 1</div>
  <div class="card hide-display">Card 2 (display: none)</div>
  <div class="card">Card 3</div>

  <div style="clear: both; margin-bottom: 40px;"></div>

  <!-- Visibility Row -->
  <div class="card">Card A</div>
  <div class="card hide-visibility">Card B (visibility: hidden)</div>
  <div class="card">Card C</div>

</body>
</html>
```

*Rendering Results:*
-   In the first row, Card 3 will slide to the left, sitting directly next to Card 1 because Card 2 has collapsed.
-   In the second row, Card C will remain on the far right, leaving a massive empty space in the middle where Card B is hidden.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to animate `display: none` using transitions

**The mistake:** Setting a dropdown menu to `display: none; transition: opacity 0.5s;` and hoping it fades in slowly when you toggle it to `display: block;`:

```css
/* BAD: Fades will NOT work! The menu pops in instantly */
.dropdown {
  display: none;
  opacity: 0;
  transition: opacity 0.5s;
}
.dropdown.open {
  display: block;
  opacity: 1;
}
```

**Why it's wrong:** The `display` property is a binary state (either the box exists or it doesn't). It has no numerical midpoints. The browser cannot calculate a midpoint between "none" and "block," so it ignores the transition and pops the element onto the screen instantly.

**Fix: Animate `opacity` and toggle `visibility` instead, or transition max-height settings.**

---



### Mistake 2: Using `display: none` Expecting the Element to Keep Its Space in Page Layout

**The mistake:** Hiding an element using `display: none` expecting lower content to remain in place.

**Why it's wrong:** `display: none` removes the element COMPLETELY from the DOM layout render tree, collapsing its space and causing surrounding content to shift up. Use `visibility: hidden` to preserve layout space.

*Incorrect:*
```css
.card { display: none; } /* ❌ Collapses box space, causing layout shift! */
```

*Fix:*
```css
.card { visibility: hidden; } /* Hides visual content but preserves layout box space */
```

### Mistake 3: Using `visibility: hidden` Expecting Screen Readers to Read the Hidden Content

**The mistake:** Hiding text visually via `visibility: hidden` intended for screen reader accessibility.

**Why it's wrong:** Both `display: none` and `visibility: hidden` hide elements from screen readers. To hide content visually while keeping it accessible to screen readers, use `.sr-only` clip patterns.

*Incorrect:*
```css
.accessible-text { visibility: hidden; } /* ❌ Screen readers ignore visibility: hidden! */
```

*Fix:*
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```



### Mistake 4: Using `display: none` Expecting the Element to Keep Its Space in Page Layout

**The mistake:** Hiding an element using `display: none` expecting lower content to remain in place.

**Why it's wrong:** `display: none` removes the element COMPLETELY from the DOM layout render tree, collapsing its space and causing surrounding content to shift up. Use `visibility: hidden` to preserve layout space.

*Incorrect:*
```css
.card { display: none; } /* ❌ Collapses box space, causing layout shift! */
```

*Fix:*
```css
.card { visibility: hidden; } /* Hides visual content but preserves layout box space */
```

### Mistake 5: Using `visibility: hidden` Expecting Screen Readers to Read the Hidden Content

**The mistake:** Hiding text visually via `visibility: hidden` intended for screen reader accessibility.

**Why it's wrong:** Both `display: none` and `visibility: hidden` hide elements from screen readers. To hide content visually while keeping it accessible to screen readers, use `.sr-only` clip patterns.

*Incorrect:*
```css
.accessible-text { visibility: hidden; } /* ❌ Screen readers ignore visibility: hidden! */
```

*Fix:*
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```



### Mistake 6: Using `display: none` Expecting the Element to Keep Its Space in Page Layout

**The mistake:** Hiding an element using `display: none` expecting lower content to remain in place.

**Why it's wrong:** `display: none` removes the element COMPLETELY from the DOM layout render tree, collapsing its space and causing surrounding content to shift up. Use `visibility: hidden` to preserve layout space.

*Incorrect:*
```css
.card { display: none; } /* ❌ Collapses box space, causing layout shift! */
```

*Fix:*
```css
.card { visibility: hidden; } /* Hides visual content but preserves layout box space */
```

### Mistake 7: Using `visibility: hidden` Expecting Screen Readers to Read the Hidden Content

**The mistake:** Hiding text visually via `visibility: hidden` intended for screen reader accessibility.

**Why it's wrong:** Both `display: none` and `visibility: hidden` hide elements from screen readers. To hide content visually while keeping it accessible to screen readers, use `.sr-only` clip patterns.

*Incorrect:*
```css
.accessible-text { visibility: hidden; } /* ❌ Screen readers ignore visibility: hidden! */
```

*Fix:*
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 6. Practice Exercises

### Exercise 1: Layout Analysis

**Problem:** Look at the following styling declaration applied to a banner header:

```css
.banner-alert {
  visibility: hidden;
}
```

If this alert box sits between a heading (`<h1>`) and a paragraph (`<p>`), what happens to the spacing between the heading and paragraph?

**Expected output:**
```text
The spacing remains exactly the same! Because `visibility: hidden` does not collapse the box, the empty space occupied by the alert banner is preserved. Sighted users will see a large blank gap between the heading and the paragraph.
```

> [!check]- Answer
> - Does visibility hidden remove elements from the layout flow?

---



### Exercise 2: Display None vs Visibility Hidden Comparison

**Problem:** Compare `display: none` vs `visibility: hidden` across:
1. Layout space preservation
2. DOM event listening

**Expected output:**
```text
1. display: none collapses layout space; visibility: hidden preserves layout space
2. Both prevent click interactions on hidden elements
```

> [!check]- Answer
> ```text
> 1. display: none collapses layout space; visibility: hidden preserves layout space
> 2. Both prevent click interactions on hidden elements
> ```
>
> **Explanation:** `display: none` alters render tree layout; `visibility: hidden` toggles visual rendering only.

### Exercise 3: CSS Transitioning Visibility

**Problem:** Can `display` be animated smoothly with CSS transitions? Can `opacity` + `visibility` be transitioned?

**Expected output:**
```text
display CANNOT be transitioned smoothly. opacity + visibility CAN be transitioned together.
```

> [!check]- Answer
> ```css
> .modal {
>   opacity: 0;
>   visibility: hidden;
>   transition: opacity 0.3s, visibility 0.3s;
> }
> .modal.open {
>   opacity: 1;
>   visibility: visible;
> }
> ```
>
> **Explanation:** Combining `opacity` and `visibility` allows smooth fade transitions.

## 7. Related Terms
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — The parent display rules.
- [`opacity`](../../level_08/opacity.md) — The styling property that adjusts visibility percentage from 0 to 100.

---

## 8. Key Takeaways
- `display: none` completely deletes the element from the layout flow, collapsing its space.
- `visibility: hidden` hides the element visually, but preserves its layout space (renders as an empty gap).
- Neither property is accessible; both hide content from screen readers.
- To hide content solely for screen reader accessibility, use an `.sr-only` absolute clip class.
- `display` changes cannot be animated with CSS transition fades.
