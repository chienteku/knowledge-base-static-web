# One-to-Many Relationship (Embedding vs. Referencing)

> **Level 5 — Data Modeling & Schema Design**
> The modeling strategies used to represent 1:N relationships in MongoDB, categorizing them by cardinality (One-to-Few, One-to-Many, One-to-Squillions) to select between subdocument embedding or referencing models.

---

## 1. Prerequisites

- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling framework.
- [Array](../level_02/array_type.md) — Nested collection arrays.

---

## 2. Term Category

**Data Modeling** (1-to-N Relationship Patterns): One-to-Many Relationships model 1-to-N associations using embedded document arrays (for bounded N) or foreign ObjectId references (for unbounded N).



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Core architectural decision during database schema modeling. Dictates query index structures and write locks scaling).

### (1) Design Motivation — "Why did we design this?"
In relational SQL databases, a One-to-Many (1:N) relationship is always modeled the exact same way:
-   You create two tables: a parent table (`users`) and a child table (`logs`).
-   You place a foreign key column (`user_id`) in the child table.

In a document database, **the SQL foreign key model is only one of several options.** 

Because MongoDB supports arrays and nesting, you must analyze the **cardinality** (how many children can exist) and access patterns to select the correct model. 

Choosing the wrong approach will lead to database slow-downs or documents exceeding the 16MB disk space limit.

---

### (2) The Three Cardinality Categories of 1:N

#### 1. One-to-Few (Bounded Growth)
The number of child entities is small and has a clear natural cap (e.g., a user has up to 5 shipping addresses; a car has 4 tires).
-   **Strategy: Embedding.** Nest the child objects directly inside the parent document as a BSON array.
-   *Benefit:* Single-query reads; no join overhead.

#### 2. One-to-Many (Large but Bounded)
The number of children is larger, but still bounded (e.g., a book has up to 100 chapters; a product has up to 500 reviews).
-   **Strategy: Parent Referencing.** Store child data in a separate collection. Store an array of child `ObjectIds` inside the parent document.
-   *Constraint:* Only use this if you are certain the array will never exceed ~1,000 elements.

#### 3. One-to-Squillions (Unbounded Growth)
The number of children grows infinitely with no upper bound (e.g., a server generates millions of system logs; a social network user gets millions of likes).
-   **Strategy: Child Referencing (The SQL Model).** Store child data in a separate collection. Place a parent reference ID field (e.g., `server_id`) inside each child document.
-   *Benefit:* Prevents the parent document from bloating or hitting the 16MB limit, as child documents are written independently on disk.

---

### (3) Reality Metaphor (Receipt Storage)
Imagine storing store receipts:
-   **One-to-Few (Embedding):** Placing your monthly gas receipts inside your **Leather Wallet**. You only buy gas 3 times a month, so your wallet stays slim and you have your receipts on you at all times.
-   **One-to-Squillions (Child Referencing):** Storing business invoices in a **Steel Filing Cabinet** (separate collection). 
    -   On each invoice sheet, you stamp your **Customer ID** (the reference key). 
    -   Your wallet stays thin and fast to carry, while the steel cabinet can grow to hold millions of invoices.

---

### (4) Code Examples

#### 1. One-to-Few (Embedded Array)
```javascript
// Collection: users
{
  _id: 105,
  name: "Bob",
  addresses: [ // Bounded array
    { street: "123 Main St", city: "Boston", type: "home" },
    { street: "456 Office Rd", city: "New York", type: "work" }
  ]
}
```

#### 2. One-to-Squillions (Child Referencing)
```javascript
// Parent Collection: servers
{ _id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"), hostname: "web-prod-01" }

// Child Collection: logs (written independently, can scale to billions of entries)
{
  _id: ObjectId("65fc71239b1d8b2e88a8d202"),
  server_id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"), // Child reference link
  level: "error",
  message: "Connection timed out",
  created_at: new Date()
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing an array of references inside the parent document for an unbounded One-to-Squillions relationship

**The mistake:** Storing a list of log IDs inside a server document: `{ hostname: "srv-1", log_ids: [ ObjectId("..."), ... ] }`.

**Why it's wrong:** The server generates logs constantly. 

Over a month, the `log_ids` array grows to millions of entries. 

This array bloat slows down simple lookups on the server document and eventually hits the 16MB limit, causing all logging and server operations to fail.

**Fix: For unbounded growth, never store array lists inside the parent. Instead, use Child Referencing: store the `server_id` inside each log document.**

---



### Mistake 2: Embedding Unbounded 1-to-Many Collections Inside Parent Documents

**The mistake:** Embedding 100,000 sensor readings inside a single parent `device.readings` array.

**Why it's wrong:** Unbounded arrays hit the 16MB document size limit. Store child documents in a separate `readings` collection with a `deviceId` parent reference.

*Incorrect:*
```javascript
{ deviceId: 1, readings: [ ... 100,000 items ] } // ❌ Document size limit breach!
```

*Fix:*
```javascript
db.readings.insertOne({ deviceId: 1, val: 20, timestamp: new Date() });
```

### Mistake 3: Using Foreign Key References for Small Bounded 1-to-Few Arrays

**The mistake:** Creating a separate `addresses` collection for 1-to-2 user addresses.

**Why it's wrong:** For small bounded arrays (1-to-Few), embedding sub-documents directly inside the parent document eliminates `$lookup` joins and speeds up reads.

*Incorrect:*
```javascript
// Splitting 2 user addresses into separate collection
```

*Fix:*
```javascript
Embed addresses array directly inside user document: { addresses: [{ street, city }] }
```

## 5. Practice Exercises

### Exercise 1: Embedded 1-to-Many for Low-Cardinality Relationships

**Scenario:**
Model a customer document containing an array of up to 3 `shippingAddresses`.

**Requirements:**
1. Embed array of address subdocuments inside `customers`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.insertOne({
>   name: "Alice Smith",
>   email: "alice@example.com",
>   addresses: [
>     { type: "home", street: "123 Main St", city: "Austin", state: "TX" },
>     { type: "work", street: "456 Office Pkwy", city: "Austin", state: "TX" }
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. Low-cardinality 1-to-many relationships (<10 items) should be embedded directly as subdocument arrays.
> 2. Fetches customer and all addresses in a single atomic $O(1)$ read.
> 3. Eliminates foreign key join tables.

---

### Exercise 2: Referenced 1-to-Many for High-Cardinality Relationships

**Scenario:**
Model a user account that generates thousands of `activity_logs` using foreign key references.

**Requirements:**
1. Store `userId` in `activity_logs` collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.activity_logs.insertOne({
>   userId: new ObjectId("60c72b2f9b1d8b2c88888880"),
>   action: "user_login",
>   ipAddress: "192.168.1.50",
>   timestamp: new Date()
> });
> 
> db.activity_logs.createIndex({ userId: 1, timestamp: -1 });
> ```
>
> #### Technical Explanation
>
> 1. High-cardinality 1-to-many relationships (thousands of child items) MUST be stored in a separate collection.
> 2. Prevents breaching the 16MB BSON document size limit.
> 3. Compound index `{ userId: 1, timestamp: -1 }` enables fast paginated history queries.

---

### Exercise 3: Parent-Referenced 1-to-Many Arrays

**Scenario:**
Model a product catalog where a `category` document stores an array of child `productIds` (up to 100 items).

**Requirements:**
1. Store `productIds: [ObjectId(...)]` in `categories`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.categories.insertOne({
>   name: "Laptops",
>   productIds: [
>     new ObjectId("60c72b2f9b1d8b2c88888881"),
>     new ObjectId("60c72b2f9b1d8b2c88888882")
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. Storing an array of references on the parent document is suitable for bounded 1-to-many counts (10 to 500 items).
> 2. Allows quick retrieval of child product IDs without scanning the products collection.
> 3. Simple relationship navigation.

---



## 6. Related Terms

- [Embedding vs. Referencing](embedding_vs_referencing.md) — Core pattern framework.
- [Document Size Limit (16 MB)](document_size_limit.md) — The critical size ceiling.
- [Many-to-Many Relationship](many_to_many.md) — Related concept: Many-to-Many Relationship.

---

## 7. Key Takeaways
- 1:N modeling matches the relationship's growth cardinality.
- One-to-Few (bounded) uses Embedding inside a subdocument array.
- One-to-Many (bounded but large) can use Parent Referencing arrays.
- One-to-Squillions (unbounded) must use Child Referencing (the SQL model).
- Storing array lists in parents for unbounded growth triggers 16MB limit crashes.
- Child referencing allows infinite, high-speed write scales.
- Prioritize read paths when selecting your 1:N relationship schema.
