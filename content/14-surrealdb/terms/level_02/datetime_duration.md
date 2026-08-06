# `datetime` / `duration`

> **Level 2 — Data Types & Record Structure**
> The chronological data types in SurrealDB: `datetime` (timezone-aware UTC timestamps prefixed with `d`) and `duration` (human-readable time spans like `1h30m`), supporting native timezone-aware arithmetic at the database layer.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (ISO-8601 temporal and duration types)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: ISO Datetime Formatting and Retrieval

**Scenario:**
You are logging audit events in a security table `audit_log` with automatic timestamping and querying events created within the last 24 hours.

**Requirements:**
1. Define table `audit_log` in `SCHEMAFULL` mode.
2. Define field `created_at` as `datetime` defaulting to `time::now()`.
3. Create a log record `audit_log:log1`.
4. Query logs created after `time::now() - 1d`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE audit_log SCHEMAFULL;
> DEFINE FIELD created_at ON TABLE audit_log TYPE datetime DEFAULT time::now();
> 
> CREATE audit_log:log1 SET action = "user_login";
> 
> -- Query recent logs created in the last 24 hours
> SELECT * FROM audit_log WHERE created_at > time::now() - 1d;
> ```
>
> #### Technical Explanation
>
> 1. `datetime` stores ISO-8601 timestamps with microsecond precision (`d"2026-08-06T00:00:00Z"`).
> 2. `time::now()` outputs the current UTC timestamp during query execution.
> 3. Subtracting duration `1d` from `time::now()` performs instant temporal arithmetic.

---

### Exercise 2: Duration Arithmetic for Subscription Expiration

**Scenario:**
A SaaS billing engine calculates subscription expiration dates by adding duration offsets (e.g. `30d` or `1y`) to the subscription start date.

**Requirements:**
1. Create a subscription `sub:s1` setting `start_date = time::now()`.
2. Set `expires_at = start_date + 30d`.
3. Query active subscriptions where `expires_at > time::now()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE sub:s1 SET 
>     start_date = time::now(),
>     expires_at = time::now() + 30d;
> 
> -- Query active non-expired subscriptions
> SELECT * FROM sub WHERE expires_at > time::now();
> ```
>
> #### Technical Explanation
>
> 1. Durations represent time intervals (`30d`, `2w`, `12h`, `45m`, `30s`).
> 2. Adding a duration (`+ 30d`) to a `datetime` produces a valid future `datetime`.
> 3. Enables native subscription expiration logic without external date utility libraries.

---

### Exercise 3: Formatting Datetimes with `time::format()`

**Scenario:**
A reporting API needs to output human-readable formatted date strings (e.g. `"2026-08-06"`) from stored `datetime` fields.

**Requirements:**
1. Query `audit_log:log1`.
2. Format `created_at` as a YYYY-MM-DD date string using `time::format()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     created_at,
>     time::format(created_at, "%Y-%m-%d") AS formatted_date 
> FROM audit_log:log1;
> ```
>
> #### Technical Explanation
>
> 1. `time::format(datetime, format_string)` formats timestamps using standard strftime specifiers.
> 2. Formats dates on the database server, reducing client-side formatting code.
> 3. Returns a clean formatted `string` representation while preserving stored `datetime` precision.

---





## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Time Functions (`time::*`)](../level_06/time_functions.md) — Chronological operations.
- [`SLEEP` Statement](../level_10/sleep.md) — Related concept: `SLEEP` Statement.

---

## 7. Key Takeaways
- `datetime` stores UTC timestamps; `duration` stores elapsed time spans.
- Datetime literals must be prefixed with the `d` character (e.g. `d"..."`).
- Duration literals use unit suffixes (e.g. `30s`, `15m`, `2h`, `7d`, `1w`).
- Chronological arithmetic is supported natively (`datetime + duration`).
- `time::now()` returns the current database server timestamp in UTC.
- Always prefix queries dates to prevent string type mismatch bugs.
- Duration spans simplify writing relative range filters (e.g. `time::now() - 30d`).
