# `$out` / `$merge` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to persist processed results directly into physical disk collections, comparing `$out` (which completely replaces the target collection) with `$merge` (which updates or upserts records incrementally).

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Upsert (`upsert: true`)](../level_03/upsert.md) — The update-or-insert write concept.

---

## 2. Term Category

**Aggregation** (Pipeline Output Persistence Stages): The $out and $merge stages write the output documents of an aggregation pipeline into a target collection for materialization.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Must be placed as the **last stage** of the pipeline. `$merge` was introduced in MongoDB 4.2 to support large-scale incremental changes and cross-database writes).

### (1) Design Motivation — "Why did we design this?"
By default, running an aggregation pipeline is a read-only query that streams results to RAM. 

If you are running a heavy reporting query (e.g. aggregating 20 million sales records to calculate daily category revenues):
-   Running this query live every time a manager loads the dashboard will crash your database CPU.
-   Instead, you want to calculate the metrics once an hour and **materialize** (save) the summarized results into a dedicated cache collection.

In PostgreSQL, you do this using:
`CREATE TABLE daily_sales_summary AS SELECT ...;`

We designed the **`$out`** and **`$merge`** stages to write pipeline outputs directly to database collections on disk, creating high-performance materialized views or cache structures.

---

### (2) `$out` vs. `$merge` Contrast

#### 1. `$out` (The Destructive Replacement)
Writes all pipeline results into a target collection.
-   *Behavior:* **Wipes the target collection clean.** If the collection exists, `$out` deletes all its documents and indexes, replacing it with the new pipeline output.
-   *Execution:* Uses a temporary collection behind the scenes, swapping it at the end to prevent search downtime.
-   *SQL Equivalent:* `DROP TABLE IF EXISTS ...; CREATE TABLE ...`

#### 2. `$merge` (The Incremental Upsert)
Merges the pipeline results into an existing collection.
-   *Behavior:* **Does not delete old data.** It compares documents using a unique field (usually `_id`).
    -   If a document matches, it updates/merges the fields.
    -   If no match is found, it inserts a new document.
-   *SQL Equivalent:* `INSERT ... ON CONFLICT DO UPDATE` (UPSERT).

---

### (3) Reality Metaphor (Warehouse Stockings)
Imagine updating a stock catalog in a warehouse:
-   **`$out` Stage (Rebuild):** You drive a bulldozer, **demolish the warehouse building completely**, clear the dirt, build a new warehouse, and place only the new stock boxes inside. (Clean slate, but destroys all existing racks and layouts).
-   **`$merge` Stage (Update):** You walk into the existing warehouse with a clipboard. 
    -   If you find a matching rack item, you update its label details. 
    -   If a box is brand new, you slide it onto an empty shelf. The building itself is preserved.

---

### (4) Code Examples

#### 1. Materializing a Fresh Copy (out)
Create or completely overwrite the `sales_cache` collection:

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$category", total_sales: { $sum: "$amount" } } },
  // Save results: overwrites sales_cache!
  { $out: "sales_cache" } 
]);
```

#### 2. Merging Deltas Incrementally (merge)
Update hourly reports, merging changes with existing records and preserving indexes:

```javascript
db.orders.aggregate([
  { $match: { updated_at: { $gte: new Date(Date.now() - 3600000) } } }, // Last hour only
  { $group: { _id: "$category", hourly_sales: { $sum: "$amount" } } },
  // Merge results: upserts into active_summaries!
  {
    $merge: {
      into: "active_summaries",
      on: "_id", // Field to match documents on
      whenMatched: "merge", // If matched, merge the fields
      whenNotMatched: "insert" // If not matched, insert a new row
    }
  }
]);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Running '$out' on a collection containing active indexes or custom database settings, accidentally deleting them

**The mistake:** Staging a nightly aggregate script that writes to `user_analytics` using `$out`, not realizing it destroys the custom compound indexes built on that table.

**Why it's wrong:** The `$out` stage completely drops the target collection before swapping. 

This deletes all custom indexes, validation schemas, and database settings, forcing subsequent queries to run slow collection scans.

**Fix: If you need to write updates to an existing collection while preserving its indexes and schemas, always use `$merge` instead of `$out`.**

---



### Mistake 2: Using `$out` to Update Existing Collections Expecting to Preserve Un-Touched Documents

**The mistake:** Executing `$out: "existing_collection"` expecting it to perform partial document updates.

**Why it's wrong:** `$out` DROPS and REPLACES the entire target collection! All pre-existing documents and indexes in target collection are deleted. Use `$merge` for safe updates.

*Incorrect:*
```javascript
db.orders.aggregate([..., { $out: "users" }]); // 💥 Drops existing users collection!
```

*Fix:*
```javascript
db.orders.aggregate([..., { $merge: { into: "users", on: "_id", whenMatched: "merge" } }]);
```

### Mistake 3: Writing to Sharded Target Collections with `$out`

**The mistake:** Attempting to write aggregation outputs to a sharded collection using `$out`.

**Why it's wrong:** `$out` cannot output results to sharded collections. Use `$merge` for sharded target collection updates.

*Incorrect:*
```javascript
db.orders.aggregate([..., { $out: "sharded_analytics" }]); // ❌ Fails on sharded collection!
```

*Fix:*
```javascript
db.orders.aggregate([..., { $merge: { into: "sharded_analytics", on: "_id" } }]);
```

## 5. Practice Exercises

### Exercise 1: Materializing Pipeline Results with `$out`

**Scenario:**
Export aggregated quarterly sales summary results to a new target collection `quarterly_sales_2026` using `$out`.

**Requirements:**
1. Append `{ $out: "quarterly_sales_2026" }` as final pipeline stage.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   { $match: { status: "completed" } },
>   { $group: { _id: "$category", total: { $sum: "$amount" } } },
>   { $out: "quarterly_sales_2026" }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$out` writes pipeline output documents into a target collection, replacing any existing collection data completely.
> 2. Atomic collection swap on completion.
> 3. Cannot output to sharded collections; use `$merge` for sharded output targets.
> 
---

### Exercise 2: Incremental Materialized Views with `$merge`

**Scenario:**
Upsert aggregated daily user activity totals into an existing materialized collection `user_daily_stats` using `$merge`.

**Requirements:**
1. Append `$merge: { into: "user_daily_stats", on: "_id", whenMatched: "replace", whenNotMatched: "insert" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.activity_logs.aggregate([
>   { $match: { date: new Date("2026-08-05") } },
>   { $group: { _id: "$userId", dailyActions: { $sum: 1 } } },
>   {
>     $merge: {
>       into: "user_daily_stats",
>       on: "_id",
>       whenMatched: "replace",
>       whenNotMatched: "insert"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$merge` incrementally updates or inserts pipeline output documents into target collections.
> 2. `whenMatched: "replace"` updates matching records; `whenNotMatched: "insert"` adds new entries.
> 3. Supports output to sharded target collections across clusters.
> 
---

### Exercise 3: Comparing `$out` vs `$merge` Output Strategies

**Scenario:**
Formulate a technical decision guide choosing between `$out` and `$merge`.

**Requirements:**
1. Contrast destructive replacement (`$out`) vs incremental upsert (`$merge`).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Target Materialization Selection Guide:
> - $out: Use for periodic full snapshot rewrites (replaces entire target collection atomically).
> - $merge: Use for continuous incremental ETL updates, sharded target collections, and fine-grained merge actions.
> ```
>
> #### Technical Explanation
>
> 1. `$out` provides simple atomic collection overwrites.
> 2. `$merge` provides flexible, non-destructive incremental updates.
> 3. Foundation for building background data warehouse pipelines.
> 
---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Upsert (`upsert: true`)](../level_03/upsert.md) — The write concept.

---

## 7. Key Takeaways
- `$out` and `$merge` write aggregation pipeline outputs directly to disk.
- Must be declared as the final stage of the aggregation pipeline array.
- `$out` completely replaces the target collection, dropping old data and indexes.
- `$merge` updates and upserts documents incrementally, preserving indexes.
- Use `$merge` to construct efficient materialized views and cache tables.
- `$merge` can write to collections located in different databases.
- Always verify index layouts before running destructive `$out` writes.
