# Idempotent vs Safe Methods

> **Level 2 — HTTP Anatomy**
> Which verbs are safe (GET) vs idempotent (PUT/DELETE) vs neither (POST).

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](./http_methods.md) — The standard verbs defining request actions.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal**: Governs the design of web APIs and client retry logic.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing network code, client devices must handle unreliable connections. If a client sends a request to update a profile, but the network connection drops before receiving the server's reply, the client does not know if the update succeeded. 

Can the client safely retry sending the exact same request automatically?

To establish a clear contract between clients and servers, the HTTP specification categorizes HTTP methods based on two semantic properties: **Safety** and **Idempotency**.

#### Safe Methods (Read-Only)
An HTTP method is **safe** if executing it **does not modify server resource state**.
- **Behavior:** These are strictly "read-only" operations.
- **Safe Verbs:** `GET`, `HEAD`, `OPTIONS`.
- **Optimization:** Because they are safe, browsers can aggressively cache responses, pre-fetch them, and retry them automatically without asking the user.

#### Idempotent Methods (Single-Effect)
An HTTP method is **idempotent** if making **multiple identical requests has the same effect as making a single request**. The server's state ends up exactly the same whether you call the method once or 100 times.
- **Idempotent Verbs:** `GET`, `HEAD`, `OPTIONS` (all safe methods are idempotent), plus **`PUT`** (replacing a resource) and **`DELETE`** (removing a resource).
  - *`PUT /users/42 {"name": "Bob"}`* is idempotent. If you repeat it, the name remains `"Bob"`.
  - *`DELETE /users/42`* is idempotent. The user is deleted on the first call. Subsequent calls return `404 Not Found`, but the *server state* (user 42 is gone) remains unchanged.

#### Non-Idempotent Methods (Accumulative)
- **`POST` is not idempotent:** Sending `POST /users {"name": "Bob"}` five times will create five separate database rows with five unique IDs.
- **`PATCH` is generally not idempotent:** While `PATCH /users/42 {"age": 30}` is idempotent, a patch operation that increments a value (`PATCH /users/42 {"score": {"$inc": 1}}`) is not.

### (2) Reality Metaphor
Imagine a panel containing light switches and buttons.
- A **Safe Method (`GET`)** is like **reading the label** on a switch. You look at it to see if it says "Living Room". Reading it does not move the switch or change the lighting state.
- An **Idempotent Method (`PUT`/`DELETE`)** is like pushing a **"Turn On" button**. If the light is off, pushing it once turns it on. Pushing it 100 times leaves the light on. The final state is identical.
- A **Non-Idempotent Method (`POST`)** is like pushing a **clicker counter button**. Every time you push the button, the counter increments. Pushing it 10 times results in a value of 10.

### (3) API State Examples (Database operations)

```javascript
// GET /user/42 (Safe & Idempotent)
// Multiple reads yield the same record without changing database state.
function handleGet(id) {
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

// PUT /user/42 (Idempotent, NOT Safe)
// Overwrites state. Running it 10 times leaves age at 30.
function handlePut(id, newAge) {
  db.query("UPDATE users SET age = ? WHERE id = ?", [newAge, id]);
}

// POST /user (NOT Idempotent, NOT Safe)
// Running it 3 times inserts 3 distinct rows.
function handlePost(userData) {
  db.query("INSERT INTO users (name) VALUES (?)", [userData.name]);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Modifying state inside a GET request

**The mistake:** Creating a delete link using a GET request (e.g. `<a href="/api/users/delete?id=42">Delete</a>`).

**Why it's wrong:** GET requests are defined as safe. Because they are safe, web browsers, search engine crawlers (like Googlebot), and pre-fetching plugins will aggressively follow these links automatically to index your pages. If you delete data on a GET request, a web crawler visiting your site will silently delete your entire database.

*Incorrect:*
```javascript
// Server route:
app.get('/api/users/delete', (req, res) => {
  db.deleteUser(req.query.id); // VULNERABILITY: State mutation on GET!
});
```

*Fix:* Use the correct `DELETE` verb, triggered via a client script or form submit.

---

### Mistake 2: Assuming `POST` Operations Are Idempotent

**The mistake:** Retrying a failed `POST /api/orders` request automatically without an idempotency key.

**Why it's wrong:** `POST` is neither safe nor idempotent. Retrying a `POST` payment or order request creates duplicate transactions and double-charges the customer.

*Incorrect:*
```javascript
// Automatic retry loop on failed POST
for(let i = 0; i < 3; i++) {
  await fetch('/api/orders', { method: 'POST', body: orderData }); // ❌ Creates 3 duplicate orders!
}
```

*Fix:*
```javascript
// Include Idempotency-Key header when retrying POST operations:
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Idempotency-Key': 'unique-order-uuid' },
  body: orderData
});
```

---

### Mistake 3: Making `DELETE` Operations Non-Idempotent

**The mistake:** Designing a `DELETE /api/queue/items` endpoint that pops the top item off a queue.

**Why it's wrong:** Calling `DELETE` repeatedly on an idempotent endpoint must result in the same server state. Popping items alters state on every execution, violating idempotency contracts.

*Incorrect:*
```http
DELETE /api/queue/next HTTP/1.1 ; ❌ Pops a different item on every call!
```

*Fix:*
```http
DELETE /api/queue/items/item-123 HTTP/1.1 ; Targeted item deletion is idempotent
```


---

## 6. Practice Exercises

### Exercise 1: Semantic Classifier

**Problem:** Classify the following API actions as either **Safe**, **Idempotent (but not safe)**, or **Neither**:

1. `GET /products/search?q=shoes`
2. `POST /orders/checkout {"items": [101]}`
3. `PUT /profiles/user42/avatar {"url": "avatar.jpg"}`
4. `DELETE /messages/55`

> [!check]- Answer
> - 1. **Safe** (It is a read-only search lookup).
> - 2. **Neither** (POST checkouts create orders; repeating it charges the user twice).
> - 3. **Idempotent** (Replaces the avatar URL. Repeated calls result in the same avatar state).
> - 4. **Idempotent** (Repeated deletions leave the message gone).


---

### Exercise 2: Safe and Idempotent Property Matrix

**Problem:** Classify each HTTP method as Safe (Yes/No) and Idempotent (Yes/No):
1. GET
2. POST
3. PUT
4. DELETE

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET: Safe=Yes, Idempotent=Yes
> 2. POST: Safe=No, Idempotent=No
> 3. PUT: Safe=No, Idempotent=Yes
> 4. DELETE: Safe=No, Idempotent=Yes
> ```
> ```text
> 1. GET    -> Safe: Yes, Idempotent: Yes
> 2. POST   -> Safe: No,  Idempotent: No
> 3. PUT    -> Safe: No,  Idempotent: Yes
> 4. DELETE -> Safe: No,  Idempotent: Yes
> ```
> - **Explanation:** Safe methods do not alter state; Idempotent methods yield identical results regardless of N repetitions.
---

### Exercise 3: HTTP 404 Response on Repeated DELETE

**Problem:** If `DELETE /users/5` returns 200 OK on first call and 404 Not Found on second call, is the endpoint still idempotent?

**Expected output:**
> [!check]- Answer
> ```text
> Yes. Idempotency guarantees the underlying server state is identical after N calls (the user remains deleted), even if the HTTP status code changes.
> ```
> ```text
> Yes. Idempotency guarantees the underlying server state is identical after N calls (the user remains deleted), even if the HTTP status code changes.
> ```
> - **Explanation:** Idempotency evaluates backend state consistency, not strict status code identity.
---

## 7. Related Terms
- [Statelessness](../level_03/statelessness.md) — The architectural constraint requiring requests to carry their own state.
- [CRUD Operations](../level_03/crud.md) — The persistent database actions mapped to HTTP verbs.

---

## 8. Key Takeaways
- Safe methods (GET, HEAD) never modify server state and are read-only.
- Idempotent methods (GET, PUT, DELETE) have the same final effect on server state whether called once or 100 times.
- POST is neither safe nor idempotent; repeating it duplicates resources.
- Browsers and routers are permitted to retry failed idempotent requests automatically, but will prompt the user before retrying a POST request.
- Never write state-mutating logic (like deleting rows) inside GET handlers.
