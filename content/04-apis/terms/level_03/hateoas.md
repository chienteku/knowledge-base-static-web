# HATEOAS

> **Level 3 — RESTful APIs**
> Responses that embed links to next actions (REST maturity).

---

## 1. Prerequisites
- [REST (Representational State Transfer)](rest.md) — The fundamental web service architecture style.
- [Statelessness](statelessness.md) — The rule requiring requests to hold complete context.
---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Applies to public API architecture designs.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: State Transition Builder

**Problem:** You are building a HATEOAS endpoint. The order status has transitioned from `"unpaid"` to `"shipped"`. Which links should you remove, and which should you add to the JSON links array?

**Available link relations:** `payment`, `cancel`, `track-shipment`, `return-item`.

> [!check]- Answer
> - You cannot pay for or cancel a package that has already been shipped.
> - You cannot return an item that hasn't been delivered yet.

> [!check]- Answer
> - **Remove:** `payment` and `cancel` (These actions are no longer valid for a shipped order).
> - **Add:** `track-shipment` (Allows the client to query tracking info).


---

### Exercise 2: HATEOAS HAL JSON Response Design

**Problem:** Write HAL-compliant JSON payload for order (`id: 99`, `status: "shipped"`) containing HATEOAS links for `self` and `track` actions.

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "id": 99,
>   "status": "shipped",
>   "_links": {
>     "self": { "href": "/api/orders/99" },
>     "track": { "href": "/api/orders/99/tracking" }
>   }
> }
> ```
> ```json
> {
> "id": 99,
> "status": "shipped",
> "_links": {
> "self": { "href": "/api/orders/99" },
> "track": { "href": "/api/orders/99/tracking" }
> }
> }
> ```
> - **Explanation:** HATEOAS payloads embed hypermedia controls so clients can discover valid state transitions.
---

### Exercise 3: Richardson Maturity Model HATEOAS Level

**Problem:** Which level of the Richardson Maturity Model requires HATEOAS hypermedia controls?

**Expected output:**
> [!check]- Answer
> ```text
> Level 3 (The highest level of REST maturity).
> ```
> ```text
> Level 3 (Hypermedia Controls / HATEOAS).
> ```
> - **Explanation:** Level 3 APIs use hypermedia to drive application state transitions dynamically.
---

### Exercise 4: HATEOAS HAL JSON Response Design

**Problem:** Write HAL-compliant JSON payload for order (`id: 99`, `status: "shipped"`) containing HATEOAS links for `self` and `track` actions.

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "id": 99,
>   "status": "shipped",
>   "_links": {
>     "self": { "href": "/api/orders/99" },
>     "track": { "href": "/api/orders/99/tracking" }
>   }
> }
> ```
> ```json
> {
> "id": 99,
> "status": "shipped",
> "_links": {
> "self": { "href": "/api/orders/99" },
> "track": { "href": "/api/orders/99/tracking" }
> }
> }
> ```
> - **Explanation:** HATEOAS payloads embed hypermedia controls so clients can discover valid state transitions.
---

### Exercise 5: Richardson Maturity Model HATEOAS Level

**Problem:** Which level of the Richardson Maturity Model requires HATEOAS hypermedia controls?

**Expected output:**
> [!check]- Answer
> ```text
> Level 3 (The highest level of REST maturity).
> ```
> ```text
> Level 3 (Hypermedia Controls / HATEOAS).
> ```
> - **Explanation:** Level 3 APIs use hypermedia to drive application state transitions dynamically.
---

### Exercise 6: HATEOAS HAL JSON Response Design

**Problem:** Write HAL-compliant JSON payload for order (`id: 99`, `status: "shipped"`) containing HATEOAS links for `self` and `track` actions.

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "id": 99,
>   "status": "shipped",
>   "_links": {
>     "self": { "href": "/api/orders/99" },
>     "track": { "href": "/api/orders/99/tracking" }
>   }
> }
> ```
> ```json
> {
> "id": 99,
> "status": "shipped",
> "_links": {
> "self": { "href": "/api/orders/99" },
> "track": { "href": "/api/orders/99/tracking" }
> }
> }
> ```
> - **Explanation:** HATEOAS payloads embed hypermedia controls so clients can discover valid state transitions.
---

### Exercise 7: Richardson Maturity Model HATEOAS Level

**Problem:** Which level of the Richardson Maturity Model requires HATEOAS hypermedia controls?

**Expected output:**
> [!check]- Answer
> ```text
> Level 3 (The highest level of REST maturity).
> ```
> ```text
> Level 3 (Hypermedia Controls / HATEOAS).
> ```
> - **Explanation:** Level 3 APIs use hypermedia to drive application state transitions dynamically.
---

## 7. Related Terms
- [Endpoints & Resources](endpoints_resources.md) — The target nodes navigated via hypermedia links.
- [Richardson Maturity Model](richardson_maturity_model.md) — The grading scale where HATEOAS represents the highest level of REST design.
---

## 8. Key Takeaways
- HATEOAS stands for Hypermedia As The Engine Of Application State.
- It embeds hypermedia links inside API payloads to guide clients on available next actions.
- Each link record specifies a relationship title (`rel`), a path (`href`), and an HTTP verb (`method`).
- It decouples clients from hardcoded URL paths, letting the server update routes dynamically.
- Use HATEOAS for public-facing developer APIs; skip it for simple, private internal systems to avoid overhead.
