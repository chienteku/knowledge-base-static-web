# WebSockets

> **Level 8 — Real-Time APIs**
> A persistent, two-way communication channel between the Client and the Server that stays open indefinitely, allowing instant data transfer without HTTP requests.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — WebSockets bypass this traditional lifecycle entirely.
- [HTTP / HTTPS](../level_01/http_https.md) — WebSockets start as HTTP, but then "upgrade" to a completely different protocol.

---

## 2. Term Category

**Networking Protocol (Universal .)**: WebSockets is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Full-Duplex Bi-Directional Chat Messenger

**Scenario:** A real-time messenger leverages full-duplex WebSockets to send client messages and process incoming server messages concurrently.

**Requirements:**
1. Write createFullDuplexClient(wsInstance).
2. Implement sendChatMessage(text).
3. Implement onMessageReceived(callback).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFullDuplexClient(wsInstance) {
>   const messageCallbacks = new Set();
>
>   wsInstance.onmessage = (event) => {
>     messageCallbacks.forEach(cb => cb(event.data));
>   };
>
>   return {
>     sendChatMessage(text) {
>       wsInstance.send(JSON.stringify({ type: "chat", text, timestamp: Date.now() }));
>     },
>     onMessageReceived(cb) {
>       messageCallbacks.add(cb);
>       return () => messageCallbacks.delete(cb);
>     }
>   };
> }
>
> // Verification tests
> let sentData = null;
> const mockWs = { send: (d) => { sentData = JSON.parse(d); }, onmessage: null };
> const client = createFullDuplexClient(mockWs);
>
> client.sendChatMessage("Hello World!");
> console.assert(sentData.text === "Hello World!", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Full-Duplex Communication**: Both client and server can transmit data simultaneously over a single TCP socket without waiting.
> 2. **Persistent TCP Socket**: Keeps TCP connection open continuously, eliminating HTTP request-response handshake latency.
> 3. **Framing Overhead**: WebSocket frames add minimal 2 to 10 bytes overhead per message vs kilobytes for HTTP headers.
> 
---

### Exercise 2: WebSocket Connection Lifecycle Event Router

**Scenario:** An API client manages complete WebSocket lifecycle events (`onOpen`, `onMessage`, `onError`, `onClose`) with state tracking.

**Requirements:**
1. Write createLifecycleRouter(wsInstance).
2. Bind handlers to lifecycle hooks.
3. Maintain status object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createLifecycleRouter(wsInstance) {
>   const status = { connected: false, errorCount: 0, lastEvent: null };
>
>   wsInstance.onopen = () => {
>     status.connected = true;
>     status.lastEvent = "OPEN";
>   };
>
>   wsInstance.onclose = () => {
>     status.connected = false;
>     status.lastEvent = "CLOSE";
>   };
>
>   wsInstance.onerror = (err) => {
>     status.errorCount++;
>     status.lastEvent = "ERROR";
>   };
>
>   return { getStatus: () => status };
> }
>
> // Verification tests
> const mockWs = { onopen: null, onclose: null, onerror: null };
> const router = createLifecycleRouter(mockWs);
>
> mockWs.onopen();
> console.assert(router.getStatus().connected === true, "Test 1 Failed");
>
> mockWs.onerror(new Error("Network loss"));
> console.assert(router.getStatus().errorCount === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Lifecycle Hooks**: Four core events governing WebSocket behavior: Open, Message, Error, Close.
> 2. **State Synchronization**: Synchronizes internal application state with underlying physical socket connection status.
> 3. **Resilient Error Handling**: Error events precede Close events; handling both ensures accurate recovery.
> 
---

### Exercise 3: Protocol Frame Overhead Comparison (WebSocket vs HTTP REST)

**Scenario:** An API performance calculator measures byte overhead savings of WebSocket frames (2-6 bytes) vs HTTP REST headers (~500 bytes) over 1,000 messages.

**Requirements:**
1. Write compareProtocolOverhead(messageCount, avgHeaderBytes).
2. Calculate HTTP overhead vs WS overhead.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function compareProtocolOverhead(messageCount = 1000, avgHttpHeaderBytes = 500) {
>   const totalHttpOverheadBytes = messageCount * avgHttpHeaderBytes;
>   // WebSocket framing overhead: ~4 bytes per message
>   const totalWsOverheadBytes = messageCount * 4;
>
>   const bytesSaved = totalHttpOverheadBytes - totalWsOverheadBytes;
>   const savingsPct = Number(((bytesSaved / totalHttpOverheadBytes) * 100).toFixed(2));
>
>   return {
>     totalHttpOverheadBytes,
>     totalWsOverheadBytes,
>     bytesSaved,
>     savingsPct
>   };
> }
>
> // Verification tests
> const res = compareProtocolOverhead(1000, 500);
> console.assert(res.totalHttpOverheadBytes === 500000, "Test 1 Failed: 500KB HTTP overhead");
> console.assert(res.totalWsOverheadBytes === 4000, "Test 2 Failed: 4KB WS overhead");
> console.assert(res.savingsPct === 99.2, "Test 3 Failed: 99.2% overhead savings");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Header Overhead**: Every HTTP REST request carries ~500-1000 bytes of headers (Cookies, User-Agent, Accept).
> 2. **WebSocket Frame Overhead**: WebSocket frames carry only 2-6 bytes of header overhead per message payload.
> 3. **99%+ Bandwidth Savings**: For high-frequency streaming (stock quotes, location tracking), WebSockets reduce network bandwidth overhead by >99%.
---

## 6. Related Terms
- [Webhooks](../level_06/webhooks.md) — Webhooks are Server-to-Server. WebSockets are usually Browser-to-Server.
- [Socket.io (Ecosystem tool)](socket_io.md) — The most popular library for working with WebSockets in Node.js.
- [TCP/IP (high-level)](../level_01/tcp_ip.md) — Related concept: TCP/IP (high-level).
- [Polling vs Long Polling](polling.md) — Related concept: Polling vs Long Polling.
- [Server-Sent Events (SSE)](sse.md) — Related concept: Server-Sent Events (SSE).
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — Related concept: gRPC (Remote Procedure Call).
- [WebSocket Handshake (Upgrade)](websocket_handshake.md) — WebSocket HTTP upgrade handshake.

---

## 7. Key Takeaways
- **WebSockets** allow persistent, real-time, two-way communication between Browser and Server.
- It bypasses the traditional HTTP Request/Response lifecycle.
- It is essential for multiplayer games, chat apps, and live financial tickers.
- URLs start with `ws://` or `wss://` instead of `http://`.
