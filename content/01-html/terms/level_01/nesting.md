# Nesting

> **Level 1 — The Anatomy of a Webpage**
> The structural concept of placing HTML elements inside other HTML elements to create a hierarchical parent-child document relationship.

---

## 1. Prerequisites
- [Element vs. Tag](element_vs_tag.md) — Understanding the start and end tag boundaries.
- [HTML (HyperText Markup Language)](html.md) — The standard markup language.

---

## 2. Term Category

**Concept / Architecture (Universal Browser Support .)**: Nesting is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A web page is rarely a flat list of text. It has structure: a navigation bar containing links, a side card containing an image and a heading, or a list containing bullet points. 

To represent this structure, HTML needs a way to group and isolate elements. It achieves this through **Nesting**—placing elements completely inside other elements. 

Nesting establishes a **hierarchy**. The outer wrapping element is the **parent**, and any element wrapped inside is a **child**. Elements inside the child are **grandchildren**, and so on. This creates a nested family tree that the browser uses to understand the layout and boundaries of your webpage.

---

### (2) The "First Opened, Last Closed" Rule
The most critical rule of nesting is that tags must not overlap. An inner child element must be fully closed *before* its outer parent element is closed. 

```html
<!-- CORRECT: strong opens and closes fully inside the paragraph -->
<p>This is <strong>important</strong> text.</p>

<!-- INCORRECT: The tags overlap (strong closes after the paragraph closes) -->
<p>This is <strong>important text.</p></strong>
```

---

### (3) Code Examples

#### Short Snippet
Nesting basic text formatting tags inside a paragraph:

```html
<!-- Parent element: <p> -->
<p>
  We are learning HTML to build 
  <!-- Child element: <strong> -->
  <strong>modern, accessible websites</strong>.
</p>
```

#### Fuller Example
Nesting layout elements to create a profile card:

```html
<!-- Grandparent container: <div> -->
<div class="user-profile">
  <!-- Parent element: <h2> -->
  <h2>Jane Doe</h2>

  <!-- Parent element: <p> -->
  <p>
    Jane is a writer. Read her 
    <!-- Child element: <a> nested inside <p> -->
    <a href="/stories">latest stories</a>.
  </p>
</div>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Overlapping tag boundaries

**The mistake:** Closing a parent tag before closing its child tag:

```html
<!-- BAD: Overlapping tags -->
<p>Please click the <a>link</p>to proceed.</a>
```

**Why it's wrong:** Modern browsers try to automatically correct this error behind the scenes by guessing where you meant to close the tags. However, their guess might not match your intent, which leads to layout breakage, broken styles, or links that cannot be clicked.

**Golden Rule:** The last tag you open must be the first tag you close (LIFO - Last In, First Out).

---



### Mistake 2: Overlapping HTML Tags Out of Order (Improper Nesting)

**The mistake:** Writing `<b><i>Text</b></i>` with overlapping tags.

**Why it's wrong:** HTML tags must be closed in reverse order of opening (Last In, First Out). Overlapping tags break DOM tree construction.

*Incorrect:*
```html
<p><b>Nested text</p></b> <!-- ❌ Improper tag overlap! -->
```

*Fix:*
```html
<p><b>Nested text</b></p> <!-- Correct LIFO nesting order -->
```

### Mistake 3: Nesting Paragraphs Inside Paragraphs (`<p><p></p></p>`)

**The mistake:** Nesting a `<p>` element inside another `<p>` element.

**Why it's wrong:** HTML specifications forbid `<p>` elements from containing block-level children. Browsers automatically auto-close the first `<p>` when seeing a second `<p>`.

*Incorrect:*
```html
<p>Outer paragraph
  <p>Inner paragraph</p> <!-- ❌ Auto-closes outer paragraph early! -->
</p>
```

*Fix:*
```html
<div>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</div>
```

## 5. Practice Exercises

### Exercise 1: Nested Navigation Menu List Structure

**Scenario:** An accessibility author constructs a multi-level navigation menu using correctly nested list elements.

**Requirements:**
1. Create `<nav>` container.
2. Nest `<ul>` inside `<nav>`.
3. Nest `<li>` inside `<ul>` and `<a>` inside `<li>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <nav aria-label="Main Menu">
>   <ul>
>     <li><a href="/">Home</a></li>
>     <li>
>       <a href="/products">Products</a>
>       <ul>
>         <li><a href="/products/software">Software</a></li>
>         <li><a href="/products/hardware">Hardware</a></li>
>       </ul>
>     </li>
>     <li><a href="/contact">Contact</a></li>
>   </ul>
> </nav>
> ```
>
> #### Technical Explanation
>
> 1. **Valid List Nesting**: Sub-lists (`<ul>`) MUST be nested directly inside list items (`<li>`), never directly inside parent `<ul>`.
> 2. **Screen Reader Menu Traversal**: Proper list nesting allows screen readers to announce nested sub-menu levels accurately.
> 3. **DOM Tree Hierarchy**: Correct parent-child nesting maintains predictable CSS selector matching (`nav > ul > li`).
> 
---

### Exercise 2: Fixing Overlapping Tag Nesting Errors

**Scenario:** A developer fixes illegal overlapping tags (`<p><strong>text</p></strong>`) to ensure valid DOM tree hierarchy.

**Requirements:**
1. Ensure inner tags are closed before outer tags close.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Fixed: Tags are closed in First-In-Last-Out order -->
> <p>
>   This text contains <strong>properly nested bold emphasis</strong> within a paragraph.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **FILO Closure Order**: Tags must be closed in First-In, Last-Out (FILO) order: `<outer><inner></inner></outer>`.
> 2. **Overlapping Tag Bugs**: Overlapping tags (`<a><b></a></b>`) force browser error recovery to mutate DOM structure unexpectedly.
> 3. **Linter Validation**: HTML linters flag improperly nested tags before deployment.
> 
---

### Exercise 3: Hierarchical Heading and Container Nesting

**Scenario:** Structures article sections with matching heading levels (`<h1>` -> `<h2>` -> `<h3>`) for accessibility outline.

**Requirements:**
1. Nest `<h2>` inside `<section>`.
2. Nest `<h3>` inside subsection.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main>
>   <h1>Web Accessibility Guide</h1>
>   <section>
>     <h2>Visual Accessibility</h2>
>     <p>Overview of color contrast requirements.</p>
>     <article>
>       <h3>Color Contrast Ratios</h3>
>       <p>Ensure text achieves at least 4.5:1 contrast ratio.</p>
>     </article>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Heading Hierarchy**: Headings must form a logical outline without skipping levels (`<h1>` -> `<h2>` -> `<h3>`).
> 2. **Semantic Sectioning**: Nesting heading tags inside `<section>` and `<article>` defines structural document boundaries.
> 3. **Screen Reader Heading Outline**: Screen readers navigate documents by hopping through heading levels.
## 6. Related Terms
- [Element vs. Tag](element_vs_tag.md) — The building blocks that are nested.
- [Block-level vs Inline Elements](block_inline.md) — Nesting rules differ based on display properties (e.g., inline elements cannot contain block elements).
- [Comments (<!-- -->)](comments.md) — Related concept: Comments (<!-- -->).
- [Whitespace Collapse](whitespace_collapse.md) — Related concept: Whitespace Collapse.
- [The Tree Structure](../level_09/tree_structure.md) — Related concept: The Tree Structure.

---

## 7. Key Takeaways
- Nesting means placing HTML elements entirely inside other HTML elements.
- It creates a parent-child relationship between outer and inner tags.
- Child tags must be closed before their parent tags are closed ("First Opened, Last Closed").
- Correct indentation is not required by browsers, but is crucial for developer readability.
- Inline elements should never wrap block-level elements.
