# ORMs & ODMs

> **Level 8 — Database Integration**
> Libraries that act as translators between your JavaScript code and the Database, allowing you to write queries using standard JavaScript objects instead of raw SQL strings.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — ORMs are for SQL, ODMs are for NoSQL.
- [Connection Pooling](connection_pools.md) — ORMs manage these automatically.
---

## 2. Term Category
- **Database Tooling / Abstraction Layer**

---

## 3. Environment Context
- **Node.js App Layer**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: ORM vs ODM

**Problem:** You are starting a new project. You decided to use a Relational PostgreSQL database because your data is highly structured. Should you install `Mongoose` or `Prisma`?

**Expected output:**
> [!check]- Answer
> ```text
> Prisma.
> Mongoose is an ODM built exclusively for MongoDB (NoSQL). Prisma is an ORM built for Relational SQL databases like PostgreSQL.
> ```
> - Which database does Mongoose talk to?

---



### Exercise 2: ORM vs ODM Comparison

**Problem:** Distinguish ORM vs ODM data mapping targets.

**Expected output:**
> [!check]- Answer
> ```text
> ORM (Object-Relational Mapping): Relational SQL databases (PostgreSQL, MySQL)
> ODM (Object-Document Mapping): Document NoSQL databases (MongoDB)
> ```
> ```text
> ORM: Relational SQL databases (PostgreSQL, MySQL)
> ODM: Document NoSQL databases (MongoDB)
> ```
>
> **Explanation:** ORMs map SQL tables/rows to objects; ODMs map NoSQL collections/documents to objects.

---

### Exercise 3: Preventing N+1 Queries in Prisma

**Problem:** Write Prisma `findMany` query eager-loading `posts` relation on `user` queries.

**Expected output:**
> [!check]- Answer
> ```text
> const users = await prisma.user.findMany({ include: { posts: true } });
> ```
> ```javascript
> const users = await prisma.user.findMany({
>   include: { posts: true }
> });
> ```
>
> **Explanation:** `include` performs eager relation loading in a single optimized query.

## 7. Related Terms
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

## 8. Key Takeaways
- **ORMs (SQL)** and **ODMs (NoSQL)** allow you to query the database using JavaScript objects instead of raw strings.
- They provide autocomplete, type safety, and automatic connection pooling.
- **Prisma** is the modern standard for SQL in Node.js.
- **Mongoose** is the modern standard for MongoDB in Node.js.
- Beware of the N+1 Query Problem: don't put database queries inside of loops!
