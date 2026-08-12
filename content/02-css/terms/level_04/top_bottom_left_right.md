# `top`, `bottom`, `left`, `right`

> **Level 4 — Display & Positioning**
> The coordinate properties used to actually move an element after its `position` has been set to something other than `static`.

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Positioning Coordinate Property (Universal Browser Support)**: `top`, `bottom`, `left`, `right` is a fundamental concept in this technology stack. **Level 4 — Display & Positioning**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Pinning Absolute Overlay Elements using top, bottom, left, right

**Scenario:** An author pins a modal backdrop to fill 100% of the screen using `top: 0; bottom: 0; left: 0; right: 0;`.

**Requirements:**
1. Apply `position: fixed`.
2. Set `top: 0; bottom: 0; left: 0; right: 0;`.
3. Use modern `inset: 0` shorthand.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Modal Backdrop pinned to all 4 viewport edges */
> .modal-backdrop {
>   position: fixed;
>   /* Legacy 4-property expansion: */
>   /* top: 0; bottom: 0; left: 0; right: 0; */
>
>   /* Modern CSS Shorthand: */
>   inset: 0;                     /* Sets top, right, bottom, left to 0 in one line! */
>   background-color: rgb(15 23 42 / 0.75);
>   z-index: 1000;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Offset Properties (`top`, `bottom`, `left`, `right`)**: Specify the offset distance of a positioned element relative to its containing block edges.
> 2. **The `inset` Shorthand**: `inset: 0` is the modern shorthand for `top: 0; right: 0; bottom: 0; left: 0;`.
> 3. **4-Corner Stretch**: Pinning all 4 offsets to `0` stretches a positioned element to fill 100% of its containing block without setting explicit `width`/`height`.
> 
---

### Exercise 2: Center Alignment Hacks via Offset Percentages

**Scenario:** Centers a modal dialog precisely in the middle of the screen using 50% offsets and `transform`.

**Requirements:**
1. Apply `top: 50%; left: 50%; transform: translate(-50%, -50%);`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .centered-modal {
>   position: fixed;
>   top: 50%;
>   left: 50%;
>   transform: translate(-50%, -50%);  /* Shifts card back by 50% of its own width/height */
>   background-color: #ffffff;
>   padding: 2rem;
>   border-radius: 0.5rem;
>   z-index: 1100;
> }
> ```
>
> #### Technical Explanation
>
> 1. **50% Offset Reference**: Setting `top: 50%; left: 50%;` places the TOP-LEFT corner of the modal at the exact center of the screen.
> 2. **Negative Translate Compensation**: Setting `transform: translate(-50%, -50%)` shifts the modal back by half of its OWN width/height, achieving true visual centering.
> 3. **Modern Dialog Alternative**: Native `<dialog>` elements achieve centering automatically without transform hacks.
> 
---

### Exercise 3: Logical Offset Equivalents for Internationalization

**Scenario:** Uses logical inset properties (`inset-block-start`, `inset-inline-end`) for RTL script support.

**Requirements:**
1. Apply `inset-inline-end: 1rem`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-badge {
>   position: absolute;
>   inset-block-start: 1rem;      /* Replaces top: 1rem */
>   inset-inline-end: 1rem;       /* Replaces right: 1rem in LTR, left: 1rem in RTL */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Logical Inset Properties**: `inset-block-start` (top), `inset-inline-end` (right/left) adapt automatically to text direction.
> 2. **Right-to-Left (RTL) Adaptability**: Positions badges on the top-left in Arabic/Hebrew script without separate CSS overrides.
> 3. **Modern Internationalization Standard**: W3C recommendation for global multi-language web applications.
## 6. Related Terms
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — The primary positioning properties.
- [`position: sticky`](position_sticky.md) — The hybrid boundary scrolling property.
- [`position: static` vs `relative`](position_static_relative.md) — These four properties **do absolutely nothing** unless the element is positioned!

---

## 7. Key Takeaways
- `top`, `bottom`, `left`, and `right` are coordinates used to move positioned elements.
- They are completely ignored if `position: static` (the default) is active.
- Pinning opposing sides (e.g., `left: 0; right: 0;`) will stretch the element to fill the space.
