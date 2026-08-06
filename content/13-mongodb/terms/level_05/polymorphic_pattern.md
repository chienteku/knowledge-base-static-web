# The Polymorphic Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern where documents with varying fields and structures are stored in a single collection, utilizing a dedicated discriminator field (e.g. `type` or `kind`) to distinguish their logical class structures.

---

## 1. Prerequisites

- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The parent paradigm.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Querying structure differences.

---

## 2. Term Category

**Data Modeling** (Heterogeneous Document Schema Pattern): The Polymorphic Pattern stores documents with varying attributes within the same collection using a common `type` discriminator field.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported natively by the flexible document design of all NoSQL platforms. Used by ORMs/ODMs like Mongoose to implement class inheritance mapping).

### (1) Design Motivation — "Why did we design this?"
In object-oriented programming, classes use **Inheritance**:
-   A base class `Asset` has subclasses `Stock`, `Bond`, and `RealEstate`.
-   All assets share basic fields: `owner_id`, `purchase_date`, `value`.
-   Each subclass has unique fields: `Stock` has a `ticker`; `Bond` has a `coupon_rate`; `RealEstate` has a physical `address`.

In relational databases (like PostgreSQL), modeling this inheritance is complex:
1.  **Single Table Inheritance:** Creating one giant `assets` table with 50 columns, where most columns are filled with `NULL` (wasteful and hard to read).
2.  **Class Table Inheritance:** Splitting the data across 4 tables and running complex `JOIN` and `UNION` queries to load a user's portfolio.

We designed **The Polymorphic Pattern** in MongoDB to solve this. 

Because MongoDB has a **Flexible Schema**, documents do not need to contain the same fields. 

You store *all* assets inside a single `assets` collection. 

To tell them apart, you add a **Discriminator Field** (usually named `type`, `kind`, or `_t`). 

Your backend application reads this discriminator string and instantiates the correct class model automatically.

---

### (2) When to use the Polymorphic Pattern
-   When the different entities share a common set of base fields.
-   When they are frequently queried together (e.g. loading a user's combined asset list on a single page).
-   When you want to avoid combining multiple tables using union checks.

---

### (3) Reality Metaphor (The Hand Toolbox)
Imagine organizing tools in a workshop:
-   **SQL (Table per Class):** Keeping hammers in a hammer box, screwdrivers in a screwdriver box, and saws in a saw box. 
    -   To clean up all "hand tools", you must walk to 3 different rooms and open 3 boxes.
-   **MongoDB (Polymorphic Pattern):** Storing all tools side-by-side in a single **Universal Toolbox** (collection). 
    -   Every tool has a printed stamp indicating its type: `type: "hammer"` or `type: "saw"`. 
    -   The hammer has a weight value; the saw has a teeth count value. 
    -   They sit together, ready to be grabbed in a single look.

---

### (4) Code Examples

#### Implementing a Polymorphic Assets Collection
All documents sit in a single `assets` collection:

```javascript
db.assets.insertMany([
  {
    owner_id: 101,
    type: "stock", // Discriminator!
    purchase_date: new Date(),
    value: NumberDecimal("5000.00"),
    ticker: "GOOG",
    shares: 25
  },
  {
    owner_id: 101,
    type: "real_estate", // Discriminator!
    purchase_date: new Date(),
    value: NumberDecimal("350000.00"),
    address: "123 Maple St",
    land_area_sqft: 5000
  }
]);

// Query: Fetch all assets owned by user 101, regardless of their type
db.assets.find({ owner_id: 101 });

// Query: Fetch ONLY stock assets for user 101
db.assets.find({ owner_id: 101, type: "stock" });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Splitting polymorphic entities into separate collections when they are almost always queried together

**The mistake:** Creating separate collections for `checking_accounts`, `savings_accounts`, and `credit_cards`, forcing your mobile app backend to execute 3 separate database reads to show a user's basic balances homepage.

**Why it's wrong:** Because these accounts are logically related and are loaded together on the home dashboard, splitting them increases database network latency and complicates query code.

**Fix: Store all account variants in a single `accounts` collection. Use a discriminator field `account_type: "savings"` to differentiate them.**

---



### Mistake 2: Splitting Differing Event Types into 20 Separate Collections

**The mistake:** Creating separate collections `click_events`, `purchase_events`, `signup_events`, `logout_events`.

**Why it's wrong:** Splitting polymorphic events into separate collections prevents querying unified event timelines. Use Polymorphic Pattern in a single `events` collection with a `type` discriminator field.

*Incorrect:*
```javascript
// 20 separate collections for event subtypes
```

*Fix:*
```javascript
Single events collection with discriminator field: { type: "click", ... }, { type: "purchase", ... }
```

### Mistake 3: Omitting a Type Discriminator Field in Polymorphic Collections

**The mistake:** Storing different document shapes in a collection without a `type` or `kind` field.

**Why it's wrong:** Without a explicit discriminator field (e.g. `type: "book"`), application code must inspect field existence (`$exists`) to infer document types, leading to fragile code.

*Incorrect:*
```javascript
{ title: "Book", isbn: "123" } // Missing type discriminator field
```

*Fix:*
```javascript
{ type: "book", title: "Book", isbn: "123" } // Explicit type discriminator
```

## 5. Practice Exercises

### Exercise 1: Heterogeneous Order Processing with Discriminator Fields

**Scenario:**
Model a single `payment_methods` collection storing Credit Card, PayPal, and Crypto payment methods using discriminator field `type`.

**Requirements:**
1. Insert Credit Card document with `type: "credit_card"`, `cardNumber`, `expDate`.
2. Insert PayPal document with `type: "paypal"`, `paypalEmail`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.payment_methods.insertMany([
>   {
>     userId: new ObjectId(),
>     type: "credit_card",
>     cardNumberMasked: "****-****-****-4242",
>     expMonth: 12,
>     expYear: 2028
>   },
>   {
>     userId: new ObjectId(),
>     type: "paypal",
>     paypalEmail: "user@example.com"
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. The Polymorphic Pattern uses a discriminator field (`type`) to distinguish different document structures in a single collection.
> 2. Replaces separate `credit_cards` and `paypals` SQL tables with a unified polymorphic collection.
> 3. Simplifies payment processing queries.
> 
---

### Exercise 2: Querying Specific Polymorphic Discriminator Subtypes

**Scenario:**
Query `payment_methods` for all `paypal` accounts belonging to a specific user.

**Requirements:**
1. Filter `{ userId: ..., type: "paypal" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.payment_methods.find({
>   userId: new ObjectId("60c72b2f9b1d8b2c88888880"),
>   type: "paypal"
> });
> ```
>
> #### Technical Explanation
>
> 1. Filtering by discriminator field `type` isolates specific subtype schemas.
> 2. Compound index `{ userId: 1, type: 1 }` speeds up type-filtered queries.
> 3. Guarantees fast, typed document lookups.
> 
---

### Exercise 3: Single-Collection Indexing for Polymorphic Models

**Scenario:**
Create a partial secondary index on `paypalEmail` applying ONLY to documents where `type: "paypal"`.

**Requirements:**
1. Create partial index with `partialFilterExpression: { type: "paypal" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.payment_methods.createIndex(
>   { paypalEmail: 1 },
>   { partialFilterExpression: { type: "paypal" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. Partial indexes (`partialFilterExpression`) index ONLY documents matching the discriminator subtype.
> 2. Reduces index storage size by omitting non-matching polymorphic document types.
> 3. Essential pattern for optimizing polymorphic collection indexes.
> 
---



## 6. Related Terms

- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The parent structure paradigm.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Evaluating structures.

---

## 7. Key Takeaways
- The Polymorphic Pattern stores different document structures in one collection.
- Uses a discriminator field (e.g. `type` or `kind`) to define document classes.
- Serves as NoSQL's implementation of object-oriented class inheritance.
- Prevents table fragmentation and complex SQL UNION operations.
- Ideal when related entities share base fields and are read together.
- Supported natively by ODMs (like Mongoose) to automate class hydration.
- Pair the discriminator field with indexes to accelerate subclass lookups.
