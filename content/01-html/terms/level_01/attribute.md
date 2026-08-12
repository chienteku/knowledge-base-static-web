# Attribute

> **Level 1 — The Anatomy of a Webpage**
> Additional information provided within an opening tag to configure elements.

---

## 1. Prerequisites
- [Element vs. Tag](element_vs_tag.md) — Attributes are always placed inside the opening tag.

---

## 2. Term Category

**Concept / Architecture (Universal Browser Support)**: Attribute is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Tags tell the browser *what* an element is (a paragraph, an image, a link). But sometimes, knowing "what" it is isn't enough information. 
If you tell the browser "Render an image" using the `<img>` tag, the browser will ask: "Okay, but *which* image? Where is the file located on the server?"
If you tell the browser "Render a link" using the `<a>` tag, the browser will ask: "Okay, but *where* should I take the user when they click it?"

**Attributes** were designed to solve this. They are special configuration settings that you inject directly into the opening tag to give the element extra instructions, behavior, or identity.

### (2) Reality Metaphor
Imagine a Tag is a basic noun, like "Car". You tell the factory to build a `<car>`.
But the factory needs more specific instructions. An Attribute is an adjective or configuration setting. You tell the factory to build a `<car color="red" type="sedan" topspeed="120">`. The attributes configure the exact specifications of that specific car.

### (3) Code Examples

#### Short Snippet
```html
<!-- An attribute always consists of a name and a value -->
<!-- name="value" -->

<img src="puppy.jpg" alt="A cute golden retriever">
```

#### Fuller Example
```html
<!-- Attributes configure how these generic tags behave -->

<!-- 'href' tells the anchor tag where to navigate -->
<!-- 'target' tells the browser to open it in a new tab -->
<a href="https://google.com" target="_blank">Search on Google</a>

<!-- 'class' and 'id' are global attributes used to hook into CSS and JavaScript -->
<div id="main-content" class="container light-theme">
  <p>This paragraph is inside a configured container.</p>
</div>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing attributes in the closing tag

**The mistake:** Putting an attribute in the closing tag, or outside the angle brackets.

**Why it's wrong:** The browser parses an element starting from the opening tag. It needs to know all the configuration settings *before* it begins rendering the content. Attributes must ALWAYS go inside the opening tag, separated by a space from the tag name.

*Incorrect:*
```html
<a href="about.html">About Us</a href="about.html">
```

*Fix:*
```html
<a href="about.html">About Us</a>
```

### Mistake 2: Forgetting quotation marks

**The mistake:** Writing attribute values without wrapping them in double quotes.

**Why it's wrong:** While HTML5 is technically forgiving and sometimes allows unquoted attributes if there are no spaces, it is considered a terrible practice. If your value has a space (like `class="btn primary"`), forgetting quotes will cause the browser to think `primary` is a completely new attribute! Always, always use double quotes.

*Incorrect:*
```html
<div class=container main></div>
```

*Fix:*
```html
<div class="container main"></div>
```

---



### Mistake 3: Omitting Quotes Around Attribute Values Containing Spaces

**The mistake:** Writing `<img alt=User Avatar src=avatar.png>` without quotes around attribute values.

**Why it's wrong:** Unquoted attributes containing spaces cause browsers to parse subsequent words as separate boolean attributes, breaking HTML attribute parsing.

*Incorrect:*
```html
<img alt=User Avatar src=pic.jpg> <!-- ❌ Browser interprets Avatar as separate boolean attribute! -->
```

*Fix:*
```html
<img alt="User Avatar" src="pic.jpg"> <!-- Double quotes encapsulate space-delimited text -->
```

### Mistake 4: Using Duplicate Attribute Names on a Single Element

**The mistake:** Writing `<div class="box" class="container">` on an element.

**Why it's wrong:** HTML elements only evaluate the first occurrence of a duplicate attribute. Subsequent duplicate attributes are ignored completely by browser parsers.

*Incorrect:*
```html
<div class="card" class="shadow">Content</div> <!-- ❌ Second class attribute is ignored! -->
```

*Fix:*
```html
<div class="card shadow">Content</div> <!-- Combine multiple classes in single attribute -->
```

## 5. Practice Exercises

### Exercise 1: Accessible Profile Card with Attributes

**Scenario:** An accessibility author creates an HTML profile card for a team member, ensuring all global, image, and link attributes are properly defined for assistive technology.

**Requirements:**
1. Create an `<article>` container with a `class` attribute.
2. Add an `<img>` tag with `src`, `alt`, and `width` attributes.
3. Include an `<a>` link with `href`, `target="_blank"`, and `rel="noopener noreferrer"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="profile-card" id="user-101">
>   <img src="images/avatar.jpg" alt="Portrait of Jane Doe, Lead Web Developer" width="150" height="150">
>   <h2>Jane Doe</h2>
>   <p>Web Accessibility Specialist</p>
>   <a href="https://example.com/portfolio" target="_blank" rel="noopener noreferrer">View Portfolio</a>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **Attribute Syntax**: HTML attributes provide extra information about elements, written as `name="value"` inside the opening tag.
> 2. **Accessible Text Equivalents**: The `alt` attribute on `<img>` supplies a text description for screen readers and when images fail to load.
> 3. **Security Attributes on Links**: When opening links in a new tab (`target="_blank"`), `rel="noopener noreferrer"` prevents reverse tabnabbing vulnerabilities.
> 
---

### Exercise 2: Interactive Form Input Attributes

**Scenario:** A form author constructs a user registration input field, applying validation, placeholder, and identification attributes.

**Requirements:**
1. Create a `<label>` linked to an `<input>` using the `for` and `id` attributes.
2. Set the input `type` to `email`.
3. Apply `required`, `placeholder`, and `autocomplete` attributes.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="form-group">
>   <label for="user-email">Email Address</label>
>   <input type="email" id="user-email" name="email" required placeholder="name@example.com" autocomplete="email">
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Explicit Label Association**: Matching the `<label>` element's `for` attribute to the `<input>` element's `id` attribute makes the input accessible to screen readers and enlarges the clickable touch area.
> 2. **Boolean Attributes**: Attributes like `required` do not require a value; their presence on an element represents `true`.
> 3. **Browser Autocomplete Hints**: The `autocomplete` attribute helps browsers accurately auto-fill user information safely.
> 
---

### Exercise 3: Custom Data Attributes for Dynamic UI Components

**Scenario:** A frontend author attaches custom `data-*` attributes to an interactive accordion element so JavaScript can manage state without polluting class lists.

**Requirements:**
1. Create a `<button>` with a `data-target` attribute.
2. Add a `data-expanded="false"` custom attribute.
3. Include an `aria-controls` attribute for accessibility.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <button type="button" class="accordion-header" id="panel-btn-1" data-target="panel-content-1" data-expanded="false" aria-controls="panel-content-1">
>   Frequently Asked Questions
> </button>
> <div id="panel-content-1" class="accordion-content" hidden>
>   <p>Here are the answers to common questions about our service.</p>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Custom Data Attributes (`data-*`)**: Allows storing custom private information on HTML elements without invalidating HTML5 syntax.
> 2. **DOM dataset API Access**: JavaScript can inspect and mutate custom attributes via `element.dataset.target` or `element.dataset.expanded`.
> 3. **Separation of Styling and State**: Using `data-*` attributes for JavaScript state logic prevents breaking CSS styling when class names change.
## 6. Related Terms
- [Element vs. Tag](element_vs_tag.md) — Attributes live inside the opening tag of an element.
- [Void Elements (Self-closing Tags)](void_elements.md) — Self-closing elements that are configured using attributes (like `<img>`).
- [`<a>` (Anchor / Link)](../level_02/a.md) — An element that heavily relies on the `href` attribute.
- [`title` Attribute](../level_07/title.md) — Related concept: `title` Attribute.
- [URL (Uniform Resource Locator)](url.md) — Related concept: URL (Uniform Resource Locator).
- [`<audio>`](../level_03/audio.md) — Related concept: `<audio>`.
- [`src` Attribute](../level_03/src.md) — Related concept: `src` Attribute.
- [`<time>` & `datetime` Attribute](../level_06/time_datetime.md) — Related concept: `<time>` & `datetime` Attribute.

---

## 7. Key Takeaways
- Attributes provide extra configuration or instructions to an HTML element.
- They are ALWAYS placed inside the **opening tag**.
- They almost always follow the syntax: `name="value"`.
- Always wrap attribute values in double quotation marks (`""`).
```
