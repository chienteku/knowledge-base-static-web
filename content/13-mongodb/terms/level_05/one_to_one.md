# One-to-One Relationship (Embedding)

> **Level 5 — Data Modeling & Schema Design**
> The design pattern of modeling a 1:1 relationship by nesting the related data directly inside the parent document as an embedded subdocument, maximizing query speed and simplifying database schemas.

---

## 1. Prerequisites
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The syntax for nesting objects.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The comparative design framework.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Applies across all document NoSQL platforms. Simplifies collections list count and eliminates join lookups).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems, entities are mapped to their own tables. 

To model a One-to-One (1:1) relationship:
-   You create a `users` table and a `user_profiles` table.
-   You link them via a foreign key `user_id`.
-   You add a `UNIQUE` constraint on the foreign key to ensure a user cannot link to multiple profiles.
-   To read the profile, the database must join the tables at runtime.

In a document database, **this normalization is an anti-pattern.**

Because a user has exactly one profile, and the profile data is almost always read at the same time as the user account (e.g. during logins or dashboard loads), there is no reason to split them.

We model One-to-One relationships by **Embedding** the profile directly inside the user document as a nested subdocument. 

This guarantees:
-   **No Joins:** The entire dataset is retrieved in a single read.
-   **Atomic Writes:** You can update the username and the profile name in a single write operation, ensuring consistency without multi-collection transaction locks.

---

### (2) When to Reference instead of Embed for 1:1?
Embedding is the default for 1:1, but there is one rare exception where you should **Reference** instead:
-   **Large, Rarely Read Fields:** If the related entity contains massive data blocks (like a binary PDF resume buffer or a high-res photo blob) that are rarely read. 
    -   Embedding it would bloat the document, forcing MongoDB to load megabytes of unused data into memory whenever you run simple queries. 
    -   In this case, store the large payload in a separate collection and link it via reference.

---

### (3) Reality Metaphor
Imagine carrying your identification credentials:
-   **Embedding:** Stamping your photograph and eye color directly onto your plastic **Driver's License**. 
    -   *Pros:* It is a single card. Whenever a police officer inspects your license (reads data), they see your photo and name together instantly.
-   **Referencing:** Carrying a driver's license with no picture, and carrying a separate laminated **Photo Card** in a different pocket. 
    -   *Cons:* Whenever your ID is checked, the officer must request both cards and hold them side-by-side to verify they match.

---

### (4) Code Examples

#### Relational Normalized 1:1 in MongoDB (Not Recommended)
```javascript
// Collection: users
{ _id: ObjectId("60c72b2f9b1d8b2e88a8d111"), username: "dev_alice" }

// Collection: profiles
{ 
  _id: ObjectId("60c72b2f9b1d8b2e88a8d222"), 
  user_id: ObjectId("60c72b2f9b1d8b2e88a8d111"), // Reference
  first_name: "Alice",
  last_name: "Smith"
}
```

#### Embedded 1:1 Document Model (Recommended)
```javascript
// Collection: users
{
  _id: ObjectId("60c72b2f9b1d8b2e88a8d111"),
  username: "dev_alice",
  profile: { // Embedded Subdocument
    first_name: "Alice",
    last_name: "Smith"
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Splitting 1:1 relationships into separate collections because "they represent logically distinct business objects"

**The mistake:** Creating separate collections for `products` and `product_details` (which stores the product description and specifications), and running `$lookup` joins to display product pages.

**Why it's wrong:** In document databases, you do not design schemas around abstract logical entities. 

You design them around read efficiency. 

Since a product page always displays the description alongside the name, splitting them forces the database to query disk regions twice, slowing down load times.

**Fix: Embed 1:1 details directly inside the main document. Logical separation in code (classes/objects) does not require physical separation on disk.**

---



### Mistake 2: Splitting 1-to-1 Data into Separate Collections Without Performance Rationale

**The mistake:** Splitting `user` profile and `user_settings` into 2 separate collections with 1-to-1 foreign keys.

**Why it's wrong:** In MongoDB, 1-to-1 data accessed together should be stored inside a single embedded document to eliminate network roundtrips and joins.

*Incorrect:*
```javascript
// 2 collections for 1-to-1 user profile and settings
```

*Fix:*
```javascript
Embed settings object directly inside user document: { name, settings: { theme: 'dark' } }
```

### Mistake 3: Failing to Split Rare Large 1-to-1 Fields (Subset / Security Isolation)

**The mistake:** Embedding a 10MB user medical PDF file inside the primary `user` profile document.

**Why it's wrong:** Loading 10MB medical files on every basic login query wastes RAM. Split rare or sensitive 1-to-1 fields into a separate `user_medical` collection.

*Incorrect:*
```javascript
{ name: "Alice", medicalPdfBuffer: largeBuffer } // ❌ Bloats every user query!
```

*Fix:*
```javascript
Store medical details in separate user_medical collection, fetching only when needed
```

## 6. Practice Exercises

### Exercise 1: SQL to Mongo 1:1 Translation

**Problem:** You have a SQL database schema:
```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(100)
);
CREATE TABLE user_settings (
    user_id INT PRIMARY KEY REFERENCES users(id),
    dark_mode BOOLEAN,
    timezone VARCHAR(50)
);
```
Write the equivalent MongoDB document schema structure for a user named Alice (`email: "alice@mail.com"`, `dark_mode: true`, `timezone: "UTC"`) using the correct 1:1 modeling pattern.

**Expected output:**
> [!check]- Answer
> ```javascript
> {
>   _id: 1,
>   email: "alice@mail.com",
>   settings: {
>     dark_mode: true,
>     timezone: "UTC"
>   }
> }
> ```
> - Collapse the two relational tables into a single document.
> - Embed the settings fields inside a dedicated nested key object (e.g. `settings`).

---



### Exercise 2: 1-to-1 Embedded Document Schema

**Problem:** Model user document embedding 1-to-1 `settings` sub-document.

**Expected output:**
> [!check]- Answer
> ```text
> { name: "Alice", settings: { theme: "dark", notifications: true } }
> ```
> ```javascript
> const user = {
>   _id: new ObjectId(),
>   name: "Alice",
>   settings: {
>     theme: "dark",
>     notifications: true
>   }
> };
> ```
>
> **Explanation:** 1-to-1 data is embedded directly inside parent documents for optimal read performance.

---

### Exercise 3: 1-to-1 Field Isolation Exception

**Problem:** When should 1-to-1 data be split into a separate collection? (When fields are large/rarely accessed or require security isolation).

**Expected output:**
> [!check]- Answer
> ```text
> When fields are large, rarely accessed, or require separate security/permission isolation
> ```
> ```text
> When fields are large, rarely accessed, or require separate security/permission isolation
> ```
>
> **Explanation:** Isolating large or secret 1-to-1 fields keeps primary collection documents compact.

## 7. Related Terms
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The nested structure.
- [Embedding vs Referencing](embedding_vs_referencing.md) — The general pattern comparison.

---

## 8. Key Takeaways
- One-to-One relationships should be modeled by Embedding by default.
- Eliminates relational `JOIN` overhead, allowing single-query reads.
- Supports atomic updates across all parent and nested fields in one write.
- Simplifies schemas by reducing collection counts.
- Only reference 1:1 relationships if the child contains large, rarely read data blocks.
- Design database files based on read behaviors, not abstract logical entities.
