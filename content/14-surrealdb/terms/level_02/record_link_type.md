# `record` (Record Link Type)

> **Level 2 — Data Types & Record Structure**
> The specialized data type in SurrealDB that stores direct pointer references to other records using `table:id` syntax, serving as the foundation for JOIN-free relationship traversal.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Record ID (`table:id`)](../level_01/record_id.md) — The pointer formatting structure.

---

## 2. Term Category


**Data Type (direct record pointer link type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Connecting records in other databases is complex and slow:
-   **PostgreSQL:** Uses a foreign key column storing integers. The database treats it as a simple number. You cannot access properties directly; you must write a `JOIN` clause to fetch the linked row.
-   **MongoDB:** Stores a string (like `ObjectId`). The driver doesn't validate if the target document exists, and you must write `$lookup` aggregations to merge data.

We designed the **`record`** data type in SurrealDB to solve this relationship mapping overhead. 

It is a native, pointer-aware data type. 

Instead of storing numbers or text strings, a `record` field stores a direct connection pointer (e.g. `user:john`). 

Because SurrealDB understands this is a link, you can access properties on the linked record directly in your query using dot notation (e.g. `SELECT author.email FROM post`). 

The database automatically resolves the link on the fly, eliminating SQL `JOIN` syntax and MongoDB `$lookup` aggregation boilerplate.

---

### (2) Generic vs. Typed Links
You can configure record link schemas at different levels of strictness:
-   **Generic Link (`TYPE record`):** The field can store a pointer to any record in any table in the database (e.g., could point to `user:john` or `company:acme`).
-   **Typed Link (`TYPE record<table>`):** Restricts the pointer to a specific table (e.g., `TYPE record<user>` will reject writes trying to link to a `company:acme` record).

---

### (3) Reality Metaphor (Footnotes vs Hyperlinks)
Imagine reading information:
-   **SQL Foreign Key (Footnote):** A footnote citation at the bottom of a book page: *"For author info, see page 45 of Book B."* 
    -   To read it, you must close the book, walk to the shelf, locate Book B, open page 45, read the name, and walk back. (SQL `JOIN` query).
-   **SurrealDB Record Link (Hyperlink):** A **Blue Underlined URL Link** on a webpage. 
    -   The author's name is a link (`user:john`). 
    -   You hover over it, and a preview card pops open showing their email and bio. (Automatic dot-notation traversal).

---

### (4) Code Examples

#### Creating and Querying Record Links
Let's model a blog post pointing to a user:

```sql
DEFINE TABLE post SCHEMAFULL;

-- 1. Define the field as a typed record link
DEFINE FIELD author ON post TYPE record<user>;

-- 2. Insert records (Use the raw Record ID token, NO quotes!)
CREATE post:first SET
  title = "SurrealDB Relational Design",
  author = user:tobie; // Stores a record link pointing to user:tobie

-- 3. Query the linked properties directly using dot notation!
-- (NO SQL JOIN keyword required!)
SELECT title, author.name, author.email FROM post;

-- Output returned (SurrealDB walks the link and fetches the fields!):
// [
//   {
//     title: "SurrealDB Relational Design",
//     "author.name": "Tobie",
//     "author.email": "tobie@example.com"
//   }
// ]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing record links as text strings in insert queries, breaking link traversal and fetch operations

**The mistake:** Writing the insert query as `CREATE post:first SET author = "user:tobie";` (quoting the ID).

**Why it's wrong:** Quoting the ID converts the value to a `string` type. 

Because `author` is defined as `TYPE record<user>`, the write will fail validation in schema-full tables. 

Even in schema-less tables, saving it as a string prevents dot-notation link traversal, as SurrealDB treats it as raw text, not a pointer.

**Fix: Always pass Record IDs as unquoted raw tokens to ensure they are parsed as record link pointers:**

```sql
-- BAD (Stores a string)
CREATE post:first SET author = "user:tobie";

-- GOOD (Stores a record link pointer)
CREATE post:first SET author = user:tobie;
```

---



### Mistake 2: Storing Record Links as Plain String Types in Schema Definitions

**The mistake:** Defining `DEFINE FIELD author ON TABLE post TYPE string;` to store `user:alice`.

**Why it's wrong:** Defining record links as `TYPE string` stores them as plain text. You lose automatic graph traversal (`author.name`) and `FETCH` expanding features! Use `TYPE record<user>`.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE string; // ❌ Plain string disables graph traversal!
```

*Fix:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>; // Record link enables graph features
```

### Mistake 3: Passing Invalid Non-Existent Table IDs into Record Link Fields

**The mistake:** Assigning `author = product:123` to a field defined as `TYPE record<user>`.

**Why it's wrong:** `TYPE record<user>` restricts stored Record IDs strictly to the `user` table. Assigning a `product` ID throws a schema validation error.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>;
CREATE post SET author = product:123; // ❌ Type error: Expected record<user>, got record<product>
```

*Fix:*
```surrealql
CREATE post SET author = user:alice; // Valid matching table Record ID
```

## 5. Practice Exercises

### Exercise 1: Foreign Record Pointer Definition

**Scenario:**
You are defining a blog post table `post` where each post stores a direct record link pointer `author` to a `user` record.

**Requirements:**
1. Define table `post` in `SCHEMAFULL` mode.
2. Define field `author` as `record<user>`.
3. Create user `user:alice`.
4. Create post `post:p1` setting `author = user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE post SCHEMAFULL;
> DEFINE FIELD author ON TABLE post TYPE record<user>;
> 
> CREATE user:alice SET name = "Alice Smith";
> CREATE post:p1 SET title = "Understanding Record Links", author = user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `TYPE record<user>` restricts the field strictly to valid record ID pointers from table `user`.
> 2. Stores a direct pointer (`user:alice`) rather than a raw foreign key string.
> 3. Enforces pointer integrity at write time in `SCHEMAFULL` mode.

---

### Exercise 2: Eager Pointer Resolution with `FETCH`

**Scenario:**
Select post `post:p1` and eagerly expand the `author` record link pointer into a full user document in a single query.

**Requirements:**
1. Write the `SELECT` statement targeting `post:p1`.
2. Add the `FETCH author` clause to resolve the author pointer.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM post:p1 FETCH author;
> ```
>
> #### Technical Explanation
>
> 1. `FETCH author` replaces the pointer `user:alice` with the full `user` document inline in the result payload.
> 2. Bypasses SQL `JOIN` syntax and MongoDB `$lookup` aggregation pipelines.
> 3. Resolves pointers in a single database roundtrip.

---

### Exercise 3: Traversing Linked Fields via Dot-Notation

**Scenario:**
Query the author's name (`author.name`) directly from `post:p1` without expanding the entire author document.

**Requirements:**
1. Write a `SELECT` query extracting `title` and `author.name` from `post:p1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT title, author.name AS author_name FROM post:p1;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`author.name`) automatically traverses the record link pointer to extract targeted remote fields.
> 2. Executes pointer traversal in $O(1)$ constant time complexity.
> 3. Simplifies query construction by eliminating explicit join clauses.

---



## 6. Related Terms

- [Record ID (`table:id`)](../level_01/record_id.md) — The pointer formatting structure.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Traversing links.
- [`SELECT` with Record Link Fetching (`FETCH`)](../level_03/select_fetch.md) — Related concept: `SELECT` with Record Link Fetching (`FETCH`).
- [Array of Record Links (`array<record<table>>`)](../level_05/array_record_links.md) — Arrays of record links.
- [Data Types (Overview)](data_types.md) — Related concept: Data Types (Overview).

---

## 7. Key Takeaways
- The `record` type stores pointer references to specific records.
- Eliminates the need for relational SQL JOINs and MongoDB `$lookup` queries.
- Typed links (`record<table>`) restrict references to a target table.
- Retrieve properties of linked records directly using dot notation (e.g. `author.name`).
- Pass links as unquoted composite tokens (e.g. `user:john`), not strings.
- Record links form the foundational network pathways for SurrealDB graph operations.
- Dangling references (pointing to deleted records) return `NONE` on traversal.
