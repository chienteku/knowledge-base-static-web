# `$set` / `$unset` Pipeline Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to add fields (`$set`, an alias for `$addFields`) or remove fields (`$unset`, an alias for field exclusion in `$project`) in memory, and their critical distinction from update operators.

---

## 1. Prerequisites
- [`$project` / `$addFields` Stages](project_addfields.md) — The parent reshaping stages.
- [Update Operators (`$set`, `$unset`, etc.)](../level_03/update_operators.md) — The write operators sharing names.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Introduced in MongoDB 4.2 to provide readable stage names. Evaluated in the aggregation memory executor).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In MongoDB development, the terms `$set` and `$unset` wear **two completely different hats.** 

This is the single most common source of confusion for developers reading tutorials:
-   *Hat A:* **Update Operators** used in `updateOne()` to rewrite data on disk.
-   *Hat B:* **Aggregation Pipeline Stages** used in `aggregate()` to reshape data in memory.

MongoDB 4.2 introduced the `$set` and `$unset` aggregation stages as **aliases (alternative names)** for `$addFields` and `$project` to make pipelines easier to read. 

However, because they share names with the update operators, developers often confuse their behaviors.

---

### (2) The Critical Difference

| Dimension | Update Operator (`$set`) | Aggregation Stage (`$set`) |
| :--- | :--- | :--- |
| **Command Context** | `db.collection.updateOne(..., { $set: ... })` | `db.collection.aggregate([ { $set: ... } ])` |
| **Target Location** | **Disk Storage** (modifies BSON file bytes). | **Server RAM Cache** (modifies in-memory stream). |
| **Disk Persistence** | **Yes** (modifies data permanently). | **No** (read-only snapshot, does not modify collections). |
| **Stage Alias** | *None* | Alias for **`$addFields`**. |
| **SQL Equivalent** | `UPDATE table SET column = value` | `SELECT (column + X) AS alias` |

---

### (3) Reality Metaphor (Birth Certificates)
-   **Update Operator `$set`:** You grab the **Original Paper Birth Certificate** from the metal vault. You take a pen and physically cross out the name and write a new one on the page. The official document is permanently altered.
-   **Aggregation Stage `$set`:** You make a **Paper Photocopy** of the birth certificate. You take a pencil and write "Pending Review" on the photocopy. 
    -   The original certificate in the vault remains completely untouched. 
    -   You only modified the temporary copy in your hand.

---

### (4) Code Examples

#### Reshaping mid-pipeline using Aggregation `$set` / `$unset`
Let's modify the fields of documents flowing through our pipeline in memory:

```javascript
db.products.aggregate([
  // Stage 1: Add calculated fields (identical to $addFields)
  {
    $set: {
      sales_tax: { $multiply: [ "$price", 0.1 ] },
      total_price: { $add: [ "$price", { $multiply: [ "$price", 0.1 ] } ] }
    }
  },
  // Stage 2: Discard internal fields (identical to $project exclusion)
  {
    $unset: [ "internal_sku", "supplier_details" ] // Takes an array of strings
  }
]);

// Original documents on disk remain completely unmodified!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming that running an aggregation pipeline containing a '$set' stage will modify the documents stored in the collection

**The mistake:** Running the query `db.users.aggregate([ { $set: { status: "active" } } ])` expecting to update all users in the database.

**Why it's wrong:** Aggregations are read-only pipeline operations. 

They query and transform data, presenting the modified photocopy to your application code. 

They do **not** write changes back to the collection on disk (unless the pipeline ends with the specialized `$out` or `$merge` stages).

**Fix: To permanently update documents in a collection, use `updateOne()` or `updateMany()`. Use aggregation `$set` strictly for in-memory calculations.**

---



### Mistake 2: Using `$unset` with Number Identifiers Instead of String Field Names

**The mistake:** Writing `$unset: { tempField: 0 }` expecting standard projection syntax.

**Why it's wrong:** `$unset` accepts string field name arrays `"tempField"` or `["f1", "f2"]`.

*Incorrect:*
```javascript
db.users.aggregate([{ $unset: { tempField: 0 } }]); // Invalid unset syntax
```

*Fix:*
```javascript
db.users.aggregate([{ $unset: "tempField" }]); // Correct string syntax
```

### Mistake 3: Confusing Aggregation Stage `$set` with Update Operator `$set`

**The mistake:** Calling `db.users.updateOne({ _id: 1 }, { $set: { field: val } })` expecting it to run as an aggregation stage.

**Why it's wrong:** Aggregation stage `$set` is an alias for `$addFields` inside aggregation pipelines. Update operator `$set` is used inside update commands.

*Incorrect:*
```javascript
// Confusing aggregation stage $set with update operator $set
```

*Fix:*
```javascript
Use $set as an alias for $addFields inside aggregate([ { $set: { ... } } ]) pipelines
```

## 6. Practice Exercises

### Exercise 1: Context Identification

**Problem:** Identify the context (**Update Operator** or **Aggregation Stage**) for the `$set` keyword in these two queries:
1.  `db.logs.aggregate([ { $set: { viewed: true } } ])`
2.  `db.logs.updateMany({}, { $set: { viewed: true } })`
State which query alters data on disk.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Aggregation Stage: Modifies the `viewed` field to `true` in memory only as the documents flow through the pipeline. Does not alter data on disk.
> 2. Update Operator: Modifies the `viewed` field permanently on disk for all documents in the collection.
> ```
> - Inspect the method names `aggregate` and `updateMany`.
> - Relate this back to disk persistence behaviors.

---



### Exercise 2: Setting Computed Field with Aggregation `$set`

**Problem:** Set computed boolean field `isAdult` (`age >= 18`) using `$set` stage.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $set: { isAdult: { $gte: ["$age", 18] } } }]);
> ```
> ```javascript
> db.users.aggregate([
>   { $set: { isAdult: { $gte: ["$age", 18] } } }
> ]);
> ```
>
> **Explanation:** Aggregation `$set` stage appends computed fields while preserving existing document fields.

---

### Exercise 3: Removing Temporary Fields with `$unset`

**Problem:** Remove temporary processing fields `tempHash` and `internalId` using `$unset` stage.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $unset: ["tempHash", "internalId"] }]);
> ```
> ```javascript
> db.users.aggregate([
>   { $unset: ["tempHash", "internalId"] }
> ]);
> ```
>
> **Explanation:** `$unset` stage strips specified fields from pipeline document streams.

## 7. Related Terms
- [`$project` / `$addFields` Stages](project_addfields.md) — The parent reshaping stages.
- [Update Operators (`$set`, `$unset`, etc.)](../level_03/update_operators.md) — The write operators.

---

## 8. Key Takeaways
- `$set` and `$unset` can act as update operators or aggregation stages.
- Aggregation `$set` is an alias for `$addFields`; aggregates in memory.
- Aggregation `$unset` is an alias for `$project` exclusions; deletes fields in memory.
- Aggregation stages do not alter data on disk (unless paired with `$out` / `$merge`).
- Update operators (`updateOne`) permanently rewrite database files on disk.
- Aggregation stages support complex mathematical calculations.
- Distinguish the method context (`aggregate` vs `update`) to prevent bugs.
