# `<button>`

> **Level 5 — Forms & User Input**
> A clickable element used to submit forms or trigger JavaScript actions.

---

## 1. Prerequisites
- [`<form>`](../level_05/form.md) — Buttons are the primary way to submit a form.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Unlike `<input>`, the `<button>` is NOT a void element; it has opening and closing tags.
- [Nesting](../level_01/nesting.md) — Since buttons can contain nested tags like text, spans, or images.

---

## 2. Term Category
- **Form Element** / **Interactive Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While the W3C did create an `<input type="button">` and an `<input type="submit">`, they had a major limitation: because `<input>` is a void element, it cannot contain anything other than plain text. You couldn't put an image, an icon, or a formatted `<strong>` tag *inside* the button.
To solve this, the W3C created the `<button>` element. It acts exactly like the older input versions, but because it has a closing `</button>` tag, you can nest other HTML elements inside of it! This allows for rich, highly stylized UI elements.
Furthermore, if a `<button>` is placed inside a `<form>`, it defaults to acting as the submit trigger for that form.

### (2) Reality Metaphor
Imagine the physical "Start" button on a microwave.
The `<button>` element is the physical plastic square you push. The `type` attribute tells the microwave what pushing the button actually does (e.g., `type="submit"` starts cooking, `type="reset"` clears the timer).

### (3) Code Examples

#### Short Snippet
```html
<!-- Inside a form, this will submit the data -->
<button type="submit">Log In</button>
```

#### Fuller Example
```html
<form action="/checkout">
  <!-- A button containing rich HTML (an image and bold text) -->
  <button type="submit">
    <img src="cart-icon.png" alt="">
    <strong>Checkout Now</strong>
  </button>
  
  <!-- A button that clears all the form data instead of submitting -->
  <button type="reset">Clear Form</button>
  
  <!-- A button that does nothing natively (used for JavaScript triggers) -->
  <button type="button" onclick="alert('Hello!')">Say Hello</button>
</form>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `type` attribute

**The mistake:** Creating a `<button>` without defining its `type` attribute.

**Why it's wrong:** The HTML specification states that if a button has no `type` attribute, it **defaults to `type="submit"`**. If you place a "Cancel" or "Help" button inside a form and forget to add `type="button"`, clicking that button will accidentally submit the form and refresh the page!

*Incorrect:*
```html
<form>
  <input type="text" name="username">
  <!-- This will accidentally submit the form! -->
  <button onclick="showHelpModal()">Need Help?</button> 
  
  <button type="submit">Submit</button>
</form>
```

*Fix:*
```html
<form>
  <input type="text" name="username">
  <!-- type="button" prevents it from submitting the form -->
  <button type="button" onclick="showHelpModal()">Need Help?</button>
  
  <button type="submit">Submit</button>
</form>
```

---



### Mistake 2: Omitting the `type` Attribute on `<button>` Elements (Unexpected Form Submit Trap)

**The mistake:** Creating a general action button `<button onclick="doStuff()">Action</button>` inside a `<form>` without a `type` attribute.

**Why it's wrong:** The default `type` for `<button>` inside HTML forms is `type="submit"`! Clicking an un-typed button unexpectedly submits the form. Always specify `type="button"` for non-submitting action buttons.

*Incorrect:*
```html
<form>
  <button onclick="toggleModal()">Cancel</button> <!-- ❌ Unexpectedly submits form! -->
</form>
```

*Fix:*
```html
<form>
  <button type="button" onclick="toggleModal()">Cancel</button> <!-- Explicit non-submitting button -->
</form>
```

### Mistake 3: Using `<div onclick="...">` Instead of Real `<button>` Tags

**The mistake:** Creating clickable buttons using `<div class="btn" onclick="save()">Save</div>`.

**Why it's wrong:** `<div>` elements are invisible to screen readers as buttons and cannot receive keyboard focus (Tab key / Enter key). Use real `<button>` tags.

*Incorrect:*
```html
<div class="button" onclick="submit()">Submit</div> <!-- ❌ Inaccessible! -->
```

*Fix:*
```html
<button type="submit" class="button">Submit</button>
```

## 6. Practice Exercises

### Exercise 1: Button vs Anchor

**Problem:** You want to create a big, blue, clickable rectangle that takes the user to `about.html`. Should you use a `<button>` or an `<a>` (Anchor)?

**Expected output:**
```text
You should use an `<a>` tag and style it with CSS to LOOK like a button! 
Buttons (`<button>`) are for actions (submitting forms, opening modals). Anchors (`<a>`) are for navigation (going to a new URL). Using a button for navigation breaks accessibility and prevents users from right-clicking to "Open in new tab".
```

> [!check]- Answer
> - Think about the semantic *purpose* of the action. Is the user traveling, or is the user commanding?

---



### Exercise 2: 3 Button Type Attribute Values

**Problem:** List 3 valid values for `<button type="...">` attribute.

**Expected output:**
```text
1. submit (submits form data)
2. reset (resets form fields to initial values)
3. button (generic button with no default behavior)
```

> [!check]- Answer
> ```html
> <button type="submit">Submit</button>
> <button type="reset">Reset</button>
> <button type="button">Custom Action</button>
> ```
>
> **Explanation:** `type` dictates button form interaction behavior.

### Exercise 3: Keyboard Button Triggering

**Problem:** Which two keyboard keys automatically trigger a focused `<button>` element?

**Expected output:**
```text
Enter key and Spacebar.
```

> [!check]- Answer
> ```text
> Enter key and Spacebar.
> ```
>
> **Explanation:** Native `<button>` tags provide built-in keyboard accessibility for Enter and Space.

## 7. Related Terms
- [`<form>`](../level_05/form.md) — The element that the button usually submits.
- [`action` & `method` Attributes](../level_05/action_method.md) — The parameters that govern form submission when `type="submit"` is pressed.
- [`<a>` (Anchor)](../level_02/a.md) — The navigation element that is often confused with a button.

---

## 8. Key Takeaways
- The `<button>` tag creates a clickable UI element.
- Unlike `<input type="submit">`, you can nest HTML (like images and spans) inside a `<button>`.
- Inside a form, a button defaults to `type="submit"`.
- Always explicitly declare the `type` attribute (`submit`, `reset`, or `button`) to prevent accidental form submissions.
