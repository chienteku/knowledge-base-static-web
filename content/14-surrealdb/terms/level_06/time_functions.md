# Time Functions (`time::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for date, time, and timestamp manipulation (`time::now()`, `time::floor()`, `time::format()`, `time::group()`), enabling date truncations and duration arithmetic natively.

---

## 1. Prerequisites
- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`datetime` / `duration`](../level_02/datetime_duration.md) — Temporal types.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated using UTC nanosecond precision. Manages timezone offsets and formatting rules during query execution).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Date and time operations are essential for building analytics and tracking software:
- Truncating timestamps to group metrics by day, week, or month (`time::floor()` / `time::group()`).
- Extracting specific components (day of week, year, hour) from timestamps.
- Formatting raw UTC datetimes into human-readable strings for API responses.

In SQL (PostgreSQL), developers use `DATE_TRUNC()`, `EXTRACT()`, and `TO_CHAR()`. In MongoDB, developers use aggregation date operators (`$dateTrunc`, `$dateToString`).

We designed the **`time::*`** module in SurrealDB to provide a unified date/time suite. Functions like `time::now()` fetch current UTC timestamps, `time::floor()` truncates dates cleanly, and `time::format()` transforms ISO timestamps into any custom string template, avoiding date parsing bugs.

---

### (2) Key Function Categories

#### 1. Current Time & Timestamp Creation
- `time::now()`: Returns the current UTC timestamp (e.g. `d"2026-07-22T09:23:00Z"`).
- `time::from::unix(timestamp)`: Converts Unix epoch seconds to a `datetime`.
- `time::from::millis(ms)`: Converts epoch milliseconds to a `datetime`.

#### 2. Truncation & Grouping
- `time::floor(dt, duration)`: Truncates (rounds down) a timestamp to the nearest duration boundary (e.g., `time::floor(d"2026-07-22T09:45:00Z", 1h)` returns `d"2026-07-22T09:00:00Z"`).
- `time::group(dt, "day"|"month"|"year")`: Groups a timestamp by calendar periods for `GROUP BY` aggregations.

#### 3. Component Extraction & Formatting
- `time::year(dt)` / `time::month(dt)` / `time::day(dt)` / `time::wday(dt)`: Extracts specific date units.
- `time::format(dt, format_string)`: Formats datetime to string using format specifications (e.g. `%Y-%m-%d`).

---

### (3) Reality Metaphor (The Digital Grandfather Clock)
Imagine a master clockmaker's bench:
- **`time::now`:** Looking at a digital atomic clock displaying exact nanoseconds UTC.
- **`time::floor(dt, 1d)`:** Flipping the calendar page back to midnight (00:00:00) of the current day.
- **`time::format`:** Taking a raw timestamp stamp and printing it neatly onto a paper postcard in `"YYYY-MM-DD"` format.

---

### (4) Code Examples

#### Using `time::*` Functions in SurrealQL

```sql
-- 1. Setting timestamps on record creation/update
CREATE order SET 
  placed_at = time::now(),
  delivery_estimate = time::now() + 3d;

-- 2. Truncating timestamps to group metrics by hour
SELECT 
  time::floor(created_at, 1h) AS hour_bucket,
  count() AS total_requests
FROM api_log
GROUP BY hour_bucket;

-- 3. Formatting dates for API output
SELECT 
  id,
  time::format(created_at, "%B %d, %Y") AS formatted_date
FROM post;
-- Returns: "July 22, 2026"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using SQL function names like 'NOW()' or 'DATE_TRUNC()' instead of 'time::now()' and 'time::floor()'

**The mistake:** Writing `SELECT * FROM logs WHERE created_at > NOW() - INTERVAL '7 days';`.

**Why it's wrong:** SurrealQL does not support PostgreSQL function names or `INTERVAL` text strings. Executing this will result in parser syntax errors.

**Fix: Use SurrealDB's `time::now()` function and native duration literals (`7d`):**

```sql
-- BAD
SELECT * FROM logs WHERE created_at > NOW() - INTERVAL '7 days';

-- GOOD
SELECT * FROM logs WHERE created_at > time::now() - 7d;
```

---



### Mistake 2: Passing Plain Strings to `time::` Functions Without `d"..."` Prefix

**The mistake:** Passing `'2026-01-01'` into `time::year('2026-01-01')`.

**Why it's wrong:** `time::` functions expect native `datetime` primitives. Pass `d'2026-01-01T00:00:00Z'` or `<datetime> '2026-01-01'`. Plain strings trigger type errors.

*Incorrect:*
```surrealql
RETURN time::year("2026-01-01"); // ❌ Expected datetime, got string!
```

*Fix:*
```surrealql
RETURN time::year(d"2026-01-01T00:00:00Z"); // Native datetime input
```

### Mistake 3: Confusing `time::now()` (Current Timestamp) with Static Constant Strings

**The mistake:** Hardcoding `"2026-01-01"` in `DEFAULT` field initializers expecting real-time updates.

**Why it's wrong:** Use `time::now()` to capture the dynamic current ISO timestamp upon record creation.

*Incorrect:*
```surrealql
DEFINE FIELD created_at ON TABLE user TYPE datetime DEFAULT d"2026-01-01T00:00:00Z"; // Static fixed date!
```

*Fix:*
```surrealql
DEFINE FIELD created_at ON TABLE user TYPE datetime DEFAULT time::now(); // Dynamic current time
```

## 6. Practice Exercises

### Exercise 1: Daily Metric Aggregation

**Problem:** You have an `analytics` table with a `timestamp` field.
Write the SurrealQL query to:
1. Truncate `timestamp` to 1-day boundaries (`1d`) using `time::floor()`, aliased as `day`.
2. Count total records as `event_count`.
3. Group by `day`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT 
>   time::floor(timestamp, 1d) AS day, 
>   count() AS event_count 
> FROM analytics 
> GROUP BY day;
> ```
> - The duration argument for 1 day is `1d`.
> - Truncate using `time::floor(timestamp, 1d)`.

---



### Exercise 2: Extracting Date Components

**Problem:** Extract year, month, and day from `time::now()` using `time::year()`, `time::month()`, `time::day()`.

**Expected output:**
> [!check]- Answer
> ```text
> time::year(time::now()), time::month(time::now()), time::day(time::now())
> ```
> ```surrealql
> RETURN [time::year(time::now()), time::month(time::now()), time::day(time::now())];
> ```
>
> **Explanation:** `time::` component functions extract date parts from `datetime` primitives.

---

### Exercise 3: Time Difference Calculation

**Problem:** Calculate time duration difference between `$start` and `$end` using `time::from::unix()` or arithmetic subtraction.

**Expected output:**
> [!check]- Answer
> ```text
> RETURN $end - $start;
> ```
> ```surrealql
> RETURN $end - $start;
> ```
>
> **Explanation:** Subtracting two `datetime` primitives returns a `duration` value.

## 7. Related Terms
- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`datetime` / `duration`](../level_02/datetime_duration.md) — Temporal types.

---

## 8. Key Takeaways
- The `time::*` module handles timestamps, truncations, and formatting.
- `time::now()` returns the current UTC timestamp.
- `time::floor(dt, duration)` rounds timestamps down to duration buckets (e.g. `1h`, `1d`).
- Duration arithmetic (`time::now() + 7d`) works directly with datetime objects.
- `time::format(dt, "%Y-%m-%d")` formats timestamps into custom strings.
