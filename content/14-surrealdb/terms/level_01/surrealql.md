# SurrealQL

> **Level 1 — What Is SurrealDB?**
> The SQL-like query language used by SurrealDB, combining standard SQL commands (like `SELECT` and `WHERE`) with extensions for document nesting, graph traversals (`->`), and real-time query streams (`LIVE SELECT`).

---

## 1. Prerequisites
- [SurrealDB](surrealdb.md) — The parent database engine.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Parsed and compiled by the database server. Executable via the Surreal CLI, Surrealist IDE, or application SDKs).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Query Translation

**Problem:** You are migrating a MongoDB query to SurrealDB. 
The MongoDB query is:
`db.products.find({ "specifications.weight": { $lt: 50 }, status: "instock" })`
Write the equivalent query in SurrealQL.

**Expected output:**
```sql
SELECT * FROM products WHERE specifications.weight < 50 AND status = 'instock';
```

> [!check]- Answer
> - Translate the document query to a standard `SELECT * FROM table` layout.
> - Access the nested weight value using dot notation: `specifications.weight`.

---



### Exercise 2: Writing Multi-Statement SurrealQL Transaction Batch

**Problem:** Write SurrealQL batch: 1. Set variable `$u`, 2. Create user, 3. Return user.

**Expected output:**
```text
LET $u = user:alice; CREATE $u SET name = "Alice"; RETURN $u;
```

> [!check]- Answer
> ```surrealql
> LET $u = user:alice;
> CREATE $u SET name = "Alice";
> RETURN $u;
> ```
>
> **Explanation:** SurrealQL batch scripts execute statements sequentially, sharing `$var` parameter state.

### Exercise 3: SurrealQL Future Values (`<future>`)

**Problem:** What construct in SurrealQL computes field values dynamically upon every read query? (`<future> { ... }`).

**Expected output:**
```text
<future> { ... }
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD total ON TABLE invoice VALUE <future> { count * price };
> ```
>
> **Explanation:** `<future>` expressions evaluate dynamic calculations on demand during query execution.

## 7. Related Terms
- [SurrealDB](surrealdb.md) — The parent database engine.
- [Record](record.md) — The fundamental data unit.

---

## 8. Key Takeaways
- SurrealQL is SurrealDB's unified, SQL-like query language.
- Combines standard SQL commands with document and graph extensions.
- Dot notation extracts deeply nested JSON values natively.
- Arrow operators (`->`) replace relational JOIN tables.
- Does not support standard SQL `JOIN` keywords.
- Built-in support for variables, loop expressions, and logic blocks.
- Accessible via the Surreal CLI, web IDE, or application SDK drivers.
