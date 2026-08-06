# `SELECT` with Record Link Fetching (`FETCH`)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clause appended to `SELECT` queries that instructs the database engine to resolve (dereference) Record Link fields, replacing pointer IDs (like `user:john`) with the actual target record content in the final JSON response.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.
- [`record` (Record Link Type)](../level_02/record_link_type.md) — The pointer fields targeted.

---

## 2. Term Category


**Query Feature (eager record link resolution clause)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems (PostgreSQL), joining tables is normalized:
-   If you query a list of blog posts, the `author` field simply holds a foreign key number (like `author_id = 5`).
-   To display the author's name, you must write a `JOIN` query. 
-   This merges rows, creating a flat layout that requires grouping to parse.

In MongoDB, you write a `$lookup` aggregation to merge collections, which is verbose and hard to read.

We designed the **`FETCH`** clause in SurrealQL to simplify relationship resolution. 

Because SurrealDB stores record links as primitive pointer types (e.g. `user:tobie`), it knows exactly where the target document lives. 

By appending `FETCH <field_name>` to the end of a `SELECT` statement, you tell SurrealDB to swap the pointer ID with the actual document content before returning the data. 

This gives you a nested, fully populated JSON document instantly, eliminating `JOIN` statements and client-side lookup boilerplate.

---

### (2) Fetch Output Transformation
Compare the JSON payloads returned to the client:

#### 1. Un-fetched Query
`SELECT * FROM post;`
```json
[
  {
    "id": "post:first",
    "title": "SurrealDB Relational Design",
    "author": "user:tobie" // Pointer only!
  }
]
```

#### 2. Fetched Query (Dereferenced)
`SELECT * FROM post FETCH author;`
```json
[
  {
    "id": "post:first",
    "title": "SurrealDB Relational Design",
    "author": { // Pointer resolved to target document!
      "id": "user:tobie",
      "name": "Tobie",
      "email": "tobie@example.com"
    }
  }
]
```

---

### (3) Reality Metaphor (Safety Deposit Boxes)
Imagine a delivery courier dropping off documentation:
-   **No Fetch:** The courier drops a packet. Inside, you read a line: *"For author details, open Safety Deposit Box #45."* You must walk to the vault, open box 45, read the details, and walk back. (Separate query).
-   **With `FETCH`:** You write **"FETCH"** on the delivery receipt. 
    -   The courier reads the instruction. 
    -   Before leaving the warehouse, they walk to Box 45, extract the sheets, slide them directly inside your main envelope, and hand you a single, fully populated packet.

---

### (4) Code Examples

#### Fetching Relationships in SurrealQL
Let's query articles with nested associations:

```sql
-- 1. Fetch the author details on posts
SELECT * FROM post FETCH author;

-- 2. Fetch multiple fields in the same query (separated by commas)
SELECT * FROM product_orders FETCH customer, product;

-- 3. Fetch nested links (deep fetching!)
-- Resolves the author, and resolves the author's company record!
SELECT * FROM post FETCH author, author.company;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use the 'FETCH' clause on a field storing a string representation of an ID, rather than a primitive Record ID type

**The mistake:** Defining a field as `TYPE string` and saving the value `"user:tobie"`, then running `SELECT * FROM post FETCH author;` and wondering why the link is not resolved.

**Why it's wrong:** The `FETCH` engine only resolves primitive `record` data types. 

If you store a pointer as a string `"user:tobie"`, SurrealDB treats it as raw text and ignores it during the fetch phase, returning the string value unchanged.

**Fix: Always store links as raw, unquoted Record IDs (e.g. `user:tobie`), and define the field type as `record<table>`:**

```sql
-- BAD (Stores string, fetch ignores it)
CREATE post SET author = "user:tobie";

-- GOOD (Stores record link, fetch resolves it)
CREATE post SET author = user:tobie;
```

---



### Mistake 2: Using `FETCH` on Plain String Fields That Are Not Record Links

**The mistake:** Executing `SELECT * FROM post FETCH author;` when `author` is defined as `TYPE string` storing `'alice'`.

**Why it's wrong:** `FETCH` expands Record Links (`r'user:alice'`). If `author` is a plain string, `FETCH` cannot locate the foreign record.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE string;
SELECT * FROM post FETCH author; // ❌ Plain string cannot be fetched!
```

*Fix:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>;
SELECT * FROM post FETCH author; // Expands Record Link successfully
```

### Mistake 3: Nesting `FETCH` Beyond Single Level Without Dot Path Specifiers

**The mistake:** Writing `FETCH author, company` expecting nested `author.company` to be expanded.

**Why it's wrong:** To fetch nested record links inside already fetched records, specify dot path chains: `FETCH author, author.company`.

*Incorrect:*
```surrealql
SELECT * FROM post FETCH author, company; // ❌ 'company' is not a direct field on 'post'!
```

*Fix:*
```surrealql
SELECT * FROM post FETCH author, author.company; // Correct nested fetch path
```

## 5. Practice Exercises

### Exercise 1: Resolving Multiple Foreign Record Links

**Scenario:**
An e-commerce order dashboard retrieves order `orders:o1` and eagerly resolves both the `customer` (record link to `user`) and `billing` (record link to `invoice`) fields in a single query.

**Requirements:**
1. Create user `user:alice` and invoice `invoice:inv1`.
2. Create order `orders:o1` setting `customer = user:alice` and `billing = invoice:inv1`.
3. Select `orders:o1` using `FETCH customer, billing`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice Smith";
> CREATE invoice:inv1 SET total = 199.99dec;
> 
> CREATE orders:o1 SET customer = user:alice, billing = invoice:inv1;
> 
> -- Eagerly fetch customer and billing pointers inline
> SELECT * FROM orders:o1 FETCH customer, billing;
> ```
>
> #### Technical Explanation
>
> 1. `FETCH field1, field2` expands multiple comma-separated record link pointers in a single query.
> 2. Replaces SQL `JOIN` syntax and MongoDB `$lookup` aggregation blocks.
> 3. Returns a clean nested JSON payload containing resolved document objects.

---

### Exercise 2: Deep Nested Path Pointer Resolution

**Scenario:**
A blog post query retrieves post `post:p1`, fetches the `author` record link (`user:alice`), and fetches the nested `author.company` record link (`company:acme`).

**Requirements:**
1. Create company `company:acme`, user `user:alice` linked to `company:acme`, and post `post:p1` linked to `user:alice`.
2. Execute `SELECT * FROM post:p1 FETCH author, author.company;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE company:acme SET name = "Acme Corp";
> CREATE user:alice SET name = "Alice", company = company:acme;
> CREATE post:p1 SET title = "Deep Fetching in SurrealDB", author = user:alice;
> 
> -- Fetch nested pointer paths using dot notation
> SELECT * FROM post:p1 FETCH author, author.company;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation paths in `FETCH` (`author.company`) unwrap multi-level nested foreign record link pointers.
> 2. Resolves deep relational trees without writing recursive CTE queries.
> 3. Operates in a single database query execution pass.

---

### Exercise 3: Resolving Arrays of Record Links with `FETCH`

**Scenario:**
An article listing contains an array of tag record links `tags = [tag:rust, tag:db]`. Eagerly resolve the array of pointers into full tag documents.

**Requirements:**
1. Create tags `tag:rust` and `tag:db`.
2. Create article `article:a1` with `tags = [tag:rust, tag:db]`.
3. Select `article:a1` using `FETCH tags`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE tag:rust SET name = "Rust Language";
> CREATE tag:db SET name = "Databases";
> 
> CREATE article:a1 SET title = "SurrealDB Overview", tags = [tag:rust, tag:db];
> 
> -- Fetch array of record link pointers
> SELECT * FROM article:a1 FETCH tags;
> ```
>
> #### Technical Explanation
>
> 1. `FETCH` seamlessly resolves single record links AND arrays of record links (`array<record>`).
> 2. Replaces array pointer IDs with expanded tag document objects inline.
> 3. Eliminates application-side N+1 query loops.

---



## 6. Related Terms

- [Array of Record Links](../level_05/array_record_links.md) — Array record link collections.

- [`SELECT`](select.md) — The parent query statement.
- [`record` (Record Link Type)](../level_02/record_link_type.md) — The pointer fields targeted.

---

## 7. Key Takeaways
- The `FETCH` clause resolves Record Link pointers with actual document content.
- Bypasses SQL `JOIN` syntax and MongoDB `$lookup` aggregation blocks.
- Returns nested JSON trees directly, simplifying frontend client parsing.
- Supports fetching multiple separate link fields using commas.
- Supports deep nested fetching using dot notation (e.g. `FETCH author.company`).
- Only works on primitive `record` data types (fails on raw text strings).
- Resolving links that point to deleted records returns `NONE` for that property.
