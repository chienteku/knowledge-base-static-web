# `transition`

> **Level 10 — Transitions & Animations**
> The property that tells the browser to smoothly animate CSS changes over a period of time, rather than changing them instantly.

---

## 1. Prerequisites
- [`:hover` & `:focus` (Pseudo-classes)](../level_09/hover_focus.md) — Transitions are almost exclusively used to animate the change between the default state and a hover/focus state.

---

## 2. Term Category
- **Animation Property**

---

## 3. Environment Context
- **Universal Modern Standard** (The easiest way to make a website feel "premium").

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 5: Placing `transition` Property in `:hover` State Selector Instead of Base Class

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

### Mistake 6: Using `transition: all` Indiscriminately (Performance and Unintended Property Bug)

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



### Mistake 7: Placing `transition` Property in `:hover` State Selector Instead of Base Class

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

### Mistake 8: Using `transition: all` Indiscriminately (Performance and Unintended Property Bug)

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

## 6. Practice Exercises

### Exercise 1: Targeting Specific Properties

**Problem:** You have a button that changes both `background-color` and `color` (text color) on hover. You want the background to animate, but you want the text color to snap instantly. How do you write the transition?

**Expected output:**
> [!check]- Answer
> ```css
> /* Instead of using 'all', specifically target the background! */
> transition: background-color 0.3s ease;
> ```
> - The first value in the shorthand is the specific property name.
> 
---



### Exercise 2: Button Hover Elevation Transition Pattern

**Problem:** Write CSS transitioning `transform` and `box-shadow` over 0.2s ease on `.btn` hover.

**Expected output:**
> [!check]- Answer
> ```text
> .btn { transition: transform 0.2s ease, box-shadow 0.2s ease; } .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
> ```
> ```css
> .btn {
>   transition: transform 0.2s ease, box-shadow 0.2s ease;
> }
> .btn:hover {
>   transform: translateY(-2px);
>   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
> }
> ```
>
> **Explanation:** Explicitly listed transition properties animate hardware-accelerated transforms and shadows cleanly.
> 
---

### Exercise 3: Non-Animatable CSS Properties

**Problem:** Can `display` (e.g. `display: none` to `display: block`) be animated smoothly with CSS `transition`? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```text
> No. display is a discrete property and cannot interpolate smooth frame steps.
> ```
> ```text
> No. display is a discrete property and cannot interpolate smooth frame steps.
> ```
>
> **Explanation:** Discrete properties (`display`, `visibility`) cannot interpolate intermediate animation frames without `@starting-style`.
> 
## 7. Related Terms
- [`transform` (Scale, Translate, Rotate)](transform.md) — The most common property to animate (e.g., smoothly scaling a button up to be 10% larger on hover).
- [`@keyframes` & `animation`](animation.md) — The multi-step alternative for complex, non-interactive animation loops.
- [`:hover` & `:focus` (Pseudo-classes)](../level_09/hover_focus.md) — Related concept: `:hover` & `:focus` (Pseudo-classes).

---

## 8. Key Takeaways
- `transition` smoothly animates changes in CSS.
- It is most commonly used to make `:hover` states feel smooth and premium.
- **ALWAYS apply `transition` to the default base class**, never the `:hover` class!
- Keep UI animations fast (e.g., `0.2s`) so the site doesn't feel sluggish.
