# `tabindex` Attribute

> **Level 7 — Global Attributes**
> A global attribute that controls whether an element can receive keyboard focus and where it stands in the sequential keyboard navigation order.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The tag parameter syntax.
- [`<button>`](../level_05/button.md) — A naturally interactive element that handles focus by default.

---

## 2. Term Category

**Global Attribute (Universal Browser Support .)**: `tabindex` Attribute is a fundamental concept in this technology stack. **Level 7 — Global Attributes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Many users navigate websites without a mouse. They might have visual or motor control impairments, or they might simply prefer using keyboard shortcuts. These users navigate by pressing the **`Tab` key** to move focus forward through interactive elements, and **`Shift + Tab`** to move backward.

Normally, the browser automatically manages this. It allows focus on naturally interactive elements:
-   Links (`<a>` with `href`)
-   Buttons (`<button>`)
-   Form Inputs (`<input>`, `<textarea>`, `<select>`)

The browser focuses them in the exact order they are written in the HTML file.

However, sometimes developers need to customize this behavior:
-   Making a non-interactive element (like a custom `<div>` checkbox) focusable.
-   Preventing a link from being focused (e.g., when it is hidden inside a closed mobile menu).

The W3C created the global **`tabindex` attribute** to give developers precise control over this keyboard flow.

---

### (2) The Three `tabindex` Modes

The `tabindex` attribute accepts integer values, which fall into three distinct behaviors:

| Value | Keyboard Focusable? | Tab Flow Position | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **`tabindex="-1"`** | **No** (Cannot tab to it) | Removed from the tab flow | Elements that should only be focused programmatically via JavaScript (e.g., modal popup alerts or off-screen panels). |
| **`tabindex="0"`** | **Yes** | Enters the page's natural HTML sequential order | Making custom elements (like a custom slider or switch built using `<div>` tags) focusable by keyboard users. |
| **`tabindex="positive number"`** (e.g., `1`, `2`) | **Yes** | Forced to the front of the queue, ordered by the number value | **Avoid using.** This overrides the natural order and is considered a major accessibility anti-pattern. |

---

### (3) Critical Web Accessibility Warning: Avoid Positive Index Values!
Writing `tabindex="1"`, `tabindex="2"`, etc., forces the browser to focus those elements first, regardless of where they are on the screen. 

This creates a highly confusing experience for keyboard users because focus will bounce randomly across the page instead of following the natural visual layout. Furthermore, if you dynamically insert new elements later, maintaining positive numbers is a nightmare.

**Rule of Thumb: Only use `tabindex="0"` and `tabindex="-1"`. Never use positive integers.**

---

### (4) Code Examples

#### Short Snippet
Comparing focus properties:

```html
<!-- Removed from tab flow: user cannot tab here -->
<a href="/login" tabindex="-1">Login Link</a>

<!-- Enters natural tab flow: user can tab here -->
<div class="custom-checkbox" tabindex="0">Check Box</div>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tabindex Demonstrations</title>
</head>
<body>

  <h1>Interactive Layout</h1>

  <!-- 1. Natural Focus (No tabindex needed) -->
  <p>
    <label for="name">First Name:</label>
    <input type="text" id="name"> <!-- 1st focused element -->
  </p>

  <!-- 2. Custom element made focusable with tabindex="0" -->
  <p>
    Choose option:
    <span class="custom-toggle" tabindex="0" role="checkbox" aria-checked="false">
      Enable Alerts
    </span> <!-- 2nd focused element -->
  </p>

  <!-- 3. Hidden Link bypassed using tabindex="-1" -->
  <!-- Excellent when content is visually collapsed off-screen -->
  <p>
    <a href="/secret" tabindex="-1">Hidden Secret Page</a> <!-- Bypassed! -->
  </p>

  <!-- 4. Final natural element -->
  <p>
    <button type="submit">Submit Details</button> <!-- 3rd focused element -->
  </p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Making static text focusable

**The mistake:** Putting `tabindex="0"` on standard text paragraphs or headings:

```html
<!-- BAD: User has to tab through raw text boxes! -->
<h1 tabindex="0">Our Services</h1>
<p tabindex="0">We build amazing responsive web interfaces.</p>
```

**Why it's wrong:** Keyboard users expect the `Tab` key to take them *only* to elements they can interact with (links, forms, buttons). Making static paragraphs focusable forces users to press `Tab` hundreds of times just to scroll down a page, causing frustration and motor fatigue. Screen readers can read paragraphs without them being focusable.

---



### Mistake 2: Using Positive `tabindex` Values (`tabindex="1"`, `tabindex="5"`) (Accessibility Anti-Pattern)

**The mistake:** Assigning `tabindex="1"` or `tabindex="2"` to elements to control focus order.

**Why it's wrong:** Positive `tabindex` values override natural DOM document tab order, creating confusing focus jumps across the page for keyboard users. Use `tabindex="0"` or `-1`.

*Incorrect:*
```html
<button tabindex="3">First</button>
<button tabindex="1">Second</button> <!-- ❌ Disrupts natural DOM focus flow! -->
```

*Fix:*
```html
<!-- Rely on natural DOM order; use tabindex="0" only for custom interactive components -->
```

### Mistake 3: Forgetting `tabindex="0"` on Custom Interactive Non-Native Components

**The mistake:** Building a custom JS interactive widget out of `<div onclick="...">` without `tabindex="0"`.

**Why it's wrong:** `<div>` elements are not natively focusable. Keyboard users cannot Tab to custom widgets unless `tabindex="0"` is added.

*Incorrect:*
```html
<div class="custom-btn" onclick="save()">Save</div> <!-- ❌ Unreachable via Tab key! -->
```

*Fix:*
```html
<div class="custom-btn" tabindex="0" role="button" onclick="save()">Save</div>
```

## 5. Practice Exercises

### Exercise 1: Making Custom Focusable Controls Reachable with tabindex 0

**Scenario:** An author adds `tabindex="0"` to a custom interactive component so keyboard users can navigate to it via the Tab key.

**Requirements:**
1. Add `tabindex="0"` to custom component `<div>`.
2. Add matching ARIA role (`role="button"`).
3. Ensure Enter/Space key event handling.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="custom-button" tabindex="0" role="button" aria-label="Play Video Clip">
>   <span class="icon-play" aria-hidden="true"></span>
>   Play Video
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **`tabindex="0"` Meaning**: Inserts an element into the natural keyboard Tab navigation flow in document order.
> 2. **Custom Widget Reachability**: Required when creating custom non-native interactive elements (like `<div>` or `<span>` buttons).
> 3. **Keyboard Activation Rule**: Elements with `tabindex="0"` MUST handle Enter and Space keypress events in JavaScript to emulate native buttons.
> 
---

### Exercise 2: Programmatic Script Focus Targets using tabindex -1

**Scenario:** Adds `tabindex="-1"` to a modal dialog heading so JavaScript can move keyboard focus to it programmatically.

**Requirements:**
1. Add `tabindex="-1"` to modal `<div>` or `<h2>`.
2. Focus via `element.focus()` in JavaScript.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="modal-dialog" id="confirm-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
>   <!-- Programmatic focus target via tabindex="-1" -->
>   <h2 id="modal-title" tabindex="-1">Confirm Deletion</h2>
>   <p>Are you sure you want to delete this account?</p>
>   <button type="button" class="btn-danger">Delete</button>
>   <button type="button" class="btn-secondary">Cancel</button>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **`tabindex="-1"` Meaning**: Allows an element to receive focus programmatically via JavaScript (`element.focus()`), but REMOVES it from Tab key order.
> 2. **Modal Dialog Focus Management**: Moving focus to `tabindex="-1"` headings inside modals ensures screen readers immediately announce new dialog titles.
> 3. **Skip Navigation Targets**: Used on `<main id="main-content" tabindex="-1">` targets for skip links.
> 
---

### Exercise 3: Eliminating Harmful Positive tabindex Values

**Scenario:** Corrects legacy code that used positive `tabindex` values (`tabindex="1"`, `tabindex="2"`), restoring natural Tab flow.

**Requirements:**
1. Remove positive `tabindex="1"`, `tabindex="2"` attributes.
2. Reorder HTML source code elements into natural logical reading order.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Refactored: Re-ordered HTML source code naturally; removed harmful positive tabindex -->
> <form action="/login" method="post">
>   <label for="input-email">Email</label>
>   <input type="email" id="input-email" name="email">
>
>   <label for="input-pass">Password</label>
>   <input type="password" id="input-pass" name="password">
>
>   <button type="submit">Log In</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **Positive `tabindex` Anti-Pattern**: Positive values (`tabindex="1"`, `tabindex="2"`) override natural Tab order, causing erratic focus jumping.
> 2. **Source Order Primacy**: Always align visual layout with logical HTML DOM source order instead of using positive `tabindex`.
> 3. **WCAG 2.1 Focus Order**: Satisfies WCAG Success Criterion 2.4.3 (Focus Order).
## 6. Related Terms
- [`<button>`](../level_05/button.md) — The standard focusable trigger.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Focusable navigation elements.
- [`id` Attribute](id.md) — Unique identifiers.
- [Accessibility (a11y) Fundamentals](../level_09/accessibility_fundamentals.md) — Related concept: Accessibility (a11y) Fundamentals.
- [ARIA Attributes](../level_09/aria_attributes.md) — Related concept: ARIA Attributes.

---

## 7. Key Takeaways
- The `tabindex` attribute manages keyboard focus sequences.
- Use `tabindex="0"` to insert non-interactive elements (like custom toggles) into the natural focus order.
- Use `tabindex="-1"` to block focus on elements that are hidden or off-screen.
- Never use positive index values (e.g. `tabindex="1"`) as they break the logical page navigation flow.
- Only make interactive widgets focusable; leave static text tags out of the tab flow.
