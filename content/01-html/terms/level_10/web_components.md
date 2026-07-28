# Web Components

> **Level 10 — Canvas, SVG & Storage**
> A suite of native browser technologies (Custom Elements, Shadow DOM, `<template>`, and `<slot>`) used to create reusable, custom HTML tags with encapsulated styling and logic without requiring third-party libraries.

---

## 1. Prerequisites
- [DOM (Document Object Model)](../level_09/dom.md) — The parent structure manipulated by component lifecycle triggers.
- [`<script>`](../level_08/script.md) — The programming block used to define component classes.
- [`data-*` Attributes](../level_07/data_attributes.md) — Used to pass configuration inputs to elements.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (Natively supported by all modern browsers. Does not require compiler tooling or external libraries like React or Vue).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Modern web pages are built out of reusable user interface widgets:
-   A user avatar card with a name and profile picture.
-   A custom interactive menu dropdown.
-   An animated toggle switch.

Historically, standard HTML did not support custom components. If you wanted to build these UI elements, you had to import massive JavaScript frameworks like React, Vue, or Angular. 

These frameworks are powerful, but they require complex build systems, bundle sizes that slow down loading times, and they introduce dependencies that can break over time.

To solve this, the W3C introduced **Web Components** to provide native component capabilities built directly into the browser. 

You can create your own custom HTML tags—such as `<user-card>`—that contain their own layout, isolated CSS styles, and interactive scripts.

---

### (2) The Three Pillars of Web Components

#### 1. Custom Elements
A JavaScript API that allows you to define custom tags and their interactive behavior:
-   **Critical Rule:** All custom HTML element names **must contain a hyphen (`-`)**.
-   This naming constraint prevents conflicts with standard HTML elements. (For example, `<user-card>` is valid; `<usercard>` is invalid and will throw an error).
-   They are registered using the `customElements.define('tag-name', ClassName)` API.

#### 2. Shadow DOM
Normally, if you write a CSS class like `.btn { color: red; }` in a stylesheet, it changes every button on the page. 

The **Shadow DOM** is an isolated, private DOM tree attached to your custom element. 
-   CSS styles defined inside the Shadow DOM are completely encapsulated.
-   Styles will **not leak out** to affect the rest of the page.
-   Styles from the main page **will not bleed in** to break your component.

#### 3. HTML Templates (`<template>` & `<slot>`)
-   **`<template>`:** An HTML tag containing markup that the browser parses but **does not render** on screen load. It sits in memory, waiting to be cloned and inserted into the page using JavaScript.
-   **`<slot>`:** A placeholder inside a template. It allows you to inject custom text or HTML from the parent page when declaring the custom tag.

---

### (3) Code Examples

#### Short Snippet
Declaring a template markup container:

```html
<!-- HTML parses this block but keeps it hidden from the user -->
<template id="my-template">
  <style> h2 { color: purple; } </style>
  <h2>Custom Heading</h2>
</template>
```

#### Fuller Example
Building a fully functional custom `<user-profile>` element with slots and encapsulated styles:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Native Web Component Demo</title>
  
  <style>
    /* Styling in the parent page does NOT affect heading inside the Shadow DOM! */
    h2 { color: blue; } 
  </style>
</head>
<body>

  <!-- Heading in parent page will be styled Blue -->
  <h2>External Portal</h2>

  <!-- Declaring our custom element and feeding data to the slot placeholders -->
  <user-profile>
    <span slot="username">Alice Smith</span>
    <span slot="role">Lead Developer</span>
  </user-profile>

  <!-- 1. The Template Blueprint -->
  <template id="profile-template">
    <style>
      .profile-card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; font-family: sans-serif; background-color: #f9f9f9; }
      h2 { color: green; } /* This heading is isolated and will be Green! */
    </style>
    <div class="profile-card">
      <h2>User Profile</h2>
      <p>Name: <slot name="username">Anonymous</slot></p>
      <p>Role: <slot name="role">User</slot></p>
    </div>
  </template>

  <!-- 2. The Custom Element JavaScript -->
  <script>
    class UserProfile extends HTMLElement {
      constructor() {
        super();
        
        // Create an isolated Shadow DOM root
        // mode: "open" allows access via JavaScript (e.g. element.shadowRoot)
        const shadow = this.attachShadow({ mode: 'open' });
        
        // Grab the template element and clone its contents
        const template = document.getElementById('profile-template');
        const clone = template.content.cloneNode(true);
        
        // Append the clone directly into the private Shadow DOM
        shadow.appendChild(clone);
      }
    }

    // 3. Register the Custom Element tag with the browser
    customElements.define('user-profile', UserProfile);
  </script>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Naming a custom element without a hyphen

**The mistake:** Declaring a custom element tag named `<mycard>`:

```javascript
// BAD: Browser will reject registration!
customElements.define('mycard', MyCard);
```

**Why it's wrong:** The browser reserved standard single-word elements (like `<article>`, `<header>`) for future standard HTML specifications. To prevent your custom elements from breaking when standard HTML introduces new tags, the parser requires all custom tags to contain a hyphen.

**Fix:** Use a hyphen prefix/suffix (e.g. `my-card`).

---



### Mistake 2: Creating Custom Element Names Without Hyphens (`<usercard>` vs `<user-card>`)

**The mistake:** Defining a custom element `customElements.define('usercard', UserCard)`.

**Why it's wrong:** HTML specification strictly mandates that custom element names MUST contain at least one hyphen `-` (e.g. `<user-card>`) to avoid naming collisions with future HTML native tags.

*Incorrect:*
```html
customElements.define('usercard', UserCard); // ❌ Missing mandatory hyphen!
```

*Fix:*
```html
customElements.define('user-card', UserCard); // Valid custom element name
```

### Mistake 3: Attempting to Query Shadow DOM Children via Global `document.querySelector()`

**The mistake:** Calling `document.querySelector('.inner-btn')` to find an element inside a Shadow Root.

**Why it's wrong:** Shadow DOM encapsulates internal DOM trees, preventing global document selectors from reaching inside. Query internal nodes via `element.shadowRoot.querySelector()`.

*Incorrect:*
```html
document.querySelector('.shadow-btn'); // ❌ Cannot select encapsulated Shadow DOM nodes!
```

*Fix:*
```html
customElementInstance.shadowRoot.querySelector('.shadow-btn');
```



### Mistake 4: Creating Custom Element Names Without Hyphens (`<usercard>` vs `<user-card>`)

**The mistake:** Defining a custom element `customElements.define('usercard', UserCard)`.

**Why it's wrong:** HTML specification strictly mandates that custom element names MUST contain at least one hyphen `-` (e.g. `<user-card>`) to avoid naming collisions with future HTML native tags.

*Incorrect:*
```html
customElements.define('usercard', UserCard); // ❌ Missing mandatory hyphen!
```

*Fix:*
```html
customElements.define('user-card', UserCard); // Valid custom element name
```

### Mistake 5: Attempting to Query Shadow DOM Children via Global `document.querySelector()`

**The mistake:** Calling `document.querySelector('.inner-btn')` to find an element inside a Shadow Root.

**Why it's wrong:** Shadow DOM encapsulates internal DOM trees, preventing global document selectors from reaching inside. Query internal nodes via `element.shadowRoot.querySelector()`.

*Incorrect:*
```html
document.querySelector('.shadow-btn'); // ❌ Cannot select encapsulated Shadow DOM nodes!
```

*Fix:*
```html
customElementInstance.shadowRoot.querySelector('.shadow-btn');
```



### Mistake 6: Creating Custom Element Names Without Hyphens (`<usercard>` vs `<user-card>`)

**The mistake:** Defining a custom element `customElements.define('usercard', UserCard)`.

**Why it's wrong:** HTML specification strictly mandates that custom element names MUST contain at least one hyphen `-` (e.g. `<user-card>`) to avoid naming collisions with future HTML native tags.

*Incorrect:*
```html
customElements.define('usercard', UserCard); // ❌ Missing mandatory hyphen!
```

*Fix:*
```html
customElements.define('user-card', UserCard); // Valid custom element name
```

### Mistake 7: Attempting to Query Shadow DOM Children via Global `document.querySelector()`

**The mistake:** Calling `document.querySelector('.inner-btn')` to find an element inside a Shadow Root.

**Why it's wrong:** Shadow DOM encapsulates internal DOM trees, preventing global document selectors from reaching inside. Query internal nodes via `element.shadowRoot.querySelector()`.

*Incorrect:*
```html
document.querySelector('.shadow-btn'); // ❌ Cannot select encapsulated Shadow DOM nodes!
```

*Fix:*
```html
customElementInstance.shadowRoot.querySelector('.shadow-btn');
```

## 6. Practice Exercises

### Exercise 1: Custom Element Scaffold

**Problem:** Build the JavaScript class scaffold to define a custom element `<info-box>`. You do not need to build the template logic, just register the tag name with the browser.

**Expected output:**
```javascript
class InfoBox extends HTMLElement {
  constructor() {
    super();
  }
}
customElements.define('info-box', InfoBox);
```

> [!check]- Answer
> - Extend `HTMLElement` in your class definition.
> - Call `super()` inside the constructor.
> - Bind the tag using the `customElements` registry.

---



### Exercise 2: 3 Core Web Components Technologies

**Problem:** List the 3 web standard technologies that comprise Web Components.

**Expected output:**
```text
1. Custom Elements
2. Shadow DOM
3. HTML Templates (<template> and <slot>)
```

> [!check]- Answer
> ```text
> 1. Custom Elements
> 2. Shadow DOM
> 3. HTML Templates (<template> and <slot>)
> ```
>
> **Explanation:** Web Components combine Custom Elements, Shadow DOM, and Templates for reusable UI widgets.

### Exercise 3: Shadow DOM Mode Syntax

**Problem:** Write JavaScript line inside custom element constructor attaching an open Shadow Root.

**Expected output:**
```text
this.attachShadow({ mode: 'open' });
```

> [!check]- Answer
> ```javascript
> this.attachShadow({ mode: 'open' });
> ```
>
> **Explanation:** `attachShadow({ mode: 'open' })` creates an encapsulated Shadow DOM tree.

## 7. Related Terms
- [DOM (Document Object Model)](../level_09/dom.md) — The parent document object model.
- [`<canvas>`](../level_10/canvas.md) — Programmatic visual boards.
- [`<svg>`](../level_10/svg.md) — XML-based scalable vector assets.

---

## 8. Key Takeaways
- Web Components allow you to create custom HTML elements natively.
- All custom tag names must contain a hyphen (`-`) to prevent naming collisions.
- The Shadow DOM provides isolated styling scopes, preventing CSS overrides.
- `<template>` tags contain markup nodes that remain parsed but hidden on load.
- `<slot>` elements act as customizable placeholders inside templates.
- Native components require no compilers or frameworks, ensuring long-term code stability.
