# Statelessness

> **Level 3 — RESTful APIs**
> A core principle of REST where the Server does not remember anything about the Client between requests. Every request must be completely self-contained.

---

## 1. Prerequisites
- [Client-Server Model](../level_01/client_server_model.md) — This dictates how the two sides interact.
- [REST (Representational State Transfer)](rest.md) — Statelessness is the "ST" in Representational State Transfer.

---

## 2. Term Category

**API Architecture / Principle (Universal Standard .)**: Statelessness is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Stateless Bearer Token Authorization Handler

**Scenario:** A stateless microservice authenticates incoming HTTP requests using self-contained Bearer tokens without server session lookups.

**Requirements:**
1. Write processStatelessAuth(req, tokenVerifier).
2. Extract Bearer token.
3. Verify token self-contained claims.
4. Return user context.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processStatelessAuth(request, tokenVerifier) {
>   const authHeader = request?.headers?.["authorization"] || request?.headers?.["Authorization"];
>   if (!authHeader || !authHeader.startsWith("Bearer ")) {
>     return { authenticated: false, status: 401, error: "Missing Bearer Token" };
>   }
>
>   const token = authHeader.substring(7);
>   try {
>     const claims = tokenVerifier(token);
>     return {
>       authenticated: true,
>       status: 200,
>       user: { id: claims.sub, role: claims.role }
>     };
>   } catch (err) {
>     return { authenticated: false, status: 401, error: "Invalid Token" };
>   }
> }
>
> // Verification tests
> const mockVerifier = (t) => {
>   if (t === "valid-token") return { sub: "usr-1", role: "admin" };
>   throw new Error("Bad token");
> };
>
> const req1 = { headers: { "Authorization": "Bearer valid-token" } };
> const res1 = processStatelessAuth(req1, mockVerifier);
> console.assert(res1.authenticated === true && res1.user.id === "usr-1", "Test 1 Failed");
>
> const req2 = { headers: { "Authorization": "Bearer bad-token" } };
> console.assert(processStatelessAuth(req2, mockVerifier).status === 401, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Statelessness Core Rule**: The server stores no client context between requests; every request carries all credentials needed.
> 2. **Self-Contained Tokens (JWT)**: JWTs encode user identity and claims directly in the token, eliminating database session lookups.
> 3. **Horizontal Scalability**: Any server instance in a cluster can process any request independently.
> 
---

### Exercise 2: Stateless Server Horizontal Load Balancer Router

**Scenario:** Simulates a stateless API cluster behind a Round-Robin load balancer where requests are dispatched to any server node randomly.

**Requirements:**
1. Write dispatchStatelessCluster(request, serverNodes).
2. Select server node.
3. Verify node processes request without prior session state.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchStatelessCluster(request, serverNodes) {
>   if (!Array.isArray(serverNodes) || serverNodes.length === 0) {
>     throw new Error("No server nodes available");
>   }
>
>   // Random node selection demonstrates session-independent stateless execution
>   const nodeIndex = Math.floor(Math.random() * serverNodes.length);
>   const targetNode = serverNodes[nodeIndex];
>
>   return targetNode.handleRequest(request);
> }
>
> // Verification tests
> const nodes = [
>   { id: "node-1", handleRequest: (req) => ({ node: "node-1", status: 200 }) },
>   { id: "node-2", handleRequest: (req) => ({ node: "node-2", status: 200 }) }
> ];
>
> const res = dispatchStatelessCluster({ path: "/data" }, nodes);
> console.assert(res.status === 200, "Test 1 Failed");
> console.assert(["node-1", "node-2"].includes(res.node), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **No Sticky Sessions Needed**: Stateless servers eliminate the need for load balancer sticky session routing.
> 2. **Fault Tolerance**: If a server node crashes, requests seamlessly route to healthy nodes without session loss.
> 3. **Cost Efficiency**: Simplifies infrastructure and lowers memory overhead on application servers.
> 
---

### Exercise 3: Session State Migration to Client-Side State Payload

**Scenario:** Refactors a legacy stateful server session counter into a client-sent request payload parameter.

**Requirements:**
1. Write processClientState(payload).
2. Client sends current state in request.
3. Server increments state and returns new state.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processClientState(clientPayload) {
>   const currentCount = Number(clientPayload?.stepCount || 0);
>   const nextCount = currentCount + 1;
>
>   return {
>     stepCount: nextCount,
>     message: `Processed step ${nextCount}`
>   };
> }
>
> // Verification tests
> const step1 = processClientState({ stepCount: 0 });
> console.assert(step1.stepCount === 1, "Test 1 Failed");
>
> const step2 = processClientState({ stepCount: step1.stepCount });
> console.assert(step2.stepCount === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Client-Side State Storage**: Clients maintain workflow progress and send state in request payloads.
> 2. **Server Memory Relief**: Frees server RAM from storing millions of active user session objects.
> 3. **Stateless REST Alignment**: Fulfills Fielding's REST constraint: Application State resides on the client.
---

## 6. Related Terms
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — The "movie ticket" used to make Stateless APIs possible.
- [localStorage & sessionStorage](../level_09/web_storage.md) — The mechanism commonly used to store session tokens in the browser.
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — Related concept: Idempotent vs Safe Methods.
- [Basic & Bearer Authentication](../level_04/basic_bearer_auth.md) — Related concept: Basic & Bearer Authentication.
- [REST (Representational State Transfer)](rest.md) — Related concept: REST (Representational State Transfer).

---

## 7. Key Takeaways
- **Statelessness** means the Server does not store any information about the Client's session in memory.
- Every single HTTP request must be completely self-contained (including authentication tokens and all necessary data).
- Statelessness allows companies to infinitely scale their backends across thousands of servers without worrying about syncing session memory between them.
