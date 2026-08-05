# `@keyframes` & `animation`

> **Level 10 — Transitions & Animations**
> A CSS animation rule and shorthand property system that defines multi-step timelines (`@keyframes`) and timing configurations to animate elements automatically, with full control over loops, delays, and state holdings.

---

## 1. Prerequisites
- [`transition`](transition.md) — The baseline two-state animation tool.
- [`transform` (Scale, Translate, Rotate)](transform.md) — The visual coordinates manipulated by animations.

---

## 2. Term Category
- **CSS At-Rule & Animation Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Runs directly on GPU composition layers. Does not trigger browser reflow layouts when animating transform parameters).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Forgetting `animation-fill-mode: forwards` (Animation Jump Snap Trap)

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

### Mistake 5: Animating Non-GPU Properties (`margin`, `width`, `top`) Causing Frame Drops (Jank)

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



### Mistake 6: Forgetting `animation-fill-mode: forwards` (Animation Jump Snap Trap)

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

### Mistake 7: Animating Non-GPU Properties (`margin`, `width`, `top`) Causing Frame Drops (Jank)

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

## 6. Practice Exercises

### Exercise 1: Pulsing Alert

**Problem:** You are building an urgent warning dot. The warning dot should pulse: fade from `opacity: 1` down to `opacity: 0.3` and scale down to `scale(0.8)`, then loop back and repeat forever smoothly. Write the `@keyframes` block and alert dot ruleset.

**Expected output:**
> [!check]- Answer
> ```css
> @keyframes warningPulse {
>   from {
>     transform: scale(1);
>     opacity: 1;
>   }
>   to {
>     transform: scale(0.8);
>     opacity: 0.3;
>   }
> }
> 
> .warning-dot {
>   width: 15px;
>   height: 15px;
>   background-color: red;
>   border-radius: 50%;
>   animation: warningPulse 1s ease-in-out infinite alternate;
> }
> ```
> - Alternate playback direction is required to make the pulse fade out and fade back in smoothly without snapping.
> - Run the loop infinitely.

---



### Exercise 2: Infinite Spinner Animation Pattern

**Problem:** Write `@keyframes spin` rotating 0deg to 360deg, and apply it to `.spinner` for infinite 1s linear rotation.

**Expected output:**
> [!check]- Answer
> ```text
> @keyframes spin { to { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }
> ```
> ```css
> @keyframes spin {
>   to { transform: rotate(360deg); }
> }
> .spinner {
>   animation: spin 1s linear infinite;
> }
> ```
>
> **Explanation:** `infinite linear` creates smooth continuous 360-degree rotation animation.

---

### Exercise 3: Animation Shorthand Property Order

**Problem:** Identify the 4 primary components of `animation: spin 1s ease-in-out infinite;`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Keyframe name: spin
> 2. Duration: 1s
> 3. Timing function: ease-in-out
> 4. Iteration count: infinite
> ```
> ```text
> 1. Keyframe name: spin
> 2. Duration: 1s
> 3. Timing function: ease-in-out
> 4. Iteration count: infinite
> ```
>
> **Explanation:** `animation` shorthand combines name, duration, easing, and iteration count.

## 7. Related Terms
- [`transition`](transition.md) — Two-state animated shifts.
- [`transform` (Scale, Translate, Rotate)](transform.md) — The positioning multipliers.

---

## 8. Key Takeaways
- `@keyframes` defines the animation timeline milestones (from 0% to 100%).
- The `animation` property applies the keyframe timeline to an element.
- Animations run automatically, support multi-step frames, and can loop infinitely.
- Use `animation-direction: alternate` to make loop transitions swing smoothly.
- Use `animation-fill-mode: forwards` to keep elements in their final state after single runs.
