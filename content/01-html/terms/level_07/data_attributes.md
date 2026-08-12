# `data-*` Attributes

> **Level 7 — Global Attributes**
> A family of global attributes that allow developers to embed custom metadata directly onto standard HTML elements, which can then be easily extracted by JavaScript or styled by CSS.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The fundamental concept of parameters in tags.

---

## 2. Term Category

**Global Attribute (Universal Browser Support .)**: `data-*` Attributes is a fundamental concept in this technology stack. **Level 7 — Global Attributes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Storing Private Component State via Custom Data Attributes

**Scenario:** An author attaches custom `data-*` attributes to an interactive tab component to store panel target IDs and active states.

**Requirements:**
1. Add `data-target` and `data-state` to interactive `<button>` elements.
2. Add matching `id` on target panel `<div>`.
3. Ensure valid HTML5 `data-*` syntax.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="tab-component">
>   <div role="tablist" aria-label="Settings Tabs">
>     <button type="button" class="tab-btn" data-target="panel-general" data-state="active" role="tab" aria-selected="true" aria-controls="panel-general">
>       General Settings
>     </button>
>     <button type="button" class="tab-btn" data-target="panel-security" data-state="inactive" role="tab" aria-selected="false" aria-controls="panel-security">
>       Security Settings
>     </button>
>   </div>
>
>   <div id="panel-general" class="tab-panel" data-panel-type="general" role="tabpanel">
>     <h3>General Configuration</h3>
>     <p>General account preferences.</p>
>   </div>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Custom Data Attributes (`data-*`)**: Allows embedding custom data on HTML elements without invalidating HTML5 conformance or using non-standard attributes.
> 2. **JavaScript `dataset` API**: JavaScript accesses attributes via `element.dataset.target` and `element.dataset.state`.
> 3. **CSS Attribute Selectors**: CSS can target state attributes directly using `button[data-state="active"] { ... }`.
> 
---

### Exercise 2: Custom Data Attributes for Analytics Tracking

**Scenario:** Attaches event tracking data attributes for analytics scripts.

**Requirements:**
1. Add `data-analytics-category` and `data-analytics-action` to CTAs.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <a href="/pricing" class="btn-cta" data-analytics-category="Homepage Hero" data-analytics-action="Click Pricing CTA" data-analytics-label="Hero Button">
>   View Subscription Plans
> </a>
> ```
>
> #### Technical Explanation
>
> 1. **Analytics Event Metadata**: Stores tracking categories and click labels directly on DOM elements for global analytics listeners.
> 2. **Decoupled Event Tracking**: Analytics scripts inspect `e.target.dataset.analyticsAction` without requiring custom inline event handlers.
> 3. **Valid HTML5 Syntax**: Data attributes MUST start with `data-` followed by lowercase hyphens.
> 
---

### Exercise 3: CSS Attribute Selectors targeting Custom Data Attributes

**Scenario:** Styles interactive components based on `data-theme` attribute values.

**Requirements:**
1. Use `data-theme="dark"` on root container.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="app-wrapper" data-theme="dark" data-user-role="admin">
>   <h2>Admin Dashboard</h2>
>   <p>Dark mode interface active.</p>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Theme Switching Hooks**: CSS selectors like `[data-theme="dark"]` enable easy light/dark mode theme toggling.
> 2. **State Storage without Class Bloat**: Prevents cluttering the `class` list with non-styling state strings.
> 3. **DOM Inspection Clarity**: Custom data attributes make component state obvious in DevTools.
## 6. Related Terms
- [`class` Attribute](class.md) — The global attribute for styling categories.
- [`id` Attribute](id.md) — The unique identifier.
- [`<script>`](../level_08/script.md) — Used to execute the JavaScript that extracts dataset properties.
- [`style` Attribute](style.md) — Related concept: `style` Attribute.
- [Drag & Drop API](../level_10/drag_drop.md) — Related concept: Drag & Drop API.

---

## 7. Key Takeaways
- `data-*` attributes allow you to attach custom data variables to HTML tags.
- Attribute names must start with `data-` and contain only lowercase letters and hyphens.
- Access these attributes in JavaScript using the `.dataset` property in camelCase format.
- Use CSS attribute selectors (e.g. `[data-status="active"]`) to apply styles based on data state.
- Do not store sensitive or private database information in `data-*` attributes.
