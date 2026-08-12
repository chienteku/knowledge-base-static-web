# Polling vs Long Polling

> **Level 8 — Real-Time APIs**
> The two "hacky" ways to achieve real-time data using standard HTTP requests when WebSockets or SSE are unavailable.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Polling exploits this lifecycle to simulate real-time behavior.
- [Server-Sent Events (SSE)](sse.md) — The modern replacement for these hacks.

---

## 2. Term Category

**Networking Pattern / Legacy Architecture (Legacy Systems / Restrictive Networks)**: Polling vs Long Polling is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the 2000s, before WebSockets and SSE were invented, HTTP was strictly a "Client asks, Server answers" protocol. If you were building a chat app, how could the Client know if a new message arrived? 
Developers had to "hack" the HTTP protocol. They invented two patterns: **Short Polling** and **Long Polling**.

### (2) Short Polling (The Annoying Kid)
The easiest way to get live data is to write a `setInterval` that makes a `fetch()` request every 3 seconds.
**Client:** "Any new messages?" 
**Server:** "No."
*(3 seconds later)*
**Client:** "Any new messages?"
**Server:** "No."
**Why it's bad:** It wastes a massive amount of network bandwidth and CPU. If 1,000 users are online, the server is processing 333 useless requests every single second!

### (3) Long Polling (The Patient Kid)
To reduce server strain, developers invented Long Polling. 
The Client makes a request. If the Server has no new messages, *the Server refuses to reply*. It intentionally holds the connection open, hanging in limbo. 
The Client sits there waiting (sometimes for 30 seconds). As soon as a message *does* arrive, the Server finally replies. The Client processes the message, and instantly opens a new hanging request.
**Why it's bad:** While better than Short Polling, holding thousands of idle HTTP connections open consumes vast amounts of Server RAM.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidentally building a Short Polling DDoS

**The mistake:** A junior developer uses `useEffect` in React to fetch data. They accidentally omit the dependency array, causing React to infinitely loop and make a `fetch()` request every 10 milliseconds.

**Why it's wrong:** You just accidentally built the world's most aggressive Short Poller. You will instantly trigger the API's [Rate Limiting](../level_06/rate_limiting.md) defenses, and your IP address will be banned.
**Golden Rule:** Never write a `while (true)` or un-throttled loop that makes network requests!

---

### Mistake 2: Using Short Polling for Real-Time High-Frequency Web Apps ("Polling Overhead")

**The mistake:** Executing `setInterval(() => fetch('/api/chat'), 500)` every 500ms to build real-time chat.

**Why it's wrong:** Short polling creates massive server CPU load and network overhead (hundreds of empty 200 OK responses per minute). Use **WebSockets** or **Server-Sent Events (SSE)**.

*Incorrect:*
```javascript
// Short polling chat endpoint every 500ms
setInterval(async () => {
  const res = await fetch('/api/messages'); // ❌ 99% of requests return empty arrays!
}, 500);
```

*Fix:*
```javascript
// Use WebSocket connection for instant real-time event pushes:
const socket = new WebSocket('wss://api.example.com/chat');
socket.onmessage = (event) => renderMessage(JSON.parse(event.data));
```

---

### Mistake 3: Forgetting to Clear `setInterval` Polling Loops on Component Unmount in React

**The mistake:** Starting a `setInterval` polling loop inside `useEffect` without returning a cleanup function.

**Why it's wrong:** Un-cleared intervals continue running in the background after component unmounts, causing memory leaks and state update errors on unmounted components.

*Incorrect:*
```javascript
useEffect(() => {
  setInterval(fetchData, 3000); // ❌ Missing cleanup return function!
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  const timer = setInterval(fetchData, 3000);
  return () => clearInterval(timer); // Proper cleanup on unmount
}, []);
```


---

### Mistake 4: Using Short Polling for Real-Time High-Frequency Web Apps ("Polling Overhead")

**The mistake:** Executing `setInterval(() => fetch('/api/chat'), 500)` every 500ms to build real-time chat.

**Why it's wrong:** Short polling creates massive server CPU load and network overhead (hundreds of empty 200 OK responses per minute). Use **WebSockets** or **Server-Sent Events (SSE)**.

*Incorrect:*
```javascript
// Short polling chat endpoint every 500ms
setInterval(async () => {
  const res = await fetch('/api/messages'); // ❌ 99% of requests return empty arrays!
}, 500);
```

*Fix:*
```javascript
// Use WebSocket connection for instant real-time event pushes:
const socket = new WebSocket('wss://api.example.com/chat');
socket.onmessage = (event) => renderMessage(JSON.parse(event.data));
```

---

### Mistake 5: Forgetting to Clear `setInterval` Polling Loops on Component Unmount in React

**The mistake:** Starting a `setInterval` polling loop inside `useEffect` without returning a cleanup function.

**Why it's wrong:** Un-cleared intervals continue running in the background after component unmounts, causing memory leaks and state update errors on unmounted components.

*Incorrect:*
```javascript
useEffect(() => {
  setInterval(fetchData, 3000); // ❌ Missing cleanup return function!
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  const timer = setInterval(fetchData, 3000);
  return () => clearInterval(timer); // Proper cleanup on unmount
}, []);
```


---

### Mistake 6: Using Short Polling for Real-Time High-Frequency Web Apps ("Polling Overhead")

**The mistake:** Executing `setInterval(() => fetch('/api/chat'), 500)` every 500ms to build real-time chat.

**Why it's wrong:** Short polling creates massive server CPU load and network overhead (hundreds of empty 200 OK responses per minute). Use **WebSockets** or **Server-Sent Events (SSE)**.

*Incorrect:*
```javascript
// Short polling chat endpoint every 500ms
setInterval(async () => {
  const res = await fetch('/api/messages'); // ❌ 99% of requests return empty arrays!
}, 500);
```

*Fix:*
```javascript
// Use WebSocket connection for instant real-time event pushes:
const socket = new WebSocket('wss://api.example.com/chat');
socket.onmessage = (event) => renderMessage(JSON.parse(event.data));
```

---

### Mistake 7: Forgetting to Clear `setInterval` Polling Loops on Component Unmount in React

**The mistake:** Starting a `setInterval` polling loop inside `useEffect` without returning a cleanup function.

**Why it's wrong:** Un-cleared intervals continue running in the background after component unmounts, causing memory leaks and state update errors on unmounted components.

*Incorrect:*
```javascript
useEffect(() => {
  setInterval(fetchData, 3000); // ❌ Missing cleanup return function!
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  const timer = setInterval(fetchData, 3000);
  return () => clearInterval(timer); // Proper cleanup on unmount
}, []);
```


---

## 5. Practice Exercises

### Exercise 1: Short Polling Client with Exponential Backoff Cap

**Scenario:** An API status monitor polls a server endpoint repeatedly, increasing poll intervals when the resource state remains unchanged.

**Requirements:**
1. Write startShortPolling(fetchStatusFn, initialIntervalMs, maxIntervalMs).
2. Poll endpoint.
3. Increase interval if state unchanged.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function startShortPolling(fetchStatusFn, initialIntervalMs = 1000, maxIntervalMs = 8000) {
>   let currentInterval = initialIntervalMs;
>   let timerId = null;
>
>   async function poll() {
>     try {
>       const result = await fetchStatusFn();
>       if (result.status === "COMPLETED") {
>         currentInterval = initialIntervalMs;
>       } else {
>         currentInterval = Math.min(maxIntervalMs, currentInterval * 2);
>       }
>     } catch (e) {
>       currentInterval = Math.min(maxIntervalMs, currentInterval * 2);
>     } finally {
>       timerId = setTimeout(poll, currentInterval);
>     }
>   }
>
>   timerId = setTimeout(poll, currentInterval);
>   return { stop: () => clearTimeout(timerId), getInterval: () => currentInterval };
> }
>
> // Verification tests
> let calls = 0;
> const mockFetch = async () => {
>   calls++;
>   return { status: "PROCESSING" };
> };
>
> const pollObj = startShortPolling(mockFetch, 50, 400);
>
> setTimeout(() => {
>   console.assert(pollObj.getInterval() > 50, "Test 1 Failed: Interval must back off");
>   pollObj.stop();
> }, 200);
> ```
>
> #### Technical Explanation
>
> 1. **Short Polling Concept**: Client makes periodic HTTP requests to check if server data has changed.
> 2. **Server Overhead**: Generates high server load and HTTP header overhead even when no data has changed.
> 3. **Adaptive Polling Delay**: Backing off poll intervals reduces unnecessary request traffic.
> 
---

### Exercise 2: Long Polling Server Connection Manager

**Scenario:** An HTTP long-polling handler holds client requests open until new event data becomes available or a 30s timeout occurs.

**Requirements:**
1. Write handleLongPollRequest(req, res, eventEmitter, timeoutMs).
2. Hold request.
3. Respond immediately when event fires.
4. Respond 304 on timeout.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleLongPollRequest(req, res, eventEmitter, timeoutMs = 100) {
>   let timerId = null;
>
>   const onDataEvent = (data) => {
>     if (timerId) clearTimeout(timerId);
>     eventEmitter.removeListener("data", onDataEvent);
>     res.json({ status: 200, data });
>   };
>
>   eventEmitter.once("data", onDataEvent);
>
>   timerId = setTimeout(() => {
>     eventEmitter.removeListener("data", onDataEvent);
>     res.json({ status: 304, data: null });
>   }, timeoutMs);
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
>
> let responseSent = null;
> const mockRes = { json: (obj) => { responseSent = obj; } };
>
> handleLongPollRequest({}, mockRes, emitter, 500);
> emitter.emit("data", "NEW_MESSAGE");
>
> console.assert(responseSent.status === 200 && responseSent.data === "NEW_MESSAGE", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Long Polling Mechanics**: Server delays responding to HTTP request until new data arrives or timeout occurs.
> 2. **Immediate Re-polling**: Upon receiving a response, the client immediately initiates a new long-poll request.
> 3. **Lower Latency than Short Polling**: Delivers messages instantly when events fire, reducing latency.
> 
---

### Exercise 3: Real-Time Protocol Architecture Selector

**Scenario:** An API architect evaluates polling vs SSE vs WebSockets based on traffic frequency and bi-directionality requirements.

**Requirements:**
1. Write recommendRealtimeProtocol(isBiDirectional, frequencyPerSec, requiresBinary).
2. Recommend 'WEBSOCKET', 'SSE', or 'POLLING'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function recommendRealtimeProtocol(isBiDirectional, frequencyPerSec, requiresBinary = false) {
>   if (isBiDirectional || requiresBinary) {
>     return "WEBSOCKET";
>   }
>   if (frequencyPerSec >= 1) {
>     return "SSE";
>   }
>   return "POLLING";
> }
>
> // Verification tests
> console.assert(recommendRealtimeProtocol(true, 10) === "WEBSOCKET", "Test 1 Failed");
> console.assert(recommendRealtimeProtocol(false, 5) === "SSE", "Test 2 Failed");
> console.assert(recommendRealtimeProtocol(false, 0.05) === "POLLING", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **WebSockets Strength**: Full-duplex low-overhead bi-directional communication over a single TCP connection.
> 2. **SSE (Server-Sent Events) Strength**: Simpler HTTP-based server-to-client unidirectional streaming with auto-reconnect.
> 3. **Polling Use Cases**: Ideal for low-frequency updates (e.g. checking job status every 5 minutes).
---

## 6. Related Terms
- [WebSockets](websockets.md) — The technology that made Polling obsolete.
- [Webhooks](../level_06/webhooks.md) — The Server-to-Server equivalent to eliminate polling.
- [Socket.io (Ecosystem tool)](socket_io.md) — Related concept: Socket.io (Ecosystem tool).

---

## 7. Key Takeaways
- **Short Polling** is repeatedly sending HTTP requests on a timer to ask for new data (highly inefficient).
- **Long Polling** is sending an HTTP request, and the server intentionally delays the response until new data is available.
- Both are legacy hacks to simulate real-time behavior over standard HTTP.
- Modern apps should use WebSockets or SSE instead!
