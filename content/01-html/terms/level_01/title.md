# `<title>`

> **Level 1 — The Anatomy of a Webpage**
> Defines the title of the document, shown in the browser's title bar or tab.

---

## 1. Prerequisites
- [`<head>`](../level_01/head.md) — The element where the `<title>` must be placed.
- [Nesting](../level_01/nesting.md) — Since `<title>` is nested inside the `<head>` metadata container.

---

## 2. Term Category

**Metadata (Universal Browser Support)**: `<title>` is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a user has multiple tabs open, or when they bookmark a page, the browser needs a concise, human-readable name for that specific document. Furthermore, search engines like Google need to know the primary topic of a page to display it in search results.
The `<title>` element was created specifically for this purpose. It is the most important piece of metadata on your entire website. It does not appear on the webpage itself, but rather in the browser tab, in bookmark lists, and as the big blue clickable link on Google.

### (2) Reality Metaphor
Imagine a book in a library.
The `<body>` is all the pages and text inside the book.
The `<title>` is the title printed on the spine of the book. When the book is sitting on a shelf surrounded by hundreds of other books (just like dozens of tabs open in a browser), the spine is the only way you know what the book is about without opening it.

### (3) Code Examples

#### Short Snippet
```html
<head>
  <!-- This text will appear in the browser tab! -->
  <title>Learn HTML: Zero to Hero</title>
</head>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting the `<title>` in the `<body>`

**The mistake:** Placing the `<title>` tag inside the `<body>` element instead of the `<head>`.

**Why it's wrong:** The `<title>` is metadata, not visible page content. If you put it in the `<body>`, it won't work correctly. If you want large text to appear visibly on the webpage itself, you should use a Heading tag (`<h1>`).

*Incorrect:*
```html
<body>
  <title>Welcome to my site</title> <!-- WRONG! -->
</body>
```

*Fix:*
```html
<head>
  <title>Welcome to my site</title> <!-- CORRECT! -->
</head>
<body>
  <h1>Welcome to my site</h1> <!-- Visually displayed on the page -->
</body>
```

---



### Mistake 2: Using Generic non-Descriptive Page Titles (e.g. `<title>Page</title>`)

**The mistake:** Setting `<title>Untitled Document</title>` or `<title>Home</title>` on every page.

**Why it's wrong:** Page titles are used by search engines (SEO title snippet), browser bookmarks, and screen readers. Generic titles degrade SEO ranking and accessibility.

*Incorrect:*
```html
<title>Page 1</title> <!-- ❌ Unhelpful for SEO and users -->
```

*Fix:*
```html
<title>User Profile Settings | Acme Dashboard</title> <!-- Specific & descriptive -->
```

### Mistake 3: Including HTML Formatting Tags Inside `<title>`

**The mistake:** Writing `<title>My <b>Awesome</b> Site</title>`.

**Why it's wrong:** The `<title>` tag content is text-only. HTML tags inside `<title>` render as literal raw text characters in browser tab bars and search results.

*Incorrect:*
```html
<title>Welcome to <i>My Site</i></title> <!-- ❌ Renders <i> as literal text! -->
```

*Fix:*
```html
<title>Welcome to My Site</title>
```

## 5. Practice Exercises

### Exercise 1: Writing Descriptive SEO & Accessibility Page Titles

**Scenario:** An author writes a descriptive, unique page `<title>` inside `<head>`.

**Requirements:**
1. Place `<title>` inside `<head>`.
2. Follow format: `Page Name - Brand Name`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Shopping Cart | Acme Online Store</title>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Role of `<title>`**: Sets the text displayed on browser tab titles, search engine results, and bookmarks.
> 2. **Screen Reader Announcement**: The `<title>` is the very first thing announced by screen readers when a new page loads.
> 3. **SEO Importance**: Title tags are one of the most critical on-page SEO factors for search engine rankings.
> 
---

### Exercise 2: Dynamic Page Title Formatting for Product Pages

**Scenario:** Configures title tags for specific e-commerce items to improve bookmarking and search clarity.

**Requirements:**
1. Write specific product title.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Wireless Noise-Canceling Headphones - TechStore</title>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Unique Titles Requirement**: Every page on a website should have a unique, specific `<title>` tag.
> 2. **Browser Tab Identification**: Helps users identify tabs when multiple pages are open simultaneously.
> 3. **Bookmark Labeling**: Becomes default name when users bookmark a webpage.
> 
---

### Exercise 3: Tab Navigation Title Formatting for Admin Portals

**Scenario:** Formated title for web application dashboards displaying active status.

**Requirements:**
1. Include status notification in title.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>(3) New Messages - Admin Dashboard</title>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Title Updates**: JavaScript can update `document.title` to notify users of new messages or alerts.
> 2. **Contextual Awareness**: Provides immediate feedback even when user is viewing another tab.
> 3. **Concise Wording**: Keep titles concise (50-60 characters) to avoid truncation in search engine results.
## 6. Related Terms
- [`<head>`](../level_01/head.md) — The container that holds the `<title>` tag.
- [`<meta>`](../level_08/meta.md) — The tag used for other types of invisible head data.

---

## 7. Key Takeaways
- The `<title>` defines the text shown in the browser tab and bookmarks.
- It is the most critical tag for SEO (Search Engine Optimization).
- It MUST be placed inside the `<head>` element.
- It is NOT displayed on the webpage itself (use `<h1>` for that).
