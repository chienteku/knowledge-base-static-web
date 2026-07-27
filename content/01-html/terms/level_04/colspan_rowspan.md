# `colspan` & `rowspan` Attributes

> **Level 4 — Tables**
> Attributes used on table cells (`<td>` and `<th>`) to merge them horizontally across columns or vertically across rows.

---

## 1. Prerequisites
- [`<td>` (Table Data)](../level_04/td.md) — The standard table cell.
- [`<th>` (Table Header)](../level_04/th.md) — The header cell.
- [`<table>`](../level_04/table.md) — The master table grid.

---

## 2. Term Category
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Supported by all web browsers since early HTML specs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, HTML tables are strict grids. If your table has 3 columns, then every single row (`<tr>`) should contain exactly 3 cells. 

However, real-world spreadsheets and schedules often require cells to merge together:
-   **Header Span:** A single category title needs to sit centered above two columns (e.g. "Contact Details" spanning across "Phone" and "Email").
-   **Row Span:** A single category label needs to cover multiple rows (e.g. "Monday" sitting next to 3 different class periods).

The W3C created the **`colspan`** and **`rowspan`** attributes to let cells stretch across columns and rows, exactly like the "Merge Cells" button in Microsoft Excel or Google Sheets.

---

### (2) Column Span vs. Row Span
-   **`colspan` (Column Span):** Merges cells **horizontally** to the right. A value of `colspan="2"` tells the cell to take up its own slot plus one slot to its right.
-   **`rowspan` (Row Span):** Merges cells **vertically** downwards. A value of `rowspan="2"` tells the cell to take up its slot plus the slot directly beneath it in the next row.

---

### (3) The Crucial Rule: Deleting "Displaced" Cells
When you tell a cell to expand, it physically pushes the adjacent cells out of the way. **Therefore, you must delete the cells that would have occupied the merged space.** If you don't, the grid will bulge out and look broken.

---

### (4) Code Examples

#### Short Snippet
Merging columns horizontally:

```html
<!-- Table with 3 columns -->
<table>
  <tr>
    <!-- Spans columns 1 and 2, meaning we only write 2 cell tags in this row total! -->
    <th colspan="2">Merged Header</th>
    <th>Column 3</th>
  </tr>
  <tr>
    <td>Data A</td>
    <td>Data B</td>
    <td>Data C</td>
  </tr>
</table>
```

#### Fuller Example
A calendar schedule using both column and row spans:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Spanning Grid</title>
</head>
<body>

  <h1>Class Schedule</h1>

  <table border="1">
    <caption>Weekly Time Slots</caption>
    <thead>
      <tr>
        <th>Time</th>
        <th>Monday</th>
        <th>Tuesday</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>9:00 AM</td>
        <!-- Biology spans 2 rows vertically (9:00 AM and 10:00 AM) -->
        <td rowspan="2">Biology Lab</td>
        <td>Math</td>
      </tr>
      <tr>
        <td>10:00 AM</td>
        <!-- Note: We omit Monday's cell here because Biology is spanning down into it! -->
        <td>History</td>
      </tr>
      <tr>
        <td>11:00 AM</td>
        <!-- Free Period spans 2 columns horizontally (Monday and Tuesday) -->
        <td colspan="2">Free Study Period</td>
      </tr>
    </tbody>
  </table>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to delete displaced cells

**The mistake:** Telling a cell to merge, but still writing the default number of cells in that row:

```html
<!-- BAD: Row 1 ends up with 4 columns, bulging the table layout! -->
<table>
  <tr>
    <td colspan="2">Alice</td> <!-- Takes 2 columns -->
    <td>Bob</td>
    <td>Charlie</td>
  </tr>
</table>
```

**Fix:** If the table has 3 columns total, and Alice takes 2, only 1 slot remains:

```html
<!-- CORRECT: Alice spans 2, Bob takes the 3rd -->
<table>
  <tr>
    <td colspan="2">Alice</td>
    <td>Bob</td>
  </tr>
</table>
```

---



### Mistake 2: Over-Counting Cells When Using `colspan` (Broken Table Grid Structure)

**The mistake:** Adding 3 `<td>` cells to a row where one cell already specifies `colspan="2"` in a 3-column table.

**Why it's wrong:** `colspan="2"` causes that cell to consume 2 column slots. Adding 2 additional cells creates 4 total columns, warping table alignment.

*Incorrect:*
```html
<!-- Table has 3 columns -->
<tr>
  <td colspan="2">Wide Cell</td> <!-- Consumes 2 cols -->
  <td>Col 2</td>
  <td>Col 3</td> <!-- ❌ Overflow cell distorts grid! -->
</tr>
```

*Fix:*
```html
<tr>
  <td colspan="2">Wide Cell</td> <!-- Consumes 2 cols -->
  <td>Col 3</td> <!-- Total 3 cols -->
</tr>
```

### Mistake 3: Miscalculating `rowspan` Across Subsequent Table Rows

**The mistake:** Specifying `rowspan="3"` without reducing `<td>` cell count in the next 2 table rows.

**Why it's wrong:** A cell spanning multiple rows pushes cells in subsequent rows to the right. Failing to remove extra cells in lower rows breaks column alignment.

*Incorrect:*
```html
<tr><td rowspan="2">Spanner</td><td>A</td></tr>
<tr><td>B</td><td>C</td></tr> <!-- ❌ Extra cell pushed out of alignment! -->
```

*Fix:*
```html
<tr><td rowspan="2">Spanner</td><td>A</td></tr>
<tr><td>B</td></tr> <!-- Lower row has 1 fewer cell -->
```

## 6. Practice Exercises

### Exercise 1: Spanning Row Count

**Problem:** You are building a table with 3 columns and 3 rows. The cell in Row 1, Column 1 has `rowspan="3"`. How many total cell tags (`<td>` or `<th>`) will you write inside Row 2?

**Expected output:**
```text
2 cells. (Column 1 is occupied by the rowspan from Row 1, so Row 2 only needs tags for Column 2 and Column 3).
```

> [!check]- Answer
> - Sketch a 3x3 grid on paper and shade in the merged block starting from cell 1,1.

---



### Exercise 2: Multi-Column Header Cell

**Problem:** Write a `<th>` cell spanning 3 columns with text `'Quarterly Performance'`. 

**Expected output:**
```text
<th colspan="3">Quarterly Performance</th>
```

> [!check]- Answer
> ```html
> <th colspan="3">Quarterly Performance</th>
> ```
>
> **Explanation:** `colspan="N"` merges N horizontal column cells together.

### Exercise 3: Combining Colspan and Rowspan

**Problem:** Write a `<td>` cell spanning 2 rows vertically and 2 columns horizontally.

**Expected output:**
```text
<td rowspan="2" colspan="2">Merged Block</td>
```

> [!check]- Answer
> ```html
> <td rowspan="2" colspan="2">Merged Block</td>
> ```
>
> **Explanation:** `rowspan` and `colspan` can be combined on a single cell to create multi-cell grid blocks.

## 7. Related Terms
- [`<td>` (Table Data)](../level_04/td.md) — The tag that receives span attributes.
- [`<th>` (Table Header)](../level_04/th.md) — Header cells which frequently span across categories.
- [`scope` Attribute (in `<th>`)](../level_04/scope.md) — Used alongside spans to clarify multi-cell header authority.

---

## 8. Key Takeaways
- `colspan` merges cells horizontally across columns.
- `rowspan` merges cells vertically down across rows.
- Always delete the subsequent cell tags that would have occupied the merged area to prevent layout distortion.
- Span values must be positive integers (e.g. `colspan="2"`, not `colspan="0"` or negative).
- Spanned tables require careful planning of row and cell count structures.
