# Event

> **Level 5 — DOM & Browser Environment**
> An action or occurrence (e.g., click, keypress) recognized by the software that can be reacted to.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — The tree structure representing the HTML document.
- [Callback Function](../level_03/callback_function.md) — A function executed at a later time.

---

## 2. Term Category

**Web API *(Browser Environment)* (Browser Primarily: Node.js has its own `EventEmitter`, but browser DOM Events are specific to the web.)**: Event is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A static webpage just sits there. To make a webpage interactive, the browser needs to know when the user actually does something. Does the user click the mouse? Do they scroll down? Do they type on the keyboard? Does the browser finish loading an image?

To track all this, the browser creators designed a system of "Events". Every time something happens in the browser, the browser creates an invisible "Event Object" that contains data about what just happened (e.g., the X and Y coordinates of the mouse click, or the specific key that was pressed). JavaScript can "listen" for these events and run code in response, creating a dynamic, interactive experience.

### (2) Reality Metaphor
An Event is like the doorbell ringing at your house. 
The action of pressing the button creates a signal (the Event). The signal itself doesn't automatically open the door; it just announces that something happened. It's up to you (the JavaScript code) to decide if you want to respond to that ring by opening the door.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is the fundamental idea: 
// 1. Find an element.
// 2. Wait for an EVENT (like "click").
// 3. React to it.

const button = document.querySelector("#myBtn");

button.addEventListener("click", () => {
  console.log("The button was clicked!");
});
```

#### Fuller Example: The Event Object
```javascript
const textInput = document.querySelector("#username");

// The browser automatically passes the "Event Object" into our callback function!
// We usually abbreviate it as 'e' or 'event'.
textInput.addEventListener("keydown", (event) => {
  console.log(`You pressed the key: ${event.key}`);
  
  if (event.key === "Enter") {
    console.log("Submitting the form!");
  }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event";
```

*Fix:*
```javascript
let value = "event";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Callbacks

**The mistake:** Passing methods from Event instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Operations

**The mistake:** Executing asynchronous operations within Event without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Custom Synthetic Event Dispatcher

**Scenario:** A component library creates and dispatches custom synthetic events using CustomEvent and dispatchEvent().

**Requirements:**
1. Write dispatchCustomWidgetEvent(targetEl, eventName, detailPayload).
2. Create CustomEvent with detail payload.
3. Invoke targetEl.dispatchEvent().
4. Return boolean indicating if event was not prevented.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchCustomWidgetEvent(targetEl, eventName, detailPayload) {
>   if (!targetEl || typeof targetEl.dispatchEvent !== "function") return false;
>
>   const customEvent = new globalThis.CustomEvent(eventName, {
>     detail: detailPayload,
>     bubbles: true,
>     cancelable: true
>   });
>
>   return targetEl.dispatchEvent(customEvent);
> }
>
> // Verification tests
> let eventFired = false;
> globalThis.CustomEvent = function(name, opts) {
>   this.type = name;
>   this.detail = opts.detail;
> };
> const mockTarget = {
>   dispatchEvent(evt) { eventFired = true; return true; }
> };
>
> dispatchCustomWidgetEvent(mockTarget, "widgetOpen", { id: 42 });
> console.assert(eventFired === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **CustomEvent Constructor**: new CustomEvent(name, { detail, bubbles, cancelable }) initializes custom synthetic events carrying custom data.
> 2. **dispatchEvent() Method**: Dispatches an Event at the specified EventTarget, invoking affected event listeners synchronously.
> 3. **detail Property**: The detail property passes custom payload data into listener callbacks.
> 
---

### Exercise 2: Event Subscription & Unsubscribe Registry

**Scenario:** An event bus manager registers event listener callbacks and returns an unsubscribe function.

**Requirements:**
1. Write subscribeToEvent(targetEl, eventName, listenerFn).
2. Attach addEventListener.
3. Return unsubscribe function calling removeEventListener.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function subscribeToEvent(targetEl, eventName, listenerFn) {
>   if (!targetEl || typeof targetEl.addEventListener !== "function") return () => {};
>
>   targetEl.addEventListener(eventName, listenerFn);
>
>   return function unsubscribe() {
>     targetEl.removeEventListener(eventName, listenerFn);
>   };
> }
>
> // Verification tests
> let added = false, removed = false;
> const mockTarget = {
>   addEventListener(e, fn) { added = true; },
>   removeEventListener(e, fn) { removed = true; }
> };
> const unsub = subscribeToEvent(mockTarget, "click", () => {});
> console.assert(added === true, "Test 1 Failed");
> unsub();
> console.assert(removed === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Observer Pattern**: Subscribing and unsubscribing cleanly manages event lifecycle bindings.
> 2. **Memory Leak Prevention**: Unsubscribing prevents retaining detached DOM element references in listener sets.
> 3. **Synchronous Dispatch**: Event listeners execute synchronously when events trigger.
> 
---

### Exercise 3: Event Phase Inspector & Logging

**Scenario:** A diagnostic logging tool inspects event.eventPhase during event dispatch.

**Requirements:**
1. Write logEventPhase(event).
2. Inspect event.eventPhase.
3. Return phase name ("NONE", "CAPTURING_PHASE", "AT_TARGET", "BUBBLING_PHASE").

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function logEventPhase(event) {
>   if (!event || typeof event.eventPhase !== "number") return "UNKNOWN";
>
>   switch (event.eventPhase) {
>     case 0: return "NONE";
>     case 1: return "CAPTURING_PHASE";
>     case 2: return "AT_TARGET";
>     case 3: return "BUBBLING_PHASE";
>     default: return "UNKNOWN";
>   }
> }
>
> // Verification tests
> console.assert(logEventPhase({ eventPhase: 2 }) === "AT_TARGET", "Test 1 Failed");
> console.assert(logEventPhase({ eventPhase: 3 }) === "BUBBLING_PHASE", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **eventPhase Property**: Indicates current phase of event flow (1 = Capturing, 2 = Target, 3 = Bubbling).
> 2. **Event Lifecycle Tracking**: Useful for debugging complex nested event listeners across capturing and bubbling phases.
> 3. **Standard W3C Event Model**: Follows standard DOM level 2/3 event specification constants.
---

## 6. Related Terms
- [Event Listener](event_listener.md) — The method used to wait for these events.
- [Callback Function](../level_03/callback_function.md) — The code that runs when the event happens.
- [DOM (Document Object Model)](dom.md) — Related concept: DOM (Document Object Model).

---

## 7. Key Takeaways
- An Event is a signal that something happened in the browser (click, typing, scrolling, loading).
- The browser creates an `Event` object containing useful data about the action.
- JavaScript responds to Events to make websites interactive.
