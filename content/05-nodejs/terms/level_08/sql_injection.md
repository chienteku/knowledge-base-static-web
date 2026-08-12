# SQL Injection

> **Level 8 — Database Integration**
> The defense against the most famous database hack in history, where a malicious user enters SQL commands into a form input to trick the database into deleting or leaking data.

---

## 1. Prerequisites
- [The req & res Objects](../level_07/req_res.md) — Where the malicious user input comes from (`req.body`).
- [ORMs & ODMs](orms_odms.md) — The tools that automatically protect against this attack.

---

## 2. Term Category

**Security / Vulnerability (Database Queries)**: SQL Injection is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: SQL Injection Vulnerability Auditor

**Scenario:** Audits dynamic SQL query strings for unescaped string concatenation vulnerabilities.

**Requirements:**
1. Write auditSqlQueryForInjection(sqlString).
2. Detect string concatenation patterns (`+`, template literals `${}`).
3. Return vulnerability risk status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditSqlQueryForInjection(sqlString = "") {
>   // Flag unescaped quote concatenation or unsafe SQL keywords concatenated with variables
>   const carriesConcatenation = /WHERE\s+\w+\s*=\s*'?[^'$]*\+/i.test(sqlString) ||
>                                /WHERE\s+\w+\s*=\s*'\$\{/i.test(sqlString) ||
>                                /OR\s+['"]?1['"]?\s*=\s*['"]?1/i.test(sqlString);
>
>   const containsTautology = /' OR '1'='1/i.test(sqlString) || /" OR "1"="1/i.test(sqlString);
>
>   const isVulnerable = carriesConcatenation || containsTautology;
>
>   return {
>     isVulnerable,
>     riskLevel: isVulnerable ? "HIGH_CRITICAL" : "SAFE_OR_PARAMETERIZED",
>     reason: isVulnerable ? "Unsafe string concatenation or SQL tautology payload detected" : "No obvious injection patterns found"
>   };
> }
>
> // Verification tests
> const badSql = "SELECT * FROM users WHERE username = '" + "admin' OR '1'='1" + "'";
> const audit1 = auditSqlQueryForInjection(badSql);
> console.assert(audit1.isVulnerable === true, "Test 1 Failed: Detected SQL injection tautology");
>
> const goodSql = "SELECT * FROM users WHERE username = $1";
> const audit2 = auditSqlQueryForInjection(goodSql);
> console.assert(audit2.isVulnerable === false, "Test 2 Failed: Parameterized query is safe");
> ```
>
> #### Technical Explanation
>
> 1. **SQL Injection (SQLi) Risk**: OWASP Top 10 vulnerability where malicious SQL commands are injected into database engine execution calls.
> 2. **String Concatenation Flaw**: Constructing SQL strings via `'SELECT * FROM users WHERE name = ' + userInput` breaks out of data boundaries into code execution.
> 3. **Tautology Payloads**: Payloads like `' OR '1'='1` make WHERE conditions always evaluate true, bypassing authentication logic.
> 
---

### Exercise 2: Safe User Search Parameterizer Refactoring

**Scenario:** Refactors a vulnerable SQL injection search function into a secure parameterized query.

**Requirements:**
1. Write safeUserSearch(userInput, dbPoolMock).
2. Use `$1` parameter placeholder.
3. Pass user input in values array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function safeUserSearch(userInput, dbPoolMock) {
>   // Secure: Separates SQL logic from untrusted user input via $1 parameter placeholder!
>   const sql = "SELECT id, username, email FROM users WHERE username = $1";
>   const params = [userInput];
>
>   const result = await dbPoolMock.query(sql, params);
>   return result.rows;
> }
>
> // Verification tests
> let executedSql = "";
> let executedParams = [];
>
> const mockPool = {
>   query: async (sql, params) => {
>     executedSql = sql;
>     executedParams = params;
>     return { rows: [{ id: 1, username: "admin" }] };
>   }
> };
>
> safeUserSearch("admin' OR '1'='1", mockPool).then(rows => {
>   console.assert(executedSql === "SELECT id, username, email FROM users WHERE username = $1", "Test 1 Failed: Query structure untouched");
>   console.assert(executedParams[0] === "admin' OR '1'='1", "Test 2 Failed: Malicious string passed safely as literal value");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Defensive Parameterization**: Parameterized queries instruct the database engine to treat inputs strictly as literal string values, never as executable code.
> 2. **Escaping Is Not Enough**: Manual regex escaping functions are prone to subtle bypasses; ALWAYS use parameterized driver queries.
> 3. **Least Privilege DB Users**: Database connection credentials should have minimal required permissions to limit impact if injection occurs.
> 
---

### Exercise 3: SQL Injection Attack Payload Detector & WAF Filter

**Scenario:** A Web Application Firewall (WAF) input sanitizer detects common SQL injection attack signatures (e.g. `UNION SELECT`, `DROP TABLE`, `; --`).

**Requirements:**
1. Write detectSqlInjectionPayload(inputString).
2. Test against common attack patterns.
3. Return threat classification.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function detectSqlInjectionPayload(inputString = "") {
>   if (typeof inputString !== "string") return { isAttack: false };
>
>   const attackPatterns = [
>     /UNION\s+ALL\s+SELECT/i,
>     /UNION\s+SELECT/i,
>     /DROP\s+TABLE/i,
>     /INSERT\s+INTO/i,
>     /DELETE\s+FROM/i,
>     /;\s*--/i,
>     /EXEC\s*\(/i,
>     /'\s*OR\s*'\d+'\s*=\s*'\d+/i
>   ];
>
>   for (const pattern of attackPatterns) {
>     if (pattern.test(inputString)) {
>       return {
>         isAttack: true,
>         matchedPattern: String(pattern),
>         threat: "SQL_INJECTION_ATTEMPT"
>       };
>     }
>   }
>
>   return { isAttack: false };
> }
>
> // Verification tests
> console.assert(detectSqlInjectionPayload("admin' UNION SELECT null, password FROM users--").isAttack === true, "Test 1 Failed");
> console.assert(detectSqlInjectionPayload("alice@example.com").isAttack === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **WAF Input Filtering**: Web Application Firewalls filter malicious request payloads before reaching backend microservices.
> 2. **UNION-Based Injection**: Attackers append `UNION SELECT` to merge query results with sensitive password/credential tables.
> 3. **Stacked Queries Hazard**: Semicolons (`; DROP TABLE users`) allow executing multiple distinct SQL commands in drivers supporting stacked queries.
## 6. Related Terms
- [ORMs & ODMs](orms_odms.md) — The best way to never worry about SQL Injection again.
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — Related concept: Parameterized Queries / Prepared Statements.
- [Input Validation (joi / zod)](../level_09/input_validation.md) — Related concept: Input Validation (joi / zod).

---

## 7. Key Takeaways
- **SQL Injection** is a hack where users type database commands into text inputs to steal or destroy data.
- It is caused by concatenating (injecting) user input directly into raw SQL strings.
- You prevent it by using **Parameterized Queries** (placeholders like `$1`), which forces the database to treat the input strictly as text, not code.
- Modern ORMs handle this protection automatically.
