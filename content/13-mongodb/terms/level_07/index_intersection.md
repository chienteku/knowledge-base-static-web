# Index Intersection

> **Level 7 — Indexes & Query Performance**
> The database execution strategy where MongoDB combines the results of multiple single-field indexes in parallel to satisfy a query filter, serving as a fallback mechanism that is significantly slower than a dedicated compound index.

---

## 1. Prerequisites

- [Compound Index](compound_index.md) — The optimal multi-field index.
- [`explain()` Method](explain.md) — Verifying execution plan stages.

---

## 2. Term Category

**Index / Performance** (Multi-Index Query Optimization): Index Intersection allows MongoDB to intersect index keys from two separate single-field indexes (AND_SORTED / AND_HASH) to satisfy multi-field query filters.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Calculated automatically by the query optimizer. Combines index scans in memory using internal `AND_SORTED` or `AND_HASH` execution stages).

### (1) Design Motivation — "Why did we design this?"
In database schema design, you cannot always predict every combination of search queries. 

If you have a collection and create two separate single-field indexes:
-   `db.users.createIndex({ brand: 1 })`
-   `db.users.createIndex({ color: 1 })`

If a user searches: `db.users.find({ brand: "Nike", color: "red" })`

Historically, the query planner had to choose one index (e.g. `brand`), locate all `"Nike"` documents, load them from disk into RAM, and then filter them by `"red"` manually. 

To optimize this without forcing developers to build every possible compound index, MongoDB introduced **Index Intersection**. 

The database engine scans both single-field indexes in parallel, matches the overlapping document pointers (ObjectIds) in memory, and then fetches only the intersected documents from disk.

---

### (2) The Performance Bottleneck
While Index Intersection is smarter than a full collection scan, **it is significantly slower and more resource-intensive than a proper Compound Index.**

-   **Index Intersection Overhead:** Requires scanning two separate B-Tree structures, sorting/hashing the document identifiers in RAM, and then fetching documents from disk.
-   **Compound Index Performance:** Jumps directly to a single, contiguous block inside a single B-Tree, requiring a single lookup and zero in-memory matching.

Therefore, you should never rely on index intersection as a primary optimization strategy.

---

### (3) Reality Metaphor (Comparing Registry Lists)
Imagine looking up student folders in a school archive:
-   **Compound Index:** A single master ledger sorted by **`[Last Name, First Name]`**. You find `"Smith, John"` instantly in one look.
-   **Index Intersection:** You have two separate ledgers: **Ledger A (sorted by First Name)** and **Ledger B (sorted by Last Name)**.
    -   You look up `"John"` in Ledger A, writing down a list of student IDs: `[101, 204, 305]`.
    -   You look up `"Smith"` in Ledger B, writing down a list of student IDs: `[204, 305, 410]`.
    -   You compare the lists on your desk, identifying the overlapping IDs: `[204, 305]`.
    -   You fetch folders 204 and 305.
    -   It worked, but it required two manual list searches and a comparison step.

---

### (4) Code Examples

#### Identifying Index Intersection in Explain Plans
If MongoDB decides to use index intersection, the explain output will show an `AND_SORTED` or `AND_HASH` stage:

```javascript
// Query:
db.products.find({ category: "shoes", status: "clearance" }).explain("executionStats");

// Output Plan Snippet:
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "FETCH",
      "inputStage": {
        "stage": "AND_SORTED", // Indicates Index Intersection!
        "inputStages": [
          {
            "stage": "IXSCAN",
            "indexName": "category_1"
          },
          {
            "stage": "IXSCAN",
            "indexName": "status_1"
          }
        ]
      }
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on index intersection to satisfy complex multi-field queries instead of creating proper compound indexes

**The mistake:** Assuming that because you have indexed `age` and `country` separately, a query filtering on both will run at maximum speed under heavy user traffic.

**Why it's wrong:** Under high concurrent database read volume, the CPU overhead of matching lists in memory for index intersection degrades database response times, causing API queues to back up.

**Fix: Build a dedicated compound index `{ country: 1, age: 1 }` to optimize multi-field search routes directly.**

---





### Mistake 2: Relying on Index Intersection Instead of Creating Targeted Compound Indexes

**The mistake:** Creating two single-field indexes `{ status: 1 }` and `{ age: 1 }` expecting optimal index performance for `.find({ status: 'active', age: 25 })`.

**Why it's wrong:** Index Intersection intersects keys from two separate B-Trees at runtime, incurring overhead compared to a single dedicated compound index `{ status: 1, age: 1 }`.

*Incorrect:*
```javascript
db.users.createIndex({ status: 1 }); db.users.createIndex({ age: 1 }); // ❌ Sub-optimal index intersection!
```

*Fix:*
```javascript
db.users.createIndex({ status: 1, age: 1 }); // Optimal compound index
```



### Mistake 3: Expecting Index Intersection to Cover Sort Operations

**The mistake:** Expecting Index Intersection of `{ status: 1 }` and `{ createdAt: 1 }` to satisfy `.sort({ createdAt: -1 })` without in-memory sorting.

**Why it's wrong:** Index Intersection CANNOT satisfy sort order requirements across separate indexes. Compound indexes are required to cover sort operations.

*Incorrect:*
```javascript
// Expecting index intersection to cover sort order
```

*Fix:*
```javascript
Use compound index { status: 1, createdAt: -1 } for query and sort coverage
```



## 5. Practice Exercises

### Exercise 1: Index Intersection Execution with `AND_SORTED`

**Scenario:**
Query collection `orders` filtering by `status: "active"` and `customerId: ObjectId(...)`, where separate single-field indexes exist on `status` and `customerId`.

**Requirements:**
1. Inspect `explain()` output for `AND_SORTED` stage.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.createIndex({ status: 1 });
> db.orders.createIndex({ customerId: 1 });
> 
> const plan = db.orders.find({
>   status: "active",
>   customerId: new ObjectId("60c72b2f9b1d8b2c88888880")
> }).explain("executionStats");
> 
> console.log("Winning Plan Stage:", plan.executionStats.executionStages.winningPlan.stage);
> ```
>
> #### Technical Explanation
>
> 1. Index Intersection scans two separate single-field indexes in parallel and intersects matching record pointers (`AND_SORTED`).
> 2. Allows queries to combine multiple single-field indexes dynamically.
> 3. Provides flexible query filtering without creating every possible compound index.
> 
---

### Exercise 2: Comparing Index Intersection vs Compound Index Performance

**Scenario:**
Benchmark query execution speed of Index Intersection vs a dedicated Compound Index `{ status: 1, customerId: 1 }`.

**Requirements:**
1. Contrast `AND_SORTED` vs single `IXSCAN`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Performance Comparison:
> - Index Intersection (2 single indexes): Scans 2 B-trees -> Intersects pointers in RAM -> Fetches docs (Slower).
> - Dedicated Compound Index { status: 1, customerId: 1 }: Scans 1 B-tree directly -> Fetches docs (2x to 5x Faster!).
> ```
>
> #### Technical Explanation
>
> 1. Dedicated compound indexes are significantly faster than index intersection because they require scanning only one B-tree.
> 2. Prefer compound indexes for high-frequency critical application queries.
> 3. Index intersection is a fallback mechanism.
> 
---

### Exercise 3: Diagnosing Index Intersection Invalidation

**Scenario:**
Explain why queries requiring sort orders cannot be satisfied via index intersection alone.

**Requirements:**
1. Explain why `sort()` forces dedicated compound indexes.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Sort Limitation:
> Intersected index pointers lose their pre-sorted B-tree order.
> Queries requiring sorted outputs MUST use a dedicated compound index matching the requested sort order.
> ```
>
> #### Technical Explanation
>
> 1. Intersecting pointers from two indexes destroys B-tree key sort ordering.
> 2. Forces an in-memory `SORT` stage if sort order is requested.
> 3. Always create compound indexes for queries combining filtering and sorting.
> 
---



## 6. Related Terms

- [Compound Index](compound_index.md) — The optimal multi-field index.
- [`explain()` Method](explain.md) — The plan analyzer.

---

## 7. Key Takeaways
- Index Intersection combines multiple single-field indexes to satisfy queries.
- Indicated by the `AND_SORTED` or `AND_HASH` stages in explain plans.
- Serves as a database engine fallback, not an optimal design goal.
- Significantly slower than a single compound index due to CPU matching overhead.
- Requires scanning multiple B-Tree indexes in parallel.
- Do not omit compound indexes assuming single-field intersection is sufficient.
- Consumes more memory cache to track matching document lists during execution.
