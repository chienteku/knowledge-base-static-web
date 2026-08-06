# event.stopPropagation()

> **Level 5 — DOM & Browser Environment**
> Prevents further propagation (bubbling or capturing) of the current event.

---

## 1. Prerequisites
- [Event Bubbling](event_bubbling.md) — Events traveling up the DOM tree.
- [Event Capturing](event_capturing.md) — Events traveling down the DOM tree.

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Event Bubbling is incredibly useful for patterns like Event Delegation. However, there are times when you specifically *do not* want a parent to know that a child was clicked. 

For example, imagine a large clickable "Card" element that links to a user's profile. Inside that card, there is a small "Like" button. If the user clicks the "Like" button, the click event bubbles up to the "Card", and the browser navigates away to the profile page instead of just liking the post! `event.stopPropagation()` was designed to "pop the bubble". When called inside a listener, it stops the event from traveling any further up the DOM tree.

### (2) Reality Metaphor
Imagine a rumor starting at the bottom of a company. An intern tells a manager, who tells a director, who tells the CEO (Event Bubbling). 
`stopPropagation()` is like the manager hearing the rumor and deciding to keep it a secret. They deal with the situation locally and explicitly refuse to pass the information up the chain of command. The director and CEO never even know it happened.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const childBtn = document.querySelector("#child");

childBtn.addEventListener("click", (event) => {
  // Do the child's specific action
  console.log("Child button clicked!");
  
  // POP the bubble! The parent will never know this happened.
  event.stopPropagation();
});
```

#### Fuller Example: The Nested Click Problem
```html
<!-- Clicking the card opens the profile. Clicking the heart 'likes' the post. -->
<div class="card" onclick="openProfile()">
  <h2>Alice's Post</h2>
  <button class="heart-btn">❤️ Like</button>
</div>
```
```javascript
const heartBtn = document.querySelector(".heart-btn");

heartBtn.addEventListener("click", (event) => {
  // If we don't use stopPropagation, the click will bubble up to the .card
  // and trigger openProfile(), ripping the user away from the page!
  
  event.stopPropagation(); 
  
  console.log("Post liked! Staying on the same page.");
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Stoppropagation Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Stoppropagation blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_stoppropagation";
```

*Fix:*
```javascript
let value = "event_stoppropagation";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Stoppropagation Callbacks

**The mistake:** Passing methods from Event Stoppropagation instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_stoppropagation",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_stoppropagation",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Stoppropagation Operations

**The mistake:** Executing asynchronous operations within Event Stoppropagation without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_stoppropagation"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_stoppropagation");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_stoppropagation: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Pop

**Problem:** You have a `<body>` listener that logs "Body Clicked", and a `<button>` listener that logs "Button Clicked". You add `event.stopPropagation()` inside the button listener. If you click the button, what exactly logs to the console?

**Expected output:**
> [!check]- Answer
> ```text
> "Button Clicked"
> (The "Body Clicked" log will not run because the bubble was popped before it reached the body).
> ```
> - The element that was actually clicked (the target) still fires its listener normally. It's the *ancestors* that are kept in the dark.
> 
---

### Exercise 2: Halting Sibling Handlers with `stopImmediatePropagation`

**Problem:** Call `event.stopImmediatePropagation()` to prevent subsequent click handlers on current element from running.

**Expected output:**
> [!check]- Answer
> ```text
> Handler 1 executed; siblings halted
> ```
> ```javascript
> console.log("Handler 1 executed; siblings halted");
> ```
>
> **Explanation:** `stopImmediatePropagation()` halts all remaining event listener callbacks registered on current target elements.
> 
---

### Exercise 3: Propagation Stopping vs Default Prevention

**Problem:** Explain difference between `stopPropagation()` (halts bubbling) and `preventDefault()` (halts browser default action).

**Expected output:**
> [!check]- Answer
> ```text
> stopPropagation: DOM tree traversal, preventDefault: Browser action
> ```
> ```javascript
> console.log("stopPropagation: DOM tree traversal, preventDefault: Browser action");
> ```
>
> **Explanation:** Propagation controls event flow through DOM nodes; default prevention controls native browser UI behaviors.
> 
---

## 7. Related Terms
- [event.preventDefault()](event_preventdefault.md) — Stops default browser behaviors, but doesn't stop bubbling.
- [Event Bubbling](event_bubbling.md) — The process that `stopPropagation` is designed to halt.
- [Event Capturing](event_capturing.md) — Related concept: Event Capturing.

---

## 8. Key Takeaways
- `stopPropagation()` halts the event's journey through the DOM tree.
- It prevents parent elements from firing their event listeners for that specific event.
- It is crucial when dealing with nested interactive elements (like a button inside a clickable card).
- Do not overuse it, as it can break Event Delegation setups higher up in the DOM.
