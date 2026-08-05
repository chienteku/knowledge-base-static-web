# Third Normal Form (3NF)

> **Level 6 — Schema Design & Normalization**
> The database normalization standard requiring that a table is in Second Normal Form (2NF) and contains no transitive dependencies, meaning non-key columns depend only on the primary key directly.

---

## 1. Prerequisites
- [Second Normal Form (2NF)](second_normal_form.md) — The prerequisite partial dependency check.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (The standard design goal for production transactional databases (OLTP) to guarantee data integrity).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A table can be in Second Normal Form (all cells atomic, no partial dependencies) but still suffer from data anomalies. This happens when columns depend on each other indirectly through a middle column.

For example, consider an `employees` table:

| id (PK) | name | department_name | department_office_phone |
| :--- | :--- | :--- | :--- |
| 1 | Alice | Engineering | 555-0101 |
| 2 | Bob | Engineering | 555-0101 |
| 3 | Charlie | Sales | 555-0202 |

The primary key is **`id`**.

If we inspect the dependencies:
-   `name` depends directly on `id` ($id \rightarrow name$).
-   `department_name` depends directly on `id` ($id \rightarrow department\_name$).
-   `department_office_phone` depends directly on `department_name` ($department\_name \rightarrow department\_office\_phone$).

Because $id \rightarrow department\_name$ and $department\_name \rightarrow department\_office\_phone$, we have:
$$id \rightarrow department\_office\_phone \quad \text{(via department\_name)}$$

This is a **Transitive Dependency** (an indirect link).

This design causes anomalies:
-   **Update Anomaly:** If the Engineering office phone changes, you must update the phone number in multiple employee rows, risking inconsistent data.
-   **Insertion Anomaly:** You cannot store a new department's phone number in the database until you hire at least one employee in that department.
-   **Deletion Anomaly:** If you fire Charlie, you delete the only Sales row, which accidentally wipes out the record of the Sales department phone number from the database.

We designed the **Third Normal Form (3NF)** to eliminate these transitive dependencies.

---

### (2) The Rule of 3NF
A table is in Third Normal Form if:
1.  It satisfies **Second Normal Form (2NF)**.
2.  It contains **no transitive dependencies**. Non-key columns must depend *only* on the primary key directly, and nothing else.

This rule is famously summarized in database theory as:
> *"Every column must depend on the key, the whole key, and nothing but the key (so help me Codd)."*

---

### (3) Reality Metaphor
Imagine a company phonebook:
-   Each employee has an ID badge.
-   The phonebook records: employee name, their manager's name, and the manager's office phone.
-   **Violating 3NF:** Printing the manager's personal details on every employee's page. If the manager moves offices, you have to reprint pages for the entire team.
-   **Satisfying 3NF:** You remove the manager's office details from the employee page, leaving only the `manager_id`. You look up the manager's details on their own page.

---

### (4) Code Examples

#### Violating 3NF (Transitive Dependencies)
```sql
-- Violates 3NF: department_office depends on department_name, not employee id
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department_name VARCHAR(50),
  department_office VARCHAR(20)
);
```

#### Refactoring to 3NF
To satisfy 3NF, we move the transitive relationship to its own table, leaving only a foreign key link in the employees table:

```sql
-- Table A: Department profiles (3NF)
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  office VARCHAR(20) NOT NULL
);

-- Table B: Employee records (3NF - references departments)
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INT REFERENCES departments(id)
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing 2NF and 3NF violations

**The mistake:** Thinking a transitive dependency is a partial dependency.

**Why it's wrong:**
-   **Partial Dependency (2NF violation):** A column depends on *part* of a composite primary key. (Only possible if the key has multiple columns).
-   **Transitive Dependency (3NF violation):** A column depends on another *non-key* column. (Possible on any table, even those with single-column keys).

**Fix: Remember that 3NF is about links between non-key columns (e.g. `A -> B -> C`). If a table is in 2NF, look for columns that could stay unique without the primary key.**

---



### Mistake 2: Storing Transitive Dependencies ($A 
ightarrow B 
ightarrow C$) inside Primary Entity Tables (3NF Violation)

**The mistake:** Storing `zip_code` and `city_name` in `users` table when `zip_code` determines `city_name`.

**Why it's wrong:** If 100 users share `zip_code '90210'`, updating the city name requires updating 100 rows (Update Anomaly). Move zip mapping to a `zip_codes` table.

*Incorrect:*
```sql
CREATE TABLE users ( id INT, zip_code TEXT, city_name TEXT ); -- ❌ 3NF violation!
```

*Fix:*
```sql
CREATE TABLE zip_codes ( zip_code TEXT PRIMARY KEY, city_name TEXT );
```

### Mistake 3: Storing Calculated Summary Columns That Depend on Other Table Columns (3NF Violation)

**The mistake:** Storing `total_amount` in `orders` alongside `unit_price` and `quantity`.

**Why it's wrong:** `total_amount` is transitively calculated from `unit_price * quantity`. Storing calculated attributes risks data drift. Compute on-the-fly or use GENERATED columns.

*Incorrect:*
```sql
CREATE TABLE order_items ( price NUMERIC, qty INT, total NUMERIC ); -- ❌ 3NF violation!
```

*Fix:*
```sql
total NUMERIC GENERATED ALWAYS AS (price * qty) STORED
```

## 6. Practice Exercises

### Exercise 1: Store Inventory Normalization

**Problem:** You have a table:
`products (id, title, manufacturer_name, manufacturer_country)`
The primary key is `id`.
1.  Identify the transitive dependency.
2.  Write the SQL queries to normalize this schema into 3NF.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Transitive Dependency: `id -> manufacturer_name -> manufacturer_country` (The product ID determines the manufacturer, which then determines the manufacturer's country).
> ```
> - Remove `manufacturer_country` from the products table because it depends on the manufacturer name, not the product ID.
> - Create a separate lookup table for manufacturers.

---



### Exercise 2: Normalizing Transitive Dependency to 3NF

**Problem:** Normalize `employees (id, dept_id, dept_name)` into 3NF by creating `departments` table.

**Expected output:**
> [!check]- Answer
> ```text
> departments (dept_id PRIMARY KEY, dept_name) and employees (id PRIMARY KEY, dept_id REFERENCES departments)
> ```
> ```sql
> CREATE TABLE departments ( dept_id INT PRIMARY KEY, dept_name TEXT );
> CREATE TABLE employees (
>   id INT PRIMARY KEY,
>   dept_id INT REFERENCES departments(dept_id)
> );
> ```
>
> **Explanation:** Removing transitive dependency `dept_name` into `departments` satisfies 3NF.

---

### Exercise 3: 3NF Definition Summary

**Problem:** State 3NF rule (Table must be in 2NF and contain no transitive functional dependencies).

**Expected output:**
> [!check]- Answer
> ```text
> Must be in 2NF and contain no non-key attribute dependent on another non-key attribute
> ```
> ```text
> Must be in 2NF and contain no non-key attribute dependent on another non-key attribute
> ```
>
> **Explanation:** 3NF guarantees every non-key column depends directly on the primary key ('The key, the whole key, and nothing but the key').

## 7. Related Terms
- [Second Normal Form (2NF)](second_normal_form.md) — The prerequisite standard.
- [Denormalization](denormalization.md) — Intentionally breaking 3NF for speed.
- [Normalization](normalization.md) — Related concept: Normalization.

---

## 8. Key Takeaways
- Third Normal Form (3NF) eliminates transitive (indirect) dependencies.
- Every non-key column must depend directly on the primary key, and nothing else.
- Prevents anomalies associated with updating attributes shared by non-key records.
- Standardizes schemas by creating dedicated lookup tables for categories.
- Serves as the industry-wide target standard for transactional database design.
