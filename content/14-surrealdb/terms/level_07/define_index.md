# `DEFINE INDEX` (Deep Dive)

> **Level 7 — Indexes, Full-Text Search & Performance**
> The DDL statement in SurrealDB for configuring B-Tree index structures on single or multiple record fields, accelerating equality and range queries by replacing full table scans with $O(\log N)$ logarithmic index searches.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query retrieval context.
- [`WHERE` Clause](../level_03/where.md) — Query filter operations.

---

## 2. Term Category


**Performance / Operations (database index definition DDL)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Secondary Index DDL Creation

**Scenario:**
Create a secondary index `idx_user_email` on table `user` to speed up email lookup queries.

**Requirements:**
1. Define table `user` as `SCHEMAFULL`.
2. Write `DEFINE INDEX idx_user_email ON TABLE user COLUMNS email`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string;
> 
> -- Define secondary index DDL
> DEFINE INDEX idx_user_email ON TABLE user COLUMNS email;
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE INDEX` creates secondary B-tree index structures for fast field lookups.
> 2. Converts $O(N)$ table scans into $O(\log N)$ B-tree index searches.
> 3. Indexes update automatically during record insertions and modifications.
> 
---

### Exercise 2: Unique Index DDL Creation

**Scenario:**
Create a unique index `idx_unique_username` on table `user` ensuring no duplicate usernames can be registered.

**Requirements:**
1. Add `UNIQUE` keyword to index definition.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX idx_unique_username ON TABLE user COLUMNS username UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `UNIQUE` enforces unique constraints at write time, aborting duplicate insertions.
> 2. Protects database integrity against race conditions.
> 3. Combines lookup acceleration with constraint enforcement.
> 
---

### Exercise 3: Dropping Secondary Indexes with `REMOVE INDEX`

**Scenario:**
Drop index `idx_user_email` from table `user`.

**Requirements:**
1. Write `REMOVE INDEX idx_user_email ON TABLE user`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE INDEX idx_user_email ON TABLE user;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE INDEX` drops secondary index structures from storage metadata registers.
> 2. Frees index disk storage and reduces write amplification.
> 3. Table data records remain unaffected.
> 
---



## 6. Related Terms

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

## 7. Key Takeaways
- `DEFINE INDEX` creates B-Tree indexes to replace full table scans with $O(\log N)$ searches.
- Relational equivalent to `CREATE INDEX`; NoSQL equivalent to `createIndex()`.
- Supports exact equality (`=`) and range lookups (`<`, `>`, `BETWEEN`).
- SurrealDB's query planner automatically utilizes active indexes during execution.
- Excessive indexing degrades write performance due to synchronous index updates.
