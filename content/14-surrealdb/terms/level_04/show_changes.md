# `SHOW CHANGES FOR TABLE`

> **Level 4 — Schema Definition & Constraints**
> The SurrealQL DDL statement used to query a table's Change Data Capture (CDC) stream, returning a chronological log of record mutations (creates, updates, deletes) since a specific timestamp or sequence key.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The table definition context.
- [Connection URI & Protocols](../level_01/connection_uri.md) — The network stream context.

---

## 2. Term Category


**SurrealQL Command (schema change tracking statement)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern application architecture, tracking data changes is critical:
-   **Offline Sync:** A mobile app goes offline for 2 hours. When it reconnects, it needs to download only the changes that occurred while it was offline, rather than redownloading the entire database.
-   **Cache Invalidation:** An API gateway needs to purge cached profiles whenever users modify their accounts.
-   **Auditing:** A compliance system must track every database write step-by-step.

In PostgreSQL, developers configure complex triggers, logical replication slots, and write-ahead log (WAL) parsers (like Debezium). 

In MongoDB, you use Change Streams, which require replica sets and continuous WebSocket polling.

We designed the **`SHOW CHANGES FOR TABLE`** statement in SurrealQL to provide built-in Change Data Capture (CDC). 

By enabling **Change Feeds** on a table, SurrealDB automatically logs every mutation to disk. 

Your application can query this feed like a standard database table, requesting all updates since a specific timestamp, simplifying offline synchronization and auditing.

---

### (2) Enabling Change Feeds
By default, change logging is disabled to prevent write overhead. You must enable it on the table schema, specifying how long to retain the history:
`DEFINE TABLE user SCHEMAFULL CHANGEFEED 7d;` (retains 7 days of change history).

---

### (3) Reality Metaphor (The Security Logbook)
Imagine monitoring stock in a retail warehouse:
-   **Standard SELECT:** Walking into the warehouse and counting the boxes on the shelves right now. (Shows only the current state).
-   **`SHOW CHANGES` Query:** Asking the guard for the **Security Gate Logbook**.
    -   You say: *"Show me the logs since 10:00 AM."*
    -   The book lists: *"10:05 AM: Box A arrived (CREATE). 10:15 AM: Box B moved (UPDATE). 10:20 AM: Box C shredded (DELETE)."*
    -   You see the history of changes, not just the final result.

---

### (4) Code Examples

#### Querying Change Feeds in SurrealQL
Let's define a table with change logs and query its history:

```sql
-- 1. Define a table with a Change Feed active (retains log for 3 days)
DEFINE TABLE product SCHEMAFULL CHANGEFEED 3d;
DEFINE FIELD name ON product TYPE string;

-- 2. Insert and update records to generate history
CREATE product:1 SET name = "Camera";
UPDATE product:1 SET name = "Camera Pro";
DELETE product:1;

-- 3. Query the change feed log since a specific datetime
SHOW CHANGES FOR TABLE product SINCE d"2026-07-21T00:00:00Z" LIMIT 10;

-- Output returned is an array of mutation events:
// [
//   {
//     "action": "CREATE",
//     "record": product:1,
//     "time": d"2026-07-21T15:00:00Z",
//     "data": { "name": "Camera" }
//   },
//   {
//     "action": "UPDATE",
//     "record": product:1,
//     "time": d"2026-07-21T15:05:00Z",
//     "data": { "name": "Camera Pro" }
//   }
// ]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to run 'SHOW CHANGES FOR TABLE' on a table that does not have change feeds configured, returning empty logs or errors

**The mistake:** Executing the query `SHOW CHANGES FOR TABLE user SINCE d"2026-07-21T00:00:00Z";` on a standard table, expecting history data to be returned.

**Why it's wrong:** To avoid wasting disk space, SurrealDB does not write change logs for standard tables. 

If you do not append the `CHANGEFEED <duration>` clause to the table schema definition, `SHOW CHANGES` will return no data or throw an error.

**Fix: Configure the table schema to activate change feeds before trying to query mutations:**

```sql
-- CORRECT SETUP
DEFINE TABLE user SCHEMAFULL CHANGEFEED 7d;
```

---



### Mistake 2: Querying Change Feeds on Tables Where `CHANGEFEED` Was Not Enabled

**The mistake:** Running `SHOW CHANGES FOR TABLE user SINCE d'2026-01-01T00:00:00Z';` without enabling `CHANGEFEED`.

**Why it's wrong:** Change feeds must be explicitly enabled on the table using `DEFINE TABLE user CHANGEFEED 3d;` before `SHOW CHANGES` can be queried.

*Incorrect:*
```surrealql
SHOW CHANGES FOR TABLE user SINCE 1; // ❌ Fails if CHANGEFEED is not defined!
```

*Fix:*
```surrealql
DEFINE TABLE user CHANGEFEED 7d; // 1. Enable changefeed with retention duration
SHOW CHANGES FOR TABLE user SINCE d"2026-01-01T00:00:00Z"; // 2. Query changes
```

### Mistake 3: Querying Change Feeds Beyond Defined Retention Duration Boundaries

**The mistake:** Querying changes from 10 days ago on a table defined with `CHANGEFEED 3d`.

**Why it's wrong:** SurrealDB prunes change feed records beyond the specified retention duration (`3d`). Querying past retention boundaries fails or returns incomplete changes.

*Incorrect:*
```surrealql
-- Changefeed retention is 3d:
SHOW CHANGES FOR TABLE user SINCE d"2026-01-01T00:00:00Z"; // ❌ Pruned if older than 3 days!
```

*Fix:*
```surrealql
DEFINE TABLE user CHANGEFEED 30d; // Extend retention window for long historical syncs
```

## 5. Practice Exercises

### Exercise 1: Enabling Table Changefeeds

**Scenario:**
Enable a table changefeed stream on table `order` with a 7-day change retention window.

**Requirements:**
1. Define table `order` with `CHANGEFEED 7d`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE order SCHEMAFULL CHANGEFEED 7d;
> ```
>
> #### Technical Explanation
>
> 1. `CHANGEFEED <duration>` enables change tracking for table mutations.
> 2. Retains change history for the specified duration (e.g. `7d`).
> 3. Underpins real-time streaming and sync architectures.
> 
---

### Exercise 2: Inspecting Historical Changes with `SHOW CHANGES`

**Scenario:**
Inspect changefeed entries for table `order` starting from a specific timestamp.

**Requirements:**
1. Write `SHOW CHANGES FOR TABLE order SINCE d"2026-08-01T00:00:00Z"`.

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
> 1. `SHOW CHANGES FOR TABLE` streams historical mutation deltas.
> 2. `SINCE` filters changes recorded after a target timestamp or version sequence.
> 3. Enables event sourcing and external CDC integration.
> 
---

### Exercise 3: Inspecting Changefeed Version Sequences

**Scenario:**
Query changes using a numeric changefeed version sequence number.

**Requirements:**
1. Write `SHOW CHANGES FOR TABLE order SINCE 100`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SHOW CHANGES FOR TABLE order SINCE 100;
> ```
>
> #### Technical Explanation
>
> 1. Sequence numbers allow client sync engines to resume streaming from precise change offsets.
> 2. Guarantees exactly-once delta processing.
> 3. Powers real-time offline sync protocols.
> 
---



## 6. Related Terms
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`LIVE SELECT`](../level_09/live_select.md) — Real-time event streams.

---

## 7. Key Takeaways
- `SHOW CHANGES FOR TABLE` queries the table's Change Data Capture (CDC) log.
- Relational equivalent to logical replication slots; NoSQL equivalent to Change Streams.
- Returns a chronological JSON list of mutations (action types, timestamps, data).
- Change feeds are disabled by default and must be configured on the table schema.
- Retain change histories by declaring durations (e.g. `CHANGEFEED 7d`).
- Query changes since a specific timestamp using the `SINCE` clause.
- Essential for synchronization engines, data audits, and cache invalidation.
