# Server-Sent Events (SSE)

> **Level 8 — Real-Time APIs**
> A lightweight alternative to WebSockets that allows the Server to push real-time updates to the Client over a standard, long-running HTTP connection.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — SSE solves a very specific problem that WebSockets are overkill for.
- [HTTP / HTTPS](../level_01/http_https.md) — Unlike WebSockets, SSE strictly remains HTTP.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal** (Browser & Server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
[WebSockets](../level_08/websockets.md) are incredibly powerful, but they are completely Bi-directional (two-way). Setting up a WebSocket server is complex, and corporate firewalls often block them.
What if you are building a live Twitter feed, or a live stock ticker? The Client never needs to send data *up* to the Server quickly; it just needs to sit there and listen as the Server pushes data *down*. 
For this, we use **Server-Sent Events (SSE)**. It uses standard HTTP, but the Server never closes the connection. It just keeps dripping data down the pipe forever.

### (2) Reality Metaphor
**WebSockets:** A two-way walkie-talkie conversation.
**SSE:** A radio broadcast. You tune your radio (the Client) to a station. You cannot talk back to the DJ. You simply sit and listen as the DJ broadcasts music to you continuously.

### (3) How it works (The EventSource API)
To use SSE in the browser, you don't use `fetch()`. You use the built-in `EventSource` object.
```javascript
// 1. Connect to the SSE endpoint
const eventSource = new EventSource('/api/live-stocks');

// 2. Listen for the server to push messages
eventSource.onmessage = (event) => {
  const stockData = JSON.parse(event.data);
  console.log("New Stock Price:", stockData.price);
};
```
On the server, you set the header `Content-Type: text/event-stream`. Instead of calling `res.end()`, the server uses `res.write()` to continuously push strings of data down the open connection.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using WebSockets when SSE is better

**The mistake:** A developer builds a live sports scoreboard app. They spend a week setting up a complex WebSocket architecture to stream the live scores to users.

**Why it's wrong:** WebSockets are overkill here! The users are not sending any data *to* the scoreboard; they are just passively watching. SSE is vastly simpler to implement, works perfectly over standard HTTP (bypassing strict firewalls), and has built-in automatic reconnection if the user's Wi-Fi drops (WebSockets force you to code reconnection logic manually). 
**Golden Rule:** If the data only flows one way (Server $\rightarrow$ Client), use SSE. If it flows both ways (Chat app), use WebSockets.

---

### Mistake 2: Attempting to Send Client-to-Server Data Over an SSE EventSource Connection

**The mistake:** Trying to use `eventSource.send()` to transmit data from browser client to server.

**Why it's wrong:** Server-Sent Events (SSE) is strictly **Unidirectional** (Server -> Client only). Clients cannot send messages over an `EventSource` connection. Use HTTP POST requests or WebSockets.

*Incorrect:*
```javascript
const evt = new EventSource('/api/events');
evt.send('Hello Server'); // ❌ EventSource has no send() method!
```

*Fix:*
```javascript
// Send client data via standard fetch POST requests:
fetch('/api/messages', { method: 'POST', body: JSON.stringify({ text: 'Hello' }) });
```

---

### Mistake 3: Forgetting `Content-Type: text/event-stream` Header in SSE Backend Handlers

**The mistake:** Configuring SSE server endpoint returning `Content-Type: application/json` or `text/plain`.

**Why it's wrong:** Browsers require `Content-Type: text/event-stream` and `Cache-Control: no-cache` to parse SSE event streams.

*Incorrect:*
```javascript
res.setHeader('Content-Type', 'text/plain'); // ❌ Browser EventSource fails!
```

*Fix:*
```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```


---

### Mistake 4: Attempting to Send Client-to-Server Data Over an SSE EventSource Connection

**The mistake:** Trying to use `eventSource.send()` to transmit data from browser client to server.

**Why it's wrong:** Server-Sent Events (SSE) is strictly **Unidirectional** (Server -> Client only). Clients cannot send messages over an `EventSource` connection. Use HTTP POST requests or WebSockets.

*Incorrect:*
```javascript
const evt = new EventSource('/api/events');
evt.send('Hello Server'); // ❌ EventSource has no send() method!
```

*Fix:*
```javascript
// Send client data via standard fetch POST requests:
fetch('/api/messages', { method: 'POST', body: JSON.stringify({ text: 'Hello' }) });
```

---

### Mistake 5: Forgetting `Content-Type: text/event-stream` Header in SSE Backend Handlers

**The mistake:** Configuring SSE server endpoint returning `Content-Type: application/json` or `text/plain`.

**Why it's wrong:** Browsers require `Content-Type: text/event-stream` and `Cache-Control: no-cache` to parse SSE event streams.

*Incorrect:*
```javascript
res.setHeader('Content-Type', 'text/plain'); // ❌ Browser EventSource fails!
```

*Fix:*
```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```


---

### Mistake 6: Attempting to Send Client-to-Server Data Over an SSE EventSource Connection

**The mistake:** Trying to use `eventSource.send()` to transmit data from browser client to server.

**Why it's wrong:** Server-Sent Events (SSE) is strictly **Unidirectional** (Server -> Client only). Clients cannot send messages over an `EventSource` connection. Use HTTP POST requests or WebSockets.

*Incorrect:*
```javascript
const evt = new EventSource('/api/events');
evt.send('Hello Server'); // ❌ EventSource has no send() method!
```

*Fix:*
```javascript
// Send client data via standard fetch POST requests:
fetch('/api/messages', { method: 'POST', body: JSON.stringify({ text: 'Hello' }) });
```

---

### Mistake 7: Forgetting `Content-Type: text/event-stream` Header in SSE Backend Handlers

**The mistake:** Configuring SSE server endpoint returning `Content-Type: application/json` or `text/plain`.

**Why it's wrong:** Browsers require `Content-Type: text/event-stream` and `Cache-Control: no-cache` to parse SSE event streams.

*Incorrect:*
```javascript
res.setHeader('Content-Type', 'text/plain'); // ❌ Browser EventSource fails!
```

*Fix:*
```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```


---

## 6. Practice Exercises

### Exercise 1: The Right Tool

**Problem:** ChatGPT streams its AI-generated answers back to your screen one word at a time. It feels like real-time. Which technology is OpenAI most likely using for this?
A) WebSockets
B) Server-Sent Events

**Expected output:**
> [!check]- Answer
> ```text
> B) Server-Sent Events (SSE).
> You ask the question once (via a standard POST request). After that, the AI is simply dripping the answer down to you, one way, over an extended period of time. SSE is the absolute perfect tool for LLM text generation streaming!
> ```
> - Is the client actively sending data *while* the AI is typing? No.
> 
---

### Exercise 2: SSE Wire Format Message Structure

**Problem:** Write valid text payload for an SSE event with event name `ping` and data `{"time":1700000000}`.

**Expected output:**
> [!check]- Answer
> ```http
> event: ping
> data: {"time":1700000000}
> 
> 
> ```
> ```http
> event: ping
> data: {"time":1700000000}
> ```
> - **Explanation:** SSE wire format requires `event:`, `data:`, and trailing double newline (`\n\n`).
---

### Exercise 3: SSE vs WebSocket Comparison

**Problem:** Compare Server-Sent Events (SSE) vs WebSockets across:
1. Directionality
2. Protocol basis
3. Built-in reconnection support

**Expected output:**
> [!check]- Answer
> ```text
> 1. SSE: Unidirectional (Server->Client); WebSockets: Bidirectional
> 2. SSE: Standard HTTP; WebSockets: Custom WS protocol (ws://)
> 3. SSE: Built-in automatic reconnection; WebSockets: Requires custom JS code
> ```
> ```text
> Directionality -> SSE: Unidirectional (Server -> Client), WS: Bidirectional
> Protocol       -> SSE: HTTP/1.1 or HTTP/2, WS: Custom TCP (ws://)
> Reconnection   -> SSE: Automatic natively in browser EventSource, WS: Custom code
> ```
> - **Explanation:** SSE provides simpler HTTP-native streaming for server-to-client notifications.
---

### Exercise 4: SSE Wire Format Message Structure

**Problem:** Write valid text payload for an SSE event with event name `ping` and data `{"time":1700000000}`.

**Expected output:**
> [!check]- Answer
> ```http
> event: ping
> data: {"time":1700000000}
> 
> 
> ```
> ```http
> event: ping
> data: {"time":1700000000}
> ```
> - **Explanation:** SSE wire format requires `event:`, `data:`, and trailing double newline (`\n\n`).
---

### Exercise 5: SSE vs WebSocket Comparison

**Problem:** Compare Server-Sent Events (SSE) vs WebSockets across:
1. Directionality
2. Protocol basis
3. Built-in reconnection support

**Expected output:**
> [!check]- Answer
> ```text
> 1. SSE: Unidirectional (Server->Client); WebSockets: Bidirectional
> 2. SSE: Standard HTTP; WebSockets: Custom WS protocol (ws://)
> 3. SSE: Built-in automatic reconnection; WebSockets: Requires custom JS code
> ```
> ```text
> Directionality -> SSE: Unidirectional (Server -> Client), WS: Bidirectional
> Protocol       -> SSE: HTTP/1.1 or HTTP/2, WS: Custom TCP (ws://)
> Reconnection   -> SSE: Automatic natively in browser EventSource, WS: Custom code
> ```
> - **Explanation:** SSE provides simpler HTTP-native streaming for server-to-client notifications.
---

### Exercise 6: SSE Wire Format Message Structure

**Problem:** Write valid text payload for an SSE event with event name `ping` and data `{"time":1700000000}`.

**Expected output:**
> [!check]- Answer
> ```http
> event: ping
> data: {"time":1700000000}
> 
> 
> ```
> ```http
> event: ping
> data: {"time":1700000000}
> ```
> - **Explanation:** SSE wire format requires `event:`, `data:`, and trailing double newline (`\n\n`).
---

### Exercise 7: SSE vs WebSocket Comparison

**Problem:** Compare Server-Sent Events (SSE) vs WebSockets across:
1. Directionality
2. Protocol basis
3. Built-in reconnection support

**Expected output:**
> [!check]- Answer
> ```text
> 1. SSE: Unidirectional (Server->Client); WebSockets: Bidirectional
> 2. SSE: Standard HTTP; WebSockets: Custom WS protocol (ws://)
> 3. SSE: Built-in automatic reconnection; WebSockets: Requires custom JS code
> ```
> ```text
> Directionality -> SSE: Unidirectional (Server -> Client), WS: Bidirectional
> Protocol       -> SSE: HTTP/1.1 or HTTP/2, WS: Custom TCP (ws://)
> Reconnection   -> SSE: Automatic natively in browser EventSource, WS: Custom code
> ```
> - **Explanation:** SSE provides simpler HTTP-native streaming for server-to-client notifications.
---

## 7. Related Terms
- [WebSockets](websockets.md) — The two-way alternative.
- [HTTP Headers](../level_02/http_headers.md) — SSE relies on `Content-Type: text/event-stream`.

---

## 8. Key Takeaways
- **Server-Sent Events (SSE)** is a unidirectional (one-way) real-time protocol.
- Data flows from Server $\rightarrow$ Client over a long-lived HTTP connection.
- It is significantly easier to implement than WebSockets.
- It is the standard technology used to stream AI text generation (like ChatGPT).
