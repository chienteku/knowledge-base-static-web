# `src` Attribute

> **Level 3 — Media & Embedding**
> Specifies the URL or file path of an external resource that the browser must retrieve and render inside the element.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The concept of injecting configuration into opening tags.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The address standard used to locate files.

---

## 2. Term Category

**Global Attribute (Though strictly only valid on specific media and resource embedding elements). (Universal Browser Support .)**: `src` Attribute is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
HTML documents are strictly text-only files. They cannot physically hold binary data like image pixels, audio waves, or video frames. 

To display rich media, the creators of HTML needed a way to embed external assets. They created the `src` (Source) attribute. 

When you add the `src` attribute to a tag, you are giving the browser a set of retrieval instructions. The browser parses the `src` value, makes a behind-the-scenes network request to download the file from that address, and renders it inside the host element's bounds.

---

### (2) `src` vs. `href`
It is extremely common for beginners to confuse `src` and `href`. However, they have distinct behaviors:
-   **`src` (Source):** Used to **embed** external resources directly into the current page. The browser immediately downloads and displays the resource (like an image or script) without the user needing to click anything.
    -   *Elements:* `<img>`, `<audio>`, `<video>`, `<iframe>`, `<script>`.
-   **`href` (Hypertext Reference):** Used to **link** documents together. The browser does not download the resource immediately; it waits for the user to click the link to navigate them to the new address.
    -   *Elements:* `<a>` (Anchor), `<link>` (metadata stylesheet loader).

---

### (3) Code Examples

#### Short Snippet
Different elements using `src` to load resources:

```html
<!-- Load an image -->
<img src="logo.png" alt="Company Logo">

<!-- Load a JavaScript file -->
<script src="app.js"></script>

<!-- Load another webpage in a frame -->
<iframe src="map.html" title="Office Location"></iframe>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Source Demonstration</title>
  <!-- NOTE: stylesheets use 'href', NOT 'src'! -->
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <h1>My Gallery</h1>

  <!-- Using src to load a local image via relative path -->
  <img src="images/sunset.jpg" alt="A beautiful sunset" width="500">

  <!-- Using src to load an external video via absolute URL -->
  <video src="https://example.com/videos/nature.mp4" controls width="500"></video>

  <!-- Using src to load an external script at the end of the body -->
  <script src="https://example.com/scripts/analytics.js"></script>
</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `src` and `href`

**The mistake:** Using `href` to load an image, or using `src` to build a text link:

```html
<!-- BAD: The image will not render on the screen! -->
<img href="dog.jpg" alt="A cute dog">

<!-- BAD: The link will not work! -->
<a src="about.html">About Us</a>
```

**Why it's wrong:** The browser's layout engine explicitly checks for the `src` attribute inside the `<img>` tag to download the image. If you pass `href`, it ignores it, displaying a broken image frame. Similarly, anchor tags ignore `src`.

**Golden Rule:** If the browser needs to fetch and display the resource on the current page, use `src`. If the user has to click it to navigate, use `href`.

---



### Mistake 2: Confusing `src` (Source Embedding) with `href` (Hyperlink Reference)

**The mistake:** Writing `<img href="logo.png">` or `<a src="about.html">`.

**Why it's wrong:** `src` (Source) embeds external media directly INTO the current document DOM tree (`<img>`, `<script>`, `<iframe>`). `href` (Hyperlink) specifies a reference link destination to navigate to.

*Incorrect:*
```html
<img href="pic.jpg"> <!-- ❌ Incorrect href attribute on img! -->
```

*Fix:*
```html
<img src="pic.jpg" alt="Picture">
```

### Mistake 3: Using Protocol-Relative URLs (`//example.com/file.js`)

**The mistake:** Writing `<script src="//cdn.com/lib.js"></script>`.

**Why it's wrong:** Protocol-relative URLs resolve to `file://` when testing HTML files locally off disk, breaking asset loading. Always specify explicit `https://` protocols.

*Incorrect:*
```html
<script src="//code.jquery.com/jquery.js"></script> <!-- ❌ Breaks when opened locally off disk! -->
```

*Fix:*
```html
<script src="https://code.jquery.com/jquery.js"></script>
```

## 5. Practice Exercises

### Exercise 1: Asset Path Resolution for Local Media vs CDN Resources

**Scenario:** Demonstrates specifying resource URLs using the `src` attribute on `<img>`, `<script>`, and `<iframe>` elements.

**Requirements:**
1. Set `src` on `<img>` for local image path.
2. Set `src` on `<script>` for CDN JavaScript.
3. Set `src` on `<iframe>` for embedded document.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Local Image Asset -->
> <img src="assets/images/logo.png" alt="Company Logo" width="180" height="40">
>
> <!-- Embedded External Map Document -->
> <iframe src="https://maps.example.com/embed" title="Office Location Map" width="400" height="300"></iframe>
>
> <!-- External CDN Script Asset -->
> <script src="https://cdn.example.com/js/library.min.js"></script>
> ```
>
> #### Technical Explanation
>
> 1. **The `src` (Source) Attribute**: Specifies the external resource URL to embed or execute within elements like `<img>`, `<script>`, `<iframe>`, `<video>`, and `<audio>`.
> 2. **Absolute vs Relative `src` Paths**: Relative paths (`assets/...`) load local domain assets; absolute URLs (`https://...`) fetch cross-origin resources.
> 3. **Mandatory Asset Attribute**: Without a valid `src` attribute, media tags cannot fetch or render external assets.
> 
---

### Exercise 2: Script Integrity Verification with Subresource Integrity

**Scenario:** Secures external CDN JavaScript `src` files using `integrity` hashes.

**Requirements:**
1. Add `src` CDN URL.
2. Add `integrity` hash and `crossorigin="anonymous"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <script src="https://cdn.example.com/libs/framework.js" integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC" crossorigin="anonymous"></script>
> ```
>
> #### Technical Explanation
>
> 1. **Subresource Integrity (SRI)**: The `integrity` attribute verifies that fetched `src` files have not been maliciously tampered with on CDNs.
> 2. **`crossorigin` Attribute**: Required when performing SRI checks on cross-origin script requests.
> 3. **Security Hardening**: Prevents compromised CDNs from injecting malicious scripts into web apps.
> 
---

### Exercise 3: Relative Path Navigation for Subfolder Assets

**Scenario:** Navigates relative folder structures (`../images/pic.png`) to locate asset sources.

**Requirements:**
1. Use relative parent directory navigation `src="../images/photo.jpg"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Executing from /pages/about.html referencing /images/hero.jpg -->
> <img src="../images/hero.jpg" alt="About Acme Team" width="600" height="400">
> ```
>
> #### Technical Explanation
>
> 1. **Parent Directory Navigation (`../`)**: `../` moves up one folder level in relative file directory structures.
> 2. **Root Relative (`/images/...`)**: Paths starting with `/` resolve directly from domain root.
> 3. **Path Case Sensitivity**: Linux web servers are case-sensitive (`Hero.jpg` vs `hero.jpg`).
## 6. Related Terms
- [Attribute](../level_01/attribute.md) — The concept of tag configuration keys.
- [`href` Attribute](../level_02/href.md) — The coordinate system attribute for links.
- [`<img>`](img.md) — The most common media embedding tag using `src`.
- [`<audio>`](audio.md) — Related concept: `<audio>`.
- [`<iframe>`](iframe.md) — Related concept: `<iframe>`.
- [`<video>`](video.md) — Related concept: `<video>`.

---

## 7. Key Takeaways
- `src` stands for "source".
- It instructs the browser to download and embed an external resource directly into the page.
- It is used on elements like `<img>`, `<audio>`, `<video>`, `<iframe>`, and `<script>`.
- Use `src` for embedding visual/functional assets; use `href` for navigation hyperlinks.
- Values can be absolute URLs or relative paths.
