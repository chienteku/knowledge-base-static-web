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

### Exercise 1: Constructing Hierarchical Heading Outlines for Screen Readers

**Scenario:** An author builds a structured article outline using logical heading levels (`<h1>` through `<h3>`).

**Requirements:**
1. Use a single `<h1>` for the primary document title.
2. Use `<h2>` for major sections.
3. Use `<h3>` for nested sub-sections.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main>
>   <h1>Complete Web Development Roadmap</h1>
>
>   <section>
>     <h2>Frontend Engineering</h2>
>     <p>Overview of client-side web technologies.</p>
>
>     <article>
>       <h3>HTML5 & Accessibility</h3>
>       <p>Semantic markup and WCAG standards.</p>
>     </article>
>
>     <article>
>       <h3>CSS Architecture</h3>
>       <p>Responsive flexbox and grid layouts.</p>
>     </article>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Heading Hierarchy (`<h1>`-`<h6>`)**: Headings define document outline structure; `<h1>` is highest rank, `<h6>` is lowest rank.
> 2. **Screen Reader Heading Navigation**: Screen reader users press shortcut keys (like `H` or `1`-`6`) to jump directly across heading outlines.
> 3. **Visual Size vs Heading Rank**: Do NOT pick heading levels for visual font sizes; use CSS to adjust font sizes and pick HTML heading ranks for structure.
> 
---

### Exercise 2: Fixing Skipped Heading Levels for Accessibility Compliance

**Scenario:** An accessibility auditor corrects a page that skipped from `<h1>` directly down to `<h4>`.

**Requirements:**
1. Fix heading hierarchy so levels increase sequentially by 1.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Fixed Sequential Heading Order -->
> <h1>Product Documentation</h1>
> <h2>Installation Guide</h2>
> <h3>Prerequisites</h3>
> <p>System requirements and software packages.</p>
> ```
>
> #### Technical Explanation
>
> 1. **No Skipped Levels Rule**: Never skip heading levels (e.g. `<h1>` to `<h3>` or `<h4>`); sequential progression maintains accessible outlines.
> 2. **WCAG 2.1 Compliance**: Proper heading rank sequence satisfies WCAG Success Criterion 1.3.1 (Info and Relationships).
> 3. **Document Tree Parsing**: Search engines build page summaries based on strict heading hierarchy trees.
> 
---

### Exercise 3: Single h1 Rule in Multi-Section Documents

**Scenario:** An auditor ensures that a web page contains exactly one primary `<h1>` element representing the main page topic.

**Requirements:**
1. Ensure only one `<h1>` exists per webpage.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header>
>   <h1>Acme Portal Customer Dashboard</h1>
> </header>
> <main>
>   <section>
>     <h2>Account Overview</h2>
>     <p>Your current plan details.</p>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Single `<h1>` Best Practice**: Having a single `<h1>` per page clearly identifies the primary topic for users and search engines.
> 2. **Sectioning Heading Scope**: Sub-sections should use `<h2>` through `<h6>` nested under the main `<h1>` topic.
> 3. **Page Title Alignment**: The `<h1>` text should closely align with the document `<title>` tag.
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
