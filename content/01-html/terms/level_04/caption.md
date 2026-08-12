# `<caption>`

> **Level 4 — Tables**
> A structural element used to provide a visible, screen-reader-accessible title or description for a table.

---

## 1. Prerequisites
- [`<table>`](table.md) — The parent element that holds the caption.
- [Nesting](../level_01/nesting.md) — Understanding element hierarchies.

---

## 2. Term Category

**Structural Tag (Universal Browser Support .)**: `<caption>` is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users look at a table full of numbers or text, they need to know what the data represents before diving into individual cells. 

A developer could easily place a standard heading (like `<h3>Product Sales</h3>`) right above the table. However, this creates an accessibility problem:
-   **No programmatic link:** Visually, the heading looks like it belongs to the table. But for a screen reader, it is just a random heading. It has no technical relationship to the grid.
-   **Page jumps:** Screen readers allow blind users to jump directly from table to table on a page. If the table's title is just a heading outside the table, the screen reader cannot announce the table's name when jumping to it.

To solve this, the W3C created the **`<caption>` tag**. It embeds the table's title directly inside the table structure, programmatically bonding them together.

---

### (2) Placement and Default Rendering
-   **Placement:** The `<caption>` must be placed **directly inside the parent `<table>` tag, and it MUST be the very first child** (before `<tr>`, `<thead>`, or `<tbody>`).
-   **Rendering:** By default, browsers render the caption text centered at the top of the table. You can use CSS (`caption-side: bottom;`) to move it to the bottom if preferred.

---

### (3) Code Examples

#### Short Snippet
A simple table with a caption:

```html
<table>
  <caption>Monthly Household Budget</caption>
  <tr>
    <th>Category</th>
    <th>Amount</th>
  </tr>
  <tr>
    <td>Rent</td>
    <td>$1200</td>
  </tr>
</table>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Company Financials</title>
</head>
<body>

  <h1>Quarterly Financial Review</h1>

  <table>
    <!-- Caption is the VERY first child inside <table> -->
    <caption>
      <strong>Table 1.1:</strong> Company Q2 Profits by Region (in USD)
    </caption>
    
    <thead>
      <tr>
        <th>Region</th>
        <th>Revenue</th>
        <th>Expenses</th>
      </tr>
    </thead>
    
    <tbody>
      <tr>
        <td>North America</td>
        <td>$500,000</td>
        <td>$300,000</td>
      </tr>
      <tr>
        <td>Europe</td>
        <td>$400,000</td>
        <td>$250,000</td>
      </tr>
    </tbody>
  </table>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing the `<caption>` outside the table

**The mistake:** Writing the caption tag before the opening `<table>` tag:

```html
<!-- BAD: Invalid HTML nesting! -->
<caption>Student Grades</caption>
<table>
  <tr><th>Name</th><th>Grade</th></tr>
</table>
```

**Why it's wrong:** The `<caption>` tag is only allowed inside a `<table>` block. Placing it outside makes it invalid HTML, and the browser will fail to pair the title with the grid.

---



### Mistake 2: Placing `<caption>` Elements Deep Inside `<tr>` or `<td>` Table Cells

**The mistake:** Writing `<table><tr><td><caption>Title</caption></td></tr></table>`.

**Why it's wrong:** The `<caption>` element MUST be the VERY FIRST child element inside a `<table>` tag, preceding all `<tr>`, `<thead>`, or `<tbody>` elements.

*Incorrect:*
```html
<table>
  <tr><th>Name</th></tr>
  <caption>Employee Table</caption> <!-- ❌ Must be first child of table! -->
</table>
```

*Fix:*
```html
<table>
  <caption>Employee Table</caption> <!-- Correct placement as 1st child -->
  <tr><th>Name</th></tr>
</table>
```

### Mistake 3: Using `<caption>` Outside of `<table>` Containers

**The mistake:** Using `<caption>` tag to title a section outside a table.

**Why it's wrong:** `<caption>` is semantically tied exclusively to HTML `<table>` elements. Using it elsewhere is invalid HTML.

*Incorrect:*
```html
<div><caption>Figure 1</caption></div> <!-- ❌ Invalid outside table! -->
```

*Fix:*
```html
<figure><figcaption>Figure 1</figcaption></figure>
```

## 5. Practice Exercises

### Exercise 1: Accessible Financial Table with Title Caption

**Scenario:** An author creates a quarterly revenue report table, adding a `<caption>` element so screen readers can state the table's purpose before reading data cells.

**Requirements:**
1. Place `<caption>` as the very first child of the `<table>` element.
2. Write a clear, descriptive title summarizing table contents.
3. Include semantic `<thead>` and `<tbody>` rows.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table class="financial-table">
>   <caption>Quarterly Revenue Report 2026 (in USD Millions)</caption>
>   <thead>
>     <tr>
>       <th scope="col">Quarter</th>
>       <th scope="col">Revenue</th>
>       <th scope="col">Expenses</th>
>       <th scope="col">Profit</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Q1 2026</th>
>       <td>$12.5M</td>
>       <td>$8.2M</td>
>       <td>$4.3M</td>
>     </tr>
>     <tr>
>       <th scope="row">Q2 2026</th>
>       <td>$14.1M</td>
>       <td>$9.0M</td>
>       <td>$5.1M</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<caption>` Element**: Provides a visible title and accessible label for a data table; must be the FIRST direct child of `<table>`.
> 2. **Screen Reader Announcement**: Screen readers read the `<caption>` first when users focus on or navigate to a table, giving instant context.
> 3. **Visual & Accessible Title**: `<caption>` eliminates the need for separate disconnected heading tags (`<h3>`) above tables.
> 
---

### Exercise 2: Caption Placement and Screen Reader Announcement Rules

**Scenario:** An auditor verifies that table captions are placed correctly as the immediate child of `<table>`.

**Requirements:**
1. Ensure `<caption>` precedes `<thead>`.
2. Verify caption text describes data context.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Employee Department Directory</caption>
>   <thead>
>     <tr>
>       <th scope="col">Name</th>
>       <th scope="col">Department</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Jane Doe</th>
>       <td>Engineering</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **First Child Rule**: The `<caption>` element MUST appear immediately after the opening `<table>` tag, before `<thead>` or `<tr>`.
> 2. **Table Title Association**: Programmatically links the caption title with the table structure in the accessibility tree.
> 3. **No Extra Wrapper Required**: Do NOT place `<caption>` inside `<thead>` or `<tr>` tags.
> 
---

### Exercise 3: Styling Table Captions with CSS without Losing Semantics

**Scenario:** Styles a table caption using CSS `caption-side: bottom` while maintaining semantic DOM order.

**Requirements:**
1. Place `<caption>` first in HTML markup.
2. Style caption positioning using CSS.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table class="styled-table">
>   <caption class="caption-bottom">Table 1.2: Annual Metric Comparisons (Source: Internal Audit 2026)</caption>
>   <thead>
>     <tr>
>       <th scope="col">Metric</th>
>       <th scope="col">Value</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Conversion Rate</th>
>       <td>3.4%</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **DOM Order Independence**: Keep `<caption>` as the first HTML child of `<table>` regardless of visual CSS placement.
> 2. **CSS `caption-side` Property**: CSS `caption-side: bottom` moves the visual caption display below the table without breaking DOM accessibility.
> 3. **Informative Metadata Subtitles**: Captions can include data source notes and table number identifiers.
## 6. Related Terms
- [`<table>`](table.md) — The parent container that holds the caption.
- [`<th>` (Table Header)](th.md) — The header cell tag inside rows.
- [`scope` Attribute (in `<th>`)](scope.md) — Related concept: `scope` Attribute (in `<th>`).

---

## 7. Key Takeaways
- The `<caption>` tag provides a visible and accessible title for a table.
- It must be nested inside `<table>` as its very first child.
- By default, it displays centered at the top of the table.
- Using `<caption>` is a key requirement for W3C web accessibility guidelines.
