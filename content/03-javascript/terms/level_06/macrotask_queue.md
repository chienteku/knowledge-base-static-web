# Macrotask Queue

> **Level 6 — Asynchronous JavaScript**
> A lower-priority queue for API callbacks like `setTimeout` and `setInterval`.

---

## 1. Prerequisites
- [Event Loop](./event_loop.md) — The system that coordinates these queues.
- [Microtask Queue](./microtask_queue.md) — The high-priority queue.

---

## 2. Term Category
- **Architecture Concept**

---

## 3. Environment Context
- **Universal**: Implemented in all modern JavaScript engines.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When the browser or Node.js finishes a background task (like counting down a timer, or receiving a user's mouse click), it needs a place to hold the callback function until the main JavaScript thread is ready to run it. 

The **Macrotask Queue** (often just called the "Task Queue" or "Message Queue") is the original, default waiting room for these callbacks. Every time the Event Loop completes a full cycle, it is allowed to take exactly *one* task from the Macrotask Queue and run it. After running that one task, the Event Loop stops to check if the browser needs to repaint the screen, and then checks the VIP Microtask Queue before it is allowed to take another Macrotask.

### (2) Reality Metaphor
If the Microtask Queue is the VIP line at an airport, the Macrotask Queue is the standard Economy line. 
The gate agent (Event Loop) will process the Economy line, but they only process *one* Economy passenger at a time. After boarding that one passenger, the agent pauses, checks if the airplane needs maintenance (Browser Repaint), checks if any new VIPs arrived (Microtasks), and only then boards the next Economy passenger.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This timer callback goes to the Macrotask Queue
setTimeout(() => {
  console.log("Macrotask 1");
}, 0);

// This timer callback ALSO goes to the Macrotask Queue, behind the first one
setTimeout(() => {
  console.log("Macrotask 2");
}, 0);

// The Event Loop will run Macrotask 1, pause, check for Microtasks, then run Macrotask 2.
```

#### Fuller Example: The Render Cycle
```javascript
// Why is the Macrotask queue lower priority?
// Because it gives the browser a chance to update the screen!

const box = document.getElementById("box");

function animate() {
  // We change the box color
  box.style.backgroundColor = "red";
  
  // We schedule a Macrotask to change it back
  setTimeout(() => {
    box.style.backgroundColor = "blue";
  }, 0);
  
  // What happens?
  // 1. JS finishes synchronous code (color is red).
  // 2. Event loop pauses. Browser SEES the red color and paints the screen.
  // 3. Event loop takes the next Macrotask.
  // 4. Color changes to blue.
  
  // If we used a Promise (Microtask) instead, the browser would NOT have time
  // to paint the red color. It would instantly switch to blue!
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Macrotask Queue Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Macrotask Queue blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "macrotask_queue";
```

*Fix:*
```javascript
let value = "macrotask_queue";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Macrotask Queue Callbacks

**The mistake:** Passing methods from Macrotask Queue instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "macrotask_queue",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "macrotask_queue",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Macrotask Queue Operations

**The mistake:** Executing asynchronous operations within Macrotask Queue without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/macrotask_queue"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/macrotask_queue");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in macrotask_queue: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: One at a time

**Problem:** True or False: When the Event Loop checks the Macrotask Queue, it will pull *all* waiting callbacks out and run them back-to-back before doing anything else.

**Expected output:**
> [!check]- Answer
> ```text
> False. 
> The Event Loop takes exactly ONE callback from the Macrotask Queue per cycle, allowing the browser to render the screen in between tasks. (Unlike the Microtask Queue, which is emptied completely).
> ```
> - Remember the Economy passenger metaphor. One at a time!

---

### Exercise 2: Identifying Macrotask APIs

**Problem:** Name 3 Web API macrotask sources (`setTimeout`, `setInterval`, `setImmediate` / `MessageChannel`).

**Expected output:**
> [!check]- Answer
> ```text
> setTimeout, setInterval, setImmediate
> ```
> ```javascript
> console.log("setTimeout, setInterval, setImmediate");
> ```
>
> **Explanation:** Timers, I/O callbacks, and `setImmediate` schedule jobs onto the macrotask queue.

---

### Exercise 3: Macrotask Execution Lifecycle

**Problem:** Trace macrotask execution: JS engine executes 1 macrotask, drains all microtasks, then renders UI.

**Expected output:**
> [!check]- Answer
> ```text
> 1 macrotask -> Drain Microtasks -> UI Render
> ```
> ```javascript
> console.log("1 macrotask -> Drain Microtasks -> UI Render");
> ```
>
> **Explanation:** Each event loop iteration pops 1 macrotask, completely drains microtasks, and performs browser layout rendering.


---

## 7. Related Terms
- [Microtask Queue](./microtask_queue.md) — The VIP queue that always cuts in front of Macrotasks.
- [Event Loop](./event_loop.md) — The system that manages this queue.

---

## 8. Key Takeaways
- The Macrotask Queue handles callbacks for `setTimeout`, `setInterval`, DOM events, and some APIs.
- It is lower priority than the Microtask Queue.
- The Event Loop processes only *one* Macrotask per cycle.
- Processing tasks one-by-one allows the browser to weave in UI rendering and painting between tasks, keeping the page smooth.
