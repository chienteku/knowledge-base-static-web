# WebSocket Handshake (Upgrade)

> **Level 8 — Real-Time APIs**
> The HTTP→WS `Upgrade` request that opens a socket.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time, bi-directional protocol concept.
- [HTTP Headers](../level_02/http_headers.md) — The metadata packets used to negotiate requests.
---

## 2. Term Category
- **Real-Time**

---

## 3. Environment Context
- **Universal**: Governs the network negotiation layer between browser engines and web application servers.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Header Auditor

**Problem:** Review this client-side handshake request. Find the error that will cause the server to fail to upgrade the connection:

```text
GET /stream HTTP/1.1
Host: api.example.com
Upgrade: websocket
Connection: Keep-Alive
Sec-WebSocket-Key: YmFzZTY0X2tleV9leGFtcGxl
Sec-WebSocket-Version: 13
```

> [!check]- Answer
> - Look closely at the `Connection` header value.
> - The server needs instructions on how to handle the connection lifecycle.

> [!check]- Answer
> - **The `Connection` header value is incorrect.** It is set to `Keep-Alive` instead of `Upgrade`. If `Connection` is not explicitly set to `Upgrade`, proxy servers and routers will treat the request as standard HTTP and refuse to transition the socket protocol.


---

### Exercise 2: Sec-WebSocket-Accept Calculation

**Problem:** How does a server calculate the `Sec-WebSocket-Accept` header value from client's `Sec-WebSocket-Key`?

**Expected output:**
> [!check]- Answer
> ```text
> Concatenates client key with magic GUID string "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", computes SHA-1 hash, and returns Base64 encoded string.
> ```
> ```text
> AcceptKey = Base64( SHA-1( ClientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" ) )
> ```
> - **Explanation:** The Sec-WebSocket-Accept calculation proves server handshake compliance.
---

### Exercise 3: WebSocket Handshake HTTP Status Code

**Problem:** What specific HTTP status code MUST a server return to confirm successful WebSocket handshake upgrade?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP 101 Switching Protocols
> ```
> ```http
> HTTP/1.1 101 Switching Protocols
> ```
> - **Explanation:** Status 101 confirms protocol transition from HTTP to WebSocket framing.
---

### Exercise 4: Sec-WebSocket-Accept Calculation

**Problem:** How does a server calculate the `Sec-WebSocket-Accept` header value from client's `Sec-WebSocket-Key`?

**Expected output:**
> [!check]- Answer
> ```text
> Concatenates client key with magic GUID string "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", computes SHA-1 hash, and returns Base64 encoded string.
> ```
> ```text
> AcceptKey = Base64( SHA-1( ClientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" ) )
> ```
> - **Explanation:** The Sec-WebSocket-Accept calculation proves server handshake compliance.
---

### Exercise 5: WebSocket Handshake HTTP Status Code

**Problem:** What specific HTTP status code MUST a server return to confirm successful WebSocket handshake upgrade?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP 101 Switching Protocols
> ```
> ```http
> HTTP/1.1 101 Switching Protocols
> ```
> - **Explanation:** Status 101 confirms protocol transition from HTTP to WebSocket framing.
---

### Exercise 6: Sec-WebSocket-Accept Calculation

**Problem:** How does a server calculate the `Sec-WebSocket-Accept` header value from client's `Sec-WebSocket-Key`?

**Expected output:**
> [!check]- Answer
> ```text
> Concatenates client key with magic GUID string "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", computes SHA-1 hash, and returns Base64 encoded string.
> ```
> ```text
> AcceptKey = Base64( SHA-1( ClientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" ) )
> ```
> - **Explanation:** The Sec-WebSocket-Accept calculation proves server handshake compliance.
---

### Exercise 7: WebSocket Handshake HTTP Status Code

**Problem:** What specific HTTP status code MUST a server return to confirm successful WebSocket handshake upgrade?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP 101 Switching Protocols
> ```
> ```http
> HTTP/1.1 101 Switching Protocols
> ```
> - **Explanation:** Status 101 confirms protocol transition from HTTP to WebSocket framing.
---

## 7. Related Terms
- [TCP/IP (high-level)](../level_01/tcp_ip.md) — The protocol layer that keeps the network connection open.
- [The WebSocket API (Client-side)](websocket_api.md) — The browser interface that initiates the handshake.
- [WebSockets](websockets.md) — Related concept: WebSockets.
---

## 8. Key Takeaways
- The WebSocket Handshake uses HTTP to establish real-time connections over ports 80 and 443.
- Initiated by the client using `Upgrade: websocket` and `Connection: Upgrade` headers.
- The server confirms the connection transition by returning status code `101 Switching Protocols`.
- The `Sec-WebSocket-Key` and `Sec-WebSocket-Accept` headers verify the server supports WebSockets.
- The underlying TCP connection remains open after the handshake to stream data frames.
