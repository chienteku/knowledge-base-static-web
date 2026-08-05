# Event Delegation

> **Level 5 — DOM & Browser Environment**
> A pattern of attaching a single event listener to a parent element to handle events on multiple children.

---

## 1. Prerequisites
- [Event Bubbling](event_bubbling.md) — The upward phase of event propagation.
- [DOM (Document Object Model)](dom.md) — The tree structure of the page.

---

## 2. Term Category
- **Design Pattern / Performance Optimization**

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a shopping cart list with 1,000 items. Next to each item is a "Delete" button. The naive approach is to use `querySelectorAll` to find all 1,000 buttons and attach 1,000 separate `addEventListener` functions to them. This consumes a massive amount of computer memory and makes the page slow. Furthermore, if the user adds a *new* item to the cart later, you have to manually remember to attach a new listener to that specific new button.

**Event Delegation** solves this brilliantly by taking advantage of *Event Bubbling*. Instead of attaching 1,000 listeners to the 1,000 children, you attach **one single listener** to the parent container (`<ul>`). When any child button is clicked, the click event bubbles up to the `<ul>`. The `<ul>` listener checks `event.target` to see exactly which button was clicked, and performs the action. It uses less memory and automatically works on new items added in the future!

### (2) Reality Metaphor
Imagine a massive corporation with 1,000 employees. If an employee has a complaint, they could hire 1,000 separate HR representatives to stand next to each employee at all times (Attaching 1,000 listeners). 
Alternatively, the company can hire just ONE HR representative who sits at the exit door (the Parent element). When an employee leaves the building, they hand their complaint to the HR rep. The HR rep looks at the employee's ID badge (`event.target`) to see who they are and handles the issue. This is Event Delegation.

### (3) JavaScript Code Examples

#### Short Snippet
```html
<ul id="todo-list">
  <li>Buy groceries <button class="delete-btn">X</button></li>
  <li>Walk the dog <button class="delete-btn">X</button></li>
</ul>
```
```javascript
const list = document.querySelector("#todo-list");

// ONE listener on the parent!
list.addEventListener("click", (event) => {
  // Check if the actual thing that was clicked was a delete button
  if (event.target.classList.contains("delete-btn")) {
    console.log("Delete button clicked!");
    // Remove the <li> that holds the button
    event.target.parentElement.remove(); 
  }
});
```

#### Fuller Example: Dynamic Elements
```javascript
const parentMenu = document.querySelector("#menu");
const addBtn = document.querySelector("#add-item");

// Delegation: The parent listens for clicks on ANY 'menu-item'
parentMenu.addEventListener("click", (e) => {
  if (e.target.className === "menu-item") {
    console.log(`You chose: ${e.target.innerText}`);
  }
});

// Watch what happens when we dynamically add a NEW item!
addBtn.addEventListener("click", () => {
  const newItem = document.createElement("div");
  newItem.className = "menu-item";
  newItem.innerText = "Brand New Item";
  parentMenu.appendChild(newItem);
  
  // Notice we DID NOT attach a new event listener to 'newItem'.
  // But because of Delegation, clicking it will still work perfectly!
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Delegation Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Event Delegation blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "event_delegation";
```

*Fix:*
```javascript
let value = "event_delegation";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Event Delegation Callbacks

**The mistake:** Passing methods from Event Delegation instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "event_delegation",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "event_delegation",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Event Delegation Operations

**The mistake:** Executing asynchronous operations within Event Delegation without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/event_delegation"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/event_delegation");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in event_delegation: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The `matches` method

**Problem:** You have a delegated click listener on a parent `<div>`. You only want the code to run if the user clicked an element with the `data-action="save"` attribute. How do you write the `if` statement?

**Expected output:**
> [!check]- Answer
> ```javascript
> if (event.target.matches('[data-action="save"]')) {
>   // save logic...
> }
> ```
> - `element.matches('css-selector')` is the cleanest way to check if `event.target` is the element you want!

---

### Exercise 2: Event Delegation Pattern with `closest()`

**Problem:** Attach 1 listener to parent `<ul>` and handle dynamic `<li>` clicks using `event.target.closest('li')`.

**Expected output:**
> [!check]- Answer
> ```text
> Delegated li clicked: item-1
> ```
> ```javascript
> const target = { closest: (sel) => ({ dataset: { id: "item-1" } }) };
> const li = target.closest("li");
> console.log(`Delegated li clicked: ${li.dataset.id}`);
> ```
>
> **Explanation:** Event delegation routes clicks on child elements to a single shared parent listener.

---

### Exercise 3: Performance Benefits of Event Delegation

**Problem:** Explain why event delegation avoids attaching 1,000 separate event listeners to dynamic list items.

**Expected output:**
> [!check]- Answer
> ```text
> Single listener handles 1000 dynamic items
> ```
> ```javascript
> console.log("Single listener handles 1000 dynamic items");
> ```
>
> **Explanation:** Delegating events to parent elements conserves memory and handles dynamically inserted elements automatically.


---

## 7. Related Terms
- [Event Bubbling](event_bubbling.md) — The mechanical process that makes Delegation possible.
- [Event Bubbling](event_bubbling.md) — The property used to identify the specific child that fired the event.
- [DOM Traversal](dom_traversal.md) — Related concept: DOM Traversal.
- [Event object](event_object.md) — Related concept: Event object.
- [event.target vs event.currentTarget](event_target_currenttarget.md) — Related concept: event.target vs event.currentTarget.
- [Event Listener](event_listener.md) — Related concept: Event Listener.

---

## 8. Key Takeaways
- Event Delegation is a performance optimization pattern.
- It involves placing a single listener on a parent element instead of multiple listeners on child elements.
- It relies on Event Bubbling to catch child events as they rise up.
- It automatically handles elements that are dynamically added to the page later.
- Always use `event.target` to verify exactly what was clicked.
