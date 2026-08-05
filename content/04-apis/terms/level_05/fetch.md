# The fetch() API

> **Level 5 — Fetching Data (Client-Side)**
> The modern JavaScript function built into web browsers used to make HTTP network requests to a Server.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — `fetch()` is how you manually trigger this lifecycle in code.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — `fetch()` defaults to GET, but can be configured for POST, PUT, DELETE.
---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Client-Side (Browser)** and modern **Node.js**.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Read the Docs

**Problem:** You want to delete a user. The API documentation says: `DELETE /api/users/:id`. Write the `fetch` call to delete User 42.

**Expected output:**
> [!check]- Answer
> ```javascript
> fetch('/api/users/42', {
>   method: 'DELETE'
> });
> ```
> - You need to pass the options object to change the method.
> - Do DELETE requests usually have bodies? (No).

---

### Exercise 2: Standard Fetch Wrapper Template

**Problem:** Write reusable `postJSON(url, data)` async function executing HTTP POST request with JSON headers and status validation.

**Expected output:**
> [!check]- Answer
> ```text
> async function postJSON(url, data) { const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return await res.json(); }
> ```
> ```javascript
> async function postJSON(url, data) {
> const res = await fetch(url, {
> method: 'POST',
> headers: { 'Content-Type': 'application/json' },
> body: JSON.stringify(data)
> });
> if (!res.ok) throw new Error(`HTTP ${res.status}`);
> return await res.json();
> }
> ```
> - **Explanation:** Robust `fetch` wrappers handle headers, JSON stringification, status checks, and promise resolution.
---

### Exercise 3: Fetch Request Cache Options

**Problem:** Which `cache` option instructs `fetch()` to bypass browser HTTP cache and force fresh network fetches?

**Expected output:**
> [!check]- Answer
> ```text
> fetch(url, { cache: 'no-store' }) (or 'no-cache')
> ```
> ```javascript
> fetch(url, { cache: 'no-store' });
> ```
> - **Explanation:** `cache: 'no-store'` disables browser HTTP caching mechanisms.
---

## 7. Related Terms
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

## 8. Key Takeaways
- **`fetch()`** is the modern standard for making HTTP requests in JavaScript.
- It takes a URL as its first argument.
- By default, it performs a `GET` request.
- To perform a `POST`, `PUT`, or `DELETE`, you must pass an Options object as the second argument.
- It always returns a **Promise** because network requests take time.
