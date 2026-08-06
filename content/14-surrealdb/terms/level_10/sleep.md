# `SLEEP` Statement

> **Level 10 — SDKs, Deployment & Production**
> A SurrealQL statement that explicitly pauses query execution for a specified duration, primarily used for testing async execution, simulating network latency, and debugging timing-dependent events.

---

## 1. Prerequisites

- [`datetime` / `duration`](../level_02/datetime_duration.md) — Duration data types (`500ms`, `2s`).
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Transaction execution blocks.

---

## 2. Term Category


**SurrealQL Command (query execution delay SLEEP statement)**: - **Testing & Debugging**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Query Execution Delays with `SLEEP`

**Scenario:**
Introduce a temporary execution delay of 500 milliseconds inside a test transaction script using `SLEEP`.

**Requirements:**
1. Write `SLEEP 500ms;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> CREATE audit:1 SET step = "start";
> SLEEP 500ms;
> CREATE audit:2 SET step = "complete";
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. `SLEEP <duration>` pauses query execution for the specified duration (`500ms`, `2s`).
> 2. Non-blocking delay in SurrealDB's async Rust runtime.
> 3. Useful in test scripts simulating long-running operations or polling delays.

---

### Exercise 2: Simulating Latency in Test Scripts

**Scenario:**
Simulate a slow background task delay of 1 second before returning a stored procedure calculation.

**Requirements:**
1. Execute `SLEEP 1s; RETURN "Task completed";`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SLEEP 1s;
> RETURN "Background task completed";
> ```
>
> #### Technical Explanation
>
> 1. Suspends script execution for 1 second.
> 2. Helps developers test client SDK timeout handling.
> 3. Simulates asynchronous processing steps.

---

### Exercise 3: Non-Blocking Execution Model

**Scenario:**
Explain why executing `SLEEP` in one query session does not block other concurrent database query sessions.

**Requirements:**
1. Describe async Tokio thread pool execution.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Async Non-Blocking Execution:
> SurrealDB runs on Tokio async tasks. Calling SLEEP yields thread execution to other concurrent client queries, preventing server-wide thread blocking.
> ```
>
> #### Technical Explanation
>
> 1. `SLEEP` yields async task execution back to the Tokio runtime.
> 2. Other connection sessions continue processing queries without delay.
> 3. Ensures high concurrency under load.

---





## 6. Related Terms

- [`datetime` / `duration`](../level_02/datetime_duration.md) — Duration literals syntax.
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Multi-statement execution blocks.
- [Error Handling & Debugging](error_handling.md) — Query debugging strategies.

---

## 7. Key Takeaways
- `SLEEP` pauses query execution for a specified duration (e.g., `SLEEP 500ms;`).
- Useful for testing live query callbacks, simulating latency, and testing transaction timing.
- Always remove `SLEEP` statements before deploying code to production environments.
