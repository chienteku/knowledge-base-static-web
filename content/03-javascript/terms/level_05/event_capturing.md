# Event Capturing

> **Level 5 — DOM & Browser Environment**
> The process where an event propagates from the outermost ancestor down to the target element.

---

## 1. Prerequisites
- [Event Bubbling](event_bubbling.md) — The opposite phase (traveling upwards).
- [Event Listener](event_listener.md) — Waiting for events to occur.
---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When an event happens on a web page, the browser has to figure out exactly which element triggered it. Before the "Bubbling" phase even begins, the browser actually starts at the very top of the document (the `window`) and travels *downwards* through the DOM tree until it reaches the specific element that was clicked. This downward journey is called the **Capturing Phase** (or "Trickling").

In the 1990s, Netscape and Microsoft had a browser war. Netscape designed their event system to use Capturing (top-down). Microsoft designed theirs to use Bubbling (bottom-up). Eventually, the W3C standardized the DOM and decided to use *both*. Today, every event goes down the tree (Capturing), hits the target, and then goes back up the tree (Bubbling). Developers rarely use Capturing, but it exists if you need a parent element to intercept an event *before* the child element gets it.

### (2) Reality Metaphor
Imagine dropping a stone into a deep well. 
**Capturing** is the stone falling from the top of the well, passing each layer of brick on the way down, until it finally hits the water at the bottom (the Target). 
**Bubbling** is the splash rising back up from the water, passing the same bricks in reverse order until it reaches the top.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const parent = document.querySelector("#parent");

// By default, listeners only fire during the BUBBLING phase.
// To make them fire during the CAPTURING phase, we pass a third argument: true.
parent.addEventListener("click", () => {
  console.log("Captured by the parent BEFORE the child even knows it was clicked!");
}, true); // <- The 'true' enables Capturing
```

#### Fuller Example: The Full Cycle
```html
<div id="grandparent">
  <div id="parent">
    <button id="child">Click Me</button>
  </div>
</div>
```
```javascript
const grandparent = document.getElementById("grandparent");
const child = document.getElementById("child");

// 1. Capturing Phase
grandparent.addEventListener("click", () => {
  console.log("1. Grandparent CAPTURING");
}, true);

// 2. Target Phase
child.addEventListener("click", () => {
  console.log("2. Child TARGET");
});

// 3. Bubbling Phase
grandparent.addEventListener("click", () => {
  console.log("3. Grandparent BUBBLING");
}, false); // false is the default

// If you click the child, the output will be exactly 1, 2, 3!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Capturing Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Capturing blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_capturing";
```

*Fix:*
```javascript
let value = "event_capturing";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Capturing Callbacks

**The mistake:** Passing methods from Event Capturing instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_capturing",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_capturing",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Capturing Operations

**The mistake:** Executing asynchronous operations within Event Capturing without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_capturing"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_capturing");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_capturing: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Capturing vs Bubbling Syntax

**Problem:** How do you tell `addEventListener` that you want it to trigger during the Capturing phase instead of the default Bubbling phase?

**Expected output:**
> [!check]- Answer
> ```text
> Pass `true` as the third argument to the addEventListener method:
> element.addEventListener('click', callback, true);
> ```
> - The third argument is called `useCapture`.

---

### Exercise 2: Registering Capture Phase Event Listeners

**Problem:** Register an event listener in capture phase using `addEventListener('click', handler, true)`.

**Expected output:**
> [!check]- Answer
> ```text
> Capture phase listener executed first
> ```
> ```javascript
> console.log("Capture phase listener executed first");
> ```
>
> **Explanation:** Passing `true` or `{ capture: true }` attaches event listeners to the downward capture phase.

---

### Exercise 3: Capture vs Bubble Propagation Direction

**Problem:** State direction of capture phase (Window -> Target) vs bubble phase (Target -> Window).

**Expected output:**
> [!check]- Answer
> ```text
> Capture: Downward, Bubble: Upward
> ```
> ```javascript
> console.log("Capture: Downward, Bubble: Upward");
> ```
>
> **Explanation:** Events flow down DOM trees in capture phase before bubbling back upward.


---

## 7. Related Terms
- [Event Bubbling](event_bubbling.md) — The upward phase of event propagation.
- [event.stopPropagation()](event_stoppropagation.md) — Can be used during Capturing to stop the event from ever reaching the child target!
---

## 8. Key Takeaways
- Every event travels down the DOM tree (Capturing), hits the target, and travels back up (Bubbling).
- Capturing is rarely used in standard web development.
- To listen for an event during the capturing phase, pass `true` as the third argument to `addEventListener`.
