# Operators in SurrealQL

> **Level 3 — CRUD Operations in SurrealQL**
> The set of comparison, logical, and collection operators in SurrealQL, extending standard SQL operators with specialized NoSQL and graph selectors like fuzzy match (`~`) and list membership (`CONTAINS` / `INSIDE`).

---

## 1. Prerequisites

- [`WHERE` Clause](where.md) — The conditional context.

---

## 2. Term Category


**SurrealQL Command (comparison, logical, and containment operators)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard SQL (PostgreSQL), checking string matches and array membership requires verbose and varying operators:
-   Case-insensitive matching requires `ILIKE` or `LOWER()`.
-   Array checks require custom qualifiers like `ANY` or `ALL` (e.g. `'value' = ANY(array_column)`).

In MongoDB, these checks are represented by key-value JSON operators like `$in`, `$all`, and `$regex`.

We designed the **SurrealQL Operators** to provide a clean, highly expressive syntax. 

By introducing readable keywords (like `CONTAINS`, `INSIDE`, and the fuzzy matching operator `~`), SurrealQL allows you to write complex array validations and case-insensitive text searches directly in standard query lines, keeping filtering logic concise.

---

### (2) The Operator Categories

#### 1. Comparison Operators
-   **`=` (Equal) / `!=` (Not Equal):** Exact equality comparison (case-sensitive for strings).
-   **`~` (Fuzzy Match):** Case-insensitive string matching (e.g. `"John" ~ "john"` evaluates to `true`).
-   **`!~` (Fuzzy Not Match):** Case-insensitive inequality check.
-   **`<` / `>` / `<=` / `>=`:** Standard numeric comparisons.

#### 2. Collection & Array Operators
-   **`CONTAINS` (or `∋`):** Checks if a container holds a value: `tags CONTAINS "rust"`.
-   **`INSIDE` (or `∈` / `IN`):** Checks if a value is inside a container: `"rust" INSIDE tags`.
-   **`CONTAINSAND`:** Checks if an array contains **all** elements in a list.
-   **`CONTAINSONLY`:** Checks if an array contains **only** elements in a list (excluding others).
-   **`CONTAINSMANY`:** Checks if an array contains **any** elements in a list.

---

### (3) Reality Metaphor (Calipers vs. Gauges)
Imagine sorting packages on an assembly line:
-   **Exact Equality (`=`):** A **Digital Caliper**. 
    -   It measures the width of a box. 
    -   If the box is exactly `100.0` millimeters wide, it matches. 
    -   If it is `100.1`, it is rejected.
-   **Fuzzy Matching (`~`):** A **Visual Check**. 
    -   *"Are both of these packages labeled 'urgent'?"* 
    -   Yes, even if one is written in lowercase `"urgent"` and the other is uppercase `"URGENT"`.
-   **CONTAINS:** A **Fishing Net**. 
    -   You drag a net (the array field) through the water. 
    -   If a red fish is caught inside the net, the check evaluates to true.

---

### (4) Code Examples

#### Applying Collection Operators in SurrealQL
Let's filter products and users:

```sql
-- 1. Exact string comparison (Returns nothing due to casing!)
SELECT * FROM user WHERE username = "tobie"; // assuming database stores "Tobie"

-- 2. Fuzzy/Case-insensitive comparison (Succeeds!)
SELECT * FROM user WHERE username ~ "tobie";

-- 3. Array membership search
SELECT * FROM post WHERE tags CONTAINS "database";

-- 4. Value list membership (checking if value is in a list)
SELECT * FROM user WHERE country INSIDE ["US", "CA", "MX"];

-- 5. Strict Array overlap check (All tags must be present!)
SELECT * FROM post WHERE tags CONTAINSAND ["rust", "tech"];
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'CONTAINS' to search for substrings in case-insensitive text, instead of the fuzzy matcher '~' or regex expressions

**The mistake:** Running the query `SELECT * FROM user WHERE email CONTAINS "Gmail.com";` to search for Gmail users.

**Why it's wrong:** While `CONTAINS` can check strings, it is case-sensitive. 

If the user's email is saved as `"user@gmail.com"` (lowercase), checking for `"Gmail.com"` (uppercase) using `CONTAINS` will fail.

**Fix: Use the fuzzy matching operator `~` for case-insensitive substring lookups:**

```sql
-- BAD (Case-sensitive check, misses lowercase)
SELECT * FROM user WHERE email CONTAINS "Gmail.com";

-- GOOD (Case-insensitive check)
SELECT * FROM user WHERE email ~ "gmail.com";
```

---



### Mistake 2: Using JavaScript Strict Equality `===` in Place of SurrealQL `=`

**The mistake:** Writing `WHERE age === 30` in SurrealQL queries.

**Why it's wrong:** SurrealQL uses single `=` for equality matching. `===` is invalid SurrealQL syntax.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE age === 30; // ❌ Parse error!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE age = 30; // Correct single = equality operator
```

### Mistake 3: Confusing Array Contains Operator `CONTAINS` with Substring Match `~`

**The mistake:** Writing `WHERE tags CONTAINS 'rust'` when `tags` is a plain string field.

**Why it's wrong:** `CONTAINS` (or `?:=`) checks if an array or set contains an element. For fuzzy string regex/substring matching, use `~` or `CONTAINSNOT`.

*Incorrect:*
```surrealql
-- When title is a plain string:
SELECT * FROM article WHERE title CONTAINS "rust"; // ❌ Expects array collection!
```

*Fix:*
```surrealql
SELECT * FROM article WHERE title ~ "rust"; // Fuzzy string/regex match operator
```

## 5. Practice Exercises

### Exercise 1: String Regex & Fuzzy Matching Operators

**Scenario:**
A search query filters user accounts where `email` matches a domain pattern (`@example.com`) using string operators.

**Requirements:**
1. Create users `user:u1` (`email = "alice@example.com"`) and `user:u2` (`email = "bob@other.com"`).
2. Query users where `email` matches regex `@example\.com$` using the `=~` (regex match) operator.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET email = "alice@example.com";
> CREATE user:u2 SET email = "bob@other.com";
> 
> -- Regex match query
> SELECT * FROM user WHERE email =~ "@example\.com$";
> ```
>
> #### Technical Explanation
>
> 1. `=~` performs case-insensitive regex pattern matching on string fields (`!~` performs negated regex match).
> 2. `CONTAINS` checks substring or array element containment.
> 3. Enables advanced text filtering without full-text search index overhead.

---

### Exercise 2: Array Containment Operators (`INSIDE` vs `CONTAINS`)

**Scenario:**
A permission system checks whether user role `"admin"` is contained `INSIDE` an allowed roles array `["admin", "manager"]`.

**Requirements:**
1. Demonstrate `INSIDE` operator checking if `"admin" INSIDE ["admin", "manager"]`.
2. Demonstrate `CONTAINS` operator checking if `["admin", "manager"] CONTAINS "admin"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- 1. Value INSIDE Array
> SELECT "admin" INSIDE ["admin", "manager"] AS is_allowed;
> 
> -- 2. Array CONTAINS Value
> SELECT ["admin", "manager"] CONTAINS "admin" AS is_allowed;
> ```
>
> #### Technical Explanation
>
> 1. `val INSIDE array` evaluates whether a single scalar value exists within a target collection.
> 2. `array CONTAINS val` evaluates whether an array collection contains a target scalar value.
> 3. Both expressions evaluate to boolean `true` or `false`.

---

### Exercise 3: Record Link Equality Operators

**Scenario:**
Filter blog posts where the `author` record link pointer equals `user:alice`.

**Requirements:**
1. Create post `post:p1` with `author = user:alice`.
2. Query posts using record ID equality `WHERE author = user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE post:p1 SET title = "SurrealQL Operators", author = user:alice;
> 
> -- Query posts by typed record link equality
> SELECT * FROM post WHERE author = user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `=` performs typed equality comparison between record link pointers.
> 2. `user:alice` represents a typed record ID pointer, not a raw string literal `"user:alice"`.
> 3. Executes direct $O(1)$ pointer comparison in SurrealDB's query engine.

---



## 6. Related Terms

- [`WHERE` Clause](where.md) — The conditional context.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Manipulating lists.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](update_strategies.md) — Related concept: `UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`).
- [`search::*` Functions & `@@` Operator](../level_07/search_functions.md) — Related concept: `search::*` Functions & `@@` Operator.

---

## 7. Key Takeaways
- SurrealQL expands standard SQL comparison operators with collection syntax.
- `=` is exact case-sensitive; `~` is fuzzy case-insensitive.
- `CONTAINS` checks if a container field holds a target item.
- `INSIDE` checks if a value is present in a target array list or string.
- `CONTAINSAND` checks if a list holds all elements in a target set.
- `CONTAINSONLY` checks if a list contains only target elements.
- Always use the fuzzy matcher `~` for text queries to prevent case matching bugs.
