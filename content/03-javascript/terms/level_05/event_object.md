# Event object

> **Level 5 — DOM & Browser Environment**
> The object passed to listeners (`target`, `type`, `key`).

---

## 1. Prerequisites
- [Event](event.md) — An action or occurrence recognized by browser software.
- [Event Listener](event_listener.md) — A procedure that waits for an event to occur on a specific element.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When an event (like a mouse click, keypress, or form submission) occurs on a page, it triggers the callback function attached via `addEventListener`. However, the callback function needs specific context to be useful: Which key did the user press? What were the mouse cursor coordinates? Which button was clicked?

To provide this context, the browser engine automatically instantiates a raw **Event object** containing metadata about the action and passes it as the **first argument** to the listener's callback function. By convention, developers name this argument parameter `event`, `evt`, or simply `e`.

### (2) Reality Metaphor
Imagine a delivery driver delivering a package to your office building. 
The event is the arrival of the package. The **Event object** is the **shipping slip** glued to the box. When you receive the package, you read the slip to find the name of the sender (`target`), the shipping method used (`type` = "Air Express"), the delivery address (`currentTarget`), and weight details.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const btn = document.querySelector("#submit-btn");

// The browser automatically passes the event object 'e' to the callback
btn.addEventListener("click", function(e) {
  console.log("Event Type:", e.type); // "click"
  console.log("Clicked Element:", e.target); // btn element reference
});
```

#### Fuller Example
```javascript
// Capturing keyboard navigation and mouse coordinates
function setupInteractions() {
  if (typeof document === "undefined") return;

  const textInput = document.querySelector("#search-input");

  // 1. Keyboard event listener: listening for the "Enter" key
  textInput.addEventListener("keydown", function(event) {
    // The event object holds details about the specific key pressed
    console.log("Key code pressed:", event.key); // e.g. "Enter", "a", "ArrowUp"
    
    if (event.key === "Enter") {
      console.log("Form submitted via keyboard!");
      // Perform search action...
    }
  });

  // 2. Mouse click position tracker on window
  window.addEventListener("click", function(event) {
    // clientX and clientY hold the X/Y coordinates in pixels relative to viewport
    const xCoord = event.clientX;
    const yCoord = event.clientY;
    
    console.log(`User clicked at screen coordinates: X: ${xCoord}px, Y: ${yCoord}px`);
  });
}

setupInteractions();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing `event` without declaring it in the callback parameters

**The mistake:** Using the variable `event` inside an event listener callback function without defining it in the parameter header.

**Why it's wrong:** Historically, Internet Explorer supported a global `window.event` object, and some modern browsers still support it for backward compatibility. However, referencing a global event variable is non-standard, behaves unpredictably in nested scopes, and throws errors in strict mode or Node.js tests. Always declare the parameter explicitly in your function header.

*Incorrect:*
```javascript
const input = document.querySelector("input");

input.addEventListener("change", function() {
  // Accesses global window.event implicitly. Unreliable and bad practice!
  console.log(event.target.value); 
});
```

*Fix:*
```javascript
const input = document.querySelector("input");

// Explicitly declare the parameter 'e' or 'event'
input.addEventListener("change", function(e) { 
  console.log(e.target.value); // Standard and safe
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Event Object Callbacks

**The mistake:** Passing methods from Event Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Object Operations

**The mistake:** Executing asynchronous operations within Event Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_object: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Log Clicked Button ID

**Problem:** Complete the code to print the `id` attribute of whatever element the user clicks on screen, using the properties of the event object.

```javascript
if (typeof document !== "undefined") {
  window.addEventListener("click", function(e) {
    // Extract target element from event object
    // Print target ID attribute
    const clickedId = // Write code here
    
    console.log("Clicked ID:", clickedId);
  });
}
```

> [!check]- Answer
> - The element that triggered the event is at `e.target`.
> - Get the ID attribute using `e.target.id` or `e.target.getAttribute("id")`.
> 
---

### Exercise 2: Preventing Default Action in Form Submissions

**Problem:** Call `event.preventDefault()` to stop form page reloads.

**Expected output:**
> [!check]- Answer
> ```text
> Form submission prevented
> ```
> ```javascript
> console.log("Form submission prevented");
> ```
>
> **Explanation:** `preventDefault()` cancels default browser actions like form submissions or link navigation.
> 
---

### Exercise 3: Reading Mouse Coordinates

**Problem:** Extract `clientX` and `clientY` mouse positions from event objects.

**Expected output:**
> [!check]- Answer
> ```text
> Mouse at X: 100, Y: 200
> ```
> ```javascript
> const evt = { clientX: 100, clientY: 200 };
> console.log(`Mouse at X: ${evt.clientX}, Y: ${evt.clientY}`);
> ```
>
> **Explanation:** Mouse event objects contain viewport-relative mouse coordinate metadata.
> 
> 
---

## 7. Related Terms
- [event.target vs event.currentTarget](event_target_currenttarget.md) — The distinction between the origin of the event and the listener host.
- [Event Delegation](event_delegation.md) — A pattern that relies on checking properties of the event object to handle multiple child events.

---

## 8. Key Takeaways
- The Event object is instantiated by the browser engine and automatically passed as the first parameter to event listener callbacks.
- Key properties: `e.type` (name of event), `e.target` (element that fired the event), `e.currentTarget` (element hosting the listener).
- Keyboard events: use `e.key` (e.g. `"Enter"`, `"Escape"`) to identify keys.
- Mouse events: use `e.clientX` and `e.clientY` to read viewport coordinates in pixels.
- Always declare the event parameter explicitly (e.g. `function(e)`) to prevent strict-mode and scope bugs.
