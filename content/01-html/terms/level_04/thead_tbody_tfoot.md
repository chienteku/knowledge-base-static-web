# `<thead>`, `<tbody>`, `<tfoot>`

> **Level 4 — Tables**
> Semantic grouping elements used to divide a table into a header, body, and footer.

---

## 1. Prerequisites
- [`<table>`](table.md) — These tags are placed directly inside the table element.
- [Nesting](../level_01/nesting.md) — Since these section wrappers must nest inside the parent `<table>` tag.

---

## 2. Term Category

**Semantic Tag (Universal Browser Support)**: `<thead>`, `<tbody>`, `<tfoot>` is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a table with 1,000 rows of data, scrolling through it becomes a nightmare. If you scroll down to row 500, the headers at the top of the table scroll off the screen, and you forget what the columns mean!
The W3C created `<thead>` (Table Head), `<tbody>` (Table Body), and `<tfoot>` (Table Foot) to logically separate the parts of a massive table. 
By wrapping your header rows in `<thead>` and your data rows in `<tbody>`, you explicitly tell the browser the structure of the data. This allows developers to use CSS to "freeze" the `<thead>` at the top of the screen while the user scrolls through the `<tbody>`. It also allows printers to automatically repeat the `<thead>` at the top of every printed piece of paper.

### (2) Reality Metaphor
Imagine a multi-page printed financial report.
The `<thead>` is the column titles printed at the top of every single page.
The `<tbody>` is the hundreds of lines of numbers.
The `<tfoot>` is the "Grand Total" printed at the very bottom of the last page.

### (3) Code Examples

#### Short Snippet
```html
<table>
  <thead>
    <tr><th>Item</th><th>Price</th></tr>
  </thead>
  <tbody>
    <tr><td>Milk</td><td>$2.00</td></tr>
  </tbody>
  <tfoot>
    <tr><td>Total</td><td>$2.00</td></tr>
  </tfoot>
</table>
```

#### Fuller Example
```html
<table>
  <!-- The Header group -->
  <thead>
    <tr>
      <th>Employee Name</th>
      <th>Salary</th>
    </tr>
  </thead>
  
  <!-- The Data group -->
  <tbody>
    <tr>
      <td>Alice</td>
      <td>$50,000</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>$60,000</td>
    </tr>
  </tbody>
  
  <!-- The Footer group (usually for summaries or totals) -->
  <tfoot>
    <tr>
      <th>Total Payroll</th>
      <td>$110,000</td>
    </tr>
  </tfoot>
</table>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing `<tfoot>` in the wrong order

**The mistake:** Placing the `<tfoot>` tag *after* the `<tbody>` tag in older HTML4 codebases, or arbitrarily moving them around.

**Fun Fact / History:** In HTML4, you were actually required to put the `<tfoot>` *before* the `<tbody>` in your code! This was so the browser could render the footer at the bottom of the screen before it finished downloading a massive body of 10,000 rows. 
However, in HTML5, this rule was changed to make the code more readable. Today, you should write them in the logical order: `<thead>`, then `<tbody>`, then `<tfoot>`.

---



### Mistake 2: Placing `<tbody>` Above `<thead>` in HTML Source Code

**The mistake:** Writing `<table><tbody>...</tbody><thead>...</thead></table>`.

**Why it's wrong:** `<thead>` MUST precede `<tbody>` and `<tfoot>` in document source order for valid HTML parsing.

*Incorrect:*
```html
<table>
  <tbody><tr><td>Data</td></tr></tbody>
  <thead><tr><th>Header</th></tr></thead> <!-- ❌ thead must come before tbody! -->
</table>
```

*Fix:*
```html
<table>
  <thead><tr><th>Header</th></tr></thead>
  <tbody><tr><td>Data</td></tr></tbody>
</table>
```

### Mistake 3: Placing Summary Calculation Rows Inside `<tbody>` Instead of `<tfoot>`

**The mistake:** Placing table total/summary rows at the end of `<tbody>`.

**Why it's wrong:** `<tfoot>` semantically wraps summary calculations (totals, averages). Placing summary rows in `<tfoot>` allows printed documents to repeat footer totals on every page.

*Incorrect:*
```html
<tbody>
  <tr><td>Item 1</td><td>$10</td></tr>
  <tr><td>Total:</td><td>$10</td></tr> <!-- ❌ Summary row belongs in tfoot! -->
</tbody>
```

*Fix:*
```html
<tbody><tr><td>Item 1</td><td>$10</td></tr></tbody>
<tfoot><tr><th>Total:</th><td>$10</td></tr></tfoot>
```

## 5. Practice Exercises

### Exercise 1: Structuring Multi-Section Tables with thead, tbody, and tfoot

**Scenario:** A developer structures a financial ledger table into distinct header (`<thead>`), body (`<tbody>`), and footer (`<tfoot>`) sections.

**Requirements:**
1. Group header rows in `<thead>`.
2. Group main data rows in `<tbody>`.
3. Group total summary rows in `<tfoot>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table class="ledger-table">
>   <caption>Monthly Financial Summary</caption>
>   <thead>
>     <tr>
>       <th scope="col">Transaction ID</th>
>       <th scope="col">Description</th>
>       <th scope="col">Amount</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">TX-101</th>
>       <td>Client Payment</td>
>       <td>+$1,500.00</td>
>     </tr>
>     <tr>
>       <th scope="row">TX-102</th>
>       <td>Software License</td>
>       <td>-$200.00</td>
>     </tr>
>   </tbody>
>   <tfoot>
>     <tr>
>       <th scope="row" colspan="2">Net Total Balance</th>
>       <td>+$1,300.00</td>
>     </tr>
>   </tfoot>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<thead>` Element**: Groups header rows at the top of the table.
> 2. **The `<tbody>` Element**: Groups the primary body data rows of the table; a table can contain multiple `<tbody>` sections.
> 3. **The `<tfoot>` Element**: Groups calculation summary rows at the bottom of the table.
> 
---

### Exercise 2: Printing Repeat Table Headers across Page Breaks using thead

**Scenario:** Demonstrates how `<thead>` and `<tfoot>` repeat automatically when printed across multiple pages.

**Requirements:**
1. Structure document table with `<thead>` and `<tfoot>` for print styling.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Multi-Page Printed Invoice Report</caption>
>   <thead>
>     <tr><th scope="col">Item</th><th scope="col">Price</th></tr>
>   </thead>
>   <tbody>
>     <!-- Hundreds of invoice rows -->
>   </tbody>
>   <tfoot>
>     <tr><th scope="row">Page Summary</th><td>End of Report</td></tr>
>   </tfoot>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **Print Media Behavior**: When printing long tables, browsers automatically repeat `<thead>` at the top of every printed page.
> 2. **DOM Parsing Order in HTML5**: In HTML5, `<tfoot>` MUST be placed AFTER `<tbody>` in source code.
> 3. **Semantic Sectioning**: Provides clear structural boundaries for JavaScript DOM manipulation.
> 
---

### Exercise 3: Calculating Column Summary Aggregations in tfoot

**Scenario:** Uses `<tfoot>` to present column totals and average calculations.

**Requirements:**
1. Include sum totals in `<tfoot>` with `colspan`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <tfoot>
>   <tr>
>     <th scope="row" colspan="3">Grand Total Revenue</th>
>     <td>$45,200.00</td>
>   </tr>
> </tfoot>
> ```
>
> #### Technical Explanation
>
> 1. **Summary Aggregations**: `<tfoot>` separates summary metadata calculations from raw data rows in `<tbody>`.
> 2. **Accessibility Distinction**: Screen readers recognize `<tfoot>` as table summary rows.
> 3. **Clean Table Layout**: Ensures footers remain at the table bottom regardless of row sorting.
## 6. Related Terms
- [`<table>`](table.md) — The master container that holds these semantic groups.
- [`<tr>` (Table Row)](tr.md) — The horizontal row elements nested inside these group containers.

---

## 7. Key Takeaways
- `<thead>`, `<tbody>`, and `<tfoot>` are used to semantically group rows in a table.
- They do not change the visual appearance of the table by default.
- They are incredibly useful for scrolling large tables (keeping headers frozen) and for printing multi-page tables.
- They should be written in top-to-bottom logical order in HTML5.
