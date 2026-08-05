# `array`

> **Level 2 — Data Types & Record Structure**
> The container data type in SurrealDB that stores an ordered list of values (allowing duplicates), equivalent to a PostgreSQL `ARRAY` or a MongoDB BSON Array, with support for strict type parameters.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Stored sequentially on disk. Array elements can be indexed individually or modified using built-in array functions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database design (PostgreSQL), storing multiple items in a single column violates normal forms. 
-   If a user has 3 email addresses, you must create a separate table.
-   Although PostgreSQL supports array columns (like `TEXT[]`), querying elements inside them can be difficult, and they lack advanced type constraints.

In MongoDB, arrays are a fundamental, flexible building block.

We designed the **`array`** type in SurrealDB to provide clean list storage. 

An array is an ordered list of values. 

You can store primitive types, nested objects, or even arrays of other arrays. 

Furthermore, SurrealDB allows you to declare **Typed Arrays** (such as `array<string>` or `array<record<post>>`), guaranteeing that every item added to the array conforms to your schema rules.

---

### (2) Key Characteristics of Arrays
-   **Ordered:** Elements are indexed starting at `0`. The database preserves the order you insert them.
-   **Duplicates Allowed:** You can store the same value multiple times in the same array (e.g., `["red", "blue", "red"]`).
-   **Generic or Typed:** By default, an `array` can hold mixed types (strings, numbers, objects). Declaring type arguments (like `array<int>`) locks it down.

---

### (3) Reality Metaphor (The Bus Passenger Queue)
Imagine a line of people waiting for a bus:
-   **`array` Type:** A **Queue Line**. 
    -   The people stand in a specific order (first person, second person).
    -   Multiple people can wear the exact same blue jacket (duplicates are allowed).
    -   If a new person joins the line, they stand at the end (index is appended).

---

### (4) Code Examples

#### Creating and Querying Array Fields
Let's model a blog post schema with tags and history comments:

```sql
DEFINE TABLE post SCHEMAFULL;

-- 1. Declare a typed array (array holding only strings)
DEFINE FIELD tags ON post TYPE array<string>;

-- 2. Declare an array holding record links pointing to user tables
DEFINE FIELD collaborators ON post TYPE array<record<user>>;

-- 3. Insert a record with array arrays
CREATE post:first SET
  tags = ["tech", "database", "rust"],
  collaborators = [user:tobie, user:alice];

-- 4. Query posts containing a specific tag in SurrealQL
-- (Uses the CONTAINS operator!)
SELECT * FROM post WHERE tags CONTAINS "rust";
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using 'array' when you require unique items, leading to duplicate values and verbose database checks

**The mistake:** Storing user permission roles inside an array (`roles = ["admin", "user"]`), and accidentally appending `"admin"` a second time, resulting in duplicated values (`["admin", "user", "admin"]`).

**Why it's wrong:** Arrays permit duplicate values. 

If your application requires items to be unique, you must write validation checks in your queries or application code to prevent duplicates, which wastes resources.

**Fix: Use SurrealDB's native `set` data type instead of an array. A set automatically enforces uniqueness, discarding duplicate entries without query logic checks.**

---



### Mistake 2: Assuming 1-Based Indexing for Array Lookups in SurrealQL

**The mistake:** Accessing array elements using 1-based indexing `arr[1]` expecting the first element.

**Why it's wrong:** SurrealQL arrays are 0-indexed! `arr[0]` accesses the first element. `arr[1]` accesses the second element.

*Incorrect:*
```surrealql
LET $tags = ["rust", "surrealdb"];
RETURN $tags[1]; // ❌ Returns "surrealdb", NOT "rust"!
```

*Fix:*
```surrealql
LET $tags = ["rust", "surrealdb"];
RETURN $tags[0]; // Correct 0-based first element index
```

### Mistake 3: Confusing Array Concatenation Operator `+` with Element Insertion

**The mistake:** Writing `arr + 'item'` expecting `'item'` to be appended as a single element.

**Why it's wrong:** Adding a scalar `'item'` to an array concatenates or casts. Use array functions `array::add($arr, 'item')` or `array::push()`.

*Incorrect:*
```surrealql
LET $arr = [1, 2];
RETURN $arr + 3; // May coerce or behave unexpectedly
```

*Fix:*
```surrealql
LET $arr = [1, 2];
RETURN array::add($arr, 3); // Correct array element addition
```

## 6. Practice Exercises

### Exercise 1: Array Schema Definition

**Problem:** Write the SurrealQL statements to:
1.  Define a table named `course` as `SCHEMAFULL`.
2.  Define a field named `scores` on the `course` table as an array that can only store integers.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE TABLE course SCHEMAFULL;
> DEFINE FIELD scores ON course TYPE array<int>;
> ```
> - The table configuration keyword is `SCHEMAFULL`.
> - Use angle brackets to specify the element type inside the array declaration: `array<T>`.

---



### Exercise 2: Typed Array Field Definition

**Problem:** Define field `tags` on `article` as an array of strings using `DEFINE FIELD`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD tags ON TABLE article TYPE array<string>;
> ```
> ```surrealql
> DEFINE FIELD tags ON TABLE article TYPE array<string>;
> ```
>
> **Explanation:** `TYPE array<type>` restricts array elements to specific inner data types.

---

### Exercise 3: Array Deduplication with `array::distinct`

**Problem:** Deduplicate `[1, 2, 2, 3]` using built-in array function `array::distinct()`.

**Expected output:**
> [!check]- Answer
> ```text
> [1, 2, 3]
> ```
> ```surrealql
> RETURN array::distinct([1, 2, 2, 3]);
> ```
>
> **Explanation:** `array::distinct()` removes duplicate values from SurrealQL arrays.

## 7. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [`set`](set_type.md) — Unique list container.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Array manipulations.
- [`FOR` Expression](../level_06/for_expression.md) — Related concept: `FOR` Expression.

---

## 8. Key Takeaways
- The `array` type stores ordered lists of values, permitting duplicate elements.
- Direct NoSQL equivalent to PostgreSQL's array columns and MongoDB's BSON Arrays.
- Preserves the chronological order of elements as they were inserted.
- Supports generic types (mixed data types) or strict typed structures (e.g. `array<string>`).
- Search arrays in SurrealQL using the `CONTAINS` operator.
- Leverage the `array::*` standard library functions to modify, sort, or filter arrays.
- For lists requiring unique items, use the native `set` type instead.
