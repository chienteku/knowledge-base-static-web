# API (Application Programming Interface)

> **Level 3 — RESTful APIs**
> A set of rules and mechanisms that allow two different software applications to talk to each other.

---

## 1. Prerequisites
- [Client-Server Model](../level_01/client_server_model.md) — The API is the bridge between these two entities.

---

## 2. Term Category
- **Architecture / Interoperability**

---

## 3. Environment Context
- **Universal** (APIs exist everywhere, not just on the web!).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Remote Control

**Problem:** You buy a new TV. You don't know how to solder circuits, and you can't manually change the voltage inside the TV to change the channel. But the TV comes with a remote control with 15 specific buttons. How is the remote control like an API?

**Expected output:**
```text
The remote control provides a strictly defined "Interface" (buttons) for interacting with a complex underlying system (the TV hardware). It abstracts away the complexity and prevents you from breaking the TV, only allowing you to perform the specific actions the manufacturer designed.
```

> [!check]- Answer
> - Does the remote let you do *anything*, or only what the buttons allow?

---

### Exercise 2: API Abstraction Boundary Identification

**Problem:** Explain the concept of an API as an abstraction layer between two software systems.

**Expected output:**
```text
An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
```

> [!check]- Answer
> ```text
> An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
> ```
> - **Explanation:** APIs decouple client interfaces from internal backend infrastructure implementation details.
---

### Exercise 3: Public vs Internal API Distinction

**Problem:** Distinguish between Public APIs, Partner APIs, and Internal (Private) APIs.

**Expected output:**
```text
Public APIs are open for external developers; Partner APIs are shared with specific business partners; Internal APIs connect microservices inside an organization.
```

> [!check]- Answer
> ```text
> Public APIs -> Open to third-party external developers.
> Partner APIs -> Restricted to authorized business integration partners.
> Internal APIs -> Private microservice communication within an organization.
> ```
> - **Explanation:** API access scope determines security controls and audience reach.
---

### Exercise 4: API Abstraction Boundary Identification

**Problem:** Explain the concept of an API as an abstraction layer between two software systems.

**Expected output:**
```text
An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
```

> [!check]- Answer
> ```text
> An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
> ```
> - **Explanation:** APIs decouple client interfaces from internal backend infrastructure implementation details.
---

### Exercise 5: Public vs Internal API Distinction

**Problem:** Distinguish between Public APIs, Partner APIs, and Internal (Private) APIs.

**Expected output:**
```text
Public APIs are open for external developers; Partner APIs are shared with specific business partners; Internal APIs connect microservices inside an organization.
```

> [!check]- Answer
> ```text
> Public APIs -> Open to third-party external developers.
> Partner APIs -> Restricted to authorized business integration partners.
> Internal APIs -> Private microservice communication within an organization.
> ```
> - **Explanation:** API access scope determines security controls and audience reach.
---

### Exercise 6: API Abstraction Boundary Identification

**Problem:** Explain the concept of an API as an abstraction layer between two software systems.

**Expected output:**
```text
An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
```

> [!check]- Answer
> ```text
> An API hides complex internal business logic and database implementations behind a clean, predictable request/response interface contract.
> ```
> - **Explanation:** APIs decouple client interfaces from internal backend infrastructure implementation details.
---

### Exercise 7: Public vs Internal API Distinction

**Problem:** Distinguish between Public APIs, Partner APIs, and Internal (Private) APIs.

**Expected output:**
```text
Public APIs are open for external developers; Partner APIs are shared with specific business partners; Internal APIs connect microservices inside an organization.
```

> [!check]- Answer
> ```text
> Public APIs -> Open to third-party external developers.
> Partner APIs -> Restricted to authorized business integration partners.
> Internal APIs -> Private microservice communication within an organization.
> ```
> - **Explanation:** API access scope determines security controls and audience reach.
---

## 7. Related Terms
- [REST](../level_03/rest.md) — The most popular architectural style for building Web APIs.
- [JSON](../level_01/json.md) — The food the waiter carries back from the kitchen.

---

## 8. Key Takeaways
- **API** stands for Application Programming Interface.
- It is a controlled bridge that allows two software systems to communicate.
- It hides the complexity and secures the underlying database by only allowing specific requests.
- APIs exist everywhere (Hardware, Browsers, Web), but Web APIs use HTTP and URLs.
