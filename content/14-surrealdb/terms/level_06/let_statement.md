# `LET` Statement

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL statement used to declare and assign values or query results to scoped parameter variables (`$variable`), enabling procedural multi-step scripts within a database session.

---

## 1. Prerequisites

- [Parameters (`$param`)](parameters.md) — Variable syntax context.

---

## 2. Term Category


**SurrealQL Command (session parameter variable assignment)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Complex database workflows often require multi-step processing:
1. Fetch a configuration record or user profile.
2. Use properties from that record to calculate a value or perform a second query.
3. Update a third table based on the calculation.

In PostgreSQL, doing this inside raw SQL strings requires complex CTEs (`WITH` clauses) or writing PL/pgSQL functions. In MongoDB, it requires multi-stage aggregation pipelines or multiple database round-trips.

We designed the **`LET`** statement in SurrealQL to bring procedural scripting directly into database queries. You can declare variables, assign them literal values, mathematical calculations, or full subquery results, and reuse those variables across subsequent query statements in the same script.

---

### (2) Scope & Lifetime
- **Session Scope:** A variable defined via `LET $var = ...` exists for the duration of the transaction or connection script.
- **Dynamic Expression Assignment:** `LET` can hold primitive types, objects, arrays, or the results of nested `SELECT` statements.

---

### (3) Reality Metaphor (Scratchpad Memory)
Imagine a accountant working on a tax report:
- **No LET (Single Pass):** Trying to do all tax math mentally in one line without writing intermediate totals down.
- **`LET` Statement:** A **Calculator Memory Button (M+) / Scratchpad**.
  - You calculate sub-total A and save it to `$tax_bracket` on your scratchpad.
  - You calculate sub-total B and save it to `$deductions`.
  - On the final line, you combine `$tax_bracket` and `$deductions` to write the final total on the main tax form.

---

### (4) Code Examples

#### Scripting Multi-Step Workflows with LET

```sql
-- 1. Assigning a primitive value
LET $default_status = "active";

-- 2. Assigning the result of a subquery
LET $admin_user = (SELECT VALUE id FROM user WHERE role = 'admin' LIMIT 1)[0];

-- 3. Reusing variables in subsequent queries
CREATE post SET 
  title = "System Announcement",
  author = $admin_user,
  status = $default_status;

-- 4. Assigning complex object structures
LET $metadata = {
  created_by: $auth.id,
  environment: "production"
};

CREATE system_log SET info = $metadata;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that a subquery assigned to a LET variable returns an array unless indexed or wrapped in SELECT VALUE ... LIMIT 1

**The mistake:** Writing `LET $author = (SELECT id FROM user WHERE name = 'Alice');` expecting `$author` to hold a single Record ID `user:alice`.

**Why it's wrong:** Subqueries return an array (e.g. `[{ id: user:alice }]`). When you later try to use `$author` in a field expecting a single record link (`TYPE record<user>`), type validation fails.

**Fix: Index the subquery result `[0]` or use `SELECT VALUE ... LIMIT 1` when assigning single scalar values:**

```sql
-- BAD (assigns an array)
LET $author = (SELECT id FROM user WHERE name = 'Alice');

-- GOOD (assigns single Record ID token)
LET $author = (SELECT VALUE id FROM user WHERE name = 'Alice' LIMIT 1)[0];
```

---



### Mistake 2: Forgetting the `$` Prefix when Declaring Variable Names in `LET` Statements

**The mistake:** Writing `LET user_id = user:alice;` (SyntaxError).

**Why it's wrong:** SurrealQL variables MUST begin with a `$` prefix (e.g. `$user_id`).

*Incorrect:*
```surrealql
LET user_id = user:alice; // ❌ Parse error: missing $ prefix!
```

*Fix:*
```surrealql
LET $user_id = user:alice; // Correct variable declaration
```

### Mistake 3: Referencing Un-Set Variables expecting Default Nullish Values

**The mistake:** Referencing `$missing_var` in queries without executing `LET $missing_var = ...` first.

**Why it's wrong:** Referencing un-initialized variables evaluates to `NONE`, which can cause silent predicate filter mismatches.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE role = $unassigned_var; // Evaluates to NONE!
```

*Fix:*
```surrealql
LET $unassigned_var = "admin";
SELECT * FROM user WHERE role = $unassigned_var;
```

## 5. Practice Exercises

### Exercise 1: Declaring Parameter Variables for Reusable Queries

**Scenario:**
Declare parameter variables `$target_date` and `$min_score` to reuse across multiple analytical queries in a script.

**Requirements:**
1. Declare `LET $target_date = d"2026-08-01T00:00:00Z";`.
2. Declare `LET $min_score = 80;`.
3. Use variables in a `SELECT` query.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $target_date = d"2026-08-01T00:00:00Z";
> LET $min_score = 80;
> 
> SELECT * FROM audit_log 
> WHERE timestamp >= $target_date AND score >= $min_score;
> ```
>
> #### Technical Explanation
>
> 1. `LET $variable = expression;` binds values to parameter variables within the active session context.
> 2. Promotes query reusability and avoids hardcoded literal values.
> 3. Parameter values are scoped to the current script or transaction execution block.

---

### Exercise 2: Binding Subquery Results to Parameter Variables

**Scenario:**
Fetch a user's record link ID into `$user_id` using a `LET` subquery, then insert a post linked to `$user_id`.

**Requirements:**
1. Bind `LET $user_id = (SELECT VALUE id FROM ONLY user WHERE email = "alice@example.com");`.
2. Create post linked to `$user_id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET email = "alice@example.com";
> 
> -- Bind subquery result to parameter
> LET $user_id = (SELECT VALUE id FROM ONLY user WHERE email = "alice@example.com");
> 
> CREATE post:p1 SET title = "Bound Subquery Post", author = $user_id;
> ```
>
> #### Technical Explanation
>
> 1. `LET $var = (SELECT ...)` stores subquery execution results in parameter variables.
> 2. `FROM ONLY` unwraps single-record subqueries into scalar values.
> 3. Simplifies multi-step relational data insertion scripts.

---

### Exercise 3: Scoped Variable Re-assignment

**Scenario:**
Demonstrate re-assigning a parameter variable `$count` inside a script block.

**Requirements:**
1. Initialize `LET $count = 1;`.
2. Re-assign `LET $count = $count + 1;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $count = 1;
> LET $count = $count + 1;
> 
> RETURN $count;
> ```
>
> #### Technical Explanation
>
> 1. Parameter variables can be re-assigned within the active script block.
> 2. Evaluates the right-hand expression before updating variable state.
> 3. Supports accumulator logic in procedural scripts.

---



## 6. Related Terms

- [Parameters (`$param`)](parameters.md) — Parameter variable rules.
- [Subqueries](subqueries.md) — Evaluated subquery inputs.
- [`FOR` Expression](for_expression.md) — Related concept: `FOR` Expression.
- [`RETURN` Statement (in Functions / Blocks)](return_statement.md) — Related concept: `RETURN` Statement (in Functions / Blocks).
- [`DEFINE PARAM`](../level_09/define_param.md) — Related concept: `DEFINE PARAM`.

---

## 7. Key Takeaways
- `LET` declares and assigns values to scoped parameter variables (`$var`).
- Enables procedural, multi-step scripting within a single SurrealQL execution.
- Variables can store primitives, objects, arrays, or subquery results.
- Index subquery assignments (e.g. `[0]`) when single scalar values are expected.
- Improves query readability and reduces application round-trip overhead.
