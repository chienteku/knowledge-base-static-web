# `IF` / `ELSE` Expressions

> **Level 6 — Advanced Querying & Functions**
> The conditional logic control flow in SurrealQL used to branch query execution, evaluate expressions dynamically (`IF ... THEN ... ELSE ... END`), or execute multi-statement conditional code blocks.

---

## 1. Prerequisites
- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [Operators in SurrealQL](../level_03/operators.md) — Comparison operators.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated inline during query execution. Branches expression trees based on boolean evaluation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Dynamic queries often require conditional branching:
- Returning `"Adult"` or `"Minor"` based on an age field inside a `SELECT` projection.
- Executing an update block only if a user has sufficient account balance.
- Setting default values dynamically based on environment parameters.

In SQL (PostgreSQL), inline branching uses verbose `CASE WHEN ... THEN ... ELSE ... END` blocks. In MongoDB, it uses `$cond` or `$switch` aggregation objects.

We designed **`IF` / `ELSE` Expressions** in SurrealQL to mirror clean programming language syntax (`IF condition THEN ... ELSE IF ... ELSE ... END`). Because SurrealQL treats `IF` blocks as expressions, they can be embedded directly inside `SELECT` fields, `SET` assignments, or executed as standalone procedural script blocks.

---

### (2) Syntax Forms

1. **Inline Expression Form (inside SELECT/SET):**
   `IF condition THEN value1 ELSE value2 END`
   - Example: `SELECT name, IF age >= 18 THEN 'Adult' ELSE 'Minor' END AS status FROM user;`

2. **Statement Block Form (procedural scripting):**
   ```sql
   IF $account.balance >= $amount {
     UPDATE $account SET balance -= $amount;
   } ELSE {
     THROW "Insufficient funds";
   };
   ```

---

### (3) Reality Metaphor (Railway Junction Switch)
Imagine a train traveling along a track:
- **`IF` Condition:** A **Track Switch Sensor** detecting the train type.
- **`THEN` Track:** If the sensor detects a Passenger Train (`IF type = 'passenger'`), the track switch flips left, guiding the train to the Grand Station platform.
- **`ELSE` Track:** If the train is anything else (`ELSE`), the switch stays straight, guiding it to the Freight Yard.

---

### (4) Code Examples

#### Using `IF` / `ELSE` in SurrealQL

```sql
-- 1. Inline IF/ELSE inside a SELECT projection
SELECT 
  name,
  score,
  IF score >= 90 THEN "A"
  ELSE IF score >= 80 THEN "B"
  ELSE IF score >= 70 THEN "C"
  ELSE "F"
  END AS grade
FROM student;

-- 2. IF/ELSE in a field SET assignment
CREATE product SET 
  name = "Wireless Mouse",
  price = 49.99dec,
  tax_category = IF price >= 100.00dec THEN "luxury" ELSE "standard" END;

-- 3. Procedural IF/ELSE statement block inside a script
LET $user_id = user:alice;
LET $user_active = (SELECT VALUE active FROM $user_id)[0];

IF $user_active = true {
  CREATE log SET msg = "Active user logged in", user = $user_id;
} ELSE {
  CREATE log SET msg = "Inactive login attempt", user = $user_id;
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the mandatory 'END' keyword when writing inline IF expressions inside SELECT statements

**The mistake:** Writing `SELECT IF age >= 18 THEN "Adult" ELSE "Minor" AS status FROM user;` (missing `END`).

**Why it's wrong:** Inline `IF` expressions require the trailing `END` keyword to mark where the conditional projection ends. Omitting `END` results in a parser syntax error.

**Fix: Always terminate inline `IF ... THEN ... ELSE` expressions with `END`:**

```sql
-- BAD
SELECT IF age >= 18 THEN "Adult" ELSE "Minor" AS status FROM user;

-- GOOD
SELECT IF age >= 18 THEN "Adult" ELSE "Minor" END AS status FROM user;
```

---



### Mistake 2: Omitting Semicolons After `IF / ELSE` Blocks in Multi-Statement Queries

**The mistake:** Writing `IF $score > 50 { RETURN 'pass'; } ELSE { RETURN 'fail'; } SELECT * FROM log;` without semicolons.

**Why it's wrong:** `IF / ELSE` blocks require trailing semicolons `;` when followed by subsequent statements in query scripts.

*Incorrect:*
```surrealql
IF $x > 0 { RETURN true; } ELSE { RETURN false; } SELECT * FROM user; // ❌ Missing semicolon!
```

*Fix:*
```surrealql
IF $x > 0 { RETURN true; } ELSE { RETURN false; };
SELECT * FROM user;
```

### Mistake 3: Using Invalid Ternary `condition ? true_val : false_val` Syntax in SurrealQL

**The mistake:** Writing `LET $status = $age >= 18 ? 'adult' : 'minor';`.

**Why it's wrong:** SurrealQL uses inline `IF condition THEN true_val ELSE false_val END` or standard `IF / ELSE` block expressions instead of C-style ternary `?:`.

*Incorrect:*
```surrealql
LET $status = $age >= 18 ? "adult" : "minor"; // ❌ Invalid ternary syntax!
```

*Fix:*
```surrealql
LET $status = IF $age >= 18 THEN "adult" ELSE "minor" END;
```

## 6. Practice Exercises

### Exercise 1: Conditional Projection Formulation

**Problem:** You have an `inventory` table with a `stock` field (`int`).
Write a SurrealQL query to retrieve the product `name` and a calculated `availability` field:
- If `stock` is `0`, return `"Out of Stock"`.
- If `stock` is less than `10`, return `"Low Stock"`.
- Otherwise, return `"In Stock"`.

**Expected output:**
```sql
SELECT 
  name,
  IF stock = 0 THEN "Out of Stock"
  ELSE IF stock < 10 THEN "Low Stock"
  ELSE "In Stock"
  END AS availability
FROM inventory;
```

> [!check]- Answer
> - Chain conditions using `ELSE IF`.
> - Close the expression with `END` before aliasing with `AS availability`.

---



### Exercise 2: Inline IF THEN ELSE Expression

**Problem:** Assign `$tier = IF $points > 1000 THEN "gold" ELSE "standard" END`.

**Expected output:**
```text
LET $tier = IF $points > 1000 THEN "gold" ELSE "standard" END;
```

> [!check]- Answer
> ```surrealql
> LET $tier = IF $points > 1000 THEN "gold" ELSE "standard" END;
> ```
>
> **Explanation:** `IF ... THEN ... ELSE ... END` evaluates inline conditional value expressions.

### Exercise 3: Multi-Branch IF ELSE IF Statement

**Problem:** Write `IF / ELSE IF / ELSE` block evaluating `$role` string.

**Expected output:**
```text
IF $role = "admin" { RETURN "full"; } ELSE IF $role = "mod" { RETURN "partial"; } ELSE { RETURN "read"; };
```

> [!check]- Answer
> ```surrealql
> IF $role = "admin" {
>   RETURN "full";
> } ELSE IF $role = "mod" {
>   RETURN "partial";
> } ELSE {
>   RETURN "read";
> };
> ```
>
> **Explanation:** `IF / ELSE IF / ELSE` blocks branch statement logic across multiple conditions.

## 7. Related Terms
- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [THROW Expression](throw_expression.md) — Raising errors in ELSE blocks.

---

## 8. Key Takeaways
- `IF` / `ELSE` expressions provide conditional branching in SurrealQL.
- Replaces SQL's `CASE WHEN` and MongoDB's `$cond` with readable syntax.
- Inline form (`IF ... THEN ... ELSE ... END`) embeds inside `SELECT` and `SET`.
- Statement block form (`IF condition { ... } ELSE { ... }`) controls procedural scripts.
- Inline expressions require the closing `END` keyword.
