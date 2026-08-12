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

**Browser API / DOM (Browser-only: Only exists in web browsers. .)**: Web Workers is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Offloading Heavy Processing to Dedicated Web Worker

**Scenario:** A web application offloads CPU-intensive image processing or sorting tasks to a dedicated Web Worker thread via postMessage().

**Requirements:**
1. Write executeWorkerTask(workerMock, payload).
2. Send payload via workerMock.postMessage().
3. Listen for response via onmessage.
4. Return task result promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeWorkerTask(workerMock, payload) {
>   return new Promise((resolve, reject) => {
>     workerMock.onmessage = (event) => {
>       resolve(event.data);
>     };
>     workerMock.onerror = (error) => {
>       reject(error);
>     };
>     workerMock.postMessage(payload);
>   });
> }
>
> // Verification tests
> const mockWorker = {
>   onmessage: null,
>   onerror: null,
>   postMessage(data) {
>     setTimeout(() => {
>       if (this.onmessage) this.onmessage({ data: { result: data * 2 } });
>     }, 10);
>   }
> };
>
> executeWorkerTask(mockWorker, 21).then(res => {
>   console.assert(res.result === 42, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Web Workers Concept**: Web Workers run scripts in background threads separate from the main browser execution thread.
> 2. **postMessage Communication**: Main thread and worker threads communicate via postMessage() and onmessage event handlers.
> 3. **No DOM Access**: Web Workers do NOT have access to the document DOM or window object.
> 
---

### Exercise 2: Web Workers Advanced Context Handler

**Scenario:** A web application component processes web workers data operations within enterprise workflows.

**Requirements:**
1. Write handleWebWorkersSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleWebWorkersSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleWebWorkersSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Workers Architecture**: Applying web workers patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Web Workers Performance Optimization

**Scenario:** An application utility optimizes web workers execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeWebWorkersTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeWebWorkersTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeWebWorkersTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Workers Optimization**: Optimizing web workers improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Event Loop](event_loop.md) — The engine loop which remains unblocked by offloading calculations to workers.

---

## 7. Key Takeaways
- JavaScript is single-threaded; CPU-intensive calculations block the main thread, freezing the user interface.
- Web Workers run scripts on separate, parallel operating system background threads.
- Workers communicate with the main thread using event-based message passing (`postMessage` and the `message` event).
- Data passed between threads is copied (cloned), not shared.
- Workers run in an isolated global scope; they have absolutely **no access** to the `window` or `document` objects.
