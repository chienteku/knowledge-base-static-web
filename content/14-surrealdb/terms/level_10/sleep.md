# `SLEEP` Statement

> **Level 10 — SDKs, Deployment & Production**
> A SurrealQL statement that explicitly pauses query execution for a specified duration, primarily used for testing async execution, simulating network latency, and debugging timing-dependent events.

---

## 1. Prerequisites
- [`datetime` / `duration`](../level_02/datetime_duration.md) — Duration data types (`500ms`, `2s`).
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Transaction execution blocks.

---

## 2. Term Category
- **Testing & Debugging**

---

## 3. Environment Context
- **SurrealQL Execution Engine** (Pauses thread execution for the specified duration).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
During testing, integration development, or debugging, developers need to simulate delay conditions: testing live query push delays (`LIVE SELECT`), verifying event trigger timing (`DEFINE EVENT`), or testing application timeout handling in client SDKs.

SurrealDB provides the `SLEEP` statement. When executed (e.g. `SLEEP 500ms;` or `SLEEP 2s;`), the query engine pauses execution of the current script thread for the specified duration before proceeding to subsequent statements.

### (2) Reality Metaphor
Think of a pause button on a stopwatch:
- Clicking "Pause" stops execution for 5 seconds while keeping the overall timer state intact, then resumes counting from the exact moment it was paused.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Pause query execution for 500 milliseconds
SLEEP 500ms;
```

#### Fuller Example
```surrealql
-- Testing asynchronous event triggers with SLEEP
BEGIN TRANSACTION;
    -- 1. Create a user record
    CREATE user:test SET email = 'test@example.com';

    -- 2. Pause execution for 1 second to simulate background job processing delay
    SLEEP 1s;

    -- 3. Check if server-side DEFINE EVENT created a welcome notification
    SELECT * FROM notification WHERE user = user:test;
COMMIT TRANSACTION;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving SLEEP Statements in Production Application Code

**The mistake:** Committing `SLEEP 2s;` statements into production API queries or migration files after testing.

**Why it's wrong:** `SLEEP` halts server execution threads for the full duration, degrading production response times and throughput.

*Fix:* Remove `SLEEP` statements before pushing code to production repositories.

---



### Mistake 2: Using Long `sleep()` Durations Inside Synchronous Transaction Blocks

**The mistake:** Executing `BEGIN TRANSACTION; sleep(10s); COMMIT TRANSACTION;`.

**Why it's wrong:** Holding open transactions while sleeping locks storage resources and causes transaction timeout aborts under high concurrency. Avoid long sleeps inside transactions.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
sleep(10s); // ❌ Locks storage resources!
COMMIT TRANSACTION;
```

*Fix:*
```surrealql
sleep(10s); // Use outside transaction blocks
```

### Mistake 3: Passing Plain Numbers to `sleep()` Without Duration Suffixes

**The mistake:** Writing `sleep(5)` expecting to sleep 5 seconds.

**Why it's wrong:** `sleep()` requires explicit duration literals like `5s`, `500ms`, `1m`.

*Incorrect:*
```surrealql
sleep(5); // ❌ Missing duration unit suffix!
```

*Fix:*
```surrealql
sleep(5s); // Correct 5 seconds duration
```



### Mistake 4: Using Long `sleep()` Durations Inside Synchronous Transaction Blocks

**The mistake:** Executing `BEGIN TRANSACTION; sleep(10s); COMMIT TRANSACTION;`.

**Why it's wrong:** Holding open transactions while sleeping locks storage resources and causes transaction timeout aborts under high concurrency. Avoid long sleeps inside transactions.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
sleep(10s); // ❌ Locks storage resources!
COMMIT TRANSACTION;
```

*Fix:*
```surrealql
sleep(10s); // Use outside transaction blocks
```

### Mistake 5: Passing Plain Numbers to `sleep()` Without Duration Suffixes

**The mistake:** Writing `sleep(5)` expecting to sleep 5 seconds.

**Why it's wrong:** `sleep()` requires explicit duration literals like `5s`, `500ms`, `1m`.

*Incorrect:*
```surrealql
sleep(5); // ❌ Missing duration unit suffix!
```

*Fix:*
```surrealql
sleep(5s); // Correct 5 seconds duration
```

## 6. Practice Exercises

### Exercise 1: Valid Duration Syntax
Which of the following are valid duration literals for the `SLEEP` statement?
a. `SLEEP 100ms;`
b. `SLEEP 2.5s;`
c. `SLEEP 1m;`
d. All of the above.

> [!check]- Answer
> - SurrealDB supports `ms` (milliseconds), `s` (seconds), `m` (minutes), etc. Answer: d.

---



### Exercise 2: Pausing Query Script Execution

**Problem:** Pause SurrealQL script execution for 500 milliseconds using `sleep()`.

**Expected output:**
```text
sleep(500ms);
```

> [!check]- Answer
> ```surrealql
> sleep(500ms);
> ```
>
> **Explanation:** `sleep(duration)` pauses script execution for specified duration intervals.

### Exercise 3: Simulating Rate Limiting Delays

**Problem:** Use `sleep(1s)` inside a loop to rate-limit batch operations.

**Expected output:**
```text
FOR $id IN $ids { UPDATE $id SET processed = true; sleep(1s); };
```

> [!check]- Answer
> ```surrealql
> FOR $id IN $ids {
>   UPDATE $id SET processed = true;
>   sleep(1s);
> };
> ```
>
> **Explanation:** `sleep()` inserts controlled delays between batch iteration steps.

## 7. Related Terms
- [`datetime` / `duration`](../level_02/datetime_duration.md) — Duration literals syntax.
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Multi-statement execution blocks.
- [Error Handling & Debugging](error_handling.md) — Query debugging strategies.

---

## 8. Key Takeaways
- `SLEEP` pauses query execution for a specified duration (e.g., `SLEEP 500ms;`).
- Useful for testing live query callbacks, simulating latency, and testing transaction timing.
- Always remove `SLEEP` statements before deploying code to production environments.
