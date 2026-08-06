# `$before` / `$after` / `$event` / `$value` Variables (in Events)

> **Level 9 — Real-Time Features, Events & Functions**
> Built-in contextual variables available inside `DEFINE EVENT` triggers and field definitions that expose pre-change state (`$before`), post-change state (`$after`), operation type (`$event`), and field values (`$value`).

---

## 1. Prerequisites

- [`DEFINE EVENT`](define_event.md) — Server-side event triggers.
- [`DEFINE FIELD`](../level_04/define_field.md) — Field definition clauses (`ASSERT`, `VALUE`).

---

## 2. Term Category


**Advanced Feature ($before, $after, $event trigger variables)**: - **System Variables & Logic**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Comparing `$before` and `$after` Record States

**Scenario:**
In an event trigger on table `product`, check if field `price` has changed by comparing `$before.price` and `$after.price`.

**Requirements:**
1. Define event `price_changed` ON TABLE `product` WHEN `$before.price != $after.price`.
2. Create price log record inside `THEN`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT price_changed ON TABLE product WHEN $before.price != $after.price THEN (
>     CREATE price_history SET 
>         product = $after.id,
>         old_price = $before.price,
>         new_price = $after.price,
>         changed_at = time::now()
> );
> ```
>
> #### Technical Explanation
>
> 1. `$before` holds the record document state prior to mutation; `$after` holds the post-mutation state.
> 2. Comparing `$before` and `$after` identifies specific field changes during update operations.
> 3. Enables granular state change auditing.

---

### Exercise 2: Branching Trigger Logic by `$event` Type

**Scenario:**
In a user event trigger, perform different actions depending on whether `$event` is `"CREATE"`, `"UPDATE"`, or `"DELETE"`.

**Requirements:**
1. Use `$event` variable inside trigger `WHEN` or `THEN` blocks.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE EVENT user_activity ON TABLE user WHEN $event = "CREATE" THEN (
>     CREATE log SET action = "user_created", user = $after.id
> );
> ```
>
> #### Technical Explanation
>
> 1. `$event` contains a string indicating the mutation action type (`"CREATE"`, `"UPDATE"`, `"DELETE"`).
> 2. Allows trigger conditions to target specific mutation types.
> 3. Provides precise trigger execution control.

---

### Exercise 3: Accessing `$value` inside Field Assertions

**Scenario:**
Inspect `$value` inside a field `ASSERT` expression to enforce that an account `balance` cannot drop below 0.

**Requirements:**
1. Define field `balance` ON TABLE `account` TYPE `decimal` ASSERT `$value >= 0.0dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE account SCHEMAFULL;
> DEFINE FIELD balance ON TABLE account TYPE decimal 
>     ASSERT $value >= 0.0dec;
> ```
>
> #### Technical Explanation
>
> 1. `$value` represents the candidate value being written to the target field.
> 2. Evaluates field assertion expressions before committing transactions.
> 3. Aborts write operations violating assertion rules.

---





## 6. Related Terms

- [`DEFINE EVENT`](define_event.md) — Server-side triggers.
- [`ASSERT` Clause](../level_04/assert_clause.md) — Field constraint assertions.
- [`$auth` Variable](../level_08/auth_variable.md) — Authenticated user variable.

---

## 7. Key Takeaways
- `$event` indicates operation type (`'CREATE'`, `'UPDATE'`, `'DELETE'`).
- `$before` holds pre-change record data; `$after` holds post-change record data.
- `$value` represents the target field value in `ASSERT` and `VALUE` field clauses.
