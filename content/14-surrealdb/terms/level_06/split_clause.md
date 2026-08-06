# `SPLIT` Clause

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL query modifier appended to `SELECT` statements that deconstructs an array field into multiple output records (one per array item), equivalent to MongoDB's `$unwind` aggregation stage.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query statement.
- [`array`](../level_02/array_type.md) — The target container type.

---

## 2. Term Category


**Query Feature (array record flattening SPLIT clause)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Unnesting Array Fields into Separate Records

**Scenario:**
An analytics query takes records containing an array of tags `tags = ["rust", "db"]` and unnests them into separate result records using `SPLIT ON`.

**Requirements:**
1. Create `article:a1` with `tags = ["rust", "db"]`.
2. Execute `SELECT title, tags FROM article SPLIT ON tags`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE article:a1 SET title = "SurrealQL Basics", tags = ["rust", "db"];
> 
> -- Unnest array field into separate result records
> SELECT title, tags FROM article SPLIT ON tags;
> 
> -- Output:
> -- [ { title: "SurrealQL Basics", tags: "rust" }, { title: "SurrealQL Basics", tags: "db" } ]
> ```
>
> #### Technical Explanation
>
> 1. `SPLIT ON field` expands array elements, outputting a separate result document for each array item.
> 2. Replaces SQL `UNNEST()` and MongoDB `$unwind` aggregation pipeline stages.
> 3. Facilitates per-item aggregation and reporting queries.
> 
---

### Exercise 2: Grouping After Array Unnesting

**Scenario:**
Unnest `tags` arrays across all articles using `SPLIT ON`, then group by individual tag to count occurrences.

**Requirements:**
1. Unnest `SPLIT ON tags`.
2. Group by `tags` and calculate `count()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE article:a1 SET tags = ["rust", "db"];
> CREATE article:a2 SET tags = ["rust", "web"];
> 
> SELECT tags AS tag, count() AS total 
> FROM article 
> SPLIT ON tags 
> GROUP BY tag;
> ```
>
> #### Technical Explanation
>
> 1. Combining `SPLIT ON` with `GROUP BY` aggregates individual array items across records.
> 2. Counts how many documents contain each distinct array tag item.
> 3. Simplifies tag cloud and category count reporting queries.
> 
---

### Exercise 3: Multi-Array Unnesting Considerations

**Scenario:**
Explain the behavior of applying `SPLIT ON` across multiple array fields simultaneously.

**Requirements:**
1. Describe how `SPLIT ON field1, field2` expands cartesian product combinations.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE post:p1 SET categories = ["tech", "news"], authors = ["Alice", "Bob"];
> 
> -- Cartesian product unnesting
> SELECT * FROM post SPLIT ON categories, authors;
> ```
>
> #### Technical Explanation
>
> 1. Splitting on multiple array fields generates a cartesian product expansion of all array combinations.
> 2. Outputs $M 	imes N$ result records for array lengths $M$ and $N$.
> 3. Use carefully on large arrays to prevent result set explosion.
> 
---



## 6. Related Terms

- [`SELECT`](../level_03/select.md) — The query statement.
- [Array Functions (`array::*`)](array_functions.md) — Manipulating arrays.
- [`FOR` Expression](for_expression.md) — Related concept: `FOR` Expression.

---

## 7. Key Takeaways
- The `SPLIT` clause expands array elements into separate output records.
- Direct equivalent to MongoDB's `$unwind` and PostgreSQL's `UNNEST()`.
- Essential step before running `GROUP BY` aggregations on individual array items.
- Preserves outer record fields across all expanded output rows.
- Operates on `array` and `set` data types.
