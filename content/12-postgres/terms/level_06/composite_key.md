# Composite Key

> **Level 6 — Schema Design & Normalization**
> A primary key or unique constraint composed of two or more columns that together uniquely identify a single row in a table.

---

## 1. Prerequisites
- [`PRIMARY KEY`](../level_02/primary_key.md) — Standard single-column identifiers.
- [Junction Table (Bridge / Pivot Table)](../level_05/junction_table.md) — The bridge tables where composite keys are most commonly used.

---

## 2. Term Category

**Constraint** (Multi-Column Identity Constraint): A Composite Key combines two or more columns to form a unique primary or candidate key identifier.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL engines. Enforced at the index lookup layer by concatenating values into a single index node).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defining Composite Primary Keys

**Scenario:**
Create an `order_items` table with a composite primary key over `(order_id, line_item_id)`.

**Requirements:**
1. Execute `CREATE TABLE order_items (order_id INT, line_item_id INT, ..., PRIMARY KEY (order_id, line_item_id))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE order_items (
>   order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
>   line_item_id INTEGER NOT NULL,
>   product_id INTEGER NOT NULL REFERENCES products(id),
>   quantity INTEGER NOT NULL CHECK (quantity > 0),
>   PRIMARY KEY (order_id, line_item_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Composite primary keys enforce uniqueness across the COMBINATION of multiple columns.
> 2. Prevents duplicate `line_item_id` values within the same `order_id`.
> 3. Creates an underlying multi-column B-tree unique index.
> 
---

### Exercise 2: Referencing Composite Primary Keys with Composite Foreign Keys

**Scenario:**
Create a `line_item_audits` table referencing composite key `(order_id, line_item_id)` in `order_items`.

**Requirements:**
1. Include `FOREIGN KEY (order_id, line_item_id) REFERENCES order_items(order_id, line_item_id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE line_item_audits (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   order_id INTEGER NOT NULL,
>   line_item_id INTEGER NOT NULL,
>   action_type TEXT NOT NULL,
>   CONSTRAINT fk_audits_order_item 
>     FOREIGN KEY (order_id, line_item_id) 
>     REFERENCES order_items(order_id, line_item_id) ON DELETE CASCADE
> );
> ```
>
> #### Technical Explanation
>
> 1. Composite foreign keys must match the exact number and order of columns in the target composite primary key.
> 2. Enforces multi-column referential integrity.
> 3. Ensures child audit records link to valid parent line items.
> 
---

### Exercise 3: Column Order Strategy for Composite Index Scans

**Scenario:**
Explain why column order in composite key `(order_id, line_item_id)` matters for `WHERE` clause index matching.

**Requirements:**
1. Contrast index usage for `WHERE order_id = 10` vs `WHERE line_item_id = 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Composite Index Left-Prefix Rule:
> - PRIMARY KEY (order_id, line_item_id) optimizes queries filtering by 'order_id' OR '(order_id AND line_item_id)'.
> - Queries filtering ONLY by leading column 'order_id' hit the composite B-tree index efficiently.
> - Queries filtering ONLY by trailing column 'line_item_id' CANNOT hit the index (requires separate index on line_item_id).
> ```
>
> #### Technical Explanation
>
> 1. Composite indexes sort entries by the leading column first.
> 2. Place the most frequently queried filtering column as the leading key.
> 3. Fundamental indexing rule.
> 
---



## 6. Related Terms
- [`PRIMARY KEY`](../level_02/primary_key.md) — The parent single-column key standard.
- [Junction Table (Bridge / Pivot Table)](../level_05/junction_table.md) — The primary target for composite keys.
- [Second Normal Form (2NF)](second_normal_form.md) — Slicing composite key dependencies.
- [Composite Index (Multi-column)](../level_07/composite_index.md) — Related concept: Composite Index (Multi-column).

---

## 7. Key Takeaways
- A composite key is a primary or unique key spanning multiple columns.
- Enforces the uniqueness of combined column value sets.
- Essential for mapping junction tables to prevent duplicate relationship rows.
- Referencing composite keys in child tables requires matching multi-column foreign keys.
- Use surrogate keys instead of composite keys for heavily referenced parent tables.
