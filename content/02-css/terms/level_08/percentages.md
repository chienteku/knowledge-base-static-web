# `%` (Percentages)

> **Level 8 — Responsive Design & Units**
> A relative unit of measurement that sizes an element based on the size of its parent container.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — Understanding how elements take up space.
- [The Tree Structure](../../../01-html/terms/level_09/tree_structure.md) — Percentages rely entirely on the Parent-Child relationship.

---

## 2. Term Category
- **CSS Measurement Unit**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, monitors were all roughly the same size, so developers built websites using absolute `px` (pixels). If a sidebar was `300px` wide, it was always exactly 300px wide.
When smartphones were invented, pixel-perfect designs broke. A 1000px website didn't fit on a 320px phone screen. The W3C introduced the concept of **Responsive Design**: elements that dynamically stretch and shrink based on the screen they are viewed on. 
The **Percentage (`%`)** unit is the foundation of responsive design. Instead of saying "be exactly 500px wide," you say "take up 50% of the available space your parent gives you."

### (2) Reality Metaphor
Imagine pouring water into a glass. 
Pixels (`px`) are like pouring exactly 8 ounces of water. If you pour it into a tiny shot glass (a mobile phone), it overflows and spills everywhere.
Percentages (`%`) are like saying "Fill the glass half-way (`50%`)." It doesn't matter if it's a shot glass or a massive bucket, it perfectly adapts to the size of its container.

### (3) Code Examples

#### Responsive Width
```html
<div class="parent">
  <div class="child">I shrink and grow!</div>
</div>
```
```css
.parent {
  /* Let's pretend the parent is exactly 400px wide on this specific screen */
  width: 400px;
}

.child {
  /* The child calculates: 50% of 400px = 200px wide! */
  width: 50%; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `%` to work on `height`

**The mistake:** Trying to make a background image cover the whole screen by setting `height: 100%;` on a `<div>`, and watching it fail spectacularly (the div collapses to 0px tall).

**Why it's wrong:** Percentages look at the parent container to do their math. By default, a parent's height is determined by the content *inside* it (it stretches to fit its children). 
If the Child asks the Parent, "How tall are you, so I can be 100% of that?", and the Parent says, "I don't know, I'm waiting to see how tall *you* are," the math breaks down and defaults to 0. 
**Solution:** To use `%` for height, every single parent element all the way up to the `<body>` and `<html>` tags must have a specific height set. (Or, much easier, just use Viewport Units, which we cover next!).

---



### Mistake 2: Expecting `padding-top: 50%` to Calculate Based on Container Height

**The mistake:** Setting `padding-top: 50%` expecting padding to equal 50% of the container's height.

**Why it's wrong:** In CSS box-model specifications, percentage values for `padding` and `margin` (both vertical AND horizontal) calculate relative to the container's **WIDTH**, NOT height!

*Incorrect:*
```css
/* Expecting vertical padding to be 50% of parent height */
div { padding-top: 50%; } /* ❌ Calculates 50% of parent WIDTH! */
```

*Fix:*
```css
/* Understand vertical padding percentages calculate against parent width (Aspect Ratio pattern) */
```

### Mistake 3: Using `height: 100%` on Child Elements When Parent Has No Explicit Height Set

**The mistake:** Setting `height: 100%` on a child `<div>` inside a parent with `height: auto`.

**Why it's wrong:** Percentage heights require parent containers to have an explicitly defined height. If parent height is `auto`, `height: 100%` resolves to `auto`.

*Incorrect:*
```css
.child { height: 100%; } /* ❌ Fails because parent height is un-defined */
```

*Fix:*
```css
html, body { height: 100%; }
.parent { height: 100%; } /* Parent explicitly defined */
```



### Mistake 4: Expecting `padding-top: 50%` to Calculate Based on Container Height

**The mistake:** Setting `padding-top: 50%` expecting padding to equal 50% of the container's height.

**Why it's wrong:** In CSS box-model specifications, percentage values for `padding` and `margin` (both vertical AND horizontal) calculate relative to the container's **WIDTH**, NOT height!

*Incorrect:*
```css
/* Expecting vertical padding to be 50% of parent height */
div { padding-top: 50%; } /* ❌ Calculates 50% of parent WIDTH! */
```

*Fix:*
```css
/* Understand vertical padding percentages calculate against parent width (Aspect Ratio pattern) */
```

### Mistake 5: Using `height: 100%` on Child Elements When Parent Has No Explicit Height Set

**The mistake:** Setting `height: 100%` on a child `<div>` inside a parent with `height: auto`.

**Why it's wrong:** Percentage heights require parent containers to have an explicitly defined height. If parent height is `auto`, `height: 100%` resolves to `auto`.

*Incorrect:*
```css
.child { height: 100%; } /* ❌ Fails because parent height is un-defined */
```

*Fix:*
```css
html, body { height: 100%; }
.parent { height: 100%; } /* Parent explicitly defined */
```



### Mistake 6: Expecting `padding-top: 50%` to Calculate Based on Container Height

**The mistake:** Setting `padding-top: 50%` expecting padding to equal 50% of the container's height.

**Why it's wrong:** In CSS box-model specifications, percentage values for `padding` and `margin` (both vertical AND horizontal) calculate relative to the container's **WIDTH**, NOT height!

*Incorrect:*
```css
/* Expecting vertical padding to be 50% of parent height */
div { padding-top: 50%; } /* ❌ Calculates 50% of parent WIDTH! */
```

*Fix:*
```css
/* Understand vertical padding percentages calculate against parent width (Aspect Ratio pattern) */
```

### Mistake 7: Using `height: 100%` on Child Elements When Parent Has No Explicit Height Set

**The mistake:** Setting `height: 100%` on a child `<div>` inside a parent with `height: auto`.

**Why it's wrong:** Percentage heights require parent containers to have an explicitly defined height. If parent height is `auto`, `height: 100%` resolves to `auto`.

*Incorrect:*
```css
.child { height: 100%; } /* ❌ Fails because parent height is un-defined */
```

*Fix:*
```css
html, body { height: 100%; }
.parent { height: 100%; } /* Parent explicitly defined */
```

## 6. Practice Exercises

### Exercise 1: The Russian Nesting Dolls

**Problem:** 
- The Grandparent is `800px` wide.
- The Parent is `width: 50%;`.
- The Child is `width: 50%;`.
How many pixels wide is the Child on the screen?

**Expected output:**
> [!check]- Answer
> ```text
> 200px!
> The Parent calculates 50% of 800px = 400px.
> The Child calculates 50% of its Parent (400px) = 200px.
> ```
> - Do the math one layer at a time.
> 
---



### Exercise 2: Percentage Padding Aspect Ratio Calculation

**Problem:** If parent container width is 500px, what is the computed pixel size of `padding-top: 20%`?

**Expected output:**
> [!check]- Answer
> ```text
> 100px (20% of 500px parent width).
> ```
> ```text
> 100px (20% of 500px parent width).
> ```
>
> **Explanation:** All padding percentages (vertical and horizontal) calculate against parent width.
> 
---

### Exercise 3: Percentage Width in Flexbox

**Problem:** Why use `flex-basis: 50%` instead of `width: 50%` on flex items?

**Expected output:**
> [!check]- Answer
> ```text
> flex-basis integrates directly with Flexbox flex-grow and flex-shrink distribution algorithms.
> ```
> ```css
> .flex-item {
>   flex: 0 0 50%; /* flex-basis 50% */
> }
> ```
>
> **Explanation:** `flex-basis` defines initial main-axis item dimensions within Flexbox layout engines.
> 
## 7. Related Terms
- [`vw` / `vh` (Viewport Units)](viewport_units.md) — Sizing relative to the viewport instead of the parent container.
- [`rem` vs `em`](rem_em.md) — Relative typography units.
- [`max-width` & `min-height` (Fluidity)](max_width.md) — Bounding limits for fluid elements.

---

## 8. Key Takeaways
- `%` is a **relative** unit. It calculates its size based on its **Parent Container**.
- It is incredible for fluid, responsive `width` (like 2-column layouts using `50%` each).
- It is notoriously terrible and frustrating for `height` due to how the browser calculates vertical space.
