# `id` Attribute

> **Level 7 — Global Attributes**
> A unique identifier assigned to a single element on a webpage.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The fundamental concept of providing extra information inside a starting tag.

---

## 2. Term Category
- **Global Attribute**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you build a webpage with 50 different `<p>` paragraphs and 10 different `<div>` containers, you need a way to single out *one specific element*. Maybe you want to style exactly one button differently, maybe you want JavaScript to find a specific text box, or maybe you want a `<label>` to bind to a specific `<input>`.
The W3C created the `id` attribute to serve as a **strictly unique** name tag for an element. The absolute golden rule of HTML is that an `id` must be 100% unique across the entire HTML document. No two elements can share the same `id`.

### (2) Reality Metaphor
Imagine a massive parking garage.
The `class` attribute is the make and model of the car (e.g., "Honda Civic"). There might be 50 Honda Civics in the garage.
The `id` attribute is the **License Plate Number**. No two cars in the garage can possibly have the same license plate. If you tell the attendant to find license plate "XYZ-123", they will find exactly one car.

### (3) Code Examples

#### Short Snippet
```html
<!-- The id "submit-btn" can never be used on any other element on this page -->
<button id="submit-btn">Submit Order</button>
```

#### Fuller Example
```html
<!-- Using IDs to link labels to inputs -->
<form>
  <!-- The 'for' attribute searches specifically for an element with an exact 'id' -->
  <label for="usernameInput">Username:</label>
  <input type="text" id="usernameInput" name="user">
</form>

<!-- Using IDs as anchor jump links -->
<!-- If a user clicks a link to "#conclusion", the browser instantly scrolls to this specific element -->
<h2 id="conclusion">Final Thoughts</h2>
<p>In conclusion, HTML is fun.</p>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using the same ID multiple times

**The mistake:** Giving three different buttons on the same page `id="delete-btn"`.

**Why it's wrong:** The browser expects IDs to be perfectly unique. If you break this rule, CSS might still style them correctly, but **JavaScript will break**. When JavaScript runs `document.getElementById('delete-btn')`, it will immediately grab the *first* one it finds and completely ignore the others, causing bugs that are incredibly hard to track down. If you need to group multiple elements together, use a `class`!

*Incorrect:*
```html
<p id="error-message">Name is required.</p>
<!-- WRONG! You cannot reuse the same ID! -->
<p id="error-message">Email is required.</p> 
```

*Fix:*
```html
<p class="error-message">Name is required.</p>
<p class="error-message">Email is required.</p> 
```

---



### Mistake 2: Using Duplicate `id` Attribute Values in a Single HTML Document

**The mistake:** Assigning `id="header"` or `id="submit-btn"` to multiple elements on the same page.

**Why it's wrong:** `id` values MUST be unique per document! Duplicate IDs cause `document.getElementById()` to return only the first matching element, breaking JavaScript and form label bindings.

*Incorrect:*
```html
<button id="save">Save 1</button>
<button id="save">Save 2</button> <!-- ❌ Duplicate ID violates HTML specs! -->
```

*Fix:*
```html
<button id="save-1">Save 1</button>
<button id="save-2">Save 2</button>
```

### Mistake 3: Starting `id` Attribute Values with Numbers or Special Characters

**The mistake:** Writing `id="123button"` or `id="#header"`.

**Why it's wrong:** IDs starting with numbers require CSS string escaping in selectors (`#\31 23button`), causing syntax errors in CSS and querySelector calls.

*Incorrect:*
```html
<div id="123card">Card</div> <!-- ❌ Triggers CSS selector syntax escaping issues -->
```

*Fix:*
```html
<div id="card-123">Card</div> <!-- Start IDs with alphabetical characters -->
```

## 6. Practice Exercises

### Exercise 1: Finding the Error

**Problem:** Look at the following code. What is fundamentally wrong with it?
```html
<header id="main-header">
  <h1 id="main-header">Welcome</h1>
</header>
```

**Expected output:**
```text
The `id` attribute is duplicated! You cannot have an `id="main-header"` on the `<header>` and also on the `<h1>`. One of them must be changed.
```

> [!check]- Answer
> - Think about the license plate metaphor.

---



### Exercise 2: 3 Core Uses of id Attribute

**Problem:** List 3 primary technical uses of the `id` attribute in web development.

**Expected output:**
```text
1. In-page anchor linking (#id)
2. Form label binding (for="id")
3. Unique DOM selection in JavaScript (getElementById)
```

> [!check]- Answer
> ```text
> 1. In-page anchor linking (#id)
> 2. Form label binding (for="id")
> 3. Unique DOM selection in JavaScript (getElementById)
> ```
>
> **Explanation:** `id` provides unique target hooks for links, labels, and scripts.

### Exercise 3: ID vs Class Specificity

**Problem:** Which CSS selector has higher specificity: `#main` (ID) or `.main` (Class)?

**Expected output:**
```text
#main (ID selector specificity 1-0-0 outweighs Class specificity 0-1-0).
```

> [!check]- Answer
> ```text
> #main (ID selector specificity 1-0-0 outweighs Class specificity 0-1-0).
> ```
>
> **Explanation:** ID selectors have higher CSS specificity rank than class selectors.

## 7. Related Terms
- [`class` Attribute](../level_07/class.md) — The attribute used for grouping *multiple* elements together (the opposite of `id`).
- [`style` Attribute](../level_07/style.md) — The inline styling attribute.
- [`<label>`](../level_05/label.md) — Relies entirely on `id`s to function.
- [`data-*` Attributes](../level_07/data_attributes.md) — Custom data values that can reside next to IDs for scripting.

---

## 8. Key Takeaways
- The `id` attribute is a global attribute, meaning it can be placed on *any* HTML tag.
- It must be **absolutely unique** across the entire page.
- It is heavily used to bind `<label>`s to `<input>`s, to create jump-to-section anchor links, and to target elements with JavaScript.
