# Index Selectivity & Cardinality

> **Level 7 — Indexes & Query Performance**
> The database optimization principles governing index effectiveness, comparing Cardinality (the count of unique values in a field) with Selectivity (the ability of an index to narrow down query search scopes to a minimal subset of documents).

---

## 1. Prerequisites

- [Index (Concept in MongoDB)](index_concept.md) — The B-Tree structure.

---

## 2. Term Category

**Index / Performance** (Index Cardinality & Filtering Efficiency): Index Selectivity measures an index's capability to narrow down target candidate documents, with high selectivity fields drastically reducing disk IOPS.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Core optimization science across all relational SQL and NoSQL engines. Used by the Cost-Based Query Planner to decide whether to run index scans or fall back to collection scans).

### (1) Design Motivation — "Why did we design this?"
Developers designing database indexes often assume that if a field is used in a query filter, it should be indexed:
-   *"I filter users by `status` (active/inactive), so I should index the `status` field."*
-   *"I filter users by `gender`, so I should index `gender`."*

However, when they run these queries, they find the database is still slow, and the execution logs show that the database is ignoring their indexes and running **Collection Scans** anyway.

To understand why this happens, we must study **Cardinality** and **Selectivity**. 

If a query index matches 50% of the database, scanning the index B-Tree *plus* reading the physical documents from disk is actually **more expensive** than simply reading the collection sequentially from start to finish. 

The database query optimizer analyzes statistics and rejects low-selectivity indexes to save time.

---

### (2) Cardinality vs. Selectivity

#### 1. Cardinality (Unique Value Count)
Refers to the number of unique values stored in a specific field across a collection:
-   **High Cardinality:** A field where almost every document has a unique value (e.g. `email`, `social_security_number`, `username`).
-   **Low Cardinality:** A field with very few unique values (e.g. `gender` (2 values), `status` (3 values), `is_verified` (2 values)).

#### 2. Selectivity (Search Space Reduction)
Measures the percentage of the collection documents returned by a typical query on that field:

$$\text{Selectivity} = \frac{\text{Number of Matching Documents}}{\text{Total Documents in Collection}}$$

-   **High Selectivity (Close to 0%):** The query filter narrows the search down to a tiny fraction of the database (e.g. searching by `email` returns $\approx 1$ document out of 10 million). **This is the ideal target for an index.**
-   **Low Selectivity (Close to 100%):** The query filter returns a massive chunk of the database (e.g. searching for `status: "active"` returns 8 million documents out of 10 million). **An index on this field is useless.**

---

### (3) Reality Metaphor (Library Card Catalogs)
Imagine searching for books in a library:
-   **High Selectivity (ISBN):** You search by the book's unique **ISBN Number**. The card catalog index points you to **exactly one book** on Shelf 4. You walk directly to that shelf. (Fast, efficient index use).
-   **Low Selectivity (Language):** You search for books written in **"English"** in a London library where 95% of books are in English. 
    -   The card catalog index matches 95% of books. 
    -   Using the index card dividers doesn't save you any walking; you still have to search almost every shelf in the building. 
    -   It is faster to just walk down the aisles directly.

---

### (4) Cardinality and Index Suitability Table

| Field Example | Cardinality Class | Selectivity Quality | Index Suitability |
| :--- | :--- | :--- | :--- |
| `_id` / `email` | **High Cardinality** | **High Selectivity** (1 document). | **Excellent** (Always index). |
| `created_at` | **High Cardinality** | **High Selectivity** (small date ranges). | **Excellent** (Ideal for sorting/ranges). |
| `category` | Medium Cardinality | Medium Selectivity (e.g., 5% of catalog). | Good (helpful when combined in compound indexes). |
| `status` / `active` | **Low Cardinality** | **Low Selectivity** (50%–90% of collection). | **Poor** (Never index alone; waste of RAM). |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating single-field indexes on low-cardinality boolean or status enum fields

**The mistake:** Building an index on the `is_active` boolean field of a `users` collection, thinking it will speed up user lookups.

**Why it's wrong:** Since `is_active` can only be `true` or `false`:
-   A query matching `is_active: true` will return roughly half the collection.
-   MongoDB's query planner will recognize the low selectivity, ignore the index, and execute a full collection scan instead.
-   The index remains on disk, consuming RAM cache and slowing down writes for no benefit.

**Fix: Do not index low-cardinality fields by themselves. If you frequently filter by `status` alongside other fields, combine it into a Compound Index where the first field has high cardinality: `{ email: 1, status: 1 }`.**

---





### Mistake 2: Creating Single-Field Indexes on Low Selectivity Fields

**The mistake:** Creating an index on `isVerified: 1` where 95% of documents have `isVerified: true`.

**Why it's wrong:** Low selectivity fields match large portions of the collection, offering minimal query acceleration while consuming write overhead. Index high-selectivity fields.

*Incorrect:*
```javascript
db.users.createIndex({ isVerified: 1 }); // ❌ Low selectivity index!
```

*Fix:*
```javascript
Index high selectivity unique fields like email or userId
```



### Mistake 3: Placing Low Selectivity Fields First in Compound Indexes

**The mistake:** Creating compound index `{ gender: 1, email: 1 }`.

**Why it's wrong:** Placing low-selectivity fields first reduces early index filtering efficiency. Place high-selectivity fields first unless ESR rule dictates otherwise.

*Incorrect:*
```javascript
db.users.createIndex({ gender: 1, email: 1 });
```

*Fix:*
```javascript
db.users.createIndex({ email: 1, gender: 1 });
```



## 5. Practice Exercises

### Exercise 1: High vs Low Cardinality Field Indexing

**Scenario:**
Compare index selectivity for high-cardinality `email` vs low-cardinality `gender` fields.

**Requirements:**
1. Explain why indexing `email` is high-selectivity and `gender` is low-selectivity.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Index Selectivity Comparison:
> - High Selectivity (email): 1,000,000 unique emails for 1,000,000 users. Querying 1 email isolates 0.0001% of collection -> Fast $O(\log N)$ lookup!
> - Low Selectivity (gender): 2 unique values for 1,000,000 users. Querying 1 value matches 50% of collection -> Scanning index is useless!
> ```
>
> #### Technical Explanation
>
> 1. Index Selectivity measures the proportion of collection documents eliminated by an index filter.
> 2. High-cardinality unique fields isolate tiny candidate sets instantly.
> 3. Low-cardinality fields should NOT be indexed alone; combine in compound indexes.

---

### Exercise 2: Building Compound Indexes for Low-Cardinality Fields

**Scenario:**
Optimize queries filtering by low-cardinality `status` and high-cardinality `createdAt` using compound indexing.

**Requirements:**
1. Create compound index `{ status: 1, createdAt: -1 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.createIndex({ status: 1, createdAt: -1 });
> ```
>
> #### Technical Explanation
>
> 1. Combining a low-cardinality field (`status`) with a high-cardinality field (`createdAt`) produces a highly selective compound index.
> 2. Narrows candidate set to active status, then immediately isolates date ranges.
> 3. Standard compound indexing strategy.

---

### Exercise 3: Measuring Selectivity Ratios with `explain()`

**Scenario:**
Calculate the Selectivity Ratio (`nReturned / totalDocsExamined`) in `explain()` diagnostics.

**Requirements:**
1. Compute Selectivity Ratio formula.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.users.find({ status: "active" }).explain("executionStats");
> const stats = plan.executionStats;
> const selectivityRatio = (stats.nReturned / stats.totalDocsExamined).toFixed(4);
> 
> console.log(`Selectivity Ratio: ${selectivityRatio} (Target: 1.0)`);
> ```
>
> #### Technical Explanation
>
> 1. A Selectivity Ratio close to 1.0 indicates perfect index filtering (zero unneeded document reads).
> 2. Low ratios (< 0.1) indicate poor selectivity, scanning 10x more documents than returned.
> 3. Key metric for evaluating index health.

---



## 6. Related Terms

- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree structure.
- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The query planner choices.
- [The ESR Rule (Equality, Sort, Range)](esr_rule.md) — Related concept: The ESR Rule (Equality, Sort, Range).

---

## 7. Key Takeaways
- Cardinality measures the count of unique values in a field.
- Selectivity measures how effectively a filter narrows the document search space.
- Highly selective queries return a tiny fraction of the collection (ideal).
- Low selectivity queries return a large percentage of the collection (poor).
- The query planner ignores indexes that exhibit low selectivity.
- Only build indexes on high-cardinality fields (like emails or dates).
- Never index low-cardinality fields (like booleans) as single-field indexes.
- Combine low-cardinality fields into compound indexes to improve search bounds.
