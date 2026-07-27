# `RETURN` Statement (in Functions / Blocks)

> **Level 6 — Advanced Querying & Functions**
> The procedural control-flow statement in SurrealQL used inside function bodies, transaction blocks, and multi-statement scripts to explicitly terminate execution and yield a specific return value.

---

## 1. Prerequisites
- [RETURN Clause](../level_03/return_clause.md) — The CRUD projection clause (contrast).
- [`LET` Statement](let_statement.md) — Multi-step scripting.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the procedural interpreter. Halts execution of the current code block and pops the return payload to the caller stack).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In multi-statement procedural scripts and custom server-side functions:
- You execute several `LET` assignments, calculate intermediate values, or check conditions.
- At the end of the script (or on an early exit condition), you need a clear way to specify exactly **what value** the entire script should output to the caller.

In PostgreSQL PL/pgSQL, you write `RETURN result;`. In JavaScript, you write `return value;`.

We designed the standalone **`RETURN` Statement** in SurrealQL for procedural flow control. 

> [!IMPORTANT]
> **Distinction from the `RETURN` Clause:**
> - The `RETURN` **Clause** (Level 3, Term #45) is appended to CRUD commands (`CREATE ... RETURN BEFORE / AFTER / NONE / DIFF`) to control row mutation outputs.
> - The `RETURN` **Statement** (Level 6, Term #86) is a standalone control-flow keyword (`RETURN $value;`) used inside procedural blocks, custom functions (`DEFINE FUNCTION`), or transaction scripts to stop execution and output a value.

---

### (2) Behavior in Multi-Statement Scripts
When SurrealDB executes a block of statements (e.g. separated by semicolons):
- If no `RETURN` statement is present, the query output displays the result of the **last executed statement**.
- If a `RETURN $result;` statement is encountered, execution stops immediately, and `$result` is returned to the client.

---

### (3) Reality Metaphor (The Exit Gate Pass)
Imagine a multi-room inspection building:
- **Default (Last Statement Output):** Walking through Room 1, Room 2, and Room 3. When you exit Room 3, you hand the supervisor whatever item was sitting on the table in Room 3.
- **`RETURN` Statement:** An explicit **Exit Pass**.
  - While standing in Room 2, you stamp an exit pass with a specific document (`RETURN $doc;`).
  - You walk straight past Room 3 to the exit gate and hand that stamped document to the supervisor.

---

### (4) Code Examples

#### Using the `RETURN` Statement in SurrealQL Scripts

```sql
-- 1. Using RETURN to output a calculated script result
LET $base_price = 100.00dec;
LET $tax_rate = 0.20dec;
LET $final_price = $base_price + ($base_price * $tax_rate);

RETURN $final_price;
-- Returns: 120.00dec

-- 2. Early return inside conditional logic
LET $user = (SELECT * FROM user WHERE id = user:alice)[0];

IF $user = NONE {
  RETURN { status: 404, message: "User not found" };
};

-- Execution continues only if user exists
RETURN { status: 200, data: $user };

-- 3. RETURN inside custom functions (used in DEFINE FUNCTION)
-- DEFINE FUNCTION fn::calculate_tax($amount: decimal) {
--   RETURN $amount * 0.20dec;
-- };
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing the CRUD 'RETURN' clause (RETURN NONE/AFTER) with the standalone procedural 'RETURN' statement

**The mistake:** Writing `CREATE user SET name = 'Alice'; RETURN AFTER;` as two separate statements, expecting it to function like the CRUD return clause.

**Why it's wrong:** Appending `RETURN AFTER` directly onto a CRUD statement is a clause (`CREATE user SET name = 'Alice' RETURN AFTER;`). Writing `RETURN AFTER;` on a separate line as a statement attempts to return the keyword variable `AFTER` as a script value, triggering a parser syntax error.

**Fix: Keep the `RETURN AFTER/NONE/BEFORE/DIFF` clause attached to the CRUD command. Use `RETURN $val;` for standalone script outputs:**

```sql
-- BAD (confusing clause and statement)
CREATE user SET name = 'Alice';
RETURN AFTER;

-- GOOD (CRUD clause attached)
CREATE user SET name = 'Alice' RETURN AFTER;

-- GOOD (Standalone procedural return statement)
LET $res = (CREATE user SET name = 'Alice');
RETURN $res;
```

---



### Mistake 2: Placing Code Statements After `RETURN` in Query Batches

**The mistake:** Writing `RETURN 'done'; SELECT * FROM user;`.

**Why it's wrong:** Executing `RETURN` terminates query batch execution immediately. Statements placed after `RETURN` are skipped and never executed.

*Incorrect:*
```surrealql
RETURN "done";
SELECT * FROM user; // ❌ Unreachable statement!
```

*Fix:*
```surrealql
SELECT * FROM user;
RETURN "done";
```

### Mistake 3: Confusing Block `RETURN` inside Functions with Script-Level `RETURN`

**The mistake:** Using `RETURN` inside a `FOR` loop expecting it to break out of the loop like `break`.

**Why it's wrong:** Inside `FOR` loops, `RETURN` yields an iteration result value into the loop result array. It does NOT break out of the loop.

*Incorrect:*
```surrealql
-- Expecting RETURN to break loop early:
FOR $x IN [1, 2, 3] { IF $x = 2 { RETURN $x; }; }; // Collects iteration result
```

*Fix:*
```surrealql
Use predicate filters or `array::find()` for early value extraction
```

## 6. Practice Exercises

### Exercise 1: Procedural Script Output

**Problem:** Write a SurrealQL script that:
1. Calculates the count of active users (`SELECT VALUE count() FROM user WHERE active = true GROUP ALL`)[0] and assigns it to `$active_count`.
2. Calculates the count of inactive users (`SELECT VALUE count() FROM user WHERE active = false GROUP ALL`)[0] and assigns it to `$inactive_count`.
3. Explicitly returns an object using `RETURN`: `{ active: $active_count, inactive: $inactive_count }`.

**Expected output:**
```sql
LET $active_count = (SELECT VALUE count() FROM user WHERE active = true GROUP ALL)[0];
LET $inactive_count = (SELECT VALUE count() FROM user WHERE active = false GROUP ALL)[0];

RETURN {
  active: $active_count,
  inactive: $inactive_count
};
```

> [!check]- Answer
> - Index subqueries `[0]` to assign scalar counts to variables.
> - Terminate the script with `RETURN { ... };`.

---



### Exercise 2: Returning Explicit Transaction Output

**Problem:** Write batch query that creates a user, logs audit entry, and returns final user record.

**Expected output:**
```text
LET $u = (CREATE user SET name = "Alice"); CREATE log SET user = $u.id; RETURN $u;
```

> [!check]- Answer
> ```surrealql
> LET $u = (CREATE user SET name = "Alice");
> CREATE log SET user = $u.id;
> RETURN $u;
> ```
>
> **Explanation:** `RETURN $var` outputs specified transaction results from batch scripts.

### Exercise 3: Returning Object Expressions

**Problem:** Return custom summary object `{ status: "ok", count: 42 }` using `RETURN`.

**Expected output:**
```text
RETURN { status: "ok", count: 42 };
```

> [!check]- Answer
> ```surrealql
> RETURN { status: "ok", count: 42 };
> ```
>
> **Explanation:** `RETURN expression` returns formatted JSON objects or primitive values.

## 7. Related Terms
- [RETURN Clause](../level_03/return_clause.md) — The CRUD projection clause.
- [`LET` Statement](let_statement.md) — Script variables.
- [`IF` / `ELSE` Expressions](if_else.md) — Conditional control flow.

---

## 8. Key Takeaways
- The `RETURN` statement is a standalone control-flow command (`RETURN $val;`).
- Explicitly halts execution and outputs a specific value to the caller.
- Used in multi-statement scripts, custom functions (`DEFINE FUNCTION`), and blocks.
- Distinct from the CRUD `RETURN BEFORE/AFTER/NONE/DIFF` clause attached to write commands.
- Enables early exits inside `IF / ELSE` procedural logic.
