# MongoDB Node.js Driver

> **Level 10 — Administration, Security & Advanced Features**
> The official low-level client library (`mongodb` npm package) that enables Node.js applications to connect to MongoDB, automatically managing connection pooling and BSON-to-JavaScript object translation.

---

## 1. Prerequisites

- [Database (MongoDB Context)](../level_01/database_context.md) — The target `mongod` port.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **JavaScript / Node.js** (Installed as a runtime dependency via `npm install mongodb`. Executed inside the Node.js event loop on the application server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
MongoDB runs as a standalone daemon process (`mongod`) communicating over TCP using a custom binary protocol (wire protocol). 

Your Node.js web server cannot speak this binary protocol natively.

We designed the **MongoDB Node.js Driver** to act as a bridge. 

It is the official, low-level database driver. 

It translates your JavaScript query objects into binary BSON packets to send over the wire, and parses incoming BSON payloads back into native JavaScript objects. 

Additionally, it manages complex cluster mechanics under the hood (connection pooling, replica set failovers, and sharded query routing), allowing you to focus on writing clean JavaScript code.

---

### (2) Driver Mechanics
-   **Promises & Async/Await:** All database operations (CRUD) return native JavaScript Promises.
-   **JavaScript-to-BSON Mapping:** The driver automatically converts JavaScript types (like `Date` or `BigInt`) to their correct BSON binary representations on disk.
-   **Replica/Shard Awareness:** When you connect using a seed list URI, the driver parses the cluster nodes and handles connection failovers dynamically.

---

### (3) Reality Metaphor (The Bilingual Interpreter)
Imagine an international business meeting:
-   **Node.js Driver:** A **Professional Interpreter** sitting between an English Businessman (Node.js application) and a Chinese Supplier (MongoDB).
    -   The businessman speaks in standard English terms (JavaScript objects).
    -   The interpreter translates this on the fly into Chinese (BSON binary format).
    -   They listen to the Chinese supplier's response and translate it back to the businessman in clean English. 
    -   The businessman never needs to learn Chinese.

---

### (4) Code Examples

#### Establishing Node.js Driver Connection
Install the library first:
`npm install mongodb`

Then build the connection controller:

```javascript
const { MongoClient } = require('mongodb');

// Connection URI
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

async function run() {
  try {
    // 1. Connect to the database server (returns a Promise)
    await client.connect();
    console.log("Connected to MongoDB!");

    // 2. Select database and collection namespaces
    const db = client.db('shop');
    const products = db.collection('products');

    // 3. Run query (translates JS filter to BSON, returns Promise)
    const query = { name: "Laptop" };
    const product = await products.findOne(query);

    console.log("Found Product:", product);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    // Close the connection pool when the application shuts down
    await client.close();
  }
}

run();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to run database queries before the client.connect() Promise has successfully resolved

**The mistake:** Calling collection methods immediately after initializing the client, without wrapping them in an async `await client.connect()` statement.

```javascript
// BAD: Crashes with "MongoClient not connected"!
const client = new MongoClient(url);
const product = client.db('shop').collection('products').findOne({ name: "Laptop" }); 
```

**Why it's wrong:** The driver runs asynchronously. 

Creating the `MongoClient` instance does not open the TCP connection instantly. 

Running queries before connection handshakes finish throws immediate driver errors.

**Fix: Always ensure `await client.connect()` has resolved before executing any database queries in your application code.**

---



### Mistake 2: Forgetting to Await Asynchronous MongoDB Node.js Driver Methods

**The mistake:** Writing `const user = db.collection('users').findOne({ _id })` without `await`.

**Why it's wrong:** Driver CRUD methods return Promises! Forgetting `await` assigns a pending Promise object to the variable instead of the result document.

*Incorrect:*
```javascript
const user = db.collection("users").findOne({ _id }); // ❌ Assigns pending Promise!
```

*Fix:*
```javascript
const user = await db.collection("users").findOne({ _id }); // Awaited promise
```

### Mistake 3: Creating New `MongoClient` Instances Inside API Route Handlers

**The mistake:** Instantiating `new MongoClient()` inside Express request route handlers.

**Why it's wrong:** Creates TCP socket connection pool exhaustion. Reuse a single global `MongoClient` instance.

*Incorrect:*
```javascript
app.get('/users', async (req, res) => { const client = new MongoClient(uri); ... });
```

*Fix:*
```javascript
Reuse single shared client instance initialized at application boot
```

## 6. Practice Exercises

### Exercise 1: Query Execution Command

**Problem:** You have a Node.js script connected to MongoDB. 
Write the asynchronous JavaScript code line (using `await`) to find all documents in the `products` collection where the `price` is less than `50`, converting the cursor results to a standard JavaScript array.
Assume you have the `products` collection collection variable.

**Expected output:**
> [!check]- Answer
> ```javascript
> const cheapProducts = await products.find({ price: { $lt: 50 } }).toArray();
> ```
> - The search uses the `$lt` comparison operator.
> - Call the `.toArray()` method on the returned cursor to resolve the Promise.

---



### Exercise 2: Node.js Driver Connection and Insert Flow

**Problem:** Write async code connecting `MongoClient`, inserting document into `users`, and closing client in `finally`.

**Expected output:**
> [!check]- Answer
> ```text
> const client = new MongoClient(uri); try { await client.connect(); await client.db('app').collection('users').insertOne(doc); } finally { await client.close(); }
> ```
> ```javascript
> const { MongoClient } = require('mongodb');
> const client = new MongoClient(uri);
> try {
>   await client.connect();
>   const db = client.db('app');
>   await db.collection('users').insertOne({ name: "Alice" });
> } finally {
>   await client.close();
> }
> ```
>
> **Explanation:** Native Node.js MongoDB driver manages connection lifecycle and BSON CRUD calls.

---

### Exercise 3: Driver Import Package

**Problem:** Official npm package name for MongoDB Node.js driver (`mongodb`).

**Expected output:**
> [!check]- Answer
> ```text
> mongodb
> ```
> ```text
> mongodb
> ```
>
> **Explanation:** `npm install mongodb` installs the official MongoDB Node.js driver.

## 7. Related Terms

- [Connection String URI](connection_string.md) — The connection configurations.
- [Mongoose (ODM)](mongoose.md) — The schema wrapper library.
- [Connection Pooling](connection_pooling.md) — Related concept: Connection Pooling.

---

## 8. Key Takeaways
- The Node.js Driver is the official client library for connecting Node.js to MongoDB.
- Translates JavaScript objects to BSON binary payloads over the wire.
- Operates asynchronously, returning native JavaScript Promises.
- Manages connection pooling and cluster routing internally.
- Install using `npm install mongodb` runtime dependency.
- Always wait for `client.connect()` to resolve before running database queries.
- Clean up connection resources using `client.close()` during app shutdowns.
