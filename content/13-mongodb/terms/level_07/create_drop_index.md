# `createIndex()` / `dropIndex()`

> **Level 7 — Indexes & Query Performance**
> The DDL collection methods used to build new B-Tree index structures (`createIndex()`) or remove existing, redundant indexes (`dropIndex()`) on a collection, serving as the equivalent of SQL's `CREATE INDEX` and `DROP INDEX` commands.

---

## 1. Prerequisites
- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.

---

## 2. Term Category
- **Database Command / DDL Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through migrations script. Creating an index on a large collection builds the index asynchronously in the background by default).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you identify high-cardinality fields that are slowing down your search filters (like user email lookups), you need a way to tell the database to compile and maintain a sorted search index.

In PostgreSQL, you write:
`CREATE INDEX idx_user_email ON users(email);`

We designed **`createIndex()`** and **`dropIndex()`** to provide index management in MongoDB. 

You call these methods on the collection object, passing a JSON specification. 

MongoDB will build the index structure on disk, automatically utilizing it in subsequent queries, and updating it on every write command.

---

### (2) Method Parameters and Options

#### 1. `db.collection.createIndex(keys, options)`
-   **Keys Parameter:** Specifies fields to index. `1` represents ascending order; `-1` represents descending.
    -   *Syntax:* `{ email: 1 }`
-   **Options Parameter:** An optional object configuring index constraints:
    -   `{ unique: true }`: Enforces that no two documents can share the same value for the indexed field (like SQL `UNIQUE` key).
    -   `{ name: "custom_index_name" }`: Assigns a custom name (defaults to `field_1`).

#### 2. `db.collection.dropIndex(indexSpecification)`
Removes an index to reclaim RAM and speed up write performance.
-   You can pass the key object: `db.users.dropIndex({ email: 1 })`
-   Or the index name string: `db.users.dropIndex("email_1")`

---

### (3) Reality Metaphor
Imagine managing a large paper medical records room:
-   **`createIndex()`:** You spend an afternoon installing **Alphabetical Plastic Divider Tabs** into a drawer. You sort all the folders by last name and place them behind the tabs. (Takes time to build, but search time drops to seconds).
-   **`dropIndex()`:** You pull the plastic divider tabs out of the drawer and throw them away. 
    -   The medical folders remain in the drawer, but they are no longer organized alphabetically. 
    -   You save physical tab space, but you must now search folders one-by-one.

---

### (4) Code Examples

#### Creating, Viewing, and Dropping Indexes
Let's build a unique index on email:

```javascript
// 1. Create a unique index on the email field
db.users.createIndex(
  { email: 1 }, 
  { unique: true }
);
// Output: "email_1" index is built

// 2. View all indexes active on this collection
db.users.getIndexes();
// Returns: [ { name: "_id_" }, { name: "email_1" } ]

// 3. Drop the index using its name string
db.users.dropIndex("email_1");
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to create a unique index on a field that already contains duplicate values in the collection

**The mistake:** Running `db.users.createIndex({ email: 1 }, { unique: true })` on a collection where two users have registered using the same email address `"test@mail.com"`.

**Why it's wrong:** The database compiler checks existing documents. 

If duplicates exist, the index build will abort and throw a duplicate key error:
`ERROR: E11000 duplicate key error collection`

**Fix: Before building a unique index, you must search and clean up duplicate records in the collection, or write scripts to delete or merge the duplicate profiles.**

---



### Mistake 2: Dropping Production Indexes During Peak Business Traffic Hours

**The mistake:** Running `db.collection.dropIndex('large_idx')` during peak traffic.

**Why it's wrong:** Dropping an active index during peak hours forces executing queries into un-indexed `COLLSCAN`s, collapsing application throughput.

*Incorrect:*
```javascript
// Running dropIndex on production during peak traffic
```

*Fix:*
```javascript
Hide index using db.collection.hideIndex() first to test impact before dropping
```

### Mistake 3: Re-Building Existing Indexes Without Checking `db.collection.getIndexes()`

**The mistake:** Executing duplicate `createIndex()` commands on every application boot routine.

**Why it's wrong:** Although `createIndex()` is idempotent, checking `getIndexes()` avoids un-necessary database RPC roundtrips during startup.

*Incorrect:*
```javascript
// Calling createIndex 50 times on every app restart
```

*Fix:*
```javascript
Execute index creation migration scripts separately in deployment pipelines
```



### Mistake 4: Dropping Production Indexes During Peak Business Traffic Hours

**The mistake:** Running `db.collection.dropIndex('large_idx')` during peak traffic.

**Why it's wrong:** Dropping an active index during peak hours forces executing queries into un-indexed `COLLSCAN`s, collapsing application throughput.

*Incorrect:*
```javascript
// Running dropIndex on production during peak traffic
```

*Fix:*
```javascript
Hide index using db.collection.hideIndex() first to test impact before dropping
```

### Mistake 5: Re-Building Existing Indexes Without Checking `db.collection.getIndexes()`

**The mistake:** Executing duplicate `createIndex()` commands on every application boot routine.

**Why it's wrong:** Although `createIndex()` is idempotent, checking `getIndexes()` avoids un-necessary database RPC roundtrips during startup.

*Incorrect:*
```javascript
// Calling createIndex 50 times on every app restart
```

*Fix:*
```javascript
Execute index creation migration scripts separately in deployment pipelines
```

## 6. Practice Exercises

### Exercise 1: Unique Index Creation

**Problem:** You have a `products` collection. Write the MongoDB query to create a unique index on the `sku` field, sorting in ascending order.

**Expected output:**
```javascript
db.products.createIndex({ sku: 1 }, { unique: true });
```

> [!check]- Answer
> - The key specification is `{ sku: 1 }`.
> - Pass the unique option flag inside the second parameter object.

---



### Exercise 2: Creating Single Field Index

**Problem:** Create ascending index on `email` field named `email_asc_idx`.

**Expected output:**
```text
db.users.createIndex({ email: 1 }, { name: "email_asc_idx" });
```

> [!check]- Answer
> ```javascript
> db.users.createIndex({ email: 1 }, { name: "email_asc_idx" });
> ```
>
> **Explanation:** `createIndex({ field: 1 })` builds an ascending B-Tree index.

### Exercise 3: Hiding Index with `hideIndex`

**Problem:** Hide index `old_idx` to test if query performance drops without deleting the index.

**Expected output:**
```text
db.users.hideIndex("old_idx");
```

> [!check]- Answer
> ```javascript
> db.users.hideIndex("old_idx");
> ```
>
> **Explanation:** `hideIndex()` hides an index from the query planner to safely test index removal impact.

## 7. Related Terms
- [Index (Concept in MongoDB)](index_concept.md) — The parent B-Tree index theory.
- [Background / Rolling Index Builds](index_builds.md) — Index construction locks.

---

## 8. Key Takeaways
- `createIndex()` builds B-Tree indexes; `dropIndex()` removes them.
- Direct NoSQL equivalent to SQL's `CREATE INDEX` and `DROP INDEX` commands.
- Use `{ unique: true }` to enforce value uniqueness at the database layer.
- View active indexes using `db.collection.getIndexes()`.
- Drop indexes using their key specification or their name string.
- Creating unique indexes fails if the collection already contains duplicates.
- Redundant indexes should be dropped to speed up write query operations.
