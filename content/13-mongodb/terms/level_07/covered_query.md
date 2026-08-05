# Covered Query

> **Level 7 — Indexes & Query Performance**
> The optimal database query state where the index itself contains all the fields requested by both the query filter and the projection, allowing MongoDB to return results directly from RAM without reading the documents on disk.

---

## 1. Prerequisites

- [`explain()` Method](explain.md) — Verifying execution plan stages.
- [Projection](../level_03/projection.md) — Limiting returned fields.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported across all relational SQL (Index-Only Scan) and NoSQL engines. Maximizes memory efficiency by eliminating disk read latency).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a typical index query:
1.  MongoDB searches the B-Tree index in memory (`IXSCAN` stage).
2.  It locates the matched index keys.
3.  It follows the pointers to the physical files on disk to load the actual documents (`FETCH` stage).
4.  It extracts the requested fields and returns them to the client.

While this is fast, the `FETCH` stage (disk read) is still the slowest step in the query loop.

Can we design a query that **never reads the documents on disk at all**?

Yes. We designed **Covered Queries** to achieve this. 

If you write a query where all the fields in the filter **and** projection are already stored inside the index B-Tree, MongoDB returns the results directly from the index in RAM. 

It skips the `FETCH` stage entirely (`totalDocsExamined` is `0`), resulting in the fastest possible database query.

---

### (2) The Rules of a Covered Query
To achieve a covered query, you must meet three strict conditions:

1.  **Index Coverage:** All fields queried in the filter (e.g. `$match`) must be part of the index.
2.  **Projection Coverage:** All fields returned in the projection must be part of the index.
3.  **`_id` Exclusion:** You **must** explicitly exclude the `_id` field in the projection (`{ _id: 0 }`), unless `_id` is part of the index itself. If you forget this, MongoDB is forced to fetch the document from disk just to retrieve the `_id` value.

---

### (3) Reality Metaphor (Locker Room Logs)
Imagine looking up employee details:
-   **Standard Index Query (Fetch):** You have a clipboard log matching employee names to their locker numbers. Someone asks: *"What is Alice's home address?"* You search your log, see Alice is assigned to locker 5, walk across the room, open locker 5, pull out her paper file, and read the address. (Search + Fetch).
-   **Covered Query (No Fetch):** Someone asks: *"What is Alice's locker number?"* 
    -   You look at your clipboard log, see Alice is locker 5, and tell them immediately. 
    -   You never had to walk across the room or open a locker because the information was already written on your clipboard.

---

### (4) Code Examples

#### Creating a Covered Query
Let's optimize a username check:

```javascript
// 1. Create a compound index
db.users.createIndex({ username: 1, status: 1 });

// 2. Run the query with projection and _id exclusion
db.users.find(
  { username: "alice" },            // Filter uses index key
  { username: 1, status: 1, _id: 0 } // Projection whitelists index keys, excludes _id!
).explain("executionStats");

// Output Stats Snippet:
{
  "executionStats": {
    "nReturned": 1,
    "totalKeysExamined": 1,
    "totalDocsExamined": 0, // CRITICAL: Zero documents read from disk!
    "executionStages": {
      "stage": "PROJECTION_COVERED", // Success! No FETCH stage exists
      "inputStage": {
        "stage": "IXSCAN",
        "indexName": "username_1_status_1"
      }
    }
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to exclude '_id: 0' in the query projection, preventing the query from being covered by the index

**The mistake:** Running the query `db.users.find({ username: "alice" }, { username: 1, status: 1 })` expecting a covered query scan.

**Why it's wrong:** Even though `username` and `status` are in the index, MongoDB's projection default includes the `_id` field. 

To return the `_id` value, the database must execute a `FETCH` stage, reading the full document from disk and slowing down the query.

**Fix: Always append `_id: 0` to your projection query parameters to ensure the query is fully covered:**

```javascript
// CORRECT
db.users.find({ username: "alice" }, { username: 1, status: 1, _id: 0 });
```

---



### Mistake 2: Failing to Exclude `_id` in Covered Queries Returning Projected Fields

**The mistake:** Querying `db.users.find({ status: 'active' }, { name: 1 })` expecting a covered query using index `{ status: 1, name: 1 }`.

**Why it's wrong:** By default, queries return `_id`. If `_id` is NOT part of the compound index, `mongod` must fetch the document on disk to read `_id`, turning off covered query mode. Exclude `_id: 0` in projection.

*Incorrect:*
```javascript
db.users.find({ status: "active" }, { name: 1 }); // Fetches disk for _id!
```

*Fix:*
```javascript
db.users.find({ status: "active" }, { name: 1, _id: 0 }); // Fully covered query
```

### Mistake 3: Expecting Covered Queries on Array Fields (Multikey Indexes)

**The mistake:** Expecting covered queries on index `{ tags: 1 }` where `tags` is an array field.

**Why it's wrong:** Multikey indexes on array fields CANNOT cover queries because array elements require document inspection for accurate bounds.

*Incorrect:*
```javascript
// Expecting covered query on array index
```

*Fix:*
```javascript
Covered queries require scalar (non-array) indexed fields
```



### Mistake 4: Failing to Exclude `_id` in Covered Queries Returning Projected Fields

**The mistake:** Querying `db.users.find({ status: 'active' }, { name: 1 })` expecting a covered query using index `{ status: 1, name: 1 }`.

**Why it's wrong:** By default, queries return `_id`. If `_id` is NOT part of the compound index, `mongod` must fetch the document on disk to read `_id`, turning off covered query mode. Exclude `_id: 0` in projection.

*Incorrect:*
```javascript
db.users.find({ status: "active" }, { name: 1 }); // Fetches disk for _id!
```

*Fix:*
```javascript
db.users.find({ status: "active" }, { name: 1, _id: 0 }); // Fully covered query
```

### Mistake 5: Expecting Covered Queries on Array Fields (Multikey Indexes)

**The mistake:** Expecting covered queries on index `{ tags: 1 }` where `tags` is an array field.

**Why it's wrong:** Multikey indexes on array fields CANNOT cover queries because array elements require document inspection for accurate bounds.

*Incorrect:*
```javascript
// Expecting covered query on array index
```

*Fix:*
```javascript
Covered queries require scalar (non-array) indexed fields
```

## 6. Practice Exercises

### Exercise 1: Covered Query Diagnostics

**Problem:** You have a `products` collection with the index: `{ sku: 1, price: 1 }`.
Analyze why the following queries are **Not Covered** by the index, and state the changes required to cover them:
1.  `db.products.find({ sku: "A10" }, { price: 1 })`
2.  `db.products.find({ sku: "A10" }, { price: 1, description: 1, _id: 0 })`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Not Covered: The projection defaults to returning the `_id` field, forcing a disk fetch. To fix: Add `_id: 0` to the projection.
> 2. Not Covered: The projection requests the `description` field, which is not part of the index keys, forcing a disk fetch. To fix: Remove `description` from the projection, or add it to the compound index.
> ```
> - Check if the projection returns the default `_id` field.
> - Verify if all fields in the projection are included in the index definition.

---



### Exercise 2: Constructing Fully Covered Query

**Problem:** Construct covered query on index `{ status: 1, email: 1 }` returning `email` without fetching documents.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ status: "active" }, { email: 1, _id: 0 });
> ```
> ```javascript
> db.users.find(
>   { status: "active" },
>   { email: 1, _id: 0 }
> );
> ```
>
> **Explanation:** Covered queries satisfy all filtered and projected fields directly from index B-Trees (`totalDocsExamined: 0`).

---

### Exercise 3: Verifying Covered Query in Explain Output

**Problem:** What value of `totalDocsExamined` in `explain()` indicates a covered query? (`0`).

**Expected output:**
> [!check]- Answer
> ```text
> totalDocsExamined: 0
> ```
> ```text
> totalDocsExamined: 0
> ```
>
> **Explanation:** `totalDocsExamined: 0` proves that zero collection disk documents were read.

## 7. Related Terms

- [`explain()` Method](explain.md) — The plan analyzer.
- [Compound Index](compound_index.md) — The target multi-key index.

---

## 8. Key Takeaways
- A Covered Query retrieves data entirely from the RAM index B-Tree.
- Eliminates the `FETCH` stage; `totalDocsExamined` is exactly `0`.
- Direct equivalent to an Index-Only Scan in relational SQL databases.
- The fastest query execution path since it avoids physical disk access.
- Requires all queried and projected fields to be present in the index.
- You must explicitly exclude `_id: 0` in the projection to prevent disk fetches.
- Highly effective for high-throughput metadata and validation queries.
