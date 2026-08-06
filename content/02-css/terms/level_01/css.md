# CSS (Cascading Style Sheets)

> **Level 1 — Core Concepts**
> The language used to style and visually design HTML documents.

---

## 1. Prerequisites
- [HTML (HyperText Markup Language)](../../../01-html/terms/level_01/html.md) — You must have an HTML structure before you can style it.

---

## 2. Term Category
- **Core Language**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Finding the Separation

**Problem:** You want to make a specific button look like a giant red circle. Do you modify the `index.html` file or the `styles.css` file to achieve this?

**Expected output:**
> [!check]- Answer
> ```text
> You modify the `styles.css` file! You would target the button in CSS and give it a red background color, a specific width/height, and a border-radius of 50%. The HTML file just needs the `<button>` tag.
> ```
> - Does a giant red circle describe the *structure* of the data, or its *presentation*?
> 
---



### Exercise 2: Linking External Stylesheet

**Problem:** Write `<link>` tag in `<head>` linking external stylesheet `theme.css`.

**Expected output:**
> [!check]- Answer
> ```text
> <link rel="stylesheet" href="theme.css">
> ```
> ```html
> <link rel="stylesheet" href="theme.css">
> ```
>
> **Explanation:** `rel="stylesheet"` binds external CSS files to HTML documents.
> 
---

### Exercise 3: CSS Separation of Concerns

**Problem:** Explain why separating HTML structure and CSS presentation improves website maintainability.

**Expected output:**
> [!check]- Answer
> ```text
> Updating a single CSS file updates design presentation across thousands of HTML pages simultaneously.
> ```
> ```text
> Updating a single CSS file updates design presentation across thousands of HTML pages simultaneously.
> ```
>
> **Explanation:** Centralized stylesheets decouple visual design from HTML content markup.
> 
## 7. Related Terms
- [Selectors (Element, Class, ID)](selectors.md) — How CSS finds the specific HTML elements to style.
- [Ruleset (Declaration, Property, Value)](ruleset.md) — The declaration format mapping selectors.
- [CSS Comments (`/* */`)](comments.md) — Notes ignored by the browser parser.
- [The Cascade](the_cascade.md) — The CSS Cascade.

---

## 8. Key Takeaways
- CSS stands for Cascading Style Sheets.
- It was created to separate design (CSS) from structure (HTML).
- A single CSS file can control the look of thousands of HTML pages simultaneously.
- You link a CSS file to an HTML document using the `<link>` tag in the `<head>`.
