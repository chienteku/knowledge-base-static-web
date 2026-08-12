# `lang` Attribute

> **Level 7 — Global Attributes**
> A global attribute placed on the root `<html>` tag (or inline elements) to declare the primary language of the text content, ensuring correct pronunciation by screen readers and accurate indexing by search engines.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — Tag configuration options.
- [`<html>`](../level_01/html_tag.md) — The root tag where `lang` is primarily declared.

---

## 2. Term Category

**Global Attribute (Universal Browser Support .)**: `lang` Attribute is a fundamental concept in this technology stack. **Level 7 — Global Attributes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Primary Document Language Declaration on Root html Element

**Scenario:** An author sets the primary document natural language using the `lang` attribute on the root `<html>` element.

**Requirements:**
1. Set `lang="en"` on opening `<html>` tag.
2. Include standard metadata inside `<head>`.
3. Include page content.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!DOCTYPE html>
> <html lang="en">
> <head>
>   <meta charset="utf-8">
>   <title>International Accessibility Standards</title>
> </head>
> <body>
>   <h1>Web Accessibility Principles</h1>
>   <p>Building inclusive digital products for a global audience.</p>
> </body>
> </html>
> ```
>
> #### Technical Explanation
>
> 1. **The `lang` Attribute**: Declares the natural language of the document or element content using ISO 639-1 language codes (e.g. `en`, `es`, `fr`, `ja`).
> 2. **Screen Reader Pronunciation Engine**: Screen readers inspect `lang` to select the correct voice synthesizer, accent, and pronunciation rules.
> 3. **Search Engine Localization**: Helps search engines serve pages to regional target audiences.
> 
---

### Exercise 2: Inline Foreign Language Shift Annotations

**Scenario:** Annotates a French phrase inside an English paragraph using `<span lang="fr">`.

**Requirements:**
1. Wrap foreign phrase in `<span>`.
2. Set `lang="fr"` attribute.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   When visiting Paris, remembering to say <span lang="fr">s'il vous plaît</span> and <span lang="fr">merci</span> is considered standard etiquette.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **Inline Language Overrides**: The `lang` attribute can be applied to any HTML element to override document-level language.
> 2. **Voice Switching**: Instructs screen readers to temporarily switch pronunciation engines for foreign phrases.
> 3. **CSS Attribute Selectors**: Enables styling foreign phrases via CSS `span[lang="fr"] { font-style: italic; }`.
> 
---

### Exercise 3: Sub-document Translation and Direction Metadata

**Scenario:** Configures multilingual article excerpts with language and text direction.

**Requirements:**
1. Set `lang="ar"` and `dir="rtl"` on Arabic article block.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article lang="ar" dir="rtl">
>   <h2>مرحبا بكم في موقعنا</h2>
>   <p>نحن نقدم أفضل الخدمات الرقمية لعملائنا في جميع أنحاء العالم.</p>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Language & Direction Combination**: Combining `lang="ar"` with `dir="rtl"` ensures proper right-to-left layout and Arabic voice synthesis.
> 2. **Multilingual Portals**: Essential for international news organizations publishing multi-language articles on one page.
> 3. **Hyphenation & Dictionary Support**: Browsers use `lang` for automatic CSS text hyphenation (`hyphens: auto`).
## 6. Related Terms
- [`<html>`](../level_01/html_tag.md) — The parent container where `lang` is declared.
- [`<meta>`](../level_08/meta.md) — Metadata tags used for other page settings.

---

## 7. Key Takeaways
- The `lang` attribute defines the primary language of the text.
- It should **always** be declared on the root `<html>` tag (e.g. `<html lang="en">`).
- Use standardized ISO two-letter language codes.
- You can override the language inline (e.g. `<span lang="fr">`) to help screen readers pronounce foreign phrases correctly.
- Declaring page language is a mandatory requirement of the W3C Web Content Accessibility Guidelines (WCAG).
