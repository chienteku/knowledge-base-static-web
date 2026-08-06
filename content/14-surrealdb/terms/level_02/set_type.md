# `set`

> **Level 2 — Data Types & Record Structure**
> The container data type in SurrealDB that stores an unordered collection of **unique** values, automatically discarding any duplicate entries, representing a capability unique to SurrealDB.

---

## 1. Prerequisites

- [`array`](array_type.md) — The non-unique list context.
- [Data Types (Overview)](data_types.md) — SurrealDB data types overview.

---

## 2. Term Category


**Data Type (unique unordered element collection type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In database schemas, you often need to store collections of unique values:
-   **Permissions:** A user's roles (`"admin"`, `"editor"`).
-   **Tags:** A product's categories (`"clothing"`, `"sale"`).

If you store these inside standard arrays:
-   **PostgreSQL:** No native set type exists. You must build relational junction tables or check duplicates in SQL.
-   **MongoDB:** No native set type exists. You must use the `$addToSet` update operator, but if you query and overwrite the field directly, duplicates can slide in.

We designed the **`set`** type in SurrealDB to solve this unique-list problem. 

It is a native, first-class container type. 

You declare a field as `set` (and optional parameter types, like `set<string>`). 

If your application attempts to insert duplicate values, SurrealDB automatically filters and discards the duplicates at the database engine layer. 

No custom validation logic or application-layer checks are needed.

---

### (2) Arrays vs. Sets
Compare how the two list containers handle elements:

| Sizing Dimension | `array` Type | `set` Type |
| :--- | :--- | :--- |
| **Element Uniqueness**| Allows duplicate elements. | **Enforces strict uniqueness** (no duplicates). |
| **Order Guarantee** | Preserves insertion order (indexed).| **Unordered** (no index order guarantees). |
| **SurrealDB Syntax** | `array<T>` | `set<T>` |
| **Duplicate Insertion**| Appends to list length. | Discarded silently. |

---

### (3) Reality Metaphor (Coin Slots)
Imagine collecting items in containers:
-   **`array` Type (A Cup):** You drop coins inside. 
    -   You can toss in three identical quarters. 
    -   They stack in the exact order you dropped them.
-   **`set` Type (A Vending Machine Slot):** 
    -   If you drop in a quarter, it accepts it. 
    -   If you try to drop in a second, identical quarter immediately, the validator recognizes it is a duplicate, slides it down the reject tube, and drops it out the bottom. 
    -   The machine only holds one unique specimen of each coin.

---

### (4) Code Examples

#### Enforcing and Testing Sets
Observe how SurrealDB filters duplicate inserts automatically:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Declare a unique set field
DEFINE FIELD roles ON user TYPE set<string>;

-- 2. Insert records containing duplicate entries in the array payload
CREATE user:tobie SET
  roles = ["admin", "editor", "admin", "admin"]; // Note the duplicate 'admin'!

-- 3. Query the saved record
SELECT roles FROM user:tobie;

-- Output returned (SurrealDB automatically cleaned the duplicates!):
// {
//   id: user:tobie,
//   roles: ["admin", "editor"] // Unordered, duplicates removed!
// }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on 'set' fields to preserve the index order of items, leading to broken sorting logic in frontend components

**The mistake:** Storing article step lists (`set<string>`) expecting elements to return in the exact order they were declared, causing steps to display out of sequence.

**Why it's wrong:** Sets are mathematically unordered. 

To enforce uniqueness efficiently, SurrealDB stores set elements inside sorted tree blocks. 

The insertion order is discarded, so retrieving the set will return elements in arbitrary sorted order, not the input sequence.

**Fix: If your application requires both uniqueness AND a guaranteed insertion order, use an `array` type and write checks inside your application controllers to enforce uniqueness before writing to the database.**

---



### Mistake 2: Expecting `set` Type to Preserve Duplicate Element Additions

**The mistake:** Adding duplicate items to a field typed `TYPE set<string>` expecting all items to remain.

**Why it's wrong:** A `set` automatically deduplicates stored items. Adding `"rust"` twice results in a set with a single `"rust"` item.

*Incorrect:*
```surrealql
DEFINE FIELD tags ON TABLE article TYPE set<string>;
UPDATE article:1 SET tags = ["rust", "rust"]; // Deduplicates to ["rust"]
```

*Fix:*
```surrealql
DEFINE FIELD tags ON TABLE article TYPE array<string>; // Use array if duplicates are required
```

### Mistake 3: Confusing `set` Field Type with `SET` Assignment Keyword

**The mistake:** Mixing up the `set` data type with the SurrealQL `SET` clause in UPDATE/CREATE queries.

**Why it's wrong:** `TYPE set` is a data collection type. `SET key = val` is a statement clause for assigning record field values.

*Incorrect:*
```surrealql
-- Syntax confusion
CREATE user set = [1, 2]; // 'set' used as field name without escaping
```

*Fix:*
```surrealql
DEFINE FIELD tags ON TABLE article TYPE set<string>; // Data type definition
```

## 5. Practice Exercises

### Exercise 1: Unique Tag Collection Storage

**Scenario:**
A content management system stores article tags in a `set<string>` field to guarantee that duplicate tags are automatically eliminated.

**Requirements:**
1. Define table `article` in `SCHEMAFULL` mode.
2. Define field `tags` as `set<string>`.
3. Insert record `article:1` with duplicate tags `["rust", "database", "rust"]`.
4. Inspect the saved record to verify tag uniqueness.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE article SCHEMAFULL;
> DEFINE FIELD tags ON TABLE article TYPE set<string>;
> 
> -- Insert duplicate elements in array payload
> CREATE article:1 SET tags = ["rust", "database", "rust"];
> 
> SELECT tags FROM article:1;
> -- Output: { tags: ["rust", "database"] }  (duplicates automatically removed!)
> ```
>
> #### Technical Explanation
>
> 1. `set<T>` automatically deduplicates input elements at write time.
> 2. Guarantees set element uniqueness without requiring application-level deduplication code.
> 3. Preserves unique element collections natively inside database records.
> 
---

### Exercise 2: Set Union and Intersection Operations

**Scenario:**
Query user records where a set field `interests` overlaps with target interests `["music", "sports"]`.

**Requirements:**
1. Create user `user:u1` with `interests = ["coding", "music"]`.
2. Query users where `interests` contains any target interest using `CONTAINSANY`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET interests = ["coding", "music"];
> 
> -- Query users with matching set interests
> SELECT * FROM user WHERE interests CONTAINSANY ["music", "sports"];
> ```
>
> #### Technical Explanation
>
> 1. `CONTAINSANY` evaluates whether a set field shares at least one element with a target set.
> 2. Provides set intersection checking directly in `WHERE` clauses.
> 3. Enables fast recommendation and targeting queries.
> 
---

### Exercise 3: Appending to Set Fields with Uniqueness Guards

**Scenario:**
Append a new tag `"database"` to an existing article's `tags` set field when `"database"` already exists in the set.

**Requirements:**
1. Update `article:1` using `SET tags += "database"`.
2. Verify that duplicate insertion is safely ignored.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Attempt to append an existing tag
> UPDATE article:1 SET tags += "database";
> 
> SELECT tags FROM article:1;
> ```
>
> #### Technical Explanation
>
> 1. Appending (`+=`) an existing element to a `set<T>` field is a safe no-op.
> 2. Prevents set duplication during concurrent update operations.
> 3. Ensures mathematical set properties remain invariant across data mutations.
> 
---



## 6. Related Terms

- [`array`](array_type.md) — The non-unique list context.
- [Data Types (Overview)](data_types.md) — The parent type system.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Related concept: Array Functions (`array::*`).

---

## 7. Key Takeaways
- The `set` type stores an unordered collection of unique values.
- Automatically deduplicates inputs at the database engine layer.
- Neither PostgreSQL nor MongoDB has a native, first-class `set` data type.
- Typed sets are declared using the `set<T>` syntax (e.g. `set<string>`).
- Insertion order is discarded; do not use sets if sequence order is critical.
- Silent deduplication simplifies backend application validation code.
- Highly optimized for roles, tags, scopes, and category matrices.
