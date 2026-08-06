# Framer Motion

> **Level 11 — Ecosystem Libraries**
> The industry-standard animation library for React. It provides an incredibly simple, declarative API for creating complex animations, transitions, and layout morphing.

---

## 1. Prerequisites
- [Declarative Programming](../level_01/declarative_programming.md) — Framer Motion is the ultimate expression of declarative animation.
- [Component Lifecycle](../level_03/component_lifecycle.md) — Framer Motion specializes in animating components as they Mount and Unmount.

---

## 2. Term Category
- **React Ecosystem / Animation Library**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Animating in vanilla CSS is hard. Animating in React using vanilla CSS is a nightmare. 
If you want to fade out a Modal when a user clicks "Close", you can't just unmount the component (because it instantly vanishes without playing the animation). You have to delay the unmounting, trigger a CSS class, wait for a timer, and then unmount it.
**Framer Motion** abstracts all of this pain away. It allows you to just declare: "Start at opacity 0, animate to opacity 1", and it handles all the complex math, physics, and React lifecycles for you.

### (2) The `motion` Component
To animate an element, you replace standard HTML tags (`<div>`) with Framer Motion tags (`<motion.div>`).
You then pass it `initial` (starting state) and `animate` (ending state) props.

```javascript
import { motion } from 'framer-motion';

function WelcomeSign() {
  return (
    // It will automatically slide in from the left and fade in!
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Welcome to the App!</h1>
    </motion.div>
  );
}
```

### (3) AnimatePresence (The Magic Unmount)
The most powerful feature of Framer Motion is `<AnimatePresence>`. 
If you wrap conditional components in this tag, it will keep the component in the DOM just long enough to play an `exit` animation before permanently destroying it!

```javascript
import { motion, AnimatePresence } from 'framer-motion';

function App({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // Fades out before unmounting!
        >
          I fade in and fade out!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `key` prop in AnimatePresence

**The mistake:** A developer uses `<AnimatePresence>` to animate between two different images in a slider, but forgets to give the images unique `key` props.

**Why it's wrong:** React uses the `key` prop to know when an element has changed. If there is no key, React just mutates the existing `<img>` tag to show the new picture. Framer Motion doesn't see a Mount/Unmount lifecycle, so no animation plays!
**Golden Rule:** When animating between different items inside `<AnimatePresence>`, the child components MUST have a unique `key` prop so React triggers a proper unmount/mount cycle.

---



### Mistake 2: Using Standard HTML Tags (`<div>`) Instead of Motion Component Tags (`<motion.div>`)

**The mistake:** Writing `<div animate={{ opacity: 1 }}>Content</div>`.

**Why it's wrong:** Standard HTML DOM tags do not recognize Framer Motion props (`animate`, `initial`, `transition`). You MUST use Framer Motion `<motion.div>` component tags.

*Incorrect:*
```javascript
<div animate={{ opacity: 1 }}>Content</div> // ❌ Standard div ignores motion props!
```

*Fix:*
```javascript
<motion.div animate={{ opacity: 1 }}>Content</motion.div> // Motion component
```

### Mistake 3: Omitting `<AnimatePresence>` When Animating Unmounting Elements

**The mistake:** Using `exit={{ opacity: 0 }}` on `<motion.div>` without wrapping conditional render in `<AnimatePresence>`.

**Why it's wrong:** When a React component unmounts, React removes it from the DOM instantly! `exit` animations require `<AnimatePresence>` to defer unmounting until exit animations complete.

*Incorrect:*
```javascript
{show && <motion.div exit={{ opacity: 0 }}>Modal</motion.div>} // ❌ Unmounts instantly without exit animation!
```

*Fix:*
```javascript
<AnimatePresence>{show && <motion.div exit={{ opacity: 0 }}>Modal</motion.div>}</AnimatePresence>
```

## 6. Practice Exercises

### Exercise 1: Declarative Physics

**Problem:** You want a button to slightly shrink when the user presses down on it, giving a tactile "click" feel. In Framer Motion, there is a specific prop for hover and click states. Can you guess what it looks like?

**Expected output:**
> [!check]- Answer
> ```javascript
> <motion.button
>   whileHover={{ scale: 1.1 }}
>   whileTap={{ scale: 0.9 }} // Shrinks to 90% size while pressed!
> >
>   Click Me
> </motion.button>
> ```
> - Think about declarative naming: "while..."
> 
---



### Exercise 2: Basic Fade-In Motion Component

**Problem:** Create `<motion.div>` fading in from `opacity: 0` to `opacity: 1` over `0.5` seconds.

**Expected output:**
> [!check]- Answer
> ```text
> <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>Content</motion.div>
> ```
> ```javascript
> <motion.div
>   initial={{ opacity: 0 }}
>   animate={{ opacity: 1 }}
>   transition={{ duration: 0.5 }}
>
>   Content
> </motion.div>
> ```
>
> **Explanation:** `initial`, `animate`, and `transition` props control Framer Motion component keyframe animations.
> 
---

### Exercise 3: AnimatePresence Key Requirement

**Problem:** Why must items inside `<AnimatePresence>` have unique `key` props when animating list item removal? (React uses key identity to track which elements are exiting).

**Expected output:**
> [!check]- Answer
> ```text
> React uses key identity to track which elements are exiting during AnimatePresence transitions
> ```
> ```text
> React uses key identity to track which elements are exiting during AnimatePresence transitions
> ```
>
> **Explanation:** Unique keys enable `<AnimatePresence>` to defer unmounting for specific exiting elements.
> 
## 7. Related Terms
- [Conditional Rendering](../level_05/conditional_rendering.md) — What `<AnimatePresence>` supercharges.
- [Declarative Programming](../level_01/declarative_programming.md) — You declare *what* the animation should look like, Framer Motion figures out *how* to do the math.

---

## 8. Key Takeaways
- **Framer Motion** is the standard animation library for React.
- You use `<motion.div>` instead of `<div>` to unlock animation props.
- You pass `initial` (starting style) and `animate` (ending style) to trigger animations automatically on Mount.
- Use **`<AnimatePresence>`** paired with the `exit` prop to animate components as they are being Unmounted (destroyed) from the UI.
