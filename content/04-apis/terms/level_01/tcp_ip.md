# TCP/IP (high-level)

> **Level 1 — Foundations of the Web**
> The reliable delivery layer HTTP rides on ("guaranteed, in-order packets").

---

## 1. Prerequisites
- [IP Address & Port](ip_address_port.md) — The routing coordinates that identify network devices.

---

## 2. Term Category

**Networking Protocol (Universal: The foundational communication standard of the global internet.)**: TCP/IP (high-level) is a fundamental concept in this technology stack. **Level 1 — Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Data traveling across the internet is broken down into tiny digital chunks called **packets**. These packets travel through multiple physical routers and cables. Because of network congestion or hardware issues, some packets can get lost, arrive out of order, or get corrupted. 

If you are downloading an image or loading a text API payload, even a single missing byte will corrupt the entire file. How do we guarantee that every packet arrives perfectly intact, in the correct order, without missing any pieces?

This reliability is achieved by pairing two distinct protocols: **TCP** and **IP**.

#### IP (Internet Protocol) — The Router
The routing protocol responsible for moving individual packets from a source IP address to a destination IP address.
- **Limit:** IP is **unreliable** and connectionless. It acts as a "best-effort" courier; it does not check if the package was dropped, does not track ordering, and does not re-send lost data.

#### TCP (Transmission Control Protocol) — The Inspector
The connection-oriented protocol that rides on top of IP to guarantee reliable delivery.
- **Guaranteed Delivery:** If a packet goes missing, TCP automatically detects the gap and requests the sender to re-transmit it.
- **Ordered Assembly:** Packets are marked with sequence numbers. If Page 5 arrives before Page 4, TCP buffers the data and reorders them correctly before delivering the payload to your application.
- **The Three-Way Handshake:** Before any data (like an HTTP request) can be sent, TCP establishes a verified connection between client and server using a handshake sequence:

```text
Client                                           Server
  │                                                │
  │ ─── 1. SYN (Let's synchronize sequence numbers) ──>
  │                                                │
  │ <── 2. SYN-ACK (I acknowledge. Sync with me too) ──
  │                                                │
  │ ─── 3. ACK (Acknowledged. Connection open!) ───>
  ▼                                                ▼
```

### (2) Reality Metaphor
Suppose you want to mail a 100-page book to a friend, but the post office only allows sending single-page envelopes.
- **IP** is like the **postal network**. You place each page in a separate envelope, write the street address (IP), and drop them in the mail box. Envelopes travel along different highways; some arrive on Monday, some on Tuesday, and one gets chewed up by a sorting machine. The post office does not care if the book is incomplete.
- **TCP** is like a **shipping assistant** who writes `"Page 1 of 100"`, `"Page 2 of 100"` on each envelope. When your friend receives the envelopes, they check the numbers and stack them in order. If they notice envelope `43` is missing, they message you: `"Send page 43 again."` Your friend only reads the book once all 100 pages are present and sorted.

### (3) Technical Protocol Comparison: TCP vs. UDP
While HTTP, HTTPS, and WebSockets run on top of TCP because they require 100% data accuracy, other applications use a sibling protocol called **UDP (User Datagram Protocol)**:

| Protocol | Connection | Reliability | Speed | Best Use Cases |
|---|---|---|---|---|
| **TCP** | Connection-Oriented (Handshake) | **Guaranteed & Ordered** (Automatic Retries) | Slower (due to checks/retries) | HTTP web traffic, API requests, files, emails. |
| **UDP** | Connectionless | **Unreliable** (Packets can be lost/out-of-order) | Fast (no checks or handshakes) | Live video streaming, gaming, DNS queries, voice calls. |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming TCP/IP handles application logic

**The mistake:** Expecting the TCP layer to know if an API request failed or returned a `404 Not Found`.

**Why it's wrong:** TCP is a transport layer. It only cares about delivering raw bytes safely. It does not understand what those bytes mean. The application logic (HTTP status codes, headers, JSON data) resides entirely at the higher **Application Layer (HTTP)**, which runs on top of TCP.

---

### Mistake 2: Confusing Connection-Oriented TCP with Connectionless UDP for APIs

**The mistake:** Attempting to build a reliable REST API server over raw UDP sockets without application-level retry logic.

**Why it's wrong:** UDP does NOT guarantee packet delivery, ordering, or duplicate protection. REST APIs rely on TCP (or QUIC/HTTP3) for guaranteed in-order packet delivery.

*Incorrect:*
```http
/* Building REST HTTP endpoints over raw unreliable UDP protocol */
```

*Fix:*
```http
/* Use TCP-backed transport (HTTP/1.1, HTTP/2) or QUIC (HTTP/3) with built-in congestion control */
```

---

### Mistake 3: Experiencing TCP Head-of-Line (HoL) Blocking in Single Connection Streams

**The mistake:** Sending independent high-priority API calls behind a slow dropped TCP packet on a single HTTP/2 connection.

**Why it's wrong:** If a single packet in a TCP stream is dropped, TCP halts processing for ALL subsequent multiplexed streams until the missing packet is retransmitted. Use HTTP/3 (QUIC over UDP) to bypass TCP HoL blocking.

*Incorrect:*
```http
/* Single dropped packet in HTTP/2 TCP stream blocks all concurrent API requests */
```

*Fix:*
```http
/* Upgrade protocol stack to HTTP/3 (QUIC) for stream-independent packet processing */
```


---

## 5. Practice Exercises

### Exercise 1: TCP Three-Way Handshake State Machine Simulator

**Scenario:** A network protocol parser simulates the TCP 3-Way Handshake sequence (SYN -> SYN-ACK -> ACK) that establishes connection sockets.

**Requirements:**
1. Write simulateTcpConnection().
2. State 1: CLOSED -> Send SYN.
3. State 2: Listen for SYN-ACK.
4. State 3: Send ACK -> ESTABLISHED.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function simulateTcpConnection() {
>   const log = [];
>   let state = "CLOSED";
>
>   // Step 1: Client sends SYN
>   state = "SYN_SENT";
>   log.push("Client -> SYN");
>
>   // Step 2: Server responds SYN-ACK
>   state = "SYN_RECEIVED";
>   log.push("Server -> SYN-ACK");
>
>   // Step 3: Client sends ACK
>   state = "ESTABLISHED";
>   log.push("Client -> ACK");
>
>   return {
>     connected: state === "ESTABLISHED",
>     history: log
>   };
> }
>
> // Verification tests
> const conn = simulateTcpConnection();
> console.assert(conn.connected === true, "Test 1 Failed");
> console.assert(conn.history[0] === "Client -> SYN", "Test 2 Failed");
> console.assert(conn.history[2] === "Client -> ACK", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **TCP 3-Way Handshake**: SYN (Synchronize), SYN-ACK (Synchronize-Acknowledge), ACK (Acknowledge) establish reliable TCP connection sockets.
> 2. **Connection-Oriented Protocol**: TCP requires establishing connection before transmitting data, unlike UDP (connectionless).
> 3. **Sequence Number Synchronization**: Exchanges initial sequence numbers (ISN) between client and server for ordered packet delivery.
> 
---

### Exercise 2: TCP Segment Reordering & Missing Segment Detector

**Scenario:** A packet receiver buffers incoming out-of-order TCP segments and reassembles them in sequence order using sequence numbers.

**Requirements:**
1. Write reassembleTcpSegments(segments).
2. Sort segments by seqNum.
3. Check for missing sequence gaps.
4. Return reassembled data string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function reassembleTcpSegments(segments) {
>   if (!Array.isArray(segments)) return null;
>
>   const sorted = [...segments].sort((a, b) => a.seqNum - b.seqNum);
>   let expectedSeq = sorted[0]?.seqNum || 0;
>   let payload = "";
>
>   for (const seg of sorted) {
>     if (seg.seqNum !== expectedSeq) {
>       return { error: `Missing segment at sequence ${expectedSeq}`, data: null };
>     }
>     payload += seg.data;
>     expectedSeq += seg.data.length;
>   }
>
>   return { error: null, data: payload };
> }
>
> // Verification tests
> const outOfOrder = [
>   { seqNum: 5, data: "World" },
>   { seqNum: 0, data: "Hello " }
> ];
>
> const res = reassembleTcpSegments(outOfOrder);
> console.assert(res.data === "Hello World", "Test 1 Failed: Out of order segments must be reassembled");
> ```
>
> #### Technical Explanation
>
> 1. **Guaranteed Ordered Delivery**: TCP guarantees packets are delivered to application layer in exact sequence order.
> 2. **Packet Reassembly**: Uses sequence numbers to reorder packets received out of order across packet-switched IP networks.
> 3. **Automatic Retransmission (ARQ)**: If a sequence number gap is detected, TCP requests retransmission of missing segments.
> 
---

### Exercise 3: IP Packet Routing & Header Inspector

**Scenario:** A network packet analyzer inspects IP header fields (Source IP, Destination IP, TTL) to determine routing status.

**Requirements:**
1. Write inspectIpPacket(packet).
2. Decrement TTL by 1.
3. If TTL <= 0 return "TIME_EXCEEDED"; else return "ROUTED".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectIpPacket(packet) {
>   if (!packet || !packet.srcIp || !packet.destIp || typeof packet.ttl !== "number") {
>     return { status: "DROP_INVALID" };
>   }
>
>   const nextTtl = packet.ttl - 1;
>   if (nextTtl <= 0) {
>     return { status: "TIME_EXCEEDED", ttl: 0 };
>   }
>
>   return {
>     status: "ROUTED",
>     srcIp: packet.srcIp,
>     destIp: packet.destIp,
>     ttl: nextTtl
>   };
> }
>
> // Verification tests
> const p1 = inspectIpPacket({ srcIp: "1.1.1.1", destIp: "8.8.8.8", ttl: 64 });
> console.assert(p1.status === "ROUTED" && p1.ttl === 63, "Test 1 Failed");
>
> const p2 = inspectIpPacket({ srcIp: "1.1.1.1", destIp: "8.8.8.8", ttl: 1 });
> console.assert(p2.status === "TIME_EXCEEDED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **IP Protocol Layer**: IP (Internet Protocol) routes packets across networks using IP addresses.
> 2. **Time-To-Live (TTL) Field**: Every router decrements packet TTL by 1; when TTL reach 0, packet is dropped to prevent infinite routing loops.
> 3. **TCP vs IP Hierarchy**: IP handles packet routing across nodes; TCP sits on top of IP ensuring reliable stream delivery.
---

## 6. Related Terms
- [HTTP / HTTPS](http_https.md) — The application protocols that utilize TCP connections to load web pages.
- [WebSockets](../level_08/websockets.md) — The real-time connection protocol that rides directly on top of persistent TCP connections.
- [WebSocket Handshake (Upgrade)](../level_08/websocket_handshake.md) — Related concept: WebSocket Handshake (Upgrade).

---

## 7. Key Takeaways
- IP is responsible for routing packet chunks between physical device addresses.
- TCP runs on top of IP to guarantee that all packets arrive fully intact and in the correct order.
- TCP connection requires a Three-Way Handshake (SYN → SYN-ACK → ACK) before sending data.
- TCP guarantees reliability by tracking packet sequence numbers and requesting re-transmissions for lost packets.
- Use TCP for reliable data transport (HTTP, APIs); use UDP for low-latency speed (video streaming, gaming).
