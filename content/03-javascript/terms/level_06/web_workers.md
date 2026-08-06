# Web Workers

> **Level 6 — Asynchronous JavaScript**
> Run scripts on background threads.

---

## 1. Prerequisites
- [Asynchronous](asynchronous.md) — Non-blocking code execution.
- [Call Stack](call_stack.md) — The single execution stack that tracks active function calls.
- [window object / BOM](../level_05/window_bom.md) — The browser global context.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers. (Node.js implements a similar but separate multi-threading module called `worker_threads`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is fundamentally a **single-threaded** programming language, meaning it only has one Call Stack and executes one line of code at a time on the main browser thread. The main thread is also responsible for rendering layout styles, updating layouts, and listening to user click events.

If you run a heavy CPU-intensive calculation on the main thread—such as applying a visual filter to a large image, calculating complex mathematical physics, or sorting a list of 100,000 items—the Call Stack blocks. The browser freezes, buttons become unclickable, animations stutter, and the browser eventually displays a warning saying `"Page is unresponsive"`.

To allow true parallel execution, browsers designed the **Web Workers API**. Web Workers let you spawn separate background threads running isolated scripts. 

### (2) Key Constraints
To prevent thread synchronization conflicts (like two threads editing the same text box simultaneously, creating race conditions), Workers run under strict rules:
1. **No DOM Access:** A Web Worker runs in a completely separate global scope (`self`, not `window`). It cannot read or modify the `document` object, query HTML elements, or update the webpage directly.
2. **Message Passing:** The main thread and the worker thread communicate exclusively by sending data packets back and forth. You use **`postMessage(data)`** to send messages and listen for the **`message`** event to receive data.
3. **Structured Cloning:** Data sent through `postMessage` is copied using the structured clone algorithm. You cannot pass functions or DOM nodes; you can only pass serializable structures like objects, arrays, and primitives.

### (3) Reality Metaphor
Imagine a busy restaurant kitchen.
- The **main thread** is the **head chef**. The chef is plating food, adding final decorations, and speaking to guests at the counter (handling the UI layout and clicks).
- If the head chef needs to peel 500 potatoes (heavy CPU math calculation), doing it themselves will stop all cooking and service, leaving customers waiting (page freezes).
- A **Web Worker** is like a **prep cook** working in a separate back room. The head chef sends a sack of potatoes to the back room with a note saying "peel these" (**`postMessage`**). The head chef continues cooking and plating.
- When the prep cook finishes, they send the clean potatoes back to the kitchen (**`message` event**). The prep cook has no access to the dining room or guest tables (no DOM access).

### (4) JavaScript Code Examples

#### `main.js` (Executing on the Main Thread)
```javascript
if (typeof window !== "undefined" && typeof Worker !== "undefined") {
  // 1. Create a background Web Worker instance by passing its script URL
  const fibonacciWorker = new Worker("worker.js");

  // 2. Send data to the worker thread to trigger calculations
  console.log("Main Thread: Dispatching request to worker...");
  fibonacciWorker.postMessage(40); // Requesting the 40th Fibonacci number

  // 3. Listen for the response packet returned from the worker
  fibonacciWorker.onmessage = function(event) {
    const calculationResult = event.data;
    console.log("Main Thread: Result received from worker:", calculationResult);
    
    // safe to terminate the worker thread when completely finished
    fibonacciWorker.terminate();
  };

  console.log("Main Thread: Doing other UI work, unblocked and responsive!");
}
```

#### `worker.js` (Executing on the Background Worker Thread)
```javascript
// Web Worker global scope is 'self', not 'window'. No DOM access!

function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

// 1. Listen for message packets sent from the main thread
self.onmessage = function(event) {
  const number = event.data;
  console.log("Worker Thread: Starting intensive Fibonacci calculation...");

  // 2. Perform CPU-intensive calculation without blocking the browser UI
  const result = calculateFibonacci(number);

  // 3. Return the result back to the main thread
  self.postMessage(result);
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Web Workers Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Web Workers blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "web_workers";
```

*Fix:*
```javascript
let value = "web_workers";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Web Workers Callbacks

**The mistake:** Passing methods from Web Workers instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "web_workers",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "web_workers",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Web Workers Operations

**The mistake:** Executing asynchronous operations within Web Workers without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/web_workers"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/web_workers");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in web_workers: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Worker Ping-Pong

**Problem:** Complete the worker script code to listen for a message containing `"ping"`, and immediately reply by sending a message containing `"pong"` back to the main thread.

```javascript
// worker.js:
self.onmessage = function(event) {
  const msg = event.data;
  
  if (msg === "ping") {
    // Send pong reply back
  }
};
```

> [!check]- Answer
> - Inside the if statement, call `self.postMessage("pong")`.
> 
---

### Exercise 2: Web Worker Message Passing with `postMessage`

**Problem:** Simulate sending data to a worker via `worker.postMessage({ num: 10 })`.

**Expected output:**
> [!check]- Answer
> ```text
> Message posted to worker: 10
> ```
> ```javascript
> const msg = { num: 10 };
> console.log(`Message posted to worker: ${msg.num}`);
> ```
>
> **Explanation:** `postMessage()` transfers serialized structured clone data across thread boundaries.
> 
---

### Exercise 3: Offloading Heavy CPU Tasks to Workers

**Problem:** Explain why Web Workers prevent UI freezing during heavy 10-second computations.

**Expected output:**
> [!check]- Answer
> ```text
> Offloads CPU work off main UI thread
> ```
> ```javascript
> console.log("Offloads CPU work off main UI thread");
> ```
>
> **Explanation:** Web Workers run on separate OS background threads, keeping main UI event loops responsive.
> 
> 
---

## 7. Related Terms
- [Event Loop](event_loop.md) — The engine loop which remains unblocked by offloading calculations to workers.

---

## 8. Key Takeaways
- JavaScript is single-threaded; CPU-intensive calculations block the main thread, freezing the user interface.
- Web Workers run scripts on separate, parallel operating system background threads.
- Workers communicate with the main thread using event-based message passing (`postMessage` and the `message` event).
- Data passed between threads is copied (cloned), not shared.
- Workers run in an isolated global scope; they have absolutely **no access** to the `window` or `document` objects.
