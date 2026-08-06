# Normalization

> **Level 6 — Schema Design & Normalization**
> The systematic design process of organizing database tables to minimize data redundancy, eliminate structural duplicates, and prevent database anomalies.

---

## 1. Prerequisites
- [Entity-Relationship Diagram (ERD)](erd.md) — Visual schema blueprints.

---

## 2. Term Category

**Schema Design** (Redundancy Elimination Design Process): Database Normalization is a systematic schema design method (1NF, 2NF, 3NF) that eliminates data redundancy and prevents modification anomalies.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (A core database design theory applied across all relational SQL systems during the schema mapping phase).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Normalizing Un-Normalized Data Tables into 3NF

**Scenario:**
Normalize a flat spreadsheet-style `orders_flat` table storing customer and product data into 3NF (`customers`, `products`, `orders`, `order_items`).

**Requirements:**
1. Outline normalization steps from un-normalized -> 1NF -> 2NF -> 3NF.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> 4-Step Normalization Workflow:
> - Step 1: Un-Normalized: Single flat table with repeated customer and product columns.
> - Step 2: 1NF: Split multi-valued fields into distinct rows and add Primary Key.
> - Step 3: 2NF: Remove partial dependencies by splitting (Order + Product) items into 'order_items'.
> - Step 4: 3NF: Remove transitive dependencies by moving customer addresses to 'customers'.
> ```
>
> #### Technical Explanation
>
> 1. Normalization eliminates data redundancy across entities.
> 2. Prevents insertion, update, and deletion anomalies.
> 3. Foundation of enterprise relational database architecture.
> 
---

### Exercise 2: Identifying Modification Anomalies in Un-Normalized Schemas

**Scenario:**
Demonstrate insertion, update, and deletion anomalies on an un-normalized table storing customer addresses inside order rows.

**Requirements:**
1. Explain Insertion Anomaly, Update Anomaly, Deletion Anomaly.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Modification Anomaly Examples:
> - Insertion Anomaly: Cannot add a new customer without forcing them to create a dummy order first.
> - Update Anomaly: Changing a customer's address requires updating 500 historical order rows (risks partial updates).
> - Deletion Anomaly: Deleting a customer's only order accidentally deletes their customer record permanently.
> ```
>
> #### Technical Explanation
>
> 1. Anomalies occur when distinct business entities inhabit a single un-normalized table.
> 2. 3NF normalization isolates entities into dedicated tables, preventing all three anomaly types.
> 3. Ensures data integrity.
> 
---

### Exercise 3: Auditing Schemas for Third Normal Form Compliance

**Scenario:**
Audit table `invoices(id, customer_id, customer_email, total)` and refactor to satisfy 3NF.

**Requirements:**
1. Remove transitive dependency `customer_id -> customer_email`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- ❌ 3NF Violation: customer_email depends on customer_id (not invoices.id!)
> -- ALTER TABLE invoices ADD COLUMN customer_email TEXT;
> 
> -- ✅ 3NF Compliant: Fetch email via JOIN to customers table
> SELECT 
>   i.id AS invoice_id, 
>   c.email AS customer_email 
> FROM invoices AS i 
> JOIN customers AS c ON i.customer_id = c.id;
> ```
>
> #### Technical Explanation
>
> 1. In 3NF, all non-key attributes MUST depend "on the key, the whole key, and nothing but the key".
> 2. `customer_email` depends on `customer_id`, violating 3NF when placed in `invoices`.
> 3. Fetching attributes via `JOIN` maintains 3NF compliance.
> 
---



## 6. Related Terms
- [Functional Dependency](functional_dependency.md) — The prerequisite math concept behind normal forms.
- [First Normal Form (1NF)](first_normal_form.md) — The atomic data standard.
- [Entity-Relationship Diagram (ERD)](erd.md) — Related concept: Entity-Relationship Diagram (ERD).
- [Second Normal Form (2NF)](second_normal_form.md) — 2NF.
- [Third Normal Form (3NF)](third_normal_form.md) — 3NF.
- [Denormalization](denormalization.md) — Strategic denormalization.

---

## 7. Key Takeaways
- Normalization minimizes database data redundancy and prevents write anomalies.
- Prevents update, insertion, and deletion anomalies.
- Progresses through mathematical checks called Normal Forms (1NF, 2NF, 3NF).
- Resolves anomalies by splitting large tables and linking them with keys.
- Third Normal Form (3NF) is the industry standard for production database design.
- Avoid over-normalizing to protect database query and join performance.
