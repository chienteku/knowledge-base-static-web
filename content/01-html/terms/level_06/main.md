# `<main>`

> **Level 6 — Semantic HTML5**
> The primary content area of a document.

---

## 1. Prerequisites
- [Semantic HTML](../level_06/semantic_html.md) — The core philosophy behind the `<main>` tag.
- [`<body>`](../level_01/body.md) — The `<main>` tag is always a child of the `<body>`.
- [Nesting](../level_01/nesting.md) — Since primary text blocks, sections, and articles nest inside this main wrapper.

---

## 2. Term Category
- **Semantic Tag / Landmark**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard webpage usually has a header, a footer, maybe a sidebar, and the actual content the user came to read (the article, the video, the product). 
Before HTML5, screen readers had a feature called "Skip to Main Content" that required developers to manually code invisible "skip links" and anchor tags so blind users wouldn't have to listen to the navigation menu on every single page load.
The W3C created the `<main>` tag to eliminate this manual hack. The `<main>` tag explicitly defines the dominant, unique content of the page. It is the most important semantic landmark on a webpage. When a screen reader sees it, it automatically knows exactly where the user wants to go.

### (2) Reality Metaphor
Imagine a book.
The `<header>` is the table of contents.
The `<footer>` is the index at the back.
The `<main>` is chapters 1 through 10. It is the reason you actually opened the book.

### (3) Code Examples

#### Short Snippet
```html
<main>
  <!-- The unique, primary content of this specific page -->
  <h1>How to bake a cake</h1>
  <p>First, preheat your oven...</p>
</main>
```

#### Fuller Example
```html
<body>
  <!-- Repeated content -->
  <header>
    <nav>...</nav>
  </header>

  <!-- The unique content for THIS specific URL -->
  <main>
    <article>
      <h2>Product Details</h2>
      <p>This is the best vacuum cleaner on the market.</p>
      <button>Buy Now</button>
    </article>
  </main>

  <!-- Repeated content -->
  <footer>
    <p>Copyright 2026</p>
  </footer>
</body>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Multiple `<main>` tags on one page

**The mistake:** Putting two or three `<main>` tags on a single webpage.

**Why it's wrong:** The W3C specification dictates that there must be **exactly one** visible `<main>` tag per document. If everything is the "main" content, then nothing is. Having multiple `<main>` tags completely breaks the "Skip to Main Content" functionality for screen readers.

*Incorrect:*
```html
<body>
  <main>Article 1</main>
  <main>Article 2</main>
</body>
```

*Fix:*
```html
<body>
  <main>
    <article>Article 1</article>
    <article>Article 2</article>
  </main>
</body>
```

### Mistake 2: Putting repeated content inside `<main>`

**The mistake:** Wrapping the `<header>`, `<footer>`, or the primary `<nav>` sidebar inside the `<main>` tag.

**Why it's wrong:** The `<main>` tag should *only* contain content that is unique to that specific URL. If a sidebar or a footer is identical across all pages of your website, it must live *outside* of the `<main>` tag.

---



### Mistake 3: Including Multiple Un-Hidden `<main>` Elements in a Single HTML Document

**The mistake:** Adding two visible `<main>` elements to one HTML page.

**Why it's wrong:** An HTML document can have at most ONE visible `<main>` element representing the primary dominant content of the page.

*Incorrect:*
```html
<main>Content 1</main>
<main>Content 2</main> <!-- ❌ Multiple visible main elements invalid! -->
```

*Fix:*
```html
<main>
  <section>Content 1</section>
  <section>Content 2</section>
</main>
```

### Mistake 4: Nesting Persistent Global Headers or Footers Inside the `<main>` Element

**The mistake:** Placing global site navigation `<header>` or site `<footer>` inside `<main>`.

**Why it's wrong:** `<main>` MUST encapsulate content unique to the specific page, excluding persistent global headers, footers, or navigation menus shared across pages.

*Incorrect:*
```html
<main>
  <header>Global Nav</header> <!-- ❌ Global header belongs outside main! -->
  <article>Page Content</article>
</main>
```

*Fix:*
```html
<header>Global Nav</header>
<main>
  <article>Page Content</article>
</main>
```

## 6. Practice Exercises

### Exercise 1: Finding the Core

**Problem:** In a standard blog layout with a Top Menu, a Left Sidebar (links to other posts), the Blog Post, and a Footer, which of those four items belongs inside the `<main>` tag?

**Expected output:**
> [!check]- Answer
> ```text
> ONLY the Blog Post. The Top Menu, Left Sidebar, and Footer are repeated across the whole site, so they belong outside the `<main>` tag.
> ```
> - What is unique to *this exact URL*?

---



### Exercise 2: Skip-to-Main Accessibility Link

**Problem:** Write an accessible 'Skip to Content' link targeting `<main id="main-content">`.

**Expected output:**
> [!check]- Answer
> ```text
> <a href="#main-content" class="skip-link">Skip to Main Content</a>
> ```
> ```html
> <a href="#main-content" class="skip-link">Skip to Main Content</a>
> <main id="main-content">
>   <h1>Main Content</h1>
> </main>
> ```
>
> **Explanation:** Skip links allow keyboard users to bypass global navigation directly to `<main>`.

---

### Exercise 3: Main Landmark Role

**Problem:** Which implicit ARIA landmark role does the `<main>` element convey?

**Expected output:**
> [!check]- Answer
> ```text
> main landmark role.
> ```
> ```text
> main landmark role.
> ```
>
> **Explanation:** `<main>` acts as the primary content accessibility landmark.

## 7. Related Terms
- [`<article>` & `<section>`](../level_06/article_section.md) — The tags that usually live *inside* the `<main>` tag to break up the content.
- [`<aside>`](../level_06/aside.md) — The tangential layout block placed outside main content boundaries.

---

## 8. Key Takeaways
- The `<main>` tag wraps the primary, unique content of a webpage.
- It is the most critical "landmark" for accessibility, allowing users to "Skip to Main Content."
- There should only ever be **one** visible `<main>` tag per page.
- Do not put globally repeated content (like site-wide sidebars or headers) inside `<main>`.
