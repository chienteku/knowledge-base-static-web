# `ObjectId` as a Manual Reference

> **Level 2 — BSON Data Types & Document Structure**
> The data modeling practice of storing another document's `ObjectId` as a field value to create relationships between collections, serving as the document equivalent of a PostgreSQL foreign key but without database-enforced referential integrity.

---

## 1. Prerequisites

- [`_id` Field & ObjectId](../level_01/objectid.md) — The unique identifier data type.
- [Embedded Document (Subdocument)](embedded_document.md) — The nested alternative.

---

## 2. Term Category

**Data Modeling** (Foreign Key Link Structure): An ObjectId Reference models relational associations between collections by storing foreign document `_id` ObjectIds inside referencing documents.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported conceptually across all document databases. Executed as standard field value lookups. Resolves relations in queries using `$lookup` joins).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Modeling 1-to-Many Relationships with Foreign ObjectIds

**Scenario:**
Create an order document in collection `orders` storing a foreign reference pointer `customerId` pointing to `users._id`.

**Requirements:**
1. Store foreign `customerId: new ObjectId("60c72b2f9b1d8b2c88888880")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const customerId = new ObjectId("60c72b2f9b1d8b2c88888880");
> 
> db.orders.insertOne({
>   customerId: customerId,
>   totalAmount: 149.99,
>   status: "pending",
>   createdAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. Foreign ObjectId references model relational links across collections.
> 2. Avoids duplicating entire user document data inside every order.
> 3. Standard pattern for unbounded 1-to-many relationships.

---

### Exercise 2: Resolving Referenced Documents with `$lookup`

**Scenario:**
Execute an aggregation pipeline joining `orders` with `users` on foreign key `customerId` = `users._id`.

**Requirements:**
1. Use `$lookup` pipeline stage.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $lookup: {
>       from: "users",
>       localField: "customerId",
>       foreignField: "_id",
>       as: "customerDetails"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$lookup` performs left-outer equality joins across collection references.
> 2. `from` specifies the foreign target collection; `as` specifies output array name.
> 3. Requires secondary index on `localField` and `foreignField` for fast join performance.

---

### Exercise 3: Indexing Foreign Key Reference Fields

**Scenario:**
Create a secondary index on `customerId` in collection `orders` to optimize `$lookup` and customer order history queries.

**Requirements:**
1. Execute `db.orders.createIndex({ customerId: 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.createIndex({ customerId: 1 });
> ```
>
> #### Technical Explanation
>
> 1. Secondary index `{ customerId: 1 }` converts foreign key lookups from $O(N)$ scans to $O(\log N)$ lookups.
> 2. Essential for maintaining fast `$lookup` aggregation join speeds.
> 3. Accelerates query filters like `db.orders.find({ customerId: ... })`.

---



## 6. Related Terms

- [`_id` Field & ObjectId](../level_01/objectid.md) — The reference key type.
- [Embedded Document (Subdocument)](embedded_document.md) — The nested alternative.
- [Array](array_type.md) — Related concept: Array.

---

## 7. Key Takeaways
- Manual Referencing stores another document's `_id` as a reference link.
- Serves as the document database equivalent of a SQL foreign key.
- Used to handle unbounded lists and prevent many-to-many data duplication.
- MongoDB does **not** enforce referential integrity or foreign key constraints.
- Deleting referenced documents can leave dangling references pointing to nothing.
- Ensure reference checks are managed inside your application code layers.
