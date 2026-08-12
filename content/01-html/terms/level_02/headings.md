# Headings (`<h1>` to `<h6>`)

> **Level 2 — Text & Content**
> Tags used to define hierarchical headings.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Headings are structural elements.
- [`<body>`](../level_01/body.md) — Headings must be placed inside the body.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since headings are block-level elements.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: Headings (`<h1>` to `<h6>`) is a fundamental concept in this technology stack. **Level 2 — Text & Content**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A wall of uninterrupted text is unreadable. When the web was designed to share documents, it needed a way to break that text down into chapters, sections, and subsections—just like a newspaper or a textbook.
The W3C created six levels of headings (`<h1>` through `<h6>`) to provide a strict hierarchy. The `<h1>` is the main title of the page, `<h2>` is a major section, `<h3>` is a subsection, and so on. 
Importantly, these tags are designed to define the *structure and meaning* of the document, not the visual size. Screen readers use these headings to allow visually impaired users to quickly jump between sections, just like skimming a table of contents. Search engines use them to understand what the page is about.

### (2) Reality Metaphor
Imagine an outline for a term paper.
The `<h1>` is the title of the paper.
The `<h2>`s are the main chapters.
The `<h3>`s are the specific topics within those chapters.
If you suddenly jumped from the title directly to a sub-sub-sub-topic (`<h5>`) without having any chapters in between, the outline wouldn't make logical sense.

### (3) Code Examples

#### Short Snippet
```html
<h1>Main Page Title</h1>
<h2>A Major Section</h2>
<h3>A Subsection</h3>
```

#### Fuller Example
```html
<body>
  <!-- The main topic of this page -->
  <h1>Space Exploration</h1>

  <!-- A major section -->
  <h2>The Apollo Missions</h2>
  <p>The Apollo program was designed to land humans on the Moon...</p>

  <!-- A subsection belonging to the Apollo section -->
  <h3>Apollo 11</h3>
  <p>Apollo 11 was the spaceflight that first landed humans on the Moon...</p>

  <!-- Another major section -->
  <h2>The Artemis Program</h2>
  <p>Artemis is a robotic and human Moon exploration program...</p>
</body>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using headings for visual styling

**The mistake:** Choosing a heading tag (like `<h4>`) simply because you want the text to be a specific visual size, rather than because it fits the structural outline of the page.

**Why it's wrong:** This destroys accessibility (a11y) and SEO. A screen reader user navigating by headings will get completely lost if you use an `<h4>` as a call-to-action button just because it looks bold. If you need big text, use a regular paragraph `<p>` or `<button>` and style it with CSS.

*Incorrect:*
```html
<!-- Using h3 just to make the text big and bold -->
<button><h3>Click here to subscribe!</h3></button>
```

*Fix:*
```html
<!-- Use CSS to make the text big and bold -->
<button class="large-bold-text">Click here to subscribe!</button>
```

### Mistake 2: Skipping heading levels

**The mistake:** Jumping from an `<h1>` directly to an `<h4>`.

**Why it's wrong:** Headings must not skip levels. It breaks the logical hierarchy of the document outline.

*Incorrect:*
```html
<h1>My Blog</h1>
<h4>Latest Posts</h4>
```

*Fix:*
```html
<h1>My Blog</h1>
<h2>Latest Posts</h2>
```

---



### Mistake 3: Skipping Heading Levels (`<h1>` followed directly by `<h3>`)

**The mistake:** Jumping from an `<h1>` page title directly down to an `<h3>` section sub-heading.

**Why it's wrong:** Screen readers build an interactive table-of-contents for blind users based on heading levels. Skipping levels (`<h1>` -> `<h3>`) breaks the outline structure.

*Incorrect:*
```html
<h1>Main Page Title</h1>
<h3>Sub-heading</h3> <!-- ❌ Skipped <h2> level! -->
```

*Fix:*
```html
<h1>Main Page Title</h1>
<h2>Sub-heading</h2> <!-- Strict sequential heading hierarchy -->
```

### Mistake 4: Using Multiple `<h1>` Tags on a Single Page (Pre-HTML5 Layout Fallacy)

**The mistake:** Placing 5 separate `<h1>` tags on a standard marketing page.

**Why it's wrong:** A web page should contain exactly ONE `<h1>` element representing the main document title. Multiple `<h1>` tags dilute SEO focus.

*Incorrect:*
```html
<h1>Logo</h1>
<h1>Welcome</h1>
<h1>Services</h1> <!-- ❌ Multiple h1 tags -->
```

*Fix:*
```html
<h1>Welcome to Acme Corp</h1> <!-- Single h1 per page -->
<h2>Our Services</h2>
```



### Mistake 5: Skipping Heading Levels (`<h1>` followed directly by `<h3>`)

**The mistake:** Jumping from an `<h1>` page title directly down to an `<h3>` section sub-heading.

**Why it's wrong:** Screen readers build an interactive table-of-contents for blind users based on heading levels. Skipping levels (`<h1>` -> `<h3>`) breaks the outline structure.

*Incorrect:*
```html
<h1>Main Page Title</h1>
<h3>Sub-heading</h3> <!-- ❌ Skipped <h2> level! -->
```

*Fix:*
```html
<h1>Main Page Title</h1>
<h2>Sub-heading</h2> <!-- Strict sequential heading hierarchy -->
```

### Mistake 6: Using Multiple `<h1>` Tags on a Single Page (Pre-HTML5 Layout Fallacy)

**The mistake:** Placing 5 separate `<h1>` tags on a standard marketing page.

**Why it's wrong:** A web page should contain exactly ONE `<h1>` element representing the main document title. Multiple `<h1>` tags dilute SEO focus.

*Incorrect:*
```html
<h1>Logo</h1>
<h1>Welcome</h1>
<h1>Services</h1> <!-- ❌ Multiple h1 tags -->
```

*Fix:*
```html
<h1>Welcome to Acme Corp</h1> <!-- Single h1 per page -->
<h2>Our Services</h2>
```



### Mistake 7: Skipping Heading Levels (`<h1>` followed directly by `<h3>`)

**The mistake:** Jumping from an `<h1>` page title directly down to an `<h3>` section sub-heading.

**Why it's wrong:** Screen readers build an interactive table-of-contents for blind users based on heading levels. Skipping levels (`<h1>` -> `<h3>`) breaks the outline structure.

*Incorrect:*
```html
<h1>Main Page Title</h1>
<h3>Sub-heading</h3> <!-- ❌ Skipped <h2> level! -->
```

*Fix:*
```html
<h1>Main Page Title</h1>
<h2>Sub-heading</h2> <!-- Strict sequential heading hierarchy -->
```

### Mistake 8: Using Multiple `<h1>` Tags on a Single Page (Pre-HTML5 Layout Fallacy)

**The mistake:** Placing 5 separate `<h1>` tags on a standard marketing page.

**Why it's wrong:** A web page should contain exactly ONE `<h1>` element representing the main document title. Multiple `<h1>` tags dilute SEO focus.

*Incorrect:*
```html
<h1>Logo</h1>
<h1>Welcome</h1>
<h1>Services</h1> <!-- ❌ Multiple h1 tags -->
```

*Fix:*
```html
<h1>Welcome to Acme Corp</h1> <!-- Single h1 per page -->
<h2>Our Services</h2>
```

## 5. Practice Exercises

### Exercise 1: Finding the Outline

**Problem:** If you were writing a recipe page for "Chocolate Chip Cookies", what heading tags would you use for: The Recipe Title, The Ingredients List, The Instructions, and The Baking Time (which is a subsection of Instructions)?

**Expected output:**
> [!check]- Answer
> ```text
> <h1>Chocolate Chip Cookies</h1>
> <h2>Ingredients</h2>
> <h2>Instructions</h2>
> <h3>Baking Time</h3>
> ```
> - The title is the most important.
> - Ingredients and Instructions are equal siblings.
> - Baking Time belongs *inside* Instructions.
> 
---

### Exercise 2: Structuring Sequential Heading Hierarchy

**Problem:** Structure heading levels for: 1 Page Title; 2 Main Sections; 2 Sub-sections under Section 1.

**Expected output:**
> [!check]- Answer
> ```html
> <h1>Page Title</h1>
> <section>
>   <h2>Section 1</h2>
>   <h3>Sub-section 1.1</h3>
>   <h3>Sub-section 1.2</h3>
> </section>
> <section>
>   <h2>Section 2</h2>
> </section>
> ```
>
> **Explanation:** Heading tags construct a nested outline tree for accessibility and search engines.
> 
---

### Exercise 3: Styling Headings vs Heading Semantics

**Problem:** Should you change `<h2>` to `<h4>` because the font size looks too big on screen? (Yes/No). Explain.

**Expected output:**
> [!check]- Answer
> ```text
> No. Use CSS font-size to change visual size; keep h2 for proper semantic document hierarchy.
> ```
>
> **Explanation:** Heading tags dictate structural hierarchy; CSS dictates visual font size.
> 
## 6. Related Terms
- [`<p>` (Paragraph)](p.md) — The text that usually follows a heading.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing headings.
- [Semantic HTML](../level_06/semantic_html.md) — The overarching concept of using tags for their structural meaning.
- [Heading Hierarchy & Document Outline](../level_06/heading_hierarchy.md) — Related concept: Heading Hierarchy & Document Outline.

---

## 7. Key Takeaways
- Use `<h1>` to `<h6>` to create a logical outline for your webpage.
- Never skip heading levels (e.g., don't jump from `<h1>` to `<h3>`).
- Never use headings just to make text big or bold; use CSS for styling.
- There should generally only be one `<h1>` per page.
