# `string`

> **Level 2 — Data Types & Record Structure**
> The primitive data type in SurrealDB used to store UTF-8 text data, supporting single or double quotes, native multi-line strings, and full emoji/unicode character sets.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Stored internally as UTF-8 bytes. Queried using standard string manipulation functions).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Multi-line String Assessment

**Problem:** You execute this SurrealQL insert command:
```sql
CREATE post:new SET content = "Line 1
Line 2
Line 3";
```
1.  State whether this query will compile successfully.
2.  Explain how SurrealDB handles the line breaks when returning the data to a Node.js client.

**Expected output:**
```text
1. Yes: The query will compile successfully. SurrealDB natively supports multi-line strings.
2. SurrealDB preserves the line breaks and returns them to the Node.js client as a string containing new-line escape characters (`Line 1\nLine 2\nLine 3`).
```

> [!check]- Answer
> - Check if SurrealDB allows unescaped line breaks inside double quotes.
> - Consider how multi-line blocks are translated to JSON strings over network sockets.

---



### Exercise 2: String Function Manipulation

**Problem:** Convert string `"hello world"` to uppercase and lowercase using string functions.

**Expected output:**
```text
string::uppercase("hello world"), string::lowercase("HELLO WORLD")
```

> [!check]- Answer
> ```surrealql
> RETURN string::uppercase("hello world");
> RETURN string::lowercase("HELLO WORLD");
> ```
>
> **Explanation:** `string::uppercase()` and `string::lowercase()` format text strings.

### Exercise 3: Regex String Matching with `~`

**Problem:** Check if email field contains `@domain.com` using fuzzy regex match `~`.

**Expected output:**
```text
SELECT * FROM user WHERE email ~ "@domain.com";
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM user WHERE email ~ "@domain.com";
> ```
>
> **Explanation:** `~` performs case-insensitive regex or substring matching.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Casting & Coercion](type_casting.md) — Converting between types.

---

## 8. Key Takeaways
- The `string` type stores UTF-8 text sequences.
- Direct NoSQL equivalent to PostgreSQL's `TEXT` and MongoDB's String BSON.
- Supports both single quotes (`'`) and double quotes (`"`).
- Supports multi-line blocks natively, preserving line breaks on disk.
- Emojis, foreign symbols, and binary characters are saved out of the box.
- Do not write length arguments (like `string(50)`); use `ASSERT` constraints instead.
- Manipulate text fields using the extensive built-in `string::*` library functions.
