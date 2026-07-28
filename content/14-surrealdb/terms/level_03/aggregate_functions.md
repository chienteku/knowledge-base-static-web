# Aggregate Functions

> **Level 3 — CRUD Operations in SurrealQL**
> The mathematical and collection functions in SurrealQL used inside grouping queries to compile calculations across records, including `count()`, `math::sum()`, `math::mean()`, and `array::group()`.

---

## 1. Prerequisites
- [`GROUP BY` / `GROUP ALL`](group_by.md) — The aggregation context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the query aggregation pipeline. Iterates over temporary record sets in server memory to compute values).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When grouping records, you compress many individual rows into a single output row. 

To make sense of the grouped data, you need functions that can calculate summaries:
-   How many rows are in this group?
-   What is the total sum of their balances?
-   What is the average price?

In standard SQL, you use global functions like `COUNT()`, `SUM()`, and `AVG()`. 

In SurrealDB, functions are organized into **Namespaced Libraries** (like `math::*` and `array::*`) to keep the query language clean and prevent naming collisions. 

This provides a consistent interface for executing mathematical and list calculations across grouped record sets.

---

### (2) Core Aggregate Functions

-   **`count()`:** Counts the number of matching records in the group. 
    -   *Syntax:* `count()` (no arguments required, unlike SQL's `COUNT(*)`).
-   **`math::sum(<field>)`:** Calculates the mathematical sum of numeric values in the group.
-   **`math::mean(<field>)`:** Calculates the arithmetic average (mean) of values. 
    -   *Note:* SurrealDB uses `math::mean()`, corresponding to SQL's `AVG()`.
-   **`math::min(<field>)` / `math::max(<field>)`:** Returns the minimum or maximum value in the group.
-   **`array::group(<field>)`:** Collects all individual values of a field within the group and merges them into a single nested array.

---

### (3) Reality Metaphor (Ledger Helpers)
Imagine analyzing folders in a filing cabinet drawer:
-   **`count()`:** A **Tally Clicker**. Every time you check a folder, you click the button once. You get a count.
-   **`math::sum()`:** A **Pocket Calculator**. You look at the invoice amount in each folder, keying in the numbers and hitting the `+` button to accumulate a total.
-   **`array::group()`:** A **Plastic Baggage Enclosure**. Instead of counting or adding details, you take the name tags out of every folder in the drawer, toss them all into the plastic bag, and attach the bag to the drawer. You get a list of all names.

---

### (4) Code Examples

#### Running Aggregations in SurrealQL
Let's analyze store sales data:

```sql
SELECT
  category,
  count() AS item_count,               -- Count of items in this category
  math::sum(price) AS category_revenue, -- Total sum of prices
  math::mean(price) AS average_price,   -- Average price (mean)
  math::min(price) AS cheapest_item,    -- Minimum price
  math::max(price) AS priciest_item,    -- Maximum price
  array::group(name) AS product_names   -- List of all product names in this group
FROM products
GROUP BY category;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing the standard SQL function 'AVG()' instead of 'math::mean()' to calculate averages, triggering syntax errors

**The mistake:** Writing a query like `SELECT AVG(price) FROM products GROUP ALL;` based on SQL habits.

**Why it's wrong:** SurrealQL does not have a global, non-namespaced `AVG()` function. 

Attempting to run it will cause the database query compiler to throw an unrecognized function exception.

**Fix: Namespace the calculation correctly using `math::mean()`:**

```sql
-- BAD
SELECT AVG(price) FROM products GROUP ALL;

-- GOOD
SELECT math::mean(price) FROM products GROUP ALL;
```

---



### Mistake 2: Using `count()` Without `GROUP BY` when Non-Aggregated Fields Are Selected

**The mistake:** Writing `SELECT name, count() FROM user;` without specifying `GROUP BY`.

**Why it's wrong:** Selecting non-aggregated columns alongside aggregate functions without a `GROUP BY` clause causes ambiguous group evaluation errors or returns un-grouped results.

*Incorrect:*
```surrealql
-- Ambiguous non-grouped query
SELECT status, count() FROM user; // ❌ Missing GROUP BY status!
```

*Fix:*
```surrealql
SELECT status, count() FROM user GROUP BY status; // Correct grouping
```

### Mistake 3: Expecting `math::mean()` or `math::sum()` to Ignore Non-Numeric Array Elements

**The mistake:** Passing arrays containing strings or `NONE` into `math::sum([10, "20", NULL])`.

**Why it's wrong:** Aggregate functions expect numeric values. Un-cast string values or nullish values generate runtime math errors. Clean arrays with `array::filter()` first.

*Incorrect:*
```surrealql
RETURN math::sum([10, "20"]); // ❌ Mixed non-numeric elements!
```

*Fix:*
```surrealql
RETURN math::sum([10, <number> "20"]); // Explicit numeric casting
```

## 6. Practice Exercises

### Exercise 1: Aggregate Syntax Translation

**Problem:** You are migrating an aggregation query from a PostgreSQL database:
`SELECT category, COUNT(*), SUM(stock), MIN(last_updated) FROM inventory GROUP BY category;`
Write the equivalent query in SurrealQL.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT
>   category,
>   count() AS count,
>   math::sum(stock) AS sum,
>   math::min(last_updated) AS min
> FROM inventory
> GROUP BY category;
> ```
> - Replace `COUNT(*)` with the empty function argument syntax `count()`.
> - Map mathematical functions to their namespaced equivalents: `math::sum()` and `math::min()`.

---



### Exercise 2: Grouping and Aggregating Record Counts

**Problem:** Count users grouped by `role` field from `user` table.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT role, count() FROM user GROUP BY role;
> ```
> ```surrealql
> SELECT role, count() FROM user GROUP BY role;
> ```
>
> **Explanation:** `GROUP BY field` aggregates record groups with `count()`.

---

### Exercise 3: Min/Max Aggregations

**Problem:** Calculate min and max product prices from `product` table using `math::min()` and `math::max()`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT math::min(price), math::max(price) FROM product GROUP ALL;
> ```
> ```surrealql
> SELECT math::min(price), math::max(price) FROM product GROUP ALL;
> ```
>
> **Explanation:** `GROUP ALL` calculates aggregates across the entire table.

## 7. Related Terms
- [`GROUP BY` / `GROUP ALL`](group_by.md) — The aggregation context.

---

## 8. Key Takeaways
- Aggregate functions compute summary calculations across grouped records.
- Standard math functions are namespaced inside the `math::*` library path.
- `count()` calculates row totals (syntax uses empty parenthesis: `count()`).
- `math::mean()` calculates arithmetic averages, replacing SQL's `AVG()`.
- `math::sum()`, `math::min()`, and `math::max()` handle numeric properties.
- `array::group()` gathers values from grouped records into a single nested array.
- Attempting to run un-namespaced aggregate functions triggers parser errors.
