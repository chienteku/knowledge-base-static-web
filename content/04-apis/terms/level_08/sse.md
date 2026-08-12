# Server-Sent Events (SSE)

> **Level 8 — Real-Time APIs**
> A lightweight alternative to WebSockets that allows the Server to push real-time updates to the Client over a standard, long-running HTTP connection.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — SSE solves a very specific problem that WebSockets are overkill for.
- [HTTP / HTTPS](../level_01/http_https.md) — Unlike WebSockets, SSE strictly remains HTTP.

---

## 2. Term Category

**Networking Protocol (Universal .)**: Server-Sent Events (SSE) is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Server-Sent Events (SSE) Client Consumer

**Scenario:** A dashboard consumer uses `EventSource` to receive real-time server-sent events (`onmessage`, `addEventListener`).

**Requirements:**
1. Write consumeSseStream(url, onMessageFn, mockEventSource).
2. Listen for incoming message events.
3. Parse JSON event data.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function consumeSseStream(url, onMessageFn, mockEventSourceInstance) {
>   const eventSource = mockEventSourceInstance || new EventSource(url);
>
>   eventSource.onmessage = (event) => {
>     try {
>       const data = JSON.parse(event.data);
>       onMessageFn(data);
>     } catch (e) {
>       onMessageFn(event.data);
>     }
>   };
>
>   return {
>     close: () => eventSource.close()
>   };
> }
>
> // Verification tests
> const messages = [];
> const mockEs = {
>   onmessage: null,
>   close: () => {}
> };
>
> consumeSseStream("https://api.com/stream", (data) => messages.push(data), mockEs);
>
> // Simulate server sending SSE message event
> mockEs.onmessage({ data: '{"price": 100.5}' });
> console.assert(messages[0].price === 100.5, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Server-Sent Events (SSE)**: W3C standard allowing servers to push text stream events to browsers over standard HTTP.
> 2. **EventSource API**: Browser native API (`new EventSource(url)`) for consuming SSE streams.
> 3. **Unidirectional Streaming**: Server-to-client streaming ONLY; client cannot send messages back over the same SSE stream.
> 
---

### Exercise 2: Server-Side SSE Event Stream Formatting Engine

**Scenario:** An API server formats outbound event data into RFC 8895 compliant SSE stream text buffers (`id: 1\nevent: update\ndata: {...}\n\n`).

**Requirements:**
1. Write formatSsePayload(id, eventType, dataObj).
2. Format lines `id:`, `event:`, `data:`.
3. End block with double newline `\n\n`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatSsePayload(id, eventType, dataObj) {
>   const lines = [];
>
>   if (id !== undefined && id !== null) {
>     lines.push(`id: ${id}`);
>   }
>   if (eventType) {
>     lines.push(`event: ${eventType}`);
>   }
>
>   const jsonStr = typeof dataObj === "object" ? JSON.stringify(dataObj) : String(dataObj);
>   lines.push(`data: ${jsonStr}`);
>
>   // SSE event blocks MUST end with two newlines
>   return lines.join("
> ") + "
>
> ";
> }
>
> // Verification tests
> const sseText = formatSsePayload(42, "stockUpdate", { ticker: "AAPL", price: 175 });
>
> console.assert(sseText.includes("id: 42
> "), "Test 1 Failed");
> console.assert(sseText.includes("event: stockUpdate
> "), "Test 2 Failed");
> console.assert(sseText.endsWith("
>
> "), "Test 3 Failed: Must end with double newline");
> ```
>
> #### Technical Explanation
>
> 1. **SSE Text Protocol Specification**: Plain text stream formatted as key-value pairs (`id:`, `event:`, `data:`, `retry:`).
> 2. **Double Newline Delimiter**: Two consecutive newlines (`\n\n`) mark the completion of an individual event block.
> 3. **Content-Type: text/event-stream**: SSE HTTP responses MUST include `Content-Type: text/event-stream` header.
> 
---

### Exercise 3: Last-Event-ID Resumption Handler

**Scenario:** An SSE stream manager inspects the `Last-Event-ID` request header upon client reconnection to replay missed events.

**Requirements:**
1. Write getMissedSseEvents(lastEventId, eventsStore).
2. Filter events newer than lastEventId.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getMissedSseEvents(lastEventId, eventsStore = []) {
>   if (!lastEventId) return eventsStore;
>
>   const lastIdNum = parseInt(lastEventId, 10);
>   if (isNaN(lastIdNum)) return eventsStore;
>
>   return eventsStore.filter(evt => evt.id > lastIdNum);
> }
>
> // Verification tests
> const store = [
>   { id: 1, data: "ev1" },
>   { id: 2, data: "ev2" },
>   { id: 3, data: "ev3" }
> ];
>
> const missed = getMissedSseEvents("1", store);
> console.assert(missed.length === 2 && missed[0].id === 2, "Test 1 Failed: Must replay events after ID 1");
> ```
>
> #### Technical Explanation
>
> 1. **Built-in Auto-Reconnection**: Browsers automatically reconnect when SSE connections drop.
> 2. **Last-Event-ID Header**: Browser sends last received `id:` value in `Last-Event-ID` HTTP header upon reconnecting.
> 3. **Lossless Stream Resumption**: Allows server to replay missed events during network hiccups without data gaps.
---

## 6. Related Terms
- [WebSockets](websockets.md) — The two-way alternative.
- [HTTP Headers](../level_02/http_headers.md) — SSE relies on `Content-Type: text/event-stream`.

---

## 7. Key Takeaways
- **Server-Sent Events (SSE)** is a unidirectional (one-way) real-time protocol.
- Data flows from Server $\rightarrow$ Client over a long-lived HTTP connection.
- It is significantly easier to implement than WebSockets.
- It is the standard technology used to stream AI text generation (like ChatGPT).
