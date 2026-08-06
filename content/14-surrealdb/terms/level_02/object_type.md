# `object`

> **Level 2 — Data Types & Record Structure**
> The container data type in SurrealDB used to store nested key-value dictionaries within a record, serving as the direct equivalent to a PostgreSQL `JSONB` object or a MongoDB embedded document.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (nested JSON object dictionary type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database design (PostgreSQL), data must be normalized (split into flat tables). 

If a user has a billing address and a shipping address:
-   You must create a separate `addresses` table.
-   You link it with foreign keys and join the tables on every query.
-   This flat tabular model makes representing hierarchical data slow and complex.

In MongoDB, document nesting is a first-class feature: you save nested JSON objects directly inside documents.

We designed the **`object`** type in SurrealDB to support this hierarchical document nesting. 

Instead of creating separate tables and joins for auxiliary details, you can store structured key-value dictionaries directly inside a record. 

This keeps related data together in a single read request, improving query speed and matching the natural data nesting patterns of frontend JSON APIs.

---

### (2) Querying Objects using Dot Notation
To query fields nested inside an object, SurrealQL uses standard JavaScript-like **Dot Notation**:
-   `SELECT address.city FROM user;`
-   This extracts the specific sub-field value without returning the entire parent object, saving network bandwidth.

---

### (3) Reality Metaphor (Zippered Compartments)
Imagine packing a travel bag:
-   **Flat SQL Rows:** A flat **Filing Folder**. 
    -   You lay documents side-by-side. 
    -   You cannot place a small box or a pencil case inside a single paper sheet; everything must sit in its own flat folder.
-   **SurrealDB `object`:** A **Backpack with Zippered Compartments**. 
    -   The backpack is the main record. 
    -   Inside, you have a zippered compartment labeled "Address" (the object). 
    -   Inside that compartment, you store a city name and a zip code. 
    -   It is a nested container organizing sub-items.

---

### (4) Code Examples

#### Creating and Querying Objects
Let's model a user contact card:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Declare a field as an object container
DEFINE FIELD name ON user TYPE object;

-- 2. Define the sub-properties inside the name object (dot notation!)
DEFINE FIELD name.first ON user TYPE string;
DEFINE FIELD name.last ON user TYPE string;

-- 3. Insert a record with nested object structures
CREATE user:john SET
  name = {
    first: "John",
    last: "Doe"
  };

-- 4. Query specific fields inside the nested object
SELECT name.first, name.last FROM user WHERE name.first = "John";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Defining a field as 'TYPE object' in a schema-full table, but forgetting to define its sub-properties, leaving the nested fields un-validated

**The mistake:** Running `DEFINE FIELD address ON user TYPE object;` in a `SCHEMAFULL` table and assuming SurrealDB will enforce type validation on `address.zip_code` automatically.

**Why it's wrong:** If you only define `TYPE object`, SurrealDB validates that the field is indeed a JSON dictionary, but it behaves as a **schema-less container**. 

Users can write any keys with any data types inside that object (for example, saving a string for `zip_code` in one record, and an array in another).

**Fix: To secure nested data, always write dot-notation `DEFINE FIELD` statements for each sub-property you expect the object to store:**

```sql
-- CORRECT NESTED VALIDATION
DEFINE FIELD address ON user TYPE object;
DEFINE FIELD address.city ON user TYPE string;
DEFINE FIELD address.zip_code ON user TYPE int;
```

---



### Mistake 2: Accessing Missing Nested Object Fields without Guarding or Futures

**The mistake:** Querying `SELECT metadata.config.theme FROM user;` when `config` object is `NONE`.

**Why it's wrong:** Accessing properties on missing `NONE` nested objects evaluates to `NONE`. Guard nested lookups or use optional chaining in client SDKs.

*Incorrect:*
```surrealql
-- When settings is NONE
SELECT settings.theme FROM user; // Returns NONE without error
```

*Fix:*
```surrealql
SELECT settings.theme AS theme FROM user WHERE settings IS NOT NONE;
```

### Mistake 3: Attempting Relational Normalization on Flexible Object Documents

**The mistake:** Splitting small closely-bound user settings into 5 separate relational tables.

**Why it's wrong:** SurrealDB objects support arbitrary nested document trees. Store closely-bound configuration state directly as nested object fields.

*Incorrect:*
```surrealql
-- Relational table splitting anti-pattern
CREATE user_setting_1 CONTENT { ... };
CREATE user_setting_2 CONTENT { ... };
```

*Fix:*
```surrealql
-- Native document nesting
UPDATE user:alice SET settings = { theme: "dark", notifications: true };
```

## 5. Practice Exercises

### Exercise 1: Nested Object Property Extraction

**Scenario:**
A user management system stores user address details inside a nested `address` object `{ street: "123 Main St", city: "Austin", zip: "78701" }`.

**Requirements:**
1. Create user `user:u1` with nested object `address`.
2. Query user `user:u1` extracting only `address.city` and `address.zip` using dot-notation.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET 
>     name = "Alice",
>     address = {
>         street: "123 Main St",
>         city: "Austin",
>         zip: "78701"
>     };
> 
> -- Extract nested object properties
> SELECT address.city, address.zip FROM user:u1;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`address.city`) extracts nested object properties directly without unnesting.
> 2. `object` types store structured key-value dictionaries inside SurrealDB records.
> 3. Combines document store flexibility with SQL selection semantics.

---

### Exercise 2: Defining Rigid vs Flexible Object Schemas

**Scenario:**
You need to define a `SCHEMAFULL` table `profile` with a strict `settings` object where only `theme` (`string`) and `notifications` (`bool`) keys are permitted.

**Requirements:**
1. Define table `profile` in `SCHEMAFULL` mode.
2. Define field `settings` as `object`.
3. Define field `settings.theme` as `string`.
4. Define field `settings.notifications` as `bool`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE profile SCHEMAFULL;
> DEFINE FIELD settings ON TABLE profile TYPE object;
> DEFINE FIELD settings.theme ON TABLE profile TYPE string;
> DEFINE FIELD settings.notifications ON TABLE profile TYPE bool;
> 
> CREATE profile:p1 SET settings = { theme: "dark", notifications: true };
> ```
>
> #### Technical Explanation
>
> 1. Defining sub-fields with dot-notation (`settings.theme`) enforces strict validation rules on nested object keys.
> 2. `SCHEMAFULL` mode rejects unapproved keys inside the nested object.
> 3. Provides deep schema safety for complex nested document structures.

---

### Exercise 3: Merging Deep Nested Object Keys

**Scenario:**
Update a user's notification preference inside `settings.notifications` without overwriting the existing `settings.theme` property.

**Requirements:**
1. Update `profile:p1` setting `settings.notifications = false` using dot-notation assignment.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Update specific nested key directly
> UPDATE profile:p1 SET settings.notifications = false;
> 
> SELECT * FROM profile:p1;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation assignment (`SET settings.notifications = false`) mutates targeted nested properties atomically.
> 2. Preserves all other sibling keys (`settings.theme`) intact within the object.
> 3. Eliminates full-document fetch-modify-replace cycles required by traditional document databases.

---



## 6. Related Terms


- [SurrealDB](../level_01/surrealdb.md)
- [Destructuring & Object Notation in SELECT](../level_06/destructuring_select.md) — Related concept: Destructuring & Object Notation in SELECT.

---

## 7. Key Takeaways
- The `object` type stores nested key-value dictionaries inside records.
- Direct NoSQL equivalent to PostgreSQL's `JSONB` and MongoDB's embedded documents.
- Query nested object values using standard Dot Notation (e.g. `object.field`).
- Under `SCHEMAFULL` tables, declare sub-fields using dot notation to validate keys.
- If sub-fields are not defined, the object accepts any keys dynamically.
- Eliminates the need to build separate relational tables for helper fields.
- Objects can contain nested arrays, and arrays can contain nested objects.
