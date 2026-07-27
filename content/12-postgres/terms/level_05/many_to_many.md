# Many-to-Many Relationship

> **Level 5 — Table Relationships & JOINs**
> A relationship pattern where multiple rows in Table A can relate to multiple rows in Table B, and vice versa, requiring a third "junction" table to bridge the connection.

---

## 1. Prerequisites
- [One-to-Many Relationship](one_to_many.md) — The single-direction parent-child default pattern.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported in all relational databases. Modeled using primary-to-foreign key mappings across a bridge index).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database design, you frequently encounter entities that associate bidirectionally on a multiple basis:
-   **Students and Courses:** A student can enroll in multiple courses (e.g. math, history), and a course contains multiple students.
-   **Articles and Tags:** An article can carry multiple tags (e.g. `#tech`, `#cooking`), and a tag references multiple articles.
-   **Products and Orders:** An order can contain multiple different products, and a product can be sold on multiple separate customer orders.

How do you implement this in SQL?
-   If you put a `course_id` foreign key in the `students` table, a student can only take one course.
-   If you put a `student_id` foreign key in the `courses` table, a course can only have one student.
-   If you try to store a comma-separated list of IDs as text (e.g. `'101,102,105'`), you violate basic relational structures, making searching or deleting individual links extremely slow and complex.

We designed the **Many-to-Many (M:N)** pattern to solve this structural limit. 

You **never** store connection keys inside the parent tables themselves. 

Instead, you decouple them by creating a third, separate table called a **Junction Table** (or Pivot Table). 

This junction table breaks the many-to-many relationship down into **two separate One-to-Many relationships**, preserving data integrity.

---

### (2) Reality Metaphor
Imagine a university enrolling system:
-   The registrar maintains a drawer of **Student Files** (Table A) and a drawer of **Course Classrooms** (Table B).
-   To trace enrollments, they do not write student names on classroom chalkboards, nor do they write class times on student library cards.
-   Instead, they keep a separate drawer in the center of the office containing **Enrollment Slips** (The Junction Table).
-   Each slip is a tiny card containing exactly two fields: `Student ID` and `Course ID`.
-   If Student 1 takes Course A, they write a slip: `(1, A)`. If Student 1 also takes Course B, they write a second slip: `(1, B)`.
-   The central slips drawer acts as the bridge connecting both collections.

---

### (3) Code Examples

#### The Conceptual Schema Layout

Assume we want to relate articles and tags:

**Table 1: `articles` (Parent)**
| id | title |
| :--- | :--- |
| **10** | Intro to SQL |
| **11** | Postgres Basics |

**Table 2: `tags` (Parent)**
| id | tag_name |
| :--- | :--- |
| **50** | #database |
| **51** | #coding |

**Table 3: `article_tags` (Junction Table)**
| article_id | tag_id |
| :--- | :--- |
| **10** (Intro to SQL) | **50** (#database) |
| **10** (Intro to SQL) | **51** (#coding) |
| **11** (Postgres Basics) | **50** (#database) |

*(Note: How to build this junction table in SQL is covered in detail in the next term: [Junction Table](junction_table.md)).*

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to avoid a junction table by using text arrays inside a single column

**The mistake:** Creating an `articles` table with a column like `tags TEXT` and storing tags as a comma-separated list: `'tech,coding,database'`.

**Why it's wrong:** This violates **First Normal Form (1NF)** (the rule that each column cell must hold atomic, indivisible values). If you want to rename tag `'coding'` to `'programming'`, you have to run a complex text replacement search across all rows on disk. If you want to find all articles tagged with `'database'`, you cannot use standard database indexes, making queries very slow.

**Fix: Always use a junction table to resolve many-to-many relationships.**

---



### Mistake 2: Attempting to Model Many-to-Many Relationships Without a Junction Table

**The mistake:** Storing arrays or CSV strings `'1,2,3'` inside parent entity tables to represent Many-to-Many links.

**Why it's wrong:** Storing CSV strings or array columns breaks 1NF normalization, hindering referential integrity checks and foreign key constraints.

*Incorrect:*
```sql
CREATE TABLE students ( courses_csv TEXT ); -- ❌ Un-normalized Many-to-Many!
```

*Fix:*
```sql
Use a dedicated junction table: student_courses (student_id, course_id)
```

### Mistake 3: Omitting `ON DELETE CASCADE` on Junction Table Foreign Keys

**The mistake:** Creating junction table foreign keys without `ON DELETE CASCADE`.

**Why it's wrong:** Deleting a student or course entity fails if junction table rows exist. Add `ON DELETE CASCADE` to junction foreign keys.

*Incorrect:*
```sql
student_id INT REFERENCES students(id) -- ❌ Blocks parent entity deletion!
```

*Fix:*
```sql
student_id INT REFERENCES students(id) ON DELETE CASCADE
```



### Mistake 4: Attempting to Model Many-to-Many Relationships Without a Junction Table

**The mistake:** Storing arrays or CSV strings `'1,2,3'` inside parent entity tables to represent Many-to-Many links.

**Why it's wrong:** Storing CSV strings or array columns breaks 1NF normalization, hindering referential integrity checks and foreign key constraints.

*Incorrect:*
```sql
CREATE TABLE students ( courses_csv TEXT ); -- ❌ Un-normalized Many-to-Many!
```

*Fix:*
```sql
Use a dedicated junction table: student_courses (student_id, course_id)
```

### Mistake 5: Omitting `ON DELETE CASCADE` on Junction Table Foreign Keys

**The mistake:** Creating junction table foreign keys without `ON DELETE CASCADE`.

**Why it's wrong:** Deleting a student or course entity fails if junction table rows exist. Add `ON DELETE CASCADE` to junction foreign keys.

*Incorrect:*
```sql
student_id INT REFERENCES students(id) -- ❌ Blocks parent entity deletion!
```

*Fix:*
```sql
student_id INT REFERENCES students(id) ON DELETE CASCADE
```

## 6. Practice Exercises

### Exercise 1: Real-World Relationship Audit

**Problem:** You are building a system for a medical clinic. You have two tables: `doctors` and `patients`. A doctor treats many patients. A patient can see multiple different specialized doctors.
1.  What type of relationship is this?
2.  How many tables are required to model this database relationship in SQL?

**Expected output:**
```text
1. Many-to-Many Relationship (M:N).
2. 3 tables (doctors, patients, and a junction table to map the visits).
```

> [!check]- Answer
> - Check if doctor-patient assignments are strictly one-to-one or if they cross over.
> - Decouple assignments by counting parent tables vs connection tables.

---



### Exercise 2: Modeling Many-to-Many Relationship

**Problem:** Create 3 tables for Many-to-Many relationship between `articles` and `tags` using junction table `article_tags`.

**Expected output:**
```text
CREATE TABLE articles ( id SERIAL PRIMARY KEY, title TEXT ); CREATE TABLE tags ( id SERIAL PRIMARY KEY, name TEXT ); CREATE TABLE article_tags ( article_id INT REFERENCES articles(id) ON DELETE CASCADE, tag_id INT REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (article_id, tag_id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE articles ( id SERIAL PRIMARY KEY, title TEXT );
> CREATE TABLE tags ( id SERIAL PRIMARY KEY, name TEXT );
> CREATE TABLE article_tags (
>   article_id INT REFERENCES articles(id) ON DELETE CASCADE,
>   tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
>   PRIMARY KEY (article_id, tag_id)
> );
> ```
>
> **Explanation:** Junction tables model Many-to-Many relationships using foreign key pairs.

### Exercise 3: Deleting Junction Entries

**Problem:** Remove tag `tag_id = 5` from article `article_id = 10`.

**Expected output:**
```text
DELETE FROM article_tags WHERE article_id = 10 AND tag_id = 5;
```

> [!check]- Answer
> ```sql
> DELETE FROM article_tags WHERE article_id = 10 AND tag_id = 5;
> ```
>
> **Explanation:** Deleting rows from junction tables severs Many-to-Many relationships cleanly.



### Exercise 4: Modeling Many-to-Many Relationship

**Problem:** Create 3 tables for Many-to-Many relationship between `articles` and `tags` using junction table `article_tags`.

**Expected output:**
```text
CREATE TABLE articles ( id SERIAL PRIMARY KEY, title TEXT ); CREATE TABLE tags ( id SERIAL PRIMARY KEY, name TEXT ); CREATE TABLE article_tags ( article_id INT REFERENCES articles(id) ON DELETE CASCADE, tag_id INT REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (article_id, tag_id) );
```

> [!check]- Answer
> ```sql
> CREATE TABLE articles ( id SERIAL PRIMARY KEY, title TEXT );
> CREATE TABLE tags ( id SERIAL PRIMARY KEY, name TEXT );
> CREATE TABLE article_tags (
>   article_id INT REFERENCES articles(id) ON DELETE CASCADE,
>   tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
>   PRIMARY KEY (article_id, tag_id)
> );
> ```
>
> **Explanation:** Junction tables model Many-to-Many relationships using foreign key pairs.

### Exercise 5: Deleting Junction Entries

**Problem:** Remove tag `tag_id = 5` from article `article_id = 10`.

**Expected output:**
```text
DELETE FROM article_tags WHERE article_id = 10 AND tag_id = 5;
```

> [!check]- Answer
> ```sql
> DELETE FROM article_tags WHERE article_id = 10 AND tag_id = 5;
> ```
>
> **Explanation:** Deleting rows from junction tables severs Many-to-Many relationships cleanly.

## 7. Related Terms
- [One-to-Many Relationship](one_to_many.md) — The single-direction default pattern.
- [Junction Table (Bridge / Pivot Table)](junction_table.md) — The physical implementation table.

---

## 8. Key Takeaways
- Many-to-Many links multiple rows in Table A to multiple rows in Table B.
- Cannot be implemented with a single foreign key inside the parent tables.
- Requires creating a third, separate table called a "Junction Table."
- Storing list values as comma-separated text arrays slows search speeds.
- The junction table splits M:N links into two clean One-to-Many relations.
