# Error Handling (try / catch)

> **Level 5 — Fetching Data (Client-Side)**
> The architectural pattern used to gracefully handle network failures, server crashes, or bad data when using `async/await`.

---

## 1. Prerequisites
- [async / await](async_await.md) — `try/catch` is the standard way to handle errors in async functions.
- [HTTP Status Codes](../level_02/status_codes.md) — The primary source of errors we are trying to catch.

---

## 2. Term Category

**JavaScript Core Concept / Control Flow (Universal .)**: Error Handling (try / catch) is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defensive HTTP Fetch Error Normalizer

**Scenario:** An API client normalizes both network failures (type errors) and non-2xx HTTP status responses into a unified error format.

**Requirements:**
1. Write fetchSafeJson(url, mockFetch).
2. Check response.ok.
3. Parse error JSON body on 4xx/5xx responses.
4. Throw structured ApiError.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchSafeJson(url, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>   let response;
>
>   try {
>     response = await fetchFn(url);
>   } catch (netErr) {
>     return { success: false, status: 0, code: "NETWORK_ERROR", error: "Network failure or CORS block" };
>   }
>
>   if (!response.ok) {
>     let errorData = {};
>     try {
>       errorData = await response.json();
>     } catch (e) {
>       errorData = { message: response.statusText };
>     }
>     return {
>       success: false,
>       status: response.status,
>       code: errorData.code || "HTTP_ERROR",
>       error: errorData.message || `HTTP ${response.status}`
>     };
>   }
>
>   const data = await response.json();
>   return { success: true, status: response.status, data };
> }
>
> // Verification tests
> const mock404 = async () => ({
>   ok: false,
>   status: 404,
>   statusText: "Not Found",
>   json: async () => ({ code: "USER_NOT_FOUND", message: "User #42 does not exist" })
> });
>
> fetchSafeJson("/api/users/42", mock404).then(res => {
>   console.assert(res.success === false && res.status === 404, "Test 1 Failed");
>   console.assert(res.code === "USER_NOT_FOUND", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Fetch Does Not Reject on 4xx/5xx**: The standard fetch() promise ONLY rejects on network errors; HTTP 404/500 resolve with response.ok === false.
> 2. **Checking response.ok**: Developers MUST explicitly check response.ok (status 200-299) before reading success payloads.
> 3. **Error Payload Parsing**: Attempts to parse JSON error bodies from 4xx/5xx responses before falling back to statusText.
> 
---

### Exercise 2: Custom API Error Hierarchy

**Scenario:** An API SDK defines custom Error sub-classes (`ApiError`, `ValidationError`, `AuthenticationError`) for precise exception handling.

**Requirements:**
1. Create ApiError base class.
2. Create ValidationError sub-class with fieldErrors property.
3. Implement handleApiError(err).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class ApiError extends Error {
>   constructor(message, status = 500, code = "API_ERROR") {
>     super(message);
>     this.name = "ApiError";
>     this.status = status;
>     this.code = code;
>   }
> }
>
> class ValidationError extends ApiError {
>   constructor(message, fieldErrors = {}) {
>     super(message, 400, "VALIDATION_ERROR");
>     this.name = "ValidationError";
>     this.fieldErrors = fieldErrors;
>   }
> }
>
> function handleApiError(err) {
>   if (err instanceof ValidationError) {
>     return { status: 400, type: "VALIDATION", fields: err.fieldErrors };
>   }
>   if (err instanceof ApiError) {
>     return { status: err.status, type: err.code, message: err.message };
>   }
>   return { status: 500, type: "UNKNOWN", message: "Unexpected server error" };
> }
>
> // Verification tests
> const vErr = new ValidationError("Invalid form data", { email: "Email required" });
> const handled = handleApiError(vErr);
>
> console.assert(handled.status === 400 && handled.type === "VALIDATION", "Test 1 Failed");
> console.assert(handled.fields.email === "Email required", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Custom Error Classes**: Extending native JavaScript Error preserves stack trace while adding domain properties (status, code, fields).
> 2. **instanceof Pattern Matching**: Allows catch blocks to branch logic based on specific error types (ValidationError vs NetworkError).
> 3. **Centralized Error Formatters**: Transforms domain errors into clean HTTP responses in API controllers.
> 
---

### Exercise 3: Error Boundary Logger & Fallback Handler

**Scenario:** An API layer logs unhandled exceptions to remote monitoring services while returning clean fallback state to the UI.

**Requirements:**
1. Write executeWithFallback(taskFn, fallbackData, loggerFn).
2. Execute taskFn.
3. Log error if throws.
4. Return fallbackData on error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeWithFallback(taskFn, fallbackData, loggerFn) {
>   try {
>     return await taskFn();
>   } catch (err) {
>     if (typeof loggerFn === "function") {
>       loggerFn({ message: err.message, stack: err.stack, time: Date.now() });
>     }
>     return fallbackData;
>   }
> }
>
> // Verification tests
> const logs = [];
> const mockLogger = (e) => logs.push(e);
> const brokenTask = async () => { throw new Error("Service Down"); };
>
> executeWithFallback(brokenTask, { items: [] }, mockLogger).then(res => {
>   console.assert(res.items.length === 0, "Test 1 Failed: Must return fallback data");
>   console.assert(logs.length === 1 && logs[0].message === "Service Down", "Test 2 Failed: Error must be logged");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Graceful Degradation**: Returning fallback data allows applications to render degraded UI instead of crashing completely.
> 2. **Silent Error Logging**: Logs errors to monitoring services (Sentry, Datadog) while concealing stack traces from end-users.
> 3. **Boundary Encapsulation**: Isolates unstable third-party API integrations from main application flow.
---

## 6. Related Terms
- [The Response Object (res.json(), res.ok)](response_object.md) — How we check for 400 and 500 status codes inside the `try` block.
- [async / await](async_await.md) — Related concept: async / await.
- [Promises (in the context of networks)](promises.md) — Related concept: Promises (in the context of networks).
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — Related concept: Rate Limiting (429 Too Many Requests).
- [HTTP Status Codes](../level_02/status_codes.md) — Related concept: HTTP Status Codes.

---

## 7. Key Takeaways
- Always wrap `await fetch()` calls inside a **`try / catch`** block.
- The `try` block contains the "happy path" (what happens if everything works).
- The `catch` block contains the fallback logic (show error message to user).
- `fetch()` only jumps to `catch` on physical network failures, not on HTTP error status codes!
