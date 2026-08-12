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

### Exercise 1: Column and Row Header Differentiation with th and scope

**Scenario:** An author uses `<th>` elements to define both column headers and row headers with explicit `scope` attributes.

**Requirements:**
1. Use `<th> scope="col"` for column headers in `<thead>`.
2. Use `<th> scope="row"` for row headers in `<tbody>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <table>
>   <caption>Student Test Scores</caption>
>   <thead>
>     <tr>
>       <th scope="col">Student Name</th>
>       <th scope="col">Math Score</th>
>       <th scope="col">Science Score</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <th scope="row">Alice Johnson</th>
>       <td>95%</td>
>       <td>98%</td>
>     </tr>
>   </tbody>
> </table>
> ```
>
> #### Technical Explanation
>
> 1. **The `<th>` Element**: Represents a header cell in a table, rendered in bold and centered by default.
> 2. **Row Headers (`<th scope="row">`)**: Using `<th>` as the first cell in a `<tbody>` row identifies the subject of that row.
> 3. **Screen Reader Header Pairing**: Screen readers pair `<th>` headers with corresponding `<td>` data values during navigation.
> 
---

### Exercise 2: Sortable Data Table Headers with aria-sort Attributes

**Scenario:** Adds interactive sorting accessibility state attributes (`aria-sort`) to table column headers.

**Requirements:**
1. Add `aria-sort="ascending"` to active sorted `<th>`.
2. Add `aria-sort="none"` to sortable headers.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <thead>
>   <tr>
>     <th scope="col" aria-sort="ascending">
>       <button type="button">Employee Name ▲</button>
>     </th>
>     <th scope="col" aria-sort="none">
>       <button type="button">Department</button>
>     </th>
>   </tr>
> </thead>
> ```
>
> #### Technical Explanation
>
> 1. **The `aria-sort` Attribute**: Communicates column sort direction (`ascending`, `descending`, `none`, `other`) to assistive tools.
> 2. **Interactive Sort Buttons**: Wrap sortable header text in a `<button>` to make it keyboard focusable and clickable.
> 3. **Dynamic State Updates**: Update `aria-sort` values via JavaScript when user sorts columns.
> 
---

### Exercise 3: Distinguishing th Headers from td Data Values

**Scenario:** Corrects legacy tables that used `<td><b>Header</b></td>` instead of semantic `<th>` tags.

**Requirements:**
1. Replace `<td><b>` with semantic `<th> scope="col"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Correct Semantic Header: -->
> <thead>
>   <tr>
>     <th scope="col">Product ID</th>
>     <th scope="col">Stock Count</th>
>   </tr>
> </thead>
> ```
>
> #### Technical Explanation
>
> 1. **Semantic `<th>` vs Physical `<b>`**: `<td><b>Text</b></td>` looks bold visually but carries ZERO header accessibility semantics.
> 2. **Accessibility Tree Role**: `<th>` establishes header roles in the browser accessibility tree.
> 3. **Standard Compliance**: Required for W3C HTML5 table conformance.
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
