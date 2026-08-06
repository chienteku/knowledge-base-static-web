# One-to-Many Relationship

> **Level 5 — Table Relationships & JOINs**
> The most common relational database relationship pattern, where a single row in Table A can link to multiple rows in Table B, but each row in Table B links back to only one row in Table A.

---

## 1. Prerequisites
- [`FOREIGN KEY`](foreign_key.md) — The constraint used to implement the relationship.

---

## 2. Term Category

**Schema Design** (Parent-Child Association Pattern): A One-to-Many relationship associates a single parent row with multiple child rows via a foreign key link in the child table.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all relational databases. Modeled using primary-to-foreign key index maps).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Modeling 1-to-Many Relationships

**Scenario:**
Model a 1-to-Many association between `authors` and `books`.

**Requirements:**
1. Create `authors` and `books` tables with foreign key link in `books`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE authors (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   name TEXT NOT NULL
> );
> 
> CREATE TABLE books (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
>   title TEXT NOT NULL,
>   published_year INTEGER NOT NULL
> );
> ```
>
> #### Technical Explanation
>
> 1. One-to-Many relationships place the foreign key column on the "Many" side table (`books.author_id`).
> 2. Each book references exactly 1 author; an author can have multiple books.
> 3. Fundamental relational modeling pattern.
> 
---

### Exercise 2: Querying 1-to-Many Data with INNER JOIN

**Scenario:**
Query all books written by author `'J.K. Rowling'`.

**Requirements:**
1. Execute `SELECT b.title FROM books b JOIN authors a ON b.author_id = a.id WHERE a.name = 'J.K. Rowling'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   b.id AS book_id, 
>   b.title, 
>   b.published_year 
> FROM books AS b 
> JOIN authors AS a ON b.author_id = a.id 
> WHERE a.name = 'J.K. Rowling' 
> ORDER BY b.published_year ASC;
> ```
>
> #### Technical Explanation
>
> 1. `JOIN` resolves 1-to-Many relationship keys.
> 2. Filters books by parent author attribute.
> 3. Fast relational query.
> 
---

### Exercise 3: Aggregating 1-to-Many Child Counts

**Scenario:**
Calculate total book count per author using `COUNT(b.id)`.

**Requirements:**
1. Execute `SELECT a.name, COUNT(b.id) FROM authors a LEFT JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   a.id AS author_id, 
>   a.name, 
>   COUNT(b.id) AS total_books_published 
> FROM authors AS a 
> LEFT JOIN books AS b ON a.id = b.author_id 
> GROUP BY a.id, a.name;
> ```
>
> #### Technical Explanation
>
> 1. `LEFT JOIN` preserves authors who have 0 published books.
> 2. `COUNT(b.id)` aggregates child book rows.
> 3. Standard 1-to-Many summary report.
> 
---



## 6. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The linking constraint.
- [One-to-One Relationship](one_to_one.md) — Linking exactly two rows.
- [Many-to-Many Relationship](many_to_many.md) — Linking multiple rows on both sides.

---

## 7. Key Takeaways
- One-to-Many links a single parent record to multiple child records.
- Modeled by placing a `FOREIGN KEY` in the "Many" (child) table.
- Put the foreign key on the child table to avoid repeating values or using arrays.
- Parent tables are queried and joined to child tables using primary key indexes.
- Represents the most common relationship pattern in relational database design.
