# Parameterized Queries / Prepared Statements

> **Level 10 — Security & Production**
> The database practice of separating SQL query command templates from user data parameters, compiling the query structure first and treating all subsequent inputs strictly as literal values, completely blocking SQL injection.

---

## 1. Prerequisites
- [SQL Injection](sql_injection.md) — The critical security vulnerability blocked.

---

## 2. Term Category

**Administration / Operations** (SQL Injection Mitigation): Parameterized Queries pass SQL text and user inputs separately to the database parser, eliminating SQL injection vulnerabilities.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported natively by the PostgreSQL protocol. Evaluated at the engine parser layer. Placeholders are written as `$1`, `$2` in Postgres SQL syntax).

### (1) Design Motivation — "Why did we design this?"
As learned in `sql_injection.md`, concatenating user input directly into SQL strings allows attackers to manipulate query structures, creating severe security vulnerabilities.

We designed **Parameterized Queries** (also known as **Prepared Statements**) to solve this security flaw. 

The core principle is simple: **data must never be treated as code.**

Under the hood, parameterized queries execute in two distinct phases:

1.  **Preparation Phase:** The application sends the SQL query structure containing placeholders (like `$1`, `$2`) to the database:
    `SELECT * FROM users WHERE email = $1;`
    The database parses, compiles, and optimizes this query template *before* seeing the user input.
2.  **Execution Phase:** The application sends the raw user input (the parameters) separately.
3.  **Safety Guarantee:** Because the database has already compiled the query's execution plan, it treats the input strictly as a **literal string value** matching the `$1` slot. 
    -   Even if the input contains SQL commands like `alice' OR '1'='1` or `DROP TABLE`, Postgres does not evaluate them as code. 
    -   It simply searches for a user whose literal email address matches that exact text string. Since no such email exists, the search returns zero rows safely.

---

### (2) Prepared Statements Performance Benefit
Besides security, prepared statements speed up performance: if your app runs the same query millions of times (e.g. looking up products by ID), Postgres compiles the plan once and saves it in RAM. 

Subsequent queries skip the parsing/planning phase entirely, reducing CPU load.

---

### (3) Reality Metaphor
Imagine a bank teller desk:
-   **Vulnerable String Concatenation:** You hand the teller a blank piece of paper saying: *"Withdraw $100 from Alice, and then wire all Alice's remaining money to Bob."* The teller reads the note and performs both commands.
-   **Parameterized Query:** The teller hands you a printed **Official Form** containing a specific blank box: **`[Account Name: ______________]`**. 
    -   You write: *"Alice, and then wire all money to Bob"* inside the box.
    -   The teller looks at the form and says: *"I am looking for a customer whose literal legal name is 'Alice, and then wire...'. Since no such person exists, this transaction is rejected."* The printed form separates the data from the command.

---

### (4) Code Examples

#### Secure Query Execution in Node.js (pg client)
Placeholders in PostgreSQL are written using `$1`, `$2`, `$3`:

```javascript
// SECURE: Separates query structure from parameters
const queryText = 'SELECT * FROM users WHERE email = $1 AND status = $2';
const queryValues = [req.body.email, 'active']; // Inputs sent separately

// The pg driver sends these as separate binary packets to Postgres
const result = await db.query(queryText, queryValues);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use placeholders ($1) for table names or column names

**The mistake:** Writing a query to dynamically select from tables based on user inputs, using placeholders for the table name:

```sql
-- BAD: Fails with a syntax error!
SELECT * FROM $1 WHERE id = $2;
```

**Why it's wrong:** The database query planner must compile the query plan during the preparation phase. 

If it doesn't know what table to read, it cannot check permissions, fetch index lists, or analyze columns. 

Postgres will throw a syntax error. 

Placeholders can **only** be used for literal data values (like strings, numbers, or dates).

**Fix: If you need dynamic table or column names, validate them against a strict Whitelist of hardcoded table strings inside your application code before injecting them.**

```javascript
// Whitelist verification template
const validTables = ['products', 'categories'];
if (!validTables.includes(userTableInput)) {
  throw new Error('Invalid table access request');
}
// Safe injection of whitelisted variable
const query = `SELECT * FROM ${userTableInput} WHERE id = $1`;
```

---



### Mistake 2: Concatenating User Input Strings directly into SQL Query Strings (SQL Injection)

**The mistake:** Writing `const query = "SELECT * FROM users WHERE email = '" + userInput + "'";`.

**Why it's wrong:** String concatenation allows malicious input (e.g. `' OR '1'='1`) to mutate SQL syntax tree structure! ALWAYS use parameterized placeholders (`$1`, `$2`).

*Incorrect:*
```sql
db.query("SELECT * FROM users WHERE email = '" + input + "'"); -- 💥 Vulnerable to SQL Injection!
```

*Fix:*
```sql
db.query('SELECT * FROM users WHERE email = $1', [input]); -- Safe parameterized query
```

### Mistake 3: Attempting to Parameterize Table Names or Column Identifiers with `$1`

**The mistake:** Executing `db.query('SELECT * FROM $1 WHERE id = $2', ['users', 1]);`.

**Why it's wrong:** SQL parameter placeholders (`$1`) can ONLY substitute data values, NOT table names or column identifiers! Use identifier escaping (`pg-format` / `quote_ident()`) for dynamic table names.

*Incorrect:*
```sql
SELECT * FROM $1 WHERE id = $2; -- ❌ Syntax error: cannot parameterize table name!
```

*Fix:*
```sql
Use pg-format: format('SELECT * FROM %I WHERE id = $1', tableName), [id]
```

## 5. Practice Exercises

### Exercise 1: Parameterized Query Execution in Node.js

**Scenario:**
Write a parameterized user login query in Node.js using `pg` to prevent SQL Injection.

**Requirements:**
1. Use `pool.query('SELECT * FROM users WHERE email = $1 AND password_hash = $2', [email, hash])`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { pool } from "./db";
> 
> export async function authenticateUser(email: string, passwordHash: string) {
>   const text = "SELECT id, username, email FROM users WHERE email = $1 AND password_hash = $2";
>   const values = [email, passwordHash];
>   
>   const res = await pool.query(text, values);
>   return res.rows[0] || null;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `$1` and `$2` pass parameter values separately from the SQL statement string.
> 2. PostgreSQL prepares the query execution plan for the SQL text first, ensuring user input values are treated strictly as data literals (NOT executable SQL syntax).
> 3. Fundamental SQL Injection defense rule.
> 
---

### Exercise 2: Server-Side Prepared Statements with `PREPARE` and `EXECUTE`

**Scenario:**
Create a server-side prepared statement `get_user_by_id` and execute it with parameter values.

**Requirements:**
1. Execute `PREPARE get_user_by_id (INT) AS SELECT ...`, followed by `EXECUTE get_user_by_id(42)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> PREPARE get_user_by_id (INTEGER) AS 
> SELECT id, username, email 
> FROM users 
> WHERE id = $1;
> 
> EXECUTE get_user_by_id(42);
> 
> DEALLOCATE get_user_by_id;
> ```
>
> #### Technical Explanation
>
> 1. `PREPARE statement_name (types) AS query` parses and plans the query once on the PostgreSQL server.
> 2. `EXECUTE statement_name(values)` reuses the pre-planned query execution plan with new parameter values.
> 3. Saves query parsing and planning CPU cycles on repeated high-frequency queries.
> 
---

### Exercise 3: Auditing String Concatenation Vulnerabilities

**Scenario:**
Audit a vulnerable database query using string template literals (`${email}`) and refactor it to a parameterized query.

**Requirements:**
1. Contrast vulnerable template literal vs secure parameterized query.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ VULNERABLE TO SQL INJECTION (Attacker passes email = "' OR '1'='1")
> // const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
> 
> // ✅ SECURE PARAMETERIZED QUERY
> const query = "SELECT id, username, email FROM users WHERE email = $1";
> const res = await pool.query(query, [req.body.email]);
> ```
>
> #### Technical Explanation
>
> 1. String concatenation inserts raw user input text directly into the SQL parser pipeline.
> 2. Parameterized queries send SQL code and data values over separate binary protocol frames.
> 3. Eliminates SQL injection vulnerabilities entirely.
> 
---



## 6. Related Terms
- [SQL Injection](sql_injection.md) — The vulnerability blocked.
- [ORM vs. Query Builder vs. Raw SQL](orm_vs_raw.md) — Related concept: ORM vs. Query Builder vs. Raw SQL.

---

## 7. Key Takeaways
- Parameterized queries separate SQL logic commands from data values.
- Blocks SQL injection by treating all inputs strictly as literal values.
- PostgreSQL placeholders are defined using `$1`, `$2` sequence formats.
- Compiling query templates once speeds up execution times.
- Placeholders cannot be used for table names, column names, or SQL keywords.
- Always use parameterized queries for database inputs from web clients.
