# `value` Attribute (in Form Fields)

> **Level 5 — Forms & User Input**
> The attribute that defines the default starting value, the current typed value, or the hidden code value sent by a form field to a web server.

---

## 1. Prerequisites
- [`<input>`](input.md) — The primary interactive elements using value.
- [Attribute](../level_01/attribute.md) — The standard syntax keys inside tags.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `value` Attribute (in Form Fields) is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defining Default and Preset Input Values

**Scenario:** An author pre-fills a profile edit form with existing user data using the `value` attribute.

**Requirements:**
1. Set `value="Jane Doe"` on text input.
2. Set `value="jane@example.com"` on email input.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/profile/update" method="post">
>   <label for="edit-name">Full Name</label>
>   <input type="text" id="edit-name" name="name" value="Jane Doe">
>
>   <label for="edit-email">Email Address</label>
>   <input type="email" id="edit-email" name="email" value="jane@example.com">
>
>   <button type="submit">Update Profile</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **The `value` Attribute**: Defines the initial value or submitted data value of an input control.
> 2. **Form Payload Submission**: The string specified in `value` is sent to the server as the parameter value (`name=Jane+Doe`).
> 3. **Dynamic Mutation**: User typing mutates the DOM property value without altering the initial HTML `value` attribute.
> 
---

### Exercise 2: Radio and Checkbox Submitted Values

**Scenario:** Specifies explicit payload strings submitted by radio buttons and checkboxes using `value`.

**Requirements:**
1. Assign distinct `value` strings to radio inputs.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <fieldset>
>   <legend>User Role</legend>
>   <label><input type="radio" name="role" value="admin"> Administrator</label>
>   <label><input type="radio" name="role" value="editor" checked> Content Editor</label>
> </fieldset>
> ```
>
> #### Technical Explanation
>
> 1. **Mandatory Radio/Checkbox `value`**: Checkboxes and radios MUST have explicit `value` attributes; otherwise browsers submit default `value="on"`.
> 2. **Server Data Clarity**: `value="editor"` provides clear domain data keys to backend APIs.
> 3. **Boolean Checked State**: Only checked radio/checkbox values are transmitted in form submissions.
> 
---

### Exercise 3: Button Value Submissions for Multi-Action Forms

**Scenario:** Uses `name` and `value` on multiple submit buttons to determine which action the user triggered.

**Requirements:**
1. Add identical `name` and distinct `value` attributes to submit buttons.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/article/101/action" method="post">
>   <button type="submit" name="action" value="draft">Save as Draft</button>
>   <button type="submit" name="action" value="publish">Publish Immediately</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Action Button Values**: Submitting via a specific button sends that button's `name=value` pair (e.g. `action=publish`).
> 2. **Server Action Routing**: Allows backend handlers to distinguish user intent without needing multiple form endpoints.
> 3. **Accessible Action Labels**: Button text remains clean while `value` passes computer-readable keys.
## 6. Related Terms
- [`<input>`](input.md) — The input elements hosting values.
- [`<select>` and `<option>`](select_option.md) — Predefined value listings.
- [`<textarea>`](textarea.md) — The tag that handles content differently (nested inner HTML).
- [`name` Attribute (in Form Fields)](name.md) — Related concept: `name` Attribute (in Form Fields).
- [`<input type="radio">` & `<input type="checkbox">`](radio_checkbox.md) — Related concept: `<input type="radio">` & `<input type="checkbox">`.
- [`<progress>` & `<meter>` Elements](../level_10/progress_meter.md) — Related concept: `<progress>` & `<meter>` Elements.

---

## 7. Key Takeaways
- The `value` attribute represents the data payload of a form control.
- In text fields, it sets the initial pre-filled text.
- In checkboxes and radio buttons, it defines the hidden code value sent if selected.
- If a checkbox is checked without a defined value, the browser submits `"on"`.
- Do not use `value` on `<textarea>`; place text between the tags instead.
