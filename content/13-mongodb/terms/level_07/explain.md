# `explain()` Method

> **Level 7 — Indexes & Query Performance**
> The database diagnostic method that reveals query execution plans and performance statistics, serving as the direct equivalent of PostgreSQL's `EXPLAIN ANALYZE` command.

---

## 1. Prerequisites
- [Index (Concept in MongoDB)](index_concept.md) — The B-Tree structures analyzed.
- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The execution stages identified.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Executed on the query planner engine. Analyzes query structures to generate JSON diagnostic reports).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When an application query runs slowly in production, developers need a way to look inside the database engine:
-   *"Is this query utilizing our compound index?"*
-   *"How many documents did it read from disk to return 5 results?"*
-   *"How long (in milliseconds) did the scan take?"*

In PostgreSQL, you diagnose this using:
`EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@mail.com';`

We designed the **`explain()`** method in MongoDB to provide these diagnostics. 

By prepending or appending `explain()` to your queries, MongoDB returns a detailed JSON document detailing the search strategy, index usage, and processing statistics, allowing you to troubleshoot slow queries.

---

### (2) The Three Diagnostic Modes
You pass a mode string to `explain()` to control the level of detail returned:

1.  **`"queryPlanner"` (Default):** Runs the query planner to show the winning search strategy (e.g. `IXSCAN` or `COLLSCAN`) **without actually running the query**. (Safe to run on production databases since it is instant).
2.  **`"executionStats"` (Highly Recommended):** Runs the query and returns real execution metrics, including execution time and document scan counts.
3.  **`"allPlansExecution"`:** Runs the query and lists statistics for all candidate index strategies evaluated by the optimizer.

---

### (3) Key Metrics to Audit

-   **`winningPlan.stage`:** The winning search method:
    -   `COLLSCAN`: Collection Scan (slow, reads every document on disk).
    -   `IXSCAN`: Index Scan (fast, searches the B-Tree index).
    -   `FETCH`: Reading the actual documents from disk after an index match.
-   **`nReturned`:** The number of documents returned to the client.
-   **`totalKeysExamined`:** The number of index keys scanned.
-   **`totalDocsExamined`:** The number of physical documents read from disk.
-   **The Ideal Ratio:** In a perfectly optimized query, `nReturned == totalKeysExamined == totalDocsExamined`. If `totalDocsExamined` is much larger than `nReturned`, the index is not selective enough.

---

### (4) Reality Metaphor (Car Diagnostics)
Imagine driving a car that is making a strange noise:
-   **Without Diagnostics:** Guessing which spark plug is broken by listening to the hood.
-   **With `explain()`:** Plugging an **OBD-II Diagnostic Scanner** into the dashboard. 
    -   The screen displays: *"Cylinder 3 misfire, spark plug voltage 12V (low), temperature 180°C."* 
    -   You know exactly which wire to replace.

---

### (5) Code Examples

#### Diagnosing a Query Plan
Let's analyze a score lookup:

```javascript
db.players.find({ score: { $gte: 90 } }).explain("executionStats");

// Output Snippet (JSON):
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "FETCH", // Reading documents from disk
      "inputStage": {
        "stage": "IXSCAN", // Step 1: scan the index!
        "indexName": "score_1"
      }
    }
  },
  "executionStats": {
    "executionTimeMillis": 2, // Query took 2 milliseconds
    "nReturned": 5,           // Returned 5 matching records
    "totalKeysExamined": 5,   // Checked 5 index keys
    "totalDocsExamined": 5    // Read 5 documents from disk (Perfect ratio!)
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Calling explain() without arguments and expecting to see execution times or document scan counts

**The mistake:** Running `db.users.find({ age: 30 }).explain()` to diagnose how many documents were read, and getting a report that is missing the `executionStats` block entirely.

**Why it's wrong:** By default, `explain()` defaults to `"queryPlanner"` mode. 

This mode only outputs the plan *strategy* (how it plans to run the query), without executing the query, so it cannot calculate execution times or document scan counts.

**Fix: Always pass the `"executionStats"` argument to gather real performance metrics: `.explain("executionStats")`.**

---



### Mistake 2: Using Default `queryPlanner` Mode in `explain()` When Execution Timing Details Are Needed

**The mistake:** Running `db.users.find({ ... }).explain()` without parameters to measure actual execution time.

**Why it's wrong:** Default `explain()` runs in `queryPlanner` mode, returning selected plan metadata without executing the query! Pass `"executionStats"` or `"allPlansExecution"` to measure actual runtime execution stats.

*Incorrect:*
```javascript
db.users.find({ age: 25 }).explain(); // ❌ Returns planner metadata only!
```

*Fix:*
```javascript
db.users.find({ age: 25 }).explain("executionStats"); // Returns actual execution timing stats
```

### Mistake 3: Ignoring In-Memory `SORT` Stages in Explain Execution Outputs

**The mistake:** Ignoring execution stage `SORT` in `explain("executionStats")` outputs.

**Why it's wrong:** An explicit `SORT` stage indicates that the query engine sorted results in RAM because index sorting was unavailable, creating memory and latency overhead.

*Incorrect:*
```javascript
// Ignoring presence of SORT stage in explain output
```

*Fix:*
```javascript
Optimize compound index to cover sort order and eliminate in-memory SORT stage
```



### Mistake 4: Using Default `queryPlanner` Mode in `explain()` When Execution Timing Details Are Needed

**The mistake:** Running `db.users.find({ ... }).explain()` without parameters to measure actual execution time.

**Why it's wrong:** Default `explain()` runs in `queryPlanner` mode, returning selected plan metadata without executing the query! Pass `"executionStats"` or `"allPlansExecution"` to measure actual runtime execution stats.

*Incorrect:*
```javascript
db.users.find({ age: 25 }).explain(); // ❌ Returns planner metadata only!
```

*Fix:*
```javascript
db.users.find({ age: 25 }).explain("executionStats"); // Returns actual execution timing stats
```

### Mistake 5: Ignoring In-Memory `SORT` Stages in Explain Execution Outputs

**The mistake:** Ignoring execution stage `SORT` in `explain("executionStats")` outputs.

**Why it's wrong:** An explicit `SORT` stage indicates that the query engine sorted results in RAM because index sorting was unavailable, creating memory and latency overhead.

*Incorrect:*
```javascript
// Ignoring presence of SORT stage in explain output
```

*Fix:*
```javascript
Optimize compound index to cover sort order and eliminate in-memory SORT stage
```

## 6. Practice Exercises

### Exercise 1: Plan Analysis

**Problem:** You run an explain plan on a query and get these stats:
-   `"stage": "COLLSCAN"`
-   `"nReturned": 10`
-   `"totalDocsExamined": 50000`
1.  Explain what these metrics mean.
2.  State the action required to fix the performance issue.

**Expected output:**
```text
1. The metrics indicate that MongoDB executed a full Collection Scan (`COLLSCAN`). To return just 10 matching documents, it had to read 50,000 documents from disk, indicating a highly unoptimized query.
2. Build an index on the fields used in the query filter to convert the search to an Index Scan (`IXSCAN`), reducing `totalDocsExamined` to 10.
```

> [!check]- Answer
> - Look at the search stage `COLLSCAN`.
> - Check the ratio of docs examined to docs returned.

---



### Exercise 2: Inspecting Query Execution Stats

**Problem:** Run explain query in `executionStats` mode for `db.users.find({ status: "active" })`.

**Expected output:**
```text
db.users.find({ status: "active" }).explain("executionStats");
```

> [!check]- Answer
> ```javascript
> db.users.find({ status: "active" }).explain("executionStats");
> ```
>
> **Explanation:** `explain("executionStats")` returns detailed execution metrics (`executionTimeMillis`, `totalKeysExamined`, `totalDocsExamined`).

### Exercise 3: Evaluating Index Efficiency Ratio

**Problem:** How to calculate query scan ratio from explain stats? (`totalDocsExamined / nReturned`).

**Expected output:**
```text
totalDocsExamined / nReturned
```

> [!check]- Answer
> ```text
> totalDocsExamined / nReturned
> ```
>
> **Explanation:** Ideal index scan ratio is 1 (or 0 for covered queries).



### Exercise 4: Inspecting Query Execution Stats

**Problem:** Run explain query in `executionStats` mode for `db.users.find({ status: "active" })`.

**Expected output:**
```text
db.users.find({ status: "active" }).explain("executionStats");
```

> [!check]- Answer
> ```javascript
> db.users.find({ status: "active" }).explain("executionStats");
> ```
>
> **Explanation:** `explain("executionStats")` returns detailed execution metrics (`executionTimeMillis`, `totalKeysExamined`, `totalDocsExamined`).

### Exercise 5: Evaluating Index Efficiency Ratio

**Problem:** How to calculate query scan ratio from explain stats? (`totalDocsExamined / nReturned`).

**Expected output:**
```text
totalDocsExamined / nReturned
```

> [!check]- Answer
> ```text
> totalDocsExamined / nReturned
> ```
>
> **Explanation:** Ideal index scan ratio is 1 (or 0 for covered queries).

## 7. Related Terms
- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The scan types.
- [Covered Query](covered_query.md) — The optimal index scan.

---

## 8. Key Takeaways
- `explain()` returns query execution plans and performance metrics.
- Direct NoSQL equivalent to SQL's `EXPLAIN ANALYZE` command.
- `"queryPlanner"` mode returns index strategies without running queries.
- `"executionStats"` mode executes queries to collect runtimes and scan counts.
- `IXSCAN` indicates index use; `COLLSCAN` indicates slow collection scans.
- Audit `totalDocsExamined` vs `nReturned` to measure index selectivity.
- Pass `"executionStats"` explicitly to get execution statistics.
