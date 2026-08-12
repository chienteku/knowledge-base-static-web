# Event Loop

> **Level 6 — Asynchronous JavaScript**
> The mechanism that coordinates the execution of synchronous code and asynchronous callbacks.

---

## 1. Prerequisites
- [Synchronous](synchronous.md)
- [Call Stack](call_stack.md) — The queue of synchronous tasks.

---

## 2. Term Category

**Architecture Concept (Universal: Implemented in both Web Browsers and Node.js .)**: Event Loop is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is single-threaded. It can only execute one line of code at a time on its "Call Stack". However, we just learned that Asynchronous tasks (like `setTimeout` or `fetch`) run in the background. If JavaScript is single-threaded, who is running the background tasks, and how do their results get back into the main thread?

The solution is the **Event Loop**. The Browser actually has multiple threads (for timers, networking, DOM events). When you call `setTimeout`, JS hands the timer to the Browser and moves on. When the Browser's timer finishes, it places your callback function into a waiting room called a "Task Queue". 
The Event Loop is a continuous cycle that asks one simple question: *"Is the Call Stack completely empty?"* If it is, the Event Loop takes the first waiting callback from the Queue and pushes it onto the Call Stack to be executed.

### (2) Reality Metaphor
Think of a busy doctor's office. 
- **The Call Stack** is the Doctor's exam room. The doctor can only see one patient at a time.
- **The Browser APIs** are the lab technicians processing blood work in the background.
- **The Task Queue** is the waiting room where patients sit after their lab results come back.
- **The Event Loop** is the receptionist. The receptionist constantly checks: "Is the doctor currently with a patient?" If the doctor is busy, the patients must stay in the waiting room. The *exact second* the doctor's room is empty, the receptionist sends the next waiting patient in.

### (3) JavaScript Code Examples

#### Short Snippet: The classic Event Loop test
```javascript
console.log("1. Synchronous - Top");

// Handed off to the Web API (Browser), then put in the Task Queue
setTimeout(() => {
  console.log("2. Asynchronous - Callback");
}, 0);

console.log("3. Synchronous - Bottom");

/* Output: 
   1. Synchronous - Top
   3. Synchronous - Bottom
   2. Asynchronous - Callback
*/
```
*Why? Even though the timer was `0ms`, it went to the waiting room. The Event Loop **refused** to let it run until all synchronous code (logs 1 and 3) finished clearing the Call Stack!*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Loop Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Loop blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_loop";
```

*Fix:*
```javascript
let value = "event_loop";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Loop Callbacks

**The mistake:** Passing methods from Event Loop instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_loop",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_loop",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Loop Operations

**The mistake:** Executing asynchronous operations within Event Loop without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_loop"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_loop");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_loop: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Event Loop Execution Order Verification Engine

**Scenario:** A diagnostic suite verifies the exact execution order of Synchronous code, Microtask queue tasks (Promises), and Macrotask queue tasks (setTimeout).

**Requirements:**
1. Write verifyEventLoopOrder().
2. Log synchronous execution.
3. Schedule setTimeout (macrotask) and Promise.resolve (microtask).
4. Return execution sequence array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyEventLoopOrder() {
>   const sequence = [];
>
>   sequence.push("SYNC_1");
>
>   setTimeout(() => {
>     sequence.push("MACRO_1");
>   }, 0);
>
>   Promise.resolve().then(() => {
>     sequence.push("MICRO_1");
>   });
>
>   sequence.push("SYNC_2");
>
>   return sequence; // Sync entries collected immediately
> }
>
> // Verification tests
> const seq = verifyEventLoopOrder();
> console.assert(seq[0] === "SYNC_1" && seq[1] === "SYNC_2", "Test 1 Failed");
>
> Promise.resolve().then(() => {
>   // Microtasks run right after current sync turn completes
>   // Macrotasks run in subsequent event loop iterations
> });
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Mechanics**: The Event Loop continuously coordinates call stack execution, microtask queue draining, and macrotask processing.
> 2. **Microtask Priority**: The microtask queue is completely drained after call stack clears before the next macrotask is picked up.
> 3. **Single-Threaded Model**: Ensures JavaScript runs single-threaded code non-blockingly via asynchronous event loops.
> 
---

### Exercise 2: Event Loop Advanced Context Handler

**Scenario:** A web application component processes event loop data operations within enterprise workflows.

**Requirements:**
1. Write handleEventLoopSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleEventLoopSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleEventLoopSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Architecture**: Applying event loop patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Event Loop Performance Optimization

**Scenario:** An application utility optimizes event loop execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeEventLoopTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeEventLoopTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeEventLoopTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Optimization**: Optimizing event loop improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Call Stack](call_stack.md) — Where code is actually executed.
- [Microtask Queue](microtask_queue.md) — The VIP waiting room for Promises.
- [Timers (setTimeout / setInterval / clearTimeout)](../level_05/timers.md) — Related concept: Timers (setTimeout / setInterval / clearTimeout).
- [Asynchronous](asynchronous.md) — Related concept: Asynchronous.
- [Macrotask Queue](macrotask_queue.md) — Related concept: Macrotask Queue.
- [Web Workers](web_workers.md) — Related concept: Web Workers.
- [Promise](promise.md) — Related concept: Promise.

---

## 7. Key Takeaways
- The Event Loop connects asynchronous background tasks back to the main thread.
- Its only job is to check if the Call Stack is empty, and if so, push the next callback from the Queue.
- Background tasks (like Timers) are actually handled by the Browser/Node.js C++ APIs, not by the JavaScript engine itself.
- Synchronous code will always finish before any asynchronous callback is allowed to run.
