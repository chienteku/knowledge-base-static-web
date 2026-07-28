# Composite Key

> **Level 6 — Schema Design & Normalization**
> A primary key or unique constraint composed of two or more columns that together uniquely identify a single row in a table.

---

## 1. Prerequisites
- [Primary Key](../level_02/primary_key.md) — Standard single-column identifiers.
- [Junction Table (Bridge / Pivot Table)](../level_05/junction_table.md) — The bridge tables where composite keys are most commonly used.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL engines. Enforced at the index lookup layer by concatenating values into a single index node).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard primary key uses a single column (like a surrogate `id`) to uniquely identify rows. 

However, some tables do not have a single column that is naturally unique, nor do they need an artificial auto-incrementing ID.

For example, in a `course_registrations` table mapping student enrollments:
-   `student_id` is not unique (a student can take multiple courses).
-   `course_id` is not unique (a course contains multiple students).

Neither column can be the primary key alone. 

However, the **combination** of the two columns must be completely unique: a student cannot register for the exact same course twice.

We designed the **Composite Key** to solve this. 

By declaring the primary key across multiple columns, you instruct the database engine to validate the uniqueness of the *combined values*. 

This allows you to enforce business logic without creating redundant auto-increment columns or wasting index space.

---

### (2) Referencing Composite Keys
If Table A uses a composite primary key made of two columns:
`PRIMARY KEY (category_code, item_sku)`

Any child Table B that wants to reference Table A must define a **composite foreign key** containing *both* columns:

```sql
FOREIGN KEY (cat_code, sku_code) REFERENCES TableA(category_code, item_sku)
```

Because of this, using composite keys as parent keys can make child table schemas bloated and joins complex.

---

### (3) Reality Metaphor
Imagine booking a seat in a movie theater:
-   **Row Letter:** (e.g. `'Row F'`). This is not unique; there are 30 seats in Row F.
-   **Seat Number:** (e.g. `'Seat 12'`). This is not unique; every row has a Seat 12.
-   **The Composite Key:** The combination of **`('Row F', 'Seat 12')`** is completely unique. It identifies exactly one physical theater chair. No two people can buy a ticket with that exact combination.

---

### (4) Code Examples

#### Creating a Composite Primary Key
In SQL, you declare composite keys at the bottom of the table declaration block:

```sql
CREATE TABLE project_tasks (
  project_id INT,
  task_number INT,
  description TEXT,
  
  -- Composite Key: Task numbers start at 1 inside each project
  PRIMARY KEY (project_id, task_number)
);
```

#### Inserting and Testing
```sql
-- Project 10, Task 1 (succeeds)
INSERT INTO project_tasks VALUES (10, 1, 'Draft Blueprint');

-- Project 20, Task 1 (succeeds - task numbers can repeat in different projects)
INSERT INTO project_tasks VALUES (20, 1, 'Setup Repository');

-- Duplicate combination (crashes!)
INSERT INTO project_tasks VALUES (10, 1, 'Duplicate Task');
-- ERROR: duplicate key value violates unique constraint "project_tasks_pkey"
-- DETAIL: Key (project_id, task_number)=(10, 1) already exists.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using composite keys as parent anchors for tables that are heavily referenced by other tables

**The mistake:** Designing a core `users` table with a composite primary key `(first_name, last_name)`, and referencing it in 10 other tables.

**Why it's wrong:** Every child table (like `comments`, `posts`, `orders`) must store both the first name and last name strings in their own columns as foreign keys. This consumes massive amounts of disk space and requires slow string comparisons during joins.

**Fix: Default to single-column surrogate keys (like integer IDs) for core entity tables that are referenced by other tables. Reserve composite keys for link tables (junction tables) or internal organizational units.**

---



### Mistake 2: Defining Composite Primary Keys with Reversed Column Order Violating Leading Index Prefix Rules

**The mistake:** Defining `PRIMARY KEY (user_id, role_id)` and executing frequent queries filtering `WHERE role_id = 5` alone.

**Why it's wrong:** Composite primary keys build a single compound B-Tree index. Queries filtering `role_id` alone skip the leading `user_id` prefix, causing a `Seq Scan`. Create a separate index on `role_id`.

*Incorrect:*
```sql
PRIMARY KEY (user_id, role_id); -- Fails to index role_id alone queries!
```

*Fix:*
```sql
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
```

### Mistake 3: Propagating Multi-Column Composite Keys Across 5 Child Tables (Key Sprawl)

**The mistake:** Propagating a 4-column composite primary key into 5 child tables as foreign keys.

**Why it's wrong:** Multi-column foreign keys bloat child table row sizes and index sizes. Prefer surrogate primary keys (`IDENTITY` / `UUID`) for entities referenced by multiple child tables.

*Incorrect:*
```sql
// Propagating 4-column composite foreign keys to child tables
```

*Fix:*
```sql
Use surrogate id primary key alongside UNIQUE (col1, col2, col3, col4)
```

## 6. Practice Exercises

### Exercise 1: Warehouse Shelf Mapping

**Problem:** You are designing a warehouse inventory tracker. Items are stored on shelves. A shelf is identified by a `warehouse_id`, a `room_code`, and a `shelf_number`. Write the SQL `CREATE TABLE` query for a table named `shelves` containing these three columns (all are integers/codes, required) and make them the composite primary key.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE shelves (
>   warehouse_id INT NOT NULL,
>   room_code VARCHAR(10) NOT NULL,
>   shelf_number INT NOT NULL,
>   PRIMARY KEY (warehouse_id, room_code, shelf_number)
> );
> ```
> - Declare the three columns first.
> - Append the composite `PRIMARY KEY` parameter listing all three columns separated by commas.

---

### Exercise 2: Defining Composite Primary Key in DDL

**Problem:** Create junction table `order_items` with composite primary key `(order_id, item_id)`.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE order_items (
>   order_id INT REFERENCES orders(id),
>   item_id INT REFERENCES items(id),
>   quantity INT DEFAULT 1,
>   PRIMARY KEY (order_id, item_id)
> );
> ```
>
> **Explanation:** Composite primary keys enforce row uniqueness across multi-column combinations.

---

### Exercise 3: Composite Key Index Prefix Matching

**Problem:** Given composite primary key `(tenant_id, user_id)`, can query `WHERE user_id = 5` use the primary key index? (No, skips leading tenant_id prefix).

**Expected output:**
> [!check]- Answer
> ```text
> No, queries skipping the leading prefix cannot utilize compound B-Tree indexes
> ```
>
> **Explanation:** B-Tree index prefix rules mandate filtering leading composite key fields.

## 7. Related Terms
- [Primary Key](../level_02/primary_key.md) — The parent single-column key standard.
- [Junction Table (Bridge / Pivot Table)](../level_05/junction_table.md) — The primary target for composite keys.
- [Second Normal Form (2NF)](second_normal_form.md) — Slicing composite key dependencies.

---

## 8. Key Takeaways
- A composite key is a primary or unique key spanning multiple columns.
- Enforces the uniqueness of combined column value sets.
- Essential for mapping junction tables to prevent duplicate relationship rows.
- Referencing composite keys in child tables requires matching multi-column foreign keys.
- Use surrogate keys instead of composite keys for heavily referenced parent tables.
