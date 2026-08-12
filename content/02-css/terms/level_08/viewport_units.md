# `vw` / `vh` (Viewport Units)

> **Level 8 — Responsive Design & Units**
> Units of measurement that size an element based on the physical size of the browser window (the Viewport), ignoring parent containers entirely.

---

## 1. Prerequisites
- [`%` (Percentages)](percentages.md) — You must understand why `%` fails for heights to understand why Viewport units were invented.

---

## 2. Term Category

**CSS Measurement Unit (Universal Modern Standard)**: `vw` / `vh` (Viewport Units) is a fundamental concept in this technology stack. **Level 8 — Responsive Design & Units**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in the previous lesson, using `height: 100%` on a `<div>` almost never works because it relies on the height of its parent container. 
But modern web design constantly requires elements to be exactly the size of the user's screen (e.g., a massive "Hero Image" on the homepage that covers the entire monitor before you scroll down).
To solve this, the W3C introduced **Viewport Units**. 
- **`vw`** stands for **Viewport Width**.
- **`vh`** stands for **Viewport Height**.
`1vw` is exactly 1% of the width of the user's screen. `1vh` is exactly 1% of the height of the user's screen. These units completely ignore the Parent container and look directly at the physical browser window!

### (2) Reality Metaphor
Imagine drawing a mural on a wall inside a house. 
Using Percentages (`%`) is like saying "Make the mural take up half the wall of the bedroom." (It depends on the size of the room).
Using Viewport Units (`vw/vh`) is like saying "Ignore the rooms. Make the mural exactly half the size of the entire house."

### (3) Code Examples

#### The Full-Screen Hero Section
This is how modern websites ensure the first image you see perfectly covers your screen, whether you are on a massive 4K monitor or a tiny iPhone.
```css
.hero-section {
  /* Make this box exactly 100% of the height of the user's browser window! */
  height: 100vh;
  
  /* Make this box exactly 100% of the width of the user's browser window! */
  width: 100vw; 
  
  background-image: url('cool-background.jpg');
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `100vw` instead of `100%` for width

**The mistake:** Applying `width: 100vw;` to a container to make it stretch across the screen.

**Why it's wrong:** Operating systems (like Windows) have physical scrollbars that take up space (usually about 15px). `100%` respects the scrollbar and only takes up the *available* space. `100vw` ignores the scrollbar and takes up the *physical screen space*. This means `100vw` will actually push 15px *underneath* the scrollbar, causing an ugly horizontal scrollbar to appear at the bottom of your website!
**Golden Rule:** Always use `width: 100%` for widths. Only use `vh` for heights!

### Mistake 2: The Mobile Safari Bar

**The mistake:** Using `100vh` on an iPhone, but the bottom of your design gets covered up by Safari's URL/Navigation bar at the bottom of the screen.

**Why it's wrong:** Historically, Apple engineered Safari so that `100vh` ignored the UI bars. Recently, CSS introduced new units to fix this: `dvh` (Dynamic Viewport Height). If you are building a full-screen mobile app, use `100dvh` instead of `100vh`!

---



### Mistake 3: Using `height: 100vh` on Mobile Browsers (Mobile Address Bar Jumping Bug)

**The mistake:** Setting `height: 100vh` on full-screen mobile hero sections.

**Why it's wrong:** On mobile Safari/Chrome, `100vh` calculates height including the hidden area under address bars, causing content to be cut off and triggering layout jumping when address bars collapse. Use `100dvh`.

*Incorrect:*
```css
.hero { height: 100vh; } /* ❌ Cut off by mobile browser address bar! */
```

*Fix:*
```css
.hero { height: 100dvh; } /* Dynamic viewport height adjusts to mobile browser UI */
```

### Mistake 4: Using `vw` Units for Font Size Without Clamping (Micro Font Size Bug on Mobile)

**The mistake:** Setting `font-size: 3vw` on body text.

**Why it's wrong:** On 320px mobile screens, `3vw` calculates to `9.6px`, making text illegibly small. On 2000px screens, it expands to `60px`. Clamp viewport font sizes using `clamp()`.

*Incorrect:*
```css
p { font-size: 2vw; } /* ❌ Becomes unreadably tiny on mobile phones! */
```

*Fix:*
```css
p { font-size: clamp(1rem, 2vw, 1.5rem); } /* Clamped viewport typography */
```

## 5. Practice Exercises

### Exercise 1: Full-Screen Viewport Hero Section with Dynamic Height (100dvh)

**Scenario:** An author styles a full-screen hero section using modern dynamic viewport height units (`min-height: 100dvh`).

**Requirements:**
1. Apply `min-height: 100dvh`.
2. Set `display: flex; justify-content: center; align-items: center;`.
3. Add fallback.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .hero-full-screen {
>   box-sizing: border-box;
>   /* 100dvh: Dynamic Viewport Height (adapts to mobile URL bar expansion!) */
>   min-height: 100dvh;
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
> 1. **Modern Dynamic Viewport Units (`dvh`)**: `100dvh` dynamically calculates exact viewport height as mobile browser address bars expand or collapse during scrolling!
> 2. **Solving the Mobile `100vh` Bug**: Legacy `100vh` on mobile web browsers included the hidden area under the URL bar, causing bottom content to get cut off!
> 3. **`min-height` over `height`**: ALWAYS use `min-height: 100dvh` so container expands safely if content height exceeds screen size.
> 
---

### Exercise 2: Viewport Width Typography Scaling with clamp() Safety Net

**Scenario:** Scales headline typography based on viewport width (`vw`) with `clamp()` bounds.

**Requirements:**
1. Apply `font-size: clamp(2rem, 5vw, 4rem)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .vw-headline {
>   /* Scales directly with Viewport Width (5vw = 5% of window width) */
>   font-size: clamp(2rem, 5vw, 4rem);
>   font-weight: 800;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `vw` (Viewport Width) Unit**: `1vw` equals 1% of the total layout viewport width.
> 2. **Raw `vw` Danger**: Never use raw `font-size: 5vw` without `clamp()`, as text will shrink to unreadably tiny sizes on mobile screens (<320px)!
> 3. **`clamp()` Safety Net**: Encloses `5vw` inside `clamp(2rem, 5vw, 4rem)` to enforce strict minimum and maximum readability bounds.
> 
---

### Exercise 3: Understanding Small (svh), Large (lvh), and Dynamic (dvh) Viewport Variants

**Scenario:** Compares modern CSS Viewport Module Level 4 unit variants (`svh`, `lvh`, `dvh`).

**Requirements:**
1. Explain `svh`, `lvh`, and `dvh` usage contexts.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Small Viewport Height: Height when mobile address bar is EXPANDED (smallest visible space) */
> .modal-small { max-height: 90svh; }
>
> /* Large Viewport Height: Height when mobile address bar is RETRACTED (largest visible space) */
> .background-hero { min-height: 100lvh; }
>
> /* Dynamic Viewport Height: Adjusts dynamically in real-time as user scrolls */
> .hero-adaptive { min-height: 100dvh; }
> ```
>
> #### Technical Explanation
>
> 1. **`svh` (Small Viewport Height)**: Calculates height assuming the mobile address bar is fully expanded (smallest viewport).
> 2. **`lvh` (Large Viewport Height)**: Calculates height assuming the mobile address bar is hidden (largest viewport).
> 3. **`dvh` (Dynamic Viewport Height)**: Adjusts dynamically in real time between `svh` and `lvh` as address bars show/hide during scrolling.
## 6. Related Terms
- [`%` (Percentages)](percentages.md) — The parent-relative sizing alternative.
- [`rem` vs `em`](rem_em.md) — Sizing relative to fonts rather than the viewport.
- [`max-width` & `min-height` (Fluidity)](max_width.md) — Fluid constraints to pair with viewport heights.
- [Responsive Design (Concept)](responsive_design.md) — Related concept: Responsive Design (Concept).

---

## 7. Key Takeaways
- `vw` and `vh` are based on the **User's Screen Size**, not the parent container.
- `100vh` is the definitive, modern way to make an element fill the height of the screen.
- Avoid using `100vw`, as it causes horizontal scrollbar bugs; stick to `width: 100%` instead.
