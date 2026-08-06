# `WHERE` Clause

> **Level 3 — CRUD Operations in SurrealQL**
> The conditional filtering clause in SurrealQL used to restrict query actions (such as `SELECT`, `UPDATE`, and `DELETE`) to only records that evaluate a specified logical expression to `true`.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The query context.

---

## 2. Term Category


**Query Feature (record filtering condition clause)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Without a filter clause, queries would always affect or return the entire table contents:
-   `SELECT * FROM user;` returns millions of users.
-   `DELETE FROM user;` deletes the whole database.

In relational SQL (PostgreSQL) and NoSQL, we need a way to filter operations.

We designed the **`WHERE`** clause in SurrealQL to provide a clean, SQL-standard filtering language. 

It evaluates a logical condition (boolean expression) for each record. 

If the condition evaluates to `true`, the record is included in the output or modification. 

If it evaluates to `false` or `NONE`, it is skipped. 

The syntax supports nested property paths, array operations, and logical operators, providing a highly flexible filter interface.

---

### (2) Key Capabilities
The `WHERE` clause in SurrealQL goes beyond standard SQL:
-   **Nested Path Filtering:** Filter based on properties inside objects: `WHERE address.city = "London"`.
-   **Array Value Searches:** Filter based on array contents: `WHERE tags CONTAINS "rust"`.
-   **Link Traversal Checks:** Filter using fields inside linked records: `WHERE author.active = true`.

---

### (3) Reality Metaphor (The Security Gate)
Imagine a crowd trying to enter a venue:
-   **`WHERE` Clause:** A **Security Guard at a VIP gate**. 
    -   The guard holds a rule sheet (the filter criteria): *"The guest must have a VIP ticket (AND) be over 21 (AND) not be wearing sneakers."*
    -   As each guest steps forward, the guard runs the checks. 
    -   If the guest satisfies all criteria (evaluates to true), they enter the club. 
    -   Otherwise, they are turned away.

---

### (4) Code Examples

#### Filtering Queries in SurrealQL
Let's query a user log:

```sql
-- 1. Simple numeric filter
SELECT * FROM user WHERE age >= 18;

-- 2. Combining filters with logical operators
SELECT * FROM user WHERE active = true AND country = "US";

-- 3. Filtering using nested object paths
SELECT * FROM user WHERE settings.notifications.email = true;

-- 4. Filtering using array operators
SELECT * FROM user WHERE permissions CONTAINS "admin";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to join multiple query conditions using commas ',' instead of logical operators like 'AND' or 'OR'

**The mistake:** Writing a SurrealQL query like `SELECT * FROM user WHERE age > 18, active = true;` to filter users.

**Why it's wrong:** The comma operator is not a valid logical separator inside the `WHERE` clause. 

Executing this query will result in a compiler syntax error.

**Fix: Always use explicit logical keywords (`AND`, `OR`) to join conditional expressions:**

```sql
-- BAD
SELECT * FROM user WHERE age > 18, active = true;

-- GOOD
SELECT * FROM user WHERE age > 18 AND active = true;
```

---



### Mistake 2: Confusing SQL `LIKE` Fuzzy Matcher with SurrealQL `~` Operator

**The mistake:** Writing `WHERE email LIKE '%@gmail.com'` in SurrealQL.

**Why it's wrong:** SurrealQL uses `~` for regex/fuzzy string matching and `CONTAINS` for collection containment. `LIKE` is unsupported or non-standard in SurrealQL.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE email LIKE "%@gmail.com"; // ❌ Non-standard syntax!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE email ~ "@gmail.com"; // Fuzzy string regex match operator
```

### Mistake 3: Forgetting Parentheses in Complex `AND` / `OR` Predicates

**The mistake:** Writing `WHERE role = 'admin' OR role = 'mod' AND active = true` without parentheses.

**Why it's wrong:** `AND` takes precedence over `OR`, altering intended boolean evaluation order. Use grouping parentheses `(role = 'admin' OR role = 'mod') AND active = true`.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE role = "admin" OR role = "mod" AND active = true; // ❌ Wrong evaluation order!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE (role = "admin" OR role = "mod") AND active = true;
```

## 5. Practice Exercises

### Exercise 1: Multi-Condition Logical Filtering

**Scenario:**
An admin query selects active premium customers who registered within the last 30 days.

**Requirements:**
1. Create user records with `tier`, `active`, and `registered_at` fields.
2. Write a `SELECT` query filtering `tier = "premium" AND active = true AND registered_at > time::now() - 30d`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET tier = "premium", active = true, registered_at = time::now() - 10d;
> CREATE user:u2 SET tier = "free", active = true, registered_at = time::now() - 5d;
> 
> -- Multi-condition WHERE clause
> SELECT * FROM user 
> WHERE tier = "premium" 
>   AND active = true 
>   AND registered_at > time::now() - 30d;
> ```
>
> #### Technical Explanation
>
> 1. `WHERE` filters table records based on boolean logical evaluation (`AND`, `OR`, `NOT`).
> 2. Short-circuit evaluation evaluates criteria in sequence, stopping early on failed `AND` branches.
> 3. Uses B-tree or secondary indexes when available to optimize record selection speed.

---

### Exercise 2: Filtering on Nested Object Properties

**Scenario:**
Filter customer profiles where nested property `address.city` equals `"Austin"`.

**Requirements:**
1. Create profile `profile:p1` with nested `address = { city: "Austin", state: "TX" }`.
2. Write a `SELECT` query filtering `WHERE address.city = "Austin"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE profile:p1 SET address = { city: "Austin", state: "TX" };
> CREATE profile:p2 SET address = { city: "Dallas", state: "TX" };
> 
> -- Filter on nested object property path
> SELECT * FROM profile WHERE address.city = "Austin";
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`address.city`) accesses nested object properties inside `WHERE` clauses natively.
> 2. Eliminates SQL JSON extraction functions (`json_extract` / `->>`) or MongoDB `$elemMatch` blocks.
> 3. Evaluates nested document properties seamlessly in table scans.

---

### Exercise 3: Containment Filtering with `INSIDE` and `CONTAINS`

**Scenario:**
Select all products whose `category` is `INSIDE` a target list `["electronics", "computers"]`.

**Requirements:**
1. Create products in different categories.
2. Write a `SELECT` query applying `WHERE category INSIDE ["electronics", "computers"]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET category = "electronics";
> CREATE product:p2 SET category = "apparel";
> 
> -- Filter by set containment
> SELECT * FROM product WHERE category INSIDE ["electronics", "computers"];
> ```
>
> #### Technical Explanation
>
> 1. `INSIDE` checks if a record field value belongs to a target array or set collection.
> 2. Equivalent to SQL `IN (...)` and MongoDB `$in [...]`.
> 3. Provides clean set-based filtering syntax.

---



## 6. Related Terms

- [`SELECT`](select.md) — The parent query statement.
- [Operators in SurrealQL](operators.md) — The logical check symbols.
- [Graph Traversal Filtering (`WHERE` on edges)](../level_05/graph_filtering.md) — Related concept: Graph Traversal Filtering (`WHERE` on edges).

---

## 7. Key Takeaways
- The `WHERE` clause filters rows returned or modified by query statements.
- Directly equivalent to PostgreSQL's `WHERE` and MongoDB's query filter syntax.
- Evaluates logical expressions, matching records that return `true`.
- Supports nested dot-notation paths (e.g. `WHERE settings.theme = "dark"`).
- Connect multiple filters using standard logical keywords (`AND`, `OR`).
- Can search arrays using special operators (e.g. `CONTAINS`).
- Binds to update and delete statements to lock down write operations.
