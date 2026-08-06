# mongosh (MongoDB Shell)

> **Level 1 — What Is a Document Database?**
> The official interactive command-line interface (CLI) for MongoDB, running on a Node.js-based JavaScript shell environment to execute queries, run scripts, and manage database operations.

---

## 1. Prerequisites

- [`mongod` (MongoDB Server Daemon)](mongod.md) — The background server database engine connected to.
- [MongoDB](mongodb.md) — MongoDB database instance overview.

---

## 2. Term Category

**Administration / Operations** (Interactive Shell CLI): mongosh is the modern Node.js-based interactive command-line shell used for administering MongoDB instances and executing ad-hoc queries.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed in the terminal shell. Acts as a client process connecting to local or remote MongoDB instances via connection URI strings).

### (1) Design Motivation — "Why did we design this?"
Once the MongoDB server daemon (`mongod`) is running in the background, you need a way to communicate with it:
-   How do you run a quick query to inspect a user's document?
-   How do you check index usage stats?
-   How do you write a quick cleanup script to fix a spelling mistake in 50 documents?

In PostgreSQL, you use the terminal tool `psql`. 

In MongoDB, we designed the **`mongosh`** (MongoDB Shell) to serve as your interactive command center.

The key design shift is that **`mongosh` is a complete JavaScript REPL environment.** 

Because MongoDB documents are JSON objects, using JavaScript as the query language is a perfect fit. 

Instead of writing SQL statements, you write standard JavaScript code and call database helper methods directly. 

You can declare variables, write `for` loops to generate test data, or import scripts, all directly in the database terminal window.

---

### (2) Key mongosh Navigation Commands
-   **`mongosh [connection_uri]`:** Launches the client shell (defaults to connecting to `mongodb://127.0.0.1:27017`).
-   **`show dbs`:** Lists databases on the server.
-   **`use database_name`:** Switches the active database namespace context.
-   **`show collections`:** Lists collections in the active database.
-   **`exit` or `quit()`:** Closes the shell session.

---

### (3) Reality Metaphor
Imagine piloting a spacecraft:
-   **`mongod`** is the **Engine Thruster** mounted on the outside of the hull. You cannot grab the engine valves with your bare hands.
-   **`mongosh`** is the **Cockpit Control Panel** inside the cabin. 
    -   It has screens and input sticks. 
    -   When you type a command and hit execute (type a JS query), the control panel translates your input into electrical signals and tells the engine thrust block (`mongod`) to fire.

---

### (4) Code Examples

#### An Interactive mongosh Session
Here is what an interactive terminal session looks like:

```javascript
// 1. Launch mongosh in your terminal
$ mongosh
// Connected to: mongodb://127.0.0.1:27017/test

// 2. Switch to active database
test> use store_db
// switched to db store_db

// 3. Write a JavaScript query to insert a document
store_db> db.products.insertOne({ name: "mouse", price: 19.99 })
// { acknowledged: true, insertedId: ObjectId("65fc71...") }

// 4. Run a loop to insert 3 test values on-the-fly!
store_db> for (let i = 1; i <= 3; i++) { db.products.insertOne({ id: i }) }
// Loop runs successfully inside the database terminal!

// 5. Query the results
store_db> db.products.find()
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Typing declarative SQL commands (like SELECT or INSERT INTO) inside mongosh

**The mistake:** Connecting to the shell and running `SELECT * FROM users;` out of habit from PostgreSQL.

**Why it's wrong:** `mongosh` does not contain a SQL parser. 

It is a JavaScript compiler. 

Running SQL statements will throw a `SyntaxError: Unexpected identifier` crash, as the shell does not understand SQL.

**Fix: Learn the MongoDB JavaScript helper query methods. To select rows, use `db.users.find()`. To insert rows, use `db.users.insertOne()`.**

---



### Mistake 2: Using Deprecated `mongo` Shell Commands in Modern `mongosh`

**The mistake:** Running legacy shell methods like `db.collection.insert()` or `db.eval()`.

**Why it's wrong:** Modern `mongosh` deprecates legacy methods in favor of standard ES6+ driver methods (`insertOne`, `insertMany`, `updateOne`, `deleteMany`).

*Incorrect:*
```javascript
db.users.insert({ name: "Alice" }); // ❌ Legacy deprecated method!
```

*Fix:*
```javascript
db.users.insertOne({ name: "Alice" }); // Modern mongosh syntax
```

### Mistake 3: Running Un-bounded `db.collection.find()` in mongosh on Production

**The mistake:** Executing `db.users.find()` on 10M document collection without `limit()`.

**Why it's wrong:** Although `mongosh` pages 20 documents at a time, running queries without filters or limits on large production collections can consume cluster resources.

*Incorrect:*
```javascript
db.users.find(); // Un-bounded query
```

*Fix:*
```javascript
db.users.find().limit(10); // Controlled limit
```

## 5. Practice Exercises

### Exercise 1: Executing Administrative Helper Commands

**Scenario:**
A developer uses `mongosh` to inspect existing databases, switch context, and list collections.

**Requirements:**
1. List databases (`show dbs`).
2. Switch context (`use app`).
3. List collections (`show collections`).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> show dbs;
> use app;
> show collections;
> ```
>
> #### Technical Explanation
>
> 1. `mongosh` provides interactive terminal shell helper commands (`show dbs`, `show collections`).
> 2. Built on top of modern Node.js REPL environment.
> 3. Executes JavaScript statements natively.

---

### Exercise 2: Writing Scriptable JavaScript Iteration Loops in mongosh

**Scenario:**
Write a JavaScript `for` loop in `mongosh` to insert 10 test documents into collection `benchmark`.

**Requirements:**
1. Loop 10 times and execute `insertOne()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> for (let i = 1; i <= 10; i++) {
>   db.benchmark.insertOne({
>     seq: i,
>     timestamp: new Date()
>   });
> }
> ```
>
> #### Technical Explanation
>
> 1. `mongosh` supports full modern ECMAScript / JavaScript syntax.
> 2. Loops and procedural control flow can be executed directly inside the shell.
> 3. Enables fast database seeding and administrative scripting.

---

### Exercise 3: Formulating Non-Interactive Shell CLI Scripts

**Scenario:**
Execute a `mongosh` query script non-interactively from a Linux bash terminal using `--eval`.

**Requirements:**
1. Formulate `mongosh` command using `--eval`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> mongosh "mongodb://localhost:27017/store_db" >   --eval "console.log('Total Orders:', db.orders.countDocuments())"
> ```
>
> #### Technical Explanation
>
> 1. `--eval` executes JavaScript query strings non-interactively and exits.
> 2. Useful in Linux bash scripts and CI/CD deployment pipelines.
> 3. Returns query output directly to stdout.

---



## 6. Related Terms

- [`mongod` (MongoDB Server Daemon)](mongod.md) — The target server.
- [MongoDB Compass](compass.md) — The graphical GUI alternative.
- [Database (MongoDB Context)](database_context.md) — Related concept: Database (MongoDB Context).

---

## 7. Key Takeaways
- `mongosh` is the official interactive JavaScript terminal shell for MongoDB.
- Serves as the MongoDB equivalent to PostgreSQL's `psql` utility.
- Built on top of Node.js; supports writing loops, variables, and custom JS scripts.
- Launches local connections by typing `mongosh` with no arguments.
- Switch database contexts using the `use db_name` command.
- Avoid typing SQL queries; use JavaScript MongoDB database methods.
