# Record Link (Concept)

> **Level 5 — Relational Data & Graph Operations**
> The structural concept of linking documents in SurrealDB by storing Record IDs directly inside fields (or arrays of fields) to represent one-to-one or one-to-many relationships without junction tables or graph edges.

---

## 1. Prerequisites
- [Record Link Type](../level_02/record_link_type.md) — The data type validation rules.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the query execution planner. Uses direct disk pointer lookups to resolve referenced fields).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems (PostgreSQL), representing links requires foreign key values:
-   If you have a `post` table, you store `author_id = 5`.
-   The value `5` is a simple number; the database doesn't know *which* table it points to without reading the foreign key constraint rules.
-   Fetching the author requires a `JOIN` search operation.

In MongoDB, you store an ID string, but you have no referential checks: if you delete the user, the post still stores the dangling ID string, causing data integrity issues.

We designed the **Record Link Concept** in SurrealDB to combine relational safety with document simplicity:
1.  **Direct Pointers:** The field stores the Record ID directly (e.g. `user:john`). Because the ID contains the table name, the database knows exactly where the target record lives.
2.  **JOIN-free Traversal:** You query linked data using dot notation (e.g. `author.name`), and the database resolves it in constant time ($O(1)$) by jumping directly to the target record's disk address, avoiding index scans.
3.  **Dangling Link Safety:** If the linked record (e.g. `user:john`) is deleted, the field does not throw errors; traversing it simply returns `NONE`.

---

### (2) Mapping Relationships with Record Links
Record links are ideal for simple, directed associations:
-   **One-to-One (1:1):** Storing a single pointer field: `author = user:tobie`.
-   **One-to-Many (1:N):** Storing an array of pointer links directly inside the parent record: `tags = [tag:rust, tag:tech]`. No junction tables needed!

*Note:* If you need bidirectional lookups or need to store properties *on the link itself* (e.g. "when did this user follow this user?"), you should use **Graph Edges** (covered in the next term) instead of record links.

---

### (3) Reality Metaphor (Web Bookmarks)
Imagine navigating reference files:
-   **SQL Foreign Keys:** A note in a folder reading: *"See box 45 in the archive room."* You must walk to the archive room, locate box 45, and pull the folder. (Table JOIN).
-   **Record Link:** A **Web Browser Bookmark**. 
    -   You save the exact address (`user:john`) as a shortcut. 
    -   Clicking the bookmark jumps you directly to the target page contents. 
    -   If the owner deletes the target webpage (deleted record), clicking the bookmark returns a `"404 Not Found"` (`NONE`).

---

### (4) Code Examples

#### Representing One-to-Many Links in SurrealQL
Observe how arrays of record links are saved and traversed:

```sql
DEFINE TABLE project SCHEMAFULL;

-- 1. Store an array of record links (1:N relationship!)
DEFINE FIELD team ON project TYPE array<record<user>>;

-- 2. Insert the project record pointing directly to user records
CREATE project:apollo SET
  name = "Apollo Mission",
  team = [user:alice, user:bob];

-- 3. Traverse the array of links in a single query!
-- Returns a list of usernames inside the project response
SELECT name, team.name AS team_names FROM project:apollo;

-- Output returned:
// [
//   {
//     "name": "Apollo Mission",
//     "team_names": ["Alice", "Bob"] // Automatically resolved!
//   }
// ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating complex graph relation tables (edges) for simple, one-directional 1:N references, adding unnecessary schema overhead

**The mistake:** Designing a custom `project_team_relation` table to connect users to projects, when a simple array of record links (`team = [user:alice, user:bob]`) is sufficient.

**Why it's wrong:** Graph edges are powerful but introduce storage and query overhead. 

If you do not need to query the relationship bidirectionally (e.g. you never need to query `"which projects does this user belong to"` from the user table) and you don't need properties on the link, graph relation tables add unnecessary complexity.

**Fix: Use simple record links (or arrays of record links) for one-directional references. Use graph edges only when bidirectional queries or relationship properties are required.**

---



### Mistake 2: Quoting Record Links as Text Strings in Schema Definitions

**The mistake:** Defining `DEFINE FIELD author ON TABLE post TYPE string;` to store `user:alice`.

**Why it's wrong:** Defining a record link field as `TYPE string` stores it as plain text, disabling automatic dot-notation traversal (`author.name`) and `FETCH` expanding features! Define as `TYPE record<user>`.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE string; // ❌ Disables graph features!
```

*Fix:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>; // Enables pointer traversal
```

### Mistake 3: Comparing Record Link Fields against Plain String Values in Queries

**The mistake:** Querying `SELECT * FROM post WHERE author = 'user:alice';`.

**Why it's wrong:** Quoted `'user:alice'` is a string primitive, whereas `author` stores a Record ID primitive `user:alice`. Comparing string to Record ID returns false.

*Incorrect:*
```surrealql
SELECT * FROM post WHERE author = "user:alice"; // ❌ String is not equal to Record ID!
```

*Fix:*
```surrealql
SELECT * FROM post WHERE author = user:alice; // Unquoted Record ID
```



### Mistake 4: Quoting Record Links as Text Strings in Schema Definitions

**The mistake:** Defining `DEFINE FIELD author ON TABLE post TYPE string;` to store `user:alice`.

**Why it's wrong:** Defining a record link field as `TYPE string` stores it as plain text, disabling automatic dot-notation traversal (`author.name`) and `FETCH` expanding features! Define as `TYPE record<user>`.

*Incorrect:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE string; // ❌ Disables graph features!
```

*Fix:*
```surrealql
DEFINE FIELD author ON TABLE post TYPE record<user>; // Enables pointer traversal
```

### Mistake 5: Comparing Record Link Fields against Plain String Values in Queries

**The mistake:** Querying `SELECT * FROM post WHERE author = 'user:alice';`.

**Why it's wrong:** Quoted `'user:alice'` is a string primitive, whereas `author` stores a Record ID primitive `user:alice`. Comparing string to Record ID returns false.

*Incorrect:*
```surrealql
SELECT * FROM post WHERE author = "user:alice"; // ❌ String is not equal to Record ID!
```

*Fix:*
```surrealql
SELECT * FROM post WHERE author = user:alice; // Unquoted Record ID
```

## 6. Practice Exercises

### Exercise 1: Reference Mapping

**Problem:** You are building a catalog. 
Write the SurrealQL commands to:
1.  Define a table named `book` in `SCHEMAFULL` mode.
2.  Define a field named `publisher` that stores a record link pointing to the `publisher` table.
3.  Define a field named `authors` that stores an array of record links pointing to the `author` table.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE TABLE book SCHEMAFULL;
> DEFINE FIELD publisher ON book TYPE record<publisher>;
> DEFINE FIELD authors ON book TYPE array<record<author>>;
> ```
> - Single pointers use `record<table>` type definitions.
> - Multiple pointers use `array<record<table>>` type definitions.

---



### Exercise 2: Record Link Dot-Notation Traversal

**Problem:** Select post title and author's email using Record Link dot-notation (`author.email`).

**Expected output:**
> [!check]- Answer
> ```text
> SELECT title, author.email AS author_email FROM post;
> ```
> ```surrealql
> SELECT title, author.email AS author_email FROM post;
> ```
>
> **Explanation:** Record Links enable direct dot-notation dereferencing of linked foreign records.

---

### Exercise 3: Record Link Type Constraint

**Problem:** Define field `category` on `product` table restricted to `category` table record links.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD category ON TABLE product TYPE record<category>;
> ```
> ```surrealql
> DEFINE FIELD category ON TABLE product TYPE record<category>;
> ```
>
> **Explanation:** `TYPE record<table>` enforces foreign record link pointer types.

## 7. Related Terms
- [Record Link Type](../level_02/record_link_type.md) — The data type validation rules.
- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — Bidirectional mappings.

---

## 8. Key Takeaways
- Record Links store Record IDs inside fields to map relationships.
- Directly represents 1:1 and 1:N relationships without junction tables.
- Traversed using dot notation, resolving data in constant time ($O(1)$).
- Dangling references (pointing to deleted records) return `NONE` on traversal.
- Arrays of record links replace SQL many-to-many junction tables.
- Use simple record links for directed, one-way references.
- Use graph edges if you need bidirectional queries or properties on the link.
