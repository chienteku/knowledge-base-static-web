# `CHECK` Constraint

> **Level 2 — Core Data Types & Constraints**
> A validation constraint that evaluates a custom boolean expression (e.g. `price > 0`) on columns before allowing inserts or updates, rejecting any rows that violate the logical condition.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding table columns setup.

---

## 2. Term Category
- **PostgreSQL Constraint**

---

## 3. Environment Context
- **PostgreSQL Core** (Evaluated in-memory during write operations. Blocks transactions before writing bytes to storage files if validation conditions fail).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While data types prevent you from putting text in number columns, they are too broad to enforce business logic:
-   An `INTEGER` column for `age` will happily accept `-5` or `120000`.
-   A `NUMERIC` price column will accept negative prices (like `-$19.99`).

If your application backend code has a validation bug, these nonsensical values will slide into your database, leading to accounting errors or application crashes.

We designed the **`CHECK`** constraint to serve as the ultimate line of defense for data quality. 

It lets you write a logical test (a boolean expression) on a column. If an incoming write fails the test, Postgres immediately cancels the transaction and returns a validation error.

---

### (2) Multi-Column Validation
`CHECK` constraints are not limited to single columns. You can write rules that compare different columns in the same row. For example, you can verify that an item's `sale_price` is always less than its original `regular_price`.

---

### (3) The NULL Check Behavior
A critical rule of SQL check constraints is: **A write is only rejected if the expression evaluates strictly to `FALSE`.**

If a column value is `NULL`, the check expression evaluates to `UNKNOWN` (which is treated as `NULL`). 

Because it is not `FALSE`, **the check constraint will let `NULL` values pass!** If you want to prevent empty values, you must use a `NOT NULL` constraint alongside your `CHECK` rule.

---

### (4) Reality Metaphor
Imagine a parking garage entrance:
-   At the entrance gate, there is a physical **clearance bar** hung from chains.
-   The bar sits exactly 7 feet off the ground.
-   If a vehicle under 7 feet drives in, it passes.
-   If a tall box truck (e.g. 10 feet) tries to enter, it hits the bar (evaluates to `FALSE`), and is physically blocked from entering the garage (the database).

The clearance bar is a **CHECK constraint** (`vehicle_height < 7.0`).

---

### (5) Code Examples

#### Creating CHECK Constraints
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  
  -- Single column checks
  price NUMERIC(10,2) CHECK (price >= 0),
  discount NUMERIC(10,2) CHECK (discount >= 0),
  
  -- Multi-column check (declared at the bottom of the table)
  CONSTRAINT check_discount_limit CHECK (discount <= price)
);
```

#### Constraint Violation Failure
Let's see what happens when we violate a rule:

```sql
INSERT INTO products (id, name, price, discount) VALUES (1, 'USB Cable', 10.00, 2.00);

-- This crashes because price is negative!
INSERT INTO products (id, name, price, discount) VALUES (2, 'Error Cable', -5.00, 0.00);
-- ERROR: new row for relation "products" violates check constraint "products_price_check"

-- This crashes because discount exceeds price!
INSERT INTO products (id, name, price, discount) VALUES (3, 'Error Box', 10.00, 15.00);
-- ERROR: new row violates check constraint "check_discount_limit"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing a CHECK constraint blocks NULL values

**The mistake:** Declaring `age INTEGER CHECK (age >= 18)` and assuming it prevents users from registering without an age.

**Why it's wrong:** If a user omits their age, the database writes `NULL`. The check expression evaluates to `NULL >= 18`, which is `UNKNOWN`. Since it is not `FALSE`, Postgres allows the write.

**Fix: Combine the check with a `NOT NULL` constraint if the field must be required.**

```sql
/* Correct approach */
age INTEGER NOT NULL CHECK (age >= 18)
```

---



### Mistake 2: Failing to Handle NULL Evaluation in CHECK Constraints

**The mistake:** Writing `CHECK (age >= 18)` expecting it to reject rows where `age` is `NULL`.

**Why it's wrong:** In SQL, CHECK constraints pass if the expression evaluates to `TRUE` OR `NULL`! If `age` is `NULL`, `NULL >= 18` is `NULL`, which PASSES the check! Combine `NOT NULL` with `CHECK`.

*Incorrect:*
```sql
CREATE TABLE users ( age INT CHECK (age >= 18) ); -- Passes when age IS NULL!
```

*Fix:*
```sql
CREATE TABLE users ( age INT NOT NULL CHECK (age >= 18) );
```

### Mistake 3: Using Non-Deterministic Functions inside CHECK Constraints

**The mistake:** Writing `CHECK (created_at <= NOW())`.

**Why it's wrong:** CHECK constraints MUST be deterministic functions operating strictly on row column values. System functions like `NOW()` or `CURRENT_TIMESTAMP` are forbidden in CHECK constraints.

*Incorrect:*
```sql
ALTER TABLE t ADD CHECK (date_col <= NOW()); -- ❌ Error: cannot use system function in check!
```

*Fix:*
```sql
Use triggers or application layer validation for dynamic date checks
```

## 6. Practice Exercises

### Exercise 1: School Grading Rules

**Problem:** You are building a student tracking database. Write a SQL `CREATE TABLE` query for a table named `course_grades` containing:
1.  An auto-generated ID.
2.  A student name text field (required).
3.  A numeric grade column `score` (required, must be between `0.0` and `100.0` inclusive).

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE course_grades (
>   id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   student_name VARCHAR(100) NOT NULL,
>   score NUMERIC(5,2) NOT NULL CHECK (score >= 0.0 AND score <= 100.0)
> );
> ```
> - Combine numeric range constraints using the logical operator `AND`.
> - Don't forget the required constraints on name and score.

---



### Exercise 2: Adding Multi-Column CHECK Constraint

**Problem:** Add CHECK constraint ensuring `end_date >= start_date` on `events` table.

**Expected output:**
> [!check]- Answer
> ```text
> ALTER TABLE events ADD CONSTRAINT check_dates CHECK (end_date >= start_date);
> ```
> ```sql
> ALTER TABLE events ADD CONSTRAINT check_dates CHECK (end_date >= start_date);
> ```
>
> **Explanation:** Multi-column CHECK constraints validate logical relationships across table columns.

---

### Exercise 3: CHECK Constraint Array Length Validation

**Problem:** Write CHECK constraint validating array `tags` contains between 1 and 5 items using `array_length()`.

**Expected output:**
> [!check]- Answer
> ```text
> CHECK (array_length(tags, 1) BETWEEN 1 AND 5)
> ```
> ```sql
> ALTER TABLE posts ADD CONSTRAINT check_tags_count CHECK (array_length(tags, 1) BETWEEN 1 AND 5);
> ```
>
> **Explanation:** Functions operating deterministically on row arrays can be evaluated inside CHECK constraints.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The typing foundation.
- [`NOT NULL` Constraint](not_null.md) — Often paired with check rules.

---

## 8. Key Takeaways
- `CHECK` constraints validate database inputs against custom boolean expressions.
- Rejects inserts and updates if the expression evaluates to `FALSE`.
- Lets `NULL` values pass; combine with `NOT NULL` to block missing records.
- Can reference multiple columns to validate dependencies in the same row.
- Keeps validation rules inside the database schema, protecting data from application bugs.
