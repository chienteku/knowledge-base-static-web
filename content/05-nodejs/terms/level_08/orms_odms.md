# ORMs & ODMs

> **Level 8 — Database Integration**
> Libraries that act as translators between your JavaScript code and the Database, allowing you to write queries using standard JavaScript objects instead of raw SQL strings.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — ORMs are for SQL, ODMs are for NoSQL.
- [Connection Pooling](connection_pools.md) — ORMs manage these automatically.

---

## 2. Term Category

**Database Tooling / Abstraction Layer (Node.js App Layer)**: ORMs & ODMs is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you use a raw database driver, you have to write your queries as massive strings. 
```javascript
// Raw SQL String
const result = await pool.query("SELECT * FROM users WHERE age > 18 AND status = 'active'");
```
There are two problems with strings:
1. **No Autocomplete:** Your code editor has no idea what columns exist in the `users` table, so it can't warn you if you misspell a column.
2. **Context Switching:** You have to constantly switch your brain between JavaScript syntax and SQL syntax.

To fix this, we use an **ORM** (Object-Relational Mapper) for SQL, or an **ODM** (Object-Document Mapper) for NoSQL. They translate JS into DB language.

### (2) How it looks (The Prisma ORM Example)
Instead of writing a SQL string, you use pure JavaScript methods.
```javascript
// Prisma ORM
const activeAdults = await prisma.user.findMany({
  where: {
    age: { gt: 18 },
    status: 'active'
  }
});
```
Because this is pure JavaScript, your code editor can provide autocomplete, telling you exactly what columns exist on the `user` table!

### (3) Popular Tools in Node.js
- **Prisma:** The most popular modern ORM for SQL (PostgreSQL, MySQL). Famous for incredible TypeScript integration and autocomplete.
- **Mongoose:** The absolute standard ODM for MongoDB. 
- **TypeORM / Sequelize:** Older, traditional ORMs for SQL.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The N+1 Query Problem

**The mistake:** A developer uses an ORM to fetch 50 users. Then, they write a `for` loop to fetch the posts for each of those 50 users.
```javascript
const users = await prisma.user.findMany();
for (let user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } }); // DANGER!
}
```

**Why it's wrong:** ORMs make querying so easy that developers forget they are talking to a database over a network! The code above executes **51 separate network requests** to the database (1 to get the users, 50 to get the posts). This will crash your app's performance. 
**Golden Rule:** Always use the ORM's built-in "include" or "join" features to fetch all related data in a single network request.

---



### Mistake 2: Triggering N+1 Query Problems via Loop ORM Data Fetching

**The mistake:** Fetching a list of 100 posts, then running `await post.getAuthor()` inside a loop for each post.

**Why it's wrong:** This executes 1 query for posts + 100 queries for authors (101 DB roundtrips total!). Use eager loading (`include` / `populate`) to fetch all relations in 1 or 2 queries.

*Incorrect:*
```javascript
const posts = await Post.findAll();
for (const p of posts) {
  const author = await p.getAuthor(); // ❌ N+1 query performance bottleneck!
}
```

*Fix:*
```javascript
const posts = await Post.findAll({ include: 'author' }); // Eager load in single JOIN query
```

### Mistake 3: Relying Exclusively on ORM Validations Without Database Level Constraints

**The mistake:** Relying solely on ORM validation `{ unique: true }` without database unique indexes.

**Why it's wrong:** Application-level ORM checks have race conditions when concurrent requests insert identical records simultaneously. Always enforce constraints in the database schema.

*Incorrect:*
```javascript
// ORM schema validation without SQL UNIQUE index constraint
```

*Fix:*
```javascript
// Add database-level unique constraint index in SQL / MongoDB schema
```

## 5. Practice Exercises

### Exercise 1: ORM vs Raw SQL Performance Benchmark Evaluator

**Scenario:** Measures execution time and object allocation overhead comparing raw SQL queries (`pg` driver) vs ORM abstraction layers.

**Requirements:**
1. Write benchmarkQueryExecution(rawSqlFn, ormFn).
2. Measure duration for both.
3. Return comparison summary.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function benchmarkQueryExecution(rawSqlFn, ormFn) {
>   const startRaw = Date.now();
>   const rawData = await rawSqlFn();
>   const rawDuration = Date.now() - startRaw;
>
>   const startOrm = Date.now();
>   const ormData = await ormFn();
>   const ormDuration = Date.now() - startOrm;
>
>   return {
>     rawDurationMs: rawDuration,
>     ormDurationMs: ormDuration,
>     ormOverheadMs: ormDuration - rawDuration,
>     rawCount: rawData.length,
>     ormCount: ormData.length
>   };
> }
>
> // Verification tests
> const rawSqlFn = async () => new Array(100).fill({ id: 1 });
> const ormFn = async () => new Array(100).fill({ id: 1 });
>
> benchmarkQueryExecution(rawSqlFn, ormFn).then(res => {
>   console.assert(res.rawCount === 100, "Test 1 Failed");
>   console.assert(typeof res.ormOverheadMs === "number", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **ORM Abstraction Trade-off**: ORMs provide developer productivity and type safety at the cost of slight CPU/memory object instantiation overhead.
> 2. **Raw Drivers (`pg`, `mysql2`)**: Raw database drivers yield maximum throughput for high-concurrency systems.
> 3. **Hybrid Architecture**: Senior backend engineers use ORMs for standard CRUD endpoints and Raw SQL for complex reporting queries.
> 
---

### Exercise 2: ORM Lazy Loading N+1 Query Problem Detector

**Scenario:** An APM query logger detects N+1 query patterns generated by lazy-loading relations inside loops.

**Requirements:**
1. Write auditNPlusOneQueries(queryLogsArray).
2. Group queries by pattern.
3. Flag queries executed >N times.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditNPlusOneQueries(queryLogsArray = []) {
>   const queryCounts = new Map();
>
>   for (const sql of queryLogsArray) {
>     // Normalize parameters to detect structural query patterns
>     const normalized = sql.replace(/\d+/g, "?").replace(/'[^']*'/g, "?");
>     queryCounts.set(normalized, (queryCounts.get(normalized) || 0) + 1);
>   }
>
>   const nPlusOnePatterns = [];
>   for (const [pattern, count] of queryCounts.entries()) {
>     if (count > 3) {
>       nPlusOnePatterns.push({ pattern, executionCount: count });
>     }
>   }
>
>   return {
>     hasNPlusOne: nPlusOnePatterns.length > 0,
>     nPlusOnePatterns
>   };
> }
>
> // Verification tests
> const logs = [
>   "SELECT * FROM users",
>   "SELECT * FROM orders WHERE user_id = 1",
>   "SELECT * FROM orders WHERE user_id = 2",
>   "SELECT * FROM orders WHERE user_id = 3",
>   "SELECT * FROM orders WHERE user_id = 4"
> ];
>
> const audit = auditNPlusOneQueries(logs);
> console.assert(audit.hasNPlusOne === true, "Test 1 Failed: Detected N+1 query pattern");
> console.assert(audit.nPlusOnePatterns[0].executionCount === 4, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **N+1 Query Problem**: Occurs when code fetches 1 parent record and then executes N separate database queries inside a loop to fetch child relations.
> 2. **Eager Loading Solution**: Fix by using Eager Loading (`include`, `populate`, `join`) to fetch parent and child records in 1 single JOIN query.
> 3. **Database Connection Saturation**: N+1 queries quickly exhaust connection pool queues under load.
> 
---

### Exercise 3: Repository Pattern Abstraction Layer

**Scenario:** Implements the Repository Pattern to decouple application business logic from underlying ORM database frameworks.

**Requirements:**
1. Write createUserRepository(ormModelMock).
2. Implement `findById(id)` and `save(data)`.
3. Provide abstraction over ORM methods.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUserRepository(ormModelMock) {
>   return {
>     async findById(userId) {
>       const entity = await ormModelMock.findOne({ where: { id: userId } });
>       if (!entity) return null;
>       return { id: entity.id, name: entity.name, email: entity.email };
>     },
>     async save(userData) {
>       const created = await ormModelMock.create(userData);
>       return { id: created.id, name: created.name, email: created.email };
>     }
>   };
> }
>
> // Verification tests
> const mockModel = {
>   findOne: async ({ where }) => ({ id: where.id, name: "Alice", email: "alice@test.com" }),
>   create: async (data) => ({ id: 99, ...data })
> };
>
> const repo = createUserRepository(mockModel);
> repo.findById(42).then(user => {
>   console.assert(user.id === 42 && user.name === "Alice", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Repository Pattern**: Encapsulates data access logic, presenting a clean collection-like interface to the domain layer.
> 2. **Decoupling ORM Dependencies**: Allows swapping ORMs (e.g., Prisma to TypeORM) without modifying business logic service classes.
> 3. **Testability Improvement**: Simplifies unit testing services by allowing easy mocking of repository interfaces.
## 6. Related Terms
- [SQL Injection](sql_injection.md) — ORMs automatically protect you against this devastating attack!
- [Migrations](migrations.md) — ORMs also manage the history of your database schema.
- [Connection Pooling](connection_pools.md) — Related concept: Connection Pooling.
- [Mongoose (MongoDB ODM)](mongoose.md) — Related concept: Mongoose (MongoDB ODM).
- [Parameterized Queries / Prepared Statements](parameterized_queries.md) — Related concept: Parameterized Queries / Prepared Statements.
- [Prisma / Sequelize (SQL ORMs)](prisma_sequelize.md) — Related concept: Prisma / Sequelize (SQL ORMs).
- [SQL vs NoSQL](sql_vs_nosql.md) — Related concept: SQL vs NoSQL.
- [MVC Pattern (Model–View–Controller)](../level_09/mvc_pattern.md) — Related concept: MVC Pattern (Model–View–Controller).
- [Pagination](../level_09/pagination.md) — Related concept: Pagination.

---

## 7. Key Takeaways
- **ORMs (SQL)** and **ODMs (NoSQL)** allow you to query the database using JavaScript objects instead of raw strings.
- They provide autocomplete, type safety, and automatic connection pooling.
- **Prisma** is the modern standard for SQL in Node.js.
- **Mongoose** is the modern standard for MongoDB in Node.js.
- Beware of the N+1 Query Problem: don't put database queries inside of loops!
