# `updateOne()` / `updateMany()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to modify specific fields in a single document (`updateOne()`) or multiple matching documents (`updateMany()`), serving as the equivalent of SQL's `UPDATE` statement.

---

## 1. Prerequisites

- [`insertOne()` / `insertMany()`](insert.md) — Creating the documents edited.
- [Query Filter (Filter Document)](query_filter.md) — Specifying which records to target.

---

## 2. Term Category

**CRUD Operation** (Document Update Methods): Update operations (updateOne(), updateMany()) modify specified fields across matching collection documents.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through drivers. Requires using specialized BSON update operators (like `$set`) to perform partial modifications on disk blocks).

### (1) Design Motivation — "Why did we design this?"
In application logic, data is dynamic:
-   A user updates their mailing address.
-   A blog post's read count increments.
-   A store manager marks all products in a category as "discounted."

In PostgreSQL, you write:
`UPDATE users SET status = 'active' WHERE id = 105;`

We designed **`updateOne()`** and **`updateMany()`** to handle database modifications in MongoDB. 

Instead of rewriting the entire document, these methods perform **partial updates**: you target specific fields to modify while leaving the rest of the document untouched, saving disk I/O and network payload sizes.

---

### (2) Single vs. Bulk Modification

#### 1. `updateOne(filter, update)`
Finds the **first** document matching the query filter and applies the update changes.
-   *Best Use Case:* Modifying a specific user's settings, checking off a single task, or updating a record by its unique `_id`.

#### 2. `updateMany(filter, update)`
Finds **all** documents matching the query filter and applies the updates.
-   *Best Use Case:* System-wide changes, like setting `promo: true` for all active customers.

---

### (3) Reality Metaphor
Imagine editing paper folders in a records room:
-   **`updateOne()`:** You say: *"Find the first folder for John Doe. Open it, stamp **'Approved'** on the cover page, and put it back."* (Only one folder is changed).
-   **`updateMany()`:** You say: *"Find every folder located in the 'Pending' drawer. Open them all, stamp **'Archived'** inside, and return them."* (Multiple folders are edited in sequence).

---

### (4) Code Examples

#### 1. Modifying a Single Field (updateOne)
We must use the BSON operator **`$set`** to specify which field changes:

```javascript
db.users.updateOne(
  { email: "alice@company.com" },      // 1. Query Filter
  { $set: { status: "verified" } }     // 2. Update operators
);
```

#### 2. Modifying Multiple Documents (updateMany)
```javascript
// Set status to 'retired' for all users aged 65 and older
db.users.updateMany(
  { age: { $gte: 65 } },
  { $set: { status: "retired" } }
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the update operator ($set) inside the update parameter document

**The mistake:** Running the query `db.users.updateOne({ _id: 1 }, { status: "active" })` to update a user's status.

**Why it's wrong:** The `updateOne()` and `updateMany()` methods **require** explicit BSON update operators (like `$set`, `$unset`, `$inc`). 

If you pass a plain JSON object `{ status: "active" }` as the second argument, the database will throw an immediate query error:
`ERROR: the update operation document must contain atomic operators.`

*(Note: MongoDB enforces this rule to prevent you from accidentally overwriting and deleting all other fields in the document. If you explicitly want to replace the whole document, you must use `replaceOne()` instead!).*

**Fix: Always wrap your modification fields inside the `$set` operator object:**

```javascript
// CORRECT
db.users.updateOne({ _id: 1 }, { $set: { status: "active" } });
```

---





### Mistake 2: Omitting Update Operators (`$set`, `$inc`) in `updateOne()` Calls

**The mistake:** Executing `db.users.updateOne({ _id: id }, { name: "Alice" })`.

**Why it's wrong:** In MongoDB drivers, update documents MUST contain update operators (`$set`, `$inc`, `$push`). Passing plain objects throws an error.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { name: "Alice" }); // ❌ Missing $set operator!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { name: "Alice" } });
```



### Mistake 3: Executing `updateMany()` Without Filter Predicates in Production

**The mistake:** Running `db.users.updateMany({}, { $set: { verified: false } })`.

**Why it's wrong:** Passing an empty filter `{}` updates EVERY document in the collection.

*Incorrect:*
```javascript
db.users.updateMany({}, { $set: { verified: false } }); // 💥 Mutates ALL users!
```

*Fix:*
```javascript
db.users.updateMany({ active: false }, { $set: { verified: false } });
```



## 5. Practice Exercises

### Exercise 1: Single Document Field Update with `updateOne`

**Scenario:**
Update user `user:alice`'s account status to `"verified"` and set `verifiedAt` timestamp.

**Requirements:**
1. Execute `updateOne({ email: "alice@example.com" }, { $set: ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const result = db.users.updateOne(
>   { email: "alice@example.com" },
>   {
>     $set: {
>       status: "verified",
>       verifiedAt: new Date()
>     }
>   }
> );
> console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
> ```
>
> #### Technical Explanation
>
> 1. `updateOne()` modifies at most one matching document.
> 2. `$set` updates specified field values atomically.
> 3. Returns `matchedCount` and `modifiedCount`.
> 
---

### Exercise 2: Multi-Document Mass Update with `updateMany`

**Scenario:**
Mark all pending orders created over 7 days ago as `"expired"`.

**Requirements:**
1. Execute `updateMany({ status: "pending", createdAt: { $lt: sevenDaysAgo } }, { $set: { status: "expired" } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
> 
> const result = db.orders.updateMany(
>   { status: "pending", createdAt: { $lt: sevenDaysAgo } },
>   { $set: { status: "expired" } }
> );
> console.log("Expired Orders Modified:", result.modifiedCount);
> ```
>
> #### Technical Explanation
>
> 1. `updateMany()` modifies all documents matching the query filter.
> 2. Executes atomic write operations document by document.
> 3. Leverages compound index `{ status: 1, createdAt: 1 }`.
> 
---

### Exercise 3: Inspecting Update Acknowledgment Metrics

**Scenario:**
Distinguish between `matchedCount` and `modifiedCount` in write result responses.

**Requirements:**
1. Explain why `modifiedCount` can be 0 when `matchedCount` is 1.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const res = db.users.updateOne(
>   { email: "alice@example.com" },
>   { $set: { status: "active" } }
> );
> console.log(`Matched ${res.matchedCount}, Modified ${res.modifiedCount}`);
> ```
>
> #### Technical Explanation
>
> 1. `matchedCount` counts documents satisfying the query filter.
> 2. `modifiedCount` counts documents whose field values actually changed.
> 3. If target field already equaled the `$set` value, `modifiedCount` is 0 to avoid redundant disk writes.
> 
---



## 6. Related Terms

- [Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)](update_operators.md) — The modification commands.
- [Upsert (`upsert: true`)](upsert.md) — - Dynamic insert on updates.
- [`bulkWrite()`](bulk_write.md) — Related concept: `bulkWrite()`.
- [`findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`](find_and_modify.md) — Related concept: `findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`.
- [`replaceOne()`](replace_one.md) — Related concept: `replaceOne()`.
- [`$set` vs. Whole-Document Replacement](set_vs_replace.md) — Related concept: `$set` vs. Whole-Document Replacement.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — Related concept: Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`).

---

## 7. Key Takeaways
- `updateOne()` modifies the first matching document; `updateMany()` modifies all matches.
- Serves as the MongoDB equivalent to SQL's `UPDATE` statement.
- Requires passing BSON update operators (like `$set`) in the second argument.
- Omitting update operators inside the update document triggers immediate errors.
- Performs fast partial modifications on disk blocks without rewriting whole files.
- Returns a write result object detailing matched and modified counts.
