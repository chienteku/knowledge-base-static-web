# `record` (Record Link Type)

> **Level 2 — Data Types & Record Structure**
> The specialized data type in SurrealDB that stores direct pointer references to other records using `table:id` syntax, serving as the foundation for JOIN-free relationship traversal.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — The parent type system.
- [Record ID](../level_01/record_id.md) — The pointer formatting structure.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Processed as a primitive node link. Enforces referential structure validation during insert transactions).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Query Simplification

**Problem:** You have a SQL database query:
`SELECT orders.id, users.email FROM orders INNER JOIN users ON orders.user_id = users.id;`
Assuming you have migrated this schema to SurrealDB where the `user` field on the `orders` table is a `record<user>` link type, write the simplified SurrealQL query to retrieve the same data.

**Expected output:**
```sql
SELECT id, user.email FROM orders;
```

> [!check]- Answer
> - Replace the foreign key ID with the record link field `user`.
> - Access the user's email directly using dot notation, removing all `JOIN` syntax.

---



### Exercise 2: Record Link Schema Definition

**Problem:** Define field `publisher` on `book` table linking to `company` table.

**Expected output:**
```text
DEFINE FIELD publisher ON TABLE book TYPE record<company>;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD publisher ON TABLE book TYPE record<company>;
> ```
>
> **Explanation:** `TYPE record<table>` enforces foreign record link pointer types.

### Exercise 3: Fetching Linked Records in Single Query

**Problem:** Query all posts and expand linked `author` record using `FETCH` clause.

**Expected output:**
```text
SELECT * FROM post FETCH author;
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM post FETCH author;
> ```
>
> **Explanation:** `FETCH` automatically resolves and expands record link pointers in results.

## 7. Related Terms
- [Record ID](../level_01/record_id.md) — The pointer formatting structure.
- [Record Link (Concept)](../level_05/record_link_concept.md) — Traversing links.

---

## 8. Key Takeaways
- The `record` type stores pointer references to specific records.
- Eliminates the need for relational SQL JOINs and MongoDB `$lookup` queries.
- Typed links (`record<table>`) restrict references to a target table.
- Retrieve properties of linked records directly using dot notation (e.g. `author.name`).
- Pass links as unquoted composite tokens (e.g. `user:john`), not strings.
- Record links form the foundational network pathways for SurrealDB graph operations.
- Dangling references (pointing to deleted records) return `NONE` on traversal.
