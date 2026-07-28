# Assertions (`ASSERT`)

> **Level 4 — Schema Definition & Constraints**
> The validation clause in SurrealDB field definitions that enforces custom business logic using a boolean expression, rejecting write transactions if the input value (`$value`) evaluates to `false`.

---

## 1. Prerequisites
- [`DEFINE FIELD`](define_field.md) — The parent schema context.
- [Operators in SurrealQL](../level_03/operators.md) — The logical check symbols.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the database validator. Runs inside a write transaction; violations automatically rollback the write attempt, throwing error logs to the client).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Type checking (like `TYPE string` or `TYPE int`) only guarantees data shapes:
-   An email field typed as `string` will accept `"hello"`, which is not a valid email address.
-   An age field typed as `int` will accept `-5` or `999`, which are logically invalid for humans.

In SQL, you write `CHECK` constraints (e.g., `CHECK (age >= 18)`). 

In MongoDB, you write JSON schemas with regex patterns.

We designed the **`ASSERT`** clause in SurrealQL to provide a unified, highly expressive validation language. 

You write standard logical expressions directly inside the field schema. 

Inside this clause, you reference the incoming value using the **`$value`** variable. 

By combining `ASSERT` with SurrealDB's extensive standard library functions, you can enforce email validation, string lengths, numeric ranges, and regex checks directly at the database engine layer, reducing the need for validation libraries (like Zod or Mongoose) in your backend code.

---

### (2) Referencing the Input Value (`$value`)
In SurrealDB, inside the `ASSERT` block, you do not refer to the field by name. 

Instead, you use the system variable **`$value`**, which represents the value the client is attempting to write.

---

### (3) Reality Metaphor (Carry-on Baggage Sizers)
Imagine boarding a flight:
-   **Type Validation:** The gate agent checking if you have a physical boarding pass (`TYPE ticket`).
-   **`ASSERT` Constraint:** The **Baggage Sizing Box** at the gate.
    -   The agent asks you to place your bag (`$value`) inside the metal slot.
    -   If the bag fits the dimensions (`ASSERT $value.height <= 22`), you pass.
    -   If it is a millimeter too wide, the box blocks it, and the agent rejects the bag.

---

### (4) Code Examples

#### Enforcing Assertions in SurrealQL
Let's build a secure registration schema:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Enforce numeric ranges
DEFINE FIELD age ON user TYPE int
  ASSERT $value >= 18 AND $value <= 120;

-- 2. Enforce email formats using standard library functions
DEFINE FIELD email ON user TYPE string
  ASSERT string::is::email($value);

-- 3. Enforce string lengths
DEFINE FIELD password ON user TYPE string
  ASSERT string::len($value) >= 8;

-- This write succeeds (passes all assertions):
CREATE user:alice SET age = 25, email = "alice@example.com", password = "superSecretPassword";

-- This write FAILS (age assertion triggers rollback!):
CREATE user:bob SET age = 15, email = "bob@example.com", password = "superSecretPassword";
-- Error: "Database index/validation error: Field 'age' failed ASSERT constraint..."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Referencing the field by its name inside the 'ASSERT' block instead of using the mandatory '$value' system variable, causing evaluation errors

**The mistake:** Writing the assertion constraint as `DEFINE FIELD age ON user TYPE int ASSERT age >= 18;`.

**Why it's wrong:** Inside the field declaration context, the database parser does not bind the field name variable to the incoming validation stream. 

Using `age` instead of `$value` results in compile-time evaluation errors.

**Fix: Always reference the incoming data using the `$value` system variable inside `ASSERT` clauses:**

```sql
-- BAD
DEFINE FIELD age ON user TYPE int ASSERT age >= 18;

-- GOOD
DEFINE FIELD age ON user TYPE int ASSERT $value >= 18;
```

---



### Mistake 2: Using Invalid Assertion Functions inside `ASSERT` Expressions

**The mistake:** Writing `ASSERT is_email($value)` using non-existent function names.

**Why it's wrong:** SurrealDB provides `is::email()`, `is::url()`, `is::uuid()`, `is::alphanumeric()` in the `is::` namespace.

*Incorrect:*
```surrealql
DEFINE FIELD email ON TABLE user TYPE string ASSERT is_email($value); // ❌ Function is_email does not exist!
```

*Fix:*
```surrealql
DEFINE FIELD email ON TABLE user TYPE string ASSERT is::email($value); // Built-in is:: email assertion
```

### Mistake 3: Referencing Parameter Identifiers Other Than `$value` in Field Assertions

**The mistake:** Writing `ASSERT $email != NONE` inside `DEFINE FIELD email` assertion clause.

**Why it's wrong:** Field `ASSERT` expressions MUST reference the target field value using special context variable `$value`.

*Incorrect:*
```surrealql
DEFINE FIELD email ON TABLE user TYPE string ASSERT $email != NONE; // ❌ $email is un-bound!
```

*Fix:*
```surrealql
DEFINE FIELD email ON TABLE user TYPE string ASSERT $value != NONE AND is::email($value);
```

## 6. Practice Exercises

### Exercise 1: Assertion Configuration

**Problem:** You are defining a schema for a `products` table. 
Write the SurrealQL commands to:
1.  Define a field named `sku` on `products` of type `string`.
2.  Add an assertion ensuring that the length of `sku` is exactly `8` characters. (Hint: Use `string::len()`).

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE FIELD sku ON products TYPE string
>   ASSERT string::len($value) = 8;
> ```
> - Anchor the field to the `products` table using the `ON` keyword.
> - Reference the input string length using the `$value` variable inside the helper function: `string::len($value)`.

---



### Exercise 2: Range Value Assertion

**Problem:** Define field `age` on `user` table as integer asserting `$value >= 18 AND $value <= 100`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD age ON TABLE user TYPE int ASSERT $value >= 18 AND $value <= 100;
> ```
> ```surrealql
> DEFINE FIELD age ON TABLE user TYPE int ASSERT $value >= 18 AND $value <= 100;
> ```
>
> **Explanation:** `ASSERT $value ...` validates numeric range boundaries on field assignments.

---

### Exercise 3: URL Format Assertion

**Problem:** Assert field `website` on `company` is a valid URL using `is::url()`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD website ON TABLE company TYPE string ASSERT is::url($value);
> ```
> ```surrealql
> DEFINE FIELD website ON TABLE company TYPE string ASSERT is::url($value);
> ```
>
> **Explanation:** `is::url($value)` validates URL string formats.

## 7. Related Terms
- [`DEFINE FIELD`](define_field.md) — The parent schema context.
- [`VALUE` / `DEFAULT` / `READONLY` Clause](field_attributes.md) — Value modification attributes.

---

## 8. Key Takeaways
- The `ASSERT` clause enforces custom data validation constraints at the schema layer.
- Relational equivalent to `CHECK` constraints; NoSQL equivalent to JSON Schema rules.
- Reference the incoming data using the system variable `$value` inside assertions.
- Write assertions using logical operators (`AND`, `OR`) and comparison tags.
- Pair assertions with standard library functions (like `string::is::email()`).
- Validation failures trigger automatic write transaction rollbacks.
- Prevents database-level pollution, acting as a final safeguard for data integrity.
