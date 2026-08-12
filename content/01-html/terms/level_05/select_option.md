# `<select>` and `<option>`

> **Level 5 — Forms & User Input**
> Tags used together to create a dropdown list.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — This is a parent/child relationship, much like lists (`<ul>` and `<li>`).
- [Nesting](../level_01/nesting.md) — Since `<option>` tags must nest directly inside a parent `<select>` block.
- [`<form>`](form.md) — Dropdowns are used to collect data for forms.

---

## 2. Term Category

**Form Element (Universal Browser Support)**: `<select>` and `<option>` is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you need a user to select their Country, providing a blank `<input type="text">` is a terrible idea. One user might type "US", another "USA", another "United States", and another might misspell it as "Untied States". This makes saving the data to a database a nightmare.
The W3C created the `<select>` element to force the user to choose from a predefined list of valid answers. The `<select>` tag is the container (the dropdown menu itself), and you place multiple `<option>` tags inside it representing the available choices.

### (2) Reality Metaphor
Imagine taking a multiple-choice test on paper.
The `<select>` is the Question itself.
The `<option>` tags are the bubbles (A, B, C, D) that you are allowed to fill in.

### (3) Code Examples

#### Short Snippet
```html
<label for="size">Choose a size:</label>
<select id="size" name="shirt_size">
  <option value="s">Small</option>
  <option value="m">Medium</option>
  <option value="l">Large</option>
</select>
```

#### Fuller Example
```html
<form>
  <label for="country">Country of Residence:</label>
  <select id="country" name="user_country">
    <!-- Using a blank option as a placeholder -->
    <option value="">-- Please choose an option --</option>
    
    <!-- Using the 'selected' attribute to set a default value -->
    <option value="canada">Canada</option>
    <option value="mexico">Mexico</option>
    <option value="usa" selected>United States</option>
  </select>
  <button type="submit">Submit</button>
</form>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `value` attribute on options

**The mistake:** Writing `<option>United States</option>` without a `value` attribute.

**Why it's wrong:** The text between the tags is what the user *sees* in the UI. The `value` attribute is what the browser actually *sends* to the server. While browsers will default to sending the visible text if the value is missing, this is fragile. Often, what you show the user (e.g., "United States of America") is different from the strict database code you need the server to receive (e.g., "US"). Always explicitly define the `value`.

*Incorrect:*
```html
<option>Super Deluxe Package</option>
```

*Fix:*
```html
<option value="tier_3">Super Deluxe Package</option>
```

---



### Mistake 2: Omitting `value` Attributes on `<option>` Tags

**The mistake:** Writing `<option>United States</option>` expecting a clean country code.

**Why it's wrong:** If `value` is omitted, the option text string is submitted (`country=United States`). Specify clean short value keys (`value="US"`).

*Incorrect:*
```html
<option>United States</option> <!-- Submits full verbose text string -->
```

*Fix:*
```html
<option value="US">United States</option> <!-- Submits clean short code US -->
```

### Mistake 3: Creating Custom Dropdowns Out of `<div>` Tags Without ARIA Roles

**The mistake:** Building custom JS dropdown menus using `<div>` elements omitting `role="listbox"`.

**Why it's wrong:** Custom `<div>` dropdowns are invisible to screen readers and break keyboard arrow key navigation. Use native `<select>` or full ARIA Listbox patterns.

*Incorrect:*
```html
<div class="custom-select" onclick="toggle()">...</div> <!-- ❌ Inaccessible dropdown -->
```

*Fix:*
```html
<select name="country">
  <option value="US">United States</option>
</select>
```

## 5. Practice Exercises

### Exercise 1: Accessible Dropdown Menu with select, option, and optgroup

**Scenario:** An author constructs a country selection dropdown menu grouped by continents using `<select>`, `<optgroup>`, and `<option>`.

**Requirements:**
1. Create `<select>` with explicit `<label>`.
2. Group choices using `<optgroup label="...">`.
3. Use `<option value="...">` for choices.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="form-group">
>   <label for="country-select">Select Residence Country</label>
>   <select id="country-select" name="country" required>
>     <option value="" disabled selected>-- Choose a Country --</option>
>     <optgroup label="North America">
>       <option value="US">United States</option>
>       <option value="CA">Canada</option>
>     </optgroup>
>     <optgroup label="Europe">
>       <option value="UK">United Kingdom</option>
>       <option value="FR">France</option>
>     </optgroup>
>   </select>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `<select>` Element**: Creates a dropdown select list control.
> 2. **The `<optgroup>` Element**: Groups related `<option>` choices under a non-selectable bold label heading.
> 3. **The `<option>` Element**: Defines selectable choices; the `value` attribute specifies data submitted to the server.
> 
---

### Exercise 2: Multi-Select Box with Selected Values

**Scenario:** Creates a multi-select box allowing users to select multiple options using `<select multiple>`.

**Requirements:**
1. Add `multiple` attribute to `<select>`.
2. Mark default choices with `selected`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <label for="skills-select">Select Technical Skills (Hold Ctrl/Cmd to select multiple)</label>
> <select id="skills-select" name="skills" multiple size="4">
>   <option value="html" selected>HTML5</option>
>   <option value="css" selected>CSS3</option>
>   <option value="js">JavaScript</option>
>   <option value="sql">SQL</option>
> </select>
> ```
>
> #### Technical Explanation
>
> 1. **The `multiple` Attribute**: Allows users to select more than one option from the select list.
> 2. **The `selected` Attribute**: Pre-selects option choices on page load.
> 3. **The `size` Attribute**: Defines the number of visible option rows displayed without opening a dropdown.
> 
---

### Exercise 3: Placeholder First Option Best Practice

**Scenario:** Configures an unselectable placeholder prompt option as the first item in a dropdown.

**Requirements:**
1. Set `<option value="" disabled selected>` as first option.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <select id="role-select" name="role" required>
>   <option value="" disabled selected>Select user role...</option>
>   <option value="author">Author</option>
>   <option value="editor">Editor</option>
> </select>
> ```
>
> #### Technical Explanation
>
> 1. **Placeholder Prompt Option**: Setting `value=""` combined with `disabled` and `selected` prevents submitting dummy prompt choices.
> 2. **Native Required Validation**: Browsers enforce required validation if `value=""` is selected.
> 3. **Clean Mobile UI**: Displays prompt clearly on mobile select pickers.
## 6. Related Terms
- [`<input>`](input.md) — The alternative way to collect data (free-form typing).
- [`placeholder` Attribute](placeholder.md) — The visual cue comparison.
- [`value` Attribute (in Form Fields)](value.md) — The option value parameters.
- [`name` Attribute (in Form Fields)](name.md) — The select key name used during form submission.
- [`<label>`](label.md) — The tag used to describe the `<select>` element.

---

## 7. Key Takeaways
- Use `<select>` to create a dropdown menu.
- Place `<option>` tags inside it for each choice.
- The user sees the text between the `<option>` tags, but the server receives the data inside the `value` attribute.
- Add the `selected` attribute to an `<option>` to make it the default choice when the page loads.
