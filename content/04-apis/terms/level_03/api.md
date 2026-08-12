# API (Application Programming Interface)

> **Level 3 — RESTful APIs**
> A set of rules and mechanisms that allow two different software applications to talk to each other.

---

## 1. Prerequisites
- [Client-Server Model](../level_01/client_server_model.md) — The API is the bridge between these two entities.

---

## 2. Term Category

**Architecture / Interoperability (Universal .)**: API (Application Programming Interface) is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build an incredibly complex weather forecasting system, you might want other developers to build iPhone apps or websites that display your weather data. However, you absolutely *cannot* give those developers direct access to your database. They might accidentally delete data, steal private customer info, or write bad queries that crash your servers.
You need a "middleman." You need a controlled, safe set of doors that developers can knock on to get exactly the data they are allowed to see, and nothing more. This middleman is the **API**.

### (2) Reality Metaphor
Imagine a restaurant kitchen. 
The Kitchen is the **Database** and the **Server Code**. It is full of sharp knives, raw meat, and complex recipes. If a customer (the **Client**) walked into the kitchen and tried to cook their own meal, it would be a disaster.
Instead, the restaurant provides a Menu and a Waiter. The **Menu** is the API Documentation (a list of exactly what you are allowed to ask for). The **Waiter** is the API itself. The Client gives the Waiter an order, the Waiter safely enters the Kitchen, gets the food, and brings it back out to the Client. The Client never touches the Kitchen.

### (3) Types of APIs
While this course focuses on **Web APIs** (using HTTP over the internet), the concept of an API is much broader:
- **Web API**: Stripe's API for processing credit cards, or Google Maps API for getting directions.
- **Browser/DOM API**: JavaScript functions like `document.getElementById()` are APIs provided by Google Chrome to let your code manipulate the browser window.
- **Hardware API**: The code Windows provides to let a video game talk to a graphics card.

### (4) Code Examples

#### Consuming a Web API
When you use `fetch()`, you are acting as the Client, asking the Waiter (the API) for some data from the Kitchen (the Server).
```javascript
// You don't have access to Github's databases. 
// But Github provides a public API door you can knock on!
fetch('https://api.github.com/users/chienteku')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing an "API" with a "Database"

**The mistake:** A junior developer says, "I'm going to save this user to the API."

**Why it's wrong:** An API does not store data. It is a set of rules and code that *facilitates* the transfer of data. You save the user to the **Database**. You *use* the API to transmit the user data to the backend, which then writes it to the Database.

---

### Mistake 2: Exposing Private Internal Database Models Directly Through Public API Endpoints

**The mistake:** Returning raw database entity objects (`SELECT * FROM users`) directly in public API responses.

**Why it's wrong:** Exposing database schemas directly leaks internal implementation details (e.g. `password_hash`, `internal_id`) and forces breaking API changes whenever database tables are refactored.

*Incorrect:*
```javascript
// Express handler leaking internal database fields
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user); // ❌ Leaks password_hash and internal columns!
});
```

*Fix:*
```javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT id, email, name FROM users WHERE id = ?', [req.params.id]);
  res.json({ id: user.id, email: user.email, name: user.name }); // Explicit Data Transfer Object (DTO)
});
```

---

### Mistake 3: Breaking Public API Contracts Without Deprecation Notifications or Versioning

**The mistake:** Renaming or removing JSON response field keys in live production API endpoints.

**Why it's wrong:** External clients depend on stable response interfaces. Altering field names breaks downstream frontend web apps and mobile clients instantly.

*Incorrect:*
```javascript
// Changing response JSON keys directly in v1 endpoint
res.json({ user_name: user.name }); // ❌ Breaks clients expecting { name: '...' }!
```

*Fix:*
```javascript
// Maintain backward compatibility or introduce new versioned endpoint /v2/users
```


---

### Mistake 4: Exposing Private Internal Database Models Directly Through Public API Endpoints

**The mistake:** Returning raw database entity objects (`SELECT * FROM users`) directly in public API responses.

**Why it's wrong:** Exposing database schemas directly leaks internal implementation details (e.g. `password_hash`, `internal_id`) and forces breaking API changes whenever database tables are refactored.

*Incorrect:*
```javascript
// Express handler leaking internal database fields
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user); // ❌ Leaks password_hash and internal columns!
});
```

*Fix:*
```javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT id, email, name FROM users WHERE id = ?', [req.params.id]);
  res.json({ id: user.id, email: user.email, name: user.name }); // Explicit Data Transfer Object (DTO)
});
```

---

### Mistake 5: Breaking Public API Contracts Without Deprecation Notifications or Versioning

**The mistake:** Renaming or removing JSON response field keys in live production API endpoints.

**Why it's wrong:** External clients depend on stable response interfaces. Altering field names breaks downstream frontend web apps and mobile clients instantly.

*Incorrect:*
```javascript
// Changing response JSON keys directly in v1 endpoint
res.json({ user_name: user.name }); // ❌ Breaks clients expecting { name: '...' }!
```

*Fix:*
```javascript
// Maintain backward compatibility or introduce new versioned endpoint /v2/users
```


---

### Mistake 6: Exposing Private Internal Database Models Directly Through Public API Endpoints

**The mistake:** Returning raw database entity objects (`SELECT * FROM users`) directly in public API responses.

**Why it's wrong:** Exposing database schemas directly leaks internal implementation details (e.g. `password_hash`, `internal_id`) and forces breaking API changes whenever database tables are refactored.

*Incorrect:*
```javascript
// Express handler leaking internal database fields
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user); // ❌ Leaks password_hash and internal columns!
});
```

*Fix:*
```javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT id, email, name FROM users WHERE id = ?', [req.params.id]);
  res.json({ id: user.id, email: user.email, name: user.name }); // Explicit Data Transfer Object (DTO)
});
```

---

### Mistake 7: Breaking Public API Contracts Without Deprecation Notifications or Versioning

**The mistake:** Renaming or removing JSON response field keys in live production API endpoints.

**Why it's wrong:** External clients depend on stable response interfaces. Altering field names breaks downstream frontend web apps and mobile clients instantly.

*Incorrect:*
```javascript
// Changing response JSON keys directly in v1 endpoint
res.json({ user_name: user.name }); // ❌ Breaks clients expecting { name: '...' }!
```

*Fix:*
```javascript
// Maintain backward compatibility or introduce new versioned endpoint /v2/users
```


---

## 5. Practice Exercises

### Exercise 1: Encapsulated Service API Contract Wrapper

**Scenario:** A SaaS backend exposes a clean API service module that abstracts database operations behind a predictable function contract.

**Requirements:**
1. Write createProductApi(storageEngine).
2. Implement getById(id), create(data), delete(id).
3. Enforce input validation and contract return values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createProductApi(storageEngine = new Map()) {
>   return {
>     async getById(id) {
>       if (!id) return { success: false, status: 400, error: "Product ID required" };
>       if (!storageEngine.has(id)) {
>         return { success: false, status: 404, error: "Product not found" };
>       }
>       return { success: true, status: 200, data: storageEngine.get(id) };
>     },
>     async create(productData) {
>       if (!productData || !productData.name || typeof productData.price !== "number") {
>         return { success: false, status: 400, error: "Invalid product schema" };
>       }
>       const id = `prod_${Date.now()}`;
>       const record = { id, ...productData };
>       storageEngine.set(id, record);
>       return { success: true, status: 201, data: record };
>     },
>     async delete(id) {
>       if (!storageEngine.has(id)) return { success: false, status: 404, error: "Product not found" };
>       storageEngine.delete(id);
>       return { success: true, status: 204, data: null };
>     }
>   };
> }
>
> // Verification tests
> const api = createProductApi();
> api.create({ name: "Widget", price: 19.99 }).then(createRes => {
>   console.assert(createRes.success === true && createRes.status === 201, "Test 1 Failed");
>   const id = createRes.data.id;
>
>   return api.getById(id).then(getRes => {
>     console.assert(getRes.data.name === "Widget", "Test 2 Failed");
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **API Contract Principle**: An API (Application Programming Interface) defines an explicit contract between caller and service provider.
> 2. **Implementation Hiding**: Internal storage engine implementation details are hidden behind public method abstractions.
> 3. **Standardized Service Payloads**: Methods return consistent response wrappers containing success status, HTTP status codes, and data payloads.
> 
---

### Exercise 2: API Versioning Adapter Router (v1 vs v2 Payload Normalization)

**Scenario:** An API gateway routes requests to different version handlers (`/v1/users` vs `/v2/users`) and normalizes response schemas for client backwards compatibility.

**Requirements:**
1. Write adaptUserApiVersion(reqPath, reqBody, handlers).
2. If /v1/users, map legacy fields (fullName -> name).
3. If /v2/users, map modern fields (firstName, lastName).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function adaptUserApiVersion(reqPath, reqBody, versionHandlers) {
>   if (reqPath.startsWith("/v1/users")) {
>     const parts = (reqBody.fullName || "").split(" ");
>     const v2Payload = { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
>     const res = versionHandlers.v2Create(v2Payload);
>     return {
>       version: "v1",
>       body: { id: res.id, fullName: `${res.firstName} ${res.lastName}`.trim() }
>     };
>   }
>
>   if (reqPath.startsWith("/v2/users")) {
>     const res = versionHandlers.v2Create(reqBody);
>     return { version: "v2", body: res };
>   }
>
>   throw new Error(`Unsupported API version path: ${reqPath}`);
> }
>
> // Verification tests
> const handlers = {
>   v2Create: (data) => ({ id: 101, firstName: data.firstName, lastName: data.lastName })
> };
>
> const v1Res = adaptUserApiVersion("/v1/users", { fullName: "Jane Doe" }, handlers);
> console.assert(v1Res.body.fullName === "Jane Doe", "Test 1 Failed");
>
> const v2Res = adaptUserApiVersion("/v2/users", { firstName: "Jane", lastName: "Doe" }, handlers);
> console.assert(v2Res.body.firstName === "Jane", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **API Lifecycle Versioning**: Versioning (URI path, query param, or header) allows introducing breaking changes without crashing legacy clients.
> 2. **Backward Compatibility Adapters**: Adapters transform legacy payloads to modern internal domain models transparently.
> 3. **Evolutionary Architecture**: Enables gradual deprecation of v1 endpoints while promoting v2 modern features.
> 
---

### Exercise 3: Unified API Gateway Error Abstraction Layer

**Scenario:** An API gateway catches internal errors from downstream microservices and normalizes them into a unified public API error schema.

**Requirements:**
1. Write normalizeGatewayError(errorInstance).
2. Map database, network, and validation errors to standard API response format.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function normalizeGatewayError(errorInstance) {
>   if (!errorInstance) {
>     return { status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred" };
>   }
>
>   if (errorInstance.name === "ValidationError") {
>     return { status: 400, code: "INVALID_PAYLOAD", message: errorInstance.message };
>   }
>
>   if (errorInstance.code === "ECONNREFUSED" || errorInstance.name === "NetworkError") {
>     return { status: 503, code: "SERVICE_UNAVAILABLE", message: "Upstream service temporarily unreachable" };
>   }
>
>   if (errorInstance.status === 404) {
>     return { status: 404, code: "NOT_FOUND", message: errorInstance.message || "Resource not found" };
>   }
>
>   return { status: 500, code: "INTERNAL_SERVER_ERROR", message: "Internal server error" };
> }
>
> // Verification tests
> const valErr = new Error("Email field invalid");
> valErr.name = "ValidationError";
> console.assert(normalizeGatewayError(valErr).status === 400, "Test 1 Failed");
>
> const netErr = new Error("Connection refused");
> netErr.code = "ECONNREFUSED";
> console.assert(normalizeGatewayError(netErr).status === 503, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Encapsulated Error Handlers**: Hides internal stack traces and database error codes behind clean external API error objects.
> 2. **API Gateway Role**: Acts as single entry point for clients, standardizing error codes across heterogeneous microservices.
> 3. **Security Hardening**: Prevents leaking sensitive infrastructure information (database queries, file paths) in API errors.
---

## 6. Related Terms
- [REST (Representational State Transfer)](rest.md) — The most popular architectural style for building Web APIs.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The food the waiter carries back from the kitchen.
- [Client-Server Model](../level_01/client_server_model.md) — Related concept: Client-Server Model.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — GraphQL APIs.
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — gRPC APIs.

---

## 7. Key Takeaways
- **API** stands for Application Programming Interface.
- It is a controlled bridge that allows two software systems to communicate.
- It hides the complexity and secures the underlying database by only allowing specific requests.
- APIs exist everywhere (Hardware, Browsers, Web), but Web APIs use HTTP and URLs.
