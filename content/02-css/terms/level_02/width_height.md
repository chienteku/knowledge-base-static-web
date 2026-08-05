# Width / Height

> **Level 2 — The Box Model**
> The properties used to define the horizontal and vertical dimensions of an element's Content area.

---

## 1. Prerequisites
- [The Box Model (Concept)](box_model.md) — Width and Height control the very center layer: the Content.
---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, the browser decides how big elements are. A `<div>` will automatically stretch to be 100% as wide as the screen, and will only be as tall as the text inside it. 
However, web design requires exact control. If you are building a profile picture, you want it to be exactly `50px` by `50px`. If you are building a sidebar, you might want it to take up exactly `25%` of the screen. The `width` and `height` properties give you this explicit control.
Under standard CSS rules, these properties *only* set the size of the inner Content area; they do not include padding or borders.

### (2) Reality Metaphor
Imagine buying a plot of land and a house.
The **Width** and **Height** dictate the square footage of the actual living space inside the house. 
If you later decide to add thick brick walls (border) or a patio (padding), that gets added *on top* of your initial square footage, making the total footprint of the house on the plot of land larger.

### (3) Code Examples

#### Fixed Pixels vs Percentages
```css
.sidebar {
  /* Fixed size: It will ALWAYS be exactly 300 pixels wide, even on mobile phones. */
  width: 300px;
}

.main-content {
  /* Fluid size: It will stretch or shrink to fill exactly half of its parent container. */
  width: 50%;
  
  /* Setting an explicit height is actually quite rare in modern CSS, 
     as we usually want the element to grow dynamically with the text inside. */
  height: 500px; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting fixed heights on text containers

**The mistake:** Giving a paragraph container a fixed height like `height: 100px;`.

**Why it's wrong:** Text is unpredictable. If a user translates your website to German (which has longer words), or if they view it on a mobile phone (which forces the text to wrap into more lines), the text will physically overflow the 100px box and spill out all over the page! 
**Modern Best Practice:** Almost *never* use a fixed `height` for text containers. Let the browser calculate the height automatically based on the content (`height: auto`), or use `min-height: 100px;` so it can grow if needed.

### Mistake 2: Forgetting the Box Model Math

**The mistake:** Setting `width: 100%` and then adding `padding: 20px`. 

**Why it's wrong:** Under the default Box Model, `100%` means "Take up 100% of the screen." But remember, padding is added *on top* of width! So your element becomes 100% of the screen + 40px of padding. It will literally blow past the edge of the monitor, creating an ugly horizontal scrollbar on your website. 
*(This is solved by `box-sizing: border-box`, which we cover in the next term!)*

---



### Mistake 3: Hardcoding Fixed Pixel Heights (`height: 500px`) on Text Containers (Text Overflow Trap)

**The mistake:** Setting `height: 300px` on cards containing dynamic user-generated text.

**Why it's wrong:** If text length expands or user increases browser font size, fixed heights cause text to spill out over lower content. Use `min-height` or `max-height`.

*Incorrect:*
```css
.card { height: 200px; } /* ❌ Text overflows when content expands! */
```

*Fix:*
```css
.card { min-height: 200px; } /* Flexible expansion for long content */
```

### Mistake 4: Setting Hardcoded `width: 1000px` Breaking Mobile Viewports (Horizontal Scroll Bar)

**The mistake:** Setting `width: 1200px` on main layout container divs.

**Why it's wrong:** Fixed pixel widths wider than mobile screens (375px) force horizontal scrollbars on mobile devices. Use `max-width: 1200px; width: 100%;`.

*Incorrect:*
```css
.container { width: 1200px; } /* ❌ Breaks mobile responsive layout! */
```

*Fix:*
```css
.container {
  width: 100%;
  max-width: 1200px; /* Responsive fluid width */
}
```

## 6. Practice Exercises

### Exercise 1: Percentage Math

**Problem:** You have a `<main>` container that is `1000px` wide. Inside it, you put a `<div style="width: 50%;">`. How many pixels wide will the `<div>` be?

**Expected output:**
> [!check]- Answer
> ```text
> 500px! Percentages are always calculated relative to the *parent* container, not necessarily the whole screen.
> ```
> - What is 50% of 1000?

---



### Exercise 2: Responsive Fluid Container Width

**Problem:** Write CSS for `.wrapper` occupying 100% width on mobile, capped at max 1200px on desktop, centered horizontally.

**Expected output:**
> [!check]- Answer
> ```text
> .wrapper { width: 100%; max-width: 1200px; margin-left: auto; margin-right: auto; }
> ```
> ```css
> .wrapper {
>   width: 100%;
>   max-width: 1200px;
>   margin-left: auto;
>   margin-right: auto;
> }
> ```
>
> **Explanation:** `width: 100%` + `max-width` + `margin: auto` creates responsive fluid page containers.

---

### Exercise 3: Percentage Height Requirement

**Problem:** Why does `height: 100%` fail on a child `<div>` when its parent container has no explicit height set?

**Expected output:**
> [!check]- Answer
> ```text
> Percentage heights require parent elements to have a defined explicit height to calculate percentages against.
> ```
> ```text
> Percentage heights require parent elements to have a defined explicit height to calculate percentages against.
> ```
>
> **Explanation:** Percentage height resolves against explicitly defined parent height dimensions.

## 7. Related Terms
- [`box-sizing: border-box`](box_sizing.md) — Changes how Width and Height calculate padding and borders.
- [Margin](margin.md) — Surrounds the calculated width and height.
- [`overflow` (hidden, scroll, auto, visible)](overflow.md) — Handling content that overflows the width and height box.
- [`max-width` & `min-height` (Fluidity)](../level_08/max_width.md) — Related concept: `max-width` & `min-height` (Fluidity).
---

## 8. Key Takeaways
- `width` and `height` control the dimensions of the Content area.
- You can use fixed units like `px` or fluid units like `%`.
- Avoid setting fixed `height` on containers with text, as the text will overflow if it wraps.
- By default, adding padding or borders makes the element *larger* than the width you set.
