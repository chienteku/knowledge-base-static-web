# `string`

> **Level 2 — Data Types & Record Structure**
> The primitive data type in SurrealDB used to store UTF-8 text data, supporting single or double quotes, native multi-line strings, and full emoji/unicode character sets.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (UTF-8 text string type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In SQL databases (like PostgreSQL), strings are divided into multiple types with physical storage trade-offs:
-   `CHAR(N)`: Fixed-length strings (pads empty spaces with blanks).
-   `VARCHAR(N)`: Variable-length strings up to a strict limit.
-   `TEXT`: Unlimited-length strings.

Managing these types and predicting length limits adds complexity during early schema design.

We designed the **`string`** type in SurrealDB to simplify text storage. 

There is only one string type. 

It is dynamically sized, stores UTF-8 characters natively (meaning emojis and foreign scripts work out of the box), and supports multi-line text blocks without complex escape characters, matching the clean string handling of JavaScript.

---

### (2) Quoting & Multi-Line Strings
SurrealDB strings can be wrapped using:
-   **Single Quotes:** `'Hello World'`
-   **Double Quotes:** `"Hello World"`
-   **Multi-Line Blocks:** You can press enter and write text across multiple lines inside the quotes. SurrealDB preserves the line breaks, eliminating the need to write `\n` operators manually.

---

### (3) Reality Metaphor (Unlimited Paper Rolls)
Imagine writing logs:
-   **PostgreSQL `VARCHAR(50)`:** Writing on a pre-cut **Label Tape** exactly 50 millimeters wide. 
    -   If your name is long or you write extra words, it falls off the edge, and the system rejects it.
-   **SurrealDB `string`:** Writing on a roll of **Unlimited Paper Tape**. 
    -   The tape rolls out as long as your text is. 
    -   You can write in English, draw emojis, write in different languages, and press enter to write on multiple lines.

---

### (4) Code Examples

#### Creating and Defining String Fields
Let's create a profile collection with various string layouts:

```sql
DEFINE TABLE profile SCHEMAFULL;

-- 1. Enforce string type
DEFINE FIELD biography ON profile TYPE string;
DEFINE FIELD username ON profile TYPE string;

-- 2. Insert records with different string formatting
CREATE profile:alice SET
  username = "Alice Emojis 🚀", // Unicode/Emoji support
  biography = "Developer.
Designer.
Love databases!"; // Multi-line string, line breaks are preserved!

-- 3. Query string matches
SELECT * FROM profile WHERE username = 'Alice Emojis 🚀';
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to define string length constraints using SQL syntax like 'TYPE string(255)', resulting in syntax errors

**The mistake:** Writing `DEFINE FIELD email ON user TYPE string(255);` to replicate SQL column constraints.

**Why it's wrong:** In SurrealQL, the `string` type does not accept size arguments. 

Writing `string(255)` triggers a compiler parsing crash.

**Fix: Declare the type simply as `TYPE string`. If you want to enforce a maximum length constraint, use the `ASSERT` clause with the built-in `string::len()` function:**

```sql
-- CORRECT
DEFINE FIELD email ON user TYPE string
  ASSERT string::len($value) <= 255;
```

---



### Mistake 2: Forgetting String Quotes in String Field Assignment Literals

**The mistake:** Writing `SET name = Alice` without quotation marks.

**Why it's wrong:** Unquoted identifiers `Alice` are parsed as variable references or field names, causing syntax errors. Quote strings with `"Alice"` or `'Alice'`.

*Incorrect:*
```surrealql
CREATE user SET name = Alice; // ❌ Parses Alice as variable or field identifier!
```

*Fix:*
```surrealql
CREATE user SET name = "Alice"; // Correct quoted string literal
```

### Mistake 3: Using Invalid String Concatenation Operators

**The mistake:** Writing `first + ' ' + last` expecting string concatenation in older versions.

**Why it's wrong:** Use `string::concat()` or template strings `` `${first} ${last}` `` for robust string concatenation.

*Incorrect:*
```surrealql
LET $full = $first + " " + $last;
```

*Fix:*
```surrealql
LET $full = string::concat($first, " ", $last);
-- Or string functions:
LET $full = `${$first} ${$last}`;
```

## 5. Practice Exercises

### Exercise 1: String Format Validation and Case Transformation

**Scenario:**
A user registration service converts email input to lowercase and validates string length and format using built-in string functions.

**Requirements:**
1. Define table `user` in `SCHEMAFULL` mode.
2. Define field `email` as `string` asserting valid email format.
3. Insert user converting email `"ALICE@EXAMPLE.COM"` to lowercase using `string::lowercase()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string ASSERT string::is::email($value);
> 
> CREATE user:u1 SET email = string::lowercase("ALICE@EXAMPLE.COM");
> ```
>
> #### Technical Explanation
>
> 1. `string::lowercase()` normalizes string casing at write time.
> 2. `string::is::email($value)` validates RFC email syntax inside `ASSERT` clauses.
> 3. Ensures consistent normalized string data across user records.
> 
---

### Exercise 2: String Pattern Searching with Regex

**Scenario:**
An admin dashboard searches for user accounts where the `username` starts with `"admin_"` using string functions or regex matching.

**Requirements:**
1. Create users `user:a1` (`username = "admin_john"`) and `user:u2` (`username = "user_jane"`).
2. Query users where `username` starts with `"admin_"` using `string::starts_with()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:a1 SET username = "admin_john";
> CREATE user:u2 SET username = "user_jane";
> 
> -- Filter usernames starting with 'admin_'
> SELECT * FROM user WHERE string::starts_with(username, "admin_");
> ```
>
> #### Technical Explanation
>
> 1. `string::starts_with(str, prefix)` performs prefix matching on string fields.
> 2. `string::*` namespace provides rich string functions (`concat`, `replace`, `trim`, `split`).
> 3. Enables clean text filtering without complex regular expressions.
> 
---

### Exercise 3: String Length & Trimming Constraints

**Scenario:**
Enforce string length constraints on a blog post `title` field (between 5 and 100 characters) after trimming whitespace.

**Requirements:**
1. Define field `title` on table `post` as `string`.
2. Add an `ASSERT` clause checking `string::len(string::trim($value)) >= 5`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE post SCHEMAFULL;
> DEFINE FIELD title ON TABLE post TYPE string 
>     ASSERT string::len(string::trim($value)) >= 5 AND string::len($value) <= 100;
> 
> CREATE post:p1 SET title = "   SurrealQL Basics   ";
> ```
>
> #### Technical Explanation
>
> 1. `string::trim()` strips leading and trailing whitespace.
> 2. `string::len()` counts character length accurately for UTF-8 strings.
> 3. Prevents empty or whitespace-only strings from bypassing validation rules.
> 
---



## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Casting & Coercion](type_casting.md) — Converting between types.
- [String Functions (`string::*`)](../level_06/string_functions.md) — Related concept: String Functions (`string::*`).

---

## 7. Key Takeaways
- The `string` type stores UTF-8 text sequences.
- Direct NoSQL equivalent to PostgreSQL's `TEXT` and MongoDB's String BSON.
- Supports both single quotes (`'`) and double quotes (`"`).
- Supports multi-line blocks natively, preserving line breaks on disk.
- Emojis, foreign symbols, and binary characters are saved out of the box.
- Do not write length arguments (like `string(50)`); use `ASSERT` constraints instead.
- Manipulate text fields using the extensive built-in `string::*` library functions.
