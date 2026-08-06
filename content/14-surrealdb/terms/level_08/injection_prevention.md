# SurrealQL Injection Prevention

> **Level 8 — Authentication, Permissions & Security**
> Understanding how SurrealDB prevents injection vulnerabilities through query parameterization (`$param`), AST-based query parsing, and safe SDK binding practices.

---

## 1. Prerequisites

- [Parameters (`$param`)](../level_06/parameters.md) — Parameter syntax in SurrealQL.
- [JavaScript / TypeScript SDK](../level_10/js_sdk.md) — SDK query methods.

---

## 2. Term Category


**Authentication & Permissions (SurrealQL query injection defense)**: - **Security & Best Practices**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational SQL databases (PostgreSQL), concatenated string inputs like `SELECT * FROM user WHERE email = '` + `userInput` + `'` open up **SQL Injection** vulnerabilities, allowing attackers to inject malicious clauses like `' OR '1'='1`. In MongoDB, unsafe JSON input can trigger **NoSQL Injection** via operator objects (`{ $gt: "" }`).

SurrealDB eliminates injection vulnerabilities at the protocol and parser level when developers use **parameterized bindings (`$param`)**. When parameters are passed separately from the query text, SurrealDB parses the SurrealQL string into a strict Abstract Syntax Tree (AST). Parameter values are treated strictly as data literals and can *never* mutate the query's structural execution tree.

### (2) Reality Metaphor
Think of a bank deposit slip:
- **String Concatenation (Dangerous)**: Handwriting instructions directly on the cash voucher where an attacker can write "Deposit $100 AND transfer $1,000,000 to Account B".
- **Parameterization (Safe)**: A locked form with pre-printed boxes labeled `Amount` and `Account Number`. No matter what text a user writes inside the `Amount` box (even if they write SQL commands), the bank teller machine treats it strictly as a string value inside that single field.

### (3) Code Examples

#### Short Snippet
```javascript
// SAFE: Parameterized query binding via SurrealDB JavaScript SDK
const users = await db.query(
    'SELECT * FROM user WHERE email = $email AND age >= $minAge',
    { email: userInputEmail, minAge: 18 }
);
```

#### Fuller Example
```javascript
import Surreal from 'surrealdb';
const db = new Surreal();

// Unsafe User Input containing attempted SurrealQL Injection attack
const attackerInput = "tobie' OR role = 'admin' OR name = '";

// 1. DANGEROUS: String Interpolation (Vulnerable to SurrealQL Injection!)
// DO NOT DO THIS!
const unsafeQuery = `SELECT * FROM user WHERE name = '${attackerInput}'`;
// Resulting query text: SELECT * FROM user WHERE name = 'tobie' OR role = 'admin' OR name = ''

// 2. SAFE: Prepared Parameter Binding (Immune to Injection)
const safeResult = await db.query(
    'SELECT * FROM user WHERE name = $name',
    { name: attackerInput }
);
// The parser evaluates $name strictly as the literal string "tobie' OR role = 'admin' OR name = '"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Template Literals to Build SurrealQL Queries in Node.js

**The mistake:** Using JavaScript ES6 template literals (`` `SELECT * FROM user WHERE id = ${id}` ``) instead of SDK parameter objects.

**Why it's wrong:** Template string interpolation pastes untrusted input directly into the query string before it reaches the database parser, bypassing all parameter security protections.

*Incorrect:*
```javascript
// Vulnerable to injection!
const res = await db.query(`SELECT * FROM post WHERE title = '${req.body.title}'`);
```

*Fix:*
```javascript
// Safe parameter binding
const res = await db.query('SELECT * FROM post WHERE title = $title', {
    title: req.body.title
});
```

---



### Mistake 2: Concatenating User Input Strings into Dynamic SurrealQL Queries

**The mistake:** Constructing SurrealQL queries with string concatenation `` `SELECT * FROM user WHERE email = '${input}'` ``.

**Why it's wrong:** String concatenation permits SQL injection attacks (e.g. input `' OR 1=1 --`). Always use parameterized queries (`$email`).

*Incorrect:*
```surrealql
// Vulnerable string concatenation
await db.query(`SELECT * FROM user WHERE email = '${userInput}'`); // ❌ SQL Injection risk!
```

*Fix:*
```surrealql
// Safe parameterized query
await db.query('SELECT * FROM user WHERE email = $email', { email: userInput });
```

### Mistake 3: Sanitizing Inputs Manually with Custom Regex Instead of Using Parameterized Bindings

**The mistake:** Attempting custom string escaping regex functions before string concatenation.

**Why it's wrong:** Custom escaping functions often have edge-case bypasses. Database parameter binding (`$param`) guarantees complete protection at the protocol layer.

*Incorrect:*
```surrealql
const cleanInput = userInput.replace(/'/g, "''"); // ❌ Fragile manual escaping!
```

*Fix:*
```surrealql
await db.query('SELECT * FROM user WHERE name = $name', { name: userInput });
```





## 5. Practice Exercises

### Exercise 1: Parameterized Queries vs String Concatenation

**Scenario:**
Demonstrate rewriting a vulnerable string-concatenated query into a safe parameterized query using SurrealQL parameters.

**Requirements:**
1. Contrast vulnerable string concatenation with parameterized SDK variables.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ VULNERABLE to SurrealQL Injection:
> // const query = `SELECT * FROM user WHERE username = '${userInput}'`;
> 
> // ✅ SAFE Parameterized Query:
> const result = await db.query(
>   "SELECT * FROM user WHERE username = $username",
>   { username: userInput }
> );
> ```
>
> #### Technical Explanation
>
> 1. Parameterized queries (`$username`) send query structure and parameter values separately to the database engine.
> 2. Prevents malicious user input from altering SurrealQL syntax trees.
> 3. Eliminates SurrealQL injection vulnerabilities completely.

---

### Exercise 2: Disabling Arbitrary Script Execution CLI Flags

**Scenario:**
Harden a production SurrealDB instance by passing startup flags to disable embedded JavaScript functions.

**Requirements:**
1. Formulate `surreal start` command passing `--deny-scripting`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --bind 0.0.0.0:8000 >   --user root >   --pass "HardenedPass2026!" >   --deny-scripting >   file:///var/data/surreal.db
> ```
>
> #### Technical Explanation
>
> 1. `--deny-scripting` disables execution of embedded JavaScript functions (`function() { ... }`).
> 2. Mitigates remote code execution risks from arbitrary guest queries.
> 3. Hardens server instance security profiles.

---

### Exercise 3: Input Type Coercion Sanitization

**Scenario:**
Sanitize user input parameters by enforcing type coercion using `<record>` or `<int>` casts.

**Requirements:**
1. Cast `$user_input` to `<record<user>>`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM user WHERE id = <record<user>> $user_input;
> ```
>
> #### Technical Explanation
>
> 1. Explicit type coercion (`<record<user>>`) rejects inputs failing target data type rules.
> 2. Prevents type confusion attacks.
> 3. Sanitizes dynamic parameters before query execution.

---





## 6. Related Terms

- [Parameters (`$param`)](../level_06/parameters.md) — SurrealQL query variables.
- [JavaScript / TypeScript SDK](../level_10/js_sdk.md) — SDK query methods.
- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Row-level authorization.
- [System Users (`DEFINE USER`)](define_user.md) — Related concept: System Users (`DEFINE USER`).
- [SDK `.query()` with Parameters](../level_10/sdk_query.md) — Related concept: SDK `.query()` with Parameters.

---

## 7. Key Takeaways
- Never concatenate untrusted user input directly into SurrealQL query strings.
- Always use parameterized query bindings (`$param`) in SDK `.query()` calls.
- Parameterization guarantees user inputs are treated as literal values, preventing SurrealQL Injection.
