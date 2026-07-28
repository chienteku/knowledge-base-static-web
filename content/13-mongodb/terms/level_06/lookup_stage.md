# `$lookup` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that executes a left outer join with another collection in the same database, serving as the direct equivalent of SQL's `LEFT JOIN` statement.

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Embedding vs. Referencing](../../level_05/embedding_vs_referencing.md) — The relational data modeling context.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed on the database server. Joins are processed in the memory engine; using indexes on the target collection's join field is critical to prevent full-collection scans).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Lookup and Flatten Pipeline

**Problem:** You have a `books` collection that references an `authors` collection (via the `author_id` field). 
Write the aggregation pipeline containing:
1.  A `$lookup` stage joining the `authors` collection to retrieve the author details under the array name `author_info`.
2.  An `$unwind` stage to flatten the `author_info` array.

**Expected output:**
> [!check]- Answer
> ```javascript
> [
>   {
>     $lookup: {
>       from: "authors",
>       localField: "author_id",
>       foreignField: "_id",
>       as: "author_info"
>     }
>   },
>   {
>     $unwind: "$author_info"
>   }
> ]
> ```
> - The target collection in the lookup is `"authors"`.
> - Apply the `$unwind` stage to the output field `"author_info"`.

---



### Exercise 2: Basic Left Outer Join with `$lookup`

**Problem:** Join `orders` to `users` matching `orders.userId` to `users._id` outputting array `userInfo`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userInfo" } }]);
> ```
> ```javascript
> db.orders.aggregate([
>   {
>     $lookup: {
>       from: "users",
>       localField: "userId",
>       foreignField: "_id",
>       as: "userInfo"
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$lookup` performs left outer joins between target database collections.

---

### Exercise 3: Correlated Subquery `$lookup` Pipeline

**Problem:** Join `orders` to `items` using custom pipeline with `$match` and `$expr`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.aggregate([{ $lookup: { from: "items", let: { orderId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$orderId", "$$orderId"] } } }], as: "items" } }]);
> ```
> ```javascript
> db.orders.aggregate([
>   {
>     $lookup: {
>       from: "items",
>       let: { orderId: "$_id" },
>       pipeline: [
>         { $match: { $expr: { $eq: ["$orderId", "$$orderId"] } } }
>       ],
>       as: "items"
>     }
>   }
> ]);
> ```
>
> **Explanation:** Pipeline `$lookup` executes complex correlated subqueries on joined collections.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$unwind` Stage](unwind_stage.md) — The array flattening tool.

---

## 8. Key Takeaways
- `$lookup` performs left outer joins between collections in a database.
- Direct NoSQL equivalent to SQL's `LEFT JOIN` statement.
- Always returns matching documents as a BSON array inside the parent.
- If no matches are found, it outputs an empty array `[]` without dropping the document.
- Append `$unwind` immediately after `$lookup` to flatten 1:1 relations.
- Ensure the target `foreignField` has an index to prevent slow collection scans.
- Use advanced `$lookup` with sub-pipelines for complex conditional joins.
