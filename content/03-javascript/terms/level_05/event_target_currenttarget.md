# event.target vs event.currentTarget

> **Level 5 — DOM & Browser Environment**
> Element that fired vs element the listener is on.

---

## 1. Prerequisites
- [Event object](./event_object.md) — The metadata object passed automatically to listener callbacks.
- [Event Delegation](./event_delegation.md) — A pattern of attaching a listener to a parent to handle nested child events.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Due to JavaScript's event propagation rules (event bubbling), an event starts at the target element and moves up the DOM tree through its ancestors. If you attach an event listener to a parent container (like a `<ul>` menu), that listener will fire whenever a user clicks any child element (like an `<li>` item or a `<span>` icon inside it).

To allow developers to handle these bubbling scenarios correctly, the Event object exposes two separate element references:
- **`event.target`:** The **origin** of the event. It points to the specific, deepest HTML element that was physically clicked or interacted with.
- **`event.currentTarget`:** The **host** of the listener. It points to the element that the event listener is *directly attached to* and is currently executing.

Understanding this distinction is the foundation of Event Delegation and is critical when working with elements containing nested tags (such as a button containing a text label and an icon).

### (2) Reality Metaphor
Imagine a company department (the parent `currentTarget`) consisting of several workers (child elements).
If a worker named Alice (the **`event.target`**) makes a mistake, a complaint letter is filed. The complaint bubbles up to the Department Manager's desk because the manager has a rule sheet to intercept errors (the event listener). 
When the manager processes the complaint, they notice:
- The complaint was processed at the Manager's Desk (**`event.currentTarget`**).
- The actual person who triggered the issue is Alice (**`event.target`**).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const menu = document.querySelector("#menu-list");

menu.addEventListener("click", function(event) {
  // If the user clicks an <li> inside the menu:
  console.log("Origin element:", event.target); // The specific <li> clicked
  console.log("Listener host:", event.currentTarget); // The #menu-list container
});
```

#### Fuller Example
```javascript
// A card component containing nested tags (Header, Text, Button)
// HTML structure:
// <div class="card-component" id="main-card">
//   <h3>Card Title</h3>
//   <p>Click <strong class="highlight">here</strong> to activate.</p>
// </div>

function setupCardHandler() {
  if (typeof document === "undefined") return;

  const card = document.getElementById("main-card");

  card.addEventListener("click", function(event) {
    console.log("--- Click Event Detected ---");
    
    // 1. event.currentTarget ALWAYS refers to the #main-card div because that's where we added the listener
    console.log("currentTarget tag:", event.currentTarget.tagName); // "DIV"
    console.log("currentTarget ID:", event.currentTarget.id);      // "main-card"

    // 2. event.target changes depending on exactly where the user clicked inside the card
    console.log("target tag:", event.target.tagName);
    
    // If the user clicked the bold text "here":
    // target tag will be "STRONG"
    // currentTarget tag remains "DIV"
    
    if (event.target.classList.contains("highlight")) {
      console.log("User clicked the highlighted text specifically!");
    }
  });
}

setupCardHandler();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `event.target` is always the element hosting the listener

**The mistake:** Binding a listener to a `<button>` containing nested text or icon span elements, and reading attributes from `event.target` expecting to target the button.

**Why it's wrong:** If the user clicks directly on the text or icon inside the button, `event.target` points to the nested `<span>` or `<i>` tag, not the button. If the span doesn't have the attribute you are looking for, your logic will return `null` or `undefined`.

*Incorrect:*
```html
<!-- HTML structure: -->
<button id="cart-btn" data-id="product-105">
  <span>Add to Cart</span>
</button>
```
```javascript
const btn = document.getElementById("cart-btn");

btn.addEventListener("click", function(event) {
  // If user clicks the text, target is the <span>, which lacks data-id!
  const productId = event.target.getAttribute("data-id"); 
  
  console.log(productId); // null!
});
```

*Fix:*
```javascript
const btn = document.getElementById("cart-btn");

btn.addEventListener("click", function(event) {
  // Fix option A: Use currentTarget, which is guaranteed to be the button
  const productId1 = event.currentTarget.getAttribute("data-id"); // "product-105"
  
  // Fix option B: Use closest() to find the button ancestor if using delegation
  const productId2 = event.target.closest("button").getAttribute("data-id"); // "product-105"
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Event Target Currenttarget Callbacks

**The mistake:** Passing methods from Event Target Currenttarget instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_target_currenttarget",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_target_currenttarget",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Target Currenttarget Operations

**The mistake:** Executing asynchronous operations within Event Target Currenttarget without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_target_currenttarget"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_target_currenttarget");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_target_currenttarget: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Identify Click Locations

**Problem:** Predict what `event.target` and `event.currentTarget` will point to when a user clicks the italicized word `"now"` in the following markup, assuming the listener is bound to the `#parent-box` div.

```html
<div id="parent-box">
  <p>Read the details <i id="trigger">now</i></p>
</div>
```

**Expected output:**
```text
event.target: The <i> tag (specifically, the element with ID "trigger").
event.currentTarget: The <div> tag (specifically, the element with ID "parent-box").
```

> [!check]- Answer
> - `target` points to the exact element clicked (innermost).
> - `currentTarget` points to the element that was bound to `addEventListener`.

---

### Exercise 2: Comparing `target` and `currentTarget`

**Problem:** Differentiate `target` (clicked child) vs `currentTarget` (listener container).

**Expected output:**
```text
Target: SPAN, CurrentTarget: BUTTON
```

> [!check]- Answer
> ```javascript
> const evt = { target: { tagName: "SPAN" }, currentTarget: { tagName: "BUTTON" } };
> console.log(`Target: ${evt.target.tagName}, CurrentTarget: ${evt.currentTarget.tagName}`);
> ```
>
> **Explanation:** `currentTarget` tracks the active listening element during event propagation.

### Exercise 3: `this` Binding Equivalence in Traditional Listeners

**Problem:** Demonstrate that `this === event.currentTarget` inside traditional function event handlers.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> console.log(true);
> ```
>
> **Explanation:** In standard function event handlers, `this` is bound to `event.currentTarget`.

---

---

## 7. Related Terms
- [Event Bubbling](./event_bubbling.md) — The process where events propagate up through ancestor elements, enabling the divergence of target and currentTarget.
- [Event Delegation](./event_delegation.md) — The architectural design pattern of handling multiple children events using parent listener properties.

---

## 8. Key Takeaways
- `event.target` is the innermost element that initiated the event (the origin).
- `event.currentTarget` is the element containing the active event listener (the host).
- When a user clicks nested text or icons inside a button, `target` is the nested tag, while `currentTarget` remains the button.
- Always use `event.currentTarget` (or `event.target.closest(selector)`) when you need to read attributes from the parent element hosting the event listener.
