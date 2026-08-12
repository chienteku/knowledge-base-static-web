# HTML Entities

> **Level 9 — DOM, Rendering & Accessibility**
> Special text code strings starting with an ampersand (`&`) and ending with a semicolon (`;`) used to display reserved characters, special symbols, and invisible spacing in HTML.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Understanding that browsers parse `<` and `>` as tags.
- [Character Encoding (`charset`)](../level_08/character_encoding.md) — The system mapping character lookups.

---

## 2. Term Category

**Syntax / Concept (Universal Browser Support .)**: HTML Entities is a fundamental concept in this technology stack. **Level 9 — DOM, Rendering & Accessibility**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
There are three main scenarios where you cannot simply type a character into your HTML text:

#### 1. Reserved Characters (Parser Conflicts)
The characters `<` (less-than) and `>` (greater-than) are reserved because the browser uses them to identify HTML tags. 
If you type:
```html
<p>In math, 5 < 10 is true.</p>
```
The browser gets confused. It sees `< 10` and thinks you are starting a tag named `10`. It will search for a closing tag, hide the text from the user, and break the rendering.

#### 2. Invisible Formatting
By default, HTML collapses multiple spaces down to a single space ([Whitespace Collapse](../level_01/whitespace_collapse.md)). If you want to force words to stay on the same line, or add a specific space that never breaks, you cannot do it with standard typing.

#### 3. Keyboard Restrictions
Symbols like copyright (`©`), trademark (`™`), or mathematical signs (e.g. `±`) are not found on standard keyboards.

The W3C created **HTML Entities** to solve all three issues. They act as "escape codes" that tell the browser's HTML parser: *"Do not process this code as a tag or space; just print this specific symbol on the screen."*

---

### (2) Common HTML Entities
All HTML entities follow a strict syntax: **`&[EntityName];`** (must start with an ampersand and end with a semicolon).

| Visual Symbol | Entity Code | Symbol Name | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **`<`** | **`&lt;`** | Less Than | Displaying math inequalities or printing HTML tag examples. |
| **`>`** | **`&gt;`** | Greater Than | Displaying math inequalities or printing HTML tag examples. |
| **`&`** | **`&amp;`** | Ampersand | Displaying ampersands (since `&` alone starts an entity code). |
| **`"`** | **`&quot;`** | Double Quote | Escaping quotes inside attribute values. |
| **`©`** | **`&copy;`** | Copyright | Placing standard copyright markers in footers. |
| **` `** | **`&nbsp;`** | Non-Breaking Space | A space that prevents words from wrapping onto a new line (e.g. `$100&nbsp;million`). |

---

### (3) Code Examples

#### Short Snippet
Displaying code examples safely:

```html
<p>To create a paragraph, use the &lt;p&gt; tag.</p>
<!-- Displays: To create a paragraph, use the <p> tag. -->
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Entities Showcase</title>
</head>
<body>

  <h1>Cooking &amp; Baking Guide</h1> <!-- Renders: Cooking & Baking Guide -->

  <p>
    If you mix flour &lt; water, you get paste. 
    If you mix flour &amp; water &amp; yeast, you get bread!
  </p>

  <p>
    Standard copy rules apply. For licensing details, 
    contact our legal department.
  </p>

  <footer>
    <p>&copy; 2026 BreadHub Inc. All rights reserved.</p>
  </footer>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the closing semicolon

**The mistake:** Leaving the semicolon off the end of the entity code:

```html
<!-- BAD: Might render as literal text "&copy 2026" or break parsing! -->
<p>&copy 2026 Company Name</p>
```

**Why it's wrong:** The browser parses ampersands as entity starters. It searches forward until it finds a semicolon to close the lookup code. If you omit the semicolon, the browser might fail to translate the symbol, or get confused if the following word starts with letters matching other entities.

---

### Mistake 2: Abusing `&nbsp;` for layout spacing

**The mistake:** Using multiple non-breaking spaces to push text across the screen:

```html
<!-- BAD: DO NOT DO THIS! (Messy unmaintainable structure) -->
<p>Logo&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Navigation</p>
```

**Why it's wrong:** Non-breaking spaces are strictly semantic markers to prevent line wraps between two related words. They are not layout tools. Using them for spacing causes layouts to break on different screen sizes and ruins responsiveness. Spacing layout is CSS's job (using padding, margin, or CSS flexbox/grid).

---



### Mistake 3: Writing Raw Special Characters (`<`, `>`, `&`) in HTML Body Text

**The mistake:** Writing `<p>5 < 10 & 20 > 15</p>`.

**Why it's wrong:** Browsers interpret raw `<` and `&` as HTML tag openings and entity references. Unescaped characters cause parsing errors. Use `&lt;`, `&gt;`, `&amp;`.

*Incorrect:*
```html
<p>Compare 5 < 10 & 20 > 15</p> <!-- ❌ Unescaped special characters! -->
```

*Fix:*
```html
<p>Compare 5 &lt; 10 &amp; 20 &gt; 15</p>
```

### Mistake 4: Forgetting Semicolons at the End of HTML Entity Names (`&copy` vs `&copy;`)

**The mistake:** Writing `&copy 2026` without a trailing semicolon.

**Why it's wrong:** HTML entities MUST end with a trailing semicolon `;`. Omitting semicolons leads to inconsistent rendering across browser parsers.

*Incorrect:*
```html
<p>&copy 2026 Company</p> <!-- ❌ Missing trailing semicolon! -->
```

*Fix:*
```html
<p>&copy; 2026 Company</p>
```

## 5. Practice Exercises

### Exercise 1: Entity Translation

**Problem:** Write the HTML code to display the following sentence exactly as it appears, preventing the browser from interpreting the tags:
"The syntax for a line break is <br>."

**Expected output:**
> [!check]- Answer
> ```html
> <p>The syntax for a line break is &lt;br&gt;.</p>
> ```
> - Replace `<` with `&lt;`.
> - Replace `>` with `&gt;`.
> 
---



### Exercise 2: Core HTML Entity Matching

**Problem:** Match character symbol to entity name code:
1. `<` 
2. `>` 
3. `&` 
4. `"` 
5. `©` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. &lt;
> 2. &gt;
> 3. &amp;
> 4. &quot;
> 5. &copy;
> ```
> ```text
> 1. <  -> &lt;
> 2. >  -> &gt;
> 3. &  -> &amp;
> 4. "  -> &quot;
> 5. ©  -> &copy;
> ```
>
> **Explanation:** HTML entities escape reserved character symbols.
> 
---

### Exercise 3: Non-Breaking Space Entity

**Problem:** Which HTML entity creates a non-breaking space character that prevents line wrapping between two words?

**Expected output:**
> [!check]- Answer
> ```text
> &nbsp;
> ```
> ```html
> <span>100&nbsp;km/h</span>
> ```
>
> **Explanation:** `&nbsp;` prevents automatic line wrapping between adjacent words.
> 
## 6. Related Terms
- [Element vs. Tag](../level_01/element_vs_tag.md) — The tags that require less-than/greater-than signs.
- [Character Encoding (`charset`)](../level_08/character_encoding.md) — The underlying byte mapping.
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — The default browser behavior that `&nbsp;` bypasses.

---

## 7. Key Takeaways
- HTML Entities display reserved tags, special keyboard characters, and custom spacings.
- All entities follow the pattern: `&[EntityName];`.
- The less-than (`&lt;`) and greater-than (`&gt;`) entities prevent browsers from confusing text for HTML elements.
- The non-breaking space (`&nbsp;`) prevents line wrapping between words.
- Never use `&nbsp;` to force visual page layouts; use CSS spacing attributes instead.
