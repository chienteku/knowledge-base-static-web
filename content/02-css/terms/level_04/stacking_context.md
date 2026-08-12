# Stacking Context

> **Level 4 — Display & Positioning**
> An isolated 3D layering environment created by certain CSS properties where nested child elements are stacked along the Z-axis, trapping their `z-index` values within the parent container's boundaries.

---

## 1. Prerequisites
- [`z-index`](z_index.md) — The Z-axis priority system.
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Properties that commonly trigger stacking context generation.

---

## 2. Term Category

**Core Concept (Universal Browser Support .)**: Stacking Context is a fundamental concept in this technology stack. **Level 4 — Display & Positioning**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Every CSS developer has faced this layout nightmare: you build a modal popup window or dropdown menu and give it `z-index: 99999` to ensure it sits on top of everything. 

Yet, when you open it, the dropdown menu is covered by a sidebar that has a `z-index` of only `2`.

You inspect the elements, change your dropdown's `z-index` to `999999999`, but it still sits behind the sidebar.

This happens because the browser doesn't calculate `z-index` globally across the entire page. 

Instead, it calculates layers within isolated environments called **Stacking Contexts**. 

Once a stacking context is created on a parent container, the child elements are trapped. Their `z-index` values are only compared to their siblings inside the container. 

When compared to the rest of the page, the container and its children behave as a single layer.

---

### (2) What Creates a Stacking Context?
A new stacking context is created by several CSS triggers:
-   **The root element** (`<html>`).
-   Any element with `position: relative` or `absolute` **AND** a `z-index` other than `auto`.
-   Any element with `position: fixed` or `position: sticky`.
-   Any element with an **`opacity`** value less than `1`.
-   Any element with a **`transform`** value other than `none` (e.g. `transform: scale(1.1);`).
-   Modern layout containers using `flex` or `grid` with an explicit `z-index`.

---

### (3) The Folder Metaphor
Imagine sorting papers inside a filing cabinet:
-   **Folder A** is marked with a priority of **`1`**. Inside this folder, you have a sheet of paper marked **`z-index: 9999`**.
-   **Folder B** is marked with a priority of **`2`**. Inside this folder, you have a sheet of paper marked **`z-index: 1`**.

Which sheet of paper sits higher in the drawer? 

The sheet in **Folder B** wins! 

Even though the sheet in Folder A has a score of `9999`, it is trapped inside Folder A. Because Folder B is placed *above* Folder A, everything inside Folder B floats above everything in Folder A.

---

### (4) Code Examples

#### The Overlapping Trap
```html
<div class="sidebar"> <!-- Stacking Context #1 (z-index: 2) -->
  <div class="menu-item">Sidebar Menu</div>
</div>

<div class="main-content"> <!-- Stacking Context #2 (z-index: 1) -->
  <div class="tooltip">Popup Tooltip</div> <!-- z-index: 9999 -->
</div>
```
```css
.sidebar {
  position: relative;
  z-index: 2;
}

.main-content {
  position: relative;
  z-index: 1;
}

.tooltip {
  position: absolute;
  z-index: 9999; /* Trapped! Cannot sit on top of .sidebar because its parent .main-content has z-index: 1 */
}
```

*Visual result:* The tooltip is drawn underneath the sidebar, despite its high `z-index`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The "Opacified Parent" Trap

**The mistake:** Setting a parent card's opacity slightly lower (`opacity: 0.99;`) for a visual design fade, and wondering why all absolute children (like dropdown menus) suddenly fall behind neighboring page elements:

```css
/* BAD: Fading the parent creates a new stacking context, trapping children! */
.card-parent {
  opacity: 0.95; 
}
.dropdown-child {
  position: absolute;
  z-index: 9999; 
}
```

**Why it's wrong:** According to the W3C spec, setting `opacity` less than `1` creates a new stacking context. The parent card behaves as a folder. If a neighboring card has a higher stacking index, it will draw on top of the parent card and all of its children, ignoring the child's `z-index: 9999`.

---



### Mistake 2: Expecting `z-index: 9999` to Out-Stack an Element in a Different Parent Stacking Context

**The mistake:** Setting `z-index: 9999` on a child element inside a parent container with `z-index: 1`.

**Why it's wrong:** Child elements CANNOT escape the stacking context of their parent. If Parent A has `z-index: 1` and Parent B has `z-index: 2`, any child inside Parent B will render on top of Parent A's children regardless of `z-index` numbers.

*Incorrect:*
```css
/* Parent A (z-index: 1) contains Child A (z-index: 9999) */
/* Child A still renders BELOW Parent B (z-index: 2)! */
```

*Fix:*
```css
/* Adjust parent container stacking contexts or move element to document root */
```

### Mistake 3: Creating Accidental Stacking Contexts via CSS Properties (`opacity`, `transform`, `filter`)

**The mistake:** Adding `transform: scale(1)` or `opacity: 0.99` to a container and wondering why `position: fixed` or `z-index` child behaviors change.

**Why it's wrong:** CSS properties like `transform`, `opacity` < 1, `filter`, `will-change`, and `container-type` implicitly create a NEW Stacking Context on the element.

*Incorrect:*
```css
.card { transform: translateZ(0); } /* ❌ Implicitly creates new stacking context! */
```

*Fix:*
```css
/* Aware that transform/opacity/filter create new stacking contexts */
```

## 5. Practice Exercises

### Exercise 1: Creating Isolated Stacking Contexts using isolation isolate

**Scenario:** An engineer creates an isolated stacking context on a component wrapper using `isolation: isolate` to prevent `z-index` leaks.

**Requirements:**
1. Apply `isolation: isolate` to `.card-wrapper`.
2. Set internal child `z-index: 10`.
3. Verify child `z-index` does not leak to global page.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-wrapper {
>   isolation: isolate;           /* Creates a clean, isolated Stacking Context */
>   position: relative;
> }
>
> .card-badge {
>   position: absolute;
>   z-index: 9999;               /* High z-index is contained STRICTLY inside .card-wrapper! */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Stacking Context Concept**: A three-dimensional conceptual grouping layer in browser rendering that dictates how elements overlap along the Z-axis.
> 2. **`isolation: isolate` Best Practice**: The modern property for creating an isolated stacking context without needing `transform` or `opacity` side-effects.
> 3. **Preventing Z-Index Leaks**: Prevents internal component `z-index: 9999` from accidentally floating over global page modals or navigation headers.
> 
---

### Exercise 2: Resolving Stacking Bugs between Parent Containers and Dropdown Menus

**Scenario:** Explains why a child with `z-index: 1000` cannot stack above a parent with lower stacking context.

**Requirements:**
1. Adjust parent stacking context levels to fix dropdown clipping.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .header-bar {
>   position: relative;
>   z-index: 20;                  /* Higher parent stacking context */
> }
>
> .hero-section {
>   position: relative;
>   z-index: 10;                  /* Lower parent stacking context */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Parent Stacking Context Dominance**: A child element CANNOT stack above an element outside its parent's stacking context if the parent has a lower `z-index`!
> 2. **Stacking Order Tree**: Z-index comparisons occur strictly between elements within the SAME stacking context.
> 3. **Root Context**: The root `<html>` element forms the initial top-level stacking context.
> 
---

### Exercise 3: Stacking Context Triggers Checklist

**Scenario:** Lists common CSS properties that trigger new stacking contexts.

**Requirements:**
1. Demonstrate stacking context triggers (`opacity`, `transform`, `filter`).

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .stack-trigger {
>   /* Properties that create a new Stacking Context: */
>   /* 1. position: relative|absolute|fixed + z-index != auto */
>   /* 2. opacity < 1 */
>   /* 3. transform != none */
>   /* 4. filter != none */
>   /* 5. isolation: isolate */
>   opacity: 0.99;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Implicit Stacking Triggers**: Setting `opacity: 0.99`, `transform: translate(0)`, or `filter: blur(0)` implicitly creates a new stacking context!
> 2. **DevTools Stacking Inspection**: Use Chrome DevTools 'Layers' tab to inspect 3D stacking context trees.
> 3. **Predictable Layering**: Use `isolation: isolate` when explicit stacking contexts are needed.
## 6. Related Terms
- [`z-index`](z_index.md) — The numbering sequence sorted within the context.
- [`opacity`](../level_09/opacity.md) — One of the visual triggers that creates a context.
- [`transform` (Scale, Translate, Rotate)](../level_10/transform.md) — Another visual trigger that creates a context.
- [`position: absolute` vs `fixed`](position_absolute_fixed.md) — Related concept: `position: absolute` vs `fixed`.

---

## 7. Key Takeaways
- A Stacking Context is an isolated Z-axis layering environment.
- Child elements are sorted within their parent's stacking context.
- A high `z-index` child cannot overlap outside elements if its parent is in a lower context.
- Stacking contexts are triggered by absolute/relative positioning with `z-index`, fixed/sticky layouts, opacity `< 1`, and CSS transforms.
- Avoid "z-index wars" (e.g. `z-index: 999999`); instead, verify and debug the parent stacking contexts.
