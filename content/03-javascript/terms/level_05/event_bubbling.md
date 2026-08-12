# Event Bubbling

> **Level 5 — DOM & Browser Environment**
> The process where an event propagates from the target element up through its ancestors.

---

## 1. Prerequisites
- [Event Listener](event_listener.md) — Waiting for events to occur.
- [DOM (Document Object Model)](dom.md) — The nested tree structure of HTML.

---

## 2. Term Category

**Web API *(Browser Environment)* (Browser Only)**: Event Bubbling is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In HTML, elements are nested inside one another. A `<button>` is inside a `<div>`, which is inside the `<body>`. If a user clicks the button, they are *physically* also clicking the `<div>`, and also clicking the `<body>`. 

To handle this reality, browser creators designed "Event Bubbling". When an event (like a click) happens on an element, the event doesn't just trigger the listener on that element. Like a bubble rising to the surface of water, the event "bubbles up" to the parent element, then the grandparent element, all the way up to the `document` root. If any of those parent elements have event listeners for "click", they will also fire!

### (2) Reality Metaphor
Imagine a set of nested Russian dolls. You tap the smallest doll in the center. The vibration from your tap doesn't just stay on the smallest doll; it transfers to the slightly larger doll surrounding it, and then to the next larger doll, until the vibration reaches the outermost shell.

### (3) JavaScript Code Examples

#### Short Snippet
```html
<div id="parent" style="padding: 50px; background: lightblue;">
  <button id="child">Click Me!</button>
</div>
```
```javascript
const parentDiv = document.querySelector("#parent");
const childBtn = document.querySelector("#child");

parentDiv.addEventListener("click", () => {
  console.log("Parent DIV was clicked!");
});

childBtn.addEventListener("click", () => {
  console.log("Child BUTTON was clicked!");
});

/* 
If you click the BUTTON, the output will be:
1. "Child BUTTON was clicked!"
2. "Parent DIV was clicked!"  <-- The event bubbled up!
*/
```

#### Fuller Example: `event.target`
```javascript
// A parent container
const container = document.querySelector(".container");

// If you attach a listener to the parent, it catches all bubbles from its children!
container.addEventListener("click", (event) => {
  // event.target is the specific element the user ACTUALLY clicked on
  console.log("You clicked on: ", event.target.nodeName);
  
  // event.currentTarget is the element the LISTENER is attached to (the container)
  console.log("Listener fired on: ", event.currentTarget.nodeName);
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Bubbling Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Bubbling blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_bubbling";
```

*Fix:*
```javascript
let value = "event_bubbling";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Bubbling Callbacks

**The mistake:** Passing methods from Event Bubbling instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_bubbling",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_bubbling",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Bubbling Operations

**The mistake:** Executing asynchronous operations within Event Bubbling without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_bubbling"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_bubbling");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_bubbling: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Multi-Level Table Row Click Handler via Bubbling

**Scenario:** A data grid tracks row clicks by listening on a parent container element, taking advantage of event bubbling from child cells up to the parent container.

**Requirements:**
1. Write handleRowClickBubbling(event, rowCallback).
2. Inspect event.target and event.currentTarget.
3. Find row element.
4. Invoke rowCallback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleRowClickBubbling(event, rowCallback) {
>   if (!event || !event.target) return false;
>
>   const row = typeof event.target.closest === "function" ? event.target.closest("tr") : null;
>   if (row) {
>     rowCallback(row);
>     return true;
>   }
>   return false;
> }
>
> // Verification tests
> const mockRow = { tag: "tr" };
> const mockEvent = {
>   target: {
>     closest(sel) { return sel === "tr" ? mockRow : null; }
>   }
> };
> let clickedRow = null;
> handleRowClickBubbling(mockEvent, r => { clickedRow = r; });
> console.assert(clickedRow === mockRow, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Bubbling Mechanics**: Events propagate upwards from the deepest target element through parent ancestors to document/window.
> 2. **Bottom-Up Propagation**: Bubbling phase executes after capturing phase completes.
> 3. **bubbles Property**: Event.bubbles boolean indicates whether an event type propagates up the DOM tree.
> 
---

### Exercise 2: Modal Backdrop Click Detector via Bubbling

**Scenario:** A modal dialog component detects when clicks bubble up to the backdrop overlay element.

**Requirements:**
1. Write isBackdropClick(event, backdropEl).
2. Check if event.target === backdropEl.
3. Return boolean indicating background overlay click.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isBackdropClick(event, backdropEl) {
>   if (!event || !event.target || !backdropEl) return false;
>   // If target clicked is exact backdrop element (not child content), return true
>   return event.target === backdropEl;
> }
>
> // Verification tests
> const mockBackdrop = { id: "backdrop" };
> const mockContent = { id: "modal-card" };
>
> console.assert(isBackdropClick({ target: mockBackdrop }, mockBackdrop) === true, "Test 1 Failed");
> console.assert(isBackdropClick({ target: mockContent }, mockBackdrop) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **event.target vs event.currentTarget**: event.target refers to the actual clicked element; event.currentTarget is the listener element.
> 2. **Backdrop Click Pattern**: Comparing event.target === backdropEl ensures inner modal card clicks don't close the modal.
> 3. **Bubbling Propagation Path**: Inner child clicks bubble up to backdrop listener, but target comparison isolates content clicks.
> 
---

### Exercise 3: Bubbling Tree Path Inspector

**Scenario:** A debugging tool collects all element tags along the event bubbling path from target up to window.

**Requirements:**
1. Write traceBubblingPath(event).
2. Use event.composedPath() or parentElement loop.
3. Return array of element tag names.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function traceBubblingPath(event) {
>   if (!event) return [];
>   if (typeof event.composedPath === "function") {
>     return event.composedPath().map(el => el.tagName || "WINDOW");
>   }
>   const path = [];
>   let curr = event.target;
>   while (curr) {
>     path.push(curr.tagName || "UNKNOWN");
>     curr = curr.parentElement;
>   }
>   return path;
> }
>
> // Verification tests
> const mockEvt = {
>   target: { tagName: "BUTTON", parentElement: { tagName: "DIV", parentElement: null } }
> };
> const path = traceBubblingPath(mockEvt);
> console.assert(path.join(",") === "BUTTON,DIV", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **composedPath() API**: Event.prototype.composedPath() returns an array of nodes through which the event will propagate.
> 2. **Shadow DOM Boundary Traversal**: composedPath() traverses Shadow DOM boundaries if shadow roots are open.
> 3. **Event Propagation Tracing**: Helps debug event propagation behavior across complex component hierarchies.
---

## 6. Related Terms
- [Event Capturing](event_capturing.md) — The opposite of bubbling (traveling downwards).
- [event.stopPropagation()](event_stoppropagation.md) — The method used to pop the bubble and stop it from rising.
- [Event Delegation](event_delegation.md) — A powerful technique that *relies* on bubbling.
- [event.target vs event.currentTarget](event_target_currenttarget.md) — Related concept: event.target vs event.currentTarget.
- [Event Listener](event_listener.md) — Related concept: Event Listener.

---

## 7. Key Takeaways
- Event Bubbling is the default behavior for most events in the DOM.
- Events start at the innermost target element and travel upwards through all ancestors.
- Parent elements can "catch" events that originated on their children.
- `event.target` tells you what was *actually* clicked, while `event.currentTarget` tells you which element the listener is currently firing on.
