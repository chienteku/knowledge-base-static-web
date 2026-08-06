# Functional Dependency

> **Level 6 — Schema Design & Normalization**
> The mathematical relationship between columns in a table where the value of one column (or set of columns) uniquely determines the value of another column, written as $X \rightarrow Y$.

---

## 1. Prerequisites
- [Normalization](normalization.md) — The schema cleanup process that uses dependencies to split tables.

---

## 2. Term Category

**Core Concept** (Attribute Determination Relationship): Functional Dependency ($X ightarrow Y$) describes a relationship where the value of column set $X$ uniquely determines the value of column set $Y$.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (A fundamental mathematical concept in relational algebra used to define database normalization rules).

### (1) Design Motivation — "Why did we design this?"
Before you can apply the rules of database normalization (1NF, 2NF, 3NF), you need a precise mathematical language to describe how columns relate to each other.

If you inspect a student database, you observe that:
-   If you know a student's ID (`student_id`), you can find their exact email address. There is only one email address per student ID.
-   If you know a student's name (`student_name`), you cannot be certain of their email, because two different students named "John Smith" will have different emails.

We designed the concept of **Functional Dependency** to describe these rules.

We write:
$$X \rightarrow Y$$
(Read: *"X functionally determines Y"*, or *"Y is functionally dependent on X"*).

This means that if two rows in a table have the same value for column $X$, they **must** have the exact same value for column $Y$.

By identifying these mathematical dependencies in your data, you can logically determine where table schemas are broken, and how to split them up to prevent anomalies.

---

### (2) Keys and Functional Dependencies
By definition, the **Primary Key** of a table functionally determines every other column in that table. If `id` is the primary key of a `users` table:
$$\text{id} \rightarrow \text{username, email, date\_of\_birth}$$

---

### (3) Types of Dependencies (Prerequisites for Normalization)

#### 1. Full Functional Dependency
An attribute $Y$ is fully dependent on a composite set of attributes $X$ if it depends on the *entirety* of $X$, and cannot be determined by any smaller subset of $X$. (Critical for **2NF**).

#### 2. Transitive Dependency
A transitive dependency occurs when column $A$ determines column $B$, and column $B$ determines column $C$. Indirectly, column $A$ determines column $C$ through $B$:
$$A \rightarrow B \quad \text{and} \quad B \rightarrow C \quad \implies \quad A \rightarrow C$$
(Critical for **3NF**).

---

### (4) Reality Metaphor
Imagine a university student portal:
-   **Locker ID $\rightarrow$ Combo Code:** If you look up Locker `45` (X), the database shows a single, unique lock combination code (Y). Locker `45` will never have two different combination codes.
-   **Locker ID does not functionally determine Student Name:** Student Alice might rent locker `45` in the morning and locker `80` in the afternoon. Knowing Locker `45` does not determine a single student name because different students rent it over the semesters.

---

### (5) Dependency Mapping Examples

Assume we have an unnormalized table:
`enrollments (student_id, course_id, student_name, grade)`

The functional dependencies are:

1.  **`student_id` $\rightarrow$ `student_name`**
    -   (Knowing the ID uniquely determines the name. This is a *partial dependency* because it only depends on part of the primary key).
2.  **`(student_id, course_id)` $\rightarrow$ `grade`**
    -   (A grade belongs to a specific student in a specific course. You need *both* columns to determine the grade. This is a *full dependency*).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing functional dependencies with database index settings

**The mistake:** Thinking you have to run a SQL command to "activate" a functional dependency.

**Why it's wrong:** Functional dependencies are real-world business facts, not database configurations. They represent how your business data operates. The database engine does not know that `zip_code` determines `city_name` until you normalize the schema and write constraints to enforce it.

**Fix: Analyze your business rules, write down your functional dependencies on paper, and use them to design tables that match normal forms.**

---



### Mistake 2: Assuming Non-Key Columns Depend on the Whole Primary Key in Composite Keys

**The mistake:** Including `store_location` in table `(store_id, product_id, store_location)`.

**Why it's wrong:** `store_location` depends ONLY on `store_id`, NOT on `product_id`! This partial functional dependency violates Second Normal Form (2NF).

*Incorrect:*
```sql
// Including store_location in (store_id, product_id) table
```

*Fix:*
```sql
Move store_location to separate stores table: stores (store_id, store_location)
```

### Mistake 3: Ignoring Transitive Functional Dependencies ($A 
ightarrow B 
ightarrow C$)

**The mistake:** Storing `zip_code` and `city_name` in `users` table when `zip_code` functionally determines `city_name`.

**Why it's wrong:** Transitive dependencies ($user\_id 
ightarrow zip\_code 
ightarrow city\_name$) violate 3NF, creating update anomalies when city names change. Move zip lookup to a `zip_codes` table.

*Incorrect:*
```sql
// Storing zip_code and city_name in users table
```

*Fix:*
```sql
Move zip mapping to zip_codes table: zip_codes (zip_code, city_name)
```

## 5. Practice Exercises

### Exercise 1: Identifying Functional Dependencies in Schema Data

**Scenario:**
Analyze functional dependencies ($X ightarrow Y$) in a `course_registrations` table: `student_id -> student_name`, `course_id -> course_title`.

**Requirements:**
1. Identify primary key determinants and partial dependencies.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Functional Dependency Analysis:
> - Composite Primary Key: (student_id, course_id)
> - Dependency 1: (student_id, course_id) -> grade (Full Dependency)
> - Dependency 2: student_id -> student_name (Partial Dependency: depends ONLY on part of PK!)
> - Dependency 3: course_id -> course_title (Partial Dependency: depends ONLY on part of PK!)
> ```
>
> #### Technical Explanation
>
> 1. A Functional Dependency $X ightarrow Y$ means given value $X$, value $Y$ is uniquely determined.
> 2. Partial dependencies (where non-key columns depend on part of a composite primary key) violate 2NF.
> 3. Theoretical foundation for database normalization algorithms.

---

### Exercise 2: Resolving Partial Dependencies to Achieve 2NF

**Scenario:**
Decompose `course_registrations` to eliminate partial dependencies and achieve Second Normal Form (2NF).

**Requirements:**
1. Create `students`, `courses`, and `enrollments` tables.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE students (
>   id INTEGER PRIMARY KEY,
>   student_name TEXT NOT NULL
> );
> 
> CREATE TABLE courses (
>   id INTEGER PRIMARY KEY,
>   course_title TEXT NOT NULL
> );
> 
> CREATE TABLE enrollments (
>   student_id INTEGER REFERENCES students(id),
>   course_id INTEGER REFERENCES courses(id),
>   grade TEXT,
>   PRIMARY KEY (student_id, course_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Decomposing tables separates independent functional dependencies into dedicated tables.
> 2. Guarantees all non-key attributes in `enrollments` (`grade`) depend on the FULL composite primary key.
> 3. Achieves 2NF compliance.

---

### Exercise 3: Identifying Transitive Dependencies for 3NF

**Scenario:**
Identify transitive dependency `zip_code -> city` in table `addresses(id, street, zip_code, city)`.

**Requirements:**
1. Explain transitive dependency $id ightarrow zip\_code ightarrow city$.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Transitive Dependency Analysis:
> - Primary Key: id
> - Dependency 1: id -> zip_code
> - Dependency 2: zip_code -> city
> - Transitive Link: id -> city via zip_code (Violates 3NF!)
> Solution: Move (zip_code, city) into a separate 'zip_codes' lookup table.
> ```
>
> #### Technical Explanation
>
> 1. Transitive dependencies occur when a non-key column depends on another non-key column.
> 2. Violates 3NF and causes update anomalies if a city name changes.
> 3. Core concept of 3NF schema decomposition.

---



## 6. Related Terms
- [Normalization](normalization.md) — The parent organization process.
- [First Normal Form (1NF)](first_normal_form.md) — The atomic standard.

---

## 7. Key Takeaways
- Functional Dependency describes how column values determine other column values.
- Written as $X \rightarrow Y$ (X uniquely determines the value in Y).
- Primary keys functionally determine all other columns in their table.
- Full dependency requires all columns of a composite key to determine a value.
- Transitive dependency maps indirect relationships ($A \rightarrow B \rightarrow C$).
- Use dependency mapping to find and fix database schema anomalies.
