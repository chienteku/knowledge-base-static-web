# Compound Index

> **Level 7 — Indexes & Query Performance**
> The database index type built on two or more document fields, where field ordering is critical to satisfy search prefix matching and multi-field sort direction requirements.

---

## 1. Prerequisites

- [Index (Concept in MongoDB)](index_concept.md) — Index fundamentals.
- [Single-Field Index](single_field_index.md) — The parent index type.
- [Index Selectivity & Cardinality](index_selectivity.md) — Determining index suitability.

---

## 2. Term Category

**Index / Performance** (Multi-Key Composite B-Tree Index): A Compound Index indexes multiple document fields in a specified field order, supporting multi-attribute filtering, sorting, and prefix matching.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Stored as a single B-Tree structure where index keys are packed sequentially. Up to 32 fields can be combined in a single compound index).

### (1) Design Motivation — "Why did we design this?"
In real-world applications, search filters are rarely single-field:
-   An e-commerce catalog filters items by `category` **and** `price`.
-   A user directory searches by `last_name` **and** `first_name`.

As learned in `single_field_index.md`, separate single-field indexes cannot optimize these queries efficiently.

We designed the **Compound Index** to solve this multi-field search performance issue. 

By packing multiple field values into a single sorted index key, the query planner can evaluate multiple query filters in a single index lookup.

---

### (2) Critical Rule 1: The Prefix Rule (Left-to-Right Matching)
The order of fields in a compound index is critical. 

If you create a compound index on three fields:
`db.collection.createIndex({ a: 1, b: 1, c: 1 })`

This index can optimize queries filtering on:
-   `{ a: 1 }` (Prefix matching).
-   `{ a: 1, b: 1 }` (Prefix matching).
-   `{ a: 1, b: 1, c: 1 }` (Full matching).

However, this index **cannot** optimize queries filtering on:
-   `{ b: 1 }` (Missing the prefix field `a`).
-   `{ b: 1, c: 1 }` (Missing the prefix field `a`).
For these queries, MongoDB will run a slow collection scan.

---

### (3) Critical Rule 2: Sort Direction Constraints
For single-field indexes, sort direction doesn't matter. 

For compound indexes, **sort direction (1 vs -1) does matter when sorting by multiple fields.**

If you create the index:
`db.collection.createIndex({ price: 1, rating: -1 })`

This index can support sorting by:
-   `sort({ price: 1, rating: -1 })` (Forward scan).
-   `sort({ price: -1, rating: 1 })` (Reverse scan - exact opposite).

It **cannot** support sorting by:
-   `sort({ price: 1, rating: 1 })` (Conflicting direction).
-   `sort({ price: -1, rating: -1 })` (Conflicting direction).
For these queries, MongoDB will fall back to a slow, in-memory sort.

---

### (4) Reality Metaphor (The Telephone Directory)
Imagine a printed city phone book sorted by **`[Last Name]`**, then **`[First Name]`**:
-   **Full Match:** You search for `"Smith, John"`. You jump to "Smith" and find "John". (Instant lookup).
-   **Prefix Match:** You search for all `"Smiths"`. You jump to "Smith" and read the list. (Instant lookup).
-   **No Prefix Match:** You search for all people named `"John"` (first name). 
    -   Because the book is sorted by last name first, you cannot jump to "John". 
    -   You must read the entire phone book from page 1 to the end. (Collection scan).

---

### (5) Code Examples

#### Prefix and Sort Verification
Let's build a compound index on category and price:

```javascript
db.products.createIndex({ category: 1, price: -1 });

// Query 1: SUCCESS (Uses index - category is the prefix field)
db.products.find({ category: "shoes" });

// Query 2: FAILS to use index! (No category filter, runs collection scan)
db.products.find({ price: { $gte: 100 } });

// Query 3: SUCCESS (Uses index - matches sort directions [1, -1])
db.products.find().sort({ category: 1, price: -1 });

// Query 4: FAILS to use index sort! (Runs in-memory sort)
db.products.find().sort({ category: 1, price: 1 });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing the most frequently queried fields at the end of the compound index keys list

**The mistake:** Creating the index `{ age: 1, username: 1 }` when 90% of your website search queries filter strictly by `username`.

**Why it's wrong:** Because `username` is placed second, queries filtering only by `username` cannot match the index prefix, forcing slow full collection scans.

**Fix: Always place the fields that are queried most frequently at the beginning (left-hand side) of the compound index keys specification.**

---





### Mistake 2: Violating the Index Prefix Rule in Compound Index Queries

**The mistake:** Creating compound index `{ status: 1, age: 1 }` and querying `db.users.find({ age: 25 })`.

**Why it's wrong:** Compound B-Tree indexes support queries matching index PREFIX keys (`status` or `status + age`). Querying `age` alone skips the leading prefix, causing a `COLLSCAN`.

*Incorrect:*
```javascript
db.users.createIndex({ status: 1, age: 1 });
db.users.find({ age: 25 }); // ❌ Skips leading status prefix!
```

*Fix:*
```javascript
db.users.find({ status: "active", age: 25 }); // Matches index prefix
```



### Mistake 3: Attempting to Index Multiple Array Fields in a Single Compound Index

**The mistake:** Creating compound index `{ tags: 1, categories: 1 }` where both `tags` and `categories` are array fields.

**Why it's wrong:** MongoDB strictly PROHIBITS compound multikey indexes containing more than one array field! Creating index `{ array1: 1, array2: 1 }` throws error `cannot index parallel arrays`.

*Incorrect:*
```javascript
db.posts.createIndex({ tags: 1, categories: 1 }); // ❌ Error: cannot index parallel arrays!
```

*Fix:*
```javascript
Ensure at most ONE field in a compound index contains array data
```



## 5. Practice Exercises

### Exercise 1: Compound Index Creation for Multi-Field Filtering

**Scenario:**
Create a compound index on `status` (ascending) and `createdAt` (descending) in collection `orders`.

**Requirements:**
1. Execute `createIndex({ status: 1, createdAt: -1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.createIndex({ status: 1, createdAt: -1 });
> ```
>
> #### Technical Explanation
>
> 1. Compound indexes evaluate multi-field query filters in a single B-tree structure.
> 2. `{ status: 1, createdAt: -1 }` orders entries by status ascending, then by date descending.
> 3. Accelerates queries matching both `status` and `createdAt`.

---

### Exercise 2: Prefix Matching Rule Verification

**Scenario:**
Verify which query filters can utilize compound index `{ status: 1, category: 1, price: 1 }`.

**Requirements:**
1. Test query filters against index prefix rules.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Compound Index Prefix Utilization:
> ✅ Match: { status: "active" } (Uses prefix: status)
> ✅ Match: { status: "active", category: "tech" } (Uses prefix: status, category)
> ❌ No Match: { category: "tech" } (Omits leading prefix key 'status' -> forces COLLSCAN)
> ```
>
> #### Technical Explanation
>
> 1. Compound indexes can satisfy queries on any left-hand prefix of the index key pattern.
> 2. Queries omitting the leading key (`status`) cannot use the index.
> 3. Design compound index key orders to match primary query prefixes.

---

### Exercise 3: Sorting with Compound Indexes

**Scenario:**
Query orders where `status: "completed"` sorted by `createdAt` descending, verifying zero in-memory sort buffer usage.

**Requirements:**
1. Execute `find({ status: "completed" }).sort({ createdAt: -1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({ status: "completed" }).sort({ createdAt: -1 });
> ```
>
> #### Technical Explanation
>
> 1. Compound index `{ status: 1, createdAt: -1 }` matches equality on `status` and reads sorted `createdAt` B-tree keys directly.
> 2. Eliminates in-memory sort stage (`SORT`) in `explain()` output.
> 3. Prevents 100MB sort buffer memory exceptions.

---



## 6. Related Terms

- [Single-Field Index](single_field_index.md) — The parent index type.
- [The ESR Rule (Equality, Sort, Range)](esr_rule.md) — Ordering compound keys.
- [Covered Query](covered_query.md) — Related concept: Covered Query.
- [Index Intersection](index_intersection.md) — Related concept: Index Intersection.
- [Multikey Index](multikey_index.md) — Related concept: Multikey Index.
- [Index (Concept in MongoDB)](index_concept.md) — Related concept: Index (Concept in MongoDB).

---

## 7. Key Takeaways
- Compound indexes contain two or more document fields.
- Direct equivalent to compound indexes in relational SQL databases.
- The Prefix Rule requires filtering on keys from left-to-right (no skipping).
- If the prefix field is missing from a query, the index is ignored.
- Sort directions (1 vs -1) must match the index keys or be exact opposites.
- Orders fields based on frequency and query structures (see ESR Rule).
- Eliminates memory exhaustion errors during multi-field sort queries.
