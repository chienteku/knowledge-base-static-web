# NoSQL Databases (Overview)

> **Level 1 — What Is a Document Database?**
> A broad category of database management systems that store, retrieve, and model data using structures other than traditional relational tables, optimized for horizontal scalability and schema flexibility.

---

## 1. Prerequisites

- None!

---

## 2. Term Category

**Core Concept** (Non-Relational Paradigm): NoSQL Databases represent a class of non-relational storage engines optimized for flexible schemas, horizontal partition scaling, and high write throughput.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (A conceptual categorization in computer science, contrasting with Relational Database Management Systems (RDBMS) like PostgreSQL).

### (1) Design Motivation — "Why did we design this?"
For decades, relational databases (SQL) dominated software development. 

They store data in strict, tabular grids (tables, rows, columns) and use relationships to link tables. 

However, as modern web applications grew, developers encountered three major bottlenecks:

1.  **Strict Schemas:** In SQL, you must define column types upfront. Changing a schema on a massive table in production requires running migrations that can lock tables and cause downtime.
2.  **Horizontal Scale Limits:** SQL databases are designed to scale **vertically** (buying a bigger, more expensive server). Scaling **horizontally** (distributing data across 100 cheap servers) is highly complex due to strict relational join requirements.
3.  **Mismatched Code Models:** Modern programming languages represent data as objects (JSON). Translating these objects into flat SQL tables requires mapping code (ORMs), which introduces complexity.

We designed the **NoSQL** (originally meaning *"Non-Relational"*, now commonly defined as *"Not Only SQL"*) paradigm to bypass these limitations by storing data in formats optimized for specific application patterns.

---

### (2) The Four Core NoSQL Families

```text
       NoSQL DATABASE TYPES
  ┌─────────────────┬─────────────────┐
  │ 1. Document     │ 2. Key-Value    │
  │ (e.g. MongoDB)  │ (e.g. Redis)    │
  ├─────────────────┼─────────────────┤
  │ 3. Columnar     │ 4. Graph        │
  │ (e.g. Cassandra)│ (e.g. Neo4j)    │
  └─────────────────┴─────────────────┘
```

1.  **Document Databases:** Store data as flexible, self-contained documents (usually JSON or BSON). (Best for general web apps with dynamic properties).
2.  **Key-Value Stores:** Store data as simple key-value pairs, acting like a giant hash map in RAM. (Best for high-speed caching and sessions).
3.  **Column-Family (Wide-Column) Stores:** Store data in rows containing dynamic, sparse columns. (Best for massive write scaling across globally distributed clusters).
4.  **Graph Databases:** Store data as nodes (entities) and edges (relationships). (Best for social networks, fraud detection, and recommendation engines).

---

### (3) Reality Metaphor
Imagine organizing office supplies:
-   **Relational (SQL):** Storing items inside a rigid **sorting drawer organizer**. Every item must fit into its designated slot. If you buy a new stapler that is too wide, you must rebuild the physical drawer slots (schema migration).
-   **NoSQL Document:** Storing items inside **cardboard boxes**. One box holds a stapler, another holds a set of paperclips, another holds folders. You throw new items of any shape into the boxes without modifying the layout of the storage room.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming NoSQL is "better" than SQL and should always be used for new projects

**The mistake:** Abandoning PostgreSQL for a new project because you heard NoSQL is "modern" and scales better.

**Why it's wrong:** SQL and NoSQL are trade-offs. 

SQL databases are the gold standard for data consistency (ACID), financial ledgers, and complex queries involving many table links (joins). 

If you build a complex relational system in a NoSQL database, you will end up writing slow, manual joins in your application code, resulting in buggy code and slow performance.

**Fix: Select your database based on data architecture: use SQL for highly structured, relational transaction ledgers. Use NoSQL (like MongoDB) for hierarchical, dynamic, unstructured, or rapid-iteration datasets.**

---



### Mistake 2: Assuming All NoSQL Databases Share Identical Data Models and Query Syntaxes

**The mistake:** Treating MongoDB (Document), Cassandra (Columnar), Redis (Key-Value), and Neo4j (Graph) identically.

**Why it's wrong:** NoSQL is a broad umbrella term! Document stores, Key-Value stores, Wide-Column stores, and Graph databases have fundamentally different storage engines and use cases.

*Incorrect:*
```javascript
-- Expecting MongoDB queries to run on Redis or Cassandra
```

*Fix:*
```javascript
Select specific NoSQL database type based on query access patterns
```

### Mistake 3: Choosing NoSQL for Complex Multi-Record Financial Accounting Systems Needing Strict Schema Normalization

**The mistake:** Choosing NoSQL document databases when core requirements involve 50-table normalized relational schemas and strict ACID multi-table updates.

**Why it's wrong:** Relational SQL databases (PostgreSQL) excel at complex multi-table JOIN normalization and strict schema constraints.

*Incorrect:*
```javascript
-- Forcing multi-table relational accounting ledger into schema-less NoSQL
```

*Fix:*
```javascript
Use relational SQL databases when complex 3NF normalization is required
```

## 5. Practice Exercises

### Exercise 1: Categorizing NoSQL Database Types

**Scenario:**
Categorize the four primary NoSQL database architecture types and provide a representative technology for each.

**Requirements:**
1. List Document, Key-Value, Column-Family, and Graph types.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> NoSQL Architecture Types:
> - Document Database: MongoDB, Couchbase (Stores hierarchical BSON/JSON documents)
> - Key-Value Store: Redis, Memcached (High-speed in-memory key lookups)
> - Wide-Column Store: Apache Cassandra, ScyllaDB (High write throughput column families)
> - Graph Database: Neo4j, Amazon Neptune (Vertex and edge relationship networks)
> ```
>
> #### Technical Explanation
>
> 1. NoSQL databases trade off rigid SQL schemas for domain-specific performance optimizations.
> 2. Document databases excel at complex object modeling and content applications.
> 3. Polyglot persistence architectures combine multiple database types per service requirements.
> 
---

### Exercise 2: BASE Consistency vs ACID Guarantees

**Scenario:**
Explain the BASE (Basically Available, Soft-state, Eventual consistency) model used by distributed NoSQL systems compared to traditional ACID.

**Requirements:**
1. Contrast BASE eventual consistency against ACID strict serializability.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Consistency Models:
> - ACID: Strict immediate consistency across multi-table transactions (PostgreSQL).
> - BASE: High availability and horizontal scaling via eventual consistency across distributed nodes (NoSQL).
> ```
>
> #### Technical Explanation
>
> 1. BASE prioritizes horizontal availability and partition tolerance (CAP theorem).
> 2. Modern MongoDB supports single-document ACID by default and multi-document ACID transactions when needed.
> 3. Balances developer flexibility with transactional safety.
> 
---

### Exercise 3: Evaluating Polyglot Persistence Architecture

**Scenario:**
Design a polyglot storage architecture for an e-commerce platform using MongoDB and Redis together.

**Requirements:**
1. Use MongoDB for primary product catalog and order history.
2. Use Redis for volatile session token caching.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Storage Architecture:
> - MongoDB: Primary persistent storage for rich product documents and user order histories.
> - Redis: Volatile in-memory key-value cache for user session tokens and shopping cart TTLs.
> ```
>
> #### Technical Explanation
>
> 1. Combines the strengths of document databases (rich querying) and in-memory caches (sub-millisecond reads).
> 2. Optimizes infrastructure cost and response latency.
> 3. Standard architecture pattern for modern web applications.
> 
---



## 6. Related Terms

- [MongoDB](mongodb.md) — The document database implementation.
- [Document vs. Relational Model](document_vs_relational.md) — Comparing SQL and NoSQL paradigms.

---

## 7. Key Takeaways
- NoSQL databases store data in formats other than strict relational tables.
- Designed to support horizontal scaling, high write speeds, and flexible schemas.
- Document, Key-Value, Column-Family, and Graph are the four main families.
- Not a replacement for SQL; both paradigms represent engineering trade-offs.
- SQL defaults to strict consistency (ACID); NoSQL defaults to speed and flexibility.
- Select database paradigms based on data structure and transactional requirements.
