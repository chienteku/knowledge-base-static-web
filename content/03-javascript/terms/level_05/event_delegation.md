# Event Delegation

> **Level 5 — DOM & Browser Environment**
> A pattern of attaching a single event listener to a parent element to handle events on multiple children.

---

## 1. Prerequisites
- [Event Bubbling](event_bubbling.md) — The upward phase of event propagation.
- [DOM (Document Object Model)](dom.md) — The tree structure of the page.

---

## 2. Term Category

**Design Pattern / Performance Optimization (Browser Only)**: Event Delegation is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic List Event Delegation Handler

**Scenario:** An interactive list attaches a single click listener to parent <ul> container, delegating event processing for dynamically added <li> item buttons.

**Requirements:**
1. Write delegateListClick(event, buttonClass, actionCallback).
2. Check if event.target matches buttonClass via .closest().
3. Invoke actionCallback if matched.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function delegateListClick(event, buttonClass, actionCallback) {
>   if (!event || !event.target) return false;
>   const button = typeof event.target.closest === "function" ? event.target.closest("." + buttonClass) : null;
>   if (button) {
>     actionCallback(button);
>     return true;
>   }
>   return false;
> }
>
> // Verification tests
> const mockBtn = { className: "delete-btn" };
> const mockEvt = {
>   target: {
>     closest(sel) { return sel === ".delete-btn" ? mockBtn : null; }
>   }
> };
> let handledBtn = null;
> delegateListClick(mockEvt, "delete-btn", btn => { handledBtn = btn; });
> console.assert(handledBtn === mockBtn, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Delegation Pattern**: Attaching a single event listener to a parent element to manage events for all current and future child elements.
> 2. **Memory Optimization**: Dramatically reduces total event listener allocations in large or dynamic DOM lists.
> 3. **Dynamic Child Support**: Automatically handles events for newly inserted child nodes without re-binding listeners.
> 
---

### Exercise 2: Infinite Scroll List Item Event Delegation

**Scenario:** An infinite scroll feed delegates item action clicks to a single top-level container, handling dynamically appended items seamlessly.

**Requirements:**
1. Write setupFeedDelegation(feedContainer, actionCallback).
2. Listen to click event on feedContainer.
3. Inspect event.target for data-action.
4. Invoke actionCallback(action, itemId).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupFeedDelegation(feedContainer, actionCallback) {
>   if (!feedContainer || typeof feedContainer.addEventListener !== "function") return false;
>
>   feedContainer.addEventListener("click", (event) => {
>     const actionBtn = event.target ? event.target.closest("[data-action]") : null;
>     if (actionBtn) {
>       const action = actionBtn.dataset.action;
>       const itemId = actionBtn.dataset.id;
>       actionCallback(action, itemId);
>     }
>   });
>   return true;
> }
>
> // Verification tests
> let actionFired = null;
> const mockBtn = { dataset: { action: "like", id: "101" } };
> const mockEvt = { target: { closest(sel) { return mockBtn; } } };
> const mockContainer = {
>   addEventListener(evt, fn) { fn(mockEvt); }
> };
>
> setupFeedDelegation(mockContainer, (act, id) => { actionFired = `${act}:${id}`; });
> console.assert(actionFired === "like:101", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Node Delegation**: Event delegation eliminates the need to attach listeners to newly appended infinite scroll items.
> 2. **Memory Optimization**: Replaces hundreds of individual event listeners with a single container listener.
> 3. **Dataset Attribute Inspection**: Uses data-* attributes to extract item action parameters directly from clicked elements.
> 
---

### Exercise 3: Form Field Change Delegation Engine

**Scenario:** A dynamic form engine listens for 'change' events at the <form> level to track form field updates centrally.

**Requirements:**
1. Write delegateFormChange(formEl, changeCallback).
2. Listen to change event on formEl.
3. Extract field name and value.
4. Invoke changeCallback(fieldName, fieldValue).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function delegateFormChange(formEl, changeCallback) {
>   if (!formEl || typeof formEl.addEventListener !== "function") return false;
>
>   formEl.addEventListener("change", (event) => {
>     const field = event.target;
>     if (field && field.name) {
>       changeCallback(field.name, field.value);
>     }
>   });
>   return true;
> }
>
> // Verification tests
> let updatedField = null;
> const mockInput = { name: "email", value: "alice@test.com" };
> const mockEvt = { target: mockInput };
> const mockForm = {
>   addEventListener(evt, fn) { fn(mockEvt); }
> };
>
> delegateFormChange(mockForm, (name, val) => { updatedField = `${name}=${val}`; });
> console.assert(updatedField === "email=alice@test.com", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Centralized Form Tracking**: Delegating form input events to the parent form centralizes data collection.
> 2. **Bubbling Change Events**: The change event bubbles up from input/select/textarea controls to parent forms.
> 3. **Dynamic Input Support**: Automatically captures changes on dynamically injected input fields.
> 
---

## 6. Related Terms
- [Event Bubbling](event_bubbling.md) — The mechanical process that makes Delegation possible.
- [Event Bubbling](event_bubbling.md) — The property used to identify the specific child that fired the event.
- [DOM Traversal](dom_traversal.md) — Related concept: DOM Traversal.
- [Event object](event_object.md) — Related concept: Event object.
- [event.target vs event.currentTarget](event_target_currenttarget.md) — Related concept: event.target vs event.currentTarget.
- [Event Listener](event_listener.md) — Related concept: Event Listener.

---

## 7. Key Takeaways
- Event Delegation is a performance optimization pattern.
- It involves placing a single listener on a parent element instead of multiple listeners on child elements.
- It relies on Event Bubbling to catch child events as they rise up.
- It automatically handles elements that are dynamically added to the page later.
- Always use `event.target` to verify exactly what was clicked.
