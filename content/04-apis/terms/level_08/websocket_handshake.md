# WebSocket Handshake (Upgrade)

> **Level 8 — Real-Time APIs**
> The HTTP→WS `Upgrade` request that opens a socket.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time, bi-directional protocol concept.
- [HTTP Headers](../level_02/http_headers.md) — The metadata packets used to negotiate requests.

---

## 2. Term Category

**Real-Time (Universal: Governs the network negotiation layer between browser engines and web application servers.)**: WebSocket Handshake (Upgrade) is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
WebSockets establish a persistent, bi-directional TCP socket connection. However, they do not start as a raw socket connection from the beginning. If they did, they would be blocked by corporate firewalls, routers, and proxy servers, which are typically configured to allow only standard HTTP web traffic on port 80 (HTTP) and port 443 (HTTPS).

To bypass firewalls and reuse established connection structures, WebSockets leverage a standard HTTP initiation sequence called the **WebSocket Handshake**:
- The client starts a standard HTTP `GET` request but appends specific headers requesting a protocol change.
- If the server supports the protocol, it accepts the upgrade request and returns HTTP status code **`101 Switching Protocols`**.
- The HTTP negotiation layer is then discarded, but the underlying TCP connection remains open. Both sides switch to transmitting raw WebSocket frames over this active channel.

---

### (2) The Handshake Headers

#### 1. Client Handshake Request
The client sends a standard HTTP request with headers specifying the upgrade target:
```text
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```
- **`Upgrade: websocket`:** Declares the target protocol.
- **`Connection: Upgrade`:** Signals that the connection should switch protocols.
- **`Sec-WebSocket-Key`:** A random, Base64-encoded client security key used by the server to prove it received the upgrade request.

#### 2. Server Handshake Response
If the server accepts the upgrade, it responds with status code `101`:
```text
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
- **`Sec-WebSocket-Accept`:** The server takes the client's `Sec-WebSocket-Key`, appends a globally constant UUID string (`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`), hashes the result using SHA-1, and encodes it into Base64. Returning this value proves the server supports WebSockets and is not just echo-matching headers.

---

### (3) Reality Metaphor
Imagine starting a telephone call with a support agent.
- You dial the phone and start talking (**establishing the standard HTTP connection**).
- You tell the agent: *"Let's switch this call to a video meeting"* (`Connection: Upgrade`, `Upgrade: websocket`).
- The agent clicks a button on their side to turn on their camera and replies: *"Switching to video channel now"* (`101 Switching Protocols`).
- **The Upgrade:** You do not hang up and dial a new number; the phone call stays active, but the type of data sent over the wire upgrades from audio to video stream frames.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Re-instantiating the TCP connection after the handshake upgrade

**The mistake:** Assuming that once the `101 Switching Protocols` response is received, the client closes the HTTP request and opens a new connection to start sending WebSocket data.

**Why it's wrong:** The handshake upgrade is designed to keep the **exact same TCP socket connection** open. It simply redefines how the bytes sent over that connection are structured. This reuse of the active port (80 or 443) allows WebSockets to bypass firewall rules.

---

### Mistake 2: Forgetting the Mandatory `Upgrade: websocket` and `Connection: Upgrade` Headers

**The mistake:** Executing a WebSocket handshake request missing required upgrade headers.

**Why it's wrong:** WebSockets initiate via HTTP/1.1 Upgrade requests. Without `Upgrade: websocket` and `Connection: Upgrade`, web servers treat the request as a standard HTTP call.

*Incorrect:*
```http
GET /chat HTTP/1.1
Host: server.example.com ; ❌ Missing Upgrade and Connection headers!
```

*Fix:*
```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

---

### Mistake 3: Misinterpreting the HTTP 101 Switching Protocols Response Status

**The mistake:** Treating HTTP `101 Switching Protocols` as a standard HTTP 200 OK success response.

**Why it's wrong:** HTTP 101 informs the client that the server agrees to upgrade the TCP connection from HTTP/1.1 to the WebSocket binary framing protocol.

*Incorrect:*
```http
/* Expecting 200 OK response on WebSocket handshake */
```

*Fix:*
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```


---

### Mistake 4: Forgetting the Mandatory `Upgrade: websocket` and `Connection: Upgrade` Headers

**The mistake:** Executing a WebSocket handshake request missing required upgrade headers.

**Why it's wrong:** WebSockets initiate via HTTP/1.1 Upgrade requests. Without `Upgrade: websocket` and `Connection: Upgrade`, web servers treat the request as a standard HTTP call.

*Incorrect:*
```http
GET /chat HTTP/1.1
Host: server.example.com ; ❌ Missing Upgrade and Connection headers!
```

*Fix:*
```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

---

### Mistake 5: Misinterpreting the HTTP 101 Switching Protocols Response Status

**The mistake:** Treating HTTP `101 Switching Protocols` as a standard HTTP 200 OK success response.

**Why it's wrong:** HTTP 101 informs the client that the server agrees to upgrade the TCP connection from HTTP/1.1 to the WebSocket binary framing protocol.

*Incorrect:*
```http
/* Expecting 200 OK response on WebSocket handshake */
```

*Fix:*
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```


---

### Mistake 6: Forgetting the Mandatory `Upgrade: websocket` and `Connection: Upgrade` Headers

**The mistake:** Executing a WebSocket handshake request missing required upgrade headers.

**Why it's wrong:** WebSockets initiate via HTTP/1.1 Upgrade requests. Without `Upgrade: websocket` and `Connection: Upgrade`, web servers treat the request as a standard HTTP call.

*Incorrect:*
```http
GET /chat HTTP/1.1
Host: server.example.com ; ❌ Missing Upgrade and Connection headers!
```

*Fix:*
```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

---

### Mistake 7: Misinterpreting the HTTP 101 Switching Protocols Response Status

**The mistake:** Treating HTTP `101 Switching Protocols` as a standard HTTP 200 OK success response.

**Why it's wrong:** HTTP 101 informs the client that the server agrees to upgrade the TCP connection from HTTP/1.1 to the WebSocket binary framing protocol.

*Incorrect:*
```http
/* Expecting 200 OK response on WebSocket handshake */
```

*Fix:*
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```


---

## 5. Practice Exercises

### Exercise 1: HTTP 101 Switching Protocols Handshake Validator

**Scenario:** An API gateway inspects incoming HTTP upgrade request headers to validate WebSocket handshake compliance.

**Requirements:**
1. Write validateWebSocketHandshake(headers).
2. Check Upgrade: websocket.
3. Check Connection: Upgrade.
4. Check Sec-WebSocket-Key presence.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateWebSocketHandshake(headers = {}) {
>   const upgrade = headers["upgrade"] || headers["Upgrade"];
>   const connection = headers["connection"] || headers["Connection"];
>   const secKey = headers["sec-websocket-key"] || headers["Sec-WebSocket-Key"];
>
>   const issues = [];
>
>   if (!upgrade || upgrade.toLowerCase() !== "websocket") {
>     issues.push("Missing or invalid 'Upgrade: websocket' header");
>   }
>
>   if (!connection || !connection.toLowerCase().includes("upgrade")) {
>     issues.push("Missing or invalid 'Connection: Upgrade' header");
>   }
>
>   if (!secKey) {
>     issues.push("Missing 'Sec-WebSocket-Key' header");
>   }
>
>   return {
>     valid: issues.length === 0,
>     issues,
>     secKey
>   };
> }
>
> // Verification tests
> const validHeaders = {
>   "Upgrade": "websocket",
>   "Connection": "Upgrade",
>   "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ=="
> };
>
> console.assert(validateWebSocketHandshake(validHeaders).valid === true, "Test 1 Failed");
> console.assert(validateWebSocketHandshake({}).valid === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **WebSocket Handshake Protocol**: Starts as a standard HTTP GET request with Upgrade headers.
> 2. **HTTP 101 Switching Protocols**: If server accepts handshake, returns HTTP 101 status, switching protocol from HTTP to WebSocket.
> 3. **Header Enforcement**: Requires Upgrade: websocket, Connection: Upgrade, and Sec-WebSocket-Key headers.
> 
---

### Exercise 2: Sec-WebSocket-Accept Security Key Calculation

**Scenario:** Calculates the expected `Sec-WebSocket-Accept` response header using the RFC 6455 magic GUID string (`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).

**Requirements:**
1. Write calcSecWebSocketAccept(secKey, mockCrypto).
2. Concat key + magic GUID.
3. Compute SHA-1 hash and Base64 encode.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calcSecWebSocketAccept(secKey, mockCrypto) {
>   if (!secKey) return null;
>
>   const magicGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
>   const concatenated = secKey + magicGuid;
>
>   if (mockCrypto) {
>     return mockCrypto.sha1Base64(concatenated);
>   }
>
>   const crypto = require("crypto");
>   return crypto.createHash("sha1").update(concatenated).digest("base64");
> }
>
> // Verification tests
> const clientKey = "dGhlIHNhbXBsZSBub25jZQ==";
> const acceptHeader = calcSecWebSocketAccept(clientKey);
>
> // RFC 6455 official test vector: 'dGhlIHNhbXBsZSBub25jZQ==' -> 's3pPLMBiTxaQ9kYGzzhZRbK+xOo='
> console.assert(acceptHeader === "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=", "Test 1 Failed: RFC 6455 test vector failed");
> ```
>
> #### Technical Explanation
>
> 1. **RFC 6455 Magic GUID**: Hardcoded magic GUID string '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' defined in WebSocket specification.
> 2. **SHA-1 + Base64 Hashing**: Server concatenates client key with magic GUID, computes SHA-1 hash, and Base64 encodes result.
> 3. **Handshake Verification**: Proves server understands WebSocket protocol rather than misinterpreting GET request.
> 
---

### Exercise 3: Sec-WebSocket-Protocol Subprotocol Negotiator

**Scenario:** An API gateway inspects client-requested subprotocols (`Sec-WebSocket-Protocol: graphql-ws, v1.json`) and negotiates a supported subprotocol.

**Requirements:**
1. Write negotiateSubprotocol(requestedHeader, supportedProtocols).
2. Return selected subprotocol or null.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function negotiateSubprotocol(requestedHeader, supportedProtocols = []) {
>   if (!requestedHeader || typeof requestedHeader !== "string") return null;
>
>   const requestedList = requestedHeader.split(",").map(p => p.trim());
>   const supportedSet = new Set(supportedProtocols);
>
>   for (const protocol of requestedList) {
>     if (supportedSet.has(protocol)) {
>       return protocol; // Select first matching protocol
>     }
>   }
>
>   return null;
> }
>
> // Verification tests
> const header = "graphql-ws, json-v1, chat-v2";
> const selected = negotiateSubprotocol(header, ["chat-v2", "graphql-ws"]);
>
> console.assert(selected === "graphql-ws", "Test 1 Failed: Must select first supported protocol");
> ```
>
> #### Technical Explanation
>
> 1. **Subprotocol Negotiation**: Allows client and server to agree on application-level messaging format (e.g. GraphQL-WS, STOMP, WAMP).
> 2. **Sec-WebSocket-Protocol Header**: Client requests preferred protocols; server echoes selected protocol in handshake response.
> 3. **Application Layer Decoupling**: Separates low-level WebSocket framing from high-level application data schemas.
---

## 6. Related Terms
- [TCP/IP (high-level)](../level_01/tcp_ip.md) — The protocol layer that keeps the network connection open.
- [The WebSocket API (Client-side)](websocket_api.md) — The browser interface that initiates the handshake.
- [WebSockets](websockets.md) — Related concept: WebSockets.

---

## 7. Key Takeaways
- The WebSocket Handshake uses HTTP to establish real-time connections over ports 80 and 443.
- Initiated by the client using `Upgrade: websocket` and `Connection: Upgrade` headers.
- The server confirms the connection transition by returning status code `101 Switching Protocols`.
- The `Sec-WebSocket-Key` and `Sec-WebSocket-Accept` headers verify the server supports WebSockets.
- The underlying TCP connection remains open after the handshake to stream data frames.
