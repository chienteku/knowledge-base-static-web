# `DEFINE EVENT`

> **Level 9 — Real-Time Features, Events & Functions**
> Declarative server-side triggers in SurrealDB that execute specified SurrealQL logic whenever records in a table are created, updated, or deleted.

---

## 1. Prerequisites

- [`DEFINE TABLE`](../level_04/define_table.md) — Table definition context.
- [`UPDATE`](../level_03/update.md) — Record mutation operations.

---

## 2. Term Category


**Advanced Feature (table mutation trigger event definition)**: - **Server-Side Logic & Triggers**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Automatic Audit Trigger Event

**Scenario:**
Create an automated event trigger `audit_balance` on table `account` that logs balance changes to table `audit_log` whenever an account balance is updated.

**Requirements:**
1. Define event `audit_balance` ON TABLE `account`.
2. Execute WHEN `$event = "UPDATE" AND $before.balance != $after.balance`.
3. Create an `audit_log` record inside the `THEN` block.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT audit_balance ON TABLE account WHEN $event = "UPDATE" AND $before.balance != $after.balance THEN (
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
> 1. `DEFINE EVENT` creates reactive triggers that execute automatically during table mutations.
> 2. `$before` and `$after` provide access to pre-mutation and post-mutation record states.
> 3. Executes atomically within the mutation's database transaction.

---

### Exercise 2: Cascading Deletion Trigger Events

**Scenario:**
Define an event trigger `cascade_user_deletion` on table `user` that automatically deletes all associated `session` records when a user is deleted.

**Requirements:**
1. Define event `cascade_user_deletion` ON TABLE `user` WHEN `$event = "DELETE"`.
2. Delete records from `session` where `user = $before.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT cascade_user_deletion ON TABLE user WHEN $event = "DELETE" THEN (
>     DELETE session WHERE user = $before.id
> );
> ```
>
> #### Technical Explanation
>
> 1. `$event = "DELETE"` targets record deletion queries.
> 2. `$before.id` provides the primary key of the record being deleted.
> 3. Automates relational cleanup without backend API clean-up routines.

---

### Exercise 3: Dropping Table Event Triggers with `REMOVE EVENT`

**Scenario:**
Drop obsolete trigger event `audit_balance` from table `account`.

**Requirements:**
1. Write `REMOVE EVENT audit_balance ON TABLE account`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE EVENT audit_balance ON TABLE account;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE EVENT` drops event trigger definitions from table metadata.
> 2. Stops future trigger execution on table mutations.
> 3. Account table data records remain unaffected.

---





## 6. Related Terms

- [`$before` / `$after` / `$event` / `$value` Variables (in Events)](event_variables.md) — Event context variables.
- [`DEFINE FUNCTION`](define_function.md) — Reusable server-side functions.
- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Table change logging.
- [`LIVE SELECT` (Live Queries)](live_select.md) — LIVE SELECT subscriptions.

---

## 7. Key Takeaways
- `DEFINE EVENT` creates server-side triggers bound to table write operations.
- Triggers execute based on the declarative `WHEN` condition.
- Essential for audit trails, cascading record updates, auto-notifications, and business rule enforcement.
