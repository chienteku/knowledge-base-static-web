# `$out` / `$merge` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to persist processed results directly into physical disk collections, comparing `$out` (which completely replaces the target collection) with `$merge` (which updates or upserts records incrementally).

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Upsert](../level_03/upsert.md) — The update-or-insert write concept.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Must be placed as the **last stage** of the pipeline. `$merge` was introduced in MongoDB 4.2 to support large-scale incremental changes and cross-database writes).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Pipeline Persistence Selector

**Problem:** You are designing a data migration. Select the correct stage (**$out** or **$merge**) for these requirements:
1.  You are running a delta update that aggregates today's clicks. You want to add them to a `monthly_totals` collection that carries unique indexes, updating existing days and inserting new ones.
2.  You want to calculate a complete, cold backup table of your catalog into a fresh collection named `catalog_backup_July`, wiping any old backup collection of that name.

**Expected output:**
> [!check]- Answer
> ```text
> 1. $merge: Because you want to perform an incremental update (upsert) that preserves existing records and keeps custom collection indexes active.
> 2. $out: Because you want a complete, fresh replacement of the backup collection, wiping any old database files cleanly.
> ```
> - Determine if the collection writes must preserve historical indexes.
> - Relate the task to incremental delta updates vs. complete resets.

---



### Exercise 2: Merging Aggregation Results into Existing Collection

**Problem:** Merge aggregated daily totals into `daily_sales` collection on `_id` using `$merge`.

**Expected output:**
> [!check]- Answer
> ```text
> db.sales.aggregate([ ..., { $merge: { into: "daily_sales", on: "_id", whenMatched: "merge", whenNotMatched: "insert" } } ]);
> ```
> ```javascript
> db.sales.aggregate([
>   // aggregation stages ...
>   {
>     $merge: {
>       into: "daily_sales",
>       on: "_id",
>       whenMatched: "merge",
>       whenNotMatched: "insert"
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$merge` safely upserts or merges pipeline outputs into target collections.

---

### Exercise 3: Replacing Collection with `$out`

**Problem:** Write aggregation results to new materialized view collection `active_users_mv` using `$out`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $match: { active: true } }, { $out: "active_users_mv" }]);
> ```
> ```javascript
> db.users.aggregate([
>   { $match: { active: true } },
>   { $out: "active_users_mv" }
> ]);
> ```
>
> **Explanation:** `$out` writes pipeline outputs to a target collection, creating or replacing it.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Upsert](../level_03/upsert.md) — The write concept.

---

## 8. Key Takeaways
- `$out` and `$merge` write aggregation pipeline outputs directly to disk.
- Must be declared as the final stage of the aggregation pipeline array.
- `$out` completely replaces the target collection, dropping old data and indexes.
- `$merge` updates and upserts documents incrementally, preserving indexes.
- Use `$merge` to construct efficient materialized views and cache tables.
- `$merge` can write to collections located in different databases.
- Always verify index layouts before running destructive `$out` writes.
