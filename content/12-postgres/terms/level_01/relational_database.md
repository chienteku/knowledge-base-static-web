# Relational Database

> **Level 1 — What Is a Database?**
> A database model that organizes data into structured tables (relations) of rows and columns, enforcing links (relationships) between those tables using unique keys.

---

## 1. Prerequisites
- [Database](database.md) — Why databases exist in software architecture.

---

## 2. Term Category
- **Core Architecture Concept**

---

## 3. Environment Context
- **Universal standard** (The dominant database model for the last 40 years. Relational algebra rules govern how storage engines combine tables).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In 1970, an IBM computer scientist named Edgar F. Codd published a revolutionary paper proposing the **Relational Model**. Before this, databases were structured as nested trees or networks, which were slow to search and hard to modify.

Codd's relational database model solved a major data design problem: **Data Duplication (Redundancy)**.

Imagine building an e-commerce store:
-   If you store orders in a single flat file, you must write the customer's full name, shipping address, and email on *every single order row* they place.
-   If the customer changes their email, you must search your entire dataset and update hundreds of order records. If the server crashes mid-update, you end up with out-of-sync customer records.

A **Relational Database** organizes data into clean, separate tables (called *relations*):
-   One table for `users`.
-   One table for `orders`.

Instead of duplicating the user's details on the order rows, you assign each user a unique ID. 

The `orders` table simply stores the user's ID to reference their profile. 

If a user edits their email, you change it in exactly **one place** (the `users` table), and every order instantly references the correct, updated email.

---

### (2) Reality Metaphor
Imagine managing a school:
-   **NoSQL (Document-based)** is like giving every student a physical folder. Inside the folder, you copy the classroom schedule, the teacher's profile, and the textbook list. If a teacher changes classrooms, you must go open every student's folder and manually update the room number.
-   **Relational Database** is like keeping three separate master sheets: `Students`, `Classes`, and `Teachers`. The `Students` sheet simply points to a Class ID. The `Classes` sheet points to a Teacher ID. If a teacher changes rooms, you update the room number on the `Teachers` sheet once. Every student's schedule is automatically updated because their folders point to that master sheet.

---

### (3) Code Examples

#### Creating Related Tables
In SQL, we define relations using foreign keys to link table rows together:

```sql
-- 1. Create the parent Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);

-- 2. Create the child Orders table that links back to Users
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_date DATE,
  user_id INTEGER,
  -- Establish the relational link
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Querying Across Relations (JOIN)
We combine these related tables on-the-fly using the `JOIN` command:

```sql
SELECT users.name, orders.order_date
FROM orders
JOIN users ON orders.user_id = users.id;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Simulating relationships using comma-separated text strings

**The mistake:** Storing a list of related IDs as a text string inside a single column, rather than creating proper relational rows:

```sql
-- BAD: Do not store arrays/comma lists to link tables!
-- It makes searches, validation, and updates nearly impossible.
INSERT INTO orders (id, item_ids) VALUES (101, '5,12,34'); 
```

**Why it's wrong:** Storing comma-separated lists defeats the entire purpose of a relational database. The database engine cannot verify if item `12` actually exists, cannot index individual elements in the string, and cannot run fast mathematical combinations on them.

**Fix: Create a separate link table (often called a join table or intersection table) where each link is represented by a clean, indexed row.**

---



### Mistake 2: Storing Un-Normalized Multi-Value CSV Strings inside Relational Columns

**The mistake:** Storing tags as comma-separated string `'tech,coding,sql'` inside a single `tags` column.

**Why it's wrong:** Storing CSV strings violates First Normal Form (1NF), making indexing, filtering, and JOIN queries inefficient. Use child junction tables, arrays, or JSONB types.

*Incorrect:*
```sql
INSERT INTO posts (tags) VALUES ('tech,coding,sql'); -- ❌ Violates 1NF!
```

*Fix:*
```sql
Use child table post_tags (post_id, tag_id) or PostgreSQL native TEXT[] arrays
```

### Mistake 3: Omitting Primary Key Constraints on Relational Tables

**The mistake:** Creating relational tables without primary key columns.

**Why it's wrong:** Tables without primary keys permit duplicate rows, breaking row identity integrity and hindering replication engines.

*Incorrect:*
```sql
CREATE TABLE users ( name TEXT ); -- ❌ Missing primary key!
```

*Fix:*
```sql
CREATE TABLE users ( id SERIAL PRIMARY KEY, name TEXT );
```

## 6. Practice Exercises

### Exercise 1: Redundancy Audit

**Problem:** You are designing a database for a blog. The blog has "Articles" and "Authors". If you store the author's bio inside the `articles` table next to every article title, what two problems will happen when the author updates their bio?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Data Inconsistency (Out-of-sync bios): If you fail to update the bio on every single article row the author wrote (or if the server crashes mid-update), some articles will show the old bio and others will show the new bio.
> 2. Wasted Disk Storage: You are storing the exact same paragraph of text multiple times across your database disk drive, which increases storage costs.
> ```
> - Think about what happens if an author writes 500 articles and updates their bio text.
> - Consider the physical disk space utilized when text blocks are copied repeatedly.

---



### Exercise 2: Relational Data Model Core Components

**Problem:** List 3 core structural components of Relational Database systems (Tables, Columns, Rows/Tuples).

**Expected output:**
> [!check]- Answer
> ```text
> Tables, Columns, Rows/Tuples
> ```
> ```text
> Tables, Columns, Rows/Tuples
> ```
>
> **Explanation:** Relational databases structure data into tabular relations of columns and rows.

---

### Exercise 3: Referential Integrity Definition

**Problem:** What mechanism enforces valid relationships between relational tables? (Foreign Key constraints).

**Expected output:**
> [!check]- Answer
> ```text
> Foreign Key constraints
> ```
> ```text
> Foreign Key constraints
> ```
>
> **Explanation:** Foreign keys guarantee referential integrity between parent and child table records.

## 7. Related Terms
- [Table (Relation)](table.md) — The core storage grid.
- [Row (Record / Tuple)](row.md) — The horizontal database entry.
- [Column (Field / Attribute)](column.md) — The vertical data category.

---

## 8. Key Takeaways
- Relational databases organize data into separate tables to eliminate redundancy.
- They link tables together using matching key attributes (IDs).
- Links are validated by the database engine (preventing broken references).
- You combine separate tables on-the-fly inside queries using the `JOIN` statement.
- Avoid storing lists of IDs in a single text column; use link tables instead.
