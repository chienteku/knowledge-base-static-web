# Boolean

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to store logical truth values (`true` or `false`), serving as the direct equivalent of PostgreSQL's `BOOLEAN` type.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type system.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **Universal Standard** (Booleans are represented natively in JavaScript, JSON, and BSON. Consumes exactly 1 byte in the serialized BSON binary stream).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Boolean Toggle Filter

**Problem:** You have a `products` collection. You want to select all products where:
-   The `in_stock` field is BSON Boolean `true`.
-   The `on_sale` field is BSON Boolean `false`.
Write the MongoDB query.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.products.find({ in_stock: true, on_sale: false });
> ```
> - Combine query filters inside a single document object separated by commas.
> - Use unquoted `true` and `false` literals in JavaScript.

---



### Exercise 2: Querying Boolean Fields

**Problem:** Query all documents in `users` collection where `verified` is `false`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ verified: false });
> ```
> ```javascript
> db.users.find({ verified: false });
> ```
>
> **Explanation:** Passing boolean `false` matches documents with boolean false fields.

---

### Exercise 3: Filtering Missing vs False Booleans

**Problem:** Query users where `isBan` is either `false` or field does not exist (`$exists: false`).

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ $or: [{ isBan: false }, { isBan: { $exists: false } }] });
> ```
> ```javascript
> db.users.find({ $or: [{ isBan: false }, { isBan: { $exists: false } }] });
> ```
>
> **Explanation:** Combining boolean matching with `$exists` handles un-initialized fields.

## 7. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.

---

## 8. Key Takeaways
- BSON Boolean represents binary logic values: `true` or `false`.
- Identical in concept to PostgreSQL's `BOOLEAN` column type.
- Highly optimized, consuming only 1 byte of disk storage.
- MongoDB queries enforce strict type matching: boolean `true` does not match `"true"`.
- Avoid storing states as `"true"` strings or `1` integers.
- Convert input strings to true booleans inside application controllers.
