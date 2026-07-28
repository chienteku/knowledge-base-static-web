# `INSERT ... ON DUPLICATE KEY UPDATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SQL-compatible upsert syntax in SurrealDB used inside `INSERT` statements to catch Record ID conflicts and modify existing record fields instead of throwing duplicate key errors.

---

## 1. Prerequisites
- [`INSERT`](insert.md) — The parent write statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated during the write phase. Intercepts key violation exceptions at the indexing layer and converts them to update transactions).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Upsert Query Construction

**Problem:** You are syncing a product inventory list. Write the SurrealQL query to:
1.  Insert a record into the `store` table.
2.  Record ID is `store:item_05`.
3.  Set `quantity` to `100`.
4.  If the record already exists, add `50` to the existing `quantity` value.

**Expected output:**
> [!check]- Answer
> ```sql
> INSERT INTO store { id: store:item_05, quantity: 100 } ON DUPLICATE KEY UPDATE quantity += 50;
> ```
> - The table target is `store`.
> - Use `ON DUPLICATE KEY UPDATE` followed by the increment operator `+=`.

---



### Exercise 2: Upserting Records on Key Collision

**Problem:** Write `INSERT INTO user:alice` that updates `login_count = login_count + 1` on duplicate key.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO user:alice { name: "Alice", login_count: 1 } ON DUPLICATE KEY UPDATE login_count += 1;
> ```
> ```surrealql
> INSERT INTO user:alice { name: "Alice", login_count: 1 } ON DUPLICATE KEY UPDATE login_count += 1;
> ```
>
> **Explanation:** `ON DUPLICATE KEY UPDATE` modifies existing fields upon primary key collision.

---

### Exercise 3: $input Variable Usage

**Problem:** Explain what `$input` represents inside `ON DUPLICATE KEY UPDATE` clauses.

**Expected output:**
> [!check]- Answer
> ```text
> $input represents the incoming record data payload attempted in the INSERT statement
> ```
> ```text
> $input represents the incoming record data payload attempted in the INSERT statement
> ```
>
> **Explanation:** `$input` binds incoming insert values during duplicate key resolution.

## 7. Related Terms
- [`INSERT`](insert.md) — The parent write statement.
- [`UPSERT`](upsert.md) — The native standalone upsert statement.

---

## 8. Key Takeaways
- `ON DUPLICATE KEY UPDATE` handles key conflicts during `INSERT` queries.
- Prevents database write crashes by converting duplicate errors into updates.
- Uses MySQL-style upsert syntax; does not support PostgreSQL's `ON CONFLICT`.
- Can run arithmetic modifications (like `+= 1`) on existing fields during conflicts.
- First-class standalone `UPSERT` statements are supported separately in SurrealQL.
- Highly useful for transaction sync logs and login counter updates.
- If no key collision occurs, the statement executes a standard insert.
