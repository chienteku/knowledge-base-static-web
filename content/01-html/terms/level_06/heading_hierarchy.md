# Heading Hierarchy & Document Outline

> **Level 6 — Semantic HTML5**
> The design principle of structuring headings (`<h1>` through `<h6>`) in a sequential, logical order to establish a clear hierarchy (document outline) for accessibility and search engine optimization.

---

## 1. Prerequisites
- [Headings (`<h1>` to `<h6>`)](../level_02/headings.md) — The visual header tags.
- [Semantic HTML](semantic_html.md) — Document organization theory.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all SEO spiders and screen readers to construct document outline indices).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Outline Repair

**Problem:** The following HTML structure has a broken heading hierarchy. Rearrange or re-tag the headings to make the outline sequential.

```html
<h1>Car Catalog</h1>
<h3>Sedans</h3>
<h4>Toyota Camry</h4>
<h2>SUVs</h2>
```

**Expected output:**
> [!check]- Answer
> ```html
> <h1>Car Catalog</h1>
> <h2>Sedans</h2>
> <h3>Toyota Camry</h3>
> <h2>SUVs</h2>
> ```
> - The page jumps from `<h1>` directly to `<h3>` at "Sedans". That level must be repaired to `<h2>`.
> - "Toyota Camry" should drop to `<h3>` since it is a subsection of "Sedans".
> 
---



### Exercise 2: Document Heading Hierarchy Audit

**Problem:** Audit heading hierarchy order: `<h1>` -> `<h2>` -> `<h4>` -> `<h3>`. Identify error and fix.

**Expected output:**
> [!check]- Answer
> ```text
> Error: <h4> comes before <h3>. Fix: <h1> -> <h2> -> <h3> -> <h4>.
> ```
> ```text
> Error: <h4> comes before <h3>. Fix: <h1> -> <h2> -> <h3> -> <h4>.
> ```
>
> **Explanation:** Heading levels must descend sequentially without skipping or reversing levels.
> 
---

### Exercise 3: Screen Reader Heading Navigation Shortcut

**Problem:** Which keyboard shortcut key do screen reader users (NVDA/JAWS) press to cycle through headings on a webpage?

**Expected output:**
> [!check]- Answer
> ```text
> H key (or 1-6 number keys for specific heading levels).
> ```
> ```text
> H key (or 1-6 number keys for specific heading levels).
> ```
>
> **Explanation:** Screen reader users rely on heading hotkeys to scan document outlines.
> 
## 7. Related Terms
- [Headings (`<h1>` to `<h6>`)](../level_02/headings.md) — The tags that define outline points.
- [Semantic HTML](semantic_html.md) — The concept framework.
- [`<article>` and `<section>`](article_section.md) — Containers that enclose outline sections.
- [SEO Fundamentals for HTML](../level_09/seo_fundamentals.md) — Related concept: SEO Fundamentals for HTML.

---

## 8. Key Takeaways
- The document outline is the machine-readable table of contents of a webpage.
- Only use one `<h1>` per page.
- Heading levels must decrease sequentially (`<h1>` -> `<h2>` -> `<h3>`) without skipping numbers.
- You can skip heading numbers when stepping *up* the hierarchy to start a new section.
- Never choose a heading level based on its visual size; always separate structure (HTML) from presentation (CSS).
