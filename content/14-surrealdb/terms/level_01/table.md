# Table

> **Level 1 — What Is SurrealDB?**
> A collection of related records in SurrealDB, equivalent to a PostgreSQL table or a MongoDB collection, supporting both strict schema-enforced (`SCHEMAFULL`) and dynamic flexible (`SCHEMALESS`) modes.

---

## 1. Prerequisites

- [Record](record.md) — The individual data units stored.

---

## 2. Term Category


**Schema & Modeling (record collection table entity)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Schemafull Table & Relation Table Setup

**Scenario:**
You are defining schema rules for an e-commerce system: a standard entity table `product` and a graph relation table `purchased` connecting `user` to `product`.

**Requirements:**
1. Define table `product` as `SCHEMAFULL`.
2. Define field `title` as `string` on `product`.
3. Define table `purchased` as `TYPE RELATION IN user OUT product`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Define standard entity table
> DEFINE TABLE product SCHEMAFULL;
> DEFINE FIELD title ON TABLE product TYPE string;
> 
> -- Define graph relation table
> DEFINE TABLE purchased TYPE RELATION IN user OUT product;
> ```
>
> #### Technical Explanation
>
> 1. Standard tables (`product`) store entity records containing scalar values, nested documents, and arrays.
> 2. Relation tables (`purchased`) defined with `TYPE RELATION` store graph edges with mandatory `in` and `out` record links.
> 3. Specifying `IN user OUT product` constrains the relation edge endpoints strictly to valid user and product records.

---

### Exercise 2: Table Inspection with `INFO FOR TABLE`

**Scenario:**
A database administrator wants to inspect all field definitions, indexes, and event triggers configured on table `product`.

**Requirements:**
1. Write the SurrealQL statement to inspect schema metadata for table `product`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> INFO FOR TABLE product;
> ```
>
> #### Technical Explanation
>
> 1. `INFO FOR TABLE <table>` returns an object containing defined fields, indexes, events, and permissions for the target table.
> 2. Facilitates schema verification and automated DDL migration checking.
> 3. Provides complete visibility into active table-level constraint rules.

---

### Exercise 3: Dropping a Table Definition with `REMOVE TABLE`

**Scenario:**
A database cleanup migration needs to drop an obsolete table `legacy_logs` and all its associated schema definitions.

**Requirements:**
1. Write the SurrealQL DDL statement to remove table `legacy_logs`.
2. Explain the difference between `DELETE legacy_logs` and `REMOVE TABLE legacy_logs`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE TABLE legacy_logs;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE TABLE` is a DDL statement that drops the table schema metadata, fields, indexes, and stored records completely.
> 2. `DELETE legacy_logs` is a DML statement that deletes stored data records while preserving the table schema definition.
> 3. `REMOVE TABLE` corresponds to SQL `DROP TABLE`.

---



## 6. Related Terms

- [Record](record.md) — The individual data units stored.
- [`SCHEMAFULL` vs `SCHEMALESS`](schemafull_schemaless.md) — The schema modes.
- [Namespace & Database](namespace_database.md) — Related concept: Namespace & Database.
- [Record ID (`table:id`)](record_id.md) — Related concept: Record ID (`table:id`).
- [`IF NOT EXISTS` / `IF EXISTS`](../level_03/if_not_exists.md) — Related concept: `IF NOT EXISTS` / `IF EXISTS`.
- [`DEFINE TABLE`](../level_04/define_table.md) — Related concept: `DEFINE TABLE`.

---

## 7. Key Takeaways
- A Table is a collection of records in SurrealDB.
- Directly equivalent to a SQL table or a MongoDB collection.
- Can be created implicitly on write, or explicitly using `DEFINE TABLE`.
- Supports both `SCHEMAFULL` (strict) and `SCHEMALESS` (flexible) modes.
- Mixing schema-full and schema-less tables is allowed in the same database.
- Explicit table definitions support index controls and field assertions.
- Use schema-less tables for fast prototyping; enforce schema-full for production.
