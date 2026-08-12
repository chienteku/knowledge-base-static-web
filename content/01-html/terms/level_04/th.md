# `<th>` (Table Header)

> **Level 4 — Tables**
> Defines a header cell in a table.

---

## 1. Prerequisites
- [`<tr>` (Table Row)](tr.md) — The parent element that holds the `<th>`.
- [Nesting](../level_01/nesting.md) — Since table header cells must nest directly inside a parent table row container.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: `<th>` (Table Header) is a fundamental concept in this technology stack. **Level 4 — Tables**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In most data tables, the first row (or the first column) doesn't contain actual data; instead, it contains the *labels* for that data (e.g., "Name", "Age", "Email").
The W3C created the `<th>` (Table Header) tag to semantically differentiate a label cell from a data cell. 
By default, browsers render `<th>` text as bold and centered. More importantly, screen readers rely heavily on `<th>` tags. If a blind user navigates down the "Age" column to row 5, the screen reader will automatically read the `<th>` ("Age") before reading the data ("25"), ensuring they never lose track of what the data represents.

### (2) Reality Metaphor
Imagine the top row of an Excel spreadsheet.
Usually, you type your column names there and make the text bold so it stands out from the rest of the numbers. The `<th>` tag is the HTML equivalent of making that cell bold and locking it as a header.

### (3) Code Examples

#### Short Snippet
```html
<tr>
  <!-- These are header labels, not actual data -->
  <th>First Name</th>
  <th>Last Name</th>
</tr>
```

#### Fuller Example
```html
<table>
  <!-- The Header Row -->
  <tr>
    <th>Product</th>
    <th>Price</th>
  </tr>
  <!-- The Data Row -->
  <tr>
    <!-- These match up with the headers above them -->
    <td>Coffee</td>
    <td>$3.00</td>
  </tr>
</table>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `<td>` and `<strong>` instead of `<th>`

**The mistake:** Using a standard data cell (`<td>`) and wrapping the text in a `<strong>` tag to make it look bold like a header.

**Why it's wrong:** This destroys accessibility. The screen reader will just think it's a normal piece of data that happens to be bold. It will not associate it as the label for the entire column. You must use the semantic `<th>` tag to establish the relationship between the header and the data below it.

*Incorrect:*
```html
<tr>
  <td><strong>Username</strong></td> <!-- Visual only, breaks accessibility -->
</tr>
```

*Fix:*
```html
<tr>
  <th>Username</th> <!-- Semantic and accessible -->
</tr>
```

---



### Mistake 2: Omitting the `scope` Attribute on Header Cells (`<th>`)

**The mistake:** Creating header cells `<th>Name</th>` without `scope="col"` or `scope="row"`.

**Why it's wrong:** Screen readers need `scope` attributes on `<th>` cells to associate header titles with corresponding data rows and columns.

*Incorrect:*
```html
<tr><th>Item</th><th>Price</th></tr> <!-- ❌ Missing scope attribute -->
```

*Fix:*
```html
<tr><th scope="col">Item</th><th scope="col">Price</th></tr>
```

### Mistake 3: Using `<th>` Tags for Standard Data Cells Just to Make Text Bold Centered

**The mistake:** Using `<th>` inside `<tbody>` data rows purely for bold text formatting.

**Why it's wrong:** `<th>` specifies a header title cell. Using `<th>` for data items tricks screen readers into announcing data cells as headers.

*Incorrect:*
```html
<tr><th scope="col">Total: $500</th></tr> <!-- ❌ Total data cell should be td! -->
```

*Fix:*
```html
<tr><td class="bold">Total: $500</td></tr>
```

## 5. Practice Exercises

### Exercise 1: Row Headers

**Problem:** Can a `<th>` be used for the first item in a horizontal row, instead of just at the top of a vertical column?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! A table can have row headers. For example, in a schedule, the left-most column might be `<th>` elements representing the days of the week (Monday, Tuesday), while the rest of the row contains `<td>` elements for the events on those days.
> ```
> - Think about a timetable or a calendar. Where are the labels?
> 
---



### Exercise 2: Row Header vs Column Header Syntax

**Problem:** Write a `<tr>` row containing 1 row header `<th>` for user `'Alice'` and 1 data `<td>` for age `30`.

**Expected output:**
> [!check]- Answer
> ```text
> <tr><th scope="row">Alice</th><td>30</td></tr>
> ```
> ```html
> <tr>
>   <th scope="row">Alice</th>
>   <td>30</td>
> </tr>
> ```
>
> **Explanation:** `scope="row"` designates `<th>` as header for the horizontal row.
> 
---

### Exercise 3: Default th Styling

**Problem:** What default CSS font-weight and text-alignment do browsers apply to `<th>` cells?

**Expected output:**
> [!check]- Answer
> ```text
> font-weight: bold; text-align: center;
> ```
> ```text
> font-weight: bold; text-align: center;
> ```
>
> **Explanation:** Browsers render header cells bold and centered by default.
> 
## 6. Related Terms
- [`<tr>` (Table Row)](tr.md) — The row that contains the `<th>`.
- [`<td>` (Table Data)](td.md) — The standard data cell that corresponds to the `<th>`.
- [`scope` Attribute (in `<th>`)](scope.md) — The attribute used to declare cell header associations.
- [`colspan` & `rowspan` Attributes](colspan_rowspan.md) — Attributes used to merge table cells.
- [`<caption>`](caption.md) — Related concept: `<caption>`.
- [`<table>`](table.md) — Related concept: `<table>`.

---

## 7. Key Takeaways
- `<th>` stands for Table Header.
- It is used to label columns or rows.
- Browsers render it bold and centered by default.
- It is absolutely critical for accessibility, allowing screen readers to map data to its label.
