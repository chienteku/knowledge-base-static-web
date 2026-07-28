# `z-index`

> **Level 4 — Display & Positioning**
> The property that controls the 3D stacking order (the Z-axis) of elements that overlap each other.

---

## 1. Prerequisites
- [Positioning (`relative`, `absolute`, `fixed`)](../level_04/position_static_relative.md) — Just like `top` and `left`, `z-index` **only works on positioned elements**.

---

## 2. Term Category
- **Positioning Stacking Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard layout, elements sit next to each other or below each other (the X and Y axes). However, the moment you use `absolute`, `fixed`, or `relative` positioning, or negative margins, elements can physically overlap each other. 
When two elements overlap, which one goes on top? By default, the browser simply puts the element that comes *last* in the HTML code on top of everything else.
The W3C created **`z-index`** (referring to the 3D Z-axis) to let developers manually override this stacking order. Elements with a higher `z-index` number will always sit on top of elements with a lower number.

### (2) Reality Metaphor
Imagine a stack of papers on a desk.
- A paper with `z-index: 1` is at the bottom of the pile.
- A paper with `z-index: 2` is placed on top of it.
- A paper with `z-index: 9999` is placed on the very top of the entire pile.

### (3) Code Examples

#### The Standard Stacking Order
```css
.background-image {
  position: absolute;
  /* Send it to the back */
  z-index: 1; 
}

.text-overlay {
  position: absolute;
  /* Bring it to the front, above the image */
  z-index: 2; 
}

.critical-modal-popup {
  position: fixed;
  /* Ensure this sits on top of literally everything on the entire website */
  z-index: 9999; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to z-index a static element

**The mistake:** Applying `z-index: 99;` to a normal `<div>` and wondering why an image is still overlapping it.

**Why it's wrong:** **`z-index` does nothing if `position: static` is active!** If you want to use `z-index`, you MUST add `position: relative;` (or absolute/fixed) to the element first to unlock its ability to use the Z-axis.

### Mistake 2: The Stacking Context Trap (Advanced)

**The mistake:** Giving a tooltip `z-index: 9999;`, but it still gets hidden behind a header that only has `z-index: 2;`.

**Why it's wrong:** Stacking is isolated inside parent containers! If a child is inside a parent that has `z-index: 1`, the child can *never* overlap a completely different element that has `z-index: 2`. The child is trapped inside its parent's stacking layer. You can't break out of a lower layer just by giving the child a ridiculously high number. (Think of it like folders: a file inside a folder at the bottom of the drawer can never sit on top of a folder at the top of the drawer).

---



### Mistake 3: Applying `z-index` to Default `position: static` Elements

**The mistake:** Writing `div { z-index: 100; }` without specifying a `position` property.

**Why it's wrong:** `z-index` works ONLY on positioned elements (`relative`, `absolute`, `fixed`, `sticky`) or Flex/Grid child items. It is IGNORED on `position: static` elements.

*Incorrect:*
```css
div { z-index: 999; } /* ❌ z-index is ignored on default static elements! */
```

*Fix:*
```css
div { position: relative; z-index: 999; } /* Position relative enables z-index */
```

### Mistake 4: Escalating to Absurd `z-index` Values (`z-index: 99999999`)

**The mistake:** Adding `z-index: 999999` whenever an element fails to appear on top.

**Why it's wrong:** Absurd `z-index` values mean you do not understand the element's parent Stacking Context. Organize `z-index` using CSS custom properties or design system scale tokens.

*Incorrect:*
```css
.modal { z-index: 9999999; } /* ❌ Specificity war anti-pattern! */
```

*Fix:*
```css
/* Use CSS variables for organized z-index layer tokens: */
:root {
  --z-dropdown: 1000;
  --z-modal: 2000;
}
.modal { z-index: var(--z-modal); }
```



### Mistake 5: Applying `z-index` to Default `position: static` Elements

**The mistake:** Writing `div { z-index: 100; }` without specifying a `position` property.

**Why it's wrong:** `z-index` works ONLY on positioned elements (`relative`, `absolute`, `fixed`, `sticky`) or Flex/Grid child items. It is IGNORED on `position: static` elements.

*Incorrect:*
```css
div { z-index: 999; } /* ❌ z-index is ignored on default static elements! */
```

*Fix:*
```css
div { position: relative; z-index: 999; } /* Position relative enables z-index */
```

### Mistake 6: Escalating to Absurd `z-index` Values (`z-index: 99999999`)

**The mistake:** Adding `z-index: 999999` whenever an element fails to appear on top.

**Why it's wrong:** Absurd `z-index` values mean you do not understand the element's parent Stacking Context. Organize `z-index` using CSS custom properties or design system scale tokens.

*Incorrect:*
```css
.modal { z-index: 9999999; } /* ❌ Specificity war anti-pattern! */
```

*Fix:*
```css
/* Use CSS variables for organized z-index layer tokens: */
:root {
  --z-dropdown: 1000;
  --z-modal: 2000;
}
.modal { z-index: var(--z-modal); }
```



### Mistake 7: Applying `z-index` to Default `position: static` Elements

**The mistake:** Writing `div { z-index: 100; }` without specifying a `position` property.

**Why it's wrong:** `z-index` works ONLY on positioned elements (`relative`, `absolute`, `fixed`, `sticky`) or Flex/Grid child items. It is IGNORED on `position: static` elements.

*Incorrect:*
```css
div { z-index: 999; } /* ❌ z-index is ignored on default static elements! */
```

*Fix:*
```css
div { position: relative; z-index: 999; } /* Position relative enables z-index */
```

### Mistake 8: Escalating to Absurd `z-index` Values (`z-index: 99999999`)

**The mistake:** Adding `z-index: 999999` whenever an element fails to appear on top.

**Why it's wrong:** Absurd `z-index` values mean you do not understand the element's parent Stacking Context. Organize `z-index` using CSS custom properties or design system scale tokens.

*Incorrect:*
```css
.modal { z-index: 9999999; } /* ❌ Specificity war anti-pattern! */
```

*Fix:*
```css
/* Use CSS variables for organized z-index layer tokens: */
:root {
  --z-dropdown: 1000;
  --z-modal: 2000;
}
.modal { z-index: var(--z-modal); }
```

## 6. Practice Exercises

### Exercise 1: Finding the Victor

**Problem:** You have a Red Box and a Blue Box. Both are `position: absolute;` and occupy the exact same spot on the screen.
- Red Box HTML is written first. It has `z-index: 5`.
- Blue Box HTML is written second. It has `z-index: 3`.
Which box is visible on top?

**Expected output:**
> [!check]- Answer
> ```text
> The Red Box! Because its `z-index` (5) is higher than the Blue Box (3), it wins, regardless of the HTML order.
> ```
> - Higher number wins.

---



### Exercise 2: z-index Layer Order Calculation

**Problem:** Given 3 positioned elements: Box A (`z-index: 1`), Box B (`z-index: 10`), Box C (`z-index: 5`). Order them from bottom-most to top-most.

**Expected output:**
> [!check]- Answer
> ```text
> Box A (bottom) -> Box C (middle) -> Box B (top)
> ```
> ```text
> Box A (z-index 1) -> Box C (z-index 5) -> Box B (z-index 10)
> ```
>
> **Explanation:** Higher numerical `z-index` values stack above lower values within the same stacking context.

---

### Exercise 3: Flexbox and Grid z-index Exception

**Problem:** Do direct child items of Flexbox (`display: flex`) or Grid (`display: grid`) containers require `position: relative` for `z-index` to work?

**Expected output:**
> [!check]- Answer
> ```text
> No. Flex and Grid items respect z-index even with default position: static.
> ```
> ```text
> No. Flex and Grid items respect z-index even with default position: static.
> ```
>
> **Explanation:** Flex and Grid specifications allow `z-index` directly on child items.

## 7. Related Terms
- [`position: static` vs `relative`](../level_04/position_static_relative.md) — Required positioning properties.
- [Stacking Context](../level_04/stacking_context.md) — The parent layer grouping logic that shapes z-index behaviors.

---

## 8. Key Takeaways
- `z-index` controls which overlapping element is on top.
- Higher numbers sit on top of lower numbers.
- **You MUST apply `position: relative` (or absolute/fixed) for `z-index` to work!**
- Negative numbers (`z-index: -1`) can be used to send elements behind their parent containers.
