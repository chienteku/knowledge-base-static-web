# Event Loop

> **Level 6 — Asynchronous JavaScript**
> The mechanism that coordinates the execution of synchronous code and asynchronous callbacks.

---

## 1. Prerequisites
- [Synchronous](./synchronous.md) / [Asynchronous](./asynchronous.md) — Blocking vs non-blocking code.
- [Call Stack](./call_stack.md) — The queue of synchronous tasks.

---

## 2. Term Category
- **Architecture Concept**

---

## 3. Environment Context
- **Universal**: Implemented in both Web Browsers and Node.js (via libuv).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Event Loop Interview Question

**Problem:** What is the output order?
```javascript
setTimeout(() => console.log("A"), 0);
Promise.resolve().then(() => console.log("B"));
console.log("C");
```
*(Hint: Promises go to a special VIP waiting room called the Microtask Queue, which the Event Loop checks before the standard Macrotask Queue).*

**Expected output:**
> [!check]- Answer
> ```text
> C (Synchronous Call Stack)
> B (Microtask Queue)
> A (Macrotask Queue)
> ```
> - Synchronous always wins.
> - Promises (Microtasks) have VIP priority over `setTimeout` (Macrotasks).

---

### Exercise 2: Event Loop Microtask vs Macrotask Execution Order

**Problem:** Trace execution order: `script start`, `setTimeout`, `Promise`, `script end`.

**Expected output:**
> [!check]- Answer
> ```text
> script start
> script end
> Promise
> setTimeout
> ```
> ```javascript
> console.log("script start");
> setTimeout(() => console.log("setTimeout"), 0);
> Promise.resolve().then(() => console.log("Promise"));
> console.log("script end");
> ```
>
> **Explanation:** Microtasks (`Promise.then`) execute immediately after current synchronous script execution before macrotasks (`setTimeout`).

---

### Exercise 3: QueueMicrotask API

**Problem:** Schedule a microtask using `queueMicrotask(() => ...)`.

**Expected output:**
> [!check]- Answer
> ```text
> Microtask executed
> ```
> ```javascript
> queueMicrotask(() => console.log("Microtask executed"));
> ```
>
> **Explanation:** `queueMicrotask()` schedules callbacks on the microtask queue explicitly.


---

## 7. Related Terms
- [Call Stack](./call_stack.md) — Where code is actually executed.
- [Microtask Queue](./microtask_queue.md) — The VIP waiting room for Promises.

---

## 8. Key Takeaways
- The Event Loop connects asynchronous background tasks back to the main thread.
- Its only job is to check if the Call Stack is empty, and if so, push the next callback from the Queue.
- Background tasks (like Timers) are actually handled by the Browser/Node.js C++ APIs, not by the JavaScript engine itself.
- Synchronous code will always finish before any asynchronous callback is allowed to run.
