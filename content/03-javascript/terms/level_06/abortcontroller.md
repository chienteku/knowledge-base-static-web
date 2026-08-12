# AbortController

> **Level 6 — Asynchronous JavaScript**
> Cancel in-flight fetches/async operations.

---

## 1. Prerequisites
- [Fetch API](fetch_api.md) — The promise-based HTTP request client interface.
- [Event object](../level_05/event_object.md) — The metadata object representing standard browser event targets.

---

## 2. Term Category

**Browser API / DOM (Universal: Standardized as a Web API in browsers and implemented globally in Node.js  and Deno.)**: AbortController is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Cancel Stale Search Fetch Requests via AbortController

**Scenario:** A search autocomplete UI component cancels in-flight HTTP requests when a user types new input, preventing stale API responses from overwriting fresh results.

**Requirements:**
1. Write createSearchFetcher().
2. Instantiate AbortController and pass controller.signal to fetch.
3. Abort previous in-flight request when new query arrives.
4. Return current response data.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createSearchFetcher(mockFetchFn) {
>   let currentController = null;
>
>   return async function search(query) {
>     if (currentController) {
>       currentController.abort("New query initiated");
>     }
>
>     currentController = new AbortController();
>     const signal = currentController.signal;
>
>     try {
>       const result = await mockFetchFn(query, { signal });
>       return result;
>     } catch (err) {
>       if (err.name === "AbortError") {
>         return { aborted: true };
>       }
>       throw err;
>     }
>   };
> }
>
> // Verification tests
> const mockFetch = (q, opts) => new Promise((resolve, reject) => {
>   if (opts.signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
>   opts.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
>   setTimeout(() => resolve({ query: q }), 50);
> });
>
> const doSearch = createSearchFetcher(mockFetch);
> const p1 = doSearch("js");
> const p2 = doSearch("javascript");
>
> Promise.all([p1, p2]).then(([r1, r2]) => {
>   console.assert(r1.aborted === true, "Test 1 Failed: First request should be aborted");
>   console.assert(r2.query === "javascript", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **AbortController Concept**: AbortController provides an AbortSignal instance used to communicate cancellation signals to asynchronous tasks.
> 2. **signal Parameter**: Passing signal into fetch() or async operations allows listening for the 'abort' event.
> 3. **AbortError Exception**: Aborted async tasks reject with a DOMException named 'AbortError'.
> 
---

### Exercise 2: Network Timeout Guard via AbortSignal.timeout()

**Scenario:** An API gateway client enforces a strict request timeout, automatically aborting HTTP requests if the server fails to respond within 200ms.

**Requirements:**
1. Write fetchWithTimeout(mockFetchFn, timeoutMs).
2. Use AbortSignal.timeout(timeoutMs) to create timeout signal.
3. Pass signal to fetch.
4. Return response or handle AbortError.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWithTimeout(mockFetchFn, timeoutMs) {
>   const signal = AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : (() => {
>     const controller = new AbortController();
>     setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);
>     return controller.signal;
>   })();
>
>   try {
>     return await mockFetchFn({ signal });
>   } catch (err) {
>     if (err.name === "TimeoutError" || err.name === "AbortError") {
>       return { timedOut: true };
>     }
>     throw err;
>   }
> }
>
> // Verification tests
> const slowFetch = (opts) => new Promise((res, rej) => {
>   opts.signal.addEventListener("abort", () => rej(new DOMException("Timeout", "TimeoutError")));
> });
>
> fetchWithTimeout(slowFetch, 10).then(res => {
>   console.assert(res.timedOut === true, "Test 1 Failed: Request should time out");
> });
> ```
>
> #### Technical Explanation
>
> 1. **AbortSignal.timeout() API**: Modern standard AbortSignal.timeout(ms) creates an AbortSignal that automatically aborts after a millisecond delay.
> 2. **Timeout Error Handling**: Requests timed out by AbortSignal.timeout() reject with a TimeoutError DOMException.
> 3. **Resource Cleanup**: Automatically releases underlying network sockets and resources upon signal emission.
> 
---

### Exercise 3: Multi-Request Batch Cancellation via Shared AbortSignal

**Scenario:** A batch file uploader creates a single parent AbortController and shares its signal across multiple parallel fetch upload operations, enabling one-click batch cancellation.

**Requirements:**
1. Write uploadBatch(urls, mockFetchFn).
2. Create single parent AbortController.
3. Pass controller.signal to all fetch calls.
4. Provide cancelAll() method calling controller.abort().

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBatchUploader(mockFetchFn) {
>   const controller = new AbortController();
>
>   const upload = async (urls) => {
>     const promises = urls.map(url => mockFetchFn(url, { signal: controller.signal }));
>     return Promise.allSettled(promises);
>   };
>
>   return {
>     upload,
>     cancelAll: (reason) => controller.abort(reason)
>   };
> }
>
> // Verification tests
> const mockFetch = (url, opts) => new Promise((res, rej) => {
>   opts.signal.addEventListener("abort", () => rej(new DOMException("Aborted batch", "AbortError")));
> });
>
> const uploader = createBatchUploader(mockFetch);
> const p = uploader.upload(["/url1", "/url2"]);
> uploader.cancelAll();
>
> p.then(results => {
>   console.assert(results.every(r => r.status === "rejected"), "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Shared AbortSignal**: A single AbortSignal instance can be passed to multiple concurrent fetch operations.
> 2. **Batch Cancellation**: Calling controller.abort() triggers cancellation across all tasks listening to that signal simultaneously.
> 3. **Promise.allSettled Integration**: Using Promise.allSettled captures individual cancellation statuses cleanly.
> 
---

## 6. Related Terms
- [Promise](promise.md) — The asynchronous wrapper rejected when fetches are aborted.

---

## 7. Key Takeaways
- `AbortController` is a Web API used to cancel active, in-flight asynchronous operations like fetch requests.
- Pass the `controller.signal` reference to `fetch` options to link the controller to the request.
- Invoke `controller.abort()` to terminate the fetch; this immediately rejects the promise with an `AbortError` exception.
- Once aborted, a controller cannot be reset; always create a new `AbortController` instance for new async request cycles.
