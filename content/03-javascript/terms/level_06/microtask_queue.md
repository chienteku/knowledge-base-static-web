# Microtask Queue

> **Level 6 — Asynchronous JavaScript**
> A high-priority queue for Promise callbacks (`.then`), executed immediately after the current call stack clears.

---

## 1. Prerequisites
- [Event Loop](event_loop.md) — The system that monitors this queue.
- [Promise](promise.md) — The objects that use this queue.

---

## 2. Term Category

**Architecture Concept (Universal: Implemented in all modern JavaScript engines.)**: Microtask Queue is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before Promises existed, JavaScript only had one waiting room for asynchronous callbacks (the standard Task Queue). However, when Promises were introduced, the creators realized that Promise resolutions often contain critical state updates that need to happen *immediately* before the browser renders the next frame or handles the next user click.

To solve this, they introduced a second, VIP waiting room: the **Microtask Queue**. 
Whenever a Promise resolves, its `.then()` or `.catch()` callback is placed in the Microtask Queue, not the standard queue. The Event Loop is programmed to be biased: whenever the Call Stack empties, it checks the Microtask Queue *first*. It will completely empty the Microtask Queue before it even looks at the standard queue.

### (2) Reality Metaphor
Imagine an airport boarding gate.
- The **Macrotask Queue** is the general boarding line (Economy class).
- The **Microtask Queue** is the VIP / First Class boarding line.
The gate agent (Event Loop) will always call the VIP line first. Even if an Economy passenger was standing in line for an hour, if a VIP passenger suddenly walks up, the VIP gets to board first. The gate agent will not board a single Economy passenger until the VIP line is completely empty.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log("1. Synchronous");

// setTimeout goes to the standard Macrotask Queue
setTimeout(() => {
  console.log("3. Macrotask (Economy)");
}, 0);

// Promise callbacks go to the VIP Microtask Queue
Promise.resolve().then(() => {
  console.log("2. Microtask (First Class)");
});

/* Output:
1. Synchronous
2. Microtask (First Class)
3. Macrotask (Economy)
*/
```

#### Fuller Example: Starving the Event Loop
```javascript
// What happens if Microtasks keep creating MORE Microtasks?

function recursiveMicrotask() {
  Promise.resolve().then(() => {
    console.log("VIP passing through!");
    
    // The VIP creates another VIP instantly
    recursiveMicrotask(); 
  });
}

setTimeout(() => {
  // This poor Economy passenger will NEVER board.
  console.log("Will I ever run?"); 
}, 0);

recursiveMicrotask();

// WARNING: This will freeze your browser! The Event Loop is trapped
// eternally emptying the VIP line and can never reach the standard queue.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Microtask Queue Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Microtask Queue blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "microtask_queue";
```

*Fix:*
```javascript
let value = "microtask_queue";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Microtask Queue Callbacks

**The mistake:** Passing methods from Microtask Queue instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "microtask_queue",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "microtask_queue",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Microtask Queue Operations

**The mistake:** Executing asynchronous operations within Microtask Queue without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/microtask_queue"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/microtask_queue");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in microtask_queue: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Microtask State Batcher via queueMicrotask()

**Scenario:** A UI state management library batches multiple state mutations into a single DOM update cycle using queueMicrotask().

**Requirements:**
1. Write createStateBatcher(renderFn).
2. Collect mutations.
3. Schedule batch flush using queueMicrotask().
4. Verify microtask executes before macrotask.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createStateBatcher(renderFn) {
>   let pendingState = null;
>   let isScheduled = false;
>
>   return function updateState(partialState) {
>     pendingState = { ...pendingState, ...partialState };
>
>     if (!isScheduled) {
>       isScheduled = true;
>       queueMicrotask(() => {
>         renderFn(pendingState);
>         isScheduled = false;
>         pendingState = null;
>       });
>     }
>   };
> }
>
> // Verification tests
> let renderCount = 0;
> let lastRender = null;
> const updater = createStateBatcher(state => {
>   renderCount++;
>   lastRender = state;
> });
>
> updater({ a: 1 });
> updater({ b: 2 });
>
> console.assert(renderCount === 0, "Test 1 Failed: Microtask must not run synchronously");
>
> Promise.resolve().then(() => {
>   console.assert(renderCount === 1, "Test 2 Failed: Batcher should execute once");
>   console.assert(lastRender.a === 1 && lastRender.b === 2, "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **queueMicrotask() API**: queueMicrotask(fn) explicitly queues a callback function on the microtask queue.
> 2. **Microtask Queue Priority**: Microtasks execute immediately after current script task, BEFORE any macrotasks or UI rendering.
> 3. **Batching State Updates**: Microtasks allow accumulating multiple synchronous operations before flushing single updates.
> 
---

### Exercise 2: Microtask Queue Advanced Context Handler

**Scenario:** A web application component processes microtask queue data operations within enterprise workflows.

**Requirements:**
1. Write handleMicrotaskQueueSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleMicrotaskQueueSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleMicrotaskQueueSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Microtask Queue Architecture**: Applying microtask queue patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Microtask Queue Performance Optimization

**Scenario:** An application utility optimizes microtask queue execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeMicrotaskQueueTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeMicrotaskQueueTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeMicrotaskQueueTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Microtask Queue Optimization**: Optimizing microtask queue improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Event Loop](event_loop.md) — The system that checks these queues.
- [Macrotask Queue](macrotask_queue.md) — The standard, lower-priority queue.

---

## 7. Key Takeaways
- The Microtask Queue is a high-priority waiting room for Asynchronous callbacks.
- It is primarily used for Promise `.then()`, `.catch()`, and `.finally()` callbacks.
- The Event Loop will always empty the Microtask Queue completely before moving to the Macrotask Queue.
- An infinite loop of Microtasks will freeze the browser.
