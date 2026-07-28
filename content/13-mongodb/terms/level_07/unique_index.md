# Unique Index

> **Level 7 — Indexes & Query Performance**
> The database index constraint that prevents any two documents in a collection from sharing the same value for the indexed field, comparing this to SQL constraints, and explaining the critical "duplicate null" error when applied to optional fields.

---

## 1. Prerequisites
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.

---

## 2. Term Category
- **Database Structure / Constraint**

---

## 3. Environment Context
- **MongoDB Core** (Checked during the write pipeline. Rejects duplicates with database error code `11000` and rolls back write transactions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In application development, keeping data unique is a core requirement:
-   Two users must not register using the same `email`.
-   Two products must not share a `sku`.

While you can write application checks (e.g. check if the email exists in Node.js before saving), this is prone to **Race Conditions**. 

If two users click "Register" at the exact same millisecond, both Node.js checks will read "does not exist" simultaneously, and both will write duplicate profiles.

We designed the **Unique Index** to enforce uniqueness at the database engine level. 

By setting the `{ unique: true }` option, MongoDB acts as a gatekeeper. 

It checks the index B-Tree before writing. 

If the value is already present, it rejects the write with error code `11000`, guaranteeing data integrity.

---

### (2) The Optional Field / Duplicate Null Gotcha (CRITICAL)
If you build a unique index on an **optional field** (like `phone`, which users can leave blank):
-   MongoDB treats a missing field in a document as carrying a value of **`null`**.
-   When you insert the first user without a phone: it writes successfully (`phone: null`).
-   When you insert a second user without a phone: MongoDB checks the unique index, sees `phone: null` already exists, and **rejects the insert with a duplicate key error!**

To prevent this duplicate null crash on optional fields, you must pair the unique index with a **Sparse Index** or a **Partial Index** to tell MongoDB to ignore missing values.

---

### (3) Reality Metaphor (Locker Room Tags)
Imagine assigning mail lockers to workers:
-   **Unique Index:** Every locker must have a unique name label. You cannot label locker 1 `"John Smith"` and locker 2 `"John Smith"`.
-   **The Null Gotcha:** A new worker has no name tag yet, so you leave their locker label **Blank** (`null`). 
    -   When a second tag-less worker arrives, the manager blocks you: *"You cannot have two blank labels! I can't distinguish locker 1 from locker 2. You must give them a label first."* 
    -   To resolve this, you need a rule: *"Only label lockers for employees who have tags; leave the others unlabeled and ignored"* (Sparse index).

---

### (4) Code Examples

#### The Duplicate Null Crash
Let's see why unique indexes fail on optional fields:

```javascript
db.users.createIndex({ phone: 1 }, { unique: true });

// User 1: Succeeds (writes phone: null to unique index)
db.users.insertOne({ username: "alice" });

// User 2: CRASHES! (Duplicate key error on 'null')
db.users.insertOne({ username: "bob" });
// Output Error:
// WriteError({
//   "code": 11000,
//   "errmsg": "E11000 duplicate key error collection: mydb.users index: phone_1 dup key: { phone: null }"
// })
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating a unique index on an optional field without adding a sparse or partial constraint

**The mistake:** Building `db.users.createIndex({ invitation_code: 1 }, { unique: true })` and discovering that users who register without invitation codes cannot sign up because the second registration crash on duplicate nulls.

**Why it's wrong:** As shown in the code examples, MongoDB indexes the missing fields as `null` values, treating them as duplicates.

**Fix: When creating a unique index on an optional field that may be absent, always combine it with a sparse or partial index filter:**

```javascript
// CORRECT: Skips indexing documents that lack the field entirely
db.users.createIndex(
  { invitation_code: 1 }, 
  { unique: true, sparse: true }
);
```

---



### Mistake 2: Creating Unique Indexes on Collections Containing Duplicate Field Values

**The mistake:** Executing `db.users.createIndex({ email: 1 }, { unique: true })` when duplicate `email` records exist.

**Why it's wrong:** If duplicate values exist in the target field, `createIndex()` aborts with duplicate key error `E11000`. Clean duplicate documents before building unique indexes.

*Incorrect:*
```javascript
db.users.createIndex({ email: 1 }, { unique: true }); // ❌ Fails with E11000 duplicate key error!
```

*Fix:*
```javascript
Remove or resolve duplicate email records before creating unique index
```

### Mistake 3: Forgetting that Missing Fields Cause Unique Key Collisions on Standard Unique Indexes

**The mistake:** Creating unique index `{ passportNumber: 1 }, { unique: true }` when multiple documents lack `passportNumber`.

**Why it's wrong:** MongoDB treats missing fields as `null`. Multiple documents lacking `passportNumber` result in duplicate `null` keys, throwing `E11000`. Use `sparse: true` or `partialFilterExpression`.

*Incorrect:*
```javascript
db.users.createIndex({ passportNumber: 1 }, { unique: true }); // ❌ Collides on multiple missing fields!
```

*Fix:*
```javascript
db.users.createIndex({ passportNumber: 1 }, { unique: true, sparse: true }); // Ignores missing fields
```



### Mistake 4: Creating Unique Indexes on Collections Containing Duplicate Field Values

**The mistake:** Executing `db.users.createIndex({ email: 1 }, { unique: true })` when duplicate `email` records exist.

**Why it's wrong:** If duplicate values exist in the target field, `createIndex()` aborts with duplicate key error `E11000`. Clean duplicate documents before building unique indexes.

*Incorrect:*
```javascript
db.users.createIndex({ email: 1 }, { unique: true }); // ❌ Fails with E11000 duplicate key error!
```

*Fix:*
```javascript
Remove or resolve duplicate email records before creating unique index
```

### Mistake 5: Forgetting that Missing Fields Cause Unique Key Collisions on Standard Unique Indexes

**The mistake:** Creating unique index `{ passportNumber: 1 }, { unique: true }` when multiple documents lack `passportNumber`.

**Why it's wrong:** MongoDB treats missing fields as `null`. Multiple documents lacking `passportNumber` result in duplicate `null` keys, throwing `E11000`. Use `sparse: true` or `partialFilterExpression`.

*Incorrect:*
```javascript
db.users.createIndex({ passportNumber: 1 }, { unique: true }); // ❌ Collides on multiple missing fields!
```

*Fix:*
```javascript
db.users.createIndex({ passportNumber: 1 }, { unique: true, sparse: true }); // Ignores missing fields
```

## 6. Practice Exercises

### Exercise 1: Unique Index Construction

**Problem:** You want to build a unique index on the `username` field of a `users` collection. 
1.  Write the MongoDB command to create the index.
2.  State the error code returned if your application tries to write a duplicate username.

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Index command
> db.users.createIndex({ username: 1 }, { unique: true });
> ```
> - The unique parameter is passed inside the options block.
> - Identify the standard duplicate key code.

---



### Exercise 2: Creating Unique Index

**Problem:** Create unique index on `email` field in `users` collection.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.createIndex({ email: 1 }, { unique: true });
> ```
> ```javascript
> db.users.createIndex({ email: 1 }, { unique: true });
> ```
>
> **Explanation:** `unique: true` prevents duplicate key insertions across collection documents.

---

### Exercise 3: Handling E11000 Duplicate Key Error in Node.js

**Problem:** Catch MongoDB duplicate key error code in Node.js (`err.code === 11000`).

**Expected output:**
> [!check]- Answer
> ```text
> if (err.code === 11000) console.error("Duplicate key error");
> ```
> ```javascript
> try {
>   await db.users.insertOne({ email: "dup@ex.com" });
> } catch (err) {
>   if (err.code === 11000) {
>     console.error("Email already exists!");
>   }
> }
> ```
>
> **Explanation:** Error code 11000 flags unique index primary key constraint violations.

## 7. Related Terms
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [Sparse Index](sparse_index.md) — The duplicate null fix.
- [Partial Index](partial_index.md) — The modern alternative.

---

## 8. Key Takeaways
- A Unique Index prevents duplicate values in the indexed field.
- Direct NoSQL equivalent to SQL's `UNIQUE` key column constraint.
- Returns error code `11000` (duplicate key error) if a write violates the rule.
- Missing optional fields are indexed as `null` values by default.
- Storing a second document missing the optional field triggers a duplicate null crash.
- Resolve duplicate null crashes using `{ unique: true, sparse: true }`.
- Useful for enforcing entity identifiers (emails, SKUs, usernames).
