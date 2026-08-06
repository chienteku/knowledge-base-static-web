# MongoDB Node.js Driver

> **Level 10 — Administration, Security & Advanced Features**
> The official low-level client library (`mongodb` npm package) that enables Node.js applications to connect to MongoDB, automatically managing connection pooling and BSON-to-JavaScript object translation.

---

## 1. Prerequisites

- [Database (MongoDB Context)](../level_01/database_context.md) — The target `mongod` port.

---

## 2. Term Category

**Driver / Integration** (Official Node.js MongoDB Client Library): The MongoDB Node.js Driver is the low-level official client library executing native BSON CRUD operations, connection pooling, and command execution.



---

## 3. Explanation

### Environment Context
- **JavaScript / Node.js** (Installed as a runtime dependency via `npm install mongodb`. Executed inside the Node.js event loop on the application server).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Connecting to MongoDB with the Native Node.js Driver

**Scenario:**
Write native Node.js MongoDB driver code to establish a database connection and query `products`.

**Requirements:**
1. Use `MongoClient.connect()` and `db.collection()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { MongoClient } from "mongodb";
> 
> const uri = "mongodb://localhost:27017";
> const client = new MongoClient(uri);
> 
> async function run() {
>   try {
>     await client.connect();
>     const db = client.db("store");
>     const products = await db.collection("products").find({ price: { $lt: 50 } }).toArray();
>     console.log("Products Found:", products.length);
>   } finally {
>     await client.close();
>   }
> }
> run();
> ```
> 
> #### Technical Explanation
>
> 1. The official `@mongodb` Node.js driver provides direct, high-performance BSON API access.
> 2. `client.connect()` initializes connection pooling and seed node discovery.
> 3. `toArray()` streams cursor batches into a JavaScript array.
> 
---

### Exercise 2: Native Driver Bulk Operations with `bulkWrite`

**Scenario:**
Execute high-throughput batch writes using the native Node.js driver `bulkWrite()`.

**Requirements:**
1. Execute `collection.bulkWrite([...])`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const collection = db.collection("inventory");
> 
> const result = await collection.bulkWrite([
>   { insertOne: { document: { sku: "A1", qty: 10 } } },
>   { updateOne: { filter: { sku: "B2" }, update: { $inc: { qty: 5 } } } }
> ]);
> console.log("Inserted:", result.insertedCount, "Modified:", result.modifiedCount);
> ```
>
> #### Technical Explanation
>
> 1. Native driver `bulkWrite()` sends multiple write operations in a single binary socket payload.
> 2. Eliminates Node.js async event loop network roundtrip latency.
> 3. Ideal for high-speed ETL ingestion pipelines.
> 
---

### Exercise 3: Native BSON Type Construction (`ObjectId`, `Decimal128`)

**Scenario:**
Construct explicit BSON `ObjectId` and `Decimal128` types using the native driver BSON library.

**Requirements:**
1. Use `new ObjectId()` and `Decimal128.fromString()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { ObjectId, Decimal128 } from "mongodb";
> 
> const id = new ObjectId("60c72b2f9b1d8b2c88888880");
> const price = Decimal128.fromString("199.99");
> 
> await db.collection("orders").insertOne({
>   _id: id,
>   total: price,
>   createdAt: new Date()
> });
> ```
> 
> #### Technical Explanation
>
> 1. Native driver exports explicit BSON type constructors (`ObjectId`, `Decimal128`, `Long`, `Binary`).
> 2. Prevents JavaScript numbers from defaulting to 64-bit IEEE floating-point values.
> 3. Guarantees binary schema compatibility.
> 
---



## 6. Related Terms

- [Connection String URI](connection_string.md) — The connection configurations.
- [Mongoose (ODM)](mongoose.md) — The schema wrapper library.
- [Connection Pooling](connection_pooling.md) — Related concept: Connection Pooling.

---

## 7. Key Takeaways
- The Node.js Driver is the official client library for connecting Node.js to MongoDB.
- Translates JavaScript objects to BSON binary payloads over the wire.
- Operates asynchronously, returning native JavaScript Promises.
- Manages connection pooling and cluster routing internally.
- Install using `npm install mongodb` runtime dependency.
- Always wait for `client.connect()` to resolve before running database queries.
- Clean up connection resources using `client.close()` during app shutdowns.
