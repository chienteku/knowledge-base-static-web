# `null` vs `NONE`

> **Level 2 — Data Types & Record Structure**
> The two distinct missing-value states in SurrealDB: `null` (the field exists in the record but has an empty value) and `NONE` (the field does not exist in the record at all), resolving the SQL ambiguity of absent data.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.
- [`SCHEMAFULL` vs `SCHEMALESS`](../level_01/schemafull_schemaless.md) — The schema constraint context.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Enforced at the storage layer. Dictates how SurrealDB index structures evaluate missing keys in BSON records).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database design, representing "missing" or "empty" data is notoriously ambiguous:
-   **PostgreSQL (SQL):** Uses a single `NULL` value. 
    -   If a column is `NULL`, does it mean: "We asked for the value, but it is empty"? Or does it mean: "The field is not applicable to this record"? 
    -   SQL conflates both concepts.
-   **MongoDB (NoSQL):** Has a distinction. 
    -   A field can be set to `null` (`{ bio: null }`), or the field can be completely missing from the BSON document. 
    -   However, to query if a field is missing, you must write a verbose operator search: `{ bio: { $exists: false } }`.

We designed the distinction between **`null`** and **`NONE`** in SurrealDB to solve this ambiguity natively. 

`null` represents an **empty value** (the property exists, but holds nothing). 

`NONE` represents the **absence of the property** (the field does not exist at all in the document). 

By separating these concepts, you can write precise schema definitions and cleaner queries, distinguishing between "no phone number provided" (`null`) and "this user type does not support phone numbers" (`NONE`).

---

### (2) Comparing null vs. NONE

| State | Definition | SQL Equivalent | MongoDB Equivalent |
| :--- | :--- | :--- | :--- |
| **`null`** | The field **exists** but holds an empty marker. | Column is `NULL` | Field exists: `{ bio: null }` |
| **`NONE`** | The field **does not exist** in the record. | Impossible (all columns exist) | Field is absent (no key on object) |

In `SCHEMAFULL` tables, to allow a field to be omitted (i.e. hold the value `NONE`), you must explicitly mark it as optional using the `option<T>` type wrapper (covered in Level 4). 

If a field is not optional and you omit it from an insert, SurrealDB blocks the write.

---

### (3) Reality Metaphor (Filing Form Boxes)
Imagine filling out a physical application form:
-   **`null` State:** The form has a box labeled **"Middle Name"**. 
    -   You take your pen and explicitly write **`"N/A"`** (Not Applicable) in the box. 
    -   The box exists, and you filled it with a marker indicating "nothing".
-   **`NONE` State:** The form **does not have a box** for "Middle Name" at all. 
    -   The property is completely absent from the paper.

---

### (4) Code Examples

#### Inserting and Querying null vs. NONE
Observe how both states behave in SurrealQL queries:

```sql
-- 1. Create a record with an explicit null value
CREATE user:alice SET
  email = "alice@example.com",
  middle_name = null; // Field exists, but is empty

-- 2. Create a record with a missing field (NONE)
-- (middle_name is omitted entirely)
CREATE user:bob SET
  email = "bob@example.com"; 

-- 3. Query users where the middle_name field explicitly exists but is empty
SELECT * FROM user WHERE middle_name = null; // Returns Alice

-- 4. Query users where the middle_name field does not exist at all
SELECT * FROM user WHERE middle_name = NONE; // Returns Bob

-- 5. Query users where the middle_name has no valid data (matches BOTH null and NONE!)
SELECT * FROM user WHERE middle_name = NONE OR middle_name = null;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Querying for missing fields using '= null' in SurrealQL, missing documents where the field is 'NONE' (absent)

**The mistake:** Running the query `SELECT * FROM user WHERE phone = null` expecting to find users who didn't supply a phone number, when their documents completely omit the `phone` key on disk.

**Why it's wrong:** In SurrealDB, `null` is a specific value. 

If a document has no `phone` key, its value evaluates to `NONE`. 

Since `NONE != null`, the query will ignore the records with absent phone keys, returning incomplete results.

**Fix: Check for both states in your query filters, or use database functions to verify value existence:**

```sql
-- CORRECT (Checks both empty value and absent keys)
SELECT * FROM user WHERE phone = NONE OR phone = null;
```

---



### Mistake 2: Expecting `WHERE field = NULL` to Match Missing `NONE` Fields

**The mistake:** Querying `WHERE bio = NULL` expecting to match records where `bio` key is completely absent (`NONE`).

**Why it's wrong:** In SurrealDB, `NULL` is an explicit assigned null value. `NONE` means the field key does not exist on the record.

*Incorrect:*
```surrealql
-- Misses records where field 'bio' was never assigned
SELECT * FROM user WHERE bio = NULL;
```

*Fix:*
```surrealql
-- Matches both explicit NULL and absent NONE fields
SELECT * FROM user WHERE bio = NULL OR bio = NONE;
-- Or check field absence:
SELECT * FROM user WHERE bio IS NONE;
```

### Mistake 3: Inserting `NONE` Literals in `CONTENT` Object Queries

**The mistake:** Writing `CONTENT { name: "Alice", bio: NONE }` in JSON content payloads.

**Why it's wrong:** `NONE` is a SurrealQL keyword, not a valid JSON primitive! In JSON payloads, omit the key to represent `NONE`.

*Incorrect:*
```surrealql
-- Invalid JSON syntax
CREATE user CONTENT { "name": "Alice", "bio": NONE }; // ❌ Parse error!
```

*Fix:*
```surrealql
-- Omit key for NONE or use SET
CREATE user CONTENT { "name": "Alice" };
```

## 6. Practice Exercises

### Exercise 1: State Evaluation

**Problem:** You insert two records:
`CREATE product:01 SET name = "Laptop", discount = null;`
`CREATE product:02 SET name = "Mouse";`
Evaluate the result (returns **product:01**, **product:02**, **both**, or **neither**) for these queries:
1.  `SELECT * FROM product WHERE discount = null;`
2.  `SELECT * FROM product WHERE discount = NONE;`

**Expected output:**
> [!check]- Answer
> ```text
> 1. product:01 (The field exists and is explicitly set to null).
> 2. product:02 (The discount field is completely absent from product:02, so it evaluates to NONE).
> ```
> - Differentiate between an explicit null assignment and an absent field.
> - Match the filter keyword to the correct record state.

---



### Exercise 2: `IS NONE` and `IS NULL` Field Operators

**Problem:** Query all records in `user` table where `email` is absent using `IS NONE`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM user WHERE email IS NONE;
> ```
> ```surrealql
> SELECT * FROM user WHERE email IS NONE;
> ```
>
> **Explanation:** `IS NONE` tests whether a field key is absent from target records.

---

### Exercise 3: Setting Field to NONE

**Problem:** Remove field `temporary_token` from `user:alice` by setting it to `NONE`.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE user:alice SET temporary_token = NONE;
> ```
> ```surrealql
> UPDATE user:alice SET temporary_token = NONE;
> ```
>
> **Explanation:** Setting a field to `NONE` deletes the field key from the record.

## 7. Related Terms

- [`SCHEMAFULL` vs `SCHEMALESS`](../level_01/schemafull_schemaless.md) — The schema constraint context.
- [`option<T>` (Optional Fields)](../level_04/option_type.md) — Optional fields wrapper.

---

## 8. Key Takeaways
- `null` indicates an existing empty field; `NONE` indicates a completely missing field.
- Solves the SQL ambiguity of whether `NULL` means empty or missing.
- In schema-full tables, missing fields evaluate to `NONE`.
- To allow `NONE` in schema-full fields, wrap the type in `option<T>`.
- `WHERE field = null` only matches fields explicitly set to null.
- `WHERE field = NONE` matches records where the key is absent.
- Check for both states to write safe queries for un-populated fields.
