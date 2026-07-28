# `top`, `bottom`, `left`, `right`

> **Level 4 — Display & Positioning**
> The coordinate properties used to actually move an element after its `position` has been set to something other than `static`.

---

## 1. Prerequisites
- [Positioning (`relative`, `absolute`, `fixed`)](../level_04/position_static_relative.md) — These four properties **do absolutely nothing** unless the element is positioned!

---

## 2. Term Category
- **Positioning Coordinate Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you declare that an element is `absolute` or `relative`, the browser needs to know *where* to put it. The W3C created four directional coordinates: `top`, `bottom`, `left`, and `right`.
These properties tell the browser exactly how far to push the element away from the edges of its positioning container. 

### (2) Reality Metaphor
Imagine a bulletin board (the parent container) and a thumbtack (the element).
If you say `top: 10px; right: 10px;`, you are telling the browser: "Start at the top-right corner of the bulletin board, measure 10 pixels down, measure 10 pixels to the left, and push the thumbtack in right there."

### (3) Code Examples

#### Pinning to corners
```css
.badge {
  position: absolute;
  /* Push 0px away from the top edge, and 0px away from the left edge */
  /* Result: It sits exactly in the top-left corner! */
  top: 0;
  left: 0;
}

.floating-action-button {
  position: fixed;
  /* Push 20px up from the bottom edge, and 20px left from the right edge */
  /* Result: A sticky button hovering in the bottom-right corner! */
  bottom: 20px;
  right: 20px;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Opposing coordinates without a set width/height

**The mistake:** Setting `left: 0;` and `right: 0;` at the same time on an absolute element, expecting it to center itself.

**Why it's wrong:** It won't center the element! Instead, it will physically stretch the element so its left edge touches the left side of the container, and its right edge touches the right side of the container. If you want to center an absolute element, you need to use a specific `transform` trick, not opposing coordinates.

### Mistake 2: Forgetting to unlock the element first

**The mistake:** Trying to use `top: 20px;` on a normal paragraph.

**Why it's wrong:** As learned in the previous terms, normal elements are `position: static`. Static elements **completely ignore** coordinate properties. You must add `position: relative;` (or absolute/fixed) first.

---



### Mistake 3: Setting Both `top` and `bottom` (or `left` and `right`) Without `position` Changed from `static`

**The mistake:** Writing `div { top: 10px; left: 20px; }` on default static elements.

**Why it's wrong:** Offset properties `top`, `bottom`, `left`, `right` have ZERO effect on elements with `position: static`. Set `position: relative`, `absolute`, or `fixed`.

*Incorrect:*
```css
div { top: 50px; } /* ❌ Ignored on default position: static elements! */
```

*Fix:*
```css
div { position: relative; top: 50px; }
```

### Mistake 4: Confusing Offset Properties with `margin` Spacing

**The mistake:** Using `position: relative; left: 20px;` to space out adjacent buttons.

**Why it's wrong:** Offset properties move element visual rendering without pushing adjacent elements away. Use `margin` or Flexbox `gap` for layout spacing.

*Incorrect:*
```css
button { position: relative; left: 15px; } /* ❌ Leaves original space gap */
```

*Fix:*
```css
button { margin-left: 15px; }
```



### Mistake 5: Setting Both `top` and `bottom` (or `left` and `right`) Without `position` Changed from `static`

**The mistake:** Writing `div { top: 10px; left: 20px; }` on default static elements.

**Why it's wrong:** Offset properties `top`, `bottom`, `left`, `right` have ZERO effect on elements with `position: static`. Set `position: relative`, `absolute`, or `fixed`.

*Incorrect:*
```css
div { top: 50px; } /* ❌ Ignored on default position: static elements! */
```

*Fix:*
```css
div { position: relative; top: 50px; }
```

### Mistake 6: Confusing Offset Properties with `margin` Spacing

**The mistake:** Using `position: relative; left: 20px;` to space out adjacent buttons.

**Why it's wrong:** Offset properties move element visual rendering without pushing adjacent elements away. Use `margin` or Flexbox `gap` for layout spacing.

*Incorrect:*
```css
button { position: relative; left: 15px; } /* ❌ Leaves original space gap */
```

*Fix:*
```css
button { margin-left: 15px; }
```



### Mistake 7: Setting Both `top` and `bottom` (or `left` and `right`) Without `position` Changed from `static`

**The mistake:** Writing `div { top: 10px; left: 20px; }` on default static elements.

**Why it's wrong:** Offset properties `top`, `bottom`, `left`, `right` have ZERO effect on elements with `position: static`. Set `position: relative`, `absolute`, or `fixed`.

*Incorrect:*
```css
div { top: 50px; } /* ❌ Ignored on default position: static elements! */
```

*Fix:*
```css
div { position: relative; top: 50px; }
```

### Mistake 8: Confusing Offset Properties with `margin` Spacing

**The mistake:** Using `position: relative; left: 20px;` to space out adjacent buttons.

**Why it's wrong:** Offset properties move element visual rendering without pushing adjacent elements away. Use `margin` or Flexbox `gap` for layout spacing.

*Incorrect:*
```css
button { position: relative; left: 15px; } /* ❌ Leaves original space gap */
```

*Fix:*
```css
button { margin-left: 15px; }
```

## 6. Practice Exercises

### Exercise 1: The Invisible Box

**Problem:** You have an empty `<div>` with `position: absolute;`. You add `top: 0; bottom: 0; left: 0; right: 0;` and a blue background color. What does it look like?

**Expected output:**
> [!check]- Answer
> ```text
> The box will stretch to completely cover the entire parent container! Because you pinned all four edges to the walls of the parent, the blue background will fill the entire space.
> ```
> - What happens when you pin a rubber sheet to all four corners of a frame?

---



### Exercise 2: Full Stretch Absolute Positioning

**Problem:** Write CSS stretching an absolute overlay `.overlay` to fill 100% of its relative parent using offset properties.

**Expected output:**
> [!check]- Answer
> ```text
> .overlay { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
> ```
> ```css
> .overlay {
>   position: absolute;
>   top: 0;
>   right: 0;
>   bottom: 0;
>   left: 0;
> }
> ```
>
> **Explanation:** Setting `top: 0; bottom: 0; left: 0; right: 0` stretches absolute elements across parent boundaries.

---

### Exercise 3: Logical Inset Property

**Problem:** Which modern shorthand CSS property replaces setting `top: 0; right: 0; bottom: 0; left: 0;`?

**Expected output:**
> [!check]- Answer
> ```text
> inset: 0;
> ```
> ```css
> .overlay {
>   position: absolute;
>   inset: 0;
> }
> ```
>
> **Explanation:** `inset: 0` is shorthand for top, right, bottom, and left zero offsets.

## 7. Related Terms
- [`position: absolute` vs `fixed`](../level_04/position_absolute_fixed.md) — The primary positioning properties.
- [`position: sticky`](../level_04/position_sticky.md) — The hybrid boundary scrolling property.

---

## 8. Key Takeaways
- `top`, `bottom`, `left`, and `right` are coordinates used to move positioned elements.
- They are completely ignored if `position: static` (the default) is active.
- Pinning opposing sides (e.g., `left: 0; right: 0;`) will stretch the element to fill the space.
