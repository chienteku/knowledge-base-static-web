# Single-Field Index

> **Level 7 — Indexes & Query Performance**
> The simplest database index type, built on a single document field, which can be traversed in either forward or backward direction to optimize equality checks, range queries, and sorts.

---

## 1. Prerequisites

- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation methods.

---

## 2. Term Category

**Index / Performance** (Single Attribute B-Tree Index): A Single Field Index creates a B-tree index over a single top-level or embedded field path in a collection.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Stored as a B-Tree structure mapping the single key value. Handled in memory to accelerate queries referencing that exact path).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Single Field Primary and Secondary Indexing

**Scenario:**
Create a single field ascending index on `username` in collection `users`.

**Requirements:**
1. Execute `createIndex({ username: 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex({ username: 1 });
> ```
>
> #### Technical Explanation
>
> 1. Single field indexes build a B-tree over a single top-level or embedded field.
> 2. Ascending (`1`) vs descending (`-1`) direction does not matter for single field sorts, as MongoDB can traverse single field B-trees in either direction.
> 3. Converts equality lookups from $O(N)$ scans to $O(\log N)$ lookups.

---

### Exercise 2: Indexing Embedded Subdocument Paths

**Scenario:**
Create a single field index on embedded path `address.zip` in collection `customers`.

**Requirements:**
1. Execute `createIndex({ "address.zip": 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.createIndex({ "address.zip": 1 });
> ```
>
> #### Technical Explanation
>
> 1. Single field indexes can target dot-notation subdocument paths (`"address.zip"`).
> 2. Indexes nested subfield values directly.
> 3. Speeds up location filtering queries.

---

### Exercise 3: Single Field Sort Traversal

**Scenario:**
Execute query `find().sort({ username: -1 })` using single field index `{ username: 1 }`.

**Requirements:**
1. Verify reverse index traversal behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find().sort({ username: -1 });
> ```
>
> #### Technical Explanation
>
> 1. Single field indexes support sorting in BOTH ascending (`1`) and descending (`-1`) directions.
> 2. WiredTiger traverses the B-tree in reverse for descending sorts.
> 3. Note: This reverse traversal flexibility applies ONLY to single field indexes, not compound indexes.

---



## 6. Related Terms

- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.
- [Compound Index](compound_index.md) — Multi-field index structures.

---

## 7. Key Takeaways
- A Single-Field Index is built on a single document field.
- Optimizes equality queries, range queries, and sorting.
- Can be traversed bidirectionally (forward and backward) with equal speed.
- The sort direction (`1` vs `-1`) does not matter for single-field indexes.
- Prevents expensive, CPU-heavy in-memory sorting operations.
- Avoid separate single-field indexes for multi-field query filters.
- Default index `_id` is a single-field index created automatically.
