# Embedding vs. Referencing

> **Level 5 — Data Modeling & Schema Design**
> The fundamental schema design decision in MongoDB: whether to nest related data directly within a single document (Embedding / Denormalization) or store links to separate collections using IDs (Referencing / Normalization).

---

## 1. Prerequisites
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling paradigm.
- [ObjectId Manual Reference](../../level_02/objectid_reference.md) — The referencing implementation.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Core modeling choice across all document databases. Drives physical storage allocation, network sizes, and index performance).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Modeling Selector Strategy

**Problem:** You are modeling a school system with `students` and `classes`. A class has up to 30 students. A student can enroll in up to 6 classes.
1.  Explain why you should not embed the full student records inside the class document.
2.  State the correct modeling strategy (Embedding or Referencing) for this relationship.

**Expected output:**
```text
1. You should not embed full student records inside the class document because a single student can enroll in multiple classes. If you embed them, the student's name, email, and grades are duplicated across multiple class documents. If a student changes their email, the application must run updates across all their enrolled classes, risking data inconsistency. Furthermore, embedding large student arrays could cause the class document to bloat.
2. Referencing: Store students and classes in separate collections, and link them using arrays of ObjectIds (Many-to-Many referencing).
```

> [!check]- Answer
> - Assess the duplication risks of many-to-many structures.
> - Consider data consistency constraints during updates.

---



### Exercise 2: Embedding vs Referencing Decision Rule

**Problem:** State rule: 1. Embed (1-to-Few, data read together), 2. Reference (1-to-Many unbounded, data updated/accessed independently).

**Expected output:**
```text
Embed 1-to-Few co-located data; Reference 1-to-Many unbounded or independently updated data
```

> [!check]- Answer
> ```text
> Embed 1-to-Few co-located data; Reference 1-to-Many unbounded or independently updated data
> ```
>
> **Explanation:** Schema design balances read latency (embedding) against document size limits (referencing).

### Exercise 3: Modeling E-Commerce Shopping Cart

**Problem:** Should active shopping cart items be embedded or referenced in a user document? (Embedded).

**Expected output:**
```text
Embedded (small, bounded, read and updated together with cart state)
```

> [!check]- Answer
> ```text
> Embedded (small, bounded, read and updated together with cart state)
> ```
>
> **Explanation:** Active shopping cart items are bounded and queried together as a single unit.

## 7. Related Terms
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The size constraint.

---

## 8. Key Takeaways
- Embedding nests data directly; Referencing links data via IDs.
- Embedding optimizes read speeds by fetching related data in one lookup.
- Referencing handles unbounded growth and prevents data duplication.
- Rule of Thumb: Use embedding for bounded 1:1 and 1:Few relations.
- Rule of Thumb: Use referencing for unbounded 1:N and Many-to-Many relations.
- Never embed arrays that grow without limits (e.g. system logs or histories).
- Relational joins (`$lookup`) are slow; use them sparingly.
