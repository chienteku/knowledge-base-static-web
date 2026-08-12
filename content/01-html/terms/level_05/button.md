# `<button>`

> **Level 5 — Forms & User Input**
> A clickable element used to submit forms or trigger JavaScript actions.

---

## 1. Prerequisites
- [`<form>`](form.md) — Buttons are the primary way to submit a form.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Unlike `<input>`, the `<button>` is NOT a void element; it has opening and closing tags.
- [Nesting](../level_01/nesting.md) — Since buttons can contain nested tags like text, spans, or images.

---

## 2. Term Category

**Form Element / Interactive Element (Universal Browser Support)**: `<button>` is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Explicit Form Submit Button

**Scenario:** An author constructs a form submit button using `<button type="submit">`.

**Requirements:**
1. Use `<button type="submit">`.
2. Provide clear descriptive button text.
3. Include visual button styling class.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/register" method="post">
>   <button type="submit" class="btn-submit">Create Account</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **Explicit `type="submit"`**: Always declare `type="submit"` explicitly; missing type defaults to submit in forms, causing accidental submissions when clicked.
> 2. **Button vs Input Submit**: `<button>` can contain inner HTML (icons, sub-spans), whereas `<input type="submit">` only supports plain text.
> 3. **Keyboard Activation**: Submit buttons can be activated via Enter key anywhere inside form inputs.
> 
---

### Exercise 2: Non-Submitting Script Action Button

**Scenario:** A UI developer creates a modal dialog toggle button using `<button type="button">` to prevent form submission.

**Requirements:**
1. Use `<button type="button">`.
2. Attach click handler hook or ARIA expanded state.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <button type="button" class="btn-toggle" aria-expanded="false" aria-controls="menu-panel">
>   Toggle Navigation Menu
> </button>
> ```
>
> #### Technical Explanation
>
> 1. **The `type="button"` Attribute**: Prevents the button from submitting parent forms when clicked; essential for JavaScript interactive controls.
> 2. **Keyboard Focusability**: Native `<button>` elements are automatically focusable via Tab key and activated via Space/Enter keys.
> 3. **Accessibility Role**: Screen readers announce the `button` role automatically without needing `role="button"`.
> 
---

### Exercise 3: Accessible Icon-Only Button with Screen Reader Label

**Scenario:** Creates a close icon button with visually hidden text for screen readers.

**Requirements:**
1. Include `<span class="sr-only">` inside `<button type="button">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <button type="button" class="close-btn" aria-label="Close Dialog">
>   <svg aria-hidden="true" width="16" height="16"><use href="#icon-close"></use></svg>
>   <span class="sr-only">Close Dialog</span>
> </button>
> ```
>
> #### Technical Explanation
>
> 1. **Accessible Button Names**: Buttons MUST have accessible text labels for screen readers.
> 2. **Decorative SVG Hiding**: `aria-hidden="true"` hides vector icon markup from audio output.
> 3. **Screen Reader Only Text**: `<span class="sr-only">` supplies text for audio readers while keeping UI minimal.
## 6. Related Terms
- [`<form>`](form.md) — The element that the button usually submits.
- [`action` & `method` Attributes](action_method.md) — The parameters that govern form submission when `type="submit"` is pressed.
- [`<a>` (Anchor / Link)](../level_02/a.md) — The navigation element that is often confused with a button.
- [`tabindex` Attribute](../level_07/tabindex.md) — Related concept: `tabindex` Attribute.

---

## 7. Key Takeaways
- The `<button>` tag creates a clickable UI element.
- Unlike `<input type="submit">`, you can nest HTML (like images and spans) inside a `<button>`.
- Inside a form, a button defaults to `type="submit"`.
- Always explicitly declare the `type` attribute (`submit`, `reset`, or `button`) to prevent accidental form submissions.
