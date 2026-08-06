# `IF` / `ELSE` Expressions

> **Level 6 — Advanced Querying & Functions**
> The conditional logic control flow in SurrealQL used to branch query execution, evaluate expressions dynamically (`IF ... THEN ... ELSE ... END`), or execute multi-statement conditional code blocks.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [Operators in SurrealQL](../level_03/operators.md) — Comparison operators.

---

## 2. Term Category


**SurrealQL Command (conditional branch control expression)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Branch Tier Classification Logic

**Scenario:**
A billing service calculates customer discount tiers based on total purchase volume (`$volume`).

**Requirements:**
1. If `$volume >= 1000.0dec`, tier is `"Gold"`.
2. Else if `$volume >= 500.0dec`, tier is `"Silver"`.
3. Else tier is `"Bronze"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $volume = 750.0dec;
> 
> LET $tier = IF $volume >= 1000.0dec THEN
>     "Gold"
> ELSE IF $volume >= 500.0dec THEN
>     "Silver"
> ELSE
>     "Bronze"
> END;
> 
> RETURN $tier;
> ```
>
> #### Technical Explanation
>
> 1. `IF ... THEN ... ELSE IF ... ELSE ... END` evaluates multi-branch conditional expressions.
> 2. Returns the evaluated expression value of the first matching truthy branch.
> 3. Enables declarative stored procedure rules directly inside SurrealQL.

---

### Exercise 2: Conditional Field Value Projection in `SELECT`

**Scenario:**
A user directory query projects an `account_status` string ("Active" or "Inactive") based on boolean field `active`.

**Requirements:**
1. Project `IF active THEN "Active" ELSE "Inactive" END AS account_status`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET active = true;
> 
> SELECT name, IF active THEN "Active" ELSE "Inactive" END AS account_status 
> FROM user:u1;
> ```
>
> #### Technical Explanation
>
> 1. `IF` expressions can be embedded directly inside `SELECT` projection lists.
> 2. Replaces SQL `CASE WHEN ... THEN ... END` syntax.
> 3. Formats API response fields server-side.

---

### Exercise 3: Conditional Database Mutation

**Scenario:**
Update a user's credit balance only if the requested withdrawal amount does not exceed current credit.

**Requirements:**
1. Check if `$balance >= $withdrawal`.
2. Update balance if true; throw exception if false.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $balance = 100.0dec;
> LET $withdrawal = 40.0dec;
> 
> IF $balance >= $withdrawal THEN (
>     UPDATE user:u1 SET balance -= $withdrawal
> ) ELSE (
>     THROW "Insufficient funds!"
> ) END;
> ```
>
> #### Technical Explanation
>
> 1. `IF` blocks can enclose multi-statement transaction operations.
> 2. Protects against invalid state mutations atomically.
> 3. Replaces complex database stored procedures.

---



## 6. Related Terms

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [`THROW` Expression](throw_expression.md) — Raising errors in ELSE blocks.
- [`RETURN` Statement (in Functions / Blocks)](return_statement.md) — Related concept: `RETURN` Statement (in Functions / Blocks).
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Related concept: Transactions (`BEGIN` / `COMMIT` / `CANCEL`).

---

## 7. Key Takeaways
- `IF` / `ELSE` expressions provide conditional branching in SurrealQL.
- Replaces SQL's `CASE WHEN` and MongoDB's `$cond` with readable syntax.
- Inline form (`IF ... THEN ... ELSE ... END`) embeds inside `SELECT` and `SET`.
- Statement block form (`IF condition { ... } ELSE { ... }`) controls procedural scripts.
- Inline expressions require the closing `END` keyword.
