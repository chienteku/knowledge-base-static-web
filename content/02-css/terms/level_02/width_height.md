# Width / Height

> **Level 2 — The Box Model**
> The properties used to define the horizontal and vertical dimensions of an element's Content area.

---

## 1. Prerequisites
- [The Box Model (Concept)](box_model.md) — Width and Height control the very center layer: the Content.

---

## 2. Term Category

**Layout Property (Universal Browser Support)**: Width / Height is a fundamental concept in this technology stack. **Level 2 — The Box Model**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Fluid Responsive Card Container with max-width and width

**Scenario:** An author builds a responsive fluid layout container using `width: 100%` and `max-width: 70rem`.

**Requirements:**
1. Set `width: 100%`.
2. Set `max-width: 70rem`.
3. Apply `margin-inline: auto`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .responsive-container {
>   width: 100%;                  /* Fills small mobile screens completely */
>   max-width: 70rem;             /* Prevents container from stretching too wide on 4K monitors (~1120px) */
>   margin-inline: auto;          /* Centers container on wide screens */
>   padding-inline: 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`width` vs `max-width`**: `width: 100%` ensures fluid shrinking on small mobile screens; `max-width` caps growth on large desktop displays.
> 2. **Responsive Layout Rule**: Never set hardcoded fixed pixel widths (`width: 1200px`); always pair percentage/fluid widths with `max-width`.
> 3. **Centered Content Area**: Combines max-width constraints with auto margins for clean page layouts.
> 
---

### Exercise 2: Full Viewport Hero Banners using Dynamic Viewport Height Units

**Scenario:** Styles a full-screen hero banner using dynamic viewport height units (`min-height: 100dvh`).

**Requirements:**
1. Apply `min-height: 100dvh` to hero container.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header class="hero-banner">
>   <h1>Welcome to Our Platform</h1>
>   <p>Full viewport height hero section.</p>
> </header>
> ```
>
> ```css
> .hero-banner {
>   box-sizing: border-box;
>   min-height: 100dvh;           /* 100 Dynamic Viewport Height (adapts to mobile URL bars!) */
>   display: flex;
>   flex-direction: column;
>   justify-content: center;
>   align-items: center;
>   padding: 2rem;
>   background-color: #0f172a;
>   color: #ffffff;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `min-height` Property**: Ensures container expands if content exceeds viewport, preventing text overflow truncation.
> 2. **Dynamic Viewport Units (`100dvh`)**: `100dvh` adapts dynamically to mobile browser URL bar expansion and retraction, solving mobile `100vh` scroll bugs.
> 3. **Flexbox Alignment**: Combines viewport height with Flexbox centering for hero banners.
> 
---

### Exercise 3: Preventing Content Overflow Bugs with min-width: 0 inside Flex Items

**Scenario:** Fixes flex item text overflow clipping by overriding the default `min-width: auto` behavior.

**Requirements:**
1. Apply `min-width: 0` to flex child item.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .flex-child {
>   flex: 1;
>   min-width: 0;                 /* Overrides default min-width: auto to allow text truncation */
> }
>
> .flex-child h2 {
>   white-space: nowrap;
>   overflow: hidden;
>   text-overflow: ellipsis;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Flex Item `min-width: auto` Trap**: Flex items default to `min-width: auto`, preventing long text or images from shrinking below their content size.
> 2. **The `min-width: 0` Fix**: Setting `min-width: 0` allows flex children to shrink smaller than their content, enabling text truncation (`text-overflow: ellipsis`).
> 3. **Grid Item Equivalent**: CSS Grid child items require `min-width: 0` for identical truncation behavior.
## 6. Related Terms
- [`box-sizing: border-box`](box_sizing.md) — Changes how Width and Height calculate padding and borders.
- [Margin](margin.md) — Surrounds the calculated width and height.
- [`overflow` (hidden, scroll, auto, visible)](overflow.md) — Handling content that overflows the width and height box.
- [`max-width` & `min-height` (Fluidity)](../level_08/max_width.md) — Related concept: `max-width` & `min-height` (Fluidity).

---

## 7. Key Takeaways
- `width` and `height` control the dimensions of the Content area.
- You can use fixed units like `px` or fluid units like `%`.
- Avoid setting fixed `height` on containers with text, as the text will overflow if it wraps.
- By default, adding padding or borders makes the element *larger* than the width you set.
