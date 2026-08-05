# classList & setAttribute/getAttribute

> **Level 5 — DOM & Browser Environment**
> Modify element classes and attributes.

---

## 1. Prerequisites
- [Node](node.md) — A single point in the DOM tree.
---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Class and Attribute Update

**Problem:** Complete the code to check if `cardElement` has the class `"collapsed"`. If it does, remove `"collapsed"` and set the attribute `"aria-expanded"` to `"true"`.

```javascript
if (typeof document !== "undefined") {
  const cardElement = document.querySelector(".card");

  // Check if class 'collapsed' exists
  // If yes, remove 'collapsed' and set attribute 'aria-expanded' to 'true'
}
```

> [!check]- Answer
> - Check presence using `cardElement.classList.contains("collapsed")`.
> - Remove class using `cardElement.classList.remove("collapsed")`.
> - Set attribute using `cardElement.setAttribute("aria-expanded", "true")`.

---

### Exercise 2: Toggling Element Classes with `classList.toggle`

**Problem:** Simulate `elem.classList.toggle("hidden")` on a class list array representation.

**Expected output:**
> [!check]- Answer
> ```text
> ["btn","hidden"]
> ["btn"]
> ```
> ```javascript
> class MockClassList {
>   constructor(classes) { this.classes = classes; }
>   toggle(cls) {
>     const idx = this.classes.indexOf(cls);
>     if (idx > -1) this.classes.splice(idx, 1);
>     else this.classes.push(cls);
>     return this.classes;
>   }
> }
> const list = new MockClassList(["btn"]);
> console.log(JSON.stringify(list.toggle("hidden")));
> console.log(JSON.stringify(list.toggle("hidden")));
> ```
>
> **Explanation:** `classList.toggle(cls)` adds class if missing, and removes class if present.

---

### Exercise 3: Managing Data Attributes via `dataset`

**Problem:** Read data attribute `data-user-id="42"` using `elem.dataset.userId` concept.

**Expected output:**
> [!check]- Answer
> ```text
> 42
> ```
> ```javascript
> const dataset = { userId: "42" };
> console.log(dataset.userId);
> ```
>
> **Explanation:** The DOM `dataset` property automatically converts kebab-case `data-*` attributes to camelCase properties.

---

## 7. Related Terms
- [DOM Manipulation (createElement, appendChild, remove)](dom_manipulation.md) — Structural element modifications.
---

## 8. Key Takeaways
- Use `element.classList` methods (`add`, `remove`, `toggle`, `contains`) to safely modify CSS classes without overwriting existing ones.
- Avoid raw assignment to `element.className` unless you intentionally want to delete all existing classes.
- Use `setAttribute(name, value)` to update HTML attributes and `getAttribute(name)` to read them.
- For boolean attributes (like `disabled` or `checked`), write directly to the property (e.g. `element.disabled = false`) or use `removeAttribute` to enable them.
