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
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Tabular Data Identification

**Problem:** Which of the following should be built using a `<table>` tag?
1. A photo gallery with 3 columns of images.
2. A comparison chart showing the features of 3 different pricing plans.
3. The layout of a newspaper with a left column and right column.

**Expected output:**
> [!check]- Answer
> ```text
> Only #2 (The comparison chart). It is actual tabular data. The photo gallery and newspaper layout should be built using CSS Grid or Flexbox, because they are layout problems, not data relationships.
> ```
> - Does the data lose its meaning if it's not strictly aligned in specific rows and columns?

---



### Exercise 2: Structuring Basic Data Table

**Problem:** Write complete `<table>` containing `caption`, `thead` with 2 `th` cells, and `tbody` with 1 data row.

**Expected output:**
> [!check]- Answer
> ```text
> <table><caption>Users</caption><thead><tr><th>ID</th><th>Name</th></tr></thead><tbody><tr><td>1</td><td>Alice</td></tr></tbody></table>
> ```
> ```html
> <table>
>   <caption>Users</caption>
>   <thead>
>     <tr><th>ID</th><th>Name</th></tr>
>   </thead>
>   <tbody>
>     <tr><td>1</td><td>Alice</td></tr>
>   </tbody>
> </table>
> ```
>
> **Explanation:** Semantic table structure organizes data into `caption`, `thead`, and `tbody` sections.

---

### Exercise 3: Table Border-Collapse CSS Property

**Problem:** Which CSS property merges adjacent table cell borders into a single thin border?

**Expected output:**
> [!check]- Answer
> ```text
> border-collapse: collapse;
> ```
> ```css
> table {
>   border-collapse: collapse;
> }
> ```
>
> **Explanation:** `border-collapse: collapse` eliminates double cell border spacing.

## 7. Related Terms
- [`<tr>` (Table Row)](../level_04/tr.md) — The tag that defines a horizontal row inside the table.
- [`<td>` (Table Data)](../level_04/td.md) — The tag that holds the actual data inside the row.
- [`<caption>`](../level_04/caption.md) — The semantic title container for the table.

---

## 8. Key Takeaways
- The `<table>` element is the container for tabular data.
- It relies on nested elements (`<tr>`, `<th>`, `<td>`) to build the grid.
- NEVER use tables for website layout; use them exclusively for data.
- Tables provide massive accessibility benefits for screen readers when used correctly.
