# `SELECT`

> **Level 3 — CRUD Operations in SurrealQL**
> The fundamental SurrealQL statement used to read and retrieve records from tables, matching SQL syntax while supporting dot-notation nested paths and record-specific targeting.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category


**SurrealQL Command (query selection statement)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Tabular Selection with Field Alias Expressions

**Scenario:**
An employee directory API selects employee names, calculates annual salaries from monthly pay, and aliases the calculated field as `annual_salary`.

**Requirements:**
1. Create employee `employee:e1` with `name = "Alice"` and `monthly_pay = 5000dec`.
2. Select `name` and `monthly_pay * 12dec AS annual_salary`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE employee:e1 SET name = "Alice", monthly_pay = 5000dec;
> 
> -- Tabular query with field aliasing and arithmetic calculation
> SELECT name, monthly_pay * 12dec AS annual_salary FROM employee:e1;
> ```
>
> #### Technical Explanation
>
> 1. `SELECT field1, field2 FROM <table>` projects targeted fields from record collections.
> 2. `AS alias_name` renames projected fields or calculated expressions in the output JSON.
> 3. Evaluates arithmetic calculations on the database server during query execution.
> 
---

### Exercise 2: Selecting Nested Object Properties

**Scenario:**
A profile service selects a user's display name and nested notification preference `settings.email_notifications`.

**Requirements:**
1. Create profile `profile:p1` with nested `settings = { theme: "dark", email_notifications: true }`.
2. Write a `SELECT` query projecting `name` and `settings.email_notifications`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE profile:p1 SET 
>     name = "Bob",
>     settings = { theme: "dark", email_notifications: true };
> 
> -- Project nested object field directly
> SELECT name, settings.email_notifications FROM profile:p1;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`settings.email_notifications`) extracts nested object properties directly in projection lists.
> 2. Avoids fetching unneeded sibling properties (`settings.theme`), saving payload bandwidth.
> 3. Blends SQL column selection with NoSQL document traversal.
> 
---

### Exercise 3: Selecting All Fields with Wildcard (`*`)

**Scenario:**
Retrieve complete record documents from table `product` for debugging purposes using the wildcard `*` projection operator.

**Requirements:**
1. Write a `SELECT * FROM product;` query.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET name = "Widget", price = 10.00dec;
> 
> -- Wildcard full-record selection
> SELECT * FROM product;
> ```
>
> #### Technical Explanation
>
> 1. `SELECT *` projects all field properties for every matching record in the target table.
> 2. Returns an array of full JSON record objects.
> 3. Equivalent to standard SQL `SELECT *` and MongoDB `db.collection.find({})`.
> 
---



## 6. Related Terms

- [`SELECT VALUE` (Single Field Extraction)](select_value.md) — Flattening query returns.
- [`SELECT` with Record Link Fetching (`FETCH`)](select_fetch.md) — Resolving record links.
- [`GROUP BY` / `GROUP ALL`](group_by.md) — Related concept: `GROUP BY` / `GROUP ALL`.
- [`ORDER BY` / `LIMIT` / `START`](order_limit_start.md) — Related concept: `ORDER BY` / `LIMIT` / `START`.
- [`WHERE` Clause](where.md) — Related concept: `WHERE` Clause.
- [Destructuring & Object Notation in SELECT](../level_06/destructuring_select.md) — Related concept: Destructuring & Object Notation in SELECT.
- [`ONLY` Keyword](../level_06/only_keyword.md) — Related concept: `ONLY` Keyword.
- [`SPLIT` Clause](../level_06/split_clause.md) — Related concept: `SPLIT` Clause.
- [Subqueries](../level_06/subqueries.md) — Related concept: Subqueries.

---

## 7. Key Takeaways
- The `SELECT` statement reads and projects records in SurrealQL.
- Follows standard SQL layout, making it readable and familiar.
- Supports dot-notation paths to extract deeply nested object properties natively.
- Use `AS` to rename/alias returned fields in the final JSON array output.
- Can run arithmetic operations and functions inside the projection list.
- Target tables (`FROM user`), single IDs (`FROM user:john`), or lists (`FROM [a, b]`).
- Querying `FROM user:john` directly is faster than using `WHERE id = user:john`.
