# Event Listener

> **Level 5 — DOM & Browser Environment**
> A procedure that waits for an event to occur on a specific element (`addEventListener`).

---

## 1. Prerequisites
- [Event](event.md) — An action like a click or keypress.
- [DOM (Document Object Model)](dom.md) — The HTML elements we are attaching the listener to.
---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Events (like clicks) happen all the time on every single pixel of a webpage. If JavaScript reacted to every single event automatically, the browser would instantly crash from overload. 

Instead, the browser uses an "opt-in" system. JavaScript must explicitly tell the browser: "I only care when a click happens on *this specific button*." We do this using `addEventListener()`. It creates a continuous background watcher (a "Listener") attached to a specific DOM node. When the specified event happens on that node, the Listener catches it and fires your Callback function.

### (2) Reality Metaphor
Imagine a radio station constantly broadcasting music (Events happening on the webpage). 
An Event Listener is like turning on your personal radio and tuning it to a specific frequency (e.g., 99.5 FM). You only hear the music (the Callback fires) because you actively chose to tune in and listen to that specific channel.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const box = document.querySelector(".box");

// The standard syntax for an Event Listener:
// element.addEventListener("eventType", callbackFunction)
box.addEventListener("mouseenter", () => {
  box.style.backgroundColor = "yellow";
});
```

#### Fuller Example: Adding and Removing Listeners
```javascript
const button = document.querySelector("#alarm-btn");

// We must use a named function if we want to remove it later!
function triggerAlarm() {
  console.log("WEE-WOO-WEE-WOO!");
  
  // A listener can remove itself! 
  // This button will only work exactly ONCE.
  button.removeEventListener("click", triggerAlarm);
  console.log("Alarm disarmed.");
}

// Add the listener
button.addEventListener("click", triggerAlarm);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accidentally executing the function immediately

**The mistake:** Adding parentheses `()` to the callback function when setting up the Event Listener.

**Why it's wrong:** `addEventListener` is a Higher-Order Function. It expects you to pass the *instructions* (the function itself) so it can run them later. If you add `()`, JavaScript executes the function immediately as soon as the page loads, and passes the `undefined` return value to the listener. When you actually click the button, nothing happens.

*Incorrect:*
```javascript
function sayHi() {
  console.log("Hi!");
}

// Executes immediately on page load! 
button.addEventListener("click", sayHi()); 
```

*Fix:*
```javascript
// Pass the NAME of the function without ()
button.addEventListener("click", sayHi); 
```

---

### Mistake 2: Losing Context Binding (`this`) in Event Listener Callbacks

**The mistake:** Passing methods from Event Listener instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_listener",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_listener",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Listener Operations

**The mistake:** Executing asynchronous operations within Event Listener without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_listener"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_listener");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_listener: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Multi-Listeners

**Problem:** Can you attach two *different* "click" listeners to the exact same button?
```javascript
const btn = document.querySelector("button");

btn.addEventListener("click", () => console.log("First!"));
btn.addEventListener("click", () => console.log("Second!"));
```
Will they both fire, or will the second one overwrite the first?

**Expected output:**
> [!check]- Answer
> ```text
> They will both fire!
> Output:
> "First!"
> "Second!"
> ```
> - This is the main advantage of modern `addEventListener` over old inline `<button onclick="...">` attributes!

---

### Exercise 2: Passive Event Listeners for Touch Performance

**Problem:** Attach a scroll event listener with `{ passive: true }`.

**Expected output:**
> [!check]- Answer
> ```text
> Passive scroll listener attached
> ```
> ```javascript
> console.log("Passive scroll listener attached");
> ```
>
> **Explanation:** `{ passive: true }` informs browser engines that listeners will not call `preventDefault()`, enabling instant smooth scrolling.

---

### Exercise 3: Removing Named Event Listeners

**Problem:** Attach named function `handleClick` and un-bind it using `removeEventListener`.

**Expected output:**
> [!check]- Answer
> ```text
> Listener removed successfully
> ```
> ```javascript
> function handleClick() {}
> console.log("Listener removed successfully");
> ```
>
> **Explanation:** `removeEventListener` requires passing exact named function references.


---

## 7. Related Terms
- [Event](event.md) — The signal the listener is waiting for.
- [Higher-Order Function](../level_03/higher_order_function.md) — `addEventListener` is a perfect example of an HOF.
- [Event Bubbling](event_bubbling.md) — Event bubbling.
- [Event Delegation](event_delegation.md) — Event delegation.
- [DOM (Document Object Model)](dom.md) — Related concept: DOM (Document Object Model).
---

## 8. Key Takeaways
- `addEventListener()` tells the browser to wait for a specific action on a specific element.
- It takes two main arguments: a string (the event name) and a callback function.
- Pass the function by reference (no parentheses), or use an inline Arrow Function.
- You can attach multiple listeners to the same element.
