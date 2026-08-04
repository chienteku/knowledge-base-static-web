# `$project` / `$addFields` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to reshape documents, comparing `$project` (which restricts returned fields / whitelists data) with `$addFields` (which injects new computed fields while preserving all other attributes).

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Projection (Concept in CRUD)](../level_03/projection.md) — The whitelisting rules.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed on the database engine. Reshapes the BSON document structures in memory during pipeline steps).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Pipeline Reshape selector

**Problem:** You are building a pipeline. Select the correct stage (**$project** or **$addFields**) for these requirements:
1.  You want to calculate a user's `fullname` by concatenating `first_name` and `last_name`, keeping all their settings, logs, and email fields intact.
2.  You want to strip a heavy document down, returning only `_id` and the calculated `revenue` field to the frontend app.

**Expected output:**
> [!check]- Answer
> ```text
> 1. $addFields: Because you want to inject a new calculated field (`fullname`) while preserving the rest of the document structure (settings, logs, email).
> 2. $project: Because you want to explicitly discard all other fields, whitelisting only `_id` and the new `revenue` field to minimize the network payload.
> ```
> - Determine if the operation requires discarding unspecified fields.
> - Relate this to whitelisting vs. additive behaviors.

---



### Exercise 2: Adding Computed Field with `$addFields`

**Problem:** Add computed field `totalPrice` (`price * qty`) preserving all document fields using `$addFields`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.aggregate([{ $addFields: { totalPrice: { $multiply: ["$price", "$qty"] } } }]);
> ```
> ```javascript
> db.orders.aggregate([
>   {
>     $addFields: {
>       totalPrice: { $multiply: ["$price", "$qty"] }
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$addFields` appends new computed fields without modifying existing document properties.

---

### Exercise 3: Reshaping Output with `$project`

**Problem:** Project document returning ONLY `user_email: "$email"` suppressing `_id`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $project: { _id: 0, user_email: "$email" } }]);
> ```
> ```javascript
> db.users.aggregate([
>   { $project: { _id: 0, user_email: "$email" } }
> ]);
> ```
>
> **Explanation:** `$project` reshapes output documents and renames field paths.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Projection (Concept in CRUD)](../level_03/projection.md) — The whitelisting rules.

---

## 8. Key Takeaways
- `$project` and `$addFields` reshape documents inside aggregation pipelines.
- `$project` operates on a whitelist system, discarding unlisted fields by default.
- `$addFields` adds or modifies fields while preserving all other properties.
- Use `$project` to rename fields or strip payloads before network delivery.
- Use `$addFields` to inject calculated metrics mid-pipeline safely.
- Avoid using `$project` for simple additions, as it leads to accidental data loss.
- Both stages execute in memory during aggregation run loops.
