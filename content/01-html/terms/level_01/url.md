# URL (Uniform Resource Locator)

> **Level 1 — The Anatomy of a Webpage**
> The standardized addressing system used to identify and load files, pages, and media resources on the web.

---

## 1. Prerequisites
- [HTML (HyperText Markup Language)](html.md) — The standard markup language.
- [Attribute](attribute.md) — How URLs are assigned to elements (like `href` and `src`).

---

## 2. Term Category

**Concept / Architecture (Universal Browser Support .)**: URL (Uniform Resource Locator) is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A modern webpage is composed of many separate files. You have the main HTML page, a CSS stylesheet, an image file, a JavaScript file, and links pointing to other websites. 

For the browser to compile all these files into a single page, it needs a way to find them. 

The **URL** (Uniform Resource Locator) was designed as a standardized address system for the internet. Just like your physical house has a mailing address, every file on the web has a unique URL so computers can request it.

---

### (2) Anatomy of a URL
A standard URL is broken down into parts that tell the browser how to connect and what to retrieve:
```text
https://www.example.com/blog/html-basics.html
│       │               │
├───────┼───────────────┼───────────────────────────┐
Protocol Domain/Host     Path to Resource
```
-   **Protocol (`https://`):** The communication rules. Secure Hypertext Transfer Protocol (`https`) tells the browser to encrypt the data.
-   **Domain/Host (`www.example.com`):** The name of the server computer hosting the file.
-   **Path (`/blog/html-basics.html`):** The folder directory on the server pointing to the specific file.

---

### (3) Absolute vs. Relative Paths in HTML
When using URLs inside HTML tags (like `href="..."` or `src="..."`), you can write them in two ways:

1.  **Absolute URL:** The complete address including the protocol and domain. Use this when loading resources from *other* websites.
    -   *Example:* `<a href="https://wikipedia.org">Wikipedia</a>`
2.  **Relative Path:** A path relative to the current file's folder location. Use this when linking files *inside your own project*.
    -   `./about.html` — Look in the *same* folder as the current file.
    -   `../images/logo.png` — Go *up one folder level*, then look inside the `images` folder.
    -   `/contact.html` — Start looking from the *root (top-level)* folder of the website.

---

### (4) Code Examples

#### Short Snippet
Absolute vs relative path attributes inside HTML:

```html
<!-- Absolute URL (loads from external site) -->
<a href="https://google.com">Search</a>

<!-- Relative Path (loads page within the same folder) -->
<a href="contact.html">Contact Us</a>

<!-- Relative Path (loads image from subfolder) -->
<img src="images/logo.png" alt="Company Logo">
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Home Page</title>
  <!-- Relative path loading a stylesheet from a CSS subfolder -->
  <link rel="stylesheet" href="./css/main.css">
</head>
<body>
  <h1>Welcome to my website</h1>
  
  <!-- Relative path linking to a page in the same directory -->
  <p>Learn more <a href="about.html">About Us</a>.</p>

  <!-- Relative path loading an image from an images subfolder -->
  <img src="./images/dog.jpg" alt="A cute dog">

  <hr>

  <!-- Absolute link navigating to an external social media profile -->
  <p>Follow us on <a href="https://twitter.com/example">Twitter</a>!</p>
</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the protocol in absolute URLs

**The mistake:** Leaving out the `https://` prefix when linking to an external website:

```html
<!-- BAD: Missing protocol prefix! -->
<a href="google.com">Go to Google</a>
```

**Why it's wrong:** If you write `href="google.com"`, the browser does not see a protocol. It assumes you are writing a **Relative Path**. It will look inside *your own website* for a file named `google.com` (e.g. `yourwebsite.com/google.com`), leading to a `404 Not Found` error.

**Golden Rule:** If a link leaves your website, it MUST start with `https://` or `http://`.

---



### Mistake 2: Using Relative Paths Incorrectly When Referencing Root Assets (`/image.png` vs `image.png`)

**The mistake:** Writing `<img src="images/logo.png">` on nested route `/users/profile/edit` expecting root lookup.

**Why it's wrong:** Without a leading slash `/`, relative path `images/logo.png` resolves to `/users/profile/edit/images/logo.png` (causing 404 Not Found errors). Use leading slash `/images/logo.png` for root relative.

*Incorrect:*
```html
<img src="logo.png"> <!-- Resolves relative to current sub-directory -->
```

*Fix:*
```html
<img src="/images/logo.png"> <!-- Leading slash resolves relative to domain root -->
```

### Mistake 3: Using Absolute Hardcoded URLs (`https://mysite.com/about`) for Internal Navigation

**The mistake:** Hardcoding full domain URLs for local page links.

**Why it's wrong:** Hardcoding domain names breaks link testing when switching environments (e.g. localhost -> staging -> production). Use root-relative paths (`/about`).

*Incorrect:*
```html
<a href="http://localhost:3000/contact">Contact</a> <!-- ❌ Hardcoded dev domain! -->
```

*Fix:*
```html
<a href="/contact">Contact</a> <!-- Environment-independent relative path -->
```

## 5. Practice Exercises

### Exercise 1: Absolute vs Relative URL Links and Asset Loading

**Scenario:** Demonstrates linking external sites with absolute URLs vs local assets with relative URLs.

**Requirements:**
1. Use absolute URL for external link.
2. Use relative URL for internal asset.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <nav>
>   <!-- Relative URL: Links to local page within site -->
>   <a href="about.html">About Us</a>
>
>   <!-- Absolute URL: Links to external domain -->
>   <a href="https://www.w3.org" target="_blank" rel="noopener noreferrer">W3C Standards</a>
> </nav>
>
> <!-- Relative Path Asset -->
> <img src="images/logo.png" alt="Acme Logo">
> ```
>
> #### Technical Explanation
>
> 1. **Absolute URLs**: Includes complete protocol and domain (`https://example.com/page.html`); used for external links.
> 2. **Relative URLs**: Points to paths relative to current directory (`about.html` or `../images/logo.png`); used for internal assets.
> 3. **Portability Advantage**: Relative URLs make site code portable across local development and production domains.
> 
---

### Exercise 2: In-Page Anchor Links using Fragment Identifiers

**Scenario:** Creates smooth in-page navigation links pointing to specific element `id` fragment identifiers.

**Requirements:**
1. Create link with `href="#section-2"`.
2. Add matching `id="section-2"` on target tag.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <nav>
>   <a href="#faq-section">Jump to FAQ</a>
> </nav>
>
> <!-- Target Section -->
> <section id="faq-section">
>   <h2>Frequently Asked Questions</h2>
>   <p>Answers to common questions.</p>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **URL Fragment Identifiers (`#`)**: The hash `#id` in a URL targets an element with a matching `id` attribute.
> 2. **Keyboard & Screen Reader Focus**: Jumps keyboard focus directly to the target element for fast navigation.
> 3. **Direct Deep Linking**: Allows users to bookmark and share direct links to specific sections on long pages.
> 
---

### Exercise 3: Protocol-Relative and Root-Relative Path Resolution

**Scenario:** Uses root-relative paths (`/css/styles.css`) for consistent asset resolution from any subfolder level.

**Requirements:**
1. Link stylesheet using root-relative path `/css/styles.css`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Root Relative Demo</title>
>   <!-- Root-relative path starts from site domain root -->
>   <link rel="stylesheet" href="/assets/css/main.css">
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Root-Relative Paths**: Paths starting with a slash (`/`) resolve from the root domain regardless of current folder depth.
> 2. **Broken Path Prevention**: Prevents `404 Not Found` errors when moving HTML templates into nested subdirectories.
> 3. **Consistent Asset Referencing**: Best practice for global CSS stylesheets and JavaScript bundles.
## 6. Related Terms
- [Attribute](attribute.md) — The HTML tag parameters that receive URLs as values.
- [`<a>` (Anchor / Link)](../level_02/a.md) — The standard HTML link element utilizing `href`.
- [HTML (HyperText Markup Language)](html.md) — Related concept: HTML (HyperText Markup Language).
- [`href` Attribute](../level_02/href.md) — Related concept: `href` Attribute.

---

## 7. Key Takeaways
- A URL is a standardized web address used to locate and load files on the internet.
- Absolute URLs contain the full address with protocol and domain (used for external links).
- Relative paths point to files within the same project directory (used for internal links).
- If a link leaves your site, it must start with a protocol prefix (like `https://`).
- Use `../` in relative paths to step up one directory folder level.
