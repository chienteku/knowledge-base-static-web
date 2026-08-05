# Querying Embedded Documents

> **Level 4 — Advanced Querying**
> The techniques and query strategies used to filter collections based on nested values, comparing the fragile exact subdocument matching pattern with the robust dot notation field matching standard.

---

## 1. Prerequisites

- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The nested structures queried.
- [Dot Notation](dot_notation.md) — The path syntax used to target nested fields.

---

## 2. Term Category
- **Database Command / Query Syntax**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated by the query planner. Exact matches check binary BSON byte-stream equality; dot notation evaluates individual field-value matches).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `embedded_document.md`, document databases allow nesting objects. 

When querying this nested data, developers have two options:
1.  **Exact Subdocument Matching:** Matching the entire subdocument as a single unit.
2.  **Dot Notation Matching:** Querying individual nested keys.

We need to compare these strategies because **exact subdocument matching is extremely fragile.** 

If you query `{ address: { city: "Paris", zip: "75" } }`, MongoDB requires an exact byte-for-byte BSON match:
-   If the document contains a `street` field, it fails.
-   If the document has the keys reversed on disk: `{ zip: "75", city: "Paris" }`, it fails.

To prevent these key-ordering and field-count bugs, developers use **Dot Notation matching**, which queries the nested values regardless of field order or extra attributes.

---

### (2) The Two Query Strategies Contrast

#### Strategy A: Exact Subdocument Match (Fragile)
```javascript
db.users.find({ address: { city: "London", zip: "EC1" } })
```
-   *Rule:* The match fails if the document contains extra fields (like `street`) or if the keys are written in a different order on disk.

#### Strategy B: Dot Notation Field Match (Robust)
```javascript
db.users.find({ "address.city": "London", "address.zip": "EC1" })
```
-   *Rule:* Matches regardless of key ordering or other fields.

---

### (3) Reality Metaphor (ID Verifications)
Imagine verifying a traveler's identity:
-   **Exact Match:** The customs guard compares the traveler to a **Printed Photograph**. 
    -   The traveler must look in the exact same direction, have the same haircut, and wear the same shirt. 
    -   If they have grown a mustache or wear a hat, they are rejected.
-   **Dot Notation Match:** The guard checks specific lines on their **Passport**: 
    -   *"Is the birth year 1990? Yes. Is the eye color blue? Yes."* 
    -   The guard completely ignores their haircut or shirt color.

---

### (4) Code Examples

#### Exact Match Failure vs. Dot Notation Success
Let's see query behaviors on this document:

```javascript
db.contacts.insertOne({
  name: "Bob",
  info: { phone: "555-12", email: "bob@mail.com" }
});

// 1. Exact Match: FAILS! (Missing email in the query)
db.contacts.find({ info: { phone: "555-12" } });

// 2. Exact Match: FAILS! (Key ordering is reversed compared to disk)
db.contacts.find({ info: { email: "bob@mail.com", phone: "555-12" } });

// 3. Dot Notation Match: SUCCESS! (Ignores ordering and extra fields)
db.contacts.find({ "info.phone": "555-12" });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on exact subdocument queries in application drivers where object key order is not guaranteed

**The mistake:** Writing an exact subdocument query like `{ address: { city: "Berlin", code: 10 } }` in Node.js, assuming JavaScript object keys are compiled in the same sequence as BSON.

**Why it's wrong:** JavaScript engines and JSON parsers do not guarantee object key order. 

If your driver re-orders the keys to `{ code: 10, city: "Berlin" }` during network serialization, the exact match query will fail to find the document, creating hard-to-debug database bugs.

**Fix: Avoid exact subdocument queries. Always use Dot Notation (`"address.city"`) to filter nested fields.**

---



### Mistake 2: Using Exact Sub-Document Equality Queries Sensitive to Field Key Order

**The mistake:** Querying `db.users.find({ address: { city: "NY", zip: "10001" } })`.

**Why it's wrong:** Exact sub-document equality queries require exact field key ordering match. If document has `{ zip: "10001", city: "NY" }`, exact query returns nothing. Use dot-notation `"address.city": "NY"`.

*Incorrect:*
```javascript
db.users.find({ address: { city: "NY", zip: "10001" } }); // ❌ Key order sensitive!
```

*Fix:*
```javascript
db.users.find({ "address.city": "NY", "address.zip": "10001" }); // Order-independent dot notation
```

### Mistake 3: Overwriting Sub-Documents During Updates Without Dot-Notation

**The mistake:** Updating `{ $set: { address: { city: "Boston" } } }`.

**Why it's wrong:** Setting the parent `address` object overwrites all existing sibling fields (`zip`, `street`). Use dot-notation `{ $set: { "address.city": "Boston" } }`.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $set: { address: { city: "Boston" } } }); // ❌ Overwrites address sub-doc!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { "address.city": "Boston" } });
```

## 6. Practice Exercises

### Exercise 1: Robust Query Refactor

**Problem:** The following query is fragile and fails if the document contains a `street` field or different key ordering:
`db.companies.find({ location: { city: "New York", state: "NY" } });`
Refactor this query using dot notation to make it robust.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.companies.find({ "location.city": "New York", "location.state": "NY" });
> ```
> - Split the nested document keys into separate dot-notation paths.
> - Wrap the paths in string quotes (`""`).
> - Combine the fields inside a single match filter object.

---



### Exercise 2: Querying Embedded Fields with Dot-Notation

**Problem:** Query users where embedded `specs.ram` is greater than or equal to `16`.

**Expected output:**
> [!check]- Answer
> ```text
> db.devices.find({ "specs.ram": { $gte: 16 } });
> ```
> ```javascript
> db.devices.find({ "specs.ram": { $gte: 16 } });
> ```
>
> **Explanation:** Dot-notation `"specs.ram"` queries fields inside embedded sub-documents.

---

### Exercise 3: Updating Embedded Sub-Document Field

**Problem:** Update `profile.avatar` URL for `user:1` using dot-notation `$set`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.updateOne({ _id: 1 }, { $set: { "profile.avatar": "http://img.png" } });
> ```
> ```javascript
> db.users.updateOne({
>   _id: 1
> }, {
>   $set: { "profile.avatar": "http://img.png" }
> });
> ```
>
> **Explanation:** Dot-notation updates specific sub-document fields preserving other properties.

## 7. Related Terms

- [Dot Notation](dot_notation.md) — The path syntax.
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The data structure.

---

## 8. Key Takeaways
- Querying subdocuments can be done via exact match or dot notation paths.
- Exact subdocument matching requires byte-perfect order and field matches.
- JavaScript key re-ordering causes exact subdocument queries to fail randomly.
- Dot Notation filters nested fields regardless of key order or extra attributes.
- Default to Dot Notation (`"parent.child"`) for all nested query logic.
- Dot notation queries utilize indexes constructed on nested fields.
- Wrap dot-notation keys in string quotes to prevent JS syntax crashes.
