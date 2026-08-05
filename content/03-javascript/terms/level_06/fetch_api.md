# Fetch API

> **Level 6 — Asynchronous JavaScript**
> A modern, Promise-based interface for making HTTP network requests (`fetch()`).

---

## 1. Prerequisites
- [Promise](promise.md) — The object that `fetch()` returns.
- [async / await](async_await.md) — The best way to interact with `fetch()`.

---

## 2. Term Category
- **Web API** *(Browser Environment, now also in Node.js 18+)*

---

## 3. Environment Context
- **Universal**: Originally browser-only, but modern Node.js (18+) includes `fetch` natively.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Parsing the Body

**Problem:** You use `const res = await fetch('/api/data')`. Why can't you immediately do `console.log(res.user)`? What critical step is missing?

**Expected output:**
> [!check]- Answer
> ```text
> `res` is the raw HTTP Response object, which contains headers, status codes, and a raw data stream. 
> You must parse the body into JavaScript objects by doing:
> `const data = await res.json();`
> ```
> - `fetch` resolves with a `Response` object, not the actual JSON data.

---

### Exercise 2: Checking HTTP Response `response.ok` Status

**Problem:** Check `response.ok` and throw error if `false` in a mock fetch handler.

**Expected output:**
> [!check]- Answer
> ```text
> HTTP Error: 404
> ```
> ```javascript
> const mockRes = { ok: false, status: 404 };
> try {
>   if (!mockRes.ok) throw new Error(`HTTP Error: ${mockRes.status}`);
> } catch (err) {
>   console.log(err.message);
> }
> ```
>
> **Explanation:** Checking `response.ok` ensures non-2xx HTTP status codes are handled as errors.

---

### Exercise 3: Parsing JSON Body with `response.json()`

**Problem:** Demonstrate chaining `fetch()` with `response.json()`.

**Expected output:**
> [!check]- Answer
> ```text
> Parsed JSON data
> ```
> ```javascript
> Promise.resolve({ json: () => Promise.resolve("Parsed JSON data") })
>   .then(res => res.json())
>   .then(data => console.log(data));
> ```
>
> **Explanation:** `response.json()` returns a Promise resolving to the parsed JSON body payload.


---

## 7. Related Terms
- [Promise](promise.md) — What `fetch()` returns.
- [async / await](async_await.md) — The preferred way to consume `fetch()`.
- [Promise.all / allSettled / race / any](promise_combinators.md) — Related concept: Promise.all / allSettled / race / any.
- [try/catch with async/await](try_catch_async_await.md) — Related concept: try/catch with async/await.
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — Related concept: JSON / JSON.stringify / JSON.parse.

---

## 8. Key Takeaways
- The Fetch API is the modern standard for making network requests in JavaScript.
- `fetch(url)` returns a Promise.
- You must typically call `.json()` on the response to parse the body.
- It only rejects on network failures, NOT on HTTP errors (like 404 or 500). You must check `response.ok`.
