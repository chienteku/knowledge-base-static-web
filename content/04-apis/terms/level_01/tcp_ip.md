# TCP/IP (high-level)

> **Level 1 — Foundations of the Web**
> The reliable delivery layer HTTP rides on ("guaranteed, in-order packets").

---

## 1. Prerequisites
- [IP Address & Port](ip_address_port.md) — The routing coordinates that identify network devices.
---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal**: The foundational communication standard of the global internet.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Connection Chooser

**Problem:** Determine whether the scenario requires **TCP** or **UDP**:

1. A multiplayer game client sending coordinate movement updates (60 times per second).
2. Downloading a banking transaction history PDF file.
3. Fetching a user profile JSON configuration from an API endpoint.
4. Broadcasting a live video stream of a sports match where latency is critical.

> [!check]- Answer
> - If losing a single packet corrupts the file or breaks the program, you must use TCP.
> - If speed is critical and dropping a few frames/pixels is acceptable, use UDP.

> [!check]- Answer
> - 1. **UDP** (If a movement packet is dropped, the next packet immediately overrides it. Waiting for retries causes game lag).
> - 2. **TCP** (A single missing byte corrupts the PDF file).
> - 3. **TCP** (API payloads must be fully intact to parse JSON successfully).
> - 4. **UDP** (If a packet drops, a brief pixel glitch is preferred over pausing the live video stream to wait for retries).


---

### Exercise 2: TCP 3-Way Handshake Step Ordering

**Problem:** Order the 3 packet flags exchanged during establishing a TCP connection:
ACK, SYN, SYN-ACK

**Expected output:**
> [!check]- Answer
> ```text
> 1. Client -> Server: SYN
> 2. Server -> Client: SYN-ACK
> 3. Client -> Server: ACK
> ```
> ```text
> 1. Client sends SYN (Synchronize)
> 2. Server responds SYN-ACK (Synchronize-Acknowledge)
> 3. Client sends ACK (Acknowledge)
> ```
> - **Explanation:** The TCP 3-way handshake establishes sequence numbers before payload transmission.
---

### Exercise 3: TCP vs UDP Comparison Matrix

**Problem:** Match the protocol characteristic to TCP or UDP:
1. Connectionless and low overhead
2. Guaranteed in-order packet delivery
3. Built-in flow control and congestion management

**Expected output:**
> [!check]- Answer
> ```text
> 1. UDP
> 2. TCP
> 3. TCP
> ```
> ```text
> 1. UDP -> Connectionless, fast, no delivery guarantee
> 2. TCP -> Guaranteed ordered delivery with retransmission
> 3. TCP -> Flow control and windowing management
> ```
> - **Explanation:** TCP guarantees reliable stream delivery at the cost of handshake overhead.
---

## 7. Related Terms
- [HTTP / HTTPS](http_https.md) — The application protocols that utilize TCP connections to load web pages.
- [WebSockets](../level_08/websockets.md) — The real-time connection protocol that rides directly on top of persistent TCP connections.
- [WebSocket Handshake (Upgrade)](../level_08/websocket_handshake.md) — Related concept: WebSocket Handshake (Upgrade).
---

## 8. Key Takeaways
- IP is responsible for routing packet chunks between physical device addresses.
- TCP runs on top of IP to guarantee that all packets arrive fully intact and in the correct order.
- TCP connection requires a Three-Way Handshake (SYN → SYN-ACK → ACK) before sending data.
- TCP guarantees reliability by tracking packet sequence numbers and requesting re-transmissions for lost packets.
- Use TCP for reliable data transport (HTTP, APIs); use UDP for low-latency speed (video streaming, gaming).
