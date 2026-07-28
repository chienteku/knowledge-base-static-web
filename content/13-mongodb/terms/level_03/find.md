# `find()` / `findOne()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The primary MongoDB collection methods used to retrieve all matching documents (`find()`) or a single matching document (`findOne()`) from a collection, equivalent to SQL's `SELECT` statement.

---

## 1. Prerequisites
- [insertOne() / insertMany()](insert.md) — The write operations.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed inside `mongosh` or through application database drivers. Optimizes read operations by utilizing indexes created on the collection).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Omitting Filter Objects in Production `find()` Executions

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

### Mistake 5: Passing Projection Objects as Second Argument in `findOne()` Incorrectly

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

## 6. Practice Exercises

### Exercise 1: Read Query Formulation

**Problem:** You have a `products` collection. Write the MongoDB queries to:
1.  Find the first single document where the `sku` field is exactly `"SKU-990"`.
2.  Find all documents where the `status` field is exactly `"active"`.

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Single match lookup
> db.products.findOne({ sku: "SKU-990" });
> 
> // 2. Multiple match lookup
> db.products.find({ status: "active" });
> ```
> - Choose `findOne` for unique keys where you only need one document.
> - Choose `find` for general status filters where multiple rows can match.

---



### Exercise 2: Basic Find Query with Projection

**Problem:** Find active users returning ONLY `name` and `email` fields (excluding `_id`).

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ active: true }, { projection: { name: 1, email: 1, _id: 0 } });
> ```
> ```javascript
> db.users.find({ active: true }, {
>   projection: { name: 1, email: 1, _id: 0 }
> });
> ```
>
> **Explanation:** Projection objects restrict returned document fields.

---

### Exercise 3: Find Single Document by ID

**Problem:** Find single user document matching `_id` using `findOne()`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.findOne({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
> ```
> ```javascript
> db.users.findOne({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
> ```
>
> **Explanation:** `findOne()` returns the first matching document object directly.

## 7. Related Terms
- [Query Filter (Filter Document)](query_filter.md) — The filter parameter.
- [Cursor](cursor.md) — The pointer returned by `find()`.
- [Projection](projection.md) — Selecting specific fields to return.

---

## 8. Key Takeaways
- `findOne()` returns the first matching document; `find()` returns all matches.
- Serves as the MongoDB equivalent to SQL `SELECT` queries.
- `findOne()` returns a single JSON object or `null` directly.
- `find()` returns a Cursor object pointer, not a raw array.
- In backend code, chain `.toArray()` to convert cursors to JavaScript arrays.
- Queries utilize indexes automatically to execute high-speed reads.
