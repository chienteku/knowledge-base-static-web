# Advanced Pseudo-classes

> **Level 9 — Visual Effects & State**
> Structural and state-based selectors (like `:nth-child`, `:not()`, `:disabled`, and `:checked`) that target HTML elements based on their position in the DOM tree or specific state conditions without requiring manual class name changes.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — The baseline element and class selectors.
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Understanding active selectors.

---

## 2. Term Category

**CSS Selector Hook (Universal Modern Standard .)**: Advanced Pseudo-classes is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Structural Table Row Striping using :nth-child

**Scenario:** An author styles alternating data table row backgrounds using `:nth-child(even)` and `:nth-child(odd)`.

**Requirements:**
1. Apply `:nth-child(even)` background color.
2. Apply `:nth-child(odd)` background color.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .data-table tbody tr:nth-child(even) {
>   background-color: #f8fafc;    /* Zebra striping for even rows */
> }
>
> .data-table tbody tr:nth-child(odd) {
>   background-color: #ffffff;    /* White background for odd rows */
> }
>
> .data-table tbody tr:hover {
>   background-color: #f1f5f9;    /* Hover row highlight */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `:nth-child()` Pseudo-Class**: Selects elements based on their numeric index position among siblings (`even`, `odd`, `an+b`).
> 2. **Zebra Striping Readability**: Alternating table row colors makes scanning wide financial or analytics tables much easier for human eyes.
> 3. **Formula Flexibility (`:nth-child(3n+1)`)**: Supports functional formulas to target specific column or row patterns.
> 
---

### Exercise 2: Eliminating Unwanted Margin Spacing on First and Last Children

**Scenario:** Uses `:first-child` and `:last-child` to remove unwanted margins inside card containers.

**Requirements:**
1. Apply `:first-child { margin-top: 0; }`.
2. Apply `:last-child { margin-bottom: 0; }`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-content > *:first-child {
>   margin-top: 0;                /* Prevents first heading from pushing down card top */
> }
>
> .card-content > *:last-child {
>   margin-bottom: 0;             /* Prevents last paragraph from expanding card bottom */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`first-child` & `last-child`**: Target the absolute first or last child element inside a parent container.
> 2. **Clean Layout Spacing**: Eliminates unwanted extra padding/margin gaps at container edges.
> 3. **Modern `:not()` Alternative**: Can also be written using `.card > :not(:last-child) { margin-bottom: 1rem; }`
> 
---

### Exercise 3: Form State Validation Pseudo-Classes

**Scenario:** Styles input validation states dynamically using `:valid`, `:invalid`, and `:required`.

**Requirements:**
1. Apply border colors on `:valid` and `:invalid`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .form-field:required {
>   border-left: 3px solid #3b82f6;
> }
>
> .form-field:invalid:not(:placeholder-shown) {
>   border-color: #ef4444;        /* Red border for invalid inputs */
> }
>
> .form-field:valid:not(:placeholder-shown) {
>   border-color: #22c55e;        /* Green border for valid inputs */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Form Pseudo-Classes**: Browsers evaluate HTML5 form inputs natively (`:valid`, `:invalid`, `:required`, `:disabled`).
> 2. **`:placeholder-shown` Guard**: Combining `:invalid:not(:placeholder-shown)` prevents empty form fields from displaying error borders before users type!
> 3. **Native UX Feedback**: Delivers instant visual input validation without writing custom JavaScript.
## 6. Related Terms
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Base active selector states.
- [`::before` & `::after` (Pseudo-elements)](pseudo_elements.md) — Virtual node generators.
- [`accent-color`](../level_11/accent_color.md) — Related concept: `accent-color`.
- [Combinator Selectors](../level_11/combinators.md) — Related concept: Combinator Selectors.

---

## 7. Key Takeaways
- Advanced pseudo-classes match elements without requiring manual class additions.
- `:first-child` and `:last-child` target boundaries.
- `:nth-child(n)` accepts formulas (like `even`/`odd`) to alternate styles.
- `:not(selector)` excludes specific tags from a selector query block.
- `:disabled` and `:checked` automatically synchronize styles with native form controls.
