# `colspan` & `rowspan` Attributes

> **Level 4 — Tables**
> Attributes used on table cells (`<td>` and `<th>`) to merge them horizontally across columns or vertically across rows.

---

## 1. Prerequisites
- [`<td>` (Table Data)](td.md) — The standard table cell.
- [`<th>` (Table Header)](th.md) — The header cell.
- [`<table>`](table.md) — The master table grid.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `colspan` & `rowspan` Attributes is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Complex Financial Balance Sheet with Multi-Column Headers

**Scenario:** An author builds a financial summary table using `colspan="2"` to span category header cells across multiple sub-columns.

**Requirements:**
1. Use `colspan="2"` on header cells to group columns.
2. Use `scope="colgroup"` for merged headers.
3. Verify column alignment in data rows.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Company Balance Sheet (2025 vs 2026)</caption>
>   <thead>
>     <tr>
>       <th scope="col" rowspan="2">Category</th>
>       <th scope="colgroup" colspan="2">2025 Fiscal Year</th>
>       <th scope="colgroup" colspan="2">2026 Fiscal Year</th>
>     </tr>
>     <tr>
>       <th scope="col">Budget</th>
>       <th scope="col">Actual</th>
>       <th scope="col">Budget</th>
>       <th scope="col">Actual</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Research & Development</th>
>       <td>$1.2M</td>
>       <td>$1.1M</td>
>       <td>$1.5M</td>
>       <td>$1.4M</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `colspan` Attribute**: Merges a table cell horizontally across multiple adjacent columns (`colspan="2"`).
> 2. **The `rowspan` Attribute**: Merges a table cell vertically across multiple adjacent rows (`rowspan="2"`).
> 3. **Screen Reader Grid Navigation**: When using `colspan`/`rowspan`, ensure grid cell coordinates remain consistent for screen readers.
> 
---

### Exercise 2: Multi-Day Conference Schedule Table with Spanning Row Cells

**Scenario:** A developer creates a conference schedule where a single key-note speech spans across 3 time slots using `rowspan="3"`.

**Requirements:**
1. Use `rowspan="3"` on a `<td>` cell to span multiple time rows.
2. Ensure adjacent rows omit the spanned column cell.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Tech Conference Track Schedule</caption>
>   <thead>
>     <tr>
>       <th scope="col">Time</th>
>       <th scope="col">Main Stage</th>
>       <th scope="col">Workshop Room</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">09:00 AM</th>
>       <td rowspan="2">Keynote: Future of Web Standards (2 Hours)</td>
>       <td>CSS Grid Deep Dive</td>
>     </tr>
>     <tr>
>       <th scope="row">10:00 AM</th>
>       <td>Accessibility Testing Lab</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **Row Merging Logic**: `rowspan="2"` causes a cell to extend down into the next row's layout vertical space.
> 2. **Omitting Spanned Cells**: Subsequent rows covered by a `rowspan` MUST omit that cell column entry to prevent table row distortion.
> 3. **Visual Timetable Layouts**: `rowspan` is ideal for scheduling grids and calendar timetables.
> 
---

### Exercise 3: Accessible Data Matrix Grid with Combined colspan and rowspan

**Scenario:** Constructs a multi-dimensional matrix combining column and row spanning.

**Requirements:**
1. Combine `colspan` and `rowspan` attributes.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Regional Sales Matrix</caption>
>   <thead>
>     <tr>
>       <th scope="col" rowspan="2">Region</th>
>       <th scope="colgroup" colspan="2">Q1 Sales</th>
>     </tr>
>     <tr>
>       <th scope="col">Online</th>
>       <th scope="col">Retail</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">North America</th>
>       <td>$500K</td>
>       <td>$300K</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **Matrix Header Grouping**: `colspan` groups sub-headers; `rowspan` preserves primary axis labels.
> 2. **Cell Count Verification**: Always count total spans (`colspan` + remaining cells) to match expected row cell count.
> 3. **Accessibility Testing**: Test complex spanned tables with screen readers to verify headers are announced correctly.
## 6. Related Terms
- [`<td>` (Table Data)](td.md) — The tag that receives span attributes.
- [`<th>` (Table Header)](th.md) — Header cells which frequently span across categories.
- [`scope` Attribute (in `<th>`)](scope.md) — Used alongside spans to clarify multi-cell header authority.

---

## 7. Key Takeaways
- `colspan` merges cells horizontally across columns.
- `rowspan` merges cells vertically down across rows.
- Always delete the subsequent cell tags that would have occupied the merged area to prevent layout distortion.
- Span values must be positive integers (e.g. `colspan="2"`, not `colspan="0"` or negative).
- Spanned tables require careful planning of row and cell count structures.
