# Parameters (`$param`)

> **Level 6 — Advanced Querying & Functions**
> The syntax convention in SurrealQL where variable names are prefixed with a dollar sign (`$param`), used for binding parameter values safely to prevent SQL injection and reuse values across queries.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [Subqueries](subqueries.md) — Expression evaluation.

---

## 2. Term Category


**Query Feature (session & query parameter variables)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Constructing queries by dynamically concatenating user input strings into raw SQL strings creates severe security risks:
- SQL Injection attacks: malicious inputs (like `' OR 1=1; --`) modify the execution logic.
- Hardcoding values makes queries rigid and hard to reuse in application SDKs.

In PostgreSQL, prepared statements use positional parameters (`$1`, `$2`). In MongoDB, drivers pass object fields directly.

We designed **Parameters** in SurrealQL using the `$param` dollar-sign syntax as a first-class feature across the database. Any identifier starting with `$` is parsed as a parameter variable. Parameters can be passed from client SDKs, set during query sessions, or declared globally, ensuring clean injection-safe execution.

---

### (2) Built-in System Parameters vs. Custom Parameters
- **Custom Parameters:** Variables defined by you or passed by SDKs (e.g. `$name`, `$min_age`, `$status`).
- **Built-in System Parameters:** Automatically populated by SurrealDB in specific contexts:
  - `$auth`: The currently authenticated user record.
  - `$value`: The incoming field value inside `ASSERT` and `VALUE` field clauses.
  - `$before` / `$after`: The previous and new record states in `DEFINE EVENT` triggers.

---

### (3) Reality Metaphor (Fill-in-the-Blank Templates)
Imagine sending official contract forms:
- **Raw Concatenation:** Handwriting a new contract from scratch every time, typing the client's name into the middle of legal sentences. If the client's name has special symbols or commands, it messes up the contract layout.
- **Parameters (`$param`):** Using a pre-printed **Fill-in-the-Blank Form**.
  - The form text is static: *"The agreement is between company and `$client_name`."*
  - You pass the name separately on a sticky note. The legal text can never be altered by the contents of the sticky note.

---

### (4) Code Examples

#### Using Parameters in SurrealQL

```sql
-- 1. Defining parameters in a SurrealQL query session using LET
LET $target_role = "admin";
LET $min_score = 80;

-- Use parameters inside queries safely
SELECT * FROM user WHERE role = $target_role AND score >= $min_score;

-- 2. Passing parameters via Client SDK (JavaScript example conceptually)
-- db.query("SELECT * FROM product WHERE price <= $max_price", { max_price: 50.00 });

-- 3. Accessing system parameters in queries
SELECT * FROM post WHERE author = $auth.id;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Concatenating strings in application code instead of using SDK parameter bindings

**The mistake:** Constructing a query in Node.js via string template literals: `` `SELECT * FROM user WHERE email = '${userEmail}'` ``.

**Why it's wrong:** If `userEmail` contains malicious SQL syntax, it alters the SurrealQL query structure, exposing your database to injection attacks.

**Fix: Always pass variables using parameter bindings in SDK calls:**

```javascript
// BAD (Vulnerable to injection)
db.query(`SELECT * FROM user WHERE email = '${userEmail}'`);

// GOOD (Safe parameterized query)
db.query("SELECT * FROM user WHERE email = $email", { email: userEmail });
```

---



### Mistake 2: Concatenating Client User Input Directly into SurrealQL Strings (SQL Injection Risk)

**The mistake:** Concatenating user input string into query `"SELECT * FROM user WHERE email = '" + userInput + "'"`.

**Why it's wrong:** String concatenation invites SQL injection attacks. Pass user inputs securely as query parameters (`$email`) in SDK client calls.

*Incorrect:*
```surrealql
// SQL Injection vulnerability!
await db.query(`SELECT * FROM user WHERE email = '${userInput}'`);
```

*Fix:*
```surrealql
// Safe parameterized query
await db.query('SELECT * FROM user WHERE email = $email', { email: userInput });
```

### Mistake 3: Using `DEFINE PARAM` for Transient Local Query Variables

**The mistake:** Defining global `DEFINE PARAM $temp ON DATABASE VALUE 1;` for short-lived local script variables.

**Why it's wrong:** `DEFINE PARAM` creates persistent schema-level global parameters stored in the database. Use `LET $temp = 1;` for transient query variables.

*Incorrect:*
```surrealql
DEFINE PARAM $temp ON DATABASE VALUE 1; // ❌ Persists global schema parameter!
```

*Fix:*
```surrealql
LET $temp = 1; // Temporary script variable
```

## 5. Practice Exercises

### Exercise 1: Using Built-in Session Parameters

**Scenario:**
Inspect active session context parameters (`$session`, `$auth`, `$scope`) inside a client query.

**Requirements:**
1. Select `$session.ns`, `$session.db`, and `$auth.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     $session.ns AS active_ns,
>     $session.db AS active_db,
>     $auth.id AS authenticated_user;
> ```
>
> #### Technical Explanation
>
> 1. `$session` holds active connection session metadata (namespace, database, connection ID).
> 2. `$auth` holds authenticated user record document context.
> 3. Used inside table `PERMISSIONS` clauses to enforce row-level security.
> 
---

### Exercise 2: Defining Custom Script Parameters with `LET`

**Scenario:**
Define custom parameters `$min_price` and `$max_price` to filter products dynamically.

**Requirements:**
1. Define `LET $min_price = 10.00dec;`.
2. Define `LET $max_price = 50.00dec;`.
3. Filter `WHERE price >= $min_price AND price <= $max_price`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $min_price = 10.00dec;
> LET $max_price = 50.00dec;
> 
> SELECT * FROM product 
> WHERE price >= $min_price AND price <= $max_price;
> ```
>
> #### Technical Explanation
>
> 1. Custom parameters (`$name`) store pre-evaluated expressions or literals.
> 2. Prevents SQL injection risks by parameterizing query filters.
> 3. Scoped to the current session or script execution context.
> 
---

### Exercise 3: Modifying Session Scope with `USE` Parameters

**Scenario:**
Switch active session namespace and database context using `USE NS` and `USE DB`.

**Requirements:**
1. Switch to namespace `production` and database `main`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> USE NS production DB main;
> ```
>
> #### Technical Explanation
>
> 1. `USE NS ... DB ...` updates active `$session.ns` and `$session.db` parameters.
> 2. Targets subsequent queries to specified tenant scopes.
> 3. Manages multi-tenant session contexts dynamically.
> 
---



## 6. Related Terms

- [`LET` Statement](let_statement.md) — Defining query-scoped variables.
- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [Subqueries](subqueries.md) — Related concept: Subqueries.
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Related concept: SurrealQL Injection Prevention.
- [`DEFINE PARAM`](../level_09/define_param.md) — Related concept: `DEFINE PARAM`.
- [SDK `.query()` with Parameters](../level_10/sdk_query.md) — Related concept: SDK `.query()` with Parameters.

---

## 7. Key Takeaways
- Parameters in SurrealQL are identifiers prefixed with a dollar sign (`$param`).
- Separates query execution logic from user-supplied raw values.
- Prevents SurrealQL injection vulnerabilities across all client interfaces.
- System parameters (`$auth`, `$value`, `$before`, `$after`) are automatically populated.
- Bind variables via SDK query methods or `LET` session statements.
