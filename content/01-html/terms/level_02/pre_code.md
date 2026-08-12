# `<pre>` & `<code>`

> **Level 2 — Text & Content**
> Elements used to display computer code, ASCII art, or poetry by preserving white space and formatting in a monospaced font.

---

## 1. Prerequisites
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — The browser behavior these tags modify or bypass.
- [`<p>` (Paragraph)](p.md) — Standard paragraph text blocks.
- [Nesting](../level_01/nesting.md) — Combining block and inline nodes.

---

## 2. Term Category

**Inline Text Semantics (For `<code>`) / Structural Tag (For `<pre>`) (Universal Browser Support .)**: `<pre>` & `<code>` is a fundamental concept in this technology stack. **Level 2 — Text & Content**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Displaying Multiline Code Snippets with pre and code

**Scenario:** A technical blogger displays a formatted JavaScript code snippet preserving exact spacing and line breaks.

**Requirements:**
1. Wrap code block inside `<pre><code>...</code></pre>`.
2. Escape HTML special characters inside code block.
3. Verify monospace font rendering.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="code-example">
>   <figcaption>JavaScript Function Example:</figcaption>
>   <pre><code>function greetUser(name) {
>   // Preserves exact 2-space indentation and newlines
>   return `Hello, ${name}!`;
> }</code></pre>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **Combining `<pre>` and `<code>`**: `<pre>` preserves whitespace and newlines; `<code>` identifies the text as computer programming language.
> 2. **Verbatim Whitespace Rendering**: Text inside `<pre>` renders verbatim in a monospace font without collapsing spaces.
> 3. **No Extra Outer Spacing**: Avoid newline spaces immediately after `<code>` tag to prevent unwanted blank lines in rendering.
> 
---

### Exercise 2: Inline Technical Identifiers using code inside Paragraphs

**Scenario:** An author mentions function names and file paths inline within narrative sentences.

**Requirements:**
1. Use `<code>` tags inline inside `<p>` elements.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   To configure your app, update the <code>config.json</code> file and execute the <code>npm run build</code> script in your terminal.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **Inline `<code>` Semantics**: Indicates short inline computer code, variable names, or filenames within text prose.
> 2. **Monospace Styling**: Browsers render inline `<code>` in monospace font without breaking paragraph layout.
> 3. **Screen Reader Context**: Helps assistive tools recognize code terminology.
> 
---

### Exercise 3: Escaping HTML Special Characters inside pre and code Blocks

**Scenario:** Displays HTML markup examples safely inside `<code>` blocks without triggering browser rendering.

**Requirements:**
1. Escape `<` as `&lt;` and `>` as `&gt;` inside code text.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <pre><code>&lt;div class="container"&gt;
>   &lt;p&gt;Sample HTML markup example&lt;/p&gt;
> &lt;/div&gt;</code></pre>
> ```
>
> #### Technical Explanation
>
> 1. **HTML Entity Escaping**: Must replace `<` with `&lt;`, `>` with `&gt;`, and `&` with `&amp;` inside code snippets.
> 2. **Preventing Browser HTML Parsing**: Unescaped HTML tags inside `<code>` will be rendered as real DOM elements by the browser parser.
> 3. **Code Block Safety**: Ensures tutorial code examples display text accurately.
## 6. Related Terms
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — The default browser behavior that `<pre>` overrides.
- [`<span>` (Inline container)](span.md) — A generic inline container that does not enforce monospacing.

---

## 7. Key Takeaways
- `<pre>` is a block-level container that preserves all spaces, tabs, and newlines.
- `<code>` is an inline container used to represent programming code snippets.
- To display a block of programming code, nest `<code>` inside `<pre>`.
- Both tags render text in a monospaced font by default.
- Always escape HTML characters (using `&lt;` and `&gt;`) when writing HTML code examples inside `<pre><code>`.
