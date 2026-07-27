# Normalization

> **Level 6 — Schema Design & Normalization**
> The systematic design process of organizing database tables to minimize data redundancy, eliminate structural duplicates, and prevent database anomalies.

---

## 1. Prerequisites
- [Entity-Relationship Diagram (ERD)](erd.md) — Visual schema blueprints.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (A core database design theory applied across all relational SQL systems during the schema mapping phase).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When designing a database schema, it is tempting to create one giant table containing everything (similar to an Excel spreadsheet). For example, a `store_sales` table:

| order_id | customer_name | customer_email | product_name | price |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Alice | alice@example.com | Keyboard | 50.00 |
| 2 | Alice | alice@example.com | Mouse | 25.00 |

While simple to query, this unnormalized table suffers from three severe design flaws called **Database Anomalies**:

1.  **Update Anomalies:** If Alice changes her email address, you must find and update every single order row she has ever placed. If you miss one row, your database becomes inconsistent, containing conflicting emails for the same user.
2.  **Insertion Anomalies:** You cannot save a new customer's email in the database until they place their first order. The database forbids registering users without transaction records.
3.  **Deletion Anomalies:** If you delete Order 2 (because it was refunded), but it was the only order Alice had placed, you accidentally delete Alice's entire account registration and email from your company files.

We designed **Normalization** to prevent these anomalies. 

It is a step-by-step mathematical method that guides you to break large, bloated tables down into smaller, focused tables, and link them using foreign keys.

---

### (2) The Normal Forms (NF)
Normalization is divided into levels called **Normal Forms**. 

Each level has specific rules, and you must satisfy the rules of the previous level before moving to the next:

-   **First Normal Form (1NF):** Eliminates duplicate groups and ensures data cells are atomic.
-   **Second Normal Form (2NF):** Meets 1NF, and eliminates partial dependencies.
-   **Third Normal Form (3NF):** Meets 2NF, and eliminates transitive dependencies.

*Note: In production software systems, reaching **3NF** is the standard target for clean schema design.*

---

### (3) Reality Metaphor
Imagine organizing a household closet:
-   **Unnormalized:** You throw shirts, shoes, socks, and wet winter jackets into one massive pile in the middle of the room. It is easy to throw items in, but finding matching socks takes hours, and the wet jackets ruin the shirts.
-   **Normalized:** You install hangers for shirts, racks for shoes, and drawer dividers for socks. Every item has its own dedicated home. You can find, update, or discard items without affecting the rest of the closet.

---

### (4) Code Examples

#### The Normalized Resolution (3NF)
We solve the spreadsheet anomalies by normalization, dividing the columns into three clean tables:

```sql
-- 1. Focuses strictly on customers
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Focuses strictly on products
CREATE TABLE products (
  id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

-- 3. Focuses strictly on orders, linking tables via foreign keys
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  product_id INT REFERENCES products(id),
  order_date DATE DEFAULT CURRENT_DATE
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Over-normalizing schemas beyond practical business needs

**The mistake:** Splitting tables into so many tiny fragments that even simple lookups (like loading a user's address) require joining 8 separate tables.

**Why it's wrong:** While mathematically pure, every `JOIN` query requires the database engine to search indexes and merge data in memory. Over-normalizing degrades database performance, spikes CPU usage, and makes writing SQL queries extremely complex for developers.

**Fix: Aim for Third Normal Form (3NF) as your standard target. Only split tables if they suffer from clear update anomalies or redundancy.**

---



### Mistake 2: Over-Normalizing High-Throughput Read-Heavy Datasets Causing 10-Table JOIN Queries

**The mistake:** Normalizing every single attribute into separate lookup tables, forcing 10-table JOINs for simple profile views.

**Why it's wrong:** Extreme normalization increases read query latency. Balance 3NF normalization against application query access patterns.

*Incorrect:*
```sql
// 10-table JOIN query for basic user profile rendering
```

*Fix:*
```sql
Maintain pragmatic 3NF or denormalize measured read bottlenecks
```

### Mistake 3: Under-Normalizing Mutating Data Fields Causing Update Anomalies

**The mistake:** Duplicating customer address across 1,000 order rows without a normalized customer table.

**Why it's wrong:** When a customer updates their address, updating 1,000 order rows risks data inconsistency if an update fails halfway (Update Anomaly).

*Incorrect:*
```sql
// Duplicating customer address in every order row
```

*Fix:*
```sql
Store customer address in normalized customers table
```

## 6. Practice Exercises

### Exercise 1: Anomaly Auditing

**Problem:** You have a table:
`courses (course_id, course_title, instructor_name, instructor_office_phone)`
Identify:
1.  The anomaly that occurs if you delete a course, but the instructor still works at the school.
2.  The anomaly that occurs if the instructor moves to a new office room.

**Expected output:**
```text
1. Deletion Anomaly (deleting the course wipes out the instructor's office phone record from the database).
2. Update Anomaly (you have to locate and update the phone number in multiple rows if the instructor teaches multiple courses, risking inconsistent data).
```

> [!check]- Answer
> - Differentiate what data is lost when deleting top-level nodes.
> - Consider the effort required to update shared attributes across rows.

---



### Exercise 2: Normal Forms Progression List

**Problem:** List 3 standard Normal Forms in database design (1NF: atomic values; 2NF: no partial dependencies; 3NF: no transitive dependencies).

**Expected output:**
```text
1NF (atomic values), 2NF (no partial dependencies), 3NF (no transitive dependencies)
```

> [!check]- Answer
> ```text
> 1NF (atomic values), 2NF (no partial dependencies), 3NF (no transitive dependencies)
> ```
>
> **Explanation:** Normal forms eliminate data redundancy and prevent update/delete anomalies.

### Exercise 3: Goal of Relational Normalization

**Problem:** What is the primary goal of relational database normalization? (Eliminates data redundancy and update anomalies).

**Expected output:**
```text
Eliminates data redundancy and update/delete anomalies
```

> [!check]- Answer
> ```text
> Eliminates data redundancy and update/delete anomalies
> ```
>
> **Explanation:** Normalization organizes attributes to guarantee data integrity across table updates.

## 7. Related Terms
- [Functional Dependency](functional_dependency.md) — The prerequisite math concept behind normal forms.
- [First Normal Form (1NF)](first_normal_form.md) — The atomic data standard.

---

## 8. Key Takeaways
- Normalization minimizes database data redundancy and prevents write anomalies.
- Prevents update, insertion, and deletion anomalies.
- Progresses through mathematical checks called Normal Forms (1NF, 2NF, 3NF).
- Resolves anomalies by splitting large tables and linking them with keys.
- Third Normal Form (3NF) is the industry standard for production database design.
- Avoid over-normalizing to protect database query and join performance.
