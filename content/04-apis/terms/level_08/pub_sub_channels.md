# Pub/Sub & Channels

> **Level 8 — Real-Time APIs**
> The messaging pattern behind rooms/topics in real-time apps.

---

## 1. Prerequisites
- [WebSockets](websockets.md) — The real-time network transport.
- [Socket.io (Ecosystem tool)](socket_io.md) — The abstraction library utilizing room patterns.

---

## 2. Term Category

**Real-Time (Universal: Governs message broker architectures  and real-time backend router servers.)**: Pub/Sub & Channels is a fundamental concept in this technology stack. **Level 8 — Real-Time APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: In-Memory Multi-Channel Pub/Sub Event Broker

**Scenario:** A real-time message broker enables clients to subscribe to specific channels (e.g. `news`, `chat:room1`) and publish targeted events.

**Requirements:**
1. Write createPubSubBroker().
2. Implement subscribe(channel, callback).
3. Implement publish(channel, message).
4. Support unsubscribe.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPubSubBroker() {
>   const channels = new Map();
>
>   return {
>     subscribe(channel, callback) {
>       if (!channels.has(channel)) {
>         channels.set(channel, new Set());
>       }
>       const subscribers = channels.get(channel);
>       subscribers.add(callback);
>
>       return function unsubscribe() {
>         subscribers.delete(callback);
>         if (subscribers.size === 0) {
>           channels.delete(channel);
>         }
>       };
>     },
>     publish(channel, message) {
>       if (!channels.has(channel)) return 0;
>       const subscribers = channels.get(channel);
>       subscribers.forEach(cb => cb(message));
>       return subscribers.size;
>     }
>   };
> }
>
> // Verification tests
> const broker = createPubSubBroker();
> const received = [];
>
> const unsub = broker.subscribe("orders", (msg) => received.push(msg));
> broker.publish("orders", { orderId: 42 });
>
> console.assert(received.length === 1 && received[0].orderId === 42, "Test 1 Failed");
>
> unsub();
> broker.publish("orders", { orderId: 43 });
> console.assert(received.length === 1, "Test 2 Failed: No events received after unsubscribe");
> ```
>
> #### Technical Explanation
>
> 1. **Publish-Subscribe Pattern**: Decouples message senders (publishers) from message receivers (subscribers).
> 2. **Channel Isolation**: Subscribers only receive messages published to channels they explicitly subscribed to.
> 3. **Dynamic Listener Cleanup**: Unsubscribe functions prevent memory leaks by removing callbacks when components unmount.
> 
---

### Exercise 2: Wildcard Topic Pattern Pub/Sub Router

**Scenario:** An API event broker allows subscribing to wildcard topic patterns (e.g. `orders.*` matches `orders.created` and `orders.cancelled`).

**Requirements:**
1. Write subscribePattern(pattern, callback, broker).
2. Match wildcard pattern using regex.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createWildcardBroker() {
>   const subscriptions = [];
>
>   return {
>     subscribe(pattern, callback) {
>       const regexStr = "^" + pattern.replace(/\./g, "\.").replace(/\*/g, "[^.]+") + "$";
>       const regex = new RegExp(regexStr);
>
>       const sub = { pattern, regex, callback };
>       subscriptions.push(sub);
>
>       return () => {
>         const idx = subscriptions.indexOf(sub);
>         if (idx !== -1) subscriptions.splice(idx, 1);
>       };
>     },
>     publish(topic, message) {
>       let matchCount = 0;
>       for (const sub of subscriptions) {
>         if (sub.regex.test(topic)) {
>           sub.callback(topic, message);
>           matchCount++;
>         }
>       }
>       return matchCount;
>     }
>   };
> }
>
> // Verification tests
> const wBroker = createWildcardBroker();
> const events = [];
>
> wBroker.subscribe("orders.*", (topic, msg) => events.push(topic));
> wBroker.publish("orders.created", { id: 1 });
> wBroker.publish("orders.updated", { id: 1 });
> wBroker.publish("users.created", { id: 2 });
>
> console.assert(events.length === 2, "Test 1 Failed: Must match 2 orders topic events");
> console.assert(!events.includes("users.created"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Wildcard Topic Subscriptions**: Allows clients to listen to families of events using wildcard operators (*, #).
> 2. **Topic-Based Routing**: Commonly used in MQTT, AMQP, and RabbitMQ message brokers.
> 3. **Event Decoupling**: Enables adding new event types without modifying subscriber pattern queries.
> 
---

### Exercise 3: Room Join & Broadcast WebSocket Handler

**Scenario:** A WebSocket real-time chat server manages client room subscriptions (`socket.join('room42')`) and broadcasts messages to room members.

**Requirements:**
1. Write createRoomManager().
2. Implement joinRoom(socketId, roomName).
3. Broadcast message to room.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createRoomManager() {
>   const rooms = new Map();
>
>   return {
>     joinRoom(socketId, roomName) {
>       if (!rooms.has(roomName)) {
>         rooms.set(roomName, new Set());
>       }
>       rooms.get(roomName).add(socketId);
>     },
>     leaveRoom(socketId, roomName) {
>       if (rooms.has(roomName)) {
>         rooms.get(roomName).delete(socketId);
>       }
>     },
>     broadcastToRoom(roomName, message, senderSocketId) {
>       if (!rooms.has(roomName)) return [];
>       const recipients = [];
>       for (const sId of rooms.get(roomName)) {
>         if (sId !== senderSocketId) {
>           recipients.push(sId);
>         }
>       }
>       return recipients;
>     }
>   };
> }
>
> // Verification tests
> const rm = createRoomManager();
> rm.joinRoom("user1", "lobby");
> rm.joinRoom("user2", "lobby");
>
> const recipients = rm.broadcastToRoom("lobby", "hello", "user1");
> console.assert(recipients.length === 1 && recipients[0] === "user2", "Test 1 Failed: Broadcast excludes sender");
> ```
>
> #### Technical Explanation
>
> 1. **Room Abstraction**: Groups sockets logically into channels without exposing underlying network IDs.
> 2. **Sender Exclusion**: Broadcasting to a room typically excludes the socket that sent the message.
> 3. **Multi-Room Membership**: Sockets can belong to multiple rooms simultaneously (e.g. global announcement + team chat).
---

## 6. Related Terms
- [Socket.io (Ecosystem tool)](socket_io.md) — The Node.js real-time framework.
- [Webhooks](../level_06/webhooks.md) — The HTTP callback request alternative for server-to-server notifications.

---

## 7. Key Takeaways
- The Pub/Sub pattern separates message senders (Publishers) from receivers (Subscribers).
- Sockets join distinct Channels (rooms or topics) to receive relevant messages.
- Message Brokers duplicate and forward incoming data only to whitelisted channel subscribers.
- Pub/Sub prevents client CPU overload and bandwidth waste by avoiding global broadcasts.
- Horizontally scaled server instances must be linked via a shared broker (like Redis) to synchronize channel lists.
