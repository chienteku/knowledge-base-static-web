# `find()` / `findOne()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to retrieve all matching documents (`find()`) or a single matching document (`findOne()`) from a collection, equivalent to SQL's `SELECT` statement.

---

## 1. Prerequisites

- [`insertOne()` / `insertMany()`](insert.md) — The write operations.

---

## 2. Term Category

**CRUD Operation** (Document Query Method): find() queries a collection and returns a cursor pointing to matching document records.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through application database drivers. Optimizes read operations by utilizing indexes created on the collection).

### (1) Design Motivation — "Why did we design this?"
Once you have saved documents in a database, you need to read them: showing a user profile page, listing products in a catalog search, or showing notification alerts.

In PostgreSQL, you use the standard SQL SELECT statement:
`SELECT * FROM users WHERE age = 28;`

We designed **`find()`** and **`findOne()`** to provide an object-oriented, javascript-native way to retrieve documents. 

Instead of writing text strings containing SQL verbs, you pass a JSON **Query Filter** object directly into the methods. 

---

### (2) Single vs. Multiple Retrieval

#### 1. `findOne(filter)`
Retrieves the **first** document in the collection that matches the query filter.
-   *Behavior:* Returns a single JSON object `{}`. If no matching document is found, it returns `null`.
-   *Best Use Case:* Fetching a specific record where you expect a unique key match (like looking up a user by their unique `_id` or `email`).

#### 2. `find(filter)`
Retrieves **all** documents in the collection that match the query filter.
-   *Behavior:* Does **not** return a raw array of documents. Instead, it returns a **Cursor** object (which we will learn in Term #36)—a pointer that allows you to stream results, sort them, or paginate before loading them into memory.

---

### (3) Reality Metaphor
Imagine a librarian managing a catalog:
-   **`findOne()`:** You say: *"Find me **the first** book with a blue cover."* The librarian walks to the shelf, grabs the first blue book, hands it to you immediately, and stops searching.
-   **`find()`:** You say: *"Find me **all** books about history."* The librarian compiles a **Roster List** (the Cursor) showing the locations of the 200 history books on the shelves. The librarian waits for you to read the list and ask for the books page-by-page.

---

### (4) Code Examples

#### 1. Finding a Single Document by ID (findOne)
```javascript
// Retrieve the specific user matching the unique ObjectId
db.users.findOne({ _id: ObjectId("65fc71239b1d8b2e88a8d111") });
// Returns: { _id: ObjectId("..."), name: "Alice", age: 28 }
```

#### 2. Finding Multiple Documents (find)
```javascript
// Retrieve all products priced at exactly 19.99
db.products.find({ price: NumberDecimal("19.99") });
// Returns a cursor displaying matching documents in the console
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating the return value of find() as a raw JavaScript array in your backend application code

**The mistake:** Fetching users in Node.js and immediately trying to run array methods like `.map()` or checking `.length` on the query result:

```javascript
// BAD: Fails because 'users' is a Cursor object, not an array!
const users = db.collection('users').find({ age: 28 });
console.log(users.length); // undefined!
const names = users.map(u => u.name); // Crash: users.map is not a function
```

**Why it's wrong:** The `find()` method returns a **Cursor**. 

To save server RAM, the cursor does not fetch all documents from the database until you explicitly tell it to.

**Fix: In your application code, you must call the `.toArray()` method on the cursor to stream and convert the results into a standard JavaScript array before using array properties:**

```javascript
// CORRECT
const users = await db.collection('users').find({ age: 28 }).toArray();
console.log(users.length); // Works!
const names = users.map(u => u.name); // Works!
```

---





### Mistake 2: Omitting Filter Objects in Production `find()` Executions

**The mistake:** Executing `db.users.find()` on 10M document production collections without filter predicates or limits.

**Why it's wrong:** `find()` without arguments scans all collection documents, causing high CPU and memory cache churn.

*Incorrect:*
```javascript
db.users.find(); // Un-bounded collection scan!
```

*Fix:*
```javascript
db.users.find({ active: true }).limit(20);
```



### Mistake 3: Passing Projection Objects as Second Argument in `findOne()` Incorrectly

**The mistake:** Writing `db.users.findOne({ _id: id }, { name: 1 })` in driver versions expecting options objects.

**Why it's wrong:** Some modern driver APIs expect `findOne(filter, { projection: { name: 1 } })`.

*Incorrect:*
```javascript
db.users.findOne({ _id: id }, { name: 1 }); // May fail depending on driver version
```

*Fix:*
```javascript
db.users.findOne({ _id: id }, { projection: { name: 1 } });
```



## 5. Practice Exercises

### Exercise 1: Querying Collection Documents with Filters

**Scenario:**
Query collection `products` for items in category `"electronics"` with stock greater than 0.

**Requirements:**
1. Execute `db.products.find({ category: "electronics", stock: { $gt: 0 } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({
>   category: "electronics",
>   stock: { $gt: 0 }
> });
> ```
>
> #### Technical Explanation
>
> 1. `find(query, projection)` searches collection records matching query conditions.
> 2. Returns a cursor object streaming matching documents lazily.
> 3. Multiple query fields combine with implicit `$and` logic.
> 
---

### Exercise 2: Applying Projection Filters to `find()`

**Scenario:**
Query `products` returning ONLY fields `name` and `price` (excluding `_id`).

**Requirements:**
1. Pass projection `{ name: 1, price: 1, _id: 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find(
>   { category: "electronics" },
>   { name: 1, price: 1, _id: 0 }
> );
> ```
>
> #### Technical Explanation
>
> 1. Projection specification controls which document fields are included in returned payloads.
> 2. `_id: 0` explicitly suppresses the automatic `_id` primary key.
> 3. Reduces network payload and client memory overhead.
> 
---

### Exercise 3: Chaining Cursor Modifiers on `find()`

**Scenario:**
Query `products` sorted by `price` descending, limiting results to the top 5 most expensive items.

**Requirements:**
1. Chain `.sort({ price: -1 }).limit(5)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({ category: "electronics" })
>   .sort({ price: -1 })
>   .limit(5);
> ```
>
> #### Technical Explanation
>
> 1. `.sort({ price: -1 })` orders returned documents descending.
> 2. `.limit(5)` caps maximum returned document count.
> 3. Evaluates sorting and limits server-side before streaming results.
> 
---



## 6. Related Terms

- [Query Filter (Filter Document)](query_filter.md) — The filter parameter.
- [Cursor](cursor.md) — The pointer returned by `find()`.
- [Projection](projection.md) — Selecting specific fields to return.
- [`countDocuments()` / `estimatedDocumentCount()`](count_documents.md) — Related concept: `countDocuments()` / `estimatedDocumentCount()`.
- [Geospatial Queries (`$near`, `$geoWithin`, `2dsphere`)](../level_04/geospatial_queries.md) — Related concept: Geospatial Queries (`$near`, `$geoWithin`, `2dsphere`).

---

## 7. Key Takeaways
- `findOne()` returns the first matching document; `find()` returns all matches.
- Serves as the MongoDB equivalent to SQL `SELECT` queries.
- `findOne()` returns a single JSON object or `null` directly.
- `find()` returns a Cursor object pointer, not a raw array.
- In backend code, chain `.toArray()` to convert cursors to JavaScript arrays.
- Queries utilize indexes automatically to execute high-speed reads.
