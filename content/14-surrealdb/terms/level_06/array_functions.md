# Array Functions (`array::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for list and set operations (`array::distinct()`, `array::union()`, `array::intersect()`, `array::len()`, `array::sort()`), bringing functional programming utilities directly into SurrealQL queries.

---

## 1. Prerequisites

- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`array`](../level_02/array_type.md) — The ordered list data type.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed in memory during query evaluation. Operates on arrays of primitives, nested objects, or record links).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Working with lists of data (tags, roles, permissions, IDs) is central to modern applications:
- You want to find common tags between two posts (set intersection).
- You want to merge two user permission lists while removing duplicate entries (set union / distinct).
- You want to sort an array of scores or filter out empty values inside a document.

In SQL (PostgreSQL), array manipulations require complex custom functions or array unnesting. In MongoDB, list math requires specialized aggregation operators (`$setIntersection`, `$setUnion`).

We designed the **`array::*`** module in SurrealDB to provide a complete functional programming toolkit. Influenced by JavaScript array methods (`.map()`, `.filter()`, `.sort()`), `array::*` functions make list manipulations, set theory math, and array transformations declarative and easy to write in single query expressions.

---

### (2) Key Function Categories

#### 1. Inspection & Retrieval
- `array::len(arr)`: Returns the number of elements in the array.
- `array::first(arr)` / `array::last(arr)`: Returns the first or last item.
- `array::find_index(arr, val)`: Returns the index position of an element.

#### 2. Set Mathematics & Deduplication
- `array::distinct(arr)`: Removes duplicate values from an array.
- `array::union(arr1, arr2)`: Combines two arrays and removes duplicates.
- `array::intersect(arr1, arr2)`: Returns items present in **both** arrays.
- `array::difference(arr1, arr2)`: Returns items in `arr1` that are **not** in `arr2`.

#### 3. Transformation & Ordering
- `array::sort(arr, [asc|desc])`: Sorts array elements.
- `array::flatten(arr)`: Flattens multi-dimensional nested arrays.
- `array::append(arr, val)` / `array::prepend(arr, val)`: Adds items to start or end.
- `array::remove(arr, index)`: Removes an item at a specific index.

---

### (3) Reality Metaphor (Sorting Sorting Cards)
Imagine managing index cards:
- **`array::distinct`:** Shuffling through a deck of invitation cards and tossing out duplicate printed cards so only unique names remain.
- **`array::intersect`:** Comparing your guest list with your friend's guest list and placing cards matching **both** lists into a small middle pile.
- **`array::flatten`:** Opening small envelopes taped inside a larger folder and dumping all loose cards out onto one flat desk surface.

---

### (4) Code Examples

#### Using `array::*` Functions in SurrealQL

```sql
-- 1. Deduplicating and sorting arrays
SELECT 
  array::distinct(tags) AS unique_tags,
  array::sort(scores, 'desc') AS sorted_scores
FROM game_session;

-- 2. Set Theory: Finding common interests between two users
LET $user1_tags = (SELECT VALUE tags FROM user:alice)[0];
LET $user2_tags = (SELECT VALUE tags FROM user:bob)[0];

RETURN array::intersect($user1_tags, $user2_tags);
-- Returns: ["rust", "databases"]

-- 3. Appending items to an array on UPDATE
UPDATE post:first SET 
  tags = array::distinct(array::append(tags, "surrealdb"));
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing a non-array value to an 'array::*' function, causing execution errors

**The mistake:** Running `SELECT array::len(email) FROM user;` when `email` is a scalar string.

**Why it's wrong:** `array::*` functions expect an `array` data type. Passing a primitive string or number causes the function to return `NONE` or throw a type mismatch error. (Use `string::len()` for strings!).

**Fix: Verify that the argument passed to `array::*` is an array:**

```sql
-- BAD (email is a string)
SELECT array::len(email) FROM user;

-- GOOD (tags is an array)
SELECT array::len(tags) FROM user;
```

---



### Mistake 2: Passing Non-Array Arguments to `array::` Built-in Functions

**The mistake:** Passing a string or number into `array::len("text")`.

**Why it's wrong:** Functions in `array::` namespace expect array arguments. Passing non-arrays throws a runtime type error or returns `NONE`. Use `string::len()` for strings.

*Incorrect:*
```surrealql
RETURN array::len("hello"); // ❌ Expected array, got string!
```

*Fix:*
```surrealql
RETURN string::len("hello"); // Correct string length function
```

### Mistake 3: Confusing `array::add()` with `array::push()` Mutating Behavior

**The mistake:** Expecting `array::add($arr, 1)` to mutate variable `$arr` in place.

**Why it's wrong:** SurrealQL array functions are pure and functional! They return a new array instance containing the added element without mutating the original variable.

*Incorrect:*
```surrealql
LET $arr = [1, 2];
array::add($arr, 3); // ❌ $arr remains [1, 2]!
```

*Fix:*
```surrealql
LET $arr = [1, 2];
LET $arr = array::add($arr, 3); // Reassign updated array
```

## 6. Practice Exercises

### Exercise 1: Array Set Intersect

**Problem:** You have two array variables:
`LET $required_roles = ["admin", "editor"];`
`LET $user_roles = ["user", "editor"];`
Write the SurrealQL expression using `array::*` to check if `$user_roles` shares any roles with `$required_roles`, returning non-empty common items.

**Expected output:**
> [!check]- Answer
> ```sql
> RETURN array::intersect($user_roles, $required_roles);
> ```
> - The set overlap function is `array::intersect(arr1, arr2)`.

---



### Exercise 2: Array Filtering with `array::filter`

**Problem:** Filter numbers greater than 10 from `[5, 12, 8, 20]` using `array::filter()`.

**Expected output:**
> [!check]- Answer
> ```text
> [12, 20]
> ```
> ```surrealql
> RETURN array::filter([5, 12, 8, 20], |$v| $v > 10);
> ```
>
> **Explanation:** `array::filter(arr, closure)` filters array elements using predicate closure functions.

---

### Exercise 3: Array Mapping with `array::map`

**Problem:** Double all values in `[1, 2, 3]` using `array::map()`.

**Expected output:**
> [!check]- Answer
> ```text
> [2, 4, 6]
> ```
> ```surrealql
> RETURN array::map([1, 2, 3], |$v| $v * 2);
> ```
>
> **Explanation:** `array::map(arr, closure)` transforms array elements into new values.

## 7. Related Terms

- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`array`](../level_02/array_type.md) — The ordered list container.
- [`set`](../level_02/set_type.md) — Unique set container.
- [Operators in SurrealQL](../level_03/operators.md) — Related concept: Operators in SurrealQL.
- [`SELECT VALUE` (Single Field Extraction)](../level_03/select_value.md) — Related concept: `SELECT VALUE` (Single Field Extraction).
- [`SPLIT` Clause](split_clause.md) — Related concept: `SPLIT` Clause.

---

## 8. Key Takeaways
- The `array::*` module offers functional tools for list manipulation.
- Perform set theory math (`union`, `intersect`, `difference`) directly in queries.
- `array::distinct()` strips duplicate elements from arrays.
- `array::flatten()` collapses nested arrays into a single flat array.
- Avoid passing non-array scalar types into `array::*` functions.
