# `DEFINE FUNCTION`

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealQL's statement for creating custom, reusable server-side functions with typed parameters and return values (`fn::custom_name()`).

---

## 1. Prerequisites

- [`RETURN` Statement (in Functions / Blocks)](../level_06/return_statement.md) — Returning values from functions.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Standard library functions.

---

## 2. Term Category


**Advanced Feature (custom SurrealQL user-defined function)**: - **Server-Side Logic & Programmability**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Custom Math User-Defined Function

**Scenario:**
Define a custom SurrealQL function `fn::discount_price($price, $discount)` that calculates discounted prices for an e-commerce platform.

**Requirements:**
1. Define function `fn::discount_price` accepting parameters `$price` (`decimal`) and `$discount` (`decimal`).
2. Calculate and return `$price * (1.0dec - $discount)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FUNCTION fn::discount_price($price: decimal, $discount: decimal) {
>     RETURN $price * (1.0dec - $discount);
> };
> 
> -- Invoke custom function in query
> SELECT fn::discount_price(100.00dec, 0.15dec) AS sale_price;
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE FUNCTION fn::name($param: type)` defines custom reusable SurrealQL functions.
> 2. Enforces type validation on parameter inputs (`decimal`).
> 3. Encapsulates business logic directly inside the database tier.

---

### Exercise 2: Multi-Statement Custom Logic Functions

**Scenario:**
Define a custom function `fn::get_user_summary($user_id)` that fetches a user's record, counts their orders, and returns a summary JSON object.

**Requirements:**
1. Fetch user record and order count inside function body.
2. Return a summary object `{ user: $user, order_count: $count }`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FUNCTION fn::get_user_summary($user_id: record<user>) {
>     LET $u = (SELECT * FROM ONLY $user_id);
>     LET $c = (SELECT count() FROM order WHERE customer = $user_id GROUP ALL);
>     
>     RETURN {
>         user: $u,
>         total_orders: $c[0].count OR 0
>     };
> };
> ```
>
> #### Technical Explanation
>
> 1. Custom functions support multi-statement script blocks enclosed in `{ ... }`.
> 2. Subqueries and parameter variables can be used inside function bodies.
> 3. Replaces SQL stored procedures with clean SurrealQL function syntax.

---

### Exercise 3: Dropping Custom Functions with `REMOVE FUNCTION`

**Scenario:**
Drop custom function `fn::discount_price` from the database.

**Requirements:**
1. Write `REMOVE FUNCTION fn::discount_price`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE FUNCTION fn::discount_price;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE FUNCTION` drops custom user-defined functions from database metadata registers.
> 2. Blocks subsequent invocations of the function.
> 3. Maintains database function clean-up hygiene.

---





## 6. Related Terms

- [`RETURN` Statement (in Functions / Blocks)](../level_06/return_statement.md) — Flow-control return.
- [`DEFINE EVENT`](define_event.md) — Event triggers calling custom functions.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Native function library.
- [`DEFINE PARAM`](define_param.md) — Related concept: `DEFINE PARAM`.

---

## 7. Key Takeaways
- `DEFINE FUNCTION` creates server-side reusable SurrealQL functions.
- All custom user functions must use the `fn::` prefix (e.g., `fn::my_func()`).
- Supports strict parameter typing (`$param: type`) and `RETURN` expressions.
