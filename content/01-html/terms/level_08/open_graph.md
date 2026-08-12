# Open Graph Tags (`og:`)

> **Level 8 — Metadata, SEO & Head**
> A protocol of structured metadata tags placed in the HTML `<head>` that controls how a website's link is formatted and displayed (preview title, summary, thumbnail) when shared on social media and messaging platforms.

---

## 1. Prerequisites
- [`<meta>`](meta.md) — The parent element used to structure meta keys.
- [`<head>`](../level_01/head.md) — The metadata head container.

---

## 2. Term Category

**Metadata (Universal Web Integration .)**: Open Graph Tags (`og:`) is a fundamental concept in this technology stack. **Level 8 — Metadata, SEO & Head**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Have you ever pasted a website URL into Slack, Discord, or a text message, and watched it instantly convert into a beautiful card with a large preview image, a bold headline, and a short summary paragraph? 

Before 2010, this didn't exist. Social networks had to guess what was important on a page. Often, they would grab the very first image they could find (which was usually a tiny social icon or logo) and display the first sentence of the page footer.

To give developers control over social preview cards, Facebook created the **Open Graph Protocol**. By adding specific Open Graph `<meta>` tags to your `<head>`, you tell social media bots exactly which image, title, and description to display when someone shares your link.

---

### (2) Key Open Graph Tags
Open Graph tags are `<meta>` tags that use the **`property`** attribute (instead of the standard `name` attribute) and are prefixed with **`og:`**:

1.  **`og:title`**: The title of the page that should appear in the preview card (e.g. the bold headline).
2.  **`og:type`**: The type of content (e.g., `website`, `article`, `music.song`, `video.movie`).
3.  **`og:image`**: The URL of the thumbnail preview image.
4.  **`og:url`**: The main address of the page (canonical link).
5.  **`og:description`**: A one or two-sentence description of the page content.

---

### (3) Twitter / X Cards
Twitter created a similar metadata standard that works alongside Open Graph:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="My Page Title">
```
If you omit Twitter tags, the Twitter bot automatically falls back and displays your Open Graph (`og:`) tags instead.

---

### (4) Code Examples

#### Short Snippet
A standard Open Graph metadata package:

```html
<head>
  <meta property="og:title" content="How to Bake Sourdough Bread">
  <!-- Image MUST be a absolute path starting with http/https! -->
  <meta property="og:image" content="https://example.com/images/bread.jpg">
  <meta property="og:description" content="A beginner's step-by-step guide to baking perfect bread at home.">
</head>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Baking Sourdough - Bread Hub</title>

  <!-- Standard SEO Meta Tags -->
  <meta name="description" content="A guide to sourdough baking.">

  <!-- Open Graph Tags (Facebook, Slack, iMessage) -->
  <meta property="og:title" content="Baking Sourdough - Step-by-Step Guide">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://breadhub.com/guides/sourdough">
  <meta property="og:image" content="https://breadhub.com/assets/sourdough-card.jpg">
  <meta property="og:description" content="Learn the secrets to creating a crackling crust and airy crumb in your home kitchen.">
  <meta property="og:site_name" content="Bread Hub Portal">

  <!-- X / Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@breadhub">
  
</head>
<body>
  <h1>Sourdough Mastery</h1>
  <p>To begin, you will need a healthy wild yeast starter...</p>
</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using relative paths for `og:image`

**The mistake:** Setting the preview image URL using a local relative path:

```html
<!-- BAD: Bots visiting from outside will not be able to load this image! -->
<meta property="og:image" content="/images/preview.jpg">
```

**Why it's wrong:** The bots scraping your website are running on the servers of Facebook, Slack, or Google. They do not know what your website root is. If you provide a relative path like `/images/preview.jpg`, the bot will look for the folder on Facebook's servers, fail to find it, and render a card with no preview image.

**Fix: Always use absolute URLs starting with `https://`.**

```html
<!-- CORRECT: Clear absolute address -->
<meta property="og:image" content="https://mysite.com/images/preview.jpg">
```

### Mistake 2: Using the `name` attribute instead of `property`
The Open Graph standard explicitly dictates the use of the `property` attribute: `<meta property="og:title">`. Writing `<meta name="og:title">` is a common mistake that will prevent many scrapers from reading the tag.

---



### Mistake 3: Using Relative Image URLs in Open Graph Image Meta Tags (`og:image`)

**The mistake:** Writing `<meta property="og:image" content="/images/share.png">`.

**Why it's wrong:** Social media platforms (Facebook, Twitter, LinkedIn) require ABSOLUTE URLs including protocol and domain (`https://site.com/images/share.png`) for social preview cards.

*Incorrect:*
```html
<meta property="og:image" content="/share.png"> <!-- ❌ Social platforms fail to fetch relative URLs! -->
```

*Fix:*
```html
<meta property="og:image" content="https://example.com/share.png"> <!-- Absolute URL -->
```

### Mistake 4: Confusing Open Graph `property="..."` with Standard Meta `name="..."` Attributes

**The mistake:** Writing `<meta name="og:title" content="...">`.

**Why it's wrong:** Open Graph protocol metadata requires the `property="..."` attribute syntax, NOT `name="..."` (e.g. `property="og:title"`).

*Incorrect:*
```html
<meta name="og:title" content="My Article"> <!-- ❌ Incorrect attribute name! -->
```

*Fix:*
```html
<meta property="og:title" content="My Article">
```

## 5. Practice Exercises

### Exercise 1: Preview Tag Checklist

**Problem:** You are building an article page on "https://codeacademy.com/blog/html-basics". Write the `<meta>` tags required to show a social card with the title "Mastering HTML5 Basics", a description "A simple layout guide for beginners", and a preview image located at "https://codeacademy.com/images/basics-banner.png".

**Expected output:**
> [!check]- Answer
> ```html
> <meta property="og:url" content="https://codeacademy.com/blog/html-basics">
> <meta property="og:title" content="Mastering HTML5 Basics">
> <meta property="og:description" content="A simple layout guide for beginners">
> <meta property="og:image" content="https://codeacademy.com/images/basics-banner.png">
> ```
> - Match each parameter to its correct Open Graph `property`.
> - Check that the image path is absolute.
> 
---



### Exercise 2: Open Graph Core Metadata Suite

**Problem:** Write 4 core Open Graph meta tags: `og:title`, `og:description`, `og:image` (absolute URL), and `og:url`.

**Expected output:**
> [!check]- Answer
> ```text
> <meta property="og:title" content="Title"><meta property="og:description" content="Desc"><meta property="og:image" content="https://site.com/img.jpg"><meta property="og:url" content="https://site.com/page">
> ```
> ```html
> <meta property="og:title" content="Title">
> <meta property="og:description" content="Desc">
> <meta property="og:image" content="https://site.com/img.jpg">
> <meta property="og:url" content="https://site.com/page">
> ```
>
> **Explanation:** Open Graph tags configure rich social card previews on Facebook, Twitter, and Slack.
> 
---

### Exercise 3: Twitter Card Type Tag

**Problem:** Write `<meta>` tag specifying large image summary Twitter card format (`twitter:card`).

**Expected output:**
> [!check]- Answer
> ```text
> <meta name="twitter:card" content="summary_large_image">
> ```
> ```html
> <meta name="twitter:card" content="summary_large_image">
> ```
>
> **Explanation:** `twitter:card` configures Twitter summary card presentation layout.
> 
## 6. Related Terms
- [`<meta>`](meta.md) — The tag that packages these properties.
- [`<head>`](../level_01/head.md) — The folder container holding the tags.
- [SEO Fundamentals for HTML](../level_09/seo_fundamentals.md) — Structural layouts that impact search indexers.
- [Favicon](favicon.md) — Related concept: Favicon.

---

## 7. Key Takeaways
- Open Graph tags control how your links look when shared on social media and messaging platforms.
- They are `<meta>` tags that use the `property` attribute instead of the `name` attribute.
- The `og:image` preview URL **must** be an absolute link starting with `https://`.
- If Twitter card tags are missing, Twitter falls back to using your Open Graph tags.
- Use tools like the *Facebook Sharing Debugger* or *Twitter Card Validator* to verify card formatting before publishing.
