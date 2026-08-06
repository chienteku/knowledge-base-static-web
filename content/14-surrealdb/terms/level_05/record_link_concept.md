# Record Link (Concept)

> **Level 5 — Relational Data & Graph Operations**
> The structural concept of linking documents in SurrealDB by storing Record IDs directly inside fields (or arrays of fields) to represent one-to-one or one-to-many relationships without junction tables or graph edges.

---

## 1. Prerequisites

- [`record` (Record Link Type)](../level_02/record_link_type.md) — The data type validation rules.
- [Record ID (`table:id`)](../level_01/record_id.md) — Record IDs.
- [Table](../level_01/table.md) — Table entities.

---

## 2. Term Category


**Core Concept (native pointer record link architecture)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Typed Record Link Creation and Direct Lookups

**Scenario:**
Create a user record `user:alice` and a post record `post:p1` containing a direct record link pointer `author = user:alice`.

**Requirements:**
1. Create `user:alice`.
2. Create `post:p1` setting `author = user:alice`.
3. Query `post:p1` to inspect the stored record link payload.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice Smith";
> 
> -- Create record containing a direct record link pointer
> CREATE post:p1 SET title = "Record Links in SurrealDB", author = user:alice;
> 
> SELECT * FROM post:p1;
> ```
>
> #### Technical Explanation
>
> 1. `user:alice` is a typed `record` ID value in SurrealDB, not a raw string literal `"user:alice"`.
> 2. Stores a direct pointer reference to the target user record.
> 3. Enables $O(1)$ pointer resolution and dot-notation traversal (`author.name`).
> 
---

### Exercise 2: Resolving Record Link Properties via Dot-Notation

**Scenario:**
Query `post:p1` and project the author's name directly using dot-notation (`author.name`) without writing a `JOIN` clause.

**Requirements:**
1. Write `SELECT title, author.name AS author_name FROM post:p1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Direct pointer property traversal
> SELECT title, author.name AS author_name FROM post:p1;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`author.name`) automatically traverses the record link pointer to extract remote fields.
> 2. Bypasses explicit SQL `JOIN` clauses.
> 3. Executes pointer resolution in $O(1)$ constant time complexity.
> 
---

### Exercise 3: Eager Pointer Expansion with `FETCH`

**Scenario:**
Eagerly expand the `author` record link pointer on `post:p1` into the full `user` document payload using `FETCH`.

**Requirements:**
1. Execute `SELECT * FROM post:p1 FETCH author`.

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
> 1. `FETCH author` replaces the pointer `user:alice` with the full `user` document inline in the query payload.
> 2. Resolves record link pointers in a single database roundtrip.
> 3. Eliminates client-side N+1 query loops.
> 
---





## 6. Related Terms

- [`record` (Record Link Type)](../level_02/record_link_type.md) — The data type validation rules.
- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — Bidirectional mappings.
- [Indexing Record Link Fields](../level_07/indexing_record_links.md) — Related concept: Indexing Record Link Fields.
- [`RELATE` Statement](relate.md) — RELATE statement.
- [Array of Record Links (`array<record<table>>`)](array_record_links.md) — Array of record links.

---

## 7. Key Takeaways
- Record Links store Record IDs inside fields to map relationships.
- Directly represents 1:1 and 1:N relationships without junction tables.
- Traversed using dot notation, resolving data in constant time ($O(1)$).
- Dangling references (pointing to deleted records) return `NONE` on traversal.
- Arrays of record links replace SQL many-to-many junction tables.
- Use simple record links for directed, one-way references.
- Use graph edges if you need bidirectional queries or properties on the link.
