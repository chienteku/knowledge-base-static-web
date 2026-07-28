# Comments (<!-- -->)

> **Level 1 — The Anatomy of a Webpage**
> Invisible notes written inside the HTML source code that web browsers ignore, used for documentation and debugging.

---

## 1. Prerequisites
- [HTML](../level_01/html.md) — The standard markup language.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Understanding standard tag indicators.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (Ignored natively by all web browsers since the earliest versions of HTML).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Write a Comment

**Problem:** Comment out the `<button>` element in the block below so it is hidden from the browser screen, leaving a note explaining it's "disabled for maintenance."

```html
<div>
  <h3>Special Offer</h3>
  <button>Claim Reward</button>
</div>
```

**Expected output:**
> [!check]- Answer
> ```html
> <div>
>   <h3>Special Offer</h3>
>   <!-- Disabled for maintenance: -->
>   <!-- <button>Claim Reward</button> -->
> </div>
> ```
> - Wrap the entire `<button>` block in `<!--` and `-->` markers.

---



### Exercise 2: Writing Valid HTML Comments

**Problem:** Write a multi-line HTML comment explaining that the `<main>` section contains article listings.

**Expected output:**
> [!check]- Answer
> ```text
> <!-- 
>   The main section contains article listings.
> -->
> ```
> ```html
> <!-- 
>   The main section contains article listings.
> -->
> ```
>
> **Explanation:** HTML comments begin with `<!--` and end with `-->`.

---

### Exercise 3: Commenting Out Code Blocks

**Problem:** Comment out the `<p>` element in `<main><p>Draft</p></main>`.

**Expected output:**
> [!check]- Answer
> ```text
> <main><!-- <p>Draft</p> --></main>
> ```
> ```html
> <main>
>   <!-- <p>Draft</p> -->
> </main>
> ```
>
> **Explanation:** Wrapping HTML tags in `<!-- -->` disables rendering while preserving code in source.

## 7. Related Terms
- [Element vs. Tag](../level_01/element_vs_tag.md) — Standard nodes that comments can wrap.
- [Nesting](../level_01/nesting.md) — Comments must be nested correctly and not overlap with other active tags.

---

## 8. Key Takeaways
- HTML comments are written using the `<!-- comment here -->` syntax.
- The browser completely ignores comments when rendering the webpage.
- Comments are useful for organizing code sections and temporarily disabling markup during tests.
- Never place secrets, passwords, or personal details in comments, as they are fully visible via "View Source."
- Do not use Javascript (`//`) or CSS (`/* */`) comment syntax in HTML files.
