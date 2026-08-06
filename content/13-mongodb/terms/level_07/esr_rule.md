# The ESR Rule (Equality, Sort, Range)

> **Level 7 — Indexes & Query Performance**
> The fundamental database design rule for ordering fields in a compound index to maximize efficiency: Equality fields first, followed by Sort fields, and Range fields last.

---

## 1. Prerequisites

- [Compound Index](compound_index.md) — Compound index structure.
- [Index Selectivity & Cardinality](index_selectivity.md) — Analyzing query selectivity.

---

## 2. Term Category

**Index / Performance** (Compound Index Key Ordering Standard): The ESR (Equality, Sort, Range) Rule defines the optimal field ordering when designing compound indexes: Equality fields first, Sort fields second, Range fields last.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across all B-Tree indexing engines, including PostgreSQL and MongoDB. Determines whether queries execute instant index sorts or fall back to expensive in-memory sorts).

### (1) Design Motivation — "Why did we design this?"
When designing a compound index (e.g. for a query that filters users by `status` and `age`, and sorts by `created_at`), the order of fields in the index key defines how MongoDB scans the B-Tree.

If you order the fields incorrectly (e.g. placing the range field before the sort field):
-   MongoDB must jump across different branches of the index B-Tree.
-   This breaks the sorted order of index keys, forcing the query engine to copy documents to memory and run an **In-Memory Sort**.
-   If the sorted data size exceeds **32 Megabytes**, the query crashes.

We designed **The ESR Rule** to solve this compound indexing problem. 

By ordering fields as **Equality $\rightarrow$ Sort $\rightarrow$ Range**, you ensure that matching documents are grouped, sorted, and filtered sequentially inside the B-Tree, avoiding in-memory sorting completely.

---

### (2) The ESR Components

```mermaid
graph LR
    E["E - Equality Matches First<br/>(status: 'active')"] --> S["S - Sort Fields Second<br/>(sort: { age: 1 })"]
    S --> R["R - Range Filters Last<br/>(price: { $gt: 10 })"]
```

1.  **Equality (E):** Fields queried with exact matches first (e.g. `{ status: "active" }` or `{ category: "shoes" }`). These group the B-Tree search space into a single contiguous block.
2.  **Sort (S):** Fields used in the query sort block second (e.g. `sort({ created_at: -1 })`). Within the contiguously grouped equality block, the index keys are already pre-sorted on this field, allowing MongoDB to read them sequentially.
3.  **Range (R):** Fields queried with range operators last (e.g. `{ price: { $gt: 10 } }` or `{ joined_at: { $lte: date } }`). These act as final filters on the pre-sorted stream.

---

### (3) Why placing Range before Sort breaks index sorting
If you order fields as `{ Equality, Range, Sort }`:
-   The range filter matches documents across multiple different values (e.g. prices from $11 to $100).
-   Inside the B-Tree, the index keys are sorted by price first, and then by sort keys.
-   This splits the sort keys across multiple price branches.
-   MongoDB cannot read them sequentially. It must gather the documents and sort them in memory.

---

### (4) Reality Metaphor (Filing Drawers)
Imagine sorting files in physical drawers:
-   **Equality (E):** You label the drawer: **"ACTIVE CUSTOMERS ONLY"** (groups files contiguously).
-   **Sort (S):** Inside that drawer, you arrange files by **Last Name alphabetically** (you can pull files in alphabetical order instantly).
-   **Range (R):** You check folder covers, pulling only those with a red clip saying **"Aged > 21"**. Since they are already alphabetical, the folders you pull are still sorted.
-   **Range before Sort:** You arrange folders by age first, then last name. To find all people aged > 21 sorted alphabetically, you must pull folders from 50 different age dividers, throw them in a pile on your desk, and sort them manually. (Slow, in-memory sort).

---

### (5) Code Examples

#### Applying the ESR Rule
Suppose your application executes this query:

```javascript
// Query:
db.products.find({
  category: "shoes",            // Equality (E)
  price: { $gte: 20, $lte: 50 } // Range (R)
}).sort({
  rating: -1                    // Sort (S)
});
```

Using the ESR Rule:
1.  **Equality** field: `category`
2.  **Sort** field: `rating`
3.  **Range** field: `price`

The optimal compound index order is:

```javascript
// CORRECT (Follows E -> S -> R)
db.products.createIndex({ category: 1, rating: -1, price: 1 });

// INCORRECT (E -> R -> S, forces in-memory sort!)
db.products.createIndex({ category: 1, price: 1, rating: -1 });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing a range field (like created_at or price) before the sort field in a compound index definition

**The mistake:** Creating the index `{ status: 1, created_at: 1, score: 1 }` to optimize a query that filters by `status` and `created_at` (range), and sorts by `score`.

**Why it's wrong:** Placing the range field `created_at` before the sort field `score` breaks B-Tree sorting order, forcing MongoDB to execute an in-memory sort. 

If the query returns a large dataset, it will exceed the 32MB sort limit and crash.

**Fix: Rearrange the index keys to place the sort field before the range field: `{ status: 1, score: 1, created_at: 1 }`.**

---





### Mistake 2: Ordering Compound Index Fields in Violation of the ESR (Equality, Sort, Range) Rule

**The mistake:** Creating index `{ createdAt: -1, status: 1 }` (Range before Equality) for query `.find({ status: 'active' }).sort({ createdAt: -1 })`.

**Why it's wrong:** Violating the ESR Rule (Equality -> Sort -> Range) forces the query engine to perform in-memory sorting or scan extraneous index keys. Place Equality fields first, followed by Sort fields, followed by Range fields.

*Incorrect:*
```javascript
db.orders.createIndex({ createdAt: -1, status: 1 }); // ❌ Range/Sort before Equality!
```

*Fix:*
```javascript
db.orders.createIndex({ status: 1, createdAt: -1 }); // Correct Equality -> Sort ESR order
```



### Mistake 3: Placing Range Fields Before Sort Fields in Compound Indexes

**The mistake:** Creating index `{ status: 1, age: 1, createdAt: -1 }` for query `.find({ status: 'active', age: { $gt: 18 } }).sort({ createdAt: -1 })`.

**Why it's wrong:** Placing Range field `age` before Sort field `createdAt` forces an in-memory `SORT` stage. Place Sort fields BEFORE Range fields: `{ status: 1, createdAt: -1, age: 1 }`.

*Incorrect:*
```javascript
db.users.createIndex({ status: 1, age: 1, createdAt: -1 }); // ❌ Range before Sort!
```

*Fix:*
```javascript
db.users.createIndex({ status: 1, createdAt: -1, age: 1 }); // ESR: Equality, Sort, Range
```



## 5. Practice Exercises

### Exercise 1: Applying the ESR (Equality, Sort, Range) Rule

**Scenario:**
Design an optimal compound index for a query with equality filter `status: "active"`, sort order `createdAt: -1`, and range filter `age: { $gte: 21 }`.

**Requirements:**
1. Apply ESR Rule: Equality (`status`), Sort (`createdAt`), Range (`age`).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ESR Key Order: Equality -> Sort -> Range
> db.users.createIndex({
>   status: 1,      // E - Equality
>   createdAt: -1,  // S - Sort
>   age: 1          // R - Range
> });
> ```
>
> #### Technical Explanation
>
> 1. Equality fields first: Narrows candidate document set to matching `status` values.
> 2. Sort fields second: Eliminates in-memory sorting by returning B-tree keys in requested `createdAt` order.
> 3. Range fields last: Filters numeric range bounds (`age >= 21`) without invalidating sort order.

---

### Exercise 2: Demonstrating In-Memory Sort Failures from Broken ESR Order

**Scenario:**
Demonstrate why placing Range fields BEFORE Sort fields in a compound index forces expensive in-memory sorts.

**Requirements:**
1. Contrast index `{ status: 1, age: 1, createdAt: -1 }` (broken ESR) vs `{ status: 1, createdAt: -1, age: 1 }` (valid ESR).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> ESR Violation Analysis:
> - Index { status: 1, age: 1, createdAt: -1 } (Range before Sort):
>   Scanning across range 'age' breaks B-tree ordering for 'createdAt' -> Forces in-memory SORT stage!
> - Index { status: 1, createdAt: -1, age: 1 } (Valid ESR):
>   Zero in-memory sort -> Streams pre-sorted B-tree keys directly.
> ```
>
> #### Technical Explanation
>
> 1. Range query bounds on a field cause subsequent index fields to lose their pre-sorted ordering.
> 2. Placing Sort fields BEFORE Range fields guarantees zero-RAM sorted streams.
> 3. Fundamental rule of high-performance index architecture.

---

### Exercise 3: Validating ESR Index Plans with `explain()`

**Scenario:**
Run `explain()` on a query using an ESR-compliant compound index to verify `winningPlan` omits `SORT` stage.

**Requirements:**
1. Inspect `executionStages.stage` in `explain()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.users.find({
>   status: "active",
>   age: { $gte: 21 }
> })
> .sort({ createdAt: -1 })
> .explain("executionStats");
> 
> console.log("Winning Plan Stage:", plan.executionStats.executionStages.winningPlan.stage);
> ```
>
> #### Technical Explanation
>
> 1. ESR-compliant indexes show `stage: "FETCH"` directly over `stage: "IXSCAN"`.
> 2. Confirms absence of expensive `stage: "SORT"` memory allocations.
> 3. Validates optimal index design.

---



## 6. Related Terms

- [Compound Index](compound_index.md) — The parent index type.
- [Index Selectivity & Cardinality](index_selectivity.md) — Index optimization rules.

---

## 7. Key Takeaways
- The ESR Rule dictates the optimal ordering of keys in a compound index.
- Sequence: **Equality (E) $\rightarrow$ Sort (S) $\rightarrow$ Range (R)**.
- Equality fields group matching documents contiguously in the B-Tree.
- Sort fields ensure index keys within the group are pre-sorted (prevents RAM sorts).
- Range fields filter the pre-sorted values last.
- Placing Range before Sort breaks index sorting, forcing expensive in-memory sorts.
- Prevent query crashes caused by exceeding the 32MB in-memory sort limit.
