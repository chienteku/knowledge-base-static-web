# `href` Attribute

> **Level 2 — Text & Content**
> Specifies the URL of the page the link goes to.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — It is an attribute placed inside an opening tag.
- [URL (Uniform Resource Locator)](../level_01/url.md) — Since `href` values represent uniform resource locator web addresses.
- [`<a>` (Anchor / Link)](a.md) — The tag that almost exclusively relies on this attribute.

---

## 2. Term Category

**Attribute (Universal Browser Support)**: `href` Attribute is a fundamental concept in this technology stack. **Level 2 — Text & Content**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If the `<a>` (Anchor) tag creates the physical, clickable "doorway" on a webpage, the browser still needs to know exactly where that doorway leads. The W3C designed the `href` (Hypertext Reference) attribute to act as the coordinate system for the web. 
It defines the exact address (URL) that the browser should navigate to when the user clicks the element.

### (2) Reality Metaphor
Imagine setting up a teleportation pad. 
The `<a>` tag builds the physical pad on the ground.
The `href` attribute is the dial where you type in the exact latitude and longitude of the destination you want to teleport to. Without dialing in the `href`, standing on the pad does nothing.

### (3) Code Examples

#### Short Snippet
```html
<!-- An absolute URL pointing to a different website -->
<a href="https://en.wikipedia.org/wiki/HTML">Read about HTML</a>
```

#### Fuller Example
```html
<nav>
  <!-- Absolute Link: Needs the full https://... to leave your site -->
  <a href="https://twitter.com/mycompany">Twitter</a>
  
  <!-- Relative Link: Points to another file in the SAME folder -->
  <a href="about.html">About Us</a>
  
  <!-- Anchor Link: Jumps to a specific section ON THE SAME PAGE -->
  <!-- This will jump to <div id="contact"> -->
  <a href="#contact">Jump to Contact</a>
  
  <!-- Email Link: Opens the user's default email client -->
  <a href="mailto:support@example.com">Email Support</a>
</nav>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the protocol (`https://`) on absolute links

**The mistake:** Trying to link to an external website without including `http://` or `https://` at the beginning of the `href` value.

**Why it's wrong:** If you leave off the protocol, the browser assumes you are trying to link to a local file on your *own* server. If you put `href="google.com"`, the browser will try to navigate to `yourwebsite.com/google.com`, which will result in a 404 Not Found error.

*Incorrect:*
```html
<!-- The browser thinks this is a local file named "www.google.com" -->
<a href="www.google.com">Search</a>
```

*Fix:*
```html
<!-- The browser knows this is an external website -->
<a href="https://www.google.com">Search</a>
```

---



### Mistake 2: Writing Empty `href=""` or Dummy `href="#"` on Buttons

**The mistake:** Writing `<a href="#" onclick="doSomething()">Button</a>`.

**Why it's wrong:** Using `href="#"` for JS actions causes the browser window to jump to the top of the page when clicked. Use `<button type="button">` for JS actions.

*Incorrect:*
```html
<a href="#" onclick="openModal()">Open Modal</a> <!-- ❌ Jumps page to top! -->
```

*Fix:*
```html
<button type="button" onclick="openModal()">Open Modal</button>
```

### Mistake 3: Omitting `href` Attribute on Anchor Tags (`<a>Link</a>`)

**The mistake:** Creating an anchor `<a>Click Me</a>` without an `href` attribute.

**Why it's wrong:** An `<a>` element without an `href` attribute is NOT interactive! It cannot receive keyboard focus (Tab key) and is ignored as a link by screen readers.

*Incorrect:*
```html
<a onclick="nav()">Click Me</a> <!-- ❌ Inaccessible! No keyboard focus! -->
```

*Fix:*
```html
<a href="/target-page">Click Me</a>
```

## 5. Practice Exercises

### Exercise 1: Linking Relative Paths, Absolute URLs, and Email Links

**Scenario:** A developer creates three distinct link types using relative paths, absolute URLs, and the `mailto:` email protocol.

**Requirements:**
1. Create internal link using relative path `href="contact.html"`.
2. Create external link using absolute URL `href="https://example.com"`.
3. Create email link using `href="mailto:support@example.com"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <ul class="nav-links">
>   <li><a href="contact.html">Contact Us</a></li>
>   <li><a href="https://example.com" target="_blank" rel="noopener noreferrer">Partner Site</a></li>
>   <li><a href="mailto:support@example.com">Email Support</a></li>
> </ul>
> ```
>
> #### Technical Explanation
>
> 1. **The `href` Attribute**: Specifies the hyperlink target destination URL on `<a>`, `<link>`, and `<base>` tags.
> 2. **Email Protocol (`mailto:`)**: The `mailto:` scheme opens the user's default email client pre-addressed to the recipient.
> 3. **Relative vs Absolute Target Paths**: Relative paths link within the site; absolute URLs include complete `https://` domain schemes.
> 
---

### Exercise 2: URL Fragment Anchors for Table of Contents

**Scenario:** Creates smooth navigation targets using `href="#fragment-id"`.

**Requirements:**
1. Link `href="#features"` to `<section id="features">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <a href="#features">Jump to Features Section</a>
>
> <section id="features">
>   <h2>Product Features</h2>
>   <p>Detailed feature descriptions.</p>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **Fragment Hash (`#`)**: `href="#id"` targets an element with a matching `id` on the current page.
> 2. **Top of Page Target (`href="#"`)**: `href="#"` jumps to top of document window.
> 3. **Keyboard Focus Routing**: Moves keyboard focus directly to target section element.
> 
---

### Exercise 3: Handling Missing or Dummy href Attributes

**Scenario:** Fixes anti-pattern where `<a>` tags lack `href` attributes or use `javascript:void(0)`.

**Requirements:**
1. Replace dummy `<a href="#">` buttons with semantic `<button type="button">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Incorrect: <a href="#" onclick="doSomething()">Click Me</a> -->
> <!-- Correct Semantic HTML5 Button for JS Actions: -->
> <button type="button" class="btn-action">Perform Action</button>
> ```
>
> #### Technical Explanation
>
> 1. **Links vs Buttons**: Links (`<a>`) navigate to URLs; Buttons (`<button>`) perform actions or trigger scripts.
> 2. **Keyboard Accessibility**: `<a>` without `href` is NOT focusable via Tab key navigation.
> 3. **Screen Reader Announcement**: Links without `href` lose hyperlink role accessibility semantics.
## 6. Related Terms
- [`<a>` (Anchor / Link)](a.md) — The tag that utilizes the `href` attribute.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The web address standard links utilize.
- [`<link>`](../level_08/link.md) — A different HTML tag that ALSO uses the `href` attribute, but for stylesheets instead of navigation.
- [`<img>`](../level_03/img.md) — Related concept: `<img>`.
- [`src` Attribute](../level_03/src.md) — Related concept: `src` Attribute.
- [`<base>` Element](../level_08/base.md) — Related concept: `<base>` Element.
- [`<map>` & `<area>` (Image Maps)](../level_10/map_area.md) — Related concept: `<map>` & `<area>` (Image Maps).

---

## 7. Key Takeaways
- `href` stands for Hypertext Reference.
- It specifies the destination address for a link.
- **Absolute links** (to other websites) must start with `http://` or `https://`.
- **Relative links** (to your own files) can just be the file name, like `about.html`.
- It can also be used for email links (`mailto:`) and phone links (`tel:`).
