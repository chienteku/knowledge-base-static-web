# `$sort` / `$limit` / `$skip` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to order document streams (`$sort`), restrict document counts (`$limit`), and bypass offsets (`$skip`), and the critical rule that pipeline execution depends entirely on stage sequence order.

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`sort()` / `limit()` / `skip()` (CRUD)](../../level_03/sort_limit_skip.md) — The cursor pagination methods.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated by the pipeline execution engine. The query optimizer can automatically coalesce adjacent `$sort` and `$limit` stages to perform memory-optimized top-N sorting).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When analyzing aggregated data, you frequently need to sort and paginate the results:
-   Finding the **top 10 highest-spending customers**.
-   Paginating through grouped category summaries.

In SQL, you write this at the end of the query:
`ORDER BY total DESC LIMIT 10;`

We designed the **`$sort`**, **`$limit`**, and **`$skip`** pipeline stages to provide this pagination capability inside MongoDB Aggregation.

---

### (2) The Aggregation gotcha: Strict Sequence Order
In standard CRUD queries, the database optimizer guarantees a safe execution order (Sort $\rightarrow$ Skip $\rightarrow$ Limit) regardless of how you chain the methods in your code:
`db.collection.find().limit(5).sort({ price: 1 })` (Always sorts first, then limits).

**In the Aggregation Pipeline, stages are executed in the exact order they are listed in the array.**

If you write this pipeline:
`[ { $limit: 5 }, { $sort: { price: 1 } } ]`

1.  MongoDB will take the **first 5 random documents** it scans from disk.
2.  It will then sort *those 5 documents* by price.
3.  Any cheaper products remaining in the collection are ignored, yielding incorrect data.

To find the 5 cheapest products in the collection, you **must** write the stages in the correct order:
`[ { $sort: { price: 1 } }, { $limit: 5 } ]`

---

### (3) Reality Metaphor (The Hallway Gates)
Imagine students walking down a narrow school hallway:
-   **Standard Query:** A teacher stands at the end of the hall. They automatically organize all students by grade first, and then hand out medals to the top 5 (guaranteed logic).
-   **Aggregation Pipeline:** A series of **Doors** in the hallway.
    -   **Incorrect Sequence:** Door 1 says: *"Only let the first 5 students enter"* (`$limit: 5`). Door 2 says: *"Line up by height"* (`$sort`). The 5 random students who got through Door 1 are lined up. The shortest student in the school, who was stuck behind Door 1, is ignored.
    -   **Correct Sequence:** Door 1 says: *"Line up by height"* (`$sort`). Door 2 says: *"Only let the first 5 enter"* (`$limit: 5`). You get the 5 shortest students in the school.

---

### (4) Code Examples

#### Correct vs. Incorrect Ordering
Let's find the top 2 most expensive products:

```javascript
db.products.insertMany([
  { name: "Pen", price: 1.00 },
  { name: "Book", price: 10.00 },
  { name: "Laptop", price: 1000.00 }
]);

// INCORRECT: Limits first, then sorts (returns Pen and Book sorted!)
db.products.aggregate([
  { $limit: 2 },
  { $sort: { price: -1 } }
]);

// CORRECT: Sorts first, then limits (returns Laptop and Book!)
db.products.aggregate([
  { $sort: { price: -1 } },
  { $limit: 2 }
]);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing the $limit or $skip stages before the $sort stage when calculating top-N records

**The mistake:** Trying to get the highest scoring student by writing `[{ $limit: 1 }, { $sort: { score: -1 } }]` in the aggregation pipeline.

**Why it's wrong:** As shown in the code examples, MongoDB limits the stream to a single random student first, and then sorts that one student, returning a random result instead of the actual highest scorer.

**Fix: Always place the `$sort` stage before the `$limit` or `$skip` stages when implementing sorted pagination or top-N list retrievals.**

---



### Mistake 2: Executing High `$skip` Offsets in Pipeline Pagination (Severe CPU Scan)

**The mistake:** Executing `[{ $sort: { date: -1 } }, { $skip: 100000 }, { $limit: 20 }]` on large pipelines.

**Why it's wrong:** `$skip` forces scanning and discarding 100,000 documents sequentially in memory. Use `$match: { date: { $lt: lastDate } }` for cursor-based pagination.

*Incorrect:*
```javascript
db.logs.aggregate([{ $sort: { date: -1 } }, { $skip: 100000 }, { $limit: 20 }]); // ❌ High RAM scan!
```

*Fix:*
```javascript
db.logs.aggregate([{ $match: { date: { $lt: lastDate } } }, { $sort: { date: -1 } }, { $limit: 20 }]);
```

### Mistake 3: Placing `$sort` After `$unwind` Stages (Memory Explosion)

**The mistake:** Placing `$unwind` before `$sort` on 10M documents.

**Why it's wrong:** Unwinding arrays multiplies document volume by 10x or 100x before sorting. Sort documents using indexed fields BEFORE `$unwind`.

*Incorrect:*
```javascript
db.posts.aggregate([{ $unwind: "$comments" }, { $sort: { createdAt: -1 } }]); // ❌ Multiplies sort volume!
```

*Fix:*
```javascript
db.posts.aggregate([{ $sort: { createdAt: -1 } }, { $unwind: "$comments" }]);
```

## 6. Practice Exercises

### Exercise 1: Pipeline Pagination Construction

**Problem:** You have an `orders` collection. Write the aggregation pipeline array containing three stages to return Page 2 of the highest-revenue orders:
-   Sort by `total_revenue` in descending order.
-   Skip the first `10` orders (Page 1).
-   Limit the output to `10` orders (Page 2).

**Expected output:**
> [!check]- Answer
> ```javascript
> [
>   { $sort: { total_revenue: -1 } },
>   { $skip: 10 },
>   { $limit: 10 }
> ]
> ```
> - The sequence of stages in aggregation is executed from first index to last.
> - Order the stages: Sort first, then Skip, then Limit.

---



### Exercise 2: Pipeline Sorting and Limiting

**Problem:** Sort products by `salesCount` descending and return top 10 items using `$sort` and `$limit`.

**Expected output:**
> [!check]- Answer
> ```text
> db.products.aggregate([{ $sort: { salesCount: -1 } }, { $limit: 10 }]);
> ```
> ```javascript
> db.products.aggregate([
>   { $sort: { salesCount: -1 } },
>   { $limit: 10 }
> ]);
> ```
>
> **Explanation:** `$sort: { field: -1 }` sorts descending; `$limit: N` caps result output.

---

### Exercise 3: Optimization Rule for `$sort` and `$limit`

**Problem:** How does MongoDB optimize `$sort` followed immediately by `$limit: N`? (Maintains top-N items in memory without sorting full collection).

**Expected output:**
> [!check]- Answer
> ```text
> Maintains top-N items in memory during scan without sorting the full dataset
> ```
> ```text
> Maintains top-N items in memory during scan without sorting the full dataset
> ```
>
> **Explanation:** Top-N sort optimization limits memory consumption during sort operations.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`sort()` / `limit()` / `skip()` (CRUD)](../../level_03/sort_limit_skip.md) — The cursor pagination.

---

## 8. Key Takeaways
- `$sort`, `$limit`, and `$skip` perform pagination in aggregation pipelines.
- Direct equivalents to SQL's `ORDER BY`, `LIMIT`, and `OFFSET` clauses.
- Stages are executed in the exact sequential order they appear in the array.
- Sorting must occur *before* limiting/skipping to return correct paginated lists.
- Incorrect stage ordering (e.g. limit before sort) causes random matching.
- Adjacent `$sort` and `$limit` stages are optimized on the server to save RAM.
- Use indexes on the `$sort` fields when placing it at the beginning of the pipeline.
