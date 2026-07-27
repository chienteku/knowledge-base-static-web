# `sort()` / `limit()` / `skip()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB cursor methods chained to queries to order documents (`sort()`), restrict result counts (`limit()`), and bypass starting offsets (`skip()`) for implementing application pagination.

---

## 1. Prerequisites
- [Cursor](cursor.md) — The query result pointer modified by these methods.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported across all database engines. Relies on indexes to avoid expensive in-memory sorting operations).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When users browse an online store or dashboard, they expect to organize and paginate data:
-   Sorting products from **Cheapest to Most Expensive**.
-   Displaying only **20 items per page** to keep the site fast.
-   Clicking "Page 3" to skip the first 40 items.

In PostgreSQL, you write this inside the query string:
`SELECT * FROM products ORDER BY price ASC LIMIT 20 OFFSET 40;`

We designed the **`sort()`**, **`limit()`**, and **`skip()`** cursor methods to enable the same pagination logic in MongoDB. 

These methods are chained directly to the `find()` query: the database engine processes these operations on disk *before* returning data, ensuring you only pull the requested page over the network.

---

### (2) The Cursor Chain Operations

#### 1. `sort(sort_specification)`
Orders documents based on fields.
-   `1` represents **Ascending** order (lowest to highest, A–Z).
-   `-1` represents **Descending** order (highest to lowest, Z–A).
-   *Syntax:* `sort({ price: 1, name: -1 })`

#### 2. `limit(N)`
Restricts the returned results to a maximum count of `N` documents. (Equivalent to SQL `LIMIT`).

#### 3. `skip(N)`
Bypasses the first `N` matching documents, starting output delivery from index `N + 1`. (Equivalent to SQL `OFFSET`).

---

### (3) The Execution Order Guarantee
No matter what order you write these methods in your application code:
`db.products.find().skip(40).limit(20).sort({ price: 1 })`

MongoDB's query planner **always evaluates them in a strict internal sequence:**
1.  **Sort** the records first.
2.  **Skip** the specified offset records.
3.  **Limit** the final output count.

This ensures you get consistent, predictable pages every time.

---

### (4) Reality Metaphor (Olympic Race Results)
Imagine evaluating runners at a track meet:
-   **`sort({ time: 1 })`:** You line up all runners in order of their race completion times (fastest runner first).
-   **`skip(3)`:** You bypass the top 3 runners (the gold, silver, and bronze medalists) because you want to audit the other runners.
-   **`limit(5)`:** You select only the next 5 runners to inspect, ignoring the remaining runners down the line.

---

### (5) Code Examples

#### Page 3 Pagination Query (10 items per page)
To fetch Page 3, we skip the first 20 items (Page 1 & 2) and limit the result to 10:

```javascript
db.products.find()
  .sort({ price: 1 })               // Sort by price: lowest to highest
  .skip(20)                         // Skip first 20 products
  .limit(10);                       // Return only the next 10 products
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Utilizing high 'skip()' offsets to paginate through millions of documents

**The mistake:** Implementing infinite scroll or pagination on a collection containing 10 million rows by running `db.logs.find().skip(5000000).limit(50)`.

**Why it's wrong:** To skip 5 million documents, the MongoDB engine must physically scan, count, and discard 5 million index keys on disk before reading the 50 target documents. 

As the page number increases, queries become slower, taking seconds to run and consuming high disk I/O. 

This is called **Skip Offset Lag**.

**Fix: For large datasets, use Keyset Pagination (or "Range Queries") instead of `skip()`. Record the value of the last item on the page (e.g. its `_id` or timestamp), and filter for records greater than that value in the next query:**

```javascript
// CORRECT (Instant lookup, even on page 10,000!)
db.logs.find({ 
  _id: { $gt: ObjectId("65fc71239b1d8b2e88a8d1a1") } // Last ID from page 2
})
.limit(50);
```

---



### Mistake 2: Using High `skip()` Offsets for Large Page Pagination (Deep Pagination Bottleneck)

**The mistake:** Executing `db.posts.find().sort({ createdAt: -1 }).skip(100000).limit(20)` for page 5,000.

**Why it's wrong:** `skip(100000)` forces the server to scan and discard 100,000 documents sequentially before returning 20 items. Use Range-Based / Cursor-Based Pagination (`createdAt: { $lt: lastDate }`).

*Incorrect:*
```javascript
db.posts.find().sort({ createdAt: -1 }).skip(100000).limit(20); // ❌ High skip CPU scan!
```

*Fix:*
```javascript
db.posts.find({ createdAt: { $lt: lastCreatedAt } }).sort({ createdAt: -1 }).limit(20); // Cursor pagination
```

### Mistake 3: Calling `sort()`, `limit()`, and `skip()` in Incorrect Method Execution Orders in Drivers

**The mistake:** Expecting query chaining order `.skip(10).limit(5).sort({ age: 1 })` to alter execution semantics.

**Why it's wrong:** MongoDB query engine ALWAYS executes operations in strict order: 1. `sort()`, 2. `skip()`, 3. `limit()`, regardless of method chaining order in driver APIs.

*Incorrect:*
```javascript
// Assuming skip before sort changes execution order
```

*Fix:*
```javascript
MongoDB engine always applies sort -> skip -> limit internally
```



### Mistake 4: Using High `skip()` Offsets for Large Page Pagination (Deep Pagination Bottleneck)

**The mistake:** Executing `db.posts.find().sort({ createdAt: -1 }).skip(100000).limit(20)` for page 5,000.

**Why it's wrong:** `skip(100000)` forces the server to scan and discard 100,000 documents sequentially before returning 20 items. Use Range-Based / Cursor-Based Pagination (`createdAt: { $lt: lastDate }`).

*Incorrect:*
```javascript
db.posts.find().sort({ createdAt: -1 }).skip(100000).limit(20); // ❌ High skip CPU scan!
```

*Fix:*
```javascript
db.posts.find({ createdAt: { $lt: lastCreatedAt } }).sort({ createdAt: -1 }).limit(20); // Cursor pagination
```

### Mistake 5: Calling `sort()`, `limit()`, and `skip()` in Incorrect Method Execution Orders in Drivers

**The mistake:** Expecting query chaining order `.skip(10).limit(5).sort({ age: 1 })` to alter execution semantics.

**Why it's wrong:** MongoDB query engine ALWAYS executes operations in strict order: 1. `sort()`, 2. `skip()`, 3. `limit()`, regardless of method chaining order in driver APIs.

*Incorrect:*
```javascript
// Assuming skip before sort changes execution order
```

*Fix:*
```javascript
MongoDB engine always applies sort -> skip -> limit internally
```

## 6. Practice Exercises

### Exercise 1: Pagination Translation

**Problem:** Translate this SQL query into a valid MongoDB cursor chain statement:
`SELECT name FROM products ORDER BY qty DESC LIMIT 15 OFFSET 30;`
(Include the projection mapping to only select the `name` field, hiding `_id`).

**Expected output:**
```javascript
db.products.find({}, { name: 1, _id: 0 })
  .sort({ qty: -1 })
  .skip(30)
  .limit(15);
```

> [!check]- Answer
> - The projection document is passed as the second argument to `find()`.
> - Order the descending query using `-1` for the `qty` field key.
> - Chain the cursor methods `.sort()`, `.skip()`, and `.limit()`.

---



### Exercise 2: Sorting and Limiting Query Results

**Problem:** Get top 5 youngest active users sorted by `age` ascending.

**Expected output:**
```text
db.users.find({ active: true }).sort({ age: 1 }).limit(5);
```

> [!check]- Answer
> ```javascript
> db.users.find({ active: true })
>   .sort({ age: 1 })
>   .limit(5);
> ```
>
> **Explanation:** `.sort({ field: 1 })` sorts ascending; `.limit(N)` caps returned document counts.

### Exercise 3: Cursor-Based Range Pagination Pattern

**Problem:** Query next 10 posts created before `lastId` ObjectId using range-based pagination.

**Expected output:**
```text
db.posts.find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(10);
```

> [!check]- Answer
> ```javascript
> db.posts.find({
>   _id: { $lt: lastId }
> }).sort({ _id: -1 }).limit(10);
> ```
>
> **Explanation:** Range-based pagination avoids expensive `skip()` offsets by using index predicates.



### Exercise 4: Sorting and Limiting Query Results

**Problem:** Get top 5 youngest active users sorted by `age` ascending.

**Expected output:**
```text
db.users.find({ active: true }).sort({ age: 1 }).limit(5);
```

> [!check]- Answer
> ```javascript
> db.users.find({ active: true })
>   .sort({ age: 1 })
>   .limit(5);
> ```
>
> **Explanation:** `.sort({ field: 1 })` sorts ascending; `.limit(N)` caps returned document counts.

### Exercise 5: Cursor-Based Range Pagination Pattern

**Problem:** Query next 10 posts created before `lastId` ObjectId using range-based pagination.

**Expected output:**
```text
db.posts.find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(10);
```

> [!check]- Answer
> ```javascript
> db.posts.find({
>   _id: { $lt: lastId }
> }).sort({ _id: -1 }).limit(10);
> ```
>
> **Explanation:** Range-based pagination avoids expensive `skip()` offsets by using index predicates.

## 7. Related Terms
- [Cursor](cursor.md) — The parent pointer modified.
- [Projection](projection.md) — The column filtering argument.

---

## 8. Key Takeaways
- `sort()`, `limit()`, and `skip()` are cursor methods used to paginate data.
- Direct equivalents to SQL's `ORDER BY`, `LIMIT`, and `OFFSET` clauses.
- `1` represents ascending sort order; `-1` represents descending.
- The query optimizer always runs Sort first, then Skip, then Limit.
- Large `skip()` offsets scan and discard index keys, slowing performance.
- Use Keyset Pagination (`$gt` last value) instead of `skip` for massive lists.
- Pair sorting fields with database indexes to prevent memory sort errors.
