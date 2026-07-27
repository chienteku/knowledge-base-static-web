# `$before` / `$after` / `$event` / `$value` Variables (in Events)

> **Level 9 — Real-Time Features, Events & Functions**
> Built-in contextual variables available inside `DEFINE EVENT` triggers and field definitions that expose pre-change state (`$before`), post-change state (`$after`), operation type (`$event`), and field values (`$value`).

---

## 1. Prerequisites
- [`DEFINE EVENT`](define_event.md) — Server-side event triggers.
- [`DEFINE FIELD`](../level_04/define_field.md) — Field definition clauses (`ASSERT`, `VALUE`).

---

## 2. Term Category
- **System Variables & Logic**

---

## 3. Environment Context
- **SurrealDB Engine Event Evaluator** (Populated dynamically during write transaction evaluation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing reactive database triggers or field validation rules, the code needs to know:
1. What operation triggered this? (`CREATE`, `UPDATE`, `DELETE`)
2. What did the record look like *before* the change?
3. What will the record look like *after* the change?
4. What is the specific field value being validated right now?

SurrealDB provides four specialized contextual variables:
- **`$event`**: A string indicating the write operation type (`'CREATE'`, `'UPDATE'`, or `'DELETE'`).
- **`$before`**: The complete record object as it existed **before** the write (evaluates to `NONE` on `CREATE`).
- **`$after`**: The complete record object as it will exist **after** the write (evaluates to `NONE` on `DELETE`).
- **`$value`**: Used inside `DEFINE FIELD` assertions (`ASSERT`) and defaults (`VALUE`) to represent the incoming field input value.

### (2) Reality Metaphor
Think of an inspector comparing building blueprints before and after a renovation:
- **`$event`**: "Renovation Type: Room Extension."
- **`$before`**: Photo of the house before construction started.
- **`$after`**: Photo of the house after construction finished.
- **`$value`**: Checking the exact width measurement written on a single window frame.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Accessing $before and $after to track price drops
DEFINE EVENT price_drop_alert ON product
    WHEN $event = 'UPDATE' AND $after.price < $before.price
    THEN (
        CREATE notification SET item = $after.id, old_price = $before.price, new_price = $after.price
    );
```

#### Fuller Example
```surrealql
-- 1. Using $value in field assertion
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD balance ON account TYPE decimal
    ASSERT $value >= 0.00; -- $value represents incoming balance number

-- 2. Complex Event using $before, $after, and $event
DEFINE EVENT audit_balance_change ON account
    WHEN $event = 'UPDATE' AND $before.balance != $after.balance
    THEN (
        CREATE balance_history SET
            account = $after.id,
            old_balance = $before.balance,
            new_balance = $after.balance,
            difference = $after.balance - $before.balance,
            timestamp = time::now()
    );
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Referencing $before during CREATE Operations

**The mistake:** Accessing `$before.field` inside an event handler when `$event = 'CREATE'`.

**Why it's wrong:** On a `CREATE` operation, no previous record existed, so `$before` is `NONE`. Dereferencing fields on `NONE` causes errors or unexpected evaluation.

*Incorrect:*
```surrealql
-- On CREATE, $before is NONE!
DEFINE EVENT bad_event ON user
    WHEN $before.status != $after.status -- Errors on CREATE!
    THEN (...);
```

*Fix:*
```surrealql
-- Guard with $event = 'UPDATE' first
DEFINE EVENT safe_event ON user
    WHEN $event = 'UPDATE' AND $before.status != $after.status
    THEN (...);
```

---



### Mistake 2: Referencing `$before` in `CREATE` Event Handlers

**The mistake:** Referencing `$before.name` in an event handler matching `$event = 'CREATE'`. 

**Why it's wrong:** During `CREATE` events, no previous record existed, so `$before` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET old = $before.name); // $before is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET new = $after.name);
```

### Mistake 3: Referencing `$after` in `DELETE` Event Handlers

**The mistake:** Referencing `$after.id` in an event handler matching `$event = 'DELETE'`. 

**Why it's wrong:** During `DELETE` events, the record has been deleted, so `$after` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'DELETE' THEN (CREATE audit SET del = $after.id); // $after is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'DELETE' THEN (CREATE audit SET del = $before.id);
```



### Mistake 4: Referencing `$before` in `CREATE` Event Handlers

**The mistake:** Referencing `$before.name` in an event handler matching `$event = 'CREATE'`. 

**Why it's wrong:** During `CREATE` events, no previous record existed, so `$before` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET old = $before.name); // $before is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'CREATE' THEN (CREATE audit SET new = $after.name);
```

### Mistake 5: Referencing `$after` in `DELETE` Event Handlers

**The mistake:** Referencing `$after.id` in an event handler matching `$event = 'DELETE'`. 

**Why it's wrong:** During `DELETE` events, the record has been deleted, so `$after` is `NONE`.

*Incorrect:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'DELETE' THEN (CREATE audit SET del = $after.id); // $after is NONE!
```

*Fix:*
```surrealql
DEFINE EVENT e ON TABLE user WHEN $event = 'DELETE' THEN (CREATE audit SET del = $before.id);
```

## 6. Practice Exercises

### Exercise 1: Identify Event Variable
Match the variable to its description:
1. `$value`
2. `$before`
3. `$after`

a. Record state after the write completes.
b. The incoming value of a field being checked in `ASSERT`.
c. Record state before the write occurred.

> [!check]- Answer
> - `$value` = b (field value in assertions).
> - `$before` = c (pre-change state).
> - `$after` = a (post-change state).

---



### Exercise 2: Event Variables Reference Table

**Problem:** State values: 1. `$event` (CREATE/UPDATE/DELETE), 2. `$before` (pre-mutation state), 3. `$after` (post-mutation state).

**Expected output:**
```text
$event: mutation type, $before: pre-mutation record, $after: post-mutation record
```

> [!check]- Answer
> ```text
> $event: mutation type, $before: pre-mutation record, $after: post-mutation record
> ```
>
> **Explanation:** Event context variables provide mutation details and pre/post record snapshots.

### Exercise 3: Detecting Field Changes in Update Event

**Problem:** Trigger audit event ONLY when `$before.status != $after.status` during UPDATE events.

**Expected output:**
```text
DEFINE EVENT status_change ON TABLE user WHEN $event = "UPDATE" AND $before.status != $after.status THEN (...);
```

> [!check]- Answer
> ```surrealql
> DEFINE EVENT status_change ON TABLE user WHEN $event = "UPDATE" AND $before.status != $after.status THEN (
>   CREATE audit CONTENT { user: $after.id, old: $before.status, new: $after.status }
> );
> ```
>
> **Explanation:** Comparing `$before.field != $after.field` detects specific field mutations.



### Exercise 4: Event Variables Reference Table

**Problem:** State values: 1. `$event` (CREATE/UPDATE/DELETE), 2. `$before` (pre-mutation state), 3. `$after` (post-mutation state).

**Expected output:**
```text
$event: mutation type, $before: pre-mutation record, $after: post-mutation record
```

> [!check]- Answer
> ```text
> $event: mutation type, $before: pre-mutation record, $after: post-mutation record
> ```
>
> **Explanation:** Event context variables provide mutation details and pre/post record snapshots.

### Exercise 5: Detecting Field Changes in Update Event

**Problem:** Trigger audit event ONLY when `$before.status != $after.status` during UPDATE events.

**Expected output:**
```text
DEFINE EVENT status_change ON TABLE user WHEN $event = "UPDATE" AND $before.status != $after.status THEN (...);
```

> [!check]- Answer
> ```surrealql
> DEFINE EVENT status_change ON TABLE user WHEN $event = "UPDATE" AND $before.status != $after.status THEN (
>   CREATE audit CONTENT { user: $after.id, old: $before.status, new: $after.status }
> );
> ```
>
> **Explanation:** Comparing `$before.field != $after.field` detects specific field mutations.

## 7. Related Terms
- [`DEFINE EVENT`](define_event.md) — Server-side triggers.
- [`ASSERT` Clause](../level_04/assert_clause.md) — Field constraint assertions.
- [`$auth` Variable](../level_08/auth_variable.md) — Authenticated user variable.

---

## 8. Key Takeaways
- `$event` indicates operation type (`'CREATE'`, `'UPDATE'`, `'DELETE'`).
- `$before` holds pre-change record data; `$after` holds post-change record data.
- `$value` represents the target field value in `ASSERT` and `VALUE` field clauses.
