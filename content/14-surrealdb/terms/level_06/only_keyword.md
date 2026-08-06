# `ONLY` Keyword

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL query modifier (`SELECT * FROM ONLY ...`) used to unwraps query results, returning a single record object directly (or `NONE` / error) instead of an array containing one element.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query statement.
- [Record ID (`table:id`)](../level_01/record_id.md) — Direct record lookups.

---

## 2. Term Category


**Query Feature (single-record object unwrapping modifier)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default in SQL and database drivers, a `SELECT` query always returns an **Array of results**:
- Standard Query: `SELECT * FROM user:tobie;`
- Returns: `[ { id: "user:tobie", name: "Tobie" } ]` (An array holding 1 item).

When writing application backend code (Node.js/TypeScript):
- If you know you are fetching a single specific user, receiving an array forces you to append index `[0]` in JavaScript: `const user = results[0];`.
- If the query returns no match (`[]`), `results[0]` becomes `undefined`, requiring extra null-check boilerplate.

We designed the **`ONLY`** keyword in SurrealQL to simplify single-record fetches. By writing `SELECT * FROM ONLY user:tobie` or `SELECT * FROM ONLY user WHERE email = $email`, you instruct SurrealDB to unwrap the result array, returning the single record object directly (or `NONE` if missing).

---

### (2) Output Comparison

#### Standard Query (No ONLY)
`SELECT * FROM user:tobie;`
```json
[
  { "id": "user:tobie", "name": "Tobie" }
]
```

#### Query with ONLY Keyword
`SELECT * FROM ONLY user:tobie;`
```json
{ "id": "user:tobie", "name": "Tobie" }
```

---

### (3) Reality Metaphor (Unwrapping Single Presents)
Imagine receiving a delivery package:
- **Standard Query:** Receiving a **Large Shipping Crate** containing 1 small jewelry box. To wear the ring, you must open the crate, pull out the small box, and open the box.
- **`ONLY` Keyword:** Asking the delivery driver to **Unwrap the Crate at the Door**. They hand you the single jewelry box directly. You skip unpacking the outer crate.

---

### (4) Code Examples

#### Using `ONLY` in SurrealQL

```sql
-- 1. Unwrapping a single Record ID lookup
SELECT * FROM ONLY user:tobie;
-- Returns direct JSON object: { id: user:tobie, name: "Tobie" }

-- 2. Unwrapping a filtered single-record query
SELECT * FROM ONLY user WHERE email = "alice@example.com" LIMIT 1;

-- 3. Using ONLY inside subqueries / LET assignments
LET $current_user = (SELECT * FROM ONLY user:alice);
-- $current_user now holds the object directly, not [{...}]

RETURN $current_user.name;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'ONLY' on queries that return multiple records, causing runtime errors or unexpected truncations

**The mistake:** Running `SELECT * FROM ONLY user;` on a table containing 500 users.

**Why it's wrong:** The `ONLY` keyword asserts that the query targets exactly one record. Applying it to a multi-record result set without `LIMIT 1` causes SurrealDB to throw a result cardinality error or return `NONE`.

**Fix: Only use `ONLY` when querying a specific Record ID or when pairing with `LIMIT 1`:**

```sql
-- BAD
SELECT * FROM ONLY user;

-- GOOD (Specific Record ID)
SELECT * FROM ONLY user:tobie;

-- GOOD (Filtered query locked to 1 result)
SELECT * FROM ONLY user WHERE email = $email LIMIT 1;
```

---



### Mistake 2: Using `ONLY` on Queries Returning Multiple Records

**The mistake:** Executing `SELECT ONLY * FROM user;` when `user` table contains 50 records.

**Why it's wrong:** `ONLY` un-arrays single record results. If the query yields multiple records, `ONLY` throws error `Expected a single record result, but found 50`.

*Incorrect:*
```surrealql
-- When user table contains multiple rows:
SELECT ONLY * FROM user; // ❌ Error: Expected single record result!
```

*Fix:*
```surrealql
-- Target single primary key record:
SELECT ONLY * FROM user:alice;
-- Or limit to 1 row:
SELECT ONLY * FROM user LIMIT 1;
```

### Mistake 3: Expecting `ONLY` to Return Array Wrapper Objects

**The mistake:** Expecting `SELECT ONLY * FROM user:alice;` to return `[{ id: user:alice }]`.

**Why it's wrong:** `ONLY` removes array wrappers, returning the single unwrapped record object `{ id: user:alice }` directly.

*Incorrect:*
```surrealql
// Expecting array response [{ ... }]
SELECT ONLY * FROM user:alice; // Returns unwrapped object { ... }
```

*Fix:*
```surrealql
SELECT * FROM user:alice; // Returns standard array response [{ ... }]
```

## 5. Practice Exercises

### Exercise 1: Single Record Document Unboxing with `ONLY`

**Scenario:**
An API route fetches a single user record `user:alice` and unboxes the document from the outer result array payload using `FROM ONLY`.

**Requirements:**
1. Create `user:alice`.
2. Select `SELECT * FROM ONLY user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice Smith";
> 
> -- Unbox single record result payload
> SELECT * FROM ONLY user:alice;
> -- Output: { id: user:alice, name: "Alice Smith" } (not wrapped in array!)
> ```
>
> #### Technical Explanation
>
> 1. `FROM ONLY` unwraps single-record queries, returning a single JSON object instead of a 1-element array `[{...}]`.
> 2. If the query returns zero or multiple records, `ONLY` throws a runtime error.
> 3. Eliminates client-side array index unboxing (`result[0]`).

---

### Exercise 2: Unboxing Scalar Subquery Values

**Scenario:**
Extract a user's email as a plain unboxed scalar string using `SELECT VALUE email FROM ONLY user:alice`.

**Requirements:**
1. Select `SELECT VALUE email FROM ONLY user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT VALUE email FROM ONLY user:alice;
> -- Output: "alice@example.com"
> ```
>
> #### Technical Explanation
>
> 1. Combining `SELECT VALUE` with `ONLY` unwraps both the property key AND the outer result array.
> 2. Returns a raw unboxed scalar value (`"alice@example.com"`).
> 3. Ideal for binding subquery scalar values to parameters in scripts.

---

### Exercise 3: Enforcing Single-Record Invariants

**Scenario:**
Demonstrate that `FROM ONLY` throws an error when a query returns multiple records.

**Requirements:**
1. Create 2 user records.
2. Attempt `SELECT * FROM ONLY user;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET name = "User 1";
> CREATE user:u2 SET name = "User 2";
> 
> -- Fails with error: "Expected a single record result, but found 2 records"
> SELECT * FROM ONLY user;
> ```
>
> #### Technical Explanation
>
> 1. `FROM ONLY` enforces single-record result invariants at query runtime.
> 2. Guards against unexpected multi-record query returns.
> 3. Ensures strict single-document API responses.

---



## 6. Related Terms

- [`SELECT`](../level_03/select.md) — The query statement.
- [`SELECT VALUE` (Single Field Extraction)](../level_03/select_value.md) — Flat value extraction.

---

## 7. Key Takeaways
- The `ONLY` keyword unwraps query results, returning a single record object.
- Eliminates outer array wrappers (`[...]`) for single-record lookups.
- Removes the need to write `.map()` or `[0]` index access in application SDK code.
- Combine with specific Record IDs (`FROM ONLY user:id`) or `LIMIT 1`.
- Throws an error or returns `NONE` if multiple records are matched.
