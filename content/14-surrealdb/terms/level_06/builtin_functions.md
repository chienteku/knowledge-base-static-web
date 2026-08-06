# Built-in Functions Overview

> **Level 6 — Advanced Querying & Functions**
> The extensive standard library of pre-built functions in SurrealDB, organized into distinct namespaces (`string::*`, `array::*`, `math::*`, `time::*`, `type::*`, `crypto::*`, `geo::*`, `rand::*`), eliminating the need to write backend boilerplate for common operations.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category


**Query Feature (SurrealQL standard function namespace overview)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional databases vary in how they organize utility functions:
- In SQL (PostgreSQL), functions are often placed in a flat global namespace (`LENGTH()`, `LOWER()`, `NOW()`, `MD5()`), leading to function name collisions or inconsistent naming conventions.
- In MongoDB, utility transformations require specific aggregation operators (`$strLenCP`, `$toLower`, `$dateToString`).

We designed SurrealDB's **Built-in Functions** around a clean, namespaced module hierarchy (`namespace::function()`). 

Organizing functions into modules (like `string::`, `math::`, `crypto::`) provides three major benefits:
1. **Self-Documenting Code:** You instantly know what type of data a function operates on.
2. **No Naming Collisions:** `array::len()` and `string::len()` coexist without confusion.
3. **Rich Utility Set:** Includes cryptography, vector math, GeoJSON spatial operations, and random generators directly inside the engine, reducing backend API glue code.

---

### (2) Key Standard Library Namespaces

| Namespace | Focus Area | Example Functions |
| :--- | :--- | :--- |
| `string::*` | Text manipulation & checks | `string::len()`, `string::lowercase()`, `string::slug()` |
| `array::*` | List operations & set math | `array::distinct()`, `array::intersect()`, `array::flatten()` |
| `math::*` | Mathematics & aggregations | `math::sum()`, `math::mean()`, `math::round()` |
| `time::*` | Dates, durations & timestamps| `time::now()`, `time::day()`, `time::floor()` |
| `type::*` | Type casting & checking | `type::thing()`, `type::is::string()` |
| `crypto::*` | Hashing & security encryption | `crypto::argon2::generate()`, `crypto::md5()` |
| `rand::*` | Random value generators | `rand::uuid()`, `rand::enum()`, `rand::int()` |
| `geo::*` | Geospatial measurements | `geo::distance()`, `geo::bearing()` |

---

### (3) Reality Metaphor (Organized Toolbox)
Imagine a master craftsman's workshop:
- **Global Flat Functions (Old SQL):** Tossing 200 different hammers, screwdrivers, and saws into a single wooden box. Finding a specific metric tool requires digging through everything.
- **Namespaced Built-in Functions (`module::*`):** A **Professional Wall Rack**.
  - Section `string::`: Text tools (scissors, stamps).
  - Section `math::`: Calculators and scales.
  - Section `crypto::`: Padlocks and keys.
  - Everything is grouped by category, labeled clearly, and instantly accessible.

---

### (4) Code Examples

#### Exploring Namespaced Functions in SurrealQL

```sql
-- 1. String & Math namespace calls
SELECT 
  string::uppercase(name) AS upper_name,
  math::round(price) AS rounded_price
FROM product;

-- 2. Crypto & Time namespace calls
SELECT 
  id,
  time::now() AS queried_at,
  crypto::sha256(email) AS hashed_email
FROM user;

-- 3. Random generator calls
CREATE ticket SET 
  code = rand::string(8),
  number = rand::int(1000, 9999);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling built-in functions without their mandatory namespace prefix, triggering parser errors

**The mistake:** Writing `SELECT LOWER(email) FROM user;` or `SELECT NOW();` based on SQL habits.

**Why it's wrong:** SurrealDB does not have global `LOWER()` or `NOW()` functions. Omitting the `string::` or `time::` namespace prefix causes the parser to throw an unrecognized function error.

**Fix: Always include the module namespace prefix:**

```sql
-- BAD
SELECT LOWER(email), NOW();

-- GOOD
SELECT string::lowercase(email), time::now();
```

---



### Mistake 2: Using Legacy Function Namespaces in Modern SurrealQL

**The mistake:** Using deprecated function namespaces or custom function calls without `fn::` prefixes.

**Why it's wrong:** Built-in functions belong to explicit namespaces (`string::`, `math::`, `array::`, `time::`, `crypto::`, `type::`, `rand::`, `geo::`). Custom functions require `fn::` prefix.

*Incorrect:*
```surrealql
RETURN my_custom_func(); // ❌ Missing fn:: prefix for custom user function!
```

*Fix:*
```surrealql
RETURN fn::my_custom_func(); // Custom functions require fn:: prefix
```

### Mistake 3: Calling Functions with Incorrect Parameter Counts

**The mistake:** Calling `string::slice("text")` with missing argument parameters.

**Why it's wrong:** Built-in functions require exact parameter argument signatures. Omitting required arguments throws a function evaluation error.

*Incorrect:*
```surrealql
RETURN string::slice("hello"); // ❌ Missing start/end index arguments!
```

*Fix:*
```surrealql
RETURN string::slice("hello", 0, 2); // Correct argument signature
```

## 5. Practice Exercises

### Exercise 1: Namespaced Function Invocation Matrix

**Scenario:**
Demonstrate function namespace routing in SurrealQL using `string::*`, `math::*`, `time::*`, and `type::*` functions.

**Requirements:**
1. Uppercase string `"surrealdb"` using `string::uppercase()`.
2. Round decimal `99.45dec` to nearest integer using `math::round()`.
3. Add duration `1d` to current time using `time::now() + 1d`.
4. Inspect type of `d"2026-08-06"` using `type::of()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     string::uppercase("surrealdb") AS upper_name,
>     math::round(99.45dec) AS rounded_val,
>     time::now() + 1d AS tomorrow,
>     type::of(d"2026-08-06T00:00:00Z") AS date_type;
> ```
>
> #### Technical Explanation
>
> 1. SurrealQL organizes built-in functions into double-colon namespaces (`namespace::function()`).
> 2. Functions operate over rich native types (`decimal`, `datetime`, `string`).
> 3. Executes scalar transformations directly inside database execution blocks.

---

### Exercise 2: Chaining Built-in Functions

**Scenario:**
Sanitize user input string `"   ALICE@EXAMPLE.COM   "` by trimming whitespace and converting to lowercase in a single expression.

**Requirements:**
1. Apply `string::lowercase()` and `string::trim()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT string::lowercase(string::trim("   ALICE@EXAMPLE.COM   ")) AS clean_email;
> ```
>
> #### Technical Explanation
>
> 1. Built-in functions can be nested dynamically (`fn2(fn1(val))`).
> 2. Normalizes text inputs before database write commits.
> 3. Reduces backend API data sanitization boilerplate.

---

### Exercise 3: Type Checking with `type::is::*` Functions

**Scenario:**
Validate whether an incoming value is a valid record link pointer before executing graph traversals.

**Requirements:**
1. Test `type::is::record(user:alice)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT type::is::record(user:alice) AS is_record_pointer;
> ```
>
> #### Technical Explanation
>
> 1. `type::is::record(val)` evaluates whether a value is a valid typed record ID pointer.
> 2. Returns boolean `true` or `false`.
> 3. Guards dynamic queries against invalid type inputs.

---



## 6. Related Terms

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [String Functions (`string::*`)](string_functions.md) — Text module.
- [Array Functions (`array::*`)](array_functions.md) — Related concept: Array Functions (`array::*`).
- [Math Functions (`math::*`)](math_functions.md) — Related concept: Math Functions (`math::*`).
- [Time Functions (`time::*`)](time_functions.md) — Related concept: Time Functions (`time::*`).
- [Type Functions (`type::*`)](type_functions.md) — Related concept: Type Functions (`type::*`).
- [`DEFINE FUNCTION`](../level_09/define_function.md) — Related concept: `DEFINE FUNCTION`.

---

## 7. Key Takeaways
- SurrealDB functions are organized into hierarchical namespaces (`module::function()`).
- Eliminates global function naming collisions and improves query readability.
- Modules cover strings, arrays, math, time, types, cryptography, randoms, and geometry.
- Executed natively in Rust with zero performance penalty.
- Reduces application backend code by shifting common utilities into the database.
