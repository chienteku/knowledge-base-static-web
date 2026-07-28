# Embedded Document (Subdocument)

> **Level 2 — BSON Data Types & Document Structure**
> A complete BSON document nested inside another document as a field value, enabling one-to-one or bounded relationships without requiring relational table joins.

---

## 1. Prerequisites
- [Document](../level_01/document.md) — The parent container.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The structure of variable documents.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (The core modeling pattern of document databases. Stored physically adjacent to the parent data in the same disk block, optimizing read performance).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, every table row must be flat. 

If you want to store a user's address (street, city, zip):
1.  You must create a separate `addresses` table.
2.  Save the values to a new row linked via a foreign key.
3.  Execute a SQL `JOIN` to query them together.

While normalized, joins consume server CPU and memory as tables grow.

We designed the **Embedded Document** (also known as a **Subdocument**) to eliminate this join overhead. 

Because MongoDB documents are JSON-like objects, a field can hold another complete document as its value. 

By nesting the address directly inside the user's document, you store the related data in the **same physical block on the hard drive.** 

When the application reads the user record, the hard drive reads the address in the same pass, saving network roundtrips and disk read latency.

---

### (2) Dot Notation (Querying Nested Fields)
To query fields located inside an embedded document, MongoDB uses **Dot Notation**:

`"parentField.nestedField"`

*Note: In MongoDB queries, any key written in dot notation **must be wrapped in quotation marks** (e.g., `"address.city"`).*

---

### (3) Reality Metaphor (Visa Stamps in a Passport)
-   **Normalized SQL:** You hold a plastic passport card. If a customs officer wants to see your entry visas, they must walk to a separate cabinet room, search for your visa ledger sheets, and stack them next to your card. (Relational Join).
-   **Embedded Document (Subdocument):** Your **Passport Booklet**. 
    -   The visa stamp pages are bound directly inside the booklet. 
    -   The officer opens the booklet and reads the visa stamps immediately. 
    -   The visas travel together with the passport wherever it goes.

---

### (4) Code Examples

#### Storing and Querying Embedded Documents
Let's store a customer containing nested company address coordinates:

```javascript
// Insert user with embedded address document
db.customers.insertOne({
  name: "Alice Smith",
  email: "alice@company.com",
  address: {                               // Embedded Document
    street: "123 Main St",
    city: "London",
    zip: "EC1A 1BB"
  }
});

// Query using Dot Notation (Note the mandatory quotes around the nested key!)
db.customers.find({ "address.city": "London" });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Embedding child data that can grow infinitely in size over time

**The mistake:** Nesting all of a customer's purchase log transactions directly inside an array of embedded documents inside their main `users` document:

```javascript
// BAD: Dangerous document design!
{
  username: "alice",
  purchases: [
    { item: "book", date: new Date() },
    // ... What if Alice makes 50,000 purchases over 5 years? ...
  ]
}
```

**Why it's wrong:** MongoDB enforces a maximum document size limit of **`16MB`**. 

If a user makes thousands of purchases, the array of embedded documents will grow until it exceeds 16MB. 

At that point, the database will reject write attempts, crashing your application. 

Additionally, updating massive documents causes heavy disk rewrite cycles.

**Fix: Only embed child data if it is bounded (e.g. a user only has 1 or 2 addresses). If the child data can grow infinitely (like purchase logs or blog comments), store them in a separate collection and use Reference IDs (which we will learn in Term #24).**

---



### Mistake 2: Using Exact Document Matching on Sub-Documents When Field Order Might Vary

**The mistake:** Querying `db.users.find({ address: { city: "NY", zip: "10001" } })`.

**Why it's wrong:** Exact sub-document matching matches ONLY if field keys and field ordering match perfectly. If `address` has `{ zip: "10001", city: "NY" }`, exact query returns nothing. Use dot-notation `"address.city": "NY"`.

*Incorrect:*
```javascript
db.users.find({ address: { city: "NY", zip: "10001" } }); // ❌ Fails if field order differs!
```

*Fix:*
```javascript
db.users.find({ "address.city": "NY", "address.zip": "10001" }); // Dot-notation is order-independent
```

### Mistake 3: Updating Sub-Documents without Dot-Notation Overwriting Entire Sub-Objects

**The mistake:** Executing `db.users.updateOne({ _id: id }, { $set: { address: { city: "Boston" } } })`.

**Why it's wrong:** Setting the entire `address` object overwrites all other existing fields inside `address` (like `zip` or `street`). Use dot-notation `{ $set: { "address.city": "Boston" } }`.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $set: { address: { city: "Boston" } } }); // ❌ Overwrites entire address object!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { "address.city": "Boston" } }); // Updates specific field
```

## 6. Practice Exercises

### Exercise 1: Nested Query Syntax

**Problem:** You have a `companies` collection. Each company document contains a nested `contact` subdocument (containing fields: `email` and `phone`). 
Write the MongoDB query to find all companies where the nested contact email is `'sales@startup.co'`.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.companies.find({ "contact.email": "sales@startup.co" });
> ```
> - Construct the key using dot notation: `contact.email`.
> - Always wrap dot-notation keys in quotes (`""`) inside the query filter.

---



### Exercise 2: Dot-Notation Sub-Document Update

**Problem:** Update `zip` code inside `address` sub-document for `user:1` using dot-notation.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.updateOne({ _id: 1 }, { $set: { "address.zip": "90210" } });
> ```
> ```javascript
> db.users.updateOne({ _id: 1 }, { $set: { "address.zip": "90210" } });
> ```
>
> **Explanation:** `"parent.child"` dot-notation updates sub-document fields without overwriting siblings.

---

### Exercise 3: Querying Deeply Embedded Fields

**Problem:** Query users where `company.location.country` equals `"Canada"`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ "company.location.country": "Canada" });
> ```
> ```javascript
> db.users.find({ "company.location.country": "Canada" });
> ```
>
> **Explanation:** Dot-notation traverses arbitrary sub-document nesting levels.

## 7. Related Terms
- [Array](array_type.md) — Ordered lists of embedded documents.
- [`ObjectId` as a Manual Reference](objectid_reference.md) — The reference alternative.

---

## 8. Key Takeaways
- Embedded Documents nest objects inside parent fields.
- Eliminates the need for relational joins, speeding up database reads.
- Stored physically in the same sector on disk for localized read speeds.
- Access nested values in queries using case-sensitive **Dot Notation**.
- Dot notation keys must be wrapped in quotation marks (e.g. `"address.zip"`).
- **Design Rule:** Keep nested data bounded; never embed arrays that grow infinitely.
- Use referencing structures instead of embedding for unbounded datasets.
