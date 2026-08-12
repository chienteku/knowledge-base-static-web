# The fetch() API

> **Level 5 — Fetching Data (Client-Side)**
> The modern JavaScript function built into web browsers used to make HTTP network requests to a Server.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — `fetch()` is how you manually trigger this lifecycle in code.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — `fetch()` defaults to GET, but can be configured for POST, PUT, DELETE.

---

## 2. Term Category

**Browser API / Networking (Client-Side  and modern Node.js.)**: The fetch() API is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of JavaScript, if you wanted to get data from a server *without* refreshing the entire web page, you had to use an incredibly clunky and difficult API called `XMLHttpRequest` (XHR). It required 10 lines of confusing boilerplate code just to make a simple GET request.
In 2015, browsers introduced **`fetch()`**. It is a clean, modern, and elegant replacement for XHR. It relies entirely on Promises, allowing developers to write network requests in 2 or 3 lines of highly readable code.

### (2) Reality Metaphor
If your JavaScript code is a person sitting at a desk, `fetch()` is the company mailroom. 
You hand `fetch()` an envelope (the URL and the Request options). The mailroom takes the envelope, leaves the building, travels across the city (the internet), drops it off at the destination, waits for a reply, and eventually brings the reply back to your desk. 

### (3) The Anatomy of `fetch()`
The function takes two arguments:
1. **The URL (Required)**: Where are we sending the request?
2. **The Options Object (Optional)**: If you don't provide this, `fetch` assumes you want to do a simple `GET` request. If you do provide it, you can specify the `method`, `headers`, and `body`.

### (4) Code Examples

#### The simplest GET request
```javascript
// By default, fetch makes a GET request
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data));
```

#### A complex POST request
```javascript
const newPost = { title: "Hello World", body: "My first post" };

fetch('https://api.example.com/posts', {
  method: 'POST', // Changing the verb
  headers: {
    'Content-Type': 'application/json', // Telling the server it's JSON
    'Authorization': 'Bearer my_token'  // Proving who we are
  },
  body: JSON.stringify(newPost) // The actual payload
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting the data instantly

**The mistake:** A developer writes:
```javascript
const myData = fetch('https://api.example.com/users');
console.log(myData); // Why doesn't this print the users?!
```

**Why it's wrong:** The network is slow! `fetch()` doesn't freeze your code while it waits 500ms for the server to reply. It instantly returns a **Promise** (a placeholder object that says "I promise to give you the data eventually"). If you try to log `myData` immediately, you will just log the empty Promise object, not the actual users.
**Solution:** You must use `.then()` or `await` to tell JavaScript to wait for the network trip to finish.

---

### Mistake 2: Forgetting `await` on `response.json()` Promise Parsing

**The mistake:** Writing `const data = res.json();` without `await`.

**Why it's wrong:** `response.json()` returns an asynchronous Promise, NOT parsed data. Calling properties on un-awaited promises yields `undefined`.

*Incorrect:*
```javascript
const res = await fetch('/api/data');
const data = res.json(); // ❌ Returns Promise { <pending> }, not data!
console.log(data.items); // undefined!
```

*Fix:*
```javascript
const res = await fetch('/api/data');
const data = await res.json(); // Correctly await body JSON parsing
console.log(data.items);
```

---

### Mistake 3: Omitting Credentials Option When Requesting Cross-Origin Auth Cookies (`credentials: 'include'`)

**The mistake:** Sending cross-origin fetch requests expecting cookies to be attached without `credentials: 'include'`.

**Why it's wrong:** By default (`credentials: 'same-origin'`), `fetch()` strips cookies from cross-origin requests. Explicitly set `credentials: 'include'` for cross-origin cookie auth.

*Incorrect:*
```javascript
fetch('https://api.example.com/me'); // ❌ Strips cross-origin auth cookies!
```

*Fix:*
```javascript
fetch('https://api.example.com/me', {
  credentials: 'include' // Sends cross-origin cookies
});
```


---

## 5. Practice Exercises

### Exercise 1: Standardized JSON Fetch Wrapper

**Scenario:** A lightweight HTTP client wraps native `fetch()` to handle headers, body serialization, and JSON response parsing automatically.

**Requirements:**
1. Write httpGet(url, headers).
2. Write httpPost(url, payload, headers).
3. Return parsed JSON response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function httpPost(url, payload, customHeaders = {}, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   const response = await fetchFn(url, {
>     method: "POST",
>     headers: {
>       "Content-Type": "application/json",
>       "Accept": "application/json",
>       ...customHeaders
>     },
>     body: JSON.stringify(payload)
>   });
>
>   if (!response.ok) {
>     throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
>   }
>
>   return await response.json();
> }
>
> // Verification tests
> const mockFetch = async (url, opts) => {
>   const body = JSON.parse(opts.body);
>   return {
>     ok: true,
>     status: 200,
>     json: async () => ({ id: 101, name: body.name })
>   };
> };
>
> httpPost("https://api.com/users", { name: "Alice" }, {}, mockFetch).then(res => {
>   console.assert(res.id === 101 && res.name === "Alice", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Fetch API Standardization**: Native browser & Node.js API replacing legacy XMLHttpRequest for making asynchronous HTTP requests.
> 2. **Manual JSON Serialization**: fetch body accepts string or Buffer; objects MUST be serialized using JSON.stringify().
> 3. **Asynchronous Body Parsing**: response.json() returns a promise parsing the streaming response body asynchronously.
> 
---

### Exercise 2: Fetch Middleware & Interceptor Pipeline

**Scenario:** An API SDK implements request/response interceptor pipelines around native `fetch()` to inject authorization tokens dynamically.

**Requirements:**
1. Write createFetchClient(requestInterceptor).
2. Execute requestInterceptor before calling fetch.
3. Return fetch response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFetchClient(requestInterceptor, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   return async function customFetch(url, options = {}) {
>     const interceptedOpts = requestInterceptor ? requestInterceptor(options) : options;
>     return await fetchFn(url, interceptedOpts);
>   };
> }
>
> // Verification tests
> const authInterceptor = (opts) => ({
>   ...opts,
>   headers: { ...opts.headers, "Authorization": "Bearer secret_token" }
> });
>
> const mockFetch = async (url, opts) => ({
>   ok: true,
>   authHeader: opts.headers["Authorization"]
> });
>
> const client = createFetchClient(authInterceptor, mockFetch);
> client("https://api.com/profile").then(res => {
>   console.assert(res.authHeader === "Bearer secret_token", "Test 1 Failed: Token injected");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Interceptor Pattern**: Wraps fetch calls to apply global concerns (Auth headers, logging, base URLs) transparently.
> 2. **Configurability**: Allows modifying request options before network dispatch.
> 3. **Decoupled Auth Logic**: Removes auth token fetching logic from individual UI component API calls.
> 
---

### Exercise 3: 204 No Content & Empty Response Body Handler

**Scenario:** A fetch helper safely handles `204 No Content` responses without throwing JSON parse errors.

**Requirements:**
1. Write fetchWith204Handler(url, mockFetch).
2. Check response.status === 204.
3. Skip res.json() call and return null for 204 status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWith204Handler(url, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>   const response = await fetchFn(url);
>
>   if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
>
>   if (response.status === 204 || response.headers.get("content-length") === "0") {
>     return { status: 204, data: null };
>   }
>
>   const data = await response.json();
>   return { status: response.status, data };
> }
>
> // Verification tests
> const mock204 = async () => ({
>   ok: true,
>   status: 204,
>   headers: new Map([["content-length", "0"]]),
>   json: async () => { throw new SyntaxError("Unexpected end of JSON input"); }
> });
>
> fetchWith204Handler("https://api.com/delete", mock204).then(res => {
>   console.assert(res.status === 204 && res.data === null, "Test 1 Failed: Must handle 204 without JSON error");
> });
> ```
>
> #### Technical Explanation
>
> 1. **204 No Content Specification**: RFC 7231 states 204 response MUST NOT include a message-body.
> 2. **SyntaxError on Empty JSON**: Calling response.json() on an empty body throws SyntaxError: Unexpected end of JSON input.
> 3. **Defensive Body Guard**: Checking status === 204 avoids parsing crashes on successful deletion operations.
---

## 6. Related Terms
- [Promises (in the context of networks)](promises.md) — What `fetch` actually returns.
- [The Response Object (res.json(), res.ok)](response_object.md) — The first thing `fetch` hands back to you when the network trip finishes.
- [Request & Response Lifecycle](../level_01/request_response.md) — Related concept: Request & Response Lifecycle.
- [Promise.all / Parallel Requests](promise_all.md) — Related concept: Promise.all / Parallel Requests.
- [XMLHttpRequest / AJAX](xmlhttprequest_ajax.md) — Related concept: XMLHttpRequest / AJAX.
- [The WebSocket API (Client-side)](../level_08/websocket_api.md) — Related concept: The WebSocket API (Client-side).
- [Postman / Insomnia (API Clients)](../level_10/api_clients.md) — Related concept: Postman / Insomnia (API Clients).
- [AbortController / Cancellation](abortcontroller.md) — Canceling fetch with AbortController.
- [async / await](async_await.md) — Async/await with fetch.

---

## 7. Key Takeaways
- **`fetch()`** is the modern standard for making HTTP requests in JavaScript.
- It takes a URL as its first argument.
- By default, it performs a `GET` request.
- To perform a `POST`, `PUT`, or `DELETE`, you must pass an Options object as the second argument.
- It always returns a **Promise** because network requests take time.
