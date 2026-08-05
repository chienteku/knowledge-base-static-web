# mongosh (MongoDB Shell)

> **Level 1 — What Is a Document Database?**
> The official interactive command-line interface (CLI) for MongoDB, running on a Node.js-based JavaScript shell environment to execute queries, run scripts, and manage database operations.

---

## 1. Prerequisites

- [`mongod` (MongoDB Server Daemon)](mongod.md) — The background server database engine connected to.

---

## 2. Term Category
- **Database Command-Line Tool**

---

## 3. Environment Context
- **MongoDB Core** (Executed in the terminal shell. Acts as a client process connecting to local or remote MongoDB instances via connection URI strings).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Shell Navigation Test

**Problem:** You are connected to a database using `mongosh`. Write the exact sequence of commands to:
1.  Verify the list of databases available on the server.
2.  Switch your active terminal focus to the database named `analytics`.
3.  List the names of all collections inside `analytics`.

**Expected output:**
> [!check]- Answer
> ```javascript
> show dbs
> 
> use analytics
> 
> show collections
> ```
> - The command `show dbs` audits the server namespaces.
> - The active database focus determines what `show collections` reads.

---



### Exercise 2: Formatting Query Output with `pretty()`

**Problem:** Format mongosh JSON output clearly using `db.coll.find().pretty()`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find().pretty();
> ```
> ```javascript
> db.users.find().pretty();
> ```
>
> **Explanation:** `pretty()` indents BSON documents for clear terminal viewing.

---

### Exercise 3: Evaluating JavaScript Code in mongosh

**Problem:** Run a JS loop inside `mongosh` inserting 3 documents into `test` collection.

**Expected output:**
> [!check]- Answer
> ```text
> for (let i = 1; i <= 3; i++) { db.test.insertOne({ val: i }); }
> ```
> ```javascript
> for (let i = 1; i <= 3; i++) {
>   db.test.insertOne({ val: i });
> }
> ```
>
> **Explanation:** `mongosh` is a full Node.js REPL supporting JavaScript loop logic.

## 7. Related Terms

- [`mongod` (MongoDB Server Daemon)](mongod.md) — The target server.
- [MongoDB Compass](compass.md) — The graphical GUI alternative.
- [Database (MongoDB Context)](database_context.md) — Related concept: Database (MongoDB Context).

---

## 8. Key Takeaways
- `mongosh` is the official interactive JavaScript terminal shell for MongoDB.
- Serves as the MongoDB equivalent to PostgreSQL's `psql` utility.
- Built on top of Node.js; supports writing loops, variables, and custom JS scripts.
- Launches local connections by typing `mongosh` with no arguments.
- Switch database contexts using the `use db_name` command.
- Avoid typing SQL queries; use JavaScript MongoDB database methods.
