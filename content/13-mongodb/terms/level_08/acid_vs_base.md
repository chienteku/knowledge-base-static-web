# ACID vs BASE

> **Level 8 — Transactions, Consistency & Durability**
> The comparison of database consistency paradigms, contrasting ACID (Atomicity, Consistency, Isolation, Durability—relational standard) with BASE (Basically Available, Soft state, Eventual consistency—NoSQL standard), and explaining how MongoDB bridges both models.

---

## 1. Prerequisites
- [Multi-Document Transaction](multi_document_transaction.md) — MongoDB's ACID feature.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Core distributed systems science. Governs structural design trade-offs between relational database systems (like PostgreSQL) and NoSQL cluster architectures).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database science, you cannot build a system that has infinite speed, infinite scale, and perfect consistency simultaneously (known as the **CAP Theorem**). 

Instead, database engines must choose a consistency paradigm.

Traditionally, relational databases (like PostgreSQL) chose **ACID**. 

They prioritize data correctness and strict consistency above all else, which limits their ability to scale horizontally across multiple servers easily.

NoSQL systems (like early MongoDB) chose **BASE**. 

They prioritized horizontal scaling, low latency, and high availability, accepting that data might take a few seconds to synchronize across servers.

Understanding these paradigms helps you choose the correct model for your queries, rather than assuming NoSQL is "unreliable" or SQL is "slow."

---

### (2) The Consistency Paradigms

```mermaid
graph TD
    A["Consistency Paradigms"] --> B["ACID (Relational Standard)"]
    A --> C["BASE (Distributed NoSQL Standard)"]
    
    B --> B1["Atomicity - All or nothing"]
    B --> B2["Consistency - Valid states only"]
    B --> B3["Isolation - Independent executions"]
    B --> B4["Durability - Written on disk"]
    
    C --> C1["Basically Available - Stays online during partition"]
    C --> C2["Soft State - Data can drift over time"]
    C --> C3["Eventual Consistency - Syncs after lag clears"]
```

#### 1. ACID (Strict Consistency)
-   **Atomicity:** Writes are all-or-nothing.
-   **Consistency:** Data must conform to schema rules (constraints, keys).
-   **Isolation:** Concurrent transactions do not affect each other.
-   **Durability:** Committed data is permanently saved on disk.
-   *Best For:* Financial systems, billing ledgers, and order checkouts.

#### 2. BASE (Flexible Consistency)
-   **Basically Available (BA):** The system values availability. It stays online during network splits, even if some nodes return stale data.
-   **Soft State (S):** The data state can drift over time without user action (due to lag).
-   **Eventual Consistency (E):** The system guarantees that if no new updates are made, all replica nodes will eventually sync and show the same data.
-   *Best For:* Social media feeds, likes counters, telemetry logs, and global catalogs.

---

### (3) How MongoDB Bridges Both Worlds
MongoDB is unique because **it does not force you to choose between ACID and BASE.**
-   **By Default (BASE):** If you read from secondaries and write with `w: 1`, MongoDB behaves as a high-speed, eventually consistent BASE database.
-   **Opt-in (ACID):** If you execute queries using **Sessions** and **Multi-Document Transactions** with `writeConcern: "majority"` and `readConcern: "majority"`, MongoDB provides full **ACID compliance** matching PostgreSQL.

---

### (4) Comparison Summary Table

| Dimension | ACID Model (PostgreSQL Default) | BASE Model (Historical NoSQL Default) |
| :--- | :--- | :--- |
| **Consistency Target** | **Immediate Consistency** (always fresh). | **Eventual Consistency** (stale reads possible). |
| **Scaling Strategy** | Vertical (bigger servers). | Horizontal (more cheap servers/shards). |
| **Integrity Rules** | Hard constraints (Foreign Keys). | Soft constraints (Schema Validation). |
| **Read Latency** | Higher (blocked by locks). | Lower (reads from any node). |
| **MongoDB Mode** | Opt-in via transactions/majority settings. | Default operation mode. |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming MongoDB cannot be used for financial or transactional systems because NoSQL databases are "eventually consistent"

**The mistake:** Rejecting MongoDB for a project requiring bank transfers, assuming it only supports BASE and cannot guarantee ACID consistency.

**Why it's wrong:** Modern MongoDB (since 4.0/4.2) is fully ACID-compliant. 

By wrapping your code inside `session.withTransaction()` and configuring majority write/read concerns, you get the same transactional guarantees as SQL databases.

**Fix: Configure your critical database routes to use transactions and majority write concerns, while keeping standard analytics routes in fast BASE mode.**

---



### Mistake 2: Assuming MongoDB Lacks Multi-Document ACID Transaction Guarantees

**The mistake:** Believing MongoDB supports only eventual consistency without multi-document transactions.

**Why it's wrong:** MongoDB 4.0+ added multi-document ACID transactions across replica sets and sharded clusters. Single-document operations have always been atomic.

*Incorrect:*
```javascript
// Assuming multi-document ACID transactions are impossible in MongoDB
```

*Fix:*
```javascript
Use client sessions and withTransaction() for multi-document ACID operations
```

### Mistake 3: Using Multi-Document Transactions for Single-Document Embedded Schema Updates

**The mistake:** Wrapping single-document `$set` updates in explicit multi-document ACID transaction sessions.

**Why it's wrong:** Single-document updates are natively atomic in MongoDB without transactions. Wrapping single-document updates in transactions adds un-necessary performance latency.

*Incorrect:*
```javascript
const session = client.startSession(); session.startTransaction(); await db.users.updateOne(..., { session }); // ❌ Unnecessary transaction for single doc!
```

*Fix:*
```javascript
await db.users.updateOne(...); // Single-document updates are natively atomic
```

## 6. Practice Exercises

### Exercise 1: Paradigm Classification

**Problem:** Classify the following application features as requiring either **ACID** or **BASE** models:
1.  A global user billing ledger that transfers balances between accounts.
2.  A social media page tracking "views" and "likes" metrics on video clips.
3.  A flight ticket booking checkout system where seats are reserved.

**Expected output:**
> [!check]- Answer
> ```text
> 1. ACID: Balance transfers require strict all-or-nothing atomicity and immediate consistency to prevent double-spending or money loss.
> 2. BASE: Views and likes counters can drift (soft state) and sync later (eventual consistency) without impacting user experience, prioritizing write throughput over strict balance.
> 3. ACID: Reservation checkouts require immediate consistency to prevent double-booking the same physical seat.
> ```
> - Determine if temporary data drift has negative financial or business consequences.
> - Relate double-booking risks to strict isolation needs.

---



### Exercise 2: ACID vs BASE Guarantees Comparison

**Problem:** State difference: ACID (Atomicity, Consistency, Isolation, Durability for transactions); BASE (Basically Available, Soft-state, Eventual consistency for distributed scaling).

**Expected output:**
> [!check]- Answer
> ```text
> ACID guarantees strict transactional isolation; BASE favors distributed availability and eventual consistency
> ```
> ```text
> ACID guarantees strict transactional isolation; BASE favors distributed availability and eventual consistency
> ```
>
> **Explanation:** MongoDB provides ACID transactions within sessions while supporting BASE replica availability.

---

### Exercise 3: Single-Document Atomicity Guarantee

**Problem:** Are updates modifying multiple array elements in a single document atomic? (Yes, single-document updates are strictly atomic).

**Expected output:**
> [!check]- Answer
> ```text
> Yes, single-document updates are strictly atomic
> ```
> ```text
> Yes, single-document updates are strictly atomic
> ```
>
> **Explanation:** All field and array modifications within a single BSON document execute atomically.

## 7. Related Terms
- [Multi-Document Transaction](multi_document_transaction.md) — MongoDB's ACID engine.
- [Replica Set](../level_09/replica_set.md) — The distributed nodes.

---

## 8. Key Takeaways
- ACID enforces immediate consistency; BASE accepts eventual consistency.
- ACID is relational standard; BASE is distributed NoSQL standard.
- Basically Available (BA) guarantees database response uptime.
- Soft State (S) allows data versions to drift temporarily.
- Eventual Consistency (E) ensures nodes synchronize once log lag clears.
- MongoDB bridges both models, allowing developers to choose per-query.
- Enforce ACID in MongoDB using transactions and majority write/read concerns.
