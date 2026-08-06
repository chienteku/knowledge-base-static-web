# `UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL set operators used to merge (`UNION`/`UNION ALL`), overlap (`INTERSECT`), or subtract (`EXCEPT`) the results of two or more independent `SELECT` queries.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The parent query syntax whose outputs are combined.

---

## 2. Term Category

**SQL Command / Clause** (Set Combination Operators): Set operations (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`) combine or compare query result sets based on relational set theory.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL engines. Set calculations require that all queries contain the **exact same number of columns** in the same position, carrying compatible data types).

### (1) Design Motivation — "Why did we design this?"
In database design, data is normalized into separate tables (like `employees` and `customers`). 

But sometimes, you need to combine or compare these separate tables for reports:
-   **Unified Lists:** Creating a single master search bar on a dashboard that displays names from both the `customers` table and the `staff` table.
-   **Data Comparisons:** Finding all clients who registered for a webinar, but excluding anyone who is a paid subscriber.

Relational databases are built on mathematical set theory. 

We designed the **SQL Set Operators** to allow developers to perform standard set algebra (merge, overlap, subtraction) directly on query result sets, saving you from writing complex loops in your application.

---

### (2) The Four Set Operators

#### 1. `UNION` (Merge & Deduplicate)
Combines the results of two queries and **removes all duplicate rows**. 
-   *Cost:* High. Postgres must sort or hash the combined records in memory to locate and discard duplicate rows, which is slow on large datasets.

#### 2. `UNION ALL` (Merge & Keep All)
Combines the results of two queries and **keeps all duplicates**. 
-   It simply appends the second result set to the end of the first.
-   *Cost:* Very low. Excellent performance.

#### 3. `INTERSECT` (The Overlap)
Returns only the rows that exist in **both** query outputs.

#### 4. `EXCEPT` (Set Subtraction)
Returns rows from the first query that do **not** exist in the second query. 

*(Note: Called `MINUS` in Oracle databases).*

---

### (3) Reality Metaphor (School Club Rosters)
Imagine comparing two paper rosters:
-   **Roster A:** Members of the Chess Club: `['Alice', 'Bob']`.
-   **Roster B:** Members of the Coding Club: `['Bob', 'Charlie']`.
-   **`UNION`:** A combined master list of students in either club, with duplicates removed: `['Alice', 'Bob', 'Charlie']`.
-   **`UNION ALL`:** Stapling Roster A and Roster B together. Bob appears twice: `['Alice', 'Bob', 'Bob', 'Charlie']`.
-   **`INTERSECT`:** A list of students who are members of both clubs: `['Bob']`.
-   **`EXCEPT` (A EXCEPT B):** A list of Chess club members who are not in the Coding club: `['Alice']`.

---

### (4) Code Examples

#### Master Name Directory (UNION ALL)
```sql
CREATE TABLE staff (name VARCHAR(50), city VARCHAR(50));
CREATE TABLE customers (name VARCHAR(50), city VARCHAR(50));

INSERT INTO staff VALUES ('Alice', 'London'), ('Bob', 'Paris');
INSERT INTO customers VALUES ('Bob', 'Paris'), ('Charlie', 'New York');

-- Combine tables into a single output grid
SELECT name, city, 'staff' AS role FROM staff
UNION ALL
SELECT name, city, 'customer' AS role FROM customers;
-- Returns 4 rows. Bob appears twice (as staff and customer).
```

#### Shared City Intersections
```sql
-- Find cities where both staff and customers live
SELECT city FROM staff
INTERSECT
SELECT city FROM customers;
-- Returns: 'Paris'
```

#### Exclusive Cities (EXCEPT)
```sql
-- Find cities containing staff but no customers
SELECT city FROM staff
EXCEPT
SELECT city FROM customers;
-- Returns: 'London'
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using UNION instead of UNION ALL when duplicate removal is not required

**The mistake:** Merging two large transaction log tables containing millions of rows using `UNION` because it looks cleaner in the SQL script.

**Why it's wrong:** `UNION` forces the database compiler to sort and compare all millions of rows in memory to find and prune duplicates. 

This triggers heavy disk I/O swapping and high CPU usage, slowing down the query. 

If you know the two tables contain unique keys (or you don't care about duplicates), this sorting pass is a waste of resources.

**Fix: Always default to `UNION ALL` for merging query outputs. Only use `UNION` if you explicitly want the database to deduplicate the final records.**

---



### Mistake 2: Using `UNION` (Deduplicated) When `UNION ALL` (Retained) Is Desired

**The mistake:** Combining 2 large datasets using `UNION` when data rows are already known to be disjoint.

**Why it's wrong:** `UNION` forces a full sort and deduplication hash stage across combined datasets, consuming massive CPU/RAM. Use `UNION ALL` to retain rows without deduplication overhead.

*Incorrect:*
```sql
SELECT id FROM table_a UNION SELECT id FROM table_b; -- ❌ Heavy deduplication sort overhead!
```

*Fix:*
```sql
SELECT id FROM table_a UNION ALL SELECT id FROM table_b; -- Fast non-deduplicated concatenation
```

### Mistake 3: Combining Queries with Mismatched Column Data Types Across Set Operations

**The mistake:** Executing `SELECT email FROM users UNION SELECT id FROM orders;`.

**Why it's wrong:** All queries in set operations (`UNION`, `INTERSECT`, `EXCEPT`) MUST return identical column counts with compatible data types.

*Incorrect:*
```sql
SELECT email FROM users UNION SELECT id FROM orders; -- ❌ Type mismatch error!
```

*Fix:*
```sql
Ensure column counts and data types match across all set operation queries
```

## 5. Practice Exercises

### Exercise 1: Combining Result Sets with UNION and UNION ALL

**Scenario:**
Combine active users from `current_users` and archived users from `archived_users` into a single list.

**Requirements:**
1. Contrast `UNION` (deduplicates) vs `UNION ALL` (preserves duplicates).

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- UNION ALL (Fastest - Preserves all rows without deduplication overhead)
> SELECT id, email FROM current_users 
> UNION ALL 
> SELECT id, email FROM archived_users;
> ```
>
> #### Technical Explanation
>
> 1. `UNION ALL` concatenates result sets directly without sorting or deduplicating.
> 2. `UNION` performs a sort/hash pass to eliminate duplicate rows across sets (higher CPU overhead).
> 3. Golden rule: Always use `UNION ALL` unless deduplication is explicitly required.

---

### Exercise 2: Finding Set Intersections with INTERSECT

**Scenario:**
Find user IDs that exist in BOTH `premium_subscribers` AND `beta_testers` tables.

**Requirements:**
1. Execute `SELECT user_id FROM premium_subscribers INTERSECT SELECT user_id FROM beta_testers`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT user_id FROM premium_subscribers 
> INTERSECT 
> SELECT user_id FROM beta_testers;
> ```
>
> #### Technical Explanation
>
> 1. `INTERSECT` returns only distinct rows that exist in BOTH query result sets.
> 2. Operates on relational set intersection logic.
> 3. Selects overlapping entities across categories.

---

### Exercise 3: Set Difference Exclusion with EXCEPT

**Scenario:**
Find customers who exist in `customers` table but have NEVER placed an order in `orders`.

**Requirements:**
1. Execute `SELECT id FROM customers EXCEPT SELECT customer_id FROM orders`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id AS customer_id FROM customers 
> EXCEPT 
> SELECT customer_id FROM orders;
> ```
>
> #### Technical Explanation
>
> 1. `EXCEPT` (relational set difference) returns distinct rows from the first query that do NOT exist in the second query.
> 2. Both query SELECT lists MUST match in column count and compatible data types.
> 3. Elegant alternative to `NOT IN` / `NOT EXISTS`.

---



## 6. Related Terms
- [`SELECT`](../level_03/select.md) — The query basics.

---

## 7. Key Takeaways
- Set operators combine outputs of multiple queries into a single grid.
- Queries must be union-compatible (same column counts and compatible types).
- `UNION` merges outputs and removes duplicate rows (requires sorting/CPU).
- `UNION ALL` merges outputs and keeps duplicates (high performance).
- `INTERSECT` returns overlap rows present in both queries.
- `EXCEPT` subtracts rows (returns first query records not in the second).
- Default to `UNION ALL` unless explicit deduplication is required.
