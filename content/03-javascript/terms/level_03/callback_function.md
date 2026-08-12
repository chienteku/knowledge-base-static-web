# Callback Function

> **Level 3 — Functions & Scope**
> A function passed into another function as an argument to be executed later.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Higher-Order Function](higher_order_function.md) — A function that accepts other functions as arguments.

---

## 2. Term Category

**Functional Programming / Asynchronous Programming (Universal: Works everywhere)**: Callback Function is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is heavily reliant on "events" (like a user clicking a button) and "asynchronous tasks" (like downloading data from the internet). When you tell JavaScript to download an image, you don't want the entire program to freeze and wait. You want it to keep running other code, and then *call you back* when the image is finally ready.

To achieve this, developers pass a "Callback Function" to the downloading code. It's essentially saying: "Start downloading this file. I'm going to go do other things. Here is a set of instructions (the Callback Function). When the download finishes, execute these instructions."

### (2) Reality Metaphor
A Callback Function is exactly like leaving your phone number at a busy restaurant. 
- You ask for a table (the outer function call).
- The host says it will be a 30-minute wait.
- You give the host your phone number (the **Callback Function**).
- You leave the restaurant to go shopping. When the table is ready, the host executes your instructions by calling your number (executing the callback).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function greetUser(name) {
  console.log(`Hello, ${name}!`);
}

// setTimeout is a built-in Higher-Order Function.
// 'greetUser' is the Callback Function.
// It says: "Wait 2 seconds, then execute the callback."
setTimeout(greetUser, 2000, "Alice"); 
```

#### Fuller Example
```javascript
// The generic process (Higher-Order Function)
function processPayment(amount, onSuccess, onError) {
  console.log(`Processing payment of $${amount}...`);
  
  if (amount > 0) {
    onSuccess(); // Execute the success callback
  } else {
    onError();   // Execute the error callback
  }
}

// Our specific callback functions
function handleSuccess() {
  console.log("Thank you for your purchase!");
}

function handleError() {
  console.log("Payment failed. Please check your card details.");
}

// Pass the callbacks IN to the processor
processPayment(50, handleSuccess, handleError);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Callback Function Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Callback Function blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "callback_function";
```

*Fix:*
```javascript
let value = "callback_function";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Callback Function Callbacks

**The mistake:** Passing methods from Callback Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "callback_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "callback_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Callback Function Operations

**The mistake:** Executing asynchronous operations within Callback Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/callback_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/callback_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in callback_function: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Asynchronous Task Processing Pipeline

**Scenario:** An event processing queue accepts callback functions to notify callers when background tasks complete successfully or fail.

**Requirements:**
1. Write processTaskQueue(tasks, callback).
2. Process items and collect total.
3. Invoke callback(err, total).
4. Return callback invocation result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processTaskQueue(tasks, callback) {
>   if (!Array.isArray(tasks) || tasks.length === 0) {
>     return callback(new Error("Empty task queue"), null);
>   }
>   const total = tasks.reduce((sum, t) => sum + t.cost, 0);
>   return callback(null, total);
> }
>
> // Verification tests
> let resultTotal = 0;
> processTaskQueue([{ cost: 10 }, { cost: 20 }], (err, total) => {
>   if (!err) resultTotal = total;
> });
> console.assert(resultTotal === 30, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Callback Pattern**: A callback function is passed as an argument to another function and invoked after an action completes.
> 2. **Error-First Conventions**: Standard Node.js callbacks accept error as the first argument (err, result).
> 3. **Synchronous vs Asynchronous**: Callbacks can be invoked synchronously or deferred asynchronously via microtask queues.
> 
---

### Exercise 2: Custom Array Filter Callback Engine

**Scenario:** A custom data utility implements a higher-order filter function that executes a predicate callback for every element in an array.

**Requirements:**
1. Write customFilter(array, predicateCallback).
2. Iterate array items.
3. Pass item, index, and array to predicateCallback.
4. Return filtered array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function customFilter(array, predicateCallback) {
>   const filtered = [];
>   for (let i = 0; i < array.length; i++) {
>     if (predicateCallback(array[i], i, array)) {
>       filtered.push(array[i]);
>     }
>   }
>   return filtered;
> }
>
> // Verification tests
> const numbers = [10, 15, 20, 25];
> const evens = customFilter(numbers, num => num % 2 === 0);
> console.assert(evens.join(",") === "10,20", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Higher-Order Invocations**: Higher-order functions accept callbacks and invoke them during execution.
> 2. **Predicate Callbacks**: A predicate callback returns a boolean value to decide filtering criteria.
> 3. **Parameter Passing**: Iterative callbacks typically receive element, index, and array parameters.
> 
---

### Exercise 3: Event Emitter Callback Subscriber Registry

**Scenario:** An event emitter module registers subscriber callback functions and dispatches payloads to registered callbacks when events fire.

**Requirements:**
1. Write createEventEmitter().
2. Implement on(eventName, callback) and emit(eventName, data).
3. Verify callbacks receive emitted payload.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createEventEmitter() {
>   const listeners = {};
>
>   return {
>     on(event, callback) {
>       if (!listeners[event]) listeners[event] = [];
>       listeners[event].push(callback);
>     },
>     emit(event, data) {
>       if (!listeners[event]) return;
>       for (const cb of listeners[event]) {
>         cb(data);
>       }
>     }
>   };
> }
>
> // Verification tests
> const emitter = createEventEmitter();
> let receivedData = null;
> emitter.on("userLogin", data => { receivedData = data; });
> emitter.emit("userLogin", { username: "alice" });
> console.assert(receivedData.username === "alice", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Observer Pattern**: Callbacks act as event subscribers in event-driven architectures.
> 2. **Multiple Listeners**: Iterating callback arrays triggers registered handlers sequentially.
> 3. **Memory Leak Awareness**: Unregistered callbacks retained in listener arrays prevent garbage collection.
---

## 6. Related Terms
- [Higher-Order Function](higher_order_function.md) — The function that *receives* the callback.
- [Arrow Function](arrow_function.md) — The most common syntax used to write inline callbacks.
- [First-Class Function](first_class_function.md) — Related concept: First-Class Function.
- [Event](../level_05/event.md) — Related concept: Event.
- [Callback Hell](../level_06/callback_hell.md) — Related concept: Callback Hell.

---

## 7. Key Takeaways
- A Callback Function is passed into another function as an argument.
- It delegates the responsibility of *when* the function should be executed to the receiving function.
- Callbacks are fundamental to event listeners (like button clicks) and asynchronous programming in JavaScript.
- Avoid nesting them too deeply (Callback Hell).
