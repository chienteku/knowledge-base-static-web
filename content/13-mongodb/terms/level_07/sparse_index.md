# Sparse Index

> **Level 7 — Indexes & Query Performance**
> The database index type that only includes documents containing the indexed field—skipping documents where the field is absent—to solve the duplicate null crash on optional unique fields, and its sorting limitations.

---

## 1. Prerequisites

- [Unique Index](unique_index.md) — The parent constraint.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Checking field presence.

---

## 2. Term Category

**Index / Performance** (Present-Keys-Only Sub-Index): A Sparse Index contains B-tree entries ONLY for documents where the indexed field is present, omitting missing fields.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Calculated during the index insertion loop. Reduces index storage space by excluding documents missing the targeted key).

### (1) Design Motivation — "Why did we design this?"
As learned in `unique_index.md`, unique indexes on optional fields crash when a second document is inserted without the field, because MongoDB indexes the missing keys as duplicate `null` values.

We designed the **Sparse Index** to resolve this optional field problem. 

By setting the `{ sparse: true }` option, you tell the indexer: **"Only add a document to the index B-Tree if it physically contains the indexed field. If the field is missing, ignore the document."**

This has two major benefits:
1.  **Saves Disk/RAM:** The index is smaller because it only tracks a subset of documents.
2.  **Solves Duplicate Nulls:** Documents missing the field write nothing to the index, preventing duplicate key errors.

---

### (2) The Sparse Index Sort Gotcha (CRITICAL)
While sparse indexes are great for saving space, they carry a major query behavior rule: **MongoDB will ignore a sparse index for sorting unless the query filter explicitly checks that the field exists.**

Suppose you run:
`db.users.find().sort({ phone: 1 })`

-   The query planner **will ignore** the sparse index on `phone` and run a slow in-memory sort.
-   *Why?* Because a sparse index is missing documents (those without phones). If the query used the sparse index to retrieve users, it would exclude all users without a phone number, returning incomplete results.
-   To force the query planner to use the sparse index, you must explicitly filter for the field's existence:
    `db.users.find({ phone: { $exists: true } }).sort({ phone: 1 })`

---

### (3) Reality Metaphor (The VIP Rolodex)
Imagine managing customer files:
-   **Sparse Index:** A small **VIP Member Rolodex** on your desk. 
    -   You only write a card if a customer has a VIP Member ID. 
    -   If a standard walk-in customer arrives (no VIP field), you write nothing. You can have thousands of walk-ins without creating cards.
-   **The Sort Gotcha:** The manager asks for a list of *all* customers sorted alphabetically. 
    -   You cannot use the Rolodex because it is missing the walk-in customers. 
    -   You must walk to the main archive cabinet and scan all files from start to finish. 
    -   You can only use the Rolodex if the manager asks: *"Give me alphabetical names of VIP members only"* (`$exists: true`).

---

### (4) Code Examples

#### Resolving Duplicate Nulls
Let's build a sparse unique index:

```javascript
// 1. Create a unique sparse index
db.users.createIndex(
  { referral_code: 1 }, 
  { unique: true, sparse: true }
);

// 2. User 1: Succeeds (no referral_code written to index)
db.users.insertOne({ username: "alice" });

// 3. User 2: Succeeds! (No duplicate key error)
db.users.insertOne({ username: "bob" });

// 4. Query: Sort (FAILS to use index, runs collection scan)
db.users.find().sort({ referral_code: 1 });

// 5. Query: Sort (SUCCESS - uses sparse index because of exists filter!)
db.users.find({ referral_code: { $exists: true } }).sort({ referral_code: 1 });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Running paginated sorting queries on optional sparse fields, wondering why query speeds are slow

**The mistake:** Creating a sparse index on `score` and writing the query `db.users.find().sort({ score: 1 }).limit(10)` expecting an index-supported sort.

**Why it's wrong:** Because the query does not filter for `score: { $exists: true }`, the query planner ignores the index and reads every document from disk to sort them in memory.

**Fix: When sorting by a sparse index field, you must add the `{ field: { $exists: true } }` condition to your query filter to unlock index optimization.**

---





### Mistake 2: Expecting Sparse Indexes to Satisfy `sort()` Queries Without Filter Predicates

**The mistake:** Creating sparse index `{ phone: 1 }` and querying `db.users.find().sort({ phone: 1 })`.

**Why it's wrong:** If a query lacks `{ phone: { $exists: true } }` filter predicates, the query planner bypasses sparse indexes for `sort()` to avoid missing documents where `phone` is absent.

*Incorrect:*
```javascript
db.users.createIndex({ phone: 1 }, { sparse: true });
db.users.find().sort({ phone: 1 }); // ❌ Bypasses sparse index!
```

*Fix:*
```javascript
db.users.find({ phone: { $exists: true } }).sort({ phone: 1 });
```



### Mistake 3: Using Sparse Indexes When Partial Indexes Provide Greater Control

**The mistake:** Using `sparse: true` for compound indexes.

**Why it's wrong:** For compound indexes, sparse indexes index documents where at least one indexed field exists. Use `partialFilterExpression` for explicit field existence rules.

*Incorrect:*
```javascript
// Using sparse for compound index conditional rules
```

*Fix:*
```javascript
Use partialFilterExpression for compound conditional index rules
```



## 5. Practice Exercises

### Exercise 1: Creating Present-Keys-Only Sparse Indexes

**Scenario:**
Create a sparse unique index on optional field `taxId` in collection `customers` to allow multiple documents to omit `taxId`.

**Requirements:**
1. Execute `createIndex({ taxId: 1 }, { unique: true, sparse: true })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.createIndex(
>   { taxId: 1 },
>   { unique: true, sparse: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. Sparse indexes contain B-tree entries ONLY for documents where the indexed field is present.
> 2. A non-sparse unique index treats missing fields as `null`, rejecting multiple documents with missing fields as duplicate `null` keys.
> 3. Sparse unique indexes allow multiple documents to omit the field while enforcing uniqueness for populated values.

---

### Exercise 2: Sparse Index Query Traversal Restrictions

**Scenario:**
Explain why query `find().sort({ taxId: 1 })` bypasses a sparse index unless `taxId` is present in the query filter.

**Requirements:**
1. Explain sparse index sort bypass behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ❌ Bypasses Sparse Index -> Forces COLLSCAN (sparse index omits missing keys, cannot guarantee complete result set)
> db.customers.find().sort({ taxId: 1 });
> 
> // ✅ Uses Sparse Index (filter guarantees field presence)
> db.customers.find({ taxId: { $exists: true } }).sort({ taxId: 1 });
> ```
>
> #### Technical Explanation
>
> 1. Because sparse indexes omit documents missing the indexed key, MongoDB cannot use a sparse index for queries that expect a complete collection result set.
> 2. Query filter must explicitly require key presence (`$exists: true` or `$gt`) to trigger sparse index usage.
> 3. Prefer Partial Indexes for modern MongoDB deployments.

---

### Exercise 3: Comparing Sparse vs Partial Indexes

**Scenario:**
Formulate a technical recommendation comparing legacy Sparse Indexes against modern Partial Indexes.

**Requirements:**
1. Contrast `sparse: true` vs `partialFilterExpression: { field: { $exists: true } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Index Selection Guidance:
> - Sparse Index: Legacy option (indexes present keys only).
> - Partial Index: Modern superset (allows filtering on presence, value ranges, and multi-field expressions).
> Recommendation: Use Partial Indexes for all new schema designs.
> ```
>
> #### Technical Explanation
>
> 1. Partial indexes offer a strict superset of sparse index functionality.
> 2. Provides explicit control over index inclusion criteria.
> 3. Standard best practice in modern MongoDB versions.

---



## 6. Related Terms

- [Unique Index](unique_index.md) — The parent constraint.
- [Partial Index](partial_index.md) — The modern alternative.

---

## 7. Key Takeaways
- A Sparse Index only indexes documents containing the specified field.
- Resolves the duplicate null crash when creating unique indexes on optional fields.
- Saves disk storage and memory by skipping documents missing the field.
- Ignored for sorting queries unless the query includes `{ field: { $exists: true } }`.
- Restricting queries to existence matches avoids slow in-memory sorts.
- Functional equivalent to partial indexes, but has less query predicate flexibility.
- Drop and recreate indexes when migrating standard indexes to sparse configurations.
