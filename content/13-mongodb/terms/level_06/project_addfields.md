# `$project` / `$addFields` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to reshape documents, comparing `$project` (which restricts returned fields / whitelists data) with `$addFields` (which injects new computed fields while preserving all other attributes).

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Projection](../level_03/projection.md) — The whitelisting rules.

---

## 2. Term Category

**Aggregation** (Document Reshaping Stages): The $project and $addFields stages reshape output documents by including, excluding, computing, or modifying fields.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed on the database engine. Reshapes the BSON document structures in memory during pipeline steps).

### (1) Design Motivation — "Why did we design this?"
During data processing inside an aggregation pipeline, documents need to be reshaped for frontend rendering:
-   Renaming database-specific fields to user-friendly titles (e.g. changing `cust_id` to `customerId`).
-   Injecting computed values (e.g. multiplying `price` by `quantity` to calculate `total_cost`).
-   Filtering out heavy nested fields to reduce network payloads.

In SQL, you handle this in the SELECT statement:
`SELECT username, (price * qty) AS total FROM sales;`

We designed **`$project`** and **`$addFields`** to handle this in MongoDB pipelines. 

They allow you to reshape, calculate, and rename fields mid-pipeline, keeping data payloads clean.

---

### (2) `$project` vs. `$addFields` Contrast

#### 1. `$project` (The Whitelist Filter)
Reshapes the document by specifying which fields to include, exclude, or rename.
-   *Behavior:* **Discard by default.** If you write `{ $project: { name: 1 } }`, every other field in the document (age, email, settings) is deleted.
-   *Best Use Case:* Preparing the final stage of a pipeline to send a minimal payload over the network.

#### 2. `$addFields` (The Additive Injector)
Adds new fields or overwrites existing fields, **leaving all other fields untouched.**
-   *Behavior:* **Preserve by default.** It does not delete any sibling fields.
-   *Best Use Case:* Injecting a computed column (like a tax calculation) mid-pipeline while keeping the original document intact.

---

### (3) Reality Metaphor (The Carpenter's Shop)
Imagine modifying a wooden birdhouse:
-   **`$project`:** Placing the birdhouse in a lathe machine, **carving it down**, and discarding all shaved wood chips. Only the carved cylinder face remains. (Whitelisting).
-   **`$addFields`:** Taking the birdhouse and **taping a post-it note** (the computed field) onto its side. The birdhouse's original structure, walls, and features remain completely untouched.

---

### (4) Code Examples

#### The $project Trap (Accidental Field Loss)
Suppose we have a document: `{ name: "Laptop", price: 1000, category: "tech" }`.

If we use `$project` to calculate tax:

```javascript
db.products.aggregate([
  {
    $project: {
      tax: { $multiply: [ "$price", 0.1 ] }
    }
  }
]);
// Output: Wipes out 'name' and 'category'!
// { "_id": 1, "tax": 100 }
```

#### The $addFields Solution (Preserves Sibling Fields)
If we use `$addFields` instead:

```javascript
db.products.aggregate([
  {
    $addFields: {
      tax: { $multiply: [ "$price", 0.1 ] }
    }
  }
]);
// Output: Keeps 'name' and 'category'!
// { "_id": 1, "name": "Laptop", "price": 1000, "category": "tech", "tax": 100 }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using '$project' to append a single computed field, accidentally discarding all other document fields

**The mistake:** Running a `$project` stage to add a `formatted_date` field, only to discover that the user's name, email, and address arrays have vanished from the pipeline results.

**Why it's wrong:** As shown in the Laptop example, `$project` operates as a strict whitelist. 

Any field not explicitly marked `1` (or calculated) is dropped.

**Fix: If you want to add fields while keeping the rest of the document structure, always use `$addFields` instead of `$project`.**

---



### Mistake 2: Using `$project` When Adding Fields Wiping Un-Mentioned Document Fields

**The mistake:** Using `$project` to compute a new field `fullName` and accidentally wiping all 20 other document fields.

**Why it's wrong:** `$project` excludes all fields not explicitly listed! Use `$addFields` or `$set` to append computed fields while preserving all existing document properties.

*Incorrect:*
```javascript
db.users.aggregate([{ $project: { fullName: { $concat: ["$first", " ", "$last"] } } }]); // ❌ Wipes all other fields!
```

*Fix:*
```javascript
db.users.aggregate([{ $addFields: { fullName: { $concat: ["$first", " ", "$last"] } } }]); // Preserves fields
```

### Mistake 3: Mixing Field Inclusion `1` and Exclusion `0` inside `$project`

**The mistake:** Writing `$project: { name: 1, age: 0 }`.

**Why it's wrong:** In `$project` stages, you cannot mix inclusion `1` and exclusion `0` flags (except suppressing `_id: 0`).

*Incorrect:*
```javascript
db.users.aggregate([{ $project: { name: 1, age: 0 } }]); // ❌ Cannot mix 1 and 0!
```

*Fix:*
```javascript
db.users.aggregate([{ $project: { name: 1, _id: 0 } }]);
```

## 5. Practice Exercises

### Exercise 1: Appending Derived Fields with `$addFields`

**Scenario:**
Add a calculated `totalPrice` field (`price + shipping`) to product documents while retaining all original document fields.

**Requirements:**
1. Use `$addFields: { totalPrice: { $add: ["$price", "$shipping"] } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.aggregate([
>   {
>     $addFields: {
>       totalPrice: { $add: ["$price", "$shipping"] }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$addFields` appends new calculated fields or modifies existing fields without removing unmentioned document keys.
> 2. Replaces verbose `$project` stages when existing fields must be preserved.
> 3. Simplifies pipeline syntax.
> 
---

### Exercise 2: Shaping Output Documents with `$project`

**Scenario:**
Project user documents returning ONLY `fullName` (concatenated `firstName` and `lastName`) and `email`, explicitly omitting `_id`.

**Requirements:**
1. Use `$project` with `$concat`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   {
>     $project: {
>       _id: 0,
>       email: 1,
>       fullName: { $concat: ["$firstName", " ", "$lastName"] }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$project` explicitly specifies which fields to include, exclude, or compute in output streams.
> 2. Unmentioned fields are omitted from output documents.
> 3. Optimizes client response payload structures.
> 
---

### Exercise 3: Overwriting Existing Fields with `$set`

**Scenario:**
Overwrite existing string field `status` with its uppercase equivalent using pipeline `$set`.

**Requirements:**
1. Use `$set: { status: { $toUpper: "$status" } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $set: {
>       status: { $toUpper: "$status" }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$set` is an alias for `$addFields`.
> 2. Overwrites matching field names with computed expression values.
> 3. Standard stage for field normalization.
> 
---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Projection](../level_03/projection.md) — The whitelisting rules.
- [Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`)](expression_operators.md) — Related concept: Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`).
- [`$replaceRoot` / `$replaceWith` Stages](replace_root.md) — Related concept: `$replaceRoot` / `$replaceWith` Stages.
- [`$set` / `$unset` Pipeline Stages](set_unset_stages.md) — Related concept: `$set` / `$unset` Pipeline Stages.

---

## 7. Key Takeaways
- `$project` and `$addFields` reshape documents inside aggregation pipelines.
- `$project` operates on a whitelist system, discarding unlisted fields by default.
- `$addFields` adds or modifies fields while preserving all other properties.
- Use `$project` to rename fields or strip payloads before network delivery.
- Use `$addFields` to inject calculated metrics mid-pipeline safely.
- Avoid using `$project` for simple additions, as it leads to accidental data loss.
- Both stages execute in memory during aggregation run loops.
