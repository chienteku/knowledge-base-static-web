# `THROW` Expression

> **Level 6 — Advanced Querying & Functions**
> The error-handling expression in SurrealQL used to explicitly raise custom runtime exceptions (`THROW "Error message"`), instantly aborting the query or transaction block.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [`IF` / `ELSE` Expressions](if_else.md) — Conditional control flow.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the transaction manager. Interrupts query execution and triggers an automatic transaction rollback).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Exception Guard Implementation

**Problem:** You are writing an order creation script.
- Parameter `$stock` is `0`.
- Parameter `$item` is `"product:laptop"`.
Write an `IF` statement checking if `$stock = 0`. If true, execute a `THROW` with the message `"Product is out of stock"`.

**Expected output:**
> [!check]- Answer
> ```sql
> IF $stock = 0 {
>   THROW "Product is out of stock";
> };
> ```
> - Use the `IF condition { ... }` block syntax.
> - Raise the error using `THROW "message"`.

---



### Exercise 2: Conditional Validation Throw

**Problem:** Write `IF` guard that throws `"Unauthorized access"` if `$user.role != "admin"`.

**Expected output:**
> [!check]- Answer
> ```text
> IF $user.role != "admin" { THROW "Unauthorized access"; };
> ```
> ```surrealql
> IF $user.role != "admin" {
>   THROW "Unauthorized access";
> };
> ```
>
> **Explanation:** `THROW` aborts query execution and rolls back transaction mutations.

---

### Exercise 3: Field Assertion Custom Error

**Problem:** How does `THROW` behave inside custom functions (`fn::`) when validation fails? (Aborts function and returns error).

**Expected output:**
> [!check]- Answer
> ```text
> Aborts function execution and returns custom error string to caller
> ```
> ```text
> Aborts function execution and returns custom error string to caller
> ```
>
> **Explanation:** `THROW` bubbles up custom error messages through function execution stacks.

## 7. Related Terms

- [`IF` / `ELSE` Expressions](if_else.md) — Conditional control flow.
- [`RETURN` Statement (in Functions / Blocks)](return_statement.md) — Early returns.
- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](../level_09/transactions.md) — Related concept: Transactions (`BEGIN` / `COMMIT` / `CANCEL`).

---

## 8. Key Takeaways
- `THROW "message"` raises a runtime exception in SurrealQL.
- Immediately halts query script processing.
- Automatically rolls back any active uncommitted transaction.
- Returns the custom error text string directly to the client SDK.
- Essential for enforcing business rules and data safety inside procedural scripts.
