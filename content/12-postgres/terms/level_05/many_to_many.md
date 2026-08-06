# Many-to-Many Relationship

> **Level 5 — Table Relationships & JOINs**
> A relationship pattern where multiple rows in Table A can relate to multiple rows in Table B, and vice versa, requiring a third "junction" table to bridge the connection.

---

## 1. Prerequisites
- [One-to-Many Relationship](one_to_many.md) — The single-direction parent-child default pattern.

---

## 2. Term Category

**Schema Design** (Bi-Directional Association Pattern): A Many-to-Many relationship allows multiple records in one table to associate with multiple records in another table via a intermediary junction table.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all relational databases. Modeled using primary-to-foreign key mappings across a bridge index).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Modeling Many-to-Many Relationships

**Scenario:**
Model a Many-to-Many association between `posts` and `tags` using a `post_tags` junction table.

**Requirements:**
1. Create `posts`, `tags`, and `post_tags` tables.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE posts (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   title TEXT NOT NULL
> );
> 
> CREATE TABLE tags (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   name TEXT NOT NULL UNIQUE
> );
> 
> CREATE TABLE post_tags (
>   post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
>   tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
>   PRIMARY KEY (post_id, tag_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Many-to-Many relationships cannot be stored directly in relational columns without violating First Normal Form (1NF).
> 2. `post_tags` junction table links post IDs to tag IDs.
> 3. Primary key `(post_id, tag_id)` prevents duplicate tag assignments.

---

### Exercise 2: Inserting Rows across Many-to-Many Associations

**Scenario:**
Associate post `id = 1` with tags `'sql'` (id = 5) and `'postgres'` (id = 8).

**Requirements:**
1. Execute `INSERT INTO post_tags (post_id, tag_id) VALUES (1, 5), (1, 8)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO post_tags (post_id, tag_id) 
> VALUES 
>   (1, 5),
>   (1, 8);
> ```
>
> #### Technical Explanation
>
> 1. Inserts association pairs into the junction table.
> 2. Enforces foreign key checks against `posts` and `tags`.
> 3. Multi-row insertion pattern.

---

### Exercise 3: Querying Tagged Entities with `STRING_AGG`

**Scenario:**
Query all posts alongside a comma-separated string list of their assigned tags.

**Requirements:**
1. Use `STRING_AGG(t.name, ', ')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   p.id, 
>   p.title, 
>   STRING_AGG(t.name, ', ' ORDER BY t.name ASC) AS tag_list 
> FROM posts AS p 
> LEFT JOIN post_tags AS pt ON p.id = pt.post_id 
> LEFT JOIN tags AS t ON pt.tag_id = t.id 
> GROUP BY p.id, p.title;
> ```
>
> #### Technical Explanation
>
> 1. `STRING_AGG(expression, delimiter)` concatenates grouped string values.
> 2. Groups tags by post ID.
> 3. Returns formatted tag string lists (`"postgres, sql"`).

---



## 6. Related Terms
- [One-to-Many Relationship](one_to_many.md) — The single-direction default pattern.
- [Junction Table (Bridge / Pivot Table)](junction_table.md) — The physical implementation table.

---

## 7. Key Takeaways
- Many-to-Many links multiple rows in Table A to multiple rows in Table B.
- Cannot be implemented with a single foreign key inside the parent tables.
- Requires creating a third, separate table called a "Junction Table."
- Storing list values as comma-separated text arrays slows search speeds.
- The junction table splits M:N links into two clean One-to-Many relations.
