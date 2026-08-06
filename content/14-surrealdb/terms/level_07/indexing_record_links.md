# Indexing Record Link Fields

> **Level 7 — Indexes, Full-Text Search & Performance**
> The performance optimization practice in SurrealDB of creating B-Tree indexes on fields containing Record IDs (`record<table>` pointers or `array<record<table>>` lists), preventing full table scans during relational filter queries and reverse lookups.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Pointer fields.

---

## 2. Term Category


**Performance / Operations (record link foreign pointer indexing)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Indexing Foreign Record Links

**Scenario:**
An e-commerce order table `order` stores record links `customer` (`record<user>`). Create a secondary index on `customer` to accelerate user order history queries.

**Requirements:**
1. Define field `customer` as `record<user>`.
2. Define index `idx_order_customer ON TABLE order COLUMNS customer`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE order SCHEMAFULL;
> DEFINE FIELD customer ON TABLE order TYPE record<user>;
> 
> -- Index record link pointer field
> DEFINE INDEX idx_order_customer ON TABLE order COLUMNS customer;
> ```
>
> #### Technical Explanation
>
> 1. Secondary indexes can be created directly on `record<table>` link pointer fields.
> 2. Accelerates `SELECT * FROM order WHERE customer = user:alice` queries.
> 3. Converts foreign pointer scans into $O(\log N)$ index lookups.
> 
---

### Exercise 2: Unique Index Constraints on Record Links

**Scenario:**
Enforce that a user `user:alice` can only have ONE active `cart` record link by creating a unique index on `user` in table `cart`.

**Requirements:**
1. Define index `idx_unique_cart_user ON TABLE cart COLUMNS user UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX idx_unique_cart_user ON TABLE cart COLUMNS user UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `UNIQUE` on record link fields enforces one-to-one or unique relational constraints.
> 2. Aborts insertion attempts if a user already owns an existing cart record.
> 3. Protects relational integrity at the database layer.
> 
---

### Exercise 3: Querying Indexed Record Link Pointers

**Scenario:**
Query all orders placed by `user:alice` leveraging `idx_order_customer`.

**Requirements:**
1. Select `SELECT * FROM order WHERE customer = user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM order WHERE customer = user:alice;
> ```
>
> #### Technical Explanation
>
> 1. Comparing typed record links (`WHERE customer = user:alice`) hits `idx_order_customer`.
> 2. Retrieves foreign record references in $O(\log N)$ B-tree index lookup time.
> 3. Provides relational query speeds matching native graph traversals.
> 
---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Pointer concept.
- [Array of Record Links (`array<record<table>>`)](../level_05/array_record_links.md) — Multi-pointer fields.

---

## 7. Key Takeaways
- Forward record link traversal (`author.name`) is $O(1)$ by default.
- Reverse filtering (`WHERE author = user:id`) requires a full table scan if unindexed.
- Creating a B-Tree index on record link fields makes reverse lookups $O(\log N)$ fast.
- Indexing array fields (`array<record<table>>`) indexes individual array elements.
- Always index record link fields that are frequently used in `WHERE` filter clauses.
