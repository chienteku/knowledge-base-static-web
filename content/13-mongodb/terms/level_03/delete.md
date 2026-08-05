# `deleteOne()` / `deleteMany()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to delete a single matching document (`deleteOne()`) or multiple matching documents (`deleteMany()`) from a collection, serving as the equivalent of SQL's `DELETE` statement.

---

## 1. Prerequisites

- [Query Filter (Filter Document)](query_filter.md) — Defining which records are deleted.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through drivers. Frees storage block allocations on disk, creating dead space marked as reusable by the storage engine).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Executing `deleteMany({})` Without Filter Objects in Production

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

### Mistake 5: Confusing `deleteOne()` with `deleteMany()`

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

## 6. Practice Exercises

### Exercise 1: Safe Purge Query

**Problem:** You are running database maintenance. You want to delete all documents in a `sessions` collection where the `active` boolean field is exactly `false`. 
1.  Write the pre-verification check query.
2.  Write the actual delete query.

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Pre-verification check
> db.sessions.find({ active: false });
> 
> // 2. Actual delete command
> db.sessions.deleteMany({ active: false });
> ```
> - The query filters used inside `find` and `deleteMany` must be identical.
> - Use the bulk method `deleteMany` to clear all matching inactive records.

---



### Exercise 2: Deleting Single Document by Primary Key

**Problem:** Delete user document with `_id: ObjectId("60d5ecb8b5c9c22b9c8b4567")`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.deleteOne({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
> ```
> ```javascript
> db.users.deleteOne({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
> ```
>
> **Explanation:** `deleteOne({ _id })` deletes a single primary key document.

---

### Exercise 3: Deleting Inactive Logs with `deleteMany`

**Problem:** Delete all log documents created before `2026-01-01T00:00:00Z`.

**Expected output:**
> [!check]- Answer
> ```text
> db.logs.deleteMany({ createdAt: { $lt: new Date("2026-01-01T00:00:00Z") } });
> ```
> ```javascript
> db.logs.deleteMany({
>   createdAt: { $lt: new Date("2026-01-01T00:00:00Z") }
> });
> ```
>
> **Explanation:** `deleteMany(filter)` deletes all documents satisfying filter criteria.

## 7. Related Terms

- [Query Filter (Filter Document)](query_filter.md) — The target filters.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — The outputs containing deleted counts.
- [`bulkWrite()`](bulk_write.md) — Related concept: `bulkWrite()`.

---

## 8. Key Takeaways
- `deleteOne()` deletes the first matching document; `deleteMany()` deletes all matches.
- Serves as the MongoDB equivalent to SQL's `DELETE` statement.
- Passing an empty query filter `{}` to `deleteMany()` wipes the entire collection.
- Always verify query filters using `find()` before running bulk deletes.
- Frees space inside database files for subsequent write reuses.
- Returns a result object displaying the number of deleted records.
