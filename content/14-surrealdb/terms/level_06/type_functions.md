# Type Functions (`type::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for inspecting data types at runtime, constructing Record IDs dynamically, and converting between types (`type::thing()`, `type::is::*()`, `type::table()`, `type::field()`).

---

## 1. Prerequisites
- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [Type Casting & Coercion](../level_02/type_casting.md) — Explicit casting.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed by the query parser and type validator. Analyzes metadata tags attached to binary values in memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Dynamic applications frequently need to inspect or construct data structures at runtime:
- Constructing a Record ID dynamically from variable strings (e.g. joining table name `"user"` and ID string `"alice"` to produce the primitive `record` token `user:alice`).
- Inspecting incoming data types dynamically inside validation triggers or generic functions (e.g. checking if a field is a string before running text functions).
- Extracting table name or ID strings from Record ID tokens.

In PostgreSQL, type checking uses system catalog queries (`pg_typeof()`). In MongoDB, type checks use `$type` aggregation operators.

We designed the **`type::*`** module in SurrealDB to provide a complete type introspection and construction library. Functions like `type::thing(table, id)` allow you to safely build valid Record IDs without risky string concatenation, while `type::is::*` helpers provide clean boolean runtime type checks.

---

### (2) Key Function Categories

#### 1. Record ID Construction & Extraction
- `type::thing(table, id)`: Constructs a native Record ID token (e.g. `type::thing("user", "alice")` $\rightarrow$ `user:alice`).
- `type::table(record_id)`: Extracts the table name string from a Record ID (e.g. `type::table(user:alice)` $\rightarrow$ `"user"`).
- `type::id(record_id)`: Extracts the ID portion string/number from a Record ID (e.g. `type::id(user:alice)` $\rightarrow$ `"alice"`).

#### 2. Runtime Type Inspection (`type::is::*`)
- `type::is::string(val)` / `type::is::number(val)` / `type::is::record(val)`
- `type::is::array(val)` / `type::is::object(val)` / `type::is::datetime(val)`
- Returns `true` if the value matches the target data type.

#### 3. Explicit Type Conversion Helpers
- `type::bool(val)` / `type::int(val)` / `type::string(val)` / `type::datetime(val)`
- Functional alternatives to the prefixed angle-bracket casting operator (`<type> val`).

---

### (3) Reality Metaphor (The ID Badge Machine)
Imagine a security credential desk:
- **`type::thing`:** Taking a blank plastic badge, printing the building name `"user"` on top, stamping the employee name `"alice"` below, and encoding a magnetic chip. It outputs an official, valid **Security Badge Token** (`user:alice`).
- **`type::table`:** Reading an employee's badge and noting down only the building name where they work.
- **`type::is::string`:** A sensor scanning a badge to verify whether it is made of plastic or metal.

---

### (4) Code Examples

#### Using `type::*` Functions in SurrealQL

```sql
-- 1. Constructing Record IDs dynamically from script parameters
LET $tbl = "product";
LET $key = "laptop_100";
LET $target_id = type::thing($tbl, $key); -- Evaluates to primitive token product:laptop_100

SELECT * FROM $target_id;

-- 2. Extracting table and ID components from record links
SELECT 
  id,
  type::table(id) AS table_name,
  type::id(id) AS id_value
FROM user:tobie;
-- Returns: table_name = "user", id_value = "tobie"

-- 3. Runtime type checking inside conditional logic
SELECT 
  title,
  IF type::is::array(tags) THEN array::len(tags) ELSE 0 END AS tag_count
FROM post;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Concatenating strings to construct Record IDs instead of using 'type::thing()', resulting in string types rather than record tokens

**The mistake:** Writing `LET $rec = $tbl + ":" + $id;` expecting `$rec` to be a valid `record` token.

**Why it's wrong:** String concatenation produces a `string` data type (`"user:alice"` with quotes). Passing a string into record link fields or `FROM` targets causes type mismatches and disables direct pointer traversals.

**Fix: Use `type::thing(table, id)` to construct genuine Record ID tokens:**

```sql
-- BAD (creates string "user:alice")
LET $rec = "user" + ":" + "alice";

-- GOOD (creates record token user:alice)
LET $rec = type::thing("user", "alice");
```

---



### Mistake 2: Confusing `type::is::` Inspection Functions with Type Casting `<type>`

**The mistake:** Writing `type::is::number("123")` expecting it to convert the string to a number.

**Why it's wrong:** `type::is::number()` is a boolean inspection function returning `false` for strings! Use `<number> "123"` or `type::number("123")` to perform type conversion.

*Incorrect:*
```surrealql
LET $num = type::is::number("123"); // ❌ Returns false boolean, does NOT convert!
```

*Fix:*
```surrealql
LET $num = <number> "123"; // Performs type conversion to 123
```

### Mistake 3: Using Invalid Type Strings in `type::of()` Comparisons

**The mistake:** Comparing `type::of($val) = "String"` with uppercase string names.

**Why it's wrong:** `type::of()` returns lowercase type names (e.g. `"string"`, `"number"`, `"datetime"`, `"record"`, `"array"`, `"object"`).

*Incorrect:*
```surrealql
IF type::of($val) = "String" { ... }; // ❌ Case mismatch!
```

*Fix:*
```surrealql
IF type::of($val) = "string" { ... }; // Lowercase type string
```

## 6. Practice Exercises

### Exercise 1: Dynamic Record ID Construction

**Problem:** You have two string parameters:
`LET $collection = "customer";`
`LET $code = "99401";`
Write the SurrealQL expression using `type::*` to dynamically construct a Record ID and select that record.

**Expected output:**
```sql
LET $target = type::thing($collection, $code);
SELECT * FROM $target;
```

> [!check]- Answer
> - Construct the ID using `type::thing(table, id)`.
> - Select from the resulting variable.

---



### Exercise 2: Inspecting Value Type with `type::of`

**Problem:** Inspect type of Record ID `user:alice` using `type::of(user:alice)`.

**Expected output:**
```text
"record"
```

> [!check]- Answer
> ```surrealql
> RETURN type::of(user:alice);
> ```
>
> **Explanation:** `type::of(val)` returns the SurrealDB data type string of any value.

### Exercise 3: Type Validation Functions

**Problem:** Validate if `$val` is a valid email using `type::is::email($val)`.

**Expected output:**
```text
type::is::email($val)
```

> [!check]- Answer
> ```surrealql
> RETURN type::is::email($val);
> ```
>
> **Explanation:** `type::is::*` functions inspect and validate value formats.

## 7. Related Terms
- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [Type Casting & Coercion](../level_02/type_casting.md) — Explicit casting.
- [Record ID](../level_01/record_id.md) — Record ID format.

---

## 8. Key Takeaways
- The `type::*` module handles dynamic type inspection, conversion, and construction.
- `type::thing(table, id)` constructs native Record ID tokens safely from strings.
- `type::table(id)` and `type::id(id)` extract component strings from Record IDs.
- `type::is::*()` functions perform runtime boolean type checks.
- Avoid string concatenation when building Record IDs to prevent string/token type bugs.
