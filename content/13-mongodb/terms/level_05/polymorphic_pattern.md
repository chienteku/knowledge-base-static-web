# The Polymorphic Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern where documents with varying fields and structures are stored in a single collection, utilizing a dedicated discriminator field (e.g. `type` or `kind`) to distinguish their logical class structures.

---

## 1. Prerequisites
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The parent paradigm.
- [Element Query Operators (`$exists`, `$type`)](../../level_03/element_operators.md) — Querying structure differences.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported natively by the flexible document design of all NoSQL platforms. Used by ORMs/ODMs like Mongoose to implement class inheritance mapping).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Polymorphic Query Construction

**Problem:** You have a polymorphic `content` collection containing blog posts (`type: "post"`) and video clips (`type: "video"`). 
Write the query to find all video clips (hint: filter by the discriminator) that have more than `1000` views.

**Expected output:**
```javascript
db.content.find({ type: "video", views: { $gt: 1000 } });
```

> [!check]- Answer
> - Identify the discriminator field key `type` and target value `"video"`.
> - Apply standard comparison filters for the views count.

---



### Exercise 2: Polymorphic Collection Schema Design

**Problem:** Model single `content` collection storing both `article` and `video` documents using `type` discriminator.

**Expected output:**
```text
{ type: "article", title: "...", text: "..." } and { type: "video", title: "...", url: "..." }
```

> [!check]- Answer
> ```javascript
> const article = { type: "article", title: "News", text: "..." };
> const video = { type: "video", title: "Tutorial", url: "http://..." };
> ```
>
> **Explanation:** Polymorphic Pattern stores distinct sub-type shapes in a single collection using `type` discriminators.

### Exercise 3: Indexing Polymorphic Discriminator

**Problem:** Create compound index supporting polymorphic queries on `type` and `createdAt`.

**Expected output:**
```text
db.content.createIndex({ type: 1, createdAt: -1 });
```

> [!check]- Answer
> ```javascript
> db.content.createIndex({ type: 1, createdAt: -1 });
> ```
>
> **Explanation:** Compound indexes on `type` and sort fields accelerate sub-type timeline queries.

## 7. Related Terms
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The parent structure paradigm.
- [Element Query Operators (`$exists`, `$type`)](../../level_03/element_operators.md) — Evaluating structures.

---

## 8. Key Takeaways
- The Polymorphic Pattern stores different document structures in one collection.
- Uses a discriminator field (e.g. `type` or `kind`) to define document classes.
- Serves as NoSQL's implementation of object-oriented class inheritance.
- Prevents table fragmentation and complex SQL UNION operations.
- Ideal when related entities share base fields and are read together.
- Supported natively by ODMs (like Mongoose) to automate class hydration.
- Pair the discriminator field with indexes to accelerate subclass lookups.
