# Pub/Sub & Channels

> **Level 8 — Real-Time APIs**
> The messaging pattern behind rooms/topics in real-time apps.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time network transport.
- [Socket.io (Ecosystem tool)](socket_io.md) — The abstraction library utilizing room patterns.

---

## 2. Term Category
- **Real-Time**

---

## 3. Environment Context
- **Universal**: Governs message broker architectures (like Redis, RabbitMQ, Kafka) and real-time backend router servers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In real-time systems (such as a chat application with thousands of active chatrooms, or a multiplayer game, or a collaborative whiteboard), you cannot broadcast every message to *every connected user*. Broadcasting everything creates security issues and crashes client apps due to CPU and network overload.

Clients should only receive messages that are relevant to them. 

To filter and route messages to specific groups of users, developers implement the **Publish/Subscribe (Pub/Sub)** pattern organized around **Channels (also called Rooms or Topics)**:
- **Publishers:** Senders that publish messages to a channel without knowing which specific clients are listening.
- **Subscribers:** Receivers that register interest in a channel.
- **The Broker (Message Router):** An intermediary coordinator (like Redis or Socket.io's engine) that maintains a directory mapping channel names to active socket connections. When a message is published to a channel, the broker duplicates and forwards it only to the sockets subscribed to that channel.

```text
  [ Publisher Client ] ──( publishes: "Hello!" to "room-101" )──> [ Message Broker ]
                                                                       │
                                                   ┌───────────────────┴───────────────────┐
                                                   ▼                                       ▼
                                       [ Socket A: Subscribed ]                [ Socket B: Subscribed ]
```

---

### (2) Reality Metaphor
Imagine listening to a radio station.
- **Global Broadcast** is like a person standing on a rooftop with a megaphone, screaming news to the entire city. It is loud, insecure, and annoying to anyone who does not care about the news.
- **Pub/Sub Channels** are like **radio frequencies**:
  - The news station (**the Publisher**) broadcasts audio waves onto frequency `98.1 FM` (**the Channel**). They do not know who is listening.
  - You (**the Subscriber**) turn your radio dial to `98.1 FM` (**Subscribe**). 
  - You only hear the news broadcast, completely ignoring the pop music playing on frequency `105.3 FM`.

---

### (3) Backend Implementation Example (Socket.io Rooms)

```javascript
import { Server } from 'socket.io';
const io = new Server(3000);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 1. Client joins a specific channel (room)
  socket.on('join-room', (roomName) => {
    socket.join(roomName); // Subscribe
    console.log(`Client ${socket.id} joined channel: ${roomName}`);
  });

  // 2. Client publishes a message to a channel
  socket.on('send-chat', (payload) => {
    const { roomName, message } = payload;
    
    // Broadcast only to clients in that room (Publish)
    io.to(roomName).emit('new-message', {
      sender: socket.id,
      text: message
    });
  });
  
  socket.on('disconnect', () => {
    console.log("Client disconnected");
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing subscription lists in memory when scaling horizontally

**The mistake:** Keeping subscription room directories in the local RAM memory of a single Node.js application server.

**Why it's wrong:** If you scale your API to 3 server instances behind a load balancer:
- Client A connects to **Server 1** and joins `room-101`.
- Client B connects to **Server 2** and publishes a message to `room-101`.
- Because Server 2's memory has no record of Client A (who is on Server 1), the message is never delivered to Client A.

*Fix:* Connect all server instances to a shared **Redis Pub/Sub** message broker. When Server 2 receives a message, it publishes it to Redis, which forwards the message to all server instances, ensuring Server 1 delivers it to Client A.

---

### Mistake 2: Publishing Massive High-Volume Payloads Directly to Pub/Sub Channel Subscribers

**The mistake:** Broadcasting 50MB file payloads directly across a Redis Pub/Sub channel to 10,000 subscribers.

**Why it's wrong:** Broadcasting large payloads over Pub/Sub exhausts broker bandwidth instantly. Publish a lightweight notification payload containing a download URI pointer.

*Incorrect:*
```javascript
// Publishing massive payload to 10,000 subscribers
publisher.publish('events', JSON.stringify(fiftyMegabytePayload)); // ❌ Network pipe overload!
```

*Fix:*
```javascript
// Publish lightweight event notification with S3 download URL:
publisher.publish('events', JSON.stringify({ event: 'file_ready', url: s3Url }));
```

---

### Mistake 3: Assuming Redis Pub/Sub Provides Message Persistence and Guaranteed Delivery

**The mistake:** Using basic Redis Pub/Sub (`PUBLISH`/`SUBSCRIBE`) for mission-critical financial events.

**Why it's wrong:** Redis Pub/Sub is 'fire-and-forget'. If a subscriber is offline when a message is published, the message is permanently lost. Use persistent message queues (Kafka, RabbitMQ, Redis Streams).

*Incorrect:*
```http
/* Expecting offline subscribers to receive past Redis Pub/Sub messages upon reconnect */
```

*Fix:*
```http
/* Use Redis Streams or RabbitMQ for persistent event queueing */
```


---

### Mistake 4: Publishing Massive High-Volume Payloads Directly to Pub/Sub Channel Subscribers

**The mistake:** Broadcasting 50MB file payloads directly across a Redis Pub/Sub channel to 10,000 subscribers.

**Why it's wrong:** Broadcasting large payloads over Pub/Sub exhausts broker bandwidth instantly. Publish a lightweight notification payload containing a download URI pointer.

*Incorrect:*
```javascript
// Publishing massive payload to 10,000 subscribers
publisher.publish('events', JSON.stringify(fiftyMegabytePayload)); // ❌ Network pipe overload!
```

*Fix:*
```javascript
// Publish lightweight event notification with S3 download URL:
publisher.publish('events', JSON.stringify({ event: 'file_ready', url: s3Url }));
```

---

### Mistake 5: Assuming Redis Pub/Sub Provides Message Persistence and Guaranteed Delivery

**The mistake:** Using basic Redis Pub/Sub (`PUBLISH`/`SUBSCRIBE`) for mission-critical financial events.

**Why it's wrong:** Redis Pub/Sub is 'fire-and-forget'. If a subscriber is offline when a message is published, the message is permanently lost. Use persistent message queues (Kafka, RabbitMQ, Redis Streams).

*Incorrect:*
```http
/* Expecting offline subscribers to receive past Redis Pub/Sub messages upon reconnect */
```

*Fix:*
```http
/* Use Redis Streams or RabbitMQ for persistent event queueing */
```


---

### Mistake 6: Publishing Massive High-Volume Payloads Directly to Pub/Sub Channel Subscribers

**The mistake:** Broadcasting 50MB file payloads directly across a Redis Pub/Sub channel to 10,000 subscribers.

**Why it's wrong:** Broadcasting large payloads over Pub/Sub exhausts broker bandwidth instantly. Publish a lightweight notification payload containing a download URI pointer.

*Incorrect:*
```javascript
// Publishing massive payload to 10,000 subscribers
publisher.publish('events', JSON.stringify(fiftyMegabytePayload)); // ❌ Network pipe overload!
```

*Fix:*
```javascript
// Publish lightweight event notification with S3 download URL:
publisher.publish('events', JSON.stringify({ event: 'file_ready', url: s3Url }));
```

---

### Mistake 7: Assuming Redis Pub/Sub Provides Message Persistence and Guaranteed Delivery

**The mistake:** Using basic Redis Pub/Sub (`PUBLISH`/`SUBSCRIBE`) for mission-critical financial events.

**Why it's wrong:** Redis Pub/Sub is 'fire-and-forget'. If a subscriber is offline when a message is published, the message is permanently lost. Use persistent message queues (Kafka, RabbitMQ, Redis Streams).

*Incorrect:*
```http
/* Expecting offline subscribers to receive past Redis Pub/Sub messages upon reconnect */
```

*Fix:*
```http
/* Use Redis Streams or RabbitMQ for persistent event queueing */
```


---

## 6. Practice Exercises

### Exercise 1: Architectural Audit

**Problem:** You are building a notification system. Which design pattern represents a Pub/Sub Channel architecture?

- **A.** The client requests a user's notifications list every 10 seconds via `GET /api/notifications`.
- **B.** The client establishes a WebSocket connection. The backend adds the client socket to a channel matching their user ID (`channel:user-42`). When an event occurs, the server publishes a message to that channel.
- **C.** The client sends a `POST` request to `/api/notify` with a payload containing the target user's IP address.

> [!check]- Answer
> - **B** (This is a classic Pub/Sub Channel setup. Sockets subscribe to specific topics, and brokers route matching events to them).
> 
> 
---

### Exercise 2: Pub/Sub Architecture Decoupling

**Problem:** Explain how Publish-Subscribe (Pub/Sub) pattern decouples message senders from receivers.

**Expected output:**
> [!check]- Answer
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> - **Explanation:** Pub/Sub decouples producer and consumer identities and scaling.
---

### Exercise 3: Pattern-Matching Subscriptions

**Problem:** In Redis Pub/Sub, which command allows subscribing to channels matching a glob pattern (e.g. `orders.*`)?

**Expected output:**
> [!check]- Answer
> ```text
> PSUBSCRIBE orders.*
> ```
> ```text
> PSUBSCRIBE orders.*
> ```
> - **Explanation:** `PSUBSCRIBE` enables wildcards for pattern-matched channel subscriptions.
---

### Exercise 4: Pub/Sub Architecture Decoupling

**Problem:** Explain how Publish-Subscribe (Pub/Sub) pattern decouples message senders from receivers.

**Expected output:**
> [!check]- Answer
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> - **Explanation:** Pub/Sub decouples producer and consumer identities and scaling.
---

### Exercise 5: Pattern-Matching Subscriptions

**Problem:** In Redis Pub/Sub, which command allows subscribing to channels matching a glob pattern (e.g. `orders.*`)?

**Expected output:**
> [!check]- Answer
> ```text
> PSUBSCRIBE orders.*
> ```
> ```text
> PSUBSCRIBE orders.*
> ```
> - **Explanation:** `PSUBSCRIBE` enables wildcards for pattern-matched channel subscriptions.
---

### Exercise 6: Pub/Sub Architecture Decoupling

**Problem:** Explain how Publish-Subscribe (Pub/Sub) pattern decouples message senders from receivers.

**Expected output:**
> [!check]- Answer
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> ```text
> Publishers broadcast messages to named channels without knowing who or how many subscribers exist. Subscribers listen to channels without knowing publisher identity.
> ```
> - **Explanation:** Pub/Sub decouples producer and consumer identities and scaling.
---

### Exercise 7: Pattern-Matching Subscriptions

**Problem:** In Redis Pub/Sub, which command allows subscribing to channels matching a glob pattern (e.g. `orders.*`)?

**Expected output:**
> [!check]- Answer
> ```text
> PSUBSCRIBE orders.*
> ```
> ```text
> PSUBSCRIBE orders.*
> ```
> - **Explanation:** `PSUBSCRIBE` enables wildcards for pattern-matched channel subscriptions.
---

## 7. Related Terms
- [Socket.io (Ecosystem tool)](socket_io.md) — The Node.js real-time framework.
- [Webhooks](../level_06/webhooks.md) — The HTTP callback request alternative for server-to-server notifications.

---

## 8. Key Takeaways
- The Pub/Sub pattern separates message senders (Publishers) from receivers (Subscribers).
- Sockets join distinct Channels (rooms or topics) to receive relevant messages.
- Message Brokers duplicate and forward incoming data only to whitelisted channel subscribers.
- Pub/Sub prevents client CPU overload and bandwidth waste by avoiding global broadcasts.
- Horizontally scaled server instances must be linked via a shared broker (like Redis) to synchronize channel lists.
