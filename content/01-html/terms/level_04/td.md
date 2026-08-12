# `<td>` (Table Data)

> **Level 4 — Tables**
> Defines a standard data cell in a table.

---

## 1. Prerequisites
- [`<tr>` (Table Row)](tr.md) — The `<td>` element MUST be placed inside a `<tr>`.
- [Nesting](../level_01/nesting.md) — Since table data cells must nest directly inside a parent table row container.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: `<td>` (Table Data) is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Formatting Standard Data Cells inside tbody with Numeric Alignment

**Scenario:** An author formats data cells (`<td>`) inside a financial table, applying CSS numeric alignment classes.

**Requirements:**
1. Use `<td>` for data values inside `<tbody>` rows.
2. Apply text alignment classes for numbers.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Monthly Expense Report</caption>
>   <thead>
>     <tr>
>       <th scope="col">Expense Category</th>
>       <th scope="col">Amount</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Office Supplies</th>
>       <td class="text-right">$245.50</td>
>     </tr>
>     <tr>
>       <th scope="row">Internet Utility</th>
>       <td class="text-right">$129.99</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<td>` Element**: Represents a standard data cell in a table; MUST be contained inside a `<tr>` row.
> 2. **Data Cell vs Header Cell**: `<td>` holds data values; `<th>` holds header labels.
> 3. **Numeric Alignment**: Aligning numeric `<td>` values to the right (`text-right`) improves visual scannability and column alignment.
> 
---

### Exercise 2: Empty Data Cell Fallbacks for Missing Values

**Scenario:** Replaces blank `<td></td>` cells with explicit fallback text (`<td>N/A</td>` or `<td>--</td>`).

**Requirements:**
1. Provide explicit fallback content for empty data cells.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <tbody>
>   <tr>
>     <th scope="row">John Doe</th>
>     <td>john@example.com</td>
>     <td>N/A</td> <!-- Explicit fallback instead of empty <td></td> -->
>   </tr>
> </tbody>
> ```
>
> #### Technical Explanation
>
> 1. **Empty Cell Pitfall**: Leaving `<td></td>` blank confuses screen reader users who cannot tell if data is missing or skipped.
> 2. **Explicit Fallback Text**: Using 'N/A', '--', or 'None' clarifies missing data values.
> 3. **Table Structure Consistency**: Ensures every row maintains the exact same number of `<td>` cells.
> 
---

### Exercise 3: Structuring Action Cells with Buttons inside td

**Scenario:** Includes interactive action buttons inside data table cells (`<td>`).

**Requirements:**
1. Place `<button>` tags inside `<td>` cells for row action controls.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <tbody>
>   <tr>
>     <th scope="row">Order #4092</th>
>     <td>Shipped</td>
>     <td>
>       <button type="button" class="btn-sm">View Details</button>
>       <button type="button" class="btn-sm btn-danger">Cancel</button>
>     </td>
>   </tr>
> </tbody>
> ```
>
> #### Technical Explanation
>
> 1. **Interactive `<td>` Content**: `<td>` cells can contain interactive buttons, links, or form controls.
> 2. **Accessible Action Labels**: Ensure action buttons inside `<td>` specify accessible names (e.g. 'Cancel Order #4092').
> 3. **DOM Validation**: `<td>` can contain flow content including buttons and links.
## 6. Related Terms
- [`<th>` (Table Header)](th.md) — The bold header equivalent of the data cell.
- [`colspan` & `rowspan` Attributes](colspan_rowspan.md) — Attributes used to merge table cells.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing table data.
- [`<table>`](table.md) — Related concept: `<table>`.
- [`<tr>` (Table Row)](tr.md) — Related concept: `<tr>` (Table Row).

---

## 7. Key Takeaways
- `<td>` stands for Table Data.
- It is the standard cell that holds information.
- Every `<td>` you add to a row creates a new column.
- Always ensure every row has the exact same number of cells (even if some are empty) to maintain a perfect grid.
