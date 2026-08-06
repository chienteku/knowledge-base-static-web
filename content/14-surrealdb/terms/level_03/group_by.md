# `GROUP BY` / `GROUP ALL`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clauses used to aggregate query results: `GROUP BY` groups records sharing identical field values into sub-buckets, while `GROUP ALL` merges all matching records into a single global bucket to compute system-wide totals.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.

---

## 2. Term Category


**Query Feature (grouping and aggregation clause)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Grouping Order Quantities by Customer

**Scenario:**
An analytics query calculates total items purchased by each customer from table `order`.

**Requirements:**
1. Create order records with fields `customer` and `quantity`.
2. Write a query grouping by `customer` and summing `quantity`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE order:1 SET customer = user:alice, quantity = 2;
> CREATE order:2 SET customer = user:alice, quantity = 5;
> CREATE order:3 SET customer = user:bob, quantity = 1;
> 
> -- Group orders by customer and sum quantities
> SELECT customer, math::sum(quantity) AS total_quantity 
> FROM order 
> GROUP BY customer;
> ```
>
> #### Technical Explanation
>
> 1. `GROUP BY customer` buckets order records sharing identical `customer` record links.
> 2. `math::sum(quantity)` aggregates item counts within each customer group bucket.
> 3. Returns a structured JSON result array containing customer pointers and total quantities.

---

### Exercise 2: Global Aggregation with `GROUP ALL`

**Scenario:**
Compute overall platform metrics (total revenue, average price, total products) across all products in table `product`.

**Requirements:**
1. Write a `SELECT` query calculating `math::sum(price)`, `math::mean(price)`, and `count()` using `GROUP ALL`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET price = 100.00dec;
> CREATE product:p2 SET price = 200.00dec;
> 
> -- Collapse all product records into a single global summary
> SELECT 
>     math::sum(price) AS total_revenue,
>     math::mean(price) AS avg_price,
>     count() AS total_products
> FROM product
> GROUP ALL;
> ```
>
> #### Technical Explanation
>
> 1. `GROUP ALL` collapses all matching table records into a single global aggregate result object.
> 2. Evaluates aggregate functions over the entire record set.
> 3. Equivalent to SQL `SELECT SUM(...), AVG(...) FROM table` without a `GROUP BY` clause.

---

### Exercise 3: Grouping by Array Elements

**Scenario:**
An analytics service counts how many articles belong to each topic tag where `tags` is an array of strings.

**Requirements:**
1. Group articles by individual tag elements inside `tags`.
2. Compute `count()` for each tag.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE article:1 SET tags = ["rust", "database"];
> CREATE article:2 SET tags = ["rust", "web"];
> 
> -- Group by array elements
> SELECT tags AS tag, count() AS total_articles 
> FROM article 
> GROUP BY tags;
> ```
>
> #### Technical Explanation
>
> 1. Grouping by an array field (`GROUP BY tags`) expands array elements and groups by individual items.
> 2. Counts occurrences of each distinct tag across all articles.
> 3. Replaces complex SQL `UNNEST()` / `LATERAL JOIN` queries with concise grouping syntax.

---



## 6. Related Terms

- [`SELECT`](select.md) — The parent query statement.
- [Aggregate Functions](aggregate_functions.md) — The calculation functions.

---

## 7. Key Takeaways
- `GROUP BY` aggregates data by matching categories; `GROUP ALL` aggregates globally.
- Direct NoSQL equivalent to SQL's `GROUP BY` and MongoDB's `$group` pipelines.
- Projected fields must be in the `GROUP BY` list or wrapped in aggregate functions.
- `GROUP ALL` merges all rows into a single bucket (ideal for global totals).
- Apply filters (`WHERE`) before the grouping step to filter inputs.
- Combine grouping with standard math library functions (mean, sum, min, max).
- Use `array::group()` to collect fields from grouped rows into arrays.
