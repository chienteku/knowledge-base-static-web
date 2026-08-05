# `DEFINE FUNCTION`

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealQL's statement for creating custom, reusable server-side functions with typed parameters and return values (`fn::custom_name()`).

---

## 1. Prerequisites

- [`RETURN` Statement (in Functions / Blocks)](../level_06/return_statement.md) — Returning values from functions.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Standard library functions.

---

## 2. Term Category
- **Server-Side Logic & Programmability**

---

## 3. Environment Context
- **SurrealDB Engine** (Stored in database schema metadata and executed in memory when invoked in queries).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In application development, complex calculation rules, formatting operations, or data transformations are often repeated across multiple queries or backend services. In PostgreSQL, developers write PL/pgSQL functions (`CREATE FUNCTION`). In MongoDB, developers write server-side JavaScript functions.

SurrealDB provides `DEFINE FUNCTION` to define custom, reusable functions directly in SurrealQL. Functions are prefixed with `fn::` (e.g. `fn::calculate_tax($amount, $rate)`), support explicit parameter typing, and return values using `RETURN`. They can be called inside `SELECT` queries, `PERMISSIONS` clauses, `DEFINE EVENT` handlers, or SDK queries.

### (2) Reality Metaphor
Think of a custom formula button on a financial calculator:
- Instead of manually punching in `(price * 1.08) + shipping_fee` on every calculation, you program a custom button `fn::total_cost(price, shipping)`. Anytime you press the button with new inputs, it outputs the calculated result instantly.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Define a custom function to calculate discount price
DEFINE FUNCTION fn::discount_price($price: number, $discount_percent: number) {
    RETURN $price * (1.0 - ($discount_percent / 100.0));
};

-- Call the custom function in a SELECT query
SELECT name, price, fn::discount_price(price, 20) AS sale_price FROM product;
```

#### Fuller Example
```surrealql
-- 1. Custom function with strict parameter and return types
DEFINE FUNCTION fn::format_user_title($first: string, $last: string, $role: string) {
    LET $full = string::concat($first, ' ', $last);
    IF $role = 'admin' {
        RETURN string::concat('[ADMIN] ', $full);
    } ELSE {
        RETURN $full;
    };
};

-- 2. Call custom function in query
SELECT fn::format_user_title(first_name, last_name, role) AS display_title FROM user;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the `fn::` Namespace Prefix

**The mistake:** Defining or calling custom functions without the required `fn::` prefix (e.g. `DEFINE FUNCTION format_name()`).

**Why it's wrong:** SurrealDB strictly requires all user-defined custom functions to begin with the `fn::` namespace to avoid naming collisions with built-in standard library functions (`string::*`, `math::*`).

*Incorrect:*
```surrealql
DEFINE FUNCTION format_name($str: string) { RETURN string::uppercase($str); };
```

*Fix:*
```surrealql
DEFINE FUNCTION fn::format_name($str: string) { RETURN string::uppercase($str); };
```

---



### Mistake 2: Omitting `fn::` Namespace Prefix in Custom Function Declarations

**The mistake:** Writing `DEFINE FUNCTION custom_calc($a: number) { ... }` (SyntaxError).

**Why it's wrong:** Custom user functions in SurrealQL MUST be prefixed with `fn::` (e.g. `DEFINE FUNCTION fn::custom_calc`).

*Incorrect:*
```surrealql
DEFINE FUNCTION custom_calc($a: number) { RETURN $a * 2; }; // ❌ Missing fn:: prefix!
```

*Fix:*
```surrealql
DEFINE FUNCTION fn::custom_calc($a: number) { RETURN $a * 2; }; // Correct fn:: prefix
```

### Mistake 3: Omitting Type Annotations on Custom Function Parameters

**The mistake:** Declaring `DEFINE FUNCTION fn::add($a, $b) { RETURN $a + $b; }` without parameter types.

**Why it's wrong:** Custom function parameters strictly require type annotations (e.g. `$a: number, $b: number`).

*Incorrect:*
```surrealql
DEFINE FUNCTION fn::add($a, $b) { RETURN $a + $b; }; // ❌ Missing parameter types!
```

*Fix:*
```surrealql
DEFINE FUNCTION fn::add($a: number, $b: number) { RETURN $a + $b; };
```



### Mistake 4: Omitting `fn::` Namespace Prefix in Custom Function Declarations

**The mistake:** Writing `DEFINE FUNCTION custom_calc($a: number) { ... }` (SyntaxError).

**Why it's wrong:** Custom user functions in SurrealQL MUST be prefixed with `fn::` (e.g. `DEFINE FUNCTION fn::custom_calc`).

*Incorrect:*
```surrealql
DEFINE FUNCTION custom_calc($a: number) { RETURN $a * 2; }; // ❌ Missing fn:: prefix!
```

*Fix:*
```surrealql
DEFINE FUNCTION fn::custom_calc($a: number) { RETURN $a * 2; }; // Correct fn:: prefix
```

### Mistake 5: Omitting Type Annotations on Custom Function Parameters

**The mistake:** Declaring `DEFINE FUNCTION fn::add($a, $b) { RETURN $a + $b; }` without parameter types.

**Why it's wrong:** Custom function parameters strictly require type annotations (e.g. `$a: number, $b: number`).

*Incorrect:*
```surrealql
DEFINE FUNCTION fn::add($a, $b) { RETURN $a + $b; }; // ❌ Missing parameter types!
```

*Fix:*
```surrealql
DEFINE FUNCTION fn::add($a: number, $b: number) { RETURN $a + $b; };
```

## 6. Practice Exercises

### Exercise 1: Write Custom Function
Write a `DEFINE FUNCTION` statement named `fn::is_adult` that accepts an `$age: number` parameter and returns `true` if `$age >= 18`, otherwise `false`.

> [!check]- Answer
> - Name: `fn::is_adult($age: number)`.
> - Body: `RETURN $age >= 18;`.

---



### Exercise 2: Defining Custom Helper Function

**Problem:** Define function `fn::greet($name: string)` returning `"Hello, " + $name`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FUNCTION fn::greet($name: string) { RETURN string::concat("Hello, ", $name); };
> ```
> ```surrealql
> DEFINE FUNCTION fn::greet($name: string) {
>   RETURN string::concat("Hello, ", $name);
> };
> ```
>
> **Explanation:** `DEFINE FUNCTION fn::name($param: type)` declares reusable custom functions.

---

### Exercise 3: Invoking Custom Function

**Problem:** Invoke custom function `fn::greet("Alice")` in SurrealQL query.

**Expected output:**
> [!check]- Answer
> ```text
> RETURN fn::greet("Alice");
> ```
> ```surrealql
> RETURN fn::greet("Alice");
> ```
>
> **Explanation:** Custom functions are called using `fn::func_name(args)` syntax.

## 7. Related Terms

- [`RETURN` Statement (in Functions / Blocks)](../level_06/return_statement.md) — Flow-control return.
- [`DEFINE EVENT`](define_event.md) — Event triggers calling custom functions.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Native function library.
- [`DEFINE PARAM`](define_param.md) — Related concept: `DEFINE PARAM`.

---

## 8. Key Takeaways
- `DEFINE FUNCTION` creates server-side reusable SurrealQL functions.
- All custom user functions must use the `fn::` prefix (e.g., `fn::my_func()`).
- Supports strict parameter typing (`$param: type`) and `RETURN` expressions.
