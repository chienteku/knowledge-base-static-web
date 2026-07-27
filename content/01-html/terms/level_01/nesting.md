# Nesting

> **Level 1 — The Anatomy of a Webpage**
> The structural concept of placing HTML elements inside other HTML elements to create a hierarchical parent-child document relationship.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Understanding the start and end tag boundaries.
- [HTML](../level_01/html.md) — The standard markup language.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all web browsers since the earliest versions of HTML).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Fix the Nesting

**Problem:** The following HTML block has invalid nesting. Identify the errors and write the correct nested markup.

```html
<div>
  <h1>Welcome to our store!
  <p>Find the best <strong>deals here.</p></strong>
</div>
```

**Expected output:**
```html
<div>
  <h1>Welcome to our store!</h1>
  <p>Find the best <strong>deals here.</strong></p>
</div>
```

> [!check]- Answer
> - The `<h1>` tag is opened but never closed.
> - The `<strong>` tag closes after the `</p>` tag, creating an overlap.

---



### Exercise 2: Correcting Improper Nesting

**Problem:** Fix nesting error in `<div><p><span>Content</div></p></span>`.

**Expected output:**
```text
<div><p><span>Content</span></p></div>
```

> [!check]- Answer
> ```html
> <div><p><span>Content</span></p></div>
> ```
>
> **Explanation:** Tags must be closed in exact reverse order of opening (`span` -> `p` -> `div`).

### Exercise 3: Anchor Tag Nesting Rules in HTML5

**Problem:** Can an `<a>` anchor tag contain a `<div>` element in modern HTML5? (Yes/No).

**Expected output:**
```text
Yes. HTML5 allows block elements inside <a> anchors as long as no interactive elements (like buttons or other links) are nested.
```

> [!check]- Answer
> ```html
> <a href="/card">
>   <div>
>     <h2>Card Title</h2>
>     <p>Card description</p>
>   </div>
> </a>
> ```
>
> **Explanation:** HTML5 expanded `<a>` element flow content model to wrap block elements.

## 7. Related Terms
- [Element vs. Tag](../level_01/element_vs_tag.md) — The building blocks that are nested.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Nesting rules differ based on display properties (e.g., inline elements cannot contain block elements).

---

## 8. Key Takeaways
- Nesting means placing HTML elements entirely inside other HTML elements.
- It creates a parent-child relationship between outer and inner tags.
- Child tags must be closed before their parent tags are closed ("First Opened, Last Closed").
- Correct indentation is not required by browsers, but is crucial for developer readability.
- Inline elements should never wrap block-level elements.
