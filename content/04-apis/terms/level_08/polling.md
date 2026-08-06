# Polling vs Long Polling

> **Level 8 — Real-Time APIs**
> The two "hacky" ways to achieve real-time data using standard HTTP requests when WebSockets or SSE are unavailable.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Polling exploits this lifecycle to simulate real-time behavior.
- [Server-Sent Events (SSE)](sse.md) — The modern replacement for these hacks.

---

## 2. Term Category
- **Networking Pattern / Legacy Architecture**

---

## 3. Environment Context
- **Legacy Systems / Restrictive Networks**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Identify the Pattern

**Problem:** You are tracking a pizza delivery. The app makes a network request. The browser's network tab shows the request status as "Pending..." for 45 seconds. Suddenly, the status changes to "200 OK" and the pizza icon moves on the map. Which pattern is this?

**Expected output:**
> [!check]- Answer
> ```text
> Long Polling.
> Because the request sat "Pending" for 45 seconds, the server was intentionally holding the connection open until it had new location data to report.
> ```
> - Did the app make 15 fast requests, or 1 very slow request?
> 
---

### Exercise 2: Short Polling vs Long Polling Comparison

**Problem:** Contrast Short Polling vs Long Polling.

**Expected output:**
> [!check]- Answer
> ```text
> Short Polling: Client requests data immediately on fixed timer interval regardless of server state.
> Long Polling: Server holds incoming request open until new data is available or timeout occurs.
> ```
> ```text
> Short Polling -> Client requests data at fixed interval; server returns immediately.
> Long Polling  -> Server holds request connection open until data arrives or timeout.
> ```
> - **Explanation:** Long polling reduces empty HTTP round-trips compared to short polling.
---

### Exercise 3: When is Polling Still Appropriate?

**Problem:** Give 1 valid architectural use case where simple Polling is preferred over WebSockets.

**Expected output:**
> [!check]- Answer
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> - **Explanation:** Polling is simpler for low-frequency non-urgent background task checks.
---

### Exercise 4: Short Polling vs Long Polling Comparison

**Problem:** Contrast Short Polling vs Long Polling.

**Expected output:**
> [!check]- Answer
> ```text
> Short Polling: Client requests data immediately on fixed timer interval regardless of server state.
> Long Polling: Server holds incoming request open until new data is available or timeout occurs.
> ```
> ```text
> Short Polling -> Client requests data at fixed interval; server returns immediately.
> Long Polling  -> Server holds request connection open until data arrives or timeout.
> ```
> - **Explanation:** Long polling reduces empty HTTP round-trips compared to short polling.
---

### Exercise 5: When is Polling Still Appropriate?

**Problem:** Give 1 valid architectural use case where simple Polling is preferred over WebSockets.

**Expected output:**
> [!check]- Answer
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> - **Explanation:** Polling is simpler for low-frequency non-urgent background task checks.
---

### Exercise 6: Short Polling vs Long Polling Comparison

**Problem:** Contrast Short Polling vs Long Polling.

**Expected output:**
> [!check]- Answer
> ```text
> Short Polling: Client requests data immediately on fixed timer interval regardless of server state.
> Long Polling: Server holds incoming request open until new data is available or timeout occurs.
> ```
> ```text
> Short Polling -> Client requests data at fixed interval; server returns immediately.
> Long Polling  -> Server holds request connection open until data arrives or timeout.
> ```
> - **Explanation:** Long polling reduces empty HTTP round-trips compared to short polling.
---

### Exercise 7: When is Polling Still Appropriate?

**Problem:** Give 1 valid architectural use case where simple Polling is preferred over WebSockets.

**Expected output:**
> [!check]- Answer
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> ```text
> Checking status of slow asynchronous background jobs (e.g. video processing export) that take several minutes.
> ```
> - **Explanation:** Polling is simpler for low-frequency non-urgent background task checks.
---

## 7. Related Terms
- [WebSockets](websockets.md) — The technology that made Polling obsolete.
- [Webhooks](../level_06/webhooks.md) — The Server-to-Server equivalent to eliminate polling.
- [Socket.io (Ecosystem tool)](socket_io.md) — Related concept: Socket.io (Ecosystem tool).

---

## 8. Key Takeaways
- **Short Polling** is repeatedly sending HTTP requests on a timer to ask for new data (highly inefficient).
- **Long Polling** is sending an HTTP request, and the server intentionally delays the response until new data is available.
- Both are legacy hacks to simulate real-time behavior over standard HTTP.
- Modern apps should use WebSockets or SSE instead!
