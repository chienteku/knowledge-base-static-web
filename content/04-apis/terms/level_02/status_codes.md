# HTTP Status Codes

> **Level 2 — HTTP Anatomy**
> A 3-digit number sent by the Server in its HTTP Response to tell the Client exactly how the request went (Success, Error, Redirect, etc.).

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Status codes are the core feature of the Response phase.

---

## 2. Term Category

**HTTP Standard / Error Handling (Universal Standard)**: HTTP Status Codes is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a Client sends a request, the Server processes it and sends back a Response. But how does the Client know if it worked? 
If the Client asked for User 5, but User 5 doesn't exist, the Server could send back a JSON string: `{"error": "Not Found"}`. But what if a different Server sends `{"message": "Missing user"}`? The Client's code would break trying to parse 100 different error formats.
The W3C created **Status Codes** as a universal, language-agnostic way for Servers to communicate success or failure using simple 3-digit numbers.

### (2) The 5 Categories
You don't need to memorize every code, you just need to know the first digit!
- **`1xx` (Informational)**: "Hold on, I'm still thinking." (Rarely used directly by developers).
- **`2xx` (Success)**: "Everything worked perfectly!"
- **`3xx` (Redirection)**: "The thing you want moved; go look over there instead."
- **`4xx` (Client Error)**: "You messed up." (The Client sent bad data, or isn't logged in).
- **`5xx` (Server Error)**: "I messed up." (The Client's request was fine, but the Server's backend code crashed).

### (3) Reality Metaphor
Imagine ordering food at a drive-thru.
- **`200`**: They hand you your food.
- **`301`**: There's a sign on the window saying "We moved across the street!"
- **`400`**: You ask for a "McWhopper" at a Wendy's. The cashier tells you that you are making a bad, invalid request.
- **`500`**: The restaurant is on fire. Your request was fine, but they physically cannot fulfill it.

### (4) The Most Important Codes to Memorize
- **`200 OK`**: Standard success.
- **`201 Created`**: Success, and a new database record was created (Usually sent after a POST).
- **`400 Bad Request`**: The Client sent invalid data (e.g., missing a required password field).
- **`401 Unauthorized`**: The Client didn't provide a valid API Key or Login Token.
- **`403 Forbidden`**: The Client is logged in, but doesn't have Admin permissions to do this.
- **`404 Not Found`**: The URL or resource does not exist.
- **`500 Internal Server Error`**: The backend code threw an unhandled exception and crashed.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Always returning `200 OK` even on errors

**The mistake:** A backend developer catches an error in their code, and sends a response: `res.status(200).json({ error: "User not found" })`.

**Why it's wrong:** The HTTP Status Code is `200 OK`. The browser, the network proxies, and the frontend JavaScript `fetch()` API will all look at the `200` and say "Great, it succeeded!" They won't read your custom JSON body. 
Frontend code relies on `res.ok` (which checks for `2xx` status codes) to know whether to show a green success toast or a red error toast. If you send errors with a `200` status, you break the entire architecture of the web!
**Golden Rule:** Always map your backend logic to the correct HTTP status code. If it's an error, send a `4xx` or `5xx`.

---

### Mistake 2: Returning `200 OK` for API Error Responses ("200 OK Error Anti-Pattern")

**The mistake:** Returning HTTP `200 OK` with payload `{ success: false, error: 'Unauthorized' }`.

**Why it's wrong:** HTTP status codes communicate protocol-level status. Returning 200 OK breaks API client monitoring, caching layers, and `fetch().ok` checks. Use proper 4xx/5xx status codes.

*Incorrect:*
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"status": 401, "error": "Invalid credentials"} // ❌ Misleads HTTP proxies and client libraries!
```

*Fix:*
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error": "Invalid credentials"}
```

---

### Mistake 3: Confusing `401 Unauthorized` with `403 Forbidden`

**The mistake:** Returning `401 Unauthorized` when a logged-in user attempts to access an admin endpoint.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user has not provided valid credentials/login). `403 Forbidden` means **Unauthorized** (server knows who you are, but you lack permission).

*Incorrect:*
```http
/* User is logged in as 'member', attempting to access admin route */
HTTP/1.1 401 Unauthorized ; ❌ Incorrect! User IS authenticated!
```

*Fix:*
```http
HTTP/1.1 403 Forbidden ; Correct code: User authenticated, but forbidden permission
```


---

## 5. Practice Exercises

### Exercise 1: REST Error Response Factory with Standard Status Codes

**Scenario:** An API framework builds a factory function that generates consistent JSON error response payloads for common HTTP status codes.

**Requirements:**
1. Write createErrorResponse(statusCode, customDetail).
2. Map status codes (400, 401, 403, 404, 409, 429, 500) to standard titles.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createErrorResponse(statusCode, customDetail = null) {
>   const statusTitles = {
>     400: "Bad Request",
>     401: "Unauthorized",
>     403: "Forbidden",
>     404: "Not Found",
>     409: "Conflict",
>     429: "Too Many Requests",
>     500: "Internal Server Error"
>   };
>
>   const title = statusTitles[statusCode] || "Unknown Error";
>
>   return {
>     status: statusCode,
>     error: {
>       code: statusCode,
>       title,
>       detail: customDetail || title,
>       timestamp: new Date().toISOString()
>     }
>   };
> }
>
> // Verification tests
> const err404 = createErrorResponse(404, "User #42 not found");
> console.assert(err404.status === 404, "Test 1 Failed");
> console.assert(err404.error.title === "Not Found", "Test 2 Failed");
> console.assert(err404.error.detail === "User #42 not found", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Standardized Error Payloads**: Returning uniform JSON error structures (code, title, detail) improves client error handling.
> 2. **RFC 7807 (Problem Details)**: Industry standard format for HTTP API error details.
> 3. **Status Code Semantics**: 400 (Syntax error), 401 (Unauthenticated), 403 (Unauthorized), 404 (Missing), 409 (State collision).
> 
---

### Exercise 2: Automatic Retry Logic for 5xx and 429 Status Codes

**Scenario:** An API client implements intelligent retry logic that retries requests ONLY when receiving 5xx server errors or 429 rate limit responses.

**Requirements:**
1. Write executeWithRetry(fetchFn, maxRetries).
2. Retry on 500, 502, 503, 504, or 429.
3. Do NOT retry on 400, 401, 403, 404.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeWithRetry(fetchFn, maxRetries = 2) {
>   let attempt = 0;
>   while (attempt <= maxRetries) {
>     const res = await fetchFn();
>     const shouldRetry = res.status === 429 || (res.status >= 500 && res.status <= 599);
>
>     if (!shouldRetry || attempt === maxRetries) {
>       return res;
>     }
>
>     attempt++;
>   }
> }
>
> // Verification tests
> let calls = 0;
> const mockFetch = async () => {
>   calls++;
>   if (calls === 1) return { status: 503 };
>   return { status: 200, data: "ok" };
> };
>
> executeWithRetry(mockFetch, 2).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(calls === 2, "Test 2 Failed: Should retry once on 503");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Transient vs Permanent Errors**: 5xx server errors and 429 rate limits are transient and safe to retry; 4xx client errors are permanent.
> 2. **429 Too Many Requests**: Indicates client exceeded rate limit threshold; usually paired with Retry-After header.
> 3. **Exponential Backoff**: Retries should incorporate exponential delays to avoid overwhelming recovering servers.
> 
---

### Exercise 3: 201 Created vs 202 Accepted Response Disambiguator

**Scenario:** An API task manager returns 201 Created for synchronous resource creation, and 202 Accepted for long-running async background jobs.

**Requirements:**
1. Write handleTaskSubmission(taskPayload, isAsyncJob).
2. Return 201 Created with resource URL if sync.
3. Return 202 Accepted with status check URL if async.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTaskSubmission(taskPayload, isAsyncJob = false) {
>   if (isAsyncJob) {
>     const jobId = `job_${Date.now()}`;
>     return {
>       status: 202,
>       headers: { "Location": `/api/jobs/${jobId}` },
>       body: { message: "Task accepted for processing", jobId, statusUrl: `/api/jobs/${jobId}` }
>     };
>   }
>
>   const resourceId = `res_${Date.now()}`;
>   return {
>     status: 201,
>     headers: { "Location": `/api/resources/${resourceId}` },
>     body: { id: resourceId, ...taskPayload }
>   };
> }
>
> // Verification tests
> const syncRes = handleTaskSubmission({ name: "Doc1" }, false);
> console.assert(syncRes.status === 201 && syncRes.headers.Location.includes("resources"), "Test 1 Failed");
>
> const asyncRes = handleTaskSubmission({ name: "Doc2" }, true);
> console.assert(asyncRes.status === 202 && asyncRes.headers.Location.includes("jobs"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **201 Created**: Indicates request succeeded and a new resource was created synchronously.
> 2. **202 Accepted**: Indicates request was accepted for asynchronous processing, but processing is not complete.
> 3. **Location Header Contract**: Both 201 and 202 responses return Location header pointing to the created resource or job status endpoint.
---

## 6. Related Terms
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — How we check the status code in JavaScript using `response.status` and `response.ok`.
- [Request & Response Lifecycle](../level_01/request_response.md) — Related concept: Request & Response Lifecycle.
- [Caching (ETag, Cache-Control)](../level_06/caching.md) — Related concept: Caching (ETag, Cache-Control).
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — Related concept: Rate Limiting (429 Too Many Requests).
- [HTTP Methods (Verbs)](http_methods.md) — Status codes per HTTP method.
- [Error Handling (try / catch)](../level_05/error_handling.md) — API error status codes.

---

## 7. Key Takeaways
- Status Codes are a 3-digit standard for communicating success/failure over the network.
- **`2xx` = Success.**
- **`4xx` = Client Error** (Frontend messed up: Bad data, not logged in, wrong URL).
- **`5xx` = Server Error** (Backend messed up: Database down, code crashed).
- **NEVER** return a `200` status code if the operation actually failed!
