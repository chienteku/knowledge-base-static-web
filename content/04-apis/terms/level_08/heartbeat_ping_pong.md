# Heartbeat / Ping-Pong

> **Level 8 — Real-Time APIs**
> Keep-alive frames that detect a dead connection.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time protocol.

---

## 2. Term Category

**Real-Time (Universal: Implemented inside WebSocket client libraries and backend server runtimes.)**: Heartbeat / Ping-Pong is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
TCP network connections can terminate silently. If a user drives into a tunnel or turns off their mobile data, the physical connection drops. However, the server does not receive a close packet and continues to believe the connection is active, wasting system resources.

Additionally, intermediary routers, firewalls, and load balancers will close idle TCP connections if no data is transmitted through them for a set period (often 60 seconds).

To detect silent drops and prevent firewalls from terminating idle sockets, real-time architectures implement **Heartbeats (Ping-Pong)**:
- **Heartbeats:** Periodic messages sent between the client and server to verify the connection's health.
- **Ping and Pong Frames:** The WebSocket protocol provides built-in control frames for this process: **Ping** (`0x9` opcode) and **Pong`** (`0xA` opcode).
  - The server sends a **Ping** frame to the client at regular intervals (e.g. every 30 seconds).
  - The client's browser automatically replies with a **Pong** frame upon receiving a Ping.
  - If the server does not receive the matching Pong within a set timeout window (e.g. 5 seconds), it assumes the connection is dead, closes the socket, and frees up system memory.

---

### (2) Silent Disconnect detection flow
```text
  [ Server ] ────────────────( Ping Frame )───────────────> [ Client ]
                                                               │
  [ Server ] <───────────────( Pong Frame )──────────────── [ Client ]
  
  (Wait 30 seconds)
  
  [ Server ] ──( Ping Frame )──> [ Network Drop Tunnel ]     [ Client ]
  
  (No Pong received within 5 seconds)
  
  [ Server ] ──( Closes socket, frees RAM )
```

---

### (3) Reality Metaphor
Imagine a deep-sea diver connected to a boat by a lifeline.
- **Silent Disconnect** is like the lifeline snagging on a rock and snapping. The crew on the boat do not realize the line is broken and continue to wait, wasting time.
- **Heartbeat (Ping-Pong)** is a security check. Every 2 minutes, the boat crew tugs the lifeline twice (**a Ping**). If the diver is safe, they immediately tug the line twice in return (**a Pong**).
- If the crew tugs the line and receives no response within 10 seconds, they know the connection is broken. They reel in the line (**close the socket**) and begin recovery actions.

---

### (4) Backend Implementation Example (Node.js `ws` library)

The backend server sets up an interval to check client connections and terminate unresponsive sockets:

```javascript
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

// 1. Monitor socket health by attaching an isAlive flag to each socket
wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  // Register a listener for the automatic client Pong reply
  ws.on('pong', () => {
    ws.isAlive = true; // Mark as responsive
  });
});

// 2. Set up a heartbeat check interval every 30 seconds
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.warn("Client unresponsive. Terminating connection.");
      return ws.terminate(); // Closes the dead socket instantly
    }
    
    // Reset the flag and send a Ping frame to the client
    ws.isAlive = false;
    ws.ping(); 
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting ping intervals to be too frequent

**The mistake:** Setting the heartbeat interval to send pings every 500ms to achieve instant disconnect detection.

**Why it's wrong:** Sending pings multiple times per second consumes excessive network bandwidth and drains the batteries of mobile client devices. Heartbeat intervals should fall within the 20 to 60-second range, which is sufficient to satisfy router timeout windows without overloading clients.

---

### Mistake 2: Omitting Heartbeat Frame Processing on Long-Lived WebSocket Connections

**The mistake:** Establishing WebSocket connections without configuring ping/pong frames.

**Why it's wrong:** Intermediary network proxies, firewalls, and load balancers terminate silent idle TCP connections after 30-60 seconds. Heartbeats maintain active TCP connection state.

*Incorrect:*
```http
/* WebSocket connection without heartbeat ping/pong frames */
// Connection unexpectedly drops every 60s due to proxy timeout!
```

*Fix:*
```javascript
// Send periodic PING frames every 30s:
setInterval(() => ws.ping(), 30000);
```

---

### Mistake 3: Treating Un-Responded Pings as Active Connections (Ghost Connection Memory Leak)

**The mistake:** Failing to terminate WebSocket connection sockets when PONG responses stop arriving.

**Why it's wrong:** When clients lose network coverage without clean disconnects, the server retains orphaned "ghost" sockets in RAM unless un-acknowledged pings trigger socket termination.

*Incorrect:*
```javascript
// Server sends ping but never checks if pong response arrived
ws.ping(); // ❌ Retains ghost sockets indefinitely!
```

*Fix:*
```javascript
ws.isAlive = false;
ws.ping();
// If isAlive remains false on next interval, terminate dead socket:
if (!ws.isAlive) return ws.terminate();
```

## 5. Practice Exercises

### Exercise 1: WebSocket Ping/Pong Heartbeat Monitor

**Scenario:** A real-time financial trading client implements a ping/pong heartbeat timer to detect stale or half-open TCP connections.

**Requirements:**
1. Write startHeartbeat(wsSocket, pingIntervalMs, timeoutMs).
2. Send ping frame periodically.
3. Expect pong response before timeoutMs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function startHeartbeat(wsSocket, pingIntervalMs = 5000, timeoutMs = 3000) {
>   let pingTimer = null;
>   let timeoutTimer = null;
>   let isAlive = true;
>
>   function handlePong() {
>     isAlive = true;
>     if (timeoutTimer) clearTimeout(timeoutTimer);
>   }
>
>   pingTimer = setInterval(() => {
>     if (!isAlive) {
>       clearInterval(pingTimer);
>       if (timeoutTimer) clearTimeout(timeoutTimer);
>       wsSocket.terminate();
>       return;
>     }
>
>     isAlive = false;
>     wsSocket.ping();
>
>     timeoutTimer = setTimeout(() => {
>       if (!isAlive) {
>         clearInterval(pingTimer);
>         wsSocket.terminate();
>       }
>     }, timeoutMs);
>   }, pingIntervalMs);
>
>   return { handlePong, stop: () => { clearInterval(pingTimer); clearTimeout(timeoutTimer); } };
> }
>
> // Verification tests
> let terminated = false;
> let pingSent = false;
>
> const mockWs = {
>   ping: () => { pingSent = true; },
>   terminate: () => { terminated = true; }
> };
>
> const hb = startHeartbeat(mockWs, 50, 30);
> setTimeout(() => hb.handlePong(), 20);
>
> setTimeout(() => {
>   console.assert(pingSent === true, "Test 1 Failed: Ping must be dispatched");
>   console.assert(terminated === false, "Test 2 Failed: Should not terminate when pong received");
>   hb.stop();
> }, 100);
> ```
>
> #### Technical Explanation
>
> 1. **Half-Open TCP State**: A connection where one side disconnects without sending FIN/RST packets; silently drops packets.
> 2. **Ping/Pong Frame Spec**: WebSocket RFC 6455 defines opcode 0x9 for Ping and opcode 0xA for Pong frames.
> 3. **Proactive Disconnection**: Closing dead sockets frees server memory and prompts the client to reconnect.
> 
---

### Exercise 2: Dead Connection Recovery Engine

**Scenario:** An API gateway tracks missed ping responses across connected clients and purges inactive socket sessions.

**Requirements:**
1. Write auditInactiveSockets(activeSocketsMap, maxMissedPings).
2. Increment missedPing count.
3. Close sockets exceeding limit.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditInactiveSockets(activeSocketsMap = new Map(), maxMissedPings = 2) {
>   const terminatedKeys = [];
>
>   for (const [socketId, state] of activeSocketsMap.entries()) {
>     if (!state.receivedPong) {
>       state.missedPings = (state.missedPings || 0) + 1;
>       if (state.missedPings >= maxMissedPings) {
>         state.socket.close();
>         terminatedKeys.push(socketId);
>         activeSocketsMap.delete(socketId);
>       }
>     } else {
>       state.missedPings = 0;
>       state.receivedPong = false;
>     }
>   }
>
>   return terminatedKeys;
> }
>
> // Verification tests
> const sockets = new Map([
>   ["s1", { socket: { close() {} }, receivedPong: true, missedPings: 0 }],
>   ["s2", { socket: { close() {} }, receivedPong: false, missedPings: 1 }]
> ]);
>
> const killed = auditInactiveSockets(sockets, 2);
> console.assert(killed.includes("s2"), "Test 1 Failed: s2 must be terminated");
> console.assert(sockets.has("s1") === true, "Test 2 Failed: Active s1 preserved");
> ```
>
> #### Technical Explanation
>
> 1. **Resource Exhaustion Defense**: Prevents thousands of dead ghost connections from consuming server RAM and file descriptors.
> 2. **Server-Initiated Audit**: Periodically audits socket health independently of client heartbeat signals.
> 3. **Graceful Cleanup**: Explicitly calls socket.close() to release system resources cleanly.
> 
---

### Exercise 3: Browser Heartbeat Emulation Engine

**Scenario:** Simulates WebSocket ping/pong using custom JSON control messages (`{ type: 'ping' }`) for browser environments without raw ping frame control.

**Requirements:**
1. Write processHeartbeatMessage(msgObj, sendFn).
2. If msgObj.type === 'ping', send `{ type: 'pong' }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processHeartbeatMessage(msgObj, sendFn) {
>   if (!msgObj || typeof msgObj !== "object") return false;
>
>   if (msgObj.type === "ping") {
>     sendFn(JSON.stringify({ type: "pong", timestamp: Date.now() }));
>     return true;
>   }
>
>   return false;
> }
>
> // Verification tests
> let sentMsg = null;
> const mockSend = (data) => { sentMsg = JSON.parse(data); };
>
> const isHb = processHeartbeatMessage({ type: "ping" }, mockSend);
> console.assert(isHb === true, "Test 1 Failed");
> console.assert(sentMsg.type === "pong", "Test 2 Failed: Must reply with pong");
> ```
>
> #### Technical Explanation
>
> 1. **Browser API Limitation**: Browser W3C WebSocket API does NOT expose raw Ping/Pong frame send/receive functions.
> 2. **Application-Level Heartbeats**: Developers implement heartbeat logic using text JSON messages in browser environments.
> 3. **Bi-directional Liveness**: Ensures both client and server confirm active data flow.
---

## 6. Related Terms
- [Reconnection & Backoff](reconnection_backoff.md) — The client-side logic triggered after a heartbeat check failure closes a socket.
- [The WebSocket API (Client-side)](websocket_api.md) — The browser interface which handles incoming pings and returns pongs.

---

## 7. Key Takeaways
- Heartbeats detect silent disconnections and prevent intermediate routers from terminating idle connections.
- The WebSocket protocol uses built-in Ping and Pong control frames to manage heartbeats.
- The server initiates pings; the browser client automatically responds with pongs.
- Unresponsive sockets are terminated to free up server system memory.
- Heartbeat intervals should remain between 20 to 60 seconds to conserve client battery.
