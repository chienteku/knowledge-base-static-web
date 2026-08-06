# `THROW` Expression

> **Level 6 — Advanced Querying & Functions**
> The error-handling expression in SurrealQL used to explicitly raise custom runtime exceptions (`THROW "Error message"`), instantly aborting the query or transaction block.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [`IF` / `ELSE` Expressions](if_else.md) — Conditional control flow.

---

## 2. Term Category


**SurrealQL Command (transaction error abort expression)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In business applications, certain database conditions represent illegal states:
- A user attempts to withdraw $100, but their account balance is only $20.
- A client attempts to check out an order, but a product is out of stock.

If you let the query run anyway:
- You might update the balance to a negative number or write corrupted data.
- Returning custom error codes requires complex application-side checks.

In PostgreSQL, developers raise exceptions using `RAISE EXCEPTION 'Message';`. In programming languages like JavaScript, developers write `throw new Error("Message")`.

We designed the **`THROW`** expression in SurrealQL to bring explicit exception handling to database scripts. When a `THROW` statement is encountered, SurrealDB halts execution immediately, rolls back any uncommitted writes in the active transaction, and returns your custom error string to the client SDK.

---

### (2) Behavior inside Transactions
When `THROW` fires inside a `BEGIN TRANSACTION ... COMMIT TRANSACTION` block:
- **Immediate Abort:** All queries after `THROW` are skipped.
- **Atomic Rollback:** All writes performed before `THROW` within that transaction are rolled back cleanly.

---

### (3) Reality Metaphor (Emergency Stop Button)
Imagine a factory conveyor belt:
- **Normal Flow:** Packages move from machine A to machine B smoothly.
- **`THROW` Expression:** An **Emergency Stop Palm Button**.
  - A sensor detects a box is missing its hazard label (`IF $label = NONE`).
  - The sensor instantly hits the Emergency Stop Button (`THROW "Missing hazard label"`).
  - The belt stops dead in its tracks, lights flash, and the supervisor receives the exact error message.

---

### (4) Code Examples

#### Using `THROW` in SurrealQL Scripts

```sql
-- 1. Simple THROW inside conditional logic
LET $user_age = 15;

IF $user_age < 18 {
  THROW "User must be at least 18 years old to register";
};

-- 2. THROW inside a transaction script to enforce business rules
BEGIN TRANSACTION;

LET $acc = (SELECT * FROM account WHERE id = account:john)[0];
LET $amount = 150.00dec;

IF $acc.balance < $amount {
  THROW "Transaction cancelled: Insufficient balance (" + <string>$acc.balance + ")";
};

-- Runs only if balance is sufficient:
UPDATE account:john SET balance -= $amount;

COMMIT TRANSACTION;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting queries AFTER a THROW expression to execute, unaware that THROW terminates the script

**The mistake:** Writing code after a `THROW` statement assuming it acts like a warning log.

**Why it's wrong:** `THROW` is a fatal exception expression. As soon as it evaluates, SurrealDB stops processing the remaining queries in the script block and rolls back active transactions.

**Fix: Use `THROW` only when you intend to abort execution on invalid or illegal states.**

---



### Mistake 2: Passing Non-String Arguments to `THROW` Expressions

**The mistake:** Writing `THROW 404;` or `THROW { error: "bad" };`.

**Why it's wrong:** `THROW` expects a descriptive string error message: `THROW "Custom error message";`.

*Incorrect:*
```surrealql
THROW 400; // ❌ Expected string error message!
```

*Fix:*
```surrealql
THROW "HTTP 400: Invalid payload parameters"; // Descriptive error string
```

### Mistake 3: Using `THROW` Outside Transactional/Conditional Guard Blocks

**The mistake:** Unconditionally executing `THROW "Error";` in main script bodies.

**Why it's wrong:** `THROW` immediately aborts the current transaction batch and rolls back mutations. Trigger `THROW` conditionally inside `IF` guards.

*Incorrect:*
```surrealql
THROW "Error"; // Aborts script unconditionally!
```

*Fix:*
```surrealql
IF $age < 18 { THROW "User must be at least 18 years old"; };
```

## 5. Practice Exercises

### Exercise 1: Throwing Custom Exception Messages

**Scenario:**
Validate user input inside a transaction script. If `$age < 18`, abort transaction execution and throw a custom error message using `THROW`.

**Requirements:**
1. Declare `LET $age = 15;`.
2. Check `IF $age < 18 THEN THROW "User must be at least 18 years old!" END;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $age = 15;
> 
> IF $age < 18 THEN (
>     THROW "User must be at least 18 years old!"
> ) END;
> ```
>
> #### Technical Explanation
>
> 1. `THROW "message"` aborts transaction execution immediately and returns a custom error exception to the client.
> 2. Rolls back all uncommitted mutations inside the active transaction block.
> 3. Enables custom business logic validation at the database tier.

---

### Exercise 2: Throwing Exceptions in Field Assertion Rules

**Scenario:**
Use `THROW` inside a table field `ASSERT` expression to return a specific validation error string when an assertion fails.

**Requirements:**
1. Define field `credit_score` on table `applicant` asserting `$value >= 600 OR THROW "Credit score too low!"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE applicant SCHEMAFULL;
> DEFINE FIELD credit_score ON TABLE applicant TYPE int 
>     ASSERT $value >= 600 OR THROW "Credit score too low!";
> ```
>
> #### Technical Explanation
>
> 1. Combining `ASSERT` with `OR THROW` customize write rejection error messages.
> 2. Returns descriptive domain error messages to SDK client callers.
> 3. Improves API error handling clarity.

---

### Exercise 3: Transaction Abort Behavior on `THROW`

**Scenario:**
Demonstrate that throwing an exception rolls back preceding `CREATE` mutations within a transaction block.

**Requirements:**
1. Begin transaction, create a record, throw exception, commit transaction.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> CREATE temp_log:1 SET data = "test";
> THROW "Aborting transaction intentionally!";
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. Throwing an exception inside a transaction block triggers an immediate transaction rollback.
> 2. `temp_log:1` is never committed to persistent storage.
> 3. Guarantees ACID transactional atomicity during error conditions.

---



## 6. Related Terms

- [`IF` / `ELSE` Expressions](if_else.md) — Conditional control flow.
- [`RETURN` Statement (in Functions / Blocks)](return_statement.md) — Early returns.
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Related concept: Transactions (`BEGIN` / `COMMIT` / `CANCEL`).

---

## 7. Key Takeaways
- `THROW "message"` raises a runtime exception in SurrealQL.
- Immediately halts query script processing.
- Automatically rolls back any active uncommitted transaction.
- Returns the custom error text string directly to the client SDK.
- Essential for enforcing business rules and data safety inside procedural scripts.
