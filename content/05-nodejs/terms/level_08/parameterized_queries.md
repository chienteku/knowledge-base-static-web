# Parameterized Queries / Prepared Statements

> **Level 8 — Database Integration**
> The actual fix for SQL Injection, referenced as the cure but not defined.

---

## 1. Prerequisites
- [SQL Injection](sql_injection.md) — The vulnerability resolved by this design.
- [ORMs & ODMs](orms_odms.md) — The libraries that implement parameterization under the hood.

---

## 2. Term Category

**Database / Security Concept (Database Engine Layer .)**: Parameterized Queries / Prepared Statements is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
SQL Injection occurs when user input is concatenated directly into a raw SQL query string. The database parses the combined string, executing user inputs as active SQL commands.

To prevent this, databases separate the query **code structure** from the query **data payload** using **Parameterized Queries** (also known as **Prepared Statements**):

1.  **Template Compilation (Code):** Instead of concatenating variables directly (e.g. `'SELECT * FROM users WHERE username = ' + input`), you write a query template using placeholders (like `?` in MySQL or `$1`, `$2` in PostgreSQL):
    `SELECT * FROM users WHERE username = $1`
    The database compiles this template and locks its query execution path.
2.  **Parameter Handoff (Data):** The application driver sends the user inputs separately. The database inserts these parameters directly into the pre-compiled template slots.
3.  **Strict Typing:** Because the query structure was already locked during step 1, the database treats the incoming parameters strictly as literal text values, never as executable code. Even if a user input contains SQL commands, the injection attempt fails.

---

### (2) Reality Metaphor
Imagine a company processing employee payroll forms.
- **String Concatenation (Raw Paper):** You write instructions on a blank piece of paper: *"Add this employee: John Doe."* If a malicious user changes their name string to: *"John Doe, and grant him a $1,000,000 bonus,"* the clerk reads the paper as a continuous list of commands and executes the bonus.
- **Parameterized Query (Form Template):** You print a card containing strict boxes:
  First Name: [ `               ` ]
  Last Name:  [ `               ` ]
  No matter what text the user writes inside the Last Name box (even if they write *"Doe, and grant him a bonus"*), the clerk reads it strictly as a single, literal last name value. The instructions were parsed and locked *before* the form was filled out.

---

### (3) JavaScript Code Implementation Examples

#### 1. The Vulnerable String Concatenation Approach
```javascript
// DANGER: Malicious input can break out of the string quotes and run arbitrary SQL!
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;

db.query(query, (err, results) => {
  // Vulnerable to SQL Injection!
});
```

#### 2. The Secure Parameterized Query Approach
Using the Node.js PostgreSQL driver (`pg`), we pass the query structure first, and a separate array containing parameters:

```javascript
// SECURE: $1 is a compiled placeholder; input is sent separately
const query = 'SELECT * FROM users WHERE email = $1';
const parameters = [req.body.email];

db.query(query, parameters, (err, results) => {
  // Safe from SQL Injection!
});
```

*(Note: Modern ORMs like Prisma and Sequelize parameterize all inputs automatically under the hood, making them secure by default).*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on custom regex string sanitization instead of parameterization

**The mistake:** Attempting to manually scan and replace bad characters (like `'` or `;`) in user inputs using a custom regular expression, instead of using parameterized queries:

```javascript
// BAD: Hackers can bypass custom regex filters using encoding tricks!
const sanitizedEmail = req.body.email.replace(/'/g, "''");
const query = `SELECT * FROM users WHERE email = '${sanitizedEmail}'`;
```

**Why it's wrong:** Hackers can easily bypass string filters using character encoding tricks, nested quotes, or comment dashes. Sanitization should only be a secondary line of defense. Parameterized queries provide a mathematical guarantee of SQL injection safety because the database engine does not evaluate the input values as code.

---



### Mistake 2: Interpolating User Variables Directly into SQL Query Strings (SQL Injection)

**The mistake:** Writing `db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`)`.

**Why it's wrong:** String interpolation allows malicious users to inject SQL control characters (e.g. `' OR '1'='1`), allowing database bypass and unauthorized access.

*Incorrect:*
```javascript
const query = `SELECT * FROM users WHERE name = '${input}'`; // ❌ Critical SQL Injection!
await db.query(query);
```

*Fix:*
```javascript
const query = 'SELECT * FROM users WHERE name = $1'; // Parameterized query placeholder
await db.query(query, [input]);
```

### Mistake 3: Using Incorrect Parameter Placeholder Syntax for Different Database Drivers

**The mistake:** Using `?` placeholders in PostgreSQL `pg` driver queries (which expects `$1, $2`).

**Why it's wrong:** Different SQL drivers use different parameter placeholder syntax (Postgres uses `$1, $2`; MySQL uses `?`). Mixing them throws query syntax errors.

*Incorrect:*
```javascript
await pgClient.query('SELECT * FROM users WHERE id = ?', [1]); // ❌ Syntax error in Postgres!
```

*Fix:*
```javascript
await pgClient.query('SELECT * FROM users WHERE id = $1', [1]); // Correct Postgres placeholder
```

## 5. Practice Exercises

### Exercise 1: Parameterized SQL Query Builder

**Scenario:** Constructs parameterized SQL `SELECT` queries with positional placeholders (`$1`, `$2` for Postgres or `?` for MySQL).

**Requirements:**
1. Write buildParameterizedSelect(table, filtersObj, placeholderStyle).
2. Construct SQL string with placeholders.
3. Return parameterized values array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildParameterizedSelect(table, filtersObj = {}, placeholderStyle = "pg") {
>   const keys = Object.keys(filtersObj);
>   const values = Object.values(filtersObj);
>
>   if (keys.length === 0) {
>     return { sql: `SELECT * FROM ${table}`, values: [] };
>   }
>
>   const clauses = keys.map((key, idx) => {
>     const placeholder = placeholderStyle === "pg" ? `$${idx + 1}` : "?";
>     return `${key} = ${placeholder}`;
>   });
>
>   const sql = `SELECT * FROM ${table} WHERE ${clauses.join(" AND ")}`;
>   return { sql, values };
> }
>
> // Verification tests
> const resPg = buildParameterizedSelect("users", { role: "admin", status: "active" }, "pg");
> console.assert(resPg.sql === "SELECT * FROM users WHERE role = $1 AND status = $2", "Test 1 Failed");
> console.assert(resPg.values[0] === "admin" && resPg.values[1] === "active", "Test 2 Failed");
>
> const resMysql = buildParameterizedSelect("users", { id: 5 }, "mysql");
> console.assert(resMysql.sql === "SELECT * FROM users WHERE id = ?", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Parameterized Queries Concept**: Separates SQL statement structure from user data payloads to prevent SQL Injection attacks.
> 2. **Positional Placeholders**: PostgreSQL uses `$1, $2`; MySQL/SQLite use `?` placeholders.
> 3. **Database Driver Parsing**: The database engine compiles query execution plans before substituting parameterized values safely.
> 
---

### Exercise 2: Dynamic Batch Insert Parameterizer

**Scenario:** Constructs dynamic batch `INSERT` SQL statements with multiple parameterized rows (`VALUES ($1, $2), ($3, $4)`).

**Requirements:**
1. Write buildBatchInsertQuery(tableName, recordsArray).
2. Generate numbered placeholders.
3. Flatten values array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildBatchInsertQuery(tableName, recordsArray = []) {
>   if (!recordsArray || recordsArray.length === 0) {
>     throw new Error("Records array cannot be empty");
>   }
>
>   const columns = Object.keys(recordsArray[0]);
>   const values = [];
>   const valueTuples = [];
>
>   let paramIndex = 1;
>   for (const record of recordsArray) {
>     const tuplePlaceholders = [];
>     for (const col of columns) {
>       tuplePlaceholders.push(`$${paramIndex++}`);
>       values.push(record[col]);
>     }
>     valueTuples.push(`(${tuplePlaceholders.join(", ")})`);
>   }
>
>   const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES ${valueTuples.join(", ")} RETURNING id`;
>   return { sql, values };
> }
>
> // Verification tests
> const records = [
>   { name: "Alice", age: 30 },
>   { name: "Bob", age: 25 }
> ];
>
> const query = buildBatchInsertQuery("users", records);
> console.assert(query.sql.includes("VALUES ($1, $2), ($3, $4)"), "Test 1 Failed");
> console.assert(query.values.length === 4, "Test 2 Failed: 4 total parameters");
> ```
>
> #### Technical Explanation
>
> 1. **Batch Parameterization**: Constructs bulk insert statements without string concatenation vulnerabilities.
> 2. **Parameter Count Limits**: PostgreSQL limits parameters to 65,535 per query; chunk large batch inserts into subsets.
> 3. **High-Performance Inserts**: Batch inserts execute significantly faster than looping single INSERT statements.
> 
---

### Exercise 3: Safe SQL Identifier Sanitizer

**Scenario:** Sanitizes dynamic database table and column names that cannot use standard `$1` value placeholders.

**Requirements:**
1. Write sanitizeSqlIdentifier(identifier).
2. Enforce strict alphanumeric/underscore regex.
3. Wrap in double quotes for SQL escaping.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeSqlIdentifier(identifier = "") {
>   if (typeof identifier !== "string" || !identifier.trim()) {
>     throw new Error("Identifier must be a non-empty string");
>   }
>
>   // Allow only valid ASCII alphanumeric and underscore characters
>   if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
>     throw new Error(`INVALID_SQL_IDENTIFIER: '${identifier}'`);
>   }
>
>   // Quote double quotes for PostgreSQL identifier escaping
>   return `"${identifier.replace(/"/g, '""')}"`;
> }
>
> // Verification tests
> console.assert(sanitizeSqlIdentifier("user_orders") === '"user_orders"', "Test 1 Failed");
>
> try {
>   sanitizeSqlIdentifier("users; DROP TABLE users;--");
>   console.assert(false, "Test 2 Failed: Should throw error on malicious identifier");
> } catch (err) {
>   console.assert(err.message.includes("INVALID_SQL_IDENTIFIER"), "Test 2 Passed");
> }
> ```
>
> #### Technical Explanation
>
> 1. **Identifier Placeholders Limitation**: SQL engines do NOT allow parameter placeholders (`$1`) for table or column names.
> 2. **Identifier Whitelisting**: Always validate dynamic table/column names against strict regex or explicit whitelists.
> 3. **Double Quote Escaping**: Standard SQL escapes table and column names with double quotes (`"table_name"`).
## 6. Related Terms
- [SQL Injection](sql_injection.md) — The database vulnerability resolved by parameterization.
- [ORMs & ODMs](orms_odms.md) — Object mappers that automatically implement query parameterization.

---

## 7. Key Takeaways
- Parameterized queries separate SQL query structure (code) from query parameters (data).
- Placeholders (e.g. `?` or `$1`) are compiled by the database engine first.
- Variables are sent separately and inserted directly into the pre-compiled template slots.
- The database engine treats parameterized values strictly as literals, preventing SQL execution.
- ORMs use parameterized queries automatically.
- Do not rely on custom regex filters to sanitize SQL; always parameterize queries.
