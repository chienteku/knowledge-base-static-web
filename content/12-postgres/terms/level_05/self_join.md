# Self-Join

> **Level 5 — Table Relationships & JOINs**
> A query technique where a table is joined with itself by assigning unique table aliases, typically used to query hierarchical or comparative data stored in a single table.

---

## 1. Prerequisites
- [`JOIN` (Concept)](join_concept.md) — The parent table combination mechanics.
- [Aliases (`AS`)](../level_04/aliases.md) — The renaming system required to differentiate self-references.
---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated by treating the single table as two separate logical streams inside the query execution plan).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes, data records contain relationships with other records **inside the exact same table**:
-   **Employee Hierarchy:** An employee has a `manager_id` column pointing to their boss. The boss is also an employee with a row in the same table.
-   **Nested Categories:** A product category (like `'Laptops'`) has a `parent_category_id` pointing to a parent category (like `'Electronics'`) in the same table.
-   **Flight Routes:** A table stores city coordinates. You want to pair cities together to calculate flight distances.

If you want to display an employee directory listing every worker's name next to their manager's name:
-   You cannot search two different tables because all data is in the `employees` table.
-   You need a way to tell the database: *"Treat this table as two separate sheets, align them, and map the worker's manager key to the manager's ID key."*

We designed the **Self-Join** pattern to solve this. 

By joining a table to itself and assigning **mandatory table aliases**, you split the table into two virtual copies for the duration of the query.

---

### (2) The Aliasing Requirement
If you try to write:
`SELECT * FROM employees JOIN employees ON ...;`
The database will crash because `employees` is specified twice. 

You must rename them:
`FROM employees AS worker JOIN employees AS manager ON ...`

---

### (3) Reality Metaphor
Imagine a paper filing drawer labeled `Birth Certificates`:
-   You pull out Bob's certificate (the `worker` copy).
-   On Bob's card, you read the line: `Parent ID: 105`.
-   To find the parent's name, you turn back to the **exact same drawer**, search alphabetically for card `105` (the `manager` copy), and read the name: `'Robert'`.
-   You are pulling records out of the same physical cabinet but treating them as two separate steps of your search.

---

### (4) Code Examples

#### Querying Hierarchies
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id INT REFERENCES employees(id) -- Self-referencing foreign key
);

INSERT INTO employees (id, name, manager_id) VALUES 
  (1, 'CEO Elizabeth', NULL), -- Top supervisor (has no boss)
  (2, 'Manager Arthur', 1),
  (3, 'Developer Bob', 2);
```

Let's join the table to itself using `LEFT JOIN` (so we do not hide the CEO!):

```sql
SELECT 
  emp.name AS worker_name, 
  mgr.name AS supervisor_name
FROM employees AS emp
LEFT JOIN employees AS mgr ON emp.manager_id = mgr.id;
-- Output:
--   worker_name   | supervisor_name 
-- ----------------+-----------------
-- CEO Elizabeth   | NULL
-- Manager Arthur  | CEO Elizabeth
-- Developer Bob   | Manager Arthur
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using INNER JOIN on hierarchies containing top-level root records

**The mistake:** Performing a self-join on employees using a standard `JOIN` (inner join) and wondering why the CEO has completely disappeared from the output.

**Why it's wrong:** The CEO has `manager_id = NULL`. Because `INNER JOIN` requires a match on both sides, and `NULL` cannot match any employee ID, the CEO's row is filtered out. The directory listing makes it look like the CEO does not work at the company.

**Fix: Always use a `LEFT JOIN` for hierarchical self-joins to preserve root elements that have no parent references.**

---



### Mistake 2: Omitting Table Aliases in Self-Join Queries (Ambiguous Column Error)

**The mistake:** Executing `SELECT * FROM employees JOIN employees ON manager_id = id;` without table aliases.

**Why it's wrong:** Joining a table to itself REQUIRES distinct table aliases (e.g. `emp` and `mgr`). Omitting aliases throws error `table name "employees" specified more than once`.

*Incorrect:*
```sql
SELECT * FROM employees JOIN employees ON manager_id = id; -- ❌ Ambiguous table error!
```

*Fix:*
```sql
SELECT e.name AS emp_name, m.name AS mgr_name FROM employees e JOIN employees m ON e.manager_id = m.id;
```

### Mistake 3: Using `INNER JOIN` in Self-Joins Omitting Top-Level Root Nodes

**The mistake:** Using `INNER JOIN` when querying employees and managers for organization charts.

**Why it's wrong:** `INNER JOIN` drops the CEO/Root node because the CEO has `manager_id = NULL`! Use `LEFT JOIN` to preserve root nodes.

*Incorrect:*
```sql
SELECT e.name, m.name FROM employees e JOIN employees m ON e.manager_id = m.id; -- ❌ Drops CEO!
```

*Fix:*
```sql
SELECT e.name, m.name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id; -- Preserves CEO
```



### Mistake 4: Omitting Table Aliases in Self-Join Queries (Ambiguous Column Error)

**The mistake:** Executing `SELECT * FROM employees JOIN employees ON manager_id = id;` without table aliases.

**Why it's wrong:** Joining a table to itself REQUIRES distinct table aliases (e.g. `emp` and `mgr`). Omitting aliases throws error `table name "employees" specified more than once`.

*Incorrect:*
```sql
SELECT * FROM employees JOIN employees ON manager_id = id; -- ❌ Ambiguous table error!
```

*Fix:*
```sql
SELECT e.name AS emp_name, m.name AS mgr_name FROM employees e JOIN employees m ON e.manager_id = m.id;
```

### Mistake 5: Using `INNER JOIN` in Self-Joins Omitting Top-Level Root Nodes

**The mistake:** Using `INNER JOIN` when querying employees and managers for organization charts.

**Why it's wrong:** `INNER JOIN` drops the CEO/Root node because the CEO has `manager_id = NULL`! Use `LEFT JOIN` to preserve root nodes.

*Incorrect:*
```sql
SELECT e.name, m.name FROM employees e JOIN employees m ON e.manager_id = m.id; -- ❌ Drops CEO!
```

*Fix:*
```sql
SELECT e.name, m.name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id; -- Preserves CEO
```

## 6. Practice Exercises

### Exercise 1: Nested Category Map

**Problem:** You have a `categories` table (columns: `id`, `name`, `parent_id` references `categories(id)`). Write a SQL query using a self-join to select each category's `name` and its parent category's `name`. Label the columns as `category_name` and `parent_name`. Include categories that do not have a parent.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT c.name AS category_name, p.name AS parent_name 
> FROM categories AS c
> LEFT JOIN categories AS p ON c.parent_id = p.id;
> ```
> - Alias the left side as `c` (category) and the right side as `p` (parent).
> - Use a `LEFT JOIN` to keep top-level categories that have `parent_id = NULL`.

---



### Exercise 2: Self-Join Manager Hierarchy Query

**Problem:** Self-join `employees` table (aliases `e` for employee, `m` for manager) selecting `e.name` and `m.name` as `manager_name`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT e.name AS employee_name, m.name AS manager_name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;
> ```
> ```sql
> SELECT e.name AS employee_name, m.name AS manager_name
> FROM employees e
> LEFT JOIN employees m ON e.manager_id = m.id;
> ```
>
> **Explanation:** Self-joins match rows within a single hierarchical table using distinct table aliases.

---

### Exercise 3: Finding Consecutive Metric Entries with Self-Join

**Problem:** Self-join `readings` table to find rows where current reading `val` is greater than previous reading `val`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT curr.id FROM readings curr JOIN readings prev ON curr.id = prev.id + 1 WHERE curr.val > prev.val;
> ```
> ```sql
> SELECT curr.id
> FROM readings curr
> JOIN readings prev ON curr.id = prev.id + 1
> WHERE curr.val > prev.val;
> ```
>
> **Explanation:** Self-joins enable comparing adjacent or sequential rows within the same table.

## 7. Related Terms
- [`JOIN` (Concept)](join_concept.md) — The parent operation.
- [Aliases (`AS`)](../level_04/aliases.md) — The alias renaming syntax.
- [`CROSS JOIN`](cross_join.md) — Related concept: `CROSS JOIN`.
---

## 8. Key Takeaways
- A self-join combines a table with itself within a single query.
- Differentiates the virtual table copies using mandatory table aliases.
- Essential for querying hierarchical structures (e.g. employee trees, categories).
- Use `LEFT JOIN` to prevent filtering out root records with `NULL` parents.
- Resolves hierarchical relationships entirely on the server in a single query.
