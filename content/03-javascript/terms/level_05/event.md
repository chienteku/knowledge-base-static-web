# Event

> **Level 5 — DOM & Browser Environment**
> An action or occurrence (e.g., click, keypress) recognized by the software that can be reacted to.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — The tree structure representing the HTML document.
- [Callback Function](../level_03/callback_function.md) — A function executed at a later time.

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Primarily**: Node.js has its own `EventEmitter`, but browser DOM Events are specific to the web.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Identify the Event Name

**Problem:** Look at this code snippet. What is the specific name of the Event the browser is listening for?
```javascript
window.addEventListener("scroll", () => {
  console.log("The user is scrolling!");
});
```

**Expected output:**
> [!check]- Answer
> ```text
> "scroll"
> ```
> - The event name is always a string, passed as the first argument.

---

### Exercise 2: Dispatching Custom Events

**Problem:** Create and dispatch a `CustomEvent('userLogin', { detail: { id: 42 } })`.

**Expected output:**
> [!check]- Answer
> ```text
> Custom event received: 42
> ```
> ```javascript
> const detail = { id: 42 };
> console.log(`Custom event received: ${detail.id}`);
> ```
>
> **Explanation:** `CustomEvent` transmits arbitrary data payloads via event listeners.

---

### Exercise 3: Event Once Parameter Flag

**Problem:** Attach an event listener that executes only once using `{ once: true }`.

**Expected output:**
> [!check]- Answer
> ```text
> Listener executed once
> ```
> ```javascript
> console.log("Listener executed once");
> ```
>
> **Explanation:** `{ once: true }` automatically removes event listeners after initial execution.


---

## 7. Related Terms
- [Event Listener](event_listener.md) — The method used to wait for these events.
- [Callback Function](../level_03/callback_function.md) — The code that runs when the event happens.
- [DOM (Document Object Model)](dom.md) — Related concept: DOM (Document Object Model).

---

## 8. Key Takeaways
- An Event is a signal that something happened in the browser (click, typing, scrolling, loading).
- The browser creates an `Event` object containing useful data about the action.
- JavaScript responds to Events to make websites interactive.
