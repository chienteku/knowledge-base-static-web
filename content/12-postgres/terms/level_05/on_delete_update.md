# `ON DELETE` / `ON UPDATE` Actions (`CASCADE`, `SET NULL`, `RESTRICT`)

> **Level 5 — Table Relationships & JOINs**
> The SQL referential actions appended to `FOREIGN KEY` constraints that instruct the database how to update or delete child rows automatically when a referenced parent row is modified or deleted.

---

## 1. Prerequisites
- [`FOREIGN KEY`](foreign_key.md) — The reference pointer constraint.
- [Referential Integrity](referential_integrity.md) — The database safety standards.

---

## 2. Term Category
- **PostgreSQL Constraint**

---

## 3. Environment Context
- **PostgreSQL Core** (Triggered synchronously during write operations. Resolves cascades inside the same transaction block, ensuring changes commit atomically).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `referential_integrity.md`, the database blocks you from deleting a parent record if child records still reference it. 

While this prevents orphaned rows, blocking is not always the desired business behavior.

For example:
-   **Blog App:** If a user deletes their account, we want to delete all their comments automatically. We don't want to force them to manually delete 10,000 comments first.
-   **Store App:** If a manager leaves a company, we want to keep the department records, but set the department's `manager_id` column to empty (`NULL`) until we hire a replacement.
-   **Catalog App:** If a store administrator tries to delete a product, we want to strictly block them if customers have already purchased that item in past invoices.

We designed **Referential Actions** to solve this. 

By appending these rules to foreign keys, you automate relationship cleanup directly in the database engine.

---

### (2) The Action Settings

-   **`CASCADE` (Delete/Update Together):** When a parent row is deleted or updated, the database automatically deletes or updates all matching child rows.
-   **`SET NULL` (Detach):** When a parent row is deleted, the database sets the child's foreign key column to `NULL`. **Note:** This requires the child column to be nullable!
-   **`RESTRICT` / `NO ACTION` (Block):** The database blocks the parent modification. `NO ACTION` is the default setting in PostgreSQL if you do not specify a rule.

---

### (3) Reality Metaphor
Imagine a company organizational tree:
-   A **Department Manager** (Parent) supervises **Staff Workers** (Children).
-   **`ON DELETE CASCADE`** is like shutting down the department. When the department closes, all staff members are laid off (deleted) automatically.
-   **`ON DELETE SET NULL`** is like a manager resigning. The manager leaves the building, and the staff keep their jobs but their "supervisor" line on their badge is erased to blank (NULL).
-   **`ON DELETE RESTRICT`** is like a union contract: the manager is legally blocked from quitting the company as long as there is still staff working under them.

---

### (4) Code Examples

#### Enforcing Cascaded Deletes
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(100),
  -- If user is deleted, wipe all their posts automatically!
  user_id INT REFERENCES users(id) ON DELETE CASCADE
);
```

#### Enforcing Set Null
```sql
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE projects (
  id INT PRIMARY KEY,
  title VARCHAR(100),
  -- If department is deleted, keep project but set department_id to NULL
  department_id INT REFERENCES departments(id) ON DELETE SET NULL
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Declaring ON DELETE SET NULL on a column marked NOT NULL

**The mistake:** Combining conflicting constraints in a child table column:

```sql
-- BAD: This is a design conflict!
CREATE TABLE projects (
  id INT PRIMARY KEY,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE SET NULL
);
```

**Why it's wrong:** The column has a `NOT NULL` constraint, meaning it can never contain empty values. However, `ON DELETE SET NULL` instructs the database to write `NULL` if the parent department is deleted. If you delete a department, Postgres tries to set the child column to `NULL` but hits the not-null constraint, causing the query to crash.

**Fix: If a column is `NOT NULL`, you must use `ON DELETE CASCADE` or `ON DELETE RESTRICT`. If you want to use `SET NULL`, the column must allow nulls.**

---



### Mistake 2: Using `ON DELETE CASCADE` Accidental Mass Data Loss Traps

**The mistake:** Setting `ON DELETE CASCADE` on critical financial transactions linked to `users`.

**Why it's wrong:** Deleting a `user` row silently PURGES all historic transaction records! Use `ON DELETE RESTRICT` or `ON DELETE SET NULL` for audit trails.

*Incorrect:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- ❌ Silently purges transaction logs!
```

*Fix:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT -- Prevents deletion if transactions exist
```

### Mistake 3: Using `ON DELETE SET NULL` on `NOT NULL` Foreign Key Columns

**The mistake:** Defining column `user_id INT NOT NULL` with foreign key `ON DELETE SET NULL`.

**Why it's wrong:** If a parent row is deleted, PostgreSQL attempts to set `user_id` to NULL, violating the `NOT NULL` constraint and failing!

*Incorrect:*
```sql
user_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL -- ❌ Violates NOT NULL constraint!
```

*Fix:*
```sql
user_id INT REFERENCES users(id) ON DELETE SET NULL -- Allow NULLs
```



### Mistake 4: Using `ON DELETE CASCADE` Accidental Mass Data Loss Traps

**The mistake:** Setting `ON DELETE CASCADE` on critical financial transactions linked to `users`.

**Why it's wrong:** Deleting a `user` row silently PURGES all historic transaction records! Use `ON DELETE RESTRICT` or `ON DELETE SET NULL` for audit trails.

*Incorrect:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- ❌ Silently purges transaction logs!
```

*Fix:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT -- Prevents deletion if transactions exist
```

### Mistake 5: Using `ON DELETE SET NULL` on `NOT NULL` Foreign Key Columns

**The mistake:** Defining column `user_id INT NOT NULL` with foreign key `ON DELETE SET NULL`.

**Why it's wrong:** If a parent row is deleted, PostgreSQL attempts to set `user_id` to NULL, violating the `NOT NULL` constraint and failing!

*Incorrect:*
```sql
user_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL -- ❌ Violates NOT NULL constraint!
```

*Fix:*
```sql
user_id INT REFERENCES users(id) ON DELETE SET NULL -- Allow NULLs
```

## 6. Practice Exercises

### Exercise 1: Task Assignment Rules

**Problem:** You have an `employees` table (columns: `id` PRIMARY KEY, `name`) and a `tasks` table. Write the SQL `CREATE TABLE` statement for `tasks` containing:
1.  An integer primary key `id`.
2.  A description text `description`.
3.  An integer column `assigned_employee_id` referencing `employees(id)`. If an employee is deleted from the company, keep the task active but set the assigned employee to `NULL`.

**Expected output:**
```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY,
  description TEXT,
  assigned_employee_id INT REFERENCES employees(id) ON DELETE SET NULL
);
```

> [!check]- Answer
> - The column `assigned_employee_id` must allow null values (do not add `NOT NULL`).
> - Append the specific referential delete action rule at the end of the foreign key constraint.

---



### Exercise 2: Setting Foreign Key Action Rules

**Problem:** Add foreign key specifying `ON DELETE SET NULL` and `ON UPDATE CASCADE`.

**Expected output:**
```text
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
```

> [!check]- Answer
> ```sql
> ALTER TABLE orders
> ADD CONSTRAINT fk_user
> FOREIGN KEY (user_id) REFERENCES users(id)
> ON DELETE SET NULL ON UPDATE CASCADE;
> ```
>
> **Explanation:** Foreign key action rules dictate cascading behavior for parent updates and deletions.

### Exercise 3: Foreign Key Action Options List

**Problem:** List 4 foreign key ON DELETE / ON UPDATE actions (`NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`).

**Expected output:**
```text
NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT
```

> [!check]- Answer
> ```text
> NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT
> ```
>
> **Explanation:** Action options control referential cascade behavior across relational tables.



### Exercise 4: Setting Foreign Key Action Rules

**Problem:** Add foreign key specifying `ON DELETE SET NULL` and `ON UPDATE CASCADE`.

**Expected output:**
```text
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
```

> [!check]- Answer
> ```sql
> ALTER TABLE orders
> ADD CONSTRAINT fk_user
> FOREIGN KEY (user_id) REFERENCES users(id)
> ON DELETE SET NULL ON UPDATE CASCADE;
> ```
>
> **Explanation:** Foreign key action rules dictate cascading behavior for parent updates and deletions.

### Exercise 5: Foreign Key Action Options List

**Problem:** List 4 foreign key ON DELETE / ON UPDATE actions (`NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`).

**Expected output:**
```text
NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT
```

> [!check]- Answer
> ```text
> NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT
> ```
>
> **Explanation:** Action options control referential cascade behavior across relational tables.

## 7. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The parent constraint.
- [Referential Integrity](referential_integrity.md) — The parent safety concept.

---

## 8. Key Takeaways
- Referential actions automate child table updates during parent modifications.
- `CASCADE` deletes or updates child rows when the parent row is modified.
- `SET NULL` detaches references by setting the child foreign key column to `NULL`.
- `RESTRICT` and `NO ACTION` (default) block parent updates if child links exist.
- Never pair `ON DELETE SET NULL` with a `NOT NULL` column constraint.
- Think carefully before using `CASCADE` on large tables to avoid unintended data loss.
