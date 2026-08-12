# The WebSocket API (Client-side)

> **Level 8 — Real-Time APIs**
> The native JavaScript object built into all modern web browsers used to open, read from, and write to a WebSocket connection.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The theoretical protocol that this API implements.
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — Because WebSockets only send text, you must use these methods heavily.

---

## 2. Term Category

**Browser API (Client-Side)**: The WebSocket API (Client-side) is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If the server supports [WebSockets](../level_08/websockets.md), the browser needs a way to actually connect to it. You cannot use `fetch()` because `fetch` is specifically built for the HTTP Request/Response lifecycle. 
Instead, the browser gives us a dedicated `WebSocket` class. It allows us to easily execute the "Upgrade Handshake", listen for continuous incoming messages, and push outbound messages whenever we want.

### (2) How it works (The 4 Main Events)
Working with the WebSocket API is entirely **Event-Driven**. You don't use `async/await`. Instead, you attach event listeners to the socket object.
1. `onopen`: Fires when the connection is successfully established.
2. `onmessage`: Fires every single time the Server pushes a message to you.
3. `onclose`: Fires if the server drops the connection (or you lose Wi-Fi).
4. `onerror`: Fires if a network routing error occurs.

### (3) Code Example
```javascript
// 1. Establish the connection (Note the wss:// instead of https://)
const socket = new WebSocket('wss://api.example.com/chat');

// 2. Wait for the connection to open
socket.onopen = () => {
  console.log("Connected to the chat server!");
  
  // 3. Send a message TO the server
  const myMessage = { text: "Hello everyone!" };
  socket.send(JSON.stringify(myMessage));
};

// 4. Listen for messages FROM the server
socket.onmessage = (event) => {
  // `event.data` is just a string. We must parse it!
  const incomingChat = JSON.parse(event.data);
  console.log("Bob says:", incomingChat.text);
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not handling disconnections

**The mistake:** A developer writes the code exactly like the example above and pushes it to production.

**Why it's wrong:** The native WebSocket API is very dumb. If the user drives into a tunnel and drops Wi-Fi for 5 seconds, the `onclose` event fires. When the user drives out of the tunnel and gets Wi-Fi back, **the WebSocket will NOT reconnect automatically!** 
**Golden Rule:** If you use the native `WebSocket` API, you must write custom logic inside the `onclose` event to run a `setTimeout` loop that repeatedly attempts to create a `new WebSocket()` until the connection is restored. (This is why most people use [Socket.io](../level_08/socket_io.md) instead).

---

### Mistake 2: Failing to Handle All 4 Primary WebSocket Event Handlers (`onopen`, `onmessage`, `onerror`, `onclose`)

**The mistake:** Listening ONLY to `ws.onmessage` without handling socket close or error events.

**Why it's wrong:** Network connections drop frequently. Omitting `onclose` and `onerror` handlers leaves application UI in frozen states when sockets crash.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onmessage = (evt) => render(evt.data); // ❌ Missing onclose and onerror error handling!
```

*Fix:*
```javascript
ws.onopen = () => console.log('Connected');
ws.onmessage = (evt) => render(evt.data);
ws.onerror = (err) => console.error('WS Error:', err);
ws.onclose = () => triggerReconnect();
```

---

### Mistake 3: Attempting to Send Data to a WebSocket in `CONNECTING` State

**The mistake:** Calling `ws.send('data')` immediately after `const ws = new WebSocket(...)` without waiting for `onopen`.

**Why it's wrong:** WebSockets take time to complete the TCP + HTTP handshake. Calling `ws.send()` while state is `CONNECTING` (0) throws an InvalidStateError DOMException.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.send('hello'); // ❌ Throws InvalidStateError! Socket not open yet!
```

*Fix:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onopen = () => {
  ws.send('hello'); // Safe execution after open
};
```


---

### Mistake 4: Failing to Handle All 4 Primary WebSocket Event Handlers (`onopen`, `onmessage`, `onerror`, `onclose`)

**The mistake:** Listening ONLY to `ws.onmessage` without handling socket close or error events.

**Why it's wrong:** Network connections drop frequently. Omitting `onclose` and `onerror` handlers leaves application UI in frozen states when sockets crash.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onmessage = (evt) => render(evt.data); // ❌ Missing onclose and onerror error handling!
```

*Fix:*
```javascript
ws.onopen = () => console.log('Connected');
ws.onmessage = (evt) => render(evt.data);
ws.onerror = (err) => console.error('WS Error:', err);
ws.onclose = () => triggerReconnect();
```

---

### Mistake 5: Attempting to Send Data to a WebSocket in `CONNECTING` State

**The mistake:** Calling `ws.send('data')` immediately after `const ws = new WebSocket(...)` without waiting for `onopen`.

**Why it's wrong:** WebSockets take time to complete the TCP + HTTP handshake. Calling `ws.send()` while state is `CONNECTING` (0) throws an InvalidStateError DOMException.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.send('hello'); // ❌ Throws InvalidStateError! Socket not open yet!
```

*Fix:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onopen = () => {
  ws.send('hello'); // Safe execution after open
};
```


---

### Mistake 6: Failing to Handle All 4 Primary WebSocket Event Handlers (`onopen`, `onmessage`, `onerror`, `onclose`)

**The mistake:** Listening ONLY to `ws.onmessage` without handling socket close or error events.

**Why it's wrong:** Network connections drop frequently. Omitting `onclose` and `onerror` handlers leaves application UI in frozen states when sockets crash.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onmessage = (evt) => render(evt.data); // ❌ Missing onclose and onerror error handling!
```

*Fix:*
```javascript
ws.onopen = () => console.log('Connected');
ws.onmessage = (evt) => render(evt.data);
ws.onerror = (err) => console.error('WS Error:', err);
ws.onclose = () => triggerReconnect();
```

---

### Mistake 7: Attempting to Send Data to a WebSocket in `CONNECTING` State

**The mistake:** Calling `ws.send('data')` immediately after `const ws = new WebSocket(...)` without waiting for `onopen`.

**Why it's wrong:** WebSockets take time to complete the TCP + HTTP handshake. Calling `ws.send()` while state is `CONNECTING` (0) throws an InvalidStateError DOMException.

*Incorrect:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.send('hello'); // ❌ Throws InvalidStateError! Socket not open yet!
```

*Fix:*
```javascript
const ws = new WebSocket('wss://api.example.com');
ws.onopen = () => {
  ws.send('hello'); // Safe execution after open
};
```


---

## 5. Practice Exercises

### Exercise 1: Native Browser WebSocket API Connection Wrapper

**Scenario:** Wraps native W3C `WebSocket` instance management with event handlers for `onopen`, `onmessage`, `onerror`, and `onclose`.

**Requirements:**
1. Write initWebSocketClient(url, mockWs).
2. Handle connection lifecycle.
3. Expose sendJson method.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function initWebSocketClient(url, mockWsInstance) {
>   const ws = mockWsInstance || new WebSocket(url);
>   let isConnected = false;
>
>   ws.onopen = () => { isConnected = true; };
>   ws.onclose = () => { isConnected = false; };
>
>   return {
>     sendJson(dataObj) {
>       if (!isConnected) {
>         throw new Error("WebSocket is not connected");
>       }
>       ws.send(JSON.stringify(dataObj));
>     },
>     isConnected: () => isConnected
>   };
> }
>
> // Verification tests
> const mockWs = { send() {}, onopen: null, onclose: null };
> const client = initWebSocketClient("wss://api.com", mockWs);
>
> mockWs.onopen(); // Simulate connection open
> console.assert(client.isConnected() === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **W3C WebSocket API**: Standard browser API for creating persistent TCP WebSocket connections.
> 2. **wss:// Secure Scheme**: WebSocket connections over TLS/SSL use the `wss://` URI scheme.
> 3. **Event-Driven Callbacks**: Relies on asynchronous event handlers (onopen, onmessage, onerror, onclose).
> 
---

### Exercise 2: WebSocket Binary ArrayBuffer Transceiver

**Scenario:** Configures a WebSocket instance to send and receive binary data buffers using `binaryType = 'arraybuffer'`.

**Requirements:**
1. Write configureBinaryWebSocket(wsInstance, onBinaryMessage).
2. Set ws.binaryType = 'arraybuffer'.
3. Parse ArrayBuffer messages.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function configureBinaryWebSocket(wsInstance, onBinaryMessage) {
>   wsInstance.binaryType = "arraybuffer";
>
>   wsInstance.onmessage = (event) => {
>     if (event.data instanceof ArrayBuffer) {
>       onBinaryMessage(event.data);
>     }
>   };
>
>   return {
>     sendBinary(arrayBuffer) {
>       wsInstance.send(arrayBuffer);
>     }
>   };
> }
>
> // Verification tests
> const receivedBuffers = [];
> const mockWs = { binaryType: "blob", send() {}, onmessage: null };
>
> const bWs = configureBinaryWebSocket(mockWs, (buf) => receivedBuffers.push(buf));
> console.assert(mockWs.binaryType === "arraybuffer", "Test 1 Failed: Must set binaryType to arraybuffer");
>
> const testBuf = new ArrayBuffer(4);
> mockWs.onmessage({ data: testBuf });
> console.assert(receivedBuffers.length === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **binaryType Configuration**: Property on WebSocket instance; can be set to 'arraybuffer' or 'blob'.
> 2. **Binary Transfer Efficiency**: Sending raw ArrayBuffers bypasses text encoding overhead, ideal for audio/video streaming.
> 3. **High-Performance Web APIs**: Integrates directly with WebGL, Web Audio API, and WebAssembly binary modules.
> 
---

### Exercise 3: WebSocket ReadyState Enum Inspector

**Scenario:** An API diagnostic utility inspects `ws.readyState` values (`CONNECTING=0`, `OPEN=1`, `CLOSING=2`, `CLOSED=3`).

**Requirements:**
1. Write getWebSocketStateName(readyStateNum).
2. Map 0 -> CONNECTING, 1 -> OPEN, 2 -> CLOSING, 3 -> CLOSED.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getWebSocketStateName(readyStateNum) {
>   const states = {
>     0: "CONNECTING",
>     1: "OPEN",
>     2: "CLOSING",
>     3: "CLOSED"
>   };
>
>   return states[readyStateNum] || "UNKNOWN";
> }
>
> // Verification tests
> console.assert(getWebSocketStateName(0) === "CONNECTING", "Test 1 Failed");
> console.assert(getWebSocketStateName(1) === "OPEN", "Test 2 Failed");
> console.assert(getWebSocketStateName(3) === "CLOSED", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **WebSocket.readyState Property**: Read-only integer property representing current state of connection.
> 2. **State 1 (OPEN) Guard**: Messages can ONLY be sent via ws.send() when readyState === 1 (OPEN).
> 3. **Defensive State Checking**: Check readyState before calling ws.send() to avoid InvalidStateError DOMExceptions.
---

## 6. Related Terms
- [The fetch() API](../level_05/fetch.md) — The HTTP alternative to `WebSocket`.
- [Socket.io (Ecosystem tool)](socket_io.md) — A massive third-party library that wraps the native WebSocket API to make it easier to use.
- [Heartbeat / Ping-Pong](heartbeat_ping_pong.md) — Related concept: Heartbeat / Ping-Pong.
- [Reconnection & Backoff](reconnection_backoff.md) — Related concept: Reconnection & Backoff.
- [WebSocket Handshake (Upgrade)](websocket_handshake.md) — Related concept: WebSocket Handshake (Upgrade).

---

## 7. Key Takeaways
- The **`WebSocket`** object is built directly into all modern web browsers.
- You connect to it using `ws://` or `wss://` URLs.
- It is purely event-driven (`onopen`, `onmessage`, `onclose`).
- It does **not** auto-reconnect if the Wi-Fi drops!
- You must manually stringify and parse all JSON data sent over the socket.
