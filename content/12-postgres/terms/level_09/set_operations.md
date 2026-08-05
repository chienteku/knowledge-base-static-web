# `UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL set operators used to merge (`UNION`/`UNION ALL`), overlap (`INTERSECT`), or subtract (`EXCEPT`) the results of two or more independent `SELECT` queries.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The parent query syntax whose outputs are combined.
---

## 2. Term Category
- **SQL Query Syntax**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL engines. Set calculations require that all queries contain the **exact same number of columns** in the same position, carrying compatible data types).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Compatible Union Refactor

**Problem:** You try to run the following query:
```sql
SELECT id, name FROM users
UNION ALL
SELECT name, email FROM contacts;
```
1.  Explain why this query fails.
2.  Write the refactored SQL query to safely merge the names from both tables.

**Expected output:**
> [!check]- Answer
> ```text
> 1. The query fails because the columns are not type-compatible: the first query selects an integer `id` in column 1, whereas the second query selects a text `name` in column 1. SQL set operations require matching data types in corresponding columns.
> ```
> - Adjust the select list to ensure both sides of the `UNION ALL` return the exact same column structures.
> - Match strings to strings.

---



### Exercise 2: Finding Difference with EXCEPT

**Problem:** Query user IDs in `users` table that do NOT exist in `orders` table using `EXCEPT`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT id FROM users EXCEPT SELECT user_id FROM orders;
> ```
> ```sql
> SELECT id FROM users EXCEPT SELECT user_id FROM orders;
> ```
>
> **Explanation:** `EXCEPT` returns distinct rows present in LHS query that do not exist in RHS query.

---

### Exercise 3: Intersecting Datasets with INTERSECT

**Problem:** Query email addresses present in BOTH `customers` and `employees` tables using `INTERSECT`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT email FROM customers INTERSECT SELECT email FROM employees;
> ```
> ```sql
> SELECT email FROM customers INTERSECT SELECT email FROM employees;
> ```
>
> **Explanation:** `INTERSECT` returns distinct rows common to both input queries.

## 7. Related Terms
- [`SELECT`](../level_03/select.md) — The query basics.
---

## 8. Key Takeaways
- Set operators combine outputs of multiple queries into a single grid.
- Queries must be union-compatible (same column counts and compatible types).
- `UNION` merges outputs and removes duplicate rows (requires sorting/CPU).
- `UNION ALL` merges outputs and keeps duplicates (high performance).
- `INTERSECT` returns overlap rows present in both queries.
- `EXCEPT` subtracts rows (returns first query records not in the second).
- Default to `UNION ALL` unless explicit deduplication is required.
