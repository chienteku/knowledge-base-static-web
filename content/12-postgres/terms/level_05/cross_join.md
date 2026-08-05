# `CROSS JOIN`

> **Level 5 — Table Relationships & JOINs**
> The SQL join operation that returns the Cartesian product of two tables, pairing every row from the first table with every row from the second table without any matching conditions.

---

## 1. Prerequisites
- [`JOIN` (Concept)](join_concept.md) — The parent table combination mechanics.
---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Evaluated as a nested-loop scan. Bypasses join index rules because no logical key filtering occurs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard SQL joins (`INNER`, `LEFT`) are used to link tables based on matching keys. 

But sometimes, you need to generate **every possible combination** between two lists:
-   You sell T-shirts in 3 colors (Red, Green, Blue) and 4 sizes (Small, Medium, Large, XL). You want to write a script to populate your catalog with all 12 options.
-   You have a list of 5 players and a list of 5 game levels. You want to generate a tracking sheet mapping every player to every game level.

In these scenarios, sizes and colors have no "matching key" column. They are independent lists.

We designed the **`CROSS JOIN`** to solve this. 

It calculates the **Cartesian Product** of two datasets: it takes Row 1 of Table A, pairs it with every row of Table B, then takes Row 2 of Table A, pairs it with every row of Table B, and so on.

---

### (2) The Output Scale Rule
The row count of a cross join is multiplicative:
$$\text{Output Rows} = \text{Rows in Table A} \times \text{Rows in Table B}$$

Because no `ON` filtering clause is used, the output can grow extremely large.

---

### (3) Reality Metaphor
Imagine a chessboard coordinate grid:
-   **Table A** contains letters representing columns: `[A, B, C, D, E, F, G, H]` (8 rows).
-   **Table B** contains numbers representing rows: `[1, 2, 3, 4, 5, 6, 7, 8]` (8 rows).
-   **A CROSS JOIN** pairs every letter with every number. It generates the coordinate map for the entire board: `(A1, A2 ... H7, H8)`, resulting in exactly **64 squares** (8 x 8).

---

### (4) Code Examples

#### Generating Options Matrix
```sql
CREATE TABLE sizes (size_code VARCHAR(5));
CREATE TABLE colors (color_name VARCHAR(20));

INSERT INTO sizes VALUES ('S'), ('M'), ('L');
INSERT INTO colors VALUES ('Red'), ('Blue');

-- CROSS JOIN color variations
SELECT colors.color_name, sizes.size_code
FROM colors
CROSS JOIN sizes;
-- Output (2 colors x 3 sizes = 6 rows):
-- color_name | size_code 
-- ------------+-----------
-- Red        | S
-- Red        | M
-- Red        | L
-- Blue       | S
-- Blue       | M
-- Blue       | L
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accidental CROSS JOINs via comma-join syntax in legacy SQL scripts

**The mistake:** Listing two tables in the `FROM` clause separated by a comma, but forgetting to write a matching condition in the `WHERE` clause:

```sql
-- DANGER: Accidental Cross Join!
SELECT * FROM orders, customers;
```

**Why it's wrong:** In legacy SQL standards, listing tables with a comma (`FROM A, B`) behaves as an implicit cross join. If you forget to write `WHERE orders.customer_id = customers.id`, Postgres will cross-join them. If you have 10,000 orders and 10,000 customers, this query will generate **100 million rows**, locking up server RAM and crashing your database.

**Fix: Never use comma-based joins (`FROM A, B`). Always use explicit `JOIN` keywords (`JOIN`, `LEFT JOIN`) which force you to write the matching `ON` clause.**

---



### Mistake 2: Executing `CROSS JOIN` Accidental Cartesian Product Traps on Large Tables

**The mistake:** Executing `SELECT * FROM table_a CROSS JOIN table_b;` on two 10,000 row tables.

**Why it's wrong:** A `CROSS JOIN` produces a Cartesian product multiplying row counts ($10,000 	imes 10,000 = 100,000,000$ rows!), consuming massive RAM and CPU.

*Incorrect:*
```sql
SELECT * FROM users CROSS JOIN orders; -- ❌ Cartesian product explosion!
```

*Fix:*
```sql
SELECT * FROM users u JOIN orders o ON u.id = o.user_id; -- Inner JOIN with join predicate
```

### Mistake 3: Writing Implicit Comma Joins `FROM table1, table2` Omitting WHERE Predicates

**The mistake:** Writing `SELECT * FROM users, orders;` expecting an INNER JOIN.

**Why it's wrong:** Writing comma-separated tables in `FROM` without a `WHERE` join clause generates an implicit `CROSS JOIN` Cartesian product.

*Incorrect:*
```sql
SELECT * FROM users, orders; -- Implicit Cartesian product!
```

*Fix:*
```sql
SELECT * FROM users JOIN orders ON users.id = orders.user_id;
```



### Mistake 4: Executing `CROSS JOIN` Accidental Cartesian Product Traps on Large Tables

**The mistake:** Executing `SELECT * FROM table_a CROSS JOIN table_b;` on two 10,000 row tables.

**Why it's wrong:** A `CROSS JOIN` produces a Cartesian product multiplying row counts ($10,000 	imes 10,000 = 100,000,000$ rows!), consuming massive RAM and CPU.

*Incorrect:*
```sql
SELECT * FROM users CROSS JOIN orders; -- ❌ Cartesian product explosion!
```

*Fix:*
```sql
SELECT * FROM users u JOIN orders o ON u.id = o.user_id; -- Inner JOIN with join predicate
```

### Mistake 5: Writing Implicit Comma Joins `FROM table1, table2` Omitting WHERE Predicates

**The mistake:** Writing `SELECT * FROM users, orders;` expecting an INNER JOIN.

**Why it's wrong:** Writing comma-separated tables in `FROM` without a `WHERE` join clause generates an implicit `CROSS JOIN` Cartesian product.

*Incorrect:*
```sql
SELECT * FROM users, orders; -- Implicit Cartesian product!
```

*Fix:*
```sql
SELECT * FROM users JOIN orders ON users.id = orders.user_id;
```

## 6. Practice Exercises

### Exercise 1: Tournament Matchup Grid

**Problem:** You have a chess tournament table `players` (columns: `player_name`) containing 3 rows: `'Alice'`, `'Bob'`, `'Charlie'`. You want to generate a schedule where every player plays a match against every other player (including playing against themselves for board testing). Write the SQL query to generate all matchups.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT p1.player_name AS white, p2.player_name AS black 
> FROM players AS p1
> CROSS JOIN players AS p2;
> ```
> - You can cross-join a table to itself (a self cross-join) by assigning two different table aliases (e.g. `p1` and `p2`).
> - Do not include an `ON` clause since cross joins match everything.

---



### Exercise 2: Generating Combinatorial Matrix with CROSS JOIN

**Problem:** Generate all possible size (`sizes`) and color (`colors`) product combinations using `CROSS JOIN`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT s.size_name, c.color_name FROM sizes s CROSS JOIN colors c;
> ```
> ```sql
> SELECT s.size_name, c.color_name
> FROM sizes s
> CROSS JOIN colors c;
> ```
>
> **Explanation:** `CROSS JOIN` produces every combination of rows from LHS and RHS tables.

---

### Exercise 3: Cartesian Row Count Calculation

**Problem:** Calculate output row count for `CROSS JOIN` between Table A (100 rows) and Table B (50 rows) ($100 	imes 50 = 5,000$).

**Expected output:**
> [!check]- Answer
> ```text
> 5,000 rows (100 * 50)
> ```
> ```text
> 5,000 rows (100 * 50)
> ```
>
> **Explanation:** Cartesian product row counts equal $N_{	ext{rows}(A)} 	imes N_{	ext{rows}(B)}$.

## 7. Related Terms
- [`JOIN` (Concept)](join_concept.md) — The parent operation.
- [Self-Join](self_join.md) — Joining a table to itself.
---

## 8. Key Takeaways
- `CROSS JOIN` matches every row of Table A with every row of Table B.
- Generates the mathematical Cartesian product of two datasets.
- Does not use an `ON` clause; all matches are unconditional.
- Output row count scales multiplicatively (Rows A * Rows B).
- Avoid running cross joins on large tables to prevent severe query lags.
- Never use legacy comma-join syntax (`FROM A, B`) to avoid accidental cross joins.
