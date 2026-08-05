# `INSERT`

> **Level 3 — CRUD Operations in SurrealQL**
> The SQL-compatible database statement in SurrealDB used to add new records to a table, supporting bulk multi-row inserts and traditional column-value listings.

---

## 1. Prerequisites

- [`CREATE`](create.md) — The native write equivalent.
- [Table](../level_01/table.md) — Inserting records into defined or dynamic tables.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Enforces standard SQL query parser rules. Designed for fast bulk loading of tabular records into the database storage engine).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While SurrealQL's native `CREATE` statement is powerful for single-document writes, it lacks the structure for bulk tabular inserts:
-   If you are migrating a legacy PostgreSQL database, your export script contains thousands of lines of `INSERT INTO table (cols) VALUES (vals)` statements.
-   Re-writing all of these to `CREATE` statements would take days.

We designed the **`INSERT`** statement in SurrealQL to guarantee **100% SQL compatibility**. 

It supports standard SQL column lists and multi-row `VALUES` blocks out of the box. 

This allows you to import legacy SQL tables directly into SurrealDB with zero query modifications while leveraging SurrealDB's features (such as passing Record IDs inside the values lists).

---

### (2) Supported Syntaxes
SurrealDB supports two styles of `INSERT`:

#### 1. SQL-Tabular Style (Columns & Values)
`INSERT INTO user (id, name, age) VALUES (user:john, 'John', 30), (user:alice, 'Alice', 25);`
-   *Pros:* Standard SQL format. Excellent for bulk inserts.

#### 2. Object Style (JSON-like)
`INSERT INTO user { id: user:john, name: 'John', age: 30 };`
-   *Pros:* Clean NoSQL format.

---

### (3) Reality Metaphor (Handcrafting vs. Assembly Lines)
-   **`CREATE` Statement (Handcrafting):** A jeweler assembling a custom watch at their workbench. They carve the gears, label the casing, and place it in the display case. (Excellent for individual, custom documents).
-   **`INSERT` Statement (Assembly Line):** A **Factory Stamping Machine**. 
    -   You load a template tray containing 10 watch parts (column template), drop in the materials (values list), and the machine stamps out 10 matching watches in parallel.

---

### (4) Code Examples

#### SQL-Style Multi-Row Inserts in SurrealQL
Observe how multiple records are inserted in a single query statement:

```sql
-- 1. Standard SQL tabular insertion (Multiple rows!)
INSERT INTO product (id, name, price) VALUES
  (product:phone, "Smart Phone", 699.00dec),
  (product:tablet, "Tablet Pro", 899.00dec),
  (product:charger, "Fast Charger", 29.99dec);

-- 2. Object-style insertion
INSERT INTO customer {
  id: customer:john,
  name: "John Doe",
  loyalty_member: true
};

-- 3. Query records to verify
SELECT * FROM product;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the mandatory SQL 'INTO' keyword when writing 'INSERT' statements, causing compiler crashes

**The mistake:** Writing `INSERT user (name) VALUES ("Alice");` (missing `INTO`), trying to match the syntax of the `CREATE` statement (`CREATE user ...`).

**Why it's wrong:** The `INSERT` statement is parsed using strict SQL rules. 

Unlike `CREATE`, the `INTO` keyword is mandatory for `INSERT`. 

Omitting it causes the query compiler to throw syntax parsing errors.

**Fix: Always write `INSERT INTO <table>` when using the insert keyword:**

```sql
-- BAD
INSERT user (name) VALUES ("Alice");

-- GOOD
INSERT INTO user (name) VALUES ("Alice");
```

---



### Mistake 2: Confusing `INSERT` SQL Syntax with `CREATE` Statement Syntax

**The mistake:** Writing `INSERT INTO user SET name = 'Alice';` (SyntaxError).

**Why it's wrong:** SurrealQL `INSERT` requires `INSERT INTO table [ { ... }, { ... } ]` or `INSERT INTO table (fields) VALUES (values)`. `SET` is used with `CREATE` or `UPDATE`.

*Incorrect:*
```surrealql
INSERT INTO user SET name = "Alice"; // ❌ Invalid syntax!
```

*Fix:*
```surrealql
INSERT INTO user { name: "Alice" };
-- Or:
CREATE user SET name = "Alice";
```

### Mistake 3: Using `INSERT` for Updating Existing Records

**The mistake:** Using `INSERT INTO user:alice { name: 'Alice Smith' };` to update an existing user.

**Why it's wrong:** `INSERT` fails on primary key collisions if the Record ID already exists. Use `UPDATE` or `UPSERT` or `INSERT ... ON DUPLICATE KEY UPDATE`.

*Incorrect:*
```surrealql
INSERT INTO user:alice { name: "Alice Smith" }; // ❌ Primary key collision error!
```

*Fix:*
```surrealql
UPDATE user:alice SET name = "Alice Smith"; // Correct update statement
```

## 6. Practice Exercises

### Exercise 1: Bulk Insert Construction

**Problem:** Write the SQL-compatible SurrealQL query to insert two records into the `tags` table in a single statement:
-   Row 1: ID is `tags:rust`, `popularity` is `95`.
-   Row 2: ID is `tags:javascript`, `popularity` is `90`.

**Expected output:**
> [!check]- Answer
> ```sql
> INSERT INTO tags (id, popularity) VALUES (tags:rust, 95), (tags:javascript, 90);
> ```
> - The statement must start with `INSERT INTO`.
> - Separate the value rows using parentheses and commas: `VALUES (row1), (row2)`.

---



### Exercise 2: Bulk Batch Insertion

**Problem:** Bulk insert 2 records into `tag` table using `INSERT INTO tag [ { name: "a" }, { name: "b" } ]`.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO tag [ { name: "a" }, { name: "b" } ];
> ```
> ```surrealql
> INSERT INTO tag [ { name: "a" }, { name: "b" } ];
> ```
>
> **Explanation:** `INSERT INTO table [ ... ]` performs bulk record insertions.

---

### Exercise 3: INSERT VALUES Syntax

**Problem:** Insert a record into `user` table using `VALUES` syntax.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO user (name, age) VALUES ("Alice", 30);
> ```
> ```surrealql
> INSERT INTO user (name, age) VALUES ("Alice", 30);
> ```
>
> **Explanation:** `INSERT (fields) VALUES (vals)` provides SQL-style bulk insertion syntax.

## 7. Related Terms

- [`CREATE`](create.md) — The native write equivalent.
- [`INSERT ... ON DUPLICATE KEY UPDATE`](insert_on_duplicate.md) — The SQL upsert modifier.

---

## 8. Key Takeaways
- The `INSERT` statement provides standard SQL compatibility for database writes.
- Direct NoSQL equivalent to PostgreSQL's `INSERT INTO` command.
- Supports bulk multi-row insertions in a single query (`VALUES (a), (b)`).
- Requires the mandatory `INTO` keyword (`INSERT INTO <table>`).
- Fused Record IDs can be passed directly inside values lists (e.g. `user:john`).
- Supports an alternative JSON-object list insertion syntax.
- Ideal for importing legacy SQL dump files directly into SurrealDB.
