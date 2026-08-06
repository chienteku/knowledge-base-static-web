# Type Casting & Coercion

> **Level 2 — Data Types & Record Structure**
> The type conversion mechanisms in SurrealDB, comparing explicit casting (using `<type>` angle bracket syntax), implicit coercion (automatic type alignment in schemas), and the built-in `type::*` function family.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (explicit type coercion operators)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In database applications, data inputs frequently arrive in different shapes:
-   API clients submit JSON requests where numbers are formatted as strings (for example, `"45"` instead of `45`).
-   You need to convert raw string values to `datetime` types to perform duration arithmetic.
-   You need to construct a dynamic Record ID (`user:john`) from text parameters inside a script.

In PostgreSQL, you convert types using `CAST(val AS type)` or `val::type`. 

In MongoDB, you write `$convert` operators inside aggregation pipelines.

We designed **Type Casting & Coercion** in SurrealDB to simplify these conversions. 

SurrealQL provides a clean, prefix-style casting operator (`<type>`) and a built-in library of conversion functions (`type::*`). 

Furthermore, if a table field has a declared type, SurrealDB automatically **coerces** (implicitly converts) compatible incoming inputs (like casting the string `"100"` to an integer `100`), preventing validation errors and keeping your backend API code clean.

---

### (2) The Conversion Methods

#### 1. Explicit Casting Syntax
Wrap the target type in angle brackets before the value:
-   `<int> "42"` $\rightarrow$ Returns integer `42`.
-   `<string> 150` $\rightarrow$ Returns string `"150"`.
-   `<datetime> "2026-07-21T15:30:00Z"` $\rightarrow$ Returns `d"2026-07-21T15:30:00Z"`.

#### 2. Implicit Coercion (Automatic Alignment)
If a field is defined as `TYPE int` in a schema, writing the string `"42"` will succeed: SurrealDB recognizes the type compatibility, automatically casts it to `42`, and saves it as an integer on disk.

#### 3. Type Conversion Functions (`type::*`)
SurrealDB provides functions for explicit conversions:
-   `type::number("42.5")` $\rightarrow$ Returns number `42.5`.
-   **`type::thing("user", "john")`:** Constructs a Record ID dynamically, returning the `record` token `user:john`.

---

### (3) Reality Metaphor (Token Acceptors)
-   **Implicit Coercion:** A **Vending Machine Coin Slot**. 
    -   If you drop in a ticket token wrapped in a paper sleeve (`"42"` string), the validator automatically slides the paper sleeve off, extracts the clean metal coin (integer `42`), and processes the sale.
-   **Explicit Casting:** A **Shape Mold Press**. 
    -   You place raw clay (a string) inside the star-shaped press labeled `<uuid>`, push the lever, and it pops out a hardened ceramic star block (UUID type).

---

### (4) Code Examples

#### Explicit Casting and Coercion in SurrealQL
Observe how values are converted:

```sql
-- 1. Explicit casting examples
SELECT
  <int> "105" AS integer_val,         -- Returns: 105
  <string> true AS string_val,        -- Returns: "true"
  <datetime> "2026-07-21" AS date_val; -- Returns: d"2026-07-21T00:00:00Z"

-- 2. Construct a Record ID dynamically inside a script
-- (Useful for routing variables!)
LET $table_name = "user";
LET $user_id = "john";
LET $record_id = type::thing($table_name, $user_id); // Returns: user:john

SELECT * FROM $record_id;

-- 3. Implicit Coercion in Schemas
DEFINE TABLE member SCHEMAFULL;
DEFINE FIELD points ON member TYPE int;

-- This write succeeds (SurrealDB automatically coerces "10" to 10!)
CREATE member:alice SET points = "10";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use PostgreSQL-style double-colon '::' syntax for type casting in SurrealQL queries, triggering compiler errors

**The mistake:** Writing `SELECT "42"::int;` to cast a string, expecting PostgreSQL syntax compatibility.

**Why it's wrong:** SurrealQL does not support the relational double-colon (`::`) type-casting operator. 

Executing it will trigger a query compiler parsing exception.

**Fix: Always use the angle brackets syntax (`<type>`) prefixed before the value:**

```sql
-- BAD
SELECT "42"::int;

-- GOOD
SELECT <int> "42";
```

---



### Mistake 2: Casting Un-Parseable Strings to Numeric Primitives

**The mistake:** Executing `<number> "invalid_text"`.

**Why it's wrong:** Casting non-numeric strings to number primitives throws a runtime casting error.

*Incorrect:*
```surrealql
RETURN <number> "abc"; // ❌ Runtime error: Failed to cast 'abc' to number
```

*Fix:*
```surrealql
IF type::is::number(val) { RETURN <number> val; } ELSE { RETURN 0; };
```

### Mistake 3: Using Function Syntax `type::cast()` for Bracket Type Casts

**The mistake:** Writing `type::cast("number", "123")` expecting `<number>` casting.

**Why it's wrong:** SurrealQL uses angle brackets `<type>` for explicit type casting (e.g. `<number> "123"` or `<datetime> "2026-01-01"`).

*Incorrect:*
```surrealql
-- Incorrect syntax attempt
RETURN cast("123", "number");
```

*Fix:*
```surrealql
RETURN <number> "123"; // Correct angle bracket type casting
```

## 5. Practice Exercises

### Exercise 1: Explicit Number and Date Casting

**Scenario:**
An API integration receives raw string inputs from web form payloads (e.g. `"150"`, `"2026-08-06T00:00:00Z"`) and casts them to native `int` and `datetime` types.

**Requirements:**
1. Cast string `"150"` to `<int>`.
2. Cast string `"2026-08-06T00:00:00Z"` to `<datetime>`.
3. Return the cast values in a `SELECT` expression.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     <int> "150" AS quantity,
>     <datetime> "2026-08-06T00:00:00Z" AS created_at;
> ```
>
> #### Technical Explanation
>
> 1. `<type> value` explicitly coerces values into target SurrealDB data types.
> 2. Coerces raw string inputs into typed integer and datetime representations.
> 3. Ensures data payload type alignment before database insertion.
> 
---

### Exercise 2: Casting Record ID Strings to Record Links

**Scenario:**
An incoming HTTP JSON payload contains a raw string `"user:alice"`. You need to cast it to a typed `<record>` link pointer when creating a `post` record.

**Requirements:**
1. Cast string `"user:alice"` to `<record<user>>` inside a `CREATE` statement.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> 
> -- Cast string ID to typed record pointer
> CREATE post:p1 SET title = "Type Casting in SurrealDB", author = <record<user>> "user:alice";
> ```
>
> #### Technical Explanation
>
> 1. `<record<table>> "table:id"` converts raw string representations into typed record link pointers.
> 2. Enables pointer resolution and graph traversals for raw string API inputs.
> 3. Bridges external REST payload inputs with internal record link architectures.
> 
---

### Exercise 3: Coercion Error Handling with Safe Casting

**Scenario:**
Demonstrate what happens when an invalid string `"abc"` is cast to `<int>`.

**Requirements:**
1. Attempt to execute `SELECT <int> "abc";`.
2. Observe the conversion error returned by SurrealDB.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- This query will FAIL with a type conversion error:
> -- "Could not convert 'abc' to int"
> SELECT <int> "abc";
> ```
>
> #### Technical Explanation
>
> 1. Explicit casting fails gracefully with a query error if the source value cannot be converted.
> 2. Protects database fields from receiving corrupted or invalid data types.
> 3. Use `type::is::int()` to check conversion safety prior to casting when handling untrusted user input.
> 
---



## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Functions (`type::*`)](../level_06/type_functions.md) — Introspection library.
- [`bool`](bool.md) — Related concept: `bool`.
- [`int` / `float` / `decimal`](number_types.md) — Related concept: `int` / `float` / `decimal`.
- [`string`](string.md) — Related concept: `string`.

---

## 7. Key Takeaways
- Explicit casting uses prefixed angle brackets (e.g. `<type> value`).
- Does not support PostgreSQL's double-colon (`::`) type-cast syntax.
- Coercion automatically converts compatible values to schema-defined types.
- `type::*` functions handle runtime type conversions inside queries.
- `type::thing(table, id)` dynamically constructs a valid Record ID token.
- Explicit casting to `<datetime>` converts strings to UTC timestamps.
- Mismatched, incompatible casts (like casting `"hello"` to `<int>`) return `NONE` or fail.
