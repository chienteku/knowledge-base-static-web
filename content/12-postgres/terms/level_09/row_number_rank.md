# `ROW_NUMBER()` / `RANK()` / `DENSE_RANK()`

> **Level 9 — Views, Functions & Advanced SQL**
> The three primary SQL window ranking functions used to assign sequential integers or relative ranks to rows within a partition based on sorting order.

---

## 1. Prerequisites
- [Window Function](window_function.md) — The calculation engine running ranking window clauses.

---

## 2. Term Category

**Advanced Feature** (Window Ranking Functions): `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` compute row sequence numbers and ordinal rankings across window partitions.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all relational SQL engines. Requires the `ORDER BY` clause inside the window definition to calculate rankings).

### (1) Design Motivation — "Why did we design this?"
In report writing, developers frequently need to assign orders or positions to rows:
-   Assign page numbers to query logs.
-   Find the top 3 highest-paid employees in each department.
-   Award gold, silver, and bronze medals to users based on scores.

If two users have the exact same score (a tie), how should the database handle the ranking? 

To give developers flexibility, SQL designed three separate ranking window functions:

---

### (2) The Three Ranking Functions

#### 1. `ROW_NUMBER()` (Unique Sequence)
Assigns a unique, consecutive integer to every single row starting at `1`. 
-   Even if two rows have the exact same sorting values, they will get different numbers (e.g. `1, 2, 3, 4`).
-   *Best for:* Pagination, sorting indexes, and row deduplication.

#### 2. `RANK()` (Olympic Ties with Gaps)
Assigns the same rank to tied rows. 

Crucially, **it skips subsequent ranks** to account for the tie. 
-   If two runners tie for 1st place, they both get rank `1`. The next runner gets rank **`3`** (skipping rank 2).
-   Sequence: `1, 1, 3, 4`.
-   *Best for:* Standard sports leaderboards.

#### 3. `DENSE_RANK()` (Ties without Gaps)
Assigns the same rank to tied rows, but **never skips ranks**. 
-   If two runners tie for 1st place, they both get rank `1`. The next runner gets rank **`2`**.
-   Sequence: `1, 1, 2, 3`.
-   *Best for:* Dense groups (like academic grades or product price tier groups).

---

### (3) Reality Metaphor (Sports Podium)
-   **ROW_NUMBER:** The gate official hands out entrance badges as runners cross the line. Runner Alice gets Badge `1`, Runner Bob (who crossed at the exact same millisecond as Alice) gets Badge `2`, and Runner Charlie gets Badge `3`.
-   **RANK:** Alice and Bob tie for the Gold Medal. They both stand on Podium step `1`. The Silver step (Podium step `2`) is left empty because two Gold medals were awarded. Charlie gets Podium step `3`.
-   **DENSE_RANK:** Alice and Bob tie for Gold (Podium `1`). Charlie stands on Podium step `2`. No podium numbers are skipped, keeping the groups packed.

---

### (4) Code Examples

#### Comparing Rankings with Ties
Let's see how all three handle identical scores:

```sql
CREATE TABLE test_scores (
  student VARCHAR(50),
  score INT
);

INSERT INTO test_scores VALUES 
  ('Alice',   95),
  ('Bob',     95), -- Tie for 1st!
  ('Charlie', 90),
  ('David',   85);

SELECT 
  student,
  score,
  ROW_NUMBER() OVER (ORDER BY score DESC) AS row_num,
  RANK()       OVER (ORDER BY score DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rnk
FROM test_scores;
```

**Output:**
| student | score | row_num | rnk | dense_rnk |
| :--- | :--- | :--- | :--- | :--- |
| Alice | 95 | **1** | **1** | **1** |
| Bob | 95 | **2** | **1** | **1** |
| Charlie | 90 | **3** | **3** *(skips 2)* | **2** *(no skip)* |
| David | 85 | **4** | **4** | **3** |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using RANK() instead of ROW_NUMBER() for pagination or row limits

**The mistake:** Trying to fetch the top 10 items for a catalog page using `RANK() <= 10`.

**Why it's wrong:** If there are ties, `RANK()` can return more than 10 rows. E.g. if 15 products have the exact same price tied for 1st place, they all get rank `1`. 

Your query `WHERE rnk <= 10` will return all 15 products, breaking your website layout. 

Conversely, if you paginate by offset thresholds, skipped ranks will skip records.

**Fix: When you need strict page sizes or record limits, always use `ROW_NUMBER()` to ensure a clean sequential boundary.**

---



### Mistake 2: Confusing `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` Tie-Breaking Behaviors

**The mistake:** Using `RANK()` expecting sequential gapless integers when duplicate tied values exist.

**Why it's wrong:** `ROW_NUMBER()` assigns strictly unique sequential integers ($1, 2, 3, 4$). `RANK()` leaves gaps after ties ($1, 2, 2, 4$). `DENSE_RANK()` assigns sequential ranks without gaps ($1, 2, 2, 3$).

*Incorrect:*
```sql
// Using RANK() expecting gapless numbers on tied scores
```

*Fix:*
```sql
Use DENSE_RANK() for gapless ranks or ROW_NUMBER() for unique sequence numbers
```

### Mistake 3: Attempting to Filter `ROW_NUMBER()` Results directly in `WHERE` Clauses

**The mistake:** Writing `SELECT name, ROW_NUMBER() OVER (ORDER BY score DESC) AS rk FROM users WHERE rk <= 3;`.

**Why it's wrong:** Window functions evaluate AFTER `WHERE` clause filtering! You cannot reference window alias `rk` in `WHERE`. Wrap in a CTE or Subquery.

*Incorrect:*
```sql
SELECT name, ROW_NUMBER() OVER (ORDER BY score DESC) AS rk FROM users WHERE rk <= 3; -- ❌ Error!
```

*Fix:*
```sql
WITH ranked AS (SELECT name, ROW_NUMBER() OVER (ORDER BY score DESC) AS rk FROM users) SELECT * FROM ranked WHERE rk <= 3;
```

## 5. Practice Exercises

### Exercise 1: Sequencing Rows with `ROW_NUMBER()`

**Scenario:**
Assign a sequential row number (`1, 2, 3...`) to orders for each customer sorted by `created_at DESC`.

**Requirements:**
1. Execute `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id AS order_id, 
>   customer_id, 
>   total_cents, 
>   created_at,
>   ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS order_seq 
> FROM orders;
> ```
>
> #### Technical Explanation
>
> 1. `ROW_NUMBER()` assigns unique sequential integers starting at 1 for each row within a partition.
> 2. `PARTITION BY customer_id` resets the sequence counter to 1 for each distinct customer.
> 3. `ORDER BY created_at DESC` orders sequence values descending by order date.

---

### Exercise 2: Selecting Top-1 Item Per Group using `ROW_NUMBER()` Subqueries

**Scenario:**
Select ONLY the most recent order for every customer using `ROW_NUMBER()` in a CTE filter.

**Requirements:**
1. Filter `WHERE order_seq = 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH ranked_orders AS (
>   SELECT 
>     id, customer_id, total_cents, created_at,
>     ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn 
>   FROM orders
> )
> SELECT id, customer_id, total_cents, created_at 
> FROM ranked_orders 
> WHERE rn = 1;
> ```
>
> #### Technical Explanation
>
> 1. Window function outputs cannot be filtered directly in `WHERE` clauses of the same query level.
> 2. Wrapping `ROW_NUMBER()` inside a CTE or subquery enables outer `WHERE rn = 1` filtering.
> 3. Industry standard pattern for Top-N per group selection.

---

### Exercise 3: Ranking Ties: `RANK()` vs `DENSE_RANK()` vs `ROW_NUMBER()`

**Scenario:**
Compare rank outputs when 2 employees tie for 2nd place ($100, $90, $90, $80).

**Requirements:**
1. Contrast `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` tie handling.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Window Ranking Tie Behavior (Scores: 100, 90, 90, 80):
> - ROW_NUMBER(): Assigns 1, 2, 3, 4 (Arbitrary tie-breaking, no duplicate ranks).
> - RANK(): Assigns 1, 2, 2, 4 (Duplicate ranks for ties, skips rank 3!).
> - DENSE_RANK(): Assigns 1, 2, 2, 3 (Duplicate ranks for ties, NO skipped ranks!).
> ```
>
> #### Technical Explanation
>
> 1. `ROW_NUMBER()` forces distinct sequential numbers regardless of ties.
> 2. `RANK()` leaves gaps in rank sequences following ties.
> 3. `DENSE_RANK()` leaves zero gaps in rank sequences following ties.

---



## 6. Related Terms
- [Window Function](window_function.md) — The parent calculation engine.
- [`LAG()` / `LEAD()`](lag_lead.md) — Offset window functions.
- [`OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause)](window_clause.md) — Related concept: `OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause).

---

## 7. Key Takeaways
- `ROW_NUMBER()` assigns a unique, sequential number to every row.
- `RANK()` assigns identical ranks to ties and skips subsequent numbers.
- `DENSE_RANK()` assigns identical ranks to ties but never skips numbers.
- All three require an `ORDER BY` clause inside `OVER()` to resolve sequence.
- Use `ROW_NUMBER()` for pagination, limits, and row deduplication.
- Wrap ranking queries in CTEs to filter outputs (e.g. `WHERE rank = 1`).
