# Upsert (`upsert: true`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The configuration option passed to MongoDB update operations that instructs the engine to insert a new document if no existing documents match the query filter, serving as the equivalent of SQL's `INSERT ... ON CONFLICT DO UPDATE` (UPSERT) statement.

---

## 1. Prerequisites
- [updateOne() / updateMany()](update.md) — The parent update methods.
- [Write Result Objects (insertedId, modifiedCount, acknowledged)](write_results.md) — Verifying upsertedId outputs.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported across all relational and document databases. Handled atomically on the server to prevent race conditions during check-and-insert steps).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Expecting `$setOnInsert` Fields to Update During Existing Document Mutations

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

### Mistake 5: Forgetting `{ upsert: true }` Option Flag in Update Invocation Arguments

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

## 6. Practice Exercises

### Exercise 1: Stats Tracker Query

**Problem:** You are building a game dashboard. Write the MongoDB query to update a document in the `player_stats` collection for a player where the `player_id` is exactly `104`. The update must:
1.  Set their `status` to `"online"`.
2.  Increment their `games_played` count by `1`.
3.  Ensure the document is created dynamically if player `104` has no records yet.

**Expected output:**
```javascript
db.player_stats.updateOne(
  { player_id: 104 },
  {
    $set: { status: "online" },
    $inc: { games_played: 1 }
  },
  { upsert: true }
);
```

> [!check]- Answer
> - Specify the query filter matching the ID.
> - Chain the `$set` and `$inc` operators.
> - Pass the upsert flag in the options block.

---



### Exercise 2: Idempotent Document Upsert

**Problem:** Upsert user by `email: "a@b.com"` setting `name: "Alice"` and `$setOnInsert` `createdAt: new Date()`.

**Expected output:**
```text
db.users.updateOne({ email: "a@b.com" }, { $set: { name: "Alice" }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
```

> [!check]- Answer
> ```javascript
> db.users.updateOne(
>   { email: "a@b.com" },
>   { $set: { name: "Alice" }, $setOnInsert: { createdAt: new Date() } },
>   { upsert: true }
> );
> ```
>
> **Explanation:** Combining `{ upsert: true }` with `$setOnInsert` initializes creation timestamps only on insert.

### Exercise 3: Inspecting Upserted Result ID

**Problem:** Inspect `upsertedId` field on MongoDB driver write result objects.

**Expected output:**
```text
result.upsertedId
```

> [!check]- Answer
> ```javascript
> const res = await db.users.updateOne({ _id: 99 }, { $set: { a: 1 } }, { upsert: true });
> console.log(res.upsertedId);
> ```
>
> **Explanation:** `res.upsertedId` contains generated primary key IDs for upsert insertions.



### Exercise 4: Idempotent Document Upsert

**Problem:** Upsert user by `email: "a@b.com"` setting `name: "Alice"` and `$setOnInsert` `createdAt: new Date()`.

**Expected output:**
```text
db.users.updateOne({ email: "a@b.com" }, { $set: { name: "Alice" }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
```

> [!check]- Answer
> ```javascript
> db.users.updateOne(
>   { email: "a@b.com" },
>   { $set: { name: "Alice" }, $setOnInsert: { createdAt: new Date() } },
>   { upsert: true }
> );
> ```
>
> **Explanation:** Combining `{ upsert: true }` with `$setOnInsert` initializes creation timestamps only on insert.

### Exercise 5: Inspecting Upserted Result ID

**Problem:** Inspect `upsertedId` field on MongoDB driver write result objects.

**Expected output:**
```text
result.upsertedId
```

> [!check]- Answer
> ```javascript
> const res = await db.users.updateOne({ _id: 99 }, { $set: { a: 1 } }, { upsert: true });
> console.log(res.upsertedId);
> ```
>
> **Explanation:** `res.upsertedId` contains generated primary key IDs for upsert insertions.

## 7. Related Terms
- [updateOne() / updateMany()](update.md) — The parent update methods.
- [Write Result Objects (insertedId, modifiedCount, acknowledged)](write_results.md) — The query output indicators.

---

## 8. Key Takeaways
- Upsert inserts a new document if no records match the query filter.
- Serves as the MongoDB equivalent of SQL's `ON CONFLICT DO UPDATE` clause.
- Passed inside the options object argument as `{ upsert: true }`.
- Merges query filter keys with update operator assignments to build new rows.
- Runs atomically on the server to prevent duplicate key race conditions.
- Returns a result object containing the newly created primary key in `upsertedId`.
- Always set explicit upsert flags; standard updates skip missing rows by default.
