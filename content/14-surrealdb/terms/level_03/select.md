# `SELECT`

> **Level 3 — CRUD Operations in SurrealQL**
> The fundamental SurrealQL statement used to read and retrieve records from tables, matching SQL syntax while supporting dot-notation nested paths and record-specific targeting.

---

## 1. Prerequisites
- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the server query execution planner. Maps index trees to compile projection blocks in memory before returning JSON responses to clients).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data retrieval is the most frequent action in databases.
-   **PostgreSQL:** Uses `SELECT columns FROM table`. 
    -   While readable, it cannot natively traverse nested document paths without complex JSON extraction operators (`->>`).
-   **MongoDB:** Uses `db.collection.find({ filter }, { projection })`. 
    -   While flexible, the query object notation is verbose and harder to read for complex reporting compared to SQL text.

We designed the **`SELECT`** statement in SurrealQL to provide the best of both worlds. 

It keeps the readable SQL syntax (`SELECT ... FROM ... WHERE ...`), making it immediately clear to developers. 

At the same time, it extends SQL to support dot-notation path traversals (like `SELECT name.first`), aliasing (`AS`), mathematical calculations inside projection selectors, and querying specific Record IDs directly without filters.

---

### (2) Targeting Options
In SurrealQL, the `FROM` clause is highly flexible. You can query:
-   **A Whole Table:** `FROM user` (returns all records in the table).
-   **A Specific Record ID:** `FROM user:john` (targets exactly one record; extremely fast because it bypasses table scans).
-   **A List of Record IDs:** `FROM [user:john, user:alice]` (fetches a specific array subset).

---

### (3) Reality Metaphor (The Menu Board)
Imagine ordering items at a restaurant counter:
-   **`SELECT` Query:** Pointing at the **Menu Board** and placing a custom order.
    -   **`SELECT` (The Items):** *"Give me the Pizza, but only show the Price and Calories."*
    -   **`FROM` (The Section):** *"Get it from the Dinner Menu section (or from Table #5)."*
    -   **`WHERE` (The Filter):** *"But only if it is Vegetarian."*

---

### (4) Code Examples

#### Projecting and Targeting in SurrealQL
Observe how data is extracted using `SELECT`:

```sql
-- 1. Select all fields from a whole table
SELECT * FROM product;

-- 2. Select specific, nested fields and alias them (using dot notation and 'AS')
SELECT
  name.first AS firstname,
  address.city AS city,
  age + 5 AS age_in_five_years // Run math inside projection!
FROM user;

-- 3. Query a specific record ID directly (bypasses search indexes, very fast!)
SELECT name, email FROM user:tobie;

-- 4. Query a specific array list of Record IDs
SELECT * FROM [user:tobie, user:alice];
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing slow 'WHERE id = user:john' filters to fetch a single record, instead of targeting the Record ID directly in the 'FROM' clause

**The mistake:** Running the query `SELECT * FROM user WHERE id = user:john;` to fetch a user.

**Why it's wrong:** Under the hood, filtering by `WHERE id = ...` forces SurrealDB's index planner to scan the table's index entries. 

If you target the Record ID directly in the `FROM` clause (`FROM user:john`), SurrealDB skips index lookups entirely and reads the record directly from storage in $O(1)$ constant time, which is much faster.

**Fix: Target single record lookups directly in the `FROM` statement:**

```sql
-- BAD (Slower index scan)
SELECT * FROM user WHERE id = user:john;

-- GOOD (Fast constant-time lookup)
SELECT * FROM user:john;
```

---



### Mistake 2: Attempting SQL `JOIN` Table Queries in Place of Pointer Traversal in `SELECT`

**The mistake:** Writing `SELECT * FROM user JOIN post ON user.id = post.author;`.

**Why it's wrong:** SurrealQL does not support relational `JOIN` syntax. Use Record Links (`author.name`), Graph arrows (`->wrote->post`), or `FETCH author`.

*Incorrect:*
```surrealql
SELECT * FROM user JOIN post ON user.id = post.author; // ❌ Parse error!
```

*Fix:*
```surrealql
SELECT name, ->wrote->post.title AS articles FROM user;
```

### Mistake 3: Selecting All Columns `*` in Production Web Clients Exposing Sensitive Fields

**The mistake:** Executing `SELECT * FROM user;` in web client SDK connections.

**Why it's wrong:** `SELECT *` retrieves all record fields including sensitive hashes or internal tokens unless restricted by `PERMISSIONS` clauses or explicit column selection `SELECT id, name FROM user;`.

*Incorrect:*
```surrealql
SELECT * FROM user; // ❌ Exposes all fields unless permissions filter
```

*Fix:*
```surrealql
SELECT id, name, email FROM user; // Explicit column projection
```

## 6. Practice Exercises

### Exercise 1: Projective Query Translation

**Problem:** You have a `companies` table. Write the SurrealQL query to:
1.  Retrieve the `name` field, aliasing it as `company_name`.
2.  Retrieve the nested `city` field from the `address` object (`address: { city: "Paris" }`).
3.  Target only the company record with ID `company:acme`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT name AS company_name, address.city FROM company:acme;
> ```
> - The target source is a specific Record ID, not the whole table name.
> - Chain sub-properties using dot notation: `address.city`.

---



### Exercise 2: Aliasing Projected Expressions

**Problem:** Select `first_name` and `last_name` aliased as `full_name` using `string::concat()`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT string::concat(first_name, " ", last_name) AS full_name FROM user;
> ```
> ```surrealql
> SELECT string::concat(first_name, " ", last_name) AS full_name FROM user;
> ```
>
> **Explanation:** `AS alias` renames projected expression columns in query outputs.

---

### Exercise 3: Selecting Omitted Fields with `OMIT`

**Problem:** Select all fields from `user` table except `password_hash` using `OMIT`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * OMIT password_hash FROM user;
> ```
> ```surrealql
> SELECT * OMIT password_hash FROM user;
> ```
>
> **Explanation:** `SELECT * OMIT field` projects all fields except specified sensitive keys.

## 7. Related Terms
- [`SELECT VALUE` (Single Field Extraction)](select_value.md) — Flattening query returns.
- [`SELECT` with Record Link Fetching (`FETCH`)](select_fetch.md) — Resolving record links.

---

## 8. Key Takeaways
- The `SELECT` statement reads and projects records in SurrealQL.
- Follows standard SQL layout, making it readable and familiar.
- Supports dot-notation paths to extract deeply nested object properties natively.
- Use `AS` to rename/alias returned fields in the final JSON array output.
- Can run arithmetic operations and functions inside the projection list.
- Target tables (`FROM user`), single IDs (`FROM user:john`), or lists (`FROM [a, b]`).
- Querying `FROM user:john` directly is faster than using `WHERE id = user:john`.
