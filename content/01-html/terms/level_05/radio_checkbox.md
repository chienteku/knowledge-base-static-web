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
- **Form Input Tag**

---

## 3. Environment Context
- **Universal Browser Support** (Rendered natively by all browsers. Browsers display checkboxes as square toggles and radio buttons as circular bubbles).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Building a Checklist

**Problem:** Write the HTML markup for a checkbox checklist asking the user to "Agree to the Privacy Policy" (value: "privacy_ok") and "Agree to the Cookie Policy" (value: "cookies_ok"). Ensure the entire label text is clickable for both.

**Expected output:**
> [!check]- Answer
> ```html
> <p>
>   <input type="checkbox" id="privacy" name="agree_privacy" value="privacy_ok">
>   <label for="privacy">Agree to the Privacy Policy</label>
> </p>
> <p>
>   <input type="checkbox" id="cookies" name="agree_cookies" value="cookies_ok">
>   <label for="cookies">Agree to the Cookie Policy</label>
> </p>
> ```
> - Create two separate checkbox `<input>` elements.
> - Assign unique `id` values and connect them to `<label>` tags.

---



### Exercise 2: Creating Radio Button Group

**Problem:** Create radio button group for selecting plan (`'free'`, `'pro'`) with `'free'` checked by default.

**Expected output:**
> [!check]- Answer
> ```text
> <label><input type="radio" name="plan" value="free" checked> Free</label><label><input type="radio" name="plan" value="pro"> Pro</label>
> ```
> ```html
> <label>
>   <input type="radio" name="plan" value="free" checked> Free
> </label>
> <label>
>   <input type="radio" name="plan" value="pro"> Pro
> </label>
> ```
>
> **Explanation:** Shared `name="plan"` creates a radio group; `checked` sets default selection.

---

### Exercise 3: Checkbox Checked State In JavaScript

**Problem:** Which JavaScript property reads the boolean selection status of a checkbox element (`input.value` or `input.checked`)?

**Expected output:**
> [!check]- Answer
> ```text
> input.checked (returns boolean true/false).
> ```
> ```javascript
> const isAgree = checkboxElement.checked; // boolean true/false
> ```
>
> **Explanation:** Checkboxes use boolean `.checked` property, not string `.value`.

## 7. Related Terms
- [`<input>`](input.md) — The parent element.
- [`<label>`](label.md) — The text label companion.
- [`name` Attribute (in Form Fields)](name.md) — Essential grouping parameter.
- [`value` Attribute (in Form Fields)](value.md) — Choice values.
---

## 8. Key Takeaways
- `type="radio"` creates single-choice selections where only one item can be active at a time.
- `type="checkbox"` creates multi-choice toggles that act independently.
- Radio buttons must share the exact same `name` attribute to enforce mutual exclusion.
- Use the `checked` attribute to pre-select options on page load.
- Always connect labels so users can tap/click the text instead of targeting the tiny bubble.
