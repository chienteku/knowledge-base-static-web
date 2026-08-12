# `<table>`

> **Level 4 — Tables**
> The parent container for displaying tabular data (rows and columns).

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Tables are complex elements that require many nested child elements to function.
- [Nesting](../level_01/nesting.md) — Since a table requires nested row and cell structures.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since tables are block-level display components.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: `<table>` is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes data needs to be presented in a strict grid of rows and columns to make sense (like a spreadsheet, a calendar, or a financial report).
The W3C designed the `<table>` element specifically for **tabular data**. It acts as the master container that holds all the rows, headers, and data cells together. 
Crucially, screen readers are incredibly smart when it comes to `<table>` elements. When a blind user navigates a table, the screen reader uses the table's structure to announce which column and row they are currently in, allowing them to mentally map out the spreadsheet.

### (2) Reality Metaphor
Imagine an empty Microsoft Excel file.
The `<table>` element is the Excel window itself. It is the box that holds the grid. By itself, it is completely empty until you start adding Rows and Columns inside of it.

### (3) Code Examples

#### Short Snippet
```html
<!-- The outer container that holds the tabular data -->
<table>
  <!-- Rows and data go inside here -->
</table>
```

#### Fuller Example
```html
<!-- A simple 2x2 grid representing a price list -->
<table>
  <tr>
    <th>Fruit</th>
    <th>Price</th>
  </tr>
  <tr>
    <td>Apple</td>
    <td>$1.00</td>
  </tr>
  <tr>
    <td>Banana</td>
    <td>$0.50</td>
  </tr>
</table>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using tables for page layout

**The mistake:** Using a massive, invisible `<table>` to align the header, sidebar, and main content of your website.

**Why it's wrong:** Back in the 1990s and early 2000s, CSS was very weak, so developers used `<table>` tags to force their websites into grids (e.g., putting the menu in the left column and the text in the right column). **This is now considered one of the worst practices in web development.** 
Tables are strictly for data. If you use a table for layout, screen readers will get confused and read your entire website as if it were a massive, broken spreadsheet. Today, we use CSS (Flexbox or Grid) for layout, and reserve `<table>` solely for actual data.

*Incorrect:*
```html
<!-- DO NOT DO THIS! Using a table to layout a webpage -->
<table>
  <tr>
    <td>Sidebar Menu</td>
    <td>Main Article Content</td>
  </tr>
</table>
```

*Fix:*
```html
<!-- Use semantic HTML and CSS Grid/Flexbox instead -->
<div class="layout-container">
  <aside>Sidebar Menu</aside>
  <main>Main Article Content</main>
</div>
```

---



### Mistake 2: Using `<table>` Elements for Page Layout Structure (Legacy 1990s Anti-Pattern)

**The mistake:** Building entire website page layouts using multi-nested `<table>` grids.

**Why it's wrong:** Using tables for page layout creates rigid, non-responsive web pages that are impossible to adapt for mobile devices and severely degrade accessibility. Use CSS Flexbox and Grid.

*Incorrect:*
```html
<table width="100%">
  <tr><td width="200">Sidebar</td><td>Content</td></tr> <!-- ❌ Table layout anti-pattern! -->
</table>
```

*Fix:*
```html
<div style="display: flex;">
  <aside>Sidebar</aside>
  <main>Content</main>
</div>
```

### Mistake 3: Omitting Tabular Semantic Section Tags (`<thead>`, `<tbody>`, `<tfoot>`)

**The mistake:** Writing 100 `<tr>` rows directly inside `<table>` without section structural containers.

**Why it's wrong:** `<thead>`, `<tbody>`, and `<tfoot>` allow browsers to repeat table headers when printing multi-page documents and enable scrolling tbody containers.

*Incorrect:*
```html
<table>
  <tr><th>Header</th></tr>
  <tr><td>Data</td></tr> <!-- Missing thead/tbody sections -->
</table>
```

*Fix:*
```html
<table>
  <thead><tr><th>Header</th></tr></thead>
  <tbody><tr><td>Data</td></tr></tbody>
</table>
```

## 5. Practice Exercises

### Exercise 1: Complete Accessible HTML Data Table Architecture

**Scenario:** A developer constructs a complete, accessible data table containing `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, and semantic headers.

**Requirements:**
1. Create root `<table>` element.
2. Add `<caption>` as first child.
3. Structure with `<thead>`, `<tbody>`, and `<tfoot>`.
4. Use `<th>` with `scope` for all headers.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table class="inventory-table">
>   <caption>Quarterly Product Inventory & Valuation</caption>
>   <thead>
>     <tr>
>       <th scope="col">SKU Code</th>
>       <th scope="col">Item Description</th>
>       <th scope="col">Quantity</th>
>       <th scope="col">Unit Price</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">SKU-881</th>
>       <td>Ergonomic Keyboard</td>
>       <td>50</td>
>       <td>$120.00</td>
>     </tr>
>     <tr>
>       <th scope="row">SKU-882</th>
>       <td>Vertical Optical Mouse</td>
>       <td>80</td>
>       <td>$45.00</td>
>     </tr>
>   </tbody>
>   <tfoot>
>     <tr>
>       <th scope="row" colspan="2">Total Inventory Count</th>
>       <td>130</td>
>       <td>--</td>
>     </tr>
>   </tfoot>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<table>` Element**: Represents tabular data formatted in rows and columns.
> 2. **Complete Table Anatomy**: Consists of `<caption>`, `<thead>` (headers), `<tbody>` (data), and `<tfoot>` (summaries).
> 3. **Accessibility Principles**: Data tables require semantic headers (`<th>`), explicit `scope`, and a descriptive `<caption>` for 100% accessibility compliance.
> 
---

### Exercise 2: Responsive Scrollable Data Table Container Wrapper

**Scenario:** Wraps a wide data table inside a responsive container (`div.table-container`) allowing horizontal scrolling on mobile screens.

**Requirements:**
1. Wrap `<table>` inside `<div class="table-container" tabindex="0" role="region" aria-label="...">`.
2. Enable horizontal overflow scrolling in CSS.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="table-container" tabindex="0" role="region" aria-label="Quarterly Product Inventory Table">
>   <table class="data-table">
>     <caption>Quarterly Sales Data</caption>
>     <thead>
>       <tr>
>         <th scope="col">Region</th>
>         <th scope="col">Q1</th>
>         <th scope="col">Q2</th>
>         <th scope="col">Q3</th>
>         <th scope="col">Q4</th>
>       </tr>
>     </thead>
>     <tbody>
>       <tr>
>         <th scope="row">North America</th>
>         <td>$100k</td>
>         <td>$120k</td>
>         <td>$140k</td>
>         <td>$160k</td>
>       </tr>
>     </tbody>
>   </table>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Responsive Table Wrappers**: Wide tables cause page overflow on mobile devices; wrapping in a scrollable container prevents layout breaking.
> 2. **Keyboard Scrollability (`tabindex="0"`)**: Adding `tabindex="0"` allows keyboard-only users to focus and scroll the container using arrow keys.
> 3. **Landmark Announcement (`role="region"`)**: Provides accessible labels (`aria-label`) for scrollable table regions.
> 
---

### Exercise 3: Fixing Misuse of HTML Tables for Page Layout

**Scenario:** An auditor refactors a legacy webpage that used `<table>` tags for visual multi-column page layout into modern CSS Grid/Flexbox.

**Requirements:**
1. Replace layout `<table>` with semantic HTML5 containers and CSS.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Refactored: Modern CSS Flexbox Layout replaces legacy layout table -->
> <main class="content-layout">
>   <article class="primary-column">
>     <h2>Main Article</h2>
>     <p>Article body content.</p>
>   </article>
>   <aside class="sidebar-column">
>     <h3>Sidebar Widgets</h3>
>   </aside>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **Tables Are for Data Only**: HTML `<table>` tags MUST only be used for tabular data, NEVER for visual webpage layouts.
> 2. **Accessibility Destruction**: Using tables for page layout confuses screen readers, which announce non-existent table columns and rows.
> 3. **CSS Grid/Flexbox Standards**: Modern CSS Grid and Flexbox handle multi-column layouts cleanly.
## 6. Related Terms
- [`<tr>` (Table Row)](tr.md) — The tag that defines a horizontal row inside the table.
- [`<td>` (Table Data)](td.md) — The tag that holds the actual data inside the row.
- [`<caption>`](caption.md) — The semantic title container for the table.
- [`<thead>`, `<tbody>`, `<tfoot>`](thead_tbody_tfoot.md) — Related concept: `<thead>`, `<tbody>`, `<tfoot>`.
- [`<th>` (Table Header)](th.md) — Table header cells.

---

## 7. Key Takeaways
- The `<table>` element is the container for tabular data.
- It relies on nested elements (`<tr>`, `<th>`, `<td>`) to build the grid.
- NEVER use tables for website layout; use them exclusively for data.
- Tables provide massive accessibility benefits for screen readers when used correctly.
