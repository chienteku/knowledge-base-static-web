# `title` Attribute

> **Level 7 — Global Attributes**
> A global attribute used to provide advisory or helper information about an element, typically rendered as a native pop-up tooltip when hovered.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The syntax mechanism for writing values inside tags.

---

## 2. Term Category

**Global Attribute (Universal Browser Support .)**: `title` Attribute is a fundamental concept in this technology stack. **Level 7 — Global Attributes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes a button, link, or abbreviation on a webpage needs a little bit of extra context to help the user. For instance:
-   An icon button representing an envelope needs to explain: *"Send Message"*.
-   An acronym like *HTML* needs to explain: *"HyperText Markup Language"*.
-   A link needs to warn: *"Opens in a new tab"*.

The W3C created the global **`title` attribute** to handle these small helper labels. When a desktop user hovers their mouse pointer over an element with a `title` attribute, the browser holds for a fraction of a second, then displays a small, native tooltip bubble containing the text.

---

### (2) Critical Web Accessibility Warning: Do Not Use for Important Info!
While the `title` attribute is simple, it has massive accessibility limitations:
1.  **No Mobile Support:** Touchscreen devices (like mobile phones and tablets) do not have a mouse cursor and therefore have no "hover" state. Touch users will never see your tooltips.
2.  **No Keyboard Support:** Keyboard-only users who navigate pages using the `Tab` key will focus on elements, but the browser does not display the native hover tooltip on focus.
3.  **Screen Reader issues:** Screen readers do not consistently read the `title` attribute, often ignoring it entirely.

**Golden Rule: Never put essential details (like instructions or passwords) inside a `title` attribute. Only use it for secondary, optional hints.**

---

### (3) `title` Attribute vs. `<title>` Tag
Be careful not to confuse these two similar names:
-   **`<title>` Tag (metadata):** Nesting inside `<head>` to define the name of the webpage displayed on the browser's tab bar (e.g. `<title>My Profile</title>`).
-   **`title` Attribute (global parameter):** An inline attribute written inside *any* tag in the body to show a hover tooltip.

---

### (4) Code Examples

#### Short Snippet
Hover tooltips on different elements:

```html
<!-- Tooltip on a link -->
<a href="doc.pdf" title="File size: 2.4MB. Requires PDF viewer.">Download Report</a>

<!-- Tooltip on an acronym -->
<abbr title="HyperText Markup Language">HTML</abbr>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- NOTE: This is the <title> tag! -->
  <title>Global Tooltips Demo</title>
</head>
<body>

  <h1>Interactive Elements</h1>

  <!-- Using the title attribute to provide hover info on a button -->
  <p>
    <button type="button" title="This action cannot be undone.">
      Delete Account
    </button>
  </p>

  <!-- Using title on a abbreviation tag -->
  <p>
    The <abbr title="World Wide Web Consortium">W3C</abbr> defines 
    standards for modern web browser compatibility.
  </p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `title` instead of `alt` on images

**The mistake:** Using `title` to provide the descriptive text for an image:

```html
<!-- BAD: Screen readers might ignore this description! -->
<img src="chart.jpg" title="Line graph showing profits rising">
```

**Why it's wrong:** The `alt` attribute is specifically designed for accessibility and fallback rendering when images fail. The `title` attribute is only for hover helpers. Sighted desktop users will see the tooltip, but blind screen-reader users will hear nothing.

**Fix:** Use `alt` for the description, and use `title` only if you want an optional visual tooltip:

```html
<img src="chart.jpg" alt="Line graph showing profits rising" title="Q2 Financial Summary Chart">
```

---



### Mistake 2: Relying on Global `title` Attribute for Critical Accessibility Information

**The mistake:** Placing mandatory help instructions inside `<button title="Click here to submit form">`.

**Why it's wrong:** The global `title` attribute renders as a delayed native desktop tooltip. Tooltips do NOT show on mobile touchscreens and are ignored by many screen readers.

*Incorrect:*
```html
<button title="Required field help">Submit</button> <!-- ❌ Inaccessible on mobile touchscreens! -->
```

*Fix:*
```html
<button aria-describedby="help-text">Submit</button>
<small id="help-text">Click here to submit form</small>
```

### Mistake 3: Confusing Global `title` Attribute with the `<title>` Head Element

**The mistake:** Confusing `<title>Page Title</title>` in `<head>` with global `title="tooltip"` attribute.

**Why it's wrong:** The `<title>` tag sets the browser tab title in `<head>`. The `title="..."` global attribute provides hover tooltip text for any HTML body element.

*Incorrect:*
```html
// Confusing tag with global attribute
```

*Fix:*
```html
<!-- <title> in head sets browser tab name -->
<!-- title="" attribute on body tags sets hover tooltip -->
```

## 5. Practice Exercises

### Exercise 1: Providing Supplementary Advisory Tooltips on Abbreviation Elements

**Scenario:** An author uses the `title` attribute on an `<abbr>` element to provide the full expanded text of an acronym as a hover tooltip.

**Requirements:**
1. Wrap acronym in an `<abbr>` tag.
2. Add `title="World Health Organization"` attribute.
3. Verify browser native hover tooltip.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   Global health guidelines are published by the 
>   <abbr title="World Health Organization">WHO</abbr> in Geneva.
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **The `title` Attribute Purpose**: Provides advisory tooltip information displayed when users hover over an element with a mouse.
> 2. **Valid Use Case (`<abbr>`)**: Pairing `title` with `<abbr>` is one of the few standard HTML usages for explaining acronyms.
> 3. **Touchscreen & Keyboard Limitations**: Mouse hover tooltips (`title`) cannot be triggered by keyboard focus or mobile touchscreens.
> 
---

### Exercise 2: Preventing Misuse of title Attribute as a Substitute for Accessible Labels

**Scenario:** Corrects a form control where a `title` attribute was used instead of an explicit `<label>` or `aria-label`.

**Requirements:**
1. Replace `<input title="Email">` with explicit `<label for="email">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Refactored: Added explicit label instead of relying on title tooltip -->
> <div class="form-group">
>   <label for="user-email-input">Email Address</label>
>   <input type="email" id="user-email-input" name="email" required placeholder="name@example.com">
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **`title` Is NOT an Accessible Label**: Do NOT rely on `title` for form labels; screen readers often ignore `title` attributes if other labels exist.
> 2. **Disappearing Tooltips**: `title` tooltips fade away quickly and cannot be resized or restyled via CSS.
> 3. **Explicit Label Superiority**: Explicit `<label>` elements provide enlarged click targets and guaranteed screen reader announcements.
> 
---

### Exercise 3: Native Browser Tooltip Hover Behavior and Touchscreen Limitations

**Scenario:** Demonstrates supplementary advisory note tooltips on truncated table text headers.

**Requirements:**
1. Add advisory `title` tooltips to truncated text.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <th scope="col" title="Average Order Value in US Dollars">
>   Avg Order Value ($)
> </th>
> ```
>
> #### Technical Explanation
>
> 1. **Advisory Metadata**: Use `title` only for non-essential supplementary advisory hints.
> 2. **No CSS Customization**: Native browser `title` tooltips cannot be styled with CSS fonts or background colors.
> 3. **Accessible Tooltip Alternatives**: For critical information, build custom CSS/ARIA tooltips triggered by hover AND focus.
## 6. Related Terms
- [Attribute](../level_01/attribute.md) — The general tag parameter concept.
- [`alt` Attribute](../level_03/alt.md) — The required visual description attribute for images.
- [`<head>`](../level_01/head.md) — Related concept: `<head>`.
- [`<meta>`](../level_08/meta.md) — Related concept: `<meta>`.
- [SEO Fundamentals for HTML](../level_09/seo_fundamentals.md) — Related concept: SEO Fundamentals for HTML.

---

## 7. Key Takeaways
- The `title` attribute is a global attribute that displays text as a tooltip on hover.
- It is commonly used on acronyms (`<abbr>`) and icons to provide visual prompts.
- Do not use `title` for critical instructions because mobile, keyboard, and screen-reader users cannot trigger it.
- Never confuse the `title` attribute with the `<title>` tag in the `<head>`.
- Never use `title` as a replacement for the `alt` description on images.
