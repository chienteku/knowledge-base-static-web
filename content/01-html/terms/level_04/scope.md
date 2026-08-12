# `scope` Attribute (in `<th>`)

> **Level 4 — Tables**
> An accessibility attribute placed on table header cells (`<th>`) that explicitly defines whether the header applies to a column, row, or group.

---

## 1. Prerequisites
- [`<th>` (Table Header)](th.md) — The tag that utilizes this attribute.
- [Attribute](../level_01/attribute.md) — The general concept of injecting options into elements.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `scope` Attribute (in `<th>`) is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a sighted person reads a grid table, they can scan horizontally and vertically to figure out what a number represents. For example, they look up to find the column label ("Sales") and left to find the row label ("Monday"). 

However, screen readers read tables linearly, cell by cell. For a blind user navigating a cell in the middle of a grid, the browser has to calculate which headers belong to that cell. 

In simple tables, browsers make a guess. But in tables with header cells at both the top *and* the sides, or complex nested grids, the browser's guess is often wrong. 

The W3C designed the **`scope` attribute** to eliminate this ambiguity. By adding `scope` to each `<th>`, you tell the browser exactly which direction the header's authority extends, ensuring screen readers announce cells correctly.

---

### (2) The Scope Direction Values
The `scope` attribute takes one of four values:
-   **`scope="col"`:** Defines that this header cell represents a label for the entire vertical **column** below it.
-   **`scope="row"`:** Defines that this header cell represents a label for the entire horizontal **row** to the right of it.
-   **`scope="colgroup"`:** Used when headers span across multiple columns using `colspan`.
-   **`scope="rowgroup"`:** Used when headers span across multiple rows using `rowspan`.

---

### (3) Code Examples

#### Short Snippet
Using row and column header scopes in the same table:

```html
<table>
  <tr>
    <td></td> <!-- Empty corner cell -->
    <th scope="col">Price</th> <!-- Column Header -->
    <th scope="col">Stock</th> <!-- Column Header -->
  </tr>
  <tr>
    <th scope="row">Apples</th> <!-- Row Header -->
    <td>$1.00</td>
    <td>In Stock</td>
  </tr>
</table>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Class Schedule</title>
</head>
<body>

  <table>
    <caption>Weekly Exam Schedule</caption>
    <thead>
      <tr>
        <th scope="col">Class</th>
        <th scope="col">Date</th>
        <th scope="col">Time</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <!-- Row header identifies the topic of this row -->
        <th scope="row">Biology 101</th>
        <td>Oct 12</td>
        <td>9:00 AM</td>
      </tr>
      <tr>
        <th scope="row">Chemistry 201</th>
        <td>Oct 13</td>
        <td>1:00 PM</td>
      </tr>
    </tbody>
  </table>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing the `scope` attribute on `<td>` elements

**The mistake:** Trying to set scopes on standard data cells:

```html
<!-- BAD: scope is only valid on headers! -->
<tr>
  <td scope="row">John Doe</td>
</tr>
```

**Why it's wrong:** The `scope` attribute is only valid on `<th>` elements. Slicing data fields with scope values makes the HTML invalid and will be ignored by screen readers.

---



### Mistake 2: Omitting `scope` Attributes on Complex Header Cells (`<th>`)

**The mistake:** Creating a table with row headers and column headers without `scope` attributes.

**Why it's wrong:** Screen readers cannot determine whether a header cell applies to the row or column without `scope` attributes, making complex data tables confusing for blind users.

*Incorrect:*
```html
<tr><th>Name</th><th>Age</th></tr>
<tr><th>Alice</th><td>30</td></tr> <!-- ❌ Ambiguous header scope -->
```

*Fix:*
```html
<tr><th scope="col">Name</th><th scope="col">Age</th></tr>
<tr><th scope="row">Alice</th><td>30</td></tr>
```

### Mistake 3: Applying `scope` Attribute to Standard Data Cells (`<td>`)

**The mistake:** Writing `<td scope="col">Data</td>`.

**Why it's wrong:** The `scope` attribute is valid ONLY on header cells (`<th>`). Applying `scope` to `<td>` cells is invalid HTML.

*Incorrect:*
```html
<td scope="row">Data</td> <!-- ❌ Invalid scope on td cell -->
```

*Fix:*
```html
<th scope="row">Data</th> <!-- Scope applied to th cell -->
```

## 5. Practice Exercises

### Exercise 1: Explicit Column and Row Heading Association with scope

**Scenario:** An author adds `scope="col"` and `scope="row"` to a pricing comparison table so screen readers announce exact header names when users navigate data cells.

**Requirements:**
1. Add `scope="col"` to all header cells in `<thead>`.
2. Add `scope="row"` to row header cells in `<tbody>`.
3. Verify data cells read associated headers.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table class="pricing-table">
>   <caption>Subscription Plan Features</caption>
>   <thead>
>     <tr>
>       <th scope="col">Feature</th>
>       <th scope="col">Basic Plan</th>
>       <th scope="col">Pro Plan</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Monthly Price</th>
>       <td>$9.99</td>
>       <td>$29.99</td>
>     </tr>
>     <tr>
>       <th scope="row">Storage Space</th>
>       <td>10 GB</td>
>       <td>100 GB</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `scope` Attribute**: Explicitly defines whether a `<th>` cell is a header for a column (`scope="col"`) or a row (`scope="row"`).
> 2. **Screen Reader Cell Context**: When a blind user moves focus to `$29.99`, the screen reader announces: 'Pro Plan, Monthly Price: $29.99'.
> 3. **WCAG 2.1 Compliance**: Using `scope` satisfies WCAG Success Criterion 1.3.1 (Info and Relationships) for tabular data.
> 
---

### Exercise 2: Multi-Header Roster Table using colgroup and rowgroup Scope

**Scenario:** Uses `scope="colgroup"` and `scope="rowgroup"` for multi-level grouped data tables.

**Requirements:**
1. Apply `scope="colgroup"` to spanned column headers.
2. Apply `scope="rowgroup"` to multi-row category headers.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Regional Personnel Breakdown</caption>
>   <thead>
>     <tr>
>       <th scope="col">Department</th>
>       <th scope="colgroup" colspan="2">Staff Count</th>
>     </tr>
>     <tr>
>       <th scope="col">Name</th>
>       <th scope="col">Full-Time</th>
>       <th scope="col">Part-Time</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Engineering</th>
>       <td>45</td>
>       <td>5</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **`scope="colgroup"`**: Associates a header with a group of columns spanned by `colspan`.
> 2. **`scope="rowgroup"`**: Associates a header with a group of rows spanned by `rowspan`.
> 3. **Complex Table Navigation**: Essential for multi-level statistical data tables.
> 
---

### Exercise 3: Auditing Missing scope Attributes in Data Tables

**Scenario:** An auditor refactors legacy `<th>` elements to add explicit `scope` attributes.

**Requirements:**
1. Add explicit `scope="col"` and `scope="row"` attributes to legacy `<th>` tags.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Refactored Table with Explicit Scope Attributes -->
> <table>
>   <caption>Class Roster</caption>
>   <thead>
>     <tr>
>       <th scope="col">Student ID</th>
>       <th scope="col">Student Name</th>
>       <th scope="col">Grade</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">#1001</th>
>       <td>Alice Smith</td>
>       <td>A+</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **Default Browser Behavior**: Browsers infer scope for simple tables, but explicit `scope` is required for robust screen reader support.
> 2. **Disambiguating Headers**: Differentiates horizontal row headers from vertical column headers.
> 3. **Accessibility Auditing**: Automated tools flag missing `scope` attributes on `<th>` tags.
## 6. Related Terms
- [`<th>` (Table Header)](th.md) — The tag that hosts the `scope` attribute.
- [`<caption>`](caption.md) — The table title helper.
- [`colspan` & `rowspan` Attributes](colspan_rowspan.md) — Attributes used to merge table cells.

---

## 7. Key Takeaways
- The `scope` attribute explicitly connects a header cell to its corresponding row or column.
- It is placed only on `<th>` elements.
- Use `scope="col"` for top headers and `scope="row"` for side/row headers.
- It has no visual impact on the page, but is critical for W3C web accessibility guidelines.
