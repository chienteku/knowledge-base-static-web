# Aggregation Pipeline (Concept)

> **Level 6 — Aggregation Framework**
> MongoDB's data-processing framework that transforms and analyzes documents by streaming them through a sequence of processing stages (pipeline), serving as the NoSQL equivalent of SQL's `GROUP BY`, aggregates, joins, and subqueries combined.

---

## 1. Prerequisites

- [`find()` / `findOne()`](../level_03/find.md) — Basic find query filtering.
- [Document](../level_01/document.md) — BSON document structure.
- [Cursor](../level_03/cursor.md) — The query results cursor wrapper.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Executed on the database server. Processes data streams in memory, utilizing physical disk storage space for temporary spillover when executing large sorting operations).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While basic query methods like `find()` and `project()` are great for retrieving documents, they cannot perform calculations across documents:
-   Calculating the **average price** of all products in each category.
-   Counting how many active users live in each city.
-   Joining orders with customers, calculating totals, and sorting the results.

In SQL, you compile these logic blocks into a single declarative statement using clauses:
`SELECT country, AVG(amount) FROM orders WHERE status = 'completed' GROUP BY country ORDER BY 2 DESC LIMIT 10;`

To support this advanced analysis, MongoDB provides the **Aggregation Framework**. 

Instead of writing a single declarative query, you define an **Aggregation Pipeline**—a sequential assembly line. 

Documents are fed into the pipeline and flow through a series of **Stages**. 

Each stage performs a single, specific operation (filtering, grouping, sorting, or reshaping) and hands its output directly to the next stage, providing an intuitive, modular way to build complex data processing tasks.

---

### (2) Pipeline Mechanics
An aggregation pipeline is executed via the `aggregate()` method on a collection. It accepts a JavaScript array containing stage objects:
`db.collection.aggregate([ { stage_1 }, { stage_2 }, { stage_3 } ])`

-   Each stage starts with a BSON stage operator prefixed with `$` (e.g. `$match`, `$group`, `$sort`).
-   The output of Stage 1 becomes the input of Stage 2.
-   The final stage returns a standard cursor containing the transformed documents.

---

### (3) Reality Metaphor (The Factory Assembly Line)
Imagine a car manufacturing assembly line:
-   **Stage 1 (`$match` - Filter):** Quality control scans the raw incoming metal sheets, discarding any sheets carrying rust (filters out irrelevant records).
-   **Stage 2 (`$group` - Assemble):** Workers weld the metal sheets into car frames, grouping them by color (aggregates data).
-   **Stage 3 (`$project` - Reshape):** A machine paints decals and installs stereos, choosing which parts are visible (reshapes the fields).
-   **Stage 4 (`$sort` - Order):** A driver parks the finished cars in the lot, lining them up from cheapest to most expensive (orders output).
-   Each stage performs one job and hands the car to the next station.

---

### (4) Code Examples

#### Sequential Pipeline Flow
Let's see how a pipeline matches a SQL query:

```javascript
// SQL Equivalent:
// SELECT category, SUM(stock) FROM products WHERE price > 10.00 GROUP BY category;

db.products.aggregate([
  // Stage 1: Filter out cheap products (uses indexes!)
  {
    $match: { price: { $gt: NumberDecimal("10.00") } }
  },
  // Stage 2: Group by category and sum up the stock levels
  {
    $group: {
      _id: "$category", // Grouping key prefix is required
      total_stock: { $sum: "$stock" } // Accumulator math
    }
  }
]);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing the filter stage ($match) late in the pipeline after heavy group or reshape operations

**The mistake:** Running an aggregation pipeline that groups all documents first, and then filters them:

```javascript
// BAD: Massive memory usage and fails to use indexes!
db.orders.aggregate([
  { $group: { _id: "$country", total: { $sum: "$amount" } } },
  { $match: { _id: "US" } } // Filtering AFTER grouping!
]);
```

**Why it's wrong:** MongoDB can only use indexes to speed up queries at the **very beginning** of the pipeline. 

If you group first, the database must load all 10 million orders from disk into memory to group them, and then discard 99% of them in the next step.

**Fix: Always place `$match` stages at the very beginning of the pipeline array to prune data early and allow the query engine to use indexes.**

```javascript
// CORRECT (Instant execution!)
db.orders.aggregate([
  { $match: { country: "US" } }, // Prunes non-US records instantly
  { $group: { _id: "$country", total: { $sum: "$amount" } } }
]);
```

---



### Mistake 2: Placing `$match` Stages After Un-Indexed Transformation Stages

**The mistake:** Placing `$unwind` or `$project` stages BEFORE `$match` in aggregation pipelines.

**Why it's wrong:** MongoDB can utilize B-Tree indexes ONLY if `$match` is placed as the VERY FIRST stage in the aggregation pipeline! Placing `$unwind` first forces full collection scans.

*Incorrect:*
```javascript
db.orders.aggregate([{ $unwind: "$items" }, { $match: { status: "active" } }]); // ❌ Index disabled!
```

*Fix:*
```javascript
db.orders.aggregate([{ $match: { status: "active" } }, { $unwind: "$items" }]); // Index enabled
```

### Mistake 3: Ignoring Memory Limits on In-Memory Aggregation Stages

**The mistake:** Executing `$sort` or `$group` on 100M documents without indexes or `{ allowDiskUse: true }`.

**Why it's wrong:** In-memory aggregation stages have a strict 100MB RAM limit. Exceeding 100MB RAM throws error `Sort exceeded memory limit of 100M`. Pass `{ allowDiskUse: true }` for large aggregations.

*Incorrect:*
```javascript
db.large.aggregate([{ $sort: { unindexedField: 1 } }]); // ❌ Memory limit exceeded!
```

*Fix:*
```javascript
db.large.aggregate([{ $sort: { unindexedField: 1 } }], { allowDiskUse: true });
```

## 6. Practice Exercises

### Exercise 1: Pipeline Stage Ordering

**Problem:** You want to write an aggregation query to:
1.  Filter users to keep only those with `status: "active"`.
2.  Sort them by `age` descending.
3.  Limit the results to the top 5 users.
Arrange these actions as a list of three MongoDB aggregation stage names in the correct, most efficient execution order.

**Expected output:**
> [!check]- Answer
> ```text
> 1. $match (Filters inactive users early, allowing index usage).
> 2. $sort  (Orders the filtered active users).
> 3. $limit (Restricts the output count to 5, preventing full array sorting).
> ```
> - Identify the stage operators corresponding to WHERE, ORDER BY, and LIMIT.
> - Apply the rule of pruning data as early as possible in the pipeline.

---



### Exercise 2: Basic Pipeline Match and Group

**Problem:** Filter orders `status: "completed"` and group by `customerId` counting total orders.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.aggregate([ { $match: { status: "completed" } }, { $group: { _id: "$customerId", count: { $sum: 1 } } } ]);
> ```
> ```javascript
> db.orders.aggregate([
>   { $match: { status: "completed" } },
>   { $group: { _id: "$customerId", count: { $sum: 1 } } }
> ]);
> ```
>
> **Explanation:** Pipelines execute sequentially: `$match` filters documents first, followed by `$group` aggregation.

---

### Exercise 3: Allowing Disk Use for Large Aggregations

**Problem:** Configure aggregation query to allow temporary disk spillover using `{ allowDiskUse: true }`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.aggregate(pipeline, { allowDiskUse: true });
> ```
> ```javascript
> db.orders.aggregate(pipeline, { allowDiskUse: true });
> ```
>
> **Explanation:** `{ allowDiskUse: true }` allows memory-intensive stages to spill over to disk.

## 7. Related Terms

- [`$match` Stage](match_stage.md) — The filtering stage.
- [`$group` Stage](group_stage.md) — The grouping stage.
- [Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`)](aggregation_variables.md) — Related concept: Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`).
- [`$bucket` / `$bucketAuto` Stages](bucket_stages.md) — Related concept: `$bucket` / `$bucketAuto` Stages.
- [Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`)](expression_operators.md) — Related concept: Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`).
- [`$facet` Stage](facet_stage.md) — Related concept: `$facet` Stage.
- [`$lookup` Stage](lookup_stage.md) — Related concept: `$lookup` Stage.
- [`$out` / `$merge` Stages](out_merge_stages.md) — Related concept: `$out` / `$merge` Stages.
- [`$project` / `$addFields` Stages](project_addfields.md) — Related concept: `$project` / `$addFields` Stages.
- [`$replaceRoot` / `$replaceWith` Stages](replace_root.md) — Related concept: `$replaceRoot` / `$replaceWith` Stages.
- [`$sort` / `$limit` / `$skip` Stages](sort_limit_skip_stages.md) — Related concept: `$sort` / `$limit` / `$skip` Stages.
- [`$unwind` Stage](unwind_stage.md) — Related concept: `$unwind` Stage.
- [Atlas Search](../level_10/atlas_search.md) — Related concept: Atlas Search.
- [Views](../level_10/views.md) — Related concept: Views.

---

## 8. Key Takeaways
- The Aggregation Framework processes data through sequential stage filters.
- Direct NoSQL equivalent to SQL's `GROUP BY`, aggregates, and joins.
- Executed using `db.collection.aggregate([ {stage1}, {stage2} ])`.
- Each stage transforms documents and streams results to the next stage.
- Always place `$match` stages first to optimize index lookups.
- Avoid memory sorting issues by placing `$limit` immediately after `$sort`.
- Pipelines return a cursor pointing to the processed results stream.
