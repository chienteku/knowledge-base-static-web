# `transition`

> **Level 10 — Transitions & Animations**
> The property that tells the browser to smoothly animate CSS changes over a period of time, rather than changing them instantly.

---

## 1. Prerequisites
- [`:hover` & `:focus` (Pseudo-classes)](../level_09/hover_focus.md) — Transitions are almost exclusively used to animate the change between the default state and a hover/focus state.

---

## 2. Term Category

**Animation Property (Universal Modern Standard .)**: `transition` is a fundamental concept in this technology stack. **Level 10 — Transitions & Animations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you have a blue button, and you set it to turn red on `:hover`, the change happens in exactly 0.001 seconds. It instantly snaps from blue to red. While functional, this feels harsh, robotic, and cheap. 
Premium user interfaces use micro-animations. Instead of snapping instantly, the button should smoothly *fade* from blue to red over a fraction of a second.
The W3C created the **`transition`** property to automatically calculate and animate the "in-between" frames of a CSS change.

### (2) The Three Core Values
`transition` is a shorthand property that requires a few specific values to work correctly:
1. **Property**: Which CSS property should be animated? (e.g., `background-color`, or `all`).
2. **Duration**: How long should the animation take? (e.g., `0.3s` for 0.3 seconds).
3. **Timing Function (Optional)**: How should the speed of the animation feel? (e.g., `ease-in-out` means it starts slow, speeds up in the middle, and slows down at the end).

### (3) Reality Metaphor
Imagine a light switch vs a dimmer switch. 
Without `transition`, changing CSS is a light switch. It's either completely Off (Blue) or completely On (Red).
With `transition: 1s`, it's a dimmer switch. The browser slowly turns the dial, smoothly shifting the light from Blue to Purple to Red over the course of 1 second.

### (4) Code Examples

#### The Smooth Hover
**CRITICAL RULE:** You put the `transition` property on the **Default State**, *not* the Hover state!
```css
/* 1. Default State */
.premium-btn {
  background-color: blue;
  
  /* "If any property changes, animate the change smoothly over 0.2 seconds!" */
  transition: all 0.2s ease-in-out;
}

/* 2. Hover State */
.premium-btn:hover {
  background-color: red; 
  /* Notice we DO NOT put the transition property here! */
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting the transition on the `:hover` state

**The mistake:**
```css
.btn { background: blue; }
.btn:hover { background: red; transition: 0.3s; }
```

**Why it's wrong:** If you put the transition on the `:hover` state, it will smoothly fade from blue to red when your mouse enters the button. BUT, when your mouse *leaves* the button, the `:hover` state is instantly destroyed (taking the transition property with it), so it will harshly snap back to blue instantly! 
**Golden Rule:** Always put `transition` on the base class so the animation works in *both* directions (hovering in, and hovering out).

### Mistake 2: Making animations too slow

**The mistake:** Writing `transition: all 1s;` for a button hover.

**Why it's wrong:** 1 full second is an eternity in UI design. If a user hovers over a button, they want instant feedback that it is clickable. If they have to wait 1 second for the color to fully change, the website feels incredibly laggy and unresponsive. 
**Golden Rule:** UI hover transitions should almost always be very fast: `0.1s`, `0.2s`, or `0.3s` maximum.

---



### Mistake 3: Placing `transition` Property in `:hover` State Selector Instead of Base Class

**The mistake:** Writing `.btn:hover { transition: all 0.3s; background: blue; }`.

**Why it's wrong:** Placing `transition` inside `:hover` animates on hover enter, but SNAPS INSTANTLY back without animation when mouse leaves. Place `transition` on base `.btn` class.

*Incorrect:*
```css
.btn:hover { transition: background 0.3s; background: blue; } /* ❌ Snaps on hover exit! */
```

*Fix:*
```css
.btn {
  transition: background-color 0.3s ease; /* Transition on base class */
}
.btn:hover {
  background-color: blue;
}
```

### Mistake 4: Using `transition: all` Indiscriminately (Performance and Unintended Property Bug)

**The mistake:** Writing `transition: all 0.3s ease;` across all component classes.

**Why it's wrong:** `transition: all` forces the browser to monitor EVERY property change (including layout properties like `height` or `margin`). Explicitly specify target properties (`transition: transform 0.3s, opacity 0.3s`).

*Incorrect:*
```css
.card { transition: all 0.3s; } /* ❌ Unneeded performance monitoring! */
```

*Fix:*
```css
.card { transition: transform 0.3s ease, opacity 0.3s ease; }
```

## 5. Practice Exercises

### Exercise 1: Smooth Interactive Button Hover and Active States with transition Shorthand

**Scenario:** An author animates hover and active button state changes smoothly using the `transition` shorthand property.

**Requirements:**
1. Apply `transition: background-color 0.2s ease, transform 0.15s ease`.
2. Set `:hover` and `:active` styles.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .btn-interactive {
>   display: inline-flex;
>   align-items: center;
>   padding: 0.75rem 1.5rem;
>   background-color: #2563eb;
>   color: #ffffff;
>   border-radius: 0.375rem;
>   /* Transition Shorthand: property duration timing-function */
>   transition: background-color 0.2s ease, transform 0.15s ease;
> }
>
> .btn-interactive:hover {
>   background-color: #1d4ed8;
>   transform: translateY(-1px);
> }
>
> .btn-interactive:active {
>   transform: translateY(0);    /* Tactile press feedback */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `transition` Shorthand Property**: Specifies how CSS property changes animate smoothly between states (`property`, `duration`, `timing-function`, `delay`).
> 2. **Explicit Property Listing**: ALWAYS list explicit properties (`transition: background-color 0.2s, transform 0.15s`) instead of `transition: all` to optimize browser rendering performance!
> 3. **Tactile Hover/Active States**: Providing 150-200ms transitions creates responsive, tactile UI micro-interactions.
> 
---

### Exercise 2: Accordion Drawer Expansion Transitioning grid-template-rows

**Scenario:** Animates smooth accordion drawer height expansion using CSS Grid `grid-template-rows` transitions.

**Requirements:**
1. Set default `grid-template-rows: 0fr`.
2. Transition to `grid-template-rows: 1fr` on open state.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .accordion-wrapper {
>   display: grid;
>   grid-template-rows: 0fr;       /* Collapsed state: 0fr row height */
>   transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
> }
>
> .accordion-wrapper.is-open {
>   grid-template-rows: 1fr;       /* Expanded state: 1fr auto row height */
> }
>
> .accordion-inner {
>   overflow: hidden;             /* Required for zero-height clipping */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `0fr` to `1fr` Grid Transition Trick**: Modern CSS enables animating accordion drawers from height 0 to `auto` by transitioning `grid-template-rows` from `0fr` to `1fr`!
> 2. **Replaces JavaScript Height Math**: Eliminates legacy JavaScript element height calculations (`element.scrollHeight`).
> 3. **Smooth Performance**: Runs smoothly in modern browsers without layout thrashing.
> 
---

### Exercise 3: Optimizing GPU Composited Transition Properties

**Scenario:** Explains why transitioning `transform` and `opacity` runs on the GPU while `width` and `height` trigger heavy CPU repaints.

**Requirements:**
1. Compare GPU-accelerated transitions (`transform`) vs CPU layout thrashing (`width`).

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ Heavy CPU Layout Thrashing: Transitioning width/height triggers Reflow -> Repaint on every frame! */
> /* .bad-card { transition: width 0.3s, height 0.3s; } */
>
> /* ✅ GPU Accelerated Compositor Thread: Smooth 60fps transitions! */
> .good-card {
>   transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The 4 Pipeline Stages**: CSS animations run through Recalculate Style -> Layout (Reflow) -> Paint -> Composite.
> 2. **Compositor-Only Properties**: Only `transform` and `opacity` bypass Layout and Paint stages, executing strictly on the GPU compositor thread.
> 3. **60fps Performance Rule**: Always restrict UI animations to `transform` and `opacity` for smooth 60fps mobile performance.
## 6. Related Terms
- [`transform` (Scale, Translate, Rotate)](transform.md) — The most common property to animate (e.g., smoothly scaling a button up to be 10% larger on hover).
- [`@keyframes` & `animation`](animation.md) — The multi-step alternative for complex, non-interactive animation loops.
- [`:hover` & `:focus` (Pseudo-classes)](../level_09/hover_focus.md) — Related concept: `:hover` & `:focus` (Pseudo-classes).

---

## 7. Key Takeaways
- `transition` smoothly animates changes in CSS.
- It is most commonly used to make `:hover` states feel smooth and premium.
- **ALWAYS apply `transition` to the default base class**, never the `:hover` class!
- Keep UI animations fast (e.g., `0.2s`) so the site doesn't feel sluggish.
