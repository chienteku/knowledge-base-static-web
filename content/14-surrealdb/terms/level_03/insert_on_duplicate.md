# `INSERT ... ON DUPLICATE KEY UPDATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SQL-compatible upsert syntax in SurrealDB used inside `INSERT` statements to catch Record ID conflicts and modify existing record fields instead of throwing duplicate key errors.

---

## 1. Prerequisites

- [`INSERT`](insert.md) — The parent write statement.

---

## 2. Term Category


**SurrealQL Command (upsert key collision clause)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When importing bulk data or logging transactions, you often run into duplicate keys:
-   A user logins: you want to register their record if it's their first time, or update their `last_login` timestamp if they already exist.
-   If you run a simple `INSERT` and the key already exists, the database aborts the transaction and throws an error, interrupting your code.

In PostgreSQL, you handle this using the `ON CONFLICT` clause:
`INSERT INTO users (id, name) VALUES (1, 'Alice') ON CONFLICT (id) DO UPDATE SET name = 'Alice';`

In SurrealDB, we designed the **`ON DUPLICATE KEY UPDATE`** clause inside the `INSERT` statement to handle this upsert choice in a SQL-compatible way. 

If a Record ID collision occurs, instead of throwing a duplicate key error and failing, the database runs your update script on the existing record, keeping database writes flowing smoothly.

---

### (2) SQL-Compatibility Note
SurrealDB chose MySQL-style syntax (`ON DUPLICATE KEY UPDATE`) for its `INSERT` upsert modifier, rather than PostgreSQL's `ON CONFLICT`. 

This is distinct from SurrealDB's own native, standalone `UPSERT` statement (covered in Term #46), which does not require table column mapping.

---

### (3) Reality Metaphor (Guest Check-in Counters)
Imagine checking guests in at a corporate conference:
-   **Standard `INSERT`:** You try to check in `"John Doe"`. 
    -   The computer screen flashes: **`"ERROR: ALREADY REGISTERED!"`** and freezes the scanner line. 
    -   You must manually reset the system.
-   **`ON DUPLICATE KEY UPDATE`:** You scan `"John Doe"`. 
    -   If they are new, the printer creates their pass (insert). 
    -   If the screen says they are already checked in, you don't print a pass. 
    -   Instead, the computer automatically increments their **`Attendance Count`** by 1 and lets them pass. (Upsert).

---

### (4) Code Examples

#### Executing SQL-Style Upserts in SurrealQL
Observe how conflicts are captured and handled:

```sql
-- 1. Insert a log. If the user already exists, update their count!
INSERT INTO user_logs {
  id: user_logs:john,
  username: "john_doe",
  login_count: 1,
  last_login: time::now()
} ON DUPLICATE KEY UPDATE
  login_count += 1, // Increments count!
  last_login = time::now();

-- 2. Run the exact same query a second time!
-- Instead of throwing duplicate key errors, SurrealDB updates the existing user_logs:john record:
-- 'login_count' becomes 2, 'last_login' updates to current time.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use PostgreSQL's 'ON CONFLICT' syntax inside SurrealQL 'INSERT' statements, causing compiler crashes

**The mistake:** Writing `INSERT INTO user (id) VALUES (user:john) ON CONFLICT (id) DO UPDATE SET active = true;` hoping it will resolve conflicts.

**Why it's wrong:** SurrealDB does not support the `ON CONFLICT` keywords. 

Using them will cause the database query compiler to throw syntax parsing errors.

**Fix: Change the conflict clause to use MySQL-style `ON DUPLICATE KEY UPDATE` syntax:**

```sql
-- BAD
INSERT INTO user (id) VALUES (user:john) ON CONFLICT (id) DO UPDATE SET active = true;

-- GOOD
INSERT INTO user (id) VALUES (user:john) ON DUPLICATE KEY UPDATE active = true;
```

---



### Mistake 2: Forgetting `ON DUPLICATE KEY UPDATE` Clause in Bulk Import Jobs

**The mistake:** Running large `INSERT INTO` batch imports without duplicate collision handlers.

**Why it's wrong:** If a single Record ID in a 1,000-item bulk `INSERT` collides with an existing record, the entire batch fails! Add `ON DUPLICATE KEY UPDATE` to handle collisions gracefully.

*Incorrect:*
```surrealql
INSERT INTO user [ { id: user:1, name: "A" } ]; // ❌ Fails on key collision!
```

*Fix:*
```surrealql
INSERT INTO user [ { id: user:1, name: "A" } ] ON DUPLICATE KEY UPDATE name = $input.name;
```

### Mistake 3: Using `ON DUPLICATE KEY UPDATE` Without `$input` Variable References

**The mistake:** Writing `ON DUPLICATE KEY UPDATE name = name` expecting new inserted value.

**Why it's wrong:** Inside `ON DUPLICATE KEY UPDATE`, `$input` holds the new record object being inserted. `name` references the existing stored field value.

*Incorrect:*
```surrealql
INSERT INTO user { id: user:1, name: "New" } ON DUPLICATE KEY UPDATE name = name; // Retains old name!
```

*Fix:*
```surrealql
INSERT INTO user { id: user:1, name: "New" } ON DUPLICATE KEY UPDATE name = $input.name;
```

## 5. Practice Exercises

### Exercise 1: Upserting Key Collisions with `ON DUPLICATE KEY UPDATE`

**Scenario:**
An analytics counter tracks page view counts in table `page_metric`. When inserting a page metric for `page:home`, if the key already exists, increment `views` by 1 instead of failing.

**Requirements:**
1. Write an `INSERT INTO page_metric` statement for `id: page_metric:home`.
2. Add `ON DUPLICATE KEY UPDATE views += 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> INSERT INTO page_metric [
>     { id: page_metric:home, page: "home", views: 1 }
> ]
> ON DUPLICATE KEY UPDATE views += 1;
> ```
>
> #### Technical Explanation
>
> 1. `ON DUPLICATE KEY UPDATE` converts key collision failures into atomic record updates.
> 2. `views += 1` increments the existing counter field when a primary key collision occurs.
> 3. Equivalent to PostgreSQL `ON CONFLICT (id) DO UPDATE`.

---

### Exercise 2: Overwriting Specific Fields on Key Collision

**Scenario:**
A user synchronization job receives user profile updates. If a user record `user:alice` already exists, update `last_login = time::now()` while preserving original creation dates.

**Requirements:**
1. Insert `user:alice` with `last_login = time::now()`.
2. Use `ON DUPLICATE KEY UPDATE last_login = time::now()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> INSERT INTO user [
>     { id: user:alice, name: "Alice", last_login: time::now() }
> ]
> ON DUPLICATE KEY UPDATE last_login = time::now();
> ```
>
> #### Technical Explanation
>
> 1. Updates specified fields (`last_login`) on conflict without overwriting unmentioned fields (`created_at`).
> 2. Eliminates the need for separate read-then-update application logic.
> 3. Operates within an atomic write transaction.

---

### Exercise 3: Bulk Upserting Key Array Batches

**Scenario:**
A sync job processes a batch of product records where some products exist and others are new. Bulk-insert the batch and update prices on duplicate keys.

**Requirements:**
1. Bulk-insert products `product:p1` and `product:p2`.
2. Add `ON DUPLICATE KEY UPDATE price = $input.price`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> INSERT INTO product [
>     { id: product:p1, name: "Widget A", price: 19.99dec },
>     { id: product:p2, name: "Widget B", price: 29.99dec }
> ]
> ON DUPLICATE KEY UPDATE price = $input.price;
> ```
>
> #### Technical Explanation
>
> 1. `$input.price` references the incoming value from the insertion payload.
> 2. Bulk upserts process mixed batches of new insertions and existing updates in a single roundtrip.
> 3. Maximizes data ingestion throughput for synchronization jobs.

---



## 6. Related Terms

- [`INSERT`](insert.md) — The parent write statement.
- [`UPSERT`](upsert.md) — The native standalone upsert statement.

---

## 7. Key Takeaways
- `ON DUPLICATE KEY UPDATE` handles key conflicts during `INSERT` queries.
- Prevents database write crashes by converting duplicate errors into updates.
- Uses MySQL-style upsert syntax; does not support PostgreSQL's `ON CONFLICT`.
- Can run arithmetic modifications (like `+= 1`) on existing fields during conflicts.
- First-class standalone `UPSERT` statements are supported separately in SurrealQL.
- Highly useful for transaction sync logs and login counter updates.
- If no key collision occurs, the statement executes a standard insert.
