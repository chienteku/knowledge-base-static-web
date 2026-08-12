# HTTP Status Codes

> **Level 9 — REST APIs & Best Practices**
> Standardized 3-digit numbers returned by a server to instantly tell the client's browser if their request succeeded, failed, or requires further action.

---

## 1. Prerequisites
- [REST API Design](rest_api.md) — REST dictates that you must use these codes correctly.
- [The req & res Objects](../level_07/req_res.md) — Where you set the code (`res.status(404)`).

---

## 2. Term Category

**Internet Protocol / Standard (Universal .)**: HTTP Status Codes is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a React frontend sends a login request to an API, and the API returns `{ message: "Bad password" }`, the React app has to manually read the string, parse the English language, and figure out if that means success or failure. What if the backend changes the message to `"Incorrect password"`? The frontend breaks.
**HTTP Status Codes** fix this. They are universal, machine-readable numbers. 
If the React app sees a `401`, it instantly knows the login failed, regardless of what the English text says.

### (2) The 5 Categories
Status codes are grouped by their first digit:
- **1xx (Informational):** "Hold on, I'm thinking." (Rarely used directly by developers).
- **2xx (Success):** "Everything worked perfectly."
  - `200 OK`: Standard success.
  - `201 Created`: Success, and a new resource was created (used for POST requests).
- **3xx (Redirection):** "Go look somewhere else."
  - `301 Moved Permanently`: This URL changed.
- **4xx (Client Error):** "YOU messed up." (The user sent bad data).
  - `400 Bad Request`: You forgot a required field.
  - `401 Unauthorized`: You are not logged in.
  - `403 Forbidden`: You are logged in, but you aren't an admin.
  - `404 Not Found`: You asked for a URL or ID that doesn't exist.
- **5xx (Server Error):** "I messed up." (The server crashed).
  - `500 Internal Server Error`: The database exploded, or a fatal code bug occurred.

### (3) How to use them in Node.js
In Express, you chain the status method before sending the JSON:
```javascript
app.post('/users', (req, res) => {
  if (!req.body.email) {
    // 400 Client Error!
    return res.status(400).json({ error: "Email is required" });
  }
  // 201 Created Success!
  res.status(201).json({ message: "User created" });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Sending a 200 OK for an Error

**The mistake:** A developer catches an error, but forgets to set the status code.
```javascript
app.get('/users/99', (req, res) => {
  // By default, Express sends a 200 OK status!
  res.json({ error: "User 99 does not exist." }); 
});
```

**Why it's wrong:** The frontend sees the `200 OK` status code, assumes the request was successful, and tries to render the user data. It crashes because the data is actually an error message!
**Golden Rule:** Always align your status code with the reality of the situation. An error message must be accompanied by a 4xx or 5xx status code.

---



### Mistake 2: Returning `HTTP 200 OK` for Error Responses with Error Payloads (200 OK Anti-Pattern)

**The mistake:** Returning `HTTP 200 OK` with payload `{ status: 'error', message: 'Unauthorized' }`.

**Why it's wrong:** Returning 200 OK for errors breaks HTTP specifications, client caching, and automated API monitoring tools. Return proper 4xx/5xx HTTP status codes.

*Incorrect:*
```javascript
res.status(200).json({ success: false, error: 'Unauthorized' }); // ❌ 200 OK error anti-pattern!
```

*Fix:*
```javascript
res.status(401).json({ error: 'Unauthorized' }); // Correct 401 status
```

### Mistake 3: Confusing `401 Unauthorized` with `403 Forbidden` Status Codes

**The mistake:** Returning `401 Unauthorized` when a logged-in user tries to access an admin page without admin permissions.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user is not logged in). `403 Forbidden` means **Unauthorized** (user is authenticated but lacks required access permissions).

*Incorrect:*
```javascript
// User logged in as 'member' accessing /admin -> Returning 401
```

*Fix:*
```javascript
// User logged in as 'member' accessing /admin -> Return 403 Forbidden
```

## 5. Practice Exercises

### Exercise 1: HTTP Status Code Semantic Mapper

**Scenario:** Maps application domain error types to standardized HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500).

**Requirements:**
1. Write mapErrorToStatusCode(errorType).
2. Return appropriate HTTP status code.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mapErrorToStatusCode(errorType = "") {
>   switch (errorType.toUpperCase()) {
>     case "INVALID_PAYLOAD":
>     case "MALFORMED_JSON":
>       return 400; // Bad Request
>     case "UNAUTHENTICATED":
>     case "TOKEN_EXPIRED":
>       return 401; // Unauthorized
>     case "FORBIDDEN_SCOPE":
>     case "PERMISSION_DENIED":
>       return 403; // Forbidden
>     case "ENTITY_NOT_FOUND":
>       return 404; // Not Found
>     case "DUPLICATE_ENTRY":
>     case "VERSION_CONFLICT":
>       return 409; // Conflict
>     case "SCHEMA_VALIDATION_FAILED":
>       return 422; // Unprocessable Entity
>     default:
>       return 500; // Internal Server Error
>   }
> }
>
> // Verification tests
> console.assert(mapErrorToStatusCode("UNAUTHENTICATED") === 401, "Test 1 Failed");
> console.assert(mapErrorToStatusCode("DUPLICATE_ENTRY") === 409, "Test 2 Failed");
> console.assert(mapErrorToStatusCode("SCHEMA_VALIDATION_FAILED") === 422, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Status Code Categories**: 2xx (Success), 3xx (Redirection), 4xx (Client Errors), 5xx (Server Errors).
> 2. **401 vs 403 Distinction**: 401 Unauthorized means missing/invalid authentication; 403 Forbidden means authenticated but lacking permissions.
> 3. **409 Conflict vs 422 Unprocessable**: 409 signals state conflicts (duplicate unique keys); 422 signals semantically invalid payloads.
> 
---

### Exercise 2: RESTful Creation and Modification Status Responder

**Scenario:** Selects semantic HTTP response codes (201 Created with Location header, 204 No Content for deletion, 200 OK for queries).

**Requirements:**
1. Write createHttpResponse(actionType, data, resourceUrl).
2. Return status code and headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createHttpResponse(actionType, data = null, resourceUrl = null) {
>   switch (actionType.toUpperCase()) {
>     case "CREATE":
>       return {
>         status: 201, // Created
>         headers: resourceUrl ? { "Location": resourceUrl } : {},
>         body: data
>       };
>     case "DELETE":
>       return {
>         status: 204, // No Content
>         headers: {},
>         body: null
>       };
>     case "UPDATE":
>     case "READ":
>       return {
>         status: 200, // OK
>         headers: {},
>         body: data
>       };
>     default:
>       return { status: 200, headers: {}, body: data };
>   }
> }
>
> // Verification tests
> const res1 = createHttpResponse("CREATE", { id: 1 }, "https://api.com/users/1");
> console.assert(res1.status === 201 && res1.headers.Location === "https://api.com/users/1", "Test 1 Failed");
>
> const res2 = createHttpResponse("DELETE");
> console.assert(res2.status === 204 && res2.body === null, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **201 Created + Location Header**: 201 responses MUST include a `Location` header pointing to the newly created resource URI.
> 2. **204 No Content**: Returned for successful DELETE operations or updates that return no body content.
> 3. **HTTP Spec Adherence**: Prevents returning `200 OK` for error states (anti-pattern).
> 
---

### Exercise 3: Idempotent 409 Conflict vs 422 Unprocessable Evaluator

**Scenario:** Evaluates user registration errors to distinguish between 409 Conflict (email taken) vs 422 Unprocessable Entity (invalid password format).

**Requirements:**
1. Write evaluateRegistrationError(errorReason).
2. Return 409 for duplicate email.
3. Return 422 for weak password.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateRegistrationError(errorReason) {
>   if (errorReason === "EMAIL_ALREADY_EXISTS") {
>     return {
>       status: 409,
>       code: "CONFLICT_EMAIL_TAKEN",
>       message: "The specified email address is already registered."
>     };
>   }
>
>   if (errorReason === "WEAK_PASSWORD_FORMAT") {
>     return {
>       status: 422,
>       code: "UNPROCESSABLE_PASSWORD",
>       message: "Password does not satisfy complexity requirements."
>     };
>   }
>
>   return { status: 400, code: "BAD_REQUEST", message: "Invalid request payload" };
> }
>
> // Verification tests
> console.assert(evaluateRegistrationError("EMAIL_ALREADY_EXISTS").status === 409, "Test 1 Failed");
> console.assert(evaluateRegistrationError("WEAK_PASSWORD_FORMAT").status === 422, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **409 Conflict**: Returned when a request conflicts with current target resource state (e.g., unique key violation).
> 2. **422 Unprocessable Entity**: Returned when server understands payload content type and syntax, but payload fails semantic validation rules.
> 3. **API Clarity**: Distinct status codes allow frontend clients to display accurate UI error notifications.
## 6. Related Terms
- [REST API Design](rest_api.md) — The architecture that relies on these codes.
- [Unhandled Promise Rejections](../level_05/unhandled_rejections.md) — When this happens, the server usually fails to even send a 500 error!
- [The req & res Objects](../level_07/req_res.md) — Related concept: The req & res Objects.
- [Rate Limiting](rate_limiting.md) — Related concept: Rate Limiting.

---

## 7. Key Takeaways
- **Status Codes** are universal 3-digit numbers that indicate the result of an HTTP request.
- **2xx** = Success. **3xx** = Redirects. **4xx** = Client errors (bad data, unauthorized). **5xx** = Server errors (crashes).
- Always explicitly set `res.status()` when returning an error, or the frontend will mistakenly assume the request succeeded.
