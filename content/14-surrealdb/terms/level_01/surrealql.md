# SurrealQL

> **Level 1 — What Is SurrealDB?**
> The SQL-like query language used by SurrealDB, combining standard SQL commands (like `SELECT` and `WHERE`) with extensions for document nesting, graph traversals (`->`), and real-time query streams (`LIVE SELECT`).

---

## 1. Prerequisites

- [SurrealDB](surrealdb.md) — The parent database engine.

---

## 2. Term Category


**SurrealQL Command (SQL-like multi-model query language)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Learning a new database engine usually requires learning a completely new query format:
-   SQL databases require SQL text strings.
-   MongoDB requires JSON filter objects (`{ price: { $gt: 100 } }`).
-   Graph databases require Cypher queries.

If a developer wants to use relational, document, and graph structures together, writing queries across three different styles is difficult.

We designed **SurrealQL** to provide a single, unified query language. 

It is SQL-like, so any developer who knows SQL (like PostgreSQL) can write basic queries immediately. 

At the same time, it extends SQL to support document nesting (JSON objects as data types), graph paths, and real-time subscriptions, making it a highly expressive database query language.

---

### (2) Key Features of SurrealQL
-   **Familiar Core:** Standard operations use SQL keywords: `SELECT * FROM user WHERE age > 18`.
-   **Nested Object Paths:** Access nested properties using dot notation: `SELECT address.city FROM user`.
-   **No JOINs Required:** Instead of relational JOIN tables, SurrealQL uses **Record Links** and graph arrow paths: `SELECT name, ->owns->product.name FROM user`.
-   **Embedded Scripting:** Supports loops (`FOR`), conditional logic (`IF/ELSE`), and custom user-defined functions.

---

### (3) Reality Metaphor (The International Dialect)
Imagine communication styles across different business groups:
-   **SQL:** Formal Business English (clear, rules-based, but verbose and slow to change).
-   **MongoDB JSON:** Shorthand text messages (fast, uses brackets, but cryptic to write).
-   **Cypher Graph:** Hand-drawn map sketches (drawing arrows to show directions).
-   **SurrealQL:** A **Global Lingua Franca Dialect**. 
    -   It sounds like standard Business English (SQL syntax), borrows shorthand brackets for lists (NoSQL JSON inputs), and uses arrow indicators for directions. 
    -   Anyone from any team can read it instantly.

---

### (4) Syntax Comparison

Compare how you find active users who spent more than $100 in a database:

#### PostgreSQL (SQL)
```sql
SELECT u.id, u.name 
FROM users u 
INNER JOIN orders o ON u.id = o.user_id 
WHERE u.status = 'active' AND o.amount > 100;
```

#### MongoDB (Aggregation)
```javascript
db.users.aggregate([
  { $match: { status: "active" } },
  { $lookup: { from: "orders", localField: "_id", foreignField: "user_id", as: "orders" } },
  { $match: { "orders.amount": { $gt: 100 } } }
]);
```

#### SurrealDB (SurrealQL)
```sql
SELECT id, name FROM user 
WHERE status = 'active' AND ->bought->order.amount > 100;
```
*(Note how the graph arrow `->bought->order.amount` traverses relationships cleanly without JOIN syntax).*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to write standard SQL 'JOIN' statements in SurrealQL queries

**The mistake:** Writing `SELECT * FROM user JOIN post ON user.id = post.user_id` to query post details.

**Why it's wrong:** SurrealQL does **not** support the relational `JOIN` keyword. 

It is designed to traverse relationships natively using record links or graph arrow edges. 

Trying to use `JOIN` statements will trigger syntax parsing errors.

**Fix: Resolve relationships by referencing linked fields directly or using arrow operator paths:**

```sql
// CORRECT: Using record links
SELECT title, author.name FROM post;

// CORRECT: Using graph arrows
SELECT name, ->owns->product FROM user;
```

---



### Mistake 2: Ending Multi-Statement SurrealQL Scripts Without Semicolons

**The mistake:** Writing multiple SurrealQL statements back-to-back without separating them with `;`.

**Why it's wrong:** SurrealQL requires semicolons `;` to separate multiple sequential statements in a single query batch script.

*Incorrect:*
```surrealql
LET $user = user:1
SELECT * FROM $user // ❌ Parse error: missing semicolon
```

*Fix:*
```surrealql
LET $user = user:1;
SELECT * FROM $user;
```

### Mistake 3: Using Double Equals `==` for Equality in Place of Single `=` in SurrealQL

**The mistake:** Writing `WHERE status == 'active'` in SurrealQL.

**Why it's wrong:** SurrealQL uses single `=` for equality comparison (or `IS`). `==` is supported as alias, but `=` is the standard SurrealQL operator.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE status == "active";
```

*Fix:*
```surrealql
SELECT * FROM user WHERE status = "active";
```

## 5. Practice Exercises

### Exercise 1: Multi-Statement Script Transaction Execution

**Scenario:**
You are writing a SurrealQL database initialization script that defines a table, creates records, and returns the query result in a single multi-statement execution.

**Requirements:**
1. Define a `SCHEMAFULL` table `product`.
2. Define field `price` as `decimal`.
3. Insert product `product:laptop` with `price = 1299.99dec`.
4. Return the newly created record.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE product SCHEMAFULL;
> DEFINE FIELD price ON TABLE product TYPE decimal ASSERT $value > 0.0dec;
> 
> CREATE product:laptop SET name = "Pro Laptop", price = 1299.99dec;
> 
> SELECT * FROM product:laptop;
> ```
>
> #### Technical Explanation
>
> 1. SurrealQL scripts execute multiple statements separated by semicolons sequentially.
> 2. DDL statements (`DEFINE`) and DML statements (`CREATE`, `SELECT`) can be combined inside single script executions.
> 3. Returns an array containing the results of each executed statement.

---

### Exercise 2: Advanced SurrealQL Expression Power

**Scenario:**
A developer wants to demonstrate SurrealQL's expression capabilities by performing string manipulation, mathematical calculations, and array operations inside a single `SELECT` query.

**Requirements:**
1. Convert string `"surrealql"` to uppercase using `string::uppercase()`.
2. Add duration `1d` to current time `time::now()`.
3. Filter an array `[1, 2, 3, 4, 5]` keeping numbers $> 2$.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     string::uppercase("surrealql") AS lang,
>     time::now() + 1d AS tomorrow,
>     [1, 2, 3, 4, 5][WHERE item > 2] AS filtered_numbers;
> ```
>
> #### Technical Explanation
>
> 1. SurrealQL features rich builtin function namespaces (`string::*`, `time::*`, `math::*`, `array::*`).
> 2. Inline array filter expressions `[WHERE item > 2]` process collection elements directly in query syntax.
> 3. SurrealQL is an expression-based language where expressions evaluate directly to rich typed values.

---

### Exercise 3: Statement Return Control with `RETURN`

**Scenario:**
You are writing a complex SurrealQL block transaction and want to return a custom JSON object calculation rather than standard query arrays.

**Requirements:**
1. Begin a transaction block.
2. Assign variable `$total` calculating sum of order prices.
3. Use the `RETURN` statement to output a custom result object.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> LET $total = math::sum([100.00, 250.50, 49.99]);
> 
> RETURN {
>     status: "success",
>     calculated_total: $total,
>     timestamp: time::now()
> };
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. `LET $variable = ...` defines session parameter variables inside transaction blocks.
> 2. `RETURN` explicitly specifies the final output payload returned from a transaction block.
> 3. Enables building sophisticated server-side stored procedure logic directly in SurrealQL.

---



## 6. Related Terms

- [SurrealDB](surrealdb.md) — The parent database engine.
- [Record](record.md) — The fundamental data unit.
- [Multi-Model Database](multi_model_database.md) — Related concept: Multi-Model Database.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Related concept: Built-in Functions Overview.
- [`IF` / `ELSE` Expressions](../level_06/if_else.md) — Related concept: `IF` / `ELSE` Expressions.
- [Parameters (`$param`)](../level_06/parameters.md) — Related concept: Parameters (`$param`).
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — Surreal CLI query execution.
- [Surrealist (Web IDE)](surrealist.md) — Surrealist GUI query editor.

---

## 7. Key Takeaways
- SurrealQL is SurrealDB's unified, SQL-like query language.
- Combines standard SQL commands with document and graph extensions.
- Dot notation extracts deeply nested JSON values natively.
- Arrow operators (`->`) replace relational JOIN tables.
- Does not support standard SQL `JOIN` keywords.
- Built-in support for variables, loop expressions, and logic blocks.
- Accessible via the Surreal CLI, web IDE, or application SDK drivers.
