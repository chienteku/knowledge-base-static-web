# Heading Hierarchy & Document Outline

> **Level 6 — Semantic HTML5**
> The design principle of structuring headings (`<h1>` through `<h6>`) in a sequential, logical order to establish a clear hierarchy (document outline) for accessibility and search engine optimization.

---

## 1. Prerequisites
- [Headings (`<h1>` to `<h6>`)](../level_02/headings.md) — The visual header tags.
- [Semantic HTML](semantic_html.md) — Document organization theory.

---

## 2. Term Category

**Concept / Architecture (Universal Browser Support .)**: Heading Hierarchy & Document Outline is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Sighted users scroll down a page and instantly scan heading styles (bold, size changes) to understand what the document is about. They can tell that a large centered header is a main chapter, and a smaller left-aligned header is a subsection.

Screen readers and search engine indexers cannot "see" visual layouts. Instead, they read the **Document Outline**—which is the programmatic equivalent of a book's Table of Contents. 

The browser builds this outline by inspecting the numeric values of your heading tags (`<h1>` to `<h6>`). 

If you use headings incorrectly, the document outline becomes scrambled, making it difficult for Google to index your content and confusing blind users who rely on heading shortcuts to navigate.

---

### (2) Rules for a Clean Outline
To maintain a perfect, accessible document outline, you must follow these architectural guidelines:

#### 1. Only One `<h1>` Per Page
The `<h1>` represents the title of the entire document. Just as a book only has one primary title, a webpage should only have one `<h1>`.

#### 2. Never Skip Heading Levels
You must always move down the hierarchy sequentially:
-   `<h1>` is followed by `<h2>` (major section).
-   `<h2>` is followed by `<h3>` (subsection).
-   `<h3>` is followed by `<h4>` (sub-subsection).

**You must never jump from `<h1>` directly to `<h3>` or `<h4>`.** If you want a heading to look smaller visually, use the next logical header number (like `<h2>`) and style its font size with CSS.

#### 3. Stepping Back Up
While you cannot skip levels going *down* the hierarchy, you *can* skip levels going *up* when starting a new major section. For example, after completing a sub-subsection (`<h4>`), starting a new chapter returns directly to `<h2>`.

---

### (3) The Outline Mapping Analogy
Think of the document outline as a nested list:

```text
Book Title (H1)
 ├── Chapter 1 (H2)
 │    ├── Section 1.1 (H3)
 │    └── Section 1.2 (H3)
 └── Chapter 2 (H2)
      └── Section 2.1 (H3)
           └── Details (H4)
```

---

### (4) Code Examples

#### Short Snippet
A simple outline schema:

```html
<h1>Cooking Guide</h1> <!-- Document Title -->
  <h2>Baking Cakes</h2> <!-- Major Topic -->
    <h3>Oven Temperatures</h3> <!-- Sub-topic -->
  <h2>Making Soup</h2> <!-- New Major Topic -->
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nesting Outline Demonstration</title>
</head>
<body>

  <!-- Main Document Title -->
  <h1>Space Exploration Portal</h1>

  <main>
    
    <section>
      <!-- Level 2: First Major Topic -->
      <h2>1. The Solar System</h2>
      <p>Our solar system contains eight planets...</p>
      
      <!-- Level 3: Subsection under Solar System -->
      <h3>1.1 Earth</h3>
      <p>Earth is the third planet from the sun...</p>

      <!-- Level 3: Sibling subsection under Solar System -->
      <h3>1.2 Mars</h3>
      <p>Mars is a cold, desert planet...</p>
    </section>

    <section>
      <!-- Level 2: Second Major Topic (Stepping back up from H3) -->
      <h2>2. Deep Space Objects</h2>
      <p>Beyond our solar system lie nebulas and black holes...</p>
      
      <h3>2.1 Black Holes</h3>
      <p>Black holes are regions of space where gravity is intense...</p>
      
      <!-- Level 4: Nested detail under Black Holes -->
      <h4>2.1.1 Event Horizon</h4>
      <p>The boundary defining the limit of escape...</p>
    </section>

  </main>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Choosing heading levels for font styling

**The mistake:** Using an `<h4>` or `<h5>` tag just because you want small, bold text:

```html
<!-- BAD: Jumps from H1 to H5, breaking the document outline! -->
<h1>Healthy Eating</h1>
<h5>Remember to drink water!</h5>
```

**Why it's wrong:** Sighted users see it correctly, but search engines will index "Remember to drink water" as a deeply nested sub-subsection under a non-existent H2/H3/H4 hierarchy. 

**Fix:** Use the next logical heading level (`<h2>`) and apply CSS styling to make it physically smaller:

```html
<!-- CORRECT: Hierarchy remains clean; style is adjusted separately -->
<h1>Healthy Eating</h1>
<h2 class="sub-alert">Remember to drink water!</h2>
```

---



### Mistake 2: Choosing Heading Levels Based on Visual Font Size Instead of Document Outline Structure

**The mistake:** Using `<h4>` for a major section title because you want smaller text on screen.

**Why it's wrong:** Heading levels construct the structural outline tree for screen reader navigation. Use CSS `font-size` to alter visual appearance; keep semantic heading hierarchy (`<h1>` -> `<h2>` -> `<h3>`).

*Incorrect:*
```html
<h1>Main Title</h1>
<h4>Section Title</h4> <!-- ❌ Skipped h2 and h3 levels! -->
```

*Fix:*
```html
<h1>Main Title</h1>
<h2>Section Title</h2> <!-- CSS handles visual size: h2 { font-size: 1.2rem; } -->
```

### Mistake 3: Including Multiple `<h1>` Elements on Standard Web Pages

**The mistake:** Using `<h1>` for every section heading on a single landing page.

**Why it's wrong:** A document should feature exactly ONE primary `<h1>` element representing the main page title. Sub-sections must use `<h2>` down to `<h6>`.

*Incorrect:*
```html
<h1>Logo</h1><h1>Hero</h1><h1>Features</h1> <!-- ❌ Dilutes SEO focus -->
```

*Fix:*
```html
<h1>Hero Title</h1>
<h2>Features</h2>
```

## 5. Practice Exercises

### Exercise 1: Auditing and Correcting Out-of-Order Headings

**Scenario:** An accessibility author audits a document and corrects out-of-order heading levels (`<h1>` -> `<h3>`) to ensure a sequential hierarchy.

**Requirements:**
1. Audit heading levels.
2. Fix skipped levels so headings increase sequentially (`<h1>` -> `<h2>` -> `<h3>`).
3. Verify single `<h1>` page root.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Corrected Sequential Heading Hierarchy -->
> <main>
>   <h1>Acme Store Knowledge Base</h1>
>
>   <section>
>     <h2>Account Management</h2>
>     <p>Instructions for updating your profile.</p>
>
>     <article>
>       <h3>Resetting Your Password</h3>
>       <p>Follow these steps to reset your security password.</p>
>     </article>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Heading Rank Rules**: Headings MUST be ordered sequentially (`<h1>` -> `<h2>` -> `<h3>`); never skip levels (e.g. `<h1>` to `<h3>`).
> 2. **Single `<h1>` Rule**: A webpage should have exactly one `<h1>` representing the main topic of the page.
> 3. **Visual vs Structural Separation**: Pick heading levels based on document structure, NOT visual font size; use CSS to customize font sizes.
> 
---

### Exercise 2: Screen Reader Heading Tree Traversal Structure

**Scenario:** Constructs a multi-level heading tree for an e-commerce catalog page.

**Requirements:**
1. Create structured heading tree (`<h1>` down to `<h4>`).

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main>
>   <h1>Electronics Catalog</h1>
>
>   <section>
>     <h2>Laptops & Computers</h2>
>
>     <article>
>       <h3>Gaming Laptops</h3>
>       <h4>15-inch Models</h4>
>       <p>Product list...</p>
>     </article>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Screen Reader Shortcut Navigation**: Blind users press `H` or `1`-`6` to jump across heading outline levels.
> 2. **Logical Tree Outline**: Proper hierarchy builds an automatic table of contents for assistive technology.
> 3. **WCAG 2.1 SC 1.3.1**: Satisfies Information and Relationships accessibility requirements.
> 
---

### Exercise 3: Single h1 Rule with Nested Section Outlines

**Scenario:** Verifies single `<h1>` usage across multiple `<section>` elements.

**Requirements:**
1. Ensure only one `<h1>` exists on the entire page.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header>
>   <h1>Company Annual Report 2026</h1>
> </header>
> <main>
>   <section>
>     <h2>Executive Summary</h2>
>   </section>
>   <section>
>     <h2>Financial Results</h2>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Single Page Title Alignment**: Single `<h1>` aligns with document `<title>` tag for search engines.
> 2. **Section `<h2>` Boundaries**: Use `<h2>` for top-level section chapters under the main `<h1>`.
> 3. **Clean HTML Outline**: Ensures predictable W3C outline algorithm rendering.
## 6. Related Terms
- [Headings (`<h1>` to `<h6>`)](../level_02/headings.md) — The tags that define outline points.
- [Semantic HTML](semantic_html.md) — The concept framework.
- [`<article>` and `<section>`](article_section.md) — Containers that enclose outline sections.
- [SEO Fundamentals for HTML](../level_09/seo_fundamentals.md) — Related concept: SEO Fundamentals for HTML.

---

## 7. Key Takeaways
- The document outline is the machine-readable table of contents of a webpage.
- Only use one `<h1>` per page.
- Heading levels must decrease sequentially (`<h1>` -> `<h2>` -> `<h3>`) without skipping numbers.
- You can skip heading numbers when stepping *up* the hierarchy to start a new section.
- Never choose a heading level based on its visual size; always separate structure (HTML) from presentation (CSS).
