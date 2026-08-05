# `<head>`

> **Level 1 — The Anatomy of a Webpage**
> The container for metadata, links to scripts, and stylesheets (invisible to users).

---

## 1. Prerequisites
- [`<html>`](html_tag.md) — The parent root container element.
- [Nesting](nesting.md) — Specifically, understanding how `<head>` nests inside the `<html>` root parent container.
---

## 2. Term Category
- **Metadata**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Head vs Body Sorting

**Problem:** Decide whether each of the following tags belongs in the `<head>` or the `<body>`:
1. `<img src="logo.png">`
2. `<meta name="description" content="A site about cats">`
3. `<p>Hello world</p>`
4. `<link rel="stylesheet" href="style.css">`

**Expected output:**
> [!check]- Answer
> ```text
> 1. <body> (It's a visible image)
> 2. <head> (It's invisible metadata for Google)
> 3. <body> (It's visible text)
> 4. <head> (It's behind-the-scenes styling instructions)
> ```
> - Ask yourself: "Does the user need to look directly at this on the page?"

---



### Exercise 2: Essential Head Metadata Template

**Problem:** Write a standard `<head>` section containing UTF-8 charset meta, viewport meta, and page title `'Home'`. 

**Expected output:**
> [!check]- Answer
> ```text
> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Home</title></head>
> ```
> ```html
> <head>
>   <meta charset="UTF-8">
>   <meta name="viewport" content="width=device-width, initial-scale=1.0">
>   <title>Home</title>
> </head>
> ```
>
> **Explanation:** Standard `<head>` metadata includes character set, responsive viewport scaling, and page title.

---

### Exercise 3: Head vs Body Display Rule

**Problem:** Do elements inside the `<head>` section render as visible UI components on the webpage screen? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```text
> No (head elements provide machine-readable metadata, styles, and scripts; body handles visible rendering).
> ```
> ```text
> No (head elements provide machine-readable metadata, styles, and scripts; body handles visible rendering).
> ```
>
> **Explanation:** `<head>` contents are non-rendered document metadata.

## 7. Related Terms
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

## 8. Key Takeaways
- The `<head>` element is the brain of the document.
- It contains metadata, CSS links, and browser instructions.
- It is processed *before* the visible page is loaded.
- You must never put visible content (text, images, buttons) inside the `<head>`.
