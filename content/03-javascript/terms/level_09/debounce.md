# Debounce

> **Level 9 — Advanced Concepts & Patterns**
> A technique ensuring a function is only executed after a specified time has elapsed since its last invocation.

---

## 1. Prerequisites
- [Higher-Order Function](../level_03/higher_order_function.md) — The wrapper function.
- [Closure](../level_03/closure.md) — Used to remember the timer.
- [Asynchronous](../level_06/asynchronous.md) — The timer mechanism.

---

## 2. Term Category

**Design Pattern / Optimization (Universal)**: Debounce is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you have a search bar on a website that fetches results from an API every time the user types a letter. If the user types "apple" very fast, they trigger 5 API requests (`a`, `ap`, `app`, `appl`, `apple`) in less than a second. This overloads the server, wastes bandwidth, and causes the UI to lag.

Developers invented **Debouncing** to fix this. When you wrap a function in a `debounce`, you tell it: "Do not execute this code until the user has *stopped acting* for X milliseconds." 
When the user types "a", a 500ms timer starts. When they type "p", the timer is cancelled and restarted. Only when they completely stop typing for 500ms will the function finally execute and send exactly *one* API request for "apple".

### (2) Reality Metaphor
Imagine waiting for an elevator. You step in, and the doors start closing (a 5-second timer). 
Before the doors shut, someone else runs in! The elevator doesn't squish them; it immediately opens back up, resets the timer, and waits another 5 seconds. Every time a new person enters, the timer resets. The elevator *only* actually moves once 5 full seconds have passed with nobody interrupting.

### (3) JavaScript Code Examples

#### Short Snippet: The Debounce Wrapper
```javascript
function debounce(func, delay) {
  let timeoutId; // The Closure backpack remembers this!

  return function(...args) {
    // If the user triggers it again, CANCEL the previous timer!
    clearTimeout(timeoutId);
    
    // Start a brand new timer
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
```

#### Fuller Example: Search Bar Optimization
```javascript
// A fake expensive API call
function searchDatabase(query) {
  console.log(`📡 Fetching results for: "${query}"...`);
}

// We wrap it in our debounce! (Wait 500ms)
const smartSearch = debounce(searchDatabase, 500);

// The user rapidly types "J", "a", "v", "a" in 100ms intervals
smartSearch("J");
smartSearch("Ja");
smartSearch("Jav");
smartSearch("Java");

// Output:
// ... (Silence for 500ms) ...
// 📡 Fetching results for: "Java"...

// Exactly ONE call was made!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Re-creating the Debounce on every event

**The mistake:** Wrapping the function *inside* the event listener, causing a brand new debounce instance to be created every time a key is pressed.

**Why it's wrong:** For the debounce closure to work, it must share the exact same `timeoutId` across all keystrokes. If you recreate the debounce on every keystroke, you are creating 5 different elevators, each with their own independent 500ms timer. All 5 will execute!

*Incorrect:*
```javascript
// WRONG: A new 'debounce' is created every single keypress!
input.addEventListener('keyup', (e) => {
  const debouncedFunc = debounce(searchDatabase, 500);
  debouncedFunc(e.target.value); 
});
```

*Correct:*
```javascript
// CORRECT: Create the debounced function ONCE, outside the listener.
const smartSearch = debounce(searchDatabase, 500);
input.addEventListener('keyup', (e) => {
  smartSearch(e.target.value);
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Debounce Callbacks

**The mistake:** Passing methods from Debounce instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "debounce",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "debounce",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Debounce Operations

**The mistake:** Executing asynchronous operations within Debounce without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/debounce"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/debounce");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in debounce: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Real-Time Auto-Save Input Debouncer

**Scenario:** A rich text editor debounces auto-save operations to prevent firing network requests on every keystroke, waiting for a pause in typing.

**Requirements:**
1. Write debounce(fn, delayMs).
2. Maintain internal timer variable.
3. Clear existing timer on new calls.
4. Invoke fn after delayMs has elapsed.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function debounce(fn, delayMs) {
>   let timerId = null;
>   return function(...args) {
>     const context = this;
>     if (timerId !== null) {
>       clearTimeout(timerId);
>     }
>     timerId = setTimeout(() => {
>       fn.apply(context, args);
>       timerId = null;
>     }, delayMs);
>   };
> }
>
> // Verification tests
> let callCount = 0;
> const saveFn = debounce(() => { callCount++; }, 100);
>
> saveFn();
> saveFn();
> saveFn();
> console.assert(callCount === 0, "Test 1 Failed: Debounced function should not run synchronously");
>
> setTimeout(() => {
>   console.assert(callCount === 1, "Test 2 Failed: Debounced function should run exactly once after delay");
> }, 150);
> ```
>
> #### Technical Explanation
>
> 1. **Debounce Mechanics**: Debouncing delays function execution until a specified quiet period passes without new invocations.
> 2. **Timer Reset via clearTimeout()**: Each call resets pending timeout timers, delaying execution to the latest call.
> 3. **Closure State Management**: The timerId reference is preserved across calls using a persistent closure variable.
> 
---

### Exercise 2: Window Resize Debouncer with Immediate Execution Option

**Scenario:** A responsive dashboard layout manager debounces window resize events, supporting an immediate execution option for fast initial rendering.

**Requirements:**
1. Write debounceImmediate(fn, delayMs, immediate).
2. If immediate is true and timer is null, call fn instantly.
3. Reset timer after delayMs passes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function debounceImmediate(fn, delayMs, immediate = false) {
>   let timerId = null;
>   return function(...args) {
>     const context = this;
>     const callNow = immediate && timerId === null;
>
>     if (timerId !== null) {
>       clearTimeout(timerId);
>     }
>
>     timerId = setTimeout(() => {
>       timerId = null;
>       if (!immediate) {
>         fn.apply(context, args);
>       }
>     }, delayMs);
>
>     if (callNow) {
>       fn.apply(context, args);
>     }
>   };
> }
>
> // Verification tests
> let leadingCount = 0;
> const leadingDebounced = debounceImmediate(() => { leadingCount++; }, 100, true);
>
> leadingDebounced(); // Should run immediately
> console.assert(leadingCount === 1, "Test 1 Failed: Immediate execution should run on leading edge");
> leadingDebounced(); // Should be suppressed
> console.assert(leadingCount === 1, "Test 2 Failed: Subsequent calls within delay should be debounced");
> ```
>
> #### Technical Explanation
>
> 1. **Leading Edge Execution**: Immediate debouncing executes the target function on the FIRST call, suppressing subsequent calls until quiet period ends.
> 2. **Trailing Edge Execution**: Standard debouncing waits for the quiet period to end before executing on the LAST call.
> 3. **Context & Argument Passing**: Preserves target function `this` binding and parameters via fn.apply(context, args).
> 
---

### Exercise 3: Cancellable Search Query Debouncer

**Scenario:** A search auto-complete widget debounces API requests and provides a .cancel() method to abort pending queries when users close the search modal.

**Requirements:**
1. Write createCancellableDebounce(fn, delayMs).
2. Return debounced function with attached .cancel() method.
3. cancel() must clear pending timeout and reset timerId.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCancellableDebounce(fn, delayMs) {
>   let timerId = null;
>
>   function debounced(...args) {
>     const context = this;
>     if (timerId !== null) {
>       clearTimeout(timerId);
>     }
>     timerId = setTimeout(() => {
>       fn.apply(context, args);
>       timerId = null;
>     }, delayMs);
>   }
>
>   debounced.cancel = function() {
>     if (timerId !== null) {
>       clearTimeout(timerId);
>       timerId = null;
>     }
>   };
>
>   return debounced;
> }
>
> // Verification tests
> let searchFired = false;
> const search = createCancellableDebounce(() => { searchFired = true; }, 100);
>
> search("javascript");
> search.cancel();
>
> setTimeout(() => {
>   console.assert(searchFired === false, "Test 1 Failed: Cancelled debounced function should not fire");
> }, 150);
> ```
>
> #### Technical Explanation
>
> 1. **Cancellable Debounce Pattern**: Attaching a .cancel() method to debounced functions enables manual cancellation of pending execution.
> 2. **Memory & Resource Safeguard**: Cancelling pending timers prevents unwanted API requests when UI components unmount.
> 3. **Function Object Properties**: In JavaScript, functions are first-class objects and can have custom properties/methods attached.
---

## 6. Related Terms
- [Throttle](throttle.md) — The sister technique to Debounce.
- [Closure](../level_03/closure.md) — The mechanic keeping the timer ID alive.

---

## 7. Key Takeaways
- Debounce groups a rapid burst of events into a single execution.
- It executes the function ONLY after a period of total silence (inactivity).
- Every new event resets the countdown timer.
- It is crucial for optimizing Search Bars (API requests), Window Resizing, and Auto-Saving text forms.
```
