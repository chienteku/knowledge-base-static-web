# `RETURNING` Clause

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> A PostgreSQL-specific SQL clause appended to `INSERT`, `UPDATE`, or `DELETE` statements that immediately returns values from the affected rows, eliminating the need for a separate `SELECT` query.

---

## 1. Prerequisites
- [`INSERT INTO`](insert_into.md) — Sourcing new rows.
- [`UPDATE`](update.md) — Modifying rows.
- [`DELETE`](delete.md) — Removing rows.

---

## 2. Term Category

**SQL Command / Clause** (Mutation Result Projection Clause): `RETURNING` returns modified or generated column values directly from `INSERT`, `UPDATE`, or `DELETE` statements.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Specific** (A highly popular extension to standard SQL. Supported natively in PostgreSQL and CockroachDB, but absent or implemented differently in other database systems like MySQL or SQL Server).

### (1) Design Motivation — "Why did we design this?"
In database operations, write queries often generate values dynamically on the server:
-   An `INSERT` statement triggers an auto-incrementing identity sequence to generate a new primary key `id`.
-   An `INSERT` statement triggers a `DEFAULT NOW()` constraint to generate a timestamp.
-   An `UPDATE` query decrements a user's wallet balance.

If your backend application code needs to know these new values (for example, displaying the newly created user ID on a website), standard SQL forces you to make a second network trip:

```sql
-- Step 1: Insert data
INSERT INTO users (username) VALUES ('alice');

-- Step 2: Query database again to find what ID was just created!
SELECT id FROM users WHERE username = 'alice';
```

This two-step process has major drawbacks:
1.  **Network Latency:** You waste time running two separate database connections.
2.  **Race Conditions:** If two users name `'alice'` register at the same second, your secondary `SELECT` might retrieve the wrong user's ID.

PostgreSQL designed the **`RETURNING`** clause to solve this. 

By appending `RETURNING` to the end of a write statement, you instruct the server: *"Perform this write, and in the same transaction return the resulting values back to me."* 

It acts as a hybrid write-read query, executing in a single network round-trip.

---

### (2) Returning Deleted Rows
One of the most powerful uses of `RETURNING` is with `DELETE` queries. 

It allows you to wipe data while returning exactly what was deleted, which is highly useful for audit logging or client notifications:

```sql
DELETE FROM sessions 
WHERE expires_at < NOW() 
RETURNING username;
-- Wipes expired sessions and returns a list of usernames who were logged out!
```

---

### (3) Reality Metaphor
Imagine a restaurant coat check:
-   **Without RETURNING (Standard SQL):** You hand the coat to the check clerk (Insert). You then have to ask the clerk: *"Which hanger number did you put my coat on?"* (Select). The clerk checks and tells you `42`.
-   **With RETURNING:** You hand the coat to the clerk. In the same motion, the clerk takes the coat and hands you a plastic ticket printed with the number `42`. You get the validation key immediately.

---

### (4) Code Examples

#### Returning Generated IDs on Insert
```sql
CREATE TABLE staff (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert and fetch the auto-generated ID and timestamp instantly
INSERT INTO staff (name) 
VALUES ('Franklin') 
RETURNING id, joined_at;
```

#### Fetching New Balances on Update
```sql
CREATE TABLE wallets (
  user_id INT PRIMARY KEY,
  balance NUMERIC(10,2)
);

-- Subtract cost and verify the new balance in one query
UPDATE wallets 
SET balance = balance - 15.50 
WHERE user_id = 101 
RETURNING balance;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming RETURNING works identically in all SQL databases

**The mistake:** Writing application code that uses `RETURNING` and expecting it to deploy cleanly on a MySQL or SQL Server database.

**Why it's wrong:** `RETURNING` is a PostgreSQL extension. If you run a query ending with `RETURNING` on MySQL, the query engine will crash with a syntax error. MySQL uses separate API hooks (like `LAST_INSERT_ID()`), while SQL Server uses a custom `OUTPUT` clause syntax.

**Fix: Only use `RETURNING` if your stack is committed to PostgreSQL (or compatible engines like CockroachDB/YugabyteDB). If write portability is critical, use an Object-Relational Mapper (ORM) library that abstracts write-return syntax variations for you.**

---



### Mistake 2: Executing `INSERT` Followed by `SELECT` to Retrieve Auto-Increment Primary Keys

**The mistake:** Executing `INSERT INTO users (name) VALUES ('Alice');` followed by `SELECT id FROM users WHERE name = 'Alice';`.

**Why it's wrong:** Executing a secondary query creates race conditions and adds network RPC overhead. Use `RETURNING id` on the `INSERT` statement.

*Incorrect:*
```sql
INSERT INTO users (name) VALUES ('Alice');
SELECT max(id) FROM users; -- ❌ Race condition risk!
```

*Fix:*
```sql
INSERT INTO users (name) VALUES ('Alice') RETURNING id; -- Atomic key return
```

### Mistake 3: Expecting `RETURNING` Output from Bulk Updates Without Capturing Result Sets

**The mistake:** Executing `UPDATE users SET active = true RETURNING *;` without consuming returned rows in client driver.

**Why it's wrong:** In client drivers, `RETURNING` statements return result streams (like `SELECT`). Ensure application code consumes the returned row cursor.

*Incorrect:*
```sql
// Running UPDATE ... RETURNING * without reading result stream
```

*Fix:*
```sql
const res = await client.query('UPDATE users SET active = true RETURNING *'); console.log(res.rows);
```

## 5. Practice Exercises

### Exercise 1: Returning Auto-Generated Primary Keys on Insert

**Scenario:**
Insert a new customer and return generated `id` and `created_at` values instantly.

**Requirements:**
1. Append `RETURNING id, created_at` to `INSERT INTO`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO customers (company_name) 
> VALUES ('Acme Corp') 
> RETURNING id, created_at;
> ```
>
> #### Technical Explanation
>
> 1. `RETURNING` projects modified or generated row attributes directly from the write statement.
> 2. Eliminates issuing a secondary `SELECT` query to fetch sequence values.
> 3. Single network roundtrip optimization.

---

### Exercise 2: Capturing Pre-Update State in UPDATE Statements

**Scenario:**
Deactivate a user and return their previous `email` address in the response payload.

**Requirements:**
1. Execute `UPDATE users SET is_active = FALSE WHERE id = 10 RETURNING email`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE users 
> SET is_active = FALSE 
> WHERE id = 10 
> RETURNING id, username, email, is_active;
> ```
>
> #### Technical Explanation
>
> 1. `RETURNING` on `UPDATE` returns the newly updated column values.
> 2. Confirms row mutation succeeded.
> 3. Useful for returning updated entity objects to client APIs.

---

### Exercise 3: Returning Deleted Rows for Audit Logging

**Scenario:**
Delete expired sessions and return the deleted session tokens for audit archiving.

**Requirements:**
1. Append `RETURNING token, user_id` to `DELETE FROM`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DELETE FROM user_sessions 
> WHERE expires_at < CURRENT_TIMESTAMP 
> RETURNING token, user_id, expires_at;
> ```
>
> #### Technical Explanation
>
> 1. `RETURNING` on `DELETE` projects the data content of deleted rows before they are purged.
> 2. Allows application code to log or archive deleted row payloads.
> 3. Powerful PostgreSQL extension.

---



## 6. Related Terms
- [`INSERT INTO`](insert_into.md) — The parent write statement.
- [`UPDATE`](update.md) — The parent edit statement.
- [`DELETE`](delete.md) — The parent delete statement.

---

## 7. Key Takeaways
- `RETURNING` is a PostgreSQL clause that returns values from modified rows.
- Eliminates the need to run a secondary `SELECT` query, reducing network latency.
- Supported on `INSERT`, `UPDATE`, and `DELETE` queries.
- Often used to retrieve auto-generated primary IDs and default timestamps.
- Running `DELETE ... RETURNING` yields a list of the data that was wiped.
- It is a Postgres-specific feature; avoid it if database porting is required.
