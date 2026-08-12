# Timers (setTimeout / setInterval / clearTimeout)

> **Level 5 — DOM & Browser Environment**
> Schedule deferred/repeated callbacks.

---

## 1. Prerequisites
- [Callback Function](../level_03/callback_function.md) — A function passed into another function as an argument.
- [window object / BOM](window_bom.md) — The browser global context hosting timer methods.

---

## 2. Term Category

**Browser API / DOM (Universal: Standardized in browsers, Deno, and implemented globally in Node.js.)**: Timers (setTimeout / setInterval / clearTimeout) is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, JavaScript code executes synchronously—one line after another, blocking execution until finished. However, developers frequently need to pause or delay operations: showing a notification pop-up after a user spends 5 seconds on a page, updating a clock display every second, or debouncing keystrokes to prevent spamming search APIs.

To support time-based control flow, JavaScript hosts provide **timers**:
- **`setTimeout(callback, delayMs)`:** Schedules a single execution of a callback function after the specified delay in milliseconds (1 second = 1000ms).
- **`setInterval(callback, intervalMs)`:** Schedules a repeating execution of a callback function, running it continuously at the specified interval.
- **`clearTimeout(timerId)` / `clearInterval(timerId)`:** Cancels scheduled timers. Both timer creators return a unique integer ID. Passing this ID to the clear methods tells the engine to discard the timer and stop execution.

### (2) Accuracy Limitation
Timers in JavaScript are **not** high-precision real-time clocks. The delay parameter specifies the *minimum* time before execution, not the *exact* time. If the main execution thread is busy processing a complex loop, the callback will wait until the thread is free (event loop cycle checks), meaning a timer set for 100ms might take 150ms to fire.

### (3) Reality Metaphor
- **`setTimeout`** is like setting a kitchen egg timer. You wind it up for 10 minutes (delay) and walk away to do other work. When the timer rings, you perform the task (callback) once, and the timer is finished.
- **`setInterval`** is like setting a repeating calendar alarm. It rings every Monday morning (interval) to prompt a task. It will continue ringing forever until you physically go into the settings and delete the alarm (**`clearInterval`**).

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
// Schedule a greeting after 2 seconds (2000ms)
const timerId = setTimeout(() => {
  console.log("Hello after 2 seconds!");
}, 2000);

// If we need to cancel it before it fires:
clearTimeout(timerId);
```

#### Fuller Example
```javascript
// Creating a countdown timer that stops automatically after 3 seconds
let secondsRemaining = 3;

// 1. Start a repeating interval
const countdownId = setInterval(function() {
  console.log(`Time remaining: ${secondsRemaining}...`);
  secondsRemaining--;

  // 2. Base case: check if countdown has finished
  if (secondsRemaining < 0) {
    console.log("Blast off!");
    
    // 3. CRITICAL: Clear the interval to prevent memory leaks and stop repetition!
    clearInterval(countdownId); 
  }
}, 1000); // repeats every 1000ms (1 second)

// 4. Passing arguments directly to a timeout callback
function greetUser(firstName, lastName) {
  console.log(`Hello, ${firstName} ${lastName}!`);
}

// Timeout accepts extra arguments and forwards them to the callback
setTimeout(greetUser, 1500, "Brendan", "Eich"); // Prints "Hello, Brendan Eich!" after 1.5s
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking the Callback Function Immediately inside the Timer

**The mistake:** Writing `setTimeout(myFunc(), 1000)` instead of `setTimeout(myFunc, 1000)`.

**Why it's wrong:** Adding parentheses `()` after the function name executes it immediately at the moment the timer is declared. The *return value* of that function (which is often `undefined`) is then passed to `setTimeout`. The timer will run, but it won't execute your code when it fires.

*Incorrect:*
```javascript
function sayHi() {
  console.log("Hi!");
}

// Executed IMMEDIATELY. Passes 'undefined' to setTimeout!
setTimeout(sayHi(), 2000); 
```

*Fix:*
```javascript
function sayHi() {
  console.log("Hi!");
}

// Pass the function reference (WITHOUT parentheses)
setTimeout(sayHi, 2000); 

// Or wrap it in an anonymous callback function
setTimeout(() => {
  sayHi();
}, 2000);
```

### Mistake 2: Losing Context Binding (`this`) in Timers Callbacks

**The mistake:** Passing methods from Timers instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "timers",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "timers",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Timers Operations

**The mistake:** Executing asynchronous operations within Timers without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/timers"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/timers");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in timers: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Debounced Input Search Handler

**Scenario:** A search autocomplete input debounces network API requests using setTimeout() and clearTimeout().

**Requirements:**
1. Write createDebouncedSearch(searchFn, delayMs).
2. Clear prior timer via clearTimeout().
3. Schedule new timer via setTimeout().
4. Return debounced function.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createDebouncedSearch(searchFn, delayMs) {
>   let timerId = null;
>
>   return function(query) {
>     if (timerId !== null) {
>       clearTimeout(timerId);
>     }
>     timerId = setTimeout(() => {
>       searchFn(query);
>       timerId = null;
>     }, delayMs);
>   };
> }
>
> // Verification tests
> let searchExecuted = false;
> globalThis.setTimeout = (fn, delay) => { fn(); return 123; };
> globalThis.clearTimeout = (id) => {};
>
> const debounced = createDebouncedSearch(() => { searchExecuted = true; }, 300);
> debounced("js");
> console.assert(searchExecuted === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **setTimeout() Purpose**: Schedules a timer to execute a callback function after specified millisecond delay.
> 2. **clearTimeout() Cancellation**: Cancels a scheduled timer before execution using its returned timer ID.
> 3. **Debounce Pattern**: Postpones execution until a specified delay passes without new function calls.
> 
---

### Exercise 2: Timers Advanced Context Handler

**Scenario:** A web application component processes timers data operations within enterprise workflows.

**Requirements:**
1. Write handleTimersSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTimersSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleTimersSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Timers Architecture**: Applying timers patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Timers Performance Optimization

**Scenario:** An application utility optimizes timers execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeTimersTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeTimersTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeTimersTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Timers Optimization**: Optimizing timers improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Macrotask Queue](../level_06/macrotask_queue.md) — The queue where timer callbacks wait to execute.
- [Event Loop](../level_06/event_loop.md) — The orchestration loop that moves timer callbacks onto the stack.
- [Date object](../level_02/date_object.md) — Related concept: Date object.

---

## 7. Key Takeaways
- Use `setTimeout(callback, delayMs)` to run a function once after a specified time delay.
- Use `setInterval(callback, intervalMs)` to run a function repeatedly at set time intervals.
- Always clear intervals using `clearInterval(timerId)` when they are no longer needed to prevent severe memory leaks.
- Timer callbacks do not execute synchronously; they are scheduled asynchronously and run after the current call stack clears.
- Timers are not high-precision clocks; execution can be delayed if the main CPU thread is blocked.
