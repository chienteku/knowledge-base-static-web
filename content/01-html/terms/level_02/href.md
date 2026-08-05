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
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Writing Empty `href=""` or Dummy `href="#"` on Buttons

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

### Mistake 5: Omitting `href` Attribute on Anchor Tags (`<a>Link</a>`)

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



### Mistake 6: Writing Empty `href=""` or Dummy `href="#"` on Buttons

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

### Mistake 7: Omitting `href` Attribute on Anchor Tags (`<a>Link</a>`)

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

## 6. Practice Exercises

### Exercise 1: Identifying Link Types

**Problem:** Look at the following `href` values. Identify if they are Absolute, Relative, or Mailto links.
1. `href="contact.html"`
2. `href="https://facebook.com"`
3. `href="mailto:hello@world.com"`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Relative (points to a local file)
> 2. Absolute (points to a full URL on another server)
> 3. Mailto (opens an email client)
> ```
> - Does it have `https://`?
> - Does it have `mailto:`?

---

### Exercise 2: Valid href Value Formats

**Problem:** Match `href` format to target link behavior:
1. `href="/about"` 
2. `href="#top"` 
3. `href="mailto:a@b.com"` 
4. `href="tel:123456"` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Root-relative page navigation
> 2. In-page anchor element ID
> 3. Email client prompt
> 4. Telephone dialer prompt
> ```
>
> **Explanation:** `href` accepts web URLs, element IDs, and URI protocol schemes.

---

### Exercise 3: Downloading Files via href

**Problem:** Which attribute can be added to `<a href="file.pdf">` to force the browser to download the file instead of displaying it inline?

**Expected output:**
> [!check]- Answer
> ```html
> <a href="file.pdf" download="Report.pdf">Download Report</a>
> ```
>
> **Explanation:** `download` attribute instructs browsers to save linked resources to disk.

## 7. Related Terms
- [`<a>` (Anchor / Link)](a.md) — The tag that utilizes the `href` attribute.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The web address standard links utilize.
- [`<link>`](../level_08/link.md) — A different HTML tag that ALSO uses the `href` attribute, but for stylesheets instead of navigation.
- [`<img>`](../level_03/img.md) — Related concept: `<img>`.
- [`src` Attribute](../level_03/src.md) — Related concept: `src` Attribute.
- [`<base>` Element](../level_08/base.md) — Related concept: `<base>` Element.
- [`<map>` & `<area>` (Image Maps)](../level_10/map_area.md) — Related concept: `<map>` & `<area>` (Image Maps).
---

## 8. Key Takeaways
- `href` stands for Hypertext Reference.
- It specifies the destination address for a link.
- **Absolute links** (to other websites) must start with `http://` or `https://`.
- **Relative links** (to your own files) can just be the file name, like `about.html`.
- It can also be used for email links (`mailto:`) and phone links (`tel:`).
