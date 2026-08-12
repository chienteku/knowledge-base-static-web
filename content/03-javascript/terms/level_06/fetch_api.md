# Fetch API

> **Level 6 — Asynchronous JavaScript**
> A modern, Promise-based interface for making HTTP network requests (`fetch()`).

---

## 1. Prerequisites
- [Promise](promise.md) — The object that `fetch()` returns.
- [async / await](async_await.md) — The best way to interact with `fetch()`.

---

## 2. Term Category

**Web API *(Browser Environment, now also in Node.js 18+)* (Universal: Originally browser-only, but modern Node.js  includes `fetch` natively.)**: Fetch API is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
For over a decade, if a web page wanted to request data from a server in the background (AJAX), developers had to use a clunky, ugly, callback-heavy interface called `XMLHttpRequest` (XHR). It was difficult to configure, hard to read, and predated modern JavaScript features.

When Promises were introduced, browser developers created the **Fetch API** as the modern replacement for XHR. `fetch()` is a simple global function. You give it a URL, and it instantly returns a Promise. When the network request completes, the Promise resolves with the server's Response. It is clean, readable, and perfectly designed to work with `async/await`.

### (2) Reality Metaphor
Using `XMLHttpRequest` was like ordering a package by filling out a 5-page legal form, mailing it in, and waiting by the phone for the delivery company to call you.
Using `fetch()` is like ordering on Amazon with "1-Click Checkout" and getting a tracking number (the Promise) instantly.

### (3) JavaScript Code Examples

#### Short Snippet: A simple GET request
```javascript
// By default, fetch() makes a GET request (asking for data)
async function getDogImage() {
  const response = await fetch('https://dog.ceo/api/breeds/image/random');
  
  // We must parse the raw response into usable JSON
  const data = await response.json(); 
  
  console.log(data.message); // Prints a URL to a dog image!
}
```

#### Fuller Example: A POST request (Sending data)
```javascript
async function createNewUser(username, email) {
  const newUser = { username: username, email: email };

  // To send data, we pass a configuration object as the second argument
  const response = await fetch('https://api.example.com/users', {
    method: 'POST', // We are sending data
    headers: {
      'Content-Type': 'application/json' // Telling the server we are sending JSON
    },
    body: JSON.stringify(newUser) // Converting our JS Object into a JSON string
  });

  if (response.ok) {
    console.log("User created successfully!");
  } else {
    console.error("Server rejected the request. Status:", response.status);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that `fetch()` doesn't reject on 404/500 errors

**The mistake:** Wrapping `fetch()` in a `try/catch` block and assuming that if the server returns a "404 Not Found" or "500 Internal Server Error", it will trigger the `catch` block.

**Why it's wrong:** The Fetch API was designed so that a Promise is only "Rejected" if the network request *physically fails* (e.g., the user loses internet connection, or the DNS fails to resolve). If the server receives the request and replies with an error code (like 404), Fetch considers that a *successful* communication! You must manually check the `response.ok` property to see if the server was happy.

*Incorrect:*
```javascript
try {
  // Requesting a page that doesn't exist (404)
  const res = await fetch('https://example.com/does_not_exist');
  // It won't jump to catch! It will proceed!
  console.log("Data loaded!"); 
} catch (error) {
  console.log("Network failed"); 
}
```

*Fix:*
```javascript
const res = await fetch('https://example.com/does_not_exist');
// Always check the .ok property!
if (!res.ok) {
  throw new Error(`HTTP error! status: ${res.status}`);
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Fetch Api Callbacks

**The mistake:** Passing methods from Fetch Api instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "fetch_api",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "fetch_api",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Fetch Api Operations

**The mistake:** Executing asynchronous operations within Fetch Api without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/fetch_api"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/fetch_api");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in fetch_api: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: REST API Client Wrapper with HTTP Error Guard

**Scenario:** A frontend network SDK wraps fetch() to send POST JSON requests and validate response status codes.

**Requirements:**
1. Write postJsonData(url, payload, mockFetchFn).
2. Call mockFetchFn with method POST and body JSON string.
3. Check response.ok.
4. Return parsed response JSON.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function postJsonData(url, payload, mockFetchFn) {
>   const response = await mockFetchFn(url, {
>     method: "POST",
>     headers: { "Content-Type": "application/json" },
>     body: JSON.stringify(payload)
>   });
>
>   if (!response.ok) {
>     throw new Error(`Request failed with status ${response.status}`);
>   }
>
>   return await response.json();
> }
>
> // Verification tests
> const mockFetch = async (url, opts) => ({
>   ok: true,
>   status: 200,
>   json: async () => ({ success: true, url })
> });
>
> postJsonData("https://api.com/user", { name: "Alice" }, mockFetch).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **fetch() Promise API**: fetch() returns a Promise resolving to a Response object representing the HTTP response.
> 2. **No Auto HTTP Error Rejection**: fetch() Promises do NOT reject on HTTP 404 or 500 errors; callers must check response.ok.
> 3. **JSON Parsing**: response.json() reads and parses response stream as JSON asynchronously.
> 
---

### Exercise 2: Fetch Api Advanced Context Handler

**Scenario:** A web application component processes fetch api data operations within enterprise workflows.

**Requirements:**
1. Write handleFetchApiSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleFetchApiSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleFetchApiSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Fetch Api Architecture**: Applying fetch api patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Fetch Api Performance Optimization

**Scenario:** An application utility optimizes fetch api execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeFetchApiTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeFetchApiTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeFetchApiTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Fetch Api Optimization**: Optimizing fetch api improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Promise](promise.md) — What `fetch()` returns.
- [async / await](async_await.md) — The preferred way to consume `fetch()`.
- [Promise.all / allSettled / race / any](promise_combinators.md) — Related concept: Promise.all / allSettled / race / any.
- [try/catch with async/await](try_catch_async_await.md) — Related concept: try/catch with async/await.
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — Related concept: JSON / JSON.stringify / JSON.parse.

---

## 7. Key Takeaways
- The Fetch API is the modern standard for making network requests in JavaScript.
- `fetch(url)` returns a Promise.
- You must typically call `.json()` on the response to parse the body.
- It only rejects on network failures, NOT on HTTP errors (like 404 or 500). You must check `response.ok`.
