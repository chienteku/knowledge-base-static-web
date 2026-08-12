# `<address>`

> **Level 6 — Semantic HTML5**
> A structural element used to provide contact information for the author or owner of a document or an article.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The parent layout philosophy.
- [`<footer>`](footer.md) — Since address blocks are commonly nested inside page footers.

---

## 2. Term Category

**Semantic Tag (Universal Browser Support .)**: `<address>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Corporate Author Contact Info inside Page Footer

**Scenario:** An author places corporate contact details inside the site footer using the `<address>` element.

**Requirements:**
1. Wrap contact details inside an `<address>` element inside `<footer>`.
2. Include physical address, phone link, and email link.
3. Verify `<br>` elements separate address lines.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <footer class="site-footer">
>   <h2>Contact Information</h2>
>   <address>
>     <strong>Acme Enterprises Inc.</strong><br>
>     500 Innovation Way, Suite 100<br>
>     San Francisco, CA 94107<br>
>     Phone: <a href="tel:+18005550199">+1 (800) 555-0199</a><br>
>     Email: <a href="mailto:contact@acme.example.com">contact@acme.example.com</a>
>   </address>
>   <p>&copy; 2026 Acme Enterprises Inc.</p>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **The `<address>` Element Scope**: Represents contact information for its nearest `<article>` or `<body>` ancestor.
> 2. **Contact Hyperlinks**: Combining `<address>` with `tel:` and `mailto:` links provides direct interactive touch targets on mobile devices.
> 3. **Proper Use Restrictions**: `<address>` is strictly for contact information, NOT for arbitrary postal addresses in general body copy.
> 
---

### Exercise 2: Article Author Contact & Social Profile Card

**Scenario:** An author embeds author contact details inside an `<article>` footer tag.

**Requirements:**
1. Wrap author details in `<address>` inside `<article><footer>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="blog-post">
>   <h2>Understanding HTML5 Semantics</h2>
>   <p>Semantic tags improve accessibility and SEO structure.</p>
>
>   <footer>
>     <p>Written by Jane Doe.</p>
>     <address>
>       Contact the author at <a href="mailto:jane@example.com">jane@example.com</a> 
>       or follow on <a href="https://social.example.com/jane" target="_blank" rel="noopener noreferrer">Social Profile</a>.
>     </address>
>   </footer>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Article-Scoped Address**: When placed inside an `<article>`, `<address>` applies specifically to the author of that article.
> 2. **Accessible Author Attribution**: Helps screen readers identify official author contact points.
> 3. **Social Profile Links**: Include security attributes (`rel="noopener noreferrer"`) for external social media profile links.
> 
---

### Exercise 3: Preventing Misuse of address for Arbitrary Non-Contact Lists

**Scenario:** Corrects code where `<address>` was improperly used to style arbitrary non-contact location mentions.

**Requirements:**
1. Replace invalid `<address>` usage in body text with standard `<p>` or `<div>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Correct: Using standard paragraph for non-contact location references -->
> <p>
>   The conference will take place at the San Francisco Convention Center located at 747 Howard St.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **Semantic Misuse Warning**: Do NOT use `<address>` for general postal addresses mentioned in articles unless they represent author/company contact info.
> 2. **Italics Appearance Trap**: Do NOT use `<address>` just to get italicized text; use CSS `font-style: italic` instead.
> 3. **Screen Reader Semantics**: Screen readers announce `<address>` as a contact landmark.
## 6. Related Terms
- [`<footer>`](footer.md) — The parent container for site contact blocks.
- [`<article>` and `<section>`](article_section.md) — Containers that house author-specific contact blocks.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Used inside address blocks for mail/phone triggers.

---

## 7. Key Takeaways
- The `<address>` tag declares contact info for the owner of the page or article.
- Nest it inside `<article>` to represent the author's contact; nest it in `<body>`/`<footer>` to represent the site owner.
- It renders in italics by default.
- Never use it for arbitrary mailing addresses mentioned in copy.
- Keep copyright statements and general links outside of `<address>`.
