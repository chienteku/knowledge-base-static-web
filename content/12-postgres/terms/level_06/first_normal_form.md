# First Normal Form (1NF)

> **Level 6 — Schema Design & Normalization**
> The baseline database normalization standard requiring that all column values are atomic (indivisible), there are no repeating groups of columns, and every row is uniquely identifiable.

---

## 1. Prerequisites
- [Normalization](normalization.md) — The parent organizing process.
- [Functional Dependency](functional_dependency.md) — Column determination mathematics.
---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (The absolute baseline requirement for any table to be considered a valid relational table in SQL).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In legacy spreadsheets, developers often save time by stuffing lists of values into a single cell. For example, a `users` table:

| id | username | phone_numbers |
| :--- | :--- | :--- |
| 1 | Alice | 555-1111, 555-2222 |

Or they create repeating columns to hold lists:

| id | username | phone_1 | phone_2 | phone_3 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Alice | 555-1111 | 555-2222 | NULL |

Both of these designs violate the core principles of relational databases:
-   **No search indexing:** To find who owns the phone number `'555-2222'` in the first table, the database cannot use an index. It must scan every row on disk using slow wildcard text searches (`LIKE '%555-2222%'`).
-   **Rigid schemas:** In the second table, if a user acquires a 4th phone number, you are forced to run an `ALTER TABLE` query to add a new `phone_4` column. This halts your production system and forces you to rewrite your backend application code.

We designed the **First Normal Form (1NF)** to establish a baseline structure that eliminates these messy data lists.

---

### (2) The Rules of 1NF
A table is in First Normal Form if and only if it meets three rules:

1.  **Atomicity:** Every cell must hold a single, **atomic** value. An atomic value is one that cannot be divided into smaller pieces of useful information under the context of your application (no comma-separated lists, JSON blocks, or custom arrays in a cell).
2.  **No Repeating Groups:** You cannot have multiple columns representing the same attribute list (e.g. no `phone_1`, `phone_2` columns).
3.  **Unique Rows:** Each row must be uniquely identifiable (which is enforced by defining a `PRIMARY KEY`).

---

### (3) Reality Metaphor
Imagine a university student file cabinet:
-   **Violating 1NF:** You stuff one folder labeled "Alice" with loose papers containing different phone numbers, addresses, and transcripts. Sorting through the folder is slow.
-   **Satisfying 1NF:** Every index card in the drawer has exactly one box for name and **exactly one** box for a phone number. If Alice has two phone numbers, she gets two separate index cards in the drawer. Searching is instant.

---

### (4) Code Examples

#### Violating 1NF (Non-Atomic List)
```sql
-- BAD: Violates 1NF because tags holds a comma-separated list
CREATE TABLE articles (
  id INT PRIMARY KEY,
  title VARCHAR(200),
  tags VARCHAR(100) -- E.g. 'coding,database,tech'
);
```

#### Satisfying 1NF
To convert the table to 1NF, we split the list into separate rows. If an article has three tags, we represent that using three rows (or separate them using a junction table):

```sql
-- GOOD: Every cell contains exactly one atomic value
CREATE TABLE articles (
  id INT PRIMARY KEY,
  title VARCHAR(200)
);

CREATE TABLE article_tags (
  article_id INT REFERENCES articles(id),
  tag VARCHAR(50),
  PRIMARY KEY (article_id, tag)
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing lists of IDs or tags as comma-separated strings to "avoid creating a new table"

**The mistake:** Storing a list of category IDs inside a user's record: `favorite_categories = '1,5,12'`.

**Why it's wrong:** Besides breaking atomicity, it makes relational joins impossible. You cannot write `JOIN categories ON users.favorite_categories = categories.id` because the database cannot compare a string `'1,5,12'` to an integer ID `1`.

**Fix: Create a separate child table where each row contains exactly one ID, linking them with a foreign key.**

---



### Mistake 2: Storing Comma-Separated CSV Strings in Single Columns (1NF Violation)

**The mistake:** Storing `tags` as text string `'tech,coding,sql'` in a single `posts` column.

**Why it's wrong:** 1NF mandates that column values MUST be atomic! CSV strings prevent using indexes and SQL `JOIN` predicates.

*Incorrect:*
```sql
INSERT INTO posts (tags) VALUES ('tech,coding,sql'); -- ❌ 1NF violation!
```

*Fix:*
```sql
Use child junction table post_tags (post_id, tag_id) or PostgreSQL native TEXT[] arrays
```

### Mistake 3: Creating Repeating Columns Across Rows (`phone1`, `phone2`, `phone3`) (1NF Violation)

**The mistake:** Adding columns `phone1`, `phone2`, `phone3` to `users` table.

**Why it's wrong:** Repeating group columns violate 1NF principles and limit data to arbitrary caps (e.g. max 3 phones). Move repeating groups to a child `user_phones` table.

*Incorrect:*
```sql
CREATE TABLE users ( phone1 TEXT, phone2 TEXT, phone3 TEXT ); -- ❌ Repeating groups!
```

*Fix:*
```sql
CREATE TABLE user_phones ( user_id INT REFERENCES users(id), phone TEXT );
```

## 6. Practice Exercises

### Exercise 1: Repeating Columns Refactor

**Problem:** You have a table that violates 1NF:
`employee_projects (emp_id, emp_name, project_1, project_2, project_3)`
Write the SQL DDL queries to normalize this schema into 1NF.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE employees (
>   emp_id INT PRIMARY KEY,
>   emp_name VARCHAR(100) NOT NULL
> );
> 
> CREATE TABLE employee_project_links (
>   emp_id INT REFERENCES employees(emp_id),
>   project_name VARCHAR(100),
>   PRIMARY KEY (emp_id, project_name)
> );
> ```
> - Remove repeating columns (`project_1`, `project_2`) and store projects as rows in a separate link table.
> - Define a composite primary key on the link table to ensure row uniqueness.

---



### Exercise 2: Normalizing Non-Atomic CSV String Column into 1NF

**Problem:** Convert non-atomic `users (id, phones_csv)` into 1NF schema using child table `user_phones`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE user_phones ( user_id INT REFERENCES users(id), phone TEXT, PRIMARY KEY (user_id, phone) );
> ```
> ```sql
> CREATE TABLE user_phones (
>   user_id INT REFERENCES users(id),
>   phone TEXT,
>   PRIMARY KEY (user_id, phone)
> );
> ```
>
> **Explanation:** Moving non-atomic values into a child table satisfies 1NF atomic value requirements.

---

### Exercise 3: 1NF Rules Summary

**Problem:** List 2 primary rules of First Normal Form (1. Each column contains atomic single values; 2. No repeating column groups).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Columns contain atomic single values; 2. No repeating column groups
> ```
> ```text
> 1. Columns contain atomic single values; 2. No repeating column groups
> ```
>
> **Explanation:** 1NF ensures basic structural regularity across relational tables.

## 7. Related Terms
- [Normalization](normalization.md) — The parent process.
- [Second Normal Form (2NF)](second_normal_form.md) — Eliminating partial key dependencies.
- [`ARRAY` Type](array_type.md) — Related concept: `ARRAY` Type.
- [Functional Dependency](functional_dependency.md) — Related concept: Functional Dependency.
---

## 8. Key Takeaways
- First Normal Form (1NF) is the baseline standard for relational database tables.
- Requires all column cell values to be atomic (indivisible).
- Forbids storing lists, arrays, or comma-separated strings inside a single cell.
- Forbids creating repeating groups of columns (e.g. `phone_1`, `phone_2`).
- Requires every row in a table to be unique (enforced by a Primary Key).
- Satisfying 1NF makes data indexable, searchable, and modular.
