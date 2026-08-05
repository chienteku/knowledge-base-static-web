# `data-*` Attributes

> **Level 7 — Global Attributes**
> A family of global attributes that allow developers to embed custom metadata directly onto standard HTML elements, which can then be easily extracted by JavaScript or styled by CSS.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The fundamental concept of parameters in tags.
---

## 2. Term Category
- **Global Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively by all browsers. JavaScript engines offer a dedicated `.dataset` interface to read/write these values).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building modern, interactive websites, developers often need to store extra information (metadata) directly on elements. For example, if you display a list of store products, you might need to track:
-   The product database ID
-   The category tag
-   The price value

Before HTML5, developers had to abuse existing attributes to store this data. They would write hacky markup like:
-   `<div class="product id-123 price-19">` (polluting the CSS stylesheet classes).
-   `<div title="123">` (abusing the hover tooltip parameter).

This was messy, prone to bugs, and violated web standards. 

To solve this, the W3C introduced **`data-*` attributes**. They allow you to define your own custom attributes, starting with `data-`, to store variables safely without affecting styling or page rendering.

---

### (2) Syntax Rules
-   **HTML Definition:** The attribute name must start with `data-` and be followed by lowercase letters and hyphens (e.g. `data-product-id="456"`).
-   **JavaScript dataset:** JavaScript provides a native `.dataset` object to access these attributes. The hyphens are converted to **camelCase**:
    -   `data-category` becomes `element.dataset.category`
    -   `data-user-name` becomes `element.dataset.userName`

---

### (3) CSS Attribute Selectors
You can also use custom data attributes directly inside your CSS rules to target elements:
```css
/* Styles any element whose status is currently set to 'active' */
[data-status="active"] {
  border-color: green;
}
```

---

### (4) Code Examples

#### Short Snippet
Custom key bindings in HTML:

```html
<div class="user-card" data-user-id="987" data-role="admin">
  John Doe
</div>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Custom Data Demo</title>
  <style>
    /* Styling elements based on their custom data status */
    .item-card { border: 1px solid gray; padding: 10px; margin: 5px; }
    
    .item-card[data-in-stock="false"] {
      opacity: 0.5;
      background-color: #f0f0f0;
    }
  </style>
</head>
<body>

  <h1>Store Catalog</h1>

  <div class="catalog">
    <div class="item-card" data-id="101" data-price="29.99" data-in-stock="true">
      <h3>Premium Coffee Beans</h3>
      <button onclick="addToCart(this)">Add to Cart</button>
    </div>

    <div class="item-card" data-id="102" data-price="14.99" data-in-stock="false">
      <h3>Green Tea Leaf Pack</h3>
      <button disabled>Out of Stock</button>
    </div>
  </div>

  <!-- Using JavaScript to read data-* variables -->
  <script src="../level_08/script.md"></script>
  <script>
    function addToCart(buttonElement) {
      // Find the parent card element
      const card = buttonElement.parentElement;
      
      // Read variables from the dataset object
      const productId = card.dataset.id;
      const productPrice = card.dataset.price;
      
      alert("Added product ID " + productId + " ($" + productPrice + ") to cart!");
    }
  </script>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing capital letters in the HTML attribute name

**The mistake:** Declaring camelCase names directly inside the HTML markup:

```html
<!-- BAD: HTML does not support uppercase attributes! -->
<div data-productId="123"></div>
```

**Why it's wrong:** HTML parser rules automatically convert all attribute names to lowercase. The browser reads this as `data-productid`. When you try to access it in JavaScript using `element.dataset.productId`, it will return `undefined` because it is mapped to `element.dataset.productid`.

**Fix: Always use lowercase letters and hyphens in HTML.**

```html
<div data-product-id="123"></div>
```

### Mistake 2: Storing sensitive user data in data attributes

**The mistake:** Putting private details (like passwords, API keys, or credit card numbers) in dataset tags.

**Why it's wrong:** Anyone can view `data-*` attributes by opening the browser's Developer Tools ("Inspect Element"). Never place sensitive, secure backend details on the HTML elements.

---



### Mistake 3: Using Uppercase Characters in `data-*` Attribute Names (`data-userId`)

**The mistake:** Writing `<div data-userId="123"></div>` in HTML.

**Why it's wrong:** HTML attributes are case-insensitive and lowercased by DOM parsers. JavaScript Dataset API maps hyphenated lowercase names to camelCase (`data-user-id` -> `dataset.userId`). Uppercase causes dataset mapping errors.

*Incorrect:*
```html
<div data-userId="123"></div> <!-- ❌ Uppercase letters in attribute name -->
```

*Fix:*
```html
<div data-user-id="123"></div> <!-- Access in JS via element.dataset.userId -->
```

### Mistake 4: Storing Sensitive User Passwords or API Keys in Custom `data-*` Attributes

**The mistake:** Writing `<button data-api-key="secret_key_123">`.

**Why it's wrong:** Custom `data-*` attributes are fully visible in DOM source code to client scripts and browser inspect tools. Never store secrets in client HTML.

*Incorrect:*
```html
<div data-auth-token="secret-token"></div> <!-- ❌ Publicly readable secret -->
```

*Fix:*
```html
// Keep secrets securely in server-side session memory
```

## 6. Practice Exercises

### Exercise 1: Dataset extraction

**Problem:** Given the following HTML tag:
`<div id="profile" data-profile-status="online" data-points="2500"></div>`

What are the corresponding JavaScript keys to read these values from the element's `dataset` object?

**Expected output:**
> [!check]- Answer
> ```text
> 1. element.dataset.profileStatus
> 2. element.dataset.points
> ```
> - The prefix `data-` is stripped.
> - Hyphenated keys (`profile-status`) must be converted to camelCase (`profileStatus`).

---



### Exercise 2: Reading Dataset in JavaScript

**Problem:** For `<button id="btn" data-product-id="99" data-category="tech">`, write JS code to access `product-id`.

**Expected output:**
> [!check]- Answer
> ```text
> const id = document.getElementById('btn').dataset.productId;
> ```
> ```javascript
> const id = document.getElementById('btn').dataset.productId;
> ```
>
> **Explanation:** `dataset` maps hyphenated `data-product-id` to camelCase `dataset.productId`.

---

### Exercise 3: Styling with CSS Attribute Selectors

**Problem:** Write CSS rule targeting elements with attribute `data-status="active"`.

**Expected output:**
> [!check]- Answer
> ```text
> [data-status="active"] { color: green; }
> ```
> ```css
> [data-status="active"] {
>   color: green;
> }
> ```
>
> **Explanation:** CSS attribute selectors target custom `data-*` state attributes.

## 7. Related Terms
- [`class` Attribute](class.md) — The global attribute for styling categories.
- [`id` Attribute](id.md) — The unique identifier.
- [`<script>`](../level_08/script.md) — Used to execute the JavaScript that extracts dataset properties.
- [`style` Attribute](style.md) — Related concept: `style` Attribute.
- [Drag & Drop API](../level_10/drag_drop.md) — Related concept: Drag & Drop API.
---

## 8. Key Takeaways
- `data-*` attributes allow you to attach custom data variables to HTML tags.
- Attribute names must start with `data-` and contain only lowercase letters and hyphens.
- Access these attributes in JavaScript using the `.dataset` property in camelCase format.
- Use CSS attribute selectors (e.g. `[data-status="active"]`) to apply styles based on data state.
- Do not store sensitive or private database information in `data-*` attributes.
