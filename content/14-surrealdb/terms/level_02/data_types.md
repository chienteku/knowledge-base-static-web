# Data Types (Overview)

> **Level 2 — Data Types & Record Structure**
> The unified type system of SurrealDB, serving as a rich superset that combines the strict type safety of PostgreSQL with the flexible document nesting structures of MongoDB.

---

## 1. Prerequisites
- [Record](../level_01/record.md) — The storage context.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Enforced during query parsing on write operations. Prevents data corruption by validating types before writing BSON key blocks to disk).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases (like PostgreSQL) have rigid type systems. 

While this prevents bugs, columns cannot easily hold arrays or sub-objects, making nesting difficult. 

NoSQL document databases (like MongoDB) support objects and arrays, but they are schema-flexible, allowing database properties to drift and corrupt application logic.

We designed the **SurrealDB Type System** to bridge these paradigms. 

It is a strict, strongly-typed system. 

It supports standard SQL primitives (like integers, decimals, and strings) and NoSQL container shapes (like objects, arrays, and sets). 

Furthermore, it introduces native relational data types—like **Record Links** (representing direct pointers to other records)—allowing you to define strict schemas that validate nested documents and references automatically at the engine layer.

---

### (2) The Data Type Landscape
SurrealDB data types are classified into five major groups:

```mermaid
graph TD
    A["SurrealDB Data Types"] --> B["Primitives"]
    A --> C["Temporal"]
    A --> D["Containers"]
    A --> E["References"]
    A --> F["Special States"]

    B --> B1["string, int, float, decimal, bool, uuid"]
    C --> C1["datetime, duration"]
    D --> D1["object, array, set"]
    E --> E1["record (table:id pointers), geometry, bytes"]
    F --> F1["null (empty value), NONE (missing property)"]
```

1.  **Primitives:** `string`, `int`, `float`, `decimal` (exact numbers), `bool`, `uuid`.
2.  **Temporal:** `datetime` (ISO timestamps), `duration` (e.g., `7d` or `1h30m`).
3.  **Containers:** `object` (nested JSON), `array` (ordered list), `set` (unique list).
4.  **References:** `record` (pointers to specific tables like `record<user>`), `geometry` (GeoJSON maps).
5.  **Special States:** `null` (field exists with empty value), `NONE` (field is completely absent).

---

### (3) Reality Metaphor (Modular Sorting Trays)
Imagine sorting items for shipping:
-   **PostgreSQL (Rigid Slots):** A tray with pre-cut, non-adjustable plastic slots. 
    -   You have a round slot for coins and a thin slot for cards. 
    -   You cannot place a bulky package or attach secondary boxes.
-   **MongoDB (Empty Box):** A wide cardboard box. 
    -   You toss everything inside. 
    -   It is flexible, but items roll around and get damaged.
-   **SurrealDB (Modular Container Organizer):** 
    -   It has standard slots for coins and cards (primitives).
    -   It has adjustable slider dividers for bulky items (objects and arrays).
    -   It has a built-in magnetic snap-mount to lock a tracking label (`record` link) directly onto the box, linking it to another container.

---

### (4) Code Examples

#### Declaring Typed Fields in SurrealQL
To enforce the type system, you write field definitions using the `TYPE` parameter:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Primitive types
DEFINE FIELD name ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD active ON user TYPE bool;

-- 2. Container types (with nested type parameters!)
DEFINE FIELD settings ON user TYPE object;
DEFINE FIELD tags ON user TYPE array<string>; // Array holding only strings

-- 3. Temporal and Pointer types
DEFINE FIELD created_at ON user TYPE datetime;
DEFINE FIELD manager ON user TYPE record<user>; // Link pointing to another user record
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming SurrealDB does not validate types in 'SCHEMALESS' tables

**The mistake:** Thinking that because a table is configured as `SCHEMALESS`, you can write mismatched types to defined fields, assuming "schema-less ignores types."

**Why it's wrong:** In SurrealDB, `SCHEMALESS` only means you can write **undefined** fields. 

If you explicitly define a field's type using the `DEFINE FIELD` command, SurrealDB will enforce that type validation strictly on all write queries, rejecting mismatched data.

**Fix: If you want a field to accept completely flexible types in any mode, do not write a `DEFINE FIELD` statement for it, or declare its type as a union: `TYPE string | int | object`.**

---



### Mistake 2: Passing Mismatched Data Types to `SCHEMAFULL` Field Definitions

**The mistake:** Inserting string `"123"` into a field defined as `TYPE number` without automatic type casting.

**Why it's wrong:** `SCHEMAFULL` tables reject field values whose runtime types do not match declared `TYPE` definitions unless flexible type casting or FLEXIBLE fields are specified.

*Incorrect:*
```surrealql
DEFINE FIELD age ON TABLE user TYPE number;
CREATE user SET age = "thirty"; // ❌ Type error: Expected number, got string
```

*Fix:*
```surrealql
DEFINE FIELD age ON TABLE user TYPE number;
CREATE user SET age = <number> "30"; // Explicit type casting
```

### Mistake 3: Confusing `NONE` Data Type with `NULL` Data Type

**The mistake:** Expecting `NONE` (absent field) to behave identically to `NULL` (explicit null value).

**Why it's wrong:** `NONE` represents the complete absence of a field key. `NULL` represents a key assigned explicit null. They have distinct query filtering behaviors.

*Incorrect:*
```surrealql
-- Expecting NONE to equal NULL
SELECT * FROM user WHERE bio = NULL; // Misses records where bio is NONE!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE bio = NONE OR bio = NULL;
```

## 6. Practice Exercises

### Exercise 1: Relational & Document Type Mapping

**Problem:** You are planning data mappings. 
Map these SurrealDB type declarations to their closest equivalent in **PostgreSQL** and **MongoDB**:
1.  `TYPE string`
2.  `TYPE record<company>`
3.  `TYPE array<string>`

**Expected output:**
> [!check]- Answer
> ```text
> 1. - PostgreSQL: TEXT (or VARCHAR)
>    - MongoDB: String
> 2. - PostgreSQL: FOREIGN KEY referencing table 'company'
>    - MongoDB: ObjectId reference string linking to 'company' collection
> 3. - PostgreSQL: TEXT[] (Array of TEXT)
>    - MongoDB: Array of Strings
> ```
> - A record type represents a direct pointer reference.
> - Consider how arrays are handled in SQL columns vs NoSQL documents.

---



### Exercise 2: SurrealDB Native Types Overview

**Problem:** List 4 native data types supported in SurrealDB (datetime, duration, geometry, record link).

**Expected output:**
> [!check]- Answer
> ```text
> datetime, duration, geometry, record link
> ```
> ```text
> datetime, duration, geometry, record link
> ```
>
> **Explanation:** SurrealDB extends standard JSON data types with rich native primitives.

---

### Exercise 3: Inspecting Field Value Type with `type::of()`

**Problem:** Inspect data type of `d"2026-01-01T00:00:00Z"` using `type::of()`.

**Expected output:**
> [!check]- Answer
> ```text
> "datetime"
> ```
> ```surrealql
> RETURN type::of(d"2026-01-01T00:00:00Z");
> ```
>
> **Explanation:** `type::of()` returns the SurrealDB data type string of any value.

## 7. Related Terms
- [Record ID](../level_01/record_id.md) — The composite identifier.
- [Type Casting & Coercion](type_casting.md) — Converting between types.

---

## 8. Key Takeaways
- SurrealDB's type system combines relational structure with NoSQL flexibility.
- Supports primitives, temporal data, containers, references, and null states.
- Type definitions are declared using the `TYPE` clause in `DEFINE FIELD`.
- Enforces strict type validations even inside `SCHEMALESS` tables for defined fields.
- `set` handles unique value lists; `record` handles pointers to table rows.
- Union types allow a field to accept multiple declared types (e.g. `string | int`).
- Nested syntax (like `array<string>`) guarantees type-safety inside containers.
