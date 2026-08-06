# Cursor

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> A logical pointer to the result set of a MongoDB query, allowing client applications to fetch and process large volumes of documents in managed memory batches.

---

## 1. Prerequisites

- [`find()` / `findOne()`](find.md) — The query methods that return cursors.

---

## 2. Term Category

**Core Concept** (Query Result Stream Pointer): A Cursor is a stateful pointer returned by find() that streams query result batches lazily from the MongoDB server to the client application.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed in the server's memory. Cursors expire automatically after 10 minutes of client inactivity to reclaim server RAM).

### (1) Design Motivation — "Why did we design this?"
Suppose you run a query on a database collection containing 5 million documents:
`db.logs.find();`

If the database server tried to load all 5 million documents into RAM, format them into JSON text, and send them over the network in one massive block:
-   The database server's RAM would saturate.
-   The web application server would run out of memory and crash trying to buffer the response.
-   The network socket would lock up.

We designed the **Cursor** to prevent these memory exhaustion crashes.

When you call `find()`, the database doesn't send the documents. 

Instead, it returns a **Cursor**—a temporary pointer link to the search results. 

The cursor automatically fetches data in small, efficient batches (usually **101 documents** or **4MB of data** in the first pass). 

As your code loops through and processes the first 101 documents, the driver automatically requests the next batch from the server behind the scenes. 

This allows you to loop through millions of records while consuming only a few megabytes of RAM.

---

### (2) Cursor Modifiers
Because a cursor represents the *potential* results, you can chain modifiers before fetching data:
-   `db.users.find().sort({ age: 1 }).limit(10)`
These modifiers are sent to the database engine first, ensuring that sorting and limits are processed on disk files *before* any documents are streamed over the network.

---

### (3) Reality Metaphor
Imagine drinking water from a 50-gallon water tank:
-   **No Cursor:** Dumping the entire 50-gallon tank onto the kitchen floor at once. You get the water, but it floods the kitchen and ruins the house (RAM crash).
-   **With Cursor:** Tuning a **Flick-Tap Faucet** (the Cursor). 
    -   You place a 1-pint glass under the tap, open the valve, and fill the glass (fetch a batch). 
    -   You drink it. 
    -   When the glass is empty, you open the tap to refill the glass (next batch). 
    -   You control the flow of water safely without flooding the room.

---

### (4) Code Examples

#### Iterating Cursors in mongosh
In the command-line shell, cursors iterate automatically. You can also manipulate them manually using JavaScript loop methods:

```javascript
// 1. Assign the cursor to a variable (no data is fetched yet!)
const myCursor = db.users.find({ status: "active" });

// 2. Loop through documents one-by-one as they stream from the server
while (myCursor.hasNext()) {
  const doc = myCursor.next();
  print("User Name: " + doc.name); // Processes 1 document in memory at a time
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Processing slow, long-running application tasks inside a cursor loop, causing Cursor Timeout errors

**The mistake:** Fetching documents using a cursor and running a slow 30-second API HTTP call inside the loop for every record:

```javascript
// BAD: Cursor will time out and crash mid-loop!
const cursor = db.collection('customers').find();
while (await cursor.hasNext()) {
  const customer = await cursor.next();
  await sendSlowWelcomeEmail(customer.email); // Takes 30 seconds!
}
```

**Why it's wrong:** To protect server memory, MongoDB automatically kills any idle cursor after **10 minutes** of inactivity. 

If your loop spends too much time running slow tasks between `.next()` fetches, the cursor expires on the database server. 

The next time your loop tries to call `cursor.next()`, the app crashes with a `CursorNotFound` error.

**Fix: If your loop requires running slow, external tasks, do not process them inside the active cursor stream. Instead, fetch the documents, convert the cursor to a standard array using `.toArray()` to close the database pointer, and then run your slow loops on the in-memory array:**

```javascript
// CORRECT
const customers = await db.collection('customers').find().toArray(); // Closes cursor
for (const customer of customers) {
  await sendSlowWelcomeEmail(customer.email); // Safe! No active DB cursor.
}
```

---





### Mistake 2: Calling `toArray()` on Massive Result Cursors Loading Millions of Documents into Memory

**The mistake:** Running `await db.collection('large').find().toArray()` on 2 million records.

**Why it's wrong:** `toArray()` loads ALL matching documents into application RAM simultaneously, causing Node.js out-of-memory heap allocation crashes. Iterate using `.forEach()` or async iterators.

*Incorrect:*
```javascript
const allDocs = await db.collection("large").find().toArray(); // ❌ RAM Out Of Memory crash!
```

*Fix:*
```javascript
for await (const doc of db.collection("large").find()) { process(doc); } // Stream items one by one
```



### Mistake 3: Leaving Open Server Cursors Without Iteration or Explicit Close

**The mistake:** Opening a cursor with `noCursorTimeout` and failing to iterate to completion or call `close()`.

**Why it's wrong:** `noCursorTimeout` keeps cursor resources pinned open on `mongod` servers indefinitely, consuming server memory.

*Incorrect:*
```javascript
const cursor = collection.find().addCursorFlag("noCursorTimeout", true); // Left un-closed!
```

*Fix:*
```javascript
const cursor = collection.find(); try { for await (const doc of cursor) { ... } } finally { await cursor.close(); }
```



## 5. Practice Exercises

### Exercise 1: Streaming Query Results via Cursors

**Scenario:**
Iterate over query results for collection `users` using cursor `hasNext()` and `next()` iteration.

**Requirements:**
1. Obtain cursor from `db.users.find({ status: "active" })`.
2. Iterate using `while (cursor.hasNext())`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const cursor = db.users.find({ status: "active" });
> 
> while (cursor.hasNext()) {
>   const user = cursor.next();
>   console.log("User:", user.name, user.email);
> }
> ```
>
> #### Technical Explanation
>
> 1. `find()` returns a stateful cursor pointer rather than loading all matching documents into client RAM.
> 2. `cursor.hasNext()` and `cursor.next()` stream document batches from the server on demand.
> 3. Prevents client memory exhaustion on multi-gigabyte query result sets.
> 
---

### Exercise 2: Converting Cursors to In-Memory Arrays

**Scenario:**
Convert a small query result set into an in-memory JavaScript array using `toArray()`.

**Requirements:**
1. Call `cursor.toArray()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const activeUsers = db.users.find({ status: "active" }).limit(10).toArray();
> console.log("Loaded Array Length:", activeUsers.length);
> ```
>
> #### Technical Explanation
>
> 1. `toArray()` consumes all remaining cursor batches and loads documents into a JavaScript array.
> 2. Use carefully only on small bounded query result sets (e.g. combined with `limit()`).
> 3. Closes the cursor automatically when iteration completes.
> 
---

### Exercise 3: Setting Cursor Batch Sizes

**Scenario:**
Configure cursor batch size to 100 documents per network roundtrip using `batchSize()`.

**Requirements:**
1. Call `cursor.batchSize(100)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const cursor = db.logs.find().batchSize(100);
> ```
>
> #### Technical Explanation
>
> 1. `batchSize(n)` configures how many BSON documents `mongod` returns in each network response batch.
> 2. Balances memory usage against network roundtrip frequency.
> 3. Optimizes streaming performance for large ETL exports.
> 
---



## 6. Related Terms

- [`find()` / `findOne()`](find.md) — The query methods.
- [`sort()` / `limit()` / `skip()`](sort_limit_skip.md) — Cursor pagination methods.

---

## 7. Key Takeaways
- A Cursor is a temporary server pointer to query results.
- Prevents database crashes by streaming documents in managed batches.
- Defaults to batch sizes of 101 documents or 4MB of BSON data.
- Supports chained modifiers like `.sort()`, `.limit()`, and `.skip()`.
- Cursors expire and close automatically after 10 minutes of idle inactivity.
- Avoid slow, long loops inside active cursor fetches to prevent timeouts.
- Use `.toArray()` to copy cursor contents to memory if processing is slow.
