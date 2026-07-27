# `$unwind` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that deconstructs an array field from input documents, outputting one clone document for every individual element inside the array, enabling aggregation operations over array values.

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Array](../level_02/array_type.md) — The array structure flattened.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed in memory. Multiplies the number of documents in the pipeline stream, which temporarily increases the memory footprint during execution).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems, tables are flat. 

If you want to count tag popularity in SQL, you query a junction table where every row is already a single tag link.

In MongoDB, document fields can natively store list arrays:
`{ name: "Sneakers", tags: ["shoes", "clothing"] }`

If you try to run an aggregation query to count tag frequencies:
-   If you group by `tags`: `{ $group: { _id: "$tags" } }`
-   MongoDB groups by the **entire array** as a single value. 
-   It treats `["shoes", "clothing"]` as a single group, separate from `["shoes"]`, yielding incorrect tag counts.

We designed the **`$unwind`** stage to solve this array grouping problem. 

It splits the array field. 

For every element in the array, `$unwind` outputs a **duplicate clone of the parent document**, replacing the array field with that single element. 

This flattens the data, allowing you to run standard `$group` operations on the individual elements.

---

### (2) The Empty Array Gotcha
By default, if a document contains an **empty array `[]`**, a `null` value, or is **missing the array field entirely**:
-   `$unwind` will **discard** that document from the pipeline stream.
-   This can lead to missing data on reports.

To prevent this, you can pass the options format:
`{ $unwind: { path: "$arrayField", preserveNullAndEmptyArrays: true } }`

---

### (3) Reality Metaphor (Trading Card Packs)
Imagine sorting trading cards:
-   **Input Document:** A sealed **Cardboard Wrapper containing 3 cards**. You hold a single package.
-   **`$unwind` Stage:** Tearing open the cardboard wrapper and laying the **3 individual cards side-by-side** on the counter. 
    -   You now have 3 separate items to sort, count, or trade. 
    -   The wrapper (the array shell) is gone, and the cards are flat.

---

### (4) Code Examples

#### Splitting and Grouping Arrays (Unwind + Group)
Let's calculate the frequency of category tags across all products:

```javascript
db.products.insertMany([
  { name: "Shirt", tags: ["clothing", "red"] },
  { name: "Jeans", tags: ["clothing", "blue"] }
]);

// Run aggregation
db.products.aggregate([
  // 1. Unwind: Splits array, outputting 4 documents in the stream!
  {
    $unwind: "$tags" // Note the '$' prefix!
  },
  // 2. Group: Count the frequency of each tag
  {
    $group: {
      _id: "$tags",
      count: { $sum: 1 }
    }
  }
]);

// Output:
// { "_id": "clothing", "count": 2 }
// { "_id": "red",      "count": 1 }
// { "_id": "blue",     "count": 1 }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that $unwind discards documents with empty or missing arrays by default, leading to missing data in reports

**The mistake:** Running a pipeline that unwinds a user's `hobbies` array to group them, only to discover that users who have no hobbies are completely missing from the final aggregate report.

**Why it's wrong:** The default behavior of `$unwind` filters out empty array paths. 

If a document has `hobbies: []` or is missing the `hobbies` key, it is purged from the pipeline stream, skewing your reporting totals.

**Fix: Use the expanded object syntax with the `preserveNullAndEmptyArrays: true` option to keep documents with empty or missing arrays in the stream:**

```javascript
// CORRECT
db.users.aggregate([
  {
    $unwind: {
      path: "$hobbies",
      preserveNullAndEmptyArrays: true
    }
  }
]);
```

---



### Mistake 2: Dropping Documents with Empty or Missing Array Fields when Using `$unwind`

**The mistake:** Running `db.posts.aggregate([{ $unwind: "$tags" }])` expecting documents with `tags: []` to remain.

**Why it's wrong:** By default, `$unwind` DROPS documents where the target array is `null`, missing, or empty `[]`! Pass `{ preserveNullAndEmptyArrays: true }` to keep empty array documents.

*Incorrect:*
```javascript
db.posts.aggregate([{ $unwind: "$tags" }]); // ❌ Drops posts with empty tags array!
```

*Fix:*
```javascript
db.posts.aggregate([{ $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } }]);
```

### Mistake 3: Forgetting `$` Prefix in `$unwind` Field Path Parameter

**The mistake:** Executing `db.posts.aggregate([{ $unwind: "tags" }])` without `$` prefix.

**Why it's wrong:** `$unwind` strictly expects a field path string starting with `$` (e.g. `"$tags"`). Omitting `$` throws a stage parsing error.

*Incorrect:*
```javascript
db.posts.aggregate([{ $unwind: "tags" }]); // ❌ Missing $ prefix!
```

*Fix:*
```javascript
db.posts.aggregate([{ $unwind: "$tags" }]); // Correct $tags path
```

## 6. Practice Exercises

### Exercise 1: Unwind Pipeline Formulation

**Problem:** You have a `recipes` collection. Each recipe contains an array field named `ingredients`. Write the aggregation pipeline containing:
1.  A stage to deconstruct the `ingredients` array (using `$unwind`).
2.  A stage to group the results by ingredient name (`_id`), counting the total number of recipes that use each ingredient (using `$sum`).

**Expected output:**
```javascript
[
  {
    $unwind: "$ingredients"
  },
  {
    $group: {
      _id: "$ingredients",
      recipe_count: { $sum: 1 }
    }
  }
]
```

> [!check]- Answer
> - Prefix the array field path with `$` inside the `$unwind` stage.
> - The grouped identifier key `_id` must match the unwound value path.

---



### Exercise 2: Deconstructing Array with `$unwind`

**Problem:** Deconstruct `items` array in `orders` collection into individual document streams.

**Expected output:**
```text
db.orders.aggregate([{ $unwind: "$items" }]);
```

> [!check]- Answer
> ```javascript
> db.orders.aggregate([
>   { $unwind: "$items" }
> ]);
> ```
>
> **Explanation:** `$unwind` outputs one document for each element in the specified array field.

### Exercise 3: Preserving Empty Arrays and Index Tracking

**Problem:** Unwind `comments` array preserving empty arrays and tracking index numbers in `commentIndex`.

**Expected output:**
```text
db.posts.aggregate([{ $unwind: { path: "$comments", includeArrayIndex: "commentIndex", preserveNullAndEmptyArrays: true } }]);
```

> [!check]- Answer
> ```javascript
> db.posts.aggregate([
>   {
>     $unwind: {
>       path: "$comments",
>       includeArrayIndex: "commentIndex",
>       preserveNullAndEmptyArrays: true
>     }
>   }
> ]);
> ```
>
> **Explanation:** `includeArrayIndex` attaches original array element position numbers to unwound documents.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Array](../level_02/array_type.md) — The data structure.

---

## 8. Key Takeaways
- `$unwind` flattens BSON array fields into individual stream documents.
- Creates one clone document copy per array element.
- Essential for running `$group` calculations on array values.
- Always prefix the target array path with `$` (e.g. `"$tags"`).
- Empty arrays `[]` or missing fields are discarded by default.
- Set `preserveNullAndEmptyArrays: true` to prevent data loss.
- Temporarily increases document count during processing.
