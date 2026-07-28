# `GROUP BY` / `GROUP ALL`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clauses used to aggregate query results: `GROUP BY` groups records sharing identical field values into sub-buckets, while `GROUP ALL` merges all matching records into a single global bucket to compute system-wide totals.

---

## 1. Prerequisites
- [`SELECT`](select.md) — The parent query statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the query post-projection phase. Collects matching index nodes in memory to run mathematical aggregations before generating outputs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building analytics dashboards, you often need to calculate summary statistics:
-   What is the average order price per country?
-   How many users are active in each subscription tier?
-   What is the total sum of all sales made this month?

In standard SQL, you aggregate data using `GROUP BY`. 

If you want a global total (no grouping categories), you omit the group clause. 

In MongoDB, you write complex `$group` blocks inside aggregation pipelines.

We designed the **`GROUP BY`** and **`GROUP ALL`** clauses in SurrealQL to provide clear, SQL-aligned aggregation tools. 

`GROUP BY` splits data into categories. 

`GROUP ALL` groups everything into a single bucket. 

This makes it easy to write clean analytics queries, returning structural summary totals directly from the database server.

---

### (2) Grouping Strategies

#### 1. `GROUP BY <field_names>`
Gathers records sharing the same values for the specified fields:
`GROUP BY country, status`
-   *Restriction:* Like standard SQL, you can only select the fields specified in the `GROUP BY` clause, or fields wrapped inside aggregate functions (like `count()` or `math::sum()`).

#### 2. `GROUP ALL`
Gathers all matching query rows into a single, global bucket. 
-   This is the SurrealQL equivalent to running SQL aggregate queries without a group clause, or MongoDB's `$group: { _id: null }`.

---

### (3) Reality Metaphor (Sorting Marbles)
Imagine analyzing a bag of marbles:
-   **`GROUP BY`:** You set out three cups labeled **"Red"**, **"Blue"**, and **"Green"**. 
    -   You drop each marble from the bag into its matching color cup. 
    -   You then count the marbles in each cup separately. (Aggregation by categories).
-   **`GROUP ALL`:** You place a single **Large Bucket** on the floor. 
    -   You dump all marbles from the bag into the bucket, regardless of color. 
    -   You count the total number of marbles. (Global aggregation).

---

### (4) Code Examples

#### Aggregating Records in SurrealQL
Let's analyze order and member tables:

```sql
-- ==========================================
-- SCENARIO A: GROUP BY (Categorized Totals)
-- ==========================================
-- Find the number of users and their average age per country
SELECT
  country,
  count() AS user_count,
  math::mean(age) AS average_age
FROM user
GROUP BY country;

-- ==========================================
-- SCENARIO B: GROUP ALL (Global Total)
-- ==========================================
-- Calculate the total revenue across all sales orders
SELECT
  math::sum(total) AS total_revenue
FROM orders
WHERE status = "completed"
GROUP ALL;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to select un-grouped fields that are not wrapped inside aggregate functions, returning query errors

**The mistake:** Running the query `SELECT name, country, count() FROM user GROUP BY country;` trying to see the user's name alongside the group count.

**Why it's wrong:** Under SQL rules, when grouping by `country`, the database compiles many user rows into a single output row per country. 

Because there are multiple different names in one country, the database doesn't know which `name` to output. 

This triggers a query compiler aggregation error.

**Fix: Remove the un-grouped field from the select projection list, or wrap it in a grouping function like `array::group()` to retrieve a list of all names in that country:**

```sql
-- BAD
SELECT name, country, count() FROM user GROUP BY country;

-- GOOD: Retrieve all names inside a nested array per group
SELECT country, count(), array::group(name) AS names FROM user GROUP BY country;
```

---



### Mistake 2: Selecting Un-Aggregated Columns Missing from `GROUP BY` Clause

**The mistake:** Writing `SELECT name, role, count() FROM user GROUP BY role;`.

**Why it's wrong:** Column `name` is neither aggregated nor listed in `GROUP BY role`. SurrealQL throws an error or yields non-deterministic results.

*Incorrect:*
```surrealql
-- Field 'name' missing from GROUP BY!
SELECT name, role, count() FROM user GROUP BY role; // ❌ Ambiguous column!
```

*Fix:*
```surrealql
SELECT role, count() FROM user GROUP BY role;
```

### Mistake 3: Filtering Grouped Aggregates in `WHERE` Clause instead of `GROUP BY`

**The mistake:** Writing `WHERE count() > 5` before `GROUP BY`.

**Why it's wrong:** `WHERE` filters individual record rows BEFORE grouping. Use `GROUP BY` with subsequent filtering or subqueries to filter aggregate results.

*Incorrect:*
```surrealql
-- Trying to filter aggregates in WHERE
SELECT role, count() FROM user WHERE count() > 5 GROUP BY role; // ❌ Invalid!
```

*Fix:*
```surrealql
SELECT role, count() FROM user GROUP BY role HAVING count() > 5;
-- Or filter array results
```

## 6. Practice Exercises

### Exercise 1: Aggregation Query Construction

**Problem:** You have a `transactions` table. Write the SurrealQL query to:
1.  Calculate the total sum of the `amount` field, aliasing it as `sales_sum`.
2.  Group the results by the `store_id` field.
3.  Filter only transactions where the `status` is `"cleared"`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT store_id, math::sum(amount) AS sales_sum FROM transactions WHERE status = "cleared" GROUP BY store_id;
> ```
> - The table source is `transactions`.
> - Apply the `WHERE` filter before writing the `GROUP BY` clause.

---



### Exercise 2: Group By Multiple Fields

**Problem:** Group sales by `country` and `year` calculating total sales with `math::sum(amount)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT country, year, math::sum(amount) AS total FROM sale GROUP BY country, year;
> ```
> ```surrealql
> SELECT country, year, math::sum(amount) AS total FROM sale GROUP BY country, year;
> ```
>
> **Explanation:** `GROUP BY f1, f2` aggregates records by multi-field composite keys.

---

### Exercise 3: Group All Aggregation

**Problem:** Calculate average age across all records in `user` table using `GROUP ALL`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT math::mean(age) FROM user GROUP ALL;
> ```
> ```surrealql
> SELECT math::mean(age) FROM user GROUP ALL;
> ```
>
> **Explanation:** `GROUP ALL` aggregates the entire table dataset into a single summary result.

## 7. Related Terms
- [`SELECT`](select.md) — The parent query statement.
- [Aggregate Functions](aggregate_functions.md) — The calculation functions.

---

## 8. Key Takeaways
- `GROUP BY` aggregates data by matching categories; `GROUP ALL` aggregates globally.
- Direct NoSQL equivalent to SQL's `GROUP BY` and MongoDB's `$group` pipelines.
- Projected fields must be in the `GROUP BY` list or wrapped in aggregate functions.
- `GROUP ALL` merges all rows into a single bucket (ideal for global totals).
- Apply filters (`WHERE`) before the grouping step to filter inputs.
- Combine grouping with standard math library functions (mean, sum, min, max).
- Use `array::group()` to collect fields from grouped rows into arrays.
