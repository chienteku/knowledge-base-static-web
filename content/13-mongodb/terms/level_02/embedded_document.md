# Embedded Document (Subdocument)

> **Level 2 — BSON Data Types & Document Structure**
> A complete BSON document nested inside another document as a field value, enabling one-to-one or bounded relationships without requiring relational table joins.

---

## 1. Prerequisites

- [Document](../level_01/document.md) — The parent container.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The structure of variable documents.

---

## 2. Term Category

**Data Modeling** (Nested Subdocument Structure): An Embedded Document is a nested BSON object stored directly inside a parent document field, representing 1-to-1 or bounded 1-to-many relationships without relational JOINs.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (The core modeling pattern of document databases. Stored physically adjacent to the parent data in the same disk block, optimizing read performance).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Updating Fields Inside Embedded Documents

**Scenario:**
Update the `zip` code inside a user's embedded `address` subdocument (`address: { city, state, zip }`).

**Requirements:**
1. Use dot-notation `"address.zip"` with `$set`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { "address.zip": "78701" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`"address.zip"`) targets subdocument properties directly.
> 2. Updates only the specified subfield without replacing the entire `address` object.
> 3. Atomic single-document write operation.

---

### Exercise 2: Projecting Specific Embedded Subfields

**Scenario:**
Query user documents but return ONLY the embedded `address.city` and `name` fields.

**Requirements:**
1. Projection filter `{ name: 1, "address.city": 1 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find(
>   { status: "active" },
>   { name: 1, "address.city": 1, _id: 0 }
> );
> ```
>
> #### Technical Explanation
>
> 1. Subfield projection (`"address.city": 1`) extracts targeted subdocument keys.
> 2. Reduces network payload size by omitting unneeded subdocument properties.
> 3. BSON binary reader skips unprojected subfields during scan.

---

### Exercise 3: Indexing Embedded Document Subfields

**Scenario:**
Create a single-field secondary index on embedded field `address.state` to speed up location queries.

**Requirements:**
1. Execute `createIndex({ "address.state": 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex({ "address.state": 1 });
> ```
>
> #### Technical Explanation
>
> 1. Secondary indexes can be created on subdocument dot-notation paths (`"address.state"`).
> 2. B-tree index indexes nested string values directly.
> 3. Converts $O(N)$ collection scans into fast $O(\log N)$ index lookups.

---



## 6. Related Terms

- [Array](array_type.md) — Ordered lists of embedded documents.
- [`ObjectId` as a Manual Reference](objectid_reference.md) — The reference alternative.
- [Dot Notation](../level_04/dot_notation.md) — Related concept: Dot Notation.
- [Querying Embedded Documents](../level_04/querying_embedded.md) — Related concept: Querying Embedded Documents.
- [One-to-One Relationship (Embedding)](../level_05/one_to_one.md) — Related concept: One-to-One Relationship (Embedding).

---

## 7. Key Takeaways
- Embedded Documents nest objects inside parent fields.
- Eliminates the need for relational joins, speeding up database reads.
- Stored physically in the same sector on disk for localized read speeds.
- Access nested values in queries using case-sensitive **Dot Notation**.
- Dot notation keys must be wrapped in quotation marks (e.g. `"address.zip"`).
- **Design Rule:** Keep nested data bounded; never embed arrays that grow infinitely.
- Use referencing structures instead of embedding for unbounded datasets.
