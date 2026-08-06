# Embedding vs. Referencing

> **Level 5 — Data Modeling & Schema Design**
> The fundamental schema design decision in MongoDB: whether to nest related data directly within a single document (Embedding / Denormalization) or store links to separate collections using IDs (Referencing / Normalization).

---

## 1. Prerequisites

- [Schema Design (Document Modeling)](schema_design.md) — Schema design fundamentals.
- [`ObjectId` as a Manual Reference](../level_02/objectid_reference.md) — The referencing implementation.

---

## 2. Term Category

**Data Modeling** (Fundamental Relationship Trade-off): Embedding vs Referencing is the central decision in MongoDB schema design, balancing single-document read speed (embedding) against unbounded array growth scaling (referencing).



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Core modeling choice across all document databases. Drives physical storage allocation, network sizes, and index performance).

### (1) Design Motivation — "Why did we design this?"
In MongoDB, you don't have SQL foreign key constraints to dictate how tables connect. 

For every relationship (e.g., users to addresses, products to reviews, authors to books), you must choose one of two paths:
1.  **Embedding (Subdocuments / Arrays):** Storing child data inside the parent document file.
2.  **Referencing (ID Links):** Storing child data in a separate collection, saving only the `_id` of the related document.

Choosing incorrectly will degrade database performance:
-   If you reference everything, your app runs slow joins.
-   If you embed everything, your documents will hit size limits and crash.

---

### (2) Comparative Decision Framework

#### 1. Embedding (Denormalization)
-   *Pros:* Extremely fast reads (fetches parent and child in 1 query). Writes are atomic.
-   *Cons:* Document bloat (slow disk updates if documents grow). Capped by the **16MB** document size limit.
-   **When to use:** 
    -   One-to-One relationships.
    -   One-to-Many relationships where the "many" is **bounded and small** (e.g. less than 100 subdocuments, like a user's shipping addresses).
    -   When child data is rarely updated, and is always read alongside the parent.

#### 2. Referencing (Normalization)
-   *Pros:* Prevents data duplication. Handles **unbounded growth** (e.g. millions of logs). Keeps parent documents small and fast.
-   *Cons:* Requires multiple queries or `$lookup` joins (slower reads). No native database referential integrity.
-   **When to use:**
    -   Many-to-Many relationships.
    -   One-to-Many relationships where the "many" is **unbounded** (e.g. an account's transaction history).
    -   When child data is frequently updated, or needs to be queried independently.

---

### (3) Reality Metaphor (Passports and Flight Tickets)
-   **Embedding:** Stamping your flight ticket details directly onto a page inside your physical **Passport Booklet**. 
    -   *Read speed:* Very fast. The customs officer reads your identity and flight details together in one look. 
    -   *Constraint:* You will quickly run out of blank passport pages (16MB limit) if you fly every week.
-   **Referencing:** Handing the officer your passport and a separate **Paper Flight Ticket** (the ID link). 
    -   *Read speed:* Slower. The officer must cross-reference two separate sheets. 
    -   *Flexibility:* You can fly millions of times without bloating your passport booklet.

---

### (4) Code Examples

#### Embedding (Bounded One-to-Few)
A user's emergency contacts list. A user rarely has more than 5 contacts:

```javascript
// Collection: users
{
  _id: 10,
  username: "alice_dev",
  contacts: [ // Embedded Array: fast, safe, and bounded
    { name: "Bob", relationship: "spouse", phone: "555-12" },
    { name: "Jane", relationship: "parent", phone: "555-99" }
  ]
}
```

#### Referencing (Unbounded One-to-Many)
A sensor device reporting climate log metrics. A device logs metrics every 5 seconds, resulting in millions of entries:

```javascript
// Collection: devices
{ _id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"), model: "TempSensor-V2" }

// Collection: climate_logs
{
  _id: ObjectId("65fc71239b1d8b2e88a8d000"),
  device_id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"), // Referencing ID
  temperature: 22.4,
  recorded_at: new Date()
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Embedding unbounded, rapidly growing arrays inside parent documents

**The mistake:** Storing a customer's purchase transaction history array directly inside the `users` document: `{ username: "Bob", transactions: [ {amount: 10, date: ...}, ... ] }`.

**Why it's wrong:** Bob is an active user who buys items daily. 

Over a year, his transaction array grows to thousands of items. 

The user document bloats, slowing down basic login queries (since the database must read Bob's entire history just to check his password). 

Eventually, the array hits the 16MB document size limit, causing database write crashes.

**Fix: Separate the transaction records into their own `transactions` collection. Store the user's `_id` inside each transaction document as a reference link.**

---



### Mistake 2: Embedding Unbounded Datasets (1-to-Many Unbounded Anti-Pattern)

**The mistake:** Embedding thousands of customer orders inside a single `customer.orders` document array.

**Why it's wrong:** Embedding unbounded data causes document size bloat and exceeds the 16MB limit. Reference unbounded child documents by storing `customerId` in child `orders` collection.

*Incorrect:*
```javascript
{ name: "Customer", orders: [ { order1 }, { order2 }, ... 50,000 items ] } // ❌ Unbounded embedding!
```

*Fix:*
```javascript
Store orders in separate collection: db.orders.insertOne({ customerId: id, ...orderData });
```

### Mistake 3: Referencing Small 1-to-1 Data That Is Always Read Together

**The mistake:** Splitting user `profile` and user `address` into 2 separate collections with foreign key references.

**Why it's wrong:** Splitting 1-to-1 data that is always queried together forces unnecessary `$lookup` joins or separate roundtrip queries. Embed 1-to-1 sub-documents.

*Incorrect:*
```javascript
// Splitting profile and address into 2 separate collections
```

*Fix:*
```javascript
Embed address sub-document directly inside user profile document
```

## 5. Practice Exercises

### Exercise 1: Decision Matrix for Embedding vs Referencing

**Scenario:**
Formulate a schema design decision matrix evaluating when to embed vs when to reference based on relationship cardinality and query access patterns.

**Requirements:**
1. Evaluate 1-to-1, bounded 1-to-many, and unbounded 1-to-many relationships.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Relationship Cardinality & Modeling Decision Matrix:
> - 1-to-1 (e.g. User Profile): EMBED in single document.
> - Bounded 1-to-Many (<100 items, e.g. Order Items): EMBED array in document.
> - Unbounded 1-to-Many (>1000 items, e.g. Log Events): REFERENCE across separate collections.
> - Many-to-Many (e.g. Students & Courses): REFERENCE array of ObjectIds.
> ```
>
> #### Technical Explanation
>
> 1. Embedding provides maximum read performance by fetching related data in a single $O(1)$ read.
> 2. Referencing prevents 16MB document size limit breaches and avoids document movement on disk.
> 3. Schema design should be driven primarily by application query access patterns.
> 
---

### Exercise 2: Modeling Bounded 1-to-Many Relationships with Embedding

**Scenario:**
Model a customer `order` document embedding an array of up to 10 `orderItems`.

**Requirements:**
1. Embed `orderItems` array inside `orders` document.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.insertOne({
>   _id: new ObjectId(),
>   customerName: "Alice",
>   items: [
>     { productId: new ObjectId(), name: "Book", price: 15.00, qty: 2 },
>     { productId: new ObjectId(), name: "Pen", price: 2.50, qty: 5 }
>   ],
>   total: 42.50,
>   createdAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. Bounded 1-to-many items (e.g. items in a single shopping cart) are ideal for embedding.
> 2. Order details and items are written and read together atomically.
> 3. Eliminates multi-table joins.
> 
---

### Exercise 3: Modeling Unbounded 1-to-Many Relationships with Referencing

**Scenario:**
Model a `sensor` entity generating millions of telemetry `readings` over time using referencing.

**Requirements:**
1. Store `sensorId` reference in `readings` collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.readings.insertOne({
>   sensorId: new ObjectId("60c72b2f9b1d8b2c88888880"),
>   temp: 23.5,
>   humidity: 45.2,
>   timestamp: new Date()
> });
> 
> db.readings.createIndex({ sensorId: 1, timestamp: -1 });
> ```
>
> #### Technical Explanation
>
> 1. Unbounded relationships (millions of child items) MUST use referencing.
> 2. Prevents child arrays from bloating parent documents past 16MB.
> 3. Index on `{ sensorId: 1, timestamp: -1 }` ensures fast query pagination.
> 
---



## 6. Related Terms

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The size constraint.
- [Anti-Patterns in Schema Design](anti_patterns.md) — Related concept: Anti-Patterns in Schema Design.
- [The Extended Reference Pattern](extended_reference_pattern.md) — Related concept: The Extended Reference Pattern.
- [Many-to-Many Relationship](many_to_many.md) — Related concept: Many-to-Many Relationship.
- [One-to-Many Relationship (Embedding vs. Referencing)](one_to_many.md) — Related concept: One-to-Many Relationship (Embedding vs. Referencing).
- [One-to-One Relationship (Embedding)](one_to_one.md) — Related concept: One-to-One Relationship (Embedding).
- [The Subset Pattern](subset_pattern.md) — Related concept: The Subset Pattern.
- [`$lookup` Stage](../level_06/lookup_stage.md) — Related concept: `$lookup` Stage.

---

## 7. Key Takeaways
- Embedding nests data directly; Referencing links data via IDs.
- Embedding optimizes read speeds by fetching related data in one lookup.
- Referencing handles unbounded growth and prevents data duplication.
- Rule of Thumb: Use embedding for bounded 1:1 and 1:Few relations.
- Rule of Thumb: Use referencing for unbounded 1:N and Many-to-Many relations.
- Never embed arrays that grow without limits (e.g. system logs or histories).
- Relational joins (`$lookup`) are slow; use them sparingly.
