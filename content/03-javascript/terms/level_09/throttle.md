# Throttle

> **Level 9 — Advanced Concepts & Patterns**
> A technique ensuring a function is executed at most once within a specified time period, no matter how many times it's triggered.

---

## 1. Prerequisites
- [Debounce](debounce.md) — The sister technique that is often confused with Throttle.
- [Closure](../level_03/closure.md) — Used to remember the "cooling down" state.
---

## 2. Term Category
- **Design Pattern / Optimization**

---

## 3. Environment Context
- **Universal** (Especially critical in Browser UI development)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If [Debounce](./debounce.md) waits for the user to *stop* doing something, what happens if they never stop?
Imagine a video game where pressing the spacebar fires a laser. If you use Debounce, the laser will only fire when the player *stops* mashing the spacebar. That’s terrible! Or imagine a webpage that tracks your scroll position to animate an element. If you use Debounce, the animation will only happen when you *stop* scrolling.

We need a technique that allows continuous execution, but at a controlled, restricted rate. **Throttling** says: "You can trigger this function as many times as you want, but I will only actually execute it once every X milliseconds." It acts as a strict speed limit.

### (2) Reality Metaphor
Imagine a water fountain with a push-button.
If you push the button, water comes out for exactly 3 seconds. If you frantically mash the button 50 times while the water is already flowing, it does nothing. The fountain ignores you. Only *after* the 3 seconds finish can you press the button again to get more water.

### (3) JavaScript Code Examples

#### Short Snippet: The Throttle Wrapper
```javascript
function throttle(func, limit) {
  let inThrottle = false; // The Closure backpack remembers this boolean!

  return function(...args) {
    // If we are currently cooling down, ignore the request completely!
    if (inThrottle) {
      return;
    }
    
    // Otherwise, execute the function!
    func(...args);
    inThrottle = true; // Turn ON the cooldown
    
    // Set a timer to turn the cooldown OFF after the limit passes
    setTimeout(() => {
      inThrottle = false; 
    }, limit);
  };
}
```

#### Fuller Example: The Scroll Tracker
```javascript
function calculateScrollPercent() {
  console.log("📊 Calculating complex UI math based on scroll...");
}

// We want to track scrolling, but NOT 1000 times a second!
// We throttle it to run a maximum of once every 200ms.
const safeScroll = throttle(calculateScrollPercent, 200);

// The user aggressively spins their mouse wheel for 1 full second
// At 1000 events per second, normally this fires 1000 times!

window.addEventListener('scroll', safeScroll);

/*
Output during 1 second of aggressive scrolling:
[0ms]   📊 Calculating complex UI math based on scroll...
[200ms] 📊 Calculating complex UI math based on scroll...
[400ms] 📊 Calculating complex UI math based on scroll...
[600ms] 📊 Calculating complex UI math based on scroll...
[800ms] 📊 Calculating complex UI math based on scroll...

Result: It fired exactly 5 times, instead of 1000! Massive performance save!
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Throttle Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Throttle blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "throttle";
```

*Fix:*
```javascript
let value = "throttle";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Throttle Callbacks

**The mistake:** Passing methods from Throttle instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "throttle",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "throttle",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Throttle Operations

**The mistake:** Executing asynchronous operations within Throttle without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/throttle"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/throttle");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in throttle: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The FPS limit

**Problem:** Most computer monitors refresh at 60 Frames Per Second (FPS). That is roughly 1 frame every 16 milliseconds. If you are building a tool that tracks the user's mouse cursor to draw a trail behind it, what is a logical limit to set your `throttle(drawTrail, limit)` to?

**Expected output:**
> [!check]- Answer
> ```text
> `16` milliseconds!
> If you allow it to fire faster than 16ms, you are doing math that the monitor cannot physically display fast enough. It's wasted CPU power. Throttling to 16ms guarantees buttery smooth 60 FPS without wasting resources.
> ```
> - `1000ms / 60 frames = 16.6ms`

---

### Exercise 2: Implementing Basic Throttle Helper

**Problem:** Implement `throttle(fn, limit)` preventing execution more than once per `limit` milliseconds.

**Expected output:**
> [!check]- Answer
> ```text
> Throttled call executed
> ```
> ```javascript
> function throttle(fn, limit) {
>   let inThrottle = false;
>   return function(...args) {
>     if (!inThrottle) {
>       fn.apply(this, args);
>       inThrottle = true;
>       setTimeout(() => inThrottle = false, limit);
>     }
>   };
> }
> const throttled = throttle(() => console.log("Throttled call executed"), 100);
> throttled(); throttled();
> ```
>
> **Explanation:** Throttling enforces a maximum execution frequency rate limit for high-frequency events.

---

### Exercise 3: Scroll Event Throttling

**Problem:** Explain why throttling is suited for window scroll positioning updates.

**Expected output:**
> [!check]- Answer
> ```text
> Throttling limits scroll callback rate
> ```
> ```javascript
> console.log("Throttling limits scroll callback rate");
> ```
>
> **Explanation:** Throttling maintains smooth periodic UI updates during continuous user scrolling.


---

## 7. Related Terms
- [Debounce](debounce.md) — Waits for total silence before firing.
- [Closure](../level_03/closure.md) — The mechanic holding the `inThrottle` boolean.
---

## 8. Key Takeaways
- Throttle guarantees a function runs at a consistent, restricted interval (e.g., max once per second).
- It ignores any extra triggers that occur during the "cooldown" period.
- Use **Throttle** for continuous actions (Scrolling, Mouse Dragging, Window Resizing animations, Gaming Inputs).
- Use **Debounce** for start-and-stop actions (Typing in a Search Bar, Auto-saving).
```
