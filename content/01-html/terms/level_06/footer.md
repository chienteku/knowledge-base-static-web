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
- **Semantic Tag / Landmark**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Finding the Footer

**Problem:** True or False: The `<footer>` tag must physically be the very last element inside the `<body>` tag in your HTML file.

**Expected output:**
> [!check]- Answer
> ```text
> False. While the main page footer is almost always at the bottom of the page visually and structurally, you can also use `<footer>` tags inside `<article>` or `<section>` elements, meaning they might appear in the middle of your HTML document!
> ```
> - Think about how the `<header>` tag works. Is it limited to just the top of the page?
> 
---



### Exercise 2: Page Footer Metadata Structure

**Problem:** Write page `<footer>` containing copyright paragraph, sitemap nav list, and back-to-top anchor link.

**Expected output:**
> [!check]- Answer
> ```text
> <footer><nav><ul><li><a href="/sitemap">Sitemap</a></li></ul></nav><p>&copy; 2026 Company</p><a href="#top">Back to Top</a></footer>
> ```
> ```html
> <footer>
>   <nav>
>     <ul><li><a href="/sitemap">Sitemap</a></li></ul>
>   </nav>
>   <p>&copy; 2026 Company</p>
>   <a href="#top">Back to Top</a>
> </footer>
> ```
>
> **Explanation:** `<footer>` encapsulates page copyright, sitemap links, and site attribution metadata.
> 
---

### Exercise 3: Footer Landmark Role

**Problem:** Which implicit ARIA landmark role does a top-level `<footer>` element convey to screen readers?

**Expected output:**
> [!check]- Answer
> ```text
> contentinfo landmark role.
> ```
> ```text
> contentinfo landmark role.
> ```
>
> **Explanation:** Root-level `<footer>` elements act as `contentinfo` accessibility landmarks.
> 
## 7. Related Terms
- [`<header>`](header.md) — The introductory equivalent to the footer.
- [`<article>` and `<section>`](article_section.md) — Often contains its own specific `<footer>`.
- [`<address>`](address.md) — The semantic tag for contact info, typically hosted in page footers.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 8. Key Takeaways
- The `<footer>` element represents the conclusion of a document or a section.
- It typically contains copyright info, metadata, tags, or legal links.
- Just like headers, you can have multiple footers on a page (e.g., a main site footer and an article-specific footer).
