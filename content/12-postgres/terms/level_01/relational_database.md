# Relational Database

> **Level 1 — What Is a Database?**
> A database model that organizes data into structured tables (relations) of rows and columns, enforcing links (relationships) between those tables using unique keys.

---

## 1. Prerequisites
- [Database](database.md) — Why databases exist in software architecture.

---

## 2. Term Category

**Core Concept** (Relational Data Model): A Relational Database organizes data into structured tables (relations) of rows and columns with enforced foreign key links and ACID transactional guarantees.



---

## 3. Explanation

### Environment Context
- **Universal standard** (The dominant database model for the last 40 years. Relational algebra rules govern how storage engines combine tables).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Modeling Relational 1-to-Many Associations

**Scenario:**
Model a 1-to-Many relationship between `customers` and `invoices` using primary and foreign keys.

**Requirements:**
1. Create `customers` table.
2. Create `invoices` table referencing `customers(id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE customers (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   company_name TEXT NOT NULL
> );
> 
> CREATE TABLE invoices (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   customer_id INTEGER NOT NULL,
>   amount_cents INTEGER NOT NULL,
>   CONSTRAINT fk_invoices_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Relational database modeling links entities via explicit primary key to foreign key relationships.
> 2. `invoices.customer_id` establishes referential association to parent `customers.id`.
> 3. Foreign key constraints reject orphan invoice inserts with invalid `customer_id` values.
> 
---

### Exercise 2: Enforcing Referential Integrity on Deletes

**Scenario:**
Configure foreign key constraint behavior to prevent deleting a `customer` row if active `invoices` exist (`ON DELETE RESTRICT`).

**Requirements:**
1. Add `CONSTRAINT fk_invoices_customer_id FOREIGN KEY ... ON DELETE RESTRICT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE invoices 
> DROP CONSTRAINT fk_invoices_customer_id;
> 
> ALTER TABLE invoices 
> ADD CONSTRAINT fk_invoices_customer_id 
> FOREIGN KEY (customer_id) REFERENCES customers(id) 
> ON DELETE RESTRICT;
> ```
>
> #### Technical Explanation
>
> 1. `ON DELETE RESTRICT` raises a SQL error if an application attempts to delete a parent customer row that has child invoices.
> 2. Protects historical accounting data from accidental orphan deletion.
> 3. Enforces business domain integrity.
> 
---

### Exercise 3: Eliminating Data Redundancy through Normalization

**Scenario:**
Demonstrate normalized relational design by separating duplicated customer address data into a distinct `addresses` table.

**Requirements:**
1. Create normalized `addresses` table.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE addresses (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   street TEXT NOT NULL,
>   city TEXT NOT NULL,
>   state TEXT NOT NULL,
>   postal_code TEXT NOT NULL
> );
> 
> ALTER TABLE customers 
> ADD COLUMN address_id INTEGER REFERENCES addresses(id);
> ```
>
> #### Technical Explanation
>
> 1. Normalization eliminates duplicate data entries across rows.
> 2. Shared address records update in a single location, maintaining database consistency.
> 3. Core principle of relational database architecture.
> 
---



## 6. Related Terms
- [Table (Relation)](table.md) — The core storage grid.
- [Row (Record / Tuple)](row.md) — The horizontal database entry.
- [Column (Field / Attribute)](column.md) — The vertical data category.
- [Database](database.md) — Related concept: Database.
- [PostgreSQL (Postgres)](postgresql.md) — Related concept: PostgreSQL (Postgres).
- [SQL (Structured Query Language)](sql.md) — SQL query language.

---

## 7. Key Takeaways
- Relational databases organize data into separate tables to eliminate redundancy.
- They link tables together using matching key attributes (IDs).
- Links are validated by the database engine (preventing broken references).
- You combine separate tables on-the-fly inside queries using the `JOIN` statement.
- Avoid storing lists of IDs in a single text column; use link tables instead.
