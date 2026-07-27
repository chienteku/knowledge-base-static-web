# Reconnection & Backoff

> **Level 8 — Real-Time APIs**
> Re-establishing a dropped real-time connection.

---

## 1. Prerequisites
- [WebSockets](./websockets.md) — The real-time connection protocol.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The mathematical delay concepts for network retries.

---

## 2. Term Category
- **Real-Time**

---

## 3. Environment Context
- **Client-Side**: Managed primarily by front-end scripts or client-side SDK wrappers.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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


---

### Mistake 4: Reconnecting Dropped WebSockets Immediately in a Loop ("Reconnection Storm")

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

### Mistake 5: Failing to Resynchronize Missed State After Successful Reconnection

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


---

### Mistake 6: Reconnecting Dropped WebSockets Immediately in a Loop ("Reconnection Storm")

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

### Mistake 7: Failing to Resynchronize Missed State After Successful Reconnection

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


---

## 6. Practice Exercises

### Exercise 1: Delay Estimator

**Problem:** A client script is attempting to reconnect to a dropped socket. The script is configured with a base delay of **`1000ms`** and a maximum delay cap of **`10,000ms`**. The reconnection attempts are 0-indexed (Attempt 0 = 1st retry, Attempt 1 = 2nd retry).
Calculate the backoff delay (excluding jitter) for **Attempt 4** (the 5th retry overall).

> [!check]- Answer
> - The formula for exponential delay is $\text{Delay} = \text{base} \times 2^{\text{attempt}}$.
> - The delay is capped by a maximum delay threshold parameter.

> [!check]- Answer
> - **`10,000ms`** (Calculation: $1000 \times 2^4 = 1000 \times 16 = 16,000\text{ms}$. Since this exceeds the `10,000ms` cap, the delay is capped at `10,000ms`).


---

### Exercise 2: Reconnection Jitter Formula

**Problem:** Write JavaScript expression calculating reconnect delay for attempt #4 with 1000ms base and 500ms max random jitter.

**Expected output:**
```text
const delay = Math.min(30000, Math.pow(2, 4) * 1000) + Math.random() * 500;
```

> [!check]- Answer
> ```javascript
> const attempts = 4;
> const baseDelay = Math.pow(2, attempts) * 1000; // 16000ms
> const jitter = Math.random() * 500;
> const delay = baseDelay + jitter;
> ```
> - **Explanation:** Exponential backoff + random jitter prevents thundering herd reconnection storms.
---

### Exercise 3: Maximum Reconnect Cap

**Problem:** Why should exponential backoff reconnection delays be capped at a maximum ceiling (e.g. `Math.min(calculatedDelay, 30000)`)?

**Expected output:**
```text
Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
```

> [!check]- Answer
> ```text
> Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
> ```
> - **Explanation:** Capping bounds maximum retry delay while preserving backoff protection.
---

### Exercise 4: Reconnection Jitter Formula

**Problem:** Write JavaScript expression calculating reconnect delay for attempt #4 with 1000ms base and 500ms max random jitter.

**Expected output:**
```text
const delay = Math.min(30000, Math.pow(2, 4) * 1000) + Math.random() * 500;
```

> [!check]- Answer
> ```javascript
> const attempts = 4;
> const baseDelay = Math.pow(2, attempts) * 1000; // 16000ms
> const jitter = Math.random() * 500;
> const delay = baseDelay + jitter;
> ```
> - **Explanation:** Exponential backoff + random jitter prevents thundering herd reconnection storms.
---

### Exercise 5: Maximum Reconnect Cap

**Problem:** Why should exponential backoff reconnection delays be capped at a maximum ceiling (e.g. `Math.min(calculatedDelay, 30000)`)?

**Expected output:**
```text
Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
```

> [!check]- Answer
> ```text
> Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
> ```
> - **Explanation:** Capping bounds maximum retry delay while preserving backoff protection.
---

### Exercise 6: Reconnection Jitter Formula

**Problem:** Write JavaScript expression calculating reconnect delay for attempt #4 with 1000ms base and 500ms max random jitter.

**Expected output:**
```text
const delay = Math.min(30000, Math.pow(2, 4) * 1000) + Math.random() * 500;
```

> [!check]- Answer
> ```javascript
> const attempts = 4;
> const baseDelay = Math.pow(2, attempts) * 1000; // 16000ms
> const jitter = Math.random() * 500;
> const delay = baseDelay + jitter;
> ```
> - **Explanation:** Exponential backoff + random jitter prevents thundering herd reconnection storms.
---

### Exercise 7: Maximum Reconnect Cap

**Problem:** Why should exponential backoff reconnection delays be capped at a maximum ceiling (e.g. `Math.min(calculatedDelay, 30000)`)?

**Expected output:**
```text
Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
```

> [!check]- Answer
> ```text
> Without a cap, exponential delays quickly explode to several hours (2^15 seconds = 9 hours), preventing clients from reconnecting within reasonable timeframes.
> ```
> - **Explanation:** Capping bounds maximum retry delay while preserving backoff protection.
---

## 7. Related Terms
- [Heartbeat / Ping-Pong](./heartbeat_ping_pong.md) — The diagnostic frame checks that alert the client of a silent disconnect.
- [The WebSocket API (Client-side)](./websocket_api.md) — The browser object interface.

---

## 8. Key Takeaways
- Automatic reconnection allows real-time applications to restore dropped connections in the background.
- Immediate, synchronized retries risk causing a Thundering Herd crash on the server.
- Exponential backoff with random jitter desynchronizes client retry timings to protect server load.
- Once a WebSocket instance enters the CLOSED state, it cannot be reopened or reused.
- To reconnect, instantiate a new WebSocket connection using `new WebSocket(url)`.
