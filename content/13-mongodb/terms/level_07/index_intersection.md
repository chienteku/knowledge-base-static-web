# Index Intersection

> **Level 7 — Indexes & Query Performance**
> The database execution strategy where MongoDB combines the results of multiple single-field indexes in parallel to satisfy a query filter, serving as a fallback mechanism that is significantly slower than a dedicated compound index.

---

## 1. Prerequisites
- [Compound Index](compound_index.md) — The optimal multi-field index.
- [`explain()` Method](explain.md) — Verifying execution plan stages.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **MongoDB Core** (Calculated automatically by the query optimizer. Combines index scans in memory using internal `AND_SORTED` or `AND_HASH` execution stages).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Relying on Index Intersection Instead of Creating Targeted Compound Indexes

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

### Mistake 5: Expecting Index Intersection to Cover Sort Operations

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

## 6. Practice Exercises

### Exercise 1: Intersection Diagnostic

**Problem:** You run an explain plan on a query. The winning plan displays the stage `"AND_SORTED"`.
1.  Explain what this stage indicates.
2.  State how you can optimize this query plan.

**Expected output:**
> [!check]- Answer
> ```text
> 1. The `AND_SORTED` stage indicates that MongoDB is executing an Index Intersection, scanning two separate single-field indexes in parallel and merging their matched document pointers in memory.
> 2. Create a compound index containing both query fields to replace the parallel scans with a single, direct B-Tree lookup (IXSCAN).
> ```
> - Identify the meaning of the `AND_SORTED` query stage.
> - Recall the multi-key index replacement pattern.

---



### Exercise 2: Index Intersection Stage in Explain

**Problem:** Name the explain execution stage indicating index intersection (`AND_SORTED` or `AND_HASH`).

**Expected output:**
> [!check]- Answer
> ```text
> AND_SORTED or AND_HASH
> ```
> ```text
> AND_SORTED or AND_HASH
> ```
>
> **Explanation:** `AND_SORTED` stage intersects key streams from multiple single-field indexes.

---

### Exercise 3: Compound Index vs Index Intersection

**Problem:** Why is a compound index `{ a: 1, b: 1 }` faster than intersecting `{ a: 1 }` and `{ b: 1 }`? (Navigates a single B-Tree instead of intersecting key sets at runtime).

**Expected output:**
> [!check]- Answer
> ```text
> Navigates a single B-Tree without runtime key intersection overhead
> ```
> ```text
> Navigates a single B-Tree without runtime key intersection overhead
> ```
>
> **Explanation:** Compound indexes provide pre-sorted multi-field keys in a single B-Tree.

## 7. Related Terms
- [Compound Index](compound_index.md) — The optimal multi-field index.
- [`explain()` Method](explain.md) — The plan analyzer.

---

## 8. Key Takeaways
- Index Intersection combines multiple single-field indexes to satisfy queries.
- Indicated by the `AND_SORTED` or `AND_HASH` stages in explain plans.
- Serves as a database engine fallback, not an optimal design goal.
- Significantly slower than a single compound index due to CPU matching overhead.
- Requires scanning multiple B-Tree indexes in parallel.
- Do not omit compound indexes assuming single-field intersection is sufficient.
- Consumes more memory cache to track matching document lists during execution.
