# Idempotent vs Safe Methods

> **Level 2 — HTTP Anatomy**
> Which verbs are safe (GET) vs idempotent (PUT/DELETE) vs neither (POST).

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](http_methods.md) — The standard verbs defining request actions.

---

## 2. Term Category

**Networking Protocol (Universal: Governs the design of web APIs and client retry logic.)**: Idempotent vs Safe Methods is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing network code, client devices must handle unreliable connections. If a client sends a request to update a profile, but the network connection drops before receiving the server's reply, the client does not know if the update succeeded. 

Can the client safely retry sending the exact same request automatically?

To establish a clear contract between clients and servers, the HTTP specification categorizes HTTP methods based on two semantic properties: **Safety** and **Idempotency**.

#### Safe Methods (Read-Only)
An HTTP method is **safe** if executing it **does not modify server resource state**.
- **Behavior:** These are strictly "read-only" operations.
- **Safe Verbs:** `GET`, `HEAD`, `OPTIONS`.
- **Optimization:** Because they are safe, browsers can aggressively cache responses, pre-fetch them, and retry them automatically without asking the user.

#### Idempotent Methods (Single-Effect)
An HTTP method is **idempotent** if making **multiple identical requests has the same effect as making a single request**. The server's state ends up exactly the same whether you call the method once or 100 times.
- **Idempotent Verbs:** `GET`, `HEAD`, `OPTIONS` (all safe methods are idempotent), plus **`PUT`** (replacing a resource) and **`DELETE`** (removing a resource).
  - *`PUT /users/42 {"name": "Bob"}`* is idempotent. If you repeat it, the name remains `"Bob"`.
  - *`DELETE /users/42`* is idempotent. The user is deleted on the first call. Subsequent calls return `404 Not Found`, but the *server state* (user 42 is gone) remains unchanged.

#### Non-Idempotent Methods (Accumulative)
- **`POST` is not idempotent:** Sending `POST /users {"name": "Bob"}` five times will create five separate database rows with five unique IDs.
- **`PATCH` is generally not idempotent:** While `PATCH /users/42 {"age": 30}` is idempotent, a patch operation that increments a value (`PATCH /users/42 {"score": {"$inc": 1}}`) is not.

### (2) Reality Metaphor
Imagine a panel containing light switches and buttons.
- A **Safe Method (`GET`)** is like **reading the label** on a switch. You look at it to see if it says "Living Room". Reading it does not move the switch or change the lighting state.
- An **Idempotent Method (`PUT`/`DELETE`)** is like pushing a **"Turn On" button**. If the light is off, pushing it once turns it on. Pushing it 100 times leaves the light on. The final state is identical.
- A **Non-Idempotent Method (`POST`)** is like pushing a **clicker counter button**. Every time you push the button, the counter increments. Pushing it 10 times results in a value of 10.

### (3) API State Examples (Database operations)

```javascript
// GET /user/42 (Safe & Idempotent)
// Multiple reads yield the same record without changing database state.
function handleGet(id) {
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

// PUT /user/42 (Idempotent, NOT Safe)
// Overwrites state. Running it 10 times leaves age at 30.
function handlePut(id, newAge) {
  db.query("UPDATE users SET age = ? WHERE id = ?", [newAge, id]);
}

// POST /user (NOT Idempotent, NOT Safe)
// Running it 3 times inserts 3 distinct rows.
function handlePost(userData) {
  db.query("INSERT INTO users (name) VALUES (?)", [userData.name]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Modifying state inside a GET request

**The mistake:** Creating a delete link using a GET request (e.g. `<a href="/api/users/delete?id=42">Delete</a>`).

**Why it's wrong:** GET requests are defined as safe. Because they are safe, web browsers, search engine crawlers (like Googlebot), and pre-fetching plugins will aggressively follow these links automatically to index your pages. If you delete data on a GET request, a web crawler visiting your site will silently delete your entire database.

*Incorrect:*
```javascript
// Server route:
app.get('/api/users/delete', (req, res) => {
  db.deleteUser(req.query.id); // VULNERABILITY: State mutation on GET!
});
```

*Fix:* Use the correct `DELETE` verb, triggered via a client script or form submit.

---

### Mistake 2: Assuming `POST` Operations Are Idempotent

**The mistake:** Retrying a failed `POST /api/orders` request automatically without an idempotency key.

**Why it's wrong:** `POST` is neither safe nor idempotent. Retrying a `POST` payment or order request creates duplicate transactions and double-charges the customer.

*Incorrect:*
```javascript
// Automatic retry loop on failed POST
for(let i = 0; i < 3; i++) {
  await fetch('/api/orders', { method: 'POST', body: orderData }); // ❌ Creates 3 duplicate orders!
}
```

*Fix:*
```javascript
// Include Idempotency-Key header when retrying POST operations:
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Idempotency-Key': 'unique-order-uuid' },
  body: orderData
});
```

---

### Mistake 3: Making `DELETE` Operations Non-Idempotent

**The mistake:** Designing a `DELETE /api/queue/items` endpoint that pops the top item off a queue.

**Why it's wrong:** Calling `DELETE` repeatedly on an idempotent endpoint must result in the same server state. Popping items alters state on every execution, violating idempotency contracts.

*Incorrect:*
```http
DELETE /api/queue/next HTTP/1.1 ; ❌ Pops a different item on every call!
```

*Fix:*
```http
DELETE /api/queue/items/item-123 HTTP/1.1 ; Targeted item deletion is idempotent
```


---

## 5. Practice Exercises

### Exercise 1: Safe vs Idempotent Request Retry Safety Guard

**Scenario:** An HTTP client retry engine inspects HTTP methods to determine whether failed requests can be safely retried without duplicate side-effects.

**Requirements:**
1. Write canSafelyRetry(method, statusCode).
2. Safe & Idempotent methods (GET, PUT, DELETE) can be retried.
3. Non-idempotent methods (POST) can only be retried if error occurred BEFORE server execution.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function canSafelyRetry(method, statusCode, requestSent = true) {
>   const m = method.toUpperCase();
>   const idempotentMethods = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];
>
>   if (idempotentMethods.includes(m)) {
>     // Idempotent requests can always be retried on network or 5xx server errors
>     return statusCode >= 500 || statusCode === 0;
>   }
>
>   // Non-idempotent (POST) requests can ONLY be retried if connection failed BEFORE request was sent
>   if (m === "POST" && !requestSent) {
>     return true;
>   }
>
>   return false;
> }
>
> // Verification tests
> console.assert(canSafelyRetry("GET", 503, true) === true, "Test 1 Failed: GET is idempotent and safe to retry");
> console.assert(canSafelyRetry("PUT", 500, true) === true, "Test 2 Failed: PUT is idempotent");
> console.assert(canSafelyRetry("POST", 500, true) === false, "Test 3 Failed: POST is non-idempotent");
> ```
>
> #### Technical Explanation
>
> 1. **Safe Methods**: GET, HEAD, OPTIONS read data without modifying server state.
> 2. **Idempotent Methods**: GET, PUT, DELETE produce identical server state regardless of how many times executed.
> 3. **Retry Policy Risks**: Retrying failed POST requests carries risk of duplicate payments or duplicate records.
> 
---

### Exercise 2: Idempotency-Key Header Middleware for Safe POST Retries

**Scenario:** A billing API enforces an `Idempotency-Key` header on POST requests to guarantee payment requests are processed at most once.

**Requirements:**
1. Write processIdempotentPost(idempotencyKey, payload, cacheMap).
2. If key exists in cacheMap, return cached response.
3. Else process request, store response in cacheMap, and return.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processIdempotentPost(idempotencyKey, payload, cacheMap = new Map()) {
>   if (!idempotencyKey || typeof idempotencyKey !== "string") {
>     return { status: 400, error: "Missing Idempotency-Key header" };
>   }
>
>   if (cacheMap.has(idempotencyKey)) {
>     return {
>       status: 200,
>       cached: true,
>       body: cacheMap.get(idempotencyKey)
>     };
>   }
>
>   // Simulate payment processing
>   const responseBody = { chargeId: `ch_${Date.now()}`, amount: payload.amount };
>   cacheMap.set(idempotencyKey, responseBody);
>
>   return {
>     status: 201,
>     cached: false,
>     body: responseBody
>   };
> }
>
> // Verification tests
> const cache = new Map();
> const key = "key-uuid-12345";
> const payload = { amount: 50 };
>
> const res1 = processIdempotentPost(key, payload, cache);
> console.assert(res1.status === 201 && res1.cached === false, "Test 1 Failed");
>
> const res2 = processIdempotentPost(key, payload, cache);
> console.assert(res2.status === 200 && res2.cached === true, "Test 2 Failed");
> console.assert(res1.body.chargeId === res2.body.chargeId, "Test 3 Failed: Must return identical charge ID");
> ```
>
> #### Technical Explanation
>
> 1. **Idempotency-Key Pattern**: Client sends unique UUID header with non-idempotent requests (POST).
> 2. **Deduplication Storage**: Server caches response by key; subsequent duplicate requests return cached result without re-executing.
> 3. **Financial API Standard**: Standard practice in payment APIs (Stripe, PayPal) to handle retries safely.
> 
---

### Exercise 3: HTTP Method Safety Matrix Auditor

**Scenario:** An API linter inspects endpoint route definitions and verifies that GET routes contain zero mutation side-effects.

**Requirements:**
1. Write auditRouteSafety(routeDef).
2. Verify GET routes do not execute DB writes.
3. Return audit result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditRouteSafety(routeDef) {
>   if (!routeDef || !routeDef.method || typeof routeDef.handler !== "function") {
>     return { valid: false };
>   }
>
>   const isGet = routeDef.method.toUpperCase() === "GET";
>   const performsWrite = routeDef.hasSideEffects || false;
>
>   if (isGet && performsWrite) {
>     return {
>       valid: false,
>       error: "Violation: GET route performs mutation side-effects"
>     };
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> const badGet = { method: "GET", path: "/delete-user", hasSideEffects: true };
> console.assert(auditRouteSafety(badGet).valid === false, "Test 1 Failed");
>
> const goodGet = { method: "GET", path: "/user-info", hasSideEffects: false };
> console.assert(auditRouteSafety(goodGet).valid === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **GET Side-Effect Prohibition**: RFC specifications strictly prohibit GET requests from performing state-modifying side-effects.
> 2. **Web Crawler Risk**: Search engine web crawlers follow GET links automatically; side-effecting GETs cause accidental data loss.
> 3. **HTTP Compliance**: Keeps API implementations aligned with standard web architecture expectations.
---

## 6. Related Terms
- [Statelessness](../level_03/statelessness.md) — The architectural constraint requiring requests to carry their own state.
- [CRUD Operations](../level_03/crud.md) — The persistent database actions mapped to HTTP verbs.
- [Idempotency Keys](../level_06/idempotency_keys.md) — Related concept: Idempotency Keys.
- [HTTP Methods (Verbs)](http_methods.md) — Related concept: HTTP Methods (Verbs).

---

## 7. Key Takeaways
- Safe methods (GET, HEAD) never modify server state and are read-only.
- Idempotent methods (GET, PUT, DELETE) have the same final effect on server state whether called once or 100 times.
- POST is neither safe nor idempotent; repeating it duplicates resources.
- Browsers and routers are permitted to retry failed idempotent requests automatically, but will prompt the user before retrying a POST request.
- Never write state-mutating logic (like deleting rows) inside GET handlers.
