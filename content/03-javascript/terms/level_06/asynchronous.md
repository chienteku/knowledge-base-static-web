# Asynchronous

> **Level 6 — Asynchronous JavaScript**
> Execution of code without blocking the main thread, allowing other operations to continue.

---

## 1. Prerequisites
- [Synchronous](synchronous.md) — Execution that blocks the thread.
- [Callback Function](../level_03/callback_function.md) — Passing a function to be run later.

---

## 2. Term Category
- **Computer Science Concept**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because JavaScript is single-threaded (it only has one worker), synchronous code can be dangerous. If a website needs to download a 5MB image from a database, a synchronous request would freeze the entire website until the download finished. The user couldn't scroll or click anything for several seconds.

To fix this, JavaScript relies heavily on "Asynchronous" programming. When JS encounters a time-consuming task (like downloading a file, or waiting for a timer), it hands that task off to the Browser (or Node.js environment) and says: "You handle this in the background. I'm going to keep running the rest of the code. Let me know when you're done." This ensures the website never freezes.

### (2) Reality Metaphor
Asynchronous execution is like a modern restaurant kitchen.
You (JavaScript) take an order from Table 1 for a well-done steak. You hand the ticket to the grill cook (the Browser) and say, "Start cooking this, it will take 20 minutes." 
You do *not* stand in the kitchen staring at the grill for 20 minutes (Synchronous). Instead, you immediately walk back to the dining room and take orders from Table 2 and Table 3. When the grill cook is finally done, they ring a bell (Callback), and you deliver the steak.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log("1. Taking order for Table 1");

// setTimeout is a built-in Asynchronous function!
setTimeout(() => {
  console.log("3. Table 1's steak is finally ready!");
}, 2000); // Wait 2 seconds in the background

console.log("2. Taking order for Table 2");

/* Output order:
1. Taking order for Table 1
2. Taking order for Table 2
(Wait 2 seconds...)
3. Table 1's steak is finally ready!
*/
```

#### Fuller Example: Fake Network Request
```javascript
console.log("Starting App...");

// A generic asynchronous function using a callback
function downloadData(callback) {
  console.log("Requesting data from server...");
  
  // We simulate a network delay of 3 seconds
  setTimeout(() => {
    const data = { user: "Alice", id: 99 };
    callback(data); // Deliver the data when ready!
  }, 3000);
}

// We call the async function
downloadData((result) => {
  console.log("Data Received: ", result.user);
});

// This prints IMMEDIATELY, proving the app didn't freeze!
console.log("User can still click buttons while downloading!");
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to return a value synchronously from an async function

**The mistake:** Attempting to assign the result of an asynchronous operation directly to a variable using `=`.

**Why it's wrong:** Because the async task runs in the background, it takes time. The JavaScript engine moves to the next line immediately before the data is ready. If you try to return it normally, you will get `undefined`.

*Incorrect:*
```javascript
function fetchUser() {
  setTimeout(() => { return "Alice"; }, 1000);
}

// This will be undefined, because fetchUser returns instantly!
const myUser = fetchUser(); 
console.log(myUser); // undefined
```

*Fix:*
```javascript
// You MUST use Callbacks, Promises, or Async/Await to handle the future data!
function fetchUser(callback) {
  setTimeout(() => { callback("Alice"); }, 1000);
}

fetchUser((name) => console.log(name)); // "Alice"
```

---

### Mistake 2: Losing Context Binding (`this`) in Asynchronous Callbacks

**The mistake:** Passing methods from Asynchronous instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "asynchronous",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "asynchronous",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Asynchronous Operations

**The mistake:** Executing asynchronous operations within Asynchronous without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/asynchronous"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/asynchronous");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in asynchronous: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The 0 Millisecond Delay

**Problem:** Predict the exact output order of this code. Notice the delay is `0` milliseconds!
```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
```

**Expected output:**
> [!check]- Answer
> ```text
> A
> C
> B
> ```
> - Even with a 0ms delay, `setTimeout` pushes the callback to the background. JavaScript *always* finishes its current synchronous tasks before checking on background async tasks!
> 
---

### Exercise 2: Non-Blocking Async Trace

**Problem:** Trace output sequence of `console.log("1"); setTimeout(() => console.log("2"), 0); console.log("3");`.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> 3
> 2
> ```
> ```javascript
> console.log("1");
> setTimeout(() => console.log("2"), 0);
> console.log("3");
> ```
>
> **Explanation:** `setTimeout` yields execution to the event loop macrotask queue, running after synchronous code finishes.
> 
---

### Exercise 3: Async Callback Delegation

**Problem:** Demonstrate delegating a delayed computation using `setTimeout`.

**Expected output:**
> [!check]- Answer
> ```text
> Async computation finished
> ```
> ```javascript
> function computeAsync(cb) {
>   setTimeout(() => cb("Async computation finished"), 10);
> }
> computeAsync(res => console.log(res));
> ```
>
> **Explanation:** Asynchronous functions execute callbacks out-of-band without blocking main execution lines.
> 
> 
---

## 7. Related Terms
- [Event Loop](event_loop.md) — The system that coordinates async tasks.
- [Promise](promise.md) — The modern way to handle async data.
- [Synchronous](synchronous.md) — Related concept: Synchronous.

---

## 8. Key Takeaways
- Asynchronous code runs in the background and does not block the main thread.
- It is crucial for network requests, timers, and file reading.
- You cannot capture async results using a standard `return` statement; you must use Callbacks, Promises, or `async`/`await`.
