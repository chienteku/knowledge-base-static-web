# `ONLY` Keyword

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL query modifier (`SELECT * FROM ONLY ...`) used to unwraps query results, returning a single record object directly (or `NONE` / error) instead of an array containing one element.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query statement.
- [Record ID (`table:id`)](../level_01/record_id.md) — Direct record lookups.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the final query projection layer. Flattens single-element array wrappers into direct JSON object returns).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Single Object Extraction

**Problem:** You are fetching an account record by ID (`account:101`).
Write the SurrealQL query using the `ONLY` keyword to retrieve the `balance` and `status` fields as a direct JSON object (without an outer array wrapper).

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT balance, status FROM ONLY account:101;
> ```
> - Place `ONLY` immediately after `FROM`.
> - Target the Record ID `account:101`.

---



### Exercise 2: Unwrapping Single Record Query Result

**Problem:** Query single record `user:alice` returning raw object without array wrapper using `ONLY`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT ONLY * FROM user:alice;
> ```
> ```surrealql
> SELECT ONLY * FROM user:alice;
> ```
>
> **Explanation:** `SELECT ONLY` unwraps single-item array results into direct object responses.

---

### Exercise 3: Combining `ONLY` and `VALUE`

**Problem:** Extract raw scalar string value of `email` from `user:alice` using `SELECT ONLY VALUE email FROM user:alice`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT ONLY VALUE email FROM user:alice;
> ```
> ```surrealql
> SELECT ONLY VALUE email FROM user:alice;
> ```
>
> **Explanation:** `ONLY VALUE` returns raw primitive values without array or object wrappers.

## 7. Related Terms

- [`SELECT`](../level_03/select.md) — The query statement.
- [`SELECT VALUE` (Single Field Extraction)](../level_03/select_value.md) — Flat value extraction.

---

## 8. Key Takeaways
- The `ONLY` keyword unwraps query results, returning a single record object.
- Eliminates outer array wrappers (`[...]`) for single-record lookups.
- Removes the need to write `.map()` or `[0]` index access in application SDK code.
- Combine with specific Record IDs (`FROM ONLY user:id`) or `LIMIT 1`.
- Throws an error or returns `NONE` if multiple records are matched.
