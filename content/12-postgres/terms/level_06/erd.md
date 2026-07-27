# Entity-Relationship Diagram (ERD)

> **Level 6 — Schema Design & Normalization**
> The visual database modeling blueprint used to represent tables (entities), columns (attributes), and table links (relationships) before writing SQL queries.

---

## 1. Prerequisites
- [Relational Database](../level_01/relational_database.md) — The relational structural philosophy.
- [Table (Relation)](../level_01/table.md) — The physical data containers.

---

## 2. Term Category
- **Database Design Tool / Methodology**

---

## 3. Environment Context
- **Visual / Architecture** (Executed during the design phase of database engineering. Saved as diagram assets or mapped using modeling tools like pgAdmin, dbdiagram.io, or draw.io).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before building a house, an architect drafts blueprints. They map out structural columns, walls, and plumbing lines. If they skip the blueprints and start building immediately, the house is highly likely to collapse.

Similarly, in database engineering, jumping straight into writing `CREATE TABLE` scripts is a major mistake. It leads to:
-   Circular references (Table A points to B, which points to A).
-   Duplicate columns across different tables.
-   Missing constraints, leading to data corruption.

We designed the **Entity-Relationship Diagram (ERD)** to serve as the structural blueprint for database schemas. 

It is a visual diagram that maps out:
-   **Entities:** The things you want to store data about (maps to **Tables**).
-   **Attributes:** The details describing those entities (maps to **Columns**).
-   **Relationships:** How the entities connect (maps to **Foreign Keys**).

Designing an ERD first ensures that your team agrees on the structure, relationships, and business rules of your application before a single line of SQL is written.

---

### (2) Cardinality and Crow's Foot Notation
ERD relationships use specialized symbols called **Crow's Foot Notation** to show the count rules (cardinality) of connections:

-   **`||` (One and Only One):** A row must connect to exactly one row.
-   **`|o` (Zero or One):** A row can connect to at most one row, but can be empty.
-   **`}|` (One or Many):** A row must connect to at least one row, but can connect to many.
-   **`}o` (Zero or Many):** A row can connect to any number of rows (including none).

---

### (3) Reality Metaphor
Imagine a university classroom map:
-   A floor blueprint shows **Rooms** (Entities).
-   Each room has attributes written on the door plate: `Room Number` and `Seating Capacity` (Attributes).
-   **Connecting Lines (Relationships):** Paths between rooms showing how students flow. A line might branch out like a fork (the Crow's Foot) pointing from a Lecture Hall to multiple Study cubicles, showing that one hall links to many study spaces.

---

### (4) Code Examples

#### Creating an ERD using Mermaid
You can generate visual ERD diagrams in Markdown using **Mermaid** blocks:

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "sold in"

    CUSTOMERS {
        int id PK
        string name
        string email
    }
    ORDERS {
        int id PK
        date order_date
        int customer_id FK
    }
    PRODUCTS {
        int id PK
        string title
        decimal price
    }
    ORDER_ITEMS {
        int order_id PK, FK
        int product_id PK, FK
        int quantity
    }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Designing databases "blindly" without mapping out an ERD first

**The mistake:** Drafting your application's table structures inside your backend code files as you write features, without creating a centralized design layout.

**Why it's wrong:** Without a visual map, it is easy to lose track of table keys. You will end up with mismatched data types (e.g. `user_id` as `INTEGER` in one table but `VARCHAR` in another) or write redundant tables, leading to major rewrite efforts later.

**Fix: Always draw an ERD (even a simple one on a whiteboard) before writing `CREATE TABLE` scripts.**

---



### Mistake 2: Failing to Represent Cardinality (1:1, 1:N, N:M) Clearly in ERD Diagrams

**The mistake:** Drawing entity relationships without specifying cardinality notation (crow's foot / numbers).

**Why it's wrong:** Unclear ERD cardinality leads to incorrect foreign key placements during physical DDL schema creation.

*Incorrect:*
```sql
// Drawing line between User and Order without crow's foot cardinality
```

*Fix:*
```sql
Use explicit Crow's Foot notation (1-to-Many, Many-to-Many) on relationship lines
```

### Mistake 3: Designing ERD Diagrams Based on UI Screens Instead of Real-World Entities

**The mistake:** Creating ERD entities representing individual UI form pages instead of domain entities.

**Why it's wrong:** UI designs change frequently. ERD diagrams MUST model real-world business entities and logical relationships.

*Incorrect:*
```sql
// Creating ERD table 'RegistrationFormPage'
```

*Fix:*
```sql
Model core domain entities (User, Account, Subscription)
```

## 6. Practice Exercises

### Exercise 1: Diagram Interpretation

**Problem:** Inspect the Mermaid diagram in Section 4. Describe:
1.  The relationship type between `CUSTOMERS` and `ORDERS`.
2.  Can an order exist without a customer matching it?
3.  The relationship type between `ORDERS` and `ORDER_ITEMS`.

**Expected output:**
```text
1. One-to-Many Relationship (one customer can place zero or many orders).
2. No. The double line `||` on the CUSTOMERS side of the relationship line indicates that every order must connect to exactly one customer.
3. One-to-Many Relationship (one order contains one or many order items).
```

> [!check]- Answer
> - Identify the symbols at the endpoints of the relationship connector lines.
> - Look for the crow's foot forks (`{`) and straight vertical bars (`|`).

---



### Exercise 2: ERD Cardinality Notation

**Problem:** Identify ERD cardinality: User has many Orders (1:N); Student has many Courses (N:M).

**Expected output:**
```text
User to Order: 1:N; Student to Course: N:M
```

> [!check]- Answer
> ```text
> User to Order: 1:N; Student to Course: N:M
> ```
>
> **Explanation:** ERD diagrams visualize entity relationship cardinalities before database physical implementation.

### Exercise 3: Conceptual vs Physical ERD

**Problem:** Compare: Conceptual ERD (High-level business entities); Physical ERD (Exact database tables, column types, foreign keys).

**Expected output:**
```text
Conceptual: business entities; Physical: database tables, column types, foreign keys
```

> [!check]- Answer
> ```text
> Conceptual: business entities; Physical: database tables, column types, foreign keys
> ```
>
> **Explanation:** Physical ERDs translate conceptual business models into concrete SQL DDL schemas.

## 7. Related Terms
- [Normalization](normalization.md) — The mathematical rules of schema structuring.
- [Junction Table (Bridge / Pivot Table)](../level_05/junction_table.md) — The physical resolution of M:N relationships in ERDs.

---

## 8. Key Takeaways
- An ERD is a visual blueprint mapping tables, columns, and relationships.
- Entities represent tables; Attributes represent columns.
- Crow's Foot notation details relationship cardinalities (1:1, 1:N, M:N).
- Helps teams find design flaws, circular references, and key type mismatches early.
- Always draft a database diagram before writing system SQL queries.
