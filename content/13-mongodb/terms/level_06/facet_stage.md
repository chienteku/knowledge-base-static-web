# `$facet` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that runs multiple independent sub-pipelines in parallel on the same set of input documents, returning a single document containing the compiled results of all pipelines.

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Document Size Limit (16 MB)](../../level_05/document_size_limit.md) — The output size constraint.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated in the aggregation engine. Distributes sub-pipelines in parallel across internal threads, combining outputs into a single document in RAM).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When loading an e-commerce search results page (like searching for "shoes" on Amazon), the UI must display:
1.  The actual list of matching shoes (paginated: items 1 to 20).
2.  A sidebar containing **category counts** (e.g., "Running: 45", "Boots: 12").
3.  A sidebar containing **brand counts** (e.g., "Nike: 30", "Adidas: 27").

If you build this using standard queries:
-   Your application must send 3 separate queries to MongoDB.
-   This consumes network bandwidth, duplicates database scans, and increases API load times.

We designed the **`$facet`** stage to solve this dashboard lookup problem. 

It acts as a parallel query splitter. 

You pass a single document stream to `$facet`, and it runs multiple independent aggregation pipelines on that same stream in parallel. 

It returns a single document containing the outputs of all three checks, satisfying your entire UI display requirements in a single network roundtrip.

---

### (2) `$facet` Syntax Structure
Inside `$facet`, you define named keys, where each key holds its own independent aggregation pipeline array:

```javascript
db.products.aggregate([
  { $match: { category: "shoes" } }, // Pre-filter data early!
  {
    $facet: {
      // Sub-Pipeline 1: Paginated items list
      "paginated_results": [
        { $sort: { price: 1 } },
        { $skip: 0 },
        { $limit: 10 }
      ],
      // Sub-Pipeline 2: Brand counters
      "brand_counts": [
        { $group: { _id: "$brand", count: { $sum: 1 } } }
      ]
    }
  }
]);
```

---

### (3) Reality Metaphor (Parallel Accountants)
Imagine auditing a pile of store receipts:
-   **No Facet:** You hire Accountant A to count receipt totals. When they finish, you hand the receipts to Accountant B to group them by store. When they finish, you hand them to Accountant C. (Slow, sequential work).
-   **`$facet` Stage:** You dump the receipts onto a **Central Table**. 
    -   **Accountant A** stands on the left, counting totals.
    -   **Accountant B** stands on the right, grouping by store.
    -   They work at the same time on the **same pile of papers** (in parallel), handing you a single, unified report sheet.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing massive document lists inside facet sub-pipelines, causing the final document to exceed the 16MB limit

**The mistake:** Running a `$facet` where one sub-pipeline returns 50,000 raw transaction documents without limits, hoping to sort them in code.

**Why it's wrong:** Because `$facet` packs the results of *all* sub-pipelines into a **single, final BSON document**, that document must comply with MongoDB's strict **16MB limit**. 

If any sub-pipeline returns large, unfiltered arrays, the final document will exceed 16MB, causing the query to crash.

**Fix: Always ensure that sub-pipelines inside `$facet` use `$limit` or `$group` stages to restrict output size, preventing BSON payload overflows.**

---

### Mistake 2: Overloading `$facet` Sub-Pipelines Causing 100MB Stage RAM Limits

**The mistake:** Running 5 un-indexed multi-stage `$facet` pipelines over 10M documents in a single aggregation request.

**Why it's wrong:** Sub-pipelines inside `$facet` run concurrently in memory. In-memory results across all facets must fit within the 100MB RAM limit.

*Incorrect:*
```javascript
// 5 complex un-indexed facets on 10M documents
```

*Fix:*
```javascript
Filter datasets with a targeted $match stage before entering the $facet stage
```

### Mistake 3: Using Pipeline Index-Disabling Stages inside `$facet` Sub-Pipelines

**The mistake:** Expecting `$match` stages inside a `$facet` sub-pipeline to utilize collection B-Tree indexes.

**Why it's wrong:** `$facet` sub-pipelines CANNOT utilize collection B-Tree indexes! Always run `$match` BEFORE the `$facet` stage.

*Incorrect:*
```javascript
db.products.aggregate([{ $facet: { cat1: [{ $match: { category: "tech" } }] } }]); // ❌ Cannot use index inside facet!
```

*Fix:*
```javascript
db.products.aggregate([{ $match: { status: "active" } }, { $facet: { ... } }]);
```

## 6. Practice Exercises

### Exercise 1: Facet Dashboard Construction

**Problem:** You have a `tickets` collection. Write the aggregation pipeline containing a single `$facet` stage to calculate:
1.  An array named `total_count` containing the total count of all tickets (hint: use `$group` with `$sum`).
2.  An array named `status_groups` grouping tickets by `status` and counting them.

**Expected output:**
> [!check]- Answer
> ```javascript
> [
>   {
>     $facet: {
>       total_count: [
>         { $group: { _id: null, count: { $sum: 1 } } }
>       ],
>       status_groups: [
>         { $group: { _id: "$status", count: { $sum: 1 } } }
>       ]
>     }
>   }
> ]
> ```
> - Construct the two independent pipelines inside the `$facet` object keys.
> - Use `{ _id: null }` in the first pipeline to calculate the global database count.

---



### Exercise 2: Multi-Faceted Aggregation for UI Dashboard

**Problem:** Create `$facet` stage returning simultaneous total product count (`totalCount`) and top 5 categories (`topCategories`).

**Expected output:**
> [!check]- Answer
> ```text
> db.products.aggregate([{ $facet: { totalCount: [{ $count: "count" }], topCategories: [{ $group: { _id: "$category", count: { $sum: 1 } } }, { $limit: 5 }] } }]);
> ```
> ```javascript
> db.products.aggregate([
>   {
>     $facet: {
>       totalCount: [{ $count: "count" }],
>       topCategories: [
>         { $group: { _id: "$category", count: { $sum: 1 } } },
>         { $limit: 5 }
>       ]
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$facet` runs multi-branch aggregation sub-pipelines in a single database roundtrip.

---

### Exercise 3: Combining `$facet` with Pagination

**Problem:** Build faceted pipeline returning both total matching items count and paginated items array.

**Expected output:**
> [!check]- Answer
> ```text
> db.items.aggregate([{ $facet: { metadata: [{ $count: "total" }], data: [{ $skip: 0 }, { $limit: 10 }] } }]);
> ```
> ```javascript
> db.items.aggregate([
>   {
>     $facet: {
>       metadata: [{ $count: "total" }],
>       data: [{ $skip: 0 }, { $limit: 10 }]
>     }
>   }
> ]);
> ```
>
> **Explanation:** Faceted pagination computes total result counts and paginated data arrays simultaneously.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Document Size Limit (16 MB)](../../level_05/document_size_limit.md) — The size constraint.

---

## 8. Key Takeaways
- `$facet` executes multiple independent sub-pipelines on a single input stream.
- Excellent for building multi-faceted search sidebar filters and dashboards.
- Combines parallel query outputs into a single returned JSON document.
- Reduces network latency by retrieving UI aggregates in one roundtrip.
- Subject to the 16MB document size limit; use `$limit` inside sub-pipelines.
- Nesting `$facet` stages inside other facets is forbidden.
- Scopes are calculated in parallel on the database server.
