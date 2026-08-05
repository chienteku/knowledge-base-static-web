# `tabindex` Attribute

> **Level 7 — Global Attributes**
> A global attribute that controls whether an element can receive keyboard focus and where it stands in the sequential keyboard navigation order.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The tag parameter syntax.
- [`<button>`](../level_05/button.md) — A naturally interactive element that handles focus by default.
---

## 2. Term Category
- **Global Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Natively supported by all browsers to control keyboard tab navigation paths).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Menu Navigation Repair

**Problem:** You are building a mobile dropdown menu. When the menu is collapsed (hidden), the links inside it are off-screen but still focusable via the keyboard, which confuses blind users. What attribute should you apply to the hidden menu links to solve this?

**Expected output:**
> [!check]- Answer
> ```html
> Set `tabindex="-1"` on the links when the menu is collapsed.
> ```
> - Which tabindex value completely removes an element from the keyboard tab sequence?

---



### Exercise 2: Tabindex Value Rule Matrix

**Problem:** Match `tabindex` value to focus behavior:
1. `tabindex="0"` 
2. `tabindex="-1"` 
3. `tabindex="5"` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Adds non-native element to natural tab order
> 2. Programmatically focusable via JS (.focus()) but excluded from Tab key
> 3. Overrides natural DOM order (Anti-pattern)
> ```
> ```text
> 1. tabindex="0": Adds non-native element to natural tab order
> 2. tabindex="-1": Programmatically focusable via JS (.focus()) but excluded from Tab key
> 3. tabindex="5": Overrides natural DOM order (Anti-pattern)
> ```
>
> **Explanation:** `tabindex="0"` inserts into tab flow; `-1` enables JS focus only.

---

### Exercise 3: Focusing Modal Containers

**Problem:** Which `tabindex` value should be assigned to a modal dialog overlay `<div>` so JavaScript can call `.focus()` when opened?

**Expected output:**
> [!check]- Answer
> ```text
> tabindex="-1"
> ```
> ```html
> <div id="modal" tabindex="-1" role="dialog">...</div>
> ```
>
> **Explanation:** `tabindex="-1"` allows programmatic JS `.focus()` without inserting element into tab flow.

## 7. Related Terms
- [`<button>`](../level_05/button.md) — The standard focusable trigger.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Focusable navigation elements.
- [`id` Attribute](id.md) — Unique identifiers.
- [Accessibility (a11y) Fundamentals](../level_09/accessibility_fundamentals.md) — Related concept: Accessibility (a11y) Fundamentals.
- [ARIA Attributes](../level_09/aria_attributes.md) — Related concept: ARIA Attributes.
---

## 8. Key Takeaways
- The `tabindex` attribute manages keyboard focus sequences.
- Use `tabindex="0"` to insert non-interactive elements (like custom toggles) into the natural focus order.
- Use `tabindex="-1"` to block focus on elements that are hidden or off-screen.
- Never use positive index values (e.g. `tabindex="1"`) as they break the logical page navigation flow.
- Only make interactive widgets focusable; leave static text tags out of the tab flow.
