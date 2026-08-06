# `SHOW CHANGES FOR TABLE ... SINCE ...`

> **Level 9 — Real-Time Features, Events & Functions**
> The SurrealQL statement used to retrieve historical change events from a table's changefeed starting from a specified timestamp or version sequence.

---

## 1. Prerequisites

- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Enabling changefeed recording on tables.
- [`datetime` / `duration`](../level_02/datetime_duration.md) — ISO datetime formats.

---

## 2. Term Category


**SurrealQL Command (changefeed historical delta inspection statement)**: - **SurrealQL Query / Data Sync**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When client applications disconnect from a real-time database (e.g. a mobile phone entering a tunnel or an offline web client), live query subscriptions (`LIVE SELECT`) stop receiving updates. Upon reconnecting, the client needs to catch up on missed data without downloading the entire database table again.

`SHOW CHANGES FOR TABLE ... SINCE ...` works together with table `CHANGEFEED`s. When a client reconnects, it passes the timestamp of its last known state (e.g. `SINCE d"2026-07-22T08:00:00Z"`). SurrealDB returns only the records created, updated, or deleted since that exact moment, allowing fast, incremental synchronization.

### (2) Reality Metaphor
Think of an email inbox catch-up:
- **Downloading full table**: Clearing out your entire inbox and re-downloading all 50,000 emails from the beginning of time just to get today's updates.
- **`SHOW CHANGES FOR TABLE ... SINCE`**: Clicking "Fetch New Mail" to download only the 3 emails received since you logged off 2 hours ago.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Fetch changes on the 'orders' table since a specific timestamp
SHOW CHANGES FOR TABLE orders SINCE d"2026-07-22T00:00:00Z";
```

#### Fuller Example
```surrealql
-- 1. Setup table with changefeed retention
DEFINE TABLE document SCHEMAFULL CHANGEFEED 7d;

-- 2. Query changes recorded since 1 hour ago
SHOW CHANGES FOR TABLE document SINCE time::now() - 1h;

-- 3. Query changes recorded since a specific sequence version
SHOW CHANGES FOR TABLE document SINCE 1050;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing SHOW CHANGES on Tables Without CHANGEFEED Enabled

**The mistake:** Calling `SHOW CHANGES FOR TABLE my_table SINCE ...` on a table that was defined without a `CHANGEFEED` clause.

**Why it's wrong:** If a table has no `CHANGEFEED` configured, SurrealDB does not record change history, and `SHOW CHANGES` returns an error or empty result.

*Incorrect:*
```surrealql
-- Table defined without CHANGEFEED!
DEFINE TABLE my_table SCHEMAFULL;
SHOW CHANGES FOR TABLE my_table SINCE d"2026-07-22T00:00:00Z"; -- Fails!
```

*Fix:*
```surrealql
-- Enable CHANGEFEED on the table first
DEFINE TABLE my_table SCHEMAFULL CHANGEFEED 7d;
SHOW CHANGES FOR TABLE my_table SINCE d"2026-07-22T00:00:00Z"; -- Works!
```

---



### Mistake 2: Querying `SHOW CHANGES` Without `SINCE` Clauses

**The mistake:** Executing `SHOW CHANGES FOR TABLE user;` (SyntaxError).

**Why it's wrong:** `SHOW CHANGES FOR TABLE` requires a `SINCE` clause specifying a starting timestamp or change version (e.g. `SINCE d'2026-01-01T00:00:00Z'` or `SINCE 1`).

*Incorrect:*
```surrealql
SHOW CHANGES FOR TABLE user; // ❌ Missing SINCE clause!
```

*Fix:*
```surrealql
SHOW CHANGES FOR TABLE user SINCE d"2026-01-01T00:00:00Z";
```

### Mistake 3: Querying Pruned Changefeed Historical Intervals

**The mistake:** Querying changes from 30 days ago on a table defined with `CHANGEFEED 7d`.

**Why it's wrong:** Changefeed records older than the declared retention window (`7d`) are pruned automatically.

*Incorrect:*
```surrealql
-- Changefeed retention is 7d:
SHOW CHANGES FOR TABLE user SINCE d"2026-01-01T00:00:00Z"; // ❌ Historical data pruned!
```

*Fix:*
```surrealql
DEFINE TABLE user CHANGEFEED 30d; // Extend retention window
```





## 5. Practice Exercises

### Exercise 1: Streaming Historical Table Changes with `SHOW CHANGES`

**Scenario:**
An audit application streams all changefeed records for table `order` recorded since `d"2026-08-01T00:00:00Z"`.

**Requirements:**
1. Execute `SHOW CHANGES FOR TABLE order SINCE d"2026-08-01T00:00:00Z"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SHOW CHANGES FOR TABLE order SINCE d"2026-08-01T00:00:00Z";
> ```
>
> #### Technical Explanation
>
> 1. `SHOW CHANGES FOR TABLE` inspects changefeed transaction logs for table mutations.
> 2. `SINCE` specifies the starting timestamp or sequence offset for change retrieval.
> 3. Underpins event sourcing and Change Data Capture (CDC) architectures.
> 
---

### Exercise 2: Sequence Number Offset Resumption

**Scenario:**
An offline sync client resumes streaming table changes starting from version sequence `200`.

**Requirements:**
1. Execute `SHOW CHANGES FOR TABLE order SINCE 200`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SHOW CHANGES FOR TABLE order SINCE 200;
> ```
>
> #### Technical Explanation
>
> 1. Sequence offsets allow clients to resume streaming without missing or duplicating mutation events.
> 2. Guarantees deterministic, sequential event replay.
> 3. Enables reliable offline database sync.
> 
---

### Exercise 3: Inspecting Changefeed Record Payload Structures

**Scenario:**
Inspect the returned payload structure of a `SHOW CHANGES` query result item.

**Requirements:**
1. Describe the changefeed item properties (`action`, `record`, `changes`).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Changefeed Item Structure:
> - action: "CREATE" | "UPDATE" | "DELETE"
> - record: record link ID (e.g. order:o1)
> - timestamp: ISO datetime of mutation
> - changes: JSON Patch delta array
> ```
>
> #### Technical Explanation
>
> 1. Changefeed payloads include operation action types, record primary keys, timestamps, and deltas.
> 2. Provides full audit visibility into historical data modifications.
> 3. Simplifies integration with external search indexes and data warehouses.
> 
---





## 6. Related Terms

- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Enabling change logging.
- [`LIVE SELECT` (Live Queries)](live_select.md) — Real-time push streams.
- [Time Functions (`time::*`)](../level_06/time_functions.md) — Date/time arithmetic.

---

## 7. Key Takeaways
- `SHOW CHANGES FOR TABLE ... SINCE ...` retrieves historical changefeed logs.
- Accepts ISO datetimes (`d"..."`), relative expressions (`time::now() - 1h`), or version numbers.
- Enables efficient catch-up data synchronization after network disconnections.
