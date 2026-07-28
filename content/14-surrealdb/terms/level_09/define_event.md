# `DEFINE EVENT`

> **Level 9 — Real-Time Features, Events & Functions**
> Declarative server-side triggers in SurrealDB that execute specified SurrealQL logic whenever records in a table are created, updated, or deleted.

---

## 1. Prerequisites
- [`DEFINE TABLE`](../level_04/define_table.md) — Table definition context.
- [UPDATE](../level_03/update.md) — Record mutation operations.

---

## 2. Term Category
- **Server-Side Logic & Triggers**

---

## 3. Environment Context
- **SurrealDB Engine Transaction Pipeline** (Evaluated synchronously or asynchronously inside database write transactions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases (PostgreSQL), server-side triggers require writing complex stored procedures in PL/pgSQL, attaching them with `CREATE TRIGGER`, and carefully managing BEFORE/AFTER execution phases. In MongoDB, reactive logic requires configuring external change stream microservices.

SurrealDB provides `DEFINE EVENT` to declare reactive server-side triggers directly in SurrealQL. When defined (e.g. `DEFINE EVENT log_signup ON user WHEN $event = 'CREATE' THEN ...`), SurrealDB monitors table operations and executes the handler expression automatically whenever the `WHEN` condition evaluates to `true`.

### (2) Reality Metaphor
Think of an automated home security system:
- **`DEFINE EVENT`**: Setting a rule: "WHEN the front door motion sensor detects entry (`$event = 'CREATE'`), THEN turn on the hallway light and log the entry timestamp."

### (3) Code Examples

#### Short Snippet
```surrealql
-- Automatically create an audit log entry whenever a user record is deleted
DEFINE EVENT log_user_delete ON user WHEN $event = 'DELETE' THEN (
    CREATE audit_log SET action = 'user_deleted', user_id = $before.id, time = time::now()
);
```

#### Fuller Example
```surrealql
-- 1. Create tables
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD updated_at ON user TYPE datetime;

-- 2. Define an Event that auto-updates updated_at timestamp on record changes
DEFINE EVENT touch_user_updated_at ON user
    WHEN $event = 'UPDATE' AND $before.email != $after.email
    THEN (
        UPDATE $after.id SET updated_at = time::now()
    );

-- 3. Define an Event that creates a notification when a new user signs up
DEFINE EVENT welcome_notification ON user
    WHEN $event = 'CREATE'
    THEN (
        CREATE notification SET
            user = $after.id,
            message = 'Welcome to the platform!',
            read = false
    );
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating Infinite Trigger Loops in Event Handlers

**The mistake:** Writing an `UPDATE` event handler on table `A` that performs an `UPDATE` on the same table `A` without conditional guards.

**Why it's wrong:** Updating table `A` inside an `UPDATE` event on `A` triggers the event again infinitely, causing transaction deadlocks or stack overflow errors.

*Incorrect:*
```surrealql
-- Unbounded recursive update loop!
DEFINE EVENT bad_loop ON user WHEN $event = 'UPDATE' THEN (
    UPDATE user SET counter += 1 -- Triggers bad_loop again infinitely!
);
```

*Fix:*
```surrealql
-- Use field VALUE clause for auto-updating timestamps, or use strict WHEN guards
DEFINE FIELD updated_at ON user VALUE time::now();
```

---



### Mistake 2: Creating Infinite Event Loops by Mutating Target Table Inside `THEN` Blocks

**The mistake:** Creating an event on table `user` that executes an `UPDATE user` statement inside its `THEN` handler.

**Why it's wrong:** Updating table `user` inside a `user` table event handler triggers the event again recursively, causing infinite loops and stack overflow.

*Incorrect:*
```surrealql
-- Recursive infinite event loop!
DEFINE EVENT inc_count ON TABLE user WHEN $event = 'UPDATE' THEN (UPDATE user SET count += 1);
```

*Fix:*
```surrealql
DEFINE EVENT audit ON TABLE user WHEN $event = 'UPDATE' THEN (CREATE user_audit CONTENT { user: $after.id });
```

### Mistake 3: Referencing Un-Set Context Variables in Event Handlers

**The mistake:** Referencing `$before` in event handlers matching `$event = 'CREATE'`. 

**Why it's wrong:** During `CREATE` events, `$before` is `NONE` because no prior record existed. During `DELETE` events, `$after` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT log ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET old_name = $before.name); // $before is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT log ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET new_name = $after.name);
```



### Mistake 4: Creating Infinite Event Loops by Mutating Target Table Inside `THEN` Blocks

**The mistake:** Creating an event on table `user` that executes an `UPDATE user` statement inside its `THEN` handler.

**Why it's wrong:** Updating table `user` inside a `user` table event handler triggers the event again recursively, causing infinite loops and stack overflow.

*Incorrect:*
```surrealql
-- Recursive infinite event loop!
DEFINE EVENT inc_count ON TABLE user WHEN $event = 'UPDATE' THEN (UPDATE user SET count += 1);
```

*Fix:*
```surrealql
DEFINE EVENT audit ON TABLE user WHEN $event = 'UPDATE' THEN (CREATE user_audit CONTENT { user: $after.id });
```

### Mistake 5: Referencing Un-Set Context Variables in Event Handlers

**The mistake:** Referencing `$before` in event handlers matching `$event = 'CREATE'`. 

**Why it's wrong:** During `CREATE` events, `$before` is `NONE` because no prior record existed. During `DELETE` events, `$after` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT log ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET old_name = $before.name); // $before is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT log ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET new_name = $after.name);
```

## 6. Practice Exercises

### Exercise 1: Define Order Audit Event
Write a `DEFINE EVENT` named `audit_order_cancel` on table `order` that triggers when `$event = 'UPDATE'` and `$after.status = 'cancelled'`, creating a record in `order_audit`.

> [!check]- Answer
> - Combine `WHEN $event = 'UPDATE' AND $after.status = 'cancelled'`.
> - Action: `THEN (CREATE order_audit SET order_id = $after.id, time = time::now());`.

---



### Exercise 2: Creating Audit Log Event

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
> **Explanation:** `DEFINE EVENT` triggers asynchronous or transactional event handlers.

---

### Exercise 3: Event Action Filter

**Problem:** Trigger event `on_delete` ONLY when `$event = "DELETE"`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE EVENT on_delete ON TABLE user WHEN $event = "DELETE" THEN (...);
> ```
> ```surrealql
> DEFINE EVENT on_delete ON TABLE user WHEN $event = "DELETE" THEN (CREATE deleted_log CONTENT { user: $before.id });
> ```
>
> **Explanation:** `WHEN $event = ...` filters event execution by mutation type.

## 7. Related Terms
- [`$before` / `$after` / `$event` / `$value` Variables](event_variables.md) — Event context variables.
- [`DEFINE FUNCTION`](define_function.md) — Reusable server-side functions.
- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Table change logging.

---

## 8. Key Takeaways
- `DEFINE EVENT` creates server-side triggers bound to table write operations.
- Triggers execute based on the declarative `WHEN` condition.
- Essential for audit trails, cascading record updates, auto-notifications, and business rule enforcement.
