# `<input type="radio">` & `<input type="checkbox">`

> **Level 5 — Forms & User Input**
> Form input types used to create single-choice selection bubbles (radio) and multi-choice checklist toggles (checkbox).

---

## 1. Prerequisites
- [`<input>`](input.md) — The input element that these types configure.
- [`name` Attribute (in Form Fields)](name.md) — Crucial for grouping selectors.
- [`value` Attribute (in Form Fields)](value.md) — Defining the submitted choice code data.

---

## 2. Term Category

**Form Input Tag (Universal Browser Support .)**: `<input type="radio">` & `<input type="checkbox">` is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In addition to free-form text typing, websites need a way to collect structured selections from users:
-   **Single Choice:** Choosing a payment method (Credit Card vs. PayPal) where selecting one must deselect the other.
-   **Multiple Choice:** Choosing a set of hobbies (Reading, Gaming, Hiking) where selecting one does not affect the others.
-   **Binary Toggles:** Agreeing to terms of service (Yes/No toggle).

To handle these scenarios, the W3C created the `radio` and `checkbox` values for the `<input>` element's `type` attribute.

---

### (2) Radio Buttons vs. Checkboxes

#### 1. Radio Buttons (`type="radio"`)
-   **Behavior:** Enforces **mutual exclusion**. The user can select only **one** option from the group.
-   **Grouping Rule:** All options in the list **must share the exact same `name` attribute**.
-   **Analogy:** The physical channel selector buttons on an old radio (pushing one channel pops the previous channel out).

```html
<!-- Enforced grouping: only one pet can be selected -->
<input type="radio" name="pet" value="cat"> Cat
<input type="radio" name="pet" value="dog"> Dog
```

#### 2. Checkboxes (`type="checkbox"`)
-   **Behavior:** Independent toggles. The user can select **zero, one, or multiple** options.
-   **Grouping Rule:** Each checkbox can have a unique `name`. Alternatively, they can share a `name` to submit a list of choices to a server.
-   **Analogy:** A shopping checklist (you can check off eggs, milk, and bread simultaneously).

```html
<!-- Independent toggles -->
<input type="checkbox" name="hobby" value="reading"> Reading
<input type="checkbox" name="hobby" value="gaming"> Gaming
```

---

### (3) The `checked` Attribute
Both checkboxes and radio buttons support the boolean **`checked`** attribute. If present, the option is pre-selected when the page loads.

---

### (4) Code Examples

#### Short Snippet
Basic selector templates:

```html
<!-- Pre-selected radio bubble -->
<input type="radio" name="rating" value="5" checked> 5 Stars

<!-- Pre-checked checkbox -->
<input type="checkbox" name="subscribe" value="true" checked> Subscribe to newsletter
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Toggles Gallery</title>
</head>
<body>

  <h1>Survey Form</h1>

  <form action="/submit-survey" method="POST">
    
    <!-- 1. Radio Buttons (Single Choice) -->
    <fieldset>
      <legend>Select your preferred contact method:</legend>
      <p>
        <input type="radio" id="contactEmail" name="contact" value="email" checked>
        <label for="contactEmail">Email</label>
      </p>
      <p>
        <input type="radio" id="contactPhone" name="contact" value="phone">
        <label for="contactPhone">Phone</label>
      </p>
    </fieldset>

    <!-- 2. Checkboxes (Multiple Choice) -->
    <fieldset>
      <legend>Select all topics of interest:</legend>
      <p>
        <input type="checkbox" id="topicTech" name="topics" value="tech">
        <label for="topicTech">Technology</label>
      </p>
      <p>
        <input type="checkbox" id="topicBiz" name="topics" value="business">
        <label for="topicBiz">Business</label>
      </p>
    </fieldset>

    <button type="submit">Submit Survey</button>
  </form>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to connect `<label>` elements

**The mistake:** Placing the text label next to the input bubble without wrapping it or linking it:

```html
<!-- BAD: User must physically click the tiny 10px circle! -->
<input type="radio" name="food" value="pizza"> Pizza
```

**Why it's wrong:** Checkbox squares and radio circles are tiny (usually around 12px to 14px). Clicking them with a mouse or tapping them on a mobile screen is extremely difficult, especially for elderly users or users with motor control impairments. 

**Fix:** Link them with a `<label>`. This makes the entire text label clickable:

```html
<!-- CORRECT: Clicking the word "Pizza" will select the bubble! -->
<input type="radio" id="foodPizza" name="food" value="pizza">
<label for="foodPizza">Pizza</label>
```

---



### Mistake 2: Forgetting `value` Attributes on Checkboxes or Radio Buttons

**The mistake:** Creating `<input type="checkbox" name="subscribe">` without a `value` attribute.

**Why it's wrong:** If `value` is omitted, browsers submit the default string `'on'` (`subscribe=on`). Specify explicit values (`value="yes"`).

*Incorrect:*
```html
<input type="radio" name="size"> Small <!-- ❌ Submits 'size=on' if value is omitted! -->
```

*Fix:*
```html
<input type="radio" name="size" value="small"> Small
```

### Mistake 3: Confusing Checkbox (Multi-Select) vs Radio (Single-Select) Use Cases

**The mistake:** Using checkboxes for mutually exclusive single-choice questions (e.g. Select Gender).

**Why it's wrong:** Checkboxes allow users to select multiple options simultaneously. Radio buttons enforce strict single-choice selection from a group.

*Incorrect:*
```html
<!-- Checkboxes used for mutually exclusive choice -->
<input type="checkbox" name="pay"> Credit Card
<input type="checkbox" name="pay"> PayPal <!-- ❌ Allows checking both! -->
```

*Fix:*
```html
<input type="radio" name="pay" value="card"> Credit Card
<input type="radio" name="pay" value="paypal"> PayPal
```

## 5. Practice Exercises

### Exercise 1: Accessible Single-Choice Radio Button Group with fieldset and legend

**Scenario:** An author builds a mutually exclusive shipping method selection using radio buttons inside `<fieldset>`.

**Requirements:**
1. Group radio inputs inside `<fieldset>`.
2. Add `<legend>` title.
3. Share identical `name` attribute across radio group.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <fieldset>
>   <legend>Select Shipping Method</legend>
>
>   <label class="radio-option">
>     <input type="radio" name="shipping" value="standard" checked>
>     Standard Shipping (3-5 Days) - Free
>   </label>
>
>   <label class="radio-option">
>     <input type="radio" name="shipping" value="express">
>     Express Shipping (Overnight) - $15.00
>   </label>
> </fieldset>
> ```
>
> #### Technical Explanation
>
> 1. **Radio Buttons (`type="radio"`)**: Used for mutually exclusive single-choice selections within a group.
> 2. **Group Name Requirement**: Radio buttons MUST share the same `name` attribute to operate as a single group.
> 3. **Fieldset & Legend Grouping**: Wrapping in `<fieldset>`/`<legend>` ensures screen readers announce the group question before each option.
> 
---

### Exercise 2: Multi-Choice Checkbox Selection Group with Explicit Labels

**Scenario:** Builds an opt-in notification settings list using checkboxes.

**Requirements:**
1. Create independent `<input type="checkbox">` inputs.
2. Include explicit labels.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <fieldset>
>   <legend>Notification Preferences</legend>
>
>   <label>
>     <input type="checkbox" name="notify_email" value="1" checked>
>     Receive Email Newsletters
>   </label>
>
>   <label>
>     <input type="checkbox" name="notify_sms" value="1">
>     Receive SMS Order Alerts
>   </label>
> </fieldset>
> ```
>
> #### Technical Explanation
>
> 1. **Checkboxes (`type="checkbox"`)**: Used for independent multi-choice options; users can check zero, one, or multiple boxes.
> 2. **Independent States**: Checking one checkbox does NOT uncheck other checkboxes in the group.
> 3. **The `checked` Attribute**: Sets default selected state on page load.
> 
---

### Exercise 3: Custom Stylized Checkbox Wrappers maintaining Keyboard Focusability

**Scenario:** Creates accessible custom checkboxes without hiding input elements from keyboard navigation.

**Requirements:**
1. Ensure native `<input type="checkbox">` remains keyboard focusable.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <label class="custom-checkbox">
>   <input type="checkbox" name="agree" required class="visually-hidden">
>   <span class="checkbox-box" aria-hidden="true"></span>
>   I accept the license terms
> </label>
> ```
>
> #### Technical Explanation
>
> 1. **Preserving Focus Outlines**: Never use `display: none` on native inputs; use clip-path or visual hiding to preserve keyboard Tab focus.
> 2. **Custom Checkbox Styling**: Style pseudo-elements or adjacent `<span>` indicators based on `:checked` state.
> 3. **Native Touch/Click Handlers**: Leverage native `<label>` click handling for custom checkboxes.
## 6. Related Terms
- [`<input>`](input.md) — The parent element.
- [`<label>`](label.md) — The text label companion.
- [`name` Attribute (in Form Fields)](name.md) — Essential grouping parameter.
- [`value` Attribute (in Form Fields)](value.md) — Choice values.

---

## 7. Key Takeaways
- `type="radio"` creates single-choice selections where only one item can be active at a time.
- `type="checkbox"` creates multi-choice toggles that act independently.
- Radio buttons must share the exact same `name` attribute to enforce mutual exclusion.
- Use the `checked` attribute to pre-select options on page load.
- Always connect labels so users can tap/click the text instead of targeting the tiny bubble.
