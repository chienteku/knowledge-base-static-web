# `ASSERT` Clause

> **Level 4 — Schema & Modeling**
> A SurrealDB field-level constraint clause in `DEFINE FIELD` that enforces boolean validation expressions on field values at write time, rejecting record writes that fail the assertion.

---

## 1. Prerequisites

- [`DEFINE FIELD`](define_field.md) — Defining schema fields in SurrealDB.
- [Operators (Comparison, Logical, Containment)](../level_03/operators.md) — Expressions used inside `ASSERT`.

---

## 2. Term Category

**Schema & Modeling (field-level value validation assertion)**: The `ASSERT` clause in `DEFINE FIELD` validates data integrity at write time. Unlike PostgreSQL's `CHECK` constraints (which operate on table rows), `ASSERT` executes directly on field values (`$value`), providing instant validation for primitive types, email regexes, numeric ranges, and nested arrays.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional relational databases (PostgreSQL), data validation requires separate table-level `CHECK` constraints or database triggers. In document databases (MongoDB), validation requires JSON Schema rules (`$jsonSchema`) that are verbose and hard to read.

SurrealDB introduces the `ASSERT` clause directly within `DEFINE FIELD` statements:
1. **Inline Field Rules**: Enforce domain constraints (e.g. `$value > 0`, `string::is::email($value)`) on the field definition itself.
2. **Special `$value` Variable**: Access the incoming field value using `$value` without needing full record reference syntax.
3. **Comprehensive Validation**: Use built-in SurrealQL string, array, and math functions (such as `string::len()`, `array::len()`, or `type::is::datetime()`) directly inside `ASSERT`.

### (2) Reality Metaphor

Imagine a bouncer at a club entrance enforcing a strict dress code:
- Without `ASSERT`: Anyone walks in, and later the manager complains about missing ties (corrupted or invalid data in the database).
- With `ASSERT`: The bouncer inspects each incoming guest's attire ($value) before allowing entry. If the attire fails inspection, entry is denied immediately with a validation error.

### (3) SurrealQL Code Examples

#### Defining Fields with `ASSERT` Constraints

```surrealql
-- Define a user table in SCHEMAFULL mode
DEFINE TABLE user SCHEMAFULL;

-- Field 1: Age must be at least 18
DEFINE FIELD age ON TABLE user TYPE int ASSERT $value >= 18;

-- Field 2: Email must match a valid email format
DEFINE FIELD email ON TABLE user TYPE string ASSERT string::is::email($value);

-- Field 3: Status must be one of the allowed enum values
DEFINE FIELD status ON TABLE user TYPE string ASSERT $value INSIDE ["active", "pending", "suspended"];

-- Successful insert (passes all ASSERT rules)
CREATE user:alice SET age = 25, email = "alice@example.com", status = "active";

-- Failed insert (violates age ASSERT rule -> triggers validation error)
-- CREATE user:bob SET age = 15, email = "bob@example.com", status = "active";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Referencing the Field Name Instead of `$value`

**The mistake:** Writing `ASSERT age >= 18` inside `DEFINE FIELD age`.

**Why it's wrong:** In `DEFINE FIELD`, SurrealDB provides `$value` to represent the incoming field value. Referencing `age` can cause ambiguity or evaluate to `NONE` during creation.

*Incorrect:*
```surrealql
DEFINE FIELD age ON TABLE user TYPE int ASSERT age >= 18;
```

*Fix:*
```surrealql
DEFINE FIELD age ON TABLE user TYPE int ASSERT $value >= 18;
```

### Mistake 2: Forgetting `NONE` and `NULL` Checks on Optional Fields

**The mistake:** Adding `ASSERT $value > 0` on an optional field without allowing `$value = NONE`.

**Why it's wrong:** If a field is optional (`OPTION<int>`), omitted writes pass `$value = NONE`. A strict `$value > 0` check rejects `NONE`, making the field effectively required.

*Incorrect:*
```surrealql
DEFINE FIELD score ON TABLE user TYPE option<int> ASSERT $value > 0;
```

*Fix:*
```surrealql
DEFINE FIELD score ON TABLE user TYPE option<int> ASSERT $value = NONE OR $value > 0;
```

### Mistake 3: Over-complicating `ASSERT` Expressions Instead of Using `TYPE`

**The mistake:** Writing `ASSERT $value = NONE OR type::is::string($value)` to check type safety.

**Why it's wrong:** SurrealDB's `TYPE option<string>` clause automatically handles type safety. `ASSERT` should be reserved for value domain validation.

*Fix:* Combine `TYPE` for type safety with `ASSERT` for business rules:
```surrealql
DEFINE FIELD email ON TABLE user TYPE option<string> ASSERT $value = NONE OR string::is::email($value);
```

---

## 5. Practice Exercises

### Exercise 1: Range Assertion Enforcements

**Scenario:**
An e-commerce system requires that discount percentages applied to products must be strictly between 0 and 100 percent.

**Requirements:**
1. Define table `discount` as `SCHEMAFULL`.
2. Define field `percentage` as `decimal` asserting `$value >= 0.0dec AND $value <= 100.0dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE discount SCHEMAFULL;
> DEFINE FIELD percentage ON TABLE discount TYPE decimal 
>     ASSERT $value >= 0.0dec AND $value <= 100.0dec;
> 
> CREATE discount:d1 SET percentage = 15.0dec;
> ```
>
> #### Technical Explanation
>
> 1. The `ASSERT` clause evaluates a boolean expression whenever the field is created or updated.
> 2. `$value` represents the value being written to the target field during mutation.
> 3. If the expression evaluates to `false`, SurrealDB aborts the transaction with an assertion error.

---

### Exercise 2: String Format Validation Assertions

**Scenario:**
A user registration service validates that user email addresses conform to valid email formatting before committing writes.

**Requirements:**
1. Define field `email` on table `user` as `string`.
2. Add an assertion using `string::is::email($value)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string 
>     ASSERT string::is::email($value);
> 
> CREATE user:u1 SET email = "valid.user@example.com";
> ```
>
> #### Technical Explanation
>
> 1. `string::is::email($value)` performs RFC-compliant email validation on incoming string values.
> 2. Invalid email strings fail write validation automatically at the database level.
> 3. Eliminates duplicate validation logic in client-side application code.

---

### Exercise 3: Cross-Field Logic Assertions

**Scenario:**
An event management system ensures an event's `end_date` is strictly after its `start_date`.

**Requirements:**
1. Define field `end_date` on table `event` asserting `$value > $parent.start_date`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE event SCHEMAFULL;
> DEFINE FIELD start_date ON TABLE event TYPE datetime;
> DEFINE FIELD end_date ON TABLE event TYPE datetime 
>     ASSERT $value > $parent.start_date;
> 
> CREATE event:e1 SET 
>     start_date = d"2026-08-06T10:00:00Z",
>     end_date = d"2026-08-06T12:00:00Z";
> ```
>
> #### Technical Explanation
>
> 1. `$parent` accesses sibling fields on the current record object inside assertion expressions.
> 2. Ensures temporal coherence between related datetime fields.
> 3. Replaces complex SQL trigger functions with concise declarative assertions.

---



## 6. Related Terms

- [`DEFINE FIELD`](define_field.md) — Statement used to define schema fields.
- [Field Assertions](field_assertions.md) — Comprehensive field validation patterns.
- [`SCHEMAFULL` Validation](schemafull_validation.md) — Table-level schema enforcement.

---

## 7. Key Takeaways

- `ASSERT` enforces write-time boolean validation on table fields.
- Use `$value` to reference the incoming field value inside `ASSERT` expressions.
- Optional fields (`OPTION<T>`) require `$value = NONE OR ...` guards inside `ASSERT`.
- Built-in functions (`string::is::email`, `array::len`) work natively inside `ASSERT`.
