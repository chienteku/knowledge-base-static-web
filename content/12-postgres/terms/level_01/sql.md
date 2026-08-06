# SQL (Structured Query Language)

> **Level 1 — What Is a Database?**
> The standardized programming language used to define, manipulate, query, and manage data inside relational databases.

---

## 1. Prerequisites
- [Database](database.md) — Understanding the need for structured data storage.
- [Relational Database](relational_database.md) — Relational database querying language.

---

## 2. Term Category

**Core Concept** (Structured Query Language): SQL (Structured Query Language) is the domain-specific standard language for querying, manipulating, and administering relational databases.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Standardized by ANSI and ISO. Supported natively by PostgreSQL, MySQL, SQLite, Oracle, and SQL Server).

### (1) Design Motivation — "Why did we design this?"
Relational databases store data in complex binary formats on the hard drive. 

If you wanted to retrieve a record, early database systems required you to write low-level code telling the computer exactly how to spin the disk platter, locate the binary offset, and extract bytes. This was highly complex and tied your code directly to the hardware.

In 1974, Donald D. Chamberlin and Raymond F. Boyce at IBM designed **SQL** (originally called SEQUEL).

SQL was built on a **Declarative** design philosophy:
-   In **Imperative** programming (like JavaScript or Python), you write code showing the computer *how* to do something step-by-step.
-   In **Declarative** programming (SQL), you write code showing the computer *what* you want, and the database engine handles the low-level retrieval logic.

---

### (2) SQL Sub-Languages
SQL is divided into three main operational buckets:
1.  **DDL (Data Definition Language):** Defines the structure of the database (e.g. `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`).
2.  **DML (Data Manipulation Language):** Handles editing and reading the rows of data (e.g. `SELECT`, `INSERT`, `UPDATE`, `DELETE`).
3.  **DCL (Data Control Language):** Manages access permissions (e.g. `GRANT`, `REVOKE`).

---

### (3) Reality Metaphor
Imagine ordering food at a restaurant:
-   **Imperative (NodeJS loop)** is like walking into the kitchen, picking up a knife, peeling 3 potatoes, heating oil to 350 degrees, frying them for 5 minutes, and taking them to your table.
-   **Declarative (SQL)** is like looking at the menu, calling the waiter, and saying: *"Bring me a plate of French Fries."* 

You don't care how the chef peels, cuts, or cooks the potatoes; you only care that a hot plate of fries lands on your table.

---

### (4) Code Examples

#### JavaScript Filter (Imperative) vs. SQL Query (Declarative)

Searching an array of users in JavaScript:

```javascript
// You write the loop and logic step-by-step
const adultUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].age >= 18) {
    adultUsers.push(users[i]);
  }
}
```

Requesting the same data in SQL:

```sql
-- You declare what fields and criteria you want
SELECT * FROM users WHERE age >= 18;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting SQL queries to execute sequentially line-by-line

**The mistake:** Assuming that because you wrote `SELECT age, name` on line 1 and `WHERE age = 20` on line 2, the database selects the columns first and filters them second.

**Why it's wrong:** SQL is a declarative, set-based language. Under the hood, the Postgres **Query Planner** parses your query, reorganizes it, and decides the most efficient order of operations (usually filtering rows first using indexes, and extracting column attributes last). You cannot force an execution order.

**Fix: Learn the logical query execution phase structure (which generally processes `FROM` -> `JOIN` -> `WHERE` -> `GROUP BY` -> `HAVING` -> `SELECT` -> `ORDER BY` -> `LIMIT`).**

---



### Mistake 2: Confusing DDL (Data Definition Language) with DML (Data Manipulation Language)

**The mistake:** Confusing `CREATE` / `ALTER` (DDL) with `INSERT` / `UPDATE` (DML).

**Why it's wrong:** DDL mutates catalog schema structures (`CREATE TABLE`, `DROP INDEX`). DML mutates data rows (`INSERT INTO`, `UPDATE`).

*Incorrect:*
```sql
-- Confusing schema modification DDL with row data DML
```

*Fix:*
```sql
Use DDL for schema changes and DML for row data mutations
```

### Mistake 3: Writing Non-Standard Database Dialect Extensions That Break ANSI SQL Portability

**The mistake:** Using proprietary vendor extensions when standard ANSI SQL syntax exists.

**Why it's wrong:** Standard ANSI SQL syntax ensures queries remain portable across compliant database engines.

*Incorrect:*
```sql
// Non-standard SQL syntax extensions
```

*Fix:*
```sql
Use standard ANSI SQL statements wherever applicable
```

## 5. Practice Exercises

### Exercise 1: Composing Declarative SQL Data Retrieval Queries

**Scenario:**
Write a SQL `SELECT` query retrieving active users registered in 2026, ordered by creation date descending.

**Requirements:**
1. Use `SELECT`, `FROM`, `WHERE`, `ORDER BY`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, username, email, created_at 
> FROM users 
> WHERE is_active = TRUE 
>   AND created_at >= '2026-01-01' 
> ORDER BY created_at DESC;
> ```
>
> #### Technical Explanation
>
> 1. SQL is a declarative language: you specify *what* data you need, and the PostgreSQL query engine plans *how* to fetch it.
> 2. `WHERE` filters candidate rows based on boolean conditions.
> 3. `ORDER BY created_at DESC` sorts output records descending.

---

### Exercise 2: Atomic Data Mutation with `INSERT`, `UPDATE`, `DELETE`

**Scenario:**
Demonstrate standard SQL DML operations: insert a user, update their email, and delete the user.

**Requirements:**
1. Write `INSERT`, `UPDATE`, and `DELETE` statements.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- 1. Insert
> INSERT INTO users (username, email) VALUES ('carol', 'carol@example.com');
> 
> -- 2. Update
> UPDATE users SET email = 'carol_new@example.com' WHERE username = 'carol';
> 
> -- 3. Delete
> DELETE FROM users WHERE username = 'carol';
> ```
>
> #### Technical Explanation
>
> 1. `INSERT`, `UPDATE`, and `DELETE` comprise the Data Manipulation Language (DML) subset of SQL.
> 2. Executes atomic record modifications adhering to table integrity constraints.
> 3. Underpins backend application CRUD APIs.

---

### Exercise 3: Parameterized SQL Execution in Node.js

**Scenario:**
Execute a parameterized SQL query in Node.js using `pg` to prevent SQL Injection vulnerabilities.

**Requirements:**
1. Use `$1`, `$2` parameter placeholders.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { pool } from "./db";

export async function findUserByEmail(email: string) {
  const text = "SELECT id, username, email FROM users WHERE email = $1";
  const values = [email];
  const res = await pool.query(text, values);
  return res.rows[0];
}
```

> #### Technical Explanation
>
> 1. Parameterized queries (`$1`, `$2`) send SQL code and user parameter values separately to the database server.
> 2. Prevents malicious SQL input strings from altering query syntax trees (SQL Injection prevention).
> 3. Essential security pattern in database programming.

---



## 6. Related Terms
- [Database](database.md) — The query target.
- [`CREATE TABLE` / `DROP TABLE`](create_drop_table.md) — Core SQL DDL statements.
- [Relational Database](relational_database.md) — Related concept: Relational Database.

---

## 7. Key Takeaways
- SQL is the standard language for communicating with relational databases.
- It is declarative: you define what data you want, not how to retrieve it.
- DDL manages schemas and tables; DML manages row entries.
- The SQL engine parses queries and determines the optimal execution path.
- Standard SQL is highly portable across different database brands.
