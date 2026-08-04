# Attribute Selectors

> **Level 11 — Modern CSS Architecture & Functions**
> Selectors that target HTML elements based on the presence, exact value, or partial value (substrings) of their HTML attributes (like `href`, `type`, or custom `data-*` attributes).

---

## 1. Prerequisites
- [CSS Selectors](../level_01/selectors.md) — Base element and class matching.
- [Specificity](../level_01/specificity.md) — How selectors accumulate matching priorities.

---

## 2. Term Category
- **Core Concept**

---

## 3. Environment Context
- **Universal Modern Standard** (Supported natively. Triggers browser attribute-map lookup index loops during layout rendering passes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In HTML, elements carry attributes that store data or configure behavior:
-   An input element has a `type` attribute (`type="email"`, `type="password"`, `type="submit"`).
-   A link has a `href` attribute (`href="https://example.com/file.pdf"`).
-   Custom elements store metadata using `data-*` attributes (`data-state="active"`).

If you want to style all email inputs with a custom border, or add a PDF icon next to document links, you could manually add class names (like `class="email-input"` or `class="pdf-link"`). 

However, this leads to redundant classes, is prone to developer oversight, and clutters the markup.

To solve this, CSS introduced **Attribute Selectors**. They allow the browser to scan HTML attributes directly and apply styles based on their parameters.

---

### (2) The Types of Attribute Matches

#### 1. Presence (`[attribute]`)
Matches any element that has the attribute, regardless of what value is inside it:
-   `input[disabled]`: Selects any input with the `disabled` attribute.

#### 2. Exact Value Match (`[attribute="value"]`)
Matches elements where the attribute is an exact, character-for-character match:
-   `input[type="password"]`: Selects password inputs.

#### 3. Prefix Match (`[attribute^="value"]`)
Matches elements where the attribute value **starts with** the specified string:
-   `a[href^="https://"]`: Selects secure external links.

#### 4. Suffix Match (`[attribute$="value"]`)
Matches elements where the attribute value **ends with** the specified string:
-   `a[href$=".pdf"]`: Selects PDF document links.

#### 5. Substring Match (`[attribute*="value"]`)
Matches elements where the attribute value **contains** the specified string anywhere:
-   `a[href*="github.com"]`: Selects any links pointing to GitHub.

---

### (3) Code Examples

#### Short Snippet
Custom data states:

```css
/* Style tabs based on custom HTML data attributes */
.tab[data-state="active"] {
  border-bottom: 2px solid blue;
  color: black;
}

.tab[data-state="inactive"] {
  color: gray;
}
```

#### Fuller Example (Link Helper Indicators)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attribute Selectors Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 30px;
      line-height: 1.6;
    }

    a {
      text-decoration: none;
      color: #0066cc;
    }

    /* 1. SUFFIX MATCH ($):
       Add a PDF symbol next to links ending with .pdf */
    a[href$=".pdf"]::after {
      content: " (📄 PDF)";
      font-size: 0.8rem;
      color: red;
      font-weight: bold;
    }

    /* 2. PREFIX MATCH (^):
       Add an external icon to secure external links */
    a[href^="https://"]::after {
      content: " ↗";
      color: #777;
    }

    /* Exceptions: Ignore links containing our own domain name */
    a[href*="mysite.com"]::after {
      content: ""; /* Clears the external icon */
    }
  </style>
</head>
<body>

  <h2>Resource Links</h2>
  <ul>
    <li><a href="https://mysite.com/about">About Us</a> (Internal Link)</li>
    <li><a href="https://google.com">Search Engine</a> (External Link)</li>
    <li><a href="/downloads/user_guide.pdf">User Manual</a> (PDF document)</li>
  </ul>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving values unquoted in complex parameters

**The mistake:** Declaring `a[href^=https://]` instead of `a[href^="https://"]`.

**Why it's wrong:** While some simple values (like `[type=text]`) are tolerated by browsers without quotes, special characters (like slashes, colons, or dots) will confuse the CSS parser and cause the entire ruleset to fail.

**Fix: Always wrap attribute values in double quotes (`"value"`).**

---



### Mistake 2: Confusing Substring Attribute Matchers (`*=`, `^=`, `$=`)

**The mistake:** Using `[href^="pdf"]` expecting to target external PDF links ending in `.pdf`.

**Why it's wrong:** Prefix `^=` matches attribute values STARTING with a substring. Suffix `$=` matches attribute values ENDING with a substring.

*Incorrect:*
```css
a[href^="pdf"] { ... } /* ❌ Matches URLs STARTING with pdf, not ending! */
```

*Fix:*
```css
a[href$=".pdf"] { ... } /* Matches URLs ENDING with .pdf */
```

### Mistake 3: Forgetting Case-Insensitive Modifier Flag `i` in Attribute Selectors

**The mistake:** Writing `a[href$=".pdf"]` missing `.PDF` uppercase extensions.

**Why it's wrong:** Attribute selector matching is case-sensitive by default. Add the `i` modifier flag inside the brackets `[href$=".pdf" i]` to match uppercase `.PDF` links.

*Incorrect:*
```css
a[href$=".pdf"] { ... } /* ❌ Misses .PDF uppercase links! */
```

*Fix:*
```css
a[href$=".pdf" i] { ... } /* Case-insensitive attribute matching */
```

## 6. Practice Exercises

### Exercise 1: Form Validation Highlight

**Problem:** You are building a form. You want to highlight all input elements that are marked as `required` AND currently contain an invalid email format (`type="email"`), drawing a red border around them. Write the CSS selector.

**Expected output:**
> [!check]- Answer
> ```css
> input[type="email"][required] {
>   /* target styles go here */
> }
> ```
> - You can chain attribute selectors together without spaces to target elements matching both criteria simultaneously!

---



### Exercise 2: Targeting Secure HTTPS and PDF Links

**Problem:** Write CSS attribute selectors for:
1. All links starting with `https://` (`[href^="https://"]`)
2. All links ending with `.pdf` case-insensitive (`[href$=".pdf" i]`)
3. Required input fields (`[required]`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. a[href^="https://"]
> 2. a[href$=".pdf" i]
> 3. input[required]
> ```
> ```css
> a[href^="https://"] { color: green; }
> a[href$=".pdf" i]::after { content: " (PDF)"; }
> input[required] { border-left: 3px solid red; }
> ```
>
> **Explanation:** Attribute selectors target elements by presence, prefix (`^=`), or suffix (`$=`).

---

### Exercise 3: Space-Separated List Matcher

**Problem:** Which attribute selector operator (`~=` or `|=`) matches a word in a space-separated list of values?

**Expected output:**
> [!check]- Answer
> ```text
> ~= (matches word in space-separated list).
> ```
> ```css
> [class~="btn"] {
>   display: inline-block;
> }
> ```
>
> **Explanation:** `~=` matches whole words within space-separated attribute lists.

## 7. Related Terms
- [Combinator Selectors](combinators.md) — Target elements relative to parent-child tree layouts.

---

## 8. Key Takeaways
- Attribute selectors target HTML elements based on their attribute metadata.
- `[attr]` checks for presence, `[attr="val"]` checks for exact character matches.
- `^=` matches the start (prefixes), and `$=` matches the end (suffixes).
- `*=` matches any substring overlap in the attribute.
- Always wrap attribute values in double quotes to prevent syntax parsing crashes.
