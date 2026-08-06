# SQL Injection

> **Level 8 — Database Integration**
> The defense against the most famous database hack in history, where a malicious user enters SQL commands into a form input to trick the database into deleting or leaking data.

---

## 1. Prerequisites
- [The req & res Objects](../level_07/req_res.md) — Where the malicious user input comes from (`req.body`).
- [ORMs & ODMs](orms_odms.md) — The tools that automatically protect against this attack.

---

## 2. Term Category
- **Security / Vulnerability**

---

## 3. Environment Context
- **Database Queries**

---

## 4. Explanation

### (1) The Attack (How SQL Injection works)
Imagine you write a raw SQL query that takes a username from the login form (`req.body.username`) and inserts it directly into the string using template literals:
```javascript
// DANGEROUS CODE!
const username = req.body.username; 
const query = `SELECT * FROM users WHERE name = '${username}'`;
await pool.query(query);
```
If a normal user types `Bob`, the query becomes: `SELECT * FROM users WHERE name = 'Bob'`. Everything is fine.

But what if a hacker types this exact string into the username box: `' OR 1=1; DROP TABLE users; --`
The resulting string sent to the database becomes:
```sql
SELECT * FROM users WHERE name = '' OR 1=1; DROP TABLE users; --'
```
Because `1=1` is always true, it bypasses the password check. Then the `;` ends the command, and the database executes the next command: `DROP TABLE users;`. The hacker just deleted your entire database from the login screen!

### (2) The Solution: Parameterized Queries
To prevent this, you **never** inject user input directly into a string. 
Instead, you use **Parameterized Queries**. You put a placeholder (like `$1`) in the string, and send the user input as a completely separate array. The database treats the array as pure text, refusing to execute it as code.
```javascript
// SAFE CODE!
const username = req.body.username;
const query = "SELECT * FROM users WHERE name = $1";
const values = [username]; // Passed separately!

await pool.query(query, values);
```

### (3) The ORM Advantage
If you use an ORM like Prisma, you don't even have to think about this. **ORMs use Parameterized Queries automatically under the hood for every single request.** You are protected by default.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trusting the Admin panel

**The mistake:** A developer uses Parameterized Queries for the public login page, but for the internal Admin dashboard, they use raw string injection because "only trusted employees use the admin panel."

**Why it's wrong:** An employee's account can be compromised. Furthermore, employee names might legitimately contain characters that break SQL (e.g., "O'Connor"). The apostrophe in O'Connor will break a raw SQL string and crash the app!
**Golden Rule:** ALL user input, regardless of source, privilege, or format, must be Parameterized. Zero exceptions.

---



### Mistake 2: Constructing SQL Statements via String Concatenation (`"SELECT * FROM users WHERE id = " + id`)

**The mistake:** Building raw SQL queries by concatenating input strings.

**Why it's wrong:** Un-sanitized string concatenation allows attackers to append arbitrary SQL commands (e.g., `1; DROP TABLE users;--`), resulting in full data loss or unauthorized access.

*Incorrect:*
```javascript
const sql = "SELECT * FROM users WHERE username = '" + username + "'"; // ❌ Vulnerable to SQLi!
```

*Fix:*
```javascript
const sql = 'SELECT * FROM users WHERE username = $1';
await db.query(sql, [username]);
```

### Mistake 3: Believing Escaping Quotes Manually via Regex Is Sufficient Security Against SQL Injection

**The mistake:** Writing custom regex `input.replace(/'/g, "''")` instead of using parameterized queries.

**Why it's wrong:** Custom escaping functions frequently miss edge cases (encoding tricks, multibyte characters, numeric injection). Parameterized queries are mandatory.

*Incorrect:*
```javascript
const cleanInput = input.replace(/'/g, ''); // ❌ Unsafe custom sanitization!
```

*Fix:*
```javascript
db.query('SELECT * FROM items WHERE id = $1', [input]); // Always use parameterized queries
```

## 6. Practice Exercises

### Exercise 1: The Fix

**Problem:** How do you fix this vulnerable raw SQL code?
```javascript
const color = req.query.color;
const data = await pool.query(`SELECT * FROM cars WHERE color = '${color}'`);
```

**Expected output:**
> [!check]- Answer
> ```javascript
> const color = req.query.color;
> // Use $1 placeholder and pass the variable in an array!
> const data = await pool.query(`SELECT * FROM cars WHERE color = $1`, [color]);
> ```
> - Separate the code from the data. Use `$1` for the query, and an array for the data.
> 
---



### Exercise 2: Identifying SQL Injection Payload

**Problem:** If query is `SELECT * FROM users WHERE user = 'INPUT' AND pass = 'INPUT'`, what happens if user enters `' OR '1'='1`?

**Expected output:**
> [!check]- Answer
> ```text
> The query evaluates to true for all rows, returning all users and bypassing authentication.
> ```
> ```text
> The query evaluates to true for all rows, returning all users and bypassing authentication.
> ```
>
> **Explanation:** `' OR '1'='1` manipulates boolean logic to force the WHERE clause to evaluate to true.
> 
---

### Exercise 3: Preventing SQLi in Dynamic ORDER BY Clauses

**Problem:** Parameter placeholders cannot be used for SQL column names in `ORDER BY $1`. How do you safely handle dynamic sorting?

**Expected output:**
> [!check]- Answer
> ```text
> Validate user input against an allowed whitelist of valid column names before querying.
> ```
> ```javascript
> const allowed = ['name', 'created_at', 'price'];
> const sortColumn = allowed.includes(req.query.sort) ? req.query.sort : 'created_at';
> db.query(`SELECT * FROM products ORDER BY ${sortColumn}`);
> ```
>
> **Explanation:** Column/table identifiers require strict whitelist validation since they cannot be parameterized.
> 
## 7. Related Terms
- [ORMs & ODMs](orms_odms.md) — The best way to never worry about SQL Injection again.
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — Related concept: Parameterized Queries / Prepared Statements.
- [Input Validation (joi / zod)](../level_09/input_validation.md) — Related concept: Input Validation (joi / zod).

---

## 8. Key Takeaways
- **SQL Injection** is a hack where users type database commands into text inputs to steal or destroy data.
- It is caused by concatenating (injecting) user input directly into raw SQL strings.
- You prevent it by using **Parameterized Queries** (placeholders like `$1`), which forces the database to treat the input strictly as text, not code.
- Modern ORMs handle this protection automatically.
