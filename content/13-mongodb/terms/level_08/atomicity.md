# Atomicity in MongoDB

> **Level 8 — Transactions, Consistency & Durability**
> The database transactional guarantee that write operations are executed as a single "all-or-nothing" unit, highlighting MongoDB's native guarantee of atomicity at the single-document level by default.

---

## 1. Prerequisites
- [Document](../level_01/document.md) — The basic unit of storage.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (A core component of ACID consistency across SQL and NoSQL engines. Determines whether partial data writes can pollute database storage).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database architecture, **Atomicity** guarantees that a set of updates either all complete successfully or all fail and roll back together. 

If a query fails halfway:
-   You do not want a user's account to show a deducted balance without the receiving account credit showing up.
-   You do not want a document to save a new name but crash before saving the corresponding email, leaving the profile corrupted.

In relational SQL databases, tables are flat. 

To update a user along with their addresses, you must write to multiple tables. 

Therefore, SQL databases require you to explicitly wrap updates inside a transaction block (`BEGIN` / `COMMIT`) to enforce atomicity.

In MongoDB, document schemas support nesting. 

Because a user's address list and profile details are nested inside a **single BSON document**, MongoDB guarantees that **any write operation on a single document is atomic by default.** 

You do not need to start a transaction to update 20 nested fields inside one document safely; the database engine guarantees the update is atomic.

---

### (2) The Multi-Document Boundary
While single-document writes are atomic:
-   **Multi-document writes (like `updateMany()`) are NOT atomic across documents by default.**
-   If `updateMany()` matches 100 documents and the server crashes after document 50, those 50 documents remain modified on disk, while the remaining 50 are untouched.
-   To guarantee atomicity across multiple documents or collections, you must use **Multi-Document Transactions**.

---

### (3) Reality Metaphor (Sealed Box Meals)
Imagine ordering food at a restaurant:
-   **Single-Document Atomicity:** Buying a **Sealed Value Meal Box** (the document). 
    -   Inside is a burger, fries, and a drink. 
    -   You either walk away with the entire box, or you walk away with nothing. 
    -   No other customer can reach inside your box and steal just the fries while you are checking out.
-   **Multi-Document Write:** Carrying **3 separate plates** (documents) on a tray. 
    -   If you trip and fall (server crash) near the table, you might drop and break the salad plate, but the burger and fries plates land safely on the table and are kept. (Partial update).

---

### (4) Code Examples

#### Single-Document Atomic Updates vs. Multi-Document Updates
Let's see what writes are guaranteed as atomic:

```javascript
// 1. ATOMIC: Updates multiple fields inside ONE document.
// If the server crashes mid-update, either all changes are saved or none are.
db.users.updateOne(
  { _id: 101 },
  {
    $set: { "profile.email": "alice@mail.com", "profile.phone": "123-456" },
    $push: { login_logs: new Date() }
  }
);

// 2. NOT ATOMIC: Modifies multiple documents in a collection.
// If document 1 succeeds but document 2 fails, document 1 remains updated!
db.users.updateMany(
  { role: "member" },
  { $set: { status: "active" } }
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming that 'updateMany()' or bulk writes are atomic across all matched documents by default

**The mistake:** Running `db.users.updateMany({ tier: "gold" }, { $inc: { points: 10 } })` and assuming that if the query throws a network timeout error, no users received the points.

**Why it's wrong:** `updateMany()` processes documents sequentially. 

If the database server loses connection halfway, the first set of matching gold users will have received the points, while the rest did not, leading to inconsistent application states.

**Fix: If your application logic requires that updates to multiple documents succeed or fail together as a single unit, you must wrap the operations in a Multi-Document Transaction.**

---



### Mistake 2: Using Separate Read-Modify-Write Steps in Code Instead of Atomic Server-Side Operators

**The mistake:** Executing `const doc = await db.findOne();` followed by `await db.updateOne({ _id }, { $set: { count: doc.count + 1 } })`.

**Why it's wrong:** Read-modify-write patterns create race condition windows where concurrent requests overwrite updates. Use atomic `$inc: { count: 1 }` or `findOneAndUpdate()`.

*Incorrect:*
```javascript
const doc = await db.users.findOne({ _id: id });
await db.users.updateOne({ _id: id }, { $set: { count: doc.count + 1 } }); // ❌ Race condition!
```

*Fix:*
```javascript
await db.users.updateOne({ _id: id }, { $inc: { count: 1 } }); // Atomic server-side update
```

### Mistake 3: Expecting `updateMany()` to Be Atomic Across All Matching Documents

**The mistake:** Expecting `db.users.updateMany(...)` to lock the collection and fail completely if 1 document fails halfway.

**Why it's wrong:** `updateMany()` is atomic per individual document, NOT atomically isolated across the entire batch! Other queries can observe partially updated states unless wrapped in a transaction.

*Incorrect:*
```javascript
// Expecting updateMany to isolate all matching documents simultaneously
```

*Fix:*
```javascript
Wrap multi-document updates in a transaction session for batch isolation
```

## 6. Practice Exercises

### Exercise 1: Atomicity Diagnostic

**Problem:** You execute the following command:
```javascript
db.products.updateOne(
  { _id: 202 },
  {
    $set: { price: 49.99 },
    $inc: { stock: -1 }
  }
);
```
During execution, the database server loses power. 
Analyze which of the following states can exist on disk when the server boots back up (answer **Yes** or **No**):
1.  The price is `49.99` and stock is decremented.
2.  The price is the old value and stock is unchanged.
3.  The price is `49.99` but stock is unchanged.

**Expected output:**
```text
1. Yes: The update completed successfully before the crash.
2. Yes: The crash occurred before the update was applied, rolling back the entire write.
3. No: Single-document updates are strictly atomic. The price change and the stock decrement cannot be split; it is "all-or-nothing."
```

> [!check]- Answer
> - Single-document writes are protected by engine-level atomicity.
> - Partial modifications of single documents are impossible in MongoDB.

---



### Exercise 2: Atomic Counter Increment

**Problem:** Increment `downloads` counter atomically for `file:1` using `$inc`.

**Expected output:**
```text
db.files.updateOne({ _id: 1 }, { $inc: { downloads: 1 } });
```

> [!check]- Answer
> ```javascript
> db.files.updateOne({ _id: 1 }, { $inc: { downloads: 1 } });
> ```
>
> **Explanation:** `$inc` executes atomic server-side numeric increments without race conditions.

### Exercise 3: Atomic Find and Update

**Problem:** Atomically update order status to `"processing"` returning updated document using `findOneAndUpdate()`.

**Expected output:**
```text
db.orders.findOneAndUpdate({ status: "pending" }, { $set: { status: "processing" } }, { returnDocument: "after" });
```

> [!check]- Answer
> ```javascript
> db.orders.findOneAndUpdate(
>   { status: "pending" },
>   { $set: { status: "processing" } },
>   { returnDocument: "after" }
> );
> ```
>
> **Explanation:** `findOneAndUpdate()` atomically claims and updates queue documents.

## 7. Related Terms
- [Multi-Document Transaction](multi_document_transaction.md) — Multi-collection ACID blocks.
- [ACID vs BASE](acid_vs_base.md) — The consistency models.

---

## 8. Key Takeaways
- Atomicity ensures that database modifications are "all-or-nothing" operations.
- MongoDB guarantees single-document write atomicity by default.
- Any updates to nested fields or arrays inside one document are atomic.
- Eliminates the need for transactions when modeling data in single documents.
- Multi-document writes (`updateMany()`) are not atomic across documents.
- Partial failures in multi-document writes can leave databases in split states.
- Multi-document transactions are required to span atomicity across collections.
