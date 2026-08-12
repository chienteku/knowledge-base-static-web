# `placeholder` Attribute

> **Level 5 — Forms & User Input**
> An attribute used on text fields to display a temporary, light-colored hint inside the input box before a value is entered.

---

## 1. Prerequisites
- [`<input>`](input.md) — The input controls hosting the placeholder.
- [Attribute](../level_01/attribute.md) — The parameter syntax injected into tags.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `placeholder` Attribute is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When filling out forms, users often need examples to help them input data in the correct format. For instance, if you ask for an email address, showing an example like `e.g. name@example.com` or showing `YYYY-MM-DD` for a date field prevents input errors.

The W3C created the **`placeholder` attribute** to display these inline hints. 

When the input field is empty, the placeholder text is visible inside the box in a faded format. The moment the user clicks into the field and types their first character, the placeholder text instantly disappears. If they delete their text, the placeholder reappears.

---

### (2) Critical Web Accessibility Warning: Placeholders are NOT Labels!
A very common design mistake is deleting the `<label>` tag to save visual space on the screen, relying entirely on the placeholder:

```html
<!-- BAD: DO NOT DO THIS! (Inaccessible design) -->
<input type="text" placeholder="Username">
```

This is highly discouraged for several reasons:
1.  **Disappearing Act:** Sighted users with short-term memory impairments or cognitive difficulties will click on the field, get distracted, and forget what they were supposed to type because the hint vanished.
2.  **No context:** Once a user types their name, the word "Username" is gone. If they look over their form before hitting submit, they can't double-check if that box was for "Username" or "Email".
3.  **Contrast Issues:** Placeholder text is rendered in a light gray color by default, which fails contrast requirements for visually impaired users.
4.  **Screen Reader support:** Screen readers do not consistently announce placeholders to blind users, whereas they *always* announce `<label>` bindings.

**Golden Rule: Always use a `<label>` to declare the field's name. Use the `placeholder` only as an optional helper showing an example.**

---

### (3) Code Examples

#### Short Snippet
Correct usage pairing a label with an example placeholder:

```html
<label for="userEmail">Email Address</label>
<input type="email" id="userEmail" name="email" placeholder="e.g. alex@company.com">
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Placeholder Form Demo</title>
</head>
<body>

  <h1>Feedback Form</h1>

  <form action="/submit-feedback" method="POST">
    
    <!-- Text Input with Placeholder -->
    <p>
      <label for="fullname">Full Name:</label>
      <input type="text" id="fullname" name="fullname" placeholder="John Doe">
    </p>

    <!-- Textarea with Placeholder -->
    <p>
      <label for="details">Additional Notes:</label>
      <!-- Placeholders work on textareas too! -->
      <textarea id="details" name="details" placeholder="Tell us what you think..."></textarea>
    </p>

    <button type="submit">Submit</button>
  </form>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on placeholder for crucial details

**The mistake:** Putting critical instructions (like password formatting rules) inside the placeholder:

```html
<!-- BAD: User won't see these rules once they start typing! -->
<input type="password" name="pwd" placeholder="Must include 1 number and 1 capital letter">
```

**Why it's wrong:** The second the user types the first letter of their password, the formatting rules disappear. If their password fails validation, they won't remember why.

**Fix:** Place critical instructions as normal, static helper text below the input field:

```html
<label for="pwd">Password:</label>
<input type="password" id="pwd" name="pwd">
<small>Password must include at least 1 number and 1 capital letter.</small>
```

---



### Mistake 2: Using `placeholder` as a Substitute for `<label>` Elements (Accessibility Failure)

**The mistake:** Creating inputs `<input placeholder="Username">` without any `<label>` tag.

**Why it's wrong:** Placeholder text disappears when users start typing, destroying context for memory-impaired users. Screen readers often ignore placeholders, failing accessibility checks.

*Incorrect:*
```html
<input type="text" placeholder="Email Address"> <!-- ❌ Missing permanent label! -->
```

*Fix:*
```html
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="e.g. alex@example.com">
```

### Mistake 3: Putting Crucial Help Instructions Inside `placeholder` Text

**The mistake:** Placing password complexity rules inside `placeholder="Must contain 8 chars, 1 number"`.

**Why it's wrong:** Placeholder text vanishes as soon as the user types a single character, hiding instructions. Put permanent instructions in visible help text element (`<small>`).

*Incorrect:*
```html
<input type="password" placeholder="Must include 1 number and 1 symbol"> <!-- ❌ Vanishes on typing! -->
```

*Fix:*
```html
<input type="password" aria-describedby="pwd-help">
<small id="pwd-help">Must include 1 number and 1 symbol</small>
```

## 5. Practice Exercises

### Exercise 1: Providing Format Hints via placeholder Alongside Explicit label

**Scenario:** An author uses a `placeholder` attribute to show an example date format hint while retaining an explicit `<label>`.

**Requirements:**
1. Create an explicit `<label>`.
2. Add a `placeholder` showing format hint `YYYY-MM-DD`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="form-group">
>   <label for="birth-date">Date of Birth</label>
>   <input type="text" id="birth-date" name="dob" placeholder="YYYY-MM-DD" required>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `placeholder` Attribute**: Displays short temporary hint text inside an empty input before user entry.
> 2. **Format Guidance Role**: Best used for showing expected data formats (e.g. `YYYY-MM-DD` or `name@example.com`).
> 3. **Labels Are Mandatory**: Placeholders do NOT replace `<label>` elements; placeholders vanish when typing begins.
> 
---

### Exercise 2: Preventing Misuse of placeholder as a Substitute for label

**Scenario:** Corrects a form where placeholders were incorrectly used instead of `<label>` tags.

**Requirements:**
1. Add missing `<label>` tags.
2. Keep `placeholder` for format hints only.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Refactored: Added missing label -->
> <div class="form-group">
>   <label for="account-num">Account Number</label>
>   <input type="text" id="account-num" name="account" placeholder="e.g. ACC-123456" required>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Disappearing Text Problem**: Using placeholders as labels causes users to lose context once text entry starts.
> 2. **Low Contrast Accessibility Bug**: Default browser placeholder text often fails WCAG 4.5:1 color contrast rules.
> 3. **Screen Reader Failure**: Some screen readers ignore placeholder text completely.
> 
---

### Exercise 3: Accessible Color Contrast for Input Placeholder Text

**Scenario:** Styles placeholder text using CSS `::placeholder` pseudo-element to meet contrast rules.

**Requirements:**
1. Style `::placeholder` in CSS for WCAG compliance.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <label for="search-box">Search Catalog</label>
> <input type="search" id="search-box" name="search" placeholder="Type keywords here..." class="accessible-input">
> ```
>
> #### Technical Explanation
>
> 1. **CSS `::placeholder` Selector**: Allows customizing placeholder text color, font style, and opacity.
> 2. **WCAG Contrast Requirement**: Ensure custom placeholder colors meet minimum 4.5:1 contrast ratios against input background.
> 3. **Short Guidance Text**: Keep placeholder strings under 5 words.
## 6. Related Terms
- [`<input>`](input.md) — The tag hosting the placeholder.
- [`<label>`](label.md) — The mandatory companion tag for accessibility.
- [`<textarea>`](textarea.md) — Multi-line text inputs that also support placeholders.
- [`<select>` and `<option>`](select_option.md) — Related concept: `<select>` and `<option>`.

---

## 7. Key Takeaways
- The `placeholder` attribute provides temporary visual hints inside empty text boxes.
- Placeholder text disappears instantly when a user starts typing.
- Placeholders **must not** be used as a replacement for `<label>` elements.
- Use placeholders to show examples of formatting (e.g. `e.g. 123-456-7890`), not instructions.
- Sighted users with cognitive impairments or memory issues are negatively impacted by disappearing placeholder texts.
