# `explain()` Method

> **Level 7 — Indexes & Query Performance**
> The database diagnostic method that reveals query execution plans and performance statistics, serving as the direct equivalent of PostgreSQL's `EXPLAIN ANALYZE` command.

---

## 1. Prerequisites

- [Index (Concept in MongoDB)](index_concept.md) — The B-Tree structures analyzed.

---

## 2. Term Category

**Index / Performance** (Query Planner Diagnostic Tool): explain() inspects query execution plans, stage metrics (COLLSCAN vs IXSCAN), examine counts, and index usage details for query optimization.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed on the query planner engine. Analyzes query structures to generate JSON diagnostic reports).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Inspecting Query Execution Modes with `explain()`

**Scenario:**
Run `explain("executionStats")` on a query to inspect total docs examined, execution time, and index usage.

**Requirements:**
1. Call `.explain("executionStats")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.orders.find({
>   status: "pending"
> }).explain("executionStats");
> 
> console.log("Execution Time (ms):", plan.executionStats.executionTimeMillis);
> console.log("Total Keys Examined:", plan.executionStats.totalKeysExamined);
> console.log("Total Docs Examined:", plan.executionStats.totalDocsExamined);
> ```
>
> #### Technical Explanation
>
> 1. `explain("executionStats")` runs the query and returns real runtime performance statistics.
> 2. `executionTimeMillis` measures server-side query processing time.
> 3. `totalKeysExamined` vs `totalDocsExamined` indicates index efficiency.
> 
---

### Exercise 2: Analyzing Query Planner Stage Trees

**Scenario:**
Inspect `winningPlan` execution stages to identify whether a query utilized `IXSCAN`, `FETCH`, or `COLLSCAN`.

**Requirements:**
1. Drill into `winningPlan.stage` and `inputStage`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.orders.find({ customerId: new ObjectId() }).explain("queryPlanner");
> console.log("Winning Plan:", JSON.stringify(plan.queryPlanner.winningPlan, null, 2));
> ```
>
> #### Technical Explanation
>
> 1. `queryPlanner` mode returns the selected query execution tree without running the query.
> 2. Identifies selected index key patterns.
> 3. Fast diagnostic for query optimization without executing heavy queries.
> 
---

### Exercise 3: Comparing Query Candidate Plans with `allPlansExecution`

**Scenario:**
Run `explain("allPlansExecution")` to inspect candidate plans evaluated by the MongoDB query optimizer.

**Requirements:**
1. Inspect `executionStats.allPlansExecution`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.orders.find({ status: "active", total: { $gt: 100 } }).explain("allPlansExecution");
> console.log("Evaluated Candidate Plans:", plan.executionStats.allPlansExecution.length);
> ```
>
> #### Technical Explanation
>
> 1. `allPlansExecution` mode runs candidate query plans in parallel during trial periods to select the fastest plan.
> 2. Displays statistics for rejected candidate plans.
> 3. Helps debug query optimizer plan selection logic.
> 
---



## 6. Related Terms

- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The scan types.
- [Covered Query](covered_query.md) — The optimal index scan.
- [Index Intersection](index_intersection.md) — Related concept: Index Intersection.
- [MongoDB Profiler (`db.setProfilingLevel()`)](../level_10/profiler.md) — Related concept: MongoDB Profiler (`db.setProfilingLevel()`).
- [Index (Concept in MongoDB)](index_concept.md) — Related concept: Index (Concept in MongoDB).

---

## 7. Key Takeaways
- `explain()` returns query execution plans and performance metrics.
- Direct NoSQL equivalent to SQL's `EXPLAIN ANALYZE` command.
- `"queryPlanner"` mode returns index strategies without running queries.
- `"executionStats"` mode executes queries to collect runtimes and scan counts.
- `IXSCAN` indicates index use; `COLLSCAN` indicates slow collection scans.
- Audit `totalDocsExamined` vs `nReturned` to measure index selectivity.
- Pass `"executionStats"` explicitly to get execution statistics.
