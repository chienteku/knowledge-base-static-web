# classList & setAttribute/getAttribute

> **Level 5 — DOM & Browser Environment**
> Modify element classes and attributes.

---

## 1. Prerequisites
- [Node](node.md) — A single point in the DOM tree.

---

## 2. Term Category

**Browser API / DOM (Browser-only: Only exists in web browsers.)**: classList & setAttribute/getAttribute is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To make a webpage dynamic, JavaScript must go beyond updating text; it must change the appearance and behaviors of elements. This is achieved by updating **CSS classes** and **HTML attributes** (such as turning a button grey by adding a class, disabling form fields, or updating a link's destination URL).

Browser engines provide two specialized interfaces for this:
1. **`classList`:** An object representing the element's CSS classes. Rather than forcing developers to parse class strings manually, `classList` provides clean method tokens:
   - `add(class)`: Safely appends a class.
   - `remove(class)`: Safely deletes a class.
   - `toggle(class)`: Adds a class if it is missing, or removes it if it exists.
   - `contains(class)`: Returns `true` if the class is present.
2. **Attribute Methods:** Used to access or modify any raw HTML attribute (such as `href`, `src`, `disabled`, or custom `data-*` metadata):
   - `getAttribute(name)`: Reads an attribute value.
   - `setAttribute(name, value)`: Writes or updates an attribute.
   - `removeAttribute(name)`: Deletes an attribute completely.

### (2) Reality Metaphor
- **`classList`** is like changing a display mannequin's outfit. You can add a coat (`classList.add`), remove a hat (`classList.remove`), or toggle sunglasses (`classList.toggle`). You don't have to throw away all the clothes to change just one item.
- **Attribute Methods** are like gluing a luggage tag or label onto a package. Calling `setAttribute("destination", "New York")` prints and sticks a custom shipping label on the box. Calling `getAttribute("destination")` reads the label.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const box = document.querySelector(".box");

// Modify styling classes using classList
box.classList.add("highlighted");
box.classList.toggle("active"); // adds if missing, removes if present

// Modify attributes
box.setAttribute("role", "button");
console.log(box.getAttribute("role")); // "button"
```

#### Fuller Example
```javascript
// A dark mode toggle switcher and image loader UI
function setupThemeSwitcher() {
  if (typeof document === "undefined") return;

  const toggleBtn = document.querySelector("#theme-toggle");
  const body = document.body;

  toggleBtn.addEventListener("click", function() {
    // 1. Toggle the dark-theme class on body
    const isDarkMode = body.classList.toggle("dark-theme");

    // 2. Update button attributes to maintain accessibility (aria-pressed)
    toggleBtn.setAttribute("aria-pressed", isDarkMode.toString());
    
    // 3. Update button text based on state
    toggleBtn.textContent = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
  });
}

function updateFeaturedImage(imageUrl, imageAlt) {
  const featImage = document.querySelector("#featured-img");
  
  if (featImage) {
    // Update src and alt attributes dynamically
    featImage.setAttribute("src", imageUrl);
    featImage.setAttribute("alt", imageAlt);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Overwriting All Classes using `className`

**The mistake:** Using `element.className = "new-class"` to add a single styling class to an element.

**Why it's wrong:** The `className` property represents the entire class attribute string. Reassigning it directly completely overwrites and deletes all existing layout, padding, or framework utility classes that were already on the element.

*Incorrect:*
```javascript
// HTML: <div class="btn primary large padding-2">
const myBtn = document.querySelector("div");

myBtn.className = "active"; // Overwrites everything!
// HTML is now: <div class="active"> (lost button styles, padding, etc.)
```

*Fix:*
```javascript
const myBtn = document.querySelector("div");

myBtn.classList.add("active"); // Safely appends "active"
// HTML is now: <div class="btn primary large padding-2 active">
```

### Mistake 2: Expecting `setAttribute("disabled", false)` to enable a button

**The mistake:** Passing a boolean `false` to `setAttribute` expecting to enable an input element.

**Why it's wrong:** HTML attributes only store strings. Passing a boolean coerces it to the string `"false"`. In HTML, the presence of the `disabled` attribute itself (regardless of value) disables the element. Therefore, setting it to `"false"` still disables the element.

*Incorrect:*
```javascript
const submitBtn = document.querySelector("#submit");
submitBtn.setAttribute("disabled", false); // Coerces to "false". Button is still DISABLED!
```

*Fix:*
```javascript
const submitBtn = document.querySelector("#submit");

// Correct legacy way:
submitBtn.removeAttribute("disabled"); 

// Correct modern properties way (recommended for boolean properties):
submitBtn.disabled = false; 
```

---

### Mistake 3: Unhandled Asynchronous Failures in Classlist Attributes Operations

**The mistake:** Executing asynchronous operations within Classlist Attributes without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/classlist_attributes"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/classlist_attributes");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in classlist_attributes: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Dynamic Component Theme Switcher with classList

**Scenario:** A design system component toggles dark mode classes on UI elements using classList.toggle() and classList.contains() to inspect active CSS states.

**Requirements:**
1. Write toggleThemeClass(element, themeName).
2. Use element.classList.toggle(themeName).
3. Return boolean indicating if theme class is active.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function toggleThemeClass(element, themeName) {
>   if (!element || !element.classList) {
>     throw new Error("Invalid DOM element");
>   }
>   return element.classList.toggle(themeName);
> }
>
> // Verification tests
> const mockEl = {
>   classes: new Set(),
>   classList: {
>     toggle(c) {
>       if (this.classes.has(c)) { this.classes.delete(c); return false; }
>       else { this.classes.add(c); return true; }
>     }
>   }
> };
> console.assert(toggleThemeClass(mockEl, "dark-mode") === true, "Test 1 Failed");
> console.assert(toggleThemeClass(mockEl, "dark-mode") === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **classList API**: The classList property returns a token list (DOMTokenList) providing helper methods (.add, .remove, .toggle, .contains).
> 2. **classList.toggle()**: Toggles class presence: adds class if absent, removes if present, and returns boolean indicating final state.
> 3. **Performance over className**: Modifying individual classes via classList avoids string parsing errors associated with className manipulation.
> 
---

### Exercise 2: Accessible Form Input State Attribute Manager

**Scenario:** A form validation helper manages accessibility state on input elements using setAttribute() and getAttribute() to update aria-invalid and aria-describedby.

**Requirements:**
1. Write setFieldValidationState(inputEl, isValid, errorId).
2. Use setAttribute() to set aria-invalid to "true" or "false".
3. Link aria-describedby to errorId when invalid.
4. Return updated attribute map.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setFieldValidationState(inputEl, isValid, errorId) {
>   if (!inputEl || typeof inputEl.setAttribute !== "function") return false;
>
>   if (!isValid) {
>     inputEl.setAttribute("aria-invalid", "true");
>     inputEl.setAttribute("aria-describedby", errorId);
>   } else {
>     inputEl.setAttribute("aria-invalid", "false");
>     if (typeof inputEl.removeAttribute === "function") {
>       inputEl.removeAttribute("aria-describedby");
>     }
>   }
>   return true;
> }
>
> // Verification tests
> const attrs = {};
> const mockInput = {
>   setAttribute(k, v) { attrs[k] = v; },
>   removeAttribute(k) { delete attrs[k]; }
> };
>
> setFieldValidationState(mockInput, false, "err-username");
> console.assert(attrs["aria-invalid"] === "true", "Test 1 Failed");
> console.assert(attrs["aria-describedby"] === "err-username", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Attribute Manipulation**: setAttribute(name, value) sets HTML/ARIA attribute strings directly on DOM elements.
> 2. **Accessibility Standards**: Updating aria-* attributes dynamically communicates validation states to assistive screen readers.
> 3. **String Value Requirement**: All attribute values set via setAttribute() are implicitly coerced to strings.
> 
---

### Exercise 3: Analytics Dataset Property Extractor

**Scenario:** An analytics tracking library reads custom data attributes from DOM elements using the dataset API (data-* attributes).

**Requirements:**
1. Write extractTrackingMetadata(element).
2. Read custom data attributes via element.dataset.
3. Return metadata object { category, action, label }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractTrackingMetadata(element) {
>   if (!element || !element.dataset) return {};
>
>   return {
>     category: element.dataset.trackCategory || "general",
>     action: element.dataset.trackAction || "click",
>     label: element.dataset.trackLabel || ""
>   };
> }
>
> // Verification tests
> const mockButton = {
>   dataset: {
>     trackCategory: "ecommerce",
>     trackAction: "checkout",
>     trackLabel: "cart-btn"
>   }
> };
> const meta = extractTrackingMetadata(mockButton);
> console.assert(meta.category === "ecommerce", "Test 1 Failed");
> console.assert(meta.action === "checkout", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **dataset Property API**: The dataset property provides access to custom data-* attributes as camelCase object properties.
> 2. **Attribute Name Mapping**: HTML data-track-category maps automatically to dataset.trackCategory in JavaScript.
> 3. **DOM Attribute Inspection**: Allows embedding structured UI metadata directly inside HTML markup.
---

## 6. Related Terms
- [DOM Manipulation (createElement, appendChild, remove)](dom_manipulation.md) — Structural element modifications.

---

## 7. Key Takeaways
- Use `element.classList` methods (`add`, `remove`, `toggle`, `contains`) to safely modify CSS classes without overwriting existing ones.
- Avoid raw assignment to `element.className` unless you intentionally want to delete all existing classes.
- Use `setAttribute(name, value)` to update HTML attributes and `getAttribute(name)` to read them.
- For boolean attributes (like `disabled` or `checked`), write directly to the property (e.g. `element.disabled = false`) or use `removeAttribute` to enable them.
