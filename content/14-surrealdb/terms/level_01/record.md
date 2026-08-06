# Record

> **Level 1 — What Is SurrealDB?**
> The fundamental unit of data storage in SurrealDB, serving as the direct equivalent to a row in PostgreSQL or a document in MongoDB, but uniquely identified by a composite `table:id` Record ID.

---

## 1. Prerequisites

- [SurrealQL](surrealql.md) — The query language used to fetch records.

---

## 2. Term Category


**Core Concept (document-like data record unit)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, data is split across tables using flat **Rows**:
-   A row cannot hold nested arrays or sub-objects natively without violating database design rules (First Normal Form).
-   To store a user's address list, you must create a separate table and link it with foreign keys.

In document databases, data is stored as nested **Documents**:
-   A document can hold arrays easily, but connecting it to other documents requires manual object references that are hard to manage.

We designed the **Record** in SurrealDB to combine both paradigms. 

A record stores data as a hierarchical JSON-like object, allowing you to embed arrays and objects natively (like MongoDB). 

At the same time, every record acts as a node in a relational graph, uniquely identified by a composite `table:id` label (like `user:john`), allowing direct pointers and relationships without the complexity of traditional SQL tables.

---

### (2) Record Vocabulary Across Databases
How records compare across the three systems:

| Concept | PostgreSQL | MongoDB | SurrealDB |
| :--- | :--- | :--- | :--- |
| **Primary Unit** | **Row** | **Document** | **Record** |
| **Storage Container** | Table | Collection | Table |
| **Identifier** | Primary Key (separate column) | `_id` field (ObjectId) | **Record ID** (fused `table:id`) |
| **Structure** | Flat columns | Nested BSON | Nested JSON (Objects/Arrays) |

---

### (3) Reality Metaphor (The Smart Folder)
Imagine keeping office records:
-   **PostgreSQL Row:** A line on a **Pre-Printed Ledger Sheet**. 
    -   You must write values strictly inside the vertical column grids. 
    -   You cannot write paragraphs or attach sub-lists.
-   **MongoDB Document:** A **Blank Binder Sheet**. 
    -   You can write anywhere, glue receipts, or draw lists. 
    -   However, if a sheet refers to another binder, you must write the ID down and search for it manually in the archive cabinets.
-   **SurrealDB Record:** A **Smart Manila Folder**. 
    -   It stores nested sheets (arrays and objects), has a fused label on its tab (`patient:tobie`), and contains a **physical string tag** pointing directly to another folder (`doctor: doctor:smith`). 
    -   Touching the tag pulls the doctor's folder directly to your desk.

---

### (4) Code Examples

#### Structure of a SurrealDB Record
This is how a typical user record is written and stored in SurrealDB:

```javascript
// A single User Record (JSON representation)
{
  id: user:tobie,                    // The fused Record ID (table:id)
  name: {                            // Nested Object
    first: "Tobie",
    last: "Morgan"
  },
  email: "tobie@surrealdb.com",      // String field
  roles: ["admin", "developer"],     // Array field
  registered_at: d"2026-07-21T15:30:00Z" // Datetime type
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Normalizing every array field into separate tables because you assume SurrealDB records must be flat like SQL rows

**The mistake:** Creating a separate `user_emails` table to store multiple emails for a user, rather than storing them as a string array inside the user record.

**Why it's wrong:** SurrealDB records support nested JSON objects and arrays natively. 

Forcing relational normalization on simple nested lists adds query overhead and slows down development, as you must write complex queries to fetch basic data.

**Fix: Embed list values (like tags, configurations, or addresses) directly inside arrays or objects within the record document. Only separate data into different tables if the nested items represent independent entities that need their own unique IDs (like products in an order).**

---



### Mistake 2: Treating Record IDs as Simple Integer Auto-Increment IDs

**The mistake:** Expecting record IDs to be sequential integers like `1`, `2`, `3`.

**Why it's wrong:** SurrealDB Record IDs are structured string-table pairs (`table:id`, e.g., `user:alice` or `user:ulid()`).

*Incorrect:*
```surrealql
-- Assuming integer ID primary keys
SELECT * FROM user WHERE id = 1; // ❌ Fails to match record user:1 or user:alice
```

*Fix:*
```surrealql
SELECT * FROM user:1; // Direct primary key record lookup by Record ID
```

### Mistake 3: Creating Duplicate Record IDs with `CREATE` Statement

**The mistake:** Running `CREATE user:alice CONTENT { name: "Alice" };` twice.

**Why it's wrong:** `CREATE` fails and throws an error if the specified Record ID already exists! Use `UPSERT` or `UPDATE` if overwriting or updating existing records is intended.

*Incorrect:*
```surrealql
-- If user:alice already exists:
CREATE user:alice CONTENT { name: "Alice" }; // ❌ Error: Record user:alice already exists!
```

*Fix:*
```surrealql
UPSERT user:alice CONTENT { name: "Alice" }; // Safely creates or updates record
```

## 5. Practice Exercises

### Exercise 1: Multi-Model Record Construction

**Scenario:**
You are modeling a user profile record in SurrealDB that demonstrates its multi-model capabilities: tabular scalar fields, a nested document object, an array of tags, and a record link pointer to another table.

**Requirements:**
1. Target table `user` with ID `user:john`.
2. Include scalar fields `name` and `email`.
3. Include a nested document object `settings` containing `theme` and `notifications`.
4. Include a record link field `role` pointing to `role:admin`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:john CONTENT {
>     name: "John Doe",
>     email: "john@example.com",
>     role: role:admin,
>     tags: ["developer", "administrator"],
>     settings: {
>         theme: "dark",
>         notifications: true
>     }
> };
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB records are JSON-like documents containing scalar values, nested objects, arrays, and record links.
> 2. `role:role:admin` stores a direct typed record link pointer rather than a raw foreign key string.
> 3. Nested document fields (`settings.theme`) can be queried directly using dot-notation without unnesting.
> 
---

### Exercise 2: Record Mutation Strategies (`MERGE` vs `CONTENT`)

**Scenario:**
You need to update `user:john`'s email address without overwriting or erasing the existing `settings` object or `tags` array.

**Requirements:**
1. Write the SurrealQL statement using `MERGE` or `SET` to perform a non-destructive partial update.
2. Explain why using `CONTENT` for partial updates is dangerous.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Non-destructive partial update
> UPDATE user:john MERGE {
>     email: "john.updated@example.com"
> };
> ```
>
> #### Technical Explanation
>
> 1. `MERGE` performs a shallow merge, updating specified fields while preserving existing document properties.
> 2. Using `CONTENT` replaces the entire record payload, accidentally deleting any fields omitted from the payload.
> 3. `UPDATE ... SET email = ...` is also safe for single-field mutations.
> 
---

### Exercise 3: Record Identifier Access Patterns

**Scenario:**
A backend service needs to fetch a single user record by its primary key `user:john` with maximum efficiency.

**Requirements:**
1. Write the direct record selection query targeting `user:john`.
2. Contrast the performance of direct record selection vs a filtered table scan (`SELECT * FROM user WHERE id = user:john`).

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Direct primary key lookup (O(1) index jump)
> SELECT * FROM user:john;
> ```
>
> #### Technical Explanation
>
> 1. `SELECT * FROM table:id` performs a direct primary key index lookup in $O(1)$ constant time.
> 2. Avoid using `WHERE id = ...` filters, as `user:john` acts directly as the record pointer address in SurrealDB.
> 3. Direct record targeting bypasses table scanning algorithms completely.
> 
---



## 6. Related Terms

- [Table](table.md) — The parent records collection.
- [Record ID (`table:id`)](record_id.md) — The unique identifier.
- [SurrealQL](surrealql.md) — Related concept: SurrealQL.

---

## 7. Key Takeaways
- The Record is the fundamental unit of data storage in SurrealDB.
- Directly equivalent to a PostgreSQL row or a MongoDB document.
- Stored as a hierarchical JSON-like object, supporting nested arrays and structures.
- Uniquely identified by a fused `table:id` Record ID.
- Supports pointer references (record links) to other records natively.
- Eliminates the flat structure limitations of traditional SQL database rows.
- Can be schema-full (strict validation) or schema-less (fully flexible) per table.
