# One-to-One Relationship

> **Level 5 — Table Relationships & JOINs**
> A relationship pattern where a single row in Table A can relate to at most one row in Table B, and vice versa, implemented by applying a `UNIQUE` constraint to a standard `FOREIGN KEY`.

---

## 1. Prerequisites
- [`FOREIGN KEY`](foreign_key.md) — The reference pointer constraint.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The rule preventing duplicate key assignments.
---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Enforced in all relational database engines. Limits relationships at the index verification layer).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Omitting UNIQUE Constraint on Foreign Keys in 1-to-1 Relationships

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

### Mistake 5: Splitting 1-to-1 Data into 2 Tables Without Performance or Security Rationale

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

## 6. Practice Exercises

### Exercise 1: Settings Portal Schema

**Problem:** You are building a system. Every user has exactly one set of settings. You have a `users` table (columns: `id` PRIMARY KEY, `username`). Write the SQL `CREATE TABLE` query for a table named `user_settings` containing:
1.  An integer primary key `settings_id`.
2.  A boolean flag `dark_mode_enabled` (defaults to `FALSE`).
3.  A unique foreign key column `user_id` pointing to `users(id)`.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE user_settings (
>   settings_id INT PRIMARY KEY,
>   dark_mode_enabled BOOLEAN DEFAULT FALSE,
>   user_id INT UNIQUE REFERENCES users(id)
> );
> ```
> - Combine the `UNIQUE` and `REFERENCES` inline parameters inside the `user_id` declaration.
> - Ensure the default value is properly declared using `DEFAULT`.

---



### Exercise 2: Defining 1-to-1 Relationship Schema

**Problem:** Create `user_settings` table establishing 1-to-1 relationship with `users` table.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE user_settings ( user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, theme TEXT DEFAULT 'dark' );
> ```
> ```sql
> CREATE TABLE user_settings (
>   user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
>   theme TEXT DEFAULT 'dark'
> );
> ```
>
> **Explanation:** Using the foreign key as primary key (`user_id INT PRIMARY KEY`) guarantees 1-to-1 uniqueness.

---

### Exercise 3: When to Split 1-to-1 Tables

**Problem:** List 2 valid reasons for splitting 1-to-1 data into separate tables (1. Isolating rare/large blob columns; 2. Strict column-level security permissions).

**Expected output:**
> [!check]- Answer
> ```text
> Isolating rare/large blob columns; strict column-level security permissions
> ```
> ```text
> Isolating rare/large blob columns; strict column-level security permissions
> ```
>
> **Explanation:** Splitting 1-to-1 tables keeps primary tables compact while isolating sensitive fields.

## 7. Related Terms
- [`FOREIGN KEY`](foreign_key.md) — The parent reference logic.
- [One-to-Many Relationship](one_to_many.md) — The hierarchical default link.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The one-to-one validator.
---

## 8. Key Takeaways
- One-to-One links one record in Table A to at most one record in Table B.
- Implemented by combining a `FOREIGN KEY` with a `UNIQUE` constraint.
- Splitting tables in 1:1 improves database buffer performance and isolates security.
- Omitting the `UNIQUE` constraint turns the relationship back into a One-to-Many.
- Useful for profile attachments, optional settings blocks, and security divisions.
