# `FOREIGN KEY`

> **Level 5 — Table Relationships & JOINs**
> A constraint applied to a column (or set of columns) in a child table that creates a structural link pointing to the `PRIMARY KEY` (or a `UNIQUE` column) of a parent table, enforcing referential integrity.

---

## 1. Prerequisites
- [Referential Integrity](referential_integrity.md) — The logical consistency standard.
- [Primary Key](../level_02/primary_key.md) — The parent unique identifier targeted by references.

---

## 2. Term Category
- **PostgreSQL Constraint**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored inside the `pg_constraint` catalog. The query engine automatically builds validation locks on write transactions to verify foreign key values).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `referential_integrity.md`, we need a physical tool to enforce table links. 

If we don't have constraints, table relationships are just "conceptual." Nothing stops a developer from typing invalid numbers or deleting records, creating orphaned rows.

We designed the **`FOREIGN KEY`** constraint to serve as the physical lock between tables:
-   **The Parent Table:** The referenced table containing the primary key anchor (e.g. `users`).
-   **The Child Table:** The referencing table containing the foreign key column (e.g. `orders`).

Once declared, the database engine enforces strict checks: if a client inserts a child record, the engine reads the foreign key cell, searches the parent table's index to confirm that key exists, and blocks the write if it does not find a match.

---

### (2) Column-Level vs. Table-Level Syntax
In SQL, you can declare foreign keys in two ways:

#### 1. Column-Level (Inline)
Best for single-column links. Quick and concise:

```sql
customer_id INT REFERENCES customers(id)
```

#### 2. Table-Level
Required if you are creating a composite foreign key (referencing a composite primary key in the parent table):

```sql
-- Declared at the bottom of the column declarations block
FOREIGN KEY (project_id, manager_id) REFERENCES projects(id, owner_id)
```

---

### (3) Reality Metaphor
Imagine a company parking pass system:
-   The security office maintains a database of **Active Employees** (Parent Table). Each employee has a unique Employee ID (Primary Key).
-   The office issues **Parking Passes** (Child Table). Each pass has a printed number box: `Employee Owner ID` (Foreign Key).
-   The database print machine is locked (Foreign Key constraint):
    1.  The machine will reject printing a parking pass with an owner ID of `999` if that employee does not exist in the employee database.
    2.  The HR office cannot delete an employee record if the parking pass drawer still shows they hold active passes.

---

### (4) Code Examples

#### Creating a Foreign Key Relationship
```sql
CREATE TABLE authors (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Table-level foreign key declaration
CREATE TABLE books (
  id INT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author_id INT,
  
  -- Declaring constraint explicitly
  CONSTRAINT fk_book_author 
    FOREIGN KEY (author_id) 
    REFERENCES authors(id)
);
```

#### Inserting and Testing
```sql
INSERT INTO authors (id, name) VALUES (1, 'J.K. Rowling');

-- Success: author_id 1 is valid
INSERT INTO books (id, title, author_id) VALUES (101, 'Harry Potter', 1);

-- Fails: author_id 5 does not exist in authors table!
INSERT INTO books (id, title, author_id) VALUES (102, 'Fake Book', 5);
-- ERROR: insert or update violates foreign key constraint "fk_book_author"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing a Foreign Key must ONLY point to a Primary Key

**The mistake:** Assuming you can never reference secondary columns like an employee email address.

**Why it's wrong:** SQL standard allows a foreign key to reference *any* column in the parent table, **as long as** that column is configured with a `UNIQUE` constraint. If a column is unique, it can serve as a valid row target. However, referencing the `PRIMARY KEY` is the industry-wide best practice because primary keys are static and indexed by default.

**Fix: When referencing secondary columns, ensure the parent column has a `UNIQUE` or `PRIMARY KEY` constraint defined.**

---



### Mistake 2: Omitting Indexes on Foreign Key Referencing Columns (Slow DELETE / UPDATE Cascades)

**The mistake:** Creating foreign key `orders (user_id) REFERENCES users(id)` without creating an index on `orders(user_id)`.

**Why it's wrong:** PostgreSQL does NOT automatically index foreign key columns! Deleting a row from `users` forces PostgreSQL to perform a full `Seq Scan` on `orders` to check referential integrity.

*Incorrect:*
```sql
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id); -- ❌ Foreign key is un-indexed!
```

*Fix:*
```sql
CREATE INDEX idx_orders_user_id ON orders (user_id); -- Index foreign key column
```

### Mistake 3: Default `ON DELETE NO ACTION` Causing Foreign Key Violation Errors on Parent Deletions

**The mistake:** Deleting a parent `user` row when child `orders` exist without configuring cascade behavior.

**Why it's wrong:** By default, foreign keys enforce `ON DELETE NO ACTION`, throwing error `update or delete on table "users" violates foreign key constraint`. Configure `ON DELETE CASCADE` or `ON DELETE SET NULL`.

*Incorrect:*
```sql
DELETE FROM users WHERE id = 1; -- ❌ Violates foreign key constraint!
```

*Fix:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```



### Mistake 4: Omitting Indexes on Foreign Key Referencing Columns (Slow DELETE / UPDATE Cascades)

**The mistake:** Creating foreign key `orders (user_id) REFERENCES users(id)` without creating an index on `orders(user_id)`.

**Why it's wrong:** PostgreSQL does NOT automatically index foreign key columns! Deleting a row from `users` forces PostgreSQL to perform a full `Seq Scan` on `orders` to check referential integrity.

*Incorrect:*
```sql
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id); -- ❌ Foreign key is un-indexed!
```

*Fix:*
```sql
CREATE INDEX idx_orders_user_id ON orders (user_id); -- Index foreign key column
```

### Mistake 5: Default `ON DELETE NO ACTION` Causing Foreign Key Violation Errors on Parent Deletions

**The mistake:** Deleting a parent `user` row when child `orders` exist without configuring cascade behavior.

**Why it's wrong:** By default, foreign keys enforce `ON DELETE NO ACTION`, throwing error `update or delete on table "users" violates foreign key constraint`. Configure `ON DELETE CASCADE` or `ON DELETE SET NULL`.

*Incorrect:*
```sql
DELETE FROM users WHERE id = 1; -- ❌ Violates foreign key constraint!
```

*Fix:*
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

## 6. Practice Exercises

### Exercise 1: Schema Integrity Setup

**Problem:** You are building a task tracker. You have a table `employees` (columns: `emp_id` PRIMARY KEY, `name`). Write the SQL `CREATE TABLE` query for a table named `tasks` containing:
1.  A task ID (`task_id` integer primary key).
2.  A description text column `task_desc` (required).
3.  An integer column `assigned_to` that references the `emp_id` of the `employees` table.

**Expected output:**
```sql
CREATE TABLE tasks (
  task_id INT PRIMARY KEY,
  task_desc TEXT NOT NULL,
  assigned_to INT REFERENCES employees(emp_id)
);
```

> [!check]- Answer
> - Map the foreign key reference using the column-level inline syntax `REFERENCES parent_table(parent_column)`.
> - Match the data type of the foreign key column (`INT`) to the parent's primary key type.

---



### Exercise 2: Adding Foreign Key Constraint with Cascade

**Problem:** Add foreign key `fk_orders_users` linking `orders.user_id` to `users.id` with `ON DELETE CASCADE`.

**Expected output:**
```text
ALTER TABLE orders ADD CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

> [!check]- Answer
> ```sql
> ALTER TABLE orders
> ADD CONSTRAINT fk_orders_users
> FOREIGN KEY (user_id) REFERENCES users(id)
> ON DELETE CASCADE;
> ```
>
> **Explanation:** `ON DELETE CASCADE` automatically deletes child rows when parent rows are deleted.

### Exercise 3: Foreign Key Indexing Best Practice

**Problem:** Why should foreign key columns in child tables be indexed? (Accelerates parent row deletion checks and JOIN queries).

**Expected output:**
```text
Accelerates parent row deletion checks and JOIN queries
```

> [!check]- Answer
> ```text
> Accelerates parent row deletion checks and JOIN queries
> ```
>
> **Explanation:** B-Tree indexes on foreign keys prevent full collection scans during parent row updates/deletes.



### Exercise 4: Adding Foreign Key Constraint with Cascade

**Problem:** Add foreign key `fk_orders_users` linking `orders.user_id` to `users.id` with `ON DELETE CASCADE`.

**Expected output:**
```text
ALTER TABLE orders ADD CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

> [!check]- Answer
> ```sql
> ALTER TABLE orders
> ADD CONSTRAINT fk_orders_users
> FOREIGN KEY (user_id) REFERENCES users(id)
> ON DELETE CASCADE;
> ```
>
> **Explanation:** `ON DELETE CASCADE` automatically deletes child rows when parent rows are deleted.

### Exercise 5: Foreign Key Indexing Best Practice

**Problem:** Why should foreign key columns in child tables be indexed? (Accelerates parent row deletion checks and JOIN queries).

**Expected output:**
```text
Accelerates parent row deletion checks and JOIN queries
```

> [!check]- Answer
> ```text
> Accelerates parent row deletion checks and JOIN queries
> ```
>
> **Explanation:** B-Tree indexes on foreign keys prevent full collection scans during parent row updates/deletes.

## 7. Related Terms
- [Referential Integrity](referential_integrity.md) — The core database safety standard.
- [`ON DELETE` / `ON UPDATE` Actions](on_delete_update.md) — Custom parent delete behaviors.

---

## 8. Key Takeaways
- A foreign key creates a structural link pointing to another table's unique columns.
- The parent table holds the referenced key; the child table holds the referencing key.
- Declared inline (`REFERENCES`) or at the table level (`FOREIGN KEY`).
- Rejects inserts in child tables that do not match existing keys in parent tables.
- Blocks deletions of parent rows if dependent child rows still exist.
- Standard convention is to point foreign keys to parent `PRIMARY KEY` columns.
