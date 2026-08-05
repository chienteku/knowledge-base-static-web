# `SELECT` with Record Link Fetching (`FETCH`)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clause appended to `SELECT` queries that instructs the database engine to resolve (dereference) Record Link fields, replacing pointer IDs (like `user:john`) with the actual target record content in the final JSON response.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.
- [`record` (Record Link Type)](../level_02/record_link_type.md) — The pointer fields targeted.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the query compiler resolver stage. Automatically executes sub-queries in parallel to fetch target documents from the database storage engine).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Multi-Link Query Construction

**Problem:** You are building a checkout dashboard. 
You have an `orders` table containing these fields:
-   `customer` (of type `record<user>`)
-   `billing` (of type `record<invoice>`)
Write the SurrealQL query to retrieve all orders, replacing the customer and billing pointers with their full record documents.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT * FROM orders FETCH customer, billing;
> ```
> - The source table is `orders`.
> - Specify both link fields in the `FETCH` clause, separated by a comma.

---



### Exercise 2: Deep Nested Record Link Fetching

**Problem:** Select all `order` records and fetch `customer` and nested `customer.address`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM order FETCH customer, customer.address;
> ```
> ```surrealql
> SELECT * FROM order FETCH customer, customer.address;
> ```
>
> **Explanation:** Specifying dot paths in `FETCH` unwraps nested foreign record pointers.

---

### Exercise 3: Fetching Array of Record Links

**Problem:** Fetch array of record links `tags` on `article` table (`FETCH tags`).

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM article FETCH tags;
> ```
> ```surrealql
> SELECT * FROM article FETCH tags;
> ```
>
> **Explanation:** `FETCH` expands single record links and arrays of record links seamlessly.

## 7. Related Terms

- [`SELECT`](select.md) — The parent query statement.
- [`record` (Record Link Type)](../level_02/record_link_type.md) — The pointer fields targeted.

---

## 8. Key Takeaways
- The `FETCH` clause resolves Record Link pointers with actual document content.
- Bypasses SQL `JOIN` syntax and MongoDB `$lookup` aggregation blocks.
- Returns nested JSON trees directly, simplifying frontend client parsing.
- Supports fetching multiple separate link fields using commas.
- Supports deep nested fetching using dot notation (e.g. `FETCH author.company`).
- Only works on primitive `record` data types (fails on raw text strings).
- Resolving links that point to deleted records returns `NONE` for that property.
