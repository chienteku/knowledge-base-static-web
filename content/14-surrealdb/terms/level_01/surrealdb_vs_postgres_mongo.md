# SurrealDB vs. PostgreSQL vs. MongoDB

> **Level 1 — What Is SurrealDB?**
> The three-way database comparison guide, mapping when to use SurrealDB (multi-model, real-time graph relationships, browser-to-db connections), PostgreSQL (mature relational tables, invoicing, enterprise compliance), and MongoDB (mature document storage, horizontal scale).

---

## 1. Prerequisites

- [SurrealDB](surrealdb.md) — The Rust multi-model engine.
- [Database](../../../12-postgres/terms/level_01/database.md) — Relational structures.
- [Database (MongoDB Context)](../../../13-mongodb/terms/level_01/database_context.md) — Document structures.

---

## 2. Term Category


**Core Concept (relational vs document vs multi-model comparison)**: - **Database Theory / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
No single database is perfect for every project. 

As a developer who knows PostgreSQL (SQL) and MongoDB (NoSQL), you need to understand where SurrealDB fits:
-   Is it just another SQL database? No.
-   Is it just another NoSQL document store? No.
-   Is it a replacement for both? Occasionally, but not always.

We study this three-way comparison to understand the trade-offs. 

By analyzing the data structure, relationship mechanics, scaling capabilities, and ecosystem maturity, you can select the correct database architecture for your business requirements.

---

### (2) The Three-Way Decision Matrix

| Dimension | PostgreSQL (Relational) | MongoDB (Document) | SurrealDB (Multi-Model) |
| :--- | :--- | :--- | :--- |
| **Paradigm** | Pure Relational (SQL) | Pure Document (NoSQL) | Multi-Model (Relational, Document, Graph) |
| **Data Shape** | Flat rows and columns | Nested BSON documents | Nested JSON records |
| **Relationships** | Foreign Keys (requires JOINs) | References (requires `$lookup`) | **Record Links** & Graph arrows (`->`) |
| **Real-time** | Basic (`LISTEN`/`NOTIFY`) | Event polling (Change Streams) | **Native Live Queries** (`LIVE SELECT`) |
| **Browser Access**| Impossible (needs backend API) | Impossible (needs backend API) | **Natively Supported** (via JWT & row permissions) |
| **Maturity** | **Ultra-Mature** (35+ years) | **Mature** (15+ years) | **Young** (Launched 2021/2022) |

---

### (3) Selection Guidelines — "When do I choose which?"

#### 1. Choose SurrealDB when:
-   **Highly Connected Data:** You are building social feeds, recommendation engines, or permission systems where data points connect in complex networks.
-   **Real-time Features:** Your app needs live, collaborative data feeds (like Google Docs or live maps) that push updates instantly to clients.
-   **Direct Web Architecture:** You want to build a Serverless or lightweight app where the frontend connects directly to the database, skipping the backend API wrapper layer.
-   **Unified Prototyping:** You need tables, documents, and graphs together and want a single engine to manage them.

#### 2. Choose PostgreSQL when:
-   **Critical Billing/Financials:** Ledgers, accounting, or billing directories where data must be strictly normalized and database-level constraint safety is critical.
-   **Ecosystem & Compliance:** You need mature ORMs (Prisma), compliance standards, or database administrators who have managed servers for decades.

#### 3. Choose MongoDB when:
-   **Unstructured Big Data:** Storing huge volumes of unstructured log collections, catalogs, or telemetry records.
-   **Horizontal Sharding Scale:** You require proven cloud-scale document sharding (using MongoDB Atlas) to store terabytes of records.

---

### (4) Reality Metaphor (Transportation Systems)
-   **PostgreSQL (Bullet Train):** Runs on solid steel tracks, has tight schedules, and is extremely reliable for shipping massive cargo loads. However, it cannot turn off the tracks. (Tabular structure, rigid schemas).
-   **MongoDB (Cargo Truck Fleet):** You load items of any shape inside the trailer, drive on any road, and easily add more trucks to the fleet to scale. But if the boxes inside are connected by wires, untangling them is slow. (Document files, horizontal sharding).
-   **SurrealDB (Amphibious ATV Hovercraft):** Glides over tracks, drives over swamps, and floats across lakes. It tackles any terrain instantly. However, it's a newer vehicle model with fewer certified mechanics. (Multi-model flexibility).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Migrating a mature, enterprise PostgreSQL billing application to SurrealDB simply because "SurrealDB is new and cool," ignoring ecosystem maturity

**The mistake:** Rewriting a production company accounting ledger in SurrealDB, assuming it will run faster, without checking for mature tool support.

**Why it's wrong:** Accounting ledgers require absolute schema validation and mature audit tools. 

PostgreSQL has 35 years of optimization, rock-solid transactions compliance, and thousands of monitoring plugins. 

Migrating to a younger database engine (like SurrealDB) exposes your core invoicing system to minor version bugs and lacks mature financial modeling libraries.

**Fix: Keep business-critical billing, accounting, and normalized relational modules in PostgreSQL. Use SurrealDB for real-time dashboards, user networks, document catalogs, or rapid prototype MVP features.**

---



### Mistake 2: Using SQL JOIN Syntaxes in Place of Arrow Traversal Paths

**The mistake:** Attempting to write complex SQL `INNER JOIN` queries in SurrealDB.

**Why it's wrong:** SurrealDB uses record links and arrow operators (`->`) for constant-time graph traversal, eliminating slow relational JOIN scans.

*Incorrect:*
```surrealql
-- Expecting SQL JOIN syntax
SELECT * FROM user JOIN post ON user.id = post.user_id; // ❌ Non-idiomatic!
```

*Fix:*
```surrealql
-- Native SurrealDB Record Link traversal
SELECT name, ->wrote->post.title AS posts FROM user:alice;
```

### Mistake 3: Using MongoDB `$lookup` Pipelines Instead of Record Link Fetches

**The mistake:** Writing complex nested aggregation pipelines to fetch linked documents.

**Why it's wrong:** SurrealDB Record Links store direct pointers. Use the `FETCH` clause or arrow dereferencing to expand linked records in a single line.

*Incorrect:*
```surrealql
-- MongoDB style lookup emulation
SELECT * FROM post; // Followed by separate manual queries
```

*Fix:*
```surrealql
-- SurrealDB FETCH clause
SELECT * FROM post FETCH author;
```

## 5. Practice Exercises

### Exercise 1: Comprehensive Database Feature Comparison

**Scenario:**
You are preparing a technical decision record comparing PostgreSQL, MongoDB, and SurrealDB across key database architectural dimensions.

**Requirements:**
1. Compare relationship handling across PostgreSQL (Foreign Keys), MongoDB (ObjectId references / embedding), and SurrealDB (Record Links & Graph Edges).
2. Compare real-time event capability across PostgreSQL (`LISTEN`/`NOTIFY`), MongoDB (Change Streams), and SurrealDB (`LIVE SELECT`).
3. Compare client architecture across PostgreSQL/MongoDB (Backend API required) and SurrealDB (Direct Browser WebSocket with RLS).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Dimensional Architectural Matrix:
> 
> - Relationships:
>    - PostgreSQL: Foreign Key constraints + JOIN query tables.
>    - MongoDB: Manual ObjectId references + $lookup aggregations or document embedding.
>    - SurrealDB: Direct Record Links (record<table>) + Graph Edges (RELATE a->edge->b).
> 
> - Real-Time Streaming:
>    - PostgreSQL: LISTEN / NOTIFY (requires custom trigger payloads).
>    - MongoDB: Change Streams (requires replica set oplog).
>    - SurrealDB: LIVE SELECT (built-in live WebSocket query subscriptions).
> 
> - Application Architecture:
>    - PostgreSQL & MongoDB: Require intermediate backend API servers (Express, FastAPI) for client queries.
>    - SurrealDB: Web clients can query database directly over WebSockets using built-in DEFINE ACCESS & PERMISSIONS.
> ```
>
> #### Technical Explanation
>
> 1. Record links eliminate foreign key indexes and join table maintenance overhead.
> 2. Built-in `LIVE SELECT` turns SurrealDB into a real-time reactive database engine out of the box.
> 3. Row-level security permissions allow direct web-to-database connections, reducing backend boilerplate code.

---

### Exercise 2: Selecting the Right Database for the Job

**Scenario:**
Evaluate 3 different software project scenarios and recommend whether to use PostgreSQL, MongoDB, or SurrealDB based on technical requirements.

**Requirements:**
1. Project A: A legacy enterprise ERP system requiring 25 years of strict SQL compliance and heavy reporting ORM ecosystem support.
2. Project B: A simple content management system storing unstructured blog posts with no graph connections or real-time requirements.
3. Project C: A real-time collaborative Figma-like web app needing instant live updates, user social graphs, document state, and direct browser connections.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Project A Recommendation: PostgreSQL (Battle-tested legacy SQL compliance, mature ORM tools).
> Project B Recommendation: MongoDB or PostgreSQL (Simple document store with minimal relational complexity).
> Project C Recommendation: SurrealDB (Native live queries, graph arrows, document payloads, direct browser RLS).
> ```
>
> #### Technical Explanation
>
> 1. Single-model legacy workloads benefit from PostgreSQL's 30+ years of ecosystem stability.
> 2. Simple document workloads are well-supported by established document databases like MongoDB.
> 3. Complex multi-model real-time web applications gain massive architectural velocity from SurrealDB's unified model.

---

### Exercise 3: Performance & Scalability Trade-offs

**Scenario:**
Compare the scalability mechanisms of PostgreSQL, MongoDB, and SurrealDB for high-throughput scaling.

**Requirements:**
1. Describe how PostgreSQL scales (vertical scaling, read replicas, sharding extensions like Citus).
2. Describe how MongoDB scales (native sharded clusters with mongos routers).
3. Describe how SurrealDB scales (stateless compute nodes scaling over distributed TiKV key-value storage).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Scalability Comparison:
> - PostgreSQL: Primarily vertical scaling; horizontal write sharding requires complex extensions (Citus).
> - MongoDB: Native horizontal sharding via mongos query routers and shard replica sets.
> - SurrealDB: Decouples compute from storage; stateless query nodes scale horizontally over distributed TiKV.
> ```
>
> #### Technical Explanation
>
> 1. Decoupling compute and storage allows SurrealDB to scale query execution nodes independently from physical storage nodes.
> 2. Pluggable storage engines enable SurrealDB to run embedded in RAM or scale horizontally over TiKV.
> 3. Provides modern cloud-native scalability without sacrificing multi-model query features.

---



## 6. Related Terms

- [SurrealDB](surrealdb.md) — The parent database engine.
- [Multi-Model Database](multi_model_database.md) — The parent paradigm concept.

---

## 7. Key Takeaways
- PostgreSQL represents the relational standard; MongoDB represents the document standard.
- SurrealDB integrates relational, document, and graph paradigms into one engine.
- SurrealQL uses arrow paths (`->`) to traverse relationships, avoiding SQL JOINs.
- SurrealDB supports direct client-to-database connections; SQL/Mongo require APIs.
- Use PostgreSQL for financial databases and enterprise compliance.
- Choose MongoDB for high-volume unstructured logs and horizontal sharding.
- Choose SurrealDB for connected graph data, real-time sync, and rapid MVPs.
- SurrealDB is younger; verify ecosystem tool support before deploying.
