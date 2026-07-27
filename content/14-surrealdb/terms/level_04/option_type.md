# `option<T>` (Optional Fields)

> **Level 4 — Schema Definition & Constraints**
> The type wrapper in SurrealDB used inside field definitions to mark a property as optional, allowing it to be omitted (evaluating to `NONE`) without triggering schema validation errors in `SCHEMAFULL` tables.

---

## 1. Prerequisites
- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [`null` vs `NONE`](../level_02/null_none.md) — The absent data states.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the query parser during write transactions. Governs whether a missing key is flagged as a schema violation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard SQL databases (PostgreSQL), all columns exist on every row:
-   If you want a column to be optional, you mark it as `NULL`. 
-   The column space is still reserved, and it defaults to `NULL`.

In schema-full NoSQL collections, you need a way to declare that a field can be completely absent from the JSON record on disk (evaluating to `NONE`):
-   If you define a field simply as `TYPE string` in a `SCHEMAFULL` table, SurrealDB expects that field to be provided on every write. 
-   If you omit it, the validation parser blocks the transaction, treating it as a missing required parameter.

We designed the **`option<T>`** type wrapper to define optional schema properties. 

By wrapping a type (e.g. `option<string>` or `option<int>`), you instruct SurrealDB that the field is **optional**. 

If the application inserts a record and omits this field, SurrealDB accepts the write, and the property is stored as absent (`NONE`) on disk, optimizing storage space.

---

### (2) Required vs. Optional Syntax
-   **Required Field:** `DEFINE FIELD email ON user TYPE string;`
    -   *Rule:* Must be provided on inserts. Cannot be `NONE`.
-   **Optional Field:** `DEFINE FIELD phone ON user TYPE option<string>;`
    -   *Rule:* Can be omitted on inserts. Defaults to `NONE`.

---

### (3) Reality Metaphor (Questionnaire Boxes)
Imagine filling out a customer profile paper form:
-   **Required Field (No Option Wrapper):** A box labeled **"First Name (Required)"**. 
    -   If you leave the box blank, the clerk flags the application, rejects the form, and halts the line.
-   **Optional Field (`option<T>`):** A box labeled **"Middle Name (Optional)"**. 
    -   You can leave the box completely blank. 
    -   The clerk accepts the form anyway, and the box contains no data.

---

### (4) Code Examples

#### Creating Optional Fields in SurrealQL
Let's model a member settings schema:

```sql
DEFINE TABLE member SCHEMAFULL;

-- 1. Required fields (must be provided on insert)
DEFINE FIELD username ON member TYPE string;
DEFINE FIELD email ON member TYPE string;

-- 2. Optional fields (wrapped in option<T>)
DEFINE FIELD middle_name ON member TYPE option<string>;
DEFINE FIELD referral_code ON member TYPE option<string>;

-- This write SUCCEEDS (middle_name and referral_code are omitted):
CREATE member:alice SET
  username = "alice_dev",
  email = "alice@example.com";

-- This write FAILS (email is required but missing!):
CREATE member:bob SET
  username = "bob_dev";
-- Error: "Database validation error: Field 'email' is required..."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining fields that users frequently skip (like 'avatar_url' or 'bio') as standard types without the 'option<T>' wrapper, blocking account creation

**The mistake:** Running `DEFINE FIELD bio ON user TYPE string;` in a `SCHEMAFULL` signup table, and noticing that registrations fail when users leave the biography field blank.

**Why it's wrong:** Without `option<T>`, the type `string` is strictly required. 

If a signup query does not include `bio`, SurrealDB blocks the write, breaking your user onboarding flow.

**Fix: Always wrap profile fields that users can skip in `option<T>` to make them optional:**

```sql
-- CORRECT
DEFINE FIELD bio ON user TYPE option<string>;
```

---



### Mistake 2: Defining Mandatory Non-Null Fields as `TYPE option<T>`

**The mistake:** Defining `DEFINE FIELD email ON TABLE user TYPE option<string>;` when `email` is required.

**Why it's wrong:** `option<T>` explicitly permits the field to be `NONE` (absent). If the field is mandatory, use `TYPE string`.

*Incorrect:*
```surrealql
DEFINE FIELD required_email ON TABLE user TYPE option<string>; // Allows NONE!
```

*Fix:*
```surrealql
DEFINE FIELD required_email ON TABLE user TYPE string; // Strictly required string
```

### Mistake 3: Expecting `option<T>` to Accept Incompatible Types

**The mistake:** Inserting number `123` into `TYPE option<string>` field.

**Why it's wrong:** `option<T>` accepts `NONE` OR type `T` (`string`). It rejects other incompatible data types.

*Incorrect:*
```surrealql
DEFINE FIELD bio ON TABLE user TYPE option<string>;
CREATE user SET bio = 123; // ❌ Type error: Expected option<string>, got number
```

*Fix:*
```surrealql
CREATE user SET bio = "Dev bio"; // Valid string or omit field for NONE
```

## 6. Practice Exercises

### Exercise 1: Optional Type Identification

**Problem:** You have a `products` table configured as `SCHEMAFULL` with this schema:
```sql
DEFINE FIELD title ON products TYPE string;
DEFINE FIELD discount_code ON products TYPE option<string>;
```
State whether each query will **Succeed** or **Fail**, and explain why:
1.  `CREATE products:01 SET title = "Shoes";`
2.  `CREATE products:02 SET discount_code = "SALE10";`

**Expected output:**
```text
1. Succeeds: The required `title` field is supplied, and the optional `discount_code` is omitted (evaluates to `NONE`).
2. Fails: The required `title` field is missing, so the schema validator blocks the insert.
```

> [!check]- Answer
> - Check which fields are marked optional using the `option` keyword wrapper.
> - Required fields must always be present in the query write payload.

---



### Exercise 2: Optional Field Schema Definition

**Problem:** Define optional field `middle_name` on `user` table as `option<string>`.

**Expected output:**
```text
DEFINE FIELD middle_name ON TABLE user TYPE option<string>;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD middle_name ON TABLE user TYPE option<string>;
> ```
>
> **Explanation:** `TYPE option<T>` marks fields as optional, accepting `NONE` or type `T`.

### Exercise 3: Optional Record Link Field

**Problem:** Define optional record link `referrer` on `user` table as `option<record<user>>`.

**Expected output:**
```text
DEFINE FIELD referrer ON TABLE user TYPE option<record<user>>;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD referrer ON TABLE user TYPE option<record<user>>;
> ```
>
> **Explanation:** `option<record<table>>` permits optional foreign record pointers.

## 7. Related Terms
- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [`null` vs `NONE`](../level_02/null_none.md) — The absent data states.

---

## 8. Key Takeaways
- `option<T>` marks a field as optional in `SCHEMAFULL` tables.
- Equivalent to setting a column as nullable in SQL.
- Allows fields to be omitted from write payloads, evaluating to `NONE`.
- Required fields (not wrapped in `option<T>`) throw errors if missing on write.
- Prevents database signup crashes on skipped user profile fields.
- Optimizes storage by omitting absent keys from binary blocks on disk.
- Wrap nested types inside options (e.g. `option<array<string>>`).
