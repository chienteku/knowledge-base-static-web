# Array Functions (`array::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB for list and set operations (`array::distinct()`, `array::union()`, `array::intersect()`, `array::len()`, `array::sort()`), bringing functional programming utilities directly into SurrealQL queries.

---

## 1. Prerequisites

- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`array`](../level_02/array_type.md) — The ordered list data type.

---

## 2. Term Category


**Query Feature (array manipulation builtin functions)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Array Flattening and Deduplication

**Scenario:**
A social media service collects tag arrays from user posts `[["rust", "db"], ["db", "api"]]` and needs a clean, deduplicated list of all unique tags.

**Requirements:**
1. Combine arrays using `array::flatten()`.
2. Deduplicate tag elements using `array::distinct()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $nested_tags = [["rust", "db"], ["db", "api"]];
> 
> -- Flatten and deduplicate tag array
> SELECT array::distinct(array::flatten($nested_tags)) AS unique_tags;
> ```
>
> #### Technical Explanation
>
> 1. `array::flatten()` unwraps multi-dimensional nested arrays into a single-dimensional list.
> 2. `array::distinct()` removes duplicate values from the flattened array.
> 3. Processes collection transformations natively within the database query engine.

---

### Exercise 2: Array Element Search with `array::find()`

**Scenario:**
An e-commerce order service searches a product's tag array to find the first tag starting with `"tech_"`.

**Requirements:**
1. Use `array::find()` with an inline evaluation clause.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $tags = ["promo", "tech_hardware", "tech_accessory"];
> 
> SELECT array::find($tags, |$val| string::starts_with($val, "tech_")) AS first_tech_tag;
> ```
>
> #### Technical Explanation
>
> 1. `array::find(array, closure)` evaluates closure predicate expressions against array elements.
> 2. Returns the first element matching the predicate or `NONE` if no match exists.
> 3. Enables functional array searching inside SurrealQL queries.

---

### Exercise 3: Array Reversal and Slicing

**Scenario:**
An activity stream retrieves the 3 most recent notifications from a user's notification array ordered newest to oldest.

**Requirements:**
1. Reverse array order using `array::reverse()`.
2. Slice the first 3 items.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $notifs = ["notif_1", "notif_2", "notif_3", "notif_4", "notif_5"];
> 
> SELECT array::reverse($notifs)[0..3] AS recent_notifications;
> ```
>
> #### Technical Explanation
>
> 1. `array::reverse()` reverses array element order in-place.
> 2. `[0..3]` applies range slicing to retrieve targeted element windows.
> 3. Facilitates array manipulation without client-side processing loops.

---



## 6. Related Terms

- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`array`](../level_02/array_type.md) — The ordered list container.
- [`set`](../level_02/set_type.md) — Unique set container.
- [Operators in SurrealQL](../level_03/operators.md) — Related concept: Operators in SurrealQL.
- [`SELECT VALUE` (Single Field Extraction)](../level_03/select_value.md) — Related concept: `SELECT VALUE` (Single Field Extraction).
- [`SPLIT` Clause](split_clause.md) — Related concept: `SPLIT` Clause.

---

## 7. Key Takeaways
- The `array::*` module offers functional tools for list manipulation.
- Perform set theory math (`union`, `intersect`, `difference`) directly in queries.
- `array::distinct()` strips duplicate elements from arrays.
- `array::flatten()` collapses nested arrays into a single flat array.
- Avoid passing non-array scalar types into `array::*` functions.
