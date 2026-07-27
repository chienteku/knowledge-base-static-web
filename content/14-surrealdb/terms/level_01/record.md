# Record

> **Level 1 — What Is SurrealDB?**
> The fundamental unit of data storage in SurrealDB, serving as the direct equivalent to a row in PostgreSQL or a document in MongoDB, but uniquely identified by a composite `table:id` Record ID.

---

## 1. Prerequisites
- [SurrealQL](surrealql.md) — The query language used to fetch records.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (The BSON/JSON-like data container stored on the persistent disk engine and processed in server memory).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Structural Mapping

**Problem:** Complete the vocabulary mapping by matching the SQL/NoSQL terms with the correct SurrealDB equivalent:
1.  A row in PostgreSQL $\rightarrow$ *?*
2.  A document in MongoDB $\rightarrow$ *?*
3.  An ObjectId (`_id`) in MongoDB $\rightarrow$ *?*

**Expected output:**
```text
1. Record
2. Record
3. Record ID (table:id)
```

> [!check]- Answer
> - SurrealDB unifies both rows and documents under a single term name.
> - The unique identifier contains both the table namespace and the unique ID key.

---



### Exercise 2: Direct Record Key Lookup

**Problem:** Query single record `user:john` directly in $O(1)$ time without `WHERE` clauses.

**Expected output:**
```text
SELECT * FROM user:john;
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM user:john;
> ```
>
> **Explanation:** Specifying `table:id` directly in `FROM` performs constant-time primary key lookups.

### Exercise 3: Record Content Insertion

**Problem:** Insert a new record into `article` table with custom string ID `article:first`.

**Expected output:**
```text
CREATE article:first SET title = "Hello World";
```

> [!check]- Answer
> ```surrealql
> CREATE article:first SET title = "Hello World";
> ```
>
> **Explanation:** `CREATE table:id` explicitly assigns primary key Record IDs.

## 7. Related Terms
- [Table](table.md) — The parent records collection.
- [Record ID (`table:id`)](record_id.md) — The unique identifier.

---

## 8. Key Takeaways
- The Record is the fundamental unit of data storage in SurrealDB.
- Directly equivalent to a PostgreSQL row or a MongoDB document.
- Stored as a hierarchical JSON-like object, supporting nested arrays and structures.
- Uniquely identified by a fused `table:id` Record ID.
- Supports pointer references (record links) to other records natively.
- Eliminates the flat structure limitations of traditional SQL database rows.
- Can be schema-full (strict validation) or schema-less (fully flexible) per table.
