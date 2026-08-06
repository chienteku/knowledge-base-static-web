# Junction Table (Bridge / Pivot Table)

> **Level 5 — Table Relationships & JOINs**
> The physical database table that resolves a many-to-many relationship by storing foreign keys referencing the primary keys of the two related tables.

---

## 1. Prerequisites
- [Many-to-Many Relationship](many_to_many.md) — The logical relationship model.
- [`PRIMARY KEY`](../level_02/primary_key.md) — Standard unique row identifiers.

---

## 2. Term Category

**Schema Design** (Many-to-Many Association Table): A Junction Table (or join table) resolves a Many-to-Many relationship by storing pairs of foreign keys referencing two parent entity tables.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Serves as the standard structural bridge inside relational schemas).

### (1) Design Motivation — "Why did we design this?"
As learned in `many_to_many.md`, databases cannot link multiple rows on both sides using simple columns inside parent tables. 

We need a third physical table in the middle to store the connection pairs.

This table is called a **Junction Table** (or Bridge Table, Join Table, Pivot Table).

A junction table has a specific, optimized structure:
1.  It contains **two foreign key columns** pointing to the two parent tables.
2.  It uses a **Composite Primary Key** made by combining the two foreign key columns. This automatically prevents duplicate relationship rows (e.g., enrolling the same student in the same course twice).
3.  It can store **relationship-specific metadata**. For example, in a `student_courses` table, you can store a `grade` column or an `enrollment_date` timestamp. This metadata belongs to the *relationship itself*, not to the student alone or the course alone.

---

### (2) Why not use an auto-incrementing ID?
Many developers are tempted to put a standard `id SERIAL PRIMARY KEY` on every junction table. 

While this works, it is an anti-pattern. 

It wastes storage space and requires the database to maintain an unnecessary index. 

By defining the primary key as `PRIMARY KEY (student_id, course_id)`, you achieve two things in one step:
-   You guarantee that each student can only enroll in a course once.
-   You create a high-speed search index on the combination, optimizing lookup speeds when joining the tables.

---

### (3) Reality Metaphor
Imagine a company raffle:
-   **Employees** have tickets.
-   **Prizes** are displayed on the stage.
-   To link winners to prizes, the organizer writes matching entries on a **Raffle Ledger Sheet** (the Junction Table).
-   Each row on the sheet records: `Employee ID` and `Prize ID`.
-   The sheet can also contain a column for `Claim Date` (metadata).
-   No one gets a prize without an entry in the ledger sheet.

---

### (4) Code Examples

#### Creating a Junction Table in SQL
Let's build a many-to-many relationship mapping students and courses:

```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);

-- The Junction Table
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  
  -- Metadata columns
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  grade VARCHAR(2),
  
  -- Composite Primary Key enforces uniqueness of the combination
  PRIMARY KEY (student_id, course_id)
);
```

#### Preventative Rejection of Duplicates
```sql
INSERT INTO students (id, name) VALUES (1, 'Alice');
INSERT INTO courses (id, title) VALUES (10, 'History');

-- 1. Alice enrolls in History (succeeds)
INSERT INTO enrollments (student_id, course_id) VALUES (1, 10);

-- 2. Alice tries to enroll in History AGAIN (crashes!)
INSERT INTO enrollments (student_id, course_id) VALUES (1, 10);
-- ERROR: duplicate key value violates unique constraint "enrollments_pkey"
-- DETAIL: Key (student_id, course_id)=(1, 10) already exists.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to enforce uniqueness on the foreign key combinations

**The mistake:** Creating a junction table with an auto-incrementing ID primary key, but failing to add a unique constraint to the two foreign key columns.

```sql
-- BAD: Alice can enroll in History 10 separate times!
CREATE TABLE enrollments (
  id INT PRIMARY KEY, -- Unnecessary index bloat
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id)
);
```

**Why it's wrong:** Without a composite primary key or a unique constraint on `(student_id, course_id)`, the table is just a standard One-to-Many log. A bug in your frontend app can trigger duplicate enrollments, corrupting database statistics (like counting average classroom grades).

**Fix: Define the primary key of the junction table as the combination of the two foreign key columns, or apply a unique constraint `UNIQUE (student_id, course_id)`.**

---





### Mistake 2: Omitting Composite Primary Key or Unique Constraints on Junction Tables

**The mistake:** Creating `student_courses (student_id, course_id)` without a primary key.

**Why it's wrong:** Omitting primary keys permits inserting duplicate pairs `(student 1, course 1)` multiple times. Create a composite primary key `PRIMARY KEY (student_id, course_id)`.

*Incorrect:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT ); -- ❌ Allows duplicate links!
```

*Fix:*
```sql
CREATE TABLE student_courses ( student_id INT, course_id INT, PRIMARY KEY (student_id, course_id) );
```



### Mistake 3: Forgetting Indexes on the Second Foreign Key Column in Junction Tables

**The mistake:** Creating composite primary key `PRIMARY KEY (student_id, course_id)` without an index on `course_id` alone.

**Why it's wrong:** The composite primary key index covers queries filtering `student_id`. Queries looking up all students in a `course_id` cannot use the leading `student_id` index. Create an index on `course_id`.

*Incorrect:*
```sql
// Missing separate index on course_id in junction table
```

*Fix:*
```sql
CREATE INDEX idx_student_courses_course_id ON student_courses (course_id);
```



## 5. Practice Exercises

### Exercise 1: Designing N-to-N Junction Tables

**Scenario:**
Design a `student_courses` junction table resolving a Many-to-Many relationship between `students` and `courses`.

**Requirements:**
1. Include composite primary key `(student_id, course_id)`.
2. Include foreign key constraints to both parent tables.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE student_courses (
>   student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
>   course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
>   enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
>   grade TEXT,
>   PRIMARY KEY (student_id, course_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Junction tables translate Many-to-Many relationships into two 1-to-Many relationships.
> 2. `PRIMARY KEY (student_id, course_id)` prevents duplicate enrollments for the same student/course pair.
> 3. Stores association payload attributes (`enrolled_at`, `grade`).

---

### Exercise 2: Querying N-to-N Relationships via Junction Tables

**Scenario:**
Query all courses enrolled by student `id = 10` by joining `students` -> `student_courses` -> `courses`.

**Requirements:**
1. Execute 2 `JOIN` statements over junction table.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   c.id AS course_id, 
>   c.title, 
>   sc.enrolled_at 
> FROM students AS s 
> JOIN student_courses AS sc ON s.id = sc.student_id 
> JOIN courses AS c ON sc.course_id = c.id 
> WHERE s.id = 10;
> ```
>
> #### Technical Explanation
>
> 1. Traverses junction table foreign keys to resolve Many-to-Many relations.
> 2. Returns course details enrolled by the target student.
> 3. Standard relational N-to-N query pattern.

---

### Exercise 3: Indexing Junction Table Reversal Foreign Keys

**Scenario:**
Create a secondary index on `(course_id, student_id)` to optimize reverse lookups (finding all students in a course).

**Requirements:**
1. Execute `CREATE INDEX idx_student_courses_course_id ON student_courses (course_id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_student_courses_course_id 
> ON student_courses (course_id);
> ```
>
> #### Technical Explanation
>
> 1. Primary key `(student_id, course_id)` optimizes queries filtering by `student_id` first.
> 2. Queries filtering by `course_id` first require a secondary index on `course_id`.
> 3. Guarantees $O(\log N)$ performance in both lookup directions.

---



## 6. Related Terms
- [Many-to-Many Relationship](many_to_many.md) — The parent logical relationship.
- [Composite Key](../level_06/composite_key.md) — Forward reference: keys composed of multiple columns.
- [Entity-Relationship Diagram (ERD)](../level_06/erd.md) — Related concept: Entity-Relationship Diagram (ERD).
- [`FOREIGN KEY`](foreign_key.md) — Related concept: `FOREIGN KEY`.

---

## 7. Key Takeaways
- A junction table connects two tables to resolve many-to-many relationships.
- Contains at least two foreign key columns pointing to the parent tables.
- Uses a composite primary key `PRIMARY KEY (col1, col2)` to prevent duplicates.
- Avoids storage and index bloat associated with auto-incrementing ID fields.
- Allows storing metadata columns that belong specifically to the relationship.
