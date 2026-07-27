# `replaceOne()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The MongoDB collection method used to completely overwrite a single document's payload (excluding its unique `_id`) with a new plain document structure.

---

## 1. Prerequisites
- [updateOne() / updateMany()](update.md) — The partial update alternatives.
- [`$set` vs. Whole-Document Replacement](set_vs_replace.md) — The comparison rules.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through drivers. Replaces the target document block on disk, preserving index pointer allocations by keeping the primary key `_id` immutable).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In application architectures, you occasionally need to reset or overwrite a record completely:
-   An integration sync tool fetches a fresh profile from an external API and wants to overwrite whatever local data exists.
-   A user completely resets their custom dashboard layout, changing its schema keys.

While you could run `updateOne()` with `$unset` to delete all fields followed by `$set` to write new ones, this is complex and slow.

We designed the **`replaceOne()`** method to handle this. 

It deletes all existing fields inside the matched document and writes the new plain document structure in their place in a single disk cycle. 

The primary key `_id` is preserved, ensuring any foreign references pointing to the document remain valid.

---

### (2) The Plain Document Requirement
Unlike `updateOne()`, which requires BSON update operators, `replaceOne()` **requires a plain JSON document** as its second argument. 

The database parses the object and writes it directly as the new document body.

---

### (3) Reality Metaphor
Imagine managing shipping containers:
-   **`updateOne()`:** Opening the container doors, swapping out 2 crates of parts, and locking it. (Partial update).
-   **`replaceOne()`:** Uncoupling the entire **Cargo Container** from the trailer bed, throwing it away, and coupling a completely new, differently packed container onto the trailer. 
    -   The truck's **License Plate ID** (the `_id`) stays bolted to the frame.

---

### (4) Code Examples

#### Overwriting a User Profile Completely
Let's see what happens to Charlie's fields when we run a replacement:

```javascript
// Start document: Charlie has age, country, and status
db.users.insertOne({
  _id: 200,
  name: "Charlie",
  age: 34,
  country: "FR",
  status: "pending"
});

// Replace the document (preserves _id: 200)
db.users.replaceOne(
  { _id: 200 },
  { name: "Charles", status: "active" } // Plain document, no operators!
);

db.users.find({ _id: 200 });
// Output (age and country fields are deleted!):
// { "_id": 200, "name": "Charles", "status": "active" }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Utilizing replaceOne() to modify a single field, leading to accidental deletion of other fields in the document

**The mistake:** Running the query `db.users.replaceOne({ _id: 200 }, { status: "suspended" })` in an attempt to freeze an account.

**Why it's wrong:** The query will succeed, but it will **delete all other fields** (name, age, email) in Charlie's document, replacing them with just the status field. 

This causes immediate, irreversible data loss.

**Fix: If you only want to modify a subset of fields, always use `updateOne()` with the `$set` operator instead of `replaceOne()`.**

```javascript
// CORRECT (Preserves name, email, age!)
db.users.updateOne({ _id: 200 }, { $set: { status: "suspended" } });
```

---



### Mistake 2: Using Update Operators (`$set`, `$inc`) inside `replaceOne()` Arguments

**The mistake:** Calling `db.users.replaceOne({ _id: id }, { $set: { name: "Alice" } })` (MongoInvalidArgumentError).

**Why it's wrong:** `replaceOne()` expects a replacement DOCUMENT object `{ name: "Alice" }`, NOT update operators (`$set`). Use `updateOne()` when using update operators.

*Incorrect:*
```javascript
db.users.replaceOne({ _id: id }, { $set: { name: "Alice" } }); // ❌ Cannot use $set in replaceOne!
```

*Fix:*
```javascript
db.users.replaceOne({ _id: id }, { name: "Alice", age: 30 }); // Whole document replacement
```

### Mistake 3: Forgetting that `replaceOne()` Replaces the Entire Document Object

**The mistake:** Calling `db.users.replaceOne({ _id: id }, { name: "Alice" })` expecting `email` field to remain.

**Why it's wrong:** `replaceOne()` replaces the entire existing document object with the new object, wiping all omitted fields (except `_id`).

*Incorrect:*
```javascript
db.users.replaceOne({ _id: id }, { name: "Alice" }); // ❌ Deletes all other fields!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { name: "Alice" } }); // Preserves existing fields
```



### Mistake 4: Using Update Operators (`$set`, `$inc`) inside `replaceOne()` Arguments

**The mistake:** Calling `db.users.replaceOne({ _id: id }, { $set: { name: "Alice" } })` (MongoInvalidArgumentError).

**Why it's wrong:** `replaceOne()` expects a replacement DOCUMENT object `{ name: "Alice" }`, NOT update operators (`$set`). Use `updateOne()` when using update operators.

*Incorrect:*
```javascript
db.users.replaceOne({ _id: id }, { $set: { name: "Alice" } }); // ❌ Cannot use $set in replaceOne!
```

*Fix:*
```javascript
db.users.replaceOne({ _id: id }, { name: "Alice", age: 30 }); // Whole document replacement
```

### Mistake 5: Forgetting that `replaceOne()` Replaces the Entire Document Object

**The mistake:** Calling `db.users.replaceOne({ _id: id }, { name: "Alice" })` expecting `email` field to remain.

**Why it's wrong:** `replaceOne()` replaces the entire existing document object with the new object, wiping all omitted fields (except `_id`).

*Incorrect:*
```javascript
db.users.replaceOne({ _id: id }, { name: "Alice" }); // ❌ Deletes all other fields!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { name: "Alice" } }); // Preserves existing fields
```

## 6. Practice Exercises

### Exercise 1: Replace vs. Update Selector

**Problem:** You are building a data sync script. You receive a full user object payload: `{ name: "Alice", email: "alice@new.com", role: "user" }`. You want to overwrite the old record matching `_id: 10` completely with this new payload.
Write the correct MongoDB query using the appropriate method.

**Expected output:**
```javascript
db.users.replaceOne(
  { _id: 10 },
  { name: "Alice", email: "alice@new.com", role: "user" }
);
```

> [!check]- Answer
> - The task requires a complete document overwrite, not a partial update.
> - Pass the new payload as a plain object without any update operators.

---



### Exercise 2: Replacing Full Document with `replaceOne`

**Problem:** Replace entire user document `_id: 1` with `{ name: "Bob", status: "active" }`.

**Expected output:**
```text
db.users.replaceOne({ _id: 1 }, { name: "Bob", status: "active" });
```

> [!check]- Answer
> ```javascript
> db.users.replaceOne({
>   _id: 1
> }, {
>   name: "Bob",
>   status: "active"
> });
> ```
>
> **Explanation:** `replaceOne(filter, newDoc)` replaces the document content while preserving `_id`.

### Exercise 3: Upserting with `replaceOne`

**Problem:** Replace or insert document `_id: 2` using `{ upsert: true }` option.

**Expected output:**
```text
db.users.replaceOne({ _id: 2 }, { name: "Charlie" }, { upsert: true });
```

> [!check]- Answer
> ```javascript
> db.users.replaceOne({ _id: 2 }, { name: "Charlie" }, { upsert: true });
> ```
>
> **Explanation:** `{ upsert: true }` inserts the replacement document if no matching document exists.



### Exercise 4: Replacing Full Document with `replaceOne`

**Problem:** Replace entire user document `_id: 1` with `{ name: "Bob", status: "active" }`.

**Expected output:**
```text
db.users.replaceOne({ _id: 1 }, { name: "Bob", status: "active" });
```

> [!check]- Answer
> ```javascript
> db.users.replaceOne({
>   _id: 1
> }, {
>   name: "Bob",
>   status: "active"
> });
> ```
>
> **Explanation:** `replaceOne(filter, newDoc)` replaces the document content while preserving `_id`.

### Exercise 5: Upserting with `replaceOne`

**Problem:** Replace or insert document `_id: 2` using `{ upsert: true }` option.

**Expected output:**
```text
db.users.replaceOne({ _id: 2 }, { name: "Charlie" }, { upsert: true });
```

> [!check]- Answer
> ```javascript
> db.users.replaceOne({ _id: 2 }, { name: "Charlie" }, { upsert: true });
> ```
>
> **Explanation:** `{ upsert: true }` inserts the replacement document if no matching document exists.

## 7. Related Terms
- [updateOne() / updateMany()](update.md) — Partial update methods.
- [`$set` vs. Whole-Document Replacement](set_vs_replace.md) — Comparative rules.

---

## 8. Key Takeaways
- `replaceOne()` completely overwrites a document's fields.
- Preserves the original, immutable primary key `_id` of the document.
- Expects a plain JSON document as the second argument; operators are forbidden.
- Any fields omitted from the replacement document are deleted on disk.
- Never use `replaceOne` to edit single fields, as it will wipe out other data.
- Use `updateOne` + `$set` for partial edits; use `replaceOne` for complete resets.
