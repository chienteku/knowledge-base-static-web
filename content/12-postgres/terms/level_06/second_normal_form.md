# Second Normal Form (2NF)

> **Level 6 — Schema Design & Normalization**
> The database normalization standard requiring that a table is in First Normal Form (1NF) and contains no partial dependencies, meaning every non-key column must depend on the entire primary key.

---

## 1. Prerequisites
- [First Normal Form (1NF)](first_normal_form.md) — The atomic row standard.
- [Composite Key](composite_key.md) — Forward reference: keys containing multiple columns.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Enforced during logical database schema modeling. Optimizes composite key tables by separating parent metadata from link tables).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A table can satisfy First Normal Form (all cells atomic) but still contain severe data redundancy. This typically happens in tables that use a **Composite Primary Key** (a key made of two or more columns).

For example, consider a university `enrollments` table mapping student class registrations:

| student_id | course_id | student_name | course_title | grade |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **10** | Alice | History | A |
| **1** | **11** | Alice | Math | B |

The Primary Key is the combination of **`(student_id, course_id)`**.

If we inspect the dependencies:
-   `grade` depends on **both** the student and the course. (Full Dependency).
-   `student_name` depends **only** on `student_id`. It does not care about `course_id`.
-   `course_title` depends **only** on `course_id`. It does not care about `student_id`.

Because these columns depend on only *part* of the primary key, we have **Partial Dependencies**.

This causes anomalies: if Alice registers for 10 courses, we write her name `'Alice'` 10 separate times, wasting disk space. If she changes her name, we must run multiple updates, risking data corruption.

We designed the **Second Normal Form (2NF)** to eliminate these partial dependencies.

---

### (2) The Rule of 2NF
A table is in Second Normal Form if:
1.  It satisfies **First Normal Form (1NF)**.
2.  It contains **no partial dependencies**. Every non-key column must depend on the *entirety* of the primary key.

*Crucial Rule:* **If a table is in 1NF and uses a single-column primary key (like a surrogate `id`), it is automatically in 2NF.** You cannot have a partial dependency if the primary key cannot be broken into parts.

---

### (3) Reality Metaphor
Imagine booking a workspace room:
-   Each booking receipt is identified by: **`(Room_Number, Time_Slot)`** (Composite Key).
-   The receipt records: `Meeting_Agenda` (depends on both room and time) and `Room_Wall_Color` (depends only on the Room).
-   **Violating 2NF:** Printing the room wall color on every single booking slip. If you paint the room, you have to scrape off and reprint thousands of past slips.
-   **Satisfying 2NF:** You move room details (wall color, capacity) to a separate `Rooms` ledger, leaving only the `Meeting_Agenda` on the booking slips.

---

### (4) Code Examples

#### Violating 2NF (Partial Dependencies)
```sql
-- Violates 2NF because student_name and course_title depend on part of the key
CREATE TABLE course_registrations (
  student_id INT,
  course_id INT,
  student_name VARCHAR(100),
  course_title VARCHAR(100),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);
```

#### Refactoring to 2NF
To satisfy 2NF, we split the partial columns out into their own tables. The junction table is left containing only columns that depend on the full key:

```sql
-- Table A: Student details (2NF)
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Table B: Course details (2NF)
CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);

-- Table C: The link table (2NF - grade depends on both keys)
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Worrying about 2NF on tables with single-column primary keys

**The mistake:** Spending hours analyzing a table with a single `id INT PRIMARY KEY` column to find partial key dependencies.

**Why it's wrong:** It is mathematically impossible. A single column key has no "parts" to depend on. If `id` is the key, every other column either depends on it fully or not at all.

**Fix: Focus your 2NF audits strictly on junction tables or tables that use composite primary keys.**

---



### Mistake 2: Including Non-Key Attributes That Depend on Only Part of a Composite Primary Key (2NF Violation)

**The mistake:** Creating table `order_items (order_id, item_id, item_name, quantity)` with primary key `(order_id, item_id)`.

**Why it's wrong:** `item_name` depends ONLY on `item_id`, NOT on `order_id`! This partial dependency violates 2NF. Move `item_name` to `items` table.

*Incorrect:*
```sql
-- Storing item_name inside order_items junction table
```

*Fix:*
```sql
Keep item_name in items table; order_items stores only (order_id, item_id, quantity)
```

### Mistake 3: Applying 2NF Rules to Single-Column Primary Key Tables

**The mistake:** Worrying about 2NF partial dependencies on tables with single-column primary keys (`id`).

**Why it's wrong:** Tables with single-column primary keys are AUTOMATICALLY in 2NF because partial dependencies require a multi-column composite primary key!

*Incorrect:*
```sql
// Checking partial dependencies on single column primary key table
```

*Fix:*
```sql
Tables with single-column primary keys are automatically in 2NF
```

## 6. Practice Exercises

### Exercise 1: Order Details Refactor

**Problem:** You have a table:
`order_items (order_id, product_id, product_name, unit_price, quantity)`
The primary key is `(order_id, product_id)`.
1.  Identify the partial dependencies.
2.  Write the SQL queries to normalize this schema into 2NF.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Partial Dependencies: `product_name` and `unit_price` depend only on `product_id` (not `order_id`).
> ```
> - The `quantity` column depends on both order and product, so it stays in the bridge table.
> - Split product names and prices to a dedicated catalog table.

---



### Exercise 2: Decomposing 2NF Violation

**Problem:** Decompose `student_courses (student_id, course_id, course_name, grade)` into 2NF tables.

**Expected output:**
> [!check]- Answer
> ```text
> courses (course_id, course_name) and student_courses (student_id, course_id, grade)
> ```
> ```sql
> CREATE TABLE courses ( course_id INT PRIMARY KEY, course_name TEXT );
> CREATE TABLE student_courses (
>   student_id INT REFERENCES students(id),
>   course_id INT REFERENCES courses(course_id),
>   grade VARCHAR(2),
>   PRIMARY KEY (student_id, course_id)
> );
> ```
>
> **Explanation:** Removing partial dependency `course_name` into `courses` satisfies 2NF.

---

### Exercise 3: 2NF Rule Definition

**Problem:** State 2NF rule (Table must be in 1NF and all non-key attributes must be fully functionally dependent on the entire primary key).

**Expected output:**
> [!check]- Answer
> ```text
> Must be in 1NF and no non-key attribute can depend on part of a composite primary key
> ```
> ```text
> Must be in 1NF and no non-key attribute can depend on part of a composite primary key
> ```
>
> **Explanation:** 2NF eliminates partial functional dependencies in composite key tables.

## 7. Related Terms
- [First Normal Form (1NF)](first_normal_form.md) — The prerequisite atomic standard.
- [Third Normal Form (3NF)](third_normal_form.md) — Eliminating indirect (transitive) dependencies.
- [Composite Key](composite_key.md) — Forward reference: multi-column keys.
- [Normalization](normalization.md) — Related concept: Normalization.

---

## 8. Key Takeaways
- Second Normal Form (2NF) eliminates partial primary key dependencies.
- Applies exclusively to tables that utilize composite primary keys.
- If a table has a single-column primary key and is in 1NF, it is already in 2NF.
- Resolves partial dependencies by splitting tables and using foreign keys.
- Prevents redundant storage of parent metadata in transaction junction tables.
