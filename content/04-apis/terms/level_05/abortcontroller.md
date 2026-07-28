# AbortController / Cancellation

> **Level 5 — Fetching Data (Client-Side)**
> Canceling an in-flight `fetch`.

---

## 1. Prerequisites
- [The fetch() API](./fetch.md) — The network request handler.
- [Promises (in the context of networks)](./promises.md) — The asynchronous response objects.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Universal**: Supported in modern web browsers and Node.js (version 15+).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Cleanup Handler

**Problem:** Complete the React-style cleanup effect template to abort a profile fetch request if the user navigates away (component unmounts):

```javascript
function loadProfileComponent(userId) {
  // 1. Instantiate the controller
  const controller = new AbortController();
  
  fetch(`/api/user/${userId}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => renderProfile(data))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });

  // 2. Return the component cleanup unmount function
  return function onUnmount() {
    controller.abort();
  };
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Timeout Fetch with AbortSignal.timeout()

**Problem:** Write JavaScript `fetch()` request automatically aborting after 5000ms timeout using `AbortSignal.timeout()`.

**Expected output:**
> [!check]- Answer
> ```text
> fetch('/api/data', { signal: AbortSignal.timeout(5000) })
> ```
> ```javascript
> try {
> const res = await fetch('/api/data', { signal: AbortSignal.timeout(5000) });
> const data = await res.json();
> } catch (err) {
> if (err.name === 'TimeoutError') console.error('Request timed out after 5s');
> }
> ```
> - **Explanation:** `AbortSignal.timeout(ms)` automatically triggers abort after specified milliseconds.
---

### Exercise 3: Handling AbortError Exception

**Problem:** What error name property is set on the thrown Exception when a `fetch()` call is aborted via `AbortController`?

**Expected output:**
> [!check]- Answer
> ```text
> err.name === 'AbortError'
> ```
> ```javascript
> catch (err) {
> if (err.name === 'AbortError') {
> console.log('Fetch request was intentionally aborted');
> }
> }
> ```
> - **Explanation:** `AbortController.abort()` throws a DOMException named `AbortError`.
---

## 7. Related Terms
- [Request Timeout](./request_timeout.md) — The timing pattern built on top of AbortController triggers.
- [XMLHttpRequest / AJAX](./xmlhttprequest_ajax.md) — The legacy request API which supported request cancellation via `xhr.abort()`.

---

## 8. Key Takeaways
- `AbortController` is the web standard mechanism for canceling in-flight fetch requests.
- It prevents race conditions in dynamic user interfaces (like search autocomplete).
- Link the controller to a fetch call by passing `controller.signal` in the options object.
- Calling `abort()` triggers an immediate rejection with a DOMException named `AbortError`.
- Never reuse an aborted controller; create a new instance for every network request.
