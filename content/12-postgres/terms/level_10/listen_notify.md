# `LISTEN` / `NOTIFY`

> **Level 10 — Administration, Security & Production**
> PostgreSQL's built-in asynchronous Pub/Sub messaging system that allows database connections to listen to channels and receive push notifications from other sessions or table triggers.

---

## 1. Prerequisites
- [Trigger](../level_09/trigger.md) — Automating notify events on table writes.

---

## 2. Term Category
- **PostgreSQL Database Feature**

---

## 3. Environment Context
- **PostgreSQL Core** (Managed in the server's shared memory. Works asynchronously over active TCP connections).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web development, applications need to respond to events in real-time:
-   A user makes a payment, and you want to instantly trigger an email script.
-   A new message is inserted in a chat database, and you want to push it to the user's browser via WebSockets immediately.

To accomplish this:
-   **The Polling Bottleneck:** Your backend server loops and queries the database every `1` second: `SELECT * FROM chat_messages WHERE id > last_seen_id;`. This is called Polling. It wastes massive database CPU, floods network sockets, and generates high disk read latencies even if no messages are sent.

We designed **`LISTEN`** and **`NOTIFY`** to solve this. 

It is a built-in Pub/Sub (Publish/Subscribe) messaging system. 

Instead of polling, your backend server registers to listen to a specific channel. 

When a database event occurs, the database **pushes** a message to the listening server over the open TCP socket. 

This happens in microseconds, consumes virtually zero database resources, and eliminates polling database query loops.

---

### (2) Trigger Integration (The Power Duo)
The most common way to use this feature is to bind a `NOTIFY` statement inside a database **Trigger**. 

Whenever a table write occurs, the trigger executes a function that broadcasts the new row's ID:

`NOTIFY order_channel, 'order_123_created';`

---

### (3) Ephemeral Warning (No History)
`LISTEN/NOTIFY` is **ephemeral**. 

If your backend server loses connection or goes offline for a minute, any `NOTIFY` messages sent during that minute are **lost forever**. 

There is no message store or replay history. 

If you require guaranteed delivery, you must pair it with a database table queue or use an external broker (like RabbitMQ or Redis).

---

### (4) Reality Metaphor (Walkie-Talkies)
-   **Polling:** Calling the office every 2 minutes: *"Has the delivery truck arrived yet? No. Has it arrived yet? No."* (Wastes phone lines and time).
-   **LISTEN/NOTIFY:** Tuning your **Walkie-Talkie** to Channel 5 (`LISTEN`). The warehouse clerk stands by. When the delivery truck arrives, the clerk key-clicks the walkie-talkie and shouts: *"Truck 12 has arrived!"* (`NOTIFY`). You receive the alert instantly. If your walkie-talkie was turned off during the shout, you miss it.

---

### (5) Code Examples

#### Trigger-Driven Notification System
Let's notify our Node.js app automatically whenever a new task is inserted:

```sql
CREATE TABLE tasks (id INT PRIMARY KEY, description TEXT);

-- 1. Create a trigger function that sends notifications
CREATE FUNCTION notify_new_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the channel 'task_channel' with the new task ID
  NOTIFY task_channel, NEW.id::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind the trigger to the table
CREATE TRIGGER trg_tasks_notify
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_new_task();
```

#### Listening for Events in SQL
In separate database connections:

```sql
-- Session A: Start listening
LISTEN task_channel;

-- Session B (runs in different terminal): Insert task
INSERT INTO tasks VALUES (105, 'Setup Firewall');

-- Session A Console automatically receives:
-- Asynchronous notification "task_channel" with payload "105" received from server process with PID 4512.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on LISTEN/NOTIFY for persistent, mission-critical job queuing

**The mistake:** Building a payment processing queue using `LISTEN/NOTIFY`, assuming that if a payment is notified, it will definitely be processed.

**Why it's wrong:** If your web application server crashes or restarts to deploy new code, its connections drop. 

During the 30 seconds the server is offline, several users complete purchases. 

Because `LISTEN/NOTIFY` does not save message histories, those payment notifications are lost, and the orders are never processed.

**Fix: Use `LISTEN/NOTIFY` only as a fast, real-time alert trigger. The actual data should be stored inside a database table queue (`status = 'pending'`). When the app receives the notify alert, it queries the queue. If the app goes offline, it simply queries the queue upon reboot to catch up.**

---



### Mistake 2: Expecting `NOTIFY` Messages to Be Delivered If the Transaction Rolls Back

**The mistake:** Issuing `NOTIFY channel, 'payload';` inside a transaction that is subsequently rolled back.

**Why it's wrong:** PostgreSQL queues `NOTIFY` messages and sends them ONLY AFTER the transaction successfully commits! If the transaction rolls back, all queued `NOTIFY` messages are discarded.

*Incorrect:*
```sql
BEGIN;
NOTIFY event_channel, 'data';
ROLLBACK; -- ❌ NOTIFY message is discarded!
```

*Fix:*
```sql
NOTIFY messages fire ONLY upon successful COMMIT
```

### Mistake 3: Exceeding the 8000 Byte Payload Size Limit in `NOTIFY` Messages

**The mistake:** Sending a 10MB JSON document in `NOTIFY channel, 'large_json...'`.

**Why it's wrong:** PostgreSQL limits `NOTIFY` string payload size to 8000 bytes! Exceeding 8000 bytes throws error `payload string too long`. Send entity IDs in `NOTIFY` payload instead.

*Incorrect:*
```sql
NOTIFY channel, '10MB JSON payload...'; -- ❌ Error: payload string too long!
```

*Fix:*
```sql
NOTIFY channel, '{"entity_id": 123}'; -- Send small ID payload
```

## 6. Practice Exercises

### Exercise 1: Real-Time Alert System

**Problem:** Write the SQL statements to:
1.  Subscribe the current session to a channel named `security_alerts`.
2.  Write the query to publish the message `'Unusual login detected'` to that channel.

**Expected output:**
> [!check]- Answer
> ```sql
> LISTEN security_alerts;
> 
> NOTIFY security_alerts, 'Unusual login detected';
> ```
> - The listen statement does not require a payload parameter.
> - The notify statement accepts the channel name followed by a comma and the text payload string.

---



### Exercise 2: Trigger Firing LISTEN / NOTIFY

**Problem:** Create trigger function issuing `NOTIFY order_events, payload` with inserted order ID as JSON payload.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE FUNCTION notify_order() RETURNS TRIGGER AS $$ BEGIN PERFORM pg_notify('order_events', json_build_object('id', NEW.id)::text); RETURN NEW; END; $$ LANGUAGE plpgsql;
> ```
> ```sql
> CREATE FUNCTION notify_order() RETURNS TRIGGER AS $$
> BEGIN
>   PERFORM pg_notify('order_events', json_build_object('id', NEW.id)::text);
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** `pg_notify(channel, payload)` sends asynchronous real-time notifications to listening client connections.

---

### Exercise 3: Listening to Channel in psql

**Problem:** Command in `psql` to subscribe to notification channel `order_events` (`LISTEN order_events;`).

**Expected output:**
> [!check]- Answer
> ```text
> LISTEN order_events;
> ```
> ```sql
> LISTEN order_events;
> ```
>
> **Explanation:** `LISTEN channel_name` registers TCP connection sockets to receive asynchronous events.

## 7. Related Terms
- [Trigger](../level_09/trigger.md) — Automating notifications.

---

## 8. Key Takeaways
- `LISTEN` and `NOTIFY` provide asynchronous Pub/Sub messaging in PostgreSQL.
- Eliminates resource-heavy polling query loops from application backends.
- Commonly executed inside database triggers to alert apps on table updates.
- Messages are ephemeral; if a listener is offline, the notification is lost.
- All active database connections listening to the channel receive the payload.
- Pair with persistent table queues to guarantee delivery during app crashes.
