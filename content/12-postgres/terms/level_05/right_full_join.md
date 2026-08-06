# `RIGHT JOIN` / `FULL OUTER JOIN`

> **Level 5 — Table Relationships & JOINs**
> SQL outer join variants that preserve unmatched records: `RIGHT JOIN` retains all rows from the second table, and `FULL OUTER JOIN` retains all rows from both tables, padding missing links with `NULL`.

---

## 1. Prerequisites
- [`LEFT JOIN` (`LEFT OUTER JOIN`)](left_join.md) — The left-side preservation default.

---

## 2. Term Category

**SQL Command / Clause** (Outer & Complete Joins): `RIGHT JOIN` preserves all rows from the right table, while `FULL OUTER JOIN` preserves all rows from both tables regardless of match state.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Fully supported. The PostgreSQL query planner translates outer joins using hash tables or merge indexes to locate unmatched keys on both sides).

### (1) Design Motivation — "Why did we design this?"
We have learned how `LEFT JOIN` preserves all rows in the first table. 

But sometimes, your query needs different preservation rules:

#### 1. RIGHT JOIN (Right Side Master)
This is the mirror image of `LEFT JOIN`. 

It designates the second table (written after `RIGHT JOIN`) as the master table, keeping all its rows and padding unmatched left-side columns with `NULL`.

*Note:* In real-world software development, **developers rarely write `RIGHT JOIN`**. 

Because `A RIGHT JOIN B` is functionally identical to `B LEFT JOIN A`, developers simply swap the table names and use `LEFT JOIN`. 

Since Western languages read from left to right, placing the master table first keeps the SQL script much easier to read.

#### 2. FULL OUTER JOIN (Both Sides Master)
Sometimes, you need a complete, bidirectional lookup. 

For example, in a company database:
-   Some **Departments** have no projects assigned to them.
-   Some **Projects** are independent and belong to no department.

If you want to audit the entire system to find these gaps, an `INNER JOIN` hides both. 

A `LEFT JOIN` only shows departments without projects. 

A `RIGHT JOIN` only shows projects without departments.

We designed the **`FULL OUTER JOIN`** to merge everything: it matches rows where keys align, and lists unmatched rows from **both** tables on their own lines, padding the missing sides with `NULL`.

---

### (2) Reality Metaphor
Imagine a school dance matching list:
-   **`RIGHT JOIN`:** Focuses strictly on the **Follows registry list**. Every Follow is guaranteed to appear in the report. If they have a Lead partner, they are listed together. If they have no partner, they are still listed, but the Lead column is blank. Leads without partners are ignored.
-   **`FULL OUTER JOIN`:** The **Master Attendance Sheet**. Every single Lead and every single Follow is listed. If they are partnered, they appear on the same line. If a Lead is partnerless, they appear on a line with a blank Follow box. If a Follow is partnerless, they appear on a line with a blank Lead box. No one is left out of the report.

---

### (3) Code Examples

#### Full Outer Join Mapping
Assume these tables representing projects and departments:

```sql
CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE projects (id INT PRIMARY KEY, title VARCHAR(50), dept_id INT);

INSERT INTO departments VALUES (1, 'HR'), (2, 'Sales'); -- Sales has no projects!
INSERT INTO projects VALUES (10, 'Recruitment', 1), (20, 'Independent Tech', NULL); -- Tech has no dept!
```

Let's execute a `FULL OUTER JOIN`:

```sql
SELECT departments.name, projects.title
FROM departments
FULL OUTER JOIN projects ON departments.id = projects.dept_id;
-- Output:
-- name  |       title        
-- ------+--------------------
-- HR    | Recruitment
-- Sales | NULL               <-- Kept (unmatched left department)
-- NULL  | Independent Tech   <-- Kept (unmatched right project)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing RIGHT JOINs when a LEFT JOIN would be easier to read

**The mistake:** Writing complex, hard-to-read right joins:

```sql
-- BAD: Confusing flow, table orders are reversed in mind
SELECT c.name, o.id
FROM orders AS o
RIGHT JOIN customers AS c ON o.customer_id = c.id;
```

**Why it's wrong:** While syntactically correct, it forces developers reading your code to scan back-and-forth between tables. 

**Fix: Standardize on `LEFT JOIN` as your default outer join constraint, swapping table orders to make the master table appear first.**

```sql
-- CORRECT: Clean, left-to-right flow
SELECT c.name, o.id
FROM customers AS c
LEFT JOIN orders AS o ON c.id = o.customer_id;
```

---





### Mistake 2: Overusing `RIGHT JOIN` When `LEFT JOIN` Is Clearer and More Idiomatic

**The mistake:** Writing `SELECT * FROM orders o RIGHT JOIN users u ON o.user_id = u.id;`.

**Why it's wrong:** `RIGHT JOIN` reverses table reading order, making SQL queries hard to read. Rewrite as `FROM users u LEFT JOIN orders o ON u.id = o.user_id` for clarity.

*Incorrect:*
```sql
SELECT * FROM orders o RIGHT JOIN users u ON o.user_id = u.id; -- Confusing reading order
```

*Fix:*
```sql
SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id; -- Idiomatic LEFT JOIN
```



### Mistake 3: Confusing `FULL OUTER JOIN` with `INNER JOIN` Logic

**The mistake:** Using `FULL OUTER JOIN` expecting it to return ONLY rows present in both tables.

**Why it's wrong:** `FULL OUTER JOIN` returns ALL rows from BOTH tables, filling unmatched columns with NULLs. Use `INNER JOIN` for matching rows only.

*Incorrect:*
```sql
SELECT * FROM table_a FULL JOIN table_b ON ...; -- Returns all unmatched rows from both sides!
```

*Fix:*
```sql
SELECT * FROM table_a INNER JOIN table_b ON ...;
```



## 5. Practice Exercises

### Exercise 1: Full Outer Join Operations

**Scenario:**
Perform a `FULL OUTER JOIN` between `employees` and `departments` to list all employees and all departments, including un-matched rows on both sides.

**Requirements:**
1. Execute `SELECT e.name, d.name FROM employees e FULL OUTER JOIN departments d ON e.dept_id = d.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   e.name AS employee_name, 
>   d.name AS department_name 
> FROM employees AS e 
> FULL OUTER JOIN departments AS d ON e.dept_id = d.id;
> ```
>
> #### Technical Explanation
>
> 1. `FULL OUTER JOIN` combines `LEFT JOIN` and `RIGHT JOIN` semantics.
> 2. Returns matched rows + un-matched employees (with `NULL` department) + un-matched departments (with `NULL` employee).
> 3. Complete outer join coverage.

---

### Exercise 2: Converting RIGHT JOIN to Idiomatic LEFT JOIN

**Scenario:**
Refactor a `RIGHT JOIN` query into an equivalent idiomatic `LEFT JOIN` query for code readability.

**Requirements:**
1. Reverse table order in `FROM` clause and swap `RIGHT JOIN` to `LEFT JOIN`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- ❌ Un-idiomatic RIGHT JOIN
> -- SELECT e.name, d.name FROM employees e RIGHT JOIN departments d ON e.dept_id = d.id;
> 
> -- ✅ Idiomatic LEFT JOIN equivalent
> SELECT 
>   e.name AS employee_name, 
>   d.name AS department_name 
> FROM departments AS d 
> LEFT JOIN employees AS e ON d.id = e.dept_id;
> ```
>
> #### Technical Explanation
>
> 1. `RIGHT JOIN` preserves all rows from the right table.
> 2. Reversing table order in `FROM` allows rewriting any `RIGHT JOIN` as a clearer `LEFT JOIN`.
> 3. SQL style guideline: Standardize on `LEFT JOIN`.

---

### Exercise 3: Isolating Symmetric Disjoint Sets with FULL JOIN

**Scenario:**
Find rows that exist in `Table A` OR `Table B`, but NOT in both (Symmetric Difference).

**Requirements:**
1. Execute `FULL JOIN` with `WHERE a.id IS NULL OR b.id IS NULL`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   a.id AS a_id, 
>   b.id AS b_id 
> FROM table_a AS a 
> FULL OUTER JOIN table_b AS b ON a.id = b.id 
> WHERE a.id IS NULL OR b.id IS NULL;
> ```
>
> #### Technical Explanation
>
> 1. `WHERE a.id IS NULL OR b.id IS NULL` filters out matching intersection rows.
> 2. Returns only rows unique to `Table A` or unique to `Table B`.
> 3. Data reconciliation pattern.

---



## 6. Related Terms
- [`LEFT JOIN` (`LEFT OUTER JOIN`)](left_join.md) — The left-side master default.
- [`INNER JOIN`](inner_join.md) — The intersection-only match.

---

## 7. Key Takeaways
- `RIGHT JOIN` retains all rows from the second table (rarely used in practice).
- `FULL OUTER JOIN` retains all rows from both tables, listing unmatched elements.
- Swapping table positions lets you replace `RIGHT JOIN` with readable `LEFT JOIN` queries.
- Outer joins pad missing keys on either side with `NULL` cells in the output.
- Use `FULL OUTER JOIN` to audit gaps or missing references in relational schemas.
