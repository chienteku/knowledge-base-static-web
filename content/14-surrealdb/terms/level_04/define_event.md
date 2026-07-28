# `DEFINE EVENT` (Triggers)

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to create database triggers, executing automatic SurrealQL scripts when records are created, updated, or deleted.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The parent schema context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed inside write transaction blocks. Executes events synchronously; event errors will roll back the main write transaction).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In application development, certain actions must occur automatically whenever data changes:
-   **Audit Trails:** When a user changes their email, you must log the old and new email addresses to an audit table.
-   **Cascading Actions:** When a user account is deleted, you want to automatically clean up their session tokens.
-   **Calculated Totals:** When a new line item is added to an invoice, you want to update the invoice's total sum.

In PostgreSQL, you write complex triggers linked to `PL/pgSQL` functions. 

In MongoDB, you write serverless database triggers.

We designed the **`DEFINE EVENT`** statement in SurrealQL to simplify trigger management. 

Instead of writing separate function files and trigger bindings, you write the trigger condition (`WHEN`) and the action query (`THEN`) directly inside a single schema definition command. 

Events run inside the same write transaction block, ensuring audit logs and cascading writes are completed safely.

---

### (2) Event State Variables: `$before` and `$after`
When an event triggers, SurrealDB provides two temporary system variables:
-   **`$before`:** Holds the document state **before** the write occurred. (Evaluates to `NONE` on `CREATE` actions).
-   **`$after`:** Holds the document state **after** the write occurred. (Evaluates to `NONE` on `DELETE` actions).

#### Writing Event Conditions
-   **On Create:** `WHEN $before = NONE`
-   **On Update:** `WHEN $before != NONE AND $after != NONE`
-   **On Delete:** `WHEN $after = NONE`

---

### (3) Reality Metaphor (Laser Tripwires)
Imagine monitoring changes in a secure warehouse:
-   **`DEFINE EVENT`:** Installing a **Laser Tripwire** on a storage shelf.
    -   You hook the tripwire to a control printer.
    -   **Rule:** **WHEN** a box is loaded (the space was empty before, `$before = NONE`), **THEN** print an entry log card.
    -   If a box is removed (the space is empty after, `$after = NONE`), sound a removal alert.

---

### (4) Code Examples

#### Creating Event Triggers in SurrealQL
Let's build an automatic audit logging system:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;

-- 1. Create an audit table to store log history
DEFINE TABLE audit_log SCHEMALESS;

-- 2. Define an event to log email changes
-- Triggers WHEN email changes on an update!
DEFINE EVENT log_email_change ON user
  WHEN $before.email != NONE AND $before.email != $after.email
  THEN (
    CREATE audit_log SET
      user_id = $after.id,
      old_email = $before.email,
      new_email = $after.email,
      timestamp = time::now()
  );

-- 3. Define an event to cascade delete sessions when a user is deleted
DEFINE EVENT delete_user_sessions ON user
  WHEN $after = NONE // Evaluates to true on DELETE!
  THEN (
    DELETE session WHERE user_id = $before.id
  );
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing slow or heavy queries inside event definitions, blocking database write transaction speeds

**The mistake:** Writing complex, multi-table calculations or looping operations inside the `THEN` block of an event on a high-traffic logs table.

**Why it's wrong:** In SurrealDB, events are executed **synchronously** inside the main write transaction. 

If your event query takes 200 milliseconds to complete, the main insert query will also take 200 milliseconds. 

Under high concurrency, this degrades database write throughput. 

Furthermore, if the event script crashes, the entire parent write transaction is rolled back.

**Fix: Keep event trigger scripts fast and lightweight. Only run essential integrity operations (like auditing or cleanups) in events. Offload complex calculations or external API calls to background worker queues.**

---



### Mistake 2: Creating Event Triggers Without `$after` or `$before` State Variables

**The mistake:** Writing `THEN (CREATE audit ...)` in event handlers without checking `$after` or `$before`.

**Why it's wrong:** Event handlers execute when records change. Accessing `$event` ('CREATE', 'UPDATE', 'DELETE'), `$after` (new record state), or `$before` (old record state) is essential to audit logging.

*Incorrect:*
```surrealql
-- Event logging without checking record state change
DEFINE EVENT audit ON TABLE user WHEN $event = 'CREATE' THEN (CREATE log);
```

*Fix:*
```surrealql
DEFINE EVENT audit ON TABLE user WHEN $event = 'CREATE' THEN (CREATE log CONTENT { user: $after.id, time: time::now() });
```

### Mistake 3: Creating Infinite Recursive Event Triggers

**The mistake:** Creating an event on table `user` that executes an `UPDATE user` statement inside its `THEN` block.

**Why it's wrong:** Updating table `user` inside a `user` table event handler triggers the event again recursively, causing infinite event loops and database worker stack overflow.

*Incorrect:*
```surrealql
-- Recursive infinite event loop!
DEFINE EVENT update_count ON TABLE user WHEN $event = 'UPDATE' THEN (UPDATE user SET count += 1); // 💥 Infinite loop!
```

*Fix:*
```surrealql
DEFINE EVENT audit ON TABLE user WHEN $event = 'UPDATE' THEN (CREATE user_audit CONTENT { user: $after.id });
```

## 6. Practice Exercises

### Exercise 1: Event Trigger Design

**Problem:** You have a `posts` table. 
Write the SurrealQL command to define an event named `log_new_post` that automatically creates a record in the `notifications` table whenever a new post is created. 
-   The notification should set `message = "New post: " + $after.title`.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE EVENT log_new_post ON posts
>   WHEN $before = NONE
>   THEN (
>     CREATE notifications SET message = "New post: " + $after.title
>   );
> ```
> - The trigger condition for a creation event is `WHEN $before = NONE`.
> - Access the new post's title using the `$after` variable: `$after.title`.

---



### Exercise 2: Audit Log Event Definition

**Problem:** Define event `user_created` on `user` table creating an `audit` record when `$event = "CREATE"`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE EVENT user_created ON TABLE user WHEN $event = "CREATE" THEN (CREATE audit CONTENT { user: $after.id });
> ```
> ```surrealql
> DEFINE EVENT user_created ON TABLE user WHEN $event = "CREATE" THEN (CREATE audit CONTENT { user: $after.id });
> ```
>
> **Explanation:** `DEFINE EVENT` triggers asynchronous or transactional event side-effects.

---

### Exercise 3: Accessing `$before` and `$after` in Events

**Problem:** Explain difference between `$before` (pre-update record state) and `$after` (post-update record state).

**Expected output:**
> [!check]- Answer
> ```text
> $before holds state before mutation; $after holds state after mutation
> ```
> ```text
> $before holds state before mutation; $after holds state after mutation
> ```
>
> **Explanation:** Event context variables provide pre-mutation and post-mutation record snapshots.

## 7. Related Terms
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`REMOVE` Statement](remove_statement.md) — Deleting events.

---

## 8. Key Takeaways
- `DEFINE EVENT` configures automatic database triggers.
- Relational equivalent to database triggers; NoSQL equivalent to trigger services.
- Executes synchronous code inside the main write transaction block.
- `$before` holds the pre-write record; `$after` holds the post-write record.
- Trigger actions on creation (`$before = NONE`) or deletion (`$after = NONE`).
- If an event script fails, the parent write transaction is rolled back.
- Keep event code lightweight to prevent database write latency.
