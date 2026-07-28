# Projection

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The database practice of specifying which fields to return or exclude in query results, serving as the equivalent of selecting specific columns in a PostgreSQL `SELECT` statement.

---

## 1. Prerequisites
- [`find()` / `findOne()`](find.md) — The query methods that execute projections.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Passed as the optional **second argument** to query methods. Evaluated at the query executor level, reducing network payload sizes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, queries like `db.users.find()` return complete documents containing all fields.

If your documents are large (e.g., carrying nested settings and arrays) and you only need to show a list of usernames on a directory sidebar:
-   **Resource Waste:** Fetching all fields reads unnecessary bytes from disk, consumes database RAM cache, and wastes network bandwidth.
-   **Security Risks:** You should never stream sensitive fields (like hashed passwords or API tokens) to client browsers if they aren't needed.

In PostgreSQL, you handle this by specifying columns:
`SELECT username, email FROM users;`

We designed **Projection** in MongoDB to provide the same field filtering. 

You pass a second JSON document into `find()`, specifying fields to keep or discard, keeping payloads lightweight.

---

### (2) Projection Rules & Syntax
Projections use binary indicators:
-   `1` or `true` to **Include** a field.
-   `0` or `false` to **Exclude** a field.

#### Rule 1: Inclusion Projection (Whitelist)
Specify only the fields you want. 

MongoDB will return *only* these fields, plus the mandatory `_id` field (which is always included by default).

`db.users.find({}, { username: 1, email: 1 })`

#### Rule 2: Exclusion Projection (Blacklist)
Specify fields to hide. 

MongoDB will return all document fields *except* the ones marked `0`.

`db.users.find({}, { password: 0, ssn: 0 })`

#### Rule 3: The Mixed Projection Constraint
**You cannot mix inclusion (1) and exclusion (0) in a single projection document.** 

Writing `{ username: 1, password: 0 }` will throw a database query error. 

The **only exception** is the `_id` field, which can always be excluded in an inclusion query: `{ username: 1, _id: 0 }`.

---

### (3) Reality Metaphor
Imagine reading a confidential personnel file folder:
-   **No Projection:** Opening the folder and reading every sheet (including tax documents, health records, and payroll).
-   **Projection:** Placing a **Cardboard Stencil Overlay** over the document page. 
    -   The cardboard has cut-out windows positioned exactly over the "Name" and "Email" lines. 
    -   You can read the text inside the windows (inclusion), while the rest of the sheet (tax codes, passwords) stays hidden behind the cardboard.

---

### (4) Code Examples

#### 1. Inclusion (Only return name and email, hide _id)
```javascript
db.users.find(
  { status: "active" },             // 1st Arg: Query Filter
  { name: 1, email: 1, _id: 0 }     // 2nd Arg: Projection Document
);
// Returns: { "name": "Alice", "email": "alice@company.com" }
```

#### 2. Exclusion (Return all except password)
```javascript
db.users.find(
  { status: "active" },
  { password: 0 }                   // Excludes only password
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mixing inclusion (1) and exclusion (0) rules in the same projection object

**The mistake:** Running the query `db.users.find({}, { name: 1, email: 1, password: 0 })` to fetch name/email while explicitly filtering out the password.

**Why it's wrong:** MongoDB projection engines require a consistent strategy: either you whitelist (only include) or blacklist (only exclude). 

Mixing them is ambiguous for the parser, and the database will throw a `ProjectionException` and abort the query.

**Fix: Stick to one strategy. If you only want name and email, use inclusion. Password is automatically excluded if not listed in the whitelist:**

```javascript
// CORRECT (password is excluded automatically!)
db.users.find({}, { name: 1, email: 1 });
```

---



### Mistake 2: Mixing Inclusion (`1`) and Exclusion (`0`) in the Same Projection Object

**The mistake:** Writing `db.users.find({}, { name: 1, age: 0 })`.

**Why it's wrong:** In MongoDB projections, you cannot mix inclusion `1` and exclusion `0` flags in the same projection object (except for suppressing `_id: 0`).

*Incorrect:*
```javascript
db.users.find({}, { name: 1, age: 0 }); // ❌ Cannot do inclusion and exclusion together!
```

*Fix:*
```javascript
db.users.find({}, { name: 1, _id: 0 }); // Inclusion list with _id suppression
```

### Mistake 3: Assuming Excluding `_id` Is Default in Projection Objects

**The mistake:** Writing `db.users.find({}, { name: 1 })` expecting `_id` field to be omitted.

**Why it's wrong:** The `_id` primary key field is included by default in all projection outputs unless explicitly excluded via `_id: 0`.

*Incorrect:*
```javascript
db.users.find({}, { name: 1 }); // Returns _id AND name!
```

*Fix:*
```javascript
db.users.find({}, { name: 1, _id: 0 }); // Explicitly excludes _id
```



### Mistake 4: Mixing Inclusion (`1`) and Exclusion (`0`) in the Same Projection Object

**The mistake:** Writing `db.users.find({}, { name: 1, age: 0 })`.

**Why it's wrong:** In MongoDB projections, you cannot mix inclusion `1` and exclusion `0` flags in the same projection object (except for suppressing `_id: 0`).

*Incorrect:*
```javascript
db.users.find({}, { name: 1, age: 0 }); // ❌ Cannot do inclusion and exclusion together!
```

*Fix:*
```javascript
db.users.find({}, { name: 1, _id: 0 }); // Inclusion list with _id suppression
```

### Mistake 5: Assuming Excluding `_id` Is Default in Projection Objects

**The mistake:** Writing `db.users.find({}, { name: 1 })` expecting `_id` field to be omitted.

**Why it's wrong:** The `_id` primary key field is included by default in all projection outputs unless explicitly excluded via `_id: 0`.

*Incorrect:*
```javascript
db.users.find({}, { name: 1 }); // Returns _id AND name!
```

*Fix:*
```javascript
db.users.find({}, { name: 1, _id: 0 }); // Explicitly excludes _id
```

## 6. Practice Exercises

### Exercise 1: Projection Filter Construction

**Problem:** You have a `products` collection. Write the query to find all products where `qty` is greater than 10, returning only the `name` and `price` fields, while explicitly hiding the `_id` field.

**Expected output:**
```javascript
db.products.find(
  { qty: { $gt: 10 } },
  { name: 1, price: 1, _id: 0 }
);
```

> [!check]- Answer
> - The first argument is the query filter.
> - The second argument is the projection.
> - Explicitly mark `_id` as `0` to exclude it from the whitelist.

---



### Exercise 2: Projecting Specific Fields

**Problem:** Project ONLY `title` and `author` fields from `posts` collection excluding `_id`.

**Expected output:**
```text
db.posts.find({}, { projection: { title: 1, author: 1, _id: 0 } });
```

> [!check]- Answer
> ```javascript
> db.posts.find({}, {
>   projection: { title: 1, author: 1, _id: 0 }
> });
> ```
>
> **Explanation:** `{ field: 1, _id: 0 }` includes specified fields while excluding `_id`.

### Exercise 3: Positional Array Projection Operator `$`

**Problem:** Project first matching array element from `comments` using positional `$` operator.

**Expected output:**
```text
db.posts.find({ "comments.user": "alice" }, { projection: { "comments.$": 1 } });
```

> [!check]- Answer
> ```javascript
> db.posts.find({
>   "comments.user": "alice"
> }, {
>   projection: { "comments.$": 1 }
> });
> ```
>
> **Explanation:** `"array.$": 1` projects ONLY the first array element matching query filters.

## 7. Related Terms
- [`find()` / `findOne()`](find.md) — The executing methods.

---

## 8. Key Takeaways
- Projection selects which document fields are returned by queries.
- Serves as the MongoDB equivalent to selecting columns in SQL.
- Passed as the optional second argument to `find()` and `findOne()`.
- Use `1` to include fields; `0` to exclude fields.
- The `_id` field is always returned unless explicitly marked `_id: 0`.
- Do not mix 1s and 0s in a projection, except for the `_id` field.
- Prevents network bloat and protects sensitive data by filtering database payloads.
