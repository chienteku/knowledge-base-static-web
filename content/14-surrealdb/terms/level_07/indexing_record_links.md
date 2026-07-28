# Indexing Record Link Fields

> **Level 7 — Indexes, Full-Text Search & Performance**
> The performance optimization practice in SurrealDB of creating B-Tree indexes on fields containing Record IDs (`record<table>` pointers or `array<record<table>>` lists), preventing full table scans during relational filter queries and reverse lookups.

---

## 1. Prerequisites
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Pointer fields.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the index manager. Maps target Record ID tokens to host record storage addresses on disk).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
SurrealDB record links allow you to store pointers directly in fields (e.g. `post.author = user:alice`).
- **Forward Traversal (Fast by default):** Querying `SELECT author.name FROM post:1` jumps directly to `user:alice` in $O(1)$ constant time without an index.
- **Reverse Filtering (Slow without an index!):** Querying `SELECT * FROM post WHERE author = user:alice` asks: *"Which posts belong to Alice?"*

If the `author` field on the `post` table is **not indexed**:
- SurrealDB must scan every single post record in the table to test `WHERE author = user:alice`.
- On a table with 500,000 posts, this reverse filtering scan takes seconds.

In PostgreSQL, developers index foreign key columns (`CREATE INDEX ON post(author_id)`). In MongoDB, developers index ObjectId reference fields.

We designed **Indexing Record Link Fields** in SurrealDB to solve this reverse-lookup bottleneck. By creating a B-Tree index on a record link field (`DEFINE INDEX idx_author ON post COLUMNS author;`), reverse filtering queries execute in $O(\log N)$ logarithmic time, returning matching child records instantly.

---

### (2) Indexing Single Record Links vs. Array of Record Links
- **Single Pointer Field:** `DEFINE FIELD author ON post TYPE record<user>;`
  - Index declaration: `DEFINE INDEX idx_author ON post COLUMNS author;`
- **Array of Pointers Field:** `DEFINE FIELD tags ON post TYPE array<record<tag>>;`
  - Index declaration: `DEFINE INDEX idx_tags ON post COLUMNS tags;`
  - *Behavior:* Indexing an array of record links indexes **each individual pointer item** inside the array, enabling fast `WHERE tags CONTAINS tag:rust` queries!

---

### (3) Reality Metaphor (The Coat Check Room)
Imagine a coat check service:
- **Forward Traversal:** You hand the clerk Ticket #45. They look at Ticket 45 and grab Coat #45 from the hook directly. ($O(1)$ constant jump).
- **Reverse Filtering (No Index):** A guest asks: *"Do you have any red coats belonging to Alice?"*
  - Without an index on owner names, the clerk must walk down every row inspecting every coat tag one-by-one. (Full Table Scan).
- **Indexed Record Link Field:** The clerk maintains a **Name-to-Hook Index Card File**.
  - They flip to "Alice", see hooks #12, #45, and #88, and walk straight to those three hooks.

---

### (4) Code Examples

#### Indexing Record Links in SurrealQL

```sql
DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD tags ON post TYPE array<record<tag>>;

-- 1. Indexing a single record link field for fast reverse lookups
DEFINE INDEX idx_post_author ON post COLUMNS author;

-- 2. Indexing an array of record link pointers
DEFINE INDEX idx_post_tags ON post COLUMNS tags;

-- 3. Queries that now run at lightning speed ($O(\log N)$ instead of full table scan):
SELECT * FROM post WHERE author = user:alice;
SELECT * FROM post WHERE tags CONTAINS tag:rust;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming that because forward record link traversal (author.name) is $O(1)$, reverse queries (WHERE author = user:id) are also automatically fast without an index

**The mistake:** Creating a schema with record link fields, skipping index definitions on those fields, and wondering why `WHERE author = user:id` queries lag under heavy loads.

**Why it's wrong:** Record links store pointers in one direction (child $\rightarrow$ parent). Querying from parent to children (`WHERE child_link = parent_id`) requires searching the child table. Without an index, SurrealDB must scan every row in the child table.

**Fix: Always define a B-Tree index on any record link field that appears in `WHERE` filters:**

```sql
-- ALWAYS INDEX RECORD LINK FIELDS USED IN FILTERS
DEFINE INDEX idx_post_author ON post COLUMNS author;
```

---



### Mistake 2: Indexing Record Links as Plain Strings

**The mistake:** Defining `DEFINE FIELD author ON TABLE post TYPE string;` and creating an index on `author`.

**Why it's wrong:** Plain string indexes miss out on Record Link optimization features. Define fields as `TYPE record<user>` so index entries point directly to Record IDs.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE string;
DEFINE INDEX idx ON TABLE post FIELDS author;
```

*Fix:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>;
DEFINE INDEX idx ON TABLE post FIELDS author;
```

### Mistake 3: Querying Un-Indexed Foreign Record Pointer Fields in Large Collections

**The mistake:** Running `SELECT * FROM post WHERE author = user:alice;` on 10 million posts without an index on `author`.

**Why it's wrong:** Querying posts by `author` performs a full table scan ($O(N)$) unless an index is defined on field `author` (`FIELDS author`).

*Incorrect:*
```surrealql
-- Full table scan without index
SELECT * FROM post WHERE author = user:alice;
```

*Fix:*
```surrealql
DEFINE INDEX post_author_idx ON TABLE post FIELDS author;
SELECT * FROM post WHERE author = user:alice; // Fast index lookup
```

## 6. Practice Exercises

### Exercise 1: Link Index Formulation

**Problem:** You have an `order` table with a `customer` field typed as `record<customer>`.
Write the SurrealQL statement to define an index named `idx_order_customer` to optimize queries searching for orders placed by a specific customer.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE INDEX idx_order_customer ON order COLUMNS customer;
> ```
> - Target table is `order`.
> - Index column is `customer`.

---



### Exercise 2: Indexing Foreign Record Pointer

**Problem:** Define index `post_author_idx` on `post` table for record link field `author`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE INDEX post_author_idx ON TABLE post FIELDS author;
> ```
> ```surrealql
> DEFINE INDEX post_author_idx ON TABLE post FIELDS author;
> ```
>
> **Explanation:** Indexing record link fields accelerates foreign key pointer lookups.

---

### Exercise 3: Composite Record Link Index

**Problem:** Define composite index on `tenant` (record link) and `created_at` (datetime) fields of `log` table.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE INDEX log_tenant_date ON TABLE log FIELDS tenant, created_at;
> ```
> ```surrealql
> DEFINE INDEX log_tenant_date ON TABLE log FIELDS tenant, created_at;
> ```
>
> **Explanation:** Composite record link indexes optimize multi-tenant query range scans.

## 7. Related Terms
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Pointer concept.
- [Array of Record Links](../level_05/array_record_links.md) — Multi-pointer fields.

---

## 8. Key Takeaways
- Forward record link traversal (`author.name`) is $O(1)$ by default.
- Reverse filtering (`WHERE author = user:id`) requires a full table scan if unindexed.
- Creating a B-Tree index on record link fields makes reverse lookups $O(\log N)$ fast.
- Indexing array fields (`array<record<table>>`) indexes individual array elements.
- Always index record link fields that are frequently used in `WHERE` filter clauses.
