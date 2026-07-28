# Stacking Context

> **Level 4 — Display & Positioning**
> An isolated 3D layering environment created by certain CSS properties where nested child elements are stacked along the Z-axis, trapping their `z-index` values within the parent container's boundaries.

---

## 1. Prerequisites
- [`z-index`](../level_04/z_index.md) — The Z-axis priority system.
- [`position: absolute` vs `fixed`](../level_04/position_absolute_fixed.md) — Properties that commonly trigger stacking context generation.

---

## 2. Term Category
- **Core Concept**

---

## 3. Environment Context
- **Universal Browser Support** (Managed during the browser's painting phase, which sorts layers before rendering them onto the screen).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Expecting `z-index: 9999` to Out-Stack an Element in a Different Parent Stacking Context

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

### Mistake 5: Creating Accidental Stacking Contexts via CSS Properties (`opacity`, `transform`, `filter`)

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



### Mistake 6: Expecting `z-index: 9999` to Out-Stack an Element in a Different Parent Stacking Context

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

### Mistake 7: Creating Accidental Stacking Contexts via CSS Properties (`opacity`, `transform`, `filter`)

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

## 6. Practice Exercises

### Exercise 1: Finding the Victor

**Problem:** Look at the following HTML/CSS setup. Which element will be displayed on top?

```html
<div class="box-x">
  <div class="child-1">Child 1</div>
</div>
<div class="box-y">
  <div class="child-2">Child 2</div>
</div>
```
```css
.box-x {
  position: relative;
  z-index: 10;
}
.child-1 {
  position: absolute;
  z-index: 9999;
}
.box-y {
  position: relative;
  z-index: 20;
}
.child-2 {
  position: absolute;
  z-index: 1;
}
```

**Expected output:**
> [!check]- Answer
> ```text
> `child-2`! 
> Because `.box-y` has a higher `z-index` (20) than `.box-x` (10), everything inside `.box-y` (including `child-2`) is rendered on top of everything inside `.box-x`. The `z-index: 9999` on `child-1` is trapped within its parent's lower context.
> ```
> - Identify which elements create stacking contexts.
> - Compare parent index priorities before comparing child values.

---



### Exercise 2: Properties Creating Stacking Contexts

**Problem:** List 4 CSS properties that implicitly create a new Stacking Context on an element.

**Expected output:**
> [!check]- Answer
> ```text
> 1. position: relative/absolute with z-index (not auto)
> 2. opacity < 1
> 3. transform (not none)
> 4. filter / backdrop-filter (not none)
> ```
> ```text
> 1. position (relative/absolute) with z-index
> 2. opacity < 1
> 3. transform / filter
> 4. isolation: isolate
> ```
>
> **Explanation:** These properties create isolated stacking contexts for child layers.

---

### Exercise 3: Explicit Stacking Context Isolation

**Problem:** Which modern CSS property explicitly creates an isolated Stacking Context without adding visual side effects?

**Expected output:**
> [!check]- Answer
> ```text
> isolation: isolate;
> ```
> ```css
> .component {
>   isolation: isolate;
> }
> ```
>
> **Explanation:** `isolation: isolate` creates a clean stacking context boundary.

## 7. Related Terms
- [`z-index`](../level_04/z_index.md) — The numbering sequence sorted within the context.
- [`opacity`](../../level_08/opacity.md) — One of the visual triggers that creates a context.
- [`transform`](../../level_09/transform.md) — Another visual trigger that creates a context.

---

## 8. Key Takeaways
- A Stacking Context is an isolated Z-axis layering environment.
- Child elements are sorted within their parent's stacking context.
- A high `z-index` child cannot overlap outside elements if its parent is in a lower context.
- Stacking contexts are triggered by absolute/relative positioning with `z-index`, fixed/sticky layouts, opacity `< 1`, and CSS transforms.
- Avoid "z-index wars" (e.g. `z-index: 999999`); instead, verify and debug the parent stacking contexts.
