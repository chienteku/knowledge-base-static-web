# `$bucket` / `$bucketAuto` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to classify documents into numeric range groups, comparing `$bucket` (which uses custom boundaries) with `$bucketAuto` (which automatically calculates boundaries to distribute documents evenly).

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [The Bucket Pattern](../level_05/bucket_pattern.md) — The storage-level bucketing concept.

---

## 2. Term Category

**Aggregation** (Categorical & Numeric Histogram Stages): Bucket Stages ($bucket, $bucketAuto) group incoming documents into discrete numeric ranges or categorical buckets for histogram analysis.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed in the aggregation processing engine. Evaluates numeric ranges in memory to generate histograms and distribution tables).

### (1) Design Motivation — "Why did we design this?"
When analyzing financial data or catalog inventory:
-   An e-commerce app needs to show how many products fall into price tiers: **$0–$10**, **$10–$50**, **$50–$100**, and **$100+**.
-   A school report needs to count how many students scored in grades: **0–59 (F)**, **60–79 (C/B)**, **80–100 (A)**.

If you try to write this using standard `$group` stages, you must build complex, nested conditional logic (using `$cond` or `$switch`) to check ranges.

We designed the **`$bucket`** and **`$bucketAuto`** stages to handle this. 

They act as numeric sorters, automatically grouping documents into range bins.

---

### (2) Custom vs. Automatic Bucketing

#### 1. `$bucket` (Custom Boundaries)
You define the exact range limits.
-   *Syntax:* Requires a `boundaries` array (e.g., `[0, 10, 50, 100]`).
-   *Range Logic:* Ranges are **left-closed, right-open**:
    -   Bucket 1: `[0, 10)` (matches values from 0 up to 9.999).
    -   Bucket 2: `[10, 50)` (matches values from 10 up to 49.999).
-   *The Default Key:* You must specify a `default` label (like `"Other"`) to catch any values that fall outside your boundaries (e.g., price is 150).

#### 2. `$bucketAuto` (Even Distribution)
You specify *how many* buckets you want (e.g., `buckets: 3`). 

MongoDB analyzes the dataset and dynamically calculates boundaries to split the documents into 3 equal piles.

---

### (3) Reality Metaphor (Mail Weight Classes)
-   **`$bucket` (Custom):** A mail carrier sorting packages using scale slots labeled: **0–10g**, **10–50g**, and **50–100g**. 
    -   They weigh a box. 
    -   If it weighs 15g, they slide it into the second slot. 
    -   If it weighs 200g, they slide it into the `"Heavy/Default"` bin.
-   **`$bucketAuto` (Auto):** Handing a stack of 90 envelopes to a sorting machine and saying: *"Sort these into **3 equal piles of 30 envelopes** based on their weight."* 
    -   The machine weighs them all, determines the average weight thresholds, and separates them.

---

### (4) Code Examples

#### Classifying Prices into Custom Tiers ($bucket)
Let's count how many products fall into our price tiers:

```javascript
db.products.aggregate([
  {
    $bucket: {
      groupBy: "$price",                // Field to evaluate
      boundaries: [ 0, 10, 50, 100 ],   // Tier limits (must be ascending!)
      default: "Premium Tiers",         // Label for prices >= 100
      output: {
        count: { $sum: 1 },             // Accumulator statistics
        items: { $push: "$name" }       // List names of items in the bucket
      }
    }
  }
]);

// Output:
// { "_id": 0,  "count": 1, "items": ["Pen"] }
// { "_id": 10, "count": 1, "items": ["Book"] }
// { "_id": "Premium Tiers", "count": 1, "items": ["Laptop"] }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaring boundaries in a non-ascending sequence, causing query execution crashes

**The mistake:** Setting boundaries like `boundaries: [ 50, 10, 100 ]` in the `$bucket` stage configuration.

**Why it's wrong:** MongoDB requires the `boundaries` array to be sorted in strictly ascending order so it can check ranges sequentially. 

If the numbers are out of order, the query engine throws an immediate error and aborts.

**Fix: Always write boundaries from lowest value to highest: `boundaries: [ 10, 50, 100 ]`.**

---



### Mistake 2: Defining Out-of-Order Range Boundaries in `$bucket` Stage `boundaries` Arrays

**The mistake:** Defining `boundaries: [0, 50, 20, 100]` out of ascending sequence.

**Why it's wrong:** `$bucket` stage `boundaries` array MUST be sorted strictly in ascending numerical order (`[0, 20, 50, 100]`).

*Incorrect:*
```javascript
boundaries: [0, 50, 20, 100] // ❌ Boundaries not in ascending order!
```

*Fix:*
```javascript
boundaries: [0, 20, 50, 100] // Correct ascending numerical boundaries
```

### Mistake 3: Omitting `default` Bucket Identifier for Values Outside Boundary Ranges

**The mistake:** Executing `$bucket` on data containing values greater than the maximum boundary without specifying `default`.

**Why it's wrong:** If a document field value falls outside defined boundaries and no `default` bucket is specified, `$bucket` throws a runtime execution error.

*Incorrect:*
```javascript
boundaries: [0, 100] // Throws error if value is 150!
```

*Fix:*
```javascript
boundaries: [0, 100], default: "Other"
```

## 5. Practice Exercises

### Exercise 1: Categorical Histogram Bucketing with `$bucket`

**Scenario:**
Categorize products into 3 explicit price buckets: `"Budget"` (`0-50`), `"Mid-Range"` (`50-200`), and `"Premium"` (`200+`).

**Requirements:**
1. Use `$bucket` specifying `boundaries: [0, 50, 200, Infinity]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.aggregate([
>   {
>     $bucket: {
>       groupBy: "$price",
>       boundaries: [0, 50, 200, Infinity],
>       default: "Other",
>       output: {
>         count: { $sum: 1 },
>         products: { $push: "$name" }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$bucket` groups documents into explicit user-defined numeric boundaries.
> 2. `boundaries` array defines bucket cut-offs (`[min, max)`).
> 3. Computes histograms for pricing and analytics.
> 
---

### Exercise 2: Automated Equi-Populated Bucketing with `$bucketAuto`

**Scenario:**
Automatically divide customer documents into 4 evenly-distributed quantile buckets based on `totalSpent`.

**Requirements:**
1. Use `$bucketAuto: { groupBy: "$totalSpent", buckets: 4 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.aggregate([
>   {
>     $bucketAuto: {
>       groupBy: "$totalSpent",
>       buckets: 4
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$bucketAuto` automatically calculates bucket boundaries to distribute documents evenly across `n` buckets.
> 2. Eliminates manual boundary guesswork.
> 3. Ideal for statistical quartile and percentile segmentations.
> 
---

### Exercise 3: Bucket Summary Accumulators

**Scenario:**
Compute average order processing time (`$avg`) for each price bucket in collection `orders`.

**Requirements:**
1. Use `output` accumulators inside `$bucket`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $bucket: {
>       groupBy: "$amount",
>       boundaries: [0, 100, 500, 1000],
>       output: {
>         orderCount: { $sum: 1 },
>         avgFulfillmentHours: { $avg: "$fulfillmentHours" }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. The `output` field defines custom accumulators computed for each bucket.
> 2. Calculates metrics across bucket partitions in parallel.
> 3. Streamlines business analytics reporting.
> 
---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [The Bucket Pattern](../level_05/bucket_pattern.md) — The schema design equivalent.

---

## 7. Key Takeaways
- `$bucket` and `$bucketAuto` classify numeric data into range bins.
- Direct NoSQL equivalent to using complex nested SQL `CASE` check statements.
- `$bucket` uses user-defined boundaries; ranges are left-closed, right-open `[left, right)`.
- The boundaries array must be declared in strictly ascending order.
- Define a `default` key to catch values falling outside the boundary ranges.
- `$bucketAuto` dynamically calculates boundaries to split data into equal groups.
- Outputs one consolidated document per range bucket.
