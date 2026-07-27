# Table

> **Level 1 — What Is SurrealDB?**
> A collection of related records in SurrealDB, equivalent to a PostgreSQL table or a MongoDB collection, supporting both strict schema-enforced (`SCHEMAFULL`) and dynamic flexible (`SCHEMALESS`) modes.

---

## 1. Prerequisites
- [Record](record.md) — The individual data units stored.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Managed at the database level. Tables can be defined explicitly using schema statements or created implicitly on the first record insert).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building full-stack applications, you have different safety needs for different datasets:
-   **Billing Data:** Must be strictly structured. 
    -   You cannot allow typos in column names (like writing `amont` instead of `amount`). 
    -   You need a SQL-style table.
-   **User Settings:** Often dynamic. 
    -   Users add custom themes, integrations, or toggles that change daily. 
    -   You need a NoSQL-style collection.

Historically, you had to run two separate databases (PostgreSQL and MongoDB) to satisfy both needs.

We designed the **Table** in SurrealDB to support both behaviors in a single database. 

A table is a collection of records. 

By default, tables are schema-less (created automatically on write). 

However, you can configure any table to be `SCHEMAFULL` (strict validation) or `SCHEMALESS` (flexible document storage) on a table-by-table basis. 

This allows you to lock down critical transaction tables while keeping metadata tables open and flexible.

---

### (2) Implicit vs. Explicit Creation
-   **Implicit Creation:** If you write a query like `CREATE user:tobie SET name = 'Tobie'`, SurrealDB automatically creates the `user` table as a `SCHEMALESS` table on the fly. No setup required (great for prototyping).
-   **Explicit Creation:** You run the `DEFINE TABLE` statement to specify schemas, indexing rules, and row-level access permissions before inserting data (recommended for production).

---

### (3) Reality Metaphor (Filing Drawers)
Imagine storing client folders in a file cabinet:
-   **PostgreSQL Table:** A drawer containing a **Rigid Grid Organizer**. 
    -   Every folder must have the exact same pre-labeled slots (Name, DOB, Phone). 
    -   You cannot slide a folder in if it has an extra tab.
-   **MongoDB Collection:** A **Large Empty Toy Box**. 
    -   You toss folders, loose papers, envelopes, and receipts inside without sorting.
-   **SurrealDB Table:** A **Customizable Cabinet Drawer**. 
    -   If you define the drawer as **`SCHEMAFULL`**, it slides custom slots into place.
    -   If you define the drawer as **`SCHEMALESS`**, it acts as a wide-open drawer, accepting folders of any size and shape.

---

### (4) Code Examples

#### Implicit and Explicit Table Styles
Compare how tables are used in SurrealQL:

```sql
-- 1. IMPLICIT CREATION (Schema-less by default)
-- Automatically creates the 'post' table and saves the record!
CREATE post:first SET title = "My First Post", views = 1;

-- 2. EXPLICIT CREATION (Schema-full setup)
-- Enforce strict columns on the 'payment' table
DEFINE TABLE payment SCHEMAFULL;

-- Define fields (columns) and types
DEFINE FIELD amount ON payment TYPE decimal;
DEFINE FIELD currency ON payment TYPE string;

-- This write will SUCCEED:
CREATE payment:pay01 SET amount = 99.99, currency = "USD";

-- This write will FAIL (schema-full blocks undefined fields like 'tax_id'!):
CREATE payment:pay02 SET amount = 45.00, currency = "EUR", tax_id = 9988;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming that tables must be explicitly defined using DDL schema files before running insert queries

**The mistake:** Writing long table creation scripts during early prototype phases, thinking: *"SurrealDB is SQL, so I must define tables first."*

**Why it's wrong:** SurrealDB is schema-flexible. 

If you do not define a table, it behaves in `SCHEMALESS` mode and creates itself automatically on your first `CREATE` or `INSERT` query. 

Writing verbose schema definitions too early slows down prototyping when variables and fields are shifting daily.

**Fix: Skip table definition queries during early prototype coding to leverage implicit schema-less generation. Compile table definitions (`DEFINE TABLE`) later when your data model stabilizes and you transition to production.**

---



### Mistake 2: Confusing Table Names with Record IDs in `FROM` Clauses

**The mistake:** Writing `SELECT * FROM user:alice` expecting to query all records in the `user` table.

**Why it's wrong:** `user` is the table name (returns all records). `user:alice` is a specific single Record ID.

*Incorrect:*
```surrealql
-- Expecting all users, but specifying single record ID
SELECT * FROM user:alice; // ❌ Returns ONLY user:alice!
```

*Fix:*
```surrealql
-- Querying entire table
SELECT * FROM user; // Returns array of all records in 'user' table
```

### Mistake 3: Dropping Tables using SQL `DROP TABLE` Syntaxes

**The mistake:** Executing `DROP TABLE user;` in SurrealQL.

**Why it's wrong:** SurrealQL uses `REMOVE TABLE table_name;` to delete a table and its schema definitions.

*Incorrect:*
```surrealql
DROP TABLE user; // ❌ Invalid SurrealQL syntax!
```

*Fix:*
```surrealql
REMOVE TABLE user; // Correct SurrealQL table removal
```

## 6. Practice Exercises

### Exercise 1: Table Behavior Diagnostic

**Problem:** You define a table using this SurrealQL command:
`DEFINE TABLE logs SCHEMAFULL;`
State whether the following query will succeed or fail, and explain why:
`CREATE logs:log01 SET message = "Server Ok", user_id = "user:12";`

**Expected output:**
```text
The query will fail. 
Because the `logs` table is defined as `SCHEMAFULL`, it rejects any fields that have not been explicitly registered. 
Since no `DEFINE FIELD` commands were run for `message` or `user_id` on the `logs` table, SurrealDB will block the write.
```

> [!check]- Answer
> - Check the schema validation rules of the `SCHEMAFULL` toggle.
> - Consider if any schema fields have been declared.

---



### Exercise 2: Defining Schemafull Table

**Problem:** Define table `customer` as `SCHEMAFULL` with `DROP` permissions restricted.

**Expected output:**
```text
DEFINE TABLE customer SCHEMAFULL;
```

> [!check]- Answer
> ```surrealql
> DEFINE TABLE customer SCHEMAFULL;
> ```
>
> **Explanation:** `DEFINE TABLE` specifies table schema enforcement and permissions.

### Exercise 3: Dropping Table Contents vs Structure

**Problem:** Command to delete all records in `log` table without removing the table schema (`DELETE log;`).

**Expected output:**
```text
DELETE log;
```

> [!check]- Answer
> ```surrealql
> DELETE log;
> ```
>
> **Explanation:** `DELETE table` deletes all record data while keeping `DEFINE TABLE` schemas intact.

## 7. Related Terms
- [Record](record.md) — The individual data units stored.
- [`SCHEMAFULL` vs `SCHEMALESS`](schemafull_schemaless.md) — The schema modes.

---

## 8. Key Takeaways
- A Table is a collection of records in SurrealDB.
- Directly equivalent to a SQL table or a MongoDB collection.
- Can be created implicitly on write, or explicitly using `DEFINE TABLE`.
- Supports both `SCHEMAFULL` (strict) and `SCHEMALESS` (flexible) modes.
- Mixing schema-full and schema-less tables is allowed in the same database.
- Explicit table definitions support index controls and field assertions.
- Use schema-less tables for fast prototyping; enforce schema-full for production.
