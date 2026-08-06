# B-tree Index

> **Level 7 — Indexes & Query Performance**
> The default index structure in PostgreSQL that organizes column keys into a sorted, self-balancing search tree, optimized for high-speed equality and range queries.

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The parent performance concept.

---

## 2. Term Category

**Performance / Optimization** (Default B-Tree Index Structure): B-Tree Index is PostgreSQL's default self-balancing tree index optimizing equality (`=`) and range (`<`, `<=`, `>`, `>=`, `BETWEEN`) queries in $O(\log N)$ time.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (The default index type. If you run `CREATE INDEX` without specifying a `USING` clause, Postgres compiles a B-tree index by default).

### (1) Design Motivation — "Why did we design this?"
Relational databases need a default index type that handles the most common types of SQL queries:
-   Equality: `WHERE id = 45`
-   Inequalities: `WHERE price < 20.00`
-   Ranges: `WHERE score BETWEEN 80 AND 100`
-   Sorting: `ORDER BY created_at DESC`

To handle these, the index structure must store data in a sorted sequence, but allow rapid inserts and deletes without becoming lopsided.

We designed the **B-tree** (Balanced Tree) index to solve this. 

It is a hierarchical tree structure:
-   **Root Node:** The starting point of the search.
-   **Internal Nodes:** Directional signs routing the search down the tree.
-   **Leaf Nodes:** The bottom layer storing the sorted index values along with their disk row pointers (TIDs).

The "B" in B-tree stands for **Balanced**. 

The B-tree algorithm automatically balances itself on every write: it guarantees that every single leaf node at the bottom of the tree is at the **exact same depth** (number of levels) from the root node.

Because of this symmetry, locating any record in a 10-million-row table takes the exact same number of index jumps (typically 3 or 4 page reads), making search speeds predictable and fast.

---

### (2) Supported Operators
Because B-trees keep their keys in sorted order, they support the following comparison operators:
-   `=`, `<`, `>`, `<=`, `>=`
-   `BETWEEN`, `IN`
-   Prefix text match wildcards: `LIKE 'prefix%'` (since sorting alphabetically groups prefix strings together).

---

### (3) Reality Metaphor
Imagine a directory map in a massive shopping mall:
-   **Unbalanced List (No Index):** You walk through every single corridor checking storefronts one-by-one until you find the electronics store.
-   **B-tree Index:** You walk to the central lobby directory map:
    -   *Root:* Sign says: *"A-M Wing left, N-Z Wing right."* (First jump).
    -   *Internal:* You walk left. Sign says: *"A-G Floor 1, H-M Floor 2."* (Second jump).
    -   *Leaf:* You go to Floor 1. Sign lists: *"Apple Store: Section 4."* (Third jump).
-   No matter what store you search for, you always find its location in exactly 3 steps.

---

### (4) Code Examples

#### Creating a B-Tree Index
The default index creation statement compiles a B-tree:

```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY,
  item_name VARCHAR(100),
  price NUMERIC(10,2)
);

-- 1. Implicit B-tree (default)
CREATE INDEX idx_inventory_price ON inventory(price);

-- 2. Explicit B-tree (using USING clause)
CREATE INDEX idx_inventory_name ON inventory USING btree(item_name);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting a B-tree index to speed up leading wildcard searches (`%suffix`)

**The mistake:** Creating a B-tree index on `item_name` and writing queries like `WHERE item_name LIKE '%cable'`.

**Why it's wrong:** B-tree indexes are sorted alphabetically from left to right. If you search for words ending with `'cable'`, the database cannot use the sorted sequence because it doesn't know the starting letters. It must discard the B-tree index and scan the entire table on disk.

**Fix: B-tree indexes only support prefix wildcard searches (e.g. `LIKE 'cable%'`). If you need suffix or general substring searches, use a Trigram Index or Full-Text search GIN index.**

---



### Mistake 2: Using B-Tree Indexes for Full-Text Substring Searches (`'%search%'`)

**The mistake:** Creating a standard B-Tree index on `title` and executing `WHERE title LIKE '%postgres%'`.

**Why it's wrong:** Standard B-Tree indexes support ONLY prefix matches (`'postgres%'`). Un-anchored leading wildcards (`'%postgres%'`) cannot navigate B-Trees, forcing a `Seq Scan`. Use GIN trigram indexes.

*Incorrect:*
```sql
CREATE INDEX idx_title ON posts (title);
SELECT * FROM posts WHERE title LIKE '%postgres%'; -- ❌ Seq Scan!
```

*Fix:*
```sql
CREATE INDEX idx_title_trgm ON posts USING GIN (title gin_trgm_ops);
```

### Mistake 3: Creating Duplicate B-Tree Indexes on the Same Column

**The mistake:** Creating `CREATE INDEX idx_a ON t (email);` and `CREATE INDEX idx_b ON t (email);`.

**Why it's wrong:** Duplicate indexes consume storage disk space, bloat RAM, and slow down `INSERT`/`UPDATE` operations without adding query benefits. Drop duplicate indexes.

*Incorrect:*
```sql
// Creating two identical indexes on email column
```

*Fix:*
```sql
Drop duplicate indexes using DROP INDEX
```

## 5. Practice Exercises

### Exercise 1: Creating Default B-Tree Indexes for Range Lookups

**Scenario:**
Create a B-tree index on `orders(created_at)` to accelerate date range queries.

**Requirements:**
1. Execute `CREATE INDEX idx_orders_created_at ON orders(created_at)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_created_at 
> ON orders (created_at);
> 
> SELECT id, customer_id, total_cents 
> FROM orders 
> WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31';
> ```
>
> #### Technical Explanation
>
> 1. B-tree (Balanced Tree) is PostgreSQL's default index type.
> 2. Maintains keys in sorted order, providing $O(\log N)$ equality and range searches (`<`, `<=`, `>`, `>=`, `BETWEEN`).
> 3. Accelerates `created_at` range scans.
> 
---

### Exercise 2: Indexing Foreign Key Columns

**Scenario:**
Create a B-tree index on `orders(user_id)` to optimize join performance.

**Requirements:**
1. Execute `CREATE INDEX idx_orders_user_id ON orders(user_id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_user_id 
> ON orders (user_id);
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL foreign key constraints do NOT create secondary indexes automatically.
> 2. Indexing foreign keys converts sequential scans into fast B-tree index lookups during `JOIN` queries.
> 3. Mandatory schema optimization rule.
> 
---

### Exercise 3: Inspecting B-Tree Index Execution with `EXPLAIN`

**Scenario:**
Verify that a query filtering `id = 42` uses `Index Scan` on the B-tree index.

**Requirements:**
1. Execute `EXPLAIN ANALYZE SELECT * FROM orders WHERE id = 42`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> EXPLAIN ANALYZE 
> SELECT * FROM orders WHERE id = 42;
> ```
>
> #### Technical Explanation
>
> 1. Displays `Index Scan using orders_pkey on orders`.
> 2. `Execution Time` drops from 50ms (Seq Scan) to 0.05ms (Index Scan).
> 3. Confirms B-tree index usage.
> 
---



## 6. Related Terms
- [Index (Concept)](index_concept.md) — The parent performance concept.
- [`CREATE INDEX` / `DROP INDEX`](create_drop_index.md) — SQL commands.
- [GIN Index](gin_index.md) — The index type for non-scalar types.
- [Composite Index (Multi-column)](composite_index.md) — Related concept: Composite Index (Multi-column).
- [Expression Index (Functional Index)](expression_index.md) — Related concept: Expression Index (Functional Index).
- [Partial Index](partial_index.md) — Related concept: Partial Index.
- [Unique Index](unique_index.md) — Unique index.

---

## 7. Key Takeaways
- B-tree is the default, self-balancing index type in PostgreSQL.
- Organizes data keys in sorted order inside balanced hierarchy nodes.
- Guarantees symmetrical node depths, making lookup times predictable.
- Optimizes equality (`=`), inequalities (`<`, `>`), ranges (`BETWEEN`), and sorting.
- Supports prefix text matches (`LIKE 'A%'`), but fails on leading wildcards.
- Does not optimize multi-value lists (like arrays); use GIN indexes instead.
