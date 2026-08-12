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

**Form Element (Universal Browser Support)**: `<input>` is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Accessible User Contact Form with Specialized Input Types

**Scenario:** An author builds a contact form utilizing specialized HTML5 input types (`email`, `tel`, `text`).

**Requirements:**
1. Create labeled inputs for name (`type="text"`), email (`type="email"`), and phone (`type="tel"`).
2. Add validation attributes (`required`, `pattern`).

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/contact" method="post">
>   <div class="form-group">
>     <label for="contact-name">Full Name</label>
>     <input type="text" id="contact-name" name="name" required autocomplete="name">
>   </div>
>
>   <div class="form-group">
>     <label for="contact-email">Email Address</label>
>     <input type="email" id="contact-email" name="email" required autocomplete="email">
>   </div>
>
>   <div class="form-group">
>     <label for="contact-phone">Phone Number</label>
>     <input type="tel" id="contact-phone" name="phone" placeholder="123-456-7890" autocomplete="tel">
>   </div>
>
>   <button type="submit">Send Message</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **Specialized Input Types**: `type="email"` and `type="tel"` trigger mobile virtual keyboards optimized with `@` and numeric keys.
> 2. **Void Element Syntax**: `<input>` is a void element in HTML5; do not write `</input>` or `<input />`.
> 3. **Autocomplete Hints**: `autocomplete` attributes help browsers autofill user contact data.
> 
---

### Exercise 2: Date and Time Selection Inputs

**Scenario:** Creates date and time picker input fields using `<input type="date">` and `<input type="time">`.

**Requirements:**
1. Use `<input type="date">` with `min` and `max` constraints.
2. Use `<input type="time">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="booking-form">
>   <label for="booking-date">Select Appointment Date</label>
>   <input type="date" id="booking-date" name="date" min="2026-01-01" max="2026-12-31" required>
>
>   <label for="booking-time">Select Time</label>
>   <input type="time" id="booking-time" name="time" min="09:00" max="17:00" required>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Native Date Pickers**: `type="date"` renders native calendar pickers across desktop and mobile devices.
> 2. **Min/Max Constraints**: The `min` and `max` attributes enforce valid date range selections natively.
> 3. **ISO Format**: Date values are submitted in standardized `YYYY-MM-DD` ISO format.
> 
---

### Exercise 3: Secure Password and PIN Inputs

**Scenario:** Builds a secure PIN entry field using numeric input constraints.

**Requirements:**
1. Use `<input type="password">`.
2. Set `inputmode="numeric"` and `pattern="[0-9]*"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="pin-entry">
>   <label for="security-pin">Enter 4-Digit Security PIN</label>
>   <input type="password" id="security-pin" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="one-time-code">
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Masked Password Inputs**: `type="password"` masks typed characters visually on screen.
> 2. **`inputmode="numeric"`**: Forces numeric-only keypad display on mobile touch keyboards.
> 3. **Pattern Validation**: The `pattern="[0-9]{4}"` attribute validates exact 4-digit numeric input before form submission.
## 6. Related Terms
- [`<label>`](label.md) — The tag that provides an accessible text description for the input.
- [`placeholder` Attribute](placeholder.md) — The inline visual text hint.
- [`value` Attribute (in Form Fields)](value.md) — The field content value representation.
- [`name` Attribute (in Form Fields)](name.md) — The key name used during form submission.
- [`<input type="radio">` & `<input type="checkbox">`](radio_checkbox.md) — Toggle option fields.
- [`<form>`](form.md) — The container that packages the input's data.
- [`<select>` and `<option>`](select_option.md) — Related concept: `<select>` and `<option>`.
- [`<textarea>`](textarea.md) — Related concept: `<textarea>`.

---

## 7. Key Takeaways
- The `<input>` tag is a void element (no closing tag).
- Its behavior and appearance are entirely controlled by the `type` attribute (e.g., `text`, `password`, `email`, `checkbox`).
- The `name` attribute is absolutely required if you want the form to actually send the data to a server.
- Using the correct `type` (like `email` or `number`) gives you free, native browser validation and better mobile keyboard layouts.
