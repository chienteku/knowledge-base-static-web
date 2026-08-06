# `DEFINE EVENT` (Triggers)

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to create database triggers, executing automatic SurrealQL scripts when records are created, updated, or deleted.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The parent schema context.

---

## 2. Term Category


**Advanced Feature (table event trigger definition)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Audit Log Trigger Event Creation

**Scenario:**
A financial application records an audit log entry in table `audit_log` whenever an account balance is updated.

**Requirements:**
1. Define event `balance_change` on table `account`.
2. Trigger the event when `$event = "UPDATE" AND $before.balance != $after.balance`.
3. Create an audit record containing `$before` and `$after` states.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT balance_change ON TABLE account WHEN $event = "UPDATE" AND $before.balance != $after.balance THEN (
>     CREATE audit_log SET 
>         account = $after.id,
>         old_balance = $before.balance,
>         new_balance = $after.balance,
>         updated_at = time::now()
> );
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE EVENT` creates an automated trigger that runs when table records are created, updated, or deleted.
> 2. `$before` holds the record state before mutation; `$after` holds the state after mutation.
> 3. The `THEN` block executes SurrealQL statements atomically within the same transaction.
> 
---

### Exercise 2: Cascading Deletion Trigger Events

**Scenario:**
When a user record is deleted from table `user`, automatically delete all associated session records from table `session`.

**Requirements:**
1. Define event `user_deleted` on table `user` when `$event = "DELETE"`.
2. Delete records from `session` where `user = $before.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT user_deleted ON TABLE user WHEN $event = "DELETE" THEN (
>     DELETE session WHERE user = $before.id
> );
> ```
>
> #### Technical Explanation
>
> 1. `$event = "DELETE"` triggers event logic specifically during record deletion queries.
> 2. Cascades deletion across associated tables (`session`), enforcing referential cleanup.
> 3. Prevents orphan records without external backend clean-up routines.
> 
---

### Exercise 3: Automatic Field Enrichment Triggers

**Scenario:**
When a new order is created in table `order`, trigger an event that sets `processed_at = time::now()` automatically.

**Requirements:**
1. Define event `order_created` on table `order` when `$event = "CREATE"`.
2. Update the newly created order record setting `processed = true`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT order_created ON TABLE order WHEN $event = "CREATE" THEN (
>     UPDATE $after.id SET processed = true
> );
> ```
>
> #### Technical Explanation
>
> 1. `$event = "CREATE"` targets new record insertion operations.
> 2. `$after.id` provides the record primary key of the newly inserted document.
> 3. Enables reactive asynchronous field enrichment inside the database.
> 
---



## 6. Related Terms
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`REMOVE` Statement](remove_statement.md) — Deleting events.

---

## 7. Key Takeaways
- `DEFINE EVENT` configures automatic database triggers.
- Relational equivalent to database triggers; NoSQL equivalent to trigger services.
- Executes synchronous code inside the main write transaction block.
- `$before` holds the pre-write record; `$after` holds the post-write record.
- Trigger actions on creation (`$before = NONE`) or deletion (`$after = NONE`).
- If an event script fails, the parent write transaction is rolled back.
- Keep event code lightweight to prevent database write latency.
