# `DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`

> **Level 2 — Core Data Types & Constraints**
> The four primary date and time data types in PostgreSQL, scaling from simple dates to timezone-aware global timestamps.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Internally stores timestamps as 8-byte integers representing microseconds since January 1, 2000. Timezone conversions are evaluated on-the-fly based on client session settings).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Datetime Selection

**Problem:** You are building a movie ticket app. Choose the most appropriate database type (`DATE`, `TIME`, `TIMESTAMP`, or `TIMESTAMPTZ`) for:
1.  A user's date of birth.
2.  The exact moment a user completed their credit card checkout.
3.  A movie screening slot (e.g., Spider-Man screens on Friday at 8:00 PM local theater time).

**Expected output:**
```text
1. Birthday: DATE (Only calendar day matters, timezones are irrelevant).
2. Checkout Moment: TIMESTAMPTZ (Audit logging must record the exact global absolute moment to prevent fraud and handle payment reconciliation).
3. Screening Slot: TIMESTAMP (A screening at 8:00 PM happens at 8:00 PM local theater time, regardless of what timezone the server hosting the database runs in).
```

> [!check]- Answer
> - Determine if absolute global time matching (timezone) is critical for audits.
> - Consider if local clock representation takes precedence.

---



### Exercise 2: Current UTC Timestamp Functions

**Problem:** SQL statement getting current UTC timestamp (`NOW()`, `CURRENT_TIMESTAMP`).

**Expected output:**
```text
SELECT NOW();
```

> [!check]- Answer
> ```sql
> SELECT NOW();
> ```
>
> **Explanation:** `NOW()` and `CURRENT_TIMESTAMP` return active transaction start `TIMESTAMPTZ` values.

### Exercise 3: Timezone Conversion with `AT TIME ZONE`

**Problem:** Convert current timestamp to `'UTC'` or `'America/New_York'` using `AT TIME ZONE`.

**Expected output:**
```text
SELECT NOW() AT TIME ZONE 'America/New_York';
```

> [!check]- Answer
> ```sql
> SELECT NOW() AT TIME ZONE 'America/New_York';
> ```
>
> **Explanation:** `AT TIME ZONE` converts timestamps to specified timezone wall-clock dates.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.

---

## 8. Key Takeaways
- PostgreSQL date/time types are `DATE`, `TIME`, `TIMESTAMP`, and `TIMESTAMPTZ`.
- `TIMESTAMPTZ` is the industry default best practice for event logging and audit trails.
- `TIMESTAMPTZ` stores dates in UTC on disk and translates them to the client timezone on query.
- `TIMESTAMP` ignores timezones entirely, storing raw clock values.
- Standard ISO 8601 formatting (`YYYY-MM-DD HH:MI:SS`) is used for database writes.
