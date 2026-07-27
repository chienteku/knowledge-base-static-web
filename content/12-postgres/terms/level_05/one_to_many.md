# One-to-Many Relationship

> **Level 5 — Table Relationships & JOINs**
> The most common relational database relationship pattern, where a single row in Table A can link to multiple rows in Table B, but each row in Table B links back to only one row in Table A.

---

## 1. Prerequisites
- [`FOREIGN KEY`](foreign_key.md) — The constraint used to implement the relationship.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all relational databases. Modeled using primary-to-foreign key index maps).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the real world, entities naturally connect in parent-child hierarchies:
-   One **User** has many **Orders**.
-   One **Blog Post** has many **Comments**.
-   One **Company Department** has many **Employees**.

To model this in a database, we need a structure that allows these connections without duplicating data. 

For example, if we tried to store a user's orders inside a single cell in the `users` table as a comma-separated list, searching or updating individual orders would be extremely difficult and slow.

We designed the **One-to-Many (1:N)** pattern to solve this cleanly:
1.  Create two separate tables.
2.  Store the "One" parent record once in Table A (e.g., `users`).
3.  Store the "Many" child records as separate rows in Table B (e.g., `orders`).
4.  Link them by placing a **Foreign Key** in Table B (the "Many" side) that points back to the Primary Key of Table A.

This keeps your database clean, searchable, and fully structured.

---

### (2) The Foreign Key Rule
In a One-to-Many relationship, **the foreign key must always be placed on the "Many" side of the relationship.**

---

### (3) Reality Metaphor
Imagine a biological family structure:
-   A **Mother** (the "One" side) can have multiple children.
-   Each **Child** (the "Many" side) has exactly one biological mother.
-   To trace the relationship, each child carries a **Birth Certificate** (the child table record) containing a field: `Mother's Name` (the foreign key pointer).
-   We do not write a list of children's names on the mother's birth certificate, because that list would have to be erased and rewritten every time she has another child.

---

### (4) Code Examples

#### Creating a One-to-Many Relationship
```sql
CREATE TABLE departments (
  id INT PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  emp_name VARCHAR(100) NOT NULL,
  
  -- Foreign Key is on the MANY side (multiple employees per department)
  department_id INT REFERENCES departments(id)
);
```

#### Visualizing the Grid Connection

**Departments Table (The "One"):**
| id | dept_name |
| :--- | :--- |
| **1** | Engineering |
| **2** | Sales |

**Employees Table (The "Many"):**
| id | emp_name | department_id |
| :--- | :--- | :--- |
| 101 | Alice | **1** (Points to Engineering) |
| 102 | Bob | **1** (Points to Engineering) |
| 103 | Charlie | **2** (Points to Sales) |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing the Foreign Key on the "One" side of the relationship

**The mistake:** Placing a `department_id` inside the `employees` table is correct. But placing an `employee_id` inside the `departments` table is wrong:

```sql
-- BAD: This restricts a department to only having ONE employee!
CREATE TABLE departments (
  id INT PRIMARY KEY,
  dept_name VARCHAR(100),
  employee_id INT REFERENCES employees(id) -- WRONG
);
```

**Why it's wrong:** Since each department row can only hold one value in the `employee_id` column, you can never assign more than one worker to that department. If you try to bypass this by creating duplicate department rows (e.g. writing two rows for 'Engineering' with different employee IDs), you duplicate category data, corrupting database consistency.

**Fix: Always identify which table represents the "Many" side, and place the foreign key constraint strictly in that table.**

---



### Mistake 2: Placing Foreign Keys on the One-Side (Parent) Table Instead of the Many-Side (Child) Table

**The mistake:** Adding `order_id` to the `users` table in a 1-to-Many relationship.

**Why it's wrong:** In a 1-to-Many relationship (1 user has MANY orders), the foreign key `user_id` MUST be stored in the child `orders` table.

*Incorrect:*
```sql
CREATE TABLE users ( order_id INT REFERENCES orders(id) ); -- ❌ Foreign key on wrong side!
```

*Fix:*
```sql
CREATE TABLE orders ( user_id INT REFERENCES users(id) ); -- Foreign key on child table
```

### Mistake 3: Omitting Foreign Key Indexes on Child Tables

**The mistake:** Creating `orders (user_id)` without building an index on `user_id`.

**Why it's wrong:** Querying all orders for a user (`WHERE user_id = 123`) forces a full table scan without an index on `user_id`.

*Incorrect:*
```sql
// Missing index on child user_id column
```

*Fix:*
```sql
CREATE INDEX idx_orders_user_id ON orders (user_id);
```



### Mistake 4: Placing Foreign Keys on the One-Side (Parent) Table Instead of the Many-Side (Child) Table

**The mistake:** Adding `order_id` to the `users` table in a 1-to-Many relationship.

**Why it's wrong:** In a 1-to-Many relationship (1 user has MANY orders), the foreign key `user_id` MUST be stored in the child `orders` table.

*Incorrect:*
```sql
CREATE TABLE users ( order_id INT REFERENCES orders(id) ); -- ❌ Foreign key on wrong side!
```

*Fix:*
```sql
CREATE TABLE orders ( user_id INT REFERENCES users(id) ); -- Foreign key on child table
```

### Mistake 5: Omitting Foreign Key Indexes on Child Tables

**The mistake:** Creating `orders (user_id)` without building an index on `user_id`.

**Why it's wrong:** Querying all orders for a user (`WHERE user_id = 123`) forces a full table scan without an index on `user_id`.

*Incorrect:*
```sql
// Missing index on child user_id column
```

*Fix:*
```sql
CREATE INDEX idx_orders_user_id ON orders (user_id);
```

## 6. Practice Exercises

### Exercise 1: Blog Post Comments Mapping

**Problem:** You are designing a blog database with `posts` and `comments` tables. A post can have hundreds of comments, but each comment belongs to exactly one post. Identify:
1.  Which table represents the "One" side, and which represents the "Many" side?
2.  Which table must contain the foreign key column?
Write the SQL schema query for the comment table.

**Expected output:**
```text
1. The `posts` table is the "One" side; the `comments` table is the "Many" side.
2. The `comments` table must contain the foreign key.
```
```sql
CREATE TABLE comments (
  id INT PRIMARY KEY,
  comment_text TEXT NOT NULL,
  post_id INT REFERENCES posts(id)
);
```

> [!check]- Answer
> - A post exists independently of comments. Comments cannot exist without a parent post.
> - The table containing the foreign key represents the child ("Many" side).

---



### Exercise 2: 1-to-Many Schema Definition

**Problem:** Create parent `publishers` and child `books` tables establishing 1-to-Many relationship.

**Expected output:**
```text
CREATE TABLE publishers ( id SERIAL PRIMARY KEY, name TEXT ); CREATE TABLE books ( id SERIAL PRIMARY KEY, title TEXT, publisher_id INT REFERENCES publishers(id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE publishers ( id SERIAL PRIMARY KEY, name TEXT );
> CREATE TABLE books (
>   id SERIAL PRIMARY KEY,
>   title TEXT,
>   publisher_id INT REFERENCES publishers(id)
> );
> ```
>
> **Explanation:** The child table `books` stores foreign key `publisher_id` referencing the parent.

### Exercise 3: Querying 1-to-Many Aggregates

**Problem:** Query publishers with total published book counts using `LEFT JOIN` and `GROUP BY`.

**Expected output:**
```text
SELECT p.name, COUNT(b.id) FROM publishers p LEFT JOIN books b ON p.id = b.publisher_id GROUP BY p.id, p.name;
```

> [!check]- Answer
> ```sql
> SELECT p.name, COUNT(b.id)
> FROM publishers p
> LEFT JOIN books b ON p.id = b.publisher_id
> GROUP BY p.id, p.name;
> ```
>
> **Explanation:** Aggregating child records summarizes 1-to-Many relationships cleanly.



### Exercise 4: 1-to-Many Schema Definition

**Problem:** Create parent `publishers` and child `books` tables establishing 1-to-Many relationship.

**Expected output:**
```text
CREATE TABLE publishers ( id SERIAL PRIMARY KEY, name TEXT ); CREATE TABLE books ( id SERIAL PRIMARY KEY, title TEXT, publisher_id INT REFERENCES publishers(id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE publishers ( id SERIAL PRIMARY KEY, name TEXT );
> CREATE TABLE books (
>   id SERIAL PRIMARY KEY,
>   title TEXT,
>   publisher_id INT REFERENCES publishers(id)
> );
> ```
>
> **Explanation:** The child table `books` stores foreign key `publisher_id` referencing the parent.

### Exercise 5: Querying 1-to-Many Aggregates

**Problem:** Query publishers with total published book counts using `LEFT JOIN` and `GROUP BY`.

**Expected output:**
```text
SELECT p.name, COUNT(b.id) FROM publishers p LEFT JOIN books b ON p.id = b.publisher_id GROUP BY p.id, p.name;
```

> [!check]- Answer
> ```sql
> SELECT p.name, COUNT(b.id)
> FROM publishers p
> LEFT JOIN books b ON p.id = b.publisher_id
> GROUP BY p.id, p.name;
> ```
>
> **Explanation:** Aggregating child records summarizes 1-to-Many relationships cleanly.

## 7. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The linking constraint.
- [One-to-One Relationship](one_to_one.md) — Linking exactly two rows.
- [Many-to-Many Relationship](many_to_many.md) — Linking multiple rows on both sides.

---

## 8. Key Takeaways
- One-to-Many links a single parent record to multiple child records.
- Modeled by placing a `FOREIGN KEY` in the "Many" (child) table.
- Put the foreign key on the child table to avoid repeating values or using arrays.
- Parent tables are queried and joined to child tables using primary key indexes.
- Represents the most common relationship pattern in relational database design.
