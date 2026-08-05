# Endpoints & Resources

> **Level 3 — RESTful APIs**
> A Resource is the data "Noun" you are trying to access (e.g., a User). An Endpoint is the specific URL door you knock on to get that Resource.

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — Endpoints are just specific URLs on a server.
- [REST (Representational State Transfer)](rest.md) — REST relies heavily on defining resources as nouns.

---

## 2. Term Category
- **API Architecture / Concept**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Design the Endpoints

**Problem:** You are building an API for a blog. You have two Resources: `Articles` and `Comments`. Write the standard REST endpoints to:
1. Get all articles.
2. Get a specific article (ID 42).
3. Get all comments on that specific article.

**Expected output:**
> [!check]- Answer
> ```text
> 1. `GET /articles`
> 2. `GET /articles/42`
> 3. `GET /articles/42/comments`
> ```
> - Remember to use Plural Nouns!
> - To get a specific item, use a Path Variable.

---

### Exercise 2: REST Endpoint Design Refactoring

**Problem:** Refactor the following RPC-style endpoint URLs into clean RESTful noun URIs:
1. `POST /api/getAllCustomers` 
2. `POST /api/updateCustomer?id=10` 
3. `POST /api/deleteCustomer/10` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10 (or PATCH)
> 3. DELETE /api/customers/10
> ```
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10
> 3. DELETE /api/customers/10
> ```
> - **Explanation:** REST endpoints use HTTP methods to express actions on noun resources.
---

### Exercise 3: Nested Sub-Resource Hierarchy Design

**Problem:** Design a RESTful URI endpoint path for fetching all comments belonging to a specific post (`id: 42`).

**Expected output:**
> [!check]- Answer
> ```text
> GET /api/posts/42/comments
> ```
> ```http
> GET /api/posts/42/comments HTTP/1.1
> ```
> - **Explanation:** Hierarchical nested paths express parent-child relationships between resources.
---

### Exercise 4: REST Endpoint Design Refactoring

**Problem:** Refactor the following RPC-style endpoint URLs into clean RESTful noun URIs:
1. `POST /api/getAllCustomers` 
2. `POST /api/updateCustomer?id=10` 
3. `POST /api/deleteCustomer/10` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10 (or PATCH)
> 3. DELETE /api/customers/10
> ```
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10
> 3. DELETE /api/customers/10
> ```
> - **Explanation:** REST endpoints use HTTP methods to express actions on noun resources.
---

### Exercise 5: Nested Sub-Resource Hierarchy Design

**Problem:** Design a RESTful URI endpoint path for fetching all comments belonging to a specific post (`id: 42`).

**Expected output:**
> [!check]- Answer
> ```text
> GET /api/posts/42/comments
> ```
> ```http
> GET /api/posts/42/comments HTTP/1.1
> ```
> - **Explanation:** Hierarchical nested paths express parent-child relationships between resources.
---

### Exercise 6: REST Endpoint Design Refactoring

**Problem:** Refactor the following RPC-style endpoint URLs into clean RESTful noun URIs:
1. `POST /api/getAllCustomers` 
2. `POST /api/updateCustomer?id=10` 
3. `POST /api/deleteCustomer/10` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10 (or PATCH)
> 3. DELETE /api/customers/10
> ```
> ```text
> 1. GET /api/customers
> 2. PUT /api/customers/10
> 3. DELETE /api/customers/10
> ```
> - **Explanation:** REST endpoints use HTTP methods to express actions on noun resources.
---

### Exercise 7: Nested Sub-Resource Hierarchy Design

**Problem:** Design a RESTful URI endpoint path for fetching all comments belonging to a specific post (`id: 42`).

**Expected output:**
> [!check]- Answer
> ```text
> GET /api/posts/42/comments
> ```
> ```http
> GET /api/posts/42/comments HTTP/1.1
> ```
> - **Explanation:** Hierarchical nested paths express parent-child relationships between resources.
---

## 7. Related Terms
- [Query Parameters & Path Variables](../level_02/query_params.md) — The dynamic IDs injected into endpoints to target specific resources.
- [REST (Representational State Transfer)](rest.md) — The architecture that dictates endpoints must be nouns.
- [HATEOAS](hateoas.md) — Related concept: HATEOAS.
- [Richardson Maturity Model](richardson_maturity_model.md) — Related concept: Richardson Maturity Model.
- [API Versioning (v1, v2)](../level_10/versioning.md) — Related concept: API Versioning (v1, v2).

---

## 8. Key Takeaways
- A **Resource** is the abstract concept of the data (Users, Products).
- An **Endpoint** is the specific URL (e.g., `/api/users`) exposed by the server to access that Resource.
- **Nested Endpoints** (e.g., `/users/1/orders`) show relationships between resources.
- Avoid nesting endpoints deeper than 2 levels to keep your API clean and usable.
