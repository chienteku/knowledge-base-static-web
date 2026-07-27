# Parameters (`$param`)

> **Level 6 — Advanced Querying & Functions**
> The syntax convention in SurrealQL where variable names are prefixed with a dollar sign (`$param`), used for binding parameter values safely to prevent SQL injection and reuse values across queries.

---

## 1. Prerequisites
- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [Subqueries](subqueries.md) — Expression evaluation.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Parsed by the query compiler and SDK bindings. Parameters isolate raw values from executable AST nodes).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Parameter Assignment

**Problem:** You are building an API endpoint to update product stock.
Write the SurrealQL statements to:
1. Declare a parameter `$item_id` set to `product:laptop`.
2. Declare a parameter `$qty` set to `5`.
3. Update the `product` record matching `$item_id`, adding `$qty` to its `stock` field using the addition assignment operator.

**Expected output:**
```sql
LET $item_id = product:laptop;
LET $qty = 5;

UPDATE $item_id SET stock += $qty;
```

> [!check]- Answer
> - Define variables using the `LET` keyword and dollar sign prefix `$`.
> - Target the parameter directly in the `UPDATE` clause.

---



### Exercise 2: Defining Global Schema Parameter

**Problem:** Define global database parameter `$APP_NAME` set to `"My Application"` using `DEFINE PARAM`.

**Expected output:**
```text
DEFINE PARAM $APP_NAME ON DATABASE VALUE "My Application";
```

> [!check]- Answer
> ```surrealql
> DEFINE PARAM $APP_NAME ON DATABASE VALUE "My Application";
> ```
>
> **Explanation:** `DEFINE PARAM $var ON DATABASE VALUE val` sets global database constants.

### Exercise 3: Parameterized SDK Query

**Problem:** Write JS SDK call executing `SELECT * FROM user WHERE role = $role` with parameter `{ role: "admin" }`.

**Expected output:**
```text
await db.query('SELECT * FROM user WHERE role = $role', { role: "admin" });
```

> [!check]- Answer
> ```javascript
> await db.query('SELECT * FROM user WHERE role = $role', { role: "admin" });
> ```
>
> **Explanation:** Parameterized SDK queries prevent SQL injection vulnerabilities.

## 7. Related Terms
- [`LET` Statement](let_statement.md) — Defining query-scoped variables.
- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 8. Key Takeaways
- Parameters in SurrealQL are identifiers prefixed with a dollar sign (`$param`).
- Separates query execution logic from user-supplied raw values.
- Prevents SurrealQL injection vulnerabilities across all client interfaces.
- System parameters (`$auth`, `$value`, `$before`, `$after`) are automatically populated.
- Bind variables via SDK query methods or `LET` session statements.
