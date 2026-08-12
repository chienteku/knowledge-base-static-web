# CSS (Cascading Style Sheets)

> **Level 1 — Core Concepts**
> The language used to style and visually design HTML documents.

---

## 1. Prerequisites
- [HTML (HyperText Markup Language)](../../../01-html/terms/level_01/html.md) — You must have an HTML structure before you can style it.

---

## 2. Term Category

**Core Language (Universal Browser Support)**: CSS (Cascading Style Sheets) is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the internet, HTML was used for both structure *and* design. If you wanted red text, you literally wrapped the word in a `<font color="red">` tag. This was a nightmare for maintainability. If a company rebranded from red to blue, a developer had to manually open thousands of HTML files and change every single `<font>` tag.
The W3C created **CSS (Cascading Style Sheets)** to completely separate *presentation* from *structure*. By moving all design rules into a separate `.css` file, a developer could write one single rule: "Make all headings blue." By attaching that one CSS file to 1,000 HTML pages, the entire website would update instantly.

### (2) Reality Metaphor
If building a website is like building a house:
**HTML** is the wooden frame, the bricks, and the drywall. It defines the structure (where the kitchen is, where the doors are).
**CSS** is the paint, the wallpaper, the carpet, and the lighting. It makes the raw structure look beautiful.

### (3) Code Examples

#### Short Snippet
```css
/* A simple CSS rule targeting all paragraphs */
p {
  color: blue;
  font-size: 16px;
}
```

#### Fuller Example (HTML + CSS Integration)
```html
<!-- The HTML Structure -->
<!DOCTYPE html>
<html>
<head>
  <!-- How we link the external CSS file to the HTML -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome</h1>
  <p>This is my beautiful website.</p>
</body>
</html>
```

```css
/* styles.css */

/* Target the body to set a background for the whole page */
body {
  background-color: #f4f4f4;
  font-family: Arial, sans-serif;
}

/* Target all h1 elements */
h1 {
  color: darkblue;
  text-align: center;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using HTML to control visual layout

**The mistake:** Using HTML tags like `<br>` multiple times to create vertical space, or using `&nbsp;` repeatedly to create horizontal space.

**Why it's wrong:** This violates the separation of concerns. HTML should only define what the content *is*. CSS should define how the content *looks*. If you need space between elements, you should use the CSS `margin` or `padding` properties. Using HTML to hack the layout makes the site rigid and nearly impossible to make responsive for mobile phones.

*Incorrect:*
```html
<h2>My Title</h2>
<br><br><br> <!-- WRONG: Using HTML for spacing -->
<p>Some text</p>
```

*Fix:*
```html
<h2 class="title-spaced">My Title</h2>
<p>Some text</p>
```
```css
/* CORRECT: Using CSS for spacing */
.title-spaced {
  margin-bottom: 50px;
}
```

---



### Mistake 2: Using HTML Tags for Visual Layout Spacing Instead of CSS

**The mistake:** Adding multiple `<br><br><br>` tags or `&nbsp;` spaces in HTML for layout spacing.

**Why it's wrong:** HTML defines structural data. CSS defines visual layout presentation. Use CSS `margin` or `padding` for spacing.

*Incorrect:*
```css
<h2>Title</h2>
<br><br><br> <!-- ❌ HTML tag spacing anti-pattern -->
<p>Content</p>
```

*Fix:*
```css
<h2>Title</h2>
<p class="spaced">Content</p>
/* CSS: .spaced { margin-top: 40px; } */
```

### Mistake 3: Writing Styles Inline (`style="..."`) Across Multiple Elements Instead of Reusable Classes

**The mistake:** Writing `<p style="color: blue; font-size: 16px;">` on 50 paragraph elements.

**Why it's wrong:** Inline styles clutter HTML, prevent stylesheet caching, override external CSS rules, and make site-wide styling changes impossible.

*Incorrect:*
```css
<p style="color: blue;">Text 1</p>
<p style="color: blue;">Text 2</p> <!-- ❌ Duplicate inline styles -->
```

*Fix:*
```css
<p class="text-blue">Text 1</p>
<p class="text-blue">Text 2</p>
/* CSS: .text-blue { color: blue; } */
```

## 5. Practice Exercises

### Exercise 1: Linking External CSS Stylesheets to HTML Documents

**Scenario:** An author links an external CSS stylesheet to an HTML document and establishes a global `box-sizing: border-box` reset.

**Requirements:**
1. Link CSS file using `<link rel="stylesheet" href="...">` inside `<head>`.
2. Apply global `box-sizing: border-box` reset.
3. Use `rem` units for padding and font sizes.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!DOCTYPE html>
> <html lang="en">
> <head>
>   <meta charset="utf-8">
>   <title>CSS Architecture Starter</title>
>   <link rel="stylesheet" href="css/styles.css">
> </head>
> <body>
>   <main class="container">
>     <h1>Welcome to Modern CSS Architecture</h1>
>     <p>Separating HTML structure from CSS presentation.</p>
>   </main>
> </body>
> </html>
> ```
>
> ```css
> /* styles.css - Global Reset & Base System */
> *, *::before, *::after {
>   box-sizing: border-box;
>   margin: 0;
>   padding: 0;
> }
>
> body {
>   font-family: system-ui, -apple-system, sans-serif;
>   line-height: 1.5;
>   color: #1e293b;
>   background-color: #f8fafc;
> }
>
> .container {
>   max-width: 70rem;           /* ~1120px responsive container boundary */
>   margin-inline: auto;
>   padding: 2rem 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Cascading Style Sheets (CSS)**: The W3C standard language for styling and laying out HTML web pages, separating visual presentation from document structure.
> 2. **External Stylesheet Linking**: The `<link rel="stylesheet">` tag in `<head>` is the industry standard pattern for attaching CSS files.
> 3. **The Universal `border-box` Reset**: Setting `box-sizing: border-box` includes padding and borders within element width/height calculations, eliminating unexpected layout overflow.
> 
---

### Exercise 2: Defining Global CSS Reset and Base Design System

**Scenario:** Establishes a base CSS reset establishing typography, margin resets, and relative scaling.

**Requirements:**
1. Apply baseline font sizing using `rem` units.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> html {
>   font-size: 100%;             /* Respects browser default (typically 16px) */
> }
>
> body {
>   font-size: 1rem;            /* 1rem = 16px */
>   padding: 1.5rem;
> }
>
> h1 {
>   font-size: 2.25rem;         /* ~36px relative heading */
>   margin-bottom: 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Accessibility via Relative Units**: Using `rem` for typography respects user browser font size preferences for visually impaired users.
> 2. **Baseline Font Size**: Setting `html { font-size: 100%; }` preserves default accessibility settings.
> 3. **Predictable Spacing**: `1rem` scales dynamically if user adjusts browser zoom levels.
> 
---

### Exercise 3: Applying Responsive Mobile-First Styles using Media Queries

**Scenario:** Constructs a mobile-first responsive layout using `min-width` media queries.

**Requirements:**
1. Write base styles for mobile screens.
2. Add `@media (min-width: 48rem)` breakpoint for desktop.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Mobile-First Layout (Default Single-Column) */
> .card-grid {
>   display: flex;
>   flex-direction: column;
>   gap: 1rem;
> }
>
> /* Tablet & Desktop Layout (Multi-Column) */
> @media (min-width: 48rem) {   /* ~768px breakpoint */
>   .card-grid {
>     flex-direction: row;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Mobile-First Methodology**: Styles default to mobile devices first; media queries add desktop enhancements progressively.
> 2. **`min-width` Media Queries**: Using `min-width` ensures CSS rules trigger only as screen width expands.
> 3. **Flexbox Layout Integration**: Flexbox handles responsive column wrapping without legacy float hacks.
## 6. Related Terms
- [Selectors (Element, Class, ID)](selectors.md) — How CSS finds the specific HTML elements to style.
- [Ruleset (Declaration, Property, Value)](ruleset.md) — The declaration format mapping selectors.
- [CSS Comments (`/* */`)](comments.md) — Notes ignored by the browser parser.
- [The Cascade](the_cascade.md) — The CSS Cascade.

---

## 7. Key Takeaways
- CSS stands for Cascading Style Sheets.
- It was created to separate design (CSS) from structure (HTML).
- A single CSS file can control the look of thousands of HTML pages simultaneously.
- You link a CSS file to an HTML document using the `<link>` tag in the `<head>`.
