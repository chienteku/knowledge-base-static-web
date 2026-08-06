# Covered Query

> **Level 7 — Indexes & Query Performance**
> The optimal database query state where the index itself contains all the fields requested by both the query filter and the projection, allowing MongoDB to return results directly from RAM without reading the documents on disk.

---

## 1. Prerequisites

- [`explain()` Method](explain.md) — Verifying execution plan stages.
- [Projection](../level_03/projection.md) — Limiting returned fields.

---

## 2. Term Category

**Index / Performance** (Zero-Fetch Index-Only Query): A Covered Query is a query satisfied entirely from B-tree index key entries without reading underlying raw documents from storage disk (stage: IXSCAN, totalDocsExamined: 0).



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across all relational SQL (Index-Only Scan) and NoSQL engines. Maximizes memory efficiency by eliminating disk read latency).

### (1) Design Motivation — "Why did we design this?"
In a typical index query:
1.  MongoDB searches the B-Tree index in memory (`IXSCAN` stage).
2.  It locates the matched index keys.
3.  It follows the pointers to the physical files on disk to load the actual documents (`FETCH` stage).
4.  It extracts the requested fields and returns them to the client.

While this is fast, the `FETCH` stage (disk read) is still the slowest step in the query loop.

Can we design a query that **never reads the documents on disk at all**?

Yes. We designed **Covered Queries** to achieve this. 

If you write a query where all the fields in the filter **and** projection are already stored inside the index B-Tree, MongoDB returns the results directly from the index in RAM. 

It skips the `FETCH` stage entirely (`totalDocsExamined` is `0`), resulting in the fastest possible database query.

---

### (2) The Rules of a Covered Query
To achieve a covered query, you must meet three strict conditions:

1.  **Index Coverage:** All fields queried in the filter (e.g. `$match`) must be part of the index.
2.  **Projection Coverage:** All fields returned in the projection must be part of the index.
3.  **`_id` Exclusion:** You **must** explicitly exclude the `_id` field in the projection (`{ _id: 0 }`), unless `_id` is part of the index itself. If you forget this, MongoDB is forced to fetch the document from disk just to retrieve the `_id` value.

---

### (3) Reality Metaphor (Locker Room Logs)
Imagine looking up employee details:
-   **Standard Index Query (Fetch):** You have a clipboard log matching employee names to their locker numbers. Someone asks: *"What is Alice's home address?"* You search your log, see Alice is assigned to locker 5, walk across the room, open locker 5, pull out her paper file, and read the address. (Search + Fetch).
-   **Covered Query (No Fetch):** Someone asks: *"What is Alice's locker number?"* 
    -   You look at your clipboard log, see Alice is locker 5, and tell them immediately. 
    -   You never had to walk across the room or open a locker because the information was already written on your clipboard.

---

### (4) Code Examples

#### Creating a Covered Query
Let's optimize a username check:

```javascript
// 1. Create a compound index
db.users.createIndex({ username: 1, status: 1 });

// 2. Run the query with projection and _id exclusion
db.users.find(
  { username: "alice" },            // Filter uses index key
  { username: 1, status: 1, _id: 0 } // Projection whitelists index keys, excludes _id!
).explain("executionStats");

// Output Stats Snippet:
{
  "executionStats": {
    "nReturned": 1,
    "totalKeysExamined": 1,
    "totalDocsExamined": 0, // CRITICAL: Zero documents read from disk!
    "executionStages": {
      "stage": "PROJECTION_COVERED", // Success! No FETCH stage exists
      "inputStage": {
        "stage": "IXSCAN",
        "indexName": "username_1_status_1"
      }
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to exclude '_id: 0' in the query projection, preventing the query from being covered by the index

**The mistake:** Running the query `db.users.find({ username: "alice" }, { username: 1, status: 1 })` expecting a covered query scan.

**Why it's wrong:** Even though `username` and `status` are in the index, MongoDB's projection default includes the `_id` field. 

To return the `_id` value, the database must execute a `FETCH` stage, reading the full document from disk and slowing down the query.

**Fix: Always append `_id: 0` to your projection query parameters to ensure the query is fully covered:**

```javascript
// CORRECT
db.users.find({ username: "alice" }, { username: 1, status: 1, _id: 0 });
```

---





### Mistake 2: Failing to Exclude `_id` in Covered Queries Returning Projected Fields

**The mistake:** Querying `db.users.find({ status: 'active' }, { name: 1 })` expecting a covered query using index `{ status: 1, name: 1 }`.

**Why it's wrong:** By default, queries return `_id`. If `_id` is NOT part of the compound index, `mongod` must fetch the document on disk to read `_id`, turning off covered query mode. Exclude `_id: 0` in projection.

*Incorrect:*
```javascript
db.users.find({ status: "active" }, { name: 1 }); // Fetches disk for _id!
```

*Fix:*
```javascript
db.users.find({ status: "active" }, { name: 1, _id: 0 }); // Fully covered query
```



### Mistake 3: Expecting Covered Queries on Array Fields (Multikey Indexes)

**The mistake:** Expecting covered queries on index `{ tags: 1 }` where `tags` is an array field.

**Why it's wrong:** Multikey indexes on array fields CANNOT cover queries because array elements require document inspection for accurate bounds.

*Incorrect:*
```javascript
// Expecting covered query on array index
```

*Fix:*
```javascript
Covered queries require scalar (non-array) indexed fields
```



## 5. Practice Exercises

### Exercise 1: Achieving Covered Query Execution

**Scenario:**
Construct a covered query on collection `users` using compound index `{ email: 1, name: 1 }` returning ONLY `name` (excluding `_id`).

**Requirements:**
1. Execute `find({ email: ... }, { name: 1, _id: 0 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex({ email: 1, name: 1 });
> 
> db.users.find(
>   { email: "alice@example.com" },
>   { name: 1, _id: 0 }
> );
> ```
>
> #### Technical Explanation
>
> 1. A query is covered when ALL requested fields in filter and projection exist inside the B-tree index.
> 2. `_id: 0` is required unless `_id` is explicitly part of the index pattern.
> 3. Server reads zero document pages from disk (`totalDocsExamined: 0`).
> 
---

### Exercise 2: Inspecting Covered Query Diagnostics in `explain()`

**Scenario:**
Verify covered query status by inspecting `totalDocsExamined` in `explain("executionStats")`.

**Requirements:**
1. Inspect `plan.executionStats.totalDocsExamined`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.users.find(
>   { email: "alice@example.com" },
>   { name: 1, _id: 0 }
> ).explain("executionStats");
> 
> console.log("Total Keys Examined:", plan.executionStats.totalKeysExamined);
> console.log("Total Docs Examined:", plan.executionStats.totalDocsExamined);
> ```
>
> #### Technical Explanation
>
> 1. Covered queries report `totalDocsExamined: 0`.
> 2. `totalKeysExamined` > 0 indicates B-tree index keys were read.
> 3. Maximum possible read performance optimization.
> 
---

### Exercise 3: Identifying Non-Covered Query Invalidation Reasons

**Scenario:**
Explain why including `profilePic` in projection invalidates covered query status.

**Requirements:**
1. Contrast covered vs non-covered projection fields.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Covered Query Invalidation Rules:
> 1. Projecting un-indexed fields (e.g. 'profilePic') forces WiredTiger to fetch raw documents from disk (totalDocsExamined > 0).
> 2. Querying array fields (multikey indexes) cannot produce covered queries.
> ```
>
> #### Technical Explanation
>
> 1. If any requested field is missing from index keys, MongoDB must fetch the full document payload from disk storage.
> 2. Multikey indexes on arrays store separate index keys, preventing covered query execution.
> 3. Design covered indexes for high-frequency lightweight lookups.
> 
---



## 6. Related Terms

- [`explain()` Method](explain.md) — The plan analyzer.
- [Compound Index](compound_index.md) — The target multi-key index.

---

## 7. Key Takeaways
- A Covered Query retrieves data entirely from the RAM index B-Tree.
- Eliminates the `FETCH` stage; `totalDocsExamined` is exactly `0`.
- Direct equivalent to an Index-Only Scan in relational SQL databases.
- The fastest query execution path since it avoids physical disk access.
- Requires all queried and projected fields to be present in the index.
- You must explicitly exclude `_id: 0` in the projection to prevent disk fetches.
- Highly effective for high-throughput metadata and validation queries.
