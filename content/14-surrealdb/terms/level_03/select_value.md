# `SELECT VALUE` (Single Field Extraction)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL query modifier used to extract the value of a single field and return it as a flat array of raw values (e.g., `["alice", "bob"]`), discarding the outer JSON object wrappers (`[{name: "alice"}]`).

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the projection resolver layer. Bypasses JSON object serialization, returning raw primitive lists directly over network WebSockets).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard databases, executing a projection query always returns an array of structured documents:
-   Query: `SELECT email FROM user;`
-   Response: `[ { email: "user1@mail.com" }, { email: "user2@mail.com" } ]`

If you are writing backend code (like Node.js) and simply want a list of email strings to feed into a mailer library:
-   You must map the array in JavaScript: `const list = records.map(row => row.email);`.
-   This wastes CPU cycles on the application server and increases network transfer payload sizes by including JSON key strings on every row.

We designed **`SELECT VALUE`** to eliminate this mapping boilerplate. 

By inserting the `VALUE` keyword, you instruct SurrealDB to discard the JSON object brackets and keys, returning the raw target values directly as a flat array.

---

### (2) Output Comparison
Observe how the output formatting shifts between the two selection modes:

#### 1. Standard SELECT (Returns Array of Objects)
`SELECT email FROM user;`
```json
[
  { "email": "alice@example.com" },
  { "email": "bob@example.com" }
]
```

#### 2. SELECT VALUE (Returns Flat Array of Primitives)
`SELECT VALUE email FROM user;`
```json
[
  "alice@example.com",
  "bob@example.com"
]
```

---

### (3) Reality Metaphor (Juice Extractors)
Imagine ordering fruit at a market:
-   **Standard `SELECT`:** A clerk hands you **Wrapped Bags containing Oranges**. 
    -   To consume them, you must unwrap each bag, peel the orange, and throw away the skin. (Mapping JSON key wrappers in code).
-   **`SELECT VALUE`:** The clerk runs the oranges through a **Juice Press** before handing them to you. 
    -   You receive a single glass containing only the pure juice. 
    -   The bags and skins are discarded at the counter.

---

### (4) Code Examples

#### Extracting Flat Lists in SurrealQL
Let's query a user list:

```sql
-- 1. Extract a flat list of tags across all post records
SELECT VALUE tags FROM post;
-- Returns: [ ["tech", "rust"], ["database"] ]

-- 2. Extract a flat list of nested properties
SELECT VALUE name.first FROM user;
-- Returns: [ "Tobie", "Alice", "Bob" ]

-- 3. Extract calculated values directly
SELECT VALUE age * 2 FROM user;
-- Returns: [ 60, 50, 40 ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to select multiple comma-separated fields using the 'SELECT VALUE' syntax, expecting multiple arrays

**The mistake:** Running the query `SELECT VALUE name, email FROM user;` to get user details.

**Why it's wrong:** `SELECT VALUE` is designed to extract a **single** value channel per record. 

If you pass multiple fields separated by commas, SurrealDB will only return the value of the last field, or throw a syntax parsing error depending on the engine version.

**Fix: Only specify a single field (or a single object constructor, like `SELECT VALUE { name: name, email: email }`) when using `SELECT VALUE`:**

```sql
-- CORRECT (Extracts single field)
SELECT VALUE email FROM user;

-- CORRECT (Extracts a flat list of custom constructed objects)
SELECT VALUE { username: name, contact: email } FROM user;
```

---



### Mistake 2: Expecting `SELECT VALUE` to Return Array of Result Objects

**The mistake:** Writing `SELECT VALUE email FROM user;` expecting `[{ email: "a@b.com" }]`.

**Why it's wrong:** `SELECT VALUE` unwraps object wrappers, returning a flat array of raw field values `["a@b.com", "c@d.com"]`.

*Incorrect:*
```surrealql
-- Expecting [{ email: 'a@b.com' }]
SELECT VALUE email FROM user; // Returns ['a@b.com'] raw values!
```

*Fix:*
```surrealql
SELECT email FROM user; // Returns [{ email: 'a@b.com' }] objects
```

### Mistake 3: Using `SELECT VALUE` on Multiple Un-Aliased Expression Columns

**The mistake:** Writing `SELECT VALUE id, name FROM user;`.

**Why it's wrong:** `SELECT VALUE` unwraps a single target value expression into a flat array. Specifying multiple un-grouped fields causes syntax errors.

*Incorrect:*
```surrealql
SELECT VALUE id, name FROM user; // ❌ Select value expects a single expression!
```

*Fix:*
```surrealql
SELECT VALUE { id: id, name: name } FROM user; // Wrap in single object expression
```

## 6. Practice Exercises

### Exercise 1: Output Formatting Diagnostics

**Problem:** You have a `members` table containing:
`{ id: member:01, tags: ["active", "vip"] }`
`{ id: member:02, tags: ["new"] }`
Predict the exact JSON output returned by this query:
`SELECT VALUE tags FROM members;`

**Expected output:**
> [!check]- Answer
> ```json
> [
>   ["active", "vip"],
>   ["new"]
> ]
> ```
> - Check if `SELECT VALUE` flattens inner array elements, or only removes the outer JSON keys.
> - The return shape will be an array containing the direct values of the `tags` field.

---



### Exercise 2: Flat Array Extraction with `SELECT VALUE`

**Problem:** Extract flat array of all user email strings from `user` table using `SELECT VALUE`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT VALUE email FROM user;
> ```
> ```surrealql
> SELECT VALUE email FROM user;
> ```
>
> **Explanation:** `SELECT VALUE field` unwraps field values into a flat primitive array.

---

### Exercise 3: Combining `ONLY` and `VALUE` for Single Scalar Returns

**Problem:** Extract a single scalar email string from `user:alice` using `SELECT ONLY VALUE email FROM user:alice`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT ONLY VALUE email FROM user:alice;
> ```
> ```surrealql
> SELECT ONLY VALUE email FROM user:alice;
> ```
>
> **Explanation:** `ONLY VALUE` returns a raw scalar primitive value without array or object wrappers.

## 7. Related Terms

- [`SELECT`](select.md) — The parent query statement.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Manipulating lists.
- [`ONLY` Keyword](../level_06/only_keyword.md) — Related concept: `ONLY` Keyword.
- [Subqueries](../level_06/subqueries.md) — Related concept: Subqueries.

---

## 8. Key Takeaways
- `SELECT VALUE` flattens query responses into a raw array of values.
- Discards outer JSON key-value object wrappers (`{ key: value }`).
- Saves network bandwidth by eliminating key names from the payload.
- Eliminates the need to write `.map()` conversion loops in application code.
- Restricted to projecting a single field target (or a single custom object).
- Supports dot-notation paths to extract nested properties directly.
- Returns arrays of arrays if the target field is itself an array.
