# `$lookup` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that executes a left outer join with another collection in the same database, serving as the direct equivalent of SQL's `LEFT JOIN` statement.

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — Aggregation pipeline overview.
- [`ObjectId` as a Manual Reference](../level_02/objectid_reference.md) — ObjectId reference fields.
- [Embedding vs. Referencing](../level_05/embedding_vs_referencing.md) — The relational data modeling context.

---

## 2. Term Category

**Aggregation** (Cross-Collection Left Outer Join Stage): The $lookup stage performs a left outer join to combine documents from an un-sharded collection with documents in the pipeline stream.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed on the database server. Joins are processed in the memory engine; using indexes on the target collection's join field is critical to prevent full-collection scans).

### (1) Design Motivation — "Why did we design this?"
While document modeling encourages nesting (embedding) data, you must use **Referencing** for unbounded arrays and many-to-many relationships to avoid hitting the 16MB document limit.

When referencing, you occasionally need to combine data from different collections to compile reports:
-   Displaying an order record alongside the buyer's user details.
-   Listing products alongside their manufacturer details.

In PostgreSQL, you write a join:
`SELECT * FROM orders LEFT JOIN customers ON orders.customer_id = customers.id;`

We designed the **`$lookup`** stage in MongoDB to provide this join capability. 

It queries a target collection, matches keys, and pulls in the related documents, allowing you to resolve relationships during queries.

---

### (2) Basic `$lookup` Syntax
A basic `$lookup` stage requires 4 keys:

```javascript
{
  $lookup: {
    from: "target_collection",   // Collection to join with
    localField: "local_key",      // Key path in the source document
    foreignField: "foreign_key",  // Key path in the target collection
    as: "output_array"            // Field name to write the results into
  }
}
```

-   **The Array Output Constraint:** Even if the relationship is strict 1:1, `$lookup` **always returns the joined documents as a BSON Array**. 
-   If no matches are found, it writes an empty array `[]` (behaving exactly like a SQL Left Outer Join, which preserves the parent row even if the child join is missing).

---

### (3) Reality Metaphor (Filing Clerks)
Imagine an office clerk auditing files:
-   **`$lookup` Stage:** The clerk holds an order folder containing a `customer_id` stamp (`localField`).
    -   They walk to a separate cabinet labeled `"Customers"` (`from`).
    -   They find the user file where the ID matches (`foreignField`).
    -   They make a photocopy of the customer file and place the copy inside a new **Plastic Sleeve Sleeve** labeled `"customer_info"` (`as` array) inside the order folder.

---

### (4) Code Examples

#### Joining Orders to Customers
Let's link orders to their buyers:

```javascript
db.orders.aggregate([
  // Join orders with the customers collection
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_details"
    }
  }
]);

// Output:
// {
//   "_id": 500,
//   "amount": 99.99,
//   "customer_id": ObjectId("60c72b2f9b1d8b2e88a8d111"),
//   "customer_details": [ // Note: returned as an array!
//     { "_id": ObjectId("..."), "name": "Alice Smith" }
//   ]
// }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that $lookup always returns an array, and failing to flatten it for 1:1 lookups

**The mistake:** Running a `$lookup` to join a customer to an order, and immediately trying to access their name in your backend template using `order.customer_details.name` (which returns `undefined` because `customer_details` is an array).

**Why it's wrong:** As shown in the Code Example output, `$lookup` writes an array `[ { ... } ]`. 

To access fields inside the object directly, you must flatten the array first.

**Fix: Append an `$unwind` stage immediately after the `$lookup` stage to deconstruct the array into a flat subdocument object.**

```javascript
// CORRECT
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_details"
    }
  },
  // Flatten array to a single object:
  { $unwind: "$customer_details" } 
]);
// Now customer_details is flat: { "customer_details": { "name": "Alice" } }
```

---



### Mistake 2: Executing `$lookup` Left Outer Joins on Un-Indexed `foreignField` Keys

**The mistake:** Executing `db.orders.aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }])` without an index on `users._id`.

**Why it's wrong:** Un-indexed `$lookup` operations execute a full collection scan on the joined collection FOR EVERY SINGLE DOCUMENT in the source pipeline, causing severe latency.

*Incorrect:*
```javascript
// Executing $lookup without index on foreignField
```

*Fix:*
```javascript
db.users.createIndex({ _id: 1 }); // Ensure foreignField is indexed!
```

### Mistake 3: Expecting `$lookup` to Return Single Objects instead of Array Objects

**The mistake:** Expecting `order.user.name` directly after `$lookup` without unwinding.

**Why it's wrong:** `$lookup` ALWAYS returns an array of matched documents in the `as` field (even for 1-to-1 relationships). Use `$unwind: "$user"` or `$arrayElemAt` to convert array to single object.

*Incorrect:*
```javascript
const name = doc.user.name; // ❌ doc.user is an array [{ name: 'Alice' }]!
```

*Fix:*
```javascript
db.orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $unwind: "$user" }
]);
```

## 5. Practice Exercises

### Exercise 1: Single-Field Un-Sharded Join with `$lookup`

**Scenario:**
Join collection `orders` with collection `users` on `customerId` = `users._id` to populate customer details.

**Requirements:**
1. Use `$lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $lookup: {
>       from: "users",
>       localField: "customerId",
>       foreignField: "_id",
>       as: "customerDetails"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$lookup` performs left outer equality joins against target collections.
> 2. `as` specifies the output array field where matched target documents are stored.
> 3. Requires an index on `foreignField` (`users._id`) for fast $O(\log N)$ join execution.

---

### Exercise 2: Correlated Subqueries with Pipelines in `$lookup`

**Scenario:**
Join `customers` with `orders`, filtering joined orders to include ONLY those with `total > 100` and `status: "completed"`.

**Requirements:**
1. Use `$lookup` with `let` and nested `pipeline`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.aggregate([
>   {
>     $lookup: {
>       from: "orders",
>       let: { custId: "$_id" },
>       pipeline: [
>         {
>           $match: {
>             $expr: {
>               $and: [
>                 { $eq: ["$customerId", "$$custId"] },
>                 { $eq: ["$status", "completed"] },
>                 { $gt: ["$total", 100] }
>               ]
>             }
>           }
>         }
>       ],
>       as: "largeCompletedOrders"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `let` binds local pipeline fields to variables (`$$custId`).
> 2. `pipeline` executes custom aggregation stages on target collection documents before joining.
> 3. Reduces joined payload size server-side.

---

### Exercise 3: Unwrapping Joined Array Results with `$unwind`

**Scenario:**
Flatten the 1-element `customerDetails` array returned by `$lookup` into a single embedded subdocument.

**Requirements:**
1. Chain `$unwind: "$customerDetails"` after `$lookup`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $lookup: {
>       from: "users",
>       localField: "customerId",
>       foreignField: "_id",
>       as: "customer"
>     }
>   },
>   { $unwind: "$customer" }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$lookup` always outputs matching documents inside an array field.
> 2. `$unwind` transforms 1-element arrays into direct embedded subdocument objects.
> 3. Simplifies downstream field access.

---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$unwind` Stage](unwind_stage.md) — The array flattening tool.
- [Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`)](aggregation_variables.md) — Related concept: Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`).
- [`$graphLookup` Stage](graph_lookup.md) — Related concept: `$graphLookup` Stage.
- [Embedding vs. Referencing](../level_05/embedding_vs_referencing.md) — Referencing documents.

---

## 7. Key Takeaways
- `$lookup` performs left outer joins between collections in a database.
- Direct NoSQL equivalent to SQL's `LEFT JOIN` statement.
- Always returns matching documents as a BSON array inside the parent.
- If no matches are found, it outputs an empty array `[]` without dropping the document.
- Append `$unwind` immediately after `$lookup` to flatten 1:1 relations.
- Ensure the target `foreignField` has an index to prevent slow collection scans.
- Use advanced `$lookup` with sub-pipelines for complex conditional joins.
