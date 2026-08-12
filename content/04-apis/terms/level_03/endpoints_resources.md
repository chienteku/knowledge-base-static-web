# Endpoints & Resources

> **Level 3 — RESTful APIs**
> A Resource is the data "Noun" you are trying to access (e.g., a User). An Endpoint is the specific URL door you knock on to get that Resource.

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — Endpoints are just specific URLs on a server.
- [REST (Representational State Transfer)](rest.md) — REST relies heavily on defining resources as nouns.

---

## 2. Term Category

**API Architecture / Concept (Universal Standard)**: Endpoints & Resources is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When designing an API, you have to organize your data so developers can intuitively find what they need. You wouldn't throw every piece of data into a single, chaotic pile. You need categories.
In API terminology, a **Resource** is an object or a concept (like a `User`, a `Tweet`, or an `Order`). 
An **Endpoint** is the exact URL that the Server exposes to let you interact with that Resource. Endpoints act like designated doors on a building—if you want shoes, go to the "Shoes" door.

### (2) Reality Metaphor
Imagine a massive library.
- The **Domain** (`library.com`) is the building itself.
- A **Resource** is a concept, like "Sci-Fi Books".
- The **Endpoint** (`/books/sci-fi`) is the exact aisle and shelf number where those books are stored.

### (3) Nested Resources
In RESTful API design, resources are often related to one another. Endpoints can be "nested" to show this relationship in the URL.
- `/users` (All users)
- `/users/5` (A specific user, ID 5)
- `/users/5/posts` (All the posts belonging to User 5)
- `/users/5/posts/12` (A specific post belonging to a specific user)

*Note: It is considered bad practice to nest endpoints deeper than two levels. `/users/5/posts/12/comments/4` becomes unreadable. Usually, you would just do `/comments/4` instead!*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Deeply Nested Endpoints

**The mistake:** A developer creates this endpoint: `GET /companies/2/departments/4/employees/12/tasks/8`.

**Why it's wrong:** While it accurately describes the hierarchy of the database, it is incredibly brittle and annoying for Frontend developers to use. What if the frontend only knows the task ID, but doesn't know the company ID? 
**Golden Rule:** Try to keep endpoints shallow. If `tasks` have unique IDs in the database, you only need `GET /tasks/8`. You don't need the entire family tree in the URL!

---

### Mistake 2: Including Verbs in REST Endpoint Paths (`/api/getUsers` or `/api/createOrder`)

**The mistake:** Naming REST endpoint URLs with action verbs: `/api/fetchAllProducts`.

**Why it's wrong:** In RESTful architecture, resources are **nouns** (e.g. `/products`). The action verb is specified by the HTTP method (`GET`, `POST`, `DELETE`).

*Incorrect:*
```http
POST /api/deleteProduct/45 HTTP/1.1 ; ❌ Verbs inside URI path!
```

*Fix:*
```http
DELETE /api/products/45 HTTP/1.1 ; Noun resource + HTTP DELETE verb
```

---

### Mistake 3: Using Inconsistent Pluralization in Resource URIs

**The mistake:** Mixing singular and plural nouns across endpoints (`/api/user/5` vs `/api/orders`).

**Why it's wrong:** Inconsistent endpoint naming creates confusion for API clients. Standardize on plural nouns for collections (`/users`, `/orders`).

*Incorrect:*
```http
GET /api/user/5
GET /api/orders ; ❌ Inconsistent pluralization!
```

*Fix:*
```http
GET /api/users/5
GET /api/orders ; Standardized plural resource nouns
```


---

### Mistake 4: Including Verbs in REST Endpoint Paths (`/api/getUsers` or `/api/createOrder`)

**The mistake:** Naming REST endpoint URLs with action verbs: `/api/fetchAllProducts`.

**Why it's wrong:** In RESTful architecture, resources are **nouns** (e.g. `/products`). The action verb is specified by the HTTP method (`GET`, `POST`, `DELETE`).

*Incorrect:*
```http
POST /api/deleteProduct/45 HTTP/1.1 ; ❌ Verbs inside URI path!
```

*Fix:*
```http
DELETE /api/products/45 HTTP/1.1 ; Noun resource + HTTP DELETE verb
```

---

### Mistake 5: Using Inconsistent Pluralization in Resource URIs

**The mistake:** Mixing singular and plural nouns across endpoints (`/api/user/5` vs `/api/orders`).

**Why it's wrong:** Inconsistent endpoint naming creates confusion for API clients. Standardize on plural nouns for collections (`/users`, `/orders`).

*Incorrect:*
```http
GET /api/user/5
GET /api/orders ; ❌ Inconsistent pluralization!
```

*Fix:*
```http
GET /api/users/5
GET /api/orders ; Standardized plural resource nouns
```


---

### Mistake 6: Including Verbs in REST Endpoint Paths (`/api/getUsers` or `/api/createOrder`)

**The mistake:** Naming REST endpoint URLs with action verbs: `/api/fetchAllProducts`.

**Why it's wrong:** In RESTful architecture, resources are **nouns** (e.g. `/products`). The action verb is specified by the HTTP method (`GET`, `POST`, `DELETE`).

*Incorrect:*
```http
POST /api/deleteProduct/45 HTTP/1.1 ; ❌ Verbs inside URI path!
```

*Fix:*
```http
DELETE /api/products/45 HTTP/1.1 ; Noun resource + HTTP DELETE verb
```

---

### Mistake 7: Using Inconsistent Pluralization in Resource URIs

**The mistake:** Mixing singular and plural nouns across endpoints (`/api/user/5` vs `/api/orders`).

**Why it's wrong:** Inconsistent endpoint naming creates confusion for API clients. Standardize on plural nouns for collections (`/users`, `/orders`).

*Incorrect:*
```http
GET /api/user/5
GET /api/orders ; ❌ Inconsistent pluralization!
```

*Fix:*
```http
GET /api/users/5
GET /api/orders ; Standardized plural resource nouns
```


---

## 5. Practice Exercises

### Exercise 1: Nested RESTful Resource Endpoint Router

**Scenario:** A web API framework routes requests to nested sub-resource endpoints (e.g. `/users/:userId/orders/:orderId`).

**Requirements:**
1. Write parseNestedResourceEndpoint(pathStr).
2. Extract root resource, root ID, sub-resource, and sub-resource ID.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseNestedResourceEndpoint(pathStr) {
>   if (!pathStr || typeof pathStr !== "string") return null;
>
>   const segments = pathStr.split("/").filter(Boolean);
>   if (segments.length < 2) return null;
>
>   const result = {
>     parentResource: segments[0],
>     parentId: segments[1],
>     subResource: segments[2] || null,
>     subResourceId: segments[3] || null
>   };
>
>   return result;
> }
>
> // Verification tests
> const parsed = parseNestedResourceEndpoint("/users/usr-42/orders/ord-99");
> console.assert(parsed.parentResource === "users" && parsed.parentId === "usr-42", "Test 1 Failed");
> console.assert(parsed.subResource === "orders" && parsed.subResourceId === "ord-99", "Test 2 Failed");
>
> const topLevel = parseNestedResourceEndpoint("/products/p-10");
> console.assert(topLevel.parentResource === "products" && topLevel.subResource === null, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Endpoint Definition**: An Endpoint is the URI path used to access a Resource (e.g. /api/v1/users).
> 2. **Resource Definition**: A Resource is the underlying entity or object data represented by the endpoint.
> 3. **Nested Resource Relationships**: Hierarchical paths (/users/42/orders) convey parent-child relationships between resources.
> 
---

### Exercise 2: Plural vs Singular Resource Naming Normalizer

**Scenario:** A REST linter checks API endpoint path strings to enforce plural noun conventions for resource collections.

**Requirements:**
1. Write auditResourceEndpointNaming(endpointPath).
2. Check if collection segment is plural noun.
3. Flag singular nouns or RPC verb paths.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditResourceEndpointNaming(endpointPath) {
>   if (!endpointPath || typeof endpointPath !== "string") return { valid: false };
>
>   const segments = endpointPath.split("/").filter(Boolean);
>   if (segments.length === 0) return { valid: false };
>
>   const collectionName = segments[0].toLowerCase();
>   const knownSingulars = ["user", "order", "product", "account", "customer"];
>
>   if (knownSingulars.includes(collectionName)) {
>     return {
>       valid: false,
>       reason: `Resource collection should be plural '${collectionName}s' instead of singular '${collectionName}'`
>     };
>   }
>
>   if (["getusers", "deleteorder", "createproduct"].includes(collectionName)) {
>     return {
>       valid: false,
>       reason: "Endpoint paths must use noun resources, not RPC verbs"
>     };
>   }
>
>   return { valid: true, collection: collectionName };
> }
>
> // Verification tests
> console.assert(auditResourceEndpointNaming("/user/123").valid === false, "Test 1 Failed: Singular resource name");
> console.assert(auditResourceEndpointNaming("/getUsers").valid === false, "Test 2 Failed: RPC verb in path");
> console.assert(auditResourceEndpointNaming("/users/123").valid === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Plural Nouns Convention**: REST endpoints should use plural nouns (/users, /orders) to represent resource collections.
> 2. **Nouns vs Verbs**: Endpoints represent Nouns (resources); HTTP methods specify the Verbs (actions).
> 3. **Predictable API Design**: Consistent resource naming rules reduce learning curve for client API consumers.
> 
---

### Exercise 3: Sub-Resource Collection Aggregator Endpoint

**Scenario:** An API endpoint handler aggregates sub-resources filtered by parent resource constraints.

**Requirements:**
1. Write getParentSubResources(parentId, subResourceName, dbMap).
2. Return sub-resources belonging to specified parentId.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getParentSubResources(parentId, subResourceName, dbMap) {
>   if (!parentId || !dbMap.has(subResourceName)) return [];
>
>   const collection = dbMap.get(subResourceName);
>   return collection.filter(item => item.parentId === parentId);
> }
>
> // Verification tests
> const db = new Map([
>   ["orders", [
>     { id: "o1", parentId: "u101", total: 50 },
>     { id: "o2", parentId: "u102", total: 30 },
>     { id: "o3", parentId: "u101", total: 90 }
>   ]]
> ]);
>
> const u101Orders = getParentSubResources("u101", "orders", db);
> console.assert(u101Orders.length === 2, "Test 1 Failed");
> console.assert(u101Orders[0].id === "o1" && u101Orders[1].id === "o3", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Resource Scoping**: Sub-resource endpoints automatically scope queries to the parent entity context.
> 2. **Relational Integrity**: Guarantees clients cannot fetch sub-resources belonging to a different parent.
> 3. **REST Resource Tree**: Models complex database foreign key relationships as intuitive URL paths.
---

## 6. Related Terms
- [Query Parameters & Path Variables](../level_02/query_params.md) — The dynamic IDs injected into endpoints to target specific resources.
- [REST (Representational State Transfer)](rest.md) — The architecture that dictates endpoints must be nouns.
- [HATEOAS](hateoas.md) — Related concept: HATEOAS.
- [Richardson Maturity Model](richardson_maturity_model.md) — Related concept: Richardson Maturity Model.
- [API Versioning (v1, v2)](../level_10/versioning.md) — Related concept: API Versioning (v1, v2).

---

## 7. Key Takeaways
- A **Resource** is the abstract concept of the data (Users, Products).
- An **Endpoint** is the specific URL (e.g., `/api/users`) exposed by the server to access that Resource.
- **Nested Endpoints** (e.g., `/users/1/orders`) show relationships between resources.
- Avoid nesting endpoints deeper than 2 levels to keep your API clean and usable.
