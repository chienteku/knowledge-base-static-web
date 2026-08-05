# `CREATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL statement used to create new records inside a table, supporting both manual Record ID assignment and automatic random ID generation.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed by the server query processor. Runs within an implicit or explicit ACID write transaction block).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Write Statement Construction

**Problem:** Write the SurrealQL statement to create a record in the `products` table.
-   The record ID must be `"product:laptop_pro"`.
-   The field `name` must be set to `"Laptop Pro"`.
-   The field `price` must be set to `1200.00dec`.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE product:laptop_pro SET name = "Laptop Pro", price = 1200.00dec;
> ```
> - The target record address is `product:laptop_pro`.
> - Use the `SET` keyword followed by comma-separated field assignments.

---



### Exercise 2: Creating Record with Random ID

**Problem:** Create new record in `article` table setting `title = "New Post"` letting SurrealDB generate ID.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE article SET title = "New Post";
> ```
> ```surrealql
> CREATE article SET title = "New Post";
> ```
>
> **Explanation:** `CREATE table` automatically generates a unique Record ID.

---

### Exercise 3: Creating Multiple Records in One Statement

**Problem:** Create two records in `category` table using array content `[{ name: "Tech" }, { name: "Design" }]`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE category CONTENT [{ name: "Tech" }, { name: "Design" }];
> ```
> ```surrealql
> CREATE category CONTENT [{ name: "Tech" }, { name: "Design" }];
> ```
>
> **Explanation:** `CREATE table CONTENT [ ... ]` inserts multiple records in a single statement.

## 7. Related Terms

- [`CREATE` with Content (`SET` vs `CONTENT`)](create_set_content.md) — Create syntax variants.
- [`INSERT`](insert.md) — The SQL-compatible alternative.
- [`IF NOT EXISTS` / `IF EXISTS`](if_not_exists.md) — Related concept: `IF NOT EXISTS` / `IF EXISTS`.
- [`UPDATE`](update.md) — Related concept: `UPDATE`.

---

## 8. Key Takeaways
- The `CREATE` statement inserts new records into a SurrealDB table.
- Directly supports explicit Record ID assignment (e.g. `CREATE user:john`).
- Omitting the ID triggers automatic random alphanumeric ID generation.
- Returns the fully constructed record (with IDs and defaults) to the client.
- Syntax uses `SET` parameters or `CONTENT` JSON payloads.
- Does not support standard SQL parenthesis column lists (use `INSERT` for that).
- Triggers duplicate key errors if the specified Record ID already exists.
