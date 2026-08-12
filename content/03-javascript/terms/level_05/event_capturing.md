# Event Capturing

> **Level 5 — DOM & Browser Environment**
> The process where an event propagates from the outermost ancestor down to the target element.

---

## 1. Prerequisites
- [Event Bubbling](event_bubbling.md) — The opposite phase (traveling upwards).
- [Event Listener](event_listener.md) — Waiting for events to occur.

---

## 2. Term Category

**Web API *(Browser Environment)* (Browser Only)**: Event Capturing is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Global Security Audit Interceptor via Capture Phase

**Scenario:** A security monitoring script registers event listeners with { capture: true } to intercept user clicks at top of DOM tree during the capturing phase.

**Requirements:**
1. Write registerCaptureInterceptor(targetEl, eventName, handlerFn).
2. Use targetEl.addEventListener(eventName, handlerFn, { capture: true }).
3. Return true.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function registerCaptureInterceptor(targetEl, eventName, handlerFn) {
>   if (!targetEl || typeof targetEl.addEventListener !== "function") return false;
>   targetEl.addEventListener(eventName, handlerFn, { capture: true });
>   return true;
> }
>
> // Verification tests
> let captureRegistered = false;
> const mockEl = {
>   addEventListener(evt, fn, opts) {
>     if (opts && opts.capture === true) captureRegistered = true;
>   }
> };
> registerCaptureInterceptor(mockEl, "click", () => {});
> console.assert(captureRegistered === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Capturing Phase**: Top-down event propagation phase where events travel down from Window -> Document -> Target before bubbling.
> 2. **Capture Option Syntax**: Passing { capture: true } or true as third parameter registers listener for capturing phase.
> 3. **Execution Order**: Capturing listeners run BEFORE target phase and bubbling phase listeners.
> 
---

### Exercise 2: Top-Down Menu Overlay Dismissal Guard

**Scenario:** A UI component uses event capturing on the window object to intercept clicks during the capturing phase before inner menu elements handle click events.

**Requirements:**
1. Write registerTopDownDismissal(windowObj, dismissCallback).
2. Use windowObj.addEventListener("click", handler, { capture: true }).
3. Invoke dismissCallback.
4. Return detachment function.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function registerTopDownDismissal(windowObj, dismissCallback) {
>   if (!windowObj || typeof windowObj.addEventListener !== "function") return () => {};
>
>   function captureHandler(event) {
>     dismissCallback(event);
>   }
>
>   windowObj.addEventListener("click", captureHandler, { capture: true });
>
>   return function unbind() {
>     windowObj.removeEventListener("click", captureHandler, { capture: true });
>   };
> }
>
> // Verification tests
> let captureTriggered = false;
> const mockWindow = {
>   addEventListener(evt, fn, opts) { if (opts && opts.capture) captureTriggered = true; },
>   removeEventListener(evt, fn, opts) {}
> };
> registerTopDownDismissal(mockWindow, () => {});
> console.assert(captureTriggered === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Top-Down Capture Order**: Capturing listeners trigger as the event travels downwards from window to event target.
> 2. **Early Interception**: Allows global overlay handlers to execute before target or bubbling handlers fire.
> 3. **Matching Options for Unbinding**: removeEventListener must pass { capture: true } to remove capturing phase listeners.
> 
---

### Exercise 3: Capturing Phase Event Status Verification

**Scenario:** A DOM event auditor checks event.eventPhase to verify if an event is currently executing in the capturing phase (1).

**Requirements:**
1. Write isCapturingPhase(event).
2. Check if event.eventPhase === 1.
3. Return boolean indication.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isCapturingPhase(event) {
>   if (!event || typeof event.eventPhase !== "number") return false;
>   return event.eventPhase === 1;
> }
>
> // Verification tests
> console.assert(isCapturingPhase({ eventPhase: 1 }) === true, "Test 1 Failed");
> console.assert(isCapturingPhase({ eventPhase: 3 }) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Capturing Phase Constant**: Event.CAPTURING_PHASE has numerical value 1 in standard DOM specs.
> 2. **Event Flow Phase**: Phase 1 occurs prior to Phase 2 (AT_TARGET) and Phase 3 (BUBBLING_PHASE).
> 3. **Diagnostic Utility**: Verifies exact event dispatch phase inside complex composite components.
> 
---

## 6. Related Terms
- [Event Bubbling](event_bubbling.md) — The upward phase of event propagation.
- [event.stopPropagation()](event_stoppropagation.md) — Can be used during Capturing to stop the event from ever reaching the child target!

---

## 7. Key Takeaways
- Every event travels down the DOM tree (Capturing), hits the target, and travels back up (Bubbling).
- Capturing is rarely used in standard web development.
- To listen for an event during the capturing phase, pass `true` as the third argument to `addEventListener`.
