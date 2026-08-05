# `<details>` & `<summary>`

> **Level 6 — Semantic HTML5**
> Interactive elements used to create native disclosure widgets (expand/collapse panels like accordions) that show or hide information without requiring JavaScript.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — Semantic structures.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Basic nesting.

---

## 2. Term Category
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively by all modern web browsers. Handles keyboard accessibility and focus states natively).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
On modern websites, you often see interactive components that let you expand or collapse content, such as:
-   **FAQ Accordions:** Clicking a question reveals the answer.
-   **Spoiler Alerts:** Clicking a warning reveals a movie plot point.
-   **File Trees:** Clicking folders expands the list of files.

Historically, building this required writing custom JavaScript to toggle CSS classes (like `display: none` and `display: block`) on click events. 

This created several issues:
1.  **Complexity:** Beginners had to write code scripts just to toggle a paragraph.
2.  **Accessibility Failures:** Many custom JavaScript widgets were not accessible to keyboard-only users (who use the `Tab` and `Enter` keys) or screen readers.

To solve this, HTML5 introduced **`<details>`** and **`<summary>`**. These tags provide a native, fully keyboard-accessible toggle widget built directly into the browser. No scripts required!

---

### (2) How it Works Structurally
-   **`<details>`:** The parent container wrapping the entire widget. It acts as the interactive box.
-   **`<summary>`:** The first child inside `<details>`. It defines the visible label or heading. The browser automatically prefixes it with a small disclosure triangle (arrow) that rotates when toggled.
-   **Content:** Any paragraphs, images, or elements placed *after* the `<summary>` inside `<details>` represent the hidden payload.

---

### (3) The `open` Attribute
By default, `<details>` panels start in the **collapsed** (closed) state. If you want a panel to start in the **expanded** (open) state on page load, add the boolean **`open`** attribute to the `<details>` tag:
```html
<details open>
  <summary>Always open by default</summary>
  <p>This content is visible immediately.</p>
</details>
```

---

### (4) Code Examples

#### Short Snippet
A simple accordion card:

```html
<details>
  <summary>Click to reveal secret</summary>
  <p>The secret code is: 12345!</p>
</details>
```

#### Fuller Example
An FAQ section for a service:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FAQ Accordion</title>
</head>
<body>

  <h1>Frequently Asked Questions</h1>

  <!-- Wrapping each Q&A pair in its own details element -->
  <section class="faq-container">
    
    <details>
      <summary><strong>What is your refund policy?</strong></summary>
      <p>We offer a 30-day money-back guarantee on all our digital packages if you are not fully satisfied.</p>
    </details>

    <details>
      <summary><strong>Do you offer international shipping?</strong></summary>
      <p>Yes, we ship to over 150 countries. Shipping fees will be calculated at checkout.</p>
    </details>

    <!-- This card starts open by default -->
    <details open>
      <summary><strong>Is customer support available 24/7?</strong></summary>
      <p>Yes, our customer support team is available via chat and email 24 hours a day, 7 days a week.</p>
    </details>

  </section>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing the `<summary>` tag outside the `<details>` container

**The mistake:** Putting the summary title before the details tag:

```html
<!-- BAD: Breaks the layout and native toggle logic! -->
<summary>FAQ Question</summary>
<details>
  <p>FAQ Answer</p>
</details>
```

**Why it's wrong:** The `<summary>` tag is only valid when nested *directly inside* a `<details>` tag. If placed outside, it will not act as the toggle trigger, and the browser will display a default label (usually "Details") inside the widget instead.

---



### Mistake 2: Placing `<summary>` Outside the Parent `<details>` Element

**The mistake:** Writing `<summary>Title</summary><details><p>Content</p></details>`.

**Why it's wrong:** The `<summary>` element MUST be the VERY FIRST child inside a `<details>` element to serve as the clickable disclosure toggle header.

*Incorrect:*
```html
<summary>Click to expand</summary> <!-- ❌ Summary outside details! -->
<details><p>Hidden text</p></details>
```

*Fix:*
```html
<details>
  <summary>Click to expand</summary>
  <p>Hidden text</p>
</details>
```

### Mistake 3: Building Custom JS Accordions Out of `<div>` Tags Instead of Native `<details>`

**The mistake:** Writing 50 lines of JS click event listeners to toggle visibility on custom `<div>` dropdowns.

**Why it's wrong:** `<details>` and `<summary>` provide native browser expand/collapse functionality with zero JavaScript and built-in keyboard accessibility (Spacebar / Enter).

*Incorrect:*
```html
<div onclick="toggle()">Expand FAQ</div><div id="faq">Ans</div> <!-- ❌ Unneeded JS boilerplate -->
```

*Fix:*
```html
<details><summary>Expand FAQ</summary><p>Ans</p></details>
```

## 6. Practice Exercises

### Exercise 1: Building a Spoiler Alert

**Problem:** Create an interactive details-summary widget. The visible label should read "Spoiler Warning: Click to reveal ending of Hamlet." and the hidden content should be a paragraph: "Hamlet dies at the end of the play."

**Expected output:**
> [!check]- Answer
> ```html
> <details>
>   <summary>Spoiler Warning: Click to reveal ending of Hamlet.</summary>
>   <p>Hamlet dies at the end of the play.</p>
> </details>
> ```
> - The parent container is `<details>`.
> - The title text must be wrapped in `<summary>`.
> - The hidden content is a standard `<p>`.

---



### Exercise 2: Native Accordion FAQ Entry

**Problem:** Write an expanded-by-default `<details>` element with `<summary>` `'What is HTML5?'` and paragraph answer.

**Expected output:**
> [!check]- Answer
> ```text
> <details open><summary>What is HTML5?</summary><p>HTML5 is the standard markup language.</p></details>
> ```
> ```html
> <details open>
>   <summary>What is HTML5?</summary>
>   <p>HTML5 is the standard markup language.</p>
> </details>
> ```
>
> **Explanation:** `open` attribute sets initial expanded visibility state.

---

### Exercise 3: Styling Summary Disclosure Triangle

**Problem:** Which CSS pseudo-element targets the default summary disclosure arrow marker for custom styling?

**Expected output:**
> [!check]- Answer
> ```text
> summary::marker (or summary::-webkit-details-marker)
> ```
> ```css
> summary::marker {
>   color: blue;
> }
> ```
>
> **Explanation:** `::marker` targets default disclosure triangle icons.

## 7. Related Terms
- [Semantic HTML](semantic_html.md) — The parent layout context.
- [`<div>` (Block container)](../level_02/div.md) — The non-interactive equivalent.
- [`<dialog>` Element](../level_10/dialog.md) — Related concept: `<dialog>` Element.

---

## 8. Key Takeaways
- `<details>` and `<summary>` create native, toggleable disclosure panels without JavaScript.
- `<summary>` is the clickable heading; everything else inside `<details>` is hidden.
- The browser automatically adds a disclosure triangle icon to the summary.
- The panels are keyboard accessible by default (Tab to select, Space/Enter to toggle).
- Add the `open` attribute to start the panel in the expanded state.
