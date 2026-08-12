# `<mark>`

> **Level 6 — Semantic HTML5**
> An inline semantic element used to visually highlight text that has contextual relevance, typically to show matching search queries.

---

## 1. Prerequisites
- [`<strong>` & `<em>`](../level_02/strong_em.md) — The standard inline formatting tags.
- [Semantic HTML](semantic_html.md) — The concept framework.

---

## 2. Term Category

**Inline Text Semantics (Universal Browser Support .)**: `<mark>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users perform a search query on a site, they want to immediately scan the results list to find where their search term appears. 

In early web development, highlighting these matching words required wrapping them in a non-semantic span:
```html
<span class="highlight">match</span>
```
This worked visually, but screen readers couldn't identify why the span existed. Furthermore, it forced developers to manually configure CSS background colors for every highlight.

The W3C created the **`<mark>` tag** to handle contextual highlighting. 

It defines a section of text as **relevant in the current context**. For instance, if you search for "apple", every occurrence of "apple" in the results is wrapped in `<mark>` so it stands out.

---

### (2) `<mark>` vs. `<strong>` vs. `<em>`
-   **`<strong>` (Importance):** Declares that the text has strong importance or urgency in the sentence (e.g. warning messages).
-   **`<em>` (Emphasis):** Modifies the spoken vocal stress/tone of a word (e.g. changing sentence inflection).
-   **`<mark>` (Relevance):** Highlights text that is temporarily relevant to what the user is currently doing (like search matching). The text itself doesn't carry special importance or vocal stress under normal circumstances.

---

### (3) Code Examples

#### Short Snippet
Basic inline highlight:

```html
<p>
  Search results for 'sugar': We found 3 cases of 
  <mark>sugar</mark> inside the recipe database.
</p>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Search Results</title>
</head>
<body>

  <h1>Search Results: "HTML"</h1>
  <p>Your query returned 2 articles matching the word '<mark>HTML</mark>':</p>

  <article>
    <h2>Article 1: Intro to <mark>HTML</mark> Coding</h2>
    <p>
      In this article, we cover the basics of the <mark>HTML</mark> language, 
      including tags, attributes, and semantic landmarks.
    </p>
  </article>

  <article>
    <h2>Article 2: Stylesheets vs. <mark>HTML</mark></h2>
    <p>
      Always separate your markup <mark>HTML</mark> tags from your visual CSS styles.
    </p>
  </article>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `<mark>` for aesthetic styling or warnings

**The mistake:** Wrapping warnings or key paragraphs in `<mark>` just because you want a yellow alert background:

```html
<!-- BAD: Warning text should be strong, not mark-highlighted! -->
<p><mark>WARNING: High Voltage!</mark></p>
```

**Why it's wrong:** Warnings represent critical, permanent importance, which is the definition of the `<strong>` element. `<mark>` is strictly for contextual relevance. Using it for alerts confuses screen readers.

**Fix:** Use `<strong>` and style it with CSS:
```html
<p class="alert-box"><strong>WARNING: High Voltage!</strong></p>
```

---



### Mistake 2: Using `<mark>` for General Styling Bolding or Accent Formatting

**The mistake:** Using `<mark>Text</mark>` to make sidebar text yellow.

**Why it's wrong:** `<mark>` represents text highlighted for **reference or notation purposes** due to relevance in another context (e.g. search query term matches). Use CSS background-color for visual styling.

*Incorrect:*
```html
<p>Welcome to our <mark>awesome</mark> site!</p> <!-- ❌ Improper semantic usage -->
```

*Fix:*
```html
<p>Welcome to our <span class="highlight">awesome</span> site!</p>
```

### Mistake 3: Confusing `<mark>` with `<strong>` or `<em>`

**The mistake:** Using `<mark>` to indicate urgent warning importance.

**Why it's wrong:** `<mark>` does NOT convey importance (`<strong>`) or stress (`<em>`). It indicates contextual relevance (like a physical highlighter marker on a textbook).

*Incorrect:*
```html
<mark>WARNING: Gas Leak!</mark> <!-- Use strong for warning -->
```

*Fix:*
```html
<strong>WARNING: Gas Leak!</strong>
```

## 5. Practice Exercises

### Exercise 1: Highlighting Search Query Keyword Matches in Search Results

**Scenario:** An author uses `<mark>` to highlight search term matches within search result preview snippets.

**Requirements:**
1. Wrap matched search query keywords in `<mark>` tags.
2. Verify yellow background visual default.
3. Add accessible screen reader context if needed.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <section class="search-results">
>   <h2>Search Results for "accessibility"</h2>
>
>   <article class="result-item">
>     <h3><a href="/posts/a11y-guide">Introduction to Web <mark>Accessibility</mark></a></h3>
>     <p>Web <mark>accessibility</mark> ensures that websites, tools, and technologies are designed so that people with disabilities can use them.</p>
>   </article>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **The `<mark>` Element**: Represents text highlighted for reference or notation purposes due to its relevance in another context (e.g. search matches).
> 2. **Default Visual Styling**: Browsers render `<mark>` text with a yellow background (`background-color: yellow; color: black;`) by default.
> 3. **Relevance Highlighting**: Differs from `<em>` (stress emphasis) and `<strong>` (importance); `<mark>` signifies contextual relevance.
> 
---

### Exercise 2: Annotating Relevant Reference Excerpts in Educational Tutorials

**Scenario:** Uses `<mark>` to highlight key phrases inside a quoted study text.

**Requirements:**
1. Wrap key tutorial excerpt words in `<mark>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <blockquote cite="https://example.com/study">
>   <p>
>     Our research concluded that <mark>semantic HTML tags reduce page load times</mark> by eliminating redundant JavaScript DOM wrapper libraries.
>   </p>
> </blockquote>
> ```
>
> #### Technical Explanation
>
> 1. **Contextual Relevance**: Highlights specific words inside a quote that the author wants to draw attention to.
> 2. **Non-Semantic Stress**: Does NOT imply that the original author spoke those words with stress emphasis.
> 3. **CSS Customization**: Customizable via CSS `mark { background-color: #ffeb3b; }`.
> 
---

### Exercise 3: Screen Reader Announcement of Marked Text

**Scenario:** Adds CSS content pseudo-elements or aria labels to ensure screen readers announce highlighted `<mark>` text.

**Requirements:**
1. Style `<mark>` with accessible audio context.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   The deadline for submission is <mark class="highlight">Friday at 5 PM</mark>.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **Screen Reader Announcement Caution**: Some screen readers do NOT announce `<mark>` tags by default; supplement with text context if critical.
> 2. **CSS Custom Accents**: Customize background colors while ensuring text maintains 4.5:1 contrast.
> 3. **Valid Semantic HTML5**: Appropriate tag for text search highlights and reference annotations.
## 6. Related Terms
- [`<strong>` & `<em>`](../level_02/strong_em.md) — Standard inline text tags.
- [`<span>` (Inline container)](../level_02/span.md) — The non-semantic styling container.
- [`<b>`, `<i>`, `<u>` vs `<strong>`, `<em>`, `<ins>`](../level_02/b_i_u_vs_strong_em.md) — Presentational vs semantic styling comparison.

---

## 7. Key Takeaways
- The `<mark>` element highlights contextually relevant text on a page.
- Its primary use case is highlighting matching search terms in search results.
- Browsers render a bright yellow background behind `<mark>` tags by default.
- Do not confuse `<mark>` (relevance) with `<strong>` (importance) or `<em>` (vocal emphasis).
- Do not use it for permanent warning banners; use `<strong>` and style it.
