# `COALESCE` / `NULLIF`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The two primary SQL functions used to manage `NULL` values: `COALESCE` returns the first non-null argument, and `NULLIF` returns `NULL` if two values are equal.

---

## 1. Prerequisites
- [`NULL`](../level_02/null.md) — The absent state we are validating.

---

## 2. Term Category

**SQL Command / Clause** (Null Fallback & Comparison Functions): `COALESCE` returns the first non-null argument, while `NULLIF` converts matching values into `NULL` to prevent calculation errors.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated dynamically row-by-row during query execution).

### (1) Design Motivation — "Why did we design this?"
Handling `NULL` values is a constant chore in web development:
-   **Display Fallbacks:** If a user has not set a `profile_nickname`, you want to display their `username` instead. If they lack a username, display `'Guest'`.
-   **Calculation Safety:** If a transaction's `tax_fee` is `NULL`, doing `amount + tax_fee` returns `NULL` (the math propagation rule), wiping out your cash totals. You need a way to swap `NULL` with `0` on-the-fly.
-   **Avoiding Div-by-Zero Crashes:** If you try to calculate click rates using `clicks / actions`, and `actions` is `0`, the database server will immediately crash with a division-by-zero error. You need to convert `0` to `NULL` so the division returns `NULL` safely instead of crashing.

SQL designed **`COALESCE`** and **`NULLIF`** to handle these three scenarios.

---

### (2) How they work

#### 1. `COALESCE(val1, val2, ...)`
Evaluates arguments from left to right and returns the **first value that is not `NULL`**.

```sql
SELECT COALESCE(nickname, username, 'Guest') AS display_name 
FROM users;
```

#### 2. `NULLIF(val1, val2)`
Compares two arguments. If they are equal, it returns **`NULL`**. If they are not equal, it returns **`val1`**.

```sql
-- Returns NULL if count is 0, preventing division crashes!
SELECT 100 / NULLIF(count, 0);
```

---

### (3) Reality Metaphor
Imagine energy backup plans:
-   **`COALESCE`** is like a **power backup system**. If solar power is active (not null), use it. If not, switch to battery backup. If that is also dead, fall back to the diesel generator. You get the first available source in order.
-   **`NULLIF`** is like a **safety fuse breaker**. If the current voltage matches the danger voltage, the fuse cuts the connection (returns NULL) to protect the house from burning down.

---

### (4) Code Examples

#### 1. Display Fallbacks using COALESCE
```sql
CREATE TABLE contacts (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  preferred_phone VARCHAR(20),
  mobile_phone VARCHAR(20),
  office_phone VARCHAR(20)
);

-- Find the first available phone number for each contact
SELECT name, 
  COALESCE(preferred_phone, mobile_phone, office_phone, 'No Phone') AS contact_no
FROM contacts;
```

#### 2. Preventing Division by Zero using NULLIF
```sql
CREATE TABLE conversions (
  page_name VARCHAR(100),
  signups INT,
  clicks INT
);

INSERT INTO conversions (page_name, signups, clicks) VALUES 
  ('landing_page', 5, 100),
  ('test_page', 0, 0); -- Clicks is 0!

-- Division by zero would crash, NULLIF makes the test_page return NULL safely!
SELECT page_name,
  signups::FLOAT / NULLIF(clicks, 0) AS conversion_rate
FROM conversions;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing different data types into COALESCE

**The mistake:** Writing `COALESCE(age, 'Unknown')` when `age` is an integer column.

**Why it's wrong:** In SQL, every column must have a single data type. `COALESCE` returns a value from one of the listed columns, so all arguments must be of compatible data types. You cannot mix integers and text strings.

**Fix: Cast the integer column to a text type, or return a numeric fallback like `0`.**

```sql
-- Option A: Compatible numeric fallback
COALESCE(age, 0)

-- Option B: Cast column to text to support string fallback
COALESCE(age::VARCHAR, 'Unknown')
```

---



### Mistake 2: Confusing `COALESCE()` with `NULLIF()` Logic

**The mistake:** Using `NULLIF()` expecting it to replace NULL values with a default fallback value.

**Why it's wrong:** `COALESCE(val, fallback)` returns the first non-null argument. `NULLIF(a, b)` returns `NULL` if $a = b$, otherwise returning $a$.

*Incorrect:*
```sql
SELECT NULLIF(phone, 'N/A') FROM users; -- Returns NULL if phone equals 'N/A'!
```

*Fix:*
```sql
SELECT COALESCE(phone, 'N/A') FROM users; -- Replaces NULL phone with 'N/A'
```

### Mistake 3: Passing Mismatched Data Types to `COALESCE()` Arguments

**The mistake:** Writing `SELECT COALESCE(created_at, 'N/A') FROM users;` where `created_at` is `TIMESTAMPTZ`.

**Why it's wrong:** All arguments in `COALESCE()` MUST evaluate to compatible data types! Passing a text fallback `'N/A'` to a date column throws type mismatch error. Cast types explicitly.

*Incorrect:*
```sql
SELECT COALESCE(created_at, 'N/A') FROM users; -- ❌ Error: invalid input syntax for type timestamp!
```

*Fix:*
```sql
SELECT COALESCE(created_at::TEXT, 'N/A') FROM users;
```

## 5. Practice Exercises

### Exercise 1: Substituting Null Values with COALESCE

**Scenario:**
Select user contact details returning `mobile_phone`, falling back to `home_phone`, falling back to `'No Phone Available'`.

**Requirements:**
1. Execute `SELECT COALESCE(mobile_phone, home_phone, 'No Phone Available')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   username, 
>   COALESCE(mobile_phone, home_phone, 'No Phone Available') AS primary_phone 
> FROM user_contacts;
> ```
>
> #### Technical Explanation
>
> 1. `COALESCE(val1, val2, ...)` returns the first non-null argument in order.
> 2. Prevents returning raw `NULL` values to API consumers.
> 3. Standard null fallback function.

---

### Exercise 2: Division-By-Zero Protection with NULLIF

**Scenario:**
Calculate conversion rate (`conversions / views`), preventing division by zero when `views = 0`.

**Requirements:**
1. Use `conversions / NULLIF(views, 0)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   campaign_name, 
>   ROUND(conversions::NUMERIC / NULLIF(views, 0), 4) AS conversion_rate 
> FROM ad_campaigns;
> ```
>
> #### Technical Explanation
>
> 1. `NULLIF(views, 0)` evaluates to `NULL` when `views = 0`.
> 2. Dividing by `NULL` returns `NULL` instead of crashing with division by zero (Error 22012).
> 3. Essential for safe mathematical SQL calculations.

---

### Exercise 3: Blank String to Null Normalization

**Scenario:**
Convert empty string values (`''`) to `NULL` using `NULLIF(email, '')`.

**Requirements:**
1. Use `NULLIF(email, '')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE users 
> SET email = NULLIF(email, '') 
> WHERE email = '';
> ```
>
> #### Technical Explanation
>
> 1. `NULLIF(email, '')` returns `NULL` when `email` is an empty string.
> 2. Cleans dirty user inputs, enforcing data normalization.
> 3. Allows unique constraints on nullable email fields to work properly.

---



## 6. Related Terms
- [`NULL`](../level_02/null.md) — The parent absent state.
- [Type Casting (`CAST` / `::`)](type_casting.md) — Converting data types inside functions.
- [`NULL` Behavior in Expressions & Aggregates](null_in_aggregates.md) — Related concept: `NULL` Behavior in Expressions & Aggregates.

---

## 7. Key Takeaways
- `COALESCE` returns the first non-null value from a list of arguments (left-to-right).
- `NULLIF(a, b)` returns `NULL` if `a` equals `b`; otherwise it returns `a`.
- Use `COALESCE` to display default text values or secure calculations.
- Use `NULLIF` to prevent division-by-zero crashes by converting `0` to `NULL`.
- Ensure all arguments inside `COALESCE` share compatible data types.
