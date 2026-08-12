# `<footer>`

> **Level 6 — Semantic HTML5**
> Represents the footer of a document or a section, usually containing metadata, copyright info, or related links.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The `<footer>` is the closing semantic landmark of a document.
- [`<header>`](header.md) — The semantic opposite of the footer.
- [Nesting](../level_01/nesting.md) — Since concluding tags, links, and text are nested inside the footer wrapper.

---

## 2. Term Category

**Semantic Tag / Landmark (Universal Browser Support)**: `<footer>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Just like the `<header>` was created to replace `<div id="header">`, the `<footer>` was created to replace `<div id="footer">`. 
Every document, article, and website has concluding information at the bottom. This usually includes copyright notices, links to privacy policies, social media icons, or author biographics.
The W3C created the `<footer>` element as a semantic landmark so screen readers could identify this concluding section. Just like the header, a footer isn't strictly limited to the bottom of the *entire webpage*. You can also have a `<footer>` at the bottom of a specific `<article>`!

### (2) Reality Metaphor
If a webpage is a book:
The `<header>` is the title page.
The `<footer>` is the copyright page at the very back of the book, listing the publisher, the ISBN number, and the copyright year.

### (3) Code Examples

#### Short Snippet
```html
<footer>
  <p>&copy; 2026 My Awesome Company. All rights reserved.</p>
</footer>
```

#### Fuller Example
```html
<body>
  <main>
    <article>
      <header>
        <h2>The Life of Bees</h2>
      </header>
      <p>Bees are fascinating insects...</p>
      
      <!-- A footer specifically for this article -->
      <footer>
        <p>Tags: #nature #insects #honey</p>
        <p>Published on: August 14th</p>
      </footer>
    </article>
  </main>

  <!-- The main page footer -->
  <footer>
    <div class="contact-info">
      <p>Contact: support@example.com</p>
    </div>
    <div class="legal">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
    </div>
  </footer>
</body>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting massive navigation blocks in the footer without a `<nav>`

**The mistake:** A lot of modern websites have massive "fat footers" with dozens of links grouped into columns (About Us, Careers, Investors, Help, etc.). Developers often just throw all these links directly into the `<footer>`.

**Why it's wrong:** While it's okay to put 2 or 3 minor links (like a privacy policy) directly into a footer, if you are building a massive "fat footer" with columns of links, that is considered a primary navigation area. You should wrap those links in a `<nav>` tag *inside* the `<footer>` for accessibility.

*Incorrect:*
```html
<footer>
  <!-- A massive block of 20 links just sitting naked in the footer -->
  <a href="/home">Home</a>
  <a href="/careers">Careers</a>
  <!-- ...18 more links... -->
</footer>
```

*Fix:*
```html
<footer>
  <nav aria-label="Footer Navigation">
    <ul>
      <li><a href="/home">Home</a></li>
      <li><a href="/careers">Careers</a></li>
      <!-- ... -->
    </ul>
  </nav>
</footer>
```

---



### Mistake 2: Assuming a Page Can Have Only One `<footer>` Element

**The mistake:** Avoiding `<footer>` tags inside `<article>` or `<section>` components because a main page footer exists.

**Why it's wrong:** A document can contain multiple `<footer>` elements! Each `<article>`, `<section>`, and `<main>` can have its own contextual `<footer>`.

*Incorrect:*
```html
<!-- Avoiding article footer because body footer exists -->
```

*Fix:*
```html
<article>
  <h2>Story Title</h2>
  <p>Story text...</p>
  <footer>Author: Jane | Published 2026</footer> <!-- Article-specific footer -->
</article>
<footer>Site copyright 2026</footer> <!-- Root page footer -->
```

### Mistake 3: Nesting `<footer>` Inside `<header>` or `<address>` Elements

**The mistake:** Placing a `<footer>` inside a `<header>` element.

**Why it's wrong:** HTML specifications forbid nesting `<footer>` inside `<header>` or `<address>` elements.

*Incorrect:*
```html
<header>
  <footer>Footer text</footer> <!-- ❌ Illegal nesting in header! -->
</header>
```

*Fix:*
```html
<header>Header content</header>
<footer>Footer content</footer>
```

## 5. Practice Exercises

### Exercise 1: Global Site Footer Landmark

**Scenario:** A developer constructs a global site footer landmark (`<footer>`) containing copyright notices, navigation, and contact info.

**Requirements:**
1. Create root `<footer>` landmark element.
2. Include copyright notice.
3. Include footer navigation `<nav>`.
4. Include contact `<address>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <footer class="site-footer">
>   <div class="footer-content">
>     <nav aria-label="Footer Navigation">
>       <ul>
>         <li><a href="/privacy.html">Privacy Policy</a></li>
>         <li><a href="/terms.html">Terms of Service</a></li>
>         <li><a href="/sitemap.html">Sitemap</a></li>
>       </ul>
>     </nav>
>     <address>
>       Questions? Email <a href="mailto:support@example.com">support@example.com</a>
>     </address>
>     <p>&copy; 2026 Acme Web Standards Inc. All rights reserved.</p>
>   </div>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **The `<footer>` Element**: Represents a footer for its nearest sectioning ancestor or body root, containing copyright, author, and legal links.
> 2. **Contentinfo Landmark Role**: A `<footer>` directly inside `<body>` receives an implicit ARIA role of `contentinfo` for screen readers.
> 3. **Footer Navigation Grouping**: Wrap legal links inside a labeled `<nav>` element within the footer.
> 
---

### Exercise 2: Blog Article Footer with Metadata Tags

**Scenario:** Includes an article-specific `<footer>` containing tags, author bio, and publication dates.

**Requirements:**
1. Place `<footer>` inside `<article>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="blog-post">
>   <h1>Understanding CSS Grid</h1>
>   <p>CSS Grid layout allows building 2D web layouts easily.</p>
>
>   <footer>
>     <p>Categories: <a href="/tag/css">CSS</a>, <a href="/tag/web">Web Design</a></p>
>     <p>Published by Jane Doe on <time datetime="2026-08-12">August 12, 2026</time></p>
>   </footer>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Article-Scoped Footer**: `<footer>` inside `<article>` applies strictly to that article, NOT the global website.
> 2. **Multiple Footers Supported**: A single webpage can contain multiple `<footer>` tags (one global footer plus individual article footers).
> 3. **Metadata Placement**: Ideal location for article tags, share buttons, and author bios.
> 
---

### Exercise 3: Accessible Footer Landmark Navigation

**Scenario:** Disambiguates footer navigation links for keyboard and screen reader users.

**Requirements:**
1. Add `<nav aria-label="Footer Navigation">` inside `<footer>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <footer class="main-footer">
>   <nav aria-label="Legal & Policy Links">
>     <ul>
>       <li><a href="/terms">Terms</a></li>
>       <li><a href="/privacy">Privacy</a></li>
>     </ul>
>   </nav>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **Disambiguated Footer Links**: Using `aria-label` differentiates footer navigation from main header navigation.
> 2. **Screen Reader Landmark Lists**: Screen reader users can hop directly to the footer landmark.
> 3. **Valid DOM Hierarchy**: Supports valid HTML5 nesting rules.
## 6. Related Terms
- [`<header>`](header.md) — The introductory equivalent to the footer.
- [`<article>` and `<section>`](article_section.md) — Often contains its own specific `<footer>`.
- [`<address>`](address.md) — The semantic tag for contact info, typically hosted in page footers.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 7. Key Takeaways
- The `<footer>` element represents the conclusion of a document or a section.
- It typically contains copyright info, metadata, tags, or legal links.
- Just like headers, you can have multiple footers on a page (e.g., a main site footer and an article-specific footer).
