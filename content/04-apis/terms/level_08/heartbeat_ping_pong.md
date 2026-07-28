# Heartbeat / Ping-Pong

> **Level 8 — Real-Time APIs**
> Keep-alive frames that detect a dead connection.

---

## 1. Prerequisites
- [WebSockets](./websockets.md) — The real-time protocol.

---

## 2. Term Category
- **Real-Time**

---

## 3. Environment Context
- **Universal**: Implemented inside WebSocket client libraries and backend server runtimes.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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


---

### Mistake 4: Omitting Heartbeat Frame Processing on Long-Lived WebSocket Connections

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

### Mistake 5: Treating Un-Responded Pings as Active Connections (Ghost Connection Memory Leak)

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


---

### Mistake 6: Omitting Heartbeat Frame Processing on Long-Lived WebSocket Connections

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

### Mistake 7: Treating Un-Responded Pings as Active Connections (Ghost Connection Memory Leak)

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


---

## 6. Practice Exercises

### Exercise 1: Heartbeat Diagnostic

**Problem:** A client application is using a WebSocket connection on a mobile phone. The server sends pings every **30 seconds** with a **5-second** response timeout. The phone enters a subway tunnel at `12:00:00`, losing connection. The last successful ping exchange completed at `12:00:15`. 
At what time will the server detect the drop and terminate the socket resource?

> [!check]- Answer
> - **`12:00:50`** (The next ping is scheduled for 12:00:45. Since the phone is disconnected, it will not reply. The server waits for the 5-second timeout, detects the missing pong at 12:00:50, and terminates the socket).


---

### Exercise 2: Ping-Pong Protocol Frame Types

**Problem:** Identify the 2 control frame opcodes used for heartbeats in WebSocket protocol (RFC 6455).

**Expected output:**
> [!check]- Answer
> ```text
> 1. 0x9 (Ping frame)
> 2. 0xA (Pong frame)
> ```
> ```text
> 0x9 -> Ping frame
> 0xA -> Pong frame
> ```
> - **Explanation:** WebSocket RFC 6455 defines specific control frame opcodes for heartbeats.
---

### Exercise 3: Automatic Pong Response Behavior

**Problem:** How should a WebSocket receiver respond upon receiving a Ping control frame?

**Expected output:**
> [!check]- Answer
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> - **Explanation:** RFC 6455 mandates automatic echo of Ping payloads in Pong frames.
---

### Exercise 4: Ping-Pong Protocol Frame Types

**Problem:** Identify the 2 control frame opcodes used for heartbeats in WebSocket protocol (RFC 6455).

**Expected output:**
> [!check]- Answer
> ```text
> 1. 0x9 (Ping frame)
> 2. 0xA (Pong frame)
> ```
> ```text
> 0x9 -> Ping frame
> 0xA -> Pong frame
> ```
> - **Explanation:** WebSocket RFC 6455 defines specific control frame opcodes for heartbeats.
---

### Exercise 5: Automatic Pong Response Behavior

**Problem:** How should a WebSocket receiver respond upon receiving a Ping control frame?

**Expected output:**
> [!check]- Answer
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> - **Explanation:** RFC 6455 mandates automatic echo of Ping payloads in Pong frames.
---

### Exercise 6: Ping-Pong Protocol Frame Types

**Problem:** Identify the 2 control frame opcodes used for heartbeats in WebSocket protocol (RFC 6455).

**Expected output:**
> [!check]- Answer
> ```text
> 1. 0x9 (Ping frame)
> 2. 0xA (Pong frame)
> ```
> ```text
> 0x9 -> Ping frame
> 0xA -> Pong frame
> ```
> - **Explanation:** WebSocket RFC 6455 defines specific control frame opcodes for heartbeats.
---

### Exercise 7: Automatic Pong Response Behavior

**Problem:** How should a WebSocket receiver respond upon receiving a Ping control frame?

**Expected output:**
> [!check]- Answer
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> ```text
> It MUST send a Pong control frame back as soon as possible with the exact same payload bytes received in the Ping frame.
> ```
> - **Explanation:** RFC 6455 mandates automatic echo of Ping payloads in Pong frames.
---

## 7. Related Terms
- [Reconnection & Backoff](./reconnection_backoff.md) — The client-side logic triggered after a heartbeat check failure closes a socket.
- [The WebSocket API (Client-side)](./websocket_api.md) — The browser interface which handles incoming pings and returns pongs.

---

## 8. Key Takeaways
- Heartbeats detect silent disconnections and prevent intermediate routers from terminating idle connections.
- The WebSocket protocol uses built-in Ping and Pong control frames to manage heartbeats.
- The server initiates pings; the browser client automatically responds with pongs.
- Unresponsive sockets are terminated to free up server system memory.
- Heartbeat intervals should remain between 20 to 60 seconds to conserve client battery.
