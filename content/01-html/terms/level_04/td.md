# `<td>` (Table Data)

> **Level 4 — Tables**
> Defines a standard data cell in a table.

---

## 1. Prerequisites
- [`<tr>` (Table Row)](tr.md) — The `<td>` element MUST be placed inside a `<tr>`.
- [Nesting](../level_01/nesting.md) — Since table data cells must nest directly inside a parent table row container.

---

## 2. Term Category
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you've built a table (`<table>`) and added a horizontal row (`<tr>`), you need a place to put the actual information. 
The W3C created the `<td>` (Table Data) element to act as the fundamental container for tabular data. It is the individual, rectangular cell where you place text, images, or even other nested tables. Every `<td>` you add to a row creates a new column in that row.

### (2) Reality Metaphor
If the `<table>` is a bookshelf and the `<tr>` is a wooden shelf, the `<td>` is the actual book you place on the shelf. 
Alternatively, in an Excel spreadsheet, a `<td>` is a single rectangular cell (like cell B4).

### (3) Code Examples

#### Short Snippet
```html
<tr>
  <!-- These cells create three columns in this row -->
  <td>Apple</td>
  <td>Red</td>
  <td>$1.00</td>
</tr>
```

#### Fuller Example
```html
<table>
  <tr>
    <th>Employee</th>
    <th>Role</th>
    <th>Status</th>
  </tr>
  <tr>
    <!-- The data cells align directly under the header cells -->
    <td>Jane Smith</td>
    <td>Developer</td>
    <td>Active</td>
  </tr>
</table>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Uneven columns

**The mistake:** Putting three `<td>` elements in the first row, but only two `<td>` elements in the second row.

**Why it's wrong:** Tables expect a perfect grid. If you are missing cells in a row, the browser will leave an empty, unstyled void at the end of that row, which can break borders and make the data look corrupted. If a cell is supposed to be empty, you should still include an empty `<td></td>` tag to maintain the grid structure.

*Incorrect:*
```html
<table>
  <tr>
    <td>Apples</td>
    <td>$1.00</td>
  </tr>
  <tr>
    <td>Bananas</td>
    <!-- WRONG: Missing the price cell, the grid is broken! -->
  </tr>
</table>
```

*Fix:*
```html
<table>
  <tr>
    <td>Apples</td>
    <td>$1.00</td>
  </tr>
  <tr>
    <td>Bananas</td>
    <td></td> <!-- CORRECT: An empty cell maintains the grid -->
  </tr>
</table>
```

---



### Mistake 2: Placing `<td>` Data Cells Directly Inside `<table>` Without `<tr>` Row Wrappers

**The mistake:** Writing `<table><td>Data 1</td><td>Data 2</td></table>`.

**Why it's wrong:** `<td>` data cells MUST be wrapped inside a `<tr>` (Table Row) container. Placing `<td>` directly inside `<table>` is invalid HTML.

*Incorrect:*
```html
<table>
  <td>Direct Cell</td> <!-- ❌ Invalid: td must be inside tr! -->
</table>
```

*Fix:*
```html
<table>
  <tr><td>Cell 1</td><td>Cell 2</td></tr>
</table>
```

### Mistake 3: Using `<td>` for Column Header Cells Instead of `<th>`

**The mistake:** Using `<td>` cells with bold CSS styling for table header titles.

**Why it's wrong:** `<td>` cells represent data items only. Header title cells MUST use `<th>` so screen readers recognize them as headers.

*Incorrect:*
```html
<thead>
  <tr><td style="font-weight: bold;">Name</td></tr> <!-- ❌ Use th for headers! -->
</thead>
```

*Fix:*
```html
<thead>
  <tr><th scope="col">Name</th></tr>
</thead>
```

## 6. Practice Exercises

### Exercise 1: Finding the Cell

**Problem:** In this table, what word is in the 2nd row, 1st column?
```html
<table>
  <tr>
    <td>Dog</td>
    <td>Cat</td>
  </tr>
  <tr>
    <td>Bird</td>
    <td>Fish</td>
  </tr>
</table>
```

**Expected output:**
> [!check]- Answer
> ```text
> "Bird"
> ```
> - The first `<tr>` is row 1. The second `<tr>` is row 2. The first `<td>` inside that row is column 1.
> 
---



### Exercise 2: Table Cell Data Alignment

**Problem:** Write CSS rule aligning numbers right inside `<td>` data cells.

**Expected output:**
> [!check]- Answer
> ```text
> td.number { text-align: right; }
> ```
> ```css
> td.number {
>   text-align: right;
> }
> ```
>
> **Explanation:** Numerical table data cells should be right-aligned for column readability.
> 
---

### Exercise 3: Empty Cell Display

**Problem:** Which CSS property controls whether borders and backgrounds are rendered for empty `<td>` cells?

**Expected output:**
> [!check]- Answer
> ```text
> empty-cells: show; (or empty-cells: hide;)
> ```
> ```css
> table {
>   empty-cells: hide;
> }
> ```
>
> **Explanation:** `empty-cells` controls rendering behavior for table cells with no content.
> 
## 7. Related Terms
- [`<th>` (Table Header)](th.md) — The bold header equivalent of the data cell.
- [`colspan` & `rowspan` Attributes](colspan_rowspan.md) — Attributes used to merge table cells.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing table data.
- [`<table>`](table.md) — Related concept: `<table>`.
- [`<tr>` (Table Row)](tr.md) — Related concept: `<tr>` (Table Row).

---

## 8. Key Takeaways
- `<td>` stands for Table Data.
- It is the standard cell that holds information.
- Every `<td>` you add to a row creates a new column.
- Always ensure every row has the exact same number of cells (even if some are empty) to maintain a perfect grid.
