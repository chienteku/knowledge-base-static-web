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
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Stored as a single B-Tree structure where index keys are packed sequentially. Up to 32 fields can be combined in a single compound index).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Violating the Index Prefix Rule in Compound Index Queries

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

### Mistake 5: Attempting to Index Multiple Array Fields in a Single Compound Index

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

## 6. Practice Exercises

### Exercise 1: Compound Index Validation

**Problem:** You build a compound index: `db.users.createIndex({ country: 1, score: -1 });`
Analyze if the index can optimize these queries (answer **Yes** or **No**):
1.  `db.users.find({ country: "US" }).sort({ score: -1 })`
2.  `db.users.find({ score: { $gt: 100 } })`
3.  `db.users.find({ country: "CA" }).sort({ score: 1 })`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Yes: The query filters on the prefix field `country` and sorts in the exact match direction `{ country: 1, score: -1 }`.
> 2. No: The query filters on `score` only, missing the prefix field `country`.
> 3. Yes: The sort request `{ country: 1, score: 1 }` is the exact opposite of the index keys `{ country: -1, score: 1 }` after negating both fields, allowing a backward index scan.
> ```
> - A reverse scan negates all field directions: `-( { country: 1, score: -1 } ) = { country: -1, score: 1 }`.
> - Check if the prefix field is present in the query filters.

---



### Exercise 2: Creating Compound Index

**Problem:** Create compound index `status_createdAt_idx` on `status` ascending and `createdAt` descending.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.createIndex({ status: 1, createdAt: -1 }, { name: "status_createdAt_idx" });
> ```
> ```javascript
> db.orders.createIndex(
>   { status: 1, createdAt: -1 },
>   { name: "status_createdAt_idx" }
> );
> ```
>
> **Explanation:** Compound indexes support queries filtering and sorting on multiple fields.

---

### Exercise 3: Compound Index Prefix Matching

**Problem:** Given index `{ a: 1, b: 1, c: 1 }`, list 3 supported query field combinations (`{ a }`, `{ a, b }`, `{ a, b, c }`).

**Expected output:**
> [!check]- Answer
> ```text
> { a }, { a, b }, { a, b, c }
> ```
> ```text
> { a }, { a, b }, { a, b, c }
> ```
>
> **Explanation:** Compound indexes support queries matching leading field prefix subsets.

## 7. Related Terms

- [Single-Field Index](single_field_index.md) — The parent index type.
- [The ESR Rule (Equality, Sort, Range)](esr_rule.md) — Ordering compound keys.
- [Covered Query](covered_query.md) — Related concept: Covered Query.
- [Index Intersection](index_intersection.md) — Related concept: Index Intersection.
- [Multikey Index](multikey_index.md) — Related concept: Multikey Index.
- [Index (Concept in MongoDB)](index_concept.md) — Related concept: Index (Concept in MongoDB).

---

## 8. Key Takeaways
- Compound indexes contain two or more document fields.
- Direct equivalent to compound indexes in relational SQL databases.
- The Prefix Rule requires filtering on keys from left-to-right (no skipping).
- If the prefix field is missing from a query, the index is ignored.
- Sort directions (1 vs -1) must match the index keys or be exact opposites.
- Orders fields based on frequency and query structures (see ESR Rule).
- Eliminates memory exhaustion errors during multi-field sort queries.
