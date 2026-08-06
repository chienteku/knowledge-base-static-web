# `font-family`

> **Level 3 — Typography & Colors**
> The CSS property used to change the typeface (the font) of your text.

---

## 1. Prerequisites
- [Ruleset (Declaration, Property, Value)](../level_01/ruleset.md) — Used inside a standard declaration block.

---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, browsers render text using a boring, default serif font (usually Times New Roman). To give a website a specific brand identity, developers need to change the typeface.
The `font-family` property allows you to define which font the browser should use. However, there is a catch: the browser can only use a font if it is actually installed on the user's computer! Because a developer has no idea if the user has "Helvetica" installed, the `font-family` property was designed to accept a **fallback list**. You provide multiple fonts, separated by commas. The browser checks them from left to right and uses the first one it finds.

### (2) Reality Metaphor
Imagine you are at a restaurant ordering a drink.
You tell the waiter: "I would like a Coke. If you don't have Coke, I'll take a Pepsi. If you don't have Pepsi, just give me whatever dark soda you have."
In CSS: `font-family: "Helvetica Neue", Arial, sans-serif;`

### (3) Code Examples

#### The Standard Font Stack
```css
body {
  /* The browser tries 'Roboto' first. 
     If it's not installed, it falls back to 'Arial'. 
     If Arial isn't installed, it falls back to the system's default sans-serif font. */
  font-family: "Roboto", Arial, sans-serif;
}
```

#### Importing Web Fonts (Google Fonts)
Because relying on installed fonts is risky, modern developers use the HTML `<link>` tag to force the browser to download a custom font before applying it in CSS.
```html
<!-- HTML: Download the 'Inter' font from Google -->
<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
```
```css
/* CSS: Now it is safe to use 'Inter'! */
body {
  font-family: "Inter", sans-serif;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the generic fallback family

**The mistake:** Writing `font-family: "Open Sans";` and leaving it at that.

**Why it's wrong:** If the user's computer fails to download "Open Sans" (due to a bad internet connection), the browser will panic and fall back to its ugly default (Times New Roman). You must *always* include a generic family at the end of your list, usually `sans-serif` or `serif`. That way, if the custom font fails, the browser will at least pick a similar-looking system font.

### Mistake 2: Forgetting quotes around multi-word fonts

**The mistake:** Writing `font-family: Times New Roman, serif;`.

**Why it's wrong:** If a font name has spaces in it, CSS requires you to wrap it in quotation marks so the browser knows it is a single name. It should be `"Times New Roman"`.

---



### Mistake 3: Omitting Quotes Around Multi-Word Font Family Names

**The mistake:** Writing `font-family: Open Sans, sans-serif;` without quotes around `Open Sans`.

**Why it's wrong:** Font names containing spaces or special characters MUST be enclosed in single or double quotes (`'Open Sans'`). Unquoted multi-word font names fail parsing.

*Incorrect:*
```css
body { font-family: Times New Roman, serif; } /* ❌ Missing quotes around multi-word font! */
```

*Fix:*
```css
body { font-family: 'Times New Roman', serif; }
```

### Mistake 4: Omitting Generic Fallback Font Families at the End of Font Stacks

**The mistake:** Writing `font-family: 'CustomFont';` without fallback generic font families.

**Why it's wrong:** If the custom font fails to download or load over network, omitting fallback fonts (`sans-serif`, `serif`, `monospace`) causes browsers to revert to user-agent serif default.

*Incorrect:*
```css
body { font-family: 'Inter'; } /* ❌ Missing generic fallback! */
```

*Fix:*
```css
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
```

## 6. Practice Exercises

### Exercise 1: The Fallback Order

**Problem:** You write `font-family: "Comic Sans MS", "Arial", sans-serif;`. The user is on an Apple Mac that has "Arial" installed, but does *not* have "Comic Sans" installed. What font will the user see?

**Expected output:**
> [!check]- Answer
> ```text
> Arial! The browser reads from left to right. It looks for Comic Sans, fails to find it, moves to Arial, finds it, and stops.
> ```
> - The browser reads the list from left to right.
> 
---



### Exercise 2: Writing Robust Font Stack

**Problem:** Write CSS `font-family` declaration using `'Roboto'`, falling back to `Arial`, and generic `sans-serif`.

**Expected output:**
> [!check]- Answer
> ```text
> font-family: 'Roboto', Arial, sans-serif;
> ```
> ```css
> body {
>   font-family: 'Roboto', Arial, sans-serif;
> }
> ```
>
> **Explanation:** Font stacks list preferred fonts first, falling back to system and generic font families.
> 
---

### Exercise 3: 5 Generic Font Families

**Problem:** List 5 standard CSS generic fallback font family keywords.

**Expected output:**
> [!check]- Answer
> ```text
> 1. sans-serif
> 2. serif
> 3. monospace
> 4. cursive
> 5. fantasy (or system-ui)
> ```
> ```text
> 1. sans-serif
> 2. serif
> 3. monospace
> 4. cursive
> 5. system-ui / fantasy
> ```
>
> **Explanation:** Generic font keywords direct browser font engines to default system font categories.
> 
## 7. Related Terms
- [`font-size` & `font-weight`](font_size_weight.md) — Properties used to adjust the size and thickness of the chosen font family.
- [`@font-face` & Web Fonts (Google Fonts)](web_fonts.md) — Loading custom external typefaces.

---

## 8. Key Takeaways
- `font-family` changes the typeface of the text.
- It relies on a "fallback stack" (a comma-separated list of fonts).
- If a font has spaces in its name, wrap it in quotes (e.g., `"Times New Roman"`).
- Always end your fallback stack with a generic category like `sans-serif` or `serif`.
- Modern websites usually download custom fonts via Google Fonts using an HTML `<link>` tag.
