# event.preventDefault()

> **Level 5 — DOM & Browser Environment**
> A method to prevent the browser's default action for a specific event (e.g., preventing a form submission).

---

## 1. Prerequisites
- [Event Object](../level_05/event.md) — The object automatically passed into an event listener.
- [DOM](../level_05/dom.md) — The HTML elements that trigger these events.

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Certain HTML elements have "default behaviors" hardcoded into the browser. 
- If you click an `<a>` link, the browser navigates to a new page.
- If you click a `<button>` inside a `<form>`, the browser immediately refreshes the page and tries to send the form data to a server.

In modern Single Page Applications (like React or Vue), we rarely want the browser to navigate away or refresh the page. We want JavaScript to handle the routing and the data submission quietly in the background. `event.preventDefault()` was designed as a command you can issue inside your event listener to tell the browser: "I know you want to do your default action, but stop. I will handle this with my own JavaScript."

### (2) Reality Metaphor
Imagine you are at a restaurant and a waiter brings you a plate of extremely spicy food. The "default human behavior" is to immediately grab a glass of water and drink it. 
However, your friend (the JavaScript) grabs your arm and yells, "`preventDefault()`! Don't drink water, it makes the spice worse! Drink this milk instead." Your friend stopped the automatic reflex so they could implement a better custom solution.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const link = document.querySelector("#my-link");

link.addEventListener("click", (event) => {
  // Stop the browser from navigating to the URL!
  event.preventDefault();
  
  console.log("You clicked the link, but we stayed on the same page.");
});
```

#### Fuller Example: Form Submission
```html
<form id="login-form">
  <input type="text" placeholder="Username" />
  <button type="submit">Login</button>
</form>
```
```javascript
const form = document.querySelector("#login-form");

form.addEventListener("submit", (event) => {
  // CRITICAL: Stop the page from refreshing!
  event.preventDefault();
  
  // Now we can gather the data and send it via an API in the background
  console.log("Validating user...");
  // fetch('/api/login', ...)
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Preventdefault Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Preventdefault blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_preventdefault";
```

*Fix:*
```javascript
let value = "event_preventdefault";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Preventdefault Callbacks

**The mistake:** Passing methods from Event Preventdefault instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_preventdefault",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_preventdefault",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Preventdefault Operations

**The mistake:** Executing asynchronous operations within Event Preventdefault without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_preventdefault"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_preventdefault");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_preventdefault: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Right-Click Menu

**Problem:** The default browser behavior for the `"contextmenu"` event is to open the right-click menu. Write an event listener on the `document` that prevents the right-click menu from ever opening anywhere on the page.

**Expected output:**
```javascript
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
```

> [!check]- Answer
> - Pass the event object `e` or `event` into your arrow function.
> - Call `.preventDefault()` on that object.

---

### Exercise 2: Cancelling Link Navigation

**Problem:** Cancel link click navigation using `e.preventDefault()`.

**Expected output:**
```text
Navigation canceled
```

> [!check]- Answer
> ```javascript
> console.log("Navigation canceled");
> ```
>
> **Explanation:** `preventDefault()` halts default link redirection.

### Exercise 3: Checking `defaultPrevented` Property

**Problem:** Check `event.defaultPrevented` boolean property after calling `preventDefault()`.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> const evt = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
> evt.preventDefault();
> console.log(evt.defaultPrevented);
> ```
>
> **Explanation:** `defaultPrevented` indicates whether downstream listeners or handlers invoked `preventDefault()`.

---

---

## 7. Related Terms
- [`event.stopPropagation()`](../level_05/event_stoppropagation.md) — Stops the event from bubbling up, but does *not* stop default browser behaviors.

---

## 8. Key Takeaways
- `preventDefault()` stops the browser from executing its hardcoded default behavior for a specific element.
- It is most commonly used to stop `<form>` elements from refreshing the page upon submission.
- It is also used to stop `<a>` tags from navigating to a new URL.
- It does **not** stop Event Bubbling.
