# SQL Injection

> **Level 10 — Administration, Security & Production**
> A critical application security vulnerability where untrusted user input is directly concatenated into SQL query strings, allowing attackers to manipulate query structures and read, modify, or destroy database records.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language structure manipulated.

---

## 2. Term Category
- **Security Vulnerability**

---

## 3. Environment Context
- **Universal Standard** (A risk in all applications connecting to SQL databases. Consistently ranked near the top of the OWASP Top 10 vulnerabilities list).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Exploit Identification

**Problem:** You have a login validation query:
`SELECT * FROM users WHERE email = 'USER_INPUT' AND password = 'PASSWORD_INPUT';`
An attacker types this string into the email input box:
`admin@company.com' --`
Write the final SQL query compiled by the database, and explain why the password check was bypassed.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE email = 'admin@company.com' --' AND password = 'PASSWORD_INPUT';
> ```
> - Insert the user's input string directly into the `USER_INPUT` slot.
> - Replace the trailing text following the SQL comment syntax `--` with standard comment layouts.

---



### Exercise 2: Remediating SQL Injection Code

**Problem:** Fix vulnerable query `db.query("SELECT * FROM products WHERE category = '" + cat + "'")` using parameterized placeholder.

**Expected output:**
> [!check]- Answer
> ```text
> db.query('SELECT * FROM products WHERE category = $1', [cat])
> ```
> ```javascript
> db.query('SELECT * FROM products WHERE category = $1', [cat]);
> ```
>
> **Explanation:** Parameterized placeholders delegate string escaping to the database client driver.

---

### Exercise 3: Escaping Identifiers in Dynamic PL/pgSQL

**Problem:** Use `format()` with `%I` to safely escape table identifier variable `tbl_name` in dynamic PL/pgSQL statement.

**Expected output:**
> [!check]- Answer
> ```text
> EXECUTE format('SELECT COUNT(*) FROM %I', tbl_name) INTO cnt;
> ```
> ```sql
> EXECUTE format('SELECT COUNT(*) FROM %I', tbl_name) INTO cnt;
> ```
>
> **Explanation:** `format('%I', identifier)` safely quotes SQL identifiers to prevent injection.

## 7. Related Terms
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — The defense standard.
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) -- Securing role limits.

---

## 8. Key Takeaways
- SQL Injection occurs when raw user inputs are concatenated into SQL queries.
- Allows attackers to manipulate SQL command structures.
- Can lead to database takeover, data theft, or data destruction.
- SQL comments (`--`) are used to bypass filters like password checks.
- Input sanitization (regex string stripping) is fragile and easily bypassed.
- Parameterized queries are the mandatory defense standard for SQLi.
