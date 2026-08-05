# Flexible Schema (Schema-on-Read)

> **Level 1 — What Is a Document Database?**
> The database paradigm where data structures are not rigidly enforced at write time (Schema-on-Read), allowing documents in the same collection to have different fields and shapes.

---

## 1. Prerequisites

- [Collection](collection.md) — The schema-free data container.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (The defining philosophy of document NoSQL databases, contrasting with the Schema-on-Write model of relational databases like PostgreSQL).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Trade-off Analysis

**Problem:** You are building a banking ledger database that tracks money transactions. 
1.  Which schema model (**Schema-on-Write** or **Schema-on-Read**) is safer for this project?
2.  Explain why.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Schema-on-Write (PostgreSQL / SQL) is safer.
> 2. In a financial system, data consistency is critical. You must guarantee that every transaction contains a valid account ID, matching currency codes, and positive balances. Having the database engine enforce these rules at write-time prevents bugs in application code from saving corrupted financial ledgers.
> ```
> - Evaluate the cost of structural data mistakes.
> - Consider which database engine enforces constraints at write-time.

---



### Exercise 2: Enforcing Collection JSON Schema Validation

**Problem:** Create collection `user` with `$jsonSchema` requiring string `email`.

**Expected output:**
> [!check]- Answer
> ```text
> db.createCollection("user", { validator: { $jsonSchema: { required: ["email"] } } });
> ```
> ```javascript
> db.createCollection("user", {
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
> **Explanation:** `$jsonSchema` enforces data validation rules on flexible document collections.

---

### Exercise 3: Checking Field Existence with `$exists`

**Problem:** Query documents possessing field `middleName` using `$exists: true`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ middleName: { $exists: true } });
> ```
> ```javascript
> db.users.find({ middleName: { $exists: true } });
> ```
>
> **Explanation:** `$exists` filters documents containing specified field keys.

## 7. Related Terms

- [Collection](collection.md) — The schema-free container.
- [Document vs. Relational Model](document_vs_relational.md) — Paradigm comparisons.
- [`null`](../level_02/null_type.md) — Related concept: `null`.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Related concept: Element Query Operators (`$exists`, `$type`).
- [The Polymorphic Pattern](../level_05/polymorphic_pattern.md) — Related concept: The Polymorphic Pattern.
- [Schema Design (Document Modeling)](../level_05/schema_design.md) — Related concept: Schema Design (Document Modeling).

---

## 8. Key Takeaways
- Flexible Schema allows documents in a collection to carry varying fields.
- Schema-on-Read shifts data validation from database tables to application code.
- Eliminates the need to run DDL migrations when updating document attributes.
- Speeds up write operations by skipping database constraint checks.
- **Rule of Thumb:** A flexible schema requires strict validation in backend code.
- Use MongoDB's JSON Schema Validation to enforce write rules on collections.
