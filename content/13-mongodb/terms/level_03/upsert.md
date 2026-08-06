# Upsert (`upsert: true`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The configuration option passed to MongoDB update operations that instructs the engine to insert a new document if no existing documents match the query filter, serving as the equivalent of SQL's `INSERT ... ON CONFLICT DO UPDATE` (UPSERT) statement.

---

## 1. Prerequisites

- [`updateOne()` / `updateMany()`](update.md) — The parent update methods.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — Verifying upsertedId outputs.

---

## 2. Term Category

**CRUD Operation** (Conditional Insert or Update): Upsert is an update option (upsert: true) that inserts a new document if no documents match the update query filter.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across all relational and document databases. Handled atomically on the server to prevent race conditions during check-and-insert steps).

### (1) Design Motivation — "Why did we design this?"
In application logic, you frequently need to log metrics conditionally:
-   **Page View Trackers:** When a user visits a page, you want to increment a count. If the page document exists, you increment `views` by 1. If it's the first visit ever, you must insert a new document with `views: 1`.
-   **User Settings Sync:** Saving settings. If the settings document is present, update it; if not, create it.

If you write this in separate steps:
1.  **Check:** `const doc = db.page_views.findOne({ url: "/home" });`
2.  **Logic:** If `doc` exists, run `updateOne()`; otherwise, run `insertOne()`.

This is slow (requires two roundtrips) and vulnerable to race conditions (two clicks at the same millisecond could both see "no document" and try to run `insertOne()`, causing a duplicate key index crash).

We designed the **Upsert** (Update-or-Insert) option to resolve this. 

By passing **`{ upsert: true }`** in the options argument of an update query, you combine the check, update, and insert into a single atomic server-side operation.

---

### (2) How Upsert Constructs a New Document
If no document matches the query filter and an insert is triggered, MongoDB builds the new document using a smart merging formula:
1.  It reads the fields in the **Query Filter** (e.g. `{ url: "/home" }`) and uses them as the base document.
2.  It applies the operators inside the **Update Document** (e.g. `$set: { category: "main" }`, `$inc: { views: 1 }`).
3.  It merges these fields, generates a new `_id` ObjectId, and writes the resulting document to disk.

---

### (3) Reality Metaphor (The Mailbox Setup)
Imagine a mail carrier delivering packages:
-   **Standard Update (No Upsert):** The carrier looks for a mailbox labeled "Apartment 4B". If they find it, they paste a notification sticker inside. If Apartment 4B doesn't exist, they write "Delivery Failed" on their clipboard and leave.
-   **Upsert (`upsert: true`):** The carrier looks for the mailbox. If they don't find "Apartment 4B", they immediately **install a new physical mailbox** on the wall, write "Apartment 4B" on the cover (the query filter), paste the notification sticker inside (the update details), and walk away.

---

### (4) Code Examples

#### Atomic Page View Counter (Upsert)
Let's increment views on a URL path. We pass the upsert flag in the 3rd argument options object:

```javascript
db.page_views.updateOne(
  { url: "/blog/nosql" },                  // 1. Query Filter
  { 
    $inc: { views: 1 },                    // 2. Update Operators
    $set: { last_accessed: new Date() } 
  },
  { upsert: true }                         // 3. Options Object
);
```

#### The Write Result Output
If a new document was inserted, the write result returns details under `upsertedId`:

```javascript
// Output:
// {
//   acknowledged: true,
//   matchedCount: 0,
//   modifiedCount: 0,
//   upsertedId: ObjectId("65fc71239b1d8b2e88a8d999") // ID of the new document!
// }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming upsert is active by default on standard updateOne() queries

**The mistake:** Running `db.users.updateOne({ username: "guest" }, { $set: { status: "active" } })` and expecting a new user to appear if `"guest"` does not exist.

**Why it's wrong:** By default, if no document matches the query filter, `updateOne()` returns successfully (`acknowledged: true`) but writes nothing to disk. 

The `matchedCount` and `modifiedCount` will both be `0`.

**Fix: You must explicitly pass `{ upsert: true }` in the third options argument if you want missing documents to be created.**

---





### Mistake 2: Expecting `$setOnInsert` Fields to Update During Existing Document Mutations

**The mistake:** Putting `updatedAt: new Date()` inside `$setOnInsert` clauses.

**Why it's wrong:** `$setOnInsert` fields execute ONLY when a new document is inserted during an upsert operation. They are skipped when updating existing documents.

*Incorrect:*
```javascript
db.users.updateOne({ email }, { $set: { status }, $setOnInsert: { updatedAt: new Date() } }, { upsert: true }); // ❌ Skipped on update!
```

*Fix:*
```javascript
db.users.updateOne({ email }, { $set: { status, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
```



### Mistake 3: Forgetting `{ upsert: true }` Option Flag in Update Invocation Arguments

**The mistake:** Running `db.users.updateOne({ email }, { $set: { name } })` expecting it to create missing users.

**Why it's wrong:** Without `{ upsert: true }`, `updateOne()` does nothing if no matching document is found.

*Incorrect:*
```javascript
db.users.updateOne({ email: "new@ex.com" }, { $set: { name: "New" } }); // ❌ No document modified or inserted!
```

*Fix:*
```javascript
db.users.updateOne({ email: "new@ex.com" }, { $set: { name: "New" } }, { upsert: true });
```



## 5. Practice Exercises

### Exercise 1: Conditional Upsert Execution with `upsert: true`

**Scenario:**
Update user settings for `userId: ObjectId(...)`. If settings document exists, update `theme`; if missing, insert a new settings document.

**Requirements:**
1. Execute `updateOne()` with `upsert: true`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const userId = new ObjectId("60c72b2f9b1d8b2c88888880");
> 
> const result = db.user_settings.updateOne(
>   { userId: userId },
>   {
>     $set: { theme: "dark", updatedAt: new Date() },
>     $setOnInsert: { createdAt: new Date() }
>   },
>   { upsert: true }
> );
> console.log("Upserted ID:", result.upsertedId);
> ```
>
> #### Technical Explanation
>
> 1. `upsert: true` inserts a new document if no documents match the query filter.
> 2. `$setOnInsert` sets specified fields ONLY when an insert operation occurs.
> 3. Prevents overwriting `createdAt` timestamps during subsequent updates.
> 
---

### Exercise 2: Unique Index Protection against Upsert Race Conditions

**Scenario:**
Create a unique index on `sku` in collection `products` to prevent duplicate insertions during concurrent upserts.

**Requirements:**
1. Create unique index `{ sku: 1 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.createIndex({ sku: 1 }, { unique: true });
> ```
>
> #### Technical Explanation
>
> 1. Unique index on filter fields (`sku`) prevents duplicate document creation under high-concurrency write surges.
> 2. If two concurrent requests execute upserts simultaneously, unique index rejects the second insert with duplicate key error.
> 3. Application retries write as a standard update.
> 
---

### Exercise 3: Inspecting Upsert Response Payloads

**Scenario:**
Inspect `upsertedCount` and `upsertedId` in the return object of an upsert write operation.

**Requirements:**
1. Check `result.upsertedCount` and `result.upsertedId`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const res = db.settings.updateOne(
>   { key: "site_name" },
>   { $set: { value: "My Store" } },
>   { upsert: true }
> );
> 
> if (res.upsertedCount > 0) {
>   console.log("Inserted new settings document with ID:", res.upsertedId);
> } else {
>   console.log("Updated existing settings document.");
> }
> ```
>
> #### Technical Explanation
>
> 1. `upsertedCount: 1` indicates a new document was created.
> 2. `upsertedId` contains the `_id` of the newly created document.
> 3. If an existing document was updated, `upsertedCount` is 0.
> 
---



## 6. Related Terms

- [`updateOne()` / `updateMany()`](update.md) — The parent update methods.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — The query output indicators.
- [The Bucket Pattern](../level_05/bucket_pattern.md) — Related concept: The Bucket Pattern.
- [`$out` / `$merge` Stages](../level_06/out_merge_stages.md) — Related concept: `$out` / `$merge` Stages.

---

## 7. Key Takeaways
- Upsert inserts a new document if no records match the query filter.
- Serves as the MongoDB equivalent of SQL's `ON CONFLICT DO UPDATE` clause.
- Passed inside the options object argument as `{ upsert: true }`.
- Merges query filter keys with update operator assignments to build new rows.
- Runs atomically on the server to prevent duplicate key race conditions.
- Returns a result object containing the newly created primary key in `upsertedId`.
- Always set explicit upsert flags; standard updates skip missing rows by default.
