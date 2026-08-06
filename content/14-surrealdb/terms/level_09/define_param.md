# `DEFINE PARAM`

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealQL statement for creating persistent, database-scoped global parameters that are accessible across all client sessions, queries, events, and functions.

---

## 1. Prerequisites

- [Parameters (`$param`)](../level_06/parameters.md) — Query-level parameter syntax.
- [`LET` Statement](../level_06/let_statement.md) — Query-scoped session variables vs global database params.

---

## 2. Term Category


**Advanced Feature (global custom parameter definition)**: - **Database Configuration & State**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications frequently need global configuration values, feature toggles, or shared constants (e.g. system tax rate, platform maintenance status, max file upload sizes) accessible to all queries and server-side functions.
- `LET $var = 10;` creates a variable that exists **only** for the duration of the current query or WebSocket session, disappearing once the session ends.
- `DEFINE PARAM $param VALUE ...` creates a **persistent, database-level global parameter**. Once defined, `$param` is saved to database metadata and becomes immediately accessible to every query, function, event, and client session connected to that database.

### (2) Reality Metaphor
Think of variable scope in a company office:
- **`LET`**: A sticky note written by an employee at their desk — helpful while they work on a task, but thrown away at 5:00 PM.
- **`DEFINE PARAM`**: A company policy sign mounted permanently on the wall in the lobby — visible and binding for all employees across all shifts.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Define a persistent global database parameter for tax rate
DEFINE PARAM $tax_rate VALUE 0.08;

-- Access the global parameter in any query
SELECT price, (price * $tax_rate) AS tax FROM invoice;
```

#### Fuller Example
```surrealql
-- 1. Define global configuration object parameter
DEFINE PARAM $app_config VALUE {
    maintenance_mode: false,
    max_upload_size_mb: 25,
    supported_locales: ['en-US', 'es-ES', 'fr-FR']
};

-- 2. Use global parameter in PERMISSIONS clause
DEFINE TABLE post SCHEMAFULL
    PERMISSIONS
        FOR create WHERE $app_config.maintenance_mode = false;

-- 3. Update global parameter value
DEFINE PARAM $app_config VALUE {
    maintenance_mode: true,
    max_upload_size_mb: 25,
    supported_locales: ['en-US', 'es-ES', 'fr-FR']
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing LET (Session-Scoped) with DEFINE PARAM (Database-Scoped)

**The mistake:** Expecting `LET $my_var = 100;` in one SDK call to be available in a separate SDK query call later.

**Why it's wrong:** `LET` statements create transient query/session variables. To store a global variable that persists across sessions and SDK calls, use `DEFINE PARAM`.

*Incorrect:*
```surrealql
-- Query 1
LET $discount = 0.15;
-- Query 2 (In a new HTTP request or session)
SELECT * FROM product WHERE price * $discount < 50; -- $discount is NONE!
```

*Fix:*
```surrealql
-- Schema Definition
DEFINE PARAM $discount VALUE 0.15;
-- Any query across any session
SELECT * FROM product WHERE price * $discount < 50; -- Works!
```

---



### Mistake 2: Omitting `$` Prefix in `DEFINE PARAM` Declarations

**The mistake:** Writing `DEFINE PARAM MAX_LIMIT ON DATABASE VALUE 100;` (SyntaxError).

**Why it's wrong:** Parameter names in SurrealQL MUST start with a `$` prefix (e.g. `DEFINE PARAM $MAX_LIMIT`).

*Incorrect:*
```surrealql
DEFINE PARAM MAX_LIMIT ON DATABASE VALUE 100; // ❌ Parse error: missing $ prefix!
```

*Fix:*
```surrealql
DEFINE PARAM $MAX_LIMIT ON DATABASE VALUE 100; // Correct $ prefix
```

### Mistake 3: Attempting Global Reassignment of `DEFINE PARAM` Variables inside Client Queries

**The mistake:** Writing `LET $MAX_LIMIT = 200;` expecting to overwrite global `DEFINE PARAM $MAX_LIMIT`.

**Why it's wrong:** `LET` creates a local query script variable shadowing the global parameter. To modify persistent global parameters, execute `DEFINE PARAM` again or use `REMOVE PARAM`.

*Incorrect:*
```surrealql
-- Local script shadowing does not mutate global database schema param
LET $MAX_LIMIT = 200;
```

*Fix:*
```surrealql
DEFINE PARAM $MAX_LIMIT ON DATABASE VALUE 200; // Re-define schema parameter
```





## 5. Practice Exercises

### Exercise 1: Defining Global System Parameters

**Scenario:**
Define a global database parameter `$tax_rate` set to `0.0825dec` so that all financial queries reference a single constant rate.

**Requirements:**
1. Write `DEFINE PARAM $tax_rate VALUE 0.0825dec`.
2. Use `$tax_rate` in a `SELECT` calculation.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Define global system parameter
> DEFINE PARAM $tax_rate VALUE 0.0825dec;
> 
> -- Reference parameter in queries
> SELECT price, price * $tax_rate AS tax FROM product;
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE PARAM $name VALUE expr` creates global database parameters accessible across all client sessions.
> 2. Standardizes global constants (tax rates, feature flags, API limits) in database metadata.
> 3. Updates to `$tax_rate` immediately affect all subsequent query calculations.

---

### Exercise 2: Idempotent Parameter Overwrites with `OVERWRITE`

**Scenario:**
Update global parameter `$tax_rate` to `0.0850dec` using `DEFINE PARAM OVERWRITE`.

**Requirements:**
1. Write `DEFINE PARAM OVERWRITE $tax_rate VALUE 0.0850dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE PARAM OVERWRITE $tax_rate VALUE 0.0850dec;
> ```
>
> #### Technical Explanation
>
> 1. `OVERWRITE` updates existing parameter values idempotently without throwing "item exists" errors.
> 2. Simplifies deployment migration scripts.
> 3. Takes effect across new transactions instantly.

---

### Exercise 3: Dropping Global Parameters with `REMOVE PARAM`

**Scenario:**
Drop global parameter `$tax_rate` using `REMOVE PARAM`.

**Requirements:**
1. Write `REMOVE PARAM $tax_rate`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE PARAM $tax_rate;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE PARAM` drops global parameters from database metadata.
> 2. Prevents queries from referencing obsolete parameter names.
> 3. Cleans up unused global constants.

---





## 6. Related Terms

- [Parameters (`$param`)](../level_06/parameters.md) — Query-level parameter syntax.
- [`LET` Statement](../level_06/let_statement.md) — Transient session variables.
- [`DEFINE FUNCTION`](define_function.md) — Reusable server-side functions.

---

## 7. Key Takeaways
- `DEFINE PARAM` creates persistent, database-wide global parameters.
- Unlike `LET` (query-scoped), `DEFINE PARAM` persists across all client connections and server restarts.
- Ideal for global application configuration, feature toggles, and shared system constants.
