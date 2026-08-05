# Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The response metadata objects returned by MongoDB write, update, and delete methods, providing essential metrics to verify write completions and modification metrics.

---

## 1. Prerequisites

- [`insertOne()` / `insertMany()`](insert.md) — Insert methods returning write results.
- [`updateOne()` / `updateMany()`](update.md) — Update methods returning write results.
- [`deleteOne()` / `deleteMany()`](delete.md) — Delete methods returning write results.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Returned by database drivers to the application server runtime. Standardized across all language drivers to track network write receipts).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing backend code that updates a database (like charging a credit card or upgrading a user's subscription tier):
-   You cannot simply execute the query and assume it succeeded.
-   You must verify: Did the query actually locate the user? Did it modify the document? Did a database error occur?

In PostgreSQL, you verify writes by inspecting the returned command tags (like `UPDATE 1`) or using `RETURNING` clauses.

We designed the **Write Result Objects** in MongoDB to provide structured metadata for every write operation. 

Instead of simple strings, write methods return a JSON object containing flags and counters. 

Your application code parses this object to confirm that the write was written to disk before executing subsequent business steps.

---

### (2) Result Object Fields by Operation

#### 1. Insertion (`insertOne` / `insertMany`)
-   **`acknowledged`:** Boolean. `true` means the database successfully processed the write.
-   **`insertedId`** (or **`insertedIds`**): The unique `_id` assigned to the new document(s), allowing you to link references immediately.

#### 2. Modification (`updateOne` / `updateMany`)
-   **`matchedCount`:** The number of documents that matched the query filter.
-   **`modifiedCount`:** The number of documents that were **actually changed**. 
    -   *Crucial Note:* If a document matches the filter but already carries the target update value, MongoDB does not overwrite it on disk. `matchedCount` will be `1`, but `modifiedCount` will be `0`.
-   **`upsertedId`:** The generated ID if an upsert write occurred.

#### 3. Deletion (`deleteOne` / `deleteMany`)
-   **`deletedCount`:** The number of documents physically deleted from the collection.

---

### (3) Reality Metaphor
Imagine sending a mail package:
-   **No Write Results:** Dropping an envelope in a blue street mailbox. You hope it arrives, but have no receipt or tracking proof.
-   **Write Result Object:** Shipping via **Certified Courier Mail**. 
    -   The courier hands you a **Signed Receipt Roster** showing:
        -   The timestamp when they accepted it (`acknowledged`).
        -   The package tracking label (`insertedId`).
        -   A delivery status note: *"Addressed to 1 house, updated 1 cabinet"* (matched and modified counts).

---

### (4) Code Examples

#### Parsing an Update Result in JavaScript
Let's analyze what a Node.js server receives after updating a user:

```javascript
const result = await db.collection('users').updateOne(
  { email: "alice@company.com" },
  { $set: { status: "active" } }
);

// Inspect the Write Result Object
console.log(result);
// Output:
// {
//   acknowledged: true,
//   matchedCount: 1,
//   modifiedCount: 1,
//   upsertedId: null
// }

// Verify success in application logic
if (result.matchedCount === 0) {
  throw new Error("User account not found!");
}
if (result.modifiedCount === 0) {
  console.log("Account was already active. No changes made.");
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Checking only 'matchedCount' instead of 'modifiedCount' to verify if data was rewritten on disk

**The mistake:** Assuming that because `matchedCount === 1`, the update query successfully wrote new data to the disk.

**Why it's wrong:** If a user clicks a button to save their settings, and they didn't change any values on the form:
-   The query matches the user: `matchedCount` is `1`.
-   However, because no values changed, MongoDB skips writing to disk: `modifiedCount` is `0`.
If your application depends on triggering email scripts only when data is altered, checking `matchedCount` will trigger duplicate emails.

**Fix: Always check `modifiedCount` if your application needs to confirm that a document's values were physically altered.**

---



### Mistake 2: Assuming `matchedCount > 0` Means Document Field Values Were Modified

**The mistake:** Checking `if (res.modifiedCount > 0)` expecting it to equal `matchedCount` when updating identical values.

**Why it's wrong:** If an update assigns values identical to existing document fields, `matchedCount` is `1` but `modifiedCount` is `0`! Check `matchedCount` to verify document existence.

*Incorrect:*
```javascript
const res = await db.users.updateOne({ _id: 1 }, { $set: { name: "Alice" } });
if (res.modifiedCount === 0) throw new Error("User not found!"); // ❌ False error if name was already Alice!
```

*Fix:*
```javascript
if (res.matchedCount === 0) throw new Error("User not found!"); // Correct existence check
```

### Mistake 3: Ignoring `acknowledged` Flag in Write Concern Response Objects

**The mistake:** Assuming write operations were committed to server disk without checking `res.acknowledged`.

**Why it's wrong:** If writes are executed with un-acknowledged write concern `{ w: 0 }`, `res.acknowledged` is `false` and mutation details are unavailable.

*Incorrect:*
```javascript
// Un-acknowledged write check
```

*Fix:*
```javascript
if (res.acknowledged) { console.log('Write acknowledged by cluster'); }
```



### Mistake 4: Assuming `matchedCount > 0` Means Document Field Values Were Modified

**The mistake:** Checking `if (res.modifiedCount > 0)` expecting it to equal `matchedCount` when updating identical values.

**Why it's wrong:** If an update assigns values identical to existing document fields, `matchedCount` is `1` but `modifiedCount` is `0`! Check `matchedCount` to verify document existence.

*Incorrect:*
```javascript
const res = await db.users.updateOne({ _id: 1 }, { $set: { name: "Alice" } });
if (res.modifiedCount === 0) throw new Error("User not found!"); // ❌ False error if name was already Alice!
```

*Fix:*
```javascript
if (res.matchedCount === 0) throw new Error("User not found!"); // Correct existence check
```

### Mistake 5: Ignoring `acknowledged` Flag in Write Concern Response Objects

**The mistake:** Assuming write operations were committed to server disk without checking `res.acknowledged`.

**Why it's wrong:** If writes are executed with un-acknowledged write concern `{ w: 0 }`, `res.acknowledged` is `false` and mutation details are unavailable.

*Incorrect:*
```javascript
// Un-acknowledged write check
```

*Fix:*
```javascript
if (res.acknowledged) { console.log('Write acknowledged by cluster'); }
```

## 6. Practice Exercises

### Exercise 1: Result Analysis

**Problem:** You execute a `deleteMany()` query and get this write result object:
`{ acknowledged: true, deletedCount: 0 }`
1.  Did the query fail with an error?
2.  What does this output tell you about the database state?

**Expected output:**
> [!check]- Answer
> ```text
> 1. No, the query did not fail (the `acknowledged: true` flag indicates the database server successfully parsed and executed the command).
> 2. The output indicates that no documents matched the query filter you provided. Therefore, zero documents were deleted from the collection.
> ```
> - Differentiate network execution safety from matching filters counts.
> - Relate the metrics back to the delete filters.

---



### Exercise 2: Write Result Object Properties

**Problem:** List 3 standard properties on MongoDB driver `UpdateResult` objects (`acknowledged`, `matchedCount`, `modifiedCount`).

**Expected output:**
> [!check]- Answer
> ```text
> acknowledged, matchedCount, modifiedCount
> ```
> ```text
> acknowledged, matchedCount, modifiedCount
> ```
>
> **Explanation:** Write result objects detail acknowledgement status and affected document metrics.

---

### Exercise 3: Delete Result Inspection

**Problem:** Inspect number of deleted documents on `DeleteResult` object (`res.deletedCount`).

**Expected output:**
> [!check]- Answer
> ```text
> res.deletedCount
> ```
> ```javascript
> const res = await db.users.deleteMany({ active: false });
> console.log(res.deletedCount);
> ```
>
> **Explanation:** `res.deletedCount` reports the total number of documents deleted.

## 7. Related Terms

- [`insertOne()` / `insertMany()`](insert.md) — The insert operations.
- [`updateOne()` / `updateMany()`](update.md) — The modify operations.
- [`deleteOne()` / `deleteMany()`](delete.md) — The delete operations.
- [`findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`](find_and_modify.md) — Related concept: `findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`.
- [Upsert (`upsert: true`)](upsert.md) — Related concept: Upsert (`upsert: true`).

---

## 8. Key Takeaways
- Write Result Objects contain operational metrics for every database write.
- Allows application servers to verify if transactions succeeded.
- `acknowledged` confirms the database server processed the query.
- `matchedCount` tracks filter matches; `modifiedCount` tracks actual disk writes.
- MongoDB skips disk writes if the update doesn't change value bytes.
- Deletions output the total count of purged records inside `deletedCount`.
- Always parse write results inside app logic to handle missing record errors.
