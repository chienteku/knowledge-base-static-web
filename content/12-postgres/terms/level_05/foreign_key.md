# `FOREIGN KEY`

> **Level 5 — Table Relationships & JOINs**
> A constraint applied to a column (or set of columns) in a child table that creates a structural link pointing to the `PRIMARY KEY` (or a `UNIQUE` column) of a parent table, enforcing referential integrity.

---

## 1. Prerequisites
- [Referential Integrity](referential_integrity.md) — The logical consistency standard.
- [`PRIMARY KEY`](../level_02/primary_key.md) — The parent unique identifier targeted by references.

---

## 2. Term Category

**Constraint** (Referential Integrity Link): A `FOREIGN KEY` constraint enforces referential integrity by linking a column in a child table to the primary key of a parent table.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Stored inside the `pg_constraint` catalog. The query engine automatically builds validation locks on write transactions to verify foreign key values).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Creating Tables with Foreign Key Constraints

**Scenario:**
Create an `orders` table referencing `users(id)` with explicit foreign key constraint naming.

**Requirements:**
1. Include `CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE orders (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   user_id INTEGER NOT NULL,
>   total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
>   CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)
> );
> ```
>
> #### Technical Explanation
>
> 1. `FOREIGN KEY (user_id) REFERENCES users(id)` links child order rows to parent user rows.
> 2. Rejects `INSERT` or `UPDATE` attempts with invalid `user_id` values that do not exist in `users`.
> 3. Enforces referential integrity at the database engine tier.

---

### Exercise 2: Adding Foreign Keys to Existing Tables

**Scenario:**
Add a foreign key constraint to an existing `posts` table linking `author_id` to `users(id)`.

**Requirements:**
1. Execute `ALTER TABLE posts ADD CONSTRAINT fk_posts_author_id FOREIGN KEY (author_id) REFERENCES users(id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE posts 
> ADD CONSTRAINT fk_posts_author_id 
> FOREIGN KEY (author_id) REFERENCES users(id);
> ```
>
> #### Technical Explanation
>
> 1. `ALTER TABLE ... ADD CONSTRAINT` verifies that all existing `author_id` values in `posts` exist in `users`.
> 2. Automatically fails if orphan `author_id` values exist.
> 3. Schema hardening migration step.

---

### Exercise 3: Handling Foreign Key Violation Errors (23503)

**Scenario:**
Catch PostgreSQL Error Code `23503` (`foreign_key_violation`) when an application attempts to insert an order for a non-existent `user_id`.

**Requirements:**
1. Code Node.js error handling for Error `23503`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await pool.query("INSERT INTO orders (user_id, total_cents) VALUES ($1, $2)", [9999, 5000]);
> } catch (err: any) {
>   if (err.code === "23503") {
>     console.error("Referential Error: User ID does not exist!", err.detail);
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL throws Error Code `23503` (`foreign_key_violation`) when a foreign key link fails to resolve.
> 2. Driver exposes `err.detail` specifying the failing key pair.
> 3. Maps to HTTP 400 Bad Request responses in application APIs.

---



## 6. Related Terms
- [Referential Integrity](referential_integrity.md) — The core database safety standard.
- [`ON DELETE` / `ON UPDATE` Actions (`CASCADE`, `SET NULL`, `RESTRICT`)](on_delete_update.md) — Custom parent delete behaviors.
- [Natural Key vs. Surrogate Key](natural_vs_surrogate_key.md) — Related concept: Natural Key vs. Surrogate Key.
- [One-to-Many Relationship](one_to_many.md) — Related concept: One-to-Many Relationship.
- [One-to-One Relationship](one_to_one.md) — Related concept: One-to-One Relationship.
- [Junction Table (Bridge / Pivot Table)](junction_table.md) — Junction tables.
- [`PRIMARY KEY`](../level_02/primary_key.md) — Related concept: `PRIMARY KEY`.
- [`INNER JOIN`](inner_join.md) — Related concept: `INNER JOIN`.

---

## 7. Key Takeaways
- A foreign key creates a structural link pointing to another table's unique columns.
- The parent table holds the referenced key; the child table holds the referencing key.
- Declared inline (`REFERENCES`) or at the table level (`FOREIGN KEY`).
- Rejects inserts in child tables that do not match existing keys in parent tables.
- Blocks deletions of parent rows if dependent child rows still exist.
- Standard convention is to point foreign keys to parent `PRIMARY KEY` columns.
