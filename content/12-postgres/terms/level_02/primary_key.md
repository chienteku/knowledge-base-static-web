# `PRIMARY KEY`

> **Level 2 — Core Data Types & Constraints**
> The constraint that uniquely identifies each row in a table, combining `NOT NULL` and `UNIQUE` properties, and automatically generating a high-speed search index on disk.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Columns typing.
- [`NOT NULL` Constraint](not_null.md) — The requirement of non-empty fields.

---

## 2. Term Category

**Constraint** (Unique Identity Constraint): A `PRIMARY KEY` constraint uniquely identifies each row in a table by combining `NOT NULL` and `UNIQUE` constraints.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Postgres automatically builds a unique **B-Tree Index** (`pg_index` catalog) on the primary key column, optimizing physical row lookups).

### (1) Design Motivation — "Why did we design this?"
Relational databases contain tables with thousands or millions of rows. 

To manipulate data safely (e.g., updating a user's password or deleting a transaction), you must have a way to target **exactly one specific row** with absolute certainty.

If you try to target rows using natural fields:
-   **Names are not unique:** A company database might have three employees named "John Smith." If you run `DELETE WHERE name = 'John Smith'`, you will accidentally fire the wrong employees.
-   **Email fields can change:** While unique, users sometimes change their emails, breaking relationships in other tables.

We designed the **`PRIMARY KEY`** constraint to solve this. 

It forces a column to obey two strict rules:
1.  **`NOT NULL`:** The column cannot be empty. Every row must have a key.
2.  **`UNIQUE`:** No two rows in the table can ever share the same key.

By assigning a unique key (typically a sequential ID number or a UUID string) to every record, you establish a permanent, immutable target for that row.

---

### (2) Under the Hood: Automatic Indexing
When you declare a primary key, PostgreSQL automatically creates a **Unique B-Tree Index** on that column. 

Without this index, finding a user by their ID would require reading the entire table from disk. 

With the primary key index, Postgres can locate any row in milliseconds, even on tables with billions of rows.

---

### (3) Composite Primary Keys
While most tables use a single column (like `id`) as the primary key, you can create a key that spans **multiple columns**. This is called a **Composite Primary Key**. 

For example, in a table mapping student class registrations, you want to prevent a student from registering for the exact same class twice. You would make the combination of `student_id` and `class_id` the composite primary key.

---

### (4) Reality Metaphor
Imagine a nationwide passport registry:
-   Two citizens can share the exact same name, height, eye color, and birthday.
-   To identify them without error, the government assigns each citizen a unique **Passport Number**.
-   No two citizens can share a passport number, and no citizen can get a passport without a number printed on it.

---

### (5) Code Examples

#### Creating a Primary Key Column
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, -- Simple primary key
  name VARCHAR(100) NOT NULL
);
```

#### Duplicate Key Failure
Let's see what happens when we try to reuse an ID:

```sql
INSERT INTO customers (id, name) VALUES (1, 'Alice');

-- This query crashes because ID 1 already exists!
INSERT INTO customers (id, name) VALUES (1, 'Bob');
-- ERROR: duplicate key value violates unique constraint "customers_pkey"
-- DETAIL: Key (id)=(1) already exists.
```

#### Creating a Composite Primary Key
```sql
CREATE TABLE project_memberships (
  project_id INTEGER,
  employee_id INTEGER,
  role VARCHAR(50),
  -- Combine columns to form a single primary key
  PRIMARY KEY (project_id, employee_id)
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing a table can have multiple independent primary keys

**The mistake:** Declaring two columns as primary keys separately:

```sql
-- BAD: This is a syntax error!
CREATE TABLE devices (
  device_id INTEGER PRIMARY KEY,
  serial_number VARCHAR(100) PRIMARY KEY -- WRONG
);
```

**Why it's wrong:** A SQL table can only have **one** primary key. A table cannot have multiple independent structural anchors. 

**Fix: If you have a second column that must be unique (like a device serial number), define the primary key on the ID column, and apply a `UNIQUE` constraint to the serial number column.**

```sql
/* Correct approach */
CREATE TABLE devices (
  device_id INTEGER PRIMARY KEY,
  serial_number VARCHAR(100) UNIQUE -- Safe and valid
);
```

---



### Mistake 2: Creating Relational Tables Without Primary Key Constraints

**The mistake:** Creating a table `CREATE TABLE users ( name TEXT );` without a primary key.

**Why it's wrong:** Tables lacking primary keys permit duplicate rows, breaking row identity and preventing logical replication and updates.

*Incorrect:*
```sql
CREATE TABLE users ( name TEXT ); -- ❌ Missing primary key!
```

*Fix:*
```sql
CREATE TABLE users ( id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT );
```

### Mistake 3: Using Natural Business Keys (like `SSN` or `email`) That Can Mutate as Primary Keys

**The mistake:** Using user `email` string column as the primary key.

**Why it's wrong:** If a user changes their email, updating primary key values requires updating foreign key references across child tables. Prefer immutable surrogate keys (`SERIAL`, `IDENTITY`, `UUID`).

*Incorrect:*
```sql
email TEXT PRIMARY KEY -- ❌ Mutable natural primary key!
```

*Fix:*
```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email TEXT UNIQUE
```

## 5. Practice Exercises

### Exercise 1: Declaring Single-Column Primary Keys with Identity Sequences

**Scenario:**
Create a `customers` table with a surrogate primary key `id` using `GENERATED ALWAYS AS IDENTITY`.

**Requirements:**
1. Execute `CREATE TABLE customers (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, ...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE customers (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   company_name TEXT NOT NULL,
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. `PRIMARY KEY` enforces both `NOT NULL` and `UNIQUE` constraints on the `id` column automatically.
> 2. Automatically creates an underlying B-tree unique index (`customers_pkey`).
> 3. `GENERATED ALWAYS AS IDENTITY` is the modern SQL-standard replacement for legacy `SERIAL`.
> 
---

### Exercise 2: Defining Composite Primary Keys for Junction Tables

**Scenario:**
Create a `order_items` junction table with a composite primary key consisting of `(order_id, product_id)`.

**Requirements:**
1. Define `PRIMARY KEY (order_id, product_id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE order_items (
>   order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
>   product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
>   quantity INTEGER NOT NULL CHECK (quantity > 0),
>   unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
>   PRIMARY KEY (order_id, product_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Composite primary keys enforce uniqueness across the COMBINATION of specified columns.
> 2. Prevents duplicate entries for the same product within a single order.
> 3. Standard pattern for N-to-N junction tables.
> 
---

### Exercise 3: Primary Key Lookups via `EXPLAIN`

**Scenario:**
Verify that querying a row by `PRIMARY KEY` executes a single-row $O(\log N)$ B-tree index lookup (`Index Scan`).

**Requirements:**
1. Execute `EXPLAIN ANALYZE SELECT * FROM customers WHERE id = 42`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> EXPLAIN ANALYZE 
> SELECT * FROM customers WHERE id = 42;
> ```
>
> #### Technical Explanation
>
> 1. Primary key queries execute via `Index Scan` on `customers_pkey`.
> 2. `totalDocsExamined` or `rows` equals 1.
> 3. Executes in under 1 millisecond.
> 
---



## 6. Related Terms
- [`UNIQUE` Constraint](unique_constraint.md) — Ensuring distinct values without primary key anchors.
- [`SERIAL` / `GENERATED ALWAYS AS IDENTITY`](serial_identity.md) — How primary key numbers are usually generated.
- [Natural Key vs. Surrogate Key](../level_05/natural_vs_surrogate_key.md) — Related concept: Natural Key vs. Surrogate Key.
- [Composite Key](../level_06/composite_key.md) — Related concept: Composite Key.
- [`FOREIGN KEY`](../level_05/foreign_key.md) — Foreign key references.

---

## 7. Key Takeaways
- A primary key uniquely identifies each horizontal row in a table.
- A table can only have one primary key (though it can span multiple columns).
- Primary keys implicitly combine `NOT NULL` and `UNIQUE` constraint rules.
- Declaring a primary key automatically builds a high-speed search index on disk.
- Use `UNIQUE` constraints (not multiple primary keys) for secondary unique columns.
