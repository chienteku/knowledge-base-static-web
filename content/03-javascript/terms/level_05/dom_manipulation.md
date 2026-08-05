# DOM Manipulation (createElement, appendChild, remove)

> **Level 5 — DOM & Browser Environment**
> Create/insert/delete nodes dynamically.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — The structured tree API of HTML nodes.
- [Node](node.md) — A single point in the DOM tree.
- [document object](document_object.md) — The entry point gateway to the DOM tree.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Static HTML files are immutable on the user's screen once loaded. To build interactive web applications—like displaying new chat messages, rendering items in a shopping cart, or hiding alerts—JavaScript needs to dynamically modify the document tree structure at runtime. This process is called **DOM Manipulation**.

The browser DOM API provides three core stages of node lifecycle controls:
1. **Creation (`document.createElement`):** Allocates a fresh element node in system memory. Initially, this element is "orphaned"—it exists in memory but is not yet attached to the webpage.
2. **Insertion (`appendChild` / `insertBefore`):** Snaps the orphaned element into the active DOM tree under a parent element.
3. **Deletion (`remove` / `removeChild`):** Detaches the element from the DOM tree, removing it from the user's screen.

### (2) Reality Metaphor
Imagine a plastic Lego pegboard representing your webpage. 
- **`document.createElement("div")`** is like opening a Lego storage box and pulling out a new blue brick. The brick is sitting in your hands (memory); you can color it or draw on it, but it isn't visible on the display layout yet.
- **`appendChild`** is the act of physically snapping the new brick onto a peg under a larger structure (the parent element) on the pegboard.
- **`remove()`** is like grabbing that brick and pulling it off the pegboard, making it disappear from the model.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 1. Create a new div element in memory
const alertBox = document.createElement("div");
alertBox.textContent = "Operation successful!";

// 2. Append the div to the document body to make it visible
document.body.appendChild(alertBox);

// 3. Remove the alert box from the screen
alertBox.remove();
```

#### Fuller Example
```javascript
// Dynamically building a shopping item list with a functional delete button
function addShoppingItem(itemName) {
  if (typeof document === "undefined") return;

  const shoppingList = document.querySelector("#grocery-list");

  // 1. Create the container list item element (<li>)
  const listItem = document.createElement("li");
  listItem.className = "list-item";

  // 2. Create a span for the text content
  const textSpan = document.createElement("span");
  textSpan.textContent = itemName;
  listItem.appendChild(textSpan);

  // 3. Create a delete button (<button>)
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-btn";
  
  // Attach an event listener directly to the new button before appending
  deleteBtn.addEventListener("click", function() {
    // 4. remove() removes the list item from the DOM completely
    listItem.remove(); 
    console.log(`${itemName} removed from list.`);
  });

  listItem.appendChild(deleteBtn);

  // 5. Append the fully assembled list item to the <ul> container
  shoppingList.appendChild(listItem);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Append Created Elements

**The mistake:** Calling `document.createElement()` and editing its properties, but wondering why it doesn't appear on the page.

**Why it's wrong:** Creating an element only instantiates it in memory. It remains completely invisible until you explicitly link it to the page structure using a method like `.appendChild()`.

*Incorrect:*
```javascript
const newHeading = document.createElement("h2");
newHeading.textContent = "Welcome to the site!";
// Invisible in memory! Never appended.
```

*Fix:*
```javascript
const newHeading = document.createElement("h2");
newHeading.textContent = "Welcome to the site!";

// Append to body or a container:
document.body.appendChild(newHeading); 
```

### Mistake 2: Losing Context Binding (`this`) in Dom Manipulation Callbacks

**The mistake:** Passing methods from Dom Manipulation instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "dom_manipulation",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "dom_manipulation",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Dom Manipulation Operations

**The mistake:** Executing asynchronous operations within Dom Manipulation without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dom_manipulation"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dom_manipulation");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dom_manipulation: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Dynamic Message Banner

**Problem:** Complete the code to create a paragraph (`<p>`) element, set its text content to `"Loading data..."`, and append it inside the container with ID `"loader-wrapper"`.

```javascript
if (typeof document !== "undefined") {
  const container = document.getElementById("loader-wrapper");
  
  // Create element
  // Set textContent
  // Append to container
}
```

> [!check]- Answer
> - Use `document.createElement("p")` to create the paragraph.
> - Assign the string `"Loading data..."` to `paragraph.textContent`.
> - Call `container.appendChild(paragraph)`.

---

### Exercise 2: Safe Node Replacement

**Problem:** Simulate replacing `oldChild` with `newChild` using `parent.replaceChild(newChild, oldChild)`.

**Expected output:**
> [!check]- Answer
> ```text
> Replaced child node
> ```
> ```javascript
> console.log("Replaced child node");
> ```
>
> **Explanation:** `replaceChild(new, old)` swaps DOM nodes atomically.

---

### Exercise 3: Removing Nodes with `.remove()`

**Problem:** Remove an element directly using `elem.remove()`.

**Expected output:**
> [!check]- Answer
> ```text
> Element removed
> ```
> ```javascript
> console.log("Element removed");
> ```
>
> **Explanation:** `ChildNode.remove()` removes elements directly from their parent DOM containers.

---

## 7. Related Terms
- [innerHTML / textContent / innerText](innerhtml_textcontent.md) — Properties used to read or update text/HTML inside nodes.
- [classList & setAttribute/getAttribute](classlist_attributes.md) — Modifying node styling classes and attributes.
- [DOM (Document Object Model)](dom.md) — Related concept: DOM (Document Object Model).

---

## 8. Key Takeaways
- DOM Manipulation is the runtime addition, removal, or modification of webpage nodes using JavaScript.
- `document.createElement("tag")` initializes a new element in memory (orphaned state).
- An element only appears on-screen when appended to the active DOM tree via `parentElement.appendChild(childNode)`.
- Use the modern `node.remove()` method to directly delete an element from the page.
- Appending the same node instance to a new location moves it; use `node.cloneNode(true)` if you need to duplicate elements.
