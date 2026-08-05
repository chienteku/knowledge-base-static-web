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
- **PostgreSQL Feature**

---

## 3. Environment Context
- **PostgreSQL Specific** (A highly popular extension to standard SQL. Supported natively in PostgreSQL and CockroachDB, but absent or implemented differently in other database systems like MySQL or SQL Server).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Register and Redirect

**Problem:** You are building a user registration API in Node.js. When a user registers, you insert their email. The database generates a unique ID. You must redirect the user to `/users/` followed by their new ID. Write the SQL insert statement that yields the ID in a single query.

**Expected output:**
> [!check]- Answer
> ```sql
> INSERT INTO users (email) 
> VALUES ('new_user@example.com') 
> RETURNING id;
> ```
> - Start with a standard `INSERT INTO` parameters syntax.
> - Append the PostgreSQL target returning command specifying the ID column.

---



### Exercise 2: Returning Computed Attributes on Insert

**Problem:** Insert order document returning generated `id` and computed `created_at` timestamp.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO orders (total) VALUES (99.95) RETURNING id, created_at;
> ```
> ```sql
> INSERT INTO orders (total) VALUES (99.95) RETURNING id, created_at;
> ```
>
> **Explanation:** `RETURNING col1, col2` projects generated defaults immediately upon insertion.

---

### Exercise 3: Capturing Deleted Rows with RETURNING

**Problem:** Delete expired tokens returning deleted `token_str` values.

**Expected output:**
> [!check]- Answer
> ```text
> DELETE FROM tokens WHERE expires_at < NOW() RETURNING token_str;
> ```
> ```sql
> DELETE FROM tokens WHERE expires_at < NOW() RETURNING token_str;
> ```
>
> **Explanation:** `DELETE ... RETURNING` returns deleted tuple attributes to the client.

## 7. Related Terms
- [`INSERT INTO`](insert_into.md) — The parent write statement.
- [`UPDATE`](update.md) — The parent edit statement.
- [`DELETE`](delete.md) — The parent delete statement.

---

## 8. Key Takeaways
- `RETURNING` is a PostgreSQL clause that returns values from modified rows.
- Eliminates the need to run a secondary `SELECT` query, reducing network latency.
- Supported on `INSERT`, `UPDATE`, and `DELETE` queries.
- Often used to retrieve auto-generated primary IDs and default timestamps.
- Running `DELETE ... RETURNING` yields a list of the data that was wiped.
- It is a Postgres-specific feature; avoid it if database porting is required.
