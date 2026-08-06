# ORM vs. Query Builder vs. Raw SQL

> **Level 10 — Administration, Security & Production**
> The comparison of the three primary methods used by application code to communicate with a database: Object-Relational Mappers (ORMs), Query Builders, and Raw SQL query strings.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language encapsulated by these interfaces.

---

## 2. Term Category

**Administration / Operations** (Data Access Abstraction Strategy): ORM vs Raw SQL compares Object-Relational Mappers (Prisma, Drizzle, TypeORM) against native SQL driver queries.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (A core decision in application backend design. Relates to libraries in Node.js (Prisma, Drizzle, pg), Python (SQLAlchemy, Django ORM), or Java (Hibernate)).

### (1) Design Motivation — "Why did we design this?"
When writing a web server backend (like an API in Node.js or Python), the code must query the database to fetch records. 

Developers have three different philosophies for how to write these queries:

---

### (2) The Three Database Interfaces

#### 1. ORM (Object-Relational Mapping)
An abstraction layer that maps database tables directly to object classes in your programming language. 
-   *Syntax:* You call methods on objects: `const user = await prisma.user.findUnique({ where: { id: 5 } });`
-   *Pros:* Rapid development. You don't need to know SQL. It automatically creates joins and manages relationship links.
-   *Cons:* Hides database reality. Can generate extremely complex, slow SQL queries behind your back (like running a 5-table join for a simple lookup). High memory overhead.
-   *Examples:* Prisma, TypeORM, Hibernate, Django ORM.

#### 2. Query Builder
A library that provides a programmatic API to construct SQL queries using chained method calls.
-   *Syntax:* `const users = await db.select().from('users').where(eq('id', 5));`
-   *Pros:* Safe and clean. Provides compile-time type-safety (errors are caught before code runs). Generates predictable SQL.
-   *Cons:* You must still understand SQL theory to write queries.
-   *Examples:* Drizzle ORM, Knex.js.

#### 3. Raw SQL
Writing raw SQL query strings directly using basic database drivers.
-   *Syntax:* `const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [5]);`
-   *Pros:* Maximum performance. Zero abstraction overhead. Absolute control over index usage and execution plans.
-   *Cons:* Slow to write. High risk of SQL injection if developers make string mistakes. No compile-time safety checks.
-   *Examples:* `pg` (Node-postgres), `psycopg2` (Python).

---

### (3) Interface Trade-off Comparison

| Interface | Abstraction Level | Development Speed | Query Performance | Type Safety |
| :--- | :--- | :--- | :--- | :--- |
| **ORM** | High (Hides SQL) | **Fastest** | Slowest | High |
| **Query Builder** | Medium (Wraps SQL) | Medium | **Fast** | **Highest** |
| **Raw SQL** | Low (None) | Slowest | **Fastest** | None |

---

### (4) Reality Metaphor (Traveling a City)
-   **ORM (Tour Bus):** Hiring a private tour guide and bus chauffeur. You sit back and relax (easy development). The bus takes you to the landmark, but you have no control over which streets it drives, and it is slow to turn corners.
-   **Query Builder (Car with GPS):** Renting a car with a GPS navigation app. You drive the car (write the query), but the GPS prevents you from taking illegal one-way turns (checks types/syntax).
-   **Raw SQL (Walking on Foot):** Walking the streets with no map. You have absolute freedom to take narrow shortcuts through alleyways (maximum speed), but you risk getting lost, hitting dead ends, or tripping in potholes (security/syntax bugs).

---

### (5) Code Examples

#### The Same Query written in Three Interfaces
Let's select an active user and join their profile:

```typescript
// 1. ORM (Prisma)
const users = await prisma.user.findMany({
  where: { status: 'active' },
  include: { profile: true }
});

// 2. Query Builder (Drizzle ORM)
const users = await db
  .select()
  .from(usersTable)
  .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
  .where(eq(usersTable.status, 'active'));

// 3. Raw SQL (pg driver)
const queryText = `
  SELECT u.*, p.* 
  FROM users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE u.status = $1
`;
const { rows } = await client.query(queryText, ['active']);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on ORMs for complex analytical queries or bulk data migrations

**The mistake:** Using an ORM loop to fetch 100,000 user objects, modifying their statuses in memory, and running `save()` on each object to update the database.

**Why it's wrong:** The ORM will generate **100,000 separate UPDATE queries** sent over the network one-by-one. 

This triggers massive locking bottlenecks, consumes gigabytes of server RAM, and takes minutes to finish.

**Fix: For bulk operations or heavy analytical reports, bypass ORM objects. Write a single, raw SQL update query or use a query builder to execute the task in a single database roundtrip.**

```sql
/* Replaces 100,000 ORM loops with 1 query */
UPDATE users SET status = 'active' WHERE last_login > '2026-01-01';
```

---



### Mistake 2: Triggering N+1 Query Problems inside Application Loops via ORM Lazy Loading

**The mistake:** Iterating over 1,000 users in application code and calling `user.getOrders()` inside the loop.

**Why it's wrong:** Lazy loading issues 1 initial query for users + 1,000 separate SELECT queries for orders ($1 + N$ queries!), causing massive network latency. Use eager loading (`include` / `JOIN`).

*Incorrect:*
```sql
const users = await User.findAll(); for (let u of users) { const orders = await u.getOrders(); } // ❌ 1,001 queries!
```

*Fix:*
```sql
const users = await User.findAll({ include: Order }); // 1 JOIN query
```

### Mistake 3: Using ORM Abstractions for Heavy Batch Aggregation Data Analytics

**The mistake:** Loading 500,000 raw ORM model instances into application memory to sum total revenue in JS.

**Why it's wrong:** Instantiating 500,000 ORM JavaScript objects consumes gigabytes of Node.js RAM. Execute raw SQL `SUM(total)` directly in the database engine.

*Incorrect:*
```sql
const orders = await Order.findAll(); const total = orders.reduce((s, o) => s + o.total, 0); -- ❌ Memory freeze!
```

*Fix:*
```sql
const [{ sum }] = await db.query('SELECT SUM(total) FROM orders');
```

## 5. Practice Exercises

### Exercise 1: Type-Safe Query Builder Access (Drizzle / Kysely)

**Scenario:**
Write a type-safe database query in TypeScript using Drizzle ORM to fetch active users.

**Requirements:**
1. Code Drizzle ORM query syntax.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { eq } from "drizzle-orm";
> import { db } from "./db";
> import { users } from "./schema";
> 
> export async function getActiveUsers() {
>   return await db.select({ id: users.id, email: users.email })
>     .from(users)
>     .where(eq(users.isActive, true));
> }
> ```
> 
> #### Technical Explanation
>
> 1. Type-safe query builders (Drizzle, Kysely) provide auto-completion and compile-time type safety over database schemas.
> 2. Maps TypeScript types 1-to-1 with PostgreSQL column data types.
> 3. Eliminates runtime SQL syntax errors.
> 
---

### Exercise 2: High-Performance Raw SQL Execution with Native Drivers

**Scenario:**
Execute an optimized complex SQL query containing window functions using native driver raw SQL (`pg`).

**Requirements:**
1. Code `pool.query()` raw SQL execution.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { pool } from "./db";
> 
> export async function getRankedSales() {
>   const query = `
>     SELECT 
>       id, customer_id, total_cents,
>       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
>     FROM orders
>   `;
>   const res = await pool.query(query);
>   return res.rows;
> }
> ```
> 
> #### Technical Explanation
>
> 1. Raw SQL provides full access to advanced PostgreSQL features (window functions, CTEs, custom operators) without ORM abstraction limits.
> 2. Zero ORM memory overhead and zero query generation latency.
> 3. Ideal for complex analytical reporting queries.
> 
---

### Exercise 3: Architectural Decision Matrix: ORM vs Raw SQL

**Scenario:**
Formulate a technical selection matrix comparing Heavy ORMs (Prisma), Type-Safe Query Builders (Drizzle), and Raw SQL (`pg`).

**Requirements:**
1. Contrast developer velocity, query control, type safety, and runtime performance.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Data Access Architecture Selection Matrix:
> - Heavy ORM (Prisma): Maximum developer velocity, auto-generated migrations, abstraction over SQL, higher RAM usage & N+1 query risk.
> - Query Builder (Drizzle/Kysely): Type-safe, close to SQL syntax, lightweight runtime, great performance & flexibility.
> - Raw SQL (pg / postgres.js): Maximum performance, 100% access to advanced PG features, requires manual TypeScript type definitions.
> Recommendation: Use Drizzle for general application CRUD; use Raw SQL for complex reporting pipelines!
> ```
>
> #### Technical Explanation
>
> 1. Heavy ORMs simplify basic CRUD but obscure underlying SQL execution.
> 2. Query builders balance type safety with explicit SQL control.
> 3. Match data access layer to project complexity.
> 
---



## 6. Related Terms
- [SQL Injection](sql_injection.md) — The vulnerability risk.
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — Secure raw query patterns.

---

## 7. Key Takeaways
- ORMs map database tables directly to object classes in your application code.
- Query Builders construct queries programmatically using chained method APIs.
- Raw SQL queries execute direct text query strings using drivers.
- ORMs prioritize rapid development speed; Raw SQL prioritizes maximum performance.
- Query Builders offer the highest level of compile-time type-safety.
- Avoid using ORMs for batch migrations or complex analytical reporting queries.
- Whichever you choose, ensure parameters are handled safely to prevent SQLi.
