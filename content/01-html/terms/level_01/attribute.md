# Attribute

> **Level 1 — The Anatomy of a Webpage**
> Additional information provided within an opening tag to configure elements.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Attributes are always placed inside the opening tag.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Syntax Rule

**Problem:** True or False: You can place as many attributes as you want inside a single opening tag, as long as they are separated by spaces.

**Expected output:**
```text
True! You can stack attributes.
Example: `<input type="text" placeholder="Enter name" required maxlength="10">`
```

> [!check]- Answer
> - Look at the `<img>` example in the snippets above.

---



### Exercise 2: Identifying Attributes and Values

**Problem:** Given `<a href="https://example.com" target="_blank">Link</a>`, identify the two attribute names and their corresponding values.

**Expected output:**
```text
Attribute 1 Name: href, Value: "https://example.com"
Attribute 2 Name: target, Value: "_blank"
```

> [!check]- Answer
> ```text
> Attribute 1 Name: href, Value: "https://example.com"
> Attribute 2 Name: target, Value: "_blank"
> ```
> - **Explanation:** Attributes modify element behavior or provide metadata in `name="value"` format.
### Exercise 3: Boolean Attribute Syntax

**Problem:** Write `disabled` attribute on `<button>` using valid boolean attribute shorthand.

**Expected output:**
```text
<button disabled>Submit</button>
```

> [!check]- Answer
> ```html
> <button disabled>Submit</button>
> ```
> - **Explanation:** Boolean attributes in HTML do not require values; presence of the attribute name evaluates to true.
## 7. Related Terms
- [Element vs. Tag](../level_01/element_vs_tag.md) — Attributes live inside the opening tag of an element.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Self-closing elements that are configured using attributes (like `<img>`).
- [`<a>` (Anchor / Link)](../level_02/a.md) — An element that heavily relies on the `href` attribute.

---

## 8. Key Takeaways
- Attributes provide extra configuration or instructions to an HTML element.
- They are ALWAYS placed inside the **opening tag**.
- They almost always follow the syntax: `name="value"`.
- Always wrap attribute values in double quotation marks (`""`).
```
