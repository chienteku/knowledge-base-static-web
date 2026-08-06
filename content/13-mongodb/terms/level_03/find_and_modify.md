# `findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The atomic MongoDB collection methods used to find, modify, and return a single document in a single database operation, serving as the equivalent of PostgreSQL's `UPDATE ... RETURNING` statement.

---

## 1. Prerequisites

- [`updateOne()` / `updateMany()`](update.md) — The standard non-atomic updates.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — Differentiating results metrics from returned documents.
- [`find()` / `findOne()`](find.md) — Finding and modifying documents atomically.

---

## 2. Term Category

**CRUD Operation** (Atomic Find and Modify): findAndModify() (and findOneAndUpdate(), findOneAndDelete()) atomically reads and modifies a single document in a single database operation.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed atomically on the server. Guarantees that the document is locked during the find-and-modify sequence to prevent concurrent read/write overlaps).

### (1) Design Motivation — "Why did we design this?"
In web engineering, you frequently need to retrieve a record and modify it immediately:
-   **Task Queues:** A worker needs to fetch the next `"pending"` job, set its status to `"processing"`, and return the job details to start working.
-   **Inventory checks:** Reserving a ticket item, decrementing stock, and returning the invoice detail.

If you write this using separate database queries:
1.  **Read:** `const job = db.tasks.findOne({ status: "pending" });`
2.  **Write:** `db.tasks.updateOne({ _id: job._id }, { $set: { status: "processing" } });`

This introduces a severe **Concurrency Risk**:
-   If two worker servers run Step 1 at the exact same millisecond, they will both read the same job.
-   Both workers will update it and start processing it, resulting in duplicate work and database state corruption.

We designed **`findOneAndUpdate()`** to solve this race condition. 

The database engine locks the matched record, modifies the field, and returns the document **in a single, atomic step.** 

No other worker can read or modify the document mid-transaction, guaranteeing safe queue processing.

---

### (2) The returnDocument Option
By default, these methods return the document **before** the modifications were applied. To get the new values, you must pass the option:
`returnDocument: "after"` *(Note: written as `new: true` in Mongoose drivers).*

---

### (3) Reality Metaphor (Key Vending Machine)
-   **Non-Atomic (Query + Update):** A wooden box of keys on a wall. You check if the key is there (Yes). You walk to the logbook on the counter to write your name down. While you are writing, another worker walks past, grabs the key, and walks away. You turn around to find the key gone. (Race condition).
-   **Atomic (findOneAndUpdate):** A **Key Vending Machine**. 
    -   You swipe your ID card and select Key 5. 
    -   The machine physically drops the key into the slot and locks the locker door in one mechanical step. 
    -   It is impossible for another worker to grab Key 5 during the process.

---

### (4) Code Examples

#### Building an Atomic Task Queue Pop Query
Let's pop a pending task and mark it active:

```javascript
const activeTask = db.tasks.findOneAndUpdate(
  { status: "pending" },                     // 1. Query Filter
  { $set: { status: "processing" } },        // 2. Update Operators
  { 
    sort: { priority: -1 },                  // Get highest priority first
    returnDocument: "after"                  // Return the MODIFIED document!
  }
);

// activeTask now holds the modified document, e.g.:
// { _id: 101, status: "processing", priority: 5, task_name: "Ship orders" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that findOneAndUpdate() returns the ORIGINAL document state by default

**The mistake:** Running the query, updating a counter, and expecting the returned document object in your code to display the updated number:

```javascript
// BAD: returnedDoc still holds the old count value!
const returnedDoc = db.users.findOneAndUpdate(
  { _id: 1 },
  { $inc: { points: 10 } }
);
console.log(returnedDoc.points); // Displays the OLD points count!
```

**Why it's wrong:** By default, MongoDB returns the snapshot of the document as it existed *before* the update was processed.

**Fix: Always pass the option `{ returnDocument: "after" }` (or `{ new: true }` depending on your driver framework) if your code needs to read the modified values.**

---





### Mistake 2: Expecting `findOneAndUpdate()` to Return the Updated Document State by Default

**The mistake:** Calling `db.users.findOneAndUpdate({ _id: id }, { $inc: { seq: 1 } })` expecting the incremented value.

**Why it's wrong:** By default, `findOneAndUpdate()` returns the document state BEFORE the update was applied! Pass `{ returnDocument: 'after' }` (or `{ new: true }` in Mongoose) to return the updated state.

*Incorrect:*
```javascript
const doc = await db.users.findOneAndUpdate({ _id: id }, { $inc: { seq: 1 } }); // Returns OLD document!
```

*Fix:*
```javascript
const doc = await db.users.findOneAndUpdate({ _id: id }, { $inc: { seq: 1 } }, { returnDocument: "after" });
```



### Mistake 3: Using `updateOne()` Followed by `findOne()` Instead of Atomic `findOneAndUpdate()`

**The mistake:** Executing `await db.users.updateOne(...)` followed by `await db.users.findOne(...)` in atomic sequence generators.

**Why it's wrong:** Executing separate update and find calls creates a race condition window where concurrent requests can mutate data between calls. `findOneAndUpdate()` is fully atomic.

*Incorrect:*
```javascript
await db.seq.updateOne({ _id: "id" }, { $inc: { val: 1 } });
const seq = await db.seq.findOne({ _id: "id" }); // ❌ Race condition vulnerability!
```

*Fix:*
```javascript
const seq = await db.seq.findOneAndUpdate({ _id: "id" }, { $inc: { val: 1 } }, { returnDocument: "after" });
```



## 5. Practice Exercises

### Exercise 1: Atomic Counter Increment with `findOneAndUpdate`

**Scenario:**
Atomically increment an order sequence counter `seq` in collection `counters` and return the updated counter value.

**Requirements:**
1. Use `findOneAndUpdate()` with `$inc: { seq: 1 }` and `returnDocument: "after"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const updated = db.counters.findOneAndUpdate(
>   { _id: "orderId" },
>   { $inc: { seq: 1 } },
>   { returnDocument: "after", upsert: true }
> );
> console.log("Next Sequence Number:", updated.seq);
> ```
>
> #### Technical Explanation
>
> 1. `findOneAndUpdate()` atomically reads and modifies a single document in a single write operation.
> 2. `returnDocument: "after"` returns the document state AFTER modifications are applied.
> 3. Prevents duplicate sequence numbers in concurrent environments.

---

### Exercise 2: Queue Task Deletion with `findOneAndDelete`

**Scenario:**
Fetch and remove the next pending task from collection `task_queue` in a single atomic step.

**Requirements:**
1. Execute `findOneAndDelete({ status: "pending" }, { sort: { priority: -1 } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const task = db.task_queue.findOneAndDelete(
>   { status: "pending" },
>   { sort: { priority: -1 } }
> );
> console.log("Claimed Task:", task?.taskId);
> ```
>
> #### Technical Explanation
>
> 1. `findOneAndDelete()` finds, returns, and removes a document atomically.
> 2. `sort` ensures highest-priority queue tasks are claimed first.
> 3. Guarantees a task is claimed by exactly one worker process.

---

### Exercise 3: Atomic Document Replacement with `findOneAndReplace`

**Scenario:**
Replace a user draft document with a finalized document state in a single atomic step.

**Requirements:**
1. Use `findOneAndReplace()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const replaced = db.drafts.findOneAndReplace(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { title: "Finalized Title", body: "Completed text", status: "published" },
>   { returnDocument: "after" }
> );
> ```
>
> #### Technical Explanation
>
> 1. `findOneAndReplace()` replaces document content while retaining the original `_id`.
> 2. Returns pre-replacement or post-replacement document state based on options.
> 3. Thread-safe atomic replacement operation.

---



## 6. Related Terms

- [`updateOne()` / `updateMany()`](update.md) — Standard non-atomic modifications.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — Standard write outputs.

---

## 7. Key Takeaways
- `findOneAndUpdate()` finds, updates, and returns a document atomically.
- Serves as the MongoDB equivalent to PostgreSQL's `UPDATE ... RETURNING` query.
- Prevents concurrent race conditions in high-traffic queues or inventories.
- Returns the document state *before* modifications by default.
- Set `returnDocument: "after"` to receive the updated document fields.
- `findOneAndDelete()` deletes a document and returns the deleted document data.
- `findOneAndReplace()` replaces a document and returns it.
