# `$match` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that filters the incoming document stream based on query criteria, serving as the direct equivalent of SQL's `WHERE` (and `HAVING`) clauses.

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Query Filter (Filter Document)](../level_03/query_filter.md) — The identical syntax schema.

---

## 2. Term Category

**Aggregation** (Document Selection Filter Stage): The $match stage filters the document stream to pass only documents matching specified query criteria to subsequent pipeline stages.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Optimized by the query planner. If placed as the very first stage, it converts query criteria into index scan boundaries, bypassing full collection scans).

### (1) Design Motivation — "Why did we design this?"
In database querying, you rarely aggregate your entire database. 

If you are calculating total sales metrics, you don't care about cancelled orders or testing sandbox transactions.

In SQL, you filter data early using the `WHERE` clause:
`SELECT ... WHERE status = 'completed'`

We designed the **`$match`** stage to provide this filtering capability inside the Aggregation Pipeline. 

By filtering documents early, you reduce the workload for all subsequent pipeline stages, saving RAM and accelerating execution speeds.

---

### (2) Identical Query Syntax
A major design benefit of `$match` is that **it uses the exact same query syntax as the standard `find()` query filters.** 

Any query block you can write inside `find()` can be pasted directly into `$match`:
-   `{ status: "active" }`
-   `{ price: { $gte: 10 } }`
-   `{ tags: { $in: ["shoes"] } }`

---

### (3) SQL Equivalent Mapping
-   **If `$match` is the first stage:** It is equivalent to SQL's **`WHERE`** clause (filters raw records before grouping).
-   **If `$match` is placed *after* a `$group` stage:** It is equivalent to SQL's **`HAVING`** clause (filters the aggregated group results).

---

### (4) Reality Metaphor (Badge Turnstiles)
Imagine travelers entering a train terminal platform:
-   **`$match` Stage:** The **Electronic Ticket Scan Turnstile** at the entrance gate. 
    -   Travelers swipe their tickets. 
    -   If the ticket is valid (`$match`), the gate opens and the traveler walks through to the train platform (next stage). 
    -   If invalid, they are blocked. 
    -   The travelers themselves are not altered or painted; they simply pass through or are stopped.

---

### (5) Code Examples

#### 1. Filtering as WHERE (First Stage)
Find all completed orders and calculate their sum. `$match` is first to use indexes:

```javascript
db.orders.aggregate([
  // WHERE status = 'completed'
  {
    $match: { status: "completed" } 
  },
  // GROUP BY category
  {
    $group: {
      _id: "$category",
      total_sales: { $sum: "$amount" }
    }
  }
]);
```

#### 2. Filtering as HAVING (After Grouping)
Only display categories where the total aggregated sales exceed 10,000:

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$category", total_sales: { $sum: "$amount" } } },
  // HAVING total_sales > 10000
  {
    $match: { total_sales: { $gt: NumberDecimal("10000.00") } }
  }
]);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use aggregation expressions (like cross-field comparisons) inside a standard '$match' stage without wrapping them in '$expr'

**The mistake:** Writing the query stage `{ $match: { amount_paid: { $lt: "$total_bill" } } }` to filter unpaid orders.

**Why it's wrong:** The standard `$match` parser treats `"$total_bill"` as a literal text string, not a field value reference. 

Since BSON numbers cannot be compared to text strings directly, this check will return zero results or throw errors.

**Fix: If you need to perform cross-field comparisons or aggregation math inside a `$match` stage, you must explicitly wrap the query inside the `$expr` operator:**

```javascript
// CORRECT
db.orders.aggregate([
  {
    $match: {
      $expr: { $lt: [ "$amount_paid", "$total_bill" ] }
    }
  }
]);
```

---



### Mistake 2: Placing `$match` Stages After Un-Indexed Pipeline Transformation Stages

**The mistake:** Placing `$unwind` or `$project` before `$match` in aggregation pipelines.

**Why it's wrong:** MongoDB can utilize collection B-Tree indexes ONLY if `$match` is placed as the VERY FIRST stage in the pipeline.

*Incorrect:*
```javascript
db.orders.aggregate([{ $unwind: "$items" }, { $match: { status: "active" } }]); // ❌ Index disabled!
```

*Fix:*
```javascript
db.orders.aggregate([{ $match: { status: "active" } }, { $unwind: "$items" }]); // Index enabled
```

### Mistake 3: Using Aggregation Expressions Inside Standard `$match` Without `$expr`

**The mistake:** Writing `db.orders.aggregate([{ $match: { $gt: ["$spent", "$budget"] } }])`.

**Why it's wrong:** Standard `$match` query filters do not parse aggregation expressions natively. Wrap aggregation expressions inside `$expr`: `{ $match: { $expr: { $gt: ["$spent", "$budget"] } } }`.

*Incorrect:*
```javascript
db.orders.aggregate([{ $match: { $gt: ["$spent", "$budget"] } }]); // ❌ Invalid query syntax!
```

*Fix:*
```javascript
db.orders.aggregate([{ $match: { $expr: { $gt: ["$spent", "$budget"] } } }]);
```

## 5. Practice Exercises

### Exercise 1: Early Index-Backed Filtering with `$match`

**Scenario:**
Filter collection `orders` at the beginning of an aggregation pipeline to include ONLY `status: "active"` created in 2026.

**Requirements:**
1. Place `$match` as stage 1 of the pipeline.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $match: {
>       status: "active",
>       createdAt: { $gte: new Date("2026-01-01") }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$match` uses standard MongoDB query filter syntax.
> 2. Placing `$match` at the start of the pipeline enables index scans (`IXSCAN`).
> 3. Filters out irrelevant documents early, minimizing RAM usage in subsequent stages.

---

### Exercise 2: Combining `$match` with Text Index Search

**Scenario:**
Execute a full-text search query inside `$match` as the first stage of an aggregation pipeline.

**Requirements:**
1. Use `{ $match: { $text: { $search: "database" } } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.articles.aggregate([
>   { $match: { $text: { $search: "database" } } },
>   { $group: { _id: "$author", count: { $sum: 1 } } }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$text` search queries MUST appear in the first `$match` stage of a pipeline.
> 2. Utilizes inverted text index to select matching documents.
> 3. Combines full-text search with pipeline analytics.

---

### Exercise 3: Mid-Pipeline Filtering

**Scenario:**
Filter grouped results after a `$group` stage to return ONLY categories with total sales exceeding `$10,000`.

**Requirements:**
1. Place `$match` after `$group` (behaving like a SQL `HAVING` clause).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   { $group: { _id: "$category", totalSales: { $sum: "$total" } } },
>   { $match: { totalSales: { $gt: 10000 } } }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$match` can appear multiple times in a pipeline.
> 2. When placed after `$group`, `$match` acts like a SQL `HAVING` clause filtering aggregated results.
> 3. Trims summary outputs before returning payload to client.

---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$group` Stage](group_stage.md) — The grouping stage.

---

## 7. Key Takeaways
- `$match` filters documents flowing through the aggregation pipeline.
- Direct equivalent to SQL's `WHERE` and `HAVING` clauses.
- Uses the exact same syntax as the standard `find()` query filters.
- Place `$match` early in the pipeline array to utilize indexes and reduce RAM load.
- If placed after `$group`, it acts as a SQL `HAVING` clause.
- Does not modify document values; only filters which documents pass.
- Wrap cross-field comparison checks inside `$expr` when using `$match`.
