# Recursive CTE

> **Level 9 — Views, Functions & Advanced SQL**
> A specialized Common Table Expression that references itself in its own definition, enabling SQL queries to traverse hierarchical, parent-child, or graph-structured data of arbitrary depth.

---

## 1. Prerequisites
- [Common Table Expression (CTE / `WITH`)](cte.md) — The parent query abstraction syntax.

---

## 2. Term Category
- **SQL Query Syntax / Abstraction**

---

## 3. Environment Context
- **Universal Standard** (Supported in modern SQL engines. Uses the **`RECURSIVE`** keyword after `WITH` to instruct the compiler to allocate temporary iteration buffers in memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational database tables frequently store hierarchical structures where rows reference other rows in the same table:
-   **Organization Charts:** Employees report to managers, who report to directors.
-   **Folder Directories:** Subfolders sit inside parent folders.
-   **Threaded Comments:** A comment is a reply to another comment.

If you want to write a query to find the complete reporting chain under executive Alice (direct and indirect reports down to the lowest intern):
-   **Standard SQL joins fail:** You would have to write multiple self-joins (`JOIN JOIN JOIN`). 
-   If the company hierarchy is 10 levels deep, you need 10 joins. If the depth is unknown or changes, writing a static query is impossible.

We designed the **Recursive CTE** to solve this tree-traversal problem. 

It allows SQL to behave like a programming loop, executing repeatedly to traverse down (or up) a parent-child chain until no more records are found.

---

### (2) The Three Parts of a Recursive CTE
A recursive CTE requires three distinct parts linked together using the **`UNION`** or **`UNION ALL`** operators:

1.  **The Anchor Member (The Start):** A standard SQL query that runs exactly once to find the root rows of the recursion (e.g. finding executive Alice where `manager_id IS NULL`).
2.  **The Recursive Member (The Loop):** A query that joins the base table with the CTE name itself. It uses the rows found in the *previous* step to locate the next generation of child rows.
3.  **The Termination Condition (The Stop):** The recursion stops automatically when the recursive member returns **zero rows** (no more children are found).

---

### (3) Reality Metaphor
Imagine climbing down a family tree:
-   **Anchor:** You identify the Great-Grandfather (the starting root node).
-   **Recursive Loop:** 
    -   *Pass 1:* You find all of his children.
    -   *Pass 2:* You find all of the children of those children (the grandchildren).
    -   *Pass 3:* You find the great-grandchildren.
-   **Termination:** You stop when you reach a generation that has no children of their own.

---

### (4) Code Examples

#### Traversing an Employee Org Chart
Let's trace a company hierarchy:

```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  manager_id INT REFERENCES employees(id)
);

INSERT INTO employees VALUES 
  (1, 'Alice', NULL), -- CEO (Root)
  (2, 'Bob', 1),      -- Reports to Alice
  (3, 'Charlie', 2),  -- Reports to Bob
  (4, 'David', 1);    -- Reports to Alice

-- Start recursive CTE (Requires RECURSIVE keyword)
WITH RECURSIVE org_chart AS (
  -- 1. Anchor Member: Find the CEO
  SELECT id, name, manager_id, 1 AS depth
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- 2. Recursive Member: Join employees with the CTE (org_chart)
  SELECT e.id, e.name, e.manager_id, oc.depth + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id -- Joins child manager to parent id
)
-- Execute the final output
SELECT * FROM org_chart ORDER BY depth, name;
```

**Output:**
| id | name | manager_id | depth |
| :--- | :--- | :--- | :--- |
| 1 | Alice | NULL | 1 |
| 2 | Bob | 1 | 2 |
| 4 | David | 1 | 2 |
| 3 | Charlie | 2 | 3 |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating infinite loops due to circular relationships in data

**The mistake:** Running a recursive CTE on a table where employee Bob reports to Alice, and Alice reports to Bob.

**Why it's wrong:** The recursive member will find Bob, then Alice, then Bob, then Alice, looping indefinitely. 

The database query will hang, consume massive memory buffers, and eventually fail due to system out-of-memory errors or client timeouts.

**Fix: Protect against circular loops by keeping track of the recursion depth and setting a safety limit in your recursive join clause, or by checking if an ID has already been visited (using an array of visited IDs).**

```sql
/* Safe recursive member using depth limit */
SELECT e.id, e.name, e.manager_id, oc.depth + 1
FROM employees e
JOIN org_chart oc ON e.manager_id = oc.id
WHERE oc.depth < 100; -- Safety cap stops infinite loops
```

---



### Mistake 2: Creating Infinite Recursive CTE Loops Without Depth Termination Guards

**The mistake:** Writing a `RECURSIVE` CTE on cyclic graph data without checking visited nodes or max depth.

**Why it's wrong:** If graph tables contain circular loops ($A 
ightarrow B 
ightarrow A$), recursive CTEs loop infinitely until running out of memory! Limit depth (`WHERE depth < 100`) or track visited array elements.

*Incorrect:*
```sql
// Recursive CTE traversing cyclic graph data without depth limit
```

*Fix:*
```sql
Add depth constraint WHERE depth < 50 or track array of visited IDs
```

### Mistake 3: Using `UNION ALL` Instead of `UNION` When Duplicate Cyclic Nodes Must Be Deduplicated

**The mistake:** Using `UNION ALL` in recursive step when graph nodes overlap.

**Why it's wrong:** `UNION ALL` retains duplicate recursive rows, inflating recursion trees exponentially. Use `UNION` (which deduplicates tuples) or explicit cycle detection.

*Incorrect:*
```sql
// Recursive step using UNION ALL on overlapping graph structures
```

*Fix:*
```sql
Use UNION in recursive CTE step to automatically discard duplicate tuples
```

## 6. Practice Exercises

### Exercise 1: Category Path Generator

**Problem:** You are building an e-commerce folder hierarchy. The `categories` table has columns `id`, `name`, and `parent_id` (referencing `categories(id)`). 

Write a recursive CTE named `category_tree` that starts at the root category `'Electronics'` (id=1, parent_id IS NULL) and builds a text breadcrumb trail path for all child categories (e.g. `'Electronics > Computers > Laptops'`).

**Expected output:**
> [!check]- Answer
> ```sql
> WITH RECURSIVE category_tree AS (
>   -- Anchor
>   SELECT id, name, CAST(name AS TEXT) AS path_trail
>   FROM categories
>   WHERE id = 1
>   
>   UNION ALL
>   
>   -- Recursive
>   SELECT c.id, c.name, t.path_trail || ' > ' || c.name
>   FROM categories c
>   JOIN category_tree t ON c.parent_id = t.id
> )
> SELECT * FROM category_tree;
> ```
> - The anchor query finds the root node where `id = 1`.
> - Cast the initial path column to `TEXT` in the anchor to prevent data type mismatches during string concatenation (`||`) in the recursive step.

---



### Exercise 2: Recursive CTE Hierarchical Tree Traversal

**Problem:** Traverse organization hierarchy starting from manager `id = 1` selecting employee `id`, `name`, `manager_id`.

**Expected output:**
> [!check]- Answer
> ```text
> WITH RECURSIVE org_chart AS (SELECT id, name, manager_id FROM employees WHERE id = 1 UNION ALL SELECT e.id, e.name, e.manager_id FROM employees e JOIN org_chart o ON e.manager_id = o.id) SELECT * FROM org_chart;
> ```
> ```sql
> WITH RECURSIVE org_chart AS (
>   -- Anchor member
>   SELECT id, name, manager_id FROM employees WHERE id = 1
>   UNION ALL
>   -- Recursive member
>   SELECT e.id, e.name, e.manager_id
>   FROM employees e
>   JOIN org_chart o ON e.manager_id = o.id
> )
> SELECT * FROM org_chart;
> ```
>
> **Explanation:** `WITH RECURSIVE` traverses hierarchical trees and graphs via anchor and recursive terms.

---

### Exercise 3: Generating Sequence Numbers with Recursive CTE

**Problem:** Generate series from 1 to 5 using `WITH RECURSIVE`.

**Expected output:**
> [!check]- Answer
> ```text
> WITH RECURSIVE seq AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 5) SELECT * FROM seq;
> ```
> ```sql
> WITH RECURSIVE seq AS (
>   SELECT 1 AS n
>   UNION ALL
>   SELECT n + 1 FROM seq WHERE n < 5
> )
> SELECT * FROM seq;
> ```
>
> **Explanation:** Recursive CTEs increment sequence values until termination conditions evaluate false.

## 7. Related Terms
- [Common Table Expression (CTE / `WITH`)](cte.md) — The parent query abstraction syntax.

---

## 8. Key Takeaways
- Recursive CTEs allow SQL queries to reference themselves to traverse loops.
- Indispensable for hierarchical data (org charts, folder trees, thread replies).
- Requires the `WITH RECURSIVE` keyword to activate buffer memory.
- Combines an Anchor Member and a Recursive Member using `UNION ALL`.
- Terminates automatically when the loop step returns zero rows.
- Always implement safety guards (like depth limits) to prevent circular infinite loops.
