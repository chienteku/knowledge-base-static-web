# Database Migrations (MongoDB)

> **Level 10 — Administration, Security & Advanced Features**
> The structural data update process in MongoDB where collections of documents are modified (e.g. renaming fields, restructuring arrays) to align with new application code schema requirements, debunking the myth that "schema-less" databases do not require migrations.

---

## 1. Prerequisites
- [Schema Validation](../level_05/schema_validation.md) — Enforcing consistency limits.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Managed using migration utility frameworks like `migrate-mongo` or custom Node.js scripts. Run as deployment pipeline tasks preceding application updates).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Migration Strategy Analysis

**Problem:** You are managing a `logs` collection containing `500,000,000` documents. 
You must combine the fields `first_name` and `last_name` into a single field `full_name`. 
The collection is write-heavy and must not experience query degradation.
1.  Explain why an **Eager Migration** might be dangerous in this scenario.
2.  Explain how a **Lazy Migration** can be implemented inside your application model logic.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Eager Migration Danger: Running an upfront bulk migration over 500 million documents will trigger massive disk I/O and CPU load, locking the database and causing service timeouts during peak hours.
> 2. Lazy Migration Implementation: In your Node.js application (e.g. using a Mongoose pre-save hook or getter), check if the `full_name` field exists when loading a document. If it is missing, combine `first_name` and `last_name` on the fly, delete the old keys, and write the updated document back to the database.
> ```
> - Assess the scale of 500 million documents on query capacity.
> - Consider where lazy defaults are intercepted in ODMs.

---



### Exercise 2: Idempotent Schema Field Renaming Script

**Problem:** Rename field `uname` to `username` across all documents using `$rename`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.updateMany({ uname: { $exists: true } }, { $rename: { uname: "username" } });
> ```
> ```javascript
> db.users.updateMany(
>   { uname: { $exists: true } },
>   { $rename: { uname: "username" } }
> );
> ```
>
> **Explanation:** `$rename` renames document field keys across collection documents.

---

### Exercise 3: Lazy Schema Migration Pattern

**Problem:** Describe Lazy Schema Migration pattern (Migrates document schema format on-the-fly as documents are read and updated in application code).

**Expected output:**
> [!check]- Answer
> ```text
> Migrates document schema format on-the-fly as documents are read and updated in application code
> ```
> ```text
> Migrates document schema format on-the-fly as documents are read and updated in application code
> ```
>
> **Explanation:** Lazy Migration avoids downtime and locks by migrating document schemas incrementally.

## 7. Related Terms
- [Schema Validation](../level_05/schema_validation.md) — Enforcing consistency limits.

---

## 8. Key Takeaways
- NoSQL databases require schema migrations to prevent inconsistent states.
- Skipping migrations clogs application code with messy legacy checks.
- Eager migrations run bulk script updates before code deployment.
- Lazy migrations update documents on the fly as they are loaded/saved.
- Use migration frameworks (like `migrate-mongo`) to manage rollback files.
- The `$rename` operator updates document keys efficiently inside `updateMany`.
- Eager migrations on millions of documents can saturate server disk I/O.
