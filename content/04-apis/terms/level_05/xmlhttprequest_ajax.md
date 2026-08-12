# XMLHttpRequest / AJAX

> **Level 5 — Fetching Data (Client-Side)**
> The legacy request API `fetch()` replaced; explains fetch's "why".

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — The network request round-trip fundamentals.

---

## 2. Term Category

**Browser API / Networking (Browser-Specific: Built-in objects provided by the browser window engine. Not natively available in Node.js.)**: XMLHttpRequest / AJAX is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, clicking a link or submitting a form required the browser to discard the current page completely, fetch a new HTML file from the server, and rebuild the entire window. This made browsing slow and jarring.

To allow pages to fetch data and update the user interface dynamically in the background without reloading the page, developers introduced **AJAX** powered by **XMLHttpRequest (XHR)**:
- **AJAX (Asynchronous JavaScript and XML):** A design technique of sending and receiving data asynchronously in the background to update specific segments of the DOM.
- **XMLHttpRequest (XHR):** The legacy built-in browser class used to execute these background requests.

#### The Limit of XHR: Callback Hell
XHR was designed before JavaScript had Promises. It relies entirely on event listener callbacks (like `onload`, `onerror`, `onreadystatechange`) to handle data. If you need to make multiple sequential API calls (e.g. fetch a user → fetch their posts → fetch comments on those posts), the code nests inside callbacks, creating unreadable, unmaintainable code.

To solve this verbosity, the modern **`fetch()` API** was created to replace XHR with a clean, Promise-based syntax that integrates with `async`/`await`.

### (2) Reality Metaphor
Imagine ordering food at a restaurant.
- **Full Page Reload** is like **exiting the building** and re-entering every time you want to order a new drink. The restaurant staff must throw away your plate, clean the table, and seat you all over again.
- **AJAX / XHR** is like sending **orders to the kitchen via a fax machine** on your table. You write your order and wait for the paper response to print. It works in the background, but the fax machine is verbose, loud, requires dial-in setups, and can get jammed if you send messages too fast.
- **Fetch API** is like sending a **quick text message** to the waiter from your phone. You hit send and cleanly wait for a push notification when your drink is ready.

---

### (3) Syntax Comparison: XHR vs. Fetch

#### 1. Fetch API (Modern, Promise-based)
```javascript
fetch('/api/users/42')
  .then(res => res.json())
  .then(user => console.log("User:", user.name))
  .catch(err => console.error("Error:", err));
```

#### 2. XMLHttpRequest (Legacy, Callback-based)
To accomplish the exact same request, XHR requires setting up configuration states and event listener loops manually:
```javascript
// 1. Instantiate the XHR object constructor
var xhr = new XMLHttpRequest();

// 2. Configure the HTTP method and destination URL path
xhr.open('GET', '/api/users/42', true);

// 3. Register the success handler callback
xhr.onload = function() {
  if (xhr.status >= 200 && xhr.status < 400) {
    var user = JSON.parse(xhr.responseText);
    console.log("User:", user.name);
  } else {
    console.error("Server Error:", xhr.statusText);
  }
};

// 4. Register the network error handler callback
xhr.onerror = function() {
  console.error("Connection failed");
};

// 5. Explicitly fire the request payload
xhr.send();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming XHR is completely obsolete and useless

**The mistake:** Assuming that because `fetch` exists, XHR has been deleted from browsers, or that modern HTTP libraries (like Axios) do not use it.

**Why it's wrong:** XHR is fully supported for backwards compatibility. In fact, many popular libraries like **Axios** use XHR under the hood in browser environments because XHR has native support for **upload progress event tracking** (e.g. `xhr.upload.onprogress`), which the standard `fetch` API cannot do easily.

---

### Mistake 2: Using Legacy `XMLHttpRequest` in New Web Projects Instead of Modern `fetch()`

**The mistake:** Writing verbose `new XMLHttpRequest()` callbacks in new 2026 JavaScript codebases.

**Why it's wrong:** XMLHttpRequest uses legacy callback patterns, lacks Promise support, and requires verbose event handling. Modern JavaScript standardizes on `fetch()` and `async/await`.

*Incorrect:*
```javascript
// Obsolete XHR request
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onload = function() { console.log(xhr.responseText); }; // ❌ Legacy callback architecture!
xhr.send();
```

*Fix:*
```javascript
// Modern promise-based fetch API:
const res = await fetch('/api/data');
const data = await res.json();
```

---

### Mistake 3: Using Synchronous XMLHttpRequest (`open('GET', url, false)`) Blocking Browser UI

**The mistake:** Setting `async` parameter to `false` in `xhr.open('GET', url, false)`.

**Why it's wrong:** Synchronous XHR freezes the browser main UI thread completely until the network request completes, rendering the webpage unresponsive and triggering browser console deprecation warnings.

*Incorrect:*
```javascript
xhr.open('GET', '/api/data', false); // ❌ Freezes browser main thread!
```

*Fix:*
```javascript
/* Always use asynchronous requests via fetch() or async XHR */
```


---

## 5. Practice Exercises

### Exercise 1: Legacy XMLHttpRequest (XHR) Progress Tracker

**Scenario:** An API file upload component uses legacy `XMLHttpRequest` to track real-time upload progress events (`onprogress`).

**Requirements:**
1. Write trackXhrUpload(url, fileBuffer, onProgressFn, mockXhr).
2. Attach upload.onprogress event listener.
3. Calculate percentage.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function trackXhrUpload(url, fileBuffer, onProgressFn, mockXhrInstance) {
>   const xhr = mockXhrInstance || new XMLHttpRequest();
>   xhr.open("POST", url, true);
>
>   if (xhr.upload && typeof onProgressFn === "function") {
>     xhr.upload.onprogress = (event) => {
>       if (event.lengthComputable) {
>         const percent = Math.round((event.loaded / event.total) * 100);
>         onProgressFn(percent, event.loaded, event.total);
>       }
>     };
>   }
>
>   xhr.send(fileBuffer);
>   return xhr;
> }
>
> // Verification tests
> const progressLog = [];
> const mockXhr = {
>   open() {},
>   send(data) {
>     if (this.upload.onprogress) {
>       this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
>       this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
>     }
>   },
>   upload: {}
> };
>
> trackXhrUpload("/upload", Buffer.from("data"), (p) => progressLog.push(p), mockXhr);
> console.assert(progressLog[0] === 50 && progressLog[1] === 100, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Legacy XHR Upload Progress**: Unlike basic fetch(), legacy XMLHttpRequest exposes upload.onprogress for fine-grained file upload tracking.
> 2. **lengthComputable Property**: Boolean flag indicating whether total payload byte length is known.
> 3. **Modern Fetch Streams Alternative**: Modern browsers now support ReadableStream in Fetch, but XHR remains common in legacy upload libraries.
> 
---

### Exercise 2: Promisified XMLHttpRequest Wrapper

**Scenario:** Converts legacy event-driven `XMLHttpRequest` calls into modern Promise-returning functions.

**Requirements:**
1. Write xhrPromise(url, options, mockXhr).
2. Handle onload, onerror, ontimeout.
3. Resolve or reject Promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function xhrPromise(url, options = {}, mockXhrInstance) {
>   return new Promise((resolve, reject) => {
>     const xhr = mockXhrInstance || new XMLHttpRequest();
>     const method = options.method || "GET";
>
>     xhr.open(method, url, true);
>     xhr.timeout = options.timeoutMs || 5000;
>
>     xhr.onload = () => {
>       if (xhr.status >= 200 && xhr.status < 300) {
>         resolve({ status: xhr.status, responseText: xhr.responseText });
>       } else {
>         reject(new Error(`XHR HTTP Error ${xhr.status}`));
>       }
>     };
>
>     xhr.onerror = () => reject(new Error("XHR Network Error"));
>     xhr.ontimeout = () => reject(new Error("XHR Timeout Error"));
>
>     xhr.send(options.body || null);
>   });
> }
>
> // Verification tests
> const mockXhr = {
>   open(m, u) {},
>   send() {
>     this.status = 200;
>     this.responseText = '{"ok":true}';
>     this.onload();
>   }
> };
>
> xhrPromise("/api/data", {}, mockXhr).then(res => {
>   console.assert(res.status === 200 && res.responseText.includes("ok"), "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Event-Driven Architecture**: XHR relies on event handlers (onload, onerror, ontimeout) rather than promises.
> 2. **readyState Progression**: UNSENT (0) -> OPENED (1) -> HEADERS_RECEIVED (2) -> LOADING (3) -> DONE (4).
> 3. **Migration Strategy**: Promisifying XHR enables using async/await syntax while preserving legacy XHR capabilities.
> 
---

### Exercise 3: XHR vs Fetch API Migration Adapter

**Scenario:** An API migration layer translates legacy XHR config objects into modern Fetch API parameter objects.

**Requirements:**
1. Write adaptXhrToFetchOptions(xhrConfig).
2. Map method, headers, timeout, and body.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function adaptXhrToFetchOptions(xhrConfig = {}) {
>   const method = (xhrConfig.method || "GET").toUpperCase();
>   const headers = xhrConfig.headers || {};
>   const body = xhrConfig.data || null;
>
>   const fetchOptions = {
>     method,
>     headers: { ...headers }
>   };
>
>   if (body && method !== "GET" && method !== "HEAD") {
>     fetchOptions.body = typeof body === "object" && !(body instanceof FormData) 
>       ? JSON.stringify(body) 
>       : body;
>   }
>
>   return fetchOptions;
> }
>
> // Verification tests
> const xhrConfig = {
>   method: "POST",
>   headers: { "Accept": "application/json" },
>   data: { username: "alice" }
> };
>
> const fetchOpts = adaptXhrToFetchOptions(xhrConfig);
> console.assert(fetchOpts.method === "POST", "Test 1 Failed");
> console.assert(fetchOpts.body === '{"username":"alice"}', "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **AJAX Concept**: Asynchronous JavaScript and XML: umbrella term for updating web page content asynchronously without full reload.
> 2. **Fetch API Superiority**: Fetch offers cleaner promise syntax, Service Worker integration, and stream processing.
> 3. **Migration Abstraction**: Adapters facilitate codebase refactoring from legacy XHR to modern Fetch API.
---

## 6. Related Terms
- [The fetch() API](fetch.md) — The modern Promise-based request standard.
- [Promises (in the context of networks)](promises.md) — The asynchronous data container object returned by fetch.
- [AbortController / Cancellation](abortcontroller.md) — Related concept: AbortController / Cancellation.

---

## 7. Key Takeaways
- AJAX is a design concept for performing background network queries to dynamically update the DOM.
- XMLHttpRequest (XHR) is the legacy browser constructor object that implemented AJAX.
- XHR relies on event callbacks, often leading to callback hell on sequential requests.
- Modern `fetch()` replaces XHR with a clean, promise-driven model.
- XHR remains in browsers for compatibility and is used by libraries like Axios to track file upload progress.
