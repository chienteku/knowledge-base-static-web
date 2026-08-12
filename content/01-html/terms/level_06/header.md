# `<header>`

> **Level 6 — Semantic HTML5**
> Represents introductory content, typically a group of introductory or navigational aids.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The `<header>` is a core part of the HTML5 semantic specification.
- [`<body>`](../level_01/body.md) — The `<header>` lives inside the body.
- [Nesting](../level_01/nesting.md) — Since other tags (headings, links) are nested within headers.

---

## 2. Term Category

**Semantic Tag / Landmark (Universal Browser Support)**: `<header>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Almost every webpage on the internet has a top section that contains the company logo, a search bar, and the main navigation menu. Before HTML5, developers had to wrap this in a generic `<div id="header">`.
The W3C created the `<header>` element so browsers and screen readers could easily identify the introductory banner of a page. As a "landmark" element, screen readers allow users to immediately jump to the `<header>` or skip past it entirely.
Crucially, the `<header>` tag isn't just for the top of the entire webpage. You can also use a `<header>` *inside* an article to group its specific title, author, and publication date together!

### (2) Reality Metaphor
If a webpage is a newspaper:
The `<header>` at the top of the webpage is the "Masthead" of the newspaper (The New York Times logo, the date, the main sections).
If you use a `<header>` inside a specific article, it's like the bold headline and the "Byline" (the author's name) printed right before the actual story begins.

### (3) Code Examples

#### Short Snippet
```html
<header>
  <h1>My Awesome Website</h1>
  <p>Welcome to my corner of the internet!</p>
</header>
```

#### Fuller Example
```html
<body>
  <!-- The main page header -->
  <header>
    <img src="logo.png" alt="Company Logo">
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <!-- A header specific to this article! -->
      <header>
        <h2>Why I love HTML</h2>
        <p>Written by Jane Doe on August 1st.</p>
      </header>
      
      <p>HTML is a fantastic markup language...</p>
    </article>
  </main>
</body>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `<header>` with `<head>`

**The mistake:** Putting metadata like `<title>` or `<link rel="stylesheet">` inside the `<header>` tag, or vice versa.

**Why it's wrong:** This is the most common mistake beginners make because the names are so similar.
- `<head>`: The invisible brain of the document. Contains metadata, CSS links, and SEO tags. User never sees it.
- `<header>`: A visible, structural block of UI inside the `<body>`. Contains logos, titles, and menus.

*Incorrect:*
```html
<header>
  <!-- WRONG: Metadata does not belong in the visual UI! -->
  <title>My Website</title>
</header>
```

*Fix:*
```html
<head>
  <title>My Website</title>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
</body>
```

---



### Mistake 2: Confusing `<header>` Element with `<head>` Metadata Tag or `<h1>` Heading Tag

**The mistake:** Placing `<meta>` tags inside `<header>` or confusing `<header>` with `<head>`.

**Why it's wrong:** `<head>` contains non-rendered page metadata. `<h1>`-`<h6>` are heading text tags. `<header>` is a visible structural container for introductory navigation/branding content.

*Incorrect:*
```html
<header>
  <meta charset="UTF-8"> <!-- ❌ Meta tag belongs in <head>! -->
</header>
```

*Fix:*
```html
<head>
  <meta charset="UTF-8">
</head>
<body>
  <header>
    <h1>Site Branding</h1>
  </header>
</body>
```

### Mistake 3: Nesting `<header>` Inside `<footer>` or `<address>` Elements

**The mistake:** Placing `<header>` inside a `<footer>` or `<address>` container.

**Why it's wrong:** HTML specifications forbid nesting `<header>` elements inside `<footer>`, `<address>`, or another `<header>`.

*Incorrect:*
```html
<footer>
  <header>Footer Header</header> <!-- ❌ Illegal nesting! -->
</footer>
```

*Fix:*
```html
<footer>
  <h3>Footer Section Title</h3>
</footer>
```

## 5. Practice Exercises

### Exercise 1: Global Website Header Landmark with Brand and Navigation

**Scenario:** A developer constructs a global website header landmark (`<header>`) containing logo, title, and primary navigation.

**Requirements:**
1. Create root `<header>` element.
2. Include site title or logo.
3. Include primary `<nav>` landmark.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header class="site-header">
>   <div class="brand">
>     <a href="/" class="logo">
>       <img src="images/logo.svg" alt="Acme Corporation" width="120" height="40">
>     </a>
>   </div>
>   <nav aria-label="Primary Navigation">
>     <ul>
>       <li><a href="/">Home</a></li>
>       <li><a href="/services">Services</a></li>
>       <li><a href="/contact">Contact</a></li>
>     </ul>
>   </nav>
> </header>
> ```
>
> #### Technical Explanation
>
> 1. **The `<header>` Element**: Represents introductory content or navigation links at the top of a page or section.
> 2. **Banner Landmark Role**: A `<header>` directly inside `<body>` receives an implicit ARIA role of `banner` for screen readers.
> 3. **Brand & Navigation Container**: Groups logo, search bar, and primary navigation in one semantic landmark.
> 
---

### Exercise 2: Blog Post Article Header with Title, Author, and Time

**Scenario:** Uses an article-specific `<header>` to group post titles, author credits, and timestamps.

**Requirements:**
1. Place `<header>` inside `<article>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="post">
>   <header>
>     <h1>Exploring Modern HTML5 Features</h1>
>     <p class="post-meta">By <strong>Jane Doe</strong> on <time datetime="2026-08-12">August 12, 2026</time></p>
>   </header>
>   <p>Article body paragraph content follows here...</p>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Article-Scoped Header**: `<header>` inside `<article>` groups intro metadata for that specific post.
> 2. **Multiple Headers Supported**: A page can contain a global site `<header>` plus individual section/article `<header>` tags.
> 3. **Clean Separation**: Separates post titles and metadata from body paragraphs.
> 
---

### Exercise 3: Section Header Landmark with Filter Controls

**Scenario:** Groups section titles and filter controls using `<header>` inside `<section>`.

**Requirements:**
1. Place `<header>` inside `<section>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <section class="product-catalog">
>   <header class="section-header">
>     <h2>Catalog Products</h2>
>     <div class="filter-controls">
>       <label for="sort-by">Sort By:</label>
>       <select id="sort-by"><option>Price</option></select>
>     </div>
>   </header>
>   <div class="grid">...</div>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **Section Intro Grouping**: Groups section titles alongside contextual controls (filters, sorting dropdowns).
> 2. **Structural Clarity**: Keeps section controls neatly organized before data content.
> 3. **Accessibility Outline**: Establishes clear sectioning boundaries for screen reader navigation.
## 6. Related Terms
- [`<head>`](../level_01/head.md) — The metadata container (do not confuse with `<header>`).
- [`<footer>`](footer.md) — The semantic opposite of the `<header>`.
- [`<nav>`](nav.md) — The navigation block commonly nested inside main headers.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 7. Key Takeaways
- The `<header>` element is a semantic container for introductory content.
- It is visually rendered just like a `<div>` (meaning it does nothing by default), but carries deep meaning for screen readers.
- You can have multiple `<header>` elements on a page (e.g., one for the whole site, and one for a specific article).
- Never confuse it with the `<head>` element!
