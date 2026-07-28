# Row (Record / Tuple)

> **Level 1 — What Is a Database?**
> A single horizontal entry in a database table representing one complete, individual instance of data (such as a single user, product, or transaction).

---

## 1. Prerequisites
- [Table (Relation)](table.md) — The parent container grid where rows live.

---

## 2. Term Category
- **Core Storage Unit**

---

## 3. Environment Context
- **Universal standard** (Commonly called a **Record** in software development and a **Tuple** in mathematical database theory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A table defines the blueprint of what data we want to collect. But to actually store data, we need a unit that represents a single, complete entity.

The **Row** is this unit. 

If the table `users` defines columns like `name`, `email`, and `age`, a **Row** is the actual user profile that binds these values together (e.g. `John Doe`, `john@example.com`, `30`). 

By grouping values horizontally:
-   You ensure all attributes for one object are kept together.
-   You allow database queries to return complete records (e.g., "Give me all information about User 12").
-   You allow the database engine to assign unique physical coordinates (Tuple IDs or TIDs) to each record on disk.

---

### (2) Reality Metaphor
Imagine a doctor's filing cabinet:
-   The cabinet drawer is the `patients` **Table**.
-   Inside the drawer, each patient has their own paper medical folder.
-   Each folder is a **Row**.

A single folder contains all values for one patient (their name, blood type, weight, and checkup date). You never mix pages from Alice's folder with Bob's folder; the folder groups their data into one unified record.

---

### (3) Code Examples

#### Inserting a Row
We insert a single, complete row by mapping values to the table's columns:

```sql
INSERT INTO users (id, name, email, age) 
VALUES (105, 'Alice Green', 'alice@example.com', 28);
```

#### Selecting a Specific Row
We retrieve a single row using a unique identifier:

```sql
SELECT * FROM users WHERE id = 105;
-- Returns a single horizontal record matching Alice's ID.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on the default database output sequence of rows

**The mistake:** Assuming that when you query a table (`SELECT * FROM users`), the database will always return rows in the exact order they were inserted.

**Why it's wrong:** Under the hood, PostgreSQL stores rows in binary blocks called "heaps." If a row is updated or deleted, Postgres moves data around to reuse empty spaces. Without an explicit sorting rule, the database engine returns rows in whatever sequence is fastest to read from the physical disk, which changes constantly.

**Fix: If you need your rows returned in a specific order, you must always append an `ORDER BY` clause to your query.**

```sql
/* Correct way to guarantee row sequence order */
SELECT * FROM users ORDER BY id ASC;
```

---



### Mistake 2: Assuming Physical Disk Row Storage Order Guarantees Query Result Order

**The mistake:** Executing `SELECT * FROM users;` expecting rows to return in insertion order.

**Why it's wrong:** In SQL databases, physical row order on disk is non-deterministic (especially after updates or deletes). ALWAYS specify explicit `ORDER BY` clauses for deterministic ordering.

*Incorrect:*
```sql
SELECT * FROM users; -- ❌ Non-deterministic row output order!
```

*Fix:*
```sql
SELECT * FROM users ORDER BY id ASC; -- Deterministic row ordering
```

### Mistake 3: Confusing System Metadata Column `ctid` with Business Primary Keys

**The mistake:** Using hidden system column `ctid` (physical tuple location) as a permanent primary key.

**Why it's wrong:** `ctid` physical tuple locations change whenever VACUUM or updates occur! Use explicit `SERIAL` or `UUID` primary keys.

*Incorrect:*
```sql
SELECT ctid, * FROM users WHERE ctid = '(0,1)'; -- ❌ Physical tuple location changes!
```

*Fix:*
```sql
SELECT * FROM users WHERE id = 1; -- Permanent primary key lookup
```

## 6. Practice Exercises

### Exercise 1: Query Output Math

**Problem:** You have a database table `products` containing 50 rows. You delete 5 rows and update the price of 10 rows. If you run a query to select all items:
`SELECT * FROM products;`
How many rows will the query return?

**Expected output:**
> [!check]- Answer
> ```text
> 45 rows! 
> Deleting 5 rows reduces the count from 50 to 45. Updating the price of 10 rows modifies the values *inside* those existing rows, but does not change the total row count of the table.
> ```
> - Differentiate between modifying columns inside a row and deleting the row entirely.
> - Calculate total rows remaining.

---



### Exercise 2: Inspecting Row Count with `COUNT(*)`

**Problem:** Count total rows in `users` table (`SELECT COUNT(*) FROM users;`).

**Expected output:**
> [!check]- Answer
> ```text
> SELECT COUNT(*) FROM users;
> ```
> ```sql
> SELECT COUNT(*) FROM users;
> ```
>
> **Explanation:** `COUNT(*)` counts total matching tuple rows in target tables.

---

### Exercise 3: Row Construction Constructor in SQL

**Problem:** Construct Row Constructor tuple literal comparing two columns `(a, b) = (1, 2)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM t WHERE (a, b) = (1, 2);
> ```
> ```sql
> SELECT * FROM t WHERE (a, b) = (1, 2);
> ```
>
> **Explanation:** Row Constructor syntax `(col1, col2)` performs multi-column tuple comparisons.

## 7. Related Terms
- [Table (Relation)](table.md) — The parent container.
- [Column (Field / Attribute)](column.md) — The vertical data parameters.

---

## 8. Key Takeaways
- A row represents a single complete record or instance of an entity in a table.
- Also called a "Record" in coding or a "Tuple" in formal relational database theory.
- Rows group related data properties horizontally.
- The order of rows on disk is not guaranteed; always use `ORDER BY` to sort query outputs.
- Deleting a row permanently removes the entire instance from the table.
