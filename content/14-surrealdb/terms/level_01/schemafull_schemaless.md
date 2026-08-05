# `SCHEMAFULL` vs `SCHEMALESS`

> **Level 1 — What Is SurrealDB?**
> The table-level configuration toggle that controls data validation: `SCHEMAFULL` enforces strict SQL-like schemas (rejecting undefined fields), while `SCHEMALESS` allows dynamic MongoDB-like flexibility (accepting any unstructured JSON shape).

---

## 1. Prerequisites

- [Table](table.md) — The parent records collection.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Declared using `DEFINE TABLE` queries. Enforced by the database engine parser during write transactions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases (like PostgreSQL) are strictly schema-full:
-   If you rename or add a column, you must run DDL migrations first.
-   This provides high data integrity but slows down development when requirements change.

Document databases (like MongoDB) are schema-less:
-   You can write any document shape on the fly.
-   This enables rapid development, but data consistency can drift, resulting in corrupted or missing fields.

We designed the **`SCHEMAFULL` vs `SCHEMALESS`** toggle in SurrealDB to combine the benefits of both paradigms in a single database. 

Instead of forcing a single schema model globally, SurrealDB allows you to choose the schema level table-by-table. 

You can run critical invoicing tables in strict `SCHEMAFULL` mode while keeping logging tables flexible in `SCHEMALESS` mode, matching the constraints to the business risk.

---

### (2) The Two Schema Modes

```mermaid
graph TD
    A["Table Schema Selection"] --> B["SCHEMALESS (Default Mode)"]
    A --> C["SCHEMAFULL (Strict Mode)"]

    B --> B1["Accepts any fields and objects dynamic writes"]
    B --> B2["Defined fields are validated; others bypass checks"]
    
    C --> C1["Requires DEFINE FIELD queries first"]
    C --> C2["Blocks and rejects any writes with undefined fields"]
```

#### 1. `SCHEMALESS` (Default Mode)
-   **Behavior:** Tables are schema-less by default. You can insert any JSON key-value pair.
-   **Hybrid Feature:** If you use `DEFINE FIELD` on a `SCHEMALESS` table, SurrealDB will **validate those specific fields**, but will still accept any other undefined fields you insert.

#### 2. `SCHEMAFULL` (Strict Mode)
-   **Behavior:** Enforces strict validation. You must define the table and all its allowed fields using `DEFINE FIELD` commands before inserting data.
-   **Rejection:** If a query tries to write an undefined field, SurrealDB blocks the write transaction and throws an error.

---

### (3) Reality Metaphor (Forms vs. Blank Cards)
-   **`SCHEMAFULL` Table:** A **Government Visa Application Form**. 
    -   It has pre-printed boxes for First Name, Last Name, and Passport Number. 
    -   If you draw a doodle in the margins or write your favorite band's name, the officer rejects the form. Only defined boxes are allowed.
-   **`SCHEMALESS` Table:** A **Blank Post-it Note**. 
    -   You can write your name, list shopping items, draw a doodle, or leave it blank. 
    -   The card accepts whatever you put on it.

---

### (4) Code Examples

#### Enforcing Schema Modes in SurrealQL
Let's see how both modes behave side-by-side:

```sql
-- ==========================================
-- SCENARIO A: SCHEMALESS TABLE (Flexible)
-- ==========================================
DEFINE TABLE profile SCHEMALESS;
DEFINE FIELD username ON profile TYPE string;

-- This write succeeds (username is validated as string; fav_color is accepted dynamically):
CREATE profile:alice SET username = "Alice", fav_color = "red";


-- ==========================================
-- SCENARIO B: SCHEMAFULL TABLE (Strict SQL)
-- ==========================================
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD balance ON account TYPE decimal;

-- This write succeeds (balance is defined):
CREATE account:acc01 SET balance = 150.00;

-- This write FAILS (status is NOT defined on the table!):
CREATE account:acc02 SET balance = 15.50, status = "active";
-- Resulting Error: "Database index/validation error: Field 'status' is not defined..."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining a table as 'SCHEMAFULL' but forgetting to write 'DEFINE FIELD' commands, causing all subsequent inserts to fail

**The mistake:** Running `DEFINE TABLE logs SCHEMAFULL;` and trying to insert records immediately: `CREATE logs SET time = time::now();`.

**Why it's wrong:** Under `SCHEMAFULL` rules, any field not explicitly defined by a `DEFINE FIELD` command is blocked. 

If you do not define any fields, the table will reject all writes, making it impossible to insert data.

**Fix: When creating a `SCHEMAFULL` table, always write the corresponding `DEFINE FIELD` statements for every field your application expects to save.**

---



### Mistake 2: Expecting `SCHEMAFULL` Tables to Accept Un-Defined Fields

**The mistake:** Inserting `{ name: "Alice", age: 30 }` into a `SCHEMAFULL` table where `age` field was not defined via `DEFINE FIELD`.

**Why it's wrong:** `SCHEMAFULL` tables strictly reject any field that has not been explicitly declared with `DEFINE FIELD`.

*Incorrect:*
```surrealql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user TYPE string;
-- Inserting un-declared age field:
CREATE user SET name = "Alice", age = 30; // ❌ Field 'age' ignored or rejected!
```

*Fix:*
```surrealql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user TYPE string;
DEFINE FIELD age ON user TYPE number; // Explicitly define age field
CREATE user SET name = "Alice", age = 30;
```

### Mistake 3: Assuming `SCHEMALESS` Tables Cannot Use `DEFINE FIELD` Validation Rules

**The mistake:** Thinking `SCHEMALESS` tables forbid defining type assertions or constraints on specific fields.

**Why it's wrong:** `SCHEMALESS` tables allow extra arbitrary fields while still enforcing `DEFINE FIELD` assertions on fields that ARE explicitly defined.

*Incorrect:*
```surrealql
-- Assuming SCHEMALESS cannot validate specific fields
```

*Fix:*
```surrealql
DEFINE TABLE user SCHEMALESS;
DEFINE FIELD email ON user TYPE string ASSERT is::email($value); // Validates email on flexible table!
```

## 6. Practice Exercises

### Exercise 1: Write Logic Diagnosis

**Problem:** You have configured a SurrealDB database with this schema:
```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
```
State whether each query will **Succeed** or **Fail**, and explain why:
1.  `CREATE user:01 SET email = "bob@mail.com";`
2.  `CREATE user:02 SET email = "alice@mail.com", age = 30, city = "Paris";`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Succeeds: The `email` field is defined on the schema, and `age` is omitted (missing fields are accepted as `NONE` in SurrealDB unless marked as required).
> 2. Fails: The table is `SCHEMAFULL`, and `city` is not defined on the schema, so SurrealDB blocks the write.
> ```
> - Check which fields are defined on the `user` table.
> - Consider if any undefined fields are present in the query inputs.

---



### Exercise 2: Toggling Table Schema Modes

**Problem:** Define table `product` as `SCHEMAFULL` and table `log` as `SCHEMALESS`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE TABLE product SCHEMAFULL; DEFINE TABLE log SCHEMALESS;
> ```
> ```surrealql
> DEFINE TABLE product SCHEMAFULL;
> DEFINE TABLE log SCHEMALESS;
> ```
>
> **Explanation:** `SCHEMAFULL` enforces strict schema rules; `SCHEMALESS` permits flexible document fields.

---

### Exercise 3: Default Table Schema Behavior

**Problem:** What is the default schema mode when creating a table without `SCHEMAFULL` or `SCHEMALESS` modifiers? (`SCHEMALESS`).

**Expected output:**
> [!check]- Answer
> ```text
> SCHEMALESS
> ```
> ```text
> SCHEMALESS
> ```
>
> **Explanation:** Tables in SurrealDB default to `SCHEMALESS` document flexibility.

## 7. Related Terms

- [Table](table.md) — The parent records collection.
- [`DEFINE FIELD`](../level_04/define_field.md) — Setting field rules.
- [`null` vs `NONE`](../level_02/null_none.md) — Related concept: `null` vs `NONE`.
- [`DEFINE TABLE`](../level_04/define_table.md) — Related concept: `DEFINE TABLE`.

---

## 8. Key Takeaways
- `SCHEMALESS` allows dynamic fields; `SCHEMAFULL` enforces strict schemas.
- Tables are `SCHEMALESS` by default in SurrealDB.
- `SCHEMAFULL` tables reject any writes containing undefined fields.
- `SCHEMALESS` tables validate defined fields but accept undefined ones.
- Choose `SCHEMAFULL` for critical production transaction tables.
- Use `SCHEMALESS` for rapid prototyping or polymorphic metrics logs.
- Enforce schemas table-by-table in the same database.
