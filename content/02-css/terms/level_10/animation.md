# `@keyframes` & `animation`

> **Level 10 — Transitions & Animations**
> A CSS animation rule and shorthand property system that defines multi-step timelines (`@keyframes`) and timing configurations to animate elements automatically, with full control over loops, delays, and state holdings.

---

## 1. Prerequisites
- [`transition`](transition.md) — The baseline two-state animation tool.
- [`transform` (Scale, Translate, Rotate)](transform.md) — The visual coordinates manipulated by animations.

---

## 2. Term Category

**CSS At-Rule & Animation Property (Universal Modern Standard .)**: `@keyframes` & `animation` is a fundamental concept in this technology stack. **Level 10 — Transitions & Animations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `transition` is great for simple, interactive changes (like changing a button color on `:hover`), it has three massive limitations:
1.  **Requires Interaction:** It only runs when a state changes (like hovering or clicking). You cannot run it automatically when the page loads.
2.  **Only Two Steps:** It can only animate from State A to State B. You cannot create a multi-step sequence (like moving right, then down, then left).
3.  **No Infinite Loops:** It cannot repeat itself forever.

To solve this, browser makers introduced **`@keyframes`** and the **`animation`** engine. 

`@keyframes` defines a timeline (like a film strip) with specific checkpoints (from `0%` to `100%`). 

The `animation` property then applies this timeline to an element, telling it how fast to run, how many times to repeat, and how to behave when it ends.

---

### (2) Step 1: Defining the Timeline with `@keyframes`
You create a custom at-rule block and name it (e.g. `pulse`). Inside, you specify style milestones:

```css
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1); /* Midpoint peak */
    opacity: 0.8;
  }
  100% {
    transform: scale(1); /* Return to baseline */
    opacity: 1;
  }
}
```

---

### (3) Step 2: Applying with `animation`
Once defined, you trigger the keyframes on an element. The shorthand properties include:
-   **`animation-name`**: The name of your keyframes block (e.g., `pulse`).
-   **`animation-duration`**: The length of one animation cycle (e.g., `2s`).
-   **`animation-iteration-count`**: How many times it loops (e.g., `infinite` or `3`).
-   **`animation-direction`**: The playback direction. Use `alternate` to swing back and forth.
-   **`animation-fill-mode`**: What happens when the animation completes. Use `forwards` to lock the element in its final animated style instead of letting it snap back to the start!

```css
.pulse-circle {
  /* Shorthand: name | duration | timing | iteration | direction */
  animation: pulse 2s ease-in-out infinite alternate;
}
```

---

### (4) Code Examples

#### Short Snippet
Single slide-in loading overlay:

```css
.modal-overlay {
  /* Animate overlay slide, 
     use 'forwards' to keep the overlay visible at 100% when done! */
  animation: slideIn 0.5s ease-out forwards;
}

@keyframes slideIn {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
```

#### Fuller Example (Loading Spinner)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Animation Showcase</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #0d1117;
      color: white;
      font-family: sans-serif;
    }

    /* THE SPINNER BOX */
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.1);
      border-top-color: #58a6ff; /* Highlighted edge */
      border-radius: 50%;
      
      /* Trigger spinner timeline */
      animation: spin 1s linear infinite;
    }

    /* THE TIMELINE */
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>

  <div class="spinner"></div>
  <p>Loading application resources...</p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `animation-fill-mode: forwards` on single-run animations

**The mistake:** Creating an opening slide-in screen and watching the slide-in box slide down beautifully, but then instantly snap back to the top of the viewport the millisecond the timer ends.

**Why it's wrong:** By default, once an animation finishes, the browser strips the animation styles and resets the element to its default CSS ruleset. 

**Fix: Add `forwards` to the animation shorthand block to lock the element in its final frame.**

---



### Mistake 2: Forgetting `animation-fill-mode: forwards` (Animation Jump Snap Trap)

**The mistake:** Running keyframe animation shifting an element down, where the element snaps back to top position when finished.

**Why it's wrong:** By default, keyframe animations revert back to original un-animated styles when complete. Add `animation-fill-mode: forwards` (or shorthand `forwards`) to retain final keyframe styles.

*Incorrect:*
```css
.slide { animation: slideDown 1s; } /* ❌ Snaps back to top when finished! */
```

*Fix:*
```css
.slide { animation: slideDown 1s forwards; } /* Retains final keyframe state */
```

### Mistake 3: Animating Non-GPU Properties (`margin`, `width`, `top`) Causing Frame Drops (Jank)

**The mistake:** Animating `margin-left` or `width` inside `@keyframes` for smooth movement.

**Why it's wrong:** Animating box-model properties forces continuous browser Reflow and Repaint operations on every frame, causing animation stuttering (jank). Animate `transform` and `opacity` for 60fps GPU acceleration.

*Incorrect:*
```css
@keyframes move { from { margin-left: 0; } to { margin-left: 200px; } } /* ❌ Reflow jank! */
```

*Fix:*
```css
@keyframes move { from { transform: translateX(0); } to { transform: translateX(200px); } }
```

## 5. Practice Exercises

### Exercise 1: Infinite Loading Spinner Keyframe Animation

**Scenario:** An author styles a continuous circular loading spinner using `@keyframes` and the `animation` shorthand property.

**Requirements:**
1. Define `@keyframes spin { to { transform: rotate(360deg); } }`.
2. Apply `animation: spin 0.8s linear infinite`.
3. Include `prefers-reduced-motion` check.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> @keyframes spin {
>   from {
>     transform: rotate(0deg);
>   }
>   to {
>     transform: rotate(360deg);
>   }
> }
>
> .spinner-icon {
>   width: 2rem;
>   height: 2rem;
>   border: 3px solid #e2e8f0;
>   border-top-color: #2563eb;
>   border-radius: 50%;
>   /* Animation Shorthand: name | duration | timing-function | iteration-count */
>   animation: spin 0.8s linear infinite;
> }
>
> /* Accessibility Reduced Motion Guard */
> @media (prefers-reduced-motion: reduce) {
>   .spinner-icon {
>     animation-duration: 4s;     /* Slows rotation down significantly to prevent motion sickness */
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `animation` Shorthand Property**: Combines `animation-name`, `duration`, `timing-function`, `delay`, `iteration-count`, `direction`, `fill-mode`, and `play-state` into a single declaration.
> 2. **`linear` Timing Function**: Using `linear` guarantees a continuous 360-degree rotation speed without stuttering or easing pauses.
> 3. **GPU Hardware Acceleration**: Animating `transform: rotate()` runs on the GPU compositor thread, guaranteeing 60fps performance.
> 4. **Reduced Motion Guard**: Slows or pauses animations for users with vestibular motion sensitivities.
> 
---

### Exercise 2: Pulse Notification Badge Animation

**Scenario:** Styles an animated pulsing indicator dot for active system notifications.

**Requirements:**
1. Define `@keyframes pulse` for scale and opacity.
2. Apply `animation: pulse 2s cubic-bezier(...) infinite`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> @keyframes pulse-ring {
>   0% {
>     transform: scale(0.95);
>     box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
>   }
>   70% {
>     transform: scale(1);
>     box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
>   }
>   100% {
>     transform: scale(0.95);
>     box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
>   }
> }
>
> .active-dot {
>   width: 0.75rem;
>   height: 0.75rem;
>   background-color: #2563eb;
>   border-radius: 50%;
>   animation: pulse-ring 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Keyframe Multi-Stops**: Keyframes accept multi-stop percentages (`0%`, `70%`, `100%`) for complex non-linear animation sequences.
> 2. **Cubic Bezier Easing**: `cubic-bezier(0.45, 0, 0.55, 1)` produces smooth organic swelling and shrinking.
> 3. **Tactile Status Affordance**: Attracts visual attention to live system indicators gracefully.
> 
---

### Exercise 3: Skeleton Loader Shimmer Animation with prefers-reduced-motion Guard

**Scenario:** Builds a shimmering UI skeleton loading state while disabling motion for reduced motion preferences.

**Requirements:**
1. Define `@keyframes shimmer` moving background gradient.
2. Disable animation inside `@media (prefers-reduced-motion: reduce)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> @keyframes shimmer {
>   0% {
>     background-position: -200% 0;
>   }
>   100% {
>     background-position: 200% 0;
>   }
> }
>
> .skeleton-box {
>   background: linear-gradient(
>     90deg,
>     #f1f5f9 25%,
>     #e2e8f0 37%,
>     #f1f5f9 63%
>   );
>   background-size: 200% 100%;
>   animation: shimmer 1.5s infinite;
>   border-radius: 0.375rem;
> }
>
> @media (prefers-reduced-motion: reduce) {
>   .skeleton-box {
>     animation: none;
>     background: #e2e8f0;        /* Static neutral gray fallback */
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Skeleton Loading UX**: Skeleton shimmers indicate upcoming content structure during network data fetching.
> 2. **Background Position Animation**: Animates `background-position` across a `200%` width linear gradient.
> 3. **Accessibility Compliance**: Completely disables the shimmer animation for users requesting reduced motion, satisfying WCAG AAA rules.
## 6. Related Terms
- [`transition`](transition.md) — Two-state animated shifts.
- [`transform` (Scale, Translate, Rotate)](transform.md) — The positioning multipliers.

---

## 7. Key Takeaways
- `@keyframes` defines the animation timeline milestones (from 0% to 100%).
- The `animation` property applies the keyframe timeline to an element.
- Animations run automatically, support multi-step frames, and can loop infinitely.
- Use `animation-direction: alternate` to make loop transitions swing smoothly.
- Use `animation-fill-mode: forwards` to keep elements in their final state after single runs.
