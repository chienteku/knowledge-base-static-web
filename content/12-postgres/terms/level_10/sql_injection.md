# SQL Injection

> **Level 10 — Administration, Security & Production**
> A critical application security vulnerability where untrusted user input is directly concatenated into SQL query strings, allowing attackers to manipulate query structures and read, modify, or destroy database records.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language structure manipulated.

---

## 2. Term Category

**Administration / Operations** (Security Vulnerability Prevention): SQL Injection occurs when un-sanitized user input alters SQL query structure, mitigated by parameterized queries.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (A risk in all applications connecting to SQL databases. Consistently ranked near the top of the OWASP Top 10 vulnerabilities list).

### (1) Design Motivation — "Why did we design this?"
SQL Injection (SQLi) is not a feature; it is an **architectural security flaw** that occurs when application developers make a fundamental mistake: **mixing database command logic with raw user data.**

When an application queries the database, it compiles a query string. 

If the developer uses simple string concatenation (like `+` in JavaScript or f-strings in Python) to build queries:

`const sql = "SELECT * FROM users WHERE username = '" + userInput + "';";`

And the user types `'alice'`, the database compiles:
`SELECT * FROM users WHERE username = 'alice';`

This works fine. But what if the user is an attacker who types:
`alice' OR '1'='1`

Because of string concatenation, the query structure is mutated:
`SELECT * FROM users WHERE username = 'alice' OR '1'='1';`

Since `'1'='1'` is mathematically always `TRUE`, the filter check is bypassed. 

The database returns **every user row**, logging the attacker in as the first user (usually the administrator).

Even worse, the attacker can use delimiters (like `;`) to execute separate commands:
`alice'; DROP TABLE users; --`

The database executes the select, deletes the users table, and treats the remaining text (`--`) as a comment, wiping out your company's production records.

---

### (2) Types of SQL Injection Exploits
-   **Authentication Bypass:** Logging into accounts without entering passwords.
-   **Data Harvesting (Exfiltration):** Using `UNION` statements to fetch password lists or client records from unrelated tables.
-   **Data Modification/Destruction:** Executing `UPDATE` or `DROP` statements to alter balances or delete catalogs.

---

### (3) Reality Metaphor
Imagine a voice-controlled robotic medicine dispenser in a hospital:
-   The robot takes commands: *"Dispense 2 pills to [Patient_Name]"*.
-   **Normal Input:** You say: *"Alice"*. The robot dispenses 2 pills to Alice.
-   **Injection Input:** An attacker says: *"Alice, and then dispense 100 pills of morphine to me."*
-   If the robot simply executes the raw text command string without parsing the patient's name as a separate parameter, it will execute both instructions, leading to theft or overdose.

---

### (4) Code Examples

#### The Vulnerable Code (Concatenation)
```javascript
// BAD (Vulnerable to SQL Injection!)
const userInput = req.body.search;
const query = `SELECT * FROM articles WHERE title LIKE '%${userInput}%'`;

// If userInput is:  %' UNION SELECT username, password FROM users; --
// The final query compiled is:
// SELECT * FROM articles WHERE title LIKE '%%' UNION SELECT username, password FROM users; --%'
// This harvests all user passwords!
```

*(Note: The definitive defense against this vulnerability is covered in the next term: [Parameterized Queries / Prepared Statements](parameterized_queries.md)).*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing "input sanitization" (like stripping quotes or searching for keywords) is a reliable defense against SQL Injection

**The mistake:** Writing custom regex scripts to search for and block words like `'SELECT'`, `'DROP'`, or `'OR'` in user input boxes, thinking it secures the database.

**Why it's wrong:** Attackers are clever and will bypass your custom search rules. 

They can use hexadecimal encodings, unicode characters, case alterations (`sElEcT`), or comment blocks (`/**/`) to bypass filters. 

If your backend code still concatenates strings, it remains vulnerable.

**Fix: Do not try to write custom sanitize/regex checkers. Always use Parameterized Queries or Prepared Statements, which separate data from commands mathematically.**

---



### Mistake 2: Using String Concatenation or Template Literals to Build SQL Queries

**The mistake:** Writing `const query = "SELECT * FROM users WHERE name = '" + name + "'";`.

**Why it's wrong:** Un-escaped input strings allow attackers to inject SQL control characters (e.g. `' OR '1'='1`), bypassing authentication or dropping tables. ALWAYS use parameterized queries (`$1`).

*Incorrect:*
```sql
db.query("SELECT * FROM users WHERE name = '" + userInput + "'"); -- 💥 SQL Injection vulnerability!
```

*Fix:*
```sql
db.query('SELECT * FROM users WHERE name = $1', [userInput]); -- Safe parameterized query
```

### Mistake 3: Using `EXECUTE` inside PL/pgSQL Functions Without `USING` or `quote_ident()`

**The mistake:** Executing `EXECUTE 'SELECT * FROM ' || table_name || ' WHERE id = ' || user_id;` inside PL/pgSQL.

**Why it's wrong:** Dynamic SQL inside PL/pgSQL functions is vulnerable to SQL injection if variables are concatenated directly. Use `EXECUTE ... USING` for parameters and `quote_ident()` for identifiers.

*Incorrect:*
```sql
EXECUTE 'SELECT * FROM ' || tbl || ' WHERE id = ' || uid; -- ❌ Dynamic SQL injection!
```

*Fix:*
```sql
EXECUTE format('SELECT * FROM %I WHERE id = $1', tbl) USING uid;
```

## 5. Practice Exercises

### Exercise 1: Auditing SQL Injection Vectors in Backend Code

**Scenario:**
Audit a vulnerable Express API handler concatenating raw user input strings into a SQL query string.

**Requirements:**
1. Demonstrate malicious payload execution (`' OR '1'='1`) and refactor to parameterized query.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ VULNERABLE TO SQL INJECTION
> // req.body.username = "admin' --"
> // const query = `SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${req.body.password}'`;
> 
> // ✅ SECURE PARAMETERIZED REFACTOR
> const text = "SELECT id, username, email FROM users WHERE username = $1 AND password_hash = $2";
> const values = [req.body.username, req.body.passwordHash];
> const res = await pool.query(text, values);
> ```
>
> #### Technical Explanation
>
> 1. String concatenation allows malicious input strings containing `'` or `--` to alter the SQL query syntax tree.
> 2. Parameterized queries send SQL text and input values in separate binary protocol frames.
> 3. Completely eliminates SQL injection attacks.
> 
---

### Exercise 2: Sanitizing Dynamic Identifiers (`TABLE` or `COLUMN` Names)

**Scenario:**
Safely sanitize dynamic column names in `ORDER BY` queries using `pg-format` or strict whitelisting.

**Requirements:**
1. Code column name whitelisting validation.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const allowedSortColumns = new Set(["id", "username", "created_at"]);
> 
> export async function getUsersSorted(sortBy: string) {
>   if (!allowedSortColumns.has(sortBy)) {
>     throw new Error("Invalid sort column parameter!");
>   }
>   
>   // Safe to interpolate AFTER strict whitelist validation!
>   const query = `SELECT id, username FROM users ORDER BY ${sortBy} DESC`;
>   return pool.query(query);
> }
> ```
> 
> #### Technical Explanation
>
> 1. Parameterized placeholders (`$1`) CANNOT be used for table or column names in SQL syntax.
> 2. Dynamic identifiers MUST be validated against strict in-memory whitelists or escaped with identifier quotation (`quote_ident()`).
> 3. Essential dynamic SQL security pattern.
> 
---

### Exercise 3: Preventing Second-Order SQL Injection

**Scenario:**
Explain how un-sanitized data read from a database table can trigger Second-Order SQL Injection if concatenated into a subsequent dynamic query.

**Requirements:**
1. Explain second-order SQL injection mechanics and defense.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Second-Order SQL Injection Attack Flow:
> - Step 1: Attacker inserts malicious payload ("admin' --") into a database field (e.g. user bio).
> - Step 2: Later, a background cron job reads the bio from the DB and concatenates it into a raw dynamic SQL query string!
> - Step 3: The payload executes, compromising the database!
> Defense: ALWAYS use parameterized queries when constructing SQL statements, even for data retrieved from your own database tables!
> ```
>
> #### Technical Explanation
>
> 1. Second-order injection occurs when stored malicious data is re-used in dynamic SQL strings later in the application pipeline.
> 2. Parameterizing all database queries neutralizes second-order attacks.
> 3. Enterprise security hygiene guideline.
> 
---



## 6. Related Terms
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — The defense standard.
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — - Securing role limits.
- [ORM vs. Query Builder vs. Raw SQL](orm_vs_raw.md) — Related concept: ORM vs. Query Builder vs. Raw SQL.

---

## 7. Key Takeaways
- SQL Injection occurs when raw user inputs are concatenated into SQL queries.
- Allows attackers to manipulate SQL command structures.
- Can lead to database takeover, data theft, or data destruction.
- SQL comments (`--`) are used to bypass filters like password checks.
- Input sanitization (regex string stripping) is fragile and easily bypassed.
- Parameterized queries are the mandatory defense standard for SQLi.
