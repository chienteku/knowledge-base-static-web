# `datetime` / `duration`

> **Level 2 — Data Types & Record Structure**
> The chronological data types in SurrealDB: `datetime` (timezone-aware UTC timestamps prefixed with `d`) and `duration` (human-readable time spans like `1h30m`), supporting native timezone-aware arithmetic at the database layer.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Stored internally as nanoseconds since Unix epoch. Timezone conversions are evaluated at the database compiler layer).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Handling date formatting and time math in database queries is notoriously frustrating:
-   **PostgreSQL:** Requires dealing with complex `INTERVAL` syntax, timezone casting (`AT TIME ZONE`), and separate `TIMESTAMP` vs `TIMESTAMPTZ` definitions.
-   **MongoDB:** Stores dates, but doing relative date arithmetic (like "find logs from 3 days ago") requires calculating epoch milliseconds in your application code before running the query.

We designed the **`datetime`** and **`duration`** types in SurrealDB to solve this chronological complexity. 

A `datetime` stores a specific point in time in UTC with timezone awareness. 

A `duration` stores a time span using clean, human-readable labels (like `7d` for seven days or `2h30m` for two hours and thirty minutes). 

SurrealDB integrates these types natively: you can perform datetime math (adding or subtracting durations from timestamps) directly in SurrealQL queries without syntax helpers or application-layer conversions.

---

### (2) Data Type Syntaxes

#### 1. Datetime Literals
Datetime values are written as ISO 8601 strings prefixed with the character **`d`**:
`d"2026-07-21T15:30:00Z"` or `d'2026-07-21T15:30:00+08:00'`
-   *Note:* SurrealDB parses the timezone offset and converts the timestamp to UTC on disk.

#### 2. Duration Literals
Duration values are written as numbers immediately followed by time units:
`30s` (seconds), `15m` (minutes), `2h` (hours), `7d` (days), `3w` (weeks).
-   *Nesting:* You can combine units: `1d12h30m` (1 day, 12 hours, 30 minutes).

---

### (3) Duration Arithmetic (The Killer Feature)
You can add or subtract durations directly to/from datetimes:
-   `d"2026-07-21T12:00:00Z" + 2h30m` $\rightarrow$ Evaluates to `d"2026-07-21T14:30:00Z"`.
-   `time::now() - 7d` $\rightarrow$ Evaluates to a timestamp exactly 7 days ago.

---

### (4) Reality Metaphor (Wall Calendars vs Stopwatches)
-   **`datetime` Type:** A **Wall Calendar showing Date & Time** (Tues, July 21, 2026, at 3:30 PM). It indicates a specific, unique moment in history.
-   **`duration` Type:** A **Stopwatch Timer** set to 1 hour and 30 minutes. It doesn't know *what year* it is; it only represents a length of time passing.
-   **Arithmetic:** If you look at the calendar (datetime) and add the stopwatch time (duration) to calculate when your meeting ends, you get a new calendar date.

---

### (5) Code Examples

#### Enforcing Chronological Constraints in SurrealQL
Let's model a token authentication schema:

```sql
DEFINE TABLE auth_token SCHEMAFULL;

DEFINE FIELD token_key ON auth_token TYPE string;
DEFINE FIELD expires_at ON auth_token TYPE datetime;

-- 1. Create a token expiring in exactly 2 hours (using duration math!)
CREATE auth_token SET
  token_key = "session_xyz123",
  expires_at = time::now() + 2h; // Automatically calculates expires timestamp!

-- 2. Query tokens that have not expired yet
SELECT * FROM auth_token WHERE expires_at > time::now();

-- 3. Query tokens created in the last 7 days (assuming we have a 'created_at' field)
SELECT * FROM auth_token WHERE created_at > time::now() - 7d;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the 'd' prefix when writing datetime literals in queries, causing SurrealDB to parse values as strings

**The mistake:** Running the query `SELECT * FROM logs WHERE created_at > "2026-07-21T15:30:00Z"`.

**Why it's wrong:** Without the `d` prefix, the value `"2026-07-21T15:30:00Z"` is parsed as a **string** data type. 

Because `created_at` stores a `datetime` type, comparing a datetime to a string results in type mismatches, returning no matches or throwing validation errors in schema-full tables.

**Fix: Always prepend the `d` character to ISO datetime strings in your query scripts:**

```sql
-- BAD
SELECT * FROM logs WHERE created_at > "2026-07-21T15:30:00Z";

-- GOOD
SELECT * FROM logs WHERE created_at > d"2026-07-21T15:30:00Z";
```

---



### Mistake 2: Parsing ISO Date Strings as Plain Strings Without `d"..."` Prefix

**The mistake:** Writing `'2026-01-01T00:00:00Z'` in queries expecting datetime comparison methods.

**Why it's wrong:** Unprefixed strings `'2026-01-01...'` are parsed as plain text `string` primitives. Use `d'2026-01-01T00:00:00Z'` or `time::now()` for native `datetime` primitives.

*Incorrect:*
```surrealql
SELECT * FROM log WHERE created_at > "2026-01-01T00:00:00Z"; // ❌ Compares strings, not datetimes!
```

*Fix:*
```surrealql
SELECT * FROM log WHERE created_at > d"2026-01-01T00:00:00Z"; // Native datetime prefix
```

### Mistake 3: Confusing Duration Syntax Units in Time Arithmetic

**The mistake:** Adding number `5` to a datetime expecting to add 5 minutes.

**Why it's wrong:** Adding plain numbers to datetimes fails or converts units incorrectly. Use explicit duration literals like `5m`, `2h`, `1d`, `3w`.

*Incorrect:*
```surrealql
LET $now = time::now();
RETURN $now + 5; // ❌ Adding plain number to datetime
```

*Fix:*
```surrealql
LET $now = time::now();
RETURN $now + 5m; // Correct: Adds 5 minutes duration
```

## 6. Practice Exercises

### Exercise 1: Chronological Calculation

**Problem:** You execute this query at `2026-07-21T12:00:00Z`:
`SELECT d"2026-07-21T10:00:00Z" + 1d2h30m;`
Calculate the resulting UTC datetime value returned by the database.

**Expected output:**
> [!check]- Answer
> ```text
> d"2026-07-22T12:30:00Z"
> ```
> - Add 1 day to the starting date: `2026-07-22T10:00:00Z`.
> - Add 2 hours and 30 minutes to the calculated intermediate date time.

---



### Exercise 2: Duration Unit Arithmetic

**Problem:** Calculate expiration datetime 7 days from `time::now()` using `7d` duration.

**Expected output:**
> [!check]- Answer
> ```text
> time::now() + 7d
> ```
> ```surrealql
> RETURN time::now() + 7d;
> ```
>
> **Explanation:** Durations (`7d`, `24h`, `30s`) add directly to native `datetime` values.

---

### Exercise 3: Formatting Datetimes with `time::format()`

**Problem:** Format `time::now()` into year-month-day string format `%Y-%m-%d`.

**Expected output:**
> [!check]- Answer
> ```text
> time::format(time::now(), "%Y-%m-%d")
> ```
> ```surrealql
> RETURN time::format(time::now(), "%Y-%m-%d");
> ```
>
> **Explanation:** `time::format()` formats `datetime` values into custom string layouts.

## 7. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Time Functions (`time::*`)](../level_06/time_functions.md) — Chronological operations.
- [`SLEEP` Statement](../level_10/sleep.md) — Related concept: `SLEEP` Statement.

---

## 8. Key Takeaways
- `datetime` stores UTC timestamps; `duration` stores elapsed time spans.
- Datetime literals must be prefixed with the `d` character (e.g. `d"..."`).
- Duration literals use unit suffixes (e.g. `30s`, `15m`, `2h`, `7d`, `1w`).
- Chronological arithmetic is supported natively (`datetime + duration`).
- `time::now()` returns the current database server timestamp in UTC.
- Always prefix queries dates to prevent string type mismatch bugs.
- Duration spans simplify writing relative range filters (e.g. `time::now() - 30d`).
