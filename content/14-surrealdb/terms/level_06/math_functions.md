# Math Functions (`math::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for mathematical calculations, scalar numeric functions, and aggregate statistical operations (`math::sum()`, `math::mean()`, `math::round()`, `math::abs()`, `math::sqrt()`).

---

## 1. Prerequisites
- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`int` / `float` / `decimal`](../level_02/number_types.md) — Numeric types.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed natively by the Rust execution engine. Preserves arbitrary precision when operating on `decimal` data types).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Financial Rounding & Summation

**Problem:** You have an `invoices` table containing a `total` field (`decimal`).
Write the SurrealQL query to:
1. Calculate the total sum of all invoices as `grand_total`.
2. Round `grand_total` to 2 decimal places using `math::round()`.
3. Group globally using `GROUP ALL`.

**Expected output:**
```sql
SELECT 
  math::round(math::sum(total), 2) AS grand_total 
FROM invoices 
GROUP ALL;
```

> [!check]- Answer
> - Nest `math::sum()` inside `math::round()`.
> - The second argument to `math::round(val, precision)` specifies decimal places.

---



### Exercise 2: Rounding and Precision Functions

**Problem:** Round `19.8567` to 2 decimal places using `math::fixed()` or `math::round()`.

**Expected output:**
```text
math::fixed(19.8567, 2)
```

> [!check]- Answer
> ```surrealql
> RETURN math::fixed(19.8567, 2);
> ```
>
> **Explanation:** `math::fixed(val, precision)` rounds numbers to fixed decimal places.

### Exercise 3: Summing Array of Numbers

**Problem:** Calculate sum of `[10, 20, 30]` using `math::sum()`.

**Expected output:**
```text
60
```

> [!check]- Answer
> ```surrealql
> RETURN math::sum([10, 20, 30]);
> ```
>
> **Explanation:** `math::sum(array)` returns the total sum of array element numbers.

## 7. Related Terms
- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`int` / `float` / `decimal`](../level_02/number_types.md) — Numeric types.
- [Aggregate Functions](../level_03/aggregate_functions.md) — Grouping context.

---

## 8. Key Takeaways
- The `math::*` module contains both scalar math and aggregate statistical functions.
- `math::mean()` computes arithmetic averages (replacing SQL's `AVG()`).
- `math::round(val, precision)` rounds to nearest integer or decimal places.
- Operates seamlessly on `int`, `float`, and exact `decimal` types.
- Preserves `decimal` precision during financial calculations.
