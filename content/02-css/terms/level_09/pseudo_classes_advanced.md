# Advanced Pseudo-classes

> **Level 9 — Visual Effects & State**
> Structural and state-based selectors (like `:nth-child`, `:not()`, `:disabled`, and `:checked`) that target HTML elements based on their position in the DOM tree or specific state conditions without requiring manual class name changes.

---

## 1. Prerequisites
- [CSS Selectors](../level_01/selectors.md) — The baseline element and class selectors.
- [Pseudo-classes (`:hover` & `:focus`)](hover_focus.md) — Understanding active selectors.

---

## 2. Term Category
- **CSS Selector Hook**

---

## 3. Environment Context
- **Universal Modern Standard** (Evaluated directly inside the browser selector-matching engine during DOM modifications or state updates).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex web interfaces, you constantly need to target elements based on layout structures or interactive states:
-   Styling every other row of a table (zebra striping) to make it easier to read.
-   Adding margin to all list items *except* the very last one.
-   Styling a checkbox label green only when it is checked.
-   Fading out a button only when it is disabled.

If you had to manually assign class names like `class="first-row"`, `class="even-row"`, or `class="disabled"` to every HTML tag, you would have to write complex JavaScript logic just to sync classes with the UI.

To solve this, the W3C introduced structural and state-based pseudo-classes. They allow CSS to automatically find and style elements based on their hierarchy or native states.

---

### (2) Structural Pseudo-classes (Position-Based)

1.  **`:first-child` & `:last-child`**: Targets the very first or last child inside a parent container.
    ```css
    /* Style the first item in any list */
    li:first-child { font-weight: bold; }
    ```
2.  **`:nth-child(n)`**: Targets children based on a formula or keyword:
    -   `li:nth-child(3)`: The third child.
    -   `tr:nth-child(even)`: Even rows (2, 4, 6...) for zebra striping.
    -   `tr:nth-child(odd)`: Odd rows (1, 3, 5...).
3.  **`:not(selector)` (Negation)**: Targets elements that do *not* match the selector parameter.
    ```css
    /* Add a border to all alert cards EXCEPT the one with class .active */
    .alert-card:not(.active) { border: 1px solid gray; }
    ```

---

### (3) Interactive & Form Pseudo-classes (State-Based)

1.  **`:visited`**: Styles links that the user has already clicked.
    ```css
    a:visited { color: purple; } /* Standard browser default */
    ```
2.  **`:disabled`**: Targets buttons, textareas, or inputs that have the HTML `disabled` attribute.
    ```css
    button:disabled { background-color: #ccc; cursor: not-allowed; }
    ```
3.  **`:checked`**: Targets checked checkboxes, radio buttons, or dropdown option states.
    ```css
    input[type="checkbox"]:checked + label { color: green; font-weight: bold; }
    ```

---

### (4) Code Examples

#### Short Snippet
Zebra-striped list items:

```css
/* Color alternate list items light gray */
li:nth-child(even) {
  background-color: #f0f0f0;
}
```

#### Fuller Example (Table & Form States)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advanced Pseudo-classes</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 30px;
      background-color: #fafafa;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }

    /* 1. STRUCTURAL: Style table header row */
    tr:first-child {
      background-color: #333;
      color: white;
    }

    /* 2. STRUCTURAL: Zebra stripe rows 2, 4, 6... */
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }

    /* 3. STATE-BASED: Form inputs */
    input[type="checkbox"] {
      margin-right: 8px;
    }

    /* Style label only when checked */
    input[type="checkbox"]:checked + label {
      color: teal;
      text-decoration: line-through;
    }

    /* Style button when disabled */
    .submit-btn:disabled {
      background-color: #ccc;
      color: #777;
      cursor: not-allowed;
    }
  </style>
</head>
<body>

  <h2>User Roster Table</h2>
  <table>
    <tr><th>ID</th><th>Name</th><th>Status</th></tr>
    <tr><td>1</td><td>Alice</td><td>Active</td></tr>
    <tr><td>2</td><td>Bob</td><td>Pending</td></tr>
    <tr><td>3</td><td>Charlie</td><td>Active</td></tr>
    <tr><td>4</td><td>David</td><td>Suspended</td></tr>
  </table>

  <h2>Form Interactive States</h2>
  <div>
    <input type="checkbox" id="task1" checked>
    <label for="task1">Complete CSS Level 9 homework</label>
  </div>
  <br>
  <button class="submit-btn" disabled>Send Form (Disabled)</button>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `:nth-child` with element count

**The mistake:** Declaring `p:nth-child(2)` and expecting it to target the second paragraph in a article, even if there is a heading in between:

```html
<!-- HTML Structure -->
<div>
  <h1>Article Title</h1>
  <p>First paragraph.</p>
  <p>Second paragraph.</p>
</div>
```

**Why it's wrong:** `p:nth-child(2)` looks for an element that is both a `<p>` tag **AND** the second child of its parent. In this HTML, the second child is the first paragraph (`<p>First paragraph.</p>`). The second paragraph is actually the third child, so the selector will fail to target it.

**Fix: To target the second paragraph regardless of siblings, use `:nth-of-type(2)` instead.**

---



### Mistake 2: Confusing `:nth-child()` (Counts All Siblings) with `:nth-of-type()` (Counts Specific Element Types)

**The mistake:** Using `p:nth-child(2)` expecting it to target the 2nd paragraph when an `<h1>` is the 1st sibling.

**Why it's wrong:** `:nth-child(2)` selects the 2nd sibling ONLY if it is a `<p>`. `:nth-of-type(2)` filters for paragraphs first, then selects the 2nd paragraph regardless of other sibling tags.

*Incorrect:*
```css
/* HTML: <h1>Header</h1> <p>Para 1</p> <p>Para 2</p> */
p:nth-child(2) { color: red; } /* ❌ Matches <p>Para 1</p> (2nd sibling)! */
```

*Fix:*
```css
p:nth-of-type(2) { color: red; } /* Matches <p>Para 2</p> (2nd paragraph element) */
```

### Mistake 3: Using `:not()` with High-Specificity Selectors Causing Unintended Override Bugs

**The mistake:** Writing `div:not(#main)` inside base stylesheets.

**Why it's wrong:** The `:not()` pseudo-class takes the specificity of its highest argument (`#main` = 1-0-0), making the base rule difficult to override later.

*Incorrect:*
```css
/* High specificity inside :not() prevents style overrides */
```

*Fix:*
```css
/* Use simple class selectors inside :not(.disabled) */
```

## 6. Practice Exercises

### Exercise 1: Menu Item Spacing

**Problem:** You have a horizontal navbar menu where list items (`<li>`) have a `margin-right: 20px;`. However, the last list item shifts the right side of the navbar, breaking alignments. Write the CSS selector to remove the margin from only the last item.

**Expected output:**
> [!check]- Answer
> ```css
> .nav-item:last-child {
>   margin-right: 0;
> }
> ```
> - Target the last sibling matching the navigation category class.
> - Reset the margin parameter value.

---



### Exercise 2: Zebra Striping Table Rows with nth-child

**Problem:** Write CSS targeting even `<tr>` rows inside `<tbody>`.

**Expected output:**
> [!check]- Answer
> ```text
> tbody tr:nth-child(even) { background-color: #f9f9f9; }
> ```
> ```css
> tbody tr:nth-child(even) {
>   background-color: #f9f9f9;
> }
> ```
>
> **Explanation:** `:nth-child(even)` targets alternating even table rows.

---

### Exercise 3: :is() vs :where() Pseudo-Class Specificity

**Problem:** Which pseudo-class helper has zero (0-0-0) specificity: `:is()` or `:where()`?

**Expected output:**
> [!check]- Answer
> ```text
> :where() always has 0 specificity.
> ```
> ```css
> :where(h1, h2, h3) {
>   margin: 0; /* Zero specificity reset */
> }
> ```
>
> **Explanation:** `:where()` simplifies CSS resets by applying 0 specificity.

## 7. Related Terms
- [Pseudo-classes (`:hover` & `:focus`)](hover_focus.md) — Base active selector states.
- [Pseudo-elements (`::before` & `::after`)](pseudo_elements.md) — Virtual node generators.

---

## 8. Key Takeaways
- Advanced pseudo-classes match elements without requiring manual class additions.
- `:first-child` and `:last-child` target boundaries.
- `:nth-child(n)` accepts formulas (like `even`/`odd`) to alternate styles.
- `:not(selector)` excludes specific tags from a selector query block.
- `:disabled` and `:checked` automatically synchronize styles with native form controls.
