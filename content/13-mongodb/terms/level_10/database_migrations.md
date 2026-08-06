# Database Migrations (MongoDB)

> **Level 10 — Administration, Security & Advanced Features**
> The structural data update process in MongoDB where collections of documents are modified (e.g. renaming fields, restructuring arrays) to align with new application code schema requirements, debunking the myth that "schema-less" databases do not require migrations.

---

## 1. Prerequisites

- [Schema Validation (`$jsonSchema`)](../level_05/schema_validation.md) — Enforcing consistency limits.

---

## 2. Term Category

**Administration / Operations** (Schema Evolution & Data Migration): Database Migrations manage zero-downtime schema evolution, field renames, and type transformations across large-scale production collections.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Managed using migration utility frameworks like `migrate-mongo` or custom Node.js scripts. Run as deployment pipeline tasks preceding application updates).

### (1) Design Motivation — "Why did we design this?"
A common NoSQL pitfall is believing that because MongoDB is "schema-less," you never have to run database migrations.

This is a dangerous misconception.

While MongoDB does not block you from writing documents with new structures, your Node.js code expects consistency:
-   If you rename a field from `phone_number` to `phone`:
-   Relational databases force an immediate migration: `ALTER TABLE users RENAME COLUMN phone_number TO phone`.
-   If you skip migrations in MongoDB, your database will contain a mix of old documents (using `phone_number`) and new documents (using `phone`).
-   To prevent crashes, your backend code must contain messy conditional fallback checks: `const phone = user.phone || user.phone_number;`
-   Over years of development, your codebase will clog with legacy fallback checks.

We study **NoSQL Database Migrations** to organize systematic schema transformations, keeping collections clean and consistent.

---

### (2) The Two Migration Patterns

#### 1. Eager Migration (Upfront Bulk Update)
Runs an administrative script (e.g. using `migrate-mongo`) to find and update all documents in a collection at once before deploying new application code.
-   *Pros:* The collection returns to a unified, clean state. The application code has zero legacy checks.
-   *Cons:* Can lock collections or saturate disk I/O on tables with millions of records.

#### 2. Lazy Migration (On-the-Fly Update)
Updates documents individually as they are requested and updated by users during normal app usage.
-   *Pros:* Zero database down-time or CPU spikes.
-   *Cons:* Mixed document formats persist on disk indefinitely.

---

### (3) Reality Metaphor (Filing Cabinet Tab Labels)
Imagine a medical record filing cabinet where you must change the title tab from "Mobile Phone" to "Contact Number":
-   **Eager Migration:** Hiring a team of clerks to work overnight. 
    -   They inspect all 10,000 folders, erase "Mobile Phone", and write "Contact Number" on every tab. 
    -   By morning, every folder is updated. (Tiring, but complete).
-   **Lazy Migration:** Telling the receptionist: *"Leave the files alone. But if a patient walks in to check their file, rename their tab on the spot before returning it to the drawer."* 
    -   (Easy, but mixed files persist for years).

---

### (4) Code Examples

#### Eager Migration Script using Bulk Writes
Here is a typical migration script file using the standard MongoDB node driver to rename `phone_number` to `phone` in bulk:

```javascript
// Migration Script: 20260721-rename-phone.js
module.exports = {
  async up(db, client) {
    // 1. Rename field phone_number to phone on all documents
    // Uses the $rename operator in bulk updates
    await db.collection('users').updateMany(
      { phone_number: { $exists: true } }, // Match legacy documents
      { $rename: { "phone_number": "phone" } }
    );
    console.log("Migration 'up' completed successfully.");
  },

  async down(db, client) {
    // 2. Rollback logic: rename phone back to phone_number
    await db.collection('users').updateMany(
      { phone: { $exists: true } },
      { $rename: { "phone": "phone_number" } }
    );
    console.log("Migration 'down' rolled back successfully.");
  }
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on NoSQL flexibility to skip migrations entirely, leaving legacy schemas active on disk indefinitely

**The mistake:** Renaming profile fields in your Mongoose schema and deploying the code, without executing any database migration scripts.

**Why it's wrong:** Old documents still store the old field names. 

When users load their dashboards, their profiles appear empty or crash because the frontend looks for the new field name which does not exist in their document.

**Fix: Treat MongoDB schema updates with the same structural discipline as SQL migrations. Create migration scripts using tools like `migrate-mongo` and run them as part of your CI/CD deployment pipeline before updating web servers.**

---



### Mistake 2: Executing Destructive Field Removals in Production Without Prior Data Backups

**The mistake:** Running `db.users.updateMany({}, { $unset: { legacyField: "" } })` without backing up collection.

**Why it's wrong:** `$unset` drops field data permanently. Run `mongodump` backups before running destructive schema migration scripts.

*Incorrect:*
```javascript
db.users.updateMany({}, { $unset: { legacyField: "" } }); // ❌ Permanent field removal!
```

*Fix:*
```javascript
$ mongodump --db app --collection users # Backup first
db.users.updateMany({}, { $unset: { legacyField: "" } });
```

### Mistake 3: Running Downtime Bulk Migration Scripts on Live Production Collections

**The mistake:** Running synchronous batch migrations modifying 50M documents during peak traffic.

**Why it's wrong:** Modifying millions of documents synchronously locks WiredTiger cache and slows live API traffic. Use Lazy Schema Migration (Dual-Write / Read-Fallback pattern).

*Incorrect:*
```javascript
// Synchronous 50M document migration during peak hours
```

*Fix:*
```javascript
Use Lazy Migration pattern: migrate documents on-the-fly as they are read/written
```

## 5. Practice Exercises

### Exercise 1: Zero-Downtime Field Renaming with `updateMany`

**Scenario:**
Rename legacy field `user_name` to `username` across collection `users` using `$rename`.

**Requirements:**
1. Execute `updateMany({}, { $rename: { user_name: "username" } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateMany(
>   { user_name: { $exists: true } },
>   { $rename: { user_name: "username" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$rename` renames field keys across documents atomically without re-writing entire documents.
> 2. `$exists: true` filter ensures only documents requiring migration are updated.
> 3. Simple single-stage schema migration.
> 
---

### Exercise 2: Dual-Write Schema Migration Strategy

**Scenario:**
Implement a 4-phase dual-write schema migration strategy for changing data format without application downtime.

**Requirements:**
1. Outline Phase 1 (Dual Write), Phase 2 (Backfill), Phase 3 (Read Switch), Phase 4 (Cleanup).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> 4-Phase Zero-Downtime Migration Pattern:
> Phase 1: Update application code to write to BOTH old and new schema fields (Dual-Write).
> Phase 2: Run background script backfilling old documents to new schema format.
> Phase 3: Update application code to read exclusively from new schema fields.
> Phase 4: Deprecate and $unset old schema fields.
> ```
>
> #### Technical Explanation
>
> 1. Dual-write patterns guarantee zero downtime during major schema structure overhauls.
> 2. Backward and forward compatibility is maintained across deployment steps.
> 3. Industry standard enterprise migration workflow.
> 
---

### Exercise 3: Automated Migration Scripts with `migrate-mongo`

**Scenario:**
Write a Node.js up/down migration script using `migrate-mongo` to transform string prices to `Decimal128`.

**Requirements:**
1. Write `up()` and `down()` migration handlers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> module.exports = {
>   async up(db, client) {
>     const products = db.collection("products");
>     const docs = await products.find({ price: { $type: "string" } }).toArray();
>     
>     for (const doc of docs) {
>       await products.updateOne(
>         { _id: doc._id },
>         { $set: { price: Decimal128.fromString(doc.price) } }
>       );
>     }
>   },
>   async down(db, client) {
>     // Revert Decimal128 to string if rollback needed
>   }
> };
> ```
>
> #### Technical Explanation
>
> 1. `migrate-mongo` tracks executed migration scripts in a `changelog` collection.
> 2. `up()` executes schema transformations; `down()` provides automated rollback capabilities.
> 3. Standardizes database version control.
> 
---



## 6. Related Terms

- [Schema Validation (`$jsonSchema`)](../level_05/schema_validation.md) — Enforcing consistency limits.

---

## 7. Key Takeaways
- NoSQL databases require schema migrations to prevent inconsistent states.
- Skipping migrations clogs application code with messy legacy checks.
- Eager migrations run bulk script updates before code deployment.
- Lazy migrations update documents on the fly as they are loaded/saved.
- Use migration frameworks (like `migrate-mongo`) to manage rollback files.
- The `$rename` operator updates document keys efficiently inside `updateMany`.
- Eager migrations on millions of documents can saturate server disk I/O.
