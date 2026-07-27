# `NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`

> **Level 2 — Core Data Types & Constraints**
> The PostgreSQL numeric types split into exact decimal storage (`NUMERIC`/`DECIMAL`) for financial accuracy, and approximate floating-point storage (`REAL`/`DOUBLE PRECISION`) for scientific speed.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Floating-point types map directly to standard IEEE 754 hardware registers on CPU chips. `NUMERIC` is processed via software base-10 math routines inside the Postgres executable process).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Type Selection Audit

**Problem:** You are designing a database for a scientific drone. Select the best decimal type (`NUMERIC` or `DOUBLE PRECISION`) for each of the following columns:
1.  The drone's battery voltage sensor reading (updates 100 times per second, speed is critical).
2.  The cost of renting the drone per hour in dollars (e.g. `$45.50`).
3.  The drone's current GPS longitude coordinate (requires high precision decimal places).

**Expected output:**
```text
1. Sensor Reading: DOUBLE PRECISION (Requires high-speed writes and hardware CPU calculations; tiny rounding errors are irrelevant for sensor logs).
2. Hourly Cost: NUMERIC (This is a financial value; must be mathematically exact to prevent billing discrepancies).
3. GPS Coordinate: DOUBLE PRECISION (Scientific coordinate tracking values require high precision floating point ranges).
```

> [!check]- Answer
> - Determine if the column handles financial transactions.
> - Consider if processing speed and writing frequency take priority over exact representation.

---



### Exercise 2: Exact vs Inexact Numeric Types Matrix

**Problem:** Categorize as Exact or Inexact: 1. `NUMERIC` (Exact), 2. `DOUBLE PRECISION` (Inexact), 3. `INTEGER` (Exact).

**Expected output:**
```text
1. Exact, 2. Inexact, 3. Exact
```

> [!check]- Answer
> ```text
> 1. Exact, 2. Inexact, 3. Exact
> ```
>
> **Explanation:** Fixed-point NUMERIC and INTEGER types guarantee exact decimal arithmetic.

### Exercise 3: Floating-Point Calculation Inspection

**Problem:** Inspect floating point calculation `SELECT 0.1::FLOAT8 + 0.2::FLOAT8;` in PostgreSQL.

**Expected output:**
```text
0.30000000000000004
```

> [!check]- Answer
> ```sql
> SELECT 0.1::FLOAT8 + 0.2::FLOAT8;
> ```
>
> **Explanation:** `FLOAT8` produces IEEE 754 floating-point rounding artifacts.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`NUMERIC` Precision & Scale](numeric_precision_scale.md) — Configuring exact decimal limits.

---

## 8. Key Takeaways
- Use `NUMERIC` (or `DECIMAL`) for exact decimal calculations (financial data).
- Use `REAL` (4 bytes) or `DOUBLE PRECISION` (8 bytes) for fast approximate calculations.
- Floating-point arithmetic suffers from rounding errors due to base-2 binary conversion limits.
- Exact numeric calculations are processed in software, which uses slightly more CPU.
- Never use floats to store money; always default to `NUMERIC`.
