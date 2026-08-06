# `SCHEMAFULL` Validation Assertion Patterns

> **Level 4 — Schema Definition & Constraints**
> The best-practice validation patterns in SurrealDB schemas, outlining how to combine `option<T>`, types, and `ASSERT` checks to enforce email formats, string lengths, numeric ranges, enum lists, and optional field bypass rules.

---

## 1. Prerequisites

- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [Assertions (`ASSERT`)](field_assertions.md) — Custom field validation.
- [`option<T>` (Optional Fields)](option_type.md) — Optional fields wrapper.

---

## 2. Term Category


**Schema & Modeling (strict table schema validation rules)**: - **Database Theory / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Enforcing data integrity in schema-full databases requires writing robust validation patterns. 
-   If you write simple assertions, you can introduce bugs.
-   For example, if you mark a field as optional (`option<string>`) but write an assertion checking string length without a `NONE` bypass, the database will attempt to validate the length of a missing field (`NONE`), causing inserts to fail.

We study these **Validation Assertion Patterns** to build clean schemas. 

By using standard templates for email validation, string lengths, numerical ranges, enum lists, and optional fields, you can lock down your database structures securely, preventing validation errors and ensuring consistent data.

---

### (2) The Five Essential Validation Patterns

#### 1. The Email Format Pattern
Enforces a valid email format using the standard library:
`TYPE string ASSERT string::is::email($value)`

#### 2. The String Length Range Pattern
Enforces minimum and maximum character lengths:
`TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 50`

#### 3. The Enum (Allowed Values) Pattern
Enforces that a field must hold one of a specific list of values:
`TYPE string ASSERT $value INSIDE ["admin", "editor", "user"]`

#### 4. The Numeric Range Pattern
Enforces upper and lower bounds for numbers:
`TYPE int ASSERT $value >= 18 AND $value <= 120`

#### 5. The Optional Field Bypass Pattern (Critical!)
When a field is optional (`option<T>`), if it is omitted on write, `$value` evaluates to `NONE`. 
-   **THE GOTCHA:** If you write an assertion check (like string length) without a bypass, SurrealDB will try to validate `NONE`, throwing a type error. 
-   **THE PATTERN:** Always prepend `$value = NONE OR` before your checks:
`TYPE option<string> ASSERT $value = NONE OR string::len($value) >= 10`

---

### (3) Reality Metaphor (Security Checkpoints)
Imagine a warehouse conveyor belt scan checkpoint:
-   **Type Sizer:** A plastic ring template checking if the package shape is a tube (`TYPE string`) or a box (`TYPE int`).
-   **Assertion Scanners:** Special sensors testing package contents:
    -   **Enum Sensor:** Checks if the box color matches one of the allowed categories: Red, Blue, or Green.
    -   **Range Sensor:** Measures if the box weight falls between 1kg and 5kg.
    -   **Optional Sensor Bypass:** A sensor bypass. If no package is on the belt (`$value = NONE`), the scanner shuts off and lets the empty belt slot pass. If a package is present, the scanner turns on and runs all checks.

---

### (4) Code Examples

#### A Production-Ready Validated Schema in SurrealQL
This schema illustrates all five validation patterns in action:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Email pattern
DEFINE FIELD email ON user TYPE string
  ASSERT string::is::email($value);

-- 2. String Length pattern
DEFINE FIELD username ON user TYPE string
  ASSERT string::len($value) >= 3 AND string::len($value) <= 30;

-- 3. Enum pattern
DEFINE FIELD role ON user TYPE string DEFAULT "user"
  ASSERT $value INSIDE ["admin", "editor", "user"];

-- 4. Numeric Range pattern
DEFINE FIELD age ON user TYPE int
  ASSERT $value >= 18 AND $value <= 120;

-- 5. Optional Field Bypass pattern (CRITICAL GOTCHA FIXED!)
-- Allows the phone field to be completely omitted (NONE),
-- but if it is provided, validates that it is a phone format!
DEFINE FIELD phone ON user TYPE option<string>
  ASSERT $value = NONE OR string::is::phone($value);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the '$value = NONE OR' bypass inside assertions for optional fields, causing inserts to fail when those fields are omitted

**The mistake:** Writing the schema as `DEFINE FIELD bio ON user TYPE option<string> ASSERT string::len($value) <= 160;` and trying to insert a user without a biography: `CREATE user SET email = "a@b.com";`.

**Why it's wrong:** Because `bio` is omitted, its value is `NONE`. 

SurrealDB runs the assertion check: `string::len(NONE) <= 160`. 

Because `NONE` is not a string, the `string::len()` function throws a type error and rolls back the transaction, making your optional field act as a required field instead.

**Fix: Always prepend `$value = NONE OR` to your assertion expressions when validating optional (`option<T>`) fields:**

```sql
-- BAD (Crashes if bio is omitted)
DEFINE FIELD bio ON user TYPE option<string> ASSERT string::len($value) <= 160;

-- GOOD (Bypasses checks safely if bio is omitted)
DEFINE FIELD bio ON user TYPE option<option<string>> // or option<string>
  ASSERT $value = NONE OR string::len($value) <= 160;
```

---



### Mistake 2: Attempting Field Assignments on `SCHEMAFULL` Tables Without Prior `DEFINE FIELD` Declarations

**The mistake:** Inserting record `{ a: 1, b: 2 }` into `SCHEMAFULL` table where only field `a` was defined.

**Why it's wrong:** `SCHEMAFULL` tables ignore or reject fields that have not been explicitly defined via `DEFINE FIELD`.

*Incorrect:*
```surrealql
DEFINE TABLE log SCHEMAFULL;
DEFINE FIELD a ON TABLE log TYPE int;
CREATE log SET a = 1, b = 2; // ❌ Field 'b' ignored or rejected!
```

*Fix:*
```surrealql
DEFINE TABLE log SCHEMAFULL;
DEFINE FIELD a ON TABLE log TYPE int;
DEFINE FIELD b ON TABLE log TYPE int;
CREATE log SET a = 1, b = 2;
```

### Mistake 3: Confusing `FLEXIBLE` Field Attributes on `SCHEMAFULL` Tables

**The mistake:** Expecting an object field defined as `TYPE object` on a `SCHEMAFULL` table to accept extra nested keys without `FLEXIBLE` attribute.

**Why it's wrong:** In `SCHEMAFULL` tables, object fields require `TYPE object FLEXIBLE` or nested `DEFINE FIELD` definitions for nested keys.

*Incorrect:*
```surrealql
DEFINE FIELD metadata ON TABLE log TYPE object;
CREATE log SET metadata = { custom_key: "val" }; // ❌ Nested key rejected!
```

*Fix:*
```surrealql
DEFINE FIELD metadata ON TABLE log TYPE object FLEXIBLE; // Permits nested keys
```

## 5. Practice Exercises

### Exercise 1: Validating Undeclared Field Rejections

**Scenario:**
Demonstrate that a `SCHEMAFULL` table rejects writes containing undeclared field properties.

**Requirements:**
1. Define table `article` as `SCHEMAFULL` with field `title`.
2. Attempt to create a record with undeclared field `bogus_field`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE article SCHEMAFULL;
> DEFINE FIELD title ON TABLE article TYPE string;
> 
> -- Fails with schema validation error!
> CREATE article:1 SET title = "Title", bogus_field = "Illegal";
> ```
>
> #### Technical Explanation
>
> 1. `SCHEMAFULL` tables reject undeclared fields at write time.
> 2. Guards against typo fields and schema corruption.
> 3. Enforces strict contract boundaries.
> 
---

### Exercise 2: Type Coercion Write Rejections

**Scenario:**
Attempt to write a string `"hello"` into integer field `age` on a `SCHEMAFULL` table.

**Requirements:**
1. Define field `age` as `int`.
2. Attempt write with `"hello"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD age ON TABLE user TYPE int;
> 
> -- Fails with type mismatch error!
> CREATE user:u1 SET age = "hello";
> ```
>
> #### Technical Explanation
>
> 1. Validates field data types prior to committing transactions.
> 2. Aborts invalid type writes automatically.
> 3. Maintains database type safety.
> 
---

### Exercise 3: Allowing Flexible Nested Objects in SCHEMAFULL Tables

**Scenario:**
Define a `SCHEMAFULL` table `profile` with a `FLEXIBLE` nested `metadata` object that accepts arbitrary keys.

**Requirements:**
1. Define field `metadata` as `object FLEXIBLE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE profile SCHEMAFULL;
> DEFINE FIELD metadata ON TABLE profile TYPE object FLEXIBLE;
> 
> CREATE profile:p1 SET metadata = { custom_theme: "dark", layout_id: 42 };
> ```
>
> #### Technical Explanation
>
> 1. `FLEXIBLE` allows arbitrary nested JSON keys inside specific object fields.
> 2. Combines strict outer schema rules with flexible nested documents.
> 3. Ideal for user metadata and settings storage.
> 
---



## 6. Related Terms

- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [`option<T>` (Optional Fields)](option_type.md) — Optional fields wrapper.
- [Idempotent Schema Migration Scripts](idempotent_migrations.md) — Defining schemas safely.
- [`ASSERT` Clause](assert_clause.md) — Related concept: `ASSERT` Clause.

---

## 7. Key Takeaways
- Schema-full tables use assertions to enforce business rules.
- The `INSIDE` operator validates enum list configurations.
- Range checks combine comparisons (e.g. `$value >= min AND $value <= max`).
- Email and phone formats use namespaced helpers (like `string::is::email()`).
- Optional fields (`option<T>`) require a `$value = NONE OR` bypass in assertions.
- Omitting the bypass causes type function checks to fail on missing fields.
- Keep validation logic at the database layer to reduce backend validation code.
