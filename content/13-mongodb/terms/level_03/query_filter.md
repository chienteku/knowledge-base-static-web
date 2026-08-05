# Query Filter (Filter Document)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The JSON object passed as a parameter to MongoDB read, update, or delete operations to define search conditions, serving as the direct equivalent of a SQL `WHERE` clause.

---

## 1. Prerequisites

- [`find()` / `findOne()`](find.md) — The methods that accept query filters.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually across all NoSQL document databases. Stored and parsed in memory by the database compiler).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, you filter queries using the declarative SQL `WHERE` clause:
`SELECT * FROM products WHERE price > 50 AND category = 'shoes';`

While SQL is readable, it is written as a **string text block**. 

To run the query, the database server must parse this text string character-by-character, check syntax, and compile it. 

If your backend code generates queries dynamically, string concatenation can lead to syntax errors or SQL injection.

We designed the **Query Filter** (also called a **Filter Document**) to solve this. 

Instead of compiling text strings, MongoDB uses structured JSON objects to define filters. 

Because JSON is natively parsed by computers and matching programming languages, your application can build complex search filters dynamically using simple object properties, preventing string manipulation errors and providing a structured, compiler-friendly query pipeline.

---

### (2) Query Filter Structure
A query filter is a JSON object containing key-value pairs:
`{ <field>: <value_or_operator_expression> }`

-   **Direct Match:** `{ status: "active" }` (Finds documents where `status` equals `"active"`).
-   **Operator Match:** `{ price: { $gt: 50 } }` (Finds documents where `price` is greater than `50`).
-   **Nested Match:** `{ "address.city": "Paris" }` (Finds documents matching the nested subdocument field).

---

### (3) Reality Metaphor
Imagine a cargo sorting facility:
-   **SQL WHERE Clause:** A sorting machine running on programmed text rules: *"If the box has a red tag and weighs more than 10kg, move it to conveyor 2."*
-   **Query Filter:** A physical **Sorting Sieve Grid**. 
    -   The sieve has custom-cut holes shaped like specific criteria (e.g. only letting boxes with a height of 5 inches and a width of 10 inches fall through). 
    -   You pour the packages onto the sieve, and only the items matching the physical template drop to the cargo bin below.

---

### (4) Code Examples: SQL vs. MongoDB

Let's translate SQL `WHERE` clauses into MongoDB Query Filters:

#### Example 1: Basic equality AND search
```sql
/* SQL */
SELECT * FROM users WHERE status = 'active' AND age = 25;
```
```javascript
/* MongoDB Query Filter */
db.users.find({ status: "active", age: 25 });
```

#### Example 2: Operator range search
```sql
/* SQL */
SELECT * FROM products WHERE price >= 100.00;
```
```javascript
/* MongoDB Query Filter */
db.products.find({ price: { $gte: NumberDecimal("100.00") } });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing SQL-like syntax comparison operators directly inside JSON query filters

**The mistake:** Writing a filter using comparison symbols directly like `{ age > 25 }` or `{ status = "active" }` inside `find()`.

**Why it's wrong:** This is invalid JSON. 

JavaScript and the MongoDB shell will fail to compile the object, throwing a syntax crash before the query is even sent to the database.

**Fix: Always structure queries as nested objects, using BSON operators prefixed with `$` (like `$gt`, `$gte`, `$eq`) for comparison rules.**

```javascript
// CORRECT
db.users.find({ age: { $gt: 25 } });
```

---



### Mistake 2: Passing Raw Un-Parsed Strings to `_id` Filter Queries

**The mistake:** Querying `db.users.find({ _id: "60d5ecb8b5c9c22b9c8b4567" })`.

**Why it's wrong:** `_id` is stored as a BSON `ObjectId` object! Passing a raw string `"60d5..."` fails to match the `ObjectId` primitive.

*Incorrect:*
```javascript
db.users.find({ _id: "60d5ecb8b5c9c22b9c8b4567" }); // ❌ String is not equal to ObjectId!
```

*Fix:*
```javascript
db.users.find({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
```

### Mistake 3: Writing Empty Filter `{}` in Production Update Operations

**The mistake:** Running `db.users.updateMany({}, { $set: { status: "inactive" } })`.

**Why it's wrong:** An empty filter object `{}` matches EVERY document in the collection, mutating all documents.

*Incorrect:*
```javascript
db.users.updateMany({}, { $set: { status: "inactive" } }); // 💥 Mutates ALL documents!
```

*Fix:*
```javascript
db.users.updateMany({ lastLogin: { $lt: date } }, { $set: { status: "inactive" } });
```



### Mistake 4: Passing Raw Un-Parsed Strings to `_id` Filter Queries

**The mistake:** Querying `db.users.find({ _id: "60d5ecb8b5c9c22b9c8b4567" })`.

**Why it's wrong:** `_id` is stored as a BSON `ObjectId` object! Passing a raw string `"60d5..."` fails to match the `ObjectId` primitive.

*Incorrect:*
```javascript
db.users.find({ _id: "60d5ecb8b5c9c22b9c8b4567" }); // ❌ String is not equal to ObjectId!
```

*Fix:*
```javascript
db.users.find({ _id: new ObjectId("60d5ecb8b5c9c22b9c8b4567") });
```

### Mistake 5: Writing Empty Filter `{}` in Production Update Operations

**The mistake:** Running `db.users.updateMany({}, { $set: { status: "inactive" } })`.

**Why it's wrong:** An empty filter object `{}` matches EVERY document in the collection, mutating all documents.

*Incorrect:*
```javascript
db.users.updateMany({}, { $set: { status: "inactive" } }); // 💥 Mutates ALL documents!
```

*Fix:*
```javascript
db.users.updateMany({ lastLogin: { $lt: date } }, { $set: { status: "inactive" } });
```

## 6. Practice Exercises

### Exercise 1: SQL to Mongo Translation

**Problem:** Translate the following SQL query `WHERE` clause into a valid MongoDB Query Filter document object:
`SELECT * FROM inventory WHERE qty < 10 AND status = 'low';`

**Expected output:**
> [!check]- Answer
> ```javascript
> { qty: { $lt: 10 }, status: "low" }
> ```
> - Map the SQL less-than operator `<` to the BSON query operator `$lt`.
> - Combine the two fields inside a single JSON object.

---



### Exercise 2: Combining Range and Set Filter Predicates

**Problem:** Query users with `age >= 21` whose `status` is in `["active", "pending"]`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ age: { $gte: 21 }, status: { $in: ["active", "pending"] } });
> ```
> ```javascript
> db.users.find({
>   age: { $gte: 21 },
>   status: { $in: ["active", "pending"] }
> });
> ```
>
> **Explanation:** Query filter objects combine field predicates using implicit AND logic.

---

### Exercise 3: Filtering Array Element Criteria

**Problem:** Query posts containing array element matching `{ tag: "tech", score: { $gt: 5 } }` using `$elemMatch`.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ tags: { $elemMatch: { tag: "tech", score: { $gt: 5 } } } });
> ```
> ```javascript
> db.posts.find({
>   tags: { $elemMatch: { tag: "tech", score: { $gt: 5 } } }
> });
> ```
>
> **Explanation:** `$elemMatch` guarantees multiple predicate conditions match the SAME array element.

## 7. Related Terms

- [Implicit `$eq` & Combining Conditions](implicit_eq_combining.md) — How fields are combined.
- [Comparison Query Operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`)](comparison_operators.md) — The value comparison codes.
- [`deleteOne()` / `deleteMany()`](delete.md) — Related concept: `deleteOne()` / `deleteMany()`.
- [`find()` / `findOne()`](find.md) — Related concept: `find()` / `findOne()`.
- [Logical Query Operators (`$and`, `$or`, `$not`, `$nor`)](logical_operators.md) — Related concept: Logical Query Operators (`$and`, `$or`, `$not`, `$nor`).
- [NoSQL Injection](../level_10/nosql_injection.md) — Related concept: NoSQL Injection.

---

## 8. Key Takeaways
- A Query Filter is a structured JSON object defining search conditions.
- Serves as the MongoDB equivalent of a SQL `WHERE` clause.
- Avoids text-based string parsing, reducing compiler overhead.
- Supports direct key equality matches and operator-based logic checks.
- Operators are prefixed with a dollar sign (e.g., `$gt`, `$in`).
- Can search nested values using quotes and Dot Notation.
- Can be dynamically constructed in backend programming code objects.
