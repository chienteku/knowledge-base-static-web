# NoSQL Databases (Overview)

> **Level 1 — What Is a Document Database?**
> A broad category of database management systems that store, retrieve, and model data using structures other than traditional relational tables, optimized for horizontal scalability and schema flexibility.

---

## 1. Prerequisites
- None (This is the introductory concept of the NoSQL curriculum).

---

## 2. Term Category
- **Database Architecture / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (A conceptual categorization in computer science, contrasting with Relational Database Management Systems (RDBMS) like PostgreSQL).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: NoSQL Family Matching

**Problem:** Match the application feature to the most appropriate **NoSQL database type** (Document, Key-Value, Column-Family, Graph):
1.  Caching user session tokens in RAM for sub-millisecond retrieval on page reloads.
2.  Mapping a social network showing who is "friends" with whom, and which posts they liked.
3.  Storing a product catalog for an e-commerce store where shoes have sizes, laptops have RAM specs, and books have page counts.

**Expected output:**
```text
1. Key-Value (e.g. Redis) - Optimized for simple, ultra-fast key lookups.
2. Graph (e.g. Neo4j) - Optimized for traversing relationships and network connections.
3. Document (e.g. MongoDB) - Optimized for flexible schemas containing nested, variable fields.
```

> [!check]- Answer
> - Consider which database specializes in maps/connections.
> - Think about where nested JSON arrays fit best.

---



### Exercise 2: NoSQL Database Families Categorization

**Problem:** List 4 primary families of NoSQL databases (Document, Key-Value, Wide-Column, Graph).

**Expected output:**
```text
Document, Key-Value, Wide-Column, Graph
```

> [!check]- Answer
> ```text
> Document, Key-Value, Wide-Column, Graph
> ```
>
> **Explanation:** NoSQL databases fall into document, key-value, wide-column, and graph paradigms.

### Exercise 3: BASE vs ACID Guarantees

**Problem:** What does BASE stand for in distributed NoSQL systems? (Basically Available, Soft-state, Eventual consistency).

**Expected output:**
```text
Basically Available, Soft-state, Eventual consistency
```

> [!check]- Answer
> ```text
> Basically Available, Soft-state, Eventual consistency
> ```
>
> **Explanation:** BASE describes high-availability eventual consistency models in distributed databases.

## 7. Related Terms
- [MongoDB](mongodb.md) — The document database implementation.
- [Document vs. Relational Model](document_vs_relational.md) — Comparing SQL and NoSQL paradigms.

---

## 8. Key Takeaways
- NoSQL databases store data in formats other than strict relational tables.
- Designed to support horizontal scaling, high write speeds, and flexible schemas.
- Document, Key-Value, Column-Family, and Graph are the four main families.
- Not a replacement for SQL; both paradigms represent engineering trade-offs.
- SQL defaults to strict consistency (ACID); NoSQL defaults to speed and flexibility.
- Select database paradigms based on data structure and transactional requirements.
