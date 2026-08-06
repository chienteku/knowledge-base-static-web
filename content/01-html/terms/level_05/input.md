# `<input>`

> **Level 5 — Forms & User Input**
> A versatile, self-closing tag used to create various interactive controls (text fields, checkboxes, etc.).

---

## 1. Prerequisites
- [`<form>`](form.md) — Inputs should generally be placed inside a form.
- [Attribute](../level_01/attribute.md) — The behavior of an `<input>` changes entirely based on its attributes.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Since `<input>` is a void element with no closing tag.

---

## 2. Term Category
- **Form Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To build an interactive website, developers need a way to collect data from the user. They need text boxes for names, hidden fields for passwords, checkboxes for terms of service, and radio buttons for multiple-choice questions. 
Instead of creating a dozen different tags (e.g., `<checkbox>`, `<textbox>`, `<password>`), the W3C created a single, incredibly versatile void element: the `<input>` tag. 
The entire functionality of the `<input>` tag is controlled by its `type` attribute. Changing the `type` completely transforms how the browser renders the element and how it validates the data. 

### (2) Reality Metaphor
Imagine a generic, blank piece of clay. 
By itself, it's just a blob. But if you stamp it with the `type="checkbox"` mold, it hardens into a square that you can check off. If you stamp it with the `type="password"` mold, it turns into a secure box that hides whatever you type into it.

### (3) Code Examples

#### Short Snippet
```html
<!-- A standard text field -->
<input type="text" name="username">

<!-- A password field (hides the characters with dots) -->
<input type="password" name="user_password">
```

#### Fuller Example
```html
<form>
  <!-- Text Input -->
  <input type="text" placeholder="First Name">
  
  <!-- Email Input: The browser will natively validate that there is an '@' symbol! -->
  <input type="email" placeholder="Email Address">
  
  <!-- Checkbox -->
  <input type="checkbox" id="terms" name="terms_accepted">
  
  <!-- Radio Buttons (Users can only select one because they share the same 'name' attribute) -->
  <input type="radio" id="cat" name="favorite_pet" value="cat">
  <input type="radio" id="dog" name="favorite_pet" value="dog">
</form>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `name` attribute

**The mistake:** Creating an input like `<input type="text">` without a `name` attribute, and expecting the server to receive the data.

**Why it's wrong:** When a `<form>` is submitted, the browser packages the data as key-value pairs (e.g., `username=John`). The value is whatever the user typed. The key is the `name` attribute! If an input doesn't have a `name`, the browser simply ignores it and leaves it out of the package entirely. The data will never reach the server.

*Incorrect:*
```html
<!-- The user's typing will be lost on submit! -->
<input type="text" placeholder="Your City">
```

*Fix:*
```html
<!-- The server will receive: city=New York -->
<input type="text" name="city" placeholder="Your City">
```

---



### Mistake 2: Omitting the `name` Attribute on Form `<input>` Elements

**The mistake:** Creating inputs `<input type="text" id="username">` without a `name` attribute.

**Why it's wrong:** When a form is submitted, ONLY inputs with a `name` attribute have their values included in the submitted form payload. Inputs without `name` attributes are completely ignored during submission.

*Incorrect:*
```html
<input type="text" id="user"> <!-- ❌ Value is omitted from form submission payload! -->
```

*Fix:*
```html
<input type="text" id="user" name="username"> <!-- name attribute specifies payload key -->
```

### Mistake 3: Using `type="text"` for Specialized Inputs (Emails, Telephones, Numbers)

**The mistake:** Using `<input type="text">` for mobile number inputs or email fields.

**Why it's wrong:** Using proper input types (`type="email"`, `type="tel"`, `type="number"`) triggers specialized mobile virtual keyboards (e.g. `@` symbol for email, numeric keypad for tel) and native validation.

*Incorrect:*
```html
<input type="text" name="phone"> <!-- ❌ Standard text keyboard on mobile -->
```

*Fix:*
```html
<input type="tel" name="phone"> <!-- Triggers mobile numeric dialpad -->
```

## 6. Practice Exercises

### Exercise 1: Form Validation

**Problem:** What happens if a user tries to submit a form containing `<input type="number">` but they typed the letter "A" into the box?

**Expected output:**
> [!check]- Answer
> ```text
> The browser will natively block the form submission and display a built-in error message telling the user to enter a valid number. (This is why choosing the correct `type` is so important!)
> ```
> - Modern HTML5 does a lot of heavy lifting for you so you don't have to write JavaScript!
> 
---



### Exercise 2: Matching Input Types to Use Cases

**Problem:** Match task to input type:
1. Masked password entry (`type="password"`)
2. Date selection calendar (`type="date"`)
3. Color picker (`type="color"`)
4. Range slider (`type="range"`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. password
> 2. date
> 3. color
> 4. range
> ```
> ```text
> 1. password
> 2. date
> 3. color
> 4. range
> ```
>
> **Explanation:** Specialized input types activate native browser UI controls and mobile keyboards.
> 
---

### Exercise 3: Input Pattern Regular Expression Validation

**Problem:** Write `pattern` attribute on `<input>` enforcing a 5-digit US ZIP code.

**Expected output:**
> [!check]- Answer
> ```text
> <input type="text" pattern="[0-9]{5}" title="5-digit ZIP code">
> ```
> ```html
> <input type="text" pattern="[0-9]{5}" title="Five digit ZIP code">
> ```
>
> **Explanation:** `pattern` accepts regular expressions for native input validation.
> 
## 7. Related Terms
- [`<label>`](label.md) — The tag that provides an accessible text description for the input.
- [`placeholder` Attribute](placeholder.md) — The inline visual text hint.
- [`value` Attribute (in Form Fields)](value.md) — The field content value representation.
- [`name` Attribute (in Form Fields)](name.md) — The key name used during form submission.
- [`<input type="radio">` & `<input type="checkbox">`](radio_checkbox.md) — Toggle option fields.
- [`<form>`](form.md) — The container that packages the input's data.
- [`<select>` and `<option>`](select_option.md) — Related concept: `<select>` and `<option>`.
- [`<textarea>`](textarea.md) — Related concept: `<textarea>`.

---

## 8. Key Takeaways
- The `<input>` tag is a void element (no closing tag).
- Its behavior and appearance are entirely controlled by the `type` attribute (e.g., `text`, `password`, `email`, `checkbox`).
- The `name` attribute is absolutely required if you want the form to actually send the data to a server.
- Using the correct `type` (like `email` or `number`) gives you free, native browser validation and better mobile keyboard layouts.
