# `DEFINE FIELD`

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to configure schemas and types for specific record fields on a table, supporting nested dot-notation paths and field-level permissions.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [Data Types (Overview)](../level_02/data_types.md) — The type definitions.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the schema level. Compiled constraints are checked in server memory during write transaction phases).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In SQL databases (PostgreSQL), columns are defined inside the `CREATE TABLE` statement. 
-   This works for simple tables. 
-   However, if you want to add columns, write separate validation constraints, or set different permissions per column, managing the schema becomes difficult.

In MongoDB, document validation requires writing complex JSON schemas.

We designed the **`DEFINE FIELD`** statement in SurrealQL to provide a modular, granular schema builder. 

Instead of writing a single, massive table definition query, you declare fields one-by-one. 

This keeps schema updates clean. 

It supports dot-notation nested paths, maps strict data types (like `TYPE array<string>`), and allows you to write access permissions for individual fields, providing field-level security out of the box.

---

### (2) Field-Level Security
You can restrict access to specific fields using the `PERMISSIONS` clause on the field declaration:
`DEFINE FIELD social_security ON user TYPE string PERMISSIONS FOR select WHERE id = $auth.id;`
-   *Result:* Other users can query the `user` table and see names, but only the owner can retrieve their own social security field!

---

### (3) Reality Metaphor (Filing Dividers)
Imagine organizing folders inside a cabinet drawer (table):
-   **`DEFINE FIELD`:** Installing a **Physical Divider Partition** inside the drawer.
    -   You label the slot **`age`** `ON user`.
    -   You write a rule on the divider slot: **`TYPE int`**. 
    -   Only whole numbers are allowed inside this slot. 
    -   If you try to drop a pair of keys (an object) or a letter (a string) into the slot, the divider's guide blocks it.

---

### (4) Code Examples

#### Defining Fields in SurrealQL
Let's build a complete member details schema:

```sql
DEFINE TABLE member SCHEMAFULL;

-- 1. Define standard primitive fields
DEFINE FIELD username ON member TYPE string;
DEFINE FIELD points ON member TYPE int;

-- 2. Define nested properties inside a settings object (dot notation!)
DEFINE FIELD settings ON member TYPE object;
DEFINE FIELD settings.theme ON member TYPE string;
DEFINE FIELD settings.marketing ON member TYPE bool;

-- 3. Define a field with field-level permissions (SSN field)
-- Only the owner can view this field!
DEFINE FIELD ssn ON member TYPE string
  PERMISSIONS FOR select WHERE id = $auth.id;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the 'ON' or 'ON TABLE' keywords in the field definition statement, triggering compiler syntax errors

**The mistake:** Writing the query `DEFINE FIELD username TYPE string;` to configure a user profile.

**Why it's wrong:** In SurrealQL, fields do not float globally. 

They must be anchored to a specific table. 

Omitting the `ON` table link causes the query compiler to throw syntax parsing errors.

**Fix: Always specify the target table using the `ON <table>` or `ON TABLE <table>` clauses:**

```sql
-- BAD
DEFINE FIELD username TYPE string;

-- GOOD
DEFINE FIELD username ON user TYPE string;
```

---



### Mistake 2: Omitting Table Name in `DEFINE FIELD` Statements

**The mistake:** Writing `DEFINE FIELD email TYPE string;` (SyntaxError).

**Why it's wrong:** `DEFINE FIELD` requires specifying the target table name via `ON TABLE table_name`.

*Incorrect:*
```surrealql
DEFINE FIELD email TYPE string; // ❌ Parse error: missing ON TABLE
```

*Fix:*
```surrealql
DEFINE FIELD email ON TABLE user TYPE string; // Specifies target table 'user'
```

### Mistake 3: Confusing `TYPE option<string>` with `TYPE string` in Required Fields

**The mistake:** Defining a mandatory field as `TYPE option<string>`.

**Why it's wrong:** `option<T>` allows the field to be `NONE` (optional). If the field is strictly required, use `TYPE string`.

*Incorrect:*
```surrealql
DEFINE FIELD required_name ON TABLE user TYPE option<string>; // Allows NONE!
```

*Fix:*
```surrealql
DEFINE FIELD required_name ON TABLE user TYPE string; // Strictly required non-none field
```

## 6. Practice Exercises

### Exercise 1: Field Definition Construction

**Problem:** You are defining a schema for a `post` table. 
Write the SurrealQL commands to:
1.  Define the table `post` as `SCHEMAFULL`.
2.  Define a field `title` of type `string`.
3.  Define a field `ratings` as an array of decimals (`decimal`).

**Expected output:**
```sql
DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD ratings ON post TYPE array<decimal>;
```

> [!check]- Answer
> - Anchored field statements require the `ON` keyword pointing to the `post` table.
> - Declare container arrays with type arguments: `array<T>`.

---



### Exercise 2: Defining Field with Default and Assertion

**Problem:** Define field `created_at` on `article` as `datetime` defaulting to `time::now()`.

**Expected output:**
```text
DEFINE FIELD created_at ON TABLE article TYPE datetime DEFAULT time::now();
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD created_at ON TABLE article TYPE datetime DEFAULT time::now();
> ```
>
> **Explanation:** `DEFAULT` sets initial values when fields are omitted during creation.

### Exercise 3: Defining Record Link Field

**Problem:** Define field `author` on `post` table as record link to `user` table.

**Expected output:**
```text
DEFINE FIELD author ON TABLE post TYPE record<user>;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD author ON TABLE post TYPE record<user>;
> ```
>
> **Explanation:** `TYPE record<table>` enforces foreign record link pointers.

## 7. Related Terms
- [`DEFINE TABLE`](define_table.md) — The parent schema context.
- [`option<T>` (Optional Fields)](option_type.md) — Optional fields wrapper.
- [Assertions (`ASSERT`)](field_assertions.md) — Custom field validation.

---

## 8. Key Takeaways
- `DEFINE FIELD` declares validation rules and types for record properties.
- Relational equivalent to defining table columns; NoSQL equivalent to schema validation.
- Fields are defined individually and anchored using the `ON` keyword.
- Supports dot-notation paths to validate nested object properties.
- Field-level permissions (`PERMISSIONS`) provide granular access controls.
- Schema-full tables reject writes to fields that are not explicitly defined.
- Field types support parameter arguments (like `array<string>`).
