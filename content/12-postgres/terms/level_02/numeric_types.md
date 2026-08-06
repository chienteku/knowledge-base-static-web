# `NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`

> **Level 2 — Core Data Types & Constraints**
> The PostgreSQL numeric types split into exact decimal storage (`NUMERIC`/`DECIMAL`) for financial accuracy, and approximate floating-point storage (`REAL`/`DOUBLE PRECISION`) for scientific speed.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Data Type** (Arbitrary Precision Financial Types): Numeric data types (`NUMERIC`, `DECIMAL`, `REAL`, `DOUBLE PRECISION`) handle high-precision monetary math or floating-point calculations.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Floating-point types map directly to standard IEEE 754 hardware registers on CPU chips. `NUMERIC` is processed via software base-10 math routines inside the Postgres executable process).

### (1) Design Motivation — "Why did we design this?"
When storing numbers with decimal places (fractions like `10.99` or `0.00032`), computers face a mathematical hurdle:
-   **Exact Decimal Arithmetic:** Essential for business. If a user deposits `$0.10` and `$0.20`, their balance must equal exactly `$0.30`. Missing even a fraction of a penny is unacceptable.
-   **Computational Speed:** Essential for scientific computing. If you are rendering 3D coordinates or logging fast sensor readings, you need calculations to execute in nanoseconds directly on CPU chip hardware.

To satisfy both needs, PostgreSQL provides two distinct families of decimal types:

#### 1. Exact Types: `NUMERIC` (or `DECIMAL`)
Postgres stores these numbers as structured text-like arrays of base-10000 numbers. 
-   *Behavior:* It behaves exactly like human paper-and-pencil math. There are zero rounding errors.
-   *Pro:* Absolute mathematical accuracy.
-   *Con:* Calculations are handled in database software (slower) and use more disk space.

#### 2. Approximate Types: `REAL` (4 bytes) and `DOUBLE PRECISION` (8 bytes)
These store values using binary scientific notation (IEEE 754 Floating-point).
-   *Behavior:* They can store massive ranges of numbers, but they cannot represent simple base-10 fractions (like `0.1` or `0.2`) exactly in binary, causing tiny trailing errors.
-   *Pro:* Super fast math calculations directly handled by CPU hardware.
-   *Con:* Inexact. `0.1 + 0.2` might result in `0.30000000000000004`.

---

### (2) Reality Metaphor
Imagine measuring length:
-   **`NUMERIC`** is like using a **steel ruler**. It is rigid, slow to unpack, and can only measure up to standard lengths, but its markings are perfectly accurate. You use it to cut wood for building walls (financial bookkeeping).
-   **Floating-point (`REAL`/`DOUBLE`)** is like using a **rubber band** with markings on it. It stretches to measure massive distances, but because it stretches, the markings shift slightly. You use it to quickly estimate distances (scientific modeling).

---

### (3) Code Examples

#### Float Rounding Error Demo
Let's see floating point math fail in database queries:

```sql
-- Create a table with float columns
CREATE TABLE float_test (
  val DOUBLE PRECISION
);

INSERT INTO float_test (val) VALUES (0.1), (0.2);

-- Query the sum
SELECT SUM(val) FROM float_test;
-- Output might result in: 0.30000000000000004 (Rounding error!)
```

#### Exact Numeric Math
```sql
CREATE TABLE exact_test (
  val NUMERIC(10,2) -- Exact decimal configuration
);

INSERT INTO exact_test (val) VALUES (0.1), (0.2);

SELECT SUM(val) FROM exact_test;
-- Output is guaranteed: 0.30
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing product prices or user balances as `DOUBLE PRECISION` or `REAL`

**The mistake:** Defining a price column as `REAL` or `DOUBLE PRECISION` because "prices have decimals and double matches float in JavaScript."

**Why it's wrong:** Floating-point rounding errors accumulate. Over millions of shopping cart calculations, tax additions, and discounts, the database will start losing or adding fractions of pennies. This leads to out-of-sync financial ledgers that fail accounting audits.

**Fix: Always use the `NUMERIC` (or `DECIMAL`) type to store monetary values.**

---



### Mistake 2: Using Floating-Point Types (`FLOAT`, `DOUBLE PRECISION`) for Exact Financial Accounting

**The mistake:** Storing customer monetary balances in `DOUBLE PRECISION` columns.

**Why it's wrong:** IEEE 754 floating-point types introduce binary representation inaccuracies. Use `NUMERIC` or `DECIMAL` for exact financial calculations.

*Incorrect:*
```sql
amount DOUBLE PRECISION -- ❌ Inexact floating-point arithmetic!
```

*Fix:*
```sql
amount NUMERIC(12, 2) -- Exact fixed-point arithmetic
```

### Mistake 3: Using `MONEY` Type for Multi-Currency Applications

**The mistake:** Using PostgreSQL `MONEY` data type for multi-currency international platforms.

**Why it's wrong:** PostgreSQL `MONEY` type depends on server locale settings (`lc_monetary`) and does NOT store currency code metadata (e.g. USD vs EUR). Store amounts in `NUMERIC` alongside explicit `currency` code strings.

*Incorrect:*
```sql
amount MONEY -- Locale-dependent currency format
```

*Fix:*
```sql
amount NUMERIC(12, 2), currency VARCHAR(3) -- Explicit numeric amount and ISO currency code
```

## 5. Practice Exercises

### Exercise 1: Exact Decimal Math vs Floating-Point Approximations

**Scenario:**
Demonstrate the difference between exact `NUMERIC` math vs approximate `DOUBLE PRECISION` math.

**Requirements:**
1. Execute `SELECT 0.1::NUMERIC + 0.2::NUMERIC` vs `SELECT 0.1::FLOAT + 0.2::FLOAT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Exact NUMERIC math
> SELECT (0.1::NUMERIC + 0.2::NUMERIC) = 0.3::NUMERIC AS numeric_exact; -- Returns TRUE
> 
> -- Approximate DOUBLE PRECISION float math
> SELECT (0.1::FLOAT + 0.2::FLOAT) = 0.3::FLOAT AS float_exact; -- Returns FALSE (0.30000000000000004)
> ```
>
> #### Technical Explanation
>
> 1. `NUMERIC` performs exact base-10 arithmetic, making it mandatory for accounting and prices.
> 2. `FLOAT` (`REAL`, `DOUBLE PRECISION`) uses IEEE 754 binary floating-point representation, causing rounding artifacts.
> 3. Use `FLOAT` only for scientific or sensor data where performance overrides exact decimal precision.

---

### Exercise 2: Aggregating Exact Monetary Sums with `SUM()`

**Scenario:**
Calculate the exact sum of all invoice amounts in table `invoices`.

**Requirements:**
1. Execute `SELECT SUM(amount_cents) FROM invoices`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   SUM(total_amount) AS total_revenue 
> FROM invoices;
> ```
>
> #### Technical Explanation
>
> 1. `SUM()` over `NUMERIC` or `INTEGER` columns returns an exact total sum.
> 2. Accumulates exact balances across millions of rows without floating-point drift.
> 3. Returns `NUMERIC` type output.

---

### Exercise 3: Currency Storage Strategy: Cents Integer Pattern

**Scenario:**
Compare storing prices as `NUMERIC(10, 2)` vs storing price as integer cents (`INTEGER`).

**Requirements:**
1. Contrast `price_cents INTEGER` vs `price NUMERIC(10,2)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Integer Cents Pattern (Fastest storage & arithmetic)
> CREATE TABLE products_cents (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
> );
> ```
>
> #### Technical Explanation
>
> 1. Storing monetary amounts as integer cents (`INTEGER` or `BIGINT`) avoids decimal overhead completely.
> 2. Integer arithmetic operates faster in CPU hardware than `NUMERIC` software decimal math.
> 3. Popular pattern in modern payment systems (e.g. Stripe API).

---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`NUMERIC` Precision & Scale](numeric_precision_scale.md) — Configuring exact decimal limits.

---

## 7. Key Takeaways
- Use `NUMERIC` (or `DECIMAL`) for exact decimal calculations (financial data).
- Use `REAL` (4 bytes) or `DOUBLE PRECISION` (8 bytes) for fast approximate calculations.
- Floating-point arithmetic suffers from rounding errors due to base-2 binary conversion limits.
- Exact numeric calculations are processed in software, which uses slightly more CPU.
- Never use floats to store money; always default to `NUMERIC`.
