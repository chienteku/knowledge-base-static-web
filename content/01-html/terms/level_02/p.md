# `<p>` (Paragraph)

> **Level 2 — Text & Content**
> Defines a block of text.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — The `<p>` tag creates a paragraph element.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since paragraphs are block-level elements.
- [Whitespace Collapse](../level_01/whitespace_collapse.md) — Since paragraphs collapse sequential spaces and newlines.

---

## 2. Term Category
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you've defined the structural outline of your page using headings, you need a way to present the actual readable content. In HTML, browsers ignore standard line breaks (pressing "Enter" on your keyboard). If you write 100 lines of text in your code without any tags, the browser will smash them all together into one massive, unreadable block.
The `<p>` (paragraph) element was created to explicitly define blocks of text. Browsers automatically add a bit of vertical margin (blank space) before and after every `<p>` element, ensuring that text is broken up into readable chunks, exactly like a book.

### (2) Reality Metaphor
Imagine reading a novel. If there were no indentations or blank lines between thoughts, the entire book would just be one giant block of words from cover to cover.
The `<p>` tag is the equivalent of the author hitting the "Return/Enter" key to start a fresh thought on a new block.

### (3) Code Examples

#### Short Snippet
```html
<p>This is the first paragraph of my article.</p>
<p>This is the second paragraph. The browser will automatically put space between them.</p>
```

#### Fuller Example
```html
<body>
  <h2>About Me</h2>
  
  <p>Hello! I am a web developer learning HTML. I enjoy building structured, accessible websites.</p>
  
  <!-- Even though these sentences are on different lines in the code,
       the browser will render them on the SAME line if they are in the same <p>. -->
  <p>
    When I am not coding,
    I like to go hiking
    and read science fiction.
  </p>
</body>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on raw text without a tag

**The mistake:** Writing text directly inside the `<body>` without wrapping it in a `<p>` tag or another appropriate element.

**Why it's wrong:** While the browser will render "naked text", it is extremely bad practice. Naked text is difficult to target with CSS for styling, and screen readers lack the context to understand what the text represents.

*Incorrect:*
```html
<body>
  Welcome to my website. Here is some information about me.
</body>
```

*Fix:*
```html
<body>
  <p>Welcome to my website. Here is some information about me.</p>
</body>
```

### Mistake 2: Nesting block elements inside a paragraph

**The mistake:** Putting other block-level elements (like a `<div>`, a `<ul>` list, or an `<h1>`) inside a `<p>` tag.

**Why it's wrong:** The HTML specification strictly states that a `<p>` element can only contain "phrasing content" (inline elements like `<a>`, `<strong>`, or plain text). If you try to put a `<div>` inside a `<p>`, the browser will actually forcefully close your paragraph early, breaking your layout.

*Incorrect:*
```html
<p>
  Here is a list of my favorite foods:
  <ul>
    <li>Pizza</li>
    <li>Apples</li>
  </ul>
</p>
```

*Fix:*
```html
<p>Here is a list of my favorite foods:</p>
<ul>
  <li>Pizza</li>
  <li>Apples</li>
</ul>
```

---



### Mistake 3: Nesting Block-Level Elements (`<div>`, `<ul>`, `<h1>`) Inside `<p>` Tags

**The mistake:** Placing a `<div>` or `<ul>` inside a `<p>` paragraph.

**Why it's wrong:** Paragraph `<p>` elements are phrasing content containers. Placing block elements inside a `<p>` tag causes browsers to auto-close the `<p>` tag prematurely.

*Incorrect:*
```html
<p>
  <div>List:</div> <!-- ❌ Auto-closes paragraph early! -->
  <ul><li>Item</li></ul>
</p>
```

*Fix:*
```html
<div>
  <p>List title:</p>
  <ul><li>Item</li></ul>
</div>
```

### Mistake 4: Using Empty `<p></p>` Tags for Vertical Layout Spacing

**The mistake:** Inserting `<p></p>` or `<p>&nbsp;</p>` between content blocks to create vertical space.

**Why it's wrong:** Empty `<p>` tags clutter DOM tree markup. Use CSS `margin-bottom` or `gap` properties for vertical layout spacing.

*Incorrect:*
```html
<p>Section 1</p>
<p></p> <!-- ❌ Empty paragraph for spacing -->
<p>Section 2</p>
```

*Fix:*
```html
<p class="spaced">Section 1</p>
<p>Section 2</p>
```



### Mistake 5: Nesting Block-Level Elements (`<div>`, `<ul>`, `<h1>`) Inside `<p>` Tags

**The mistake:** Placing a `<div>` or `<ul>` inside a `<p>` paragraph.

**Why it's wrong:** Paragraph `<p>` elements are phrasing content containers. Placing block elements inside a `<p>` tag causes browsers to auto-close the `<p>` tag prematurely.

*Incorrect:*
```html
<p>
  <div>List:</div> <!-- ❌ Auto-closes paragraph early! -->
  <ul><li>Item</li></ul>
</p>
```

*Fix:*
```html
<div>
  <p>List title:</p>
  <ul><li>Item</li></ul>
</div>
```

### Mistake 6: Using Empty `<p></p>` Tags for Vertical Layout Spacing

**The mistake:** Inserting `<p></p>` or `<p>&nbsp;</p>` between content blocks to create vertical space.

**Why it's wrong:** Empty `<p>` tags clutter DOM tree markup. Use CSS `margin-bottom` or `gap` properties for vertical layout spacing.

*Incorrect:*
```html
<p>Section 1</p>
<p></p> <!-- ❌ Empty paragraph for spacing -->
<p>Section 2</p>
```

*Fix:*
```html
<p class="spaced">Section 1</p>
<p>Section 2</p>
```



### Mistake 7: Nesting Block-Level Elements (`<div>`, `<ul>`, `<h1>`) Inside `<p>` Tags

**The mistake:** Placing a `<div>` or `<ul>` inside a `<p>` paragraph.

**Why it's wrong:** Paragraph `<p>` elements are phrasing content containers. Placing block elements inside a `<p>` tag causes browsers to auto-close the `<p>` tag prematurely.

*Incorrect:*
```html
<p>
  <div>List:</div> <!-- ❌ Auto-closes paragraph early! -->
  <ul><li>Item</li></ul>
</p>
```

*Fix:*
```html
<div>
  <p>List title:</p>
  <ul><li>Item</li></ul>
</div>
```

### Mistake 8: Using Empty `<p></p>` Tags for Vertical Layout Spacing

**The mistake:** Inserting `<p></p>` or `<p>&nbsp;</p>` between content blocks to create vertical space.

**Why it's wrong:** Empty `<p>` tags clutter DOM tree markup. Use CSS `margin-bottom` or `gap` properties for vertical layout spacing.

*Incorrect:*
```html
<p>Section 1</p>
<p></p> <!-- ❌ Empty paragraph for spacing -->
<p>Section 2</p>
```

*Fix:*
```html
<p class="spaced">Section 1</p>
<p>Section 2</p>
```

## 6. Practice Exercises

### Exercise 1: White Space Collapse

**Problem:** If you type this exact code into an HTML file:
`<p>Word1          Word2</p>`
How many spaces will actually appear between Word1 and Word2 when viewed in the browser?

**Expected output:**
> [!check]- Answer
> ```text
> Exactly ONE space. HTML automatically collapses multiple spaces (and line breaks) into a single space.
> ```
> - Think about how HTML handles raw formatting vs tagged formatting.

---

### Exercise 2: Paragraph Element Rules

**Problem:** Which 2 of these elements can be nested inside a `<p>` tag?
1. `<span>` 
2. `<div>` 
3. `<strong>` 
4. `<h2>` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. <span> and 3. <strong>
> ```
>
> **Explanation:** Paragraphs can contain inline phrasing content (`<span>`, `<strong>`, `<a>`), but cannot contain block containers (`<div>`, `<h2>`).

---

### Exercise 3: Default Paragraph CSS Margins

**Problem:** What default CSS top and bottom margin spacing do browsers apply to `<p>` elements?

**Expected output:**
> [!check]- Answer
> ```text
> 1em (16px default font-size equivalent).
> ```
>
> **Explanation:** User-agent stylesheets apply `1em` top and bottom block margins to paragraphs.

## 7. Related Terms
- [Headings (`<h1>` to `<h6>`)](headings.md) — The titles that usually precede a `<p>`.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing paragraphs.
- [`<br>` & `<hr>`](br_hr.md) — Ways to break lines without starting a completely new paragraph block.
- [`<blockquote>` & `<cite>`](blockquote_cite.md) — Related concept: `<blockquote>` & `<cite>`.

---

## 8. Key Takeaways
- The `<p>` element is the standard way to group sentences into a block of text.
- Browsers automatically add vertical space (margin) above and below paragraphs.
- HTML ignores multiple spaces and keyboard "Enter" presses; you must use tags to structure text.
- You cannot put block elements (like `<div>` or lists) inside a `<p>` element.
