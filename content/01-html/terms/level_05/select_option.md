# `<select>` and `<option>`

> **Level 5 — Forms & User Input**
> Tags used together to create a dropdown list.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — This is a parent/child relationship, much like lists (`<ul>` and `<li>`).
- [Nesting](../level_01/nesting.md) — Since `<option>` tags must nest directly inside a parent `<select>` block.
- [`<form>`](../level_05/form.md) — Dropdowns are used to collect data for forms.

---

## 2. Term Category
- **Form Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Optgroup

**Problem:** Look at the following code. What does the `<optgroup>` tag do?
```html
<select name="food">
  <optgroup label="Fruits">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
  </optgroup>
  <optgroup label="Vegetables">
    <option value="carrot">Carrot</option>
  </optgroup>
</select>
```

**Expected output:**
```text
It creates unclickable, bolded categorical headers inside the dropdown menu, allowing you to organize a massive list of options into smaller, readable sections!
```

> [!check]- Answer
> - Think about navigating a massive dropdown with 100 items. How do you group them visually?

---



### Exercise 2: Structuring Select Dropdown with Disabled Placeholder

**Problem:** Create `<select>` named `category` with disabled selected placeholder option `'Select Category'`. 

**Expected output:**
```text
<select name="category"><option value="" disabled selected>Select Category</option><option value="tech">Tech</option></select>
```

> [!check]- Answer
> ```html
> <select name="category">
>   <option value="" disabled selected>Select Category</option>
>   <option value="tech">Tech</option>
>   <option value="books">Books</option>
> </select>
> ```
>
> **Explanation:** `disabled selected` option acts as a prompt without allowing re-selection.

### Exercise 3: Grouping Options with optgroup

**Problem:** Which HTML tag groups related `<option>` items under labeled sub-heading headers inside a `<select>`?

**Expected output:**
```text
<optgroup label="Group Name">
```

> [!check]- Answer
> ```html
> <select name="car">
>   <optgroup label="German Cars">
>     <option value="bmw">BMW</option>
>   </optgroup>
> </select>
> ```
>
> **Explanation:** `<optgroup>` organizes select dropdown choices into categorized sections.

## 7. Related Terms
- [`<input>`](../level_05/input.md) — The alternative way to collect data (free-form typing).
- [`placeholder` Attribute](../level_05/placeholder.md) — The visual cue comparison.
- [`value` Attribute (in Form Fields)](../level_05/value.md) — The option value parameters.
- [`name` Attribute (in Form Fields)](../level_05/name.md) — The select key name used during form submission.
- [`<label>`](../level_05/label.md) — The tag used to describe the `<select>` element.

---

## 8. Key Takeaways
- Use `<select>` to create a dropdown menu.
- Place `<option>` tags inside it for each choice.
- The user sees the text between the `<option>` tags, but the server receives the data inside the `value` attribute.
- Add the `selected` attribute to an `<option>` to make it the default choice when the page loads.
