# `insertOne()` / `insertMany()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to write a single document (`insertOne()`) or a list of multiple documents (`insertMany()`) to a collection, serving as the equivalent of SQL's `INSERT INTO` statement.

---

## 1. Prerequisites

- [Collection](../level_01/collection.md) — The target container where documents are written.

---

## 2. Term Category

**CRUD Operation** (Document Insertion Methods): Insert operations (insertOne(), insertMany()) add new BSON documents to a MongoDB collection.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through application database drivers. Automatically validates document size constraints before saving).

### (1) Design Motivation — "Why did we design this?"
To build any application, you need a way to save new data: registering users, creating order logs, or posting blog comments.

In PostgreSQL, you use the standard SQL insert statement:
`INSERT INTO users (name, email) VALUES ('Alice', 'alice@company.com');`

This requires specifying columns, and values must match the column order.

We designed **`insertOne()`** and **`insertMany()`** to provide an object-oriented way to write data. 

Because MongoDB works with JSON documents, you simply pass your programming language objects directly to the methods. 

There are no tables to coordinate or column orders to memorize: you write the object as it exists in your application memory, and MongoDB writes it directly to disk.

---

### (2) Single vs. Bulk Insertion

#### 1. `insertOne()`
Writes a single document to the collection.
-   *Parameter:* A single JSON object `{}`.
-   *Return Value:* An object indicating success (`acknowledged: true`) and the unique `_id` of the written document (`insertedId`).

#### 2. `insertMany()`
Writes multiple documents in a single database roundtrip, optimizing write performance.
-   *Parameter:* An array of JSON objects `[{}, {}]`.
-   *Return Value:* An object containing a map list of all generated `insertedIds`.

---

### (3) Reality Metaphor
Imagine filing paperwork in an office drawer:
-   **`insertOne()`:** You open the file cabinet drawer, place a **single new Manila Folder** inside, and slide the drawer closed.
-   **`insertMany()`:** You grab a **stacked bundle of 5 separate folders**, open the drawer, and drop the entire stack inside in one motion (saves time and physical movements).

---

### (4) Code Examples

#### 1. Writing a Single Document (insertOne)
If you omit the `_id` field, MongoDB automatically generates a unique BSON `ObjectId` for you:

```javascript
db.users.insertOne({
  name: "Alice Smith",
  email: "alice@company.com",
  age: 28
});
// Output:
// {
//   acknowledged: true,
//   insertedId: ObjectId("65fc71239b1d8b2e88a8d111")
// }
```

#### 2. Writing Multiple Documents (insertMany)
Pass documents wrapped in a JavaScript array (`[]`):

```javascript
db.products.insertMany([
  { name: "Laptop", price: NumberDecimal("999.99"), qty: 10 },
  { name: "Mouse", price: NumberDecimal("19.99"), qty: 45 }
]);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing a single document object directly to insertMany() instead of wrapping it in an array

**The mistake:** Running the query `db.users.insertMany({ name: "Bob" })` in your backend code.

**Why it's wrong:** The `insertMany()` method expects a JavaScript **Array** as its first parameter. 

If you pass a raw object `{}` directly, the MongoDB driver or shell will throw a syntax/validation error and abort the write.

**Fix: Always wrap documents in square brackets `[]` when calling `insertMany()`, even if you are only inserting a single document in a dynamic list.**

```javascript
// CORRECT
db.users.insertMany([ { name: "Bob" } ]);
```

---





### Mistake 2: Using Deprecated `insert()` Shell Method in Modern Applications

**The mistake:** Calling `db.collection.insert({ name: 'Alice' })`.

**Why it's wrong:** Legacy `insert()` returns inconsistent result objects across drivers. Use `insertOne()` for single documents or `insertMany()` for arrays.

*Incorrect:*
```javascript
await db.users.insert({ name: "Alice" }); // ❌ Legacy deprecated method!
```

*Fix:*
```javascript
await db.users.insertOne({ name: "Alice" }); // Modern insertOne method
```



### Mistake 3: Passing Single Objects to `insertMany()` instead of Arrays

**The mistake:** Calling `db.users.insertMany({ name: 'Alice' })` (TypeError).

**Why it's wrong:** `insertMany()` strictly expects an array of document objects `[{ name: 'Alice' }]`.

*Incorrect:*
```javascript
await db.users.insertMany({ name: "Alice" }); // ❌ Expected array!
```

*Fix:*
```javascript
await db.users.insertMany([{ name: "Alice" }]); // Correct array input
```



## 5. Practice Exercises

### Exercise 1: Single Document Insertion with `insertOne`

**Scenario:**
Insert a new user document into collection `users` and retrieve its auto-generated `_id` ObjectId.

**Requirements:**
1. Execute `db.users.insertOne({ name: "Alice", email: "alice@example.com" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const result = db.users.insertOne({
>   name: "Alice Smith",
>   email: "alice@example.com",
>   createdAt: new Date()
> });
> console.log("Inserted ObjectId:", result.insertedId);
> ```
>
> #### Technical Explanation
>
> 1. `insertOne()` adds a single BSON document to the target collection.
> 2. Automatically generates an `_id` ObjectId if omitted from the document.
> 3. Returns `insertedId` in the write result payload.

---

### Exercise 2: Batch Document Insertion with `insertMany`

**Scenario:**
Insert 3 product documents into collection `products` in a single batch write call.

**Requirements:**
1. Execute `db.products.insertMany([...])`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const result = db.products.insertMany([
>   { name: "Mouse", price: 29.99 },
>   { name: "Keyboard", price: 89.99 },
>   { name: "Monitor", price: 249.99 }
> ]);
> console.log("Inserted IDs:", result.insertedIds);
> ```
>
> #### Technical Explanation
>
> 1. `insertMany()` inserts an array of documents in a single network batch payload.
> 2. Reduces network roundtrip latency significantly compared to multiple `insertOne()` calls.
> 3. Returns a map of array indexes to inserted ObjectIds.

---

### Exercise 3: Ordered vs Unordered Inserts

**Scenario:**
Configure `insertMany()` with `{ ordered: false }` so that if one document fails validation, remaining documents continue inserting.

**Requirements:**
1. Pass `{ ordered: false }` option.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   db.users.insertMany([
>     { _id: 1, name: "Alice" },
>     { _id: 1, name: "Bob" }, // Duplicate key error!
>     { _id: 2, name: "Carol" }
>   ], { ordered: false });
> } catch (err) {
>   console.warn("Batch completed with some errors:", err.message);
> }
> ```
>
> #### Technical Explanation
>
> 1. Default `ordered: true` stops processing remaining documents upon encountering a write error.
> 2. `ordered: false` attempts to insert all documents regardless of individual write errors.
> 3. Maximizes write throughput for bulk data imports.

---



## 6. Related Terms

- [Collection](../level_01/collection.md) — The parent data container.
- [Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)](write_results.md) — Understanding the insert outputs.
- [`bulkWrite()`](bulk_write.md) — Related concept: `bulkWrite()`.

---

## 7. Key Takeaways
- `insertOne()` writes a single document; `insertMany()` writes a list.
- Serves as the MongoDB equivalent to PostgreSQL's `INSERT INTO` statements.
- Expects standard JSON objects/arrays directly from application code.
- Automatically generates a unique `ObjectId` for the `_id` field if omitted.
- `insertMany()` reduces network overhead by writing bulk data in one roundtrip.
- Always wrap `insertMany()` parameters in a JavaScript array `[]`.
