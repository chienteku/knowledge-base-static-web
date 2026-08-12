# `<head>`

> **Level 1 — The Anatomy of a Webpage**
> The container for metadata, links to scripts, and stylesheets (invisible to users).

---

## 1. Prerequisites
- [`<html>`](html_tag.md) — The parent root container element.
- [Nesting](nesting.md) — Specifically, understanding how `<head>` nests inside the `<html>` root parent container.

---

## 2. Term Category

**Metadata (Universal Browser Support)**: `<head>` is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A webpage requires a lot of "behind-the-scenes" data to function properly. It needs to know what character set to use, what the title of the browser tab should be, where to download the CSS styles to make the page look pretty, and what description to show if the page is shared on Twitter or Google.
If we put this data mixed in with the visible text, it would be a chaotic mess. The W3C designed the `<head>` element to act as a dedicated "brain" for the webpage. It holds all the instructions and metadata that the browser needs to process *before* it starts rendering the visible content.
Crucially: **Nothing inside the `<head>` element is rendered directly on the visible web page.**

### (2) Reality Metaphor
Imagine going to a theatrical play. 
The `<head>` is everything that happens backstage before the curtain opens: the director's notes, the lighting cues, the script, and the makeup. The audience (the user) doesn't see any of this directly, but without it, the play would be a disaster.
The `<body>` is the actual stage where the actors perform for the audience to see.

### (3) Code Examples

#### Short Snippet
```html
<head>
  <!-- Character encoding so text renders correctly -->
  <meta charset="UTF-8">
  <!-- The title shown in the browser tab -->
  <title>My Portfolio</title>
  <!-- Linking to an external CSS file -->
  <link rel="stylesheet" href="styles.css">
</head>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting visible content in the head

**The mistake:** Placing headings (`<h1>`), paragraphs (`<p>`), or images (`<img>`) inside the `<head>` tag.

**Why it's wrong:** The `<head>` is strictly for metadata. While modern browsers are very forgiving and might physically rip the `<h1>` out of the head and shove it into the body to try and fix your mistake, doing this breaks web standards, destroys SEO, and causes unpredictable rendering bugs.

*Incorrect:*
```html
<head>
  <title>My Site</title>
  <h1>Welcome to my website!</h1> <!-- WRONG! -->
</head>
```

*Fix:*
```html
<head>
  <title>My Site</title>
</head>
<body>
  <h1>Welcome to my website!</h1> <!-- CORRECT! -->
</body>
```

---



### Mistake 2: Placing `<head>` Content Inside the `<body>` Section

**The mistake:** Placing `<meta charset="UTF-8">` or `<title>` inside `<body>`.

**Why it's wrong:** The `<head>` section holds document metadata processed before page rendering. Placing metadata in `<body>` delays character encoding and SEO indexing.

*Incorrect:*
```html
<body>
  <title>My Page</title> <!-- ❌ Title tag placed inside body! -->
</body>
```

*Fix:*
```html
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
```

### Mistake 3: Omitting the `<title>` Tag Inside `<head>`

**The mistake:** Creating a `<head>` section without a `<title>` tag.

**Why it's wrong:** The `<title>` element is mandatory for valid HTML documents. Without it, search engines and browser tabs display raw file URLs as page titles.

*Incorrect:*
```html
<head>
  <meta charset="UTF-8">
  <!-- ❌ Missing mandatory <title> tag! -->
</head>
```

*Fix:*
```html
<head>
  <meta charset="UTF-8">
  <title>Descriptive Page Title</title>
</head>
```

## 5. Practice Exercises

### Exercise 1: Configuring Essential Page Metadata in head

**Scenario:** A web author sets up mandatory document metadata inside the `<head>` tag for character encoding and responsive viewports.

**Requirements:**
1. Include `<meta charset="utf-8">` as first child of `<head>`.
2. Add responsive viewport `<meta>` tag.
3. Include `<title>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <meta name="viewport" content="width=device-width, initial-scale=1.0">
>   <title>Accessibility First Design</title>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Role of `<head>`**: The `<head>` element contains machine-readable metadata about the document not rendered directly in the page body.
> 2. **UTF-8 Encoding**: `<meta charset="utf-8">` prevents garbled text by specifying international UTF-8 character encoding.
> 3. **Responsive Viewport**: `width=device-width` ensures mobile browsers scale pages correctly to screen dimensions.
> 
---

### Exercise 2: Linking External Stylesheets and Favicons

**Scenario:** A developer connects external CSS resources and site icons inside `<head>`.

**Requirements:**
1. Link CSS stylesheet via `<link rel="stylesheet">`.
2. Link site favicon via `<link rel="icon">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Acme Portal</title>
>   <link rel="stylesheet" href="css/styles.css">
>   <link rel="icon" href="images/favicon.ico" type="image/x-icon">
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **`<link>` Element**: Connects current document to external resources like stylesheets and icons.
> 2. **`rel` Attribute**: Specifies relationship type (`stylesheet`, `icon`, `preload`).
> 3. **Non-Rendered Head Metadata**: Resource links in `<head>` load assets before body content displays.
> 
---

### Exercise 3: Open Graph Social Media Share Metadata

**Scenario:** An SEO specialist adds Open Graph `<meta>` tags in `<head>` for rich social media link previews.

**Requirements:**
1. Add `og:title`, `og:description`, and `og:image` metadata tags.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Guide to Web Semantics</title>
>   <meta property="og:title" content="Guide to Web Semantics">
>   <meta property="og:description" content="Learn how semantic HTML improves accessibility and SEO.">
>   <meta property="og:image" content="https://example.com/cover.jpg">
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Open Graph Protocol**: Standardized metadata used by Facebook, Twitter, and LinkedIn for social preview cards.
> 2. **`property` Attribute**: Specifies Open Graph metadata keys (`og:title`, `og:image`).
> 3. **SEO Enhancement**: Rich previews increase click-through rates when links are shared.
## 6. Related Terms
- [`<body>`](body.md) — The sibling to `<head>` that handles all visible content.
- [`title` Attribute](../level_07/title.md) — The most important tag that lives inside the `<head>`.
- [`<html>`](html_tag.md) — Related concept: `<html>`.
- [`<header>`](../level_06/header.md) — Related concept: `<header>`.
- [`<base>` Element](../level_08/base.md) — Related concept: `<base>` Element.
- [Character Encoding (`charset`)](../level_08/character_encoding.md) — Related concept: Character Encoding (`charset`).
- [Favicon](../level_08/favicon.md) — Related concept: Favicon.
- [`<link>`](../level_08/link.md) — Related concept: `<link>`.
- [`<meta>`](../level_08/meta.md) — Related concept: `<meta>`.
- [Open Graph Tags (`og:`)](../level_08/open_graph.md) — Related concept: Open Graph Tags (`og:`).

---

## 7. Key Takeaways
- The `<head>` element is the brain of the document.
- It contains metadata, CSS links, and browser instructions.
- It is processed *before* the visible page is loaded.
- You must never put visible content (text, images, buttons) inside the `<head>`.
