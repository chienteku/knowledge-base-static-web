# `scope` Attribute (in `<th>`)

> **Level 4 — Tables**
> An accessibility attribute placed on table header cells (`<th>`) that explicitly defines whether the header applies to a column, row, or group.

---

## 1. Prerequisites
- [`<th>` (Table Header)](th.md) — The tag that utilizes this attribute.
- [Attribute](../level_01/attribute.md) — The general concept of injecting options into elements.

---

## 2. Term Category
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Read natively by all screen readers and layout engines to construct accessibility trees).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Scoping headers

**Problem:** Add the correct `scope` attributes to the header cells in the table structure below:

```html
<table>
  <tr>
    <th>Task</th>
    <th>Deadline</th>
  </tr>
  <tr>
    <th>Write report</th>
    <td>Friday</td>
  </tr>
</table>
```

**Expected output:**
> [!check]- Answer
> ```html
> <table>
>   <tr>
>     <th scope="col">Task</th>
>     <th scope="col">Deadline</th>
>   </tr>
>   <tr>
>     <th scope="row">Write report</th>
>     <td>Friday</td>
>   </tr>
> </table>
> ```
> - The top row labels columns vertically downwards (`col`).
> - The cell "Write report" labels its horizontal row of details (`row`).

---



### Exercise 2: Applying Header Scope Values

**Problem:** Specify appropriate `scope` value (`col`, `row`, `colgroup`, `rowgroup`) for:
1. Top column header cell
2. Leftmost row header cell

**Expected output:**
> [!check]- Answer
> ```text
> 1. scope="col"
> 2. scope="row"
> ```
> ```html
> <th scope="col">Header</th>
> <th scope="row">Row Name</th>
> ```
>
> **Explanation:** `scope="col"` sets column scope; `scope="row"` sets row scope for screen readers.

---

### Exercise 3: Colgroup Scope Usage

**Problem:** When should `scope="colgroup"` be used in data tables?

**Expected output:**
> [!check]- Answer
> ```text
> When a header cell spans multiple columns via colspan over a column group (<colgroup>).
> ```
> ```html
> <th colspan="2" scope="colgroup">2026 Sales</th>
> ```
>
> **Explanation:** `scope="colgroup"` associates a header spanning multiple columns with the entire group.

## 7. Related Terms
- [`<th>` (Table Header)](th.md) — The tag that hosts the `scope` attribute.
- [`<caption>`](caption.md) — The table title helper.
- [`colspan` & `rowspan` Attributes](colspan_rowspan.md) — Attributes used to merge table cells.

---

## 8. Key Takeaways
- The `scope` attribute explicitly connects a header cell to its corresponding row or column.
- It is placed only on `<th>` elements.
- Use `scope="col"` for top headers and `scope="row"` for side/row headers.
- It has no visual impact on the page, but is critical for W3C web accessibility guidelines.
