# Views

> **Level 10 — Administration, Security & Advanced Features**
> The read-only queryable database objects in MongoDB whose contents are dynamically defined by an aggregation pipeline run against underlying source collections, serving as the direct equivalent to PostgreSQL views.

---

## 1. Prerequisites
- [Aggregation Pipeline](../../level_06/aggregation_pipeline.md) — The defining query format.
- [View (PostgreSQL)](../../../12-postgres/terms/level_06/view.md) — Relational view abstractions.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Managed at the database level. Queries sent to a view are translated internally by the query planner into aggregation stages on the source collections).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex database architectures, you frequently write large queries to prepare data:
-   Joining orders with customer details (`$lookup`).
-   Filtering out sensitive user information (like password hashes or SSNs).
-   Calculating monthly sales totals (`$group`).

If you copy and paste this complex aggregation query code across multiple backend services:
-   Any schema change requires updating dozens of application files.
-   You risk exposing sensitive fields to unauthorized client API routes.

In SQL, you solve this by creating **Views** to abstract queries.

We designed **Views** to provide the same query abstraction in MongoDB. 

A View acts as a virtual, read-only collection. 

You define the View using an aggregation pipeline. 

Applications query the View using standard `find()` statements as if it were a normal collection. 

This hides query complexity, encapsulates business rules, and secures schemas by masking fields.

---

### (2) Key Characteristics of MongoDB Views

#### 1. Dynamic & Virtual (Non-Materialized)
Views do **not** store data on disk. 
-   Every time you query a view, MongoDB runs the underlying aggregation pipeline on the fly.
-   Consequently, a view always returns fresh, real-time data.

#### 2. Strictly Read-Only
You cannot write data to a view. 
-   Commands like `insertOne()`, `updateOne()`, or `deleteOne()` are blocked and throw errors.

#### 3. Index Delegation
Views do not have their own indexes. 
-   Instead, queries run against a view utilize the indexes configured on the **underlying source collection**.

---

### (3) Reality Metaphor (Storefront Tinted Windows)
Imagine managing a store storage room:
-   **Source Collection:** The **Raw Storage Room**. It contains box clutter, trash bins, cash registers, and customer invoices.
-   **View:** A **Tinted Display Window** built in the outer brick wall.
    -   The window has a filter template (aggregation stages) that blocks out the background cash registers and clutter, showing only the clean item catalog displays.
    -   You cannot climb through the glass to deposit items (read-only), but the display shifts in real-time as items move inside.

---

### (4) Code Examples

#### Creating and Querying a View in mongosh
Let's build a public profile directory that hides user contact emails:

```javascript
// 1. Create a View named 'public_profiles'
db.createView(
  "public_profiles", // The name of the new View
  "users",           // The source collection name
  [
    // The aggregation pipeline defining the View content
    {
      $project: {
        username: 1,
        biography: 1,
        join_date: 1,
        email: 0,       // HIDE sensitive email field!
        password: 0     // HIDE password hash!
      }
    }
  ]
);

// 2. Query the View normally using find()
db.public_profiles.find({ username: "alice" });

// Output returns document WITHOUT email or password fields:
// { "_id": ObjectId("..."), "username": "alice", "biography": "Hello!" }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to run insert or update operations on a MongoDB View, expecting them to propagate to the source collection

**The mistake:** Treating the virtual view collection `public_profiles` as a standard collection and running `db.public_profiles.insertOne({ username: "bob" })`.

**Why it's wrong:** Views are strictly read-only. 

Because they represent dynamic queries, they cannot translate write inserts back through arbitrary aggregate stages, throwing database write errors:
`WriteCommandError: User cannot write to a read-only view`

**Fix: Route all write commands (inserts, updates, deletes) to the underlying source collection (`users`). Query the view strictly for read-only outputs.**

---



### Mistake 2: Attempting Direct Write Mutations (`insertOne`, `updateOne`) Against MongoDB Views

**The mistake:** Executing `db.active_users_view.insertOne({ name: "Alice" })`.

**Why it's wrong:** MongoDB Views are read-only virtual collections! Executing write operations (`insert`, `update`, `delete`) against views throws error `Command failed with error: Target of update/insert is a view`.

*Incorrect:*
```javascript
db.active_users_view.insertOne({ name: "Alice" }); // ❌ View write error!
```

*Fix:*
```javascript
Execute write operations directly against the underlying source collection
```

### Mistake 3: Expecting Views to Persist Physical Index Data on Disk (Confusing Views with Materialized Views)

**The mistake:** Attempting to create a B-Tree index on a view `db.createView().createIndex(...)`.

**Why it's wrong:** Standard MongoDB Views are computed on-demand on every query! Views do NOT store physical documents or indexes on disk. Use `$out` or `$merge` for persisted Materialized Views.

*Incorrect:*
```javascript
db.active_users_view.createIndex({ email: 1 }); // ❌ Cannot create index on view!
```

*Fix:*
```javascript
Index underlying source collection fields or build Materialized Views via $merge
```

## 6. Practice Exercises

### Exercise 1: View Definition

**Problem:** You have a `sales` collection. Write the mongosh command to create a View named `"active_high_value_sales"` pointing to the `sales` collection, filtering only documents where the `amount` is greater than `1000` and the `status` is `"active"`.

**Expected output:**
```javascript
db.createView(
  "active_high_value_sales",
  "sales",
  [
    { $match: { amount: { $gt: 1000 }, status: "active" } }
  ]
);
```

> [!check]- Answer
> - The creator helper is `db.createView(viewName, sourceCollection, pipeline)`.
> - Use the `$match` aggregation stage for the filter query object.

---



### Exercise 2: Creating Read-Only MongoDB View

**Problem:** Create view `active_users` on `users` collection filtering for `active: true` using `db.createView()`.

**Expected output:**
```text
db.createView("active_users", "users", [{ $match: { active: true } }]);
```

> [!check]- Answer
> ```javascript
> db.createView(
>   "active_users",
>   "users",
>   [{ $match: { active: true } }]
> );
> ```
>
> **Explanation:** `db.createView(viewName, sourceColl, pipeline)` builds read-only virtual collections.

### Exercise 3: On-Demand Views vs Materialized Views

**Problem:** Compare: On-Demand Views (computed dynamically on query); Materialized Views (persisted to disk via `$merge`).

**Expected output:**
```text
On-Demand Views: computed dynamically; Materialized Views: persisted on disk via $merge
```

> [!check]- Answer
> ```text
> On-Demand Views: computed dynamically; Materialized Views: persisted on disk via $merge
> ```
>
> **Explanation:** On-demand views compute results dynamically; materialized views cache results on disk.

## 7. Related Terms
- [Aggregation Pipeline](../../level_06/aggregation_pipeline.md) — The defining query format.
- [View (PostgreSQL)](../../../12-postgres/terms/level_06/view.md) — Relational views.

---

## 8. Key Takeaways
- Views are virtual, read-only collections defined by aggregation pipelines.
- Direct NoSQL equivalent to relational database views.
- Do not store physical data on disk; queries compute dynamic aggregates on the fly.
- Individual document inserts, updates, and deletes are forbidden.
- Views inherit and utilize the indexes built on their source collections.
- Highly useful for schema security (masking sensitive fields from client routes).
- Simplifies application code by encapsulating long aggregate queries.
