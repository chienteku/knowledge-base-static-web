# Parameterized Queries / Prepared Statements

> **Level 8 — Database Integration**
> The actual fix for SQL Injection, referenced as the cure but not defined.

---

## 1. Prerequisites
- [SQL Injection](sql_injection.md) — The vulnerability resolved by this design.
- [ORMs & ODMs](orms_odms.md) — The libraries that implement parameterization under the hood.
---

## 2. Term Category
- **Database / Security Concept**

---

## 3. Environment Context
- **Database Engine Layer** (The query planner compiles code templates separately from variable parameters).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Query Refactoring

**Problem:** Refactor the vulnerable login verification query below to use a secure parameterized query:

```javascript
// Before (Vulnerable):
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
db.query(query, callback);

// After (Secure):
const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
db.query(query, [username, password], callback); // PostgreSQL syntax
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Writing Safe Parameterized Query

**Problem:** Convert unsafe query `db.query("SELECT * FROM products WHERE category = '" + cat + "'")` to safe parameterized query.

**Expected output:**
> [!check]- Answer
> ```text
> db.query('SELECT * FROM products WHERE category = $1', [cat]);
> ```
> ```javascript
> db.query('SELECT * FROM products WHERE category = $1', [cat]);
> ```
>
> **Explanation:** Parameterized queries pass user inputs separately from SQL code structure.

---

### Exercise 3: How Parameterization Prevents Injection

**Problem:** Explain how parameter placeholders prevent SQL injection at the database protocol level.

**Expected output:**
> [!check]- Answer
> ```text
> The database compiles the SQL query structure first, treating input parameters strictly as literal data values rather than executable SQL statements.
> ```
> ```text
> The database compiles the SQL query structure first, treating input parameters strictly as literal data values rather than executable SQL statements.
> ```
>
> **Explanation:** Parameterized inputs cannot alter compiled SQL query structure.

## 7. Related Terms
- [SQL Injection](sql_injection.md) — The database vulnerability resolved by parameterization.
- [ORMs & ODMs](orms_odms.md) — Object mappers that automatically implement query parameterization.
---

## 8. Key Takeaways
- Parameterized queries separate SQL query structure (code) from query parameters (data).
- Placeholders (e.g. `?` or `$1`) are compiled by the database engine first.
- Variables are sent separately and inserted directly into the pre-compiled template slots.
- The database engine treats parameterized values strictly as literals, preventing SQL execution.
- ORMs use parameterized queries automatically.
- Do not rely on custom regex filters to sanitize SQL; always parameterize queries.
