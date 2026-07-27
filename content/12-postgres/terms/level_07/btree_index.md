# B-tree Index

> **Level 7 — Indexes & Query Performance**
> The default index structure in PostgreSQL that organizes column keys into a sorted, self-balancing search tree, optimized for high-speed equality and range queries.

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The parent performance concept.

---

## 2. Term Category
- **PostgreSQL Index Type**

---

## 3. Environment Context
- **PostgreSQL Core** (The default index type. If you run `CREATE INDEX` without specifying a `USING` clause, Postgres compiles a B-tree index by default).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Query Match Audit

**Problem:** You have a B-tree index on the `price` column. Which of the following query filters will **successfully leverage** the B-tree index?
1.  `WHERE price = 15.00`
2.  `WHERE price BETWEEN 10.00 AND 50.00`
3.  `WHERE price IS NULL`
4.  `WHERE price != 100.00`

**Expected output:**
```text
Queries 1, 2, and 3 will leverage the index!
1. Equality checks are the primary use-case for B-trees.
2. Range queries (BETWEEN) leverage the sorted node sequence.
3. PostgreSQL B-trees index NULL values, so IS NULL queries can use them.
4. Query 4 (inequality !=) usually does NOT use the index, because searching for "everything except 100" forces the database to read almost the entire table, making index scans slower than simple sequential table scans.
```

> [!check]- Answer
> - B-trees are optimized for sorting and ranges.
> - Consider how much of the table is returned by the inequality filter.

---



### Exercise 2: Creating Standard B-Tree Index

**Problem:** Create B-Tree index on `email` column of `users` table.

**Expected output:**
```text
CREATE INDEX idx_users_email ON users (email);
```

> [!check]- Answer
> ```sql
> CREATE INDEX idx_users_email ON users (email);
> ```
>
> **Explanation:** `CREATE INDEX` builds a standard B-Tree index by default in PostgreSQL.

### Exercise 3: B-Tree Supported Comparison Operators

**Problem:** List comparison operators supported by B-Tree indexes (`<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`).

**Expected output:**
```text
<, <=, =, >=, >, BETWEEN, IN
```

> [!check]- Answer
> ```text
> <, <=, =, >=, >, BETWEEN, IN
> ```
>
> **Explanation:** B-Tree balanced tree structures accelerate range and equality search predicates.

## 7. Related Terms
- [Index (Concept)](index_concept.md) — The parent performance concept.
- [`CREATE INDEX` / `DROP INDEX`](create_drop_index.md) — SQL commands.
- [GIN Index](gin_index.md) — The index type for non-scalar types.

---

## 8. Key Takeaways
- B-tree is the default, self-balancing index type in PostgreSQL.
- Organizes data keys in sorted order inside balanced hierarchy nodes.
- Guarantees symmetrical node depths, making lookup times predictable.
- Optimizes equality (`=`), inequalities (`<`, `>`), ranges (`BETWEEN`), and sorting.
- Supports prefix text matches (`LIKE 'A%'`), but fails on leading wildcards.
- Does not optimize multi-value lists (like arrays); use GIN indexes instead.
