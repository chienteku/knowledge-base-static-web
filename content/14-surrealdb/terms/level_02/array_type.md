# `array`

> **Level 2 — Data Types & Record Structure**
> The container data type in SurrealDB that stores an ordered list of values (allowing duplicates), equivalent to a PostgreSQL `ARRAY` or a MongoDB BSON Array, with support for strict type parameters.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (ordered sequence collection type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Tag Filtering & Containment

**Scenario:**
You are building an article categorization module for a developer blog. Each article stores an array of topic tags `tags = ["rust", "surrealdb", "backend"]`.

**Requirements:**
1. Define table `article` in `SCHEMAFULL` mode with field `tags` of type `array<string>`.
2. Write a query to create an article `article:a1` with tags `["rust", "database", "async"]`.
3. Write a `SELECT` query to find all articles where `tags` contains `"database"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE article SCHEMAFULL;
> DEFINE FIELD tags ON TABLE article TYPE array<string>;
> 
> CREATE article:a1 SET title = "Async Rust Databases", tags = ["rust", "database", "async"];
> 
> -- Query articles containing the tag 'database'
> SELECT * FROM article WHERE tags CONTAINS "database";
> ```
>
> #### Technical Explanation
>
> 1. `array<string>` defines a typed container array for string elements.
> 2. The `CONTAINS` operator checks set membership within array fields directly at query execution time.
> 3. Eliminates the need for separate tag junction tables or manual array regex matching.
> 
---

### Exercise 2: Array Slice and Element Mutation

**Scenario:**
A shopping cart application stores item record links in an array `items`. You need to add a new item to the array and retrieve the first item using zero-indexed array slicing.

**Requirements:**
1. Create a cart `cart:c1` with initial items `[product:p1, product:p2]`.
2. Append `product:p3` to `items` using the `+=` array assignment operator.
3. Select the first product link using `items[0]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE cart:c1 SET items = [product:p1, product:p2];
> 
> -- Append new element to array
> UPDATE cart:c1 SET items += product:p3;
> 
> -- Retrieve first element via zero-indexed array access
> SELECT items[0] AS first_item FROM cart:c1;
> ```
>
> #### Technical Explanation
>
> 1. The `+=` operator appends new elements to array fields atomically without overwriting the entire array.
> 2. Array elements are accessed using zero-indexed bracket syntax (`items[0]`).
> 3. Arrays preserve insertion order across reads and mutations.
> 
---

### Exercise 3: Array Subset Validation with `CONTAINSALL`

**Scenario:**
A security system verifies user permissions by checking whether a user's assigned permission array `perms` contains all required access scopes `["read", "write"]`.

**Requirements:**
1. Create user `user:alice` with permissions `["read", "write", "execute"]`.
2. Query users who hold both `"read"` AND `"write"` permissions simultaneously using `CONTAINSALL`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET perms = ["read", "write", "execute"];
> CREATE user:bob SET perms = ["read"];
> 
> -- Filter users holding both 'read' and 'write' permissions
> SELECT * FROM user WHERE perms CONTAINSALL ["read", "write"];
> ```
>
> #### Technical Explanation
>
> 1. `CONTAINSALL` evaluates whether an array field contains every element in a target array set.
> 2. Avoids chaining multiple `CONTAINS` AND clauses together.
> 3. Evaluates set logic natively inside SurrealDB's query processor.
> 
---





## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [`set`](set_type.md) — Unique list container.
- [Array Functions (`array::*`)](../level_06/array_functions.md) — Array manipulations.
- [`FOR` Expression](../level_06/for_expression.md) — Related concept: `FOR` Expression.

---

## 7. Key Takeaways
- The `array` type stores ordered lists of values, permitting duplicate elements.
- Direct NoSQL equivalent to PostgreSQL's array columns and MongoDB's BSON Arrays.
- Preserves the chronological order of elements as they were inserted.
- Supports generic types (mixed data types) or strict typed structures (e.g. `array<string>`).
- Search arrays in SurrealQL using the `CONTAINS` operator.
- Leverage the `array::*` standard library functions to modify, sort, or filter arrays.
- For lists requiring unique items, use the native `set` type instead.
