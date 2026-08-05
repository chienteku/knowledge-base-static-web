# Index Selectivity & Cardinality

> **Level 7 — Indexes & Query Performance**
> The database optimization principles governing index effectiveness, comparing Cardinality (the count of unique values in a field) with Selectivity (the ability of an index to narrow down query search scopes to a minimal subset of documents).

---

## 1. Prerequisites

- [Index (Concept in MongoDB)](index_concept.md) — The B-Tree structure.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Core optimization science across all relational SQL and NoSQL engines. Used by the Cost-Based Query Planner to decide whether to run index scans or fall back to collection scans).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Creating Single-Field Indexes on Low Selectivity Fields

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

### Mistake 5: Placing Low Selectivity Fields First in Compound Indexes

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

## 6. Practice Exercises

### Exercise 1: Selectivity Calculation

**Problem:** You have a `products` collection containing `1,000,000` documents. 
-   Query A: `{ status: "available" }` matches `800,000` documents.
-   Query B: `{ sku: "SKU-9908" }` matches `1` document.
1.  Calculate the selectivity percentage for Query A and Query B.
2.  State which field (`status` or `sku`) should receive a database index.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Selectivity Calculation:
>    - Query A (status): 800,000 / 1,000,000 = 80% (Low Selectivity)
>    - Query B (sku): 1 / 1,000,000 = 0.0001% (High Selectivity)
> 2. The `sku` field should receive the index. Its high selectivity allows the query planner to jump directly to the target record in logarithmic time, whereas a status index will be ignored due to its low selectivity.
> ```
> - Selectivity is the ratio of matching documents to total documents.
> - Indexes are effective only when selectivity ratios are very small.

---



### Exercise 2: High vs Low Selectivity Comparison

**Problem:** Which field has higher selectivity: `email` (unique) or `status` (3 values)? (`email`).

**Expected output:**
> [!check]- Answer
> ```text
> email (high selectivity unique values)
> ```
> ```text
> email (high selectivity unique values)
> ```
>
> **Explanation:** High selectivity fields narrow down query candidate sets rapidly.

---

### Exercise 3: Selectivity Definition

**Problem:** Define index selectivity in MongoDB (The ratio of distinct field values to total collection document count).

**Expected output:**
> [!check]- Answer
> ```text
> Ratio of unique field values to total collection document count
> ```
> ```text
> Ratio of unique field values to total collection document count
> ```
>
> **Explanation:** High selectivity (approaching 1.0) maximizes index filtering speed.

## 7. Related Terms

- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree structure.
- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The query planner choices.
- [The ESR Rule (Equality, Sort, Range)](esr_rule.md) — Related concept: The ESR Rule (Equality, Sort, Range).

---

## 8. Key Takeaways
- Cardinality measures the count of unique values in a field.
- Selectivity measures how effectively a filter narrows the document search space.
- Highly selective queries return a tiny fraction of the collection (ideal).
- Low selectivity queries return a large percentage of the collection (poor).
- The query planner ignores indexes that exhibit low selectivity.
- Only build indexes on high-cardinality fields (like emails or dates).
- Never index low-cardinality fields (like booleans) as single-field indexes.
- Combine low-cardinality fields into compound indexes to improve search bounds.
