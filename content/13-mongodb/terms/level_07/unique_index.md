# Unique Index

> **Level 7 — Indexes & Query Performance**
> The database index constraint that prevents any two documents in a collection from sharing the same value for the indexed field, comparing this to SQL constraints, and explaining the critical "duplicate null" error when applied to optional fields.

---

## 1. Prerequisites

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.

---

## 2. Term Category

**Index / Performance** (Constraint Enforcing Index): A Unique Index enforces uniqueness constraints on indexed field values across all collection documents, rejecting duplicate writes.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Checked during the write pipeline. Rejects duplicates with database error code `11000` and rolls back write transactions).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Enforcing Unique Field Constraints

**Scenario:**
Create a unique index on `email` in collection `users` to prevent duplicate account registration.

**Requirements:**
1. Execute `createIndex({ email: 1 }, { unique: true })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex(
>   { email: 1 },
>   { unique: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. Unique indexes reject write operations attempting to insert duplicate key values.
> 2. Enforces data integrity at the database storage engine tier.
> 3. Throws `MongoServerError: E11000 duplicate key error` on violation.
> 
---

### Exercise 2: Compound Unique Indexes

**Scenario:**
Enforce unique product SKUs per store location by creating a compound unique index on `{ storeId: 1, sku: 1 }`.

**Requirements:**
1. Execute `createIndex({ storeId: 1, sku: 1 }, { unique: true })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.inventory.createIndex(
>   { storeId: 1, sku: 1 },
>   { unique: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. Compound unique indexes enforce uniqueness across the COMBINATION of specified field values.
> 2. Allows duplicate `sku` values across different `storeId` values, but rejects duplicate combinations.
> 3. Multi-column primary key equivalent.
> 
---

### Exercise 3: Handling Duplicate Key Errors in Driver Code

**Scenario:**
Catch and handle `E11000` duplicate key write exception in application driver code.

**Requirements:**
1. Handle Error Code `11000`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   db.users.insertOne({ email: "alice@example.com" });
> } catch (err) {
>   if (err.code === 11000) {
>     console.error("Account registration failed: Email address already registered.");
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. Unique index violations throw Error Code 11000 (`E11000 duplicate key error`).
> 2. Application code catches 11000 exceptions to return clean HTTP 409 Conflict user messages.
> 3. Protects application consistency.
> 
---



## 6. Related Terms

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [Sparse Index](sparse_index.md) — The duplicate null fix.
- [Partial Index](partial_index.md) — The modern alternative.

---

## 7. Key Takeaways
- A Unique Index prevents duplicate values in the indexed field.
- Direct NoSQL equivalent to SQL's `UNIQUE` key column constraint.
- Returns error code `11000` (duplicate key error) if a write violates the rule.
- Missing optional fields are indexed as `null` values by default.
- Storing a second document missing the optional field triggers a duplicate null crash.
- Resolve duplicate null crashes using `{ unique: true, sparse: true }`.
- Useful for enforcing entity identifiers (emails, SKUs, usernames).
