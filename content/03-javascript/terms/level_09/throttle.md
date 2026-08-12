# Throttle

> **Level 9 — Advanced Concepts & Patterns**
> A technique ensuring a function is executed at most once within a specified time period, no matter how many times it's triggered.

---

## 1. Prerequisites
- [Debounce](debounce.md) — The sister technique that is often confused with Throttle.
- [Closure](../level_03/closure.md) — Used to remember the "cooling down" state.

---

## 2. Term Category

**Design Pattern / Optimization (Universal)**: Throttle is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: High-Frequency Window Scroll Event Throttler

**Scenario:** A web page scroll progress indicator uses `throttle(fn, limitMs)` to limit scroll listener execution to once every 100 milliseconds.

**Requirements:**
1. Write throttle(fn, limitMs).
2. Track lastExecTime timestamp.
3. Execute fn immediately if limitMs elapsed; else schedule or skip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function throttle(fn, limitMs) {
>   let lastExecTime = 0;
>   let timerId = null;
>
>   return function(...args) {
>     const context = this;
>     const now = Date.now();
>
>     if (now - lastExecTime >= limitMs) {
>       if (timerId !== null) {
>         clearTimeout(timerId);
>         timerId = null;
>       }
>       fn.apply(context, args);
>       lastExecTime = now;
>     } else if (timerId === null) {
>       const remaining = limitMs - (now - lastExecTime);
>       timerId = setTimeout(() => {
>         fn.apply(context, args);
>         lastExecTime = Date.now();
>         timerId = null;
>       }, remaining);
>     }
>   };
> }
>
> // Verification tests
> let execCount = 0;
> const throttledScroll = throttle(() => { execCount++; }, 100);
>
> throttledScroll(); // Executes immediately (leading edge)
> throttledScroll(); // Suppressed
> throttledScroll(); // Suppressed
>
> console.assert(execCount === 1, "Test 1 Failed: Throttled function should run leading execution");
> ```
>
> #### Technical Explanation
>
> 1. **Throttle Mechanics**: Enforces a maximum execution rate, ensuring target function runs at most once per specified time interval.
> 2. **Throttle vs Debounce**: Throttle guarantees execution at regular periodic intervals during continuous calls; Debounce waits until calls stop.
> 3. **FPS Performance Protection**: Prevents main thread UI layout thrashing during continuous high-frequency events (scroll, resize, mousemove).
> 
---

### Exercise 2: Mouse Pointer Coordinate Tracker with Trailing Edge Throttle

**Scenario:** An analytics tracker throttles mouse move coordinate logging, ensuring both leading and trailing edge events are captured.

**Requirements:**
1. Write throttleTrailing(fn, limitMs).
2. Ensure final mouse position is logged after mouse movement stops.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function throttleTrailing(fn, limitMs) {
>   let lastFn = null;
>   let lastTime = 0;
>   let timerId = null;
>
>   return function(...args) {
>     const context = this;
>     const now = Date.now();
>
>     if (now - lastTime >= limitMs) {
>       if (timerId !== null) {
>         clearTimeout(timerId);
>         timerId = null;
>       }
>       fn.apply(context, args);
>       lastTime = now;
>     } else {
>       lastFn = () => fn.apply(context, args);
>       if (timerId === null) {
>         const remaining = limitMs - (now - lastTime);
>         timerId = setTimeout(() => {
>           if (lastFn) {
>             lastFn();
>             lastTime = Date.now();
>             lastFn = null;
>           }
>           timerId = null;
>         }, remaining);
>       }
>     }
>   };
> }
>
> // Verification tests
> let moves = [];
> const logMove = throttleTrailing((x, y) => { moves.push(`${x},${y}`); }, 100);
>
> logMove(10, 10); // Leading edge
> logMove(20, 20); // Trailing edge target
>
> console.assert(moves.length === 1 && moves[0] === "10,10", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Trailing Edge Guarantee**: Schedules a trailing execution to capture final argument state after rapid events cease.
> 2. **Rate Limiting Accuracy**: Guarantees function execution frequency never exceeds limitMs interval.
> 3. **Memory-Safe Timers**: Clears trailing timers and references once executed to assist garbage collection.
> 
---

### Exercise 3: Cancellable API Request Rate Limiter

**Scenario:** A stock ticker widget throttles API refresh button clicks to once every 2000ms, exposing a `.cancel()` method to clear pending rate limits.

**Requirements:**
1. Write createCancellableThrottle(fn, limitMs).
2. Return throttled function with `.cancel()` method.
3. cancel() resets internal timer and timestamp.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCancellableThrottle(fn, limitMs) {
>   let lastExec = 0;
>   let timerId = null;
>
>   function throttled(...args) {
>     const context = this;
>     const now = Date.now();
>
>     if (now - lastExec >= limitMs) {
>       fn.apply(context, args);
>       lastExec = now;
>     }
>   }
>
>   throttled.cancel = function() {
>     if (timerId !== null) {
>       clearTimeout(timerId);
>       timerId = null;
>     }
>     lastExec = 0;
>   };
>
>   return throttled;
> }
>
> // Verification tests
> let requests = 0;
> const fetchTicker = createCancellableThrottle(() => { requests++; }, 1000);
>
> fetchTicker(); // Run 1
> fetchTicker(); // Rate limited
>
> console.assert(requests === 1, "Test 1 Failed");
>
> fetchTicker.cancel(); // Reset rate limit
> fetchTicker(); // Should run immediately after cancel
> console.assert(requests === 2, "Test 2 Failed: After cancel(), next call should run immediately");
> ```
>
> #### Technical Explanation
>
> 1. **Cancellable Throttle API**: Exposing `.cancel()` allows manual reset of rate limit timestamps and timers.
> 2. **API Rate Limit Protection**: Protects backend API endpoints against rapid button spamming or abusive polling.
> 3. **Timestamp Reset Mechanics**: Setting lastExec = 0 allows the next call to execute immediately as a new leading edge event.
---

## 6. Related Terms
- [Debounce](debounce.md) — Waits for total silence before firing.
- [Closure](../level_03/closure.md) — The mechanic holding the `inThrottle` boolean.

---

## 7. Key Takeaways
- Throttle guarantees a function runs at a consistent, restricted interval (e.g., max once per second).
- It ignores any extra triggers that occur during the "cooldown" period.
- Use **Throttle** for continuous actions (Scrolling, Mouse Dragging, Window Resizing animations, Gaming Inputs).
- Use **Debounce** for start-and-stop actions (Typing in a Search Bar, Auto-saving).
```
