# Date/Time Functions (`NOW()`, `CURRENT_DATE`, `AGE()`, `EXTRACT`, `DATE_TRUNC`, `INTERVAL`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The set of built-in PostgreSQL functions and modifiers used to perform date arithmetic, round timestamps, extract calendar parts, and calculate time differences.

---

## 1. Prerequisites
- [`DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`](../level_02/date_time_types.md) — The temporal data types.

---

## 2. Term Category

**SQL Command / Clause** (Temporal Manipulation Functions): Date/Time functions (`NOW()`, `CURRENT_TIMESTAMP`, `DATE_TRUNC()`, `AGE()`) manipulate and format calendar timestamps.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Calculations run on optimized database system clocks. Interval results are stored using specialized PostgreSQL internal interval binary layouts).

### (1) Design Motivation — "Why did we design this?"
Timestamps are stored as binary counts. To make them useful, you need tools to calculate date ranges and extract information:
-   How old is a user based on their birthday?
-   Which month of the year has the highest sales?
-   Show me all database errors that occurred in the **last 24 hours**.
-   Group traffic logs by **hour** to plot a usage chart.

If you don't use database date functions, your application must fetch all rows, parse timezone strings, and calculate ranges in JavaScript, which is extremely complex and slow.

We designed **Date/Time Functions** to handle this arithmetic. 

They understand calendar complexities (leap years, month length differences, daylight savings shifts) and perform conversions directly inside queries.

---

### (2) The Core Time Utilities

1.  **`NOW()`**: Returns the current database server timestamp (timezone-aware).
2.  **`CURRENT_DATE`**: Returns today's date (no time details).
3.  **`AGE(t1, t2)`**: Calculates the difference between two timestamps, returning a readable text-like **Interval** (e.g. `'28 years 4 months 12 days'`).
4.  **`EXTRACT(field FROM source)`**: Extracts a single numeric part (e.g. `YEAR`, `MONTH`, `DAY`, `HOUR`) from a timestamp.
5.  **`DATE_TRUNC(field, source)`**: Rounds a timestamp down to the start of a specified interval (e.g., rounding `14:35:12` down to `'hour'` yields `14:00:00`). This is crucial for grouping logs!
6.  **`INTERVAL`**: A PostgreSQL type representing a span of time (e.g., `INTERVAL '7 days'`). You can add or subtract intervals directly to/from dates.

---

### (3) Reality Metaphor
Imagine a mechanical calendar clock:
-   **`INTERVAL`** is like pulling a lever that spins the calendar dial forward by exactly 30 days.
-   **`DATE_TRUNC`** is like a reset button that snaps the clock's minute and second hands back to the top of the hour, but keeps the hour and date matching.
-   **`EXTRACT`** is a magnifying glass that lets you look at *only* the month window on the clock face, ignoring the hands.

---

### (4) Code Examples

#### Date Arithmetic with INTERVAL
```sql
CREATE TABLE user_sessions (
  token VARCHAR(100) PRIMARY KEY,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Query: Find all sessions that have been inactive for more than 2 hours
SELECT token 
FROM user_sessions
WHERE last_active < NOW() - INTERVAL '2 hours';
```

#### Rounding with DATE_TRUNC
```sql
CREATE TABLE server_logs (
  id INT GENERATED ALWAYS AS IDENTITY,
  err_msg TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Count server errors grouped by the hour they occurred in
SELECT 
  DATE_TRUNC('hour', logged_at) AS log_hour,
  COUNT(*) AS errors_count
FROM server_logs
GROUP BY log_hour
ORDER BY log_hour DESC;
```

#### Calculating Age
```sql
-- Returns exact age interval (e.g. '25 years 3 months 5 days')
SELECT name, AGE(NOW(), date_of_birth) AS current_age 
FROM students;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming NOW() updates its clock during long transactions

**The mistake:** Running a heavy data import migration inside a transaction block that takes 10 minutes to execute, and expecting `NOW()` to record different times for rows inserted at the start and end of the script.

**Why it's wrong:** In PostgreSQL, `NOW()` returns the start timestamp of the **current transaction**. It remains completely frozen at that exact microsecond until the transaction commits. This is a safety feature ensuring that logs created in the same batch share a matching timestamp.

**Fix: If you need the real-time clock time that updates continuously mid-query, use the `clock_timestamp()` function instead of `NOW()`.**

---



### Mistake 2: Confusing `NOW()` (Transaction Start Time) with `CLOCK_TIMESTAMP()` (Wall-Clock Time)

**The mistake:** Using `NOW()` inside a 10-second loop expecting timestamp values to increment per iteration.

**Why it's wrong:** `NOW()` returns the timestamp when the current TRANSACTION began! All calls to `NOW()` within the same transaction return the IDENTICAL timestamp. Use `CLOCK_TIMESTAMP()` for real-time wall-clock time.

*Incorrect:*
```sql
-- Inside transaction: calling NOW() repeatedly expecting different timestamps
```

*Fix:*
```sql
SELECT CLOCK_TIMESTAMP(); -- Returns actual real-time execution clock timestamp
```

### Mistake 3: Using `EXTRACT()` Returning Floating Point Numbers Instead of Integers

**The mistake:** Expecting `EXTRACT(YEAR FROM created_at)` to return an integer for string concatenation.

**Why it's wrong:** `EXTRACT()` returns `DOUBLE PRECISION` numbers in PostgreSQL! Use `DATE_PART()` or cast to integer (`EXTRACT(YEAR FROM created_at)::INT`).

*Incorrect:*
```sql
SELECT EXTRACT(YEAR FROM NOW()) + ' string'; -- ❌ Type mismatch double precision!
```

*Fix:*
```sql
SELECT EXTRACT(YEAR FROM NOW())::INT AS year_num;
```

## 5. Practice Exercises

### Exercise 1: Truncating Timestamps into Daily/Monthly Buckets with `DATE_TRUNC`

**Scenario:**
Group sales orders into 1-month date buckets using `DATE_TRUNC('month', created_at)`.

**Requirements:**
1. Execute `SELECT DATE_TRUNC('month', created_at) AS month_bucket, SUM(total_cents) FROM orders GROUP BY month_bucket`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   DATE_TRUNC('month', created_at) AS sales_month,
>   COUNT(*) AS total_orders,
>   SUM(total_cents) / 100.0 AS monthly_revenue 
> FROM orders 
> GROUP BY sales_month 
> ORDER BY sales_month DESC;
> ```
>
> #### Technical Explanation
>
> 1. `DATE_TRUNC('unit', timestamp)` truncates a timestamp to the specified precision (e.g. `'day'`, `'month'`, `'year'`).
> 2. Groups all orders occurring within the same calendar month into a single bucket.
> 3. Standard date aggregation function for reporting.

---

### Exercise 2: Calculating Age Intervals with `AGE`

**Scenario:**
Calculate a user's exact age in years, months, and days based on `birth_date`.

**Requirements:**
1. Use `AGE(CURRENT_DATE, birth_date)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   username, 
>   birth_date, 
>   AGE(CURRENT_DATE, birth_date) AS user_age 
> FROM users;
> ```
>
> #### Technical Explanation
>
> 1. `AGE(timestamp1, timestamp2)` calculates the exact difference between two dates as an `INTERVAL`.
> 2. Accounts for leap years and variable calendar month lengths.
> 3. Returns formatted interval objects (`"25 years 3 mons 12 days"`).

---

### Exercise 3: Timezone Formatting with `AT TIME ZONE`

**Scenario:**
Convert UTC timestamps stored in `created_at` to `'America/New_York'` local time for UI display.

**Requirements:**
1. Use `created_at AT TIME ZONE 'America/New_York'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   created_at AS utc_time,
>   created_at AT TIME ZONE 'America/New_York' AS ny_local_time 
> FROM audit_logs;
> ```
>
> #### Technical Explanation
>
> 1. `AT TIME ZONE 'tz_name'` shifts a `TIMESTAMPTZ` UTC timestamp to the target local timezone.
> 2. Handles Daylight Saving Time (DST) adjustments automatically.
> 3. Essential for localized client dashboard reporting.

---



## 6. Related Terms
- [`DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`](../level_02/date_time_types.md) — The parent temporal types.

---

## 7. Key Takeaways
- Date/Time functions perform server-side calculations on temporal data.
- `NOW()` returns the start timestamp of the current transaction block.
- Use `INTERVAL` to easily add or subtract units of time (e.g. `- INTERVAL '30 days'`).
- `AGE()` computes detailed time intervals (difference) between timestamps.
- Use `DATE_TRUNC` to round timestamps down for category log groupings.
- Use `EXTRACT` to pull numeric units (year, month, hour) from timestamps.
