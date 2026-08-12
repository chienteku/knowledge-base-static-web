# Richardson Maturity Model

> **Level 3 — RESTful APIs**
> The 0–3 scale that grades how "RESTful" an API really is.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](rest.md) — The base web service API standard.
- [HATEOAS](hateoas.md) — Hypermedia-guided API navigation.

---

## 2. Term Category

**Architecture / Design (Universal: Used to evaluate and design web service architectures.)**: Richardson Maturity Model is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Richardson Maturity Model (RMM) Level Evaluator

**Scenario:** An API architecture auditor evaluates endpoints against the 4 levels of the Richardson Maturity Model.

**Requirements:**
1. Write evaluateRmmLevel(apiSpec).
2. Level 0 (RPC/HTTP), Level 1 (Resources), Level 2 (HTTP Verbs & Statuses), Level 3 (HATEOAS).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateRmmLevel(apiSpec) {
>   if (!apiSpec) return { level: 0, description: "Level 0: Swamp of POX / RPC" };
>
>   const hasResources = apiSpec.hasMultipleResourceUris === true;
>   const usesVerbs = apiSpec.usesHttpVerbsAndStatuses === true;
>   const hasHateoas = apiSpec.includesHypermediaLinks === true;
>
>   if (hasResources && usesVerbs && hasHateoas) {
>     return { level: 3, description: "Level 3: Hypermedia Controls (HATEOAS)" };
>   }
>   if (hasResources && usesVerbs) {
>     return { level: 2, description: "Level 2: HTTP Verbs & Status Codes" };
>   }
>   if (hasResources) {
>     return { level: 1, description: "Level 1: Resources" };
>   }
>
>   return { level: 0, description: "Level 0: The Swamp of POX (Single URI RPC)" };
> }
>
> // Verification tests
> const l0 = evaluateRmmLevel({ hasMultipleResourceUris: false });
> console.assert(l0.level === 0, "Test 1 Failed");
>
> const l2 = evaluateRmmLevel({ hasMultipleResourceUris: true, usesHttpVerbsAndStatuses: true });
> console.assert(l2.level === 2, "Test 2 Failed");
>
> const l3 = evaluateRmmLevel({ hasMultipleResourceUris: true, usesHttpVerbsAndStatuses: true, includesHypermediaLinks: true });
> console.assert(l3.level === 3, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Level 0: Swamp of POX**: Single URI endpoint (e.g. /api) using POST for all RPC operations.
> 2. **Level 1: Resources**: Multiple URIs representing individual resources (/users, /orders), but using single method.
> 3. **Level 2: HTTP Verbs**: Uses distinct HTTP methods (GET, POST, PUT, DELETE) and standard HTTP status codes.
> 4. **Level 3: Hypermedia Controls**: Embeds HATEOAS links allowing clients to discover valid state transitions.
> 
---

### Exercise 2: Upgrading Level 0 RPC to Level 2 REST Verbs

**Scenario:** Refactors a legacy Level 0 RPC endpoint (`POST /doAction?action=deleteUser&id=5`) into a Level 2 REST endpoint (`DELETE /users/5`).

**Requirements:**
1. Write refactorRpcToLevel2(rpcReq).
2. Map RPC action to HTTP verb and clean URI.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function refactorRpcToLevel2(rpcRequest) {
>   const { url, body } = rpcRequest;
>   const action = body?.action || new URL(url, "http://a.com").searchParams.get("action");
>   const id = body?.id || new URL(url, "http://a.com").searchParams.get("id");
>
>   if (action === "getUser") {
>     return { method: "GET", path: `/users/${id}`, status: 200 };
>   }
>   if (action === "createUser") {
>     return { method: "POST", path: "/users", status: 201 };
>   }
>   if (action === "deleteUser") {
>     return { method: "DELETE", path: `/users/${id}`, status: 204 };
>   }
>
>   return { method: "POST", path: "/rpc", status: 200 };
> }
>
> // Verification tests
> const rpc1 = { url: "http://api.com/rpc", body: { action: "deleteUser", id: "42" } };
> const res1 = refactorRpcToLevel2(rpc1);
> console.assert(res1.method === "DELETE" && res1.path === "/users/42" && res1.status === 204, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Level 0 to Level 2 Refactoring**: Replaces single RPC endpoint paths with distinct resource URIs and HTTP verbs.
> 2. **HTTP Status Code Alignment**: Level 2 introduces 201 Created, 204 No Content, 404 Not Found instead of 200 OK with error bodies.
> 3. **Standard Tooling Support**: Level 2 APIs leverage standard HTTP caching proxies and security gateways.
> 
---

### Exercise 3: Level 3 Hypermedia Controls Navigation Adapter

**Scenario:** Implements a Level 3 API response wrapper that decorates resource representations with HATEOAS hypermedia controls.

**Requirements:**
1. Write wrapLevel3Response(resourceData, relLinks).
2. Return payload with `_links` object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function wrapLevel3Response(data, linksArray) {
>   const _links = {};
>   for (const link of linksArray) {
>     _links[link.rel] = { href: link.href, method: link.method || "GET" };
>   }
>   return {
>     ...data,
>     _links
>   };
> }
>
> // Verification tests
> const dataObj = { id: "u-10", name: "Alice" };
> const links = [
>   { rel: "self", href: "/users/u-10" },
>   { rel: "orders", href: "/users/u-10/orders" }
> ];
>
> const l3 = wrapLevel3Response(dataObj, links);
> console.assert(l3._links.self.href === "/users/u-10", "Test 1 Failed");
> console.assert(l3._links.orders.href === "/users/u-10/orders", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Glory of REST**: Level 3 (HATEOAS) is considered the complete realization of REST architectural principles.
> 2. **Self-Navigating APIs**: Clients inspect _links to discover next available actions without reading external docs.
> 3. **Evolving APIs**: Server can change URL structures safely as long as relation names (rel) remain unchanged.
---

## 6. Related Terms
- [Endpoints & Resources](endpoints_resources.md) — The resource URIs introduced in Level 1.
- [CRUD Operations](crud.md) — The HTTP-to-database actions standardized in Level 2.
- [HATEOAS](hateoas.md) — Related concept: HATEOAS.
- [REST (Representational State Transfer)](rest.md) — Related concept: REST (Representational State Transfer).

---

## 7. Key Takeaways
- The Richardson Maturity Model evaluates how closely an API follows REST principles.
- Level 0 tunnels requests to a single endpoint using `POST`.
- Level 1 introduces separate endpoints for individual resources.
- Level 2 leverages standard HTTP verbs and status codes for CRUD actions.
- Level 3 integrates HATEOAS to guide clients dynamically via hypermedia links.
- Level 2 is the practical standard for most production web APIs.
