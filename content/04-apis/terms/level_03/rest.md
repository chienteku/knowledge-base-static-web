# REST (Representational State Transfer)

> **Level 3 — RESTful APIs**
> A specific, standardized architectural style for building Web APIs, heavily relying on HTTP Methods and predictable URLs.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — REST is entirely built around mapping operations to GET, POST, PUT, and DELETE.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — REST dictates exactly how URLs should be formatted.
---

## 2. Term Category
- **API Architecture / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (The dominant API paradigm of the modern web).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: RESTify this API

**Problem:** You inherit a terrible, legacy API. It has the following endpoint: `GET /movies/addMovie?name=Inception&director=Nolan`. Convert this into a proper RESTful endpoint.

**Expected output:**
> [!check]- Answer
> ```text
> Method: `POST` (Because we are creating something new).
> URL: `/movies` (Just the plural noun).
> Body: `{ "name": "Inception", "director": "Nolan" }` (Data goes in the payload, not the query params!).
> ```
> - You are creating data. What HTTP method should you use?
> - Can GET requests have bodies? Where should large data payloads go?

---

### Exercise 2: 6 Architectural Constraints of REST

**Problem:** List the 6 architectural constraints defined by Roy Fielding for RESTful systems.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Client-Server
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> ```text
> 1. Client-Server Architecture
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> - **Explanation:** Meeting these 6 constraints defines true RESTful system architecture.
---

### Exercise 3: Uniform Interface Sub-Constraints

**Problem:** Identify the 4 key requirements of the REST Uniform Interface constraint.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Resource Identification in requests (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages (Content-Type/headers)
> 4. HATEOAS (Hypermedia As The Engine Of Application State)
> ```
> ```text
> 1. Resource Identification (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages
> 4. HATEOAS
> ```
> - **Explanation:** Uniform Interface standardizes client-server interaction mechanics.
---

### Exercise 4: 6 Architectural Constraints of REST

**Problem:** List the 6 architectural constraints defined by Roy Fielding for RESTful systems.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Client-Server
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> ```text
> 1. Client-Server Architecture
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> - **Explanation:** Meeting these 6 constraints defines true RESTful system architecture.
---

### Exercise 5: Uniform Interface Sub-Constraints

**Problem:** Identify the 4 key requirements of the REST Uniform Interface constraint.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Resource Identification in requests (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages (Content-Type/headers)
> 4. HATEOAS (Hypermedia As The Engine Of Application State)
> ```
> ```text
> 1. Resource Identification (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages
> 4. HATEOAS
> ```
> - **Explanation:** Uniform Interface standardizes client-server interaction mechanics.
---

### Exercise 6: 6 Architectural Constraints of REST

**Problem:** List the 6 architectural constraints defined by Roy Fielding for RESTful systems.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Client-Server
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> ```text
> 1. Client-Server Architecture
> 2. Statelessness
> 3. Cacheability
> 4. Uniform Interface
> 5. Layered System
> 6. Code on Demand (Optional)
> ```
> - **Explanation:** Meeting these 6 constraints defines true RESTful system architecture.
---

### Exercise 7: Uniform Interface Sub-Constraints

**Problem:** Identify the 4 key requirements of the REST Uniform Interface constraint.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Resource Identification in requests (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages (Content-Type/headers)
> 4. HATEOAS (Hypermedia As The Engine Of Application State)
> ```
> ```text
> 1. Resource Identification (URIs)
> 2. Resource Manipulation through representations
> 3. Self-descriptive messages
> 4. HATEOAS
> ```
> - **Explanation:** Uniform Interface standardizes client-server interaction mechanics.
---

## 7. Related Terms
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

## 8. Key Takeaways
- **REST** is an architectural style for designing predictable APIs.
- URLs must be **Plural Nouns** (e.g., `/users`, `/products`).
- URLs must **never contain Verbs** (e.g., no `/getUsers` or `/deleteProduct`).
- The action is defined entirely by the **HTTP Method** (`GET`, `POST`, `PUT`, `DELETE`).
- REST APIs are stateless.
