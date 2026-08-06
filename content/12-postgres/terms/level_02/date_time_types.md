# `DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`

> **Level 2 — Core Data Types & Constraints**
> The four primary date and time data types in PostgreSQL, scaling from simple dates to timezone-aware global timestamps.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Data Type** (Temporal Types): Date and Time data types (`DATE`, `TIME`, `TIMESTAMP`, `TIMESTAMPTZ`, `INTERVAL`) represent calendar dates and microsecond-precision timestamps.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Internally stores timestamps as 8-byte integers representing microseconds since January 1, 2000. Timezone conversions are evaluated on-the-fly based on client session settings).

### (1) Design Motivation — "Why did we design this?"
Handling date and time in software is notoriously difficult due to:
-   **Timezone Differences:** When a user in New York writes a post at 5 PM EST, a user in London should see it published at 10 PM GMT.
-   **Daylight Saving Time (DST):** Clocks moving forward and backward can duplicate or skip hour logs.
-   **Date Mathematics:** Calculating "30 days ago" or "age based on birthday" is complex when months have different day counts.

If you store dates as plain text (e.g. `'07/21/2026'`), you cannot sort them alphabetically, verify if they are valid dates (e.g. preventing February 30th), or perform date arithmetic.

PostgreSQL designed four specialized temporal data types to solve this:

| Type | Storage Size | Format | Best For |
| :--- | :--- | :--- | :--- |
| **`DATE`** | 4 Bytes | `YYYY-MM-DD` | Birthdays, holidays (no time details). |
| **`TIME`** | 8 Bytes | `HH:MI:SS` | Daily store opening hours (no date details). |
| **`TIMESTAMP`** | 8 Bytes | `YYYY-MM-DD HH:MI:SS` | Local flight departure schedules (timezone is implied). |
| **`TIMESTAMPTZ`** | 8 Bytes | `YYYY-MM-DD HH:MI:SS+TZ` | User registration logs, financial transactions, global events. |

---

### (2) The Gold Standard: `TIMESTAMPTZ`
In 90% of web applications, you should use **`TIMESTAMPTZ`** (Timestamp with Time Zone) for logging events. 

Here is how Postgres handles it under the hood:
1.  **Insert:** When a client sends a timestamp with an offset (e.g. `2026-07-21 17:00:00-04`), Postgres converts it to **UTC time** and writes it to disk.
2.  **Display:** When you select the row, Postgres automatically converts the UTC timestamp back to the timezone specified by your active database client connection session!

This guarantees that data is stored consistently, regardless of where the server or user resides.

---

### (3) Reality Metaphor
Compare calendar types to scheduling:
-   **`DATE`** is like circling a box on a paper wall calendar (e.g., "My Birthday is December 25"). It doesn't matter what time it is.
-   **`TIMESTAMP`** is like a sign on a store door saying "We open daily at 9:00 AM". It refers to local time wherever the store is located.
-   **`TIMESTAMPTZ`** is a plane ticket departure time (e.g. "Departing London Heathrow at 15:30 GMT"). It refers to an absolute, specific moment in global history. Passengers in other timezones must adjust their watches to match this moment.

---

### (4) Code Examples

#### Creating a Schedule Table
```sql
CREATE TABLE flights (
  flight_no VARCHAR(10) PRIMARY KEY,
  departure_date DATE,
  departure_time TIME,
  scheduled_arrival TIMESTAMPTZ -- Global absolute moment
);
```

#### Inserting Standard ISO 8601 Strings
```sql
INSERT INTO flights (flight_no, departure_date, departure_time, scheduled_arrival)
VALUES (
  'AA102', 
  '2026-07-21', 
  '14:30:00', 
  '2026-07-21 14:30:00-04' -- NYC Timezone (-4 hours offset from UTC)
);
```

#### Timezone Client Conversion Demo
Watch how Postgres converts output based on the client session timezone:

```sql
-- Show timestamp in UTC
SET TIME ZONE 'UTC';
SELECT scheduled_arrival FROM flights;
-- Output: 2026-07-21 18:30:00+00

-- Swap client session to New York
SET TIME ZONE 'America/New_York';
SELECT scheduled_arrival FROM flights;
-- Output: 2026-07-21 14:30:00-04
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using TIMESTAMP (without timezone) for application log fields

**The mistake:** Using `TIMESTAMP` (instead of `TIMESTAMPTZ`) to track fields like `created_at` or `updated_at` on your tables.

**Why it's wrong:** Without timezone details, Postgres simply strips the timezone offset off incoming values. If your web server runs on local time, and your database server runs on UTC, the timestamps will shift by hours when saved, creating logs that show actions happening in the future or past.

**Fix: Always use `TIMESTAMPTZ` for audit trails, logging, and events. It forces UTC standardization on disk.**

---



### Mistake 2: Using `TIMESTAMP` (Without Timezone) for Global Application Event Timestamps

**The mistake:** Defining timestamp columns as `TIMESTAMP` (or `TIMESTAMP WITHOUT TIME ZONE`).

**Why it's wrong:** `TIMESTAMP` ignores timezone offsets! When servers or clients run in different timezones, timestamps become ambiguous. Use `TIMESTAMPTZ` (`TIMESTAMP WITH TIME ZONE`).

*Incorrect:*
```sql
created_at TIMESTAMP -- ❌ Ambiguous timezone data!
```

*Fix:*
```sql
created_at TIMESTAMPTZ -- UTC normalized timestamp storage
```

### Mistake 3: Assuming `TIMESTAMPTZ` Stores the Original Timezone Offset Name inside the Column

**The mistake:** Expecting `TIMESTAMPTZ` to preserve local timezone names like `'Asia/Taipei'`.

**Why it's wrong:** `TIMESTAMPTZ` converts incoming dates to UTC and stores them as 64-bit UTC epoch integers! Timezones are converted to client session timezones on read output.

*Incorrect:*
```sql
-- Expecting column to store 'Asia/Taipei' string
```

*Fix:*
```sql
Store timezone name string in separate column if original timezone name is required
```

## 5. Practice Exercises

### Exercise 1: Storing UTC Timestamps with `TIMESTAMPTZ`

**Scenario:**
Create an `audit_logs` table storing user event timestamps using `TIMESTAMPTZ`.

**Requirements:**
1. Use `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE audit_logs (
>   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   event_name TEXT NOT NULL,
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. `TIMESTAMPTZ` converts input datetimes from the client's timezone into UTC for storage.
> 2. Re-converts UTC timestamps back into the requesting client's timezone on retrieval.
> 3. Golden rule: Always use `TIMESTAMPTZ` instead of plain `TIMESTAMP` for application timestamps.

---

### Exercise 2: Date Arithmetic with `INTERVAL`

**Scenario:**
Calculate subscription expiration dates set to 30 days after signup date using `INTERVAL`.

**Requirements:**
1. Execute `signup_date + INTERVAL '30 days'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   created_at AS signup_date,
>   created_at + INTERVAL '30 days' AS expires_at 
> FROM subscriptions;
> ```
>
> #### Technical Explanation
>
> 1. `INTERVAL` represents time spans (e.g., `'30 days'`, `'2 hours'`, `'1 month'`).
> 2. Adding `INTERVAL` to `TIMESTAMPTZ` handles leap years and variable month lengths automatically.
> 3. Dynamic server-side date arithmetic.

---

### Exercise 3: Extracting Calendar Fields with `EXTRACT`

**Scenario:**
Extract year, month, and day components from `created_at` in an order summary report.

**Requirements:**
1. Use `EXTRACT(YEAR FROM created_at)` and `EXTRACT(MONTH FROM created_at)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   EXTRACT(YEAR FROM created_at) AS order_year,
>   EXTRACT(MONTH FROM created_at) AS order_month,
>   COUNT(*) AS total_orders 
> FROM orders 
> GROUP BY order_year, order_month 
> ORDER BY order_year DESC, order_month DESC;
> ```
>
> #### Technical Explanation
>
> 1. `EXTRACT(field FROM timestamp)` isolates specific date/time parts (`YEAR`, `MONTH`, `DAY`, `DOW`).
> 2. Grouping by extracted year and month produces monthly sales totals.
> 3. Executes natively inside PostgreSQL query engine.

---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [Date/Time Functions (`NOW()`, `CURRENT_DATE`, `AGE()`, `EXTRACT`, `DATE_TRUNC`, `INTERVAL`)](../level_04/date_time_functions.md) — Related concept: Date/Time Functions (`NOW()`, `CURRENT_DATE`, `AGE()`, `EXTRACT`, `DATE_TRUNC`, `INTERVAL`).

---

## 7. Key Takeaways
- PostgreSQL date/time types are `DATE`, `TIME`, `TIMESTAMP`, and `TIMESTAMPTZ`.
- `TIMESTAMPTZ` is the industry default best practice for event logging and audit trails.
- `TIMESTAMPTZ` stores dates in UTC on disk and translates them to the client timezone on query.
- `TIMESTAMP` ignores timezones entirely, storing raw clock values.
- Standard ISO 8601 formatting (`YYYY-MM-DD HH:MI:SS`) is used for database writes.
