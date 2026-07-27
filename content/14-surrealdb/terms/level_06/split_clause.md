# `SPLIT` Clause

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL query modifier appended to `SELECT` statements that deconstructs an array field into multiple output records (one per array item), equivalent to MongoDB's `$unwind` aggregation stage.

---

## 1. Prerequisites
- [SELECT](../level_03/select.md) — The query statement.
- [Array Type](../level_02/array_type.md) — The target container type.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed during the query result transformation phase. Duplicates parent record contexts in memory for each element in the target array).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In document databases (MongoDB) and multi-model databases, records often store arrays of items (e.g. a blog post storing `tags: ["rust", "tech", "database"]`).
If you want to perform aggregations on individual array items—such as counting how many total posts use each tag across all users—you cannot group by the array directly (grouping by `tags` groups by the exact combination of tags).

In MongoDB, you solve this using the `$unwind` aggregation stage. In SQL (PostgreSQL), you use `UNNEST(array_column)`.

We designed the **`SPLIT`** clause in SurrealQL to provide a clean, readable way to deconstruct arrays inside queries. Appending `SPLIT <field_name>` to a `SELECT` query instructs SurrealDB to expand the array, emitting one separate output row for each item in the array while preserving the surrounding record properties.

---

### (2) Transformation Visualized

#### Input Record:
```json
{ "id": "post:1", "title": "SurrealDB News", "tags": ["rust", "database"] }
```

#### Query: `SELECT title, tags FROM post SPLIT tags;`

#### Output Records:
```json
[
  { "title": "SurrealDB News", "tags": "rust" },
  { "title": "SurrealDB News", "tags": "database" }
]
```

---

### (3) Reality Metaphor (Deck of Cards)
Imagine holding a card deck:
- **Array Field:** A single **Box of Cards** labeled "Tags" resting on a desk. The box is 1 item.
- **`SPLIT` Clause:** Unboxing the deck and dealing out individual cards side-by-side across the table. Each card gets its own spot, but keeps a sticker pointing back to the original box name.

---

### (4) Code Examples

#### Using SPLIT in SurrealQL

```sql
-- 1. Simple SPLIT query: Flatten tags array for all posts
SELECT title, tags FROM post SPLIT tags;

-- 2. Combine SPLIT with GROUP BY to count tag popularity across the entire database!
SELECT 
  tags AS tag_name, 
  count() AS usage_count 
FROM post 
SPLIT tags 
GROUP BY tag_name 
ORDER BY usage_count DESC;

-- 3. SPLIT on nested array properties
SELECT name, hobbies FROM user SPLIT hobbies;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use SPLIT on a non-array field, expecting array transformation behavior

**The mistake:** Running `SELECT * FROM user SPLIT email;` where `email` is a scalar string `"alice@example.com"`.

**Why it's wrong:** `SPLIT` operates on `array` or `set` container types. When applied to a scalar string or number, SurrealDB treats it as a single-element list or ignores the split, returning the record unchanged.

**Fix: Ensure the target field passed to `SPLIT` is an `array` or `set` data type.**

---



### Mistake 2: Using `SPLIT` on Non-Array Fields

**The mistake:** Executing `SELECT * FROM article SPLIT title;` when `title` is a scalar string.

**Why it's wrong:** `SPLIT ON field` expects an array field. It splits array elements into separate distinct result record rows.

*Incorrect:*
```surrealql
SELECT * FROM article SPLIT title; // ❌ Title is string, not array!
```

*Fix:*
```surrealql
SELECT * FROM article SPLIT tags; // Correct: 'tags' is an array<string>
```

### Mistake 3: Confusing `SPLIT ON` Data Clause with String Splitting `string::split()`

**The mistake:** Using `SPLIT ON text` expecting to split a string by spaces.

**Why it's wrong:** `SPLIT ON field` splits array records into multiple row records. To split text strings by delimiter, use function `string::split(text, delimiter)`.

*Incorrect:*
```surrealql
SELECT * FROM user SPLIT bio; // ❌ Does not tokenize string!
```

*Fix:*
```surrealql
RETURN string::split("a,b,c", ","); // Tokenizes string into array
```

## 6. Practice Exercises

### Exercise 1: Array Unwinding & Grouping

**Problem:** You have a `products` table containing a `categories` array field (`categories: ["electronics", "gadgets"]`).
Write the SurrealQL query to:
1. Deconstruct the `categories` array using `SPLIT`.
2. Group by `categories` (aliased as `category`).
3. Calculate the count of products in each category as `total_products`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT 
>   categories AS category, 
>   count() AS total_products 
> FROM products 
> SPLIT categories 
> GROUP BY category;
> ```
> - Apply `SPLIT categories` before the `GROUP BY` clause.
> - Group by the split category field.

---

### Exercise 2: Un-Nesting Array Elements with SPLIT AT

**Problem:** Un-nest `tags` array on `article` table so each tag element returns as an independent record row.

**Expected output:**
> [!check]- Answer
> ```surrealql
> SELECT * FROM article SPLIT tags;
> ```
>
> **Explanation:** `SPLIT ON field` expands array elements into separate distinct output rows.

### Exercise 3: Combining SPLIT and GROUP BY

**Problem:** Split `tags` array on `article` table and group by `tags` to count occurrences per tag.

**Expected output:**
> [!check]- Answer
> ```surrealql
> SELECT tags AS tag, count() FROM article SPLIT tags GROUP BY tag;
> ```
>
> **Explanation:** Combining `SPLIT` and `GROUP BY` aggregates tag frequencies across records.

## 7. Related Terms
- [SELECT](../level_03/select.md) — The query statement.
- [Array Functions (`array::*`)](array_functions.md) — Manipulating arrays.

---

## 8. Key Takeaways
- The `SPLIT` clause expands array elements into separate output records.
- Direct equivalent to MongoDB's `$unwind` and PostgreSQL's `UNNEST()`.
- Essential step before running `GROUP BY` aggregations on individual array items.
- Preserves outer record fields across all expanded output rows.
- Operates on `array` and `set` data types.
