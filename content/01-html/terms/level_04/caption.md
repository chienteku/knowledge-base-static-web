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

### Exercise 1: Setting a Caption

**Problem:** Add a caption saying "Weekly Class Schedule" to the following table structure:

```html
<table>
  <tr>
    <th>Day</th>
    <th>Time</th>
  </tr>
  <tr>
    <td>Monday</td>
    <td>9:00 AM</td>
  </tr>
</table>
```

**Expected output:**
> [!check]- Answer
> ```html
> <table>
>   <caption>Weekly Class Schedule</caption>
>   <tr>
>     <th>Day</th>
>     <th>Time</th>
>   </tr>
>   <tr>
>     <td>Monday</td>
>     <td>9:00 AM</td>
>   </tr>
> </table>
> ```
> - The `<caption>` tag must be nested right after the opening `<table>` tag.
> 
---



### Exercise 2: Accessible Table with Caption

**Problem:** Write `<table>` with `<caption>` reading `'Q1 Sales Summary'`, containing single row with `th` and `td`.

**Expected output:**
> [!check]- Answer
> ```text
> <table><caption>Q1 Sales Summary</caption><tr><th>Region</th><td>East</td></tr></table>
> ```
> ```html
> <table>
>   <caption>Q1 Sales Summary</caption>
>   <tr>
>     <th>Region</th>
>     <td>East</td>
>   </tr>
> </table>
> ```
>
> **Explanation:** `<caption>` acts as accessible header title for tabular data for screen readers.
> 
---

### Exercise 3: Caption CSS Positioning

**Problem:** Which CSS property moves `<caption>` display rendering to the bottom of the table?

**Expected output:**
> [!check]- Answer
> ```text
> caption-side: bottom;
> ```
> ```css
> caption {
>   caption-side: bottom;
> }
> ```
>
> **Explanation:** `caption-side: bottom` positions table caption below table data while preserving HTML structure.
> 
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
