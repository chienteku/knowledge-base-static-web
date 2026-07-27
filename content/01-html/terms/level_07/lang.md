# `lang` Attribute

> **Level 7 — Global Attributes**
> A global attribute placed on the root `<html>` tag (or inline elements) to declare the primary language of the text content, ensuring correct pronunciation by screen readers and accurate indexing by search engines.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — Tag configuration options.
- [`<html>` Tag](../level_01/html_tag.md) — The root tag where `lang` is primarily declared.

---

## 2. Term Category
- **Global Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Read by all browser translation overlays, search engines, and screen-reader synthesizers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The World Wide Web is global, and websites are written in hundreds of different languages. 

When a browser loads a page, it needs to understand the language context of the text:
1.  **Screen Reader Pronunciation:** Screen readers use vocal synthesizers tailored to specific languages. If a blind user visits a French webpage, but the page doesn't declare it is French, the screen reader might try to read the French words using an English dictionary and accent. The result is completely robotic and incomprehensible.
2.  **Native Translation:** Modern browsers (like Chrome or Safari) detect the page language. If a user's browser is set to English, and they visit a Spanish site, the browser uses the language tag to trigger the popup: *"Would you like to translate this page?"*.
3.  **Search Engine Optimization (SEO):** Google uses language declarations to ensure it serves Spanish search queries to Spanish-speaking users.

To solve this, the W3C created the global **`lang` attribute**.

---

### (2) The Language Codes (ISO 639-1)
The value of the `lang` attribute must follow the standardized two-letter language codes:
-   `en` — English
-   `es` — Spanish
-   `fr` — French
-   `zh` — Chinese
-   `ar` — Arabic

You can also append a region subtag if you want to specify a regional dialect:
-   `en-US` — United States English
-   `en-GB` — Great Britain English
-   `zh-CN` — Simplified Chinese (Mainland)

---

### (3) Inline Overrides
While `lang` is primarily set once on the root `<html>` tag, you can also place it on individual tags inside the body. This is useful when a specific sentence or quote shifts to a different language:
```html
<p>She looked at him and said, <span lang="fr">"C'est la vie!"</span></p>
```
When a screen reader encounters the `<span>`, it instantly swaps its pronunciation engine to French, reads the quote with a French accent, and then swaps back to English for the rest of the paragraph.

---

### (4) Code Examples

#### Short Snippet
Root declaration on the HTML tag:

```html
<!DOCTYPE html>
<html lang="en"> <!-- Sets the language for the whole website -->
<head>
  <title>My Site</title>
</head>
...
```

#### Fuller Example
```html
<!DOCTYPE html>
<!-- Primary page language is set to Spanish -->
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Aprender Codificar</title>
</head>
<body>

  <h1>Aprender HTML</h1>
  <p>HTML es el lenguaje de marcado estándar para páginas web.</p>

  <!-- Inline override for a quote in English -->
  <blockquote lang="en">
    "The power of the Web is in its universality." — Tim Berners-Lee
  </blockquote>

  <p>Este lenguaje fue diseñado originalmente en 1991.</p>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving off the `lang` attribute entirely

**The mistake:** Starting your HTML documents with a naked `<html>` tag:

```html
<!-- BAD: Fails accessibility audits instantly! -->
<!DOCTYPE html>
<html>
```

**Why it's wrong:** Omitting the `lang` attribute on the root tag is one of the most common failures flagged by automated web accessibility checkers. It forces screen readers to guess the language, which often fails, locking out visually impaired users.

---



### Mistake 2: Omitting the `lang` Attribute on the Root `<html>` Element

**The mistake:** Writing `<html>` without specifying document language.

**Why it's wrong:** Screen readers depend on `<html lang="en">` to load correct pronunciation engines. Omitting `lang` triggers accessibility warnings.

*Incorrect:*
```html
<html> <!-- ❌ Missing document language declaration -->
```

*Fix:*
```html
<html lang="en"> <!-- Primary language declared -->
```

### Mistake 3: Using Non-Standard or Invalid Language Codes

**The mistake:** Writing `<html lang="english">` or `<html lang="USA">`.

**Why it's wrong:** The `lang` attribute requires BCP 47 standardized language codes (e.g. `en`, `es`, `fr`, `zh-CN`). Invalid names fail parser lookup.

*Incorrect:*
```html
<html lang="english"> <!-- ❌ Invalid language code! -->
```

*Fix:*
```html
<html lang="en"> <!-- Standard BCP 47 language code -->
```

## 6. Practice Exercises

### Exercise 1: Multilingual markup

**Problem:** Write the HTML markup for a paragraph where the main sentence is in English, but it contains the Spanish phrase "Hasta la vista" wrapped in a span with the correct language attribute.

**Expected output:**
```html
<p>He waved goodbye and said, <span lang="es">Hasta la vista</span>, before walking away.</p>
```

> [!check]- Answer
> - The parent paragraph tag does not need a language override (it inherits English from the root).
> - Wrap the Spanish phrase in a `<span>` element.
> - Set `lang="es"` on that span.

---



### Exercise 2: Sub-Element Language Override

**Problem:** Write paragraph in English (`lang="en"`) containing a French phrase `'c\'est la vie'` marked up with `lang="fr"`.

**Expected output:**
```text
<p>That is life, or as the French say, <span lang="fr">c'est la vie</span>.</p>
```

> [!check]- Answer
> ```html
> <p>That is life, or as the French say, <span lang="fr">c'est la vie</span>.</p>
> ```
>
> **Explanation:** The `lang` attribute can be applied to inline elements to override language pronunciation for screen readers.

### Exercise 3: CSS :lang Pseudo-Class Selector

**Problem:** Write CSS rule styling quotes for elements with `lang="fr"` using French guillemets (`« »`).

**Expected output:**
```text
:lang(fr) q { quotes: "« " " »"; }
```

> [!check]- Answer
> ```css
> :lang(fr) q {
>   quotes: "« " " »";
> }
> ```
>
> **Explanation:** `:lang()` pseudo-class matches elements based on declared document language.

## 7. Related Terms
- [`<html>` Tag](../level_01/html_tag.md) — The parent container where `lang` is declared.
- [`<meta>`](../level_08/meta.md) — Metadata tags used for other page settings.

---

## 8. Key Takeaways
- The `lang` attribute defines the primary language of the text.
- It should **always** be declared on the root `<html>` tag (e.g. `<html lang="en">`).
- Use standardized ISO two-letter language codes.
- You can override the language inline (e.g. `<span lang="fr">`) to help screen readers pronounce foreign phrases correctly.
- Declaring page language is a mandatory requirement of the W3C Web Content Accessibility Guidelines (WCAG).
