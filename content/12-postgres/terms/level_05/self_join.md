# Self-Join

> **Level 5 — Table Relationships & JOINs**
> A query technique where a table is joined with itself by assigning unique table aliases, typically used to query hierarchical or comparative data stored in a single table.

---

## 1. Prerequisites
- [`JOIN` (Concept)](join_concept.md) — The parent table combination mechanics.
- [Aliases (`AS`)](../level_04/aliases.md) — The renaming system required to differentiate self-references.

---

## 2. Term Category

**SQL Command / Clause** (Self-Referencing Hierarchical Join): A Self-Join joins a table to itself using table aliases, enabling queries over recursive or hierarchical data (e.g., employee manager links).



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated by treating the single table as two separate logical streams inside the query execution plan).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Querying Hierarchical Self-Referential Manager Links

**Scenario:**
Query `employees` table joined to itself to display each employee's name alongside their manager's name.

**Requirements:**
1. Execute `SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   e.id AS employee_id, 
>   e.name AS employee_name, 
>   COALESCE(m.name, 'Top Manager') AS manager_name 
> FROM employees AS e 
> LEFT JOIN employees AS m ON e.manager_id = m.id 
> ORDER BY e.id ASC;
> ```
>
> #### Technical Explanation
>
> 1. Self-joins join a table to itself using distinct table aliases (`e` for employee, `m` for manager).
> 2. `LEFT JOIN` preserves top-level managers whose `manager_id` is `NULL`.
> 3. Resolves self-referential parent-child relationships.

---

### Exercise 2: Self-Joining Sequential Category Hierarchies

**Scenario:**
Query category table `categories` joined to itself to display subcategories alongside their parent category names.

**Requirements:**
1. Join `categories sub` to `categories parent` on `sub.parent_id = parent.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   sub.name AS subcategory, 
>   parent.name AS parent_category 
> FROM categories AS sub 
> JOIN categories AS parent ON sub.parent_id = parent.id;
> ```
>
> #### Technical Explanation
>
> 1. Self-joins map 1-level parent-child tree hierarchies.
> 2. Matches `sub.parent_id = parent.id`.
> 3. Clean taxonomy modeling pattern.

---

### Exercise 3: Finding Consecutive Duplicate Row Events

**Scenario:**
Self-join `user_logins` on `user_id` to detect duplicate login events occurring within 5 seconds of each other.

**Requirements:**
1. Execute self-join with time interval threshold.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   l1.user_id, 
>   l1.login_time AS initial_login, 
>   l2.login_time AS duplicate_login 
> FROM user_logins AS l1 
> JOIN user_logins AS l2 
>   ON l1.user_id = l2.user_id 
>  AND l1.id <> l2.id 
>  AND l2.login_time BETWEEN l1.login_time AND l1.login_time + INTERVAL '5 seconds';
> ```
>
> #### Technical Explanation
>
> 1. Self-joins compare different rows within the same collection.
> 2. `l1.id <> l2.id` prevents matching a row against itself.
> 3. Detects rapid duplicate event sequences.

---



## 6. Related Terms
- [`JOIN` (Concept)](join_concept.md) — The parent operation.
- [Aliases (`AS`)](../level_04/aliases.md) — The alias renaming syntax.
- [`CROSS JOIN`](cross_join.md) — Related concept: `CROSS JOIN`.

---

## 7. Key Takeaways
- A self-join combines a table with itself within a single query.
- Differentiates the virtual table copies using mandatory table aliases.
- Essential for querying hierarchical structures (e.g. employee trees, categories).
- Use `LEFT JOIN` to prevent filtering out root records with `NULL` parents.
- Resolves hierarchical relationships entirely on the server in a single query.
