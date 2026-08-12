# Prisma / Sequelize (SQL ORMs)

> **Level 8 — Database Integration**
> The concrete SQL ORMs.

---

## 1. Prerequisites
- [ORMs & ODMs](orms_odms.md) — The core mapping patterns.
- [SQL vs NoSQL](sql_vs_nosql.md) — Relational databases (PostgreSQL, MySQL) targeted by these libraries.

---

## 2. Term Category

**Database / Third-Party Library (Web App Server Layer .)**: Prisma / Sequelize (SQL ORMs) is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
SQL databases (such as PostgreSQL and MySQL) enforce strict tables, keys, and schemas. While writing raw SQL queries (`SELECT * FROM users JOIN posts ON...`) is highly performant, doing so manually inside a Node.js application is prone to typos, syntax errors, and SQL injection security issues.

To interact with SQL databases using Javascript objects, developers use SQL ORMs like **Sequelize** or **Prisma**:

#### 1. Sequelize (Traditional ActiveRecord ORM)
-   **Structure:** Define database tables as JavaScript classes.
-   **Querying:** Call methods directly on the model classes:
    `User.findAll({ include: Post })` (Sequelize translates this into an `INNER JOIN` SQL statement under the hood).
-   **Relationships:** Configured programmatically using associations: `User.hasMany(Post)`.

#### 2. Prisma (Modern Data Mapper ORM)
-   **Structure:** Uses a declarative schema file (`schema.prisma`) to define the database schema.
-   **Querying:** Prisma parses the schema and automatically generates a custom, fully type-safe JavaScript query client (`PrismaClient`).
-   **Type Safety:** If you change a database column from a `String` to an `Int` in the schema file, Prisma automatically regenerates TypeScript interfaces, causing errors in your code editor before you run the code if types mismatch.

---

### (2) Reality Metaphor
Imagine booking a multi-leg vacation trip.
- **Raw SQL Queries** is like **booking every leg manually**. You call the airline, dictate tail numbers in coordinates, call a foreign taxi dispatch service in another language, and write down room numbers. One wrong letter or digit ruins the trip.
- **SQL ORMs** are a **travel booking concierge**. You tell the concierge: *"Book me a trip to Tokyo and include my hotel reservation."* The concierge handles the translation, communicates with the airline and hotel databases under the hood (**generating SQL commands and joins**), and hands you the complete ticket package. You only speak your native language (**JavaScript**).

---

### (3) Prisma Implementation Example

#### 1. The Declarative Schema (`schema.prisma`)
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}
```

#### 2. Querying in JavaScript
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAuthorsAndPosts() {
  // Prisma handles the SQL JOIN automatically based on the 'include' configuration
  const users = await prisma.user.findMany({
    include: {
      posts: true // Eagerly loads related posts in a single trip!
    }
  });
  console.dir(users, { depth: null });
}

getAuthorsAndPosts();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Triggering the N+1 Query Problem

**The mistake:** Querying a parent table, then looping over the results to query a child table for each record individually:

```javascript
// BAD: Triggers 1 query to fetch users, plus 100 queries to fetch posts!
const users = await prisma.user.findMany(); // Query 1 (Returns 100 users)

for (const user of users) {
  // Queries 2 through 101 executed inside loop!
  user.posts = await prisma.post.findMany({ where: { authorId: user.id } }); 
}
```

**Why it's wrong:** The N+1 query pattern creates massive network overhead between your Node server and database. If you have 1,000 users, the code fires 1,001 database queries, slowing the application.

*Fix:* Use **Eager Loading** to instruct the ORM to fetch all related records in a single join query:
```javascript
// GOOD: Fetches all users and their posts in a single query
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

---



### Mistake 2: Instantiating Multiple `PrismaClient` Instances Across Application Files

**The mistake:** Writing `const prisma = new PrismaClient()` at top of 10 controller files.

**Why it's wrong:** Each `PrismaClient` instance creates its own database connection pool. Creating multiple instances exhausts DB connection limits.

*Incorrect:*
```javascript
// In userController.js:
const prisma = new PrismaClient(); // ❌ Duplicate PrismaClient instance!
// In productController.js:
const prisma = new PrismaClient();
```

*Fix:*
```javascript
// In singleton file db.js:
const prisma = new PrismaClient();
module.exports = prisma;
// Import single shared instance across controllers
```

### Mistake 3: Forgetting to Generate Prisma Client Artifacts After Modifying `schema.prisma`

**The mistake:** Editing `schema.prisma` and attempting to use new model fields in code without running `prisma generate`.

**Why it's wrong:** Prisma relies on generated TypeScript client artifacts. Failing to run `prisma generate` leaves TypeScript client code out-of-sync with updated schema.

*Incorrect:*
```javascript
// Editing schema.prisma without running npx prisma generate
```

*Fix:*
```javascript
npx prisma generate // Regenerates Prisma Client types and code
```

## 5. Practice Exercises

### Exercise 1: Prisma Client Query Middleware Logger

**Scenario:** Attaches a custom middleware logger to Prisma Client (`prisma.$use()`) to log query performance and flag slow queries >100ms.

**Requirements:**
1. Write attachPrismaQueryLogger(prismaClientMock, loggerMock, slowThresholdMs).
2. Intercept query parameters.
3. Log duration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachPrismaQueryLogger(prismaClientMock, loggerMock, slowThresholdMs = 100) {
>   prismaClientMock.$use(async (params, next) => {
>     const start = Date.now();
>     const result = await next(params);
>     const duration = Date.now() - start;
>
>     const logPayload = {
>       model: params.model,
>       action: params.action,
>       durationMs: duration,
>       isSlow: duration >= slowThresholdMs
>     };
>
>     if (logPayload.isSlow && loggerMock && typeof loggerMock.warn === "function") {
>       loggerMock.warn(`Slow Prisma Query [${params.model}.${params.action}]: ${duration}ms`);
>     }
>
>     return result;
>   });
> }
>
> // Verification tests
> let warnLogged = false;
> const middlewares = [];
> const mockPrisma = {
>   $use: (fn) => { middlewares.push(fn); }
> };
>
> attachPrismaQueryLogger(mockPrisma, { warn: () => { warnLogged = true; } }, 10);
>
> const nextMock = async (params) => new Promise(r => setTimeout(() => r([{ id: 1 }]), 20));
> middlewares[0]({ model: "User", action: "findMany" }, nextMock).then(res => {
>   console.assert(warnLogged === true, "Test 1 Failed: Logged slow query warning");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Prisma Middleware Engine**: Allows intercepting and modifying Prisma queries, parameters, and results (similar to Express middleware).
> 2. **Query Performance Monitoring**: Tracking query durations flags missing database indexes before production deployment.
> 3. **Type-Safe Prisma Schema**: Prisma generates type-safe TypeScript query clients based on `schema.prisma`.
> 
---

### Exercise 2: Sequelize Transaction Manager with Auto Rollback

**Scenario:** Uses Sequelize managed transactions (`sequelize.transaction(async (t) => {})`) to automatically commit or rollback on error.

**Requirements:**
1. Write executeSequelizeManagedTx(sequelizeMock, txCallback).
2. Pass transaction object to callback.
3. Auto-commit/rollback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeSequelizeManagedTx(sequelizeMock, txCallback) {
>   return sequelizeMock.transaction(async (t) => {
>     return await txCallback(t);
>   });
> }
>
> // Verification tests
> let committed = false;
> let rolledBack = false;
>
> const mockSequelize = {
>   transaction: async (fn) => {
>     const t = { commit: () => { committed = true; }, rollback: () => { rolledBack = true; } };
>     try {
>       const res = await fn(t);
>       t.commit();
>       return res;
>     } catch (err) {
>       t.rollback();
>       throw err;
>     }
>   }
> };
>
> executeSequelizeManagedTx(mockSequelize, async (t) => "TX_DONE").then(res => {
>   console.assert(res === "TX_DONE", "Test 1 Failed");
>   console.assert(committed === true, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Sequelize Managed Transactions**: Sequelize automatically passes transaction handles and commits on function return or rolls back on thrown errors.
> 2. **Sequelize vs Prisma ORM Approaches**: Sequelize uses Active Record pattern; Prisma uses Data Mapper / Auto-Generated Client pattern.
> 3. **Concurrency Isolation Levels**: Sequelize allows setting transaction isolation levels (`READ COMMITTED`, `SERIALIZABLE`).
> 
---

### Exercise 3: Prisma vs Sequelize Relation Feature Evaluator

**Scenario:** Evaluates relational model definitions comparing Prisma implicit M:N join tables vs Sequelize `belongsToMany` explicit join tables.

**Requirements:**
1. Write evaluateOrmRelationType(ormName, relationType).
2. Return configuration recommendations.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateOrmRelationType(ormName = "prisma", relationType = "many-to-many") {
>   const isPrisma = ormName.toLowerCase() === "prisma";
>
>   return {
>     orm: ormName,
>     relationType,
>     supportsImplicitJoinTable: isPrisma,
>     recommendation: isPrisma
>       ? "Prisma automatically creates and manages underlying _RelationTable in schema"
>       : "Sequelize requires explicit 'through' model table for belongsToMany relations"
>   };
> }
>
> // Verification tests
> const pRes = evaluateOrmRelationType("prisma", "many-to-many");
> console.assert(pRes.supportsImplicitJoinTable === true, "Test 1 Failed");
>
> const sRes = evaluateOrmRelationType("sequelize", "many-to-many");
> console.assert(sRes.supportsImplicitJoinTable === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Implicit M:N Join Tables**: Prisma automatically manages join tables for `[]` array fields without manual model declarations.
> 2. **Sequelize `through` Option**: Sequelize requires explicitly declaring `User.belongsToMany(Role, { through: 'UserRoles' })`.
> 3. **Schema Source of Truth**: Prisma uses `schema.prisma` file; Sequelize uses JavaScript/TypeScript class definitions.
## 6. Related Terms
- [ORMs & ODMs](orms_odms.md) — The design categories for SQL and NoSQL databases.
- [Migrations](migrations.md) — Schema updates managed through SQL ORMs.

---

## 7. Key Takeaways
- SQL ORMs map relational database tables to JavaScript object models.
- Sequelize uses programmatic model definitions; Prisma uses a declarative schema file.
- Prisma automatically generates a custom, type-safe client based on your schema.
- Avoid the N+1 query problem by using eager loading (`include`) to fetch relations.
- Relational ORMs handle complex SQL joins under the hood, writing optimized queries for you.
