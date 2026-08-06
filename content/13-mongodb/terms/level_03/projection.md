# Projection

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The database practice of specifying which fields to return or exclude in query results, serving as the equivalent of selecting specific columns in a PostgreSQL `SELECT` statement.

---

## 1. Prerequisites

- [`find()` / `findOne()`](find.md) — The query methods that execute projections.

---

## 2. Term Category

**CRUD Operation** (Field Selection Filter): Projection specifies which fields to include or exclude in query result documents, reducing network bandwidth usage.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Passed as the optional **second argument** to query methods. Evaluated at the query executor level, reducing network payload sizes).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Inclusion Projections for Field Optimization

**Scenario:**
Query collection `users` returning ONLY `name` and `email` fields to minimize API network payload size.

**Requirements:**
1. Projection `{ name: 1, email: 1, _id: 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find(
>   { status: "active" },
>   { name: 1, email: 1, _id: 0 }
> );
> ```
>
> #### Technical Explanation
>
> 1. Inclusion projections (`field: 1`) specify exact keys to include in output documents.
> 2. `_id: 0` explicitly suppresses the default primary key.
> 3. BSON parser skips unprojected document fields during network encoding.
> 
---

### Exercise 2: Exclusion Projections for Sensitive Fields

**Scenario:**
Query user profile documents excluding sensitive internal fields `passwordHash` and `salt`.

**Requirements:**
1. Projection `{ passwordHash: 0, salt: 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { passwordHash: 0, salt: 0 }
> );
> ```
>
> #### Technical Explanation
>
> 1. Exclusion projections (`field: 0`) omit specific sensitive keys while returning all other document fields.
> 2. Note: You cannot mix inclusion (1) and exclusion (0) in the same projection object (except for `_id`).
> 3. Prevents sensitive data leakage in API responses.
> 
---

### Exercise 3: Array Element Slicing Projections with `$slice`

**Scenario:**
Query blog post documents returning ONLY the 3 most recent comments in the `comments` array.

**Requirements:**
1. Use `$slice` operator in projection `{ comments: { $slice: -3 } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.posts.find(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { title: 1, comments: { $slice: -3 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$slice: -3` projects the last 3 elements of an embedded array.
> 2. Prevents returning massive arrays when displaying preview snippets.
> 3. Trims array payload size server-side.
> 
---



## 6. Related Terms

- [`find()` / `findOne()`](find.md) — The executing methods.
- [`sort()` / `limit()` / `skip()`](sort_limit_skip.md) — Related concept: `sort()` / `limit()` / `skip()`.
- [`$project` / `$addFields` Stages](../level_06/project_addfields.md) — Related concept: `$project` / `$addFields` Stages.

---

## 7. Key Takeaways
- Projection selects which document fields are returned by queries.
- Serves as the MongoDB equivalent to selecting columns in SQL.
- Passed as the optional second argument to `find()` and `findOne()`.
- Use `1` to include fields; `0` to exclude fields.
- The `_id` field is always returned unless explicitly marked `_id: 0`.
- Do not mix 1s and 0s in a projection, except for the `_id` field.
- Prevents network bloat and protects sensitive data by filtering database payloads.
