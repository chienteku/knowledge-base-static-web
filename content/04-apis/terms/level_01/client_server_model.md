# Client-Server Model

> **Level 1 — The Foundations of the Web**
> The fundamental architecture of the internet where one computer requests data or services (the Client), and another computer provides it (the Server).

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Web Architecture / Core Concept (Universal Standard .)**: Client-Server Model is a fundamental concept in this technology stack. **Level 1 — The Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before the internet, computers were isolated. If you wanted a file, you needed to physically carry a floppy disk from one computer to another. 
When computers started networking together, computer scientists needed a standardized hierarchy for how these machines should talk. Instead of every computer blindly shouting data at every other computer (a peer-to-peer mess), they created the **Client-Server Model**. 
It established a clear separation of concerns: one machine specializes in asking for things, and the other specializes in storing and providing things.

### (2) Reality Metaphor
Imagine going to a restaurant. 
You are the **Client**. You sit at the table and ask the waiter for a menu and a burger. You don't know how to cook the burger, and you don't have the ingredients. You just consume it.
The Kitchen is the **Server**. It has all the ingredients (the database) and the recipes (the backend code). It receives your request, cooks the burger, and sends it back to your table. 
The Web works exactly the same way. Your web browser (Chrome) is the Client, and it orders data from massive warehouse computers (Servers) owned by companies like Google or Amazon.

### (3) Technical Roles
- **The Client (Frontend):** Usually a web browser or a mobile app. Its job is to display information beautifully to the user, capture user clicks, and send requests.
- **The Server (Backend):** A powerful computer sitting in a data center (like AWS). Its job is to listen for requests 24/7, check if the Client has permission to view the data, query the database, and send the data back.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trusting the Client

**The mistake:** A developer writes code on the Frontend (Client) that says `if (user.isAdmin) { showAdminPanel(); }` but forgets to also secure the database on the Backend (Server).

**Why it's wrong:** The Client is running on the user's personal laptop. Therefore, the user can easily open Chrome DevTools, edit the code, and maliciously change `user.isAdmin` to `true`. 
**Golden Rule of APIs:** *Never trust the Client.* The Server is the single source of truth and must always independently verify if a user is allowed to do something before sending data.

---

### Mistake 2: Assuming Client-Side Business Logic is Tamper-Proof

**The mistake:** Relying on frontend JavaScript to validate user privileges without backend authorization checks.

**Why it's wrong:** Clients execute on untrusted user hardware. Anyone can modify JS variables or replay HTTP requests using tools like Postman or DevTools.

*Incorrect:*
```javascript
// Frontend code
if (user.role === 'admin') {
  deleteDatabaseRecord(id); // ❌ Server executes deletion without re-verifying session/role!
}
```

*Fix:*
```javascript
// Backend express handler
app.delete('/api/records/:id', authenticateToken, requireAdminRole, (req, res) => {
  // Server independently verifies JWT permissions before deletion
});
```

---

### Mistake 3: Confusing Peer-to-Peer (P2P) Architecture with Client-Server Architecture

**The mistake:** Designing a centralized REST API where clients attempt to query other end-user client devices directly.

**Why it's wrong:** Clients are frequently behind NAT firewalls and dynamic IP addresses. Direct client-to-client queries fail without a signaling server or STUN/TURN server setup.

*Incorrect:*
```http
// Client trying to fetch private data directly from another user's home IP address
fetch('http://192.168.1.45:8080/user-data'); // ❌ Unreachable over WAN NAT!
```

*Fix:*
```javascript
// Clients must communicate via a centralized Server endpoint
fetch('https://api.example.com/users/45/data');
```


---

## 5. Practice Exercises

### Exercise 1: Client Request Dispatch & Server Response Processing

**Scenario:** A full-stack web application implements a client request dispatcher that transmits payload data to a server endpoint and processes the returned HTTP response.

**Requirements:**
1. Write simulateClientServerExchange(endpoint, payload, serverHandler).
2. Format request payload.
3. Pass request to serverHandler.
4. Validate response status and return payload.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function simulateClientServerExchange(endpoint, payload, serverHandler) {
>   if (typeof serverHandler !== "function") {
>     throw new Error("Server handler function is required");
>   }
>
>   const clientRequest = {
>     endpoint,
>     headers: { "Content-Type": "application/json" },
>     body: JSON.stringify(payload)
>   };
>
>   const serverResponse = await serverHandler(clientRequest);
>
>   if (serverResponse.status !== 200) {
>     return { success: false, error: serverResponse.message || "Server Error" };
>   }
>
>   return {
>     success: true,
>     data: JSON.parse(serverResponse.body)
>   };
> }
>
> // Verification tests
> const mockServer = async (req) => {
>   const data = JSON.parse(req.body);
>   return {
>     status: 200,
>     body: JSON.stringify({ receivedId: data.id, status: "PROCESSED" })
>   };
> };
>
> simulateClientServerExchange("/api/users", { id: 42 }, mockServer).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
>   console.assert(res.data.receivedId === 42, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Client-Server Separation of Concerns**: Clients initiate requests; servers process requests statelessly and return responses.
> 2. **HTTP Message Boundary**: Data serialized as JSON strings passes across network boundaries between client and server runtimes.
> 3. **Status Code Contract**: Clients inspect response status codes (200 OK vs 4xx/5xx errors) before consuming payload data.
> 
---

### Exercise 2: Client-Side Offline Degradation Guard

**Scenario:** A mobile Web API client detects network disconnection status and queues requests locally until server connection is restored.

**Requirements:**
1. Write handleClientOfflineRequest(request, isOnline, requestQueue).
2. If online, execute request.
3. If offline, push request to requestQueue and return queued status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleClientOfflineRequest(request, isOnline, requestQueue) {
>   if (!Array.isArray(requestQueue)) return { status: "ERROR" };
>
>   if (isOnline) {
>     return {
>       status: "DISPATCHED",
>       requestId: request.id
>     };
>   }
>
>   requestQueue.push({ ...request, queuedAt: Date.now() });
>   return {
>     status: "QUEUED",
>     queueLength: requestQueue.length
>   };
> }
>
> // Verification tests
> const queue = [];
> const req1 = { id: "req-101", action: "SYNC_PROFILE" };
>
> const onlineRes = handleClientOfflineRequest(req1, true, queue);
> console.assert(onlineRes.status === "DISPATCHED", "Test 1 Failed");
>
> const offlineRes = handleClientOfflineRequest(req1, false, queue);
> console.assert(offlineRes.status === "QUEUED", "Test 2 Failed");
> console.assert(queue.length === 1, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Unreliable Network Assumption**: Full-stack architectures must treat client-to-server networks as inherently transient and prone to disconnects.
> 2. **Optimistic & Deferred Processing**: Queuing requests offline preserves user data until connectivity is re-established.
> 3. **State Recovery**: Replays queued client mutations sequentially when the server connection recovers.
> 
---

### Exercise 3: Stateless Server Request Disambiguation

**Scenario:** A REST server endpoint processes client requests statelessly, extracting authorization context from explicit request headers.

**Requirements:**
1. Write processStatelessServerRequest(request).
2. Extract Authorization header token.
3. If token is valid, return success response; else 401 Unauthorized.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processStatelessServerRequest(request) {
>   if (!request || !request.headers) {
>     return { status: 401, body: JSON.stringify({ error: "Missing headers" }) };
>   }
>
>   const authHeader = request.headers["Authorization"] || request.headers["authorization"];
>   if (!authHeader || !authHeader.startsWith("Bearer ")) {
>     return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
>   }
>
>   const token = authHeader.substring(7);
>   if (token !== "valid-secret-token") {
>     return { status: 403, body: JSON.stringify({ error: "Forbidden" }) };
>   }
>
>   return {
>     status: 200,
>     body: JSON.stringify({ status: "AUTHORIZED", userId: "usr-99" })
>   };
> }
>
> // Verification tests
> const res1 = processStatelessServerRequest({ headers: {} });
> console.assert(res1.status === 401, "Test 1 Failed");
>
> const res2 = processStatelessServerRequest({
>   headers: { "Authorization": "Bearer valid-secret-token" }
> });
> console.assert(res2.status === 200, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Stateless Architecture**: The server stores no client session state between requests; every request contains all context needed for execution.
> 2. **Explicit Credentials**: Authorization tokens (e.g. JWT) passed in HTTP headers establish client identity statelessly.
> 3. **Scalability Advantage**: Stateless servers can scale horizontally behind load balancers without session synchronization overhead.
---

## 6. Related Terms
- [HTTP / HTTPS](http_https.md) — The specific language the Client and Server use to talk to each other.
- [API (Application Programming Interface)](../level_03/api.md) — The waiter in the restaurant metaphor.
- [Request & Response Lifecycle](request_response.md) — Request/Response model.
- [DNS (Domain Name System)](dns.md) — DNS resolution.

---

## 7. Key Takeaways
- The **Client** requests data and displays it to the user.
- The **Server** listens for requests, processes logic, and returns data.
- The Client and Server are completely separate entities (often physically located thousands of miles apart).
- **Never trust the Client** for security or data validation; always verify on the Server.
