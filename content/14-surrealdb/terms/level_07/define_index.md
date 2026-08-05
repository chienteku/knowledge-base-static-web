# `DEFINE INDEX` (Deep Dive)

> **Level 7 — Indexes, Full-Text Search & Performance**
> The DDL statement in SurrealDB for configuring B-Tree index structures on single or multiple record fields, accelerating equality and range queries by replacing full table scans with $O(\log N)$ logarithmic index searches.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query retrieval context.
- [`WHERE` Clause](../level_03/where.md) — Query filter operations.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the index management engine. Maintains ordered B-Tree nodes on persistent disk storage to speed up lookups).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Without indexes, finding records in a large table requires a **Full Table Scan**:
- The database engine reads every record from disk sequentially to test the `WHERE` condition.
- On a table with 1,000,000 records, executing a full scan consumes heavy CPU and disk I/O, causing query latency to spike.

In SQL (PostgreSQL), developers create indexes using `CREATE INDEX`. In MongoDB, developers call `createIndex()`.

We designed the **`DEFINE INDEX`** statement in SurrealQL to provide explicit index management. By declaring B-Tree indexes on frequently queried fields, SurrealDB builds balanced search trees. When a query filters by an indexed field, the engine skips table scans and navigates the tree in logarithmic time ($O(\log N)$), returning query results in milliseconds.

---

### (2) How B-Tree Indexes Work
Default indexes in SurrealDB use B-Tree (Balanced Tree) algorithms:
- **Sorted Keys:** Stores values in a self-balancing binary-like tree structure.
- **Range & Equality Support:** Optimized for exact matches (`=`) and range lookups (`<`, `>`, `<=`, `>=`, `BETWEEN`).
- **Write Trade-off:** Every `CREATE`, `UPDATE`, or `DELETE` on an indexed field requires updating the B-Tree structure on disk, incurring a small write overhead.

---

### (3) Reality Metaphor (Library Card Catalog)
Imagine searching for a book in a 10-story library:
- **Full Table Scan (No Index):** Walking down every aisle on all 10 floors, reading the title on every single book spine until you find the right one.
- **B-Tree Index (`DEFINE INDEX`):** Consulting the **Alphabetical Card Catalog** at the main entrance.
  - You open the drawer labeled "S", flip to "SurrealDB", and read the exact floor, aisle, and shelf number (`table:id`).
  - You walk directly to that shelf without checking any other books.

---

### (4) Code Examples

#### Creating B-Tree Indexes in SurrealQL

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;

-- 1. Defining a standard B-Tree index on a single column
DEFINE INDEX user_email ON user COLUMNS email;

-- 2. Defining an index on a numeric column for fast range lookups
DEFINE INDEX user_age ON user COLUMNS age;

-- 3. Querying indexed fields (SurrealDB automatically uses the index planner)
SELECT * FROM user WHERE email = "alice@example.com";
SELECT * FROM user WHERE age >= 21 AND age <= 35;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Over-indexing write-heavy tables, degrading database insert and update throughput

**The mistake:** Defining B-Tree indexes on every field of a high-throughput telemetry table that receives 10,000 writes per second.

**Why it's wrong:** Every index defined on a table must be updated synchronously during write transactions. If a table has 8 indexes, a single `CREATE` statement requires 9 write operations (1 record + 8 index updates), degrading write performance.

**Fix: Only define indexes on fields that are frequently referenced in `WHERE` filters or `ORDER BY` clauses.**

---



### Mistake 2: Creating Duplicate Index Names Across Different Fields on the Same Table

**The mistake:** Executing `DEFINE INDEX user_idx ON TABLE user FIELDS name;` followed by `DEFINE INDEX user_idx ON TABLE user FIELDS email;`.

**Why it's wrong:** Index names must be unique per table. Re-using an index name without dropping it first throws a duplicate index definition error.

*Incorrect:*
```surrealql
DEFINE INDEX user_idx ON TABLE user FIELDS name;
DEFINE INDEX user_idx ON TABLE user FIELDS email; // ❌ Index name collision!
```

*Fix:*
```surrealql
DEFINE INDEX user_name_idx ON TABLE user FIELDS name;
DEFINE INDEX user_email_idx ON TABLE user FIELDS email;
```

### Mistake 3: Indexing High-Churn Fields without Assessing Maintenance Overhead

**The mistake:** Creating 15 indexes on a high-frequency real-time logging table receiving 50,000 writes/sec.

**Why it's wrong:** Every write operation must update all 15 indexes synchronously, degrading write throughput performance. Keep indexes minimal on high-write tables.

*Incorrect:*
```surrealql
-- Over-indexing high-write logging table
```

*Fix:*
```surrealql
Keep indexes scoped strictly to required query filter fields
```

## 6. Practice Exercises

### Exercise 1: Index Optimization Analysis

**Problem:** You have a `transactions` table with 5,000,000 records.
The query `SELECT * FROM transactions WHERE status = "pending";` takes 3 seconds to run.
Write the SurrealQL statement to create a B-Tree index named `idx_status` on the `status` field to accelerate this query.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE INDEX idx_status ON transactions COLUMNS status;
> ```
> - Use the `DEFINE INDEX` DDL statement.
> - Specify the target table `transactions` and column `status`.

---



### Exercise 2: Basic Single-Field Index Definition

**Problem:** Define index `user_email_idx` on `user` table for `email` field.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE INDEX user_email_idx ON TABLE user FIELDS email;
> ```
> ```surrealql
> DEFINE INDEX user_email_idx ON TABLE user FIELDS email;
> ```
>
> **Explanation:** `DEFINE INDEX` accelerates equality and range lookup queries.

---

### Exercise 3: Removing Index

**Problem:** Command to drop index `user_email_idx` from `user` table (`REMOVE INDEX user_email_idx ON TABLE user;`).

**Expected output:**
> [!check]- Answer
> ```text
> REMOVE INDEX user_email_idx ON TABLE user;
> ```
> ```surrealql
> REMOVE INDEX user_email_idx ON TABLE user;
> ```
>
> **Explanation:** `REMOVE INDEX` drops specified index structures.

## 7. Related Terms

- [Unique Index](unique_index.md) — Unique constraints.
- [Composite Index](composite_index.md) — Multi-column indexes.
- [Indexing Record Link Fields](indexing_record_links.md) — Relationship index optimization.
- [`SEARCH` Index (Full-Text Search)](../level_04/search_index.md) — Related concept: `SEARCH` Index (Full-Text Search).
- [Vector Index (Overview)](../level_04/vector_index.md) — Related concept: Vector Index (Overview).
- [Geospatial Index](geospatial_index.md) — Related concept: Geospatial Index.
- [`DEFINE INDEX ... HNSW` (Approximate Vector Search)](hnsw_index.md) — Related concept: `DEFINE INDEX ... HNSW` (Approximate Vector Search).
- [Query Explanation & Performance](query_explanation.md) — Related concept: Query Explanation & Performance.
- [Search Index & `DEFINE ANALYZER`](search_index_analyzer.md) — Related concept: Search Index & `DEFINE ANALYZER`.
- [Vector Search Index (ML/AI)](vector_search.md) — Related concept: Vector Search Index (ML/AI).

---

## 8. Key Takeaways
- `DEFINE INDEX` creates B-Tree indexes to replace full table scans with $O(\log N)$ searches.
- Relational equivalent to `CREATE INDEX`; NoSQL equivalent to `createIndex()`.
- Supports exact equality (`=`) and range lookups (`<`, `>`, `BETWEEN`).
- SurrealDB's query planner automatically utilizes active indexes during execution.
- Excessive indexing degrades write performance due to synchronous index updates.
