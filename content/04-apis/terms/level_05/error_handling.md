# Error Handling (try / catch)

> **Level 5 — Fetching Data (Client-Side)**
> The architectural pattern used to gracefully handle network failures, server crashes, or bad data when using `async/await`.

---

## 1. Prerequisites
- [async / await](async_await.md) — `try/catch` is the standard way to handle errors in async functions.
- [HTTP Status Codes](../level_02/status_codes.md) — The primary source of errors we are trying to catch.

---

## 2. Term Category
- **JavaScript Core Concept / Control Flow**

---

## 3. Environment Context
- **Universal** (Standard programming paradigm).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The network is inherently unreliable. The user might drive into a tunnel and lose cell service. The server might run out of memory and crash. 
When writing API calls, you must plan for failure. If a `fetch()` request fails and you don't have Error Handling in place, your JavaScript application will "throw an Unhandled Promise Rejection" and essentially crash, leaving the user staring at a broken, frozen screen.
Because `async/await` code looks like normal synchronous code, we handle errors using the standard JavaScript **`try / catch`** blocks.

### (2) Reality Metaphor
Imagine you ask your assistant to drive to the bank to deposit a check.
- **`try`**: The assistant attempts to drive to the bank and deposit the check.
- **`catch`**: If the car gets a flat tire, or the bank is closed, the assistant immediately stops what they are doing and executes the backup plan (e.g., call a tow truck, or go home). They don't just sit in the broken car forever.

### (3) How it works
You wrap all your dangerous network code inside a `try {}` block. 
If *any* line inside the `try` block fails (throws an error), JavaScript immediately aborts the rest of the `try` block and jumps down into the `catch {}` block.

### (4) Code Examples

#### Standard API Error Handling
```javascript
async function getProfile() {
  try {
    // 1. Attempt the dangerous network call
    const response = await fetch('https://api.example.com/profile');
    
    // 2. We only reach this line if the network didn't fail
    const data = await response.json();
    console.log("Success!", data);
    
  } catch (error) {
    // 3. We jump here instantly if the user's Wi-Fi drops!
    console.error("Oh no, something broke!");
    console.error(error.message);
    
    // Show a red error banner to the user on the UI
    showToast("Failed to load profile. Check your connection.");
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that `fetch()` doesn't throw on 404s!

**The mistake:** A developer wraps their `fetch()` in a `try/catch` block. The server returns a `404 Not Found` or `500 Server Error`. The developer expects the `catch` block to run, but it doesn't!

**Why it's wrong:** The `fetch` API is very specific: it only "rejects" (throws an error to the `catch` block) if there is a literal **Network Failure** (like the user has no Wi-Fi, or the DNS failed). 
If the server successfully receives the request, but intentionally replies with a `404 Not Found` error, `fetch` considers that a *successful network trip*! 
**Golden Rule:** To properly handle API errors, you must manually check `response.ok` inside the `try` block and throw your own error! (See the next term: [The Response Object](../level_05/response_object.md)).

---

### Mistake 2: Swallowing Exceptions in Empty `catch` Blocks ("Silent Error Swallowing")

**The mistake:** Writing `catch (err) { /* do nothing */ }` around API call exceptions.

**Why it's wrong:** Swallowing errors silently masks network failures, leaving UI states stuck in infinite loading spinners without user feedback or logging.

*Incorrect:*
```javascript
try {
  await sendPayment();
} catch (err) {
  // ❌ Swallows error! User thinks payment succeeded!
}
```

*Fix:*
```javascript
try {
  await sendPayment();
} catch (err) {
  logger.error('Payment failed:', err);
  showUserToast('Payment failed. Please try again.');
}
```

---

### Mistake 3: Exposing Raw Internal Error Stack Traces to API Clients in Production

**The mistake:** Returning `res.status(500).json({ error: err.stack })` in production backend handlers.

**Why it's wrong:** Exposing internal stack traces leaks file system paths, database table names, and dependency versions to potential attackers. Return sanitized error messages in production.

*Incorrect:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message, stack: err.stack }); // ❌ Leaks stack trace in prod!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({ message: isProd ? 'Internal Server Error' : err.message });
});
```


---

## 6. Practice Exercises

### Exercise 1: Tracing the Jump

**Problem:** Look at the code below. If the user's internet is turned off, which numbers will be logged to the console?
```javascript
async function doMath() {
  try {
    console.log("1");
    await fetch('/api/data'); // Network fails here!
    console.log("2");
  } catch (err) {
    console.log("3");
  }
  console.log("4");
}
```

**Expected output:**
> [!check]- Answer
> ```text
> 1, 3, 4.
> It logs 1. The fetch fails, so it instantly skips line 2 and jumps directly into the catch block, logging 3. After the catch block finishes, the function continues normally, logging 4.
> ```
> - As soon as an error happens, execution immediately jumps to the catch block!

---

### Exercise 2: Standard RFC 7807 Problem Details Object Design

**Problem:** Write RFC 7807 compliant error JSON payload for a 400 Bad Request invalid email error.

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "type": "https://example.com/errors/invalid-email",
>   "title": "Invalid Email Address",
>   "status": 400,
>   "detail": "The provided email format is invalid."
> }
> ```
> ```json
> {
> "type": "https://example.com/errors/invalid-email",
> "title": "Invalid Email Address",
> "status": 400,
> "detail": "The provided email format is invalid."
> }
> ```
> - **Explanation:** RFC 7807 defines standard machine-readable problem detail error schemas.
---

### Exercise 3: Custom Error Class Pattern

**Problem:** Write custom JavaScript `APIError` class extending `Error` holding `statusCode` property.

**Expected output:**
> [!check]- Answer
> ```text
> class APIError extends Error { constructor(message, statusCode) { super(message); this.statusCode = statusCode; } }
> ```
> ```javascript
> class APIError extends Error {
> constructor(message, statusCode) {
> super(message);
> this.statusCode = statusCode;
> }
> }
> ```
> - **Explanation:** Custom error classes attach HTTP status code metadata to exceptions.
---

## 7. Related Terms
- [The Response Object (res.json(), res.ok)](response_object.md) — How we check for 400 and 500 status codes inside the `try` block.
- [async / await](async_await.md) — Related concept: async / await.
- [Promises (in the context of networks)](promises.md) — Related concept: Promises (in the context of networks).
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — Related concept: Rate Limiting (429 Too Many Requests).
- [HTTP Status Codes](../level_02/status_codes.md) — Related concept: HTTP Status Codes.

---

## 8. Key Takeaways
- Always wrap `await fetch()` calls inside a **`try / catch`** block.
- The `try` block contains the "happy path" (what happens if everything works).
- The `catch` block contains the fallback logic (show error message to user).
- `fetch()` only jumps to `catch` on physical network failures, not on HTTP error status codes!
