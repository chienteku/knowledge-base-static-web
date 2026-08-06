# Math Functions (`math::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for mathematical calculations, scalar numeric functions, and aggregate statistical operations (`math::sum()`, `math::mean()`, `math::round()`, `math::abs()`, `math::sqrt()`).

---

## 1. Prerequisites

- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`int` / `float` / `decimal`](../level_02/number_types.md) — Numeric types.

---

## 2. Term Category


**Query Feature (mathematical computation builtin functions)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Numeric computations in applications fall into two main categories:
1. **Aggregate Calculations:** Computing totals across groups of records (summing total revenue, calculating average user ages).
2. **Scalar Math Operations:** Modifying individual numbers within a single row (rounding prices, calculating absolute values, taking square roots).

In SQL (PostgreSQL), aggregate functions (`SUM()`, `AVG()`) and scalar math functions (`ROUND()`, `ABS()`) are mixed together in a flat global namespace. In MongoDB, they are split across separate aggregation pipeline stages and expression operators (`$sum`, `$avg`, `$round`).

We designed the **`math::*`** module in SurrealDB to unify both scalar and aggregate math under a single namespaced library. Whether calculating a group average (`math::mean()`) or rounding a single float value (`math::round()`), the syntax remains consistent.

---

### (2) Key Function Categories

#### 1. Aggregate Functions (Operate on Groups)
- `math::sum(field)`: Sums numeric values across a group.
- `math::mean(field)`: Computes arithmetic mean (average).
- `math::median(field)`: Computes statistical median.
- `math::min(field)` / `math::max(field)`: Finds minimum or maximum value.

#### 2. Scalar Rounding & Absolute Values
- `math::round(val)`: Rounds to nearest integer (or specified precision).
- `math::floor(val)` / `math::ceil(val)`: Rounds down or up.
- `math::abs(val)`: Returns absolute non-negative value.

#### 3. Advanced Math & Trigonometry
- `math::sqrt(val)`: Square root.
- `math::pow(val, exp)`: Power / exponent calculation.
- `math::log(val)` / `math::exp(val)`: Logarithms and exponentials.

---

### (3) Reality Metaphor (The Scientific Calculator)
Imagine a financial clerk's desk:
- **`math::round`:** Trimming off tiny fractional cents from a price receipt so it displays cleanly as `$19.99`.
- **`math::sum`:** Tallying up an entire stack of 50 store receipts to compute the total daily revenue.
- **`math::abs`:** Converting negative financial variance numbers into positive distance numbers.

---

### (4) Code Examples

#### Using `math::*` Functions in SurrealQL

```sql
-- 1. Scalar math: Rounding and absolute value calculations
SELECT 
  name,
  price,
  math::round(price) AS rounded_price,
  math::abs(balance_change) AS abs_change
FROM account;

-- 2. Aggregate math inside GROUP BY queries
SELECT 
  category,
  math::sum(sales) AS total_sales,
  math::mean(price) AS avg_price,
  math::max(price) AS max_price
FROM product
GROUP BY category;

-- 3. Exponent & Power calculations
SELECT 
  math::pow(base, 2) AS squared_value,
  math::sqrt(variance) AS std_dev
FROM metrics;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'AVG()' instead of 'math::mean()' in aggregate queries

**The mistake:** Writing `SELECT AVG(score) FROM test_result GROUP ALL;`.

**Why it's wrong:** SurrealDB does not have a global `AVG()` function. The query parser throws an unrecognized function exception.

**Fix: Use `math::mean()` for calculating arithmetic averages:**

```sql
-- BAD
SELECT AVG(score) FROM test_result GROUP ALL;

-- GOOD
SELECT math::mean(score) FROM test_result GROUP ALL;
```

---



### Mistake 2: Passing Non-Numeric Strings to `math::` Functions Without Casting

**The mistake:** Executing `math::abs("-10")` passing a text string.

**Why it's wrong:** Functions in `math::` namespace expect numeric or decimal primitives. Passing text strings throws a type error.

*Incorrect:*
```surrealql
RETURN math::abs("-10"); // ❌ Type error: Expected number, got string!
```

*Fix:*
```surrealql
RETURN math::abs(<number> "-10"); // Explicit numeric casting
```

### Mistake 3: Dividing by Zero inside `math::` Functions

**The mistake:** Executing `10 / 0` or passing 0 divisor to mathematical expressions.

**Why it's wrong:** Division by zero returns `NAN` or `INFINITY` or throws arithmetic errors. Validate divisors with `IF divisor != 0`.

*Incorrect:*
```surrealql
LET $ratio = $val / 0; // ❌ Division by zero!
```

*Fix:*
```surrealql
LET $ratio = IF $divisor != 0 THEN $val / $divisor ELSE 0 END;
```

## 5. Practice Exercises

### Exercise 1: Rounding & Ceil Monetary Calculations

**Scenario:**
An e-commerce billing query rounds calculated tax amounts to 2 decimal places using `math::round()` and computes ceiling shipping fees using `math::ceil()`.

**Requirements:**
1. Calculate tax `math::round(19.99dec * 0.0825dec)`.
2. Calculate ceiling fee `math::ceil(4.12)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     math::round(19.99dec * 0.0825dec) AS tax_rounded,
>     math::ceil(4.12) AS shipping_ceil;
> ```
>
> #### Technical Explanation
>
> 1. `math::round(val)` rounds numeric values to nearest integers or specified decimal places.
> 2. `math::ceil(val)` rounds floating-point values UP to the nearest integer.
> 3. Maintains calculation precision for monetary transactions.

---

### Exercise 2: Statistical Aggregate Metrics

**Scenario:**
An analytics query computes the minimum, maximum, sum, and mean of product prices in table `product`.

**Requirements:**
1. Query `math::min(price)`, `math::max(price)`, `math::sum(price)`, `math::mean(price)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET price = 10.00dec;
> CREATE product:p2 SET price = 50.00dec;
> CREATE product:p3 SET price = 90.00dec;
> 
> SELECT 
>     math::min(price) AS min_p,
>     math::max(price) AS max_p,
>     math::sum(price) AS total_p,
>     math::mean(price) AS avg_p
> FROM product
> GROUP ALL;
> ```
>
> #### Technical Explanation
>
> 1. `math::*` aggregate functions compute statistical metrics over record collections.
> 2. `GROUP ALL` aggregates across all matching table records.
> 3. Executes statistical calculations natively inside the database engine.

---

### Exercise 3: Absolute Difference Calculations

**Scenario:**
Calculate the absolute numeric difference between two target values using `math::abs()`.

**Requirements:**
1. Calculate `math::abs(100 - 250)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT math::abs(100 - 250) AS distance;
> -- Output: 150
> ```
>
> #### Technical Explanation
>
> 1. `math::abs(val)` returns the non-negative absolute magnitude of numeric expressions.
> 2. Eliminates manual sign checking in distance queries.
> 3. Works over integer, float, and decimal inputs.

---



## 6. Related Terms

- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`int` / `float` / `decimal`](../level_02/number_types.md) — Numeric types.
- [Aggregate Functions](../level_03/aggregate_functions.md) — Grouping context.

---

## 7. Key Takeaways
- The `math::*` module contains both scalar math and aggregate statistical functions.
- `math::mean()` computes arithmetic averages (replacing SQL's `AVG()`).
- `math::round(val, precision)` rounds to nearest integer or decimal places.
- Operates seamlessly on `int`, `float`, and exact `decimal` types.
- Preserves `decimal` precision during financial calculations.
