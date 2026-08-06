# One-to-One Relationship

> **Level 5 — Table Relationships & JOINs**
> A relationship pattern where a single row in Table A can relate to at most one row in Table B, and vice versa, implemented by applying a `UNIQUE` constraint to a standard `FOREIGN KEY`.

---

## 1. Prerequisites
- [`FOREIGN KEY`](foreign_key.md) — The reference pointer constraint.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The rule preventing duplicate key assignments.

---

## 2. Term Category

**Schema Design** (Unique Singular Association Pattern): A One-to-One relationship links a single row in one table to exactly one row in another table using a unique foreign key constraint.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Enforced in all relational database engines. Limits relationships at the index verification layer).

### (1) Design Motivation — "Why did we design this?"
In a One-to-One (1:1) relationship, exactly two rows are linked:
-   One **User** has exactly one **User Profile** (or dashboard settings).
-   One **Store Location** has exactly one **Store Manager**.
-   One **Employee** has exactly one **Corporate Computer**.

If the relationship is 1:1, why not put all columns into a single table (e.g., merging all profile columns directly into the `users` table)? 

We split them into separate tables for three reasons:
1.  **Performance (Table Sizing):** Large columns (like a user's biography text or profile photo URL) consume memory. If your web app queries the `users` table millions of times a day just to verify passwords, loading these heavy profile fields off disk slows down queries. Splitting them keeps the main table small and fast.
2.  **Security Isolation:** You can lock down the `users` table (containing passwords, emails) with strict admin permissions, while allowing wider access to the public `user_profiles` table.
3.  **Modular Schema Design:** Some users might never set up a profile. By keeping profiles in a separate table, you avoid storing empty (`NULL`) cells in the main user rows.

---

### (2) Enforcing the 1:1 Boundary
To create a 1:1 link in SQL:
1.  Add a `FOREIGN KEY` column to the secondary table pointing to the main table.
2.  Apply a **`UNIQUE`** constraint to that foreign key column.

Without the `UNIQUE` constraint, the relationship is a One-to-Many, meaning one user could have five separate profile cards. The unique constraint guarantees that once a profile claims a user ID, no other profile row can ever reference that same user ID.

---

### (3) Reality Metaphor
Imagine a vehicle parking system:
-   **Citizens** have unique Social Security Numbers (Primary Key).
-   The DMV issues **Driver's License Cards** (Secondary Table).
-   Each card prints the holder's SSN (Foreign Key).
-   The printer enforces a strict rule: **You can only print one card per SSN (Unique Constraint)**.
-   Thus, a citizen has at most one license card, and each card belongs to exactly one citizen.

---

### (4) Code Examples

#### Creating a One-to-One Schema
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);

CREATE TABLE user_profiles (
  id INT PRIMARY KEY,
  bio TEXT,
  avatar_url VARCHAR(255),
  
  -- 1:1 Enforced: customer_id is a foreign key AND is completely unique
  user_id INT UNIQUE REFERENCES users(id)
);
```

#### Constraint Violation Demonstration
```sql
INSERT INTO users (id, username) VALUES (1, 'alice');

-- 1. First profile insert succeeds
INSERT INTO user_profiles (id, bio, user_id) VALUES (101, 'Hello world', 1);

-- 2. Second profile insert for Alice crashes! (Violates Unique)
INSERT INTO user_profiles (id, bio, user_id) VALUES (102, 'Attempt two', 1);
-- ERROR: duplicate key value violates unique constraint "user_profiles_user_id_key"
-- DETAIL: Key (user_id)=(1) already exists.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the UNIQUE constraint on the foreign key column

**The mistake:** Creating a reference column `user_id INT REFERENCES users(id)` and expecting it to act as a 1:1 relationship.

**Why it's wrong:** Without the `UNIQUE` rule, the database engine treats this as a standard One-to-Many relationship. A developer can write code that inserts three separate profile rows for the same user, causing application query bugs when your backend loads profile files.

**Fix: Always apply a `UNIQUE` constraint to foreign key columns representing one-to-one links.**

---





### Mistake 2: Omitting UNIQUE Constraint on Foreign Keys in 1-to-1 Relationships

**The mistake:** Creating `user_profiles (user_id INT REFERENCES users(id))` without a `UNIQUE` constraint.

**Why it's wrong:** Without a `UNIQUE` constraint on `user_id`, multiple profile rows can be inserted for the same user, turning the 1-to-1 relationship into a 1-to-Many relationship! Add `UNIQUE(user_id)`.

*Incorrect:*
```sql
CREATE TABLE user_profiles ( user_id INT REFERENCES users(id) ); -- ❌ Allows multiple profiles per user!
```

*Fix:*
```sql
CREATE TABLE user_profiles ( user_id INT UNIQUE REFERENCES users(id) ); -- Enforces 1-to-1
```



### Mistake 3: Splitting 1-to-1 Data into 2 Tables Without Performance or Security Rationale

**The mistake:** Splitting `users` name and `users` email into two 1-to-1 tables.

**Why it's wrong:** Splitting 1-to-1 data that is always read together forces un-necessary JOIN queries. Keep co-located 1-to-1 fields in a single table unless security or table width warrants splitting.

*Incorrect:*
```sql
// Splitting name and email into 2 separate 1-to-1 tables
```

*Fix:*
```sql
Keep name and email in single users table
```



## 5. Practice Exercises

### Exercise 1: Modeling 1-to-1 Relationships with Unique Foreign Keys

**Scenario:**
Model a 1-to-1 association between `users` and `user_profiles` using a `UNIQUE` foreign key.

**Requirements:**
1. Create `user_profiles` with `user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE users (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   username TEXT NOT NULL UNIQUE
> );
> 
> CREATE TABLE user_profiles (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
>   bio TEXT,
>   avatar_url TEXT
> );
> ```
>
> #### Technical Explanation
>
> 1. One-to-One relationships require a `UNIQUE` constraint on the foreign key column (`user_id`).
> 2. Prevents inserting multiple profile rows for the same `user_id`.
> 3. Enforces strict 1-to-1 cardinal associations.

---

### Exercise 2: Splitting Infrequently Queried Columns into 1-to-1 Tables

**Scenario:**
Explain why large `BYTEA` avatar images or long `bio` text should be isolated in a separate 1-to-1 `user_profiles` table.

**Requirements:**
1. Contrast table heap size and RAM caching efficiency.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Table Normalization Performance Analysis:
> - Keeping 'users' table small (id, username, email) allows PostgreSQL to fit thousands of user rows into a single 8KB disk page.
> - Moving large 'bio' or 'avatar' columns to 1-to-1 'user_profiles' keeps hot 'users' table scans sub-millisecond fast.
> ```
>
> #### Technical Explanation
>
> 1. Table heap page sizes are fixed at 8KB.
> 2. Excluding large, infrequently accessed columns from main tables maximizes CPU buffer cache efficiency.
> 3. Advanced schema design optimization.

---

### Exercise 3: Querying 1-to-1 Tables with INNER JOIN

**Scenario:**
Fetch a user alongside their profile details in a single query.

**Requirements:**
1. Execute `SELECT u.username, p.bio FROM users u JOIN user_profiles p ON u.id = p.user_id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   u.id, 
>   u.username, 
>   p.bio, 
>   p.avatar_url 
> FROM users AS u 
> JOIN user_profiles AS p ON u.id = p.user_id 
> WHERE u.id = 42;
> ```
>
> #### Technical Explanation
>
> 1. `JOIN` resolves 1-to-1 table relations seamlessly.
> 2. Unique index on `user_id` guarantees $O(1)$ single-row lookup performance.
> 3. Clean API payload assembly.

---



## 6. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The parent reference logic.
- [One-to-Many Relationship](one_to_many.md) — The hierarchical default link.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The one-to-one validator.

---

## 7. Key Takeaways
- One-to-One links one record in Table A to at most one record in Table B.
- Implemented by combining a `FOREIGN KEY` with a `UNIQUE` constraint.
- Splitting tables in 1:1 improves database buffer performance and isolates security.
- Omitting the `UNIQUE` constraint turns the relationship back into a One-to-Many.
- Useful for profile attachments, optional settings blocks, and security divisions.
