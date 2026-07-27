# Event Bubbling

> **Level 5 — DOM & Browser Environment**
> The process where an event propagates from the target element up through its ancestors.

---

## 1. Prerequisites
- [Event Listener](../level_05/event_listener.md) — Waiting for events to occur.
- [DOM](../level_05/dom.md) — The nested tree structure of HTML.

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Direction of Bubbling

**Problem:** You have the following structure: `<body> -> <main> -> <section> -> <p>`. 
If a user clicks on the `<p>` tag, in what exact order will the click event travel through the DOM?

**Expected output:**
```text
1. <p> (The target)
2. <section>
3. <main>
4. <body>
5. document
```

> [!check]- Answer
> - Bubbling always goes from the innermost child (the target) UP to the outermost parent.

---

### Exercise 2: Stopping Event Propagation

**Problem:** Call `event.stopPropagation()` to prevent button clicks from reaching parent div handlers.

**Expected output:**
```text
Child click handled; parent propagation stopped
```

> [!check]- Answer
> ```javascript
> console.log("Child click handled; parent propagation stopped");
> ```
>
> **Explanation:** `stopPropagation()` prevents events from bubbling up DOM parent trees.

### Exercise 3: Inspecting Event Phase

**Problem:** Match `event.eventPhase` integer constants: `1` (CAPTURING_PHASE), `2` (AT_TARGET), `3` (BUBBLING_PHASE).

**Expected output:**
```text
Capture: 1, Target: 2, Bubble: 3
```

> [!check]- Answer
> ```javascript
> console.log("Capture: 1, Target: 2, Bubble: 3");
> ```
>
> **Explanation:** `eventPhase` numbers indicate current DOM event dispatch propagation stages.

---

---

## 7. Related Terms
- [Event Capturing](../level_05/event_capturing.md) — The opposite of bubbling (traveling downwards).
- [`event.stopPropagation()`](../level_05/event_stoppropagation.md) — The method used to pop the bubble and stop it from rising.
- [Event Delegation](../level_05/event_delegation.md) — A powerful technique that *relies* on bubbling.

---

## 8. Key Takeaways
- Event Bubbling is the default behavior for most events in the DOM.
- Events start at the innermost target element and travel upwards through all ancestors.
- Parent elements can "catch" events that originated on their children.
- `event.target` tells you what was *actually* clicked, while `event.currentTarget` tells you which element the listener is currently firing on.
