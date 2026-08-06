# Recursive CTE

> **Level 9 — Views, Functions & Advanced SQL**
> A specialized Common Table Expression that references itself in its own definition, enabling SQL queries to traverse hierarchical, parent-child, or graph-structured data of arbitrary depth.

---

## 1. Prerequisites
- [Common Table Expression (CTE / `WITH`)](cte.md) — The parent query abstraction syntax.

---

## 2. Term Category

**Advanced Feature** (Hierarchical Graph Traversal CTEs): Recursive CTEs (`WITH RECURSIVE`) traverse hierarchical trees, org charts, and graph data structures until base cases resolve.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in modern SQL engines. Uses the **`RECURSIVE`** keyword after `WITH` to instruct the compiler to allocate temporary iteration buffers in memory).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Traversing Manager-Employee Hierarchies with Recursive CTEs

**Scenario:**
Traverse an org chart hierarchy in table `employees` starting from CEO `id = 1` down to all subordinate report levels.

**Requirements:**
1. Execute `WITH RECURSIVE org_chart AS (Anchor UNION ALL Recursive) SELECT * FROM org_chart`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH RECURSIVE org_chart AS (
>   -- 1. Anchor Member (Top-level CEO)
>   SELECT id, name, manager_id, 1 AS depth 
>   FROM employees 
>   WHERE id = 1
>   
>   UNION ALL
>   
>   -- 2. Recursive Member (Subordinates joining back to CTE)
>   SELECT e.id, e.name, e.manager_id, o.depth + 1 
>   FROM employees AS e 
>   JOIN org_chart AS o ON e.manager_id = o.id
> )
> SELECT * FROM org_chart ORDER BY depth ASC;
> ```
>
> #### Technical Explanation
>
> 1. `WITH RECURSIVE` combines an Anchor query with a Recursive query via `UNION ALL`.
> 2. The recursive member joins the source table to the CTE result set from the previous iteration step.
> 3. Continues execution until the recursive member returns 0 new rows (base case).

---

### Exercise 2: Generating Number Sequences with Recursive CTEs

**Scenario:**
Generate a sequence of numbers from 1 to 10 using a Recursive CTE.

**Requirements:**
1. Code recursive number counter.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH RECURSIVE numbers AS (
>   SELECT 1 AS n
>   UNION ALL
>   SELECT n + 1 FROM numbers WHERE n < 10
> )
> SELECT n FROM numbers;
> ```
>
> #### Technical Explanation
>
> 1. Anchor member initializes counter `n = 1`.
> 2. Recursive member increments `n + 1` while predicate condition `n < 10` remains `TRUE`.
> 3. Generates sequential series.

---

### Exercise 3: Preventing Infinite Recursion Loops with CYCLE Clauses

**Scenario:**
Prevent infinite recursion loops caused by cyclic data references (`A -> B -> A`) using PostgreSQL `CYCLE` clause (PG 14+).

**Requirements:**
1. Append `CYCLE id SET is_cycle USING path`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH RECURSIVE graph_nodes AS (
>   SELECT id, parent_id 
>   FROM nodes 
>   WHERE id = 1
>   
>   UNION ALL
>   
>   SELECT n.id, n.parent_id 
>   FROM nodes AS n 
>   JOIN graph_nodes AS g ON n.parent_id = g.id
> ) CYCLE id SET is_cycle USING path
> SELECT * FROM graph_nodes WHERE NOT is_cycle;
> ```
>
> #### Technical Explanation
>
> 1. Cyclic parent links (e.g. employee A manages B, B manages A) cause infinite recursion loops without cycle detection.
> 2. `CYCLE id SET is_cycle USING path` tracks visited key paths and halts execution if a duplicate ID is encountered.
> 3. Safe graph traversal feature in PostgreSQL 14+.

---



## 6. Related Terms
- [Common Table Expression (CTE / `WITH`)](cte.md) — The parent query abstraction syntax.

---

## 7. Key Takeaways
- Recursive CTEs allow SQL queries to reference themselves to traverse loops.
- Indispensable for hierarchical data (org charts, folder trees, thread replies).
- Requires the `WITH RECURSIVE` keyword to activate buffer memory.
- Combines an Anchor Member and a Recursive Member using `UNION ALL`.
- Terminates automatically when the loop step returns zero rows.
- Always implement safety guards (like depth limits) to prevent circular infinite loops.
