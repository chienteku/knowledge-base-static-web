# SurrealDB vs. PostgreSQL vs. MongoDB

> **Level 1 — What Is SurrealDB?**
> The three-way database comparison guide, mapping when to use SurrealDB (multi-model, real-time graph relationships, browser-to-db connections), PostgreSQL (mature relational tables, invoicing, enterprise compliance), and MongoDB (mature document storage, horizontal scale).

---

## 1. Prerequisites
- [SurrealDB](surrealdb.md) — The Rust multi-model engine.
- [Database (Concept - PostgreSQL)](../../../12-postgres/terms/level_01/database.md) — Relational structures.
- [Database Context (MongoDB)](../../../13-mongodb/terms/level_01/database_context.md) — Document structures.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Core system design comparison matrix. Used by software engineers to select database technologies during project planning).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Technology Matchmaker

**Problem:** Recommend the optimal database (**PostgreSQL**, **MongoDB**, or **SurrealDB**) for these application scenarios:
1.  A medical records SaaS where clinics need to define custom fields dynamically per clinic, and patients need to subscribe to real-time doctor location updates.
2.  A government tax database processing millions of financial records containing strict tax-bracket calculation checks.
3.  A static logging database storing 50 million server request logs per day for archival purposes.

**Expected output:**
> [!check]- Answer
> ```text
> 1. SurrealDB: Toggles between SCHEMALESS and SCHEMAFULL schema modes dynamically, and natively supports real-time Live Queries (WebSockets) for doctor locations.
> 2. PostgreSQL: Enforces strict data constraints and transactional integrity natively, which is critical for government tax audits.
> 3. MongoDB: A mature document database with robust indexing and compression for large log archives.
> ```
> - Match real-time updates and schema flexibility to the target engine strengths.
> - Consider which database has the most mature transactional auditing tools.

---



### Exercise 2: Database Engine Comparison Matrix

**Problem:** Identify database engine supporting: 1. Native Graph Arrows (SurrealDB), 2. Traditional Relational JOINs (Postgres), 3. BSON Documents ($lookup) (MongoDB).

**Expected output:**
> [!check]- Answer
> ```text
> 1. SurrealDB, 2. PostgreSQL, 3. MongoDB
> ```
> ```text
> 1. SurrealDB, 2. PostgreSQL, 3. MongoDB
> ```
>
> **Explanation:** SurrealDB merges relational and document models with native graph arrows.

---

### Exercise 3: Real-Time Query Comparison

**Problem:** How does SurrealDB `LIVE SELECT` differ from MongoDB Change Streams or Postgres LISTEN/NOTIFY?

**Expected output:**
> [!check]- Answer
> ```text
> LIVE SELECT pushes live record diff updates directly over WebSockets filtered by SurrealQL WHERE clauses
> ```
> ```text
> LIVE SELECT pushes live record diff updates directly over WebSockets filtered by SurrealQL WHERE clauses
> ```
>
> **Explanation:** `LIVE SELECT` provides query-level real-time subscription push events.

## 7. Related Terms
- [SurrealDB](surrealdb.md) — The parent database engine.
- [Multi-Model Database](multi_model_database.md) — The parent paradigm concept.

---

## 8. Key Takeaways
- PostgreSQL represents the relational standard; MongoDB represents the document standard.
- SurrealDB integrates relational, document, and graph paradigms into one engine.
- SurrealQL uses arrow paths (`->`) to traverse relationships, avoiding SQL JOINs.
- SurrealDB supports direct client-to-database connections; SQL/Mongo require APIs.
- Use PostgreSQL for financial databases and enterprise compliance.
- Choose MongoDB for high-volume unstructured logs and horizontal sharding.
- Choose SurrealDB for connected graph data, real-time sync, and rapid MVPs.
- SurrealDB is younger; verify ecosystem tool support before deploying.
