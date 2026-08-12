# REST API Design

> **Level 9 — REST APIs & Best Practices**
> A strict set of architectural rules and naming conventions for building web APIs, ensuring that developers across the world can understand how to interact with your server without needing a manual.

---

## 1. Prerequisites
- [JSON (JavaScript Object Notation)](../../../04-apis/terms/level_01/json.md) — The language REST APIs speak.

---

## 2. Term Category

**Architecture / Design Philosophy (System Architecture)**: REST API Design is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, every developer named their API routes differently.
- Bob: `app.get('/get_all_users')` and `app.post('/create-new-user')`
- Alice: `app.get('/users/all')` and `app.post('/users/add')`
This chaos meant that if you wanted to connect to 5 different APIs, you had to read 5 different manuals just to figure out what the URLs were. 
**REST (Representational State Transfer)** was created to standardize this. If an API is "RESTful," you instantly know exactly how the routes are named and what HTTP methods to use, even if you've never seen the code before.

### (2) The Rules of REST
REST forces you to treat everything as a "Resource" (a noun, never a verb). 
Instead of putting the action in the URL (`/create-user`), you put the action in the **HTTP Method** (POST), and the resource in the URL (`/users`).

**The Standard CRUD (Create, Read, Update, Delete) Mapping:**
- **`GET /users`**: Return a list of all users.
- **`GET /users/12`**: Return the specific user with ID 12.
- **`POST /users`**: Create a brand new user. (Data is in the body).
- **`PUT /users/12`**: Completely replace user 12.
- **`PATCH /users/12`**: Partially update user 12 (e.g., just change their email).
- **`DELETE /users/12`**: Delete user 12.

### (3) Statelessness
The most important technical rule of REST is **Statelessness**. The server must not remember the client between requests. 
If a user logs in, the server doesn't keep a sticky note saying "User 12 is logged in." Instead, every single request the user makes must contain an ID badge (like a JWT Token) proving who they are. This allows the server to scale instantly to millions of users without running out of memory tracking them.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Verbs in the URL

**The mistake:** A developer creates a REST API and writes the following route: `app.post('/users/12/delete')`.

**Why it's wrong:** This violates the core rule of REST! The URL must only contain Nouns (the resource). The action must be defined by the HTTP Method.
**Golden Rule:** If you see an action verb (`get`, `create`, `delete`, `update`) in your URL path, your API is not RESTful. The correct route is `app.delete('/users/12')`.

---



### Mistake 2: Using Verb Verbs in REST Resource URIs (`GET /getUsers`, `POST /deleteUser/1`)

**The mistake:** Designing REST URIs like `/getUsers` or `/updateProduct`.

**Why it's wrong:** REST architecture dictates URIs should represent **Nouns** (resources), while **HTTP Verbs** (`GET`, `POST`, `PUT`, `DELETE`) specify actions.

*Incorrect:*
```javascript
app.get('/getUsers', ...); // ❌ Anti-pattern verb in URI!
app.post('/deleteUser/:id', ...);
```

*Fix:*
```javascript
app.get('/users', ...); // GET fetches resource
app.delete('/users/:id', ...); // DELETE removes resource
```

### Mistake 3: Using `PUT` Instead of `PATCH` for Partial Resource Updates

**The mistake:** Using `PUT /users/1` to update only the user's `email` field.

**Why it's wrong:** HTTP `PUT` implies FULL replacement of the target resource object. HTTP `PATCH` is designated for PARTIAL resource updates.

*Incorrect:*
```javascript
// Updating single field via PUT endpoint
```

*Fix:*
```javascript
app.patch('/users/:id', (req, res) => { ... }); // Partial update via PATCH
```

## 5. Practice Exercises

### Exercise 1: RESTful Resource Endpoint Dispatcher

**Scenario:** Implements a RESTful resource dispatcher executing CRUD actions based on standard HTTP verbs.

**Requirements:**
1. Write dispatchRestResource(method, resourceId, payload, serviceMock).
2. GET (read), POST (create), PUT (update), DELETE (remove).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function dispatchRestResource(method, resourceId, payload, serviceMock) {
>   const verb = (method || "GET").toUpperCase();
>
>   switch (verb) {
>     case "GET":
>       if (resourceId) {
>         const item = await serviceMock.getById(resourceId);
>         return item ? { status: 200, body: item } : { status: 404, body: { error: "NOT_FOUND" } };
>       }
>       return { status: 200, body: await serviceMock.list() };
>
>     case "POST":
>       const created = await serviceMock.create(payload);
>       return { status: 201, body: created };
>
>     case "PUT":
>       const updated = await serviceMock.update(resourceId, payload);
>       return updated ? { status: 200, body: updated } : { status: 404, body: { error: "NOT_FOUND" } };
>
>     case "DELETE":
>       const deleted = await serviceMock.remove(resourceId);
>       return deleted ? { status: 204, body: null } : { status: 404, body: { error: "NOT_FOUND" } };
>
>     default:
>       return { status: 405, body: { error: "METHOD_NOT_ALLOWED" } };
>   }
> }
>
> // Verification tests
> const mockService = {
>   getById: async (id) => id === "1" ? { id: 1 } : null,
>   create: async (data) => ({ id: 2, ...data }),
>   remove: async (id) => id === "1"
> };
>
> dispatchRestResource("POST", null, { name: "New" }, mockService).then(res => {
>   console.assert(res.status === 201, "Test 1 Failed: POST returned 201 Created");
> });
>
> dispatchRestResource("DELETE", "1", null, mockService).then(res => {
>   console.assert(res.status === 204, "Test 2 Failed: DELETE returned 204 No Content");
> });
> ```
>
> #### Technical Explanation
>
> 1. **RESTful Resource Naming**: Plural nouns identify resources (`/users`), not verbs (`/getUsers`).
> 2. **HTTP Verbs Semantics**: GET (retrieve), POST (create), PUT (replace), PATCH (partial update), DELETE (remove).
> 3. **Stateless Architecture**: REST requests contain all necessary authentication and context data without relying on server-side session state.
> 
---

### Exercise 2: Idempotent HTTP PUT vs Non-Idempotent POST Handler

**Scenario:** Demonstrates idempotency guarantees by comparing idempotent PUT (full replacement) vs non-idempotent POST (new entity creation).

**Requirements:**
1. Write handlePutRequest(recordId, payload, storeMap).
2. Write handlePostRequest(payload, storeMap).
3. Verify idempotency.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePutRequest(recordId, payload, storeMap = new Map()) {
>   // Idempotent: Executing 1 time or 100 times results in the EXACT SAME state!
>   const record = { id: recordId, ...payload, updatedAt: "STATIC_TIMESTAMP" };
>   storeMap.set(recordId, record);
>   return { status: 200, record };
> }
>
> function handlePostRequest(payload, storeMap = new Map()) {
>   // Non-Idempotent: Executing 100 times creates 100 distinct entities!
>   const newId = storeMap.size + 1;
>   const record = { id: newId, ...payload };
>   storeMap.set(newId, record);
>   return { status: 201, record };
> }
>
> // Verification tests
> const store = new Map();
> handlePutRequest(42, { name: "Alice" }, store);
> handlePutRequest(42, { name: "Alice" }, store);
> console.assert(store.size === 1, "Test 1 Failed: PUT is idempotent (size stays 1)");
>
> handlePostRequest({ name: "Bob" }, store);
> handlePostRequest({ name: "Bob" }, store);
> console.assert(store.size === 3, "Test 2 Failed: POST is non-idempotent (created 2 new records)");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Method Idempotency**: An HTTP method is idempotent if executing it multiple times yields the same server state as a single execution.
> 2. **Idempotent Verbs**: GET, PUT, DELETE, HEAD, OPTIONS are idempotent; POST is NOT idempotent.
> 3. **Network Safety**: Idempotent requests can be safely retried automatically by network clients on connection drops.
> 
---

### Exercise 3: HATEOAS Hypermedia Link Generator

**Scenario:** Attaches HATEOAS (Hypermedia As The Engine Of Application State) `_links` metadata to REST API response objects.

**Requirements:**
1. Write attachHateoasLinks(userRecord, baseUrl).
2. Generate self, update, delete, orders links.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachHateoasLinks(userRecord, baseUrl = "https://api.company.com") {
>   const id = userRecord.id;
>
>   return {
>     ...userRecord,
>     _links: {
>       self: { href: `${baseUrl}/users/${id}`, method: "GET" },
>       update: { href: `${baseUrl}/users/${id}`, method: "PUT" },
>       delete: { href: `${baseUrl}/users/${id}`, method: "DELETE" },
>       orders: { href: `${baseUrl}/users/${id}/orders`, method: "GET" }
>     }
>   };
> }
>
> // Verification tests
> const user = { id: 42, name: "Alice" };
> const enriched = attachHateoasLinks(user);
>
> console.assert(enriched._links.self.href === "https://api.company.com/users/42", "Test 1 Failed");
> console.assert(enriched._links.orders.method === "GET", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HATEOAS Level 3 REST Maturity**: Richardson Maturity Model Level 3 where responses provide self-describing navigation links.
> 2. **Client Decoupling**: Clients discover available actions dynamically without hardcoding URL structures.
> 3. **HAL JSON Specification**: Standard format (`_links`) for embedding hypermedia controls in JSON APIs.
## 6. Related Terms
- [Routing](../level_07/routing.md) — How you physically implement REST in Express.
- [HTTP Status Codes](status_codes.md) — REST APIs must return standard status codes to indicate success or failure.
- [API Versioning](api_versioning.md) — Related concept: API Versioning.
- [CORS](cors.md) — Related concept: CORS.
- [Controllers & Services](controllers_services.md) — Controllers and Services architecture.
- [MVC Pattern (Model–View–Controller)](mvc_pattern.md) — MVC pattern.

---

## 7. Key Takeaways
- A **REST API** uses standard HTTP Methods to indicate the action, and Nouns in the URL to indicate the resource.
- **Statelessness** means the server does not remember the client; every request must contain all necessary authentication data.
- Never put action verbs (`create`, `delete`) in your URLs.
