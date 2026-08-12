# `name` Attribute (in Form Fields)

> **Level 5 — Forms & User Input**
> The attribute that assigns a data key name to a form field, mapping its input value so it can be retrieved by a server or grouped together by the browser.

---

## 1. Prerequisites
- [`<input>`](input.md) — The input controls containing the name parameter.
- [`<form>`](form.md) — The container compiling the key-value packages.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `name` Attribute (in Form Fields) is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a registration form with three input fields: a box for "First Name", a box for "Age", and a box for "Email Address". 

When the user clicks submit, the browser collects what they typed (e.g., "Alice", "25", "alice@example.com") and sends it to the server. 

However, if the browser only sends those raw values, the server will receive:
`Alice, 25, alice@example.com`

The server has no way of knowing which value goes where! Does "25" represent their age, their shoe size, or their street number?

To solve this, the browser needs a labeling system. Sighted users have visual labels (`<label>`), but the server relies on the **`name` attribute**. 

When you set `name="user_age"` on an input, you define the **data key**. During submission, the browser packages the data as key-value pairs:
`user_age=25&user_email=alice@example.com`

Without a `name` attribute, the browser will ignore the input entirely, and its value will **never reach the server**.

---

### (2) Radio Button Grouping: Mutual Exclusion
The `name` attribute has a second, crucial behavior for **Radio Buttons**. 

Radio buttons represent a multiple-choice question where the user can only select a single answer. To tell the browser that different radio buttons belong to the same question, you must give them the **exact same `name`**:

```html
<!-- Sharing the same name enforces mutual exclusion -->
<input type="radio" name="gender" value="m"> Male
<input type="radio" name="gender" value="f"> Female
```

Because they share the name "gender", checking the "Female" bubble will automatically uncheck the "Male" bubble.

---

### (3) `name` vs. `id`
It is extremely common for beginners to confuse `name` and `id`. They serve completely different roles:
-   **`id` (Client-Side):** A strictly unique identifier for a single element on the page. Used by CSS stylesheet rules, JavaScript triggers, and `<label for="...">` tags. It never gets sent to the server.
-   **`name` (Server-Side):** The data key sent in the form submission package. It does not have to be unique (as seen in radio groups) and is read by the backend server.

---

### (4) Code Examples

#### Short Snippet
Form payload fields declaring names:

```html
<!-- Input value will be sent as: query=terms -->
<input type="text" name="query" value="terms">

<!-- Textarea value will be sent as: bio=text -->
<textarea name="bio"></textarea>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Name Attribute Demo</title>
</head>
<body>

  <form action="/subscribe" method="GET">
    
    <!-- Unique id connects the label. unique name defines the server key -->
    <p>
      <label for="subEmail">Your Email:</label>
      <input type="email" id="subEmail" name="subscriber_email">
    </p>

    <p>
      <label for="subPeriod">Frequency:</label>
      <select id="subPeriod" name="frequency_tier">
        <option value="d">Daily</option>
        <option value="w">Weekly</option>
      </select>
    </p>

    <button type="submit">Subscribe</button>
  </form>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `name` attribute on input elements

**The mistake:** Leaving out the `name` attribute and only setting an `id`:

```html
<!-- BAD: This input's value will never reach the server! -->
<form action="/search" method="GET">
  <input type="text" id="search-query">
  <button type="submit">Search</button>
</form>
```

**Why it's wrong:** Sighted users can type search terms in, but when they submit, the browser inspects the inputs, finds no `name` attribute, skips the input entirely, and loads a blank search URL: `/search?`.

---



### Mistake 2: Confusing `name` Attribute with `id` Attribute

**The mistake:** Using `name` for CSS styling or label binding (`<label for="name">`).

**Why it's wrong:** `id` must be unique per document and is used for CSS/JS/DOM/label bindings. `name` identifies form payload keys submitted to web servers.

*Incorrect:*
```html
<label for="username">Name</label> <!-- for points to ID -->
<input name="username"> <!-- ❌ Missing matching id="username"! -->
```

*Fix:*
```html
<label for="usr-id">Name</label>
<input id="usr-id" name="username">
```

### Mistake 3: Using Different `name` Attributes for Radio Buttons in the Same Option Group

**The mistake:** Giving different `name` attributes to radio buttons in the same question group.

**Why it's wrong:** Radio buttons MUST share the EXACT same `name` attribute value to form a mutually exclusive selection group. Different names allow selecting multiple radio options simultaneously.

*Incorrect:*
```html
<input type="radio" name="opt1" value="yes">
<input type="radio" name="opt2" value="no"> <!-- ❌ Allows selecting BOTH radios! -->
```

*Fix:*
```html
<input type="radio" name="consent" value="yes">
<input type="radio" name="consent" value="no"> <!-- Shared name creates radio group -->
```

## 5. Practice Exercises

### Exercise 1: Server Payload Parameter Binding with name Attributes

**Scenario:** An author assigns `name` attributes to form fields so submitted form data binds correctly on the server.

**Requirements:**
1. Add `name` attributes to all form inputs.
2. Verify submitted payload key-value pairs.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/api/v1/profile" method="post">
>   <label for="first-name">First Name</label>
>   <input type="text" id="first-name" name="first_name" value="Jane">
>
>   <label for="last-name">Last Name</label>
>   <input type="text" id="last-name" name="last_name" value="Doe">
>
>   <button type="submit">Save Profile</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **The `name` Attribute Purpose**: The `name` attribute defines the key identifier sent to the server in POST payloads or GET query strings (`first_name=Jane&last_name=Doe`).
> 2. **Un-named Inputs Omitted**: Form controls WITHOUT a `name` attribute are completely ignored during form submission.
> 3. **Server API Mapping**: Ensure `name` values match backend database or API parameter naming conventions.
> 
---

### Exercise 2: Grouping Radio Button Selections via Identical name Attributes

**Scenario:** Groups multiple radio button options under a shared `name` attribute so only one option can be selected at a time.

**Requirements:**
1. Create radio inputs sharing `name="plan_choice"`.
2. Assign unique `value` attributes to each radio button.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <fieldset>
>   <legend>Select Subscription Plan</legend>
>
>   <label>
>     <input type="radio" name="plan_choice" value="basic" checked>
>     Basic Plan ($9/mo)
>   </label>
>
>   <label>
>     <input type="radio" name="plan_choice" value="premium">
>     Premium Plan ($29/mo)
>   </label>
> </fieldset>
> ```
>
> #### Technical Explanation
>
> 1. **Radio Grouping Rule**: Radio buttons sharing the exact same `name` attribute form a single mutually-exclusive selection group.
> 2. **Single Value Submission**: Only the selected radio button's `value` is sent to the server (e.g. `plan_choice=premium`).
> 3. **Arrow Key Navigation**: Identical `name` values allow users to navigate between radio options using keyboard arrow keys.
> 
---

### Exercise 3: Multi-Select Checkbox Payload Mapping

**Scenario:** Configures multiple checkboxes to submit array values.

**Requirements:**
1. Use array notation `name="roles[]"` for multi-checkbox groups.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <fieldset>
>   <legend>User Permissions</legend>
>   <label><input type="checkbox" name="roles[]" value="editor"> Editor</label>
>   <label><input type="checkbox" name="roles[]" value="admin"> Admin</label>
> </fieldset>
> ```
>
> #### Technical Explanation
>
> 1. **Array Parameter Submission**: Using `name="roles[]"` passes multiple checked values to backend scripts as an array.
> 2. **Independent Checkbox Selection**: Checkboxes allow zero, one, or multiple items to be selected simultaneously.
> 3. **Distinct Values Required**: Each checkbox MUST specify its unique `value` attribute.
## 6. Related Terms
- [`<input>`](input.md) — The input controls mapped by name tags.
- [`<form>`](form.md) — The form collector.
- [`value` Attribute (in Form Fields)](value.md) — The value half of the key-value submission pair.
- [`id` Attribute](../level_07/id.md) — The unique client-side identifier.
- [`<input type="radio">` & `<input type="checkbox">`](radio_checkbox.md) — Related concept: `<input type="radio">` & `<input type="checkbox">`.
- [`<select>` and `<option>`](select_option.md) — Related concept: `<select>` and `<option>`.
- [`<textarea>`](textarea.md) — Related concept: `<textarea>`.

---

## 7. Key Takeaways
- The `name` attribute maps a data key to a form control's value.
- Without a `name` attribute, form data is not submitted to the server.
- The browser packages data as `name=value` pairs.
- Radio button groups must share the exact same `name` to enforce single-option toggling.
- `id` is for client-side styling/scripting; `name` is for server-side processing.
