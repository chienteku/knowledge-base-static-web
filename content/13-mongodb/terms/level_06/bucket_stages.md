# `$bucket` / `$bucketAuto` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to classify documents into numeric range groups, comparing `$bucket` (which uses custom boundaries) with `$bucketAuto` (which automatically calculates boundaries to distribute documents evenly).

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [The Bucket Pattern](../../level_05/bucket_pattern.md) — The storage-level bucketing concept.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed in the aggregation processing engine. Evaluates numeric ranges in memory to generate histograms and distribution tables).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Age Bucket Construction

**Problem:** You have a `users` collection. Write the aggregation pipeline stage to group users into three age buckets:
-   Young: `[0, 18)` (under 18)
-   Adult: `[18, 65)` (18 to 64)
-   Senior: `[65, 120)` (65 and older)
-   Assign users outside this range to the default category `"Invalid Age"`.

**Expected output:**
> [!check]- Answer
> ```javascript
> {
>   $bucket: {
>     groupBy: "$age",
>     boundaries: [ 0, 18, 65, 120 ],
>     default: "Invalid Age"
>   }
> }
> ```
> - The grouping target is the `$age` field.
> - Arrange the boundaries list in ascending order: `[0, 18, 65, 120]`.

---



### Exercise 2: Categorizing Prices into Price Buckets

**Problem:** Bucket products by `price` into ranges `[0, 50, 100, 200]` counting items per bucket using `$bucket`.

**Expected output:**
> [!check]- Answer
> ```text
> db.products.aggregate([{ $bucket: { groupBy: "$price", boundaries: [0, 50, 100, 200], default: "200+", output: { count: { $sum: 1 } } } }]);
> ```
> ```javascript
> db.products.aggregate([
>   {
>     $bucket: {
>       groupBy: "$price",
>       boundaries: [0, 50, 100, 200],
>       default: "200+",
>       output: { count: { $sum: 1 } }
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$bucket` categorizes incoming documents into defined numerical range buckets.

---

### Exercise 3: Automatic Histogram Bucket Generation with `$bucketAuto`

**Problem:** Automatically divide products into 5 equal-sized price buckets using `$bucketAuto`.

**Expected output:**
> [!check]- Answer
> ```text
> db.products.aggregate([{ $bucketAuto: { groupBy: "$price", buckets: 5 } }]);
> ```
> ```javascript
> db.products.aggregate([
>   { $bucketAuto: { groupBy: "$price", buckets: 5 } }
> ]);
> ```
>
> **Explanation:** `$bucketAuto` automatically calculates bucket range boundaries to distribute documents evenly.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [The Bucket Pattern](../../level_05/bucket_pattern.md) — The schema design equivalent.

---

## 8. Key Takeaways
- `$bucket` and `$bucketAuto` classify numeric data into range bins.
- Direct NoSQL equivalent to using complex nested SQL `CASE` check statements.
- `$bucket` uses user-defined boundaries; ranges are left-closed, right-open `[left, right)`.
- The boundaries array must be declared in strictly ascending order.
- Define a `default` key to catch values falling outside the boundary ranges.
- `$bucketAuto` dynamically calculates boundaries to split data into equal groups.
- Outputs one consolidated document per range bucket.
