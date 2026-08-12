# REST (Representational State Transfer)

> **Level 3 — RESTful APIs**
> A specific, standardized architectural style for building Web APIs, heavily relying on HTTP Methods and predictable URLs.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — REST is entirely built around mapping operations to GET, POST, PUT, and DELETE.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — REST dictates exactly how URLs should be formatted.

---

## 2. Term Category

**API Architecture / Paradigm (Universal Standard .)**: REST (Representational State Transfer) is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early 2000s, there were no rules for how to build a Web API. 
One company might use `POST /getUsers` to read data. Another might use `GET /deleteUser?id=5`. A third might use a single URL `POST /api` and put the commands entirely in XML payloads (called SOAP). It was chaotic. Every time you wanted to use a new API, you had to read a 500-page manual because every API was completely unique.
In 2000, Roy Fielding introduced **REST**. It was a proposal to create a universal, predictable standard. Instead of inventing custom verbs in the URL (like `/getUsers`), REST proposed using standard HTTP Methods (`GET`) combined with simple nouns (`/users`).

### (2) Reality Metaphor
Imagine learning to drive a car. 
Before REST, every car was different. In Car A, the steering wheel is a joystick and the brake is a button. In Car B, you steer with pedals. You have to re-learn how to drive every time you rent a car.
REST is the standardization of the car interface: The steering wheel is always a circle in front of you, the gas is always the right pedal, the brake is the left pedal. Because of this standard, if you know how to drive a Honda, you instantly know how to drive a Ford. If you know how to use one REST API, you instantly know how to use them all.

### (3) The Core Rules of REST
If an API follows these rules, it is considered **"RESTful"**:
1. **Use Nouns, Not Verbs**: URLs should never contain verbs. (Use `/users`, not `/getUsers`).
2. **Use HTTP Methods for Action**: 
   - `GET /users` (Reads all users)
   - `POST /users` (Creates a user)
   - `DELETE /users/5` (Deletes user 5)
3. **Plural Nouns**: URLs should represent collections of things. (Use `/users`, not `/user`).
4. **Stateless**: The server must not remember who the client is between requests. (Every request must include its own authentication token).

### (4) Code Examples

#### Bad API Design vs RESTful API Design

**Bad (RPC Style):**
```http
POST /api/createUser
POST /api/deleteUser?id=5
POST /api/updateUserEmail
```

**Good (RESTful Style):**
```http
POST   /api/users        (Creates a user)
DELETE /api/users/5      (Deletes user 5)
PATCH  /api/users/5      (Updates user 5)
```
Notice how the URL (`/api/users`) barely changes, but the HTTP Method dictates the action!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting Verbs in the URL

**The mistake:** Building an endpoint like `POST /articles/12/publish`.

**Why it's wrong:** REST strictly relies on Nouns. `publish` is an action (a verb). How do you represent "publishing" in REST? You update the state of the article resource.
**RESTful Solution:** You use a `PATCH` request to update the `isPublished` boolean on the article!
```http
PATCH /articles/12
Body: { "isPublished": true }
```

---

### Mistake 2: Storing Session State in Server Memory (Violating REST Statelessness Constraint)

**The mistake:** Storing user session objects inside backend server RAM (`req.session.user`) across REST requests.

**Why it's wrong:** REST mandates complete **Statelessness**. Storing session state in server RAM prevents horizontal scaling across multi-server load-balanced clusters. Use self-contained tokens (JWT) or distributed session stores (Redis).

*Incorrect:*
```javascript
// Express server memory session storage
app.use(session({ secret: 'key' })); // ❌ Violates REST stateless constraint!
```

*Fix:*
```javascript
// Statlessly verify session using JWT bearer tokens:
const authHeader = req.headers.authorization; // Token contains state
```

---

### Mistake 3: Claiming RPC-style APIs Are "RESTful"

**The mistake:** Building an API with endpoints like `/api/doTransaction` and calling it a REST API.

**Why it's wrong:** REST requires resource-oriented URI design, standard HTTP verbs, and representation state transfers. RPC (Remote Procedure Call) executes remote functions over arbitrary HTTP endpoints.

*Incorrect:*
```http
POST /api/doTransaction HTTP/1.1 ; RPC endpoint style
```

*Fix:*
```http
POST /api/transactions HTTP/1.1 ; RESTful resource endpoint style
```


---

### Mistake 4: Storing Session State in Server Memory (Violating REST Statelessness Constraint)

**The mistake:** Storing user session objects inside backend server RAM (`req.session.user`) across REST requests.

**Why it's wrong:** REST mandates complete **Statelessness**. Storing session state in server RAM prevents horizontal scaling across multi-server load-balanced clusters. Use self-contained tokens (JWT) or distributed session stores (Redis).

*Incorrect:*
```javascript
// Express server memory session storage
app.use(session({ secret: 'key' })); // ❌ Violates REST stateless constraint!
```

*Fix:*
```javascript
// Statlessly verify session using JWT bearer tokens:
const authHeader = req.headers.authorization; // Token contains state
```

---

### Mistake 5: Claiming RPC-style APIs Are "RESTful"

**The mistake:** Building an API with endpoints like `/api/doTransaction` and calling it a REST API.

**Why it's wrong:** REST requires resource-oriented URI design, standard HTTP verbs, and representation state transfers. RPC (Remote Procedure Call) executes remote functions over arbitrary HTTP endpoints.

*Incorrect:*
```http
POST /api/doTransaction HTTP/1.1 ; RPC endpoint style
```

*Fix:*
```http
POST /api/transactions HTTP/1.1 ; RESTful resource endpoint style
```


---

### Mistake 6: Storing Session State in Server Memory (Violating REST Statelessness Constraint)

**The mistake:** Storing user session objects inside backend server RAM (`req.session.user`) across REST requests.

**Why it's wrong:** REST mandates complete **Statelessness**. Storing session state in server RAM prevents horizontal scaling across multi-server load-balanced clusters. Use self-contained tokens (JWT) or distributed session stores (Redis).

*Incorrect:*
```javascript
// Express server memory session storage
app.use(session({ secret: 'key' })); // ❌ Violates REST stateless constraint!
```

*Fix:*
```javascript
// Statlessly verify session using JWT bearer tokens:
const authHeader = req.headers.authorization; // Token contains state
```

---

### Mistake 7: Claiming RPC-style APIs Are "RESTful"

**The mistake:** Building an API with endpoints like `/api/doTransaction` and calling it a REST API.

**Why it's wrong:** REST requires resource-oriented URI design, standard HTTP verbs, and representation state transfers. RPC (Remote Procedure Call) executes remote functions over arbitrary HTTP endpoints.

*Incorrect:*
```http
POST /api/doTransaction HTTP/1.1 ; RPC endpoint style
```

*Fix:*
```http
POST /api/transactions HTTP/1.1 ; RESTful resource endpoint style
```


---

## 5. Practice Exercises

### Exercise 1: REST Architectural Constraints Audit Engine

**Scenario:** An API governance tool checks API endpoints against the 6 core REST architectural constraints.

**Requirements:**
1. Write auditRestConstraints(apiSpec).
2. Check Client-Server, Statelessness, Cacheability, Layered System, Uniform Interface.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditRestConstraints(apiSpec) {
>   if (!apiSpec) return { score: 0, passes: false };
>
>   const checks = {
>     clientServer: apiSpec.hasSeparatedClientServer === true,
>     stateless: apiSpec.isStateless === true,
>     cacheable: apiSpec.supportsCacheHeaders === true,
>     uniformInterface: apiSpec.usesStandardHttpMethods === true,
>     layeredSystem: apiSpec.supportsIntermediaryGateways === true
>   };
>
>   const passedCount = Object.values(checks).filter(Boolean).length;
>
>   return {
>     score: (passedCount / 5) * 100,
>     passes: passedCount === 5,
>     checks
>   };
> }
>
> // Verification tests
> const spec = {
>   hasSeparatedClientServer: true,
>   isStateless: true,
>   supportsCacheHeaders: true,
>   usesStandardHttpMethods: true,
>   supportsIntermediaryGateways: true
> };
>
> const result = auditRestConstraints(spec);
> console.assert(result.score === 100 && result.passes === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **REST Definition**: Representational State Transfer: an architectural style for distributed hypermedia systems defined by Roy Fielding.
> 2. **Stateless Constraint**: Every client request must contain all state needed for execution.
> 3. **Uniform Interface Constraint**: Resource identification, manipulation through representations, self-descriptive messages, and HATEOAS.
> 
---

### Exercise 2: REST Uniform Interface Method & Status Code Router

**Scenario:** A RESTful router dispatches HTTP requests enforcing uniform interface status code contracts.

**Requirements:**
1. Write processRestRoute(method, resourceExists, payload).
2. Return 200/201/204 for success, 404/400 for errors.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processRestRoute(method, resourceExists, payload) {
>   const m = method.toUpperCase();
>
>   if (m === "GET") {
>     if (!resourceExists) return { status: 404, body: { error: "Not Found" } };
>     return { status: 200, body: payload };
>   }
>
>   if (m === "POST") {
>     return { status: 201, body: { id: `id_${Date.now()}`, ...payload } };
>   }
>
>   if (m === "DELETE") {
>     if (!resourceExists) return { status: 404, body: { error: "Not Found" } };
>     return { status: 204, body: null };
>   }
>
>   return { status: 45, body: { error: "Method Not Allowed" } };
> }
>
> // Verification tests
> console.assert(processRestRoute("GET", true, { name: "A" }).status === 200, "Test 1 Failed");
> console.assert(processRestRoute("GET", false).status === 404, "Test 2 Failed");
> console.assert(processRestRoute("POST", false, { name: "B" }).status === 201, "Test 3 Failed");
> console.assert(processRestRoute("DELETE", true).status === 204, "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Uniform Interface Core**: Standardized HTTP methods and status codes allow any client to interact with any REST API.
> 2. **Resource Representations**: Clients manipulate resources by exchanging representations (JSON, XML).
> 3. **Predictable Contracts**: Clients rely on standard status codes rather than custom response envelope codes.
> 
---

### Exercise 3: RESTful State Machine Navigation Engine

**Scenario:** Demonstrates REST state transitions by updating client state strictly through representation representations.

**Requirements:**
1. Write transitionRestState(currentState, action).
2. Return new state representation.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function transitionRestState(currentState, action) {
>   const transitions = {
>     DRAFT: { submit: "PENDING_REVIEW" },
>     PENDING_REVIEW: { approve: "PUBLISHED", reject: "REJECTED" },
>     REJECTED: { resubmit: "PENDING_REVIEW" }
>   };
>
>   const allowed = transitions[currentState];
>   if (!allowed || !allowed[action]) {
>     return { success: false, state: currentState, error: "Invalid State Transition" };
>   }
>
>   return { success: true, state: allowed[action] };
> }
>
> // Verification tests
> const step1 = transitionRestState("DRAFT", "submit");
> console.assert(step1.state === "PENDING_REVIEW", "Test 1 Failed");
>
> const step2 = transitionRestState("PENDING_REVIEW", "approve");
> console.assert(step2.state === "PUBLISHED", "Test 2 Failed");
>
> const invalid = transitionRestState("PUBLISHED", "submit");
> console.assert(invalid.success === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Application State Transitions**: REST applications transition between states by exchanging representations.
> 2. **Hypermedia Driven**: Clients discover valid state transitions dynamically from hypermedia links.
> 3. **Decoupled Workflows**: State transition logic is managed server-side, keeping clients lightweight.
---

## 6. Related Terms
- [Endpoints & Resources](endpoints_resources.md) — The nouns that REST APIs are built around.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — The modern alternative to REST, which abandons HTTP methods entirely in favor of a single `/graphql` endpoint.
- [HTTP / HTTPS](../level_01/http_https.md) — Related concept: HTTP / HTTPS.
- [Query Parameters & Path Variables](../level_02/query_params.md) — Related concept: Query Parameters & Path Variables.
- [API (Application Programming Interface)](api.md) — Related concept: API (Application Programming Interface).
- [CRUD Operations](crud.md) — Related concept: CRUD Operations.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — Related concept: Pagination (Offset vs. Cursor).
- [XML](../level_07/xml.md) — Related concept: XML.
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — Related concept: gRPC (Remote Procedure Call).
- [Swagger / OpenAPI Specification](../level_10/openapi.md) — Related concept: Swagger / OpenAPI Specification.
- [Statelessness](statelessness.md) — Statelessness constraint.
- [Richardson Maturity Model](richardson_maturity_model.md) — Richardson Maturity Model.

---

## 7. Key Takeaways
- **REST** is an architectural style for designing predictable APIs.
- URLs must be **Plural Nouns** (e.g., `/users`, `/products`).
- URLs must **never contain Verbs** (e.g., no `/getUsers` or `/deleteProduct`).
- The action is defined entirely by the **HTTP Method** (`GET`, `POST`, `PUT`, `DELETE`).
- REST APIs are stateless.
