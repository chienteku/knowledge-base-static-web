# `int` / `float` / `decimal`

> **Level 2 — Data Types & Record Structure**
> The three numeric data types in SurrealDB, separating whole integers (`int`), standard IEEE 754 floating-point decimals (`float`), and arbitrary-precision exact decimals (`decimal`—mandatory for financial balances).

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (int, float, and decimal numeric types)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Computers represent numbers using binary bits. 

This creates a fundamental mathematical problem for decimals:
-   **Floating-point numbers (`float`):** Are stored as binary fractions. They are processed directly by computer hardware, making them extremely fast. 
    -   However, they cannot represent certain base-10 decimals exactly. 
    -   For example, adding `0.1 + 0.2` in floats yields `0.30000000000000004`. 
    -   In a banking database, these tiny rounding discrepancies will compound, leading to audits failing and balance sheet mismatch.
-   **Exact Decimals (`decimal`):** Are stored as exact base-10 representations in memory. 
    -   They do not suffer from rounding errors, making them safe for financials.

We designed the three numeric types to separate these use cases:
1.  **`int`:** For counting items.
2.  **`float`:** For high-speed physics, statistics, and coordinates.
3.  **`decimal`:** For billing, prices, and accounting ledger.

---

### (2) Parsing Rules & Suffixes
By default, SurrealQL parses raw number literals based on their formatting:
-   **No Decimal Point:** (e.g. `45`) $\rightarrow$ Parsed as an **`int`** (64-bit signed integer).
-   **Decimal Point:** (e.g. `45.5`) $\rightarrow$ Parsed as a **`float`** (64-bit double).
-   **The `dec` Suffix / Cast:** (e.g. `45.5dec` or `<decimal> 45.5`) $\rightarrow$ Parsed as an exact **`decimal`**.

---

### (3) Reality Metaphor (Measuring Ingredients)
Imagine measuring ingredients:
-   **`int` (Counting):** Counting whole apples. You cannot have 1.5 apples in your basket; it's either 1 or 2.
-   **`float` (Measuring Cup):** Pouring flour into a standard measuring cup. 
    -   It is fast and good enough for a family cake. 
    -   But a few grains stick to the sides, so you are off by a fraction of a gram. 
    -   If you run a industrial bakery, this slight variance causes problems.
-   **`decimal` (Chemical Scale):** Weighing powder on a laboratory scale. 
    -   It measures down to the exact microgram. 
    -   It takes slightly longer to settle, but the weight is 100% correct.

---

### (4) Code Examples

#### Float Rounding Errors vs. Decimal Precision
Observe how calculations evaluate in SurrealQL:

```sql
-- 1. Floating-point calculation (un-escaped float)
-- Returns: 0.30000000000000004 (Rounding Error!)
SELECT 0.1 + 0.2;

-- 2. Exact Decimal calculation (using 'dec' suffix)
-- Returns: 0.3dec (Exact!)
SELECT 0.1dec + 0.2dec;

-- 3. Setting up schemas with strict types
DEFINE TABLE invoice SCHEMAFULL;

DEFINE FIELD item_count ON invoice TYPE int;       -- Must be a integer
DEFINE FIELD total_price ON invoice TYPE decimal;  -- Exact price

-- This write succeeds (SurrealDB automatically casts 50.00 to decimal):
CREATE invoice:01 SET item_count = 5, total_price = 50.00dec;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'float' types (or un-suffixed decimal numbers) to store and calculate money balances in database schemas

**The mistake:** Defining a wallet balance field as `TYPE float` or writing updates as `balance = balance + 10.50`, assuming it is safe.

**Why it's wrong:** Under the hood, un-suffixed decimals like `10.50` default to floats. 

As transactions accumulate, binary floating-point rounding errors will add fractional pennies to the balance, corrupting your accounting totals.

**Fix: Always declare money fields as `TYPE decimal` on tables, and append the `dec` suffix to numeric literals in your query scripts:**

```sql
-- CORRECT MONEY SETUP
DEFINE FIELD balance ON wallet TYPE decimal;

-- Update using decimal suffix
UPDATE wallet:user01 SET balance += 10.50dec;
```

---



### Mistake 2: Using Floating Point `float` for Exact Financial Calculations

**The mistake:** Storing financial currency balances using float numbers `19.99` in `TYPE float` fields.

**Why it's wrong:** Floating-point numbers introduce binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). Use `decimal` for exact financial calculations.

*Incorrect:*
```surrealql
DEFINE FIELD balance ON TABLE account TYPE float;
UPDATE account:1 SET balance = balance + 0.1; // ❌ Floating point precision loss!
```

*Fix:*
```surrealql
DEFINE FIELD balance ON TABLE account TYPE decimal;
UPDATE account:1 SET balance = balance + 0.1dec; // Exact decimal precision
```

### Mistake 3: Exceeding 64-Bit Integer Bounds in `int` Fields

**The mistake:** Storing numbers larger than $2^{63}-1$ inside standard `int` integer fields.

**Why it's wrong:** Integer overflow in `int` fields causes errors or truncation. Use `decimal` for arbitrary precision numbers.

*Incorrect:*
```surrealql
LET $val = 9223372036854775808; // Exceeds i64 max bounds
```

*Fix:*
```surrealql
LET $val = 9223372036854775808dec; // Arbitrary precision decimal
```

## 5. Practice Exercises

### Exercise 1: Currency Decimal Precision Enforcement

**Scenario:**
An e-commerce payment service requires exact monetary calculations for product prices and sales tax to prevent floating-point rounding errors.

**Requirements:**
1. Define table `product` in `SCHEMAFULL` mode.
2. Define field `price` as `decimal`.
3. Create product `product:p1` setting `price = 19.99dec`.
4. Calculate tax `price * 0.08dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE product SCHEMAFULL;
> DEFINE FIELD price ON TABLE product TYPE decimal;
> 
> CREATE product:p1 SET name = "Widget", price = 19.99dec;
> 
> -- Calculate exact decimal tax
> SELECT price, price * 0.08dec AS tax FROM product:p1;
> ```
>
> #### Technical Explanation
>
> 1. The `dec` suffix creates an exact fixed-point `decimal` literal (`19.99dec`).
> 2. `decimal` avoids binary floating-point inaccuracies (e.g. `0.1 + 0.2 = 0.30000000000000004`).
> 3. Mandatory for financial ledger and e-commerce billing calculations.
> 
---

### Exercise 2: Integer Bounds & Overflow Checks

**Scenario:**
A analytics counter tracks page views using signed 64-bit integers (`int`).

**Requirements:**
1. Define field `views` as `int` on table `page`.
2. Increment `views` using `UPDATE page:home SET views += 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE page SCHEMAFULL;
> DEFINE FIELD views ON TABLE page TYPE int DEFAULT 0;
> 
> CREATE page:home SET views = 100;
> 
> -- Increment page view counter atomically
> UPDATE page:home SET views += 1;
> ```
>
> #### Technical Explanation
>
> 1. `int` stores signed 64-bit integer values in SurrealDB.
> 2. Atomic increment operator `+=` adds to integer fields safely.
> 3. Integer operations provide high-performance counter tracking.
> 
---

### Exercise 3: Floating-Point Scientific Computations

**Scenario:**
A weather monitoring service stores temperature readings and wind velocities using 64-bit IEEE-754 floating-point numbers (`float`).

**Requirements:**
1. Create reading `reading:r1` with `temp = 23.45` and `velocity = 12.8`.
2. Compute average temperature using `math::mean()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE reading:r1 SET temp = 23.45, velocity = 12.8;
> CREATE reading:r2 SET temp = 25.10, velocity = 14.2;
> 
> SELECT math::mean(temp) AS avg_temp FROM reading;
> ```
>
> #### Technical Explanation
>
> 1. `float` stores 64-bit floating-point numbers suitable for scientific measurements.
> 2. Built-in math functions (`math::mean()`, `math::sum()`) process numeric collections natively.
> 3. Floats trade exact decimal precision for high-performance scientific calculations.
> 
---



## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Casting & Coercion](type_casting.md) — Converting between types.
- [Math Functions (`math::*`)](../level_06/math_functions.md) — Related concept: Math Functions (`math::*`).

---

## 7. Key Takeaways
- Whole numbers default to `int` (64-bit signed integer).
- Fractional numbers default to `float` (64-bit IEEE 754 float double).
- Floating-point numbers are fast but subject to binary rounding errors.
- `decimal` handles arbitrary-precision exact decimals (no rounding error).
- Append the `dec` suffix (e.g. `10.5dec`) to force exact decimal numbers.
- Always use `decimal` for currency and accounting balance fields.
- Mismatched numeric writes will cast automatically if declared in schemas.
