# `ARRAY` Type

> **Level 6 — Schema Design & Normalization**
> A PostgreSQL-specific data type that allows you to store an ordered, variable-length list of values of the exact same data type inside a single column.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The parent database typing standard.
- [First Normal Form (1NF)](first_normal_form.md) — The database design rules that arrays technically violate.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Specific** (A non-standard SQL extension. Supported natively by PostgreSQL, but absent or implemented differently in other database systems like MySQL or SQL Server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Under First Normal Form (1NF) rules, every column cell must store only single, atomic values. 

If you want to associate a list of tag strings (e.g. `['tech', 'coding']`) to a blog post, the normalized way is to create three tables: `posts`, `tags`, and a junction table `post_tags`.

However, creating a junction table for simple, small lists requires writing joins and managing multiple tables, which can slow down rapid feature development.

PostgreSQL designed the **`ARRAY`** type to offer a compromise. 

It allows you to store a list of values (like `TEXT[]` or `INTEGER[]`) directly inside a single column cell. 

This gives you NoSQL-like flexibility inside a strict relational database, saving table count while still supporting high-speed index queries on array elements.

---

### (2) The 1-Indexed Warning
In most programming languages (JavaScript, Python), arrays are **0-indexed** (the first element is at index `0`). 

**In PostgreSQL, arrays are 1-indexed by default.** 

Accessing `tags[1]` retrieves the first element in the list.

---

### (3) Specialized Array Operators
Postgres provides operators to query array contents:
-   **`&&` (Overlap):** Returns `TRUE` if two arrays share any common elements.
-   **`@>` (Contains):** Returns `TRUE` if the left array contains all elements of the right array.

---

### (4) Reality Metaphor
Imagine a paper student folder:
-   **Normalized (1NF):** You keep records of student allergies in a separate drawer. To find them, you look up the student file and trace index cards (Junction Table).
-   **Array Type:** You glue a small **plastic clear sleeve** onto the front of the student's paper folder. You slide a list of allergen cards (`['peanuts', 'milk']`) directly into the sleeve. It is fast to read, but the office cannot compile a master allergy database list easily because the cards are locked inside folders.

---

### (5) Code Examples

#### Creating and Inserting Arrays
Append square brackets `[]` to the data type to declare an array column:

```sql
CREATE TABLE articles (
  id INT PRIMARY KEY,
  title VARCHAR(150),
  tags TEXT[] -- Declares an array of text strings
);

-- Insert using the ARRAY constructor
INSERT INTO articles VALUES (1, 'SQL Joins', ARRAY['database', 'coding']);

-- Insert using literal string syntax '{...}'
INSERT INTO articles VALUES (2, 'CSS Grid', '{"frontend", "design"}');
```

#### Querying Arrays (Indexing and Containment)
```sql
-- 1. Querying by specific index (Returns 'database' because Postgres is 1-indexed!)
SELECT title, tags[1] AS primary_tag 
FROM articles;

-- 2. Querying using the Containment operator (@>)
SELECT title 
FROM articles 
WHERE tags @> ARRAY['coding'];
-- Returns: 'SQL Joins'
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using arrays for data that requires foreign key constraints

**The mistake:** Storing a list of user IDs in an array column: `team_member_ids INT[]`, and expecting the database to verify those IDs exist in the `users` table.

**Why it's wrong:** PostgreSQL **cannot enforce foreign key referential integrity on array elements**. You cannot write a constraint that says: *"Ensure every number inside this array points to a valid user ID."* 

If you delete a user, the array will still contain their ID, creating orphaned references.

**Fix: Only use arrays for simple, independent lists (like text tags or coordinates) where referential checks are not required. For database relationships, always use a standard junction table.**

---

### Mistake 2: Assuming 0-Based Indexing for PostgreSQL Array Types

**The mistake:** Accessing the first array element using 0-based indexing `tags[0]`.

**Why it's wrong:** PostgreSQL array types use 1-BASED INDEXING by default! `tags[1]` accesses the first array element. `tags[0]` returns `NULL`.

*Incorrect:*
```sql
SELECT tags[0] FROM posts; -- ❌ Returns NULL! Array indexing is 1-based!
```

*Fix:*
```sql
SELECT tags[1] FROM posts; -- Correct 1-based first element access
```

### Mistake 3: Using Standard B-Tree Indexes on Array Columns Instead of GIN Indexes

**The mistake:** Creating a standard B-Tree index `CREATE INDEX idx_tags ON posts (tags);` for array search queries.

**Why it's wrong:** Standard B-Tree indexes index the entire array tuple as a single value. They CANNOT accelerate array element searches (`tags @> ARRAY['tech']`). Create a GIN index.

*Incorrect:*
```sql
CREATE INDEX idx_tags ON posts (tags); -- ❌ Cannot accelerate @> array element queries!
```

*Fix:*
```sql
CREATE INDEX idx_tags_gin ON posts USING GIN (tags); -- Fast GIN array element index
```

## 6. Practice Exercises

### Exercise 1: Tag Finder Query

**Problem:** You have a `products` table with columns `name` and `features` (a `TEXT[]` array). Write a SQL query to select the `name` of all products that have the feature `'waterproof'` inside their features list.

**Expected output:**
```sql
SELECT name 
FROM products 
WHERE features @> ARRAY['waterproof'];
```

> [!check]- Answer
> - Use the containment operator `@>` in the `WHERE` clause.
> - Construct the search target array using `ARRAY['waterproof']`.

---



### Exercise 2: Querying Array Element Containment with `@>`

**Problem:** Query posts where `tags` array contains `'postgres'` using GIN array operator `@>`.

**Expected output:**
```text
SELECT * FROM posts WHERE tags @> ARRAY['postgres'];
```

> [!check]- Answer
> ```sql
> SELECT * FROM posts WHERE tags @> ARRAY['postgres'];
> ```
>
> **Explanation:** The `@>` operator tests if the LHS array contains all elements of the RHS array.

### Exercise 3: Unnesting Arrays with `UNNEST()`

**Problem:** Unnest `tags` array into individual rows using `UNNEST()` function.

**Expected output:**
```text
SELECT title, UNNEST(tags) AS tag FROM posts;
```

> [!check]- Answer
> ```sql
> SELECT title, UNNEST(tags) AS tag FROM posts;
> ```
>
> **Explanation:** `UNNEST(array)` expands array elements into a set of individual rows.

## 7. Related Terms
- [First Normal Form (1NF)](first_normal_form.md) — The relational atomicity standard.
- [`JSON` / `JSONB` Type](json_jsonb.md) — Storing unstructured documents.

---

## 8. Key Takeaways
- `ARRAY` stores a variable-length list of matching data types in a single column.
- Violates the pure mathematical atomicity of First Normal Form (1NF).
- PostgreSQL arrays are 1-indexed (index starts at `1`, not `0`).
- Use the `@>` operator to check if an array contains specific search elements.
- Cannot enforce foreign key constraints on individual array elements.
- Use arrays for simple tag lists; use junction tables for relational database links.
