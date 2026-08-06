# `replaceOne()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The MongoDB collection method used to completely overwrite a single document's payload (excluding its unique `_id`) with a new plain document structure.

---

## 1. Prerequisites

- [`updateOne()` / `updateMany()`](update.md) — The partial update alternatives.

---

## 2. Term Category

**CRUD Operation** (Full Document Replacement): replaceOne() replaces the entire content of a single matching document while preserving its original _id primary key.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through drivers. Replaces the target document block on disk, preserving index pointer allocations by keeping the primary key `_id` immutable).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Entire Document Replacement with `replaceOne`

**Scenario:**
Replace an entire document in collection `users` with a sanitized new document structure while preserving its `_id`.

**Requirements:**
1. Execute `replaceOne({ _id: targetId }, newDocument)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const targetId = new ObjectId("60c72b2f9b1d8b2c88888880");
> 
> db.users.replaceOne(
>   { _id: targetId },
>   {
>     name: "Alice Smith",
>     email: "alice.smith@example.com",
>     status: "verified",
>     updatedAt: new Date()
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. `replaceOne()` completely replaces document content with the new replacement document object.
> 2. The original `_id` primary key is automatically preserved.
> 3. Any unmentioned fields in the original document are removed.

---

### Exercise 2: Upserting Replacement Documents

**Scenario:**
Replace a user setting document if it exists, or insert a default settings document if missing using `upsert: true`.

**Requirements:**
1. Execute `replaceOne()` with `{ upsert: true }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.user_settings.replaceOne(
>   { userId: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   {
>     userId: new ObjectId("60c72b2f9b1d8b2c88888880"),
>     theme: "dark",
>     notifications: true
>   },
>   { upsert: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. `upsert: true` inserts the replacement document if no document matches the query filter.
> 2. Ideal for state synchronization endpoints receiving full entity payloads.
> 3. Atomic replace-or-insert operation.

---

### Exercise 3: Validating Replacement Document Constraints

**Scenario:**
Explain why replacement documents passed to `replaceOne()` CANNOT contain update operators like `$set`.

**Requirements:**
1. Describe replacement document restriction.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ❌ Invalid replaceOne syntax (throws error):
> // db.users.replaceOne({ _id: id }, { $set: { name: "Alice" } });
> 
> // ✅ Correct replaceOne syntax (plain document):
> db.users.replaceOne({ _id: id }, { name: "Alice", email: "alice@example.com" });
> ```
>
> #### Technical Explanation
>
> 1. `replaceOne()` expects a plain BSON document representation without `$set` or `$inc` operators.
> 2. Use `updateOne()` when applying targeted atomic update operators.
> 3. Prevents ambiguous operation intent.

---



## 6. Related Terms

- [`updateOne()` / `updateMany()`](update.md) — Partial update methods.
- [`$set` vs. Whole-Document Replacement](set_vs_replace.md) — Comparative rules.

---

## 7. Key Takeaways
- `replaceOne()` completely overwrites a document's fields.
- Preserves the original, immutable primary key `_id` of the document.
- Expects a plain JSON document as the second argument; operators are forbidden.
- Any fields omitted from the replacement document are deleted on disk.
- Never use `replaceOne` to edit single fields, as it will wipe out other data.
- Use `updateOne` + `$set` for partial edits; use `replaceOne` for complete resets.
