# ARIA Attributes

> **Level 9 — DOM, Rendering & Accessibility**
> Accessible Rich Internet Applications (ARIA) attributes are a suite of global attributes (`role`, `aria-label`, `aria-hidden`, etc.) used to provide semantic descriptions, states, and behaviors to screen readers when native HTML5 tags are insufficient.

---

## 1. Prerequisites
- [Accessibility (a11y) Fundamentals](accessibility_fundamentals.md) — The parent accessibility concepts.
- [Semantic HTML](../level_06/semantic_html.md) — Knowing which native tags are available.
- [Attribute](../level_01/attribute.md) — Tag configuration parameters.

---

## 2. Term Category
- **Global Attribute / Concept**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all assistive technologies. Screen readers read ARIA roles, states, and labels to construct an accessibility tree in memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Native HTML has a rich vocabulary of semantic elements like `<button>`, `<nav>`, `<input>`, and `<header>`. Each of these has built-in accessibility rules. 

However, modern web design frequently requires building complex interactive components that have **no native HTML equivalents**:
-   **Modal Dialogs:** A popup overlay box displaying forms or alerts.
-   **Tab Panels:** Tab buttons that toggle different panels of text.
-   **Accordion Toggles:** Clickable questions that expand answers.

If you build a tab bar out of standard `<div>` and `<span>` tags, sighted users understand it visually. But to a blind user's screen reader, it just sounds like a random collection of paragraphs. The screen reader doesn't know which item is the "Tab", which is the "Panel", or whether the panel is currently open (expanded) or closed.

To bridge this gap, the W3C created **ARIA**. It allows developers to attach accessibility metadata to HTML tags.

---

### (2) The Golden Rule of ARIA
Before using ARIA, you must memorize the **First Rule of ARIA**:

> [!IMPORTANT]
> **"No ARIA is better than Bad ARIA."**
> If you can use a native HTML element instead of writing custom divs with ARIA, you **must** use the native element. Native elements have keyboard focus, tab flows, and roles built in naturally.

For example, do not write:
`<div role="button" tabindex="0" onclick="...">Click Me</div>`
When you can write:
`<button type="button" onclick="...">Click Me</button>`

---

### (3) Key ARIA Categories

ARIA attributes are grouped into three primary categories:

#### 1. Roles (`role="..."`)
Defines *what* the element is. Once a role is set, it cannot be changed dynamically.
-   `role="dialog"`: Tells the screen reader this element is a modal alert popup window.
-   `role="tablist"` / `role="tab"`: Tells the reader this is a tab menu.

#### 2. States (`aria-*`)
Defines the *current condition* of the element. These are changed dynamically using JavaScript as the user interacts with the page.
-   `aria-expanded="true" / "false"`: Declares whether a dropdown or accordion menu is currently open.
-   `aria-checked="true" / "false"`: Declares checkbox state.

#### 3. Properties
Defines relationships or labels that don't change often.
-   `aria-label="Close Menu"`: Provides an invisible text label read by screen readers. Essential for icon buttons containing no visible text (like an "X" close symbol).
-   `aria-hidden="true"`: Tells the screen reader to completely ignore this element. Useful for decorative icons or background shapes.

---

### (4) Code Examples

#### Short Snippet
Icon button with invisible description label:

```html
<!-- An icon-only button needs an aria-label so screen readers can describe it! -->
<button type="button" aria-label="Delete shopping cart item">
  <img src="trash-icon.png" alt="" aria-hidden="true">
</button>
```

#### Fuller Example
A custom modal popup block using ARIA roles and labels:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessible Modal Example</title>
</head>
<body>

  <!-- Background page -->
  <main>
    <h1>User Console</h1>
    <button onclick="openModal()">Delete Profile</button>
  </main>

  <!-- Custom Modal Overlay (hidden by default) -->
  <!-- role="dialog" tells the reader this is a window overlay -->
  <!-- aria-labelledby connects the modal title to the dialog container -->
  <div id="deleteModal" class="modal" role="dialog" aria-labelledby="modalHeading" aria-modal="true">
    
    <div class="modal-content">
      <!-- The title of the modal -->
      <h2 id="modalHeading">Confirm Deletion</h2>
      <p>Are you sure you want to delete your profile? This is permanent.</p>

      <button type="button" onclick="confirmDelete()">Confirm</button>
      
      <!-- Close button uses aria-label because "X" text is vague -->
      <button type="button" onclick="closeModal()" aria-label="Close dialog">X</button>
    </div>

  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Adding `role="button"` without keyboard listeners

**The mistake:** Turning a `<div>` into a button using ARIA role but forgetting to map keypress events:

```html
<!-- BAD: Keyboard users cannot trigger this button! -->
<div role="button" tabindex="0" onclick="submitForm()">Submit</div>
```

**Why it's wrong:** A native `<button>` element is triggered when you click it with a mouse, OR when you focus it and press the `Space` or `Enter` keys. 

If you use a `<div>` with `role="button"`, the browser only maps mouse clicks natively. Keyboard users will tab to your "button", hit `Enter`, and nothing will happen because you did not write a keypress listener!

**Fix:** Always use a native `<button>` tag whenever possible.

---



### Mistake 2: Overusing ARIA Attributes When Native HTML Elements Already Exist (First Rule of ARIA)

**The mistake:** Writing `<div role="button" tabindex="0" onclick="...">` instead of `<button>`.

**Why it's wrong:** The 1st Rule of ARIA state: 'If you can use a native HTML element with the semantics and behavior you require, DO SO instead of repurposing an element and adding ARIA.' Native elements include built-in keyboard and state handling.

*Incorrect:*
```html
<div role="button" tabindex="0">Save</div> <!-- ❌ Unneeded ARIA reimplementation -->
```

*Fix:*
```html
<button type="button">Save</button> <!-- Clean native semantics -->
```

### Mistake 3: Contradicting Native HTML Semantics with Mismatched ARIA Roles

**The mistake:** Writing `<button role="heading">Title</button>`.

**Why it's wrong:** Overriding strong native HTML element semantics with conflicting ARIA roles creates confusing accessibility trees for screen reader users.

*Incorrect:*
```html
<h1 role="button">Title</h1> <!-- ❌ Conflicting ARIA role! -->
```

*Fix:*
```html
<button type="button">Title</button>
```

## 6. Practice Exercises

### Exercise 1: Accordion Accessibility

**Problem:** You are building an accordion FAQ panel. Sighted users click the question to toggle the answer visible/hidden. Write the opening `<button>` tag for the question, including the correct ARIA attribute to tell screen readers that the answer panel is currently collapsed (closed).

**Expected output:**
> [!check]- Answer
> ```html
> <button type="button" aria-expanded="false">Frequently Asked Question</button>
> ```
> - The dynamic accordion state is managed by the `aria-expanded` attribute.
> - A collapsed state translates to `false`.

---



### Exercise 2: ARIA Expanded and Hidden States

**Problem:** Write button controlling modal visibility using `aria-expanded` and `aria-controls`.

**Expected output:**
> [!check]- Answer
> ```text
> <button aria-expanded="false" aria-controls="menu">Menu</button>
> ```
> ```html
> <button aria-expanded="false" aria-controls="menu">Menu</button>
> ```
>
> **Explanation:** `aria-expanded` announces accordion/menu toggle state to screen readers.

---

### Exercise 3: Hiding Decorative Icons with ARIA

**Problem:** Which ARIA attribute hides decorative font icons or SVGs from screen readers?

**Expected output:**
> [!check]- Answer
> ```text
> aria-hidden="true"
> ```
> ```html
> <svg aria-hidden="true"></svg>
> ```
>
> **Explanation:** `aria-hidden="true"` removes decorative elements from the accessibility tree.

## 7. Related Terms
- [Accessibility (a11y) Fundamentals](accessibility_fundamentals.md) — The parent accessibility theory.
- [Semantic HTML](../level_06/semantic_html.md) — The native layout element list.
- [`tabindex` Attribute](../level_07/tabindex.md) — Managing keyboard focus.
- [`<dialog>` Element](../level_10/dialog.md) — Related concept: `<dialog>` Element.

---

## 8. Key Takeaways
- ARIA attributes extend HTML to describe complex interactive elements to screen readers.
- Never use ARIA if a native semantic element (like `<button>` or `<details>`) can do the job.
- Use `role="..."` to define what a custom component represents.
- Use `aria-expanded` or `aria-checked` to communicate dynamic states via JavaScript.
- Use `aria-label` to label visual icon buttons, and `aria-hidden="true"` to hide decorative clutter.
- If you build custom ARIA widgets, you must manually code full keyboard focus and keypress event logic.
