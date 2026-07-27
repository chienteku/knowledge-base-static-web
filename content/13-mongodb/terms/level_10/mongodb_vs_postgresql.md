# MongoDB vs. PostgreSQL — When to Choose Which

> **Level 10 — Administration, Security & Advanced Features**
> The ultimate database selection comparison guide, analyzing the architectural trade-offs between PostgreSQL (relational, normalized tables) and MongoDB (document-oriented, denormalized BSON) to guide system design decisions.

---

## 1. Prerequisites
- [Database (Concept - PostgreSQL)](../../../12-postgres/terms/level_01/database.md) — Relational paradigm.
- [Database Context (MongoDB)](../level_01/database_context.md) — Document paradigm.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Core system design trade-offs evaluated during backend application planning and database selection phases).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A common junior developer mistake is asking: *"Which database is better: MongoDB or PostgreSQL?"*

This is the wrong question. 

Databases are built to solve different problems:
-   PostgreSQL prioritizes relational integrity, strict rules, and complex calculations across tables.
-   MongoDB prioritizes schema flexibility, rapid development, and horizontal scaling.

Choosing the wrong database for a project leads to massive technical debt:
-   If you choose MongoDB for highly relational financial ledgers, you waste months writing custom join validation code in Node.js.
-   If you choose PostgreSQL for an app that stores changing polymorphic catalogs, you waste weeks running migrators and writing complex JSON column converters.

We study this comparison to choose the correct tool for the job.

---

### (2) Architectural Comparison Matrix

| Sizing Dimension | PostgreSQL (Relational) | MongoDB (Document-Oriented) |
| :--- | :--- | :--- |
| **Core Storage Unit** | **Table Rows & Columns** | **BSON Documents** (Nested JSON) |
| **Data Relationships** | **Joins & Foreign Keys** (Normalized) | **Embedded Subdocuments** (Denormalized) |
| **Schema Strictness** | **Fixed Schema** (Rigid DDL columns) | **Dynamic Schema** (Flexible fields) |
| **Primary Scaling Strategy**| **Vertical Scaling** (Bigger VM) | **Horizontal Scaling** (Sharding / Clusters) |
| **Referential Integrity** | Enforced natively by database engine | Enforced by application code / ODM |
| **Join Performance** | **Fast** (Compiled C-level index hops) | **Slower** (`$lookup` aggregation loops) |

---

### (3) Selection Guidelines — "When do I choose which?"

#### Choose PostgreSQL if:
1.  **Strict Relations:** Your data is highly structured, and everything connects to everything else (e.g. users have accounts, which have transactions, which have audits).
2.  **Financial Transactions:** You are building accounting, billing, or ledger systems requiring strict database-level constraints to prevent duplicate writes or broken states.
3.  **Complex Joins:** Your primary query patterns require frequently joining data from 4 or 5 tables to compute reports.

#### Choose MongoDB if:
1.  **Polymorphic Data:** Documents have different shapes and properties (e.g. a product catalog where clothing has size/color, while electronics have voltage/ports).
2.  **Rapid Iteration:** You are building a startup MVP where product requirements and database schemas change weekly.
3.  **Horizontal Scale:** You expect to store terabytes of data or need to handle massive write volumes that exceed single-server capacities.
4.  **Nested Data:** Your data maps naturally to nested structures (e.g. posts containing arrays of comments and likes).

---

### (4) Reality Metaphor (City Planning)
-   **PostgreSQL (Planned Grid City):** Every house must fit exactly on a square plot, conform to height zoning rules, and connect to structured utility lines (foreign keys). 
    -   It is neat and organized, but adding a new garage requires city building permit approvals and modifications. (Strict, reliable schema).
-   **MongoDB (Custom Eco-Village):** Each resident builds a house that fits their specific needs. 
    -   One builds a dome house, another builds a treehouse (polymorphic documents). 
    -   If a house needs a guest room, the owner simply builds it without asking permission. 
    -   If the village runs out of space, it expands into the forest (horizontal scaling).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Choosing MongoDB because "NoSQL is faster and easier," only to write complex, nested '$lookup' join pipelines on normalized collections in your code

**The mistake:** Sharding your collections but normalizing user data as if it were a SQL database, resulting in queries that merge 4 different collections using `$lookup` stages.

**Why it's wrong:** MongoDB is optimized for **nested read operations**. 

Performing multi-collection joins via `$lookup` in aggregation pipelines requires scanning foreign collection indexes over the network. 

If your queries frequently rely on joins, your application will run significantly slower than it would in PostgreSQL, which performs joins at compiled hardware speed.

**Fix: If your database requires normalization and frequent joins, use PostgreSQL. If you use MongoDB, design your data model to embed nested details (denormalization) to avoid joins.**

---



### Mistake 2: Choosing PostgreSQL for Unstructured Dynamic Documents without Considering JSONB Maintenance

**The mistake:** Choosing PostgreSQL JSONB for schemas containing 100% dynamic nested objects with heavy multi-field indexing needs.

**Why it's wrong:** While PostgreSQL supports JSONB columns, MongoDB provides native document query expressions, flexible indexing, and horizontal sharding.

*Incorrect:*
```javascript
// Forcing multi-field dynamic document workloads into relational tables
```

*Fix:*
```javascript
Use MongoDB for document-native workloads requiring flexible schema and sharding
```

### Mistake 3: Choosing MongoDB for 50-Table Deeply Normalized SQL Relational Schemas

**The mistake:** Selecting MongoDB for financial accounting systems requiring 50-table 3NF joins.

**Why it's wrong:** Relational SQL databases (PostgreSQL) excel at complex multi-table normalized joins and strict foreign key integrity constraints.

*Incorrect:*
```javascript
// Forcing 50-table normalized SQL schema into document collections
```

*Fix:*
```javascript
Use PostgreSQL for deeply normalized 3NF relational data architectures
```

## 6. Practice Exercises

### Exercise 1: Database Selection Advisor

**Problem:** You are the Lead Architect for three software projects. 
Recommend the optimal database (**PostgreSQL** or **MongoDB**) for each requirement, and justify your choice:
1.  A global social networking feed app where users post status updates containing nested comments, tags, and media links.
2.  An inventory management ERP system for a car manufacturer tracking parts, sub-assemblies, suppliers, invoices, and accounting balances.
3.  A modern IoT dashboard logging telemetry streams from 100,000 devices.

**Expected output:**
```text
1. MongoDB: The feed data maps naturally to document trees (nested comments, tags, media arrays). It avoids complex SQL joins and allows rapid updates as post types evolve.
2. PostgreSQL: Car inventory is highly relational (parts lead to assemblies which tie to suppliers and billing ledgers). Strict constraints, foreign keys, and immediate consistency are required to prevent double-spending or inventory mismatch bugs.
3. MongoDB (or Time-Series): High write throughput from 100,000 devices scales horizontally using MongoDB sharding, and metrics fit column-based chronological compression models.
```

> [!check]- Answer
> - Assess if the data structures are hierarchical or tabular.
> - Consider the importance of strict constraints and foreign keys for inventory calculations.

---



### Exercise 2: MongoDB vs PostgreSQL Architectural Comparison

**Problem:** Compare: MongoDB (Document BSON, Schema-flexible, Native Sharding), PostgreSQL (Relational SQL, Strict 3NF, JSONB support).

**Expected output:**
```text
MongoDB: document-oriented native sharding; PostgreSQL: relational SQL strict normalization
```

> [!check]- Answer
> ```text
> MongoDB: document-oriented native sharding; PostgreSQL: relational SQL strict normalization
> ```
>
> **Explanation:** Paradigm selection depends on relational normalization vs document co-location requirements.

### Exercise 3: Horizontal Scaling Comparison

**Problem:** How does MongoDB scale out write throughput horizontally vs PostgreSQL? (Native Sharding across cluster shards).

**Expected output:**
```text
MongoDB natively shards collections across multi-node clusters
```

> [!check]- Answer
> ```text
> MongoDB natively shards collections across multi-node clusters
> ```
>
> **Explanation:** MongoDB includes built-in sharding routers and config servers for horizontal scaling.

## 7. Related Terms
- [Database (Concept - PostgreSQL)](../../../12-postgres/terms/level_01/database.md) — Relational paradigm.
- [Database Context (MongoDB)](../level_01/database_context.md) — Document paradigm.

---

## 8. Key Takeaways
- PostgreSQL uses normalized tables; MongoDB uses denormalized documents.
- PostgreSQL enforces schemas strictly; MongoDB allows dynamic BSON shapes.
- PostgreSQL scales vertically; MongoDB scales horizontally via sharding.
- Choose PostgreSQL for highly relational data and financial ledgers.
- Choose MongoDB for polymorphic data, rapid prototyping, and heavy write scales.
- MongoDB performs joins using `$lookup` aggregation pipelines, which is slower.
- Denormalize data in MongoDB to optimize queries and avoid joins.
- Use Mongoose ODM in Node.js to bring schema structure to MongoDB development.
