# Assertions (`ASSERT`)

> **Level 4 — Schema Definition & Constraints**
> The validation clause in SurrealDB field definitions that enforces custom business logic using a boolean expression, rejecting write transactions if the input value (`$value`) evaluates to `false`.

---

## 1. Prerequisites

- [`DEFINE FIELD`](define_field.md) — The parent schema context.
- [Operators in SurrealQL](../level_03/operators.md) — The logical check symbols.

---

## 2. Term Category


**Schema & Modeling (field constraint assertion expressions)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Numeric Range Assertions

**Scenario:**
Enforce that an employee's `salary` field on table `employee` must be a decimal greater than or equal to `30000.00dec`.

**Requirements:**
1. Define table `employee` as `SCHEMAFULL`.
2. Define field `salary` as `decimal` asserting `$value >= 30000.00dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE employee SCHEMAFULL;
> DEFINE FIELD salary ON TABLE employee TYPE decimal 
>     ASSERT $value >= 30000.00dec;
> 
> CREATE employee:e1 SET salary = 45000.00dec;
> ```
>
> #### Technical Explanation
>
> 1. `ASSERT` validates field conditions during `CREATE` and `UPDATE` mutations.
> 2. Rejects write attempts violating the minimum salary constraint.
> 3. Enforces domain invariants directly at the database tier.

---

### Exercise 2: String Format Assertions with Built-in Functions

**Scenario:**
Validate that a user's `website` field is a valid URL using `string::is::url($value)`.

**Requirements:**
1. Define field `website` on table `user` as `string`.
2. Apply `ASSERT string::is::url($value)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD website ON TABLE user TYPE string 
>     ASSERT string::is::url($value);
> 
> CREATE user:u1 SET website = "https://surrealdb.com";
> ```
>
> #### Technical Explanation
>
> 1. Built-in validator functions (`string::is::url`, `string::is::email`) simplify assertion rules.
> 2. Ensures stored text strings conform to valid URL syntax.
> 3. Protects downstream web clients from malformed input data.

---

### Exercise 3: Array Length Assertions

**Scenario:**
Ensure a blog post's `tags` array contains at least 1 tag and no more than 5 tags.

**Requirements:**
1. Define field `tags` on table `post` as `array<string>`.
2. Apply `ASSERT array::len($value) >= 1 AND array::len($value) <= 5`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE post SCHEMAFULL;
> DEFINE FIELD tags ON TABLE post TYPE array<string> 
>     ASSERT array::len($value) >= 1 AND array::len($value) <= 5;
> 
> CREATE post:p1 SET tags = ["rust", "surrealdb"];
> ```
>
> #### Technical Explanation
>
> 1. `array::len($value)` returns element counts for array fields.
> 2. Validates array collection sizes prior to transaction commits.
> 3. Prevents empty or oversized tag arrays.

---



## 6. Related Terms

- [`DEFINE FIELD`](define_field.md) — The parent schema context.
- [`VALUE` / `DEFAULT` / `READONLY` Clause](field_attributes.md) — Value modification attributes.
- [`ASSERT` Clause](assert_clause.md) — Related concept: `ASSERT` Clause.

---

## 7. Key Takeaways
- The `ASSERT` clause enforces custom data validation constraints at the schema layer.
- Relational equivalent to `CHECK` constraints; NoSQL equivalent to JSON Schema rules.
- Reference the incoming data using the system variable `$value` inside assertions.
- Write assertions using logical operators (`AND`, `OR`) and comparison tags.
- Pair assertions with standard library functions (like `string::is::email()`).
- Validation failures trigger automatic write transaction rollbacks.
- Prevents database-level pollution, acting as a final safeguard for data integrity.
