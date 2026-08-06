# Boolean

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to store logical truth values (`true` or `false`), serving as the direct equivalent of PostgreSQL's `BOOLEAN` type.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type system.

---

## 2. Term Category

**Core Concept** (Logical Truth Value BSON Type): The Boolean BSON data type stores true or false binary flags used for conditional filtering and status tracking in MongoDB documents.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Booleans are represented natively in JavaScript, JSON, and BSON. Consumes exactly 1 byte in the serialized BSON binary stream).

### (1) Design Motivation — "Why did we design this?"
Applications require binary toggle states to drive logic:
-   Is a user account verified? (`verified: true`)
-   Is a product out of stock? (`out_of_stock: false`)
-   Has an invoice been paid? (`paid: true`)

We designed the **BSON Boolean** type to store these binary states. 

It is the most efficient data type for logical checks, storing a simple binary bit representation.

---

### (2) Strict Type Matching
Unlike JavaScript, which evaluates "truthy" or "falsy" values (e.g. treats the number `1` or the string `"true"` as true in conditions):
-   **MongoDB is strictly typed.**
-   If you query: `db.users.find({ active: true })`
-   The query engine will **only** return documents where the `active` field is explicitly the BSON Boolean value `true`. 
-   It will ignore documents where `active` is `1` (Integer) or `"true"` (String).

---

### (3) Reality Metaphor
Imagine a home appliance:
-   **Boolean:** A physical **On/Off Light Switch Toggle**. It can only exist in one of two physical physical locks: flipped up (on/true) or flipped down (off/false). There is no middle state, and you cannot type text on the switch.

---

### (4) Code Examples

#### Storing and Filtering Booleans
```javascript
// Seed user flags
db.customers.insertMany([
  { name: "Alice", active: true },
  { name: "Bob", active: false }
]);

// Find only active customers
db.customers.find({ active: true });

// Find inactive customers
db.customers.find({ active: false });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using text strings ("true" / "false") or integer numbers (1 / 0) to represent boolean toggles

**The mistake:** Storing a flag as a text string: `{ verified: "true" }` because the inputs came from an HTML form text parser.

**Why it's wrong:** As noted, MongoDB checks types strictly. 

If your backend code queries `{ verified: true }` (boolean), it will return zero rows because `"true"` (string) does not match the boolean type. 

Furthermore, strings consume more disk space than a single-byte BSON boolean.

**Fix: Parse incoming text strings or numbers to real booleans at your application server controller layer before saving them to the database:**

```javascript
// Express/Node.js parser template
const isVerified = (req.body.verified === 'true' || req.body.verified === true);
db.users.insertOne({ verified: isVerified }); // Safely stores a real Boolean
```

---



### Mistake 2: Quoting Booleans as String Literals in Filter Queries

**The mistake:** Querying `db.users.find({ active: "true" })`.

**Why it's wrong:** Quoted `"true"` is a string! Unquoted `true` is a boolean primitive. String `"true"` does not equal boolean `true`.

*Incorrect:*
```javascript
db.users.find({ active: "true" }); // ❌ String "true" is not equal to boolean true!
```

*Fix:*
```javascript
db.users.find({ active: true }); // Unquoted boolean primitive
```

### Mistake 3: Expecting Truthiness Coercion on Non-Boolean Values in Filter Conditions

**The mistake:** Querying `{ active: 1 }` expecting boolean type coercion.

**Why it's wrong:** MongoDB performs strict BSON type matching. A field containing number `1` will not match `{ active: true }`.

*Incorrect:*
```javascript
// When field stores number 1:
db.users.find({ active: true }); // ❌ Number 1 is not equal to boolean true!
```

*Fix:*
```javascript
db.users.find({ $or: [{ active: true }, { active: 1 }] });
```

## 5. Practice Exercises

### Exercise 1: Status Flag Filtering with Booleans

**Scenario:**
Query collection `users` for active user accounts where `isActive: true` and `isVerified: true`.

**Requirements:**
1. Combine boolean equality filters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   isActive: true,
>   isVerified: true
> });
> ```
>
> #### Technical Explanation
>
> 1. Boolean BSON values consume a single byte of storage per document.
> 2. Fast binary equality evaluation in query filters.
> 3. Indexing boolean fields produces low cardinality indexes; combine in compound indexes.

---

### Exercise 2: Toggling Boolean Flags Atomically

**Scenario:**
Toggle a user's `isMuted` boolean setting to `true` using `$set`.

**Requirements:**
1. Execute `updateOne()` with `$set: { isMuted: true }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { isMuted: true } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$set` modifies boolean field values atomically.
> 2. Replaces whole-document updates with targeted field mutation.
> 3. Fires changefeed events with updated boolean state.

---

### Exercise 3: Querying Missing vs False Boolean Fields

**Scenario:**
Query documents where `isArchived` is either `false` OR the field does not exist on the document.

**Requirements:**
1. Combine `$or`, `{ isArchived: false }`, and `{ isArchived: { $exists: false } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.documents.find({
>   $or: [
>     { isArchived: false },
>     { isArchived: { $exists: false } }
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. In MongoDB's flexible schema, a missing field is conceptually distinct from `false`.
> 2. `$exists: false` checks for field absence.
> 3. Ensures legacy documents without the flag are included in query results.

---



## 6. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.

---

## 7. Key Takeaways
- BSON Boolean represents binary logic values: `true` or `false`.
- Identical in concept to PostgreSQL's `BOOLEAN` column type.
- Highly optimized, consuming only 1 byte of disk storage.
- MongoDB queries enforce strict type matching: boolean `true` does not match `"true"`.
- Avoid storing states as `"true"` strings or `1` integers.
- Convert input strings to true booleans inside application controllers.
