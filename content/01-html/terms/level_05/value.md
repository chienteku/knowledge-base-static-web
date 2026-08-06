# `value` Attribute (in Form Fields)

> **Level 5 — Forms & User Input**
> The attribute that defines the default starting value, the current typed value, or the hidden code value sent by a form field to a web server.

---

## 1. Prerequisites
- [`<input>`](input.md) — The primary interactive elements using value.
- [Attribute](../level_01/attribute.md) — The standard syntax keys inside tags.

---

## 2. Term Category
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Supported by all web browsers. Dynamically tracked by JavaScript engines when users type).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a form, you need a way to work with the user's data.
-   How do you pre-fill a text field (e.g. setting the user's current city in an "Edit Profile" form)?
-   How does the browser know what keyword to send to the server when a user clicks a checkbox?
-   How does JavaScript inspect what is currently typed inside a search bar?

The W3C created the **`value` attribute** to handle the data payloads of form elements. 

Every form element has a value. Sighted users modify values by typing or clicking, and the browser packages these values up into key-value sets during form submission.

---

### (2) Behavior Across Different Input Types
The `value` attribute behaves differently depending on the type of form control:

#### 1. Text Inputs (`type="text"`, `type="email"`, etc.)
In text fields, the `value` attribute in the HTML defines the **default text** loaded when the page starts. Once the user clicks into the box and types, the browser dynamically updates the value behind the scenes.
```html
<!-- Loads the box with "John" already filled in -->
<input type="text" name="firstname" value="John">
```

#### 2. Selection Inputs (`type="checkbox"`, `type="radio"`, `<option>`)
Users do not type text into checkboxes or radio buttons; they just toggle them. Here, the `value` is a **hidden keyword code** defined by the developer. 
If the user selects that item, the browser sends that keyword code to the server. If they don't select it, nothing is sent.
```html
<!-- If checked, the server receives: color=red -->
<input type="radio" name="color" value="red">
```

---

### (3) Code Examples

#### Short Snippet
Different elements declaring values:

```html
<!-- Pre-filled default text -->
<input type="text" name="city" value="Los Angeles">

<!-- Selection value -->
<input type="checkbox" name="newsletter" value="subscribe_confirmed">

<!-- Dropdown option value -->
<option value="ca">California</option>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Value Attribute Demos</title>
</head>
<body>

  <h1>Edit Profile</h1>

  <form action="/update-profile" method="POST">
    
    <!-- Text inputs pre-filled using value -->
    <p>
      <label for="username">Username:</label>
      <input type="text" id="username" name="user" value="johndoe123">
    </p>

    <!-- Radio group: visible text is "Yes/No", but values sent are "y/n" -->
    <fieldset>
      <legend>Receive SMS Alerts?</legend>
      <label>
        <input type="radio" name="sms" value="y" checked> Yes
      </label>
      <label>
        <input type="radio" name="sms" value="n"> No
      </label>
    </fieldset>

    <button type="submit">Save Changes</button>
  </form>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use the `value` attribute on `<textarea>`

**The mistake:** Pre-filling a multi-line text box by setting `value="..."` inside the tag:

```html
<!-- BAD: The default text will not display! -->
<textarea name="bio" value="This is my bio"></textarea>
```

**Why it's wrong:** The `<textarea>` tag is not a void element. It has an opening and closing tag, and the HTML specification states that default values must go *between* those tags.

**Fix:**
```html
<textarea name="bio">This is my bio</textarea>
```

### Mistake 2: Leaving value blank on checkboxes

**The mistake:** Writing `<input type="checkbox" name="agree">` without setting a `value` attribute.

**Why it's wrong:** If a user checks a checkbox that has no defined value and submits the form, the browser defaults to sending the string **`on`** to the server (e.g. `agree=on`). This is vague and forces your backend code to translate "on" into true/false values. Always specify a clear value like `value="true"`.

---



### Mistake 3: Confusing Initial HTML `value` Attribute with Current DOM `value` Property

**The mistake:** Expecting `input.getAttribute('value')` in JS to return current text entered by user.

**Why it's wrong:** `getAttribute('value')` returns the INITIAL HTML attribute value defined in markup. The current live typed value must be accessed via DOM property `input.value`.

*Incorrect:*
```html
const liveText = inputElement.getAttribute('value'); // ❌ Returns initial value, not typed value!
```

*Fix:*
```html
const liveText = inputElement.value; // Accesses current live DOM property
```

### Mistake 4: Forgetting `value` Attributes on Hidden Inputs (`<input type="hidden">`)

**The mistake:** Creating `<input type="hidden" name="csrf_token">` omitting `value` attribute.

**Why it's wrong:** Hidden inputs exist solely to submit security tokens or IDs to servers. Omitting `value` submits empty strings.

*Incorrect:*
```html
<input type="hidden" name="token"> <!-- ❌ Submits empty token value! -->
```

*Fix:*
```html
<input type="hidden" name="token" value="xyz123token">
```

## 6. Practice Exercises

### Exercise 1: Form value mapping

**Problem:** Look at the following form snippet:

```html
<select name="tier">
  <option value="t1">Bronze Tier</option>
  <option value="t2" selected>Silver Tier</option>
</select>
```

If the user clicks "Submit" immediately without changing the dropdown, what key-value pair will the server receive?

**Expected output:**
> [!check]- Answer
> ```text
> tier=t2
> ```
> - The key is defined by the `name` attribute of the container.
> - The value is the selected option's `value` attribute.
> 
---



### Exercise 2: Setting Default Input Values

**Problem:** Write text `<input>` named `country` with default initial value `'USA'`. 

**Expected output:**
> [!check]- Answer
> ```text
> <input type="text" name="country" value="USA">
> ```
> ```html
> <input type="text" name="country" value="USA">
> ```
>
> **Explanation:** `value` sets initial field input content.
> 
---

### Exercise 3: Reading Value Property in JavaScript

**Problem:** Write JavaScript line extracting current text from input with ID `'email-field'`. 

**Expected output:**
> [!check]- Answer
> ```text
> const val = document.getElementById('email-field').value;
> ```
> ```javascript
> const val = document.getElementById('email-field').value;
> ```
>
> **Explanation:** `.value` property retrieves live user input text.
> 
## 7. Related Terms
- [`<input>`](input.md) — The input elements hosting values.
- [`<select>` and `<option>`](select_option.md) — Predefined value listings.
- [`<textarea>`](textarea.md) — The tag that handles content differently (nested inner HTML).
- [`name` Attribute (in Form Fields)](name.md) — Related concept: `name` Attribute (in Form Fields).
- [`<input type="radio">` & `<input type="checkbox">`](radio_checkbox.md) — Related concept: `<input type="radio">` & `<input type="checkbox">`.
- [`<progress>` & `<meter>` Elements](../level_10/progress_meter.md) — Related concept: `<progress>` & `<meter>` Elements.

---

## 8. Key Takeaways
- The `value` attribute represents the data payload of a form control.
- In text fields, it sets the initial pre-filled text.
- In checkboxes and radio buttons, it defines the hidden code value sent if selected.
- If a checkbox is checked without a defined value, the browser submits `"on"`.
- Do not use `value` on `<textarea>`; place text between the tags instead.
