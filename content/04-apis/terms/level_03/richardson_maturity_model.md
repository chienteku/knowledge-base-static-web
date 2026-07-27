# Richardson Maturity Model

> **Level 3 — RESTful APIs**
> The 0–3 scale that grades how "RESTful" an API really is.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](./rest.md) — The base web service API standard.
- [HATEOAS](./hateoas.md) — Hypermedia-guided API navigation.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Used to evaluate and design web service architectures.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Many APIs describe themselves as "RESTful," but their designs differ significantly. Some send all requests via `POST` to a single endpoint, some include verbs in URL paths, and some ignore HTTP status codes. 

To help developers evaluate and classify API designs, Leonard Richardson developed the **Richardson Maturity Model**. It grades APIs across four progressive levels:

```text
  Level 3: Hypermedia Controls (HATEOAS)  <-- True REST
    ▲
  Level 2: HTTP Verbs (GET, POST, PUT, DELETE + Status Codes)
    ▲
  Level 1: Resources (Individual URIs for each entity)
    ▲
  Level 0: The Swamp of POX (Single URI tunnel, POST only)
```

---

### (2) The Four Levels of Maturity

#### Level 0: The Swamp of POX (Plain Old XML/JSON)
HTTP is used strictly as a transport tunnel. The API exposes a single endpoint, and all actions are sent using `POST`. The request body contains the function name and parameters.
- **Example:** `POST /api/service` (Body: `{ "action": "deleteUser", "id": 42 }`). SOAP and XML-RPC operate at this level.

#### Level 1: Resources
The API introduces individual endpoints representing specific resources, but still uses a single HTTP method (typically `POST`) for all actions.
- **Example:** `POST /api/users/42` (with body instructions to update, delete, or fetch).

#### Level 2: HTTP Verbs
The API uses multiple resource endpoints **and** leverages standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) to define CRUD actions. It also returns correct HTTP status codes (like `200 OK`, `201 Created`, `400 Bad Request`).
- *Note:* This is the level where most commercial "REST APIs" sit in production.

#### Level 3: Hypermedia Controls (HATEOAS)
The highest level of REST maturity. Responses return the requested resource alongside hypermedia links guiding the client on what actions they can take next.

---

### (3) Reality Metaphor
Imagine visiting a **customer service desk at a department store**:
- **Level 0 (Swamp)** is like having a **single window slot** labeled "Services". You write your request on a paper slip: `"Refund my shoes"` or `"Buy a shirt"`, and push it through. Everything flows through this one slot.
- **Level 1 (Resources)** is like opening **separate counters** for different departments (a "Shoe Counter", a "Shirt Counter"). You must walk to the correct desk, but you still hand over generic request paper slips.
- **Level 2 (HTTP Verbs)** is like using **standardized gestures** at the counters. You point at an item to inspect it (GET), hand over cash to buy (POST), or slide a broken item into a return bin (DELETE). The clerk holds up standard colored cards: Green (Success) or Red (Error).
- **Level 3 (HATEOAS)** is when the clerk hands you your receipt along with **informational coupon tickets** pointing to your next options: *"Since you bought shoes, here is a ticket showing the location of the shoe polish counter, and here is a ticket for the returns desk."* The receipt itself guides your next steps.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming Level 3 is mandatory for a successful API

**The mistake:** Delaying deployment to implement a complete HATEOAS link-rendering engine for an internal API.

**Why it's wrong:** While Level 3 is the ideal REST standard, Level 2 is highly functional and represents the sweet spot for 90% of web integrations. Implementing Level 3 adds payload size and server-side complexity. Do not feel forced to reach Level 3 if Level 2 meets your requirements.

---

### Mistake 2: Labeling Level 0 or Level 1 APIs as Fully "RESTful"

**The mistake:** Exposing a single POST endpoint (`/api/service`) using custom XML RPC payloads and describing it as RESTful.

**Why it's wrong:** According to the Richardson Maturity Model, an API is only truly RESTful when it reaches **Level 3** (HATEOAS). Level 0 uses HTTP as a transport pipe (SOAP/RPC).

*Incorrect:*
```http
/* Level 0 API using single POST /api/service endpoint for all operations */
```

*Fix:*
```http
/* Level 2/3 REST API using distinct URIs, HTTP verbs, and hypermedia links */
```

---

### Mistake 3: Ignoring Level 2 HTTP Verbs and Returning 200 OK for Everything

**The mistake:** Designing a Level 1 API with distinct resource URIs (`/users/5`), but executing all actions via POST and returning 200 OK.

**Why it's wrong:** Level 2 requires using semantic HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and proper HTTP status codes (`201`, `404`, `500`).

*Incorrect:*
```http
POST /users/5/delete HTTP/1.1 -> 200 OK ; ❌ Level 1 RPC hybrid
```

*Fix:*
```http
DELETE /users/5 HTTP/1.1 -> 204 No Content ; Level 2 REST compliance
```


---

### Mistake 4: Labeling Level 0 or Level 1 APIs as Fully "RESTful"

**The mistake:** Exposing a single POST endpoint (`/api/service`) using custom XML RPC payloads and describing it as RESTful.

**Why it's wrong:** According to the Richardson Maturity Model, an API is only truly RESTful when it reaches **Level 3** (HATEOAS). Level 0 uses HTTP as a transport pipe (SOAP/RPC).

*Incorrect:*
```http
/* Level 0 API using single POST /api/service endpoint for all operations */
```

*Fix:*
```http
/* Level 2/3 REST API using distinct URIs, HTTP verbs, and hypermedia links */
```

---

### Mistake 5: Ignoring Level 2 HTTP Verbs and Returning 200 OK for Everything

**The mistake:** Designing a Level 1 API with distinct resource URIs (`/users/5`), but executing all actions via POST and returning 200 OK.

**Why it's wrong:** Level 2 requires using semantic HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and proper HTTP status codes (`201`, `404`, `500`).

*Incorrect:*
```http
POST /users/5/delete HTTP/1.1 -> 200 OK ; ❌ Level 1 RPC hybrid
```

*Fix:*
```http
DELETE /users/5 HTTP/1.1 -> 204 No Content ; Level 2 REST compliance
```


---

### Mistake 6: Labeling Level 0 or Level 1 APIs as Fully "RESTful"

**The mistake:** Exposing a single POST endpoint (`/api/service`) using custom XML RPC payloads and describing it as RESTful.

**Why it's wrong:** According to the Richardson Maturity Model, an API is only truly RESTful when it reaches **Level 3** (HATEOAS). Level 0 uses HTTP as a transport pipe (SOAP/RPC).

*Incorrect:*
```http
/* Level 0 API using single POST /api/service endpoint for all operations */
```

*Fix:*
```http
/* Level 2/3 REST API using distinct URIs, HTTP verbs, and hypermedia links */
```

---

### Mistake 7: Ignoring Level 2 HTTP Verbs and Returning 200 OK for Everything

**The mistake:** Designing a Level 1 API with distinct resource URIs (`/users/5`), but executing all actions via POST and returning 200 OK.

**Why it's wrong:** Level 2 requires using semantic HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and proper HTTP status codes (`201`, `404`, `500`).

*Incorrect:*
```http
POST /users/5/delete HTTP/1.1 -> 200 OK ; ❌ Level 1 RPC hybrid
```

*Fix:*
```http
DELETE /users/5 HTTP/1.1 -> 204 No Content ; Level 2 REST compliance
```


---

## 6. Practice Exercises

### Exercise 1: Maturity Grader

**Problem:** Classify the maturity level (Level 0, 1, 2, or 3) of each API description:

1. An API exposing endpoints `/v1/getProfile`, `/v1/updateProfile`, and `/v1/deleteProfile`, all queried via `POST` requests.
2. A GraphQL endpoint `/graphql` that accepts all queries and mutations via `POST` requests.
3. An API exposing `/products` where `GET /products/42` reads a product, `DELETE /products/42` deletes it, and returns `200 OK` or `404 Not Found`.
4. The same products API, but the JSON response includes a `links` list detailing how to purchase the item or write a review.

> [!check]- Answer
> - 1. **Level 1** (Exposes individual resources in the path, but uses a single HTTP method for all actions).
> - 2. **Level 0** (Tunnels all operations through a single endpoint).
> - 3. **Level 2** (Uses resource URIs, HTTP verbs, and status codes).
> - 4. **Level 3** (Integrates hypermedia controls/HATEOAS).


---

### Exercise 2: Richardson Maturity Model Levels Breakdown

**Problem:** Match each level of the Richardson Maturity Model to its core characteristic:
1. Level 0
2. Level 1
3. Level 2
4. Level 3

**Expected output:**
```text
1. Level 0: The Swamp of POX (Single URI, POST only)
2. Level 1: Resources (Individual URIs, single verb)
3. Level 2: HTTP Verbs & Status Codes (Semantic verbs + status codes)
4. Level 3: Hypermedia Controls (HATEOAS links)
```

> [!check]- Answer
> ```text
> Level 0 -> Single URI, single HTTP method (SOAP/RPC over HTTP)
> Level 1 -> Multiple URIs for individual resources
> Level 2 -> Standard HTTP Verbs (GET, POST, etc.) and Status Codes
> Level 3 -> HATEOAS Hypermedia Controls
> ```
> - **Explanation:** The model measures progress towards full RESTful maturity.
---

### Exercise 3: Evaluating API Maturity Level

**Problem:** An API has endpoints `/api/v1/orders` and `/api/v1/orders/42`, uses `GET`, `POST`, `DELETE` with `201` and `404` status codes, but includes no `_links` object in JSON responses. What level is it?

**Expected output:**
```text
Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
```

> [!check]- Answer
> ```text
> Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
> ```
> - **Explanation:** Most modern production REST APIs operate at Level 2.
---

### Exercise 4: Richardson Maturity Model Levels Breakdown

**Problem:** Match each level of the Richardson Maturity Model to its core characteristic:
1. Level 0
2. Level 1
3. Level 2
4. Level 3

**Expected output:**
```text
1. Level 0: The Swamp of POX (Single URI, POST only)
2. Level 1: Resources (Individual URIs, single verb)
3. Level 2: HTTP Verbs & Status Codes (Semantic verbs + status codes)
4. Level 3: Hypermedia Controls (HATEOAS links)
```

> [!check]- Answer
> ```text
> Level 0 -> Single URI, single HTTP method (SOAP/RPC over HTTP)
> Level 1 -> Multiple URIs for individual resources
> Level 2 -> Standard HTTP Verbs (GET, POST, etc.) and Status Codes
> Level 3 -> HATEOAS Hypermedia Controls
> ```
> - **Explanation:** The model measures progress towards full RESTful maturity.
---

### Exercise 5: Evaluating API Maturity Level

**Problem:** An API has endpoints `/api/v1/orders` and `/api/v1/orders/42`, uses `GET`, `POST`, `DELETE` with `201` and `404` status codes, but includes no `_links` object in JSON responses. What level is it?

**Expected output:**
```text
Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
```

> [!check]- Answer
> ```text
> Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
> ```
> - **Explanation:** Most modern production REST APIs operate at Level 2.
---

### Exercise 6: Richardson Maturity Model Levels Breakdown

**Problem:** Match each level of the Richardson Maturity Model to its core characteristic:
1. Level 0
2. Level 1
3. Level 2
4. Level 3

**Expected output:**
```text
1. Level 0: The Swamp of POX (Single URI, POST only)
2. Level 1: Resources (Individual URIs, single verb)
3. Level 2: HTTP Verbs & Status Codes (Semantic verbs + status codes)
4. Level 3: Hypermedia Controls (HATEOAS links)
```

> [!check]- Answer
> ```text
> Level 0 -> Single URI, single HTTP method (SOAP/RPC over HTTP)
> Level 1 -> Multiple URIs for individual resources
> Level 2 -> Standard HTTP Verbs (GET, POST, etc.) and Status Codes
> Level 3 -> HATEOAS Hypermedia Controls
> ```
> - **Explanation:** The model measures progress towards full RESTful maturity.
---

### Exercise 7: Evaluating API Maturity Level

**Problem:** An API has endpoints `/api/v1/orders` and `/api/v1/orders/42`, uses `GET`, `POST`, `DELETE` with `201` and `404` status codes, but includes no `_links` object in JSON responses. What level is it?

**Expected output:**
```text
Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
```

> [!check]- Answer
> ```text
> Level 2 (Uses resources, HTTP verbs, and status codes, but lacks HATEOAS Level 3 hypermedia).
> ```
> - **Explanation:** Most modern production REST APIs operate at Level 2.
---

## 7. Related Terms
- [Endpoints & Resources](./endpoints_resources.md) — The resource URIs introduced in Level 1.
- [CRUD Operations](./crud.md) — The HTTP-to-database actions standardized in Level 2.

---

## 8. Key Takeaways
- The Richardson Maturity Model evaluates how closely an API follows REST principles.
- Level 0 tunnels requests to a single endpoint using `POST`.
- Level 1 introduces separate endpoints for individual resources.
- Level 2 leverages standard HTTP verbs and status codes for CRUD actions.
- Level 3 integrates HATEOAS to guide clients dynamically via hypermedia links.
- Level 2 is the practical standard for most production web APIs.
