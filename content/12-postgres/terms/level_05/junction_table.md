# Junction Table (Bridge / Pivot Table)

> **Level 5 — Table Relationships & JOINs**
> The physical database table that resolves a many-to-many relationship by storing foreign keys referencing the primary keys of the two related tables.

---

## 1. Prerequisites
- [Many-to-Many Relationship](many_to_many.md) — The logical relationship model.
- [Primary Key](../level_02/primary_key.md) — Standard unique row identifiers.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Serves as the standard structural bridge inside relational schemas).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `many_to_many.md`, databases cannot link multiple rows on both sides using simple columns inside parent tables. 

We need a third physical table in the middle to store the connection pairs.

This table is called a **Junction Table** (or Bridge Table, Join Table, Pivot Table).

A junction table has a specific, optimized structure:
1.  It contains **two foreign key columns** pointing to the two parent tables.
2.  It uses a **Composite Primary Key** made by combining the two foreign key columns. This automatically prevents duplicate relationship rows (e.g., enrolling the same student in the same course twice).
3.  It can store **relationship-specific metadata**. For example, in a `student_courses` table, you can store a `grade` column or an `enrollment_date` timestamp. This metadata belongs to the *relationship itself*, not to the student alone or the course alone.

---

### (2) Why not use an auto-incrementing ID?
Many developers are tempted to put a standard `id SERIAL PRIMARY KEY` on every junction table. 

While this works, it is an anti-pattern. 

It wastes storage space and requires the database to maintain an unnecessary index. 

By defining the primary key as `PRIMARY KEY (student_id, course_id)`, you achieve two things in one step:
-   You guarantee that each student can only enroll in a course once.
-   You create a high-speed search index on the combination, optimizing lookup speeds when joining the tables.

---

### (3) Reality Metaphor
Imagine a company raffle:
-   **Employees** have tickets.
-   **Prizes** are displayed on the stage.
-   To link winners to prizes, the organizer writes matching entries on a **Raffle Ledger Sheet** (the Junction Table).
-   Each row on the sheet records: `Employee ID` and `Prize ID`.
-   The sheet can also contain a column for `Claim Date` (metadata).
-   No one gets a prize without an entry in the ledger sheet.

---

### (4) Code Examples

#### Creating a Junction Table in SQL
Let's build a many-to-many relationship mapping students and courses:

```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);

-- The Junction Table
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  
  -- Metadata columns
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  grade VARCHAR(2),
  
  -- Composite Primary Key enforces uniqueness of the combination
  PRIMARY KEY (student_id, course_id)
);
```

#### Preventative Rejection of Duplicates
```sql
INSERT INTO students (id, name) VALUES (1, 'Alice');
INSERT INTO courses (id, title) VALUES (10, 'History');

-- 1. Alice enrolls in History (succeeds)
INSERT INTO enrollments (student_id, course_id) VALUES (1, 10);

-- 2. Alice tries to enroll in History AGAIN (crashes!)
INSERT INTO enrollments (student_id, course_id) VALUES (1, 10);
-- ERROR: duplicate key value violates unique constraint "enrollments_pkey"
-- DETAIL: Key (student_id, course_id)=(1, 10) already exists.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to enforce uniqueness on the foreign key combinations

**The mistake:** Creating a junction table with an auto-incrementing ID primary key, but failing to add a unique constraint to the two foreign key columns.

```sql
-- BAD: Alice can enroll in History 10 separate times!
CREATE TABLE enrollments (
  id INT PRIMARY KEY, -- Unnecessary index bloat
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id)
);
```

**Why it's wrong:** Without a composite primary key or a unique constraint on `(student_id, course_id)`, the table is just a standard One-to-Many log. A bug in your frontend app can trigger duplicate enrollments, corrupting database statistics (like counting average classroom grades).

**Fix: Define the primary key of the junction table as the combination of the two foreign key columns, or apply a unique constraint `UNIQUE (student_id, course_id)`.**

---



### Mistake 2: Omitting Composite Primary Key or Unique Constraints on Junction Tables

**The mistake:** Creating `student_courses (student_id, course_id)` without a primary key.

**Why it's wrong:** Omitting primary keys permits inserting duplicate pairs `(student 1, course 1)` multiple times. Create a composite primary key `PRIMARY KEY (student_id, course_id)`.

*Incorrect:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT ); -- ❌ Allows duplicate links!
```

*Fix:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT, PRIMARY KEY (student_id, course_id) );
```

### Mistake 3: Forgetting Indexes on the Second Foreign Key Column in Junction Tables

**The mistake:** Creating composite primary key `PRIMARY KEY (student_id, course_id)` without an index on `course_id` alone.

**Why it's wrong:** The composite primary key index covers queries filtering `student_id`. Queries looking up all students in a `course_id` cannot use the leading `student_id` index. Create an index on `course_id`.

*Incorrect:*
```sql
// Missing separate index on course_id in junction table
```

*Fix:*
```sql
CREATE INDEX idx_student_courses_course_id ON student_courses (course_id);
```



### Mistake 4: Omitting Composite Primary Key or Unique Constraints on Junction Tables

**The mistake:** Creating `student_courses (student_id, course_id)` without a primary key.

**Why it's wrong:** Omitting primary keys permits inserting duplicate pairs `(student 1, course 1)` multiple times. Create a composite primary key `PRIMARY KEY (student_id, course_id)`.

*Incorrect:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT ); -- ❌ Allows duplicate links!
```

*Fix:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT, PRIMARY KEY (student_id, course_id) );
```

### Mistake 5: Forgetting Indexes on the Second Foreign Key Column in Junction Tables

**The mistake:** Creating composite primary key `PRIMARY KEY (student_id, course_id)` without an index on `course_id` alone.

**Why it's wrong:** The composite primary key index covers queries filtering `student_id`. Queries looking up all students in a `course_id` cannot use the leading `student_id` index. Create an index on `course_id`.

*Incorrect:*
```sql
// Missing separate index on course_id in junction table
```

*Fix:*
```sql
CREATE INDEX idx_student_courses_course_id ON student_courses (course_id);
```

## 6. Practice Exercises

### Exercise 1: E-commerce Order Items Setup

**Problem:** You are building an e-commerce schema. You have a `products` table (`id` primary key) and an `orders` table (`id` primary key). An order can contain multiple products, and a product can appear on multiple orders. 

Write the SQL query to create a junction table named `order_items` that links them. The table must:
1.  Reference the two parent IDs.
2.  Use a composite primary key.
3.  Include an integer metadata column `quantity` (required, defaults to `1`).

**Expected output:**
```sql
CREATE TABLE order_items (
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (order_id, product_id)
);
```

> [!check]- Answer
> - Match the column data types of the foreign keys to the parent IDs.
> - Declare the composite primary key at the bottom of the statement.

---



### Exercise 2: Defining Junction Table Schema

**Problem:** Create junction table `user_roles` linking `user_id` and `role_id` with composite primary key and foreign keys.

**Expected output:**
```text
CREATE TABLE user_roles ( user_id INT REFERENCES users(id) ON DELETE CASCADE, role_id INT REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY (user_id, role_id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE user_roles (
>   user_id INT REFERENCES users(id) ON DELETE CASCADE,
>   role_id INT REFERENCES roles(id) ON DELETE CASCADE,
>   PRIMARY KEY (user_id, role_id)
> );
> ```
>
> **Explanation:** Junction tables establish normalized Many-to-Many relationships between entities.

### Exercise 3: Querying Many-to-Many via Junction Table

**Problem:** Query all role names for user `user_id = 1` by joining `users`, `user_roles`, and `roles`.

**Expected output:**
```text
SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = 1;
```

> [!check]- Answer
> ```sql
> SELECT r.name
> FROM roles r
> JOIN user_roles ur ON r.id = ur.role_id
> WHERE ur.user_id = 1;
> ```
>
> **Explanation:** Joining entities through junction tables resolves Many-to-Many entity relationships.



### Exercise 4: Defining Junction Table Schema

**Problem:** Create junction table `user_roles` linking `user_id` and `role_id` with composite primary key and foreign keys.

**Expected output:**
```text
CREATE TABLE user_roles ( user_id INT REFERENCES users(id) ON DELETE CASCADE, role_id INT REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY (user_id, role_id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE user_roles (
>   user_id INT REFERENCES users(id) ON DELETE CASCADE,
>   role_id INT REFERENCES roles(id) ON DELETE CASCADE,
>   PRIMARY KEY (user_id, role_id)
> );
> ```
>
> **Explanation:** Junction tables establish normalized Many-to-Many relationships between entities.

### Exercise 5: Querying Many-to-Many via Junction Table

**Problem:** Query all role names for user `user_id = 1` by joining `users`, `user_roles`, and `roles`.

**Expected output:**
```text
SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = 1;
```

> [!check]- Answer
> ```sql
> SELECT r.name
> FROM roles r
> JOIN user_roles ur ON r.id = ur.role_id
> WHERE ur.user_id = 1;
> ```
>
> **Explanation:** Joining entities through junction tables resolves Many-to-Many entity relationships.

## 7. Related Terms
- [Many-to-Many Relationship](many_to_many.md) — The parent logical relationship.
- [Composite Key](../level_06/composite_key.md) — Forward reference: keys composed of multiple columns.

---

## 8. Key Takeaways
- A junction table connects two tables to resolve many-to-many relationships.
- Contains at least two foreign key columns pointing to the parent tables.
- Uses a composite primary key `PRIMARY KEY (col1, col2)` to prevent duplicates.
- Avoids storage and index bloat associated with auto-incrementing ID fields.
- Allows storing metadata columns that belong specifically to the relationship.
