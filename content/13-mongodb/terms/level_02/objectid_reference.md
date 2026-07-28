# `ObjectId` as a Manual Reference

> **Level 2 — BSON Data Types & Document Structure**
> The data modeling practice of storing another document's `ObjectId` as a field value to create relationships between collections, serving as the document equivalent of a PostgreSQL foreign key but without database-enforced referential integrity.

---

## 1. Prerequisites
- [`_id` Field & ObjectId](../level_01/objectid.md) — The unique identifier data type.
- [Embedded Document (Subdocument)](embedded_document.md) — The nested alternative.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually across all document databases. Executed as standard field value lookups. Resolves relations in queries using `$lookup` joins).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `embedded_document.md`, nesting child data inside a parent document is MongoDB's default design pattern because it makes reads fast.

However, embedding is not appropriate for all data models:
1.  **Unbounded Growth:** If a user generates millions of log files, embedding them inside a single user document will exceed the 16MB document size limit.
2.  **Shared Resources (Many-to-Many):** Suppose multiple `products` are supplied by a single `supplier`. If you embed the supplier's address inside *every* product document:
    -   Data is duplicated.
    -   If the supplier moves to a new warehouse, your application must update thousands of product documents, risking data inconsistency.

To solve this duplication and size limits, we use **Manual References**. 

We store the supplier data in its own separate `suppliers` collection. 

Inside the `products` document, we write a field containing the supplier's `_id` (ObjectId).

---

### (2) Critical Conceptual Shift: No Referential Integrity
In PostgreSQL, if you declare a foreign key:
`post_id INT REFERENCES posts(id)`

The database engine enforces safety:
-   You cannot insert a comment pointing to a `post_id` that doesn't exist.
-   If you delete a post, the database blocks it, or runs cascading deletes.

**MongoDB does not enforce referential integrity at the database layer.** 

An ObjectId reference is stored as a plain, passive value:
-   You can write any random hex string as a reference ID; MongoDB will accept it.
-   If you delete a supplier, MongoDB will **not** check if products still reference it, leaving orphaned "dangling" references.
-   **Data integrity checks must be managed in your application code.**

---

### (3) Reality Metaphor (Coat Check Tickets)
-   **Embedding:** Sewing your heavy winter coat directly onto your shirt. You don't need to look for it, but carrying it all day is exhausting and bloats your physical space.
-   **Manual Reference ID:** Handing the coat to a receptionist. The receptionist hands you a plastic **Coat Check Ticket Stub** (the ObjectId reference) and hangs the coat on Hook 45 (a separate collection document). 
    -   The ticket stub is a tiny reference to the heavy coat. 
    -   If you lose the ticket stub, the coat is lost in storage. 
    -   If the receptionist throws away the coat, your ticket stub is now a "dangling" reference pointing to an empty hook.

---

### (4) Code Examples

#### Referencing Collections (Products and Suppliers)
First, create the supplier document:

```javascript
db.suppliers.insertOne({
  _id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"),
  name: "Global Parts Corp",
  country: "US"
});
```

Next, link the product to the supplier by referencing its `_id`:

```javascript
db.products.insertOne({
  name: "Heavy Hammer",
  price: NumberDecimal("19.99"),
  supplier_id: ObjectId("60c72b2f9b1d8b2e88a8d1a1") // Manual reference link!
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on the database to throw an error if you delete a referenced document

**The mistake:** Deleting a document from a `categories` collection without updating the `products` table, assuming MongoDB will block the delete if products still reference that category.

**Why it's wrong:** MongoDB does not check relationships on deletes. 

It will delete the category instantly. 

Your application's product pages will now crash with `null pointer` or `undefined` errors because their `category_id` references point to a non-existent category.

**Fix: Write transaction rules or check loops inside your backend application server codebase to clean up references (e.g. running a query to delete all linked products, or setting their references to `null`) before deleting parent documents.**

---



### Mistake 2: Storing Foreign Key References as Plain Strings Instead of BSON `ObjectId`

**The mistake:** Storing `userId: "60d5ecb8b5c9c22b9c8b4567"` as a string in child documents.

**Why it's wrong:** Plain string references occupy 24 bytes of text storage, whereas native BSON `ObjectId` occupies only 12 bytes. Mixing string and ObjectId references breaks `$lookup` joins.

*Incorrect:*
```javascript
db.orders.insertOne({ userId: "60d5ecb8b5c9c22b9c8b4567" }); // ❌ String foreign reference!
```

*Fix:*
```javascript
db.orders.insertOne({ userId: new ObjectId("60d5ecb8b5c9c22b9c8b4567") }); // BSON ObjectId
```

### Mistake 3: Executing `$lookup` Joins Between Mismatched Foreign Key Types (String vs ObjectId)

**The mistake:** Executing `$lookup` joining `orders.userId` (string) with `users._id` (ObjectId).

**Why it's wrong:** `$lookup` performs strict BSON type matching. String `"60d5..."` does NOT match `ObjectId("60d5...")`, returning empty joined arrays.

*Incorrect:*
```javascript
// When orders.userId is string and users._id is ObjectId:
db.orders.aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }]); // Returns empty user array!
```

*Fix:*
```javascript
Ensure foreign key field types match primary key _id types (both ObjectId)
```

## 6. Practice Exercises

### Exercise 1: Reference Schema Design

**Problem:** You are designing a library database with `books` and `authors`. 
-   An author can write many books.
-   A book can have hundreds of pages of text.
1.  Explain why you should not embed the book chapters text inside the author's document.
2.  Write a sample MongoDB document structure for a book that references its author.

**Expected output:**
> [!check]- Answer
> ```text
> 1. You should not embed book chapters inside the author's document because books can grow extremely large. If an author writes multiple books containing hundreds of pages, the author's document will quickly exceed the 16MB size limit and crash the database.
> ```
> - Evaluate the size risks of storing long text contents.
> - Store the unique identifier of the author in a dedicated field inside the book.

---



### Exercise 2: Referencing Parent ObjectId in Child Document

**Problem:** Insert order document storing parent user `_id` as BSON `ObjectId` reference `userId`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.insertOne({ userId: new ObjectId("60d5ecb8b5c9c22b9c8b4567"), total: 99.95 });
> ```
> ```javascript
> db.orders.insertOne({
>   userId: new ObjectId("60d5ecb8b5c9c22b9c8b4567"),
>   total: 99.95
> });
> ```
>
> **Explanation:** Storing parent `_id` values as BSON `ObjectId` enables fast `$lookup` aggregation joins.

---

### Exercise 3: DBRef vs Manual ObjectId Reference

**Problem:** What is the idiomatic MongoDB schema practice for referencing foreign documents? (Manual ObjectId references).

**Expected output:**
> [!check]- Answer
> ```text
> Manual ObjectId references (storing parent _id directly in child field)
> ```
> ```text
> Manual ObjectId references (storing parent _id directly in child field)
> ```
>
> **Explanation:** Manual ObjectId references are lightweight and supported natively by `$lookup`.

## 7. Related Terms
- [`_id` Field & ObjectId](../level_01/objectid.md) — The reference key type.
- [Embedded Document (Subdocument)](embedded_document.md) — The nested alternative.

---

## 8. Key Takeaways
- Manual Referencing stores another document's `_id` as a reference link.
- Serves as the document database equivalent of a SQL foreign key.
- Used to handle unbounded lists and prevent many-to-many data duplication.
- MongoDB does **not** enforce referential integrity or foreign key constraints.
- Deleting referenced documents can leave dangling references pointing to nothing.
- Ensure reference checks are managed inside your application code layers.
