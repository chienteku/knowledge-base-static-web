# `<pre>` & `<code>`

> **Level 2 — Text & Content**
> Elements used to display computer code, ASCII art, or poetry by preserving white space and formatting in a monospaced font.

---

## 1. Prerequisites
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — The browser behavior these tags modify or bypass.
- [`<p>` (Paragraph)](../level_02/p.md) — Standard paragraph text blocks.
- [Nesting](../level_01/nesting.md) — Combining block and inline nodes.

---

## 2. Term Category
- **Inline Text Semantics** (For `<code>`) / **Structural Tag** (For `<pre>`)

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all web browsers since the earliest versions of HTML).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, web browsers compress multiple spaces and ignore keyboard line breaks (Whitespace Collapse). While this makes formatting code easy, it is a nightmare when you want to display:
-   **Programming Code:** Which relies on tabs and line breaks to be readable.
-   **Poetry:** Where line positioning has artistic meaning.
-   **ASCII Art:** Visual images built from text characters.

To solve this, HTML introduced two tags:
1.  **`<pre>` (Preformatted Text):** A block-level tag that disables whitespace collapse. The browser renders text inside `<pre>` *exactly* as you type it in your HTML file, preserving every space, tab, and line break.
2.  **`<code>`:** An inline tag used to mark a short word or phrase as computer code within a normal sentence.

Both elements render their content in the browser's default **monospace font** (where every letter is exactly the same width), making characters align perfectly.

---

### (2) Combining `<pre>` and `<code>` for Code Blocks
If you want to display a multi-line block of programming code, web standards state you should nest `<code>` inside `<pre>`.
-   The `<pre>` preserves the line breaks and spaces.
-   The `<code>` indicates to search engines and compilers that the text is computer code.

```html
<pre><code>function helloWorld() {
  console.log("Hello!");
}</code></pre>
```
*Note: Make sure the opening code tag starts immediately after the pre tag without a newline, otherwise the browser will render a blank line at the top of your code block!*

---

### (3) Code Examples

#### Short Snippet
Marking inline code variables within a standard paragraph:

```html
<p>To run the application, use the <code>npm run dev</code> command in your terminal.</p>
```

#### Fuller Example
Nesting tags to display a code block alongside a poem:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Preformatted Code & Poetry</title>
</head>
<body>

  <h2>JavaScript Example</h2>
  <!-- Nesting code inside pre preserves the indentation -->
  <pre><code>const fruits = ["apple", "banana", "cherry"];

fruits.forEach((fruit) => {
  console.log(fruit);
});</code></pre>

  <h2>A Monospaced Poem</h2>
  <!-- pre tag preserves the spacing of the poem -->
  <pre>
    The code compiles,
      The servers hum,
        A webpage loads,
          The work is done.
  </pre>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to escape HTML characters inside code blocks

**The mistake:** Placing raw HTML tags inside a `<pre><code>` block when you want to show code examples:

```html
<!-- BAD: The browser will actually render the h1 header instead of displaying the code! -->
<pre><code>
  <h1>Welcome to HTML</h1>
</code></pre>
```

**Why it's wrong:** The browser's HTML parser reads `<h1>` and thinks you want to render a big heading inside your code block. To display code examples containing `<` and `>`, you must use **HTML Entities** to escape them:
-   Replace `<` with `&lt;` (less-than)
-   Replace `>` with `&gt;` (greater-than)

**Fix:**
```html
<pre><code>
  &lt;h1&gt;Welcome to HTML&lt;/h1&gt;
</code></pre>
```

---



### Mistake 2: Forgetting to Escape HTML Entities (`<` -> `&lt;`) Inside `<code>` Blocks

**The mistake:** Writing `<code><div>Hello</div></code>` expecting to display raw HTML tags.

**Why it's wrong:** Browsers parse raw `<` characters inside `<code>` as real HTML tags, rendering a `<div>` element instead of displaying code text. Escape `<` as `&lt;`.

*Incorrect:*
```html
<code><div>Test</div></code> <!-- ❌ Renders actual div element, not code text! -->
```

*Fix:*
```html
<code>&lt;div&gt;Test&lt;/div&gt;</code> <!-- Renders raw code text -->
```

### Mistake 3: Using `<pre>` Without `<code>` for Multi-Line Code Blocks

**The mistake:** Using `<pre>` alone without wrapping code snippets in `<code>`.

**Why it's wrong:** `<pre>` handles preformatted whitespace; `<code>` provides semantic meaning that content is computer code. Combine them `<pre><code>...</code></pre>`.

*Incorrect:*
```html
<pre>const x = 10;</pre> <!-- Missing semantic code container -->
```

*Fix:*
```html
<pre><code>const x = 10;</code></pre>
```



### Mistake 4: Forgetting to Escape HTML Entities (`<` -> `&lt;`) Inside `<code>` Blocks

**The mistake:** Writing `<code><div>Hello</div></code>` expecting to display raw HTML tags.

**Why it's wrong:** Browsers parse raw `<` characters inside `<code>` as real HTML tags, rendering a `<div>` element instead of displaying code text. Escape `<` as `&lt;`.

*Incorrect:*
```html
<code><div>Test</div></code> <!-- ❌ Renders actual div element, not code text! -->
```

*Fix:*
```html
<code>&lt;div&gt;Test&lt;/div&gt;</code> <!-- Renders raw code text -->
```

### Mistake 5: Using `<pre>` Without `<code>` for Multi-Line Code Blocks

**The mistake:** Using `<pre>` alone without wrapping code snippets in `<code>`.

**Why it's wrong:** `<pre>` handles preformatted whitespace; `<code>` provides semantic meaning that content is computer code. Combine them `<pre><code>...</code></pre>`.

*Incorrect:*
```html
<pre>const x = 10;</pre> <!-- Missing semantic code container -->
```

*Fix:*
```html
<pre><code>const x = 10;</code></pre>
```



### Mistake 6: Forgetting to Escape HTML Entities (`<` -> `&lt;`) Inside `<code>` Blocks

**The mistake:** Writing `<code><div>Hello</div></code>` expecting to display raw HTML tags.

**Why it's wrong:** Browsers parse raw `<` characters inside `<code>` as real HTML tags, rendering a `<div>` element instead of displaying code text. Escape `<` as `&lt;`.

*Incorrect:*
```html
<code><div>Test</div></code> <!-- ❌ Renders actual div element, not code text! -->
```

*Fix:*
```html
<code>&lt;div&gt;Test&lt;/div&gt;</code> <!-- Renders raw code text -->
```

### Mistake 7: Using `<pre>` Without `<code>` for Multi-Line Code Blocks

**The mistake:** Using `<pre>` alone without wrapping code snippets in `<code>`.

**Why it's wrong:** `<pre>` handles preformatted whitespace; `<code>` provides semantic meaning that content is computer code. Combine them `<pre><code>...</code></pre>`.

*Incorrect:*
```html
<pre>const x = 10;</pre> <!-- Missing semantic code container -->
```

*Fix:*
```html
<pre><code>const x = 10;</code></pre>
```

## 6. Practice Exercises

### Exercise 1: HTML Entity Escaping

**Problem:** You want to write a blog post showing how to link a stylesheet in HTML. Write the correct HTML block using `<pre>` and `<code>` to display the following line exactly as text:
`<link rel="stylesheet" href="style.css">`

**Expected output:**
> [!check]- Answer
> ```html
> <pre><code>&lt;link rel="stylesheet" href="style.css"&gt;</code></pre>
> ```
> - Replace `<` at the start with `&lt;`.
> - Replace `>` at the end with `&gt;`.
> - Wrap the entire line in `<pre><code>` to ensure monospacing.

---

### Exercise 2: Escaping Code Snippet

**Problem:** Write HTML snippet displaying raw text `<h1>Title</h1>` using `<pre><code>` and HTML entities.

**Expected output:**
> [!check]- Answer
> ```html
> <pre><code>&lt;h1&gt;Title&lt;/h1&gt;</code></pre>
> ```
>
> **Explanation:** `&lt;` and `&gt;` escape angle brackets so code displays as text.

---

### Exercise 3: pre Font Family Default

**Problem:** What font family type do browsers apply by default to `<pre>` and `<code>` elements?

**Expected output:**
> [!check]- Answer
> ```text
> Monospace font family (e.g. Courier, Consolas).
> ```
>
> **Explanation:** Monospace fonts ensure uniform character width for code readability.

## 7. Related Terms
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — The default browser behavior that `<pre>` overrides.
- [`<span>` (Inline Container)](../level_02/span.md) — A generic inline container that does not enforce monospacing.

---

## 8. Key Takeaways
- `<pre>` is a block-level container that preserves all spaces, tabs, and newlines.
- `<code>` is an inline container used to represent programming code snippets.
- To display a block of programming code, nest `<code>` inside `<pre>`.
- Both tags render text in a monospaced font by default.
- Always escape HTML characters (using `&lt;` and `&gt;`) when writing HTML code examples inside `<pre><code>`.
