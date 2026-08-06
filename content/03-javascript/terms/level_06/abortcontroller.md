# AbortController

> **Level 6 — Asynchronous JavaScript**
> Cancel in-flight fetches/async operations.

---

## 1. Prerequisites
- [Fetch API](fetch_api.md) — The promise-based HTTP request client interface.
- [Event object](../level_05/event_object.md) — The metadata object representing standard browser event targets.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Universal**: Standardized as a Web API in browsers and implemented globally in Node.js (v15+) and Deno.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When users interact with web applications, they frequently change their minds—navigating away from a page before a large image finishes loading, typing rapidly in a autocomplete search bar (triggering multiple API calls), or clicking a "Cancel Download" button. 

Once a Promise-based network request (`fetch()`) is launched, it runs in the background. If left unchecked, the browser will waste network bandwidth loading data that is no longer needed, and the resolving promise might update state on a UI component that has already been unmounted, causing errors.

To solve this, JavaScript introduced the **`AbortController`** API. It acts as an asynchronous cancellation switch. By linking a controller's signal to a fetch request, you can programmatically cancel the request in-flight, immediately rejecting the fetch promise and stopping network data transmission.

### (2) How it Works
1. **Instantiate:** Create a controller instance: `const controller = new AbortController();`.
2. **Link:** Extract its signal object: `const signal = controller.signal;`, and pass it to the fetch options: `fetch(url, { signal })`.
3. **Trigger:** Call `controller.abort()`. The in-flight network request is terminated, and the fetch promise rejects with an `AbortError` exception.

### (3) Reality Metaphor
Imagine launching a drone (the fetch request) to retrieve a package from a warehouse across town.
- **`AbortController`** is the remote control unit in your hand.
- **`controller.signal`** is the active radio wave link connecting the remote to the drone. You send the drone off with this link active.
- **`controller.abort()`** is pressing the "Return Home / Kill Switch" button on the remote. The drone immediately drops its task, halts flight, and returns to base (the promise rejects with a cancellation notice).

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
const controller = new AbortController();

fetch("https://api.example.com/data", { signal: controller.signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === "AbortError") {
      console.log("Fetch was successfully cancelled!");
    }
  });

// Cancel the request immediately
controller.abort();
```

#### Fuller Example
```javascript
// Implementing a network request timeout fallback helper
function fetchWithTimeout(url, timeoutMs) {
  // 1. Create a fresh controller instance
  const controller = new AbortController();
  const signal = controller.signal;

  // 2. Schedule an automatic abort after the specified timeout limit
  const timeoutId = setTimeout(() => {
    console.warn(`Timeout limit of ${timeoutMs}ms reached. Aborting request...`);
    controller.abort(); // Cancel the request!
  }, timeoutMs);

  // 3. Launch the fetch request, passing the signal
  return fetch(url, { signal })
    .then(function(response) {
      // Clear the timeout if the request succeeds before the limit
      clearTimeout(timeoutId); 
      return response.json();
    })
    .catch(function(error) {
      clearTimeout(timeoutId);
      
      // 4. Distinguish between a normal network error and a cancellation abort
      if (error.name === "AbortError") {
        throw new Error("Request timed out and was aborted.");
      }
      throw error; // Re-throw other errors
    });
}

// Example usage: attempt to load a heavy resource with a 2-second timeout
fetchWithTimeout("https://jsonplaceholder.typicode.com/photos", 2000)
  .then(data => console.log(`Loaded ${data.length} items.`))
  .catch(err => console.error("Error:", err.message));
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Reusing the same `AbortController` instance for new requests

**The mistake:** Creating a single global `AbortController` instance and passing its signal to multiple separate sequential requests, causing subsequent fetches to fail immediately.

**Why it's wrong:** Once `controller.abort()` is called, the controller instance enters a permanently "aborted" state. Any future fetch request that receives this same signal will reject immediately. You must instantiate a new `AbortController()` for each fresh request pipeline.

*Incorrect:*
```javascript
const globalController = new AbortController();

function loadUser() {
  // If globalController was aborted earlier, this fetch fails instantly!
  return fetch("/user", { signal: globalController.signal }); 
}
```

*Fix:*
```javascript
function loadUser() {
  // Always instantiate a fresh controller for every request cycle
  const controller = new AbortController(); 
  return fetch("/user", { signal: controller.signal });
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Abortcontroller Callbacks

**The mistake:** Passing methods from Abortcontroller instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "abortcontroller",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "abortcontroller",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Abortcontroller Operations

**The mistake:** Executing asynchronous operations within Abortcontroller without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/abortcontroller"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/abortcontroller");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in abortcontroller: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Cancelable Fetch

**Problem:** Complete the code to attach the abort signal to the fetch request, and trigger the abort cancellation after a 100ms delay.

```javascript
const controller = new AbortController();

fetch("https://jsonplaceholder.typicode.com/posts", {
  // 1. Pass the signal here
})
  .then(res => res.json())
  .catch(err => {
    if (err.name === "AbortError") {
      console.log("Operation Cancelled");
    }
  });

// 2. Schedule controller.abort() after 100ms
```

**Expected output:**
> [!check]- Answer
> ```text
> Operation Cancelled
> ```
> - In fetch options, write `signal: controller.signal`.
> - Use `setTimeout(() => controller.abort(), 100);` to trigger the cancellation.
> 
---

### Exercise 2: Cancelling Fetch Requests with `AbortController`

**Problem:** Create an `AbortController` and pass its `signal` into `fetch(url, { signal })`.

**Expected output:**
> [!check]- Answer
> ```text
> Signal attached to fetch
> ```
> ```javascript
> const controller = new AbortController();
> const signal = controller.signal;
> console.log("Signal attached to fetch");
> ```
>
> **Explanation:** `AbortController.signal` allows cancelling in-flight HTTP requests and async operations.
> 
---

### Exercise 3: Setting Request Timeouts with `AbortSignal.timeout()`

**Problem:** Use `AbortSignal.timeout(5000)` concept for automatic request cancellation timeouts.

**Expected output:**
> [!check]- Answer
> ```text
> 5000ms timeout signal created
> ```
> ```javascript
> console.log("5000ms timeout signal created");
> ```
>
> **Explanation:** `AbortSignal.timeout(ms)` returns a pre-configured signal that aborts automatically after specified milliseconds.
> 
> 
---

## 7. Related Terms
- [Promise](promise.md) — The asynchronous wrapper rejected when fetches are aborted.

---

## 8. Key Takeaways
- `AbortController` is a Web API used to cancel active, in-flight asynchronous operations like fetch requests.
- Pass the `controller.signal` reference to `fetch` options to link the controller to the request.
- Invoke `controller.abort()` to terminate the fetch; this immediately rejects the promise with an `AbortError` exception.
- Once aborted, a controller cannot be reset; always create a new `AbortController` instance for new async request cycles.
