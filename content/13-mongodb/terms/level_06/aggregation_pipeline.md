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

**Aggregation** (Multi-Stage Data Transformation): An Aggregation Pipeline is a multi-stage data processing framework where documents pass through a sequential series of transformation stages to compute aggregated results.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed on the database server. Processes data streams in memory, utilizing physical disk storage space for temporary spillover when executing large sorting operations).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Stage Filtering and Reporting Pipeline

**Scenario:**
Build a 3-stage pipeline that filters active orders (`$match`), groups by customer (`$group`), and sorts top spenders descending (`$sort`).

**Requirements:**
1. Chain `$match`, `$group`, and `$sort`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   { $match: { status: "completed" } },
>   {
>     $group: {
>       _id: "$customerId",
>       totalSpent: { $sum: "$amount" }
>     }
>   },
>   { $sort: { totalSpent: -1 } }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. Pipeline stages execute sequentially, passing transformed document streams from stage to stage.
> 2. `$match` at the start of the pipeline utilizes indexes to minimize data scanned.
> 3. Computes sorted analytics in a single query invocation.

---

### Exercise 2: Pipeline Projection and Field Derivation

**Scenario:**
Filter products by category `"electronics"`, compute tax (`price * 0.0825`), and project formatted output documents.

**Requirements:**
1. Use `$match`, `$addFields`, and `$project`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.aggregate([
>   { $match: { category: "electronics" } },
>   {
>     $addFields: {
>       tax: { $multiply: ["$price", 0.0825] }
>     }
>   },
>   {
>     $project: {
>       name: 1,
>       price: 1,
>       totalPrice: { $add: ["$price", "$tax"] }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$addFields` appends calculated fields without stripping existing document properties.
> 2. `$project` shapes final response key names and excludes internal attributes.
> 3. Server-side mathematical transformations.

---

### Exercise 3: Setting Pipeline Memory Limits with `allowDiskUse`

**Scenario:**
Execute a large dataset aggregation pipeline that exceeds the default 100MB RAM stage memory buffer.

**Requirements:**
1. Pass `{ allowDiskUse: true }` option to `aggregate()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.large_logs.aggregate(
>   [
>     { $match: { level: "ERROR" } },
>     { $group: { _id: "$sourceIp", count: { $sum: 1 } } },
>     { $sort: { count: -1 } }
>   ],
>   { allowDiskUse: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. Aggregation stages are limited to 100MB of RAM by default to prevent server OOM crashes.
> 2. `{ allowDiskUse: true }` enables stages like `$sort` and `$group` to write temporary spill files to disk.
> 3. Allows memory-intensive analytics pipelines to complete successfully.

---



## 6. Related Terms

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

## 7. Key Takeaways
- The Aggregation Framework processes data through sequential stage filters.
- Direct NoSQL equivalent to SQL's `GROUP BY`, aggregates, and joins.
- Executed using `db.collection.aggregate([ {stage1}, {stage2} ])`.
- Each stage transforms documents and streams results to the next stage.
- Always place `$match` stages first to optimize index lookups.
- Avoid memory sorting issues by placing `$limit` immediately after `$sort`.
- Pipelines return a cursor pointing to the processed results stream.
