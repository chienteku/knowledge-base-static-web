# `CREATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL statement used to create new records inside a table, supporting both manual Record ID assignment and automatic random ID generation.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category


**SurrealQL Command (record creation statement)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database SQL (PostgreSQL), inserting records is tabular:
`INSERT INTO users (name, age) VALUES ('Alice', 30);`
-   You cannot specify the primary key identifier directly unless you configure custom UUID overrides. 
-   The database usually auto-assigns sequential integers in the background.

In MongoDB, you call `db.users.insertOne({ _id: "john", name: "John" })`.

We designed the **`CREATE`** statement in SurrealQL as the primary NoSQL-friendly write command. 

It allows you to specify the record's primary ID directly as part of the statement target (e.g. `CREATE user:john`). 

If you omit the ID, SurrealDB automatically generates a random identifier for you. 

Furthermore, `CREATE` returns the fully written record (including default values and generated IDs) back to your application client instantly, saving you from running secondary lookup queries.

---

### (2) Record ID Generation Behavior
-   **Specific ID:** `CREATE user:john` $\rightarrow$ Writes exactly to `user:john`. If the record already exists, the query fails with a duplicate key error (unless overridden).
-   **Auto-Generated ID:** `CREATE user` $\rightarrow$ Writes to `user:<random_string>` (e.g., `user:a9f8g...`).

---

### (3) Reality Metaphor (Filing Folders)
Imagine storing a new customer file:
-   **SQL `INSERT`:** You write a list of values on a piece of paper, toss it into a machine, and the machine prints a number `5` at the top and files it.
-   **SurrealQL `CREATE`:** You take a blank Manila folder. 
    -   You write the label tab directly: **`user:john`**. 
    -   You write their name inside and slide it into the cabinet. 
    -   If you don't write a label, the clerk stamps a random code tab for you.

---

### (4) Code Examples

#### Creating Records in SurrealQL
Observe the different creation syntaxes:

```sql
-- 1. Create a record with a specific human-readable ID
CREATE user:tobie SET name = "Tobie", age = 30;

-- 2. Create a record with an auto-generated random ID
-- (Returns the created document with its random ID, e.g. user:t5y8...)
CREATE user SET name = "Alice", age = 25;

-- 3. Create a record with a specific generator function ID
CREATE post:ulid() SET title = "SurrealDB CRUD Syntax";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to insert records using PostgreSQL-style parenthesis column-value syntax with the 'CREATE' statement

**The mistake:** Writing `CREATE user (name, age) VALUES ("John", 30);` to insert data.

**Why it's wrong:** The `CREATE` keyword in SurrealQL does not support bracketed column/value lists. 

Running this syntax will trigger a database query compiler parser error.

**Fix: Use the `SET` keyword (or `CONTENT` JSON, covered next) to declare record properties, or switch to the SQL-compatible `INSERT` keyword (covered in Term #32):**

```sql
-- BAD
CREATE user (name, age) VALUES ("John", 30);

-- GOOD (Using CREATE SET)
CREATE user SET name = "John", age = 30;

-- GOOD (Using INSERT)
INSERT INTO user (name, age) VALUES ("John", 30);
```

---



### Mistake 2: Using `CREATE` on Existing Record IDs

**The mistake:** Executing `CREATE user:alice SET name = 'Alice';` when `user:alice` already exists in the table.

**Why it's wrong:** `CREATE` throws a primary key collision error if the target record ID exists. Use `UPSERT` or `UPDATE` if updating existing records is intended.

*Incorrect:*
```surrealql
-- When user:alice exists:
CREATE user:alice SET name = "Alice"; // ❌ Error: Record user:alice already exists!
```

*Fix:*
```surrealql
UPSERT user:alice SET name = "Alice"; // Safely creates or updates
```

### Mistake 3: Expecting `CREATE` Without Table Name to Select Default Tables

**The mistake:** Writing `CREATE SET name = 'Alice';` without specifying table target.

**Why it's wrong:** `CREATE` requires a target table or target Record ID (e.g. `CREATE user SET ...` or `CREATE user:1 SET ...`).

*Incorrect:*
```surrealql
CREATE SET name = "Alice"; // ❌ Parse error: missing target table
```

*Fix:*
```surrealql
CREATE user SET name = "Alice"; // Specifies target table 'user'
```

## 5. Practice Exercises

### Exercise 1: Creating Records with Explicit Record IDs

**Scenario:**
A user registration service creates user records using deterministic primary key IDs (such as `user:john`) to allow direct single-record lookups.

**Requirements:**
1. Write a `CREATE` query creating record `user:john`.
2. Set scalar fields `name = "John Doe"` and `email = "john@example.com"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:john SET 
>     name = "John Doe",
>     email = "john@example.com";
> ```
>
> #### Technical Explanation
>
> 1. `CREATE table:id` creates a record with an explicit primary key identifier (`user:john`).
> 2. `SET key = val` specifies field assignments cleanly.
> 3. If `user:john` already exists, `CREATE` fails with a record conflict error (unlike `UPSERT`).

---

### Exercise 2: Bulk Document Creation with `CONTENT` Payloads

**Scenario:**
A product inventory service creates a new product document using a single JSON `CONTENT` payload object.

**Requirements:**
1. Create record `product:laptop` using `CONTENT { ... }`.
2. Include fields `name`, `price`, and nested object `specs`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:laptop CONTENT {
>     name: "Pro Laptop 15",
>     price: 1299.99dec,
>     specs: {
>         cpu: "M3 Pro",
>         ram_gb: 18
>     }
> };
> ```
>
> #### Technical Explanation
>
> 1. `CREATE ... CONTENT { ... }` inserts a complete JSON document object in a single statement.
> 2. Supports nested objects (`specs`) and arrays natively within the payload.
> 3. Matches document database (MongoDB) insertion semantics while retaining SQL table structure.

---

### Exercise 3: Automatic Random ID Generation

**Scenario:**
An event logger inserts audit events into table `audit_log` allowing SurrealDB to generate a unique random ID automatically.

**Requirements:**
1. Execute `CREATE audit_log SET action = "login", timestamp = time::now();` without specifying a record ID.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE audit_log SET 
>     action = "login",
>     timestamp = time::now();
> ```
>
> #### Technical Explanation
>
> 1. Omitting the record ID in `CREATE <table>` generates a random unique string ID automatically (e.g. `audit_log:a7x9q2m...`).
> 2. Prevents primary key collisions in high-concurrency event ingestion pipelines.
> 3. Returns the newly generated record object containing its assigned `id`.

---



## 6. Related Terms

- [`CREATE` with Content (`SET` vs `CONTENT`)](create_set_content.md) — Create syntax variants.
- [`INSERT`](insert.md) — The SQL-compatible alternative.
- [`IF NOT EXISTS` / `IF EXISTS`](if_not_exists.md) — Related concept: `IF NOT EXISTS` / `IF EXISTS`.
- [`UPDATE`](update.md) — Related concept: `UPDATE`.

---

## 7. Key Takeaways
- The `CREATE` statement inserts new records into a SurrealDB table.
- Directly supports explicit Record ID assignment (e.g. `CREATE user:john`).
- Omitting the ID triggers automatic random alphanumeric ID generation.
- Returns the fully constructed record (with IDs and defaults) to the client.
- Syntax uses `SET` parameters or `CONTENT` JSON payloads.
- Does not support standard SQL parenthesis column lists (use `INSERT` for that).
- Triggers duplicate key errors if the specified Record ID already exists.
