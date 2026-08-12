# `<tr>` (Table Row)

> **Level 4 — Tables**
> Defines a horizontal row of cells in a table.

---

## 1. Prerequisites
- [`<table>`](table.md) — The parent container for all rows.
- [Nesting](../level_01/nesting.md) — Since table rows must nest directly inside a parent table container.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: `<tr>` (Table Row) is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A table needs a way to organize its grid. In HTML, tables are built horizontally, row by row (not column by column). 
The W3C designed the `<tr>` (Table Row) element to serve as the horizontal container. Every time you want to start a new line in your spreadsheet, you create a new `<tr>`. Inside that row, you will then place your individual data cells.

### (2) Reality Metaphor
Imagine a bookshelf.
The `<table>` is the entire wooden frame of the bookshelf.
The `<tr>` is a single horizontal wooden shelf. You can't put a book directly onto the frame; you have to put it on a shelf. The more shelves (`<tr>` tags) you add, the taller the bookshelf gets.

### (3) Code Examples

#### Short Snippet
```html
<table>
  <!-- Row 1 -->
  <tr>
    <!-- Cells go here -->
  </tr>
  <!-- Row 2 -->
  <tr>
    <!-- Cells go here -->
  </tr>
</table>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting text directly inside a `<tr>`

**The mistake:** Writing text directly inside the `<tr>` tags without wrapping it in a data cell.

**Why it's wrong:** A row is just a structural container (like a shelf). It cannot hold raw data. The HTML specification requires that the only valid children of a `<tr>` are `<th>` (headers) or `<td>` (data cells). If you put raw text inside a `<tr>`, the browser will usually break the table layout and render the text outside the table entirely!

*Incorrect:*
```html
<table>
  <tr>
    Employee Name: John Doe <!-- WRONG! Missing cell tags -->
  </tr>
</table>
```

*Fix:*
```html
<table>
  <tr>
    <td>Employee Name: John Doe</td> <!-- CORRECT! Wrapped in a cell -->
  </tr>
</table>
```

---



### Mistake 2: Placing Raw Text or Non-`<th>`/`<td>` Elements Directly Inside `<tr>` Rows

**The mistake:** Writing `<tr>Direct text string</tr>` or `<tr><div>Box</div></tr>`.

**Why it's wrong:** The ONLY permitted direct children of a `<tr>` element are `<th>` and `<td>` table cells. Raw text or `<div>` elements inside `<tr>` are invalid HTML.

*Incorrect:*
```html
<tr>
  <div>Cell Content</div> <!-- ❌ Invalid direct child inside tr! -->
</tr>
```

*Fix:*
```html
<tr>
  <td><div>Cell Content</div></td> <!-- Wrap inside td cell -->
</tr>
```

### Mistake 3: Varying Cell Counts Across `<tr>` Rows Without Using `colspan` or `rowspan`

**The mistake:** Creating Row 1 with 3 cells, and Row 2 with 2 cells without `colspan`.

**Why it's wrong:** Row cell counts in a table must match across all rows. Mismatched cell counts create broken table grids with missing border cells.

*Incorrect:*
```html
<tr><td>1</td><td>2</td><td>3</td></tr>
<tr><td>4</td><td>5</td></tr> <!-- ❌ Missing 3rd cell breaks grid column! -->
```

*Fix:*
```html
<tr><td>1</td><td>2</td><td>3</td></tr>
<tr><td>4</td><td colspan="2">5</td></tr> <!-- Merge remaining column -->
```

## 5. Practice Exercises

### Exercise 1: Structuring Data Rows inside Table Sections

**Scenario:** An author creates table rows (`<tr>`) containing appropriate header and data cells.

**Requirements:**
1. Create `<tr>` elements inside `<thead>`, `<tbody>`, and `<tfoot>`.
2. Ensure `<tr>` contains only `<th>` or `<td>` children.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Employee Roster</caption>
>   <thead>
>     <tr> <!-- Header Row -->
>       <th scope="col">ID</th>
>       <th scope="col">Name</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr> <!-- Data Row 1 -->
>       <th scope="row">#1</th>
>       <td>Alice</td>
>     </tr>
>     <tr> <!-- Data Row 2 -->
>       <th scope="row">#2</th>
>       <td>Bob</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<tr>` Table Row Element**: Represents a single horizontal row of cells in a table.
> 2. **Valid Children of `<tr>`**: `<tr>` elements can ONLY contain `<th>` and `<td>` cell tags.
> 3. **Parent Sectioning**: `<tr>` must be nested inside `<thead>`, `<tbody>`, `<tfoot>`, or directly inside `<table>`.
> 
---

### Exercise 2: Alternating Row Colors for Visual Scannability

**Scenario:** Applies CSS zebra-striping to `<tr>` elements for improved scannability.

**Requirements:**
1. Style alternating `<tr>` rows using CSS `:nth-child(even)`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <tbody class="zebra-table">
>   <tr>
>     <th scope="row">Row 1</th>
>     <td>Data A</td>
>   </tr>
>   <tr>
>     <th scope="row">Row 2</th>
>     <td>Data B</td>
>   </tr>
> </tbody>
> ```
>
> #### Technical Explanation
>
> 1. **Zebra Striping Rows**: Alternating background colors on `<tr>` elements helps users track horizontal data rows.
> 2. **Pure CSS Styling**: Use CSS `tr:nth-child(even)` instead of cluttering HTML with hardcoded `class="even"` attributes.
> 3. **No Impact on Semantics**: Row styling does not affect screen reader navigation.
> 
---

### Exercise 3: Interactive Table Rows with Keyboard Focus and ARIA Roles

**Scenario:** Adds interactive selection capabilities to table rows for dynamic web apps.

**Requirements:**
1. Add `tabindex="0"` and `aria-selected` to interactive `<tr>` elements.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <tbody role="rowgroup">
>   <tr tabindex="0" aria-selected="true" class="selected-row">
>     <th scope="row">Message #101</th>
>     <td>Unread Email Subject</td>
>   </tr>
> </tbody>
> ```
>
> #### Technical Explanation
>
> 1. **Interactive Table Rows**: Adding `tabindex="0"` allows users to navigate data rows via Tab and arrow keys.
> 2. **ARIA Selection State**: `aria-selected="true"` communicates selected row state to screen readers.
> 3. **Application Web Apps**: Used in email clients and data grids for row selection.
## 6. Related Terms
- [`<table>`](table.md) — The parent that holds the `<tr>`.
- [`<td>` (Table Data)](td.md) — The data cells that go *inside* the `<tr>`.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing table rows.
- [`<th>` (Table Header)](th.md) — Related concept: `<th>` (Table Header).
- [`<thead>`, `<tbody>`, `<tfoot>`](thead_tbody_tfoot.md) — Related concept: `<thead>`, `<tbody>`, `<tfoot>`.

---

## 7. Key Takeaways
- `<tr>` stands for Table Row.
- It is used to slice a table horizontally.
- You cannot put text directly inside a `<tr>`; it must contain `<td>` or `<th>` cells.
- Tables in HTML are built row-by-row, not column-by-column.
