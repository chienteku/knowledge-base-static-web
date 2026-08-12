# AbortController / Cancellation

> **Level 5 — Fetching Data (Client-Side)**
> Canceling an in-flight `fetch`.

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — The network request handler.
- [Promises (in the context of networks)](promises.md) — The asynchronous response objects.

---

## 2. Term Category

**Browser API / Networking (Universal: Supported in modern web browsers and Node.js .)**: AbortController / Cancellation is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In client-side applications, there are scenarios where a network request is started but its response is no longer needed:
- **Autocomplete Inputs:** As a user types into a search bar, every keystroke fires a new API fetch query. If they type quickly, multiple requests run concurrently. If an earlier request finishes *after* the latest request, the UI will display stale results. This is a **race condition**.
- **Page Navigation:** A user clicks a link to load a dashboard, triggering a large data fetch. Before it completes, the user clicks back to the homepage. Leaving the dashboard fetch running wastes server resources and client bandwidth.

To allow developers to cancel active requests programmatically, the web standard designed the **`AbortController`** API:
- It acts as a switch to terminate one or more web requests.
- When aborted, the browser immediately stops the request and rejects the associated fetch promise with an `AbortError`.

---

### (2) How it Works (The Signal Link)
The controller uses a two-part binding mechanism:
1. **The Controller:** Holds the `.abort()` trigger method.
2. **The Signal:** A read-only observer token (`controller.signal`) passed to the fetch request options.

```text
  [ AbortController ] ──( Holds .abort() )
         │
    (Provides Signal)
         ▼
  [ fetch(url, { signal }) ] ──( Listens to abort event )
```

---

### (3) Reality Metaphor
Imagine sending a **warehouse robot** to retrieve a heavy box from a far-off storage aisle.
- **Without Cancellation:** If you realize you ordered the wrong item, you cannot stop the robot. It walks all the way to the back, fetches the box, walks back, and puts it on your desk. Only then can you throw it in the trash.
- **With AbortController:** You hand the robot a **wireless radio receiver (the `signal`)** before it leaves, while you hold the **remote control (the `controller`)**. If you change your mind, you push the red button (**`controller.abort()`**). The robot stops in its tracks, drops the item immediately, and returns to standby, saving power and time.

---

### (4) JavaScript Code Example: Preventing Autocomplete Race Conditions

Every time a user types, we abort the previous pending fetch request before launching a new one:

```javascript
let activeController = null;

async function handleSearchInput(event) {
  const searchTerm = event.target.value;
  
  // 1. If a previous request is still in-flight, cancel it
  if (activeController) {
    activeController.abort();
    console.log("Stale search aborted!");
  }
  
  // 2. Create a fresh controller for the new request
  activeController = new AbortController();
  const { signal } = activeController;
  
  try {
    const res = await fetch(`/api/search?q=${searchTerm}`, { signal });
    const results = await res.json();
    renderSearchResults(results);
  } catch (error) {
    if (error.name === 'AbortError') {
      // The request was canceled intentionally; ignore the error in the UI
      console.log("Fetch call was aborted cleanly.");
    } else {
      // Handle actual connection errors
      showSearchError(error);
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Reusing a single `AbortController` instance for new requests

**The mistake:** Creating one global `AbortController` instance and passing its signal to multiple sequential fetch calls.

**Why it's wrong:** Once `controller.abort()` is called, the controller enters an irreversible aborted state; `signal.aborted` remains `true` forever. Any future fetch calls passed that same signal will reject instantly before hitting the network.

*Fix:* Instantiation must occur per request lifecycle. Always run `new AbortController()` inside your query trigger function.

---

### Mistake 2: Reusing a Single `AbortController` Instance Across Multiple Independent Requests

**The mistake:** Passing the same `AbortController` signal to multiple sequential API calls.

**Why it's wrong:** Once an `AbortController` triggers `abort()`, its signal state is permanently aborted. Subsequent requests using that signal fail instantly.

*Incorrect:*
```javascript
const controller = new AbortController();
fetch('/api/1', { signal: controller.signal });
controller.abort();
fetch('/api/2', { signal: controller.signal }); // ❌ Instantly fails! Signal already aborted!
```

*Fix:*
```javascript
// Create a fresh AbortController instance per request:
const controller = new AbortController();
fetch('/api/2', { signal: controller.signal });
```

---

### Mistake 3: Forgetting to Un-Listen Search Input Abort Controllers in React Search Hooks

**The mistake:** Aborting auto-complete search requests on fast typing without cancelling previous pending fetches.

**Why it's wrong:** Fast typing creates race conditions where older slow responses overwrite newer search results. Abort previous pending requests when new keystrokes arrive.

*Incorrect:*
```http
// Fast typing triggers 5 parallel fetches, latest response overrides screen unpredictably
```

*Fix:*
```javascript
// Cancel previous controller on new input:
if (previousController) previousController.abort();
previousController = new AbortController();
```


---

## 5. Practice Exercises

### Exercise 1: Cancelable Fetch Request Engine with AbortController

**Scenario:** An autocomplete search input cancels outdated HTTP requests when the user types new characters.

**Requirements:**
1. Write fetchWithCancel(url, controller).
2. Attach controller.signal to fetch.
3. Catch AbortError and return cancelled status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWithCancel(url, controller, mockFetch) {
>   try {
>     const fetchFn = mockFetch || globalThis.fetch;
>     const response = await fetchFn(url, { signal: controller.signal });
>     return { success: true, data: await response.json() };
>   } catch (err) {
>     if (err.name === "AbortError") {
>       return { success: false, aborted: true, message: "Request aborted by user" };
>     }
>     return { success: false, error: err.message };
>   }
> }
>
> // Verification tests
> const controller = new AbortController();
> const mockFetch = (url, opts) => new Promise((resolve, reject) => {
>   opts.signal.addEventListener("abort", () => {
>     const err = new Error("The user aborted a request.");
>     err.name = "AbortError";
>     reject(err);
>   });
> });
>
> const promise = fetchWithCancel("https://api.com/search", controller, mockFetch);
> controller.abort();
>
> promise.then(res => {
>   console.assert(res.success === false && res.aborted === true, "Test 1 Failed: Request must report aborted");
> });
> ```
>
> #### Technical Explanation
>
> 1. **AbortController Purpose**: Provides standard mechanism to cancel ongoing asynchronous Web API operations (Fetch, Event Listeners).
> 2. **AbortSignal Object**: The signal property is passed to fetch options; when controller.abort() is invoked, signal emits abort event.
> 3. **AbortError Exception**: Fetch rejects with AbortError DOMException when canceled; must catch specifically to ignore user-initiated cancels.
> 
---

### Exercise 2: Debounced Auto-Aborting Search Client

**Scenario:** A real-time search widget automatically cancels the previous pending fetch request before dispatching a new search query.

**Requirements:**
1. Write createAutoAbortingSearch(searchApiFn).
2. Maintain active AbortController instance.
3. Abort previous request when new search begins.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createAutoAbortingSearch(searchApiFn) {
>   let currentController = null;
>
>   return async function search(query) {
>     if (currentController) {
>       currentController.abort();
>     }
>
>     currentController = new AbortController();
>     const controller = currentController;
>
>     try {
>       const results = await searchApiFn(query, controller.signal);
>       return { success: true, query, results };
>     } catch (err) {
>       if (err.name === "AbortError") {
>         return { success: false, aborted: true };
>       }
>       throw err;
>     } finally {
>       if (currentController === controller) {
>         currentController = null;
>       }
>     }
>   };
> }
>
> // Verification tests
> let activeCalls = 0;
> const mockSearchApi = async (q, signal) => {
>   activeCalls++;
>   return new Promise((resolve, reject) => {
>     signal.addEventListener("abort", () => {
>       const err = new Error("Aborted");
>       err.name = "AbortError";
>       reject(err);
>     });
>     setTimeout(() => resolve([`Result for ${q}`]), 50);
>   });
> };
>
> const searcher = createAutoAbortingSearch(mockSearchApi);
> const p1 = searcher("react");
> const p2 = searcher("react hooks");
>
> Promise.all([p1, p2]).then(([res1, res2]) => {
>   console.assert(res1.aborted === true, "Test 1 Failed: First query must abort");
>   console.assert(res2.success === true, "Test 2 Failed: Latest query must succeed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Race Condition Prevention**: Canceling stale requests prevents older delayed responses from overwriting newer search results.
> 2. **Bandwidth Conservation**: Aborting requests closes TCP streams early, saving network bandwidth.
> 3. **Re-usable Controller Pattern**: Creating a new AbortController per request avoids reusing triggered signal states.
> 
---

### Exercise 3: Timeout Abort Signal Wrapper

**Scenario:** A utility creates a combined AbortSignal that triggers automatically after a specified timeout duration.

**Requirements:**
1. Write fetchWithTimeoutSignal(url, timeoutMs, mockFetch).
2. Use AbortSignal.timeout(timeoutMs) or setTimeout fallback.
3. Cancel request if timeout expires.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWithTimeoutSignal(url, timeoutMs = 3000, mockFetch) {
>   const controller = new AbortController();
>   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
>
>   try {
>     const fetchFn = mockFetch || globalThis.fetch;
>     const response = await fetchFn(url, { signal: controller.signal });
>     clearTimeout(timeoutId);
>     return { success: true, data: await response.json() };
>   } catch (err) {
>     clearTimeout(timeoutId);
>     if (err.name === "AbortError") {
>       return { success: false, timedOut: true, error: `Request timed out after ${timeoutMs}ms` };
>     }
>     return { success: false, error: err.message };
>   }
> }
>
> // Verification tests
> const slowFetch = (url, opts) => new Promise((res, rej) => {
>   opts.signal.addEventListener("abort", () => {
>     const err = new Error("Aborted");
>     err.name = "AbortError";
>     rej(err);
>   });
> });
>
> fetchWithTimeoutSignal("https://api.com/slow", 50, slowFetch).then(res => {
>   console.assert(res.timedOut === true, "Test 1 Failed: Must timeout after 50ms");
> });
> ```
>
> #### Technical Explanation
>
> 1. **AbortSignal.timeout(ms)**: Modern Web API method returning an AbortSignal that automatically aborts after specified milliseconds.
> 2. **Timer Cleanup**: Always call clearTimeout(timeoutId) when request finishes to avoid memory leaks.
> 3. **Unified Cancellation**: Allows combining manual user cancellation with automatic network timeouts.
---

## 6. Related Terms
- [Request Timeout](request_timeout.md) — The timing pattern built on top of AbortController triggers.
- [XMLHttpRequest / AJAX](xmlhttprequest_ajax.md) — The legacy request API which supported request cancellation via `xhr.abort()`.
- [The fetch() API](fetch.md) — Related concept: The fetch() API.

---

## 7. Key Takeaways
- `AbortController` is the web standard mechanism for canceling in-flight fetch requests.
- It prevents race conditions in dynamic user interfaces (like search autocomplete).
- Link the controller to a fetch call by passing `controller.signal` in the options object.
- Calling `abort()` triggers an immediate rejection with a DOMException named `AbortError`.
- Never reuse an aborted controller; create a new instance for every network request.
