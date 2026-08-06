# Flexible Schema (Schema-on-Read)

> **Level 1 — What Is a Document Database?**
> The database paradigm where data structures are not rigidly enforced at write time (Schema-on-Read), allowing documents in the same collection to have different fields and shapes.

---

## 1. Prerequisites

- [Collection](collection.md) — The schema-free data container.

---

## 2. Term Category

**Data Modeling** (Dynamic Schema Structure): Flexible Schema refers to MongoDB's ability to store documents with varying field structures within the same collection without rigid DDL migrations.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (The defining philosophy of document NoSQL databases, contrasting with the Schema-on-Write model of relational databases like PostgreSQL).

### (1) Design Motivation — "Why did we design this?"
In PostgreSQL, before you can save a single row of data, you must write DDL commands to define a table, declaring every column and data type:

`CREATE TABLE users (id INT, email VARCHAR(100) NOT NULL);`

This is **Schema-on-Write**: the database validates the data structure *before* writing it to disk. 

While safe, Schema-on-Write introduces friction during rapid application development:
-   If you want to add a `profile_theme` setting to user accounts, you must run an `ALTER TABLE` database migration on production.
-   On massive tables, migrations can lock database files, slowing down deployments.

We designed the **Flexible Schema** (often called **Schema-on-Read**) paradigm to eliminate this deployment friction. 

In MongoDB, you simply insert the document with the new field immediately. 

The database engine accepts the write without checks. 

The structural logic is managed inside your **application code** (e.g. using object mapping models) when the code reads the document from disk.

---

### (2) Schema-on-Write vs. Schema-on-Read

| Dimension | Schema-on-Write (PostgreSQL) | Schema-on-Read (MongoDB) |
| :--- | :--- | :--- |
| **Enforced By** | The database engine. | The application code (backend). |
| **Write Speed** | Slower (checks types and keys). | **Faster** (no checks, direct writes). |
| **Agility** | Low (requires migration scripts). | **High** (add fields instantly). |
| **Data Cleanliness** | Guaranteed by DB constraints. | Requires strict validation in code. |

---

### (3) Reality Metaphor
Imagine a shipping sorting warehouse:
-   **Schema-on-Write (SQL):** The shipping carrier only accepts items wrapped in official, pre-measured cardboard envelopes. If a package is odd-shaped or missing a box, the clerk rejects it at the service counter.
-   **Schema-on-Read (NoSQL):** The shipping carrier accepts any package shape—cardboard boxes, paper tubes, plastic bubble wrap. The postman interprets the package layout only when they read the destination label at the customer's door.

---

### (4) Code Examples

#### Flexible Schema in Action
In a single `contacts` collection, we can save different layouts:

```javascript
// Document 1: basic contact
db.contacts.insertOne({
  name: "Alice",
  phone: "555-1234"
});

// Document 2: contact with social links and no phone
db.contacts.insertOne({
  name: "Bob",
  socials: {
    github: "bobgit",
    twitter: "bobtweets"
  }
});
```

Postgres would require adding a `socials` JSON column or child tables. MongoDB stores both in the same collection without any configuration.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing "Flexible Schema" means "No Schema at all" and ignoring data validation

**The mistake:** Saving arbitrary object shapes to a collection from different parts of your application without any validation rules, resulting in corrupt data on disk.

**Why it's wrong:** If you have no schema rules anywhere, your database becomes a junk drawer. 

When your backend code reads documents, it will crash with `undefined` property errors because Document 1 has `email` while Document 2 has `email_address`. 

You end up writing messy code checks to handle missing data.

**Fix: The schema still exists, it is just managed inside your application code. Always use a schema validation library (like Mongoose in Node.js) to enforce fields, or configure MongoDB's built-in JSON Schema Validation on your collections.**

---



### Mistake 2: Assuming Flexible Schema Means No Data Structure Planning is Needed

**The mistake:** Storing arbitrary inconsistent field types across documents without schema validation rules.

**Why it's wrong:** Uncontrolled schema drift causes application runtime crashes when code expects `age` to be a number but finds a string or array.

*Incorrect:*
```javascript
// doc 1: { age: 30 }, doc 2: { age: "thirty" }, doc 3: { age: [30] }
```

*Fix:*
```javascript
Use JSON Schema Validation (validator) to enforce type consistency across collections
```

### Mistake 3: Modifying Schema Types in Production Without Updating Application Code

**The mistake:** Changing field `phone` from string to object `{ country: "+1", number: "123" }` without backwards compatibility handling.

**Why it's wrong:** Legacy code reading documents expecting string primitives throws TypeError exceptions.

*Incorrect:*
```javascript
// Instant schema mutation without handling legacy string values
```

*Fix:*
```javascript
Handle multi-schema versions using Polymorphic Schema Patterns in code
```

## 5. Practice Exercises

### Exercise 1: Heterogeneous Collection Document Storage

**Scenario:**
Store product documents with distinct field attributes (`laptop` vs `book`) in a single collection `products`.

**Requirements:**
1. Insert laptop document with `cpu`, `ramGB`.
2. Insert book document with `author`, `isbn`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.insertMany([
>   {
>     type: "laptop",
>     name: "Pro Laptop",
>     cpu: "M3 Pro",
>     ramGB: 18
>   },
>   {
>     type: "book",
>     name: "Database Systems",
>     author: "A. Silberschatz",
>     isbn: "978-0133594140"
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. Flexible schema allows collections to store polymorphic documents with varying attributes.
> 2. Eliminates sparse NULL columns typical in relational single-table inheritance models.
> 3. Simplifies modeling product catalogs with diverse properties.
> 
---

### Exercise 2: Schema Evolution without DDL Migrations

**Scenario:**
Update application code to start writing a new `taxId` field on `customer` documents without executing `ALTER TABLE` DDL queries.

**Requirements:**
1. Write new customer document with `taxId` field alongside older documents.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // New customer write includes taxId
> db.customers.insertOne({
>   name: "Acme Corp",
>   taxId: "TX-998877"
> });
> 
> // Query handles both old (missing taxId) and new documents
> db.customers.find({
>   taxId: { $exists: true }
> });
> ```
>
> #### Technical Explanation
>
> 1. New application features can write new fields immediately without database migration downtime.
> 2. Queries use `$exists` to handle missing fields gracefully across legacy documents.
> 3. Accelerates agile continuous deployment pipelines.
> 
---

### Exercise 3: Enforcing Boundaries with Schema Validation (`$jsonSchema`)

**Scenario:**
Add a `$jsonSchema` validation rule to collection `users` to require field `email` while permitting flexible optional fields.

**Requirements:**
1. Use `collMod` to enforce `$jsonSchema` requiring `email`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.runCommand({
>   collMod: "users",
>   validator: {
>     $jsonSchema: {
>       bsonType: "object",
>       required: ["email"],
>       properties: {
>         email: { bsonType: "string" }
>       }
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. Schema Validation (`$jsonSchema`) combines document flexibility with structural guardrails.
> 2. Rejects write attempts violating mandatory field rules.
> 3. Prevents low-quality corrupt data from entering flexible collections.
> 
---



## 6. Related Terms

- [Collection](collection.md) — The schema-free container.
- [Document vs. Relational Model](document_vs_relational.md) — Paradigm comparisons.
- [`null`](../level_02/null_type.md) — Related concept: `null`.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Related concept: Element Query Operators (`$exists`, `$type`).
- [The Polymorphic Pattern](../level_05/polymorphic_pattern.md) — Related concept: The Polymorphic Pattern.
- [Schema Design (Document Modeling)](../level_05/schema_design.md) — Related concept: Schema Design (Document Modeling).

---

## 7. Key Takeaways
- Flexible Schema allows documents in a collection to carry varying fields.
- Schema-on-Read shifts data validation from database tables to application code.
- Eliminates the need to run DDL migrations when updating document attributes.
- Speeds up write operations by skipping database constraint checks.
- **Rule of Thumb:** A flexible schema requires strict validation in backend code.
- Use MongoDB's JSON Schema Validation to enforce write rules on collections.
