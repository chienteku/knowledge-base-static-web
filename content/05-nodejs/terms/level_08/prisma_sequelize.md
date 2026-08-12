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

### Exercise 1: Query Optimization

**Problem:** Review this Sequelize loop. Optimize it to run a single query using eager loading:

```javascript
// Before (N+1 Query Issue):
const products = await Product.findAll();
for (const product of products) {
  product.reviews = await Review.findAll({ where: { productId: product.id } });
}

// After (Optimized via Eager Loading):
const productsWithReviews = await Product.findAll({
  include: [Review] // Sequelize executes a single JOIN query under the hood!
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Prisma CRUD Query Syntax

**Problem:** Write Prisma code to create a new `User` record with `email: 'a@b.com'` and `name: 'Alice'`. 

**Expected output:**
> [!check]- Answer
> ```text
> await prisma.user.create({ data: { email: 'a@b.com', name: 'Alice' } });
> ```
> ```javascript
> await prisma.user.create({
>   data: {
>     email: 'a@b.com',
>     name: 'Alice'
>   }
> });
> ```
>
> **Explanation:** `prisma.model.create({ data: { ... } })` performs type-safe database insertions.
> 
---

### Exercise 3: Prisma vs Sequelize Architecture

**Problem:** Compare schema definition approach in Prisma vs Sequelize.

**Expected output:**
> [!check]- Answer
> ```text
> Prisma uses declarative schema file (`schema.prisma`) generating type-safe client; Sequelize uses JS/TS model class definitions.
> ```
> ```text
> Prisma uses declarative schema file (schema.prisma) generating type-safe client; Sequelize uses JS/TS model class definitions.
> ```
>
> **Explanation:** Prisma generates client code from `.prisma` schemas; Sequelize uses object models.
> 
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
