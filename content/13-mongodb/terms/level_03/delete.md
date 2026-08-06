# `deleteOne()` / `deleteMany()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to delete a single matching document (`deleteOne()`) or multiple matching documents (`deleteMany()`) from a collection, serving as the equivalent of SQL's `DELETE` statement.

---

## 1. Prerequisites

- [Query Filter (Filter Document)](query_filter.md) — Defining which records are deleted.

---

## 2. Term Category

**CRUD Operation** (Document Removal Methods): Delete operations (deleteOne(), deleteMany()) remove matching documents from a collection permanently.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through drivers. Frees storage block allocations on disk, creating dead space marked as reusable by the storage engine).

### (1) Design Motivation — "Why did we design this?"
To maintain database hygiene and comply with privacy regulations (like GDPR), applications must support deleting data:
-   A user deletes their account.
-   A system cleanup script purges logs older than 30 days.
-   A store manager removes a discontinued product line.

In PostgreSQL, you use the standard SQL statement:
`DELETE FROM logs WHERE status = 'expired';`

We designed **`deleteOne()`** and **`deleteMany()`** to handle deletions in MongoDB. 

You pass a standard Query Filter object into the method, and MongoDB purges the matching BSON records from disk.

---

### (2) Single vs. Bulk Deletion

#### 1. `deleteOne(filter)`
Finds the **first** document matching the query filter and deletes it.
-   *Best Use Case:* Safely deleting a single record, such as removing a user by their unique `_id`.

#### 2. `deleteMany(filter)`
Finds **all** documents matching the query filter and deletes them.
-   *Best Use Case:* Bulk cleanup scripts, like clearing out temporary test data.

---

### (3) Empty Filter Warning
Running the command with an empty filter:
`db.users.deleteMany({})`

Instructs MongoDB to match every document. 

**This will delete every single document in the collection**, emptying the table.

---

### (4) Reality Metaphor
Imagine managing paper folders in an office:
-   **`deleteOne()`:** You locate the first folder labeled `"Bob"`, pull it from the drawer, and feed it into the **paper shredder**. (Only one folder is destroyed).
-   **`deleteMany()`:** You sweep the drawer, pull out **every folder containing an 'Expired' status sheet**, and dump the entire stack into the incinerator bin.

---

### (5) Code Examples

#### 1. Deleting a Single User by ID (deleteOne)
```javascript
db.users.deleteOne({ _id: ObjectId("65fc71239b1d8b2e88a8d111") });
// Output: { acknowledged: true, deletedCount: 1 }
```

#### 2. Purging Expired Logs (deleteMany)
Delete all logs created more than 30 days ago:

```javascript
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() - 30); // 30 days ago

db.logs.deleteMany({
  created_at: { $lt: expiryDate }
});
// Output: { acknowledged: true, deletedCount: 1540 }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Running deleteMany() in production without verifying the query filter first using find()

**The mistake:** Running a delete command with a typo in the filter, like `db.orders.deleteMany({ status: "cancled" })` (spelled incorrectly), resulting in zero deletions or deleting the wrong records because of bad logic.

**Why it's wrong:** Deletions in MongoDB are immediate and irreversible (unless you restore from backups). 

If you make a logic error in your query filter, you can wipe out millions of active transactions or users in a fraction of a second.

**Fix: Before running any `deleteMany()` command, copy the query filter and run it inside `db.collection.find()` first. Verify the matching documents list visually to confirm they are indeed the target documents you wish to delete, and then execute the delete command.**

---





### Mistake 2: Executing `deleteMany({})` Without Filter Objects in Production

**The mistake:** Running `db.users.deleteMany({})` expecting to delete a single document.

**Why it's wrong:** `deleteMany({})` with an empty filter object deletes EVERY document in the collection!

*Incorrect:*
```javascript
db.users.deleteMany({}); // 💥 Wipes entire collection data!
```

*Fix:*
```javascript
db.users.deleteOne({ _id: id }); // Targets single specific document ID
```



### Mistake 3: Confusing `deleteOne()` with `deleteMany()`

**The mistake:** Using `deleteOne({ status: "inactive" })` expecting to delete all inactive users.

**Why it's wrong:** `deleteOne()` deletes ONLY the first matching document. Use `deleteMany()` to delete all matching documents.

*Incorrect:*
```javascript
db.users.deleteOne({ status: "inactive" }); // ❌ Deletes single matching document only!
```

*Fix:*
```javascript
db.users.deleteMany({ status: "inactive" }); // Deletes all matching documents
```



## 5. Practice Exercises

### Exercise 1: Single Document Deletion with `deleteOne`

**Scenario:**
Delete a single order document from collection `orders` by its primary key `_id`.

**Requirements:**
1. Execute `db.orders.deleteOne({ _id: new ObjectId(...) })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const result = db.orders.deleteOne({
>   _id: new ObjectId("60c72b2f9b1d8b2c88888880")
> });
> console.log("Deleted Count:", result.deletedCount);
> ```
>
> #### Technical Explanation
>
> 1. `deleteOne()` removes at most one matching document.
> 2. Target `_id` primary key deletes execute in $O(1)$ constant time.
> 3. Returns `deletedCount: 1` on success.
> 
---

### Exercise 2: Batch Deletion with `deleteMany`

**Scenario:**
Delete all temporary log documents older than 30 days from collection `system_logs`.

**Requirements:**
1. Execute `db.system_logs.deleteMany({ createdAt: { $lt: thirtyDaysAgo } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
> 
> const result = db.system_logs.deleteMany({
>   createdAt: { $lt: thirtyDaysAgo }
> });
> console.log("Total Expired Logs Deleted:", result.deletedCount);
> ```
>
> #### Technical Explanation
>
> 1. `deleteMany()` removes all collection documents satisfying the filter condition.
> 2. Fires atomic deletion events for each document.
> 3. Utilizes `createdAt` secondary index for fast deletion targeting.
> 
---

### Exercise 3: Verifying Deletion Acknowledgments

**Scenario:**
Inspect the returned result object of a deletion operation to confirm acknowledged status.

**Requirements:**
1. Check `result.acknowledged` and `result.deletedCount`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const result = db.users.deleteOne({ email: "temp@example.com" });
> if (result.acknowledged && result.deletedCount > 0) {
>   console.log("Successfully deleted user record.");
> }
> ```
>
> #### Technical Explanation
>
> 1. `acknowledged: true` verifies the database write concern acknowledged the write.
> 2. `deletedCount` reports how many documents were actually removed.
> 3. Provides clean write result verification.
> 
---



## 6. Related Terms

- [Query Filter (Filter Document)](query_filter.md) — The target filters.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — The outputs containing deleted counts.
- [`bulkWrite()`](bulk_write.md) — Related concept: `bulkWrite()`.

---

## 7. Key Takeaways
- `deleteOne()` deletes the first matching document; `deleteMany()` deletes all matches.
- Serves as the MongoDB equivalent to SQL's `DELETE` statement.
- Passing an empty query filter `{}` to `deleteMany()` wipes the entire collection.
- Always verify query filters using `find()` before running bulk deletes.
- Frees space inside database files for subsequent write reuses.
- Returns a result object displaying the number of deleted records.
