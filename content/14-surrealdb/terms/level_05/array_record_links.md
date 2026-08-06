# Array of Record Links

> **Level 5 — Schema & Modeling**
> A SurrealDB data modeling pattern where a field stores an array of record IDs (`array<record<table>>`), enabling one-to-many relationships without separate join tables or embedded document duplication.

---

## 1. Prerequisites

- [Record Link (Concept)](record_link_concept.md) — Direct pointer references in SurrealDB.
- [`array`](../level_02/array_type.md) — Array data types in SurrealDB.
- [`DEFINE FIELD`](../level_04/define_field.md) — Schema field definitions.

---

## 2. Term Category

**Schema & Modeling (one-to-many array record link pattern)**: Storing an array of record links (`array<record<table>>`) in a record field is SurrealDB's primary pattern for one-to-many relationships. Unlike PostgreSQL (which requires foreign keys and join queries) or MongoDB (which duplicates sub-documents or uses `$lookup`), SurrealDB allows instant traversal across arrays of record links.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In relational databases (PostgreSQL), one-to-many relationships are modeled by putting a foreign key on the child table. Querying all children of a parent requires a `SELECT ... WHERE parent_id = ?` query indexed by foreign key. In document databases (MongoDB), one-to-many relationships are modeled either by embedding sub-documents (causing document bloat and duplication) or by storing arrays of `ObjectId`s (requiring manual application joins or `$lookup`).

SurrealDB unifies both approaches with **Arrays of Record Links**:
1. **Direct Pointer Collections**: A single field stores an array of target record IDs (e.g. `[product:1, product:2, product:3]`).
2. **Zero-JOIN Fetching**: Querying the parent record with `FETCH` resolves all linked records instantly without SQL `JOIN` statements.
3. **No Data Duplication**: Linked records remain canonical documents in their own tables, preventing stale copy inconsistencies.

### (2) Reality Metaphor

Imagine a playlist on a music streaming service:
- Relational approach: Each song table stores a `playlist_id` foreign key. A song can only belong to one playlist unless you build a junction table.
- Document embedding approach: The entire song data (artist, audio, lyrics) is copied directly inside the playlist JSON. Updating song lyrics requires updating 10,000 playlists.
- SurrealDB Array of Record Links approach: The playlist stores a clean array of track pointers `[song:track_1, song:track_2, song:track_3]`. Songs remain independent, and the playlist loads all track details instantly via pointer resolution.

### (3) SurrealQL Code Examples

#### Modeling and Querying Arrays of Record Links

```surrealql
-- Define a SCHEMAFULL shopping cart storing an array of product record links
DEFINE TABLE cart SCHEMAFULL;
DEFINE FIELD items ON TABLE cart TYPE array<record<product>>;

-- Create product records
CREATE product:laptop SET name = "High-End Laptop", price = 1299.99dec;
CREATE product:mouse SET name = "Wireless Mouse", price = 49.99dec;

-- Create cart referencing multiple product records directly in an array
CREATE cart:alice_cart SET items = [product:laptop, product:mouse];

-- Query 1: Direct selection returns record IDs
SELECT items FROM cart:alice_cart;
-- Output: { items: [ product:laptop, product:mouse ] }

-- Query 2: Dot-notation field navigation across the array!
SELECT items.name, items.price FROM cart:alice_cart;
-- Output: { items: { name: ["High-End Laptop", "Wireless Mouse"], price: [1299.99, 49.99] } }

-- Query 3: Eager resolution with FETCH keyword
SELECT * FROM cart:alice_cart FETCH items;
-- Output: Cart record with full product documents expanded inline inside 'items'!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing Plain String IDs Instead of Typed Record Links

**The mistake:** Storing `items = ["product:laptop", "product:mouse"]` as raw string arrays.

**Why it's wrong:** Plain strings are not recognized by SurrealDB's pointer engine. Dot-notation traversal (`items.name`) and `FETCH` clauses will fail to resolve the referenced records.

*Incorrect:*
```surrealql
DEFINE FIELD items ON TABLE cart TYPE array<string>;
```

*Fix:*
```surrealql
DEFINE FIELD items ON TABLE cart TYPE array<record<product>>;
```

### Mistake 2: Growing Link Arrays Unboundedly Beyond Storage Limits

**The mistake:** Storing millions of record links inside a single array field (e.g. storing all `log_entry` IDs on a single `system` record).

**Why it's wrong:** Array fields are stored inline within the parent record document. Extremely large arrays increase document size beyond storage limits and slow down record serialization.

*Fix:* Use graph edges (`RELATE system->has_log->log_entry`) for high-cardinality 1-to-many or many-to-many relationships.

### Mistake 3: Manually Joining Tables in Code Instead of Using `FETCH`

**The mistake:** Fetching the array of record IDs, then issuing separate `db.select()` calls for each ID in Node.js/Python code.

**Why it's wrong:** Creates N+1 database network roundtrips, degrading application throughput.

*Fix:* Use `SELECT * FROM cart:1 FETCH items;` to resolve all linked records in a single database roundtrip.

---

## 5. Practice Exercises

### Exercise 1: Multi-Link Array Field Definition

**Scenario:**
You are designing a project management schema where a `project` record stores an array of assigned team member record links `team_members = [user:alice, user:bob]`.

**Requirements:**
1. Define table `project` as `SCHEMAFULL`.
2. Define field `team_members` as `array<record<user>>`.
3. Create project `project:p1` assigning `[user:alice, user:bob]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE project SCHEMAFULL;
> DEFINE FIELD team_members ON TABLE project TYPE array<record<user>>;
> 
> CREATE user:alice SET name = "Alice";
> CREATE user:bob SET name = "Bob";
> 
> CREATE project:p1 SET name = "Graph Engine Upgrade", team_members = [user:alice, user:bob];
> ```
>
> #### Technical Explanation
>
> 1. `array<record<user>>` enforces typed arrays of foreign record ID pointers.
> 2. Stores direct primary key references (`[user:alice, user:bob]`) instead of separate junction table rows.
> 3. Guarantees pointer integrity at write time in `SCHEMAFULL` mode.

---

### Exercise 2: Eager Resolution of Array Links with `FETCH`

**Scenario:**
Select project `project:p1` and eagerly expand the array of team member pointers (`team_members`) into full user document objects in a single query.

**Requirements:**
1. Write the `SELECT` query targeting `project:p1`.
2. Apply `FETCH team_members` to resolve all member pointers inline.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM project:p1 FETCH team_members;
> ```
>
> #### Technical Explanation
>
> 1. `FETCH team_members` replaces every record link pointer in the array with its full user document object.
> 2. Resolves all array pointers in a single database query roundtrip.
> 3. Eliminates N+1 query loops in application API endpoints.

---

### Exercise 3: Array Pointer Modification (`+=` and `-=`)

**Scenario:**
Add a new team member `user:carol` to `project:p1`'s team members array, and subsequently remove `user:alice`.

**Requirements:**
1. Append `user:carol` using `SET team_members += user:carol`.
2. Remove `user:alice` using `SET team_members -= user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:carol SET name = "Carol";
> 
> -- Append new member pointer to array
> UPDATE project:p1 SET team_members += user:carol;
> 
> -- Remove member pointer from array
> UPDATE project:p1 SET team_members -= user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `+=` appends record link pointers to array fields atomically.
> 2. `-=` removes specific record link pointers from array fields cleanly.
> 3. Mutates arrays in-place without full document replacements.

---





## 6. Related Terms

- [Record Link (Concept)](record_link_concept.md) — Base record link architecture.
- [`record` (Record Link Type)](../level_02/record_link_type.md) — Record link data type.
- [`FETCH` Clause](../level_03/select_fetch.md) — Eager link resolution.

---

## 7. Key Takeaways

- Arrays of record links (`array<record<table>>`) represent 1-to-many relationships inline.
- Eliminates relational junction tables and document duplication.
- Dot-notation (`items.name`) traverses all array pointers automatically.
- Use `FETCH` to resolve array record links into full documents in a single query.
- Use graph edges (`RELATE`) instead of arrays for high-cardinality relationships.
