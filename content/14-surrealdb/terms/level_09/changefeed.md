# Changefeed (`DEFINE TABLE ... CHANGEFEED`)

> **Level 9 — Real-Time Features, Events & Functions**
> A table-level setting in SurrealDB that records all historical data changes (creates, updates, deletes) over a configurable time retention window for audit logging and event sourcing.

---

## 1. Prerequisites

- [`DEFINE TABLE`](../level_04/define_table.md) — Table definition context.
- [`LIVE SELECT` (Live Queries)](live_select.md) — Real-time live subscriptions vs historical change feeds.

---

## 2. Term Category


**Advanced Feature (table level mutation changefeed stream)**: - **Data Persistence & Audit**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional databases, tracking historical record changes requires building complex custom trigger systems, audit log tables, or setting up external CDC (Change Data Capture) pipelines like Debezium or Kafka.

SurrealDB builds change tracking natively into tables via the `CHANGEFEED` modifier on `DEFINE TABLE`. When enabled (e.g. `DEFINE TABLE user CHANGEFEED 7d`), SurrealDB logs every transaction delta for that table and retains the history for the specified duration (e.g. 7 days). This allows client applications, backup systems, and audit microservices to query historical change logs, catch up after network disconnections, or build event-sourced architectures without custom audit tables.

### (2) Reality Metaphor
Think of git commit history:
- **Standard Table**: Showing only the current state of files in your working directory.
- **Table with `CHANGEFEED 7d`**: Running `git log` to inspect every individual commit, edit, and deletion made over the past 7 days.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Enable a 7-day change retention feed on the 'orders' table
DEFINE TABLE orders SCHEMAFULL CHANGEFEED 7d;
```

#### Fuller Example
```surrealql
-- 1. Define table with 30-day changefeed retention
DEFINE TABLE financial_ledger SCHEMAFULL CHANGEFEED 30d;

DEFINE FIELD account_id ON financial_ledger TYPE record<account>;
DEFINE FIELD amount ON financial_ledger TYPE decimal;
DEFINE FIELD timestamp ON financial_ledger TYPE datetime DEFAULT time::now();

-- 2. Inspect table schema and changefeed configuration
INFO FOR TABLE financial_ledger;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting Unreasonably Long Changefeed Retention on High-Write Tables

**The mistake:** Configuring `CHANGEFEED 365d` or `CHANGEFEED 10y` on tables processing millions of writes per day.

**Why it's wrong:** Retaining changefeed data consumes storage disk space. Extremely long retention periods on high-frequency write tables can exhaust server storage.

*Incorrect:*
```surrealql
-- Unlimited change storage on high-frequency log table!
DEFINE TABLE sensor_data CHANGEFEED 365d;
```

*Fix:*
```surrealql
-- Use shorter retention for operational changefeeds, or export to archival storage
DEFINE TABLE sensor_data CHANGEFEED 24h;
```

---



### Mistake 2: Executing `SHOW CHANGES` on Tables Without `CHANGEFEED` Definitions

**The mistake:** Running `SHOW CHANGES FOR TABLE user SINCE 1;` when `CHANGEFEED` was never defined on `user`.

**Why it's wrong:** Change feeds must be explicitly enabled using `DEFINE TABLE user CHANGEFEED 7d;` before change history can be recorded or queried.

*Incorrect:*
```surrealql
SHOW CHANGES FOR TABLE user SINCE 1; // ❌ Fails if CHANGEFEED is disabled!
```

*Fix:*
```surrealql
DEFINE TABLE user CHANGEFEED 7d;
SHOW CHANGES FOR TABLE user SINCE d"2026-01-01T00:00:00Z";
```

### Mistake 3: Configuring Insufficient Changefeed Retention Windows for High-Volume Systems

**The mistake:** Setting `CHANGEFEED 1h` when sync consumers poll every 6 hours.

**Why it's wrong:** Data mutations older than the retention window (`1h`) are pruned, causing consumers to miss historical sync changes. Align retention duration with consumer polling intervals.

*Incorrect:*
```surrealql
DEFINE TABLE log CHANGEFEED 1h; // ❌ Pruned before 6h sync run!
```

*Fix:*
```surrealql
DEFINE TABLE log CHANGEFEED 24h; // Sufficient retention window
```





## 5. Practice Exercises

### Exercise 1: Enabling Table Changefeeds with Retention

**Scenario:**
An event-driven microservice architecture requires real-time delta tracking for table `order` with a 7-day change history retention window.

**Requirements:**
1. Define table `order` in `SCHEMAFULL` mode.
2. Enable changefeed streaming with retention `7d`.

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
> 1. `CHANGEFEED <duration>` enables transaction log change tracking for table mutations.
> 2. `7d` retains mutation history deltas for 7 days before garbage collection.
> 3. Underpins real-time live query subscriptions and Change Data Capture (CDC) pipelines.
> 
---

### Exercise 2: Inspecting Historical Table Mutations with `SHOW CHANGES`

**Scenario:**
An audit service streams all mutation changes for table `order` recorded since a target timestamp `d"2026-08-01T00:00:00Z"`.

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
> 1. `SHOW CHANGES FOR TABLE` outputs an array of historical mutation events (`CREATE`, `UPDATE`, `DELETE`).
> 2. `SINCE` filters changes recorded after a specific timestamp or version sequence number.
> 3. Replaces external CDC tools (Debezium/Kafka) with native database change inspection.
> 
---

### Exercise 3: Changefeed Version Sequence Syncing

**Scenario:**
An offline sync client resumes streaming table changes starting from version sequence number `150`.

**Requirements:**
1. Execute `SHOW CHANGES FOR TABLE order SINCE 150`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SHOW CHANGES FOR TABLE order SINCE 150;
> ```
>
> #### Technical Explanation
>
> 1. Sequence numbers provide deterministic offsets for changefeed event consumption.
> 2. Guarantees exactly-once delta processing for disconnected clients.
> 3. Enables reliable offline-first database synchronization protocols.
> 
---





## 6. Related Terms

- [`SHOW CHANGES FOR TABLE ... SINCE ...`](show_changes.md) — Querying recorded changefeed logs.
- [`DEFINE EVENT`](define_event.md) — Real-time server-side triggers.
- [`LIVE SELECT` (Live Queries)](live_select.md) — Live push subscriptions vs changefeeds.

---

## 7. Key Takeaways
- `CHANGEFEED` logs historical creates, updates, and deletes at the table level.
- Retention is configured per table using duration strings (e.g. `1h`, `7d`, `30d`).
- Enables native audit logging, historical replay, and catch-up data synchronization.
