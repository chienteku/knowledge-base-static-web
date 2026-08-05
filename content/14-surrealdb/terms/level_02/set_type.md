# `set`

> **Level 2 — Data Types & Record Structure**
> The container data type in SurrealDB that stores an unordered collection of **unique** values, automatically discarding any duplicate entries, representing a capability unique to SurrealDB.

---

## 1. Prerequisites

- [`array`](array_type.md) — The non-unique list context.
- [Data Types (Overview)](data_types.md) — SurrealDB data types overview.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Enforced at the storage layer. Compiles array inputs into sorted unique indexing blocks).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Container Deduplication

**Problem:** You have a schema-less collection. You run these two updates in mongosh/SurrealQL:
`UPDATE user:john SET tags = ["rust", "database", "rust"];`
Predict the exact JSON array output returned for the `tags` field under these two scenarios:
1.  The `tags` field is defined as `TYPE array<string>`.
2.  The `tags` field is defined as `TYPE set<string>`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Array: ["rust", "database", "rust"] (Duplicates are preserved, order is maintained).
> 2. Set: ["database", "rust"] (The duplicate "rust" is discarded, and elements are sorted/unordered).
> ```
> - Check which container type enforces uniqueness.
> - Consider how duplicates are discarded on writes.

---



### Exercise 2: Set Field Schema Definition

**Problem:** Define field `categories` on `product` table as a set of strings.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD categories ON TABLE product TYPE set<string>;
> ```
> ```surrealql
> DEFINE FIELD categories ON TABLE product TYPE set<string>;
> ```
>
> **Explanation:** `TYPE set<type>` enforces unique element collections.

---

### Exercise 3: Automatic Set Deduplication

**Problem:** What happens when `[1, 1, 2]` is inserted into a `set<number>` field? (`[1, 2]`).

**Expected output:**
> [!check]- Answer
> ```text
> [1, 2]
> ```
> ```text
> [1, 2]
> ```
>
> **Explanation:** Sets automatically discard duplicate element values upon insertion.

## 7. Related Terms

- [`array`](array_type.md) — The non-unique list context.
- [Data Types (Overview)](data_types.md) — The parent type system.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Related concept: Array Functions (`array::*`).

---

## 8. Key Takeaways
- The `set` type stores an unordered collection of unique values.
- Automatically deduplicates inputs at the database engine layer.
- Neither PostgreSQL nor MongoDB has a native, first-class `set` data type.
- Typed sets are declared using the `set<T>` syntax (e.g. `set<string>`).
- Insertion order is discarded; do not use sets if sequence order is critical.
- Silent deduplication simplifies backend application validation code.
- Highly optimized for roles, tags, scopes, and category matrices.
