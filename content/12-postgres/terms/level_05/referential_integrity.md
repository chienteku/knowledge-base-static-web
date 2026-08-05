# Referential Integrity

> **Level 5 — Table Relationships & JOINs**
> The database consistency state guaranteeing that all table references (foreign keys) point to valid, existing records in their referenced tables, preventing orphaned rows.

---

## 1. Prerequisites
- [Relational Database](../level_01/relational_database.md) — The relational structural philosophy.
- [Table (Relation)](../level_01/table.md) — The data grid containers.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all relational SQL engines. Enforced at transaction commit boundaries to block corrupt data commits).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems, we divide data into separate tables to eliminate duplication. For example:
-   A `users` table stores user details (ID, name, email).
-   An `orders` table stores shopping transactions (ID, total, customer_id).

Every order references the user who bought the items by storing their unique ID in the `customer_id` column.

But what happens if a backend developer deletes a user from the `users` table, but forgets to clean up their old purchases? 

The `orders` table will now contain rows where `customer_id` points to a number that no longer exists in the system.

These are called **Orphaned Rows**. 

When your frontend application loads the orders page and attempts to fetch the buyer's name for those orders, your backend code will crash with errors like `Cannot read properties of null` because the user is gone.

We designed **Referential Integrity** to prevent this. 

It is a logical contract enforced by the database engine: the database guarantees that if Table A has a pointer column referencing Table B, the value in that column **must** match a real, active row in Table B (or be explicitly set to `NULL`). 

---

### (2) The Gatekeeper Role
To enforce referential integrity, the database intercepts write queries:
-   You cannot insert an order for a user who does not exist.
-   You cannot delete a user if they have active orders, unless you configure rules to clean up or detach those orders simultaneously.

---

### (3) Reality Metaphor
Imagine a university student library:
-   When a student borrows a textbook, the librarian clips a checkout slip to the book containing the student's unique **Library Card ID**.
-   **Referential Integrity** is the librarian checking the card registry:
    1.  A student cannot borrow a book using a fake library card number (the database rejects the insert).
    2.  The university registrar cannot delete a student's graduation files while the library card drawer still shows they have checked-out textbooks (the database rejects the delete).

---

### (4) Code Examples

#### The Integrity Contract in Action
To establish the contract, we use primary and foreign keys:

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  amount NUMERIC(10,2),
  customer_id INT REFERENCES customers(id) -- Establishes integrity connection
);
```

#### Preventative Rejection (Inserts)
```sql
INSERT INTO customers (id, name) VALUES (1, 'Alice');

-- Fails: Customer 99 does not exist!
INSERT INTO orders (id, amount, customer_id) VALUES (101, 45.00, 99);
-- ERROR: insert or update on table "orders" violates foreign key constraint
-- DETAIL: Key (customer_id)=(99) is not present in table "customers".
```

#### Preventative Rejection (Deletes)
```sql
INSERT INTO orders (id, amount, customer_id) VALUES (102, 120.00, 1);

-- Fails: We cannot delete Alice because order 102 depends on her ID!
DELETE FROM customers WHERE id = 1;
-- ERROR: update or delete on table "customers" violates foreign key constraint
-- DETAIL: Key (id)=(1) is still referenced from table "orders".
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming table relationships automatically enforce referential integrity without constraints

**The mistake:** Creating tables that reference each other using simple integer columns, and assuming the database keeps them in sync.

```sql
-- BAD: No constraints exist! 
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT -- Just a plain number, no validation!
);
```

**Why it's wrong:** Without the `REFERENCES` constraint, the database engine treats `customer_id` as a plain number. It has no idea this number points to the `customers` table, allowing developers to write fake IDs and delete users at will, resulting in orphaned records.

**Fix: Always explicitly declare `FOREIGN KEY` constraints on columns that reference other tables.**

---



### Mistake 2: Disabling Foreign Key Constraints in Production Databases

**The mistake:** Disabling foreign key constraint checks permanently in production databases to speed up inserts.

**Why it's wrong:** Disabling referential constraints permits orphaned child records, corrupted relationships, and invalid data states.

*Incorrect:*
```sql
ALTER TABLE orders DISABLE TRIGGER ALL; -- ❌ Bypasses referential integrity!
```

*Fix:*
```sql
Maintain active foreign key constraints for data integrity guarantees
```

### Mistake 3: Inserting Child Rows Referencing Non-Existent Parent IDs

**The mistake:** Executing `INSERT INTO orders (user_id) VALUES (9999);` when `user 9999` does not exist.

**Why it's wrong:** Foreign keys enforce referential integrity, throwing error `insert or update on table "orders" violates foreign key constraint`.

*Incorrect:*
```sql
INSERT INTO orders (user_id) VALUES (9999); -- ❌ Foreign key violation!
```

*Fix:*
```sql
Ensure parent user record exists before inserting child orders
```



### Mistake 4: Disabling Foreign Key Constraints in Production Databases

**The mistake:** Disabling foreign key constraint checks permanently in production databases to speed up inserts.

**Why it's wrong:** Disabling referential constraints permits orphaned child records, corrupted relationships, and invalid data states.

*Incorrect:*
```sql
ALTER TABLE orders DISABLE TRIGGER ALL; -- ❌ Bypasses referential integrity!
```

*Fix:*
```sql
Maintain active foreign key constraints for data integrity guarantees
```

### Mistake 5: Inserting Child Rows Referencing Non-Existent Parent IDs

**The mistake:** Executing `INSERT INTO orders (user_id) VALUES (9999);` when `user 9999` does not exist.

**Why it's wrong:** Foreign keys enforce referential integrity, throwing error `insert or update on table "orders" violates foreign key constraint`.

*Incorrect:*
```sql
INSERT INTO orders (user_id) VALUES (9999); -- ❌ Foreign key violation!
```

*Fix:*
```sql
Ensure parent user record exists before inserting child orders
```

## 6. Practice Exercises

### Exercise 1: Integrity Breach Analysis

**Problem:** You have a blog database with a `users` table and a `posts` table (`author_id` references `users(id)`). The current data states are:
-   `users` table: IDs `[1, 2, 3]`
-   `posts` table: `author_id` values `[1, 2, 2, 3, 1]`

You attempt to execute this statement:
`UPDATE posts SET author_id = 5 WHERE id = 2;`
What will happen, and why?

**Expected output:**
> [!check]- Answer
> ```text
> The UPDATE statement will fail with a foreign key violation error!
> Because the `posts` table has a referential integrity constraint pointing to `users`, any value written to `author_id` must match an active primary key in the `users` table. 
> Since ID 5 does not exist in the `users` table, the database blocks the query to prevent an orphaned post.
> ```
> - Inspect the list of active user IDs.
> - Verify if the target update ID is a member of that set.

---



### Exercise 2: Deferrable Foreign Key Constraints

**Problem:** Define foreign key constraint as `DEFERRABLE INITIALLY DEFERRED` to validate integrity at commit time.

**Expected output:**
> [!check]- Answer
> ```text
> ALTER TABLE child ADD CONSTRAINT fk_parent FOREIGN KEY (p_id) REFERENCES parent(id) DEFERRABLE INITIALLY DEFERRED;
> ```
> ```sql
> ALTER TABLE child
> ADD CONSTRAINT fk_parent
> FOREIGN KEY (p_id) REFERENCES parent(id)
> DEFERRABLE INITIALLY DEFERRED;
> ```
>
> **Explanation:** Deferred constraints validate referential integrity at transaction commit time instead of per-statement.

---

### Exercise 3: Referential Integrity Definition

**Problem:** Define Referential Integrity in relational databases (Ensures relationship links between tables remain valid and child rows never reference non-existent parents).

**Expected output:**
> [!check]- Answer
> ```text
> Ensures relationship links between tables remain valid and child rows never reference non-existent parents
> ```
> ```text
> Ensures relationship links between tables remain valid and child rows never reference non-existent parents
> ```
>
> **Explanation:** Referential integrity rules preserve entity relationship graph validity.

## 7. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The physical constraint that enforces integrity.
- [`ON DELETE` / `ON UPDATE` Actions (`CASCADE`, `SET NULL`, `RESTRICT`)](on_delete_update.md) — Automating cascades to preserve integrity.

---

## 8. Key Takeaways
- Referential Integrity guarantees that all database pointers link to valid, active records.
- Prevents the creation of orphaned records in child tables.
- Blocks writes (inserts/updates) that reference non-existent records.
- Blocks deletes of parent records that are still referenced by child rows.
- Must be explicitly defined using `FOREIGN KEY` constraints to be enforced.
