# GIN Index

> **Level 7 — Indexes & Query Performance**
> A Generalized Inverted Index designed to index multi-valued data structures (like arrays, JSONB documents, and text search vectors) by mapping individual sub-elements back to their parent row locations.

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The parent performance concept.
- [`ARRAY` Type](../level_06/array_type.md) — The multi-value array column standard.
- [`JSON` / `JSONB` Type](../level_06/json_jsonb.md) — Nested document storage structures.
---

## 2. Term Category
- **PostgreSQL Index Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires installing the `pg_trgm` or `btree_gin` extension if you want to mix GIN indexes with standard scalar comparisons. GIN updates are buffered in memory using a "pending list" to optimize write transaction speeds).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard B-tree indexes are optimized for single, scalar values (e.g. `age = 25`, `email = '...'`). 

They store a single column value that points to a single row.

However, modern PostgreSQL databases store **composite or multi-valued** data:
-   An `ARRAY` column: `tags = ['tech', 'database', 'coding']`.
-   A `JSONB` document: `specs = {"color": "red", "ports": 4}`.
-   **Full-Text Search:** A document containing paragraphs of text words.

If you try to write a standard B-tree index on a tags array, the B-tree treats the entire array as a single key. 

If you search: *"Find all posts containing tag 'database'"*, the B-tree cannot help because it didn't index the *individual words* inside the array. 

The database has to run a slow sequential scan.

We designed the **GIN (Generalized Inverted Index)** to solve this. 

It is an **Inverted Index**: instead of mapping rows to arrays, it splits the arrays, extracts every individual element (every tag word), and maps each element to a list of all row IDs (TIDs) that contain it.

---

### (2) How the Inverted Grid looks

```text
Table Data Rows:
Row 1: ['tech', 'coding']
Row 2: ['coding', 'database']
Row 3: ['tech']

GIN Index File:
'coding'   -> Points to: [Row 1, Row 2]
'database' -> Points to: [Row 2]
'tech'     -> Points to: [Row 1, Row 3]
```

When you query `WHERE tags @> ARRAY['tech']`, Postgres looks up `'tech'` in the GIN index and instantly retrieves `[Row 1, Row 3]`, bypassing all other rows.

---

### (3) The Write Cost
Because GIN indexes track sub-elements, writing is slow: if you insert a row containing an array of 10 tags, Postgres must update **10 separate entries** in the GIN index tree. 

Postgres buffers these writes in memory to protect speeds, but GIN indexes still carry high write latency.

---

### (4) Reality Metaphor
Imagine a textbook index appendix:
-   **B-tree Index (Table of Contents):** Lists chapters. You have to read the chapter to find specific words.
-   **GIN Index (Index Appendix at back of book):** An alphabetical list of **individual words** (e.g., `'transaction'`, `'locking'`). Next to the word `'locking'`, it lists pages: `[18, 42, 105]`. You bypass reading the book and jump directly to pages containing the word.

---

### (5) Code Examples

#### 1. GIN Index on Array Column
```sql
CREATE TABLE articles (
  id INT PRIMARY KEY,
  tags TEXT[]
);

-- Create a GIN index on the tags array
CREATE INDEX idx_articles_tags_gin ON articles USING gin(tags);
```

#### 2. GIN Index on JSONB Column
```sql
CREATE TABLE client_orders (
  id INT PRIMARY KEY,
  metadata JSONB
);

-- Index the entire JSONB document to speed up arbitrary key searches
CREATE INDEX idx_orders_jsonb_gin ON client_orders USING gin(metadata);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating GIN indexes on simple, scalar columns (like integers or dates)

**The mistake:** Running `CREATE INDEX idx_user_age ON users USING gin(age);` on an integer age column.

**Why it's wrong:** GIN indexes are designed for multi-valued data. For single, scalar values, a standard B-tree index is much smaller on disk, uses less memory, and is significantly faster to search and update.

**Fix: Only use GIN indexes for `ARRAY`, `JSONB`, or Full-Text search columns. For standard data types, always use the default B-tree index.**

---



### Mistake 2: Using B-Tree Indexes Instead of GIN Indexes for Array and JSONB Containment Queries

**The mistake:** Creating standard B-Tree index on `tags` array column and querying `WHERE tags @> ARRAY['postgres']`.

**Why it's wrong:** Standard B-Tree indexes index whole array tuples, NOT individual array elements! Standard B-Trees cannot accelerate array containment (`@>`) or JSONB searches. Use GIN indexes.

*Incorrect:*
```sql
CREATE INDEX idx_tags ON posts (tags); -- ❌ Cannot accelerate @> containment queries!
```

*Fix:*
```sql
CREATE INDEX idx_tags_gin ON posts USING GIN (tags);
```

### Mistake 3: Ignoring Slow Write Overhead of GIN Indexes on High-Write Collections

**The mistake:** Creating 5 GIN indexes on a high-throughput write collection without tuning `fastupdate`.

**Why it's wrong:** GIN indexes build multi-key element entries per row, making write operations slower than B-Trees. Use `fastupdate = on` or minimize GIN index counts on write-heavy tables.

*Incorrect:*
```sql
// Creating multiple un-tuned GIN indexes on high-write table
```

*Fix:*
```sql
Tune GIN fastupdate buffers or limit GIN indexes to read-heavy search tables
```

## 6. Practice Exercises

### Exercise 1: JSONB Sub-document Index

**Problem:** You have a `listings` table with a `specs` JSONB column. Landlords store varying key-value details in `specs`. Write the SQL query to create a GIN index named `idx_listings_specs` on the `specs` column to speed up arbitrary key search filters.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE INDEX idx_listings_specs 
> ON listings USING gin(specs);
> ```
> - Specify the GIN index structure using the `USING gin` clause.
> - Target the entire `specs` column.

---



### Exercise 2: Creating GIN Index on JSONB Column

**Problem:** Create GIN index on `payload` JSONB column of `events` table.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_events_payload ON events USING GIN (payload);
> ```
> ```sql
> CREATE INDEX idx_events_payload ON events USING GIN (payload);
> ```
>
> **Explanation:** GIN (Generalized Inverted Index) indexes multi-value array items and JSONB keys.

---

### Exercise 3: Trigram GIN Index for Wildcard Searching

**Problem:** Create GIN index using `gin_trgm_ops` on `title` to accelerate `ILIKE '%query%'` substring searches.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
> ```
> ```sql
> CREATE INDEX idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
> ```
>
> **Explanation:** `pg_trgm` GIN indexes decompose text strings into 3-character trigrams for fast substring matching.

## 7. Related Terms
- [B-tree Index](btree_index.md) — The default scalar index type.
- [`ARRAY` Type](../level_06/array_type.md) — The flat array typing standard.
- [`JSON` / `JSONB` Type](../level_06/json_jsonb.md) — Storing nested documents.
- [Full-Text Search (`tsvector`, `tsquery`)](../level_10/full_text_search.md) — Related concept: Full-Text Search (`tsvector`, `tsquery`).
---

## 8. Key Takeaways
- GIN (Generalized Inverted Index) maps individual sub-elements to parent rows.
- Optimized for composite types: `ARRAY`, `JSONB`, and Full-Text Search data.
- Instantly speeds up array containment (`@>`) and overlap (`&&`) filters.
- Speeds up dynamic searches inside nested `JSONB` document keys.
- Carries high write overhead because inserts trigger multiple index node updates.
- Never use GIN indexes on simple, scalar columns (use B-tree instead).
