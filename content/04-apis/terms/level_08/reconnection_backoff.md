# Reconnection & Backoff

> **Level 8 — Real-Time APIs**
> Re-establishing a dropped real-time connection.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time connection protocol.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The mathematical delay concepts for network retries.

---

## 2. Term Category

**Real-Time (Client-Side: Managed primarily by front-end scripts or client-side SDK wrappers.)**: Reconnection & Backoff is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
WebSocket connections are persistent but fragile. If a user walks out of range of their home Wi-Fi network, or their cell signal drops momentarily, the WebSocket connection is broken.

Unlike standard HTTP APIs where the user can click a link or a button to trigger a reload, a real-time application (like a chat app or stock ticker) must **automatically reconnect in the background** to ensure the user continues to receive updates without reloading the browser tab.

However, if a backend server crashes or goes offline for maintenance, all connected clients (potentially thousands of devices) lose their connection at the same time. If every client attempts to reconnect immediately and continuously, they will flood the server with traffic when it attempts to boot back up. This triggers a **Thundering Herd** denial of service.

To avoid this, clients implement **Automatic Reconnection with Exponential Backoff and Jitter**:
- The client listens to the WebSocket's `.onclose` event.
- It attempts to reconnect after an exponentially increasing delay (e.g. `1s`, then `2s`, then `4s`, then `8s`).
- A small random offset (jitter) is added to the delay to desynchronize the retry timings across all client devices.

---

### (2) Reality Metaphor
Imagine a dropped phone call with a friend.
- **Naive Reconnection** is like both of you redialing the other person's number the exact split second the call drops. Because you are both calling simultaneously, you both receive a **busy signal** (**DDoS surge**). You hang up and redial instantly, colliding again.
- **Backoff Reconnection** is like agreeing to a rule: *"If the call drops, I will wait 5 seconds before calling back. If that fails, I will wait 10 seconds, then 20 seconds."* This gives the telephone lines time to settle and prevents busy signal collisions.

---

### (3) JavaScript Client-Side Implementation

Once a WebSocket is closed, its state is finalized. To reconnect, the client must instantiate a new WebSocket object:

```javascript
class ReconnectingWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.retryCount = 0;
    this.maxDelayMs = 30000; // Cap backoff at 30 seconds
    this.connect();
  }

  connect() {
    console.log(`Connecting to WebSocket: ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("Connection established!");
      this.retryCount = 0; // Reset retries on successful connection
    };

    this.ws.onmessage = (event) => {
      console.log("Received data:", event.data);
    };

    // 1. Listen for connection close events
    this.ws.onclose = () => {
      console.warn("Connection lost. Initiating reconnect sequence...");
      this.reconnect();
    };

    this.ws.onerror = (err) => {
      console.error("Socket error occurred:", err);
    };
  }

  reconnect() {
    // 2. Calculate exponential backoff delay: 1000 * 2^retry
    const backoff = 1000 * Math.pow(2, this.retryCount);
    const delay = Math.min(backoff, this.maxDelayMs);
    
    // 3. Add random jitter (+/- 20%)
    const jitter = (Math.random() - 0.5) * 0.2 * delay;
    const finalDelay = delay + jitter;
    
    this.retryCount++;
    console.log(`Retrying connection in ${Math.round(finalDelay)}ms (Attempt #${this.retryCount})`);
    
    // 4. Schedule the next connection attempt
    setTimeout(() => {
      this.connect();
    }, finalDelay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error("Unable to send data; socket is not open.");
    }
  }
}

// Usage:
const socket = new ReconnectingWebSocket("wss://api.example.com/stream");
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to call `.open()` or reconnect on a closed WebSocket instance

**The mistake:** Trying to reopen an existing WebSocket instance:
```javascript
const ws = new WebSocket(url);
ws.onclose = () => {
  ws.open(); // WRONG! open() is not a method on the WebSocket object
};
```

**Why it's wrong:** Once a browser `WebSocket` transitions to the `CLOSED` state, it is permanently terminated. You cannot reboot or reuse the object.

*Fix:* You must create a new WebSocket instance by calling `new WebSocket(url)` during each reconnection attempt.

---

### Mistake 2: Reconnecting Dropped WebSockets Immediately in a Loop ("Reconnection Storm")

**The mistake:** Writing `ws.onclose = () => connectWebSocket()` without delay when server restarts.

**Why it's wrong:** If a server restarts, thousands of connected clients attempting immediate reconnection simultaneously crash the server during boot. Implement Exponential Backoff with Jitter.

*Incorrect:*
```javascript
ws.onclose = () => {
  connect(); // ❌ 10,000 clients reconnect simultaneously, crashing server!
};
```

*Fix:*
```javascript
ws.onclose = () => {
  const delay = Math.pow(2, attempts++) * 1000 + Math.random() * 1000;
  setTimeout(connect, delay); // Exponential backoff with random jitter
};
```

---

### Mistake 3: Failing to Resynchronize Missed State After Successful Reconnection

**The mistake:** Reconnecting a WebSocket and assuming no real-time messages were missed during the disconnect window.

**Why it's wrong:** Messages sent while the socket was offline are lost. Upon reconnection, clients must query an catch-up API endpoint (`GET /events?since=lastSeqId`) to sync state.

*Incorrect:*
```http
/* Reconnecting WebSocket without state catch-up query */
```

*Fix:*
```javascript
ws.onopen = () => {
  syncMissedEvents(lastProcessedEventId); // Catch-up state sync
};
```

## 5. Practice Exercises

### Exercise 1: Automatic Reconnecting WebSocket Client

**Scenario:** A resilient WebSocket client automatically attempts reconnection with exponential backoff whenever the socket disconnects.

**Requirements:**
1. Write createReconnectingWs(url, options).
2. Track attempts.
3. Calculate backoff delay `min(maxDelay, baseDelay * 2^attempt)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createReconnectingWs(url, options = {}, mockWsFactory) {
>   let attempt = 0;
>   const baseDelay = options.baseDelayMs || 100;
>   const maxDelay = options.maxDelayMs || 1000;
>   let activeSocket = null;
>
>   function connect() {
>     activeSocket = mockWsFactory ? mockWsFactory(url) : new WebSocket(url);
>
>     activeSocket.onclose = () => {
>       attempt++;
>       const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
>       setTimeout(connect, delay);
>     };
>   }
>
>   connect();
>   return { getAttempt: () => attempt, getSocket: () => activeSocket };
> }
>
> // Verification tests
> let socketsCreated = 0;
> const mockWsFactory = () => {
>   socketsCreated++;
>   const s = { onclose: null };
>   setTimeout(() => { if (s.onclose) s.onclose(); }, 10);
>   return s;
> };
>
> const rWs = createReconnectingWs("wss://api.com", { baseDelayMs: 20 }, mockWsFactory);
>
> setTimeout(() => {
>   console.assert(socketsCreated > 1, "Test 1 Failed: Must automatically reconnect on close");
> }, 100);
> ```
>
> #### Technical Explanation
>
> 1. **Exponential Backoff Reconnection**: Prevents client reconnection storms by doubling reconnection delay on consecutive failures.
> 2. **Socket State Management**: Cleans up closed socket handlers before creating a new WebSocket instance.
> 3. **Automatic Resumption**: Restores real-time data flow transparently when connection drops briefly.
> 
---

### Exercise 2: Offline Message Queue Buffering Manager

**Scenario:** Buffers outgoing WebSocket messages in an offline queue while disconnected and flushes them upon reconnection.

**Requirements:**
1. Write createBufferedWsClient(wsClient).
2. Buffer messages if disconnected.
3. Flush buffer when connection opens.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBufferedWsClient() {
>   let isConnected = false;
>   const buffer = [];
>
>   return {
>     onOpen() {
>       isConnected = true;
>       const flushed = [...buffer];
>       buffer.length = 0;
>       return flushed;
>     },
>     onClose() {
>       isConnected = false;
>     },
>     send(message) {
>       if (isConnected) {
>         return { status: "SENT", message };
>       }
>       buffer.push(message);
>       return { status: "BUFFERED", queueLength: buffer.length };
>     }
>   };
> }
>
> // Verification tests
> const client = createBufferedWsClient();
> console.assert(client.send("msg1").status === "BUFFERED", "Test 1 Failed: Buffers when offline");
> console.assert(client.send("msg2").status === "BUFFERED", "Test 2 Failed");
>
> const flushed = client.onOpen();
> console.assert(flushed.length === 2 && flushed[0] === "msg1", "Test 3 Failed: Flushes queued messages on open");
> ```
>
> #### Technical Explanation
>
> 1. **Offline Queue Pattern**: Holds client actions in an array buffer while network is unavailable.
> 2. **Message Order Preservation**: Flushes buffered messages in FIFO (First-In, First-Out) order upon connection restore.
> 3. **Zero Data Loss UX**: Allows users to continue interacting with UI without throwing network exception errors.
> 
---

### Exercise 3: Full Jitter Reconnection Delay Calculator

**Scenario:** Calculates randomized Full Jitter reconnection delay to prevent thundering herd reconnection bursts on server restart.

**Requirements:**
1. Write calculateJitterDelay(attempt, baseMs, maxMs).
2. Return `random() * min(maxMs, baseMs * 2^attempt)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateJitterDelay(attempt, baseMs = 100, maxMs = 5000) {
>   const expDelay = Math.min(maxMs, baseMs * Math.pow(2, attempt));
>   return Math.floor(Math.random() * expDelay);
> }
>
> // Verification tests
> const delay1 = calculateJitterDelay(1, 100, 1000);
> const delay2 = calculateJitterDelay(1, 100, 1000);
>
> console.assert(delay1 >= 0 && delay1 <= 200, "Test 1 Failed: Range 0-200ms");
> console.assert(typeof delay1 === "number", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Full Jitter Reconnection**: Randomizing reconnection delay prevents thousands of clients from attempting reconnection at the exact same millisecond.
> 2. **Server Protection**: Protects recovering servers from getting crushed by synchronized client reconnection floods.
> 3. **AWS Recommended Pattern**: Standard architecture recommendation for all distributed real-time clients.
---

## 6. Related Terms
- [Heartbeat / Ping-Pong](heartbeat_ping_pong.md) — The diagnostic frame checks that alert the client of a silent disconnect.
- [The WebSocket API (Client-side)](websocket_api.md) — The browser object interface.

---

## 7. Key Takeaways
- Automatic reconnection allows real-time applications to restore dropped connections in the background.
- Immediate, synchronized retries risk causing a Thundering Herd crash on the server.
- Exponential backoff with random jitter desynchronizes client retry timings to protect server load.
- Once a WebSocket instance enters the CLOSED state, it cannot be reopened or reused.
- To reconnect, instantiate a new WebSocket connection using `new WebSocket(url)`.
