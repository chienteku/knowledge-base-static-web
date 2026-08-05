# DOM Traversal

> **Level 5 — DOM & Browser Environment**
> `parentNode`, `children`, `nextSibling`, `closest`.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — The structured tree API of HTML nodes.
- [Node](node.md) — A single point in the DOM tree.
---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing interactive web interfaces, you often start with an element reference and need to access other elements near it. For example, if a user clicks a "Delete" button inside a list item, JavaScript needs to navigate from the button to the enclosing list item (`<li>`) to delete it.

Rather than running slow, global document searches (like `document.querySelector`) to find related elements, browser engines expose **DOM Traversal** properties. Traversal allows you to move directly between adjacent nodes in three directions:
1. **Upward (Ancestors):** Find parent elements using `parentNode` or look up the tree to locate the nearest container using `closest(selector)`.
2. **Downward (Descendants):** Target child nodes using `children` or boundary child properties like `firstElementChild`.
3. **Sideways (Siblings):** Target elements immediately next to the current node using `nextElementSibling` or `previousElementSibling`.

### (2) Reality Metaphor
DOM Traversal is like navigating a corporate organizational chart.
- You are a mid-level worker (current node).
- **`parentNode`** is like looking directly up to check who your immediate supervisor is.
- **`closest(selector)`** is like looking up the chain of command to find the nearest manager who belongs to the "finance department" (selector).
- **`children`** is like looking down at the team of employees you directly manage.
- **`nextElementSibling`** is like looking at the coworker sitting at the desk immediately to your right.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const activeItem = document.querySelector(".item.active");

// Navigate sideways to the next item
const nextItem = activeItem.nextElementSibling;

// Navigate upward to find the list container
const listContainer = activeItem.parentNode;
```

#### Fuller Example
```javascript
// A task list delete action simulating event handling and parent lookups
function setupDeleteHandlers() {
  if (typeof document === "undefined") return;

  const deleteBtn = document.querySelector(".delete-btn");

  deleteBtn.addEventListener("click", function(event) {
    const clickedButton = event.target;

    // Goal: Remove the entire task card containing this button.
    // clickedButton is nested deep: <div class="task-card"><p>Buy Milk</p><button class="delete-btn">x</button></div>
    
    // 1. closest(selector) scans upwards looking for the matching container element
    const containingCard = clickedButton.closest(".task-card");
    
    if (containingCard) {
      // 2. We can traverse to the parent of the card to delete it
      const listParent = containingCard.parentNode;
      listParent.removeChild(containingCard);
      console.log("Task card successfully deleted.");
    }
  });
}

// Inspecting children
const mainList = document.querySelector("#todo-list");
// children returns a live HTMLCollection of elements (ignoring text/whitespace)
const listItems = mainList.children; 
console.log(`The list has ${listItems.length} elements.`);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `nextSibling` with `nextElementSibling`

**The mistake:** Using `nextSibling` or `previousSibling` expecting to get the next HTML element.

**Why it's wrong:** The DOM tree contains multiple types of nodes. The properties `nextSibling`, `previousSibling`, and `childNodes` include text nodes (representing blank lines, tab indentations, or spaces in your HTML markup). `nextElementSibling` and `children` ignore text nodes and strictly return HTML elements.

*Incorrect:*
```html
<!-- HTML structure: -->
<div id="parent">
  <span id="first">A</span>
  <span id="second">B</span>
</div>
```
```javascript
const firstSpan = document.getElementById("first");
const sibling = firstSpan.nextSibling;

console.log(sibling.nodeName); // "#text" (Represents the space/newline between the tags!)
```

*Fix:*
```javascript
const firstSpan = document.getElementById("first");
// Use nextElementSibling to skip text nodes
const sibling = firstSpan.nextElementSibling; 

console.log(sibling.nodeName); // "SPAN"
console.log(sibling.textContent); // "B"
```

---

### Mistake 2: Losing Context Binding (`this`) in Dom Traversal Callbacks

**The mistake:** Passing methods from Dom Traversal instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "dom_traversal",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "dom_traversal",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Dom Traversal Operations

**The mistake:** Executing asynchronous operations within Dom Traversal without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dom_traversal"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dom_traversal");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dom_traversal: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Highlight Sibling

**Problem:** Complete the code to find the element with ID `"target"` and add the class `"highlight"` to its immediate next element sibling.

```javascript
if (typeof document !== "undefined") {
  const target = document.getElementById("target");
  
  // Find next sibling element
  // Add highlight class
}
```

> [!check]- Answer
> - Use `target.nextElementSibling` to target the next element.
> - Call `.classList.add("highlight")` on it.

---

### Exercise 2: Finding Ancestor Elements with `closest()`

**Problem:** Find nearest ancestor matching `.card` using `elem.closest(".card")`.

**Expected output:**
> [!check]- Answer
> ```text
> .card ancestor found
> ```
> ```javascript
> console.log(".card ancestor found");
> ```
>
> **Explanation:** `Element.closest(selector)` traverses upward through parent nodes until a matching selector is found.

---

### Exercise 3: Sibling Traversal with `nextElementSibling`

**Problem:** Traverse to next sibling element using `elem.nextElementSibling`.

**Expected output:**
> [!check]- Answer
> ```text
> Next sibling element traversed
> ```
> ```javascript
> console.log("Next sibling element traversed");
> ```
>
> **Explanation:** `nextElementSibling` skips whitespace text nodes to return adjacent HTML elements.


---

## 7. Related Terms
- [Event Delegation](event_delegation.md) — An event pattern that heavily relies on `.closest()` to identify event sources.
---

## 8. Key Takeaways
- DOM Traversal is the technique of navigating up, down, or sideways from an existing element reference.
- Upward lookup: `parentNode` targets the parent; `closest(selector)` scans upwards to find the nearest matching ancestor element.
- Downward lookup: `children` targets a live list of child elements (ignoring text/whitespace nodes).
- Sideways lookup: `nextElementSibling` / `previousElementSibling` target neighboring HTML element siblings.
- Avoid using `nextSibling` or `childNodes` unless you explicitly want to inspect raw layout text nodes and code spaces.
