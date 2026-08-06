# Statelessness

> **Level 3 — RESTful APIs**
> A core principle of REST where the Server does not remember anything about the Client between requests. Every request must be completely self-contained.

---

## 1. Prerequisites
- [Client-Server Model](../level_01/client_server_model.md) — This dictates how the two sides interact.
- [REST (Representational State Transfer)](rest.md) — Statelessness is the "ST" in Representational State Transfer.

---

## 2. Term Category
- **API Architecture / Principle**

---

## 3. Environment Context
- **Universal Standard** (Essential for backend scalability).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the 1990s, servers were "Stateful". If you logged in, the server created a session in its memory: "User Bob is logged in." When you clicked the next page, the server checked its memory, remembered Bob, and loaded the page.
This works fine for 100 users. But what if you are Netflix, and you have 10 million users clicking simultaneously? You cannot store 10 million sessions in server memory—the server will run out of RAM and crash. Furthermore, if you use 5 different servers to handle the traffic, and Bob logs into Server A, Server B won't know who Bob is!
**Statelessness** solves this scaling problem. In a stateless architecture, the server has amnesia. It remembers nothing. Every time the Client makes a request, it must re-introduce itself and prove it has permission to access the data.

### (2) Reality Metaphor
**Stateful (The old way):** You go to a fancy restaurant. The Maitre D' recognizes your face, remembers you are a VIP, and seats you immediately. (The Server relies on its own memory).
**Stateless (The API way):** You go to a movie theater. The ticket taker does not know who you are. To get in, you must show your physical ticket. If you leave to use the bathroom and try to re-enter 5 minutes later, the ticket taker has total amnesia. You MUST show your ticket again. (Every single request must include authentication).

### (3) How it works in Practice
Because the API backend is stateless, the burden of "remembering" falls entirely on the Frontend (the Client). 
1. The user types their password and clicks Login.
2. The Server verifies the password, creates a **Token** (the movie ticket), and sends it to the Client.
3. The Client saves this Token in `localStorage`.
4. On *every subsequent HTTP request*, the Client must attach this Token in the HTTP Headers. If the Token is missing, the Server instantly rejects the request with a `401 Unauthorized`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use Server-Side Sessions in a distributed API

**The mistake:** A developer builds a Node.js API and uses `express-session` to store the logged-in user's ID in server memory.

**Why it's wrong:** Once your app gets popular, you deploy it to AWS across 3 different servers using a Load Balancer. The user logs into Server 1. The next time they click a button, the Load Balancer routes their request to Server 2. Server 2 says "I don't have a session for you in my memory!" and logs the user out. 
**Golden Rule:** REST APIs must be stateless. Use JWTs (JSON Web Tokens) instead of server memory so that *any* server can independently verify the user's ticket without relying on shared memory!

---

### Mistake 2: Relying on Server In-Memory Session Caches Across Load-Balanced Clusters

**The mistake:** Storing user login state in a Node.js global variable (`const sessions = {}`) on a server deployed across 5 load-balanced instances.

**Why it's wrong:** When subsequent API calls land on a different server instance, the in-memory session is missing, forcing the user to log in repeatedly.

*Incorrect:*
```javascript
// Server-side in-memory session state
let currentUser = null;
app.post('/login', (req, res) => { currentUser = req.body.user; }); // ❌ Fails on multi-instance clusters!
```

*Fix:*
```javascript
// Pass self-contained state in incoming Authorization header per request:
const authHeader = req.headers.authorization; // Server verifies JWT statelessly
```

---

### Mistake 3: Requiring Sequential Ordered API Requests to Complete a Workflow

**The mistake:** Designing an API where calling Step 2 fails unless the server remembers context from Step 1 in server state.

**Why it's wrong:** REST statelessness dictates that every request MUST contain all information needed to process it. State transitions should be driven by client payloads or persistent database state.

*Incorrect:*
```http
/* Step 2 assumes server remembers step 1 state from previous HTTP request */
```

*Fix:*
```http
POST /api/checkout/step2 HTTP/1.1

{"cartId": "abc-123", "step1Completed": true} // Client supplies complete context
```


---

### Mistake 4: Relying on Server In-Memory Session Caches Across Load-Balanced Clusters

**The mistake:** Storing user login state in a Node.js global variable (`const sessions = {}`) on a server deployed across 5 load-balanced instances.

**Why it's wrong:** When subsequent API calls land on a different server instance, the in-memory session is missing, forcing the user to log in repeatedly.

*Incorrect:*
```javascript
// Server-side in-memory session state
let currentUser = null;
app.post('/login', (req, res) => { currentUser = req.body.user; }); // ❌ Fails on multi-instance clusters!
```

*Fix:*
```javascript
// Pass self-contained state in incoming Authorization header per request:
const authHeader = req.headers.authorization; // Server verifies JWT statelessly
```

---

### Mistake 5: Requiring Sequential Ordered API Requests to Complete a Workflow

**The mistake:** Designing an API where calling Step 2 fails unless the server remembers context from Step 1 in server state.

**Why it's wrong:** REST statelessness dictates that every request MUST contain all information needed to process it. State transitions should be driven by client payloads or persistent database state.

*Incorrect:*
```http
/* Step 2 assumes server remembers step 1 state from previous HTTP request */
```

*Fix:*
```http
POST /api/checkout/step2 HTTP/1.1

{"cartId": "abc-123", "step1Completed": true} // Client supplies complete context
```


---

### Mistake 6: Relying on Server In-Memory Session Caches Across Load-Balanced Clusters

**The mistake:** Storing user login state in a Node.js global variable (`const sessions = {}`) on a server deployed across 5 load-balanced instances.

**Why it's wrong:** When subsequent API calls land on a different server instance, the in-memory session is missing, forcing the user to log in repeatedly.

*Incorrect:*
```javascript
// Server-side in-memory session state
let currentUser = null;
app.post('/login', (req, res) => { currentUser = req.body.user; }); // ❌ Fails on multi-instance clusters!
```

*Fix:*
```javascript
// Pass self-contained state in incoming Authorization header per request:
const authHeader = req.headers.authorization; // Server verifies JWT statelessly
```

---

### Mistake 7: Requiring Sequential Ordered API Requests to Complete a Workflow

**The mistake:** Designing an API where calling Step 2 fails unless the server remembers context from Step 1 in server state.

**Why it's wrong:** REST statelessness dictates that every request MUST contain all information needed to process it. State transitions should be driven by client payloads or persistent database state.

*Incorrect:*
```http
/* Step 2 assumes server remembers step 1 state from previous HTTP request */
```

*Fix:*
```http
POST /api/checkout/step2 HTTP/1.1

{"cartId": "abc-123", "step1Completed": true} // Client supplies complete context
```


---

## 6. Practice Exercises

### Exercise 1: Stateful or Stateless?

**Problem:** The user clicks "Add to Cart". The server saves the cart item to a database table called `ShoppingCarts` linked to the user's ID. Is this a violation of statelessness?

**Expected output:**
> [!check]- Answer
> ```text
> No! 
> Statelessness means the server doesn't remember the *connection context* or *session state* in its RAM. Saving business data (like a shopping cart) to a permanent Database is perfectly fine and required. The "State" in stateless refers to the session, not the database.
> ```
> - Does the server know who the user is without a token? No.
> - Is it okay for databases to store data? Yes!
> 
---

### Exercise 2: Statelessness Definition & Benefits

**Problem:** State the primary requirement of REST Statelessness and its core architectural benefit.

**Expected output:**
> [!check]- Answer
> ```text
> Requirement: Every HTTP request from client to server must contain all contextual information necessary to understand and process the request.
> Benefit: Horizontal scalability (any server instance can handle any incoming request).
> ```
> ```text
> Requirement: Every HTTP request must be self-contained.
> Benefit: Horizontal scalability and simplified server recovery.
> ```
> - **Explanation:** Stateless servers can scale horizontally behind load balancers with zero session sync overhead.
---

### Exercise 3: Where Does Session State Live?

**Problem:** In a stateless REST architecture, where should session state (e.g. current user ID, permissions) reside?

**Expected output:**
> [!check]- Answer
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> - **Explanation:** The client maintains state and transmits it with every API call.
---

### Exercise 4: Statelessness Definition & Benefits

**Problem:** State the primary requirement of REST Statelessness and its core architectural benefit.

**Expected output:**
> [!check]- Answer
> ```text
> Requirement: Every HTTP request from client to server must contain all contextual information necessary to understand and process the request.
> Benefit: Horizontal scalability (any server instance can handle any incoming request).
> ```
> ```text
> Requirement: Every HTTP request must be self-contained.
> Benefit: Horizontal scalability and simplified server recovery.
> ```
> - **Explanation:** Stateless servers can scale horizontally behind load balancers with zero session sync overhead.
---

### Exercise 5: Where Does Session State Live?

**Problem:** In a stateless REST architecture, where should session state (e.g. current user ID, permissions) reside?

**Expected output:**
> [!check]- Answer
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> - **Explanation:** The client maintains state and transmits it with every API call.
---

### Exercise 6: Statelessness Definition & Benefits

**Problem:** State the primary requirement of REST Statelessness and its core architectural benefit.

**Expected output:**
> [!check]- Answer
> ```text
> Requirement: Every HTTP request from client to server must contain all contextual information necessary to understand and process the request.
> Benefit: Horizontal scalability (any server instance can handle any incoming request).
> ```
> ```text
> Requirement: Every HTTP request must be self-contained.
> Benefit: Horizontal scalability and simplified server recovery.
> ```
> - **Explanation:** Stateless servers can scale horizontally behind load balancers with zero session sync overhead.
---

### Exercise 7: Where Does Session State Live?

**Problem:** In a stateless REST architecture, where should session state (e.g. current user ID, permissions) reside?

**Expected output:**
> [!check]- Answer
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> ```text
> Entirely on the Client (encapsulated inside JWT access tokens or request credentials).
> ```
> - **Explanation:** The client maintains state and transmits it with every API call.
---

## 7. Related Terms
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — The "movie ticket" used to make Stateless APIs possible.
- [localStorage & sessionStorage](../level_09/web_storage.md) — The mechanism commonly used to store session tokens in the browser.
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — Related concept: Idempotent vs Safe Methods.
- [Basic & Bearer Authentication](../level_04/basic_bearer_auth.md) — Related concept: Basic & Bearer Authentication.
- [REST (Representational State Transfer)](rest.md) — Related concept: REST (Representational State Transfer).

---

## 8. Key Takeaways
- **Statelessness** means the Server does not store any information about the Client's session in memory.
- Every single HTTP request must be completely self-contained (including authentication tokens and all necessary data).
- Statelessness allows companies to infinitely scale their backends across thousands of servers without worrying about syncing session memory between them.
