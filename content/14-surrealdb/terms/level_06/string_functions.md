# String Functions (`string::*`)

> **Level 6 — Advanced Querying & Functions**
> The standard library module in SurrealDB dedicated to text manipulation, inspection, formatting, and validation (`string::len()`, `string::lowercase()`, `string::slug()`, `string::is::email()`).

---

## 1. Prerequisites

- [Built-in Functions Overview](builtin_functions.md) — The parent library context.
- [`string`](../level_02/string.md) — The UTF-8 string data type.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed natively in memory during query evaluation. Fully supports multi-byte UTF-8 Unicode characters and emojis).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Text processing is one of the most common tasks in web applications:
- Normalizing user input (e.g. converting emails to lowercase before saving).
- Generating URL-friendly slugs for blog titles (`"My First Post!"` $\rightarrow$ `"my-first-post"`).
- Validating inputs (e.g. verifying email formats, checking string lengths).

In traditional databases, developers often perform these text transformations in backend API middleware (like Node.js) before sending queries to the database.

We designed the **`string::*`** module in SurrealDB to bring comprehensive text utilities directly into the query engine. With functions for transformation, trimming, splitting, slug generation, and validation (`string::is::*`), you can format and validate text at the database layer in single declarative statements.

---

### (2) Key Function Categories

#### 1. Transformations & Formatting
- `string::lowercase(val)` / `string::uppercase(val)`: Case conversions.
- `string::trim(val)`: Trims leading and trailing whitespace.
- `string::slug(val)`: Converts text to a clean URL slug (e.g., `"Hello World!"` $\rightarrow$ `"hello-world"`).
- `string::concat(str1, str2, ...)`: Concatenates text strings together.
- `string::replace(val, search, replace)`: Replaces text occurrences.

#### 2. Inspection & Length
- `string::len(val)`: Returns character count (Unicode-aware).
- `string::slice(val, start, len)`: Extracts a substring range.
- `string::contains(val, search)`: Checks if a substring exists (case-sensitive).

#### 3. Validation Helpers (`string::is::*`)
- `string::is::email(val)`: Returns `true` if string is a valid email.
- `string::is::url(val)`: Returns `true` if string is a valid URL.
- `string::is::uuid(val)`: Validates UUID string formatting.

---

### (3) Reality Metaphor (The Text Publishing Desk)
Imagine an editor's desk in a publishing house:
- **`string::trim`:** Brushing off loose paper dust from the edges of a manuscript page.
- **`string::slug`:** Stamping a clean, hyphenated library tracking label onto the spine.
- **`string::is::email`:** A proofreader verifying that an address card has a valid `@` symbol and domain before filing it.

---

### (4) Code Examples

#### Using `string::*` Functions in SurrealQL

```sql
-- 1. Slug generation and case normalization on CREATE/UPDATE
CREATE post SET 
  title = "SurrealDB 2.0 Released!",
  slug = string::slug("SurrealDB 2.0 Released!");
-- Result: slug = "surrealdb-2-0-released"

-- 2. Normalizing emails inside field definitions
DEFINE FIELD email ON user TYPE string 
  VALUE string::lowercase(string::trim($value))
  ASSERT string::is::email($value);

-- 3. Querying string lengths and substrings
SELECT 
  title,
  string::len(content) AS char_count,
  string::slice(content, 0, 50) AS preview
FROM article;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using 'string::len()' inside ASSERT constraints for optional fields without a 'NONE' bypass check

**The mistake:** Defining `DEFINE FIELD bio ON user TYPE option<string> ASSERT string::len($value) <= 140;`.

**Why it's wrong:** If a user omits `bio`, `$value` is `NONE`. Calling `string::len(NONE)` fails because `NONE` is not a string, causing validation errors on optional field writes.

**Fix: Always check `$value = NONE OR ...` when using string functions inside optional field assertions:**

```sql
-- GOOD (Bypasses check if NONE)
DEFINE FIELD bio ON user TYPE option<string> 
  ASSERT $value = NONE OR string::len($value) <= 140;
```

---



### Mistake 2: Passing Non-String Primitives to `string::` Functions

**The mistake:** Executing `string::lowercase(123)` passing a number.

**Why it's wrong:** Functions in `string::` namespace expect string inputs. Pass `<string> 123` or use `type::string()` to convert numbers first.

*Incorrect:*
```surrealql
RETURN string::lowercase(123); // ❌ Expected string, got number!
```

*Fix:*
```surrealql
RETURN string::lowercase(<string> 123);
```

### Mistake 3: Using Invalid Substring Index Out of Bounds in `string::slice()`

**The mistake:** Passing negative indices or out of bound start positions.

**Why it's wrong:** Check string lengths with `string::len()` before slicing to avoid invalid slice ranges.

*Incorrect:*
```surrealql
LET $str = "hi"; RETURN string::slice($str, 10, 20);
```

*Fix:*
```surrealql
LET $str = "hi"; RETURN string::slice($str, 0, string::len($str));
```

## 6. Practice Exercises

### Exercise 1: String Function Expression

**Problem:** Write a SurrealQL query to update a `user` record (`user:alice`), setting their `website_slug` to the URL slug version of their `company_name` field (lowercased and hyphenated).

**Expected output:**
> [!check]- Answer
> ```sql
> UPDATE user:alice SET website_slug = string::slug(company_name);
> ```
> - The slug generator function is `string::slug()`.
> - Pass the target field `company_name` directly into the function.

---



### Exercise 2: String Trimming and Case Conversion

**Problem:** Trim whitespace and convert `"  Hello World  "` to lowercase.

**Expected output:**
> [!check]- Answer
> ```text
> string::lowercase(string::trim("  Hello World  "))
> ```
> ```surrealql
> RETURN string::lowercase(string::trim("  Hello World  "));
> ```
>
> **Explanation:** Chaining `string::trim()` and `string::lowercase()` cleanses text input.

---

### Exercise 3: String Replacement

**Problem:** Replace `"foo"` with `"bar"` in string `"foo test"` using `string::replace()`.

**Expected output:**
> [!check]- Answer
> ```text
> string::replace("foo test", "foo", "bar")
> ```
> ```surrealql
> RETURN string::replace("foo test", "foo", "bar");
> ```
>
> **Explanation:** `string::replace(str, target, replacement)` substitutes matching substrings.

## 7. Related Terms

- [Built-in Functions Overview](builtin_functions.md) — The parent library.
- [`string`](../level_02/string.md) — The string data type.

---

## 8. Key Takeaways
- The `string::*` module provides text formatting, inspection, and validation utilities.
- `string::slug()` generates URL-safe slugs from strings automatically.
- `string::is::*` functions validate emails, URLs, and UUID strings.
- Fully UTF-8 and Unicode aware (correctly handles multi-byte characters and emojis).
- Ideal for use inside `DEFINE FIELD ... VALUE` and `ASSERT` clauses.
