# Partial Index

> **Level 7 — Indexes & Query Performance**
> The database index type that only indexes documents matching a specified filter expression, providing a modern, flexible superset of sparse indexes to save disk space and enforce conditional uniqueness.

---

## 1. Prerequisites

- [Sparse Index](sparse_index.md) — The limited predecessor.
- [Unique Index](unique_index.md) — The uniqueness constraint.

---

## 2. Term Category

**Index / Performance** (Filtered Expression Sub-Index): A Partial Index indexes ONLY documents that satisfy a specified partialFilterExpression, reducing index RAM size and write amplification.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Introduced in MongoDB 3.2. Evaluates the `partialFilterExpression` predicate before writing index keys to disk).

### (1) Design Motivation — "Why did we design this?"
While Sparse Indexes are useful for optional fields, they can only filter based on a field's existence:
-   What if you want to build a unique index on `email`, but only for users where `role: "member"`, allowing guest checkout profiles with duplicate emails to exist?
-   What if you only want to index documents where `status: "active"` to keep the index size small, ignoring millions of deactivated backup profiles?

Sparse indexes cannot handle these conditional rules.

We designed the **Partial Index** to solve this. 

By defining a **`partialFilterExpression`**, you specify a custom query filter. 

Only documents matching that filter are written to the index B-Tree. 

This saves massive amounts of disk and RAM, and allows you to enforce unique constraints conditionally.

---

### (2) The Query Matching Rule (CRITICAL)
For the query planner to use a partial index, **your query filter must explicitly include the partial filter criteria (or a stricter subset of it).**

If you build this partial index:
-   Index keys: `{ email: 1 }`
-   Filter: `partialFilterExpression: { status: "active" }`

If your application runs this query:
`db.users.find({ email: "alice@mail.com" })`

-   MongoDB **will ignore** the partial index and execute a full collection scan, even if Alice's status is active.
-   *Why?* The database engine cannot guarantee Alice is active from the query itself, so it cannot search the active-only index safely.
-   To use the index, you must explicitly add the status to the query filter:
    `db.users.find({ email: "alice@mail.com", status: "active" })`

---

### (3) Reality Metaphor (The Paid Club List)
Imagine checking guests at a club entrance:
-   **Partial Index:** An alphabetical list containing **only members who have paid their annual dues** (`status: "paid"`).
-   **The Matching Rule:** A member walks up and says: *"Look up John Smith."* 
    -   The guard says: *"I cannot look up your name on this paper list unless you first tell me your payment status. If you are unpaid, your name isn't here anyway. I'd have to search the main corporate folders in the back office."* 
    -   If the guest says: *"I have paid"* (`status: "paid"`), the guard checks the list and finds them instantly.

---

### (4) Code Examples

#### Creating and Matching a Partial Index
Let's build a conditional unique email index for members only:

```javascript
// 1. Build a unique partial index
db.users.createIndex(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "member" } // Only index members!
  }
);

// 2. Insert: Two guests with duplicate emails (SUCCEEDS - ignored by index)
db.users.insertOne({ email: "guest@mail.com", role: "guest" });
db.users.insertOne({ email: "guest@mail.com", role: "guest" });

// 3. Insert: Two members with duplicate emails (CRASHES - unique index triggers!)
db.users.insertOne({ email: "member@mail.com", role: "member" });
db.users.insertOne({ email: "member@mail.com", role: "member" }); // Crashes E11000

// 4. Query: Ignore index (Missing filter parameter in query)
db.users.find({ email: "member@mail.com" }); // Runs slow collection scan!

// 5. Query: Uses index (Query filter matches partial index expression!)
db.users.find({ email: "member@mail.com", role: "member" });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to include the partial index filter key inside your application query, causing queries to run slow scans

**The mistake:** Building a partial index filtered on `{ status: "active" }` to optimize high-volume searches, and writing your code query as `db.users.find({ user_id: 101 })` expecting index speeds.

**Why it's wrong:** Because `status: "active"` is missing from the query, the engine ignores the partial index, running slow scans on disk.

**Fix: Always append the partial filter condition to your queries to allow the query planner to match and use the index.**

---





### Mistake 2: Querying Partial Indexes Without Including the Partial Filter Expression Criteria in Queries

**The mistake:** Creating partial index `{ email: 1 }` with `partialFilterExpression: { active: true }` and querying `db.users.find({ email: 'a@b.com' })`.

**Why it's wrong:** To utilize a partial index, query filters MUST explicitly include the partial filter expression criteria (`active: true`). Querying `email` alone forces a `COLLSCAN`.

*Incorrect:*
```javascript
db.users.createIndex({ email: 1 }, { partialFilterExpression: { active: true } });
db.users.find({ email: "a@b.com" }); // ❌ Missing active: true in query filter!
```

*Fix:*
```javascript
db.users.find({ email: "a@b.com", active: true }); // Utilizes partial index
```



### Mistake 3: Confusing Partial Indexes with Sparse Indexes

**The mistake:** Using `sparse: true` when complex expressions like `{ status: 'active', age: { $gt: 18 } }` are required.

**Why it's wrong:** Sparse indexes index documents where the target field exists. Partial indexes support arbitrary `$jsonSchema` and query expression filters.

*Incorrect:*
```javascript
// Using sparse index for complex expression filtering
```

*Fix:*
```javascript
Use partialFilterExpression for expression-based conditional indexing
```



## 5. Practice Exercises

### Exercise 1: Creating Filtered Sub-Indexes with `partialFilterExpression`

**Scenario:**
Create a partial unique index on `email` in collection `users` applying ONLY to documents where `status: "active"`.

**Requirements:**
1. Pass `partialFilterExpression: { status: "active" }` to `createIndex()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex(
>   { email: 1 },
>   {
>     unique: true,
>     partialFilterExpression: { status: "active" }
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. Partial indexes index ONLY documents satisfying the `partialFilterExpression`.
> 2. Ignores inactive or archived users, keeping index RAM footprint small.
> 3. Enforces unique email constraints exclusively for active users.
> 
---

### Exercise 2: Verifying Query Eligibility for Partial Indexes

**Scenario:**
Verify whether a query utilizes a partial index by inspecting `explain()` output.

**Requirements:**
1. Query MUST include `status: "active"` in query filter to use the partial index.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ✅ Uses Partial Index (filter includes partialFilterExpression)
> db.users.find({ email: "alice@example.com", status: "active" });
> 
> // ❌ Bypasses Partial Index -> Forces COLLSCAN (filter omits status)
> db.users.find({ email: "alice@example.com" });
> ```
>
> #### Technical Explanation
>
> 1. MongoDB query optimizer uses a partial index ONLY IF the query filter explicitly includes or implies the `partialFilterExpression`.
> 2. Querying without `status: "active"` forces a collection scan because the index does not contain inactive users.
> 3. Always include partial filter clauses in application queries.
> 
---

### Exercise 3: Reducing Write Amplification with Partial Indexes

**Scenario:**
Calculate the index size savings of partial indexing on a 10,000,000 document collection where only 5% of documents are active.

**Requirements:**
1. Contrast full index size vs 95% partial index size savings.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Partial Index RAM Optimization:
> - Full Index: Indexes 10,000,000 documents -> 500MB RAM size.
> - Partial Index (status: "active"): Indexes 500,000 documents -> 25MB RAM size (95% RAM savings!).
> ```
>
> #### Technical Explanation
>
> 1. Partial indexes drastically reduce B-tree memory footprint by filtering out inactive records.
> 2. Eliminates index update write amplification for deleted/archived records.
> 3. Essential pattern for high-scale databases.
> 
---



## 6. Related Terms

- [Sparse Index](sparse_index.md) — The parent existence index.
- [Unique Index](unique_index.md) — The constraint model.

---

## 7. Key Takeaways
- Partial indexes only index documents that match a specified filter.
- Modern, flexible superset of sparse indexes introduced in MongoDB 3.2.
- Used to enforce conditional uniqueness constraints (e.g. unique for members only).
- Drastically reduces database disk footprint by omitting inactive profiles.
- Query filters must explicitly contain the partial index criteria to match it.
- Omitting the partial criteria in queries forces slow full collection scans.
- Supports simple comparisons (`$gt`, `$exists`, `$eq`) in the filter expression.
