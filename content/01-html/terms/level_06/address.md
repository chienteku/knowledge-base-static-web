# `<address>`

> **Level 6 — Semantic HTML5**
> A structural element used to provide contact information for the author or owner of a document or an article.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The parent layout philosophy.
- [`<footer>`](footer.md) — Since address blocks are commonly nested inside page footers.

---

## 2. Term Category
- **Semantic Tag**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively. Renders text in italicized format by default).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Users visiting a corporate page or reading a journalism article need to know how to contact the author or company. This info might include physical addresses, email links, phone numbers, or social media handles.

A developer could easily write these details inside standard paragraph tags:
```html
<p>Contact us at: support@company.com</p>
```
But for a search engine or directory scanner, this is indistinguishable from standard text. The machine doesn't know if "support@company.com" is the page owner's contact, or just a sample string mentioned in an article.

The W3C created the **`<address>` element** to solve this. It explicitly declares: **"This block contains active contact information for the entity responsible for this content."**

---

### (2) Hierarchy Rules & Default Styling
-   **Document Owner:** If placed directly inside `<body>` (or nested inside the main site `<footer>`), it represents contact info for the entire website.
-   **Article Author:** If placed inside an `<article>` tag, it represents contact info specifically for the author of that article.
-   **Default Render:** Browsers automatically render `<address>` text in italics.
-   **Restriction:** It must not contain general information like copyright dates, logos, or primary nav links.

---

### (3) Code Examples

#### Short Snippet
Basic contact block in a footer:

```html
<footer>
  <address>
    Contact us via email at <a href="mailto:info@example.com">info@example.com</a>.<br>
    Call us: +1 (555) 123-4567
  </address>
</footer>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contact & Author Attributions</title>
</head>
<body>

  <main>
    <article>
      <h2>HTML5 Semantics Review</h2>
      <p>Semantic tags are essential for search indexers...</p>

      <!-- Contact details specifically for the article author -->
      <footer>
        <p>Written by Jane Smith.</p>
        <address>
          Jane Smith is reachable at: <a href="mailto:jane@news.com">jane@news.com</a>
        </address>
      </footer>
    </article>
  </main>

  <!-- Site-wide contact footer -->
  <footer>
    <p>&copy; 2026 TechCorp Inc.</p>
    
    <address>
      TechCorp Head Office<br>
      100 Silicon Valley Way<br>
      San Jose, CA, USA
    </address>
  </footer>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `<address>` for any arbitrary postal address

**The mistake:** Wrapping random physical addresses mentioned in the text inside `<address>` tags:

```html
<!-- BAD: Sherlock Holmes is not the author of this page! -->
<p>
  The suspect was last seen arriving at 
  <address>221B Baker Street, London</address>.
</p>
```

**Why it's wrong:** The `<address>` tag is strictly for the *author's* contact info. If you list arbitrary addresses, search engines will assume the author lives at Baker Street. For general addresses, use standard text formatting (`<span>` or `<p>`) and style it if needed.

---



### Mistake 2: Using `<address>` for Arbitrary Physical Postal Addresses Unrelated to Author Contact

**The mistake:** Wrapping random company addresses mentioned in news articles in `<address>`.

**Why it's wrong:** In HTML5, `<address>` represents contact information specifically for the AUTHOR of the nearest `<article>` or document root, NOT arbitrary physical addresses. Use `<p>` for generic addresses.

*Incorrect:*
```html
<p>Ship package to <address>123 Store St</address></p> <!-- ❌ Improper semantic usage -->
```

*Fix:*
```html
<footer>
  <address>Contact author: <a href="mailto:author@site.com">author@site.com</a></address>
</footer>
```

### Mistake 3: Nesting Heavy Sectional Containers (`<article>`, `<section>`) Inside `<address>`

**The mistake:** Placing `<section>` or `<header>` elements inside `<address>`.

**Why it's wrong:** `<address>` cannot contain sectional structure content (headings, sections, headers). It is strictly for contact details.

*Incorrect:*
```html
<address>
  <h2>Contact Us</h2> <!-- ❌ Heading inside address is invalid HTML! -->
</address>
```

*Fix:*
```html
<section>
  <h2>Contact Us</h2>
  <address>Email: contact@site.com</address>
</section>
```

## 6. Practice Exercises

### Exercise 1: Company Footer Attributions

**Problem:** Create a footer contact block containing the company name "CoffeeShop Ltd", their physical address "12 Main St, Boston", and their support link "mailto:coffee@shop.com" using semantic tags.

**Expected output:**
> [!check]- Answer
> ```html
> <footer>
>   <address>
>     <strong>CoffeeShop Ltd</strong><br>
>     12 Main St, Boston<br>
>     Email: <a href="mailto:coffee@shop.com">coffee@shop.com</a>
>   </address>
> </footer>
> ```
> - Nest the `<address>` tag inside the `<footer>`.
> - Use standard line breaks (`<br>`) and hyperlinks (`<a>`) inside `<address>`.

---



### Exercise 2: Author Contact Footnote

**Problem:** Write author contact details inside `<footer` using `<address>` containing email link.

**Expected output:**
> [!check]- Answer
> ```text
> <footer><address>Written by Jane Doe (<a href="mailto:jane@example.com">jane@example.com</a>)</address></footer>
> ```
> ```html
> <footer>
>   <address>
>     Written by Jane Doe (<a href="mailto:jane@example.com">jane@example.com</a>)
>   </address>
> </footer>
> ```
>
> **Explanation:** `<address>` inside `<footer>` provides semantic author contact metadata.

---

### Exercise 3: Address Default Typography

**Problem:** What default CSS font-style do browsers apply to `<address>` elements?

**Expected output:**
> [!check]- Answer
> ```text
> font-style: italic;
> ```
> ```text
> font-style: italic;
> ```
>
> **Explanation:** User-agent stylesheets render `<address>` text in italics.

## 7. Related Terms
- [`<footer>`](footer.md) — The parent container for site contact blocks.
- [`<article>` and `<section>`](article_section.md) — Containers that house author-specific contact blocks.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Used inside address blocks for mail/phone triggers.

---

## 8. Key Takeaways
- The `<address>` tag declares contact info for the owner of the page or article.
- Nest it inside `<article>` to represent the author's contact; nest it in `<body>`/`<footer>` to represent the site owner.
- It renders in italics by default.
- Never use it for arbitrary mailing addresses mentioned in copy.
- Keep copyright statements and general links outside of `<address>`.
