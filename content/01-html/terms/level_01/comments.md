# Comments (<!-- -->)

> **Level 1 — The Anatomy of a Webpage**
> Invisible notes written inside the HTML source code that web browsers ignore, used for documentation and debugging.

---

## 1. Prerequisites
- [HTML (HyperText Markup Language)](html.md) — The standard markup language.
- [Element vs. Tag](element_vs_tag.md) — Understanding standard tag indicators.

---

## 2. Term Category

**Concept / Architecture (Universal Browser Support .)**: Comments (<!-- -->) is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing code, you often need to leave notes for yourself or other developers explaining *why* something was structured in a certain way. As HTML files grow to hundreds of lines, finding where sections start and end (like the header, sidebar, or footer) can become very difficult.

Additionally, when debugging, you might want to temporarily hide an element from the screen without permanently deleting your code. 

**Comments** solve this. They allow you to write notes or hide blocks of code within a special tag structure. The browser reads these tags and immediately skips over them, rendering nothing on the screen.

---

### (2) Syntax
An HTML comment starts with `<!--` and ends with `-->`. Everything placed between these two markers is ignored.

```html
<!-- This is an HTML comment. The browser will ignore it! -->
```

---

### (3) The View Source Security Warning
Even though comments are invisible to users looking at the rendered webpage, **they are still sent to the browser**. 

Anyone visiting your website can right-click the page, click "View Page Source" or "Inspect Element", and read every single comment you wrote. Therefore, you must never write sensitive information (like passwords, API keys, private URLs, or employee names) inside HTML comments.

---

### (4) Code Examples

#### Short Snippet
Leaving documentation notes and hiding code:

```html
<!-- Remember to replace this image link next week! -->
<img src="sale-banner.png" alt="Flash Sale">

<!-- 
  <p>This paragraph is temporarily commented out.</p>
  It will not render on the screen.
-->
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Landing Page</title>
</head>
<body>

  <!-- ======================================= -->
  <!-- NAVIGATION BAR SECTION                  -->
  <!-- ======================================= -->
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/pricing">Pricing</a>
    </nav>
  </header>

  <!-- ======================================= -->
  <!-- MAIN PAGE CONTENT                       -->
  <!-- ======================================= -->
  <main>
    <h1>Welcome to our Software!</h1>
    
    <!-- TODO: Add testimonials widget here -->
  </main>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Javascript or CSS comment styles in HTML

**The mistake:** Trying to use `//` (double slashes) or `/* */` to write comments in an HTML file:

```html
<!-- BAD: Slashes do not create comments in HTML files! -->
// This is my comment
/* This is also a comment */
```

**Why it's wrong:** `//` and `/* */` are comment formats reserved strictly for JavaScript and CSS. If you write them directly inside an HTML text block, the browser treats them as regular text, and they will be visible to everyone visiting the site.

**Golden Rule:** Always wrap HTML comments in `<!--` and `-->` markers.

---



### Mistake 2: Storing Sensitive Passwords or API Keys in HTML Comments

**The mistake:** Writing `<!-- DB Password: secret123 -->` inside HTML files.

**Why it's wrong:** HTML comments are sent to the client browser in plain text! Anyone can right-click 'View Page Source' to inspect HTML comments.

*Incorrect:*
```html
<!-- TODO: Remove production DB key: mysecretpass --> <!-- ❌ Publicly readable in client browser! -->
```

*Fix:*
```html
// Store credentials in server environment variables (.env), never in client HTML!
```

### Mistake 3: Nesting HTML Comments (`<!-- <!-- comment --> -->`)

**The mistake:** Nesting one HTML comment inside another.

**Why it's wrong:** HTML comment parsers stop at the VERY FIRST `-->` sequence encountered. Nested comments cause remaining comment text to render on screen as raw code.

*Incorrect:*
```html
<!-- Outer comment
  <!-- Inner comment -->
  This text will leak on screen! -->
```

*Fix:*
```html
<!-- Outer comment containing text without nested comment tags -->
```

## 5. Practice Exercises

### Exercise 1: Documenting Major Layout Landmarks with Comments

**Scenario:** A frontend author adds clean HTML comments (`<!-- ... -->`) to label major structural sections for team collaboration.

**Requirements:**
1. Add header comment `<!-- Header Landmark -->`.
2. Add main content comment `<!-- Main Content Landmark -->`.
3. Add footer comment `<!-- Footer Landmark -->`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Header Landmark: Logo & Primary Navigation -->
> <header class="site-header">
>   <a href="/" class="logo">Acme</a>
> </header>
>
> <!-- Main Content Landmark: Product Listing -->
> <main class="content-container">
>   <h2>Product Catalog</h2>
> </main>
>
> <!-- Footer Landmark: Copyright & Legal Links -->
> <footer class="site-footer">
>   <p>&copy; 2026 Acme Inc.</p>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **HTML Comment Syntax**: Written as `<!-- comment content -->`; ignored by layout engine during rendering.
> 2. **Code Base Maintainability**: Helps team members quickly identify layout boundaries in large templates.
> 3. **Production Stripping**: Production build tools strip comments to minimize final HTML byte transfer sizes.
> 
---

### Exercise 2: Temporarily Disabling Unreleased Features via Comments

**Scenario:** A developer temporarily hides an unreleased promotional banner without deleting the code from the template.

**Requirements:**
1. Wrap unreleased HTML code in comment brackets `<!-- ... -->`.
2. Verify browser hides commented markup.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main>
>   <h2>Summer Sale</h2>
>   <p>Check out our latest discount offers below.</p>
>
>   <!-- Temporarily disabled unreleased promo banner until July 1st
>   <section class="promo-banner">
>     <h3>Flash Sale: 50% Off</h3>
>     <a href="/sale">Shop Now</a>
>   </section>
>   -->
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Code Disabling via Comments**: Wrapping HTML code in comments prevents rendering without deleting markup.
> 2. **Nested Comment Pitfall**: HTML comments cannot be nested inside other comments (`<!-- <!-- inner --> -->` is invalid syntax).
> 3. **Security Warning**: Never put sensitive secrets, passwords, or internal API keys in HTML comments since users can view page source.
> 
---

### Exercise 3: Annotating Complex Accessibility & ARIA Attributes

**Scenario:** An accessibility author adds comments explaining why specific ARIA attributes were used on a custom tab control.

**Requirements:**
1. Annotate `aria-selected` and `aria-controls` with explanatory comments.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Accessibility Note: Dynamic Tab Control requiring ARIA role management -->
> <div role="tablist" aria-label="Account Tabs">
>   <!-- Tab button controls panel-1; state updated dynamically via JS -->
>   <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
>     Overview
>   </button>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Documentation for Accessibility Rules**: Explains subtle accessibility features to junior developers so attributes aren't removed by mistake.
> 2. **DevTools Inspection**: Comments remain visible in browser Inspect Element tools during debugging.
> 3. **Clean Code Guidelines**: Keep comments clear, concise, and focused on *why* non-standard code exists.
## 6. Related Terms
- [Element vs. Tag](element_vs_tag.md) — Standard nodes that comments can wrap.
- [Nesting](nesting.md) — Comments must be nested correctly and not overlap with other active tags.
- [HTML (HyperText Markup Language)](html.md) — Related concept: HTML (HyperText Markup Language).

---

## 7. Key Takeaways
- HTML comments are written using the `<!-- comment here -->` syntax.
- The browser completely ignores comments when rendering the webpage.
- Comments are useful for organizing code sections and temporarily disabling markup during tests.
- Never place secrets, passwords, or personal details in comments, as they are fully visible via "View Source."
- Do not use Javascript (`//`) or CSS (`/* */`) comment syntax in HTML files.
