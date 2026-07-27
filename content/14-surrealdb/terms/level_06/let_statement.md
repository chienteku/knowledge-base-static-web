# `LET` Statement

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL statement used to declare and assign values or query results to scoped parameter variables (`$variable`), enabling procedural multi-step scripts within a database session.

---

## 1. Prerequisites
- [Parameters (`$param`)](parameters.md) — Variable syntax context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the session layer. Keeps defined parameter keys in memory for the duration of the query block or connection connection).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Multi-step LET Scripting

**Problem:** Write a SurrealQL script using `LET` statements to:
1. Define a variable `$discount_rate` set to `0.15dec`.
2. Define a variable `$target_product` set to `product:keyboard`.
3. Update `$target_product`, setting its `sale_price` to `price - (price * $discount_rate)`.

**Expected output:**
```sql
LET $discount_rate = 0.15dec;
LET $target_product = product:keyboard;

UPDATE $target_product SET sale_price = price - (price * $discount_rate);
```

> [!check]- Answer
> - Prefix variable names with `$`.
> - Target `$target_product` directly as the target of the `UPDATE` statement.

---



### Exercise 2: Binding Subquery Output to Variable

**Problem:** Bind count of active users to `$active_count` using `LET` and subquery.

**Expected output:**
```text
LET $active_count = (SELECT VALUE count() FROM user WHERE active = true GROUP ALL)[0];
```

> [!check]- Answer
> ```surrealql
> LET $active_count = (SELECT VALUE count() FROM user WHERE active = true GROUP ALL)[0];
> ```
>
> **Explanation:** `LET $var = (subquery)` binds subquery results to reusable parameter variables.

### Exercise 3: Using Variables in Graph Edge Creation

**Problem:** Set `$u = user:alice`, `$p = post:10`, and execute `RELATE $u->wrote->$p`.

**Expected output:**
```text
LET $u = user:alice; LET $p = post:10; RELATE $u->wrote->$p;
```

> [!check]- Answer
> ```surrealql
> LET $u = user:alice;
> LET $p = post:10;
> RELATE $u->wrote->$p;
> ```
>
> **Explanation:** Parameters `$u` and `$p` parameterize record targets in graph queries.

## 7. Related Terms
- [Parameters (`$param`)](parameters.md) — Parameter variable rules.
- [Subqueries](subqueries.md) — Evaluated subquery inputs.

---

## 8. Key Takeaways
- `LET` declares and assigns values to scoped parameter variables (`$var`).
- Enables procedural, multi-step scripting within a single SurrealQL execution.
- Variables can store primitives, objects, arrays, or subquery results.
- Index subquery assignments (e.g. `[0]`) when single scalar values are expected.
- Improves query readability and reduces application round-trip overhead.
