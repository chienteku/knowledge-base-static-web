# WebSockets

> **Level 8 — Real-Time APIs**
> A persistent, two-way communication channel between the Client and the Server that stays open indefinitely, allowing instant data transfer without HTTP requests.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — WebSockets bypass this traditional lifecycle entirely.
- [HTTP / HTTPS](../level_01/http_https.md) — WebSockets start as HTTP, but then "upgrade" to a completely different protocol.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal** (Browser & Server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
HTTP is inherently **Stateless** and **Unidirectional**. The Client must ask a question (`fetch()`), the Server gives an answer, and then the connection is instantly closed and forgotten. 
If you are building a Multiplayer Game or a Live Chat app like Discord, HTTP is terrible. If Bob sends a message, how does the Server push that message to Alice's screen? The Server can't reach out to Alice, because Alice didn't make a request! 
We needed a way to keep the connection permanently open so the Server could shout at the Client at any time. **WebSockets** solve this.

### (2) Reality Metaphor
**HTTP:** Sending a physical letter. You write it, drop it in the mail, wait 3 days, and get a reply. Every conversation requires a new envelope.
**WebSockets:** Making a phone call. You dial the number once. The line stays open. Both of you can talk at the exact same time, interrupting each other, until someone physically hangs up.

### (3) The Handshake (Upgrade)
WebSockets (`ws://` or `wss://`) don't actually start as WebSockets.
1. The Client sends a standard HTTP `GET` request, but includes a special header: `Connection: Upgrade`.
2. The Server says "Okay, let's switch to WebSockets!" and returns a `101 Switching Protocols` status code.
3. The HTTP protocol is abandoned. The TCP network pipe is left permanently open, allowing raw data to flow freely in both directions.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use HTTP Status Codes over WebSockets

**The mistake:** A developer sets up a WebSocket server and tries to respond to a bad message with `res.status(404).send()`.

**Why it's wrong:** WebSockets are NOT HTTP! Once the connection upgrades, HTTP no longer exists. There are no headers, no verbs (`GET`/`POST`), and no status codes (`404`/`200`). You are simply sending raw text or binary data back and forth. If you want to simulate an error, you have to send a JSON string like `{ "type": "error", "message": "Not found" }` and handle it manually on the frontend.
**Golden Rule:** Don't try to apply REST/HTTP paradigms to WebSockets. It is a completely different world.

---

### Mistake 2: Using `ws://` Unencrypted WebSocket Protocols for Production Apps over HTTPS

**The mistake:** Connecting to `ws://api.example.com` from an `https://` secure web app.

**Why it's wrong:** Browsers block unencrypted `ws://` connections originating from `https://` origins due to Mixed Content security policies. Always use `wss://` (WebSocket Secure over TLS).

*Incorrect:*
```javascript
// Inside https://app.example.com
const ws = new WebSocket('ws://api.example.com'); // ❌ Blocked by Mixed Content policy!
```

*Fix:*
```javascript
// Use wss:// secure protocol:
const ws = new WebSocket('wss://api.example.com');
```

---

### Mistake 3: Over-Using WebSockets for Simple Static CRUD Operations (Architecture Complexity Overkill)

**The mistake:** Building standard REST CRUD endpoints (fetching product details) using WebSockets.

**Why it's wrong:** WebSockets introduce stateful connection complexity, load balancer stickiness requirements, and poor CDN caching. Use REST HTTP for static CRUD and reserve WebSockets for bi-directional real-time streaming.

*Incorrect:*
```http
/* Using WebSockets for static product detail fetching */
```

*Fix:*
```http
/* Use REST HTTP GET /api/products/5 for cacheable CRUD operations */
```


---

### Mistake 4: Using `ws://` Unencrypted WebSocket Protocols for Production Apps over HTTPS

**The mistake:** Connecting to `ws://api.example.com` from an `https://` secure web app.

**Why it's wrong:** Browsers block unencrypted `ws://` connections originating from `https://` origins due to Mixed Content security policies. Always use `wss://` (WebSocket Secure over TLS).

*Incorrect:*
```javascript
// Inside https://app.example.com
const ws = new WebSocket('ws://api.example.com'); // ❌ Blocked by Mixed Content policy!
```

*Fix:*
```javascript
// Use wss:// secure protocol:
const ws = new WebSocket('wss://api.example.com');
```

---

### Mistake 5: Over-Using WebSockets for Simple Static CRUD Operations (Architecture Complexity Overkill)

**The mistake:** Building standard REST CRUD endpoints (fetching product details) using WebSockets.

**Why it's wrong:** WebSockets introduce stateful connection complexity, load balancer stickiness requirements, and poor CDN caching. Use REST HTTP for static CRUD and reserve WebSockets for bi-directional real-time streaming.

*Incorrect:*
```http
/* Using WebSockets for static product detail fetching */
```

*Fix:*
```http
/* Use REST HTTP GET /api/products/5 for cacheable CRUD operations */
```


---

### Mistake 6: Using `ws://` Unencrypted WebSocket Protocols for Production Apps over HTTPS

**The mistake:** Connecting to `ws://api.example.com` from an `https://` secure web app.

**Why it's wrong:** Browsers block unencrypted `ws://` connections originating from `https://` origins due to Mixed Content security policies. Always use `wss://` (WebSocket Secure over TLS).

*Incorrect:*
```javascript
// Inside https://app.example.com
const ws = new WebSocket('ws://api.example.com'); // ❌ Blocked by Mixed Content policy!
```

*Fix:*
```javascript
// Use wss:// secure protocol:
const ws = new WebSocket('wss://api.example.com');
```

---

### Mistake 7: Over-Using WebSockets for Simple Static CRUD Operations (Architecture Complexity Overkill)

**The mistake:** Building standard REST CRUD endpoints (fetching product details) using WebSockets.

**Why it's wrong:** WebSockets introduce stateful connection complexity, load balancer stickiness requirements, and poor CDN caching. Use REST HTTP for static CRUD and reserve WebSockets for bi-directional real-time streaming.

*Incorrect:*
```http
/* Using WebSockets for static product detail fetching */
```

*Fix:*
```http
/* Use REST HTTP GET /api/products/5 for cacheable CRUD operations */
```


---

## 6. Practice Exercises

### Exercise 1: HTTP vs WebSockets

**Problem:** For the following 3 applications, which protocol should you use?
1. Fetching a user's profile settings.
2. A live GPS tracker showing an Uber driver's car moving on a map.
3. A collaborative Google Doc where you see other people typing.

**Expected output:**
```text
1. HTTP (REST API). It only happens once.
2. WebSockets. Data needs to stream continuously.
3. WebSockets. Users need to instantly receive keystrokes from other users without refreshing.
```

> [!check]- Answer
> - Is it a one-time request, or a continuous flow of live updates?

---

### Exercise 2: WebSocket Frame Overhead Size

**Problem:** What is the minimum frame header overhead size for a WebSocket message frame?

**Expected output:**
```text
2 to 10 bytes (compared to 500-1000 bytes per HTTP request header).
```

> [!check]- Answer
> ```text
> 2 to 10 bytes per frame (extremely lightweight framing overhead).
> ```
> - **Explanation:** Microscopic frame header overhead enables high-frequency real-time messaging.
---

### Exercise 3: Load Balancing WebSockets with Sticky Sessions

**Problem:** Why do WebSocket handshake requests require Sticky Sessions (session affinity) on HTTP/1.1 load balancers?

**Expected output:**
```text
Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
```

> [!check]- Answer
> ```text
> Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
> ```
> - **Explanation:** Sticky sessions route persistent socket connections to consistent server nodes.
---

### Exercise 4: WebSocket Frame Overhead Size

**Problem:** What is the minimum frame header overhead size for a WebSocket message frame?

**Expected output:**
```text
2 to 10 bytes (compared to 500-1000 bytes per HTTP request header).
```

> [!check]- Answer
> ```text
> 2 to 10 bytes per frame (extremely lightweight framing overhead).
> ```
> - **Explanation:** Microscopic frame header overhead enables high-frequency real-time messaging.
---

### Exercise 5: Load Balancing WebSockets with Sticky Sessions

**Problem:** Why do WebSocket handshake requests require Sticky Sessions (session affinity) on HTTP/1.1 load balancers?

**Expected output:**
```text
Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
```

> [!check]- Answer
> ```text
> Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
> ```
> - **Explanation:** Sticky sessions route persistent socket connections to consistent server nodes.
---

### Exercise 6: WebSocket Frame Overhead Size

**Problem:** What is the minimum frame header overhead size for a WebSocket message frame?

**Expected output:**
```text
2 to 10 bytes (compared to 500-1000 bytes per HTTP request header).
```

> [!check]- Answer
> ```text
> 2 to 10 bytes per frame (extremely lightweight framing overhead).
> ```
> - **Explanation:** Microscopic frame header overhead enables high-frequency real-time messaging.
---

### Exercise 7: Load Balancing WebSockets with Sticky Sessions

**Problem:** Why do WebSocket handshake requests require Sticky Sessions (session affinity) on HTTP/1.1 load balancers?

**Expected output:**
```text
Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
```

> [!check]- Answer
> ```text
> Initial HTTP upgrade requests and subsequent TCP socket frames must reach the same backend server instance to complete connection establishment.
> ```
> - **Explanation:** Sticky sessions route persistent socket connections to consistent server nodes.
---

## 7. Related Terms
- [Webhooks](../level_06/webhooks.md) — Webhooks are Server-to-Server. WebSockets are usually Browser-to-Server.
- [Socket.io](../level_08/socket_io.md) — The most popular library for working with WebSockets in Node.js.

---

## 8. Key Takeaways
- **WebSockets** allow persistent, real-time, two-way communication between Browser and Server.
- It bypasses the traditional HTTP Request/Response lifecycle.
- It is essential for multiplayer games, chat apps, and live financial tickers.
- URLs start with `ws://` or `wss://` instead of `http://`.
