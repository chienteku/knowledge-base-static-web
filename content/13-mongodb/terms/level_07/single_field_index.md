# Single-Field Index

> **Level 7 — Indexes & Query Performance**
> The simplest database index type, built on a single document field, which can be traversed in either forward or backward direction to optimize equality checks, range queries, and sorts.

---

## 1. Prerequisites
- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation methods.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Stored as a B-Tree structure mapping the single key value. Handled in memory to accelerate queries referencing that exact path).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When users search a catalog, they frequently filter by a single attribute:
-   Finding a user by their unique `email`.
-   Finding all products priced under `$20`.
-   Sorting a list of logs by `created_at` (newest first).

We designed the **Single-Field Index** to optimize these queries. 

It takes a single field and stores its values in a sorted list. 

This accelerates three query patterns:
1.  **Equality queries:** `find({ age: 25 })` jumps directly to the 25 block.
2.  **Range queries:** `find({ age: { $gt: 21 } })` scans from 21 to the end.
3.  **Sorting:** `find().sort({ age: 1 })` reads the sorted index directly, avoiding an expensive in-memory sort.

---

### (2) Bidirectional Traversal
A key feature of Single-Field Indexes is that **MongoDB can traverse them in either direction (forward or backward) with equal efficiency.**

If you create an ascending index:
`db.users.createIndex({ age: 1 })`

This index can optimize both of these sorting queries:
-   `db.users.find().sort({ age: 1 })` (Forward scan).
-   `db.users.find().sort({ age: -1 })` (Backward scan).

Therefore, when building a single-field index, the sort direction (`1` or `-1`) does not matter.

---

### (3) Reality Metaphor (Alphabetical Name List)
Imagine a printed sheet of paper listing customer names sorted alphabetically from A to Z:
-   **Equality search:** To find `"John"`, you go directly to the **"J"** section.
-   **Range search:** To find all names starting after `"T"`, you read the list from `"T"` down to the bottom.
-   **Reverse Sort:** If you want to read names in reverse order (Z to A), you simply start reading the sheet **from the bottom page up**. 
    -   You don't need to print a new sheet of paper; you just change your reading direction.

---

### (4) Code Examples

#### Creating and Querying Single-Field Indexes
Let's optimize a score tracker:

```javascript
// 1. Create a single-field index on the score field
db.players.createIndex({ score: 1 });

// 2. Query: Equality (uses index scan)
db.players.find({ score: 100 });

// 3. Query: Range (uses index range scan)
db.players.find({ score: { $gte: 80 } });

// 4. Query: Sort (uses backward index scan, no in-memory sort!)
db.players.find().sort({ score: -1 });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating separate single-field indexes on two fields, expecting them to run fast on a query that filters by both fields

**The mistake:** Creating an index on `first_name` and a separate index on `last_name`, assuming this optimizes the query `db.users.find({ first_name: "Alice", last_name: "Smith" })`.

**Why it's wrong:** MongoDB cannot easily merge two separate indexes for a single query. 

It must choose one index (e.g. `first_name_1`), use it to find all "Alices", and then perform a slow collection scan on those documents to filter for "Smith". 

*(Note: While MongoDB can sometimes use Index Intersection, it is much slower than a proper compound index).*

**Fix: If you frequently query by multiple fields together, do not use separate single-field indexes. Create a single Compound Index containing both fields: `{ first_name: 1, last_name: 1 }`.**

---



### Mistake 2: Specifying Ascending (`1`) vs Descending (`-1`) Direction for Single-Field Indexes

**The mistake:** Creating two single-field indexes `{ age: 1 }` and `{ age: -1 }` on the same field.

**Why it's wrong:** For single-field indexes, direction does NOT matter! MongoDB can traverse single-field B-Tree indexes in both forward and reverse directions. `{ age: -1 }` is redundant.

*Incorrect:*
```javascript
db.users.createIndex({ age: 1 });
db.users.createIndex({ age: -1 }); // ❌ Redundant duplicate index!
```

*Fix:*
```javascript
db.users.createIndex({ age: 1 }); // Traverses both ascending and descending
```

### Mistake 3: Indexing Default Primary Key `_id` Field Explicitly

**The mistake:** Running `db.users.createIndex({ _id: 1 })` on a newly created collection.

**Why it's wrong:** MongoDB automatically creates an ascending unique index on `_id` for every collection. Re-creating `_id` index is redundant.

*Incorrect:*
```javascript
db.users.createIndex({ _id: 1 }); // Redundant default index
```

*Fix:*
```javascript
Rely on automatic default _id index
```



### Mistake 4: Specifying Ascending (`1`) vs Descending (`-1`) Direction for Single-Field Indexes

**The mistake:** Creating two single-field indexes `{ age: 1 }` and `{ age: -1 }` on the same field.

**Why it's wrong:** For single-field indexes, direction does NOT matter! MongoDB can traverse single-field B-Tree indexes in both forward and reverse directions. `{ age: -1 }` is redundant.

*Incorrect:*
```javascript
db.users.createIndex({ age: 1 });
db.users.createIndex({ age: -1 }); // ❌ Redundant duplicate index!
```

*Fix:*
```javascript
db.users.createIndex({ age: 1 }); // Traverses both ascending and descending
```

### Mistake 5: Indexing Default Primary Key `_id` Field Explicitly

**The mistake:** Running `db.users.createIndex({ _id: 1 })` on a newly created collection.

**Why it's wrong:** MongoDB automatically creates an ascending unique index on `_id` for every collection. Re-creating `_id` index is redundant.

*Incorrect:*
```javascript
db.users.createIndex({ _id: 1 }); // Redundant default index
```

*Fix:*
```javascript
Rely on automatic default _id index
```

## 6. Practice Exercises

### Exercise 1: Index Creation Command

**Problem:** You have an `orders` collection. Users frequently query orders placed after a specific date, sorting them from newest to oldest. 
Write the query to create a single-field index on the `created_at` field (use ascending order).

**Expected output:**
> [!check]- Answer
> ```javascript
> db.orders.createIndex({ created_at: 1 });
> ```
> - The index targets only the single field `created_at`.
> - Use the value `1` to specify the index key direction.

---



### Exercise 2: Creating Single-Field Index

**Problem:** Create ascending single-field index on `username` in `users` collection.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.createIndex({ username: 1 });
> ```
> ```javascript
> db.users.createIndex({ username: 1 });
> ```
>
> **Explanation:** `createIndex({ field: 1 })` indexes a single field in ascending B-Tree order.

---

### Exercise 3: Single-Field Index Traversal Direction

**Problem:** Can single-field index `{ age: 1 }` satisfy query `.sort({ age: -1 })`? (Yes, single-field indexes traverse both directions).

**Expected output:**
> [!check]- Answer
> ```text
> Yes, single-field indexes traverse both ascending and descending directions
> ```
> ```text
> Yes, single-field indexes traverse both ascending and descending directions
> ```
>
> **Explanation:** B-Tree pointers allow reverse traversal for single-field index queries.

## 7. Related Terms
- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.
- [Compound Index](compound_index.md) — Multi-field index structures.

---

## 8. Key Takeaways
- A Single-Field Index is built on a single document field.
- Optimizes equality queries, range queries, and sorting.
- Can be traversed bidirectionally (forward and backward) with equal speed.
- The sort direction (`1` vs `-1`) does not matter for single-field indexes.
- Prevents expensive, CPU-heavy in-memory sorting operations.
- Avoid separate single-field indexes for multi-field query filters.
- Default index `_id` is a single-field index created automatically.
