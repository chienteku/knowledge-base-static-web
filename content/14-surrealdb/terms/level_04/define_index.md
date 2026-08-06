# `DEFINE INDEX`

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to create database indexes on fields or paths of a table, accelerating query read performance by mapping values to record storage addresses.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`DEFINE FIELD`](define_field.md) — The properties indexed.

---

## 2. Term Category


**Performance / Operations (database index definition statement)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a table contains only a few dozen records, finding a specific user is instant: the database reads all records (Full Table Scan) and filters them. 

However, under millions of records:
-   Scanning every document cover-to-cover takes seconds.
-   Database queries block, slowing down your application.

In SQL, you write `CREATE INDEX index_name ON table (columns);`. 

In MongoDB, you call `db.collection.createIndex({ field: 1 })`.

We designed the **`DEFINE INDEX`** DDL statement in SurrealQL to manage indexes. 

It maps columns to record addresses. 

SurrealDB supports standard B-Tree indexes, composite indexes (multiple columns), nested path indexes, and specialized text search and vector indexes, allowing you to optimize query execution speeds across all data models.

---

### (2) Indexing Strategies

-   **Standard B-Tree Index:** The default. Optimized for numeric, string, and chronological comparisons (`=`, `<`, `>`).
-   **Composite Index:** Combines multiple columns in a single index table (e.g. `COLUMNS last_name, first_name`). Useful for query filters targeting both fields.
-   **Nested Path Index:** Indexes keys inside sub-objects (e.g. `COLUMNS address.zip_code`).

---

### (3) Reality Metaphor (Book Subject Indexes)
Imagine searching a 500-page cooking manual:
-   **No Index:** Reading the manual page-by-page from cover-to-cover to find every recipe that uses "Basil". It takes hours.
-   **`DEFINE INDEX`:** Compiling a **Subject Index Index Section** at the back of the book. 
    -   The keyword list is sorted alphabetically. 
    -   You look up the word "Basil", and it points directly to pages 45, 120, and 340. 
    -   You flip straight to those pages in seconds.

---

### (4) Code Examples

#### Creating Indexes in SurrealQL
Let's optimize a user profiles collection:

```sql
DEFINE TABLE user SCHEMAFULL;

DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD address ON user TYPE object;
DEFINE FIELD address.zip_code ON user TYPE string;

-- 1. Define a standard single-column index on email
DEFINE INDEX user_email ON user COLUMNS email;

-- 2. Define a composite index (combines age and zip_code)
-- Speeds up queries like: WHERE age = 30 AND address.zip_code = "75001"
DEFINE INDEX user_age_zip ON user COLUMNS age, address.zip_code;

-- 3. Run queries that utilize these indexes
SELECT * FROM user WHERE email = "alice@example.com";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating indexes on fields that are write-heavy but rarely targeted in queries, slowing down database writes

**The mistake:** Defining indexes on fields like `updated_at`, `login_token`, or `payload` on tables where data is updated frequently but never filtered or sorted using those fields.

**Why it's wrong:** Indexes are not free. 

Every time you run `CREATE`, `UPDATE`, or `DELETE`, SurrealDB must write to the index tables to keep them synchronized. 

If a table is write-heavy, excessive indexing degrades write speeds and wastes disk space.

**Fix: Only define indexes on fields that are frequently referenced inside `WHERE` filters or `ORDER BY` clauses.**

---



### Mistake 2: Creating Duplicate Unique Index Definitions Without Removing Old Index

**The mistake:** Re-defining an existing index with different columns without `IF NOT EXISTS` or dropping the old index.

**Why it's wrong:** Attempting to create an index with an existing name throws a duplicate index definition error.

*Incorrect:*
```surrealql
DEFINE INDEX user_email ON TABLE user FIELDS email UNIQUE; // Fails if user_email exists!
```

*Fix:*
```surrealql
DEFINE INDEX IF NOT EXISTS user_email ON TABLE user FIELDS email UNIQUE;
```

### Mistake 3: Indexing Non-Existent Fields on `SCHEMAFULL` Tables

**The mistake:** Creating an index on a field that was not defined on a `SCHEMAFULL` table.

**Why it's wrong:** `SCHEMAFULL` tables ignore or reject fields that have not been declared with `DEFINE FIELD`.

*Incorrect:*
```surrealql
DEFINE TABLE user SCHEMAFULL;
DEFINE INDEX idx ON TABLE user FIELDS missing_field; // ❌ Undeclared field!
```

*Fix:*
```surrealql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD active ON TABLE user TYPE bool;
DEFINE INDEX idx ON TABLE user FIELDS active;
```

## 5. Practice Exercises

### Exercise 1: Secondary Unique Index Creation

**Scenario:**
Create a unique secondary index on table `user` to guarantee that no two users can share the same `email` address.

**Requirements:**
1. Write the `DEFINE INDEX` statement for index `user_email_idx` on field `email`.
2. Apply the `UNIQUE` constraint keyword.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string;
> 
> -- Define unique secondary index
> DEFINE INDEX user_email_idx ON TABLE user COLUMNS email UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE INDEX` creates secondary index structures for fast field lookups.
> 2. `UNIQUE` enforces uniqueness constraints, aborting writes on duplicate values.
> 3. Accelerates `SELECT * FROM user WHERE email = ...` lookups.

---

### Exercise 2: Multi-Column Composite Index Creation

**Scenario:**
An e-commerce query frequently filters products by `category` and `status` simultaneously. Create a composite index covering both columns.

**Requirements:**
1. Write `DEFINE INDEX product_cat_status` covering `category` and `status`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX product_cat_status ON TABLE product COLUMNS category, status;
> ```
>
> #### Technical Explanation
>
> 1. Composite indexes (`COLUMNS col1, col2`) index multi-field combinations together.
> 2. Accelerates queries containing multi-field `WHERE` filter clauses.
> 3. Optimizes B-tree index page traversals for complex queries.

---

### Exercise 3: Removing Secondary Indexes with `REMOVE INDEX`

**Scenario:**
Drop an obsolete index `temp_idx` from table `product`.

**Requirements:**
1. Write the `REMOVE INDEX` DDL statement.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE INDEX temp_idx ON TABLE product;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE INDEX` drops secondary index structures from storage metadata.
> 2. Frees index storage space on disk and reduces write amplification.
> 3. Table data records remain unaffected.

---



## 6. Related Terms
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`UNIQUE` Index](unique_index.md) — Unique constraints.
- [`SEARCH` Index](search_index.md) — Full-text search indexing.

---

## 7. Key Takeaways
- `DEFINE INDEX` creates database indexes to accelerate query reads.
- Relational equivalent to `CREATE INDEX`; NoSQL equivalent to `createIndex()`.
- Supports single-column, composite, and nested dot-notation path indexes.
- Default index format is B-Tree (ideal for comparisons and ordering).
- Bypasses full table scans, enabling fast constant-time lookup paths.
- Indexes slow down database writes; avoid over-indexing unused fields.
- Indexes are updated automatically during write transactions.
