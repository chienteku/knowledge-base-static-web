# HTTP Methods (Verbs)

> **Level 2 — HTTP Anatomy**
> The specific action a Client wants to perform on a Server's resource, indicated by a standardized keyword in the HTTP request.

---

## 1. Prerequisites
- [HTTP / HTTPS](../level_01/http_https.md) — Methods are the very first word in every HTTP request.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — You use a Method to tell the server *what* to do with the URL.

---

## 2. Term Category

**HTTP Standard / Protocol Action (Universal Standard .)**: HTTP Methods (Verbs) is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a Client sends a request to `https://api.github.com/users/chienteku`, what does it want? 
Does it want to *read* the user's profile? Does it want to *delete* the user's profile? Does it want to *update* the user's bio? The URL only points to the resource; it doesn't tell the Server what action to take. 
To solve this ambiguity, the HTTP protocol requires every request to start with a specific **Method (or Verb)**. This tells the server exactly what the Client's intention is.

### (2) The 5 Core Methods
While there are dozens of HTTP methods, full-stack developers rely on these five (which map perfectly to CRUD operations: Create, Read, Update, Delete):
1. **`GET`**: "Please give me this data." (Read-only. Should never modify the database).
2. **`POST`**: "Here is some brand new data; please create a new record in the database." (Create).
3. **`PUT`**: "Please completely replace the existing record at this URL with this new data." (Update/Replace).
4. **`PATCH`**: "Please partially update the existing record (e.g., just change the email, leave the rest alone)." (Partial Update).
5. **`DELETE`**: "Please delete this record from the database." (Delete).

### (3) Reality Metaphor
Imagine a massive file cabinet at a doctor's office. The URL is the folder labeled "Patient: Bob".
- `GET`: You pull the folder out to read Bob's blood type.
- `POST`: You create a brand new folder for a new patient and shove it into the cabinet.
- `PUT`: You throw away Bob's old medical history and replace it entirely with a brand new stack of papers.
- `PATCH`: You simply cross out Bob's old phone number and write in his new one.
- `DELETE`: You put Bob's folder in the shredder.

### (4) Code Examples

#### Standard Browser Behavior
When you type a URL into Chrome and hit Enter, your browser **ALWAYS** sends a `GET` request. 
```http
GET /users/123 HTTP/1.1
Host: api.example.com
```

#### Fetch API (Client-Side JavaScript)
If you want to send a `POST` or `DELETE`, you have to write JavaScript to manually tell the browser to change the verb!
```javascript
// Telling the browser to send a POST request instead of the default GET
fetch('https://api.example.com/users', {
  method: 'POST',
  body: JSON.stringify({ name: "Alice" })
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using GET to modify data

**The mistake:** A developer builds an endpoint `GET /api/deleteUser?id=5`, and when the server receives it, it deletes User 5 from the database.

**Why it's wrong:** `GET` requests are defined as **safe and idempotent**. This means browsers, proxies, and search engines assume they can aggressively fire `GET` requests to pre-load data because reading data shouldn't hurt anything. If Google's web scraper finds your `/api/deleteUser` link, it will send a `GET` request to it just to see what's there, accidentally deleting your users! 
**Golden Rule:** NEVER use `GET` to alter the database. Use `DELETE`, `POST`, `PUT`, or `PATCH`.

---

### Mistake 2: Using `GET` Requests for Operations That Modify Server State

**The mistake:** Creating a GET endpoint `/api/users/delete?id=5` to delete database records.

**Why it's wrong:** GET requests are designated as Safe and Idempotent. Web crawlers (Googlebot) and browser pre-fetchers will automatically follow GET links, causing unintended database deletions.

*Incorrect:*
```http
GET /api/users/delete?id=5 HTTP/1.1 ; ❌ Modifies server state via GET!
```

*Fix:*
```http
DELETE /api/users/5 HTTP/1.1 ; Correct semantic DELETE method
```

---

### Mistake 3: Confusing `PUT` (Full Replacement) with `PATCH` (Partial Update)

**The mistake:** Sending a `PUT /users/5` request with payload `{ email: 'new@example.com' }` expecting only the email to update.

**Why it's wrong:** `PUT` replaces the ENTIRE resource target. Sending partial fields via `PUT` should set missing fields to `null` or defaults. Use `PATCH` for partial field updates.

*Incorrect:*
```http
/* PUT request intended to update only 1 field */
PUT /users/5 HTTP/1.1

{"email": "new@example.com"} // ❌ Erases user's name and address!
```

*Fix:*
```http
PATCH /users/5 HTTP/1.1

{"email": "new@example.com"} // Safely updates specified fields only
```


---

## 5. Practice Exercises

### Exercise 1: REST API Method Router Dispatcher

**Scenario:** A lightweight API router dispatches HTTP requests to resource handlers based on HTTP method verb.

**Requirements:**
1. Write dispatchRestMethod(method, resourceId, payload, dbStore).
2. GET: Read resource.
3. POST: Create resource.
4. DELETE: Remove resource.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchRestMethod(method, resourceId, payload, dbStore = new Map()) {
>   const m = method.toUpperCase();
>
>   switch (m) {
>     case "GET":
>       if (!dbStore.has(resourceId)) return { status: 404, data: null };
>       return { status: 200, data: dbStore.get(resourceId) };
>
>     case "POST":
>       if (dbStore.has(resourceId)) return { status: 409, error: "Already Exists" };
>       dbStore.set(resourceId, payload);
>       return { status: 201, data: payload };
>
>     case "DELETE":
>       if (!dbStore.has(resourceId)) return { status: 404, data: null };
>       dbStore.delete(resourceId);
>       return { status: 204, data: null };
>
>     default:
>       return { status: 45, error: "Method Not Allowed" };
>   }
> }
>
> // Verification tests
> const db = new Map();
>
> const postRes = dispatchRestMethod("POST", "u101", { name: "Alice" }, db);
> console.assert(postRes.status === 201, "Test 1 Failed");
>
> const getRes = dispatchRestMethod("GET", "u101", null, db);
> console.assert(getRes.status === 200 && getRes.data.name === "Alice", "Test 2 Failed");
>
> const delRes = dispatchRestMethod("DELETE", "u101", null, db);
> console.assert(delRes.status === 204, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Method Verbs**: GET (retrieve), POST (create), PUT (replace), PATCH (update), DELETE (remove).
> 2. **REST Semantics**: HTTP methods specify desired action on identified URL resource.
> 3. **204 No Content Response**: Standard response code for successful DELETE operations returning no response body.
> 
---

### Exercise 2: PATCH Partial Update vs PUT Full Replacement Handler

**Scenario:** A REST service distinguishes between PUT (full entity replacement) and PATCH (partial property updates).

**Requirements:**
1. Write applyResourceUpdate(existingObj, updateData, method).
2. PUT: Replace object entirely.
3. PATCH: Merge updated fields only.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function applyResourceUpdate(existingObj, updateData, method) {
>   if (!existingObj) return updateData;
>   const m = method.toUpperCase();
>
>   if (m === "PUT") {
>     // Full replacement: ID is retained, all other properties replaced
>     return { id: existingObj.id, ...updateData };
>   }
>   if (m === "PATCH") {
>     // Partial update: merge fields into existing object
>     return { ...existingObj, ...updateData };
>   }
>   throw new Error(`Invalid update method: ${method}`);
> }
>
> // Verification tests
> const current = { id: 1, name: "Alice", role: "User", active: true };
>
> const putResult = applyResourceUpdate(current, { name: "Alice Smith" }, "PUT");
> console.assert(putResult.role === undefined, "Test 1 Failed: PUT replaces unmentioned fields");
>
> const patchResult = applyResourceUpdate(current, { name: "Alice Smith" }, "PATCH");
> console.assert(patchResult.role === "User", "Test 2 Failed: PATCH preserves unmentioned fields");
> ```
>
> #### Technical Explanation
>
> 1. **PUT Semantics**: PUT replaces the target resource representation entirely with request payload.
> 2. **PATCH Semantics**: PATCH applies partial modifications specified in payload to the target resource.
> 3. **Data Safety**: Using PATCH prevents accidentally overwriting unmentioned properties with nulls.
> 
---

### Exercise 3: CORS Preflight OPTIONS Request Handler

**Scenario:** An API server handles CORS preflight OPTIONS requests, returning allowed methods and origin headers.

**Requirements:**
1. Write handleCorsPreflight(requestHeaders, allowedMethods).
2. Check Access-Control-Request-Method.
3. Return 204 response with CORS headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleCorsPreflight(requestHeaders, allowedMethods = ["GET", "POST", "PUT", "DELETE"]) {
>   const reqMethod = requestHeaders?.["access-control-request-method"] || requestHeaders?.["Access-Control-Request-Method"];
>   if (!reqMethod) {
>     return { status: 400, headers: {} };
>   }
>
>   if (!allowedMethods.includes(reqMethod.toUpperCase())) {
>     return { status: 403, headers: {} };
>   }
>
>   return {
>     status: 204,
>     headers: {
>       "Access-Control-Allow-Origin": "*",
>       "Access-Control-Allow-Methods": allowedMethods.join(", "),
>       "Access-Control-Allow-Headers": "Content-Type, Authorization",
>       "Access-Control-Max-Age": "86400"
>     }
>   };
> }
>
> // Verification tests
> const res = handleCorsPreflight({ "Access-Control-Request-Method": "POST" });
> console.assert(res.status === 204, "Test 1 Failed");
> console.assert(res.headers["Access-Control-Allow-Methods"].includes("POST"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **OPTIONS Method Purpose**: Queries target server for supported communication options without triggering side-effects.
> 2. **CORS Preflight Mechanics**: Browsers automatically send OPTIONS request before cross-origin non-simple requests.
> 3. **Access-Control-Max-Age**: Caches preflight response in browser to reduce preflight latency on subsequent calls.
---

## 6. Related Terms
- [CRUD Operations](../level_03/crud.md) — The programming concept that HTTP Methods map to.
- [Idempotency](../level_06/idempotency.md) — The mathematical concept explaining why `PUT` and `POST` are treated differently in network retry logic.
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).
- [Idempotent vs Safe Methods](idempotent_vs_safe_methods.md) — Safe and idempotent HTTP methods.
- [HTTP Status Codes](status_codes.md) — HTTP status codes.

---

## 7. Key Takeaways
- Every HTTP request must include a **Method (Verb)** indicating its intention.
- **GET**: Read data. **POST**: Create data. **PUT**: Replace data. **PATCH**: Update data. **DELETE**: Destroy data.
- Never use `GET` for destructive actions, because browsers assume `GET` requests are safe to pre-fetch and cache!
