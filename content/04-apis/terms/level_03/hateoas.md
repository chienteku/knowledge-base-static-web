# HATEOAS

> **Level 3 — RESTful APIs**
> Responses that embed links to next actions (REST maturity).

---

## 1. Prerequisites
- [REST (Representational State Transfer)](rest.md) — The fundamental web service architecture style.
- [Statelessness](statelessness.md) — The rule requiring requests to hold complete context.

---

## 2. Term Category

**Architecture / Design (Universal: Applies to public API architecture designs.)**: HATEOAS is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard APIs, responses return raw properties. For example, getting an order returns:
```json
{ "id": 105, "status": "unpaid", "total": 50.00 }
```
To proceed (e.g. paying for the order or canceling it), the client frontend code must have hardcoded knowledge of the server's endpoint URLs (like `/orders/105/pay` or `/orders/105/cancel`). If the backend team reorganizes these routes later, the client application breaks instantly.

To decouple clients from specific URL paths, REST introduces **HATEOAS** (Hypermedia As The Engine Of Application State):
- The server returns the resource data along with a **list of hypermedia links** describing the next actions available for that resource.
- Each link defines the relationship name (`rel`), the destination URL (`href`), and the HTTP `method` to use.
- The client does not hardcode URLs. Instead, it reads the links array dynamically, displaying buttons matching the links provided by the server.
- **Dynamic State Transitions:** If the order status updates to `"shipped"`, the server automatically removes the `"pay"` link and adds a `"track"` link. The client UI updates automatically without changing a single line of frontend code.

### (2) Reality Metaphor
- A **Non-HATEOAS API** is like using a **command-line terminal**. You read static text on the screen, and you must manually type an exact, memorized path to move to the next screen. If the command paths change, you get stuck.
- A **HATEOAS-compliant API** is like visiting a **web page in a browser**. The page displays text but also provides **clickable HTML links**. You don't have to guess or type the URL to see the contact page; you simply click the link labeled `"Contact Us"`. The page itself guides your next actions.

### (3) JSON Payload Comparison

#### 1. Plain API Response (No HATEOAS)
The client must construct the next paths manually.
```json
{
  "orderId": 105,
  "status": "unpaid",
  "amount": 50.00
}
```

#### 2. HATEOAS-Compliant Response (HAL/JSON Format)
The server provides the navigation links directly:
```json
{
  "orderId": 105,
  "status": "unpaid",
  "amount": 50.00,
  "links": [
    {
      "rel": "self",
      "href": "https://api.store.com/orders/105",
      "method": "GET"
    },
    {
      "rel": "payment",
      "href": "https://api.store.com/orders/105/pay",
      "method": "POST"
    },
    {
      "rel": "cancel",
      "href": "https://api.store.com/orders/105",
      "method": "DELETE"
    }
  ]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Over-engineering internal private APIs with HATEOAS

**The mistake:** Implementing complex HATEOAS frameworks for an API consumed only by a frontend written by the same team.

**Why it's wrong:** HATEOAS adds significant overhead to response payloads and increases server-side complexity. If the frontend and backend are developed together, hardcoding paths is usually simpler. HATEOAS is best suited for public APIs with long lifecycles consumed by third-party integrators.

---

### Mistake 2: Hardcoding Dependent Action URLs in Client Apps Instead of Using HATEOAS Links

**The mistake:** Hardcoding URL strings like `/api/accounts/123/deposit` in mobile app frontend source code.

**Why it's wrong:** Hardcoding URLs tightly couples the client to server URI structures. HATEOAS (Hypermedia As The Engine Of Application State) provides dynamic link relational targets in responses.

*Incorrect:*
```javascript
// Frontend client hardcoding payment action URL
const depositUrl = `/api/accounts/${account.id}/deposit`; // ❌ Breaks if backend refactors routes!
```

*Fix:*
```javascript
// Client dynamically navigates link relations provided in HATEOAS response:
const depositUrl = account._links.deposit.href;
```

---

### Mistake 3: Including Invalid Relation (`rel`) References in HAL / HATEOAS Response Objects

**The mistake:** Providing custom HATEOAS link objects without standardized `rel` or `href` attributes.

**Why it's wrong:** HATEOAS media formats (like HAL or JSON-LD) require standardized link object representations for client parsers to navigate navigation links dynamically.

*Incorrect:*
```json
{
  "id": 10,
  "links": ["/users/10/orders"] // ❌ Unstructured raw string link!
}
```

*Fix:*
```json
{
  "id": 10,
  "_links": {
    "self": { "href": "/users/10" },
    "orders": { "href": "/users/10/orders" }
  }
}
```


---

### Mistake 4: Hardcoding Dependent Action URLs in Client Apps Instead of Using HATEOAS Links

**The mistake:** Hardcoding URL strings like `/api/accounts/123/deposit` in mobile app frontend source code.

**Why it's wrong:** Hardcoding URLs tightly couples the client to server URI structures. HATEOAS (Hypermedia As The Engine Of Application State) provides dynamic link relational targets in responses.

*Incorrect:*
```javascript
// Frontend client hardcoding payment action URL
const depositUrl = `/api/accounts/${account.id}/deposit`; // ❌ Breaks if backend refactors routes!
```

*Fix:*
```javascript
// Client dynamically navigates link relations provided in HATEOAS response:
const depositUrl = account._links.deposit.href;
```

---

### Mistake 5: Including Invalid Relation (`rel`) References in HAL / HATEOAS Response Objects

**The mistake:** Providing custom HATEOAS link objects without standardized `rel` or `href` attributes.

**Why it's wrong:** HATEOAS media formats (like HAL or JSON-LD) require standardized link object representations for client parsers to navigate navigation links dynamically.

*Incorrect:*
```json
{
  "id": 10,
  "links": ["/users/10/orders"] // ❌ Unstructured raw string link!
}
```

*Fix:*
```json
{
  "id": 10,
  "_links": {
    "self": { "href": "/users/10" },
    "orders": { "href": "/users/10/orders" }
  }
}
```


---

### Mistake 6: Hardcoding Dependent Action URLs in Client Apps Instead of Using HATEOAS Links

**The mistake:** Hardcoding URL strings like `/api/accounts/123/deposit` in mobile app frontend source code.

**Why it's wrong:** Hardcoding URLs tightly couples the client to server URI structures. HATEOAS (Hypermedia As The Engine Of Application State) provides dynamic link relational targets in responses.

*Incorrect:*
```javascript
// Frontend client hardcoding payment action URL
const depositUrl = `/api/accounts/${account.id}/deposit`; // ❌ Breaks if backend refactors routes!
```

*Fix:*
```javascript
// Client dynamically navigates link relations provided in HATEOAS response:
const depositUrl = account._links.deposit.href;
```

---

### Mistake 7: Including Invalid Relation (`rel`) References in HAL / HATEOAS Response Objects

**The mistake:** Providing custom HATEOAS link objects without standardized `rel` or `href` attributes.

**Why it's wrong:** HATEOAS media formats (like HAL or JSON-LD) require standardized link object representations for client parsers to navigate navigation links dynamically.

*Incorrect:*
```json
{
  "id": 10,
  "links": ["/users/10/orders"] // ❌ Unstructured raw string link!
}
```

*Fix:*
```json
{
  "id": 10,
  "_links": {
    "self": { "href": "/users/10" },
    "orders": { "href": "/users/10/orders" }
  }
}
```


---

## 5. Practice Exercises

### Exercise 1: HATEOAS Hypermedia Link Generator (HAL Format)

**Scenario:** A RESTful API engine decorates order resources with HATEOAS `_links` allowing clients to discover valid state transitions.

**Requirements:**
1. Write buildHateoasOrderResponse(orderObj, baseUrl).
2. Generate self, cancel, and pay hypermedia links depending on order status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildHateoasOrderResponse(order, baseUrl = "https://api.example.com") {
>   if (!order || !order.id) return null;
>
>   const links = {
>     self: { href: `${baseUrl}/orders/${order.id}`, method: "GET" }
>   };
>
>   if (order.status === "PENDING") {
>     links.pay = { href: `${baseUrl}/orders/${order.id}/payment`, method: "POST" };
>     links.cancel = { href: `${baseUrl}/orders/${order.id}`, method: "DELETE" };
>   } else if (order.status === "PAID") {
>     links.shipment = { href: `${baseUrl}/orders/${order.id}/shipment`, method: "GET" };
>   }
>
>   return {
>     ...order,
>     _links: links
>   };
> }
>
> // Verification tests
> const pendingOrder = { id: "ord-1001", status: "PENDING", total: 49.99 };
> const res1 = buildHateoasOrderResponse(pendingOrder);
>
> console.assert(res1._links.self.href.includes("ord-1001"), "Test 1 Failed");
> console.assert(res1._links.pay !== undefined, "Test 2 Failed: Pending order must include pay link");
> console.assert(res1._links.cancel !== undefined, "Test 3 Failed: Pending order must include cancel link");
>
> const paidOrder = { id: "ord-1002", status: "PAID", total: 99.00 };
> const res2 = buildHateoasOrderResponse(paidOrder);
> console.assert(res2._links.pay === undefined, "Test 4 Failed: Paid order must NOT include pay link");
> ```
>
> #### Technical Explanation
>
> 1. **HATEOAS Concept**: Hypermedia As The Engine Of Application State: clients navigate APIs via hypermedia links embedded in responses.
> 2. **Dynamic State Machine**: Available _links dynamically change based on current resource status (e.g. pay link disappears once PAID).
> 3. **Decoupled Client Navigation**: Clients do not hardcode URL paths; they follow hypermedia link relations (rel names).
> 
---

### Exercise 2: HATEOAS Role-Based Action Discovery Engine

**Scenario:** An API endpoint filters hypermedia action links based on authenticated user roles (Admin vs User).

**Requirements:**
1. Write buildUserHateoasLinks(targetUser, currentUserRole, baseUrl).
2. Expose edit/delete links ONLY if role === "ADMIN".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildUserHateoasLinks(targetUser, currentUserRole, baseUrl = "https://api.com") {
>   const links = {
>     self: { href: `${baseUrl}/users/${targetUser.id}`, method: "GET" }
>   };
>
>   if (currentUserRole === "ADMIN") {
>     links.edit = { href: `${baseUrl}/users/${targetUser.id}`, method: "PUT" };
>     links.delete = { href: `${baseUrl}/users/${targetUser.id}`, method: "DELETE" };
>   }
>
>   return {
>     id: targetUser.id,
>     name: targetUser.name,
>     _links: links
>   };
> }
>
> // Verification tests
> const user = { id: "u-1", name: "Alice" };
>
> const adminView = buildUserHateoasLinks(user, "ADMIN");
> console.assert(adminView._links.edit !== undefined && adminView._links.delete !== undefined, "Test 1 Failed");
>
> const userView = buildUserHateoasLinks(user, "USER");
> console.assert(userView._links.edit === undefined && userView._links.delete === undefined, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Role-Based Link Filtering**: HATEOAS advertises only actions the current authenticated user is authorized to perform.
> 2. **Self-Describing Responses**: Reduces client-side authorization check errors by concealing unauthorized links.
> 3. **Richardson Maturity Model Level 3**: HATEOAS represents the highest level (Level 3) of REST API maturity.
> 
---

### Exercise 3: HAL Document Collection Link Extractor

**Scenario:** A REST client helper extracts pagination hypermedia links (`next`, `prev`, `first`, `last`) from HAL JSON collections.

**Requirements:**
1. Write extractPaginationLinks(halResponse).
2. Return object with next, prev, first, last URL strings.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractPaginationLinks(halResponse) {
>   if (!halResponse || !halResponse._links) {
>     return { hasNext: false, nextUrl: null, prevUrl: null };
>   }
>
>   const links = halResponse._links;
>   return {
>     firstUrl: links.first?.href || null,
>     prevUrl: links.prev?.href || null,
>     nextUrl: links.next?.href || null,
>     lastUrl: links.last?.href || null,
>     hasNext: Boolean(links.next?.href),
>     hasPrev: Boolean(links.prev?.href)
>   };
> }
>
> // Verification tests
> const halDoc = {
>   _embedded: { items: [1, 2, 3] },
>   _links: {
>     self: { href: "/items?page=2" },
>     prev: { href: "/items?page=1" },
>     next: { href: "/items?page=3" }
>   }
> };
>
> const paginated = extractPaginationLinks(halDoc);
> console.assert(paginated.hasNext === true && paginated.nextUrl === "/items?page=3", "Test 1 Failed");
> console.assert(paginated.hasPrev === true && paginated.prevUrl === "/items?page=1", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HAL Specification**: Hypertext Application Language defines standard JSON conventions for _links and _embedded items.
> 2. **Hypermedia Pagination**: Clients navigate paginated collections by following next/prev links instead of computing offset page math.
> 3. **Loose Coupling**: Server can change pagination query parameters without breaking client code.
---

## 6. Related Terms
- [Endpoints & Resources](endpoints_resources.md) — The target nodes navigated via hypermedia links.
- [Richardson Maturity Model](richardson_maturity_model.md) — The grading scale where HATEOAS represents the highest level of REST design.

---

## 7. Key Takeaways
- HATEOAS stands for Hypermedia As The Engine Of Application State.
- It embeds hypermedia links inside API payloads to guide clients on available next actions.
- Each link record specifies a relationship title (`rel`), a path (`href`), and an HTTP verb (`method`).
- It decouples clients from hardcoded URL paths, letting the server update routes dynamically.
- Use HATEOAS for public-facing developer APIs; skip it for simple, private internal systems to avoid overhead.
