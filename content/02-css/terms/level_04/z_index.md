# `z-index`

> **Level 4 — Display & Positioning**
> The property that controls the 3D stacking order (the Z-axis) of elements that overlap each other.

---

## 1. Prerequisites
- [`position: static` vs `relative`](position_static_relative.md) — Just like `top` and `left`, `z-index` **only works on positioned elements**.

---

## 2. Term Category

**Positioning Stacking Property (Universal Browser Support)**: `z-index` is a fundamental concept in this technology stack. **Level 4 — Display & Positioning**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Layering Dropdown Menus and Modals above Page Content

**Scenario:** An author uses structured `z-index` token values to manage stacking order between dropdowns, sticky headers, and modals.

**Requirements:**
1. Define CSS custom properties for z-index tokens (`--z-sticky: 100`, `--z-modal: 1000`).
2. Apply tokens to header and modal.
3. Verify proper Z-axis layering.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> :root {
>   /* System Z-Index Token Architecture */
>   --z-dropdown: 10;
>   --z-sticky: 100;
>   --z-modal-backdrop: 900;
>   --z-modal: 1000;
>   --z-tooltip: 2000;
> }
>
> .sticky-header {
>   position: sticky;
>   top: 0;
>   z-index: var(--z-sticky);
> }
>
> .modal-dialog {
>   position: fixed;
>   top: 50%;
>   left: 50%;
>   transform: translate(-50%, -50%);
>   z-index: var(--z-modal);
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `z-index` Property**: Specifies the Z-axis stacking order of an element along the screen depth vector.
> 2. **Positioning Prerequisite**: `z-index` works ONLY on elements with a `position` value other than `static` (`relative`, `absolute`, `fixed`, `sticky`), or flex/grid items!
> 3. **Token-Based Architecture**: Using CSS custom properties (`--z-modal: 1000`) prevents arbitrary 'z-index wars' (`z-index: 999999`) across teams.
> 
---

### Exercise 2: Resolving Stacking Wars using Scaled Z-Index Tokens

**Scenario:** Refactors random `z-index: 99999` values to structured design token scales.

**Requirements:**
1. Replace arbitrary `z-index: 9999` with semantic token `var(--z-tooltip)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ Arbitrary Z-Index War:
> .tooltip { z-index: 9999999 !important; }
> */
>
> /* ✅ Structured Token Scale: */
> .tooltip {
>   position: absolute;
>   z-index: var(--z-tooltip);   /* Controlled 2000 token layer */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Z-Index War Pitfalls**: Randomly guessing large `z-index` numbers leads to unmaintainable stylesheets where components fight for dominance.
> 2. **Scale Design**: Use a 10/100/1000 step scale to leave space for future intermediate layers.
> 3. **Component Maintenance**: Keeps component layering predictable across large development teams.
> 
---

### Exercise 3: Understanding Why z-index Fails on position static Elements

**Scenario:** Fixes a bug where `z-index: 10` failed to apply on an element because `position: static` was active.

**Requirements:**
1. Add `position: relative` to activate `z-index` on static element.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-overlay {
>   /* Fix: Add position: relative to activate z-index! */
>   position: relative;
>   z-index: 5;
>   margin-top: -2rem;            /* Pulls card up over hero image */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Static Z-Index Failure**: `z-index` is completely IGNORED by browser layout engines on `position: static` elements.
> 2. **`position: relative` Activation**: Adding `position: relative` activates `z-index` stacking capability without removing the element from normal flow.
> 3. **Flex and Grid Exceptions**: Immediate children of `display: flex` or `display: grid` containers can use `z-index` even without explicit `position` declarations.
## 6. Related Terms
- [`position: static` vs `relative`](position_static_relative.md) — Required positioning properties.
- [Stacking Context](stacking_context.md) — The parent layer grouping logic that shapes z-index behaviors.
- [`overflow` (hidden, scroll, auto, visible)](../level_02/overflow.md) — Related concept: `overflow` (hidden, scroll, auto, visible).
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Related concept: `position: absolute` vs `fixed`.

---

## 7. Key Takeaways
- `z-index` controls which overlapping element is on top.
- Higher numbers sit on top of lower numbers.
- **You MUST apply `position: relative` (or absolute/fixed) for `z-index` to work!**
- Negative numbers (`z-index: -1`) can be used to send elements behind their parent containers.
